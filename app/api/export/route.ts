import { apiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { allDayRows, memberRows, sumTotals } from "@/lib/stats";
import { EVENT_NAME, shortDate, dayTimeIST } from "@/lib/event";
import { salesWhere, saleId } from "@/lib/salesQuery";

function file(name: string, rows: (string | number)[][]) {
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: Request) {
  if (!(await apiUser("ADMIN"))) return new Response("Please log in as admin.", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type");

  if (type === "overall") {
    const t = sumTotals(await allDayRows());
    return file("overall-report", [
      [EVENT_NAME + " - Overall Report"],
      ["Total Passes Distributed", t.received],
      ["Total Passes Sold", t.sold],
      ["Total Passes Remaining", t.remaining],
      ["Total Amount Collected (Rs)", t.amount],
    ]);
  }
  if (type === "datewise") {
    const rows = await allDayRows();
    return file("date-wise-report", [
      ["Date", "Distributed", "Sold", "Remaining", "Sales Amount (Rs)"],
      ...rows.map((r) => [shortDate(r.date), r.received, r.sold, r.remaining, r.amount]),
    ]);
  }
  if (type === "members") {
    const rows = await memberRows();
    return file("team-member-report", [
      ["Team Member", "Username", "Mobile", "Received", "Sold", "Remaining", "Amount (Rs)"],
      ...rows.map((r) => [r.name, r.username, r.mobile ?? "", r.received, r.sold, r.remaining, r.amount]),
    ]);
  }
  if (type === "sales") {
    const sales = await prisma.sale.findMany({
      where: salesWhere({
        date: sp.get("date") ?? undefined, member: sp.get("member") ?? undefined,
        from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined, q: sp.get("q") ?? undefined,
      }),
      orderBy: { soldAt: "desc" },
    });
    return file("all-sales", [
      ["Sale ID", "Team Member", "Event Date", "Passes Sold", "Amount (Rs)", "Sale Time (IST)"],
      ...sales.map((s) => [saleId(s.saleNo), s.memberName, shortDate(s.eventDate), s.quantity, s.amount, dayTimeIST(s.soldAt)]),
    ]);
  }
  return new Response("Unknown report type.", { status: 400 });
}
