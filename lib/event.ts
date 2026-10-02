export const EVENT_NAME = "Bhuana Garba Mahotsav";
export const EVENT_SUBTITLE = "Pass Management System";
export const CONTACT_PHONE = "9340457015";
export const CONTACT_WHATSAPP = "9340457015";

// Event runs 11 Oct 2026 to 19 Oct 2026
export const EVENT_DATES: string[] = [
  "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15",
  "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isEventDate(d: unknown): d is string {
  return typeof d === "string" && EVENT_DATES.includes(d);
}

/** "2026-10-11" -> "11 Oct" */
export function shortDate(d: string): string {
  const [, m, day] = d.split("-");
  return `${parseInt(day, 10)} ${MONTHS[parseInt(m, 10) - 1]}`;
}

/** "2026-10-11" -> "11 October" */
export function longDate(d: string): string {
  const [, m, day] = d.split("-");
  const full = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${parseInt(day, 10)} ${full[parseInt(m, 10) - 1]}`;
}

export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function timeIST(d: Date): string {
  return d
    .toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true })
    .toUpperCase();
}

export function dayTimeIST(d: Date): string {
  const day = d.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });
  return `${day}, ${timeIST(d)}`;
}

export function passWord(n: number): string {
  return n === 1 ? "1 pass" : `${n} passes`;
}
