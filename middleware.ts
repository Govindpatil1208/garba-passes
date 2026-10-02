import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// First gate: only lets logged-in people reach /admin and /team.
// Every page and API also re-checks the role against the database.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("bgm_session")?.value;
  const path = req.nextUrl.pathname;
  let role: string | null = null;
  if (token && process.env.SESSION_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET));
      role = String(payload.role);
    } catch {}
  }
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (path.startsWith("/admin") && role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/team";
    return NextResponse.redirect(url);
  }
  if (path.startsWith("/team") && role !== "TEAM") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/team/:path*"] };
