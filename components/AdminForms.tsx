"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT_DATES, longDate, shortDate } from "@/lib/event";

async function send(method: string, url: string, data: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const j = await res.json().catch(() => ({}));
  return { ok: res.ok, error: (j.error as string) || "Something went wrong." };
}

export function MemberForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", mobile: "", username: "", password: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await send("POST", "/api/admin/members", f);
    setBusy(false);
    if (r.ok) { setMsg({ ok: true, text: `${f.name} added. Share the login details with them.` }); setF({ name: "", mobile: "", username: "", password: "" }); router.refresh(); }
    else setMsg({ ok: false, text: r.error });
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="text-lg font-extrabold text-night">Add team member</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="m-name">Name</label><input id="m-name" className="input" value={f.name} onChange={set("name")} required /></div>
        <div><label className="label" htmlFor="m-mob">Mobile number</label><input id="m-mob" className="input" inputMode="numeric" maxLength={10} value={f.mobile} onChange={set("mobile")} placeholder="10 digits" /></div>
        <div><label className="label" htmlFor="m-user">Username (optional if mobile given)</label><input id="m-user" className="input" autoCapitalize="none" value={f.username} onChange={set("username")} /></div>
        <div><label className="label" htmlFor="m-pw">Password (6+ characters)</label><input id="m-pw" className="input" value={f.password} onChange={set("password")} required minLength={6} /></div>
      </div>
      {msg && <div className={msg.ok ? "okmsg" : "err"} role="alert">{msg.text}</div>}
      <button className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? "Adding…" : "ADD TEAM MEMBER"}</button>
    </form>
  );
}

export function MemberActions({ id, name, active }: { id: string; name: string; active: boolean }) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function patch(data: Record<string, unknown>, okText: string) {
    const r = await send("PATCH", "/api/admin/members", { id, ...data });
    setMsg(r.ok ? { ok: true, text: okText } : { ok: false, text: r.error });
    if (r.ok) { setPw(""); router.refresh(); }
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-extrabold text-night">Account</h2>
      <div className="flex gap-2">
        <input className="input" placeholder="New password (6+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="New password" />
        <button className="btn-dark shrink-0" disabled={pw.length < 6} onClick={() => patch({ password: pw }, "Password reset.")}>Reset</button>
      </div>
      <button
        className={active ? "btn-ghost w-full" : "btn-primary w-full"}
        onClick={() => {
          if (active && !confirm(`Deactivate ${name}? They will not be able to log in or sell. Their sales and passes stay on record.`)) return;
          patch({ active: !active }, active ? "Deactivated." : "Activated.");
        }}
      >
        {active ? "Deactivate this member" : "Activate this member"}
      </button>
      {msg && <div className={msg.ok ? "okmsg" : "err"} role="alert">{msg.text}</div>}
    </div>
  );
}

export function AllocateForm({ members, defaultMember }: { members: { id: string; name: string }[]; defaultMember?: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState(defaultMember ?? members[0]?.id ?? "");
  const [eventDate, setEventDate] = useState(EVENT_DATES[0]);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await send("POST", "/api/admin/allocate", { userId, eventDate, quantity: Number(quantity), note });
    setBusy(false);
    if (r.ok) {
      const who = members.find((m) => m.id === userId)?.name;
      setMsg({ ok: true, text: `${quantity} passes for ${shortDate(eventDate)} given to ${who}.` });
      setQuantity(""); setNote(""); router.refresh();
    } else setMsg({ ok: false, text: r.error });
  }

  if (members.length === 0) return <div className="card">Add a team member first (Team Members page).</div>;

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div>
        <label className="label" htmlFor="a-m">Team Member</label>
        <select id="a-m" className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="a-d">Date</label>
        <select id="a-d" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)}>
          {EVENT_DATES.map((d) => <option key={d} value={d}>{longDate(d)} 2026</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="a-q">Number of Passes</label>
        <input id="a-q" className="input" type="number" inputMode="numeric" min={1} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="e.g. 10" />
      </div>
      <div>
        <label className="label" htmlFor="a-n">Note (optional)</label>
        <input id="a-n" className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
      </div>
      {msg && <div className={msg.ok ? "okmsg" : "err"} role="alert">{msg.text}</div>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "ALLOCATE PASSES"}</button>
    </form>
  );
}

export function AllocationActions({ id, quantity }: { id: string; quantity: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState(String(quantity));
  const [err, setErr] = useState("");

  async function save() {
    setErr("");
    const r = await send("PATCH", "/api/admin/allocate", { id, quantity: Number(q) });
    if (r.ok) { setEditing(false); router.refresh(); } else setErr(r.error);
  }
  async function revoke() {
    if (!confirm("Revoke this allocation? These passes will be taken back from the team member.")) return;
    setErr("");
    const r = await send("DELETE", "/api/admin/allocate", { id });
    if (r.ok) router.refresh(); else setErr(r.error);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {editing ? (
        <div className="flex items-center gap-2">
          <input className="input !min-h-[40px] !w-20 !px-2 text-center" type="number" min={1} value={q} onChange={(e) => setQ(e.target.value)} aria-label="New quantity" />
          <button className="btn-dark btn-sm" onClick={save}>Save</button>
          <button className="btn-ghost btn-sm" onClick={() => { setEditing(false); setErr(""); }}>×</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button className="btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn-ghost btn-sm !text-red-700" onClick={revoke}>Revoke</button>
        </div>
      )}
      {err && <div className="max-w-[260px] whitespace-normal text-right text-xs font-bold text-red-700">{err}</div>}
    </div>
  );
}
