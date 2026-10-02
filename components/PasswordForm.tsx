"use client";
import { useState } from "react";

export default function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) { setMsg({ ok: true, text: "Password changed." }); setCurrent(""); setNext(""); }
    else setMsg({ ok: false, text: data.error || "Could not change password." });
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="text-lg font-extrabold text-night">Change password</h2>
      <div>
        <label className="label" htmlFor="pw-cur">Current password</label>
        <input id="pw-cur" type="password" className="input" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="pw-new">New password (6+ characters)</label>
        <input id="pw-new" type="password" className="input" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} />
      </div>
      {msg && <div className={msg.ok ? "okmsg" : "err"} role="alert">{msg.text}</div>}
      <button className="btn-dark w-full" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
    </form>
  );
}
