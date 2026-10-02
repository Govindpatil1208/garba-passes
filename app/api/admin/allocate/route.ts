import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth";
import { body, fail, unauthorized } from "@/lib/api";
import { allocatePasses, changeAllocation, revokeAllocation } from "@/lib/inventory";

export async function POST(req: Request) {
  try {
    if (!(await apiUser("ADMIN"))) return unauthorized();
    const b = await body(req);
    const a = await allocatePasses({ userId: b.userId, eventDate: b.eventDate, quantity: b.quantity, note: b.note });
    return NextResponse.json({ ok: true, id: a.id });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  try {
    if (!(await apiUser("ADMIN"))) return unauthorized();
    const b = await body(req);
    await changeAllocation(String(b.id ?? ""), b.quantity);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await apiUser("ADMIN"))) return unauthorized();
    const b = await body(req);
    await revokeAllocation(String(b.id ?? ""));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
