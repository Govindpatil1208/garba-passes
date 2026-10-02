import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { allocatePasses, changeAllocation, revokeAllocation, sellPasses } from "../lib/inventory";
import { AppError } from "../lib/errors";

let pass = 0, fail = 0;
function ok(cond: boolean, name: string, extra = "") {
  if (cond) { pass++; console.log("  PASS ", name); } else { fail++; console.log("  FAIL ", name, extra); }
}
async function rejects(p: Promise<unknown>, contains: string, name: string) {
  try { await p; ok(false, name, "(did not throw)"); }
  catch (e) { ok(e instanceof AppError && e.message.includes(contains), name, `(got: ${(e as Error).message})`); }
}
let rid = 0;
const R = () => `test-${Date.now()}-${rid++}-xxxx`;

async function main() {
  const tag = Date.now().toString().slice(-6);
  const u = await prisma.user.create({ data: { name: "Tester " + tag, username: "t" + tag, passwordHash: await bcrypt.hash("x", 4), role: "TEAM" } });
  const D1 = "2026-10-11", D2 = "2026-10-12";
  const inv = async (d: string) => prisma.inventory.findUnique({ where: { userId_eventDate: { userId: u.id, eventDate: d } } });

  console.log("Allocation keeps dates separate");
  await allocatePasses({ userId: u.id, eventDate: D1, quantity: 10 });
  await allocatePasses({ userId: u.id, eventDate: D2, quantity: 10 });
  ok((await inv(D1))!.received === 10 && (await inv(D2))!.received === 10, "10 + 10 stay separate per date");
  await rejects(allocatePasses({ userId: u.id, eventDate: "2026-10-20", quantity: 5 }), "between 11 Oct and 19 Oct", "allocation outside event dates rejected");
  await rejects(allocatePasses({ userId: u.id, eventDate: D1, quantity: 0 }), "at least 1", "allocation of 0 rejected");

  console.log("Selling");
  let r = await sellPasses({ userId: u.id, eventDate: D1, quantity: 3, amount: 900, requestId: R() });
  ok(r.remaining === 7 && r.sale.quantity === 3 && r.sale.amount === 900, "sell 3 -> remaining 7");
  r = await sellPasses({ userId: u.id, eventDate: D1, quantity: 2, amount: 600, requestId: R() });
  ok(r.remaining === 5 && (await inv(D1))!.sold === 5, "sell 2 more -> sold 5, remaining 5");
  ok((await inv(D2))!.sold === 0, "other date untouched");
  ok(!!r.sale.soldAt && r.sale.userId === u.id && r.sale.memberName === u.name, "sale has timestamp + member id + name");

  console.log("Validation");
  await rejects(sellPasses({ userId: u.id, eventDate: D1, quantity: 6, amount: 100, requestId: R() }), "You only have 5 passes remaining for this date.", "selling 6 of 5 blocked with exact message");
  await rejects(sellPasses({ userId: u.id, eventDate: D1, quantity: -1, amount: 100, requestId: R() }), "at least 1", "negative passes blocked");
  await rejects(sellPasses({ userId: u.id, eventDate: D1, quantity: 1, amount: -5, requestId: R() }), "negative", "negative amount blocked");
  await rejects(sellPasses({ userId: u.id, eventDate: "2026-10-10", quantity: 1, amount: 1, requestId: R() }), "between 11 Oct and 19 Oct", "date before event blocked");
  await rejects(sellPasses({ userId: u.id, eventDate: "2026-10-20", quantity: 1, amount: 1, requestId: R() }), "between 11 Oct and 19 Oct", "date after event blocked");
  await rejects(sellPasses({ userId: u.id, eventDate: D1, quantity: 1.5, amount: 1, requestId: R() }), "whole number", "decimal passes blocked");
  await rejects(sellPasses({ userId: u.id, eventDate: "2026-10-15", quantity: 1, amount: 1, requestId: R() }), "0 passes remaining", "date with no allocation blocked");
  ok((await inv(D1))!.sold === 5, "failed attempts changed nothing");

  console.log("Duplicate protection");
  const same = R();
  const a = await sellPasses({ userId: u.id, eventDate: D2, quantity: 1, amount: 300, requestId: same });
  const b = await sellPasses({ userId: u.id, eventDate: D2, quantity: 1, amount: 300, requestId: same });
  ok(a.sale.id === b.sale.id && b.duplicate && (await inv(D2))!.sold === 1, "same request twice = one sale");
  const sim = R();
  const both = await Promise.all([1, 2, 3].map(() => sellPasses({ userId: u.id, eventDate: D2, quantity: 1, amount: 300, requestId: sim })));
  ok(new Set(both.map((x) => x.sale.id)).size === 1 && (await inv(D2))!.sold === 2, "3 simultaneous identical requests = one sale");

  console.log("Concurrency (no overselling)");
  const before = (await inv(D2))!; // received 10, sold 2 -> 8 left
  const results = await Promise.allSettled(Array.from({ length: 20 }, () => sellPasses({ userId: u.id, eventDate: D2, quantity: 1, amount: 300, requestId: R() })));
  const good = results.filter((x) => x.status === "fulfilled").length;
  const after = (await inv(D2))!;
  ok(good === before.received - before.sold, `20 parallel sales of 1 with 8 left -> exactly 8 succeed (got ${good})`);
  ok(after.sold === after.received && after.sold === 10, "sold == received == 10, never above");
  const salesCount = await prisma.sale.aggregate({ where: { userId: u.id, eventDate: D2 }, _sum: { quantity: true } });
  ok(salesCount._sum.quantity === after.sold, "sum of sale rows == inventory.sold");

  console.log("Edit / revoke allocations");
  const al = await prisma.allocation.findFirstOrThrow({ where: { userId: u.id, eventDate: D1 } });
  await rejects(changeAllocation(al.id, 4), "already sold", "cannot reduce below sold (5 sold, try 4)");
  await changeAllocation(al.id, 12);
  ok((await inv(D1))!.received === 12, "increase allocation 10 -> 12");
  await changeAllocation(al.id, 5);
  ok((await inv(D1))!.received === 5, "reduce to exactly sold (5) allowed");
  await rejects(revokeAllocation(al.id), "already sold", "cannot revoke when passes already sold");
  const extra = await allocatePasses({ userId: u.id, eventDate: "2026-10-13", quantity: 4 });
  await revokeAllocation(extra.id);
  ok((await inv("2026-10-13"))!.received === 0, "revoke unsold allocation -> received back to 0");
  await rejects(revokeAllocation(extra.id), "already revoked", "double revoke blocked");

  console.log("DB-level safety net");
  let dbBlocked = false;
  try { await prisma.$executeRaw`UPDATE "Inventory" SET "sold" = "received" + 1 WHERE "userId" = ${u.id} AND "eventDate" = ${D1}`; } catch { dbBlocked = true; }
  ok(dbBlocked, "database CHECK constraint refuses sold > received");

  // cleanup
  await prisma.sale.deleteMany({ where: { userId: u.id } });
  await prisma.allocation.deleteMany({ where: { userId: u.id } });
  await prisma.inventory.deleteMany({ where: { userId: u.id } });
  await prisma.user.delete({ where: { id: u.id } });

  console.log(`\n${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
