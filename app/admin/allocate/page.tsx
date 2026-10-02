import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Shell from "@/components/Shell";
import { AllocateForm } from "@/components/AdminForms";
import AllocationTable from "@/components/AllocationTable";

export const dynamic = "force-dynamic";

export default async function AllocatePage() {
  const admin = await requireAdmin();
  const members = await prisma.user.findMany({ where: { role: "TEAM", active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <Shell role="ADMIN" name={admin.name} active="/admin/allocate">
      <h1 className="mb-4 font-display text-3xl text-night">Allocate Passes</h1>
      <div className="mx-auto max-w-lg"><AllocateForm members={members} /></div>
      <h2 className="mb-2 mt-8 text-lg font-extrabold text-night">Recent allocations</h2>
      <AllocationTable limit={50} />
      <p className="mt-2 text-sm text-ink/60">Edit changes the number of passes. Revoke takes them back. Neither is allowed if it would go below passes already sold.</p>
    </Shell>
  );
}
