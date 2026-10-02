import { requireTeam } from "@/lib/auth";
import { memberDayRows, sumTotals } from "@/lib/stats";
import { inr, shortDate } from "@/lib/event";
import Shell from "@/components/Shell";
import StatCard from "@/components/StatCard";
import SellButton from "@/components/SellModal";

export const dynamic = "force-dynamic";

export default async function TeamDashboard() {
  const user = await requireTeam();
  const rows = await memberDayRows(user.id);
  const t = sumTotals(rows);
  const dates = rows.map((r) => ({ date: r.date, remaining: r.remaining }));

  return (
    <Shell role="TEAM" name={user.name} active="/team">
      <h1 className="mb-4 font-display text-3xl text-night">Welcome, {user.name}</h1>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Passes Received" value={t.received} />
        <StatCard label="Total Passes Sold" value={t.sold} tone="pink" />
        <StatCard label="Total Passes Remaining" value={t.remaining} tone="teal" />
        <StatCard label="Total Sales Amount" value={inr(t.amount)} tone="gold" />
      </div>

      <h2 className="mb-2 mt-6 text-lg font-extrabold text-night">Date-wise passes</h2>
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="tbl tbl-fit">
            <colgroup><col style={{ width: "20%" }} /><col style={{ width: "21%" }} /><col style={{ width: "14%" }} /><col style={{ width: "24%" }} /><col style={{ width: "21%" }} /></colgroup>
            <thead>
              <tr><th>Date</th><th className="num">Received</th><th className="num">Sold</th><th className="num">Remaining</th><th className="text-right">Sell</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date}>
                  <td className="font-bold">{shortDate(r.date)}</td>
                  <td className="num">{r.received}</td>
                  <td className="num">{r.sold}</td>
                  <td className="num font-extrabold text-peacock">{r.remaining}</td>
                  <td className="text-right"><SellButton date={r.date} dates={dates} disabled={r.remaining < 1} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {t.received === 0 && <p className="mt-3 text-sm text-ink/70">No passes allocated to you yet. Please contact the admin.</p>}
    </Shell>
  );
}
