import { requireAdmin } from "@/lib/auth";
import { memberRows } from "@/lib/stats";
import Shell from "@/components/Shell";
import { MemberTable } from "@/components/Tables";
import { MemberForm } from "@/components/AdminForms";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const admin = await requireAdmin();
  const rows = await memberRows();
  return (
    <Shell role="ADMIN" name={admin.name} active="/admin/team">
      <h1 className="mb-4 font-display text-3xl text-night">Team Members</h1>
      <MemberTable rows={rows} />
      <p className="mt-2 text-sm text-ink/60">Tap a name to see the full report.</p>
      <div className="mt-6"><MemberForm /></div>
    </Shell>
  );
}
