import { requireAdmin } from "@/lib/auth";
import { CONTACT_PHONE, CONTACT_WHATSAPP, EVENT_DATES, EVENT_NAME, EVENT_SUBTITLE, longDate } from "@/lib/event";
import Shell from "@/components/Shell";
import PasswordForm from "@/components/PasswordForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  return (
    <Shell role="ADMIN" name={admin.name} active="/admin/settings">
      <h1 className="mb-4 font-display text-3xl text-night">Settings</h1>
      <div className="card mb-4 space-y-1">
        <div className="text-sm font-bold text-ink/60">Event</div>
        <div className="text-lg font-extrabold">{EVENT_NAME} — {EVENT_SUBTITLE}</div>
        <div className="pt-2 text-sm font-bold text-ink/60">Dates</div>
        <div className="font-bold">{longDate(EVENT_DATES[0])} to {longDate(EVENT_DATES[EVENT_DATES.length - 1])} 2026</div>
        <div className="pt-2 text-sm font-bold text-ink/60">Call / WhatsApp</div>
        <div className="font-bold">{CONTACT_PHONE} / {CONTACT_WHATSAPP}</div>
        <p className="pt-2 text-xs text-ink/60">To change event dates or contact numbers, edit <code>lib/event.ts</code>.</p>
      </div>
      <div className="card mb-4 space-y-1">
        <div className="text-sm font-bold text-ink/60">Logged in as</div>
        <div className="text-lg font-extrabold">{admin.name} ({admin.username})</div>
      </div>
      <PasswordForm />
    </Shell>
  );
}
