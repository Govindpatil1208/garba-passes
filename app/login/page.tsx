import Logo from "@/components/Logo";
import ContactButtons from "@/components/ContactButtons";
import LoginForm from "./LoginForm";
import { EVENT_NAME, EVENT_SUBTITLE, CONTACT_PHONE } from "@/lib/event";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-night text-white">
        <div className="mx-auto flex max-w-md flex-col items-center px-6 pb-8 pt-10 text-center">
          <Logo size={84} />
          <h1 className="mt-4 font-display text-3xl leading-tight">{EVENT_NAME}</h1>
          <p className="mt-1 text-white/75">{EVENT_SUBTITLE}</p>
          <p className="mt-1 text-sm text-marigold">11 – 19 October 2026</p>
        </div>
        <div className="toran" aria-hidden />
      </div>
      <div className="mx-auto max-w-md px-4 py-6">
        <LoginForm />
        <div className="mt-8">
          <div className="mb-2 text-center text-sm font-bold text-ink/60">Help: {CONTACT_PHONE}</div>
          <ContactButtons />
        </div>
      </div>
    </div>
  );
}
