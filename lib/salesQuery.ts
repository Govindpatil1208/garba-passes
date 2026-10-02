import type { Prisma } from "./generated/prisma/client";
import { EVENT_DATES } from "./event";

export type SalesParams = { date?: string; member?: string; from?: string; to?: string; q?: string };

export function salesWhere(p: SalesParams): Prisma.SaleWhereInput {
  const where: Prisma.SaleWhereInput = {};
  if (p.date && EVENT_DATES.includes(p.date)) where.eventDate = p.date;
  else if ((p.from && EVENT_DATES.includes(p.from)) || (p.to && EVENT_DATES.includes(p.to))) {
    where.eventDate = {
      ...(p.from && EVENT_DATES.includes(p.from) ? { gte: p.from } : {}),
      ...(p.to && EVENT_DATES.includes(p.to) ? { lte: p.to } : {}),
    };
  }
  if (p.member) where.userId = p.member;
  const q = (p.q ?? "").trim().replace(/^s-?/i, "");
  if (p.q && p.q.trim()) {
    const or: Prisma.SaleWhereInput[] = [{ memberName: { contains: p.q.trim(), mode: "insensitive" } }];
    if (/^\d{1,9}$/.test(q)) or.push({ saleNo: parseInt(q, 10) });
    where.AND = [{ OR: or }];
  }
  return where;
}

export const saleId = (n: number) => "S-" + String(n).padStart(5, "0");
