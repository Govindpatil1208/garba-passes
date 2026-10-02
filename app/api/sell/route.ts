import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth";
import { body, fail, unauthorized } from "@/lib/api";
import { sellPasses } from "@/lib/inventory";

export async function POST(req: Request) {
  try {
    const user = await apiUser("TEAM"); // only team members sell, and only for themselves
    if (!user) return unauthorized();
    const b = await body(req);
    const r = await sellPasses({
      userId: user.id,
      eventDate: b.eventDate,
      quantity: b.quantity,
      amount: b.amount,
      requestId: b.requestId,
    });
    return NextResponse.json({
      ok: true,
      duplicate: r.duplicate,
      remaining: r.remaining,
      sale: { saleNo: r.sale.saleNo, eventDate: r.sale.eventDate, quantity: r.sale.quantity, amount: r.sale.amount },
    });
  } catch (e) {
    return fail(e);
  }
}
