"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"TEAM" | "ADMIN">("TEAM");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password, as: mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.replace(data.redirect);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid grid-cols-2 gap-2" role="tablist">
        {(["TEAM", "ADMIN"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`btn btn-sm ${mode === m ? "bg-night text-white" : "bg-mist text-night"}`}
          >
            {m === "TEAM" ? "Team Login" : "Admin Login"}
          </button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="login">{mode === "ADMIN" ? "Admin username" : "Username or mobile number"}</label>
        <input id="login" className="input" autoComplete="username" inputMode={mode === "ADMIN" ? "text" : "text"} autoCapitalize="none"
          value={login} onChange={(e) => setLogin(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="pw">Password</label>
        <input id="pw" type="password" className="input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <div className="err" role="alert">{error}</div>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "LOGIN"}</button>
    </form>
  );
}
