"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { inr, longDate, passWord, shortDate } from "@/lib/event";

export type SellDate = { date: string; remaining: number };

function newRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "r-" + Date.now() + "-" + Math.random().toString(36).slice(2, 12);
}

/**
 * The whole sell journey: enter -> confirm -> success.
 * If `fixedDate` is given the date is locked (SELL button on a row);
 * otherwise a date picker is shown (Sell Pass page).
 */
export default function SellFlow({
  dates, fixedDate, onClose,
}: { dates: SellDate[]; fixedDate?: string; onClose?: () => void }) {
  const router = useRouter();
  const firstWithStock = dates.find((d) => d.remaining > 0)?.date ?? dates[0]?.date ?? "";
  const [date, setDate] = useState(fixedDate ?? firstWithStock);
  const [qty, setQty] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState(newRequestId);
  const [result, setResult] = useState<{ remaining: number; quantity: number; amount: number; saleNo: number } | null>(null);

  const remaining = useMemo(() => dates.find((d) => d.date === date)?.remaining ?? 0, [dates, date]);
  const q = Number(qty);
  const a = Number(amount);

  function review(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!qty || !Number.isInteger(q) || q < 1) return setError("Enter how many passes you sold (1 or more).");
    if (amount === "" || !Number.isInteger(a) || a < 0) return setError("Enter the amount collected in rupees (0 or more).");
    if (q > remaining) return setError(`You only have ${passWord(remaining)} remaining for this date.`);
    setStep("confirm");
  }

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventDate: date, quantity: q, amount: a, requestId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not record the sale.");
        setStep("form");
        setRequestId(newRequestId());
        router.refresh();
        return;
      }
      setResult({ remaining: data.remaining, quantity: data.sale.quantity, amount: data.sale.amount, saleNo: data.sale.saleNo });
      setStep("done");
      router.refresh();
    } catch {
      // Network problem: keep the SAME requestId so retrying can never create a double sale.
      setError("No internet. Check your connection and tap CONFIRM SALE again (it will not be counted twice).");
    } finally {
      setBusy(false);
    }
  }

  function again() {
    setQty(""); setAmount(""); setError(""); setStep("form"); setRequestId(newRequestId()); setResult(null);
  }

  if (step === "done" && result) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl" aria-hidden>✅</div>
        <h2 className="text-xl font-extrabold text-night">Sale recorded successfully.</h2>
        <div className="rounded-xl bg-mist p-4 text-left">
          <div className="flex justify-between"><span>Date</span><b>{longDate(date)}</b></div>
          <div className="flex justify-between"><span>Passes sold</span><b>{result.quantity}</b></div>
          <div className="flex justify-between"><span>Amount</span><b>{inr(result.amount)}</b></div>
          <div className="mt-2 flex justify-between border-t border-night/10 pt-2 text-lg"><span>Remaining for {shortDate(date)}</span><b className="text-rani">{result.remaining}</b></div>
        </div>
        <div className="grid gap-2">
          {onClose ? (
            <button className="btn-primary" onClick={onClose}>DONE</button>
          ) : (
            <button className="btn-primary" onClick={again}>SELL MORE</button>
          )}
          {onClose && <button className="btn-ghost" onClick={again}>SELL MORE FOR THIS DATE</button>}
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-night">Confirm Sale</h2>
        <div className="rounded-xl bg-mist p-4 text-lg">
          <div className="flex justify-between"><span>Date</span><b>{longDate(date)}</b></div>
          <div className="flex justify-between"><span>Passes</span><b>{q}</b></div>
          <div className="flex justify-between"><span>Amount</span><b>{inr(a)}</b></div>
        </div>
        {error && <div className="err" role="alert">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={() => setStep("form")} disabled={busy}>CANCEL</button>
          <button className="btn-primary" onClick={confirm} disabled={busy}>{busy ? "Saving…" : "CONFIRM SALE"}</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={review} className="space-y-4">
      <div>
        <label className="label" htmlFor="sf-date">Date</label>
        {fixedDate ? (
          <div className="input flex items-center bg-mist font-bold">{longDate(fixedDate)} 2026</div>
        ) : (
          <select id="sf-date" className="input" value={date} onChange={(e) => setDate(e.target.value)}>
            {dates.map((d) => (
              <option key={d.date} value={d.date}>{longDate(d.date)} — {d.remaining} left</option>
            ))}
          </select>
        )}
        <div className="mt-1 text-sm font-bold text-peacock">{passWord(remaining)} remaining for this date</div>
      </div>
      <div>
        <label className="label" htmlFor="sf-qty">Number of Passes Sold</label>
        <input id="sf-qty" className="input" type="number" inputMode="numeric" min={1} step={1} placeholder="e.g. 3"
          value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="sf-amt">Amount collected (₹)</label>
        <input id="sf-amt" className="input" type="number" inputMode="numeric" min={0} step={1} placeholder="e.g. 900"
          value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      {error && <div className="err" role="alert">{error}</div>}
      <div className={onClose ? "grid grid-cols-2 gap-3" : ""}>
        {onClose && <button type="button" className="btn-ghost" onClick={onClose}>CANCEL</button>}
        <button className="btn-primary w-full" disabled={remaining < 1}>{remaining < 1 ? "NO PASSES LEFT" : "REVIEW SALE"}</button>
      </div>
    </form>
  );
}
