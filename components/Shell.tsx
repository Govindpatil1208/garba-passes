import Link from "next/link";
import Logo from "./Logo";
import LogoutButton from "./LogoutButton";
import ContactButtons from "./ContactButtons";
import { EVENT_NAME, EVENT_SUBTITLE } from "@/lib/event";

const ADMIN_NAV = [
  ["/admin", "Dashboard"],
  ["/admin/team", "Team Members"],
  ["/admin/allocate", "Allocate Passes"],
  ["/admin/sales", "Sales"],
  ["/admin/inventory", "Inventory"],
  ["/admin/reports", "Reports"],
  ["/admin/settings", "Settings"],
] as const;

const TEAM_NAV = [
  ["/team", "Dashboard", "🏠"],
  ["/team/passes", "My Passes", "🎟️"],
  ["/team/sell", "Sell Pass", "💰"],
  ["/team/sales", "My Sales", "🧾"],
  ["/team/profile", "Profile", "👤"],
] as const;

export default function Shell({
  role, active, children,
}: { role: "ADMIN" | "TEAM"; name?: string; active: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <header className="bg-night text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Logo size={44} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate font-display text-xl">{EVENT_NAME}</div>
            <div className="truncate text-xs text-white/70">{EVENT_SUBTITLE}{role === "ADMIN" ? " · Admin" : ""}</div>
          </div>
          <LogoutButton />
        </div>
        <div className="toran" aria-hidden />
        {role === "ADMIN" && (
          <nav className="bg-white shadow-sm" aria-label="Admin menu">
            <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-3 py-2">
              {ADMIN_NAV.map(([href, label]) => (
                <Link key={href} href={href} className={`chip shrink-0 ${active === href ? "chip-on" : ""}`}>{label}</Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-5">
        {children}
        <div className="mt-8">
          <div className="mb-2 text-sm font-bold text-ink/60">Need help? Contact 9340457015</div>
          <ContactButtons />
        </div>
      </main>

      {role === "TEAM" && (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-night/10 bg-white/95 backdrop-blur" aria-label="Menu">
          <div className="mx-auto grid max-w-5xl grid-cols-5">
            {TEAM_NAV.map(([href, label, icon]) => (
              <Link
                key={href}
                href={href}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[12px] font-bold ${active === href ? "text-rani" : "text-night/70"}`}
              >
                <span className="text-xl leading-none" aria-hidden>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
