import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { memberDayRows, sumTotals } from "@/lib/stats";
import { dayTimeIST, inr, longDate, shortDate } from "@/lib/event";
import { saleId } from "@/lib/salesQuery";
import Shell from "@/components/Shell";
import StatCard from "@/components/StatCard";
import AllocationTable from "@/components/AllocationTable";
import { MemberActions } from "@/components/AdminForms";

export const dynamic = "force-dynamic";

export default async function MemberDetail({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const member = await prisma.user.findUnique({ where: { id: params.id } });
  if (!member || member.role !== "TEAM") notFound();
  const [rows, sales] = await Promise.all([
    memberDayRows(member.id),
    prisma.sale.findMany({ where: { userId: member.id }, orderBy: { soldAt: "desc" } }),
  ]);
  const t = sumTotals(rows);

  return (
    <Shell role="ADMIN" name={admin.name} active="/admin/team">
      <Link href="/admin/team" className="text-sm font-bold text-rani">← All team members</Link>
      <h1 className="mb-1 mt-2 font-display text-3xl text-night">{member.name}</h1>
      <p className="mb-4 text-ink/70">Username: {member.username}{member.mobile ? ` · Mobile: ${member.mobile}` : ""}{member.active ? "" : " · INACTIVE"}</p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Received" value={t.received} />
        <StatCard label="Total Sold" value={t.sold} tone="pink" />
        <StatCard label="Total Remaining" value={t.remaining} tone="teal" />
        <StatCard label="Total Amount" value={inr(t.amount)} tone="gold" />
      </div>

      <h2 className="mb-2 mt-6 text-lg font-extrabold text-night">Date-wise</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.date} className="card">
            <div className="font-extrabold text-night">{longDate(r.date)}</div>
            <div className="mt-1 text-[15px]">Received <b>{r.received}</b> · Sold <b>{r.sold}</b> · Remaining <b className="text-peacock">{r.remaining}</b></div>
            <div className="text-sm text-ink/60">Amount {inr(r.amount)}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-2 mt-6 text-lg font-extrabold text-night">Passes given (edit / revoke)</h2>
      <AllocationTable userId={member.id} showMember={false} limit={100} />

      <h2 className="mb-2 mt-6 text-lg font-extrabold text-night">Complete sales history</h2>
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Sale ID</th><th>Event date</th><th className="num">Passes</th><th className="num">Amount</th><th>Sale time</th></tr></thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}><td>{saleId(s.saleNo)}</td><td className="font-bold">{shortDate(s.eventDate)}</td><td className="num">{s.quantity}</td><td className="num">{inr(s.amount)}</td><td>{dayTimeIST(s.soldAt)}</td></tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-ink/60">No sales yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6"><MemberActions id={member.id} name={member.name} active={member.active} /></div>
    </Shell>
  );
}
