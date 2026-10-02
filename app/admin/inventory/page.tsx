import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { allDayRows } from "@/lib/stats";
import { EVENT_DATES, longDate } from "@/lib/event";
import Shell from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const admin = await requireAdmin();
  const [rows, inv, members] = await Promise.all([
    allDayRows(),
    prisma.inventory.findMany({ where: { received: { gt: 0 } } }),
    prisma.user.findMany({ where: { role: "TEAM" }, select: { id: true, name: true } }),
  ]);
  const name = new Map(members.map((m) => [m.id, m.name]));

  return (
    <Shell role="ADMIN" name={admin.name} active="/admin/inventory">
      <h1 className="mb-4 font-display text-3xl text-night">Inventory</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {EVENT_DATES.map((d) => {
          const r = rows.find((x) => x.date === d)!;
          const who = inv.filter((i) => i.eventDate === d).sort((a, b) => (name.get(a.userId) ?? "").localeCompare(name.get(b.userId) ?? ""));
          const pct = r.received ? Math.round((r.sold / r.received) * 100) : 0;
          return (
            <section key={d} className="card">
              <h2 className="font-display text-2xl text-night">{longDate(d)}</h2>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div><div className="text-2xl font-extrabold tabular-nums">{r.received}</div><div className="text-xs font-bold text-ink/60">Total Distributed</div></div>
                <div><div className="text-2xl font-extrabold tabular-nums text-rani">{r.sold}</div><div className="text-xs font-bold text-ink/60">Total Sold</div></div>
                <div><div className="text-2xl font-extrabold tabular-nums text-peacock">{r.remaining}</div><div className="text-xs font-bold text-ink/60">Remaining</div></div>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-night/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% sold`}>
                <div className="h-full bg-rani" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-xs font-bold text-ink/60">{pct}% sold</div>
              {who.length > 0 && (
                <table className="tbl mt-3">
                  <thead><tr><th>Member</th><th className="num">Got</th><th className="num">Sold</th><th className="num">Left</th></tr></thead>
                  <tbody>
                    {who.map((i) => (
                      <tr key={i.id}><td className="font-bold">{name.get(i.userId)}</td><td className="num">{i.received}</td><td className="num">{i.sold}</td><td className="num font-bold text-peacock">{i.received - i.sold}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}
      </div>
    </Shell>
  );
}
