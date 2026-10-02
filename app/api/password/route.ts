import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, checkPassword, hashPassword } from "@/lib/auth";
import { body, fail, unauthorized } from "@/lib/api";
import { AppError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const user = await apiUser();
    if (!user) return unauthorized();
    const b = await body(req);
    const current = String(b.current ?? "");
    const next = String(b.next ?? "");
    if (!(await checkPassword(current, user.passwordHash))) throw new AppError("Current password is wrong.");
    if (next.length < 6) throw new AppError("New password must be at least 6 characters.");
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
