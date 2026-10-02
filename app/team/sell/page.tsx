import { requireTeam } from "@/lib/auth";
import { memberDayRows } from "@/lib/stats";
import Shell from "@/components/Shell";
import SellFlow from "@/components/SellFlow";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  const user = await requireTeam();
  const rows = await memberDayRows(user.id);
  const dates = rows.map((r) => ({ date: r.date, remaining: r.remaining }));

  return (
    <Shell role="TEAM" name={user.name} active="/team/sell">
      <h1 className="mb-4 font-display text-3xl text-night">Sell Pass</h1>
      <div className="card">
        <SellFlow dates={dates} />
      </div>
    </Shell>
  );
}
