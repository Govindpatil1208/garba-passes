import { requireTeam } from "@/lib/auth";
import { memberDayRows } from "@/lib/stats";
import { inr, longDate } from "@/lib/event";
import Shell from "@/components/Shell";
import SellButton from "@/components/SellModal";

export const dynamic = "force-dynamic";

export default async function MyPasses() {
  const user = await requireTeam();
  const rows = await memberDayRows(user.id);
  const dates = rows.map((r) => ({ date: r.date, remaining: r.remaining }));

  return (
    <Shell role="TEAM" name={user.name} active="/team/passes">
      <h1 className="mb-4 font-display text-3xl text-night">My Passes</h1>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.date} className="card flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-lg font-extrabold text-night">{longDate(r.date)}</div>
              <div className="text-sm text-ink/70">Received {r.received} · Sold {r.sold} · Sales {inr(r.amount)}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold tabular-nums text-peacock">{r.remaining}</div>
              <div className="text-xs font-bold text-ink/60">left</div>
            </div>
            <SellButton date={r.date} dates={dates} disabled={r.remaining < 1} />
          </div>
        ))}
      </div>
    </Shell>
  );
}
