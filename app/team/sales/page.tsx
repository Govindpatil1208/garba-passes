import { requireTeam } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr, shortDate, timeIST } from "@/lib/event";
import Shell from "@/components/Shell";
import StatCard from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function MySales() {
  const user = await requireTeam();
  const sales = await prisma.sale.findMany({ where: { userId: user.id }, orderBy: { soldAt: "desc" } });
  const passes = sales.reduce((a, s) => a + s.quantity, 0);
  const amount = sales.reduce((a, s) => a + s.amount, 0);

  return (
    <Shell role="TEAM" name={user.name} active="/team/sales">
      <h1 className="mb-4 font-display text-3xl text-night">My Sales</h1>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Passes sold" value={passes} tone="pink" />
        <StatCard label="Amount" value={inr(amount)} tone="gold" />
      </div>
      <div className="card mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr><th>Event date</th><th className="num">Passes Sold</th><th className="num">Amount</th><th>Sold on</th></tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="font-bold">{shortDate(s.eventDate)}</td>
                  <td className="num">{s.quantity}</td>
                  <td className="num">{inr(s.amount)}</td>
                  <td>
                    {s.soldAt.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })}, {timeIST(s.soldAt)}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-ink/60">No sales yet. Go to Sell Pass to record your first sale.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink/60">Sales cannot be edited or deleted. If there is a mistake, call the admin.</p>
    </Shell>
  );
}
