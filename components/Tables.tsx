import Link from "next/link";
import { inr, shortDate } from "@/lib/event";
import type { DayRow, MemberRow, Totals } from "@/lib/stats";

const H = ({ short, full }: { short: string; full: string }) => (
  <>
    <span className="sm:hidden">{short}</span>
    <span className="hidden sm:inline">{full}</span>
  </>
);


export function DayTable({ rows, totals }: { rows: DayRow[]; totals?: Totals }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="tbl tbl-fit">
          <colgroup><col style={{ width: "19%" }} /><col style={{ width: "21%" }} /><col style={{ width: "15%" }} /><col style={{ width: "19%" }} /><col style={{ width: "26%" }} /></colgroup>
          <thead>
            <tr><th>Date</th><th className="num"><H short="Given" full="Distributed" /></th><th className="num">Sold</th><th className="num"><H short="Left" full="Remaining" /></th><th className="num"><H short="Amount" full="Sales Amount" /></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date}>
                <td className="font-bold">{shortDate(r.date)}</td>
                <td className="num">{r.received}</td>
                <td className="num">{r.sold}</td>
                <td className="num font-bold text-peacock">{r.remaining}</td>
                <td className="num">{inr(r.amount)}</td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="bg-night/5 font-extrabold">
                <td className="px-1.5 py-3 sm:px-3">Total</td>
                <td className="num px-1.5 py-3 sm:px-3">{totals.received}</td>
                <td className="num px-1.5 py-3 sm:px-3">{totals.sold}</td>
                <td className="num px-1.5 py-3 sm:px-3">{totals.remaining}</td>
                <td className="num px-1.5 py-3 sm:px-3">{inr(totals.amount)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export function MemberTable({ rows, link = true }: { rows: MemberRow[]; link?: boolean }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="tbl tbl-fit">
          <colgroup><col style={{ width: "27%" }} /><col style={{ width: "18%" }} /><col style={{ width: "15%" }} /><col style={{ width: "16%" }} /><col style={{ width: "24%" }} /></colgroup>
          <thead>
            <tr><th>Member</th><th className="num"><H short="Got" full="Total Received" /></th><th className="num">Sold</th><th className="num"><H short="Left" full="Remaining" /></th><th className="num">Amount</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-normal break-words font-bold">
                  {link ? <Link href={`/admin/team/${r.id}`} className="text-rani underline underline-offset-2">{r.name}</Link> : r.name}
                  {!r.active && <span className="ml-2 rounded bg-ink/10 px-1.5 py-0.5 text-xs">inactive</span>}
                </td>
                <td className="num">{r.received}</td>
                <td className="num">{r.sold}</td>
                <td className="num font-bold text-peacock">{r.remaining}</td>
                <td className="num">{inr(r.amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-ink/60">No team members yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
