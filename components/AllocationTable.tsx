import { prisma } from "@/lib/db";
import { dayTimeIST, shortDate } from "@/lib/event";
import { AllocationActions } from "./AdminForms";

export default async function AllocationTable({ userId, limit = 50, showMember = true }: { userId?: string; limit?: number; showMember?: boolean }) {
  const list = await prisma.allocation.findMany({
    where: userId ? { userId } : {},
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>{showMember && <th>Member</th>}<th>Date</th><th className="num">Passes</th><th>Given on</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className={a.revoked ? "opacity-50" : ""}>
                {showMember && <td className="font-bold">{a.user.name}</td>}
                <td>{shortDate(a.eventDate)}</td>
                <td className="num font-bold">{a.quantity}</td>
                <td>{dayTimeIST(a.createdAt)}{a.note ? <span className="ml-2 text-xs text-ink/60">({a.note})</span> : null}</td>
                <td>{a.revoked ? "Revoked" : "Active"}</td>
                <td className="text-right">{a.revoked ? null : <AllocationActions id={a.id} quantity={a.quantity} />}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-ink/60">No allocations yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
