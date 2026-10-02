import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiUser, hashPassword } from "@/lib/auth";
import { body, fail, unauthorized } from "@/lib/api";
import { AppError } from "@/lib/errors";

function cleanMobile(v: unknown) {
  const s = String(v ?? "").replace(/\D/g, "");
  if (!s) return null;
  if (s.length !== 10) throw new AppError("Mobile number must be 10 digits.");
  return s;
}

export async function POST(req: Request) {
  try {
    if (!(await apiUser("ADMIN"))) return unauthorized();
    const b = await body(req);
    const name = String(b.name ?? "").trim();
    const mobile = cleanMobile(b.mobile);
    let username = String(b.username ?? "").trim().toLowerCase().replace(/\s+/g, "");
    const password = String(b.password ?? "");
    if (!name) throw new AppError("Enter the team member's name.");
    if (!username) username = mobile ?? "";
    if (!username) throw new AppError("Enter a username or a mobile number.");
    if (password.length < 6) throw new AppError("Password must be at least 6 characters.");
    const clash = await prisma.user.findFirst({
      where: { OR: [{ username }, ...(mobile ? [{ mobile }, { username: mobile }] : [])] },
    });
    if (clash) throw new AppError("This username or mobile number is already used.");
    const u = await prisma.user.create({
      data: { name, username, mobile, passwordHash: await hashPassword(password), role: "TEAM" },
    });
    return NextResponse.json({ ok: true, id: u.id });
  } catch (e) {
    return fail(e);
  }
}

// Edit name/mobile, reset password, activate/deactivate
export async function PATCH(req: Request) {
  try {
    if (!(await apiUser("ADMIN"))) return unauthorized();
    const b = await body(req);
    const id = String(b.id ?? "");
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u || u.role !== "TEAM") throw new AppError("Team member not found.", 404);
    const data: Record<string, unknown> = {};
    if (typeof b.name === "string") {
      if (!b.name.trim()) throw new AppError("Name cannot be empty.");
      data.name = b.name.trim();
    }
    if ("mobile" in b) {
      const m = cleanMobile(b.mobile);
      if (m && m !== u.mobile && (await prisma.user.findFirst({ where: { mobile: m } })))
        throw new AppError("This mobile number is already used.");
      data.mobile = m;
    }
    if (typeof b.password === "string" && b.password) {
      if (b.password.length < 6) throw new AppError("Password must be at least 6 characters.");
      data.passwordHash = await hashPassword(b.password);
    }
    if (typeof b.active === "boolean") data.active = b.active;
    await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
