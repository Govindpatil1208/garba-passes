import { requireTeam } from "@/lib/auth";
import Shell from "@/components/Shell";
import PasswordForm from "@/components/PasswordForm";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const user = await requireTeam();
  return (
    <Shell role="TEAM" name={user.name} active="/team/profile">
      <h1 className="mb-4 font-display text-3xl text-night">Profile</h1>
      <div className="card mb-4 space-y-1">
        <div className="text-sm font-bold text-ink/60">Name</div>
        <div className="text-lg font-extrabold">{user.name}</div>
        <div className="pt-2 text-sm font-bold text-ink/60">Username</div>
        <div className="text-lg font-extrabold">{user.username}</div>
        {user.mobile && (<><div className="pt-2 text-sm font-bold text-ink/60">Mobile</div><div className="text-lg font-extrabold">{user.mobile}</div></>)}
      </div>
      <PasswordForm />
    </Shell>
  );
}
