import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkPassword, startSession } from "@/lib/auth";
import { body, fail } from "@/lib/api";

// very small in-memory limiter: 8 wrong tries / 10 min per username+IP
const tries = new Map<string, { n: number; t: number }>();

export async function POST(req: Request) {
  try {
    const b = await body(req);
    const login = String(b.login ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");
    if (!login || !password) return NextResponse.json({ error: "Enter username/mobile and password." }, { status: 400 });

    const key = login + "|" + (req.headers.get("x-forwarded-for") ?? "");
    const rec = tries.get(key);
    const fresh = rec && Date.now() - rec.t < 600000;
    if (rec && fresh && rec.n >= 8)
      return NextResponse.json({ error: "Too many wrong attempts. Try again after 10 minutes." }, { status: 429 });

    const user = await prisma.user.findFirst({ where: { OR: [{ username: login }, { mobile: login }] } });
    const good = user && user.active && (await checkPassword(password, user.passwordHash));
    if (!good || !user) {
      tries.set(key, { n: rec && fresh ? rec.n + 1 : 1, t: rec && fresh ? rec.t : Date.now() });
      return NextResponse.json({ error: "Wrong username/mobile or password." }, { status: 401 });
    }
    const as = String(b.as ?? "");
    if (as === "ADMIN" && user.role !== "ADMIN")
      return NextResponse.json({ error: "This is not an admin account. Use Team Login." }, { status: 403 });
    if (as === "TEAM" && user.role === "ADMIN")
      return NextResponse.json({ error: "This is an admin account. Use Admin Login." }, { status: 403 });
    tries.delete(key);
    await startSession(user.id, user.role);
    return NextResponse.json({ ok: true, redirect: user.role === "ADMIN" ? "/admin" : "/team" });
  } catch (e) {
    return fail(e);
  }
}
