import { prisma } from "./db";
import { EVENT_DATES } from "./event";

export type DayRow = { date: string; received: number; sold: number; remaining: number; amount: number };
export type Totals = { received: number; sold: number; remaining: number; amount: number };

export function sumTotals(rows: { received: number; sold: number; amount: number }[]): Totals {
  const t = rows.reduce(
    (a, r) => ({ received: a.received + r.received, sold: a.sold + r.sold, amount: a.amount + r.amount }),
    { received: 0, sold: 0, amount: 0 },
  );
  return { ...t, remaining: t.received - t.sold };
}

/** One row per event date for one team member. */
export async function memberDayRows(userId: string): Promise<DayRow[]> {
  const [inv, sales] = await Promise.all([
    prisma.inventory.findMany({ where: { userId } }),
    prisma.sale.groupBy({ by: ["eventDate"], where: { userId }, _sum: { amount: true } }),
  ]);
  return EVENT_DATES.map((date) => {
    const i = inv.find((x) => x.eventDate === date);
    const s = sales.find((x) => x.eventDate === date);
    const received = i?.received ?? 0;
    const sold = i?.sold ?? 0;
    return { date, received, sold, remaining: received - sold, amount: s?._sum.amount ?? 0 };
  });
}

/** One row per event date across ALL team members (optionally for a single member). */
export async function allDayRows(): Promise<DayRow[]> {
  const [inv, sales] = await Promise.all([
    prisma.inventory.groupBy({ by: ["eventDate"], _sum: { received: true, sold: true } }),
    prisma.sale.groupBy({ by: ["eventDate"], _sum: { amount: true } }),
  ]);
  return EVENT_DATES.map((date) => {
    const i = inv.find((x) => x.eventDate === date);
    const s = sales.find((x) => x.eventDate === date);
    const received = i?._sum.received ?? 0;
    const sold = i?._sum.sold ?? 0;
    return { date, received, sold, remaining: received - sold, amount: s?._sum.amount ?? 0 };
  });
}

export type MemberRow = {
  id: string; name: string; username: string; mobile: string | null; active: boolean;
  received: number; sold: number; remaining: number; amount: number;
};

/** One row per team member (optionally limited to one event date). */
export async function memberRows(date?: string): Promise<MemberRow[]> {
  const where = date ? { eventDate: date } : {};
  const [members, inv, sales] = await Promise.all([
    prisma.user.findMany({ where: { role: "TEAM" }, orderBy: { name: "asc" } }),
    prisma.inventory.groupBy({ by: ["userId"], where, _sum: { received: true, sold: true } }),
    prisma.sale.groupBy({ by: ["userId"], where, _sum: { amount: true } }),
  ]);
  return members.map((m) => {
    const i = inv.find((x) => x.userId === m.id);
    const s = sales.find((x) => x.userId === m.id);
    const received = i?._sum.received ?? 0;
    const sold = i?._sum.sold ?? 0;
    return {
      id: m.id, name: m.name, username: m.username, mobile: m.mobile, active: m.active,
      received, sold, remaining: received - sold, amount: s?._sum.amount ?? 0,
    };
  });
}
