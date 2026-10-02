"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="rounded-lg px-3 py-2 text-sm font-bold text-white/90 ring-1 ring-white/30 hover:bg-white/10"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
      }}
    >
      Logout
    </button>
  );
}
