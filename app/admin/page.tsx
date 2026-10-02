import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { allDayRows, memberRows, sumTotals } from "@/lib/stats";
import { EVENT_DATES, EVENT_NAME, inr, isEventDate, longDate, shortDate } from "@/lib/event";
import Shell from "@/components/Shell";
import StatCard from "@/components/StatCard";
import { DayTable, MemberTable } from "@/components/Tables";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: { searchParams: { date?: string } }) {
  const admin = await requireAdmin();
  const date = isEventDate(searchParams.date) ? searchParams.date : undefined;

  const [allRows, members, memberCount] = await Promise.all([
    allDayRows(),
    memberRows(date),
    prisma.user.count({ where: { role: "TEAM", active: true } }),
  ]);
  const rows = date ? allRows.filter((r) => r.date === date) : allRows;
  const t = sumTotals(rows);

  return (
    <Shell role="ADMIN" name={admin.name} active="/admin">
      <h1 className="mb-1 mt-1 font-display text-3xl text-night">Event Dashboard</h1>
      <p className="mb-4 text-ink/70">{EVENT_NAME} · {date ? longDate(date) : "All dates"}</p>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filter by date">
        <Link href="/admin" className={`chip shrink-0 ${!date ? "chip-on" : ""}`}>All Dates</Link>
        {EVENT_DATES.map((d) => (
          <Link key={d} href={`/admin?date=${d}`} className={`chip shrink-0 ${date === d ? "chip-on" : ""}`}>{shortDate(d)}</Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Total Passes Distributed" value={t.received} />
        <StatCard label="Total Passes Sold" value={t.sold} tone="pink" />
        <StatCard label="Total Passes Remaining" value={t.remaining} tone="teal" />
        <StatCard label="Total Sales Amount" value={inr(t.amount)} tone="gold" />
        <StatCard label="Total Team Members" value={memberCount} />
      </div>

      <h2 className="mb-2 mt-6 text-lg font-extrabold text-night">Date-wise report</h2>
      <DayTable rows={rows} totals={date ? undefined : t} />

      <h2 className="mb-2 mt-6 text-lg font-extrabold text-night">
        Team member sales{date ? ` — ${shortDate(date)}` : ""}
      </h2>
      <MemberTable rows={members} />
    </Shell>
  );
}
