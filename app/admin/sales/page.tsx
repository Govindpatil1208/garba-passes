import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EVENT_DATES, dayTimeIST, inr, shortDate } from "@/lib/event";
import { saleId, salesWhere } from "@/lib/salesQuery";
import Shell from "@/components/Shell";

export const dynamic = "force-dynamic";
const PAGE = 50;

type SP = { date?: string; member?: string; from?: string; to?: string; q?: string; page?: string };

export default async function AdminSales({ searchParams }: { searchParams: SP }) {
  const admin = await requireAdmin();
  const where = salesWhere(searchParams);
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [members, total, agg, sales] = await Promise.all([
    prisma.user.findMany({ where: { role: "TEAM" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.sale.count({ where }),
    prisma.sale.aggregate({ where, _sum: { quantity: true, amount: true } }),
    prisma.sale.findMany({ where, orderBy: { soldAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...searchParams, ...extra })) if (v) p.set(k, v);
    return p.toString();
  };
  const exportQs = new URLSearchParams({ type: "sales" });
  for (const k of ["date", "member", "from", "to", "q"] as const) if (searchParams[k]) exportQs.set(k, searchParams[k]!);

  return (
    <Shell role="ADMIN" name={admin.name} active="/admin/sales">
      <h1 className="mb-4 font-display text-3xl text-night">All Sales</h1>

      <form method="get" className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label" htmlFor="f-q">Search (team member name or sale ID)</label>
          <input id="f-q" name="q" className="input" defaultValue={searchParams.q ?? ""} placeholder="e.g. Rahul or S-00012" />
        </div>
        <div>
          <label className="label" htmlFor="f-d">Event date</label>
          <select id="f-d" name="date" className="input" defaultValue={searchParams.date ?? ""}>
            <option value="">All dates</option>
            {EVENT_DATES.map((d) => <option key={d} value={d}>{shortDate(d)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-m">Team member</label>
          <select id="f-m" name="member" className="input" defaultValue={searchParams.member ?? ""}>
            <option value="">Everyone</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="f-f">Date range from</label>
            <select id="f-f" name="from" className="input" defaultValue={searchParams.from ?? ""}>
              <option value="">Start</option>{EVENT_DATES.map((d) => <option key={d} value={d}>{shortDate(d)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-t">to</label>
            <select id="f-t" name="to" className="input" defaultValue={searchParams.to ?? ""}>
              <option value="">End</option>{EVENT_DATES.map((d) => <option key={d} value={d}>{shortDate(d)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <button className="btn-primary flex-1">APPLY FILTERS</button>
          <Link href="/admin/sales" className="btn-ghost">Clear</Link>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="font-bold text-night">
          {total} sale{total === 1 ? "" : "s"} · {agg._sum.quantity ?? 0} passes · {inr(agg._sum.amount ?? 0)}
        </div>
        <a href={`/api/export?${exportQs.toString()}`} className="btn-ghost btn-sm">⬇ Download CSV</a>
      </div>

      <div className="card mt-3 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr><th>Sale ID</th><th>Team Member</th><th>Event Date</th><th className="num">Passes Sold</th><th className="num">Amount</th><th>Sale Time</th></tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{saleId(s.saleNo)}</td>
                  <td className="font-bold"><Link href={`/admin/team/${s.userId}`} className="text-rani underline underline-offset-2">{s.memberName}</Link></td>
                  <td>{shortDate(s.eventDate)}</td>
                  <td className="num">{s.quantity}</td>
                  <td className="num">{inr(s.amount)}</td>
                  <td>{dayTimeIST(s.soldAt)}</td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-ink/60">No sales match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          {page > 1 ? <Link className="btn-ghost btn-sm" href={`/admin/sales?${qs({ page: String(page - 1) })}`}>← Previous</Link> : <span />}
          <span className="text-sm font-bold">Page {page} of {pages}</span>
          {page < pages ? <Link className="btn-ghost btn-sm" href={`/admin/sales?${qs({ page: String(page + 1) })}`}>Next →</Link> : <span />}
        </div>
      )}
    </Shell>
  );
}
