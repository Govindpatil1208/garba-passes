import { prisma } from "./db";
import { Prisma } from "./generated/prisma/client";
import { AppError } from "./errors";
import { isEventDate, passWord } from "./event";

const MAX_QTY = 100000;
const MAX_AMOUNT = 10000000;

function toInt(v: unknown): number | null {
  if (typeof v === "string" && v.trim() !== "") v = Number(v);
  if (typeof v !== "number" || !Number.isFinite(v) || !Number.isInteger(v)) return null;
  return v;
}

export type SellInput = {
  userId: string;
  eventDate: unknown;
  quantity: unknown;
  amount: unknown;
  requestId: unknown;
};

/**
 * Records a sale. Runs in ONE database transaction:
 *  1. conditional UPDATE  (sold = sold + qty  only if received - sold >= qty)
 *  2. INSERT sale
 * The UPDATE is atomic in PostgreSQL, so two simultaneous sales can never
 * take the same passes. requestId is unique, so a double tap can't create two sales.
 */
export async function sellPasses(input: SellInput) {
  const { userId } = input;
  if (!isEventDate(input.eventDate)) throw new AppError("Date must be between 11 Oct and 19 Oct 2026.");
  const eventDate = input.eventDate;
  const quantity = toInt(input.quantity);
  const amount = toInt(input.amount);
  if (quantity === null) throw new AppError("Enter the number of passes sold (whole number).");
  if (quantity < 1) throw new AppError("Passes sold must be at least 1.");
  if (quantity > MAX_QTY) throw new AppError("Passes sold is too large.");
  if (amount === null) throw new AppError("Enter the amount collected in rupees (whole number).");
  if (amount < 0) throw new AppError("Amount cannot be negative.");
  if (amount > MAX_AMOUNT) throw new AppError("Amount is too large.");
  if (typeof input.requestId !== "string" || input.requestId.length < 8 || input.requestId.length > 100)
    throw new AppError("Invalid request. Please refresh and try again.");
  const requestId = input.requestId;

  const readRemaining = async (tx: Prisma.TransactionClient) => {
    const inv = await tx.inventory.findUnique({ where: { userId_eventDate: { userId, eventDate } } });
    return inv ? inv.received - inv.sold : 0;
  };

  try {
    return await prisma.$transaction(async (tx) => {
      const dup = await tx.sale.findUnique({ where: { requestId } });
      if (dup) {
        if (dup.userId !== userId) throw new AppError("Invalid request.", 400);
        return { sale: dup, remaining: await readRemaining(tx), duplicate: true };
      }
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || !user.active || user.role !== "TEAM") throw new AppError("Your account cannot sell passes.", 403);

      const updated = await tx.$executeRaw`
        UPDATE "Inventory"
        SET "sold" = "sold" + ${quantity}, "updated_at" = NOW()
        WHERE "userId" = ${userId} AND "eventDate" = ${eventDate}
          AND ("received" - "sold") >= ${quantity}`;
      if (updated === 0) {
        const rem = await readRemaining(tx);
        throw new AppError(`You only have ${passWord(rem)} remaining for this date.`);
      }
      const sale = await tx.sale.create({
        data: { userId, memberName: user.name, eventDate, quantity, amount, requestId },
      });
      return { sale, remaining: await readRemaining(tx), duplicate: false };
    });
  } catch (e) {
    // Two identical requests at the very same moment: the second one hits the unique requestId.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const sale = await prisma.sale.findUnique({ where: { requestId } });
      if (sale && sale.userId === userId) {
        const inv = await prisma.inventory.findUnique({ where: { userId_eventDate: { userId, eventDate } } });
        return { sale, remaining: inv ? inv.received - inv.sold : 0, duplicate: true };
      }
    }
    throw e;
  }
}

export async function allocatePasses(input: { userId: unknown; eventDate: unknown; quantity: unknown; note?: unknown }) {
  if (typeof input.userId !== "string" || !input.userId) throw new AppError("Select a team member.");
  if (!isEventDate(input.eventDate)) throw new AppError("Date must be between 11 Oct and 19 Oct 2026.");
  const quantity = toInt(input.quantity);
  if (quantity === null || quantity < 1) throw new AppError("Enter at least 1 pass.");
  if (quantity > MAX_QTY) throw new AppError("Number of passes is too large.");
  const userId = input.userId;
  const eventDate = input.eventDate;
  const note = typeof input.note === "string" && input.note.trim() ? input.note.trim().slice(0, 200) : null;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "TEAM") throw new AppError("Team member not found.", 404);
    if (!user.active) throw new AppError("This team member is deactivated.");
    const allocation = await tx.allocation.create({ data: { userId, eventDate, quantity, note } });
    await tx.inventory.upsert({
      where: { userId_eventDate: { userId, eventDate } },
      create: { userId, eventDate, received: quantity },
      update: { received: { increment: quantity } },
    });
    return allocation;
  });
}

/** Moves inventory.received by `delta`, refusing to go below what was already sold. */
async function adjustReceived(tx: Prisma.TransactionClient, userId: string, eventDate: string, delta: number) {
  const n = await tx.$executeRaw`
    UPDATE "Inventory" SET "received" = "received" + ${delta}, "updated_at" = NOW()
    WHERE "userId" = ${userId} AND "eventDate" = ${eventDate}
      AND ("received" + ${delta}) >= "sold"`;
  if (n === 0) {
    const inv = await tx.inventory.findUnique({ where: { userId_eventDate: { userId, eventDate } } });
    const sold = inv?.sold ?? 0;
    throw new AppError(`Cannot reduce: ${passWord(sold)} already sold for this date. Total received can't go below ${sold}.`);
  }
}

export async function changeAllocation(allocationId: string, newQuantity: unknown) {
  const q = toInt(newQuantity);
  if (q === null || q < 1) throw new AppError("Enter at least 1 pass. To remove passes, use Revoke.");
  if (q > MAX_QTY) throw new AppError("Number of passes is too large.");
  return prisma.$transaction(async (tx) => {
    const a = await tx.allocation.findUnique({ where: { id: allocationId } });
    if (!a) throw new AppError("Allocation not found.", 404);
    if (a.revoked) throw new AppError("This allocation was already revoked.");
    const delta = q - a.quantity;
    if (delta !== 0) await adjustReceived(tx, a.userId, a.eventDate, delta);
    return tx.allocation.update({ where: { id: a.id }, data: { quantity: q } });
  });
}

export async function revokeAllocation(allocationId: string) {
  return prisma.$transaction(async (tx) => {
    const a = await tx.allocation.findUnique({ where: { id: allocationId } });
    if (!a) throw new AppError("Allocation not found.", 404);
    if (a.revoked) throw new AppError("This allocation was already revoked.");
    await adjustReceived(tx, a.userId, a.eventDate, -a.quantity);
    return tx.allocation.update({ where: { id: a.id }, data: { revoked: true } });
  });
}
