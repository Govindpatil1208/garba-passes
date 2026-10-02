"use client";
import { useEffect, useState } from "react";
import SellFlow, { type SellDate } from "./SellFlow";
import { shortDate } from "@/lib/event";

export default function SellButton({ date, dates, disabled }: { date: string; dates: SellDate[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <>
      <button className="btn-primary btn-sm !px-3" disabled={disabled} onClick={() => setOpen(true)} aria-label={`Sell passes for ${shortDate(date)}`}>
        SELL
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center" role="dialog" aria-modal="true" aria-label="Sell passes">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto whitespace-normal text-left rounded-t-3xl bg-white p-5 pb-8 sm:rounded-3xl">
            <h2 className="mb-4 font-display text-2xl text-night">Sell Passes</h2>
            <SellFlow dates={dates} fixedDate={date} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
