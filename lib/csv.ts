export function toCsv(rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@]/.test(s) && isNaN(Number(s))) s = "'" + s; // stop spreadsheet formula injection
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}
