import { requireAdmin } from "@/lib/auth";
import { allDayRows, memberRows, sumTotals } from "@/lib/stats";
import { inr } from "@/lib/event";
import Shell from "@/components/Shell";
import StatCard from "@/components/StatCard";
import { DayTable, MemberTable } from "@/components/Tables";

export const dynamic = "force-dynamic";

const dl = (type: string, label: string) => (
  <a href={`/api/export?type=${type}`} className="btn-ghost btn-sm">⬇ {label}</a>
);

export default async function ReportsPage() {
  const admin = await requireAdmin();
  const [days, members] = await Promise.all([allDayRows(), memberRows()]);
  const t = sumTotals(days);

  return (
    <Shell role="ADMIN" name={admin.name} active="/admin/reports">
      <h1 className="mb-1 font-display text-3xl text-night">Reports</h1>
      <p className="mb-4 text-sm text-ink/70">Downloads are CSV files — they open directly in Excel and Google Sheets.</p>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-night">Overall Report</h2>
        {dl("overall", "Download CSV")}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Passes Distributed" value={t.received} />
        <StatCard label="Total Passes Sold" value={t.sold} tone="pink" />
        <StatCard label="Total Passes Remaining" value={t.remaining} tone="teal" />
        <StatCard label="Total Amount Collected" value={inr(t.amount)} tone="gold" />
      </div>

      <div className="mb-2 mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-night">Date-wise Report</h2>
        {dl("datewise", "Download CSV")}
      </div>
      <DayTable rows={days} totals={t} />

      <div className="mb-2 mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-night">Team Member Report</h2>
        {dl("members", "Download CSV")}
      </div>
      <MemberTable rows={members} />

      <div className="mb-2 mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-night">Every sale</h2>
        {dl("sales", "Download all sales CSV")}
      </div>
    </Shell>
  );
}
