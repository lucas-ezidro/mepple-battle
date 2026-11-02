import { NextRequest, NextResponse } from "next/server";
import { isSameOriginRequest, isSessionToken, SESSION_COOKIE } from "@/lib/auth-policy";

const publicPaths = new Set([
  "/", "/login", "/register", "/api/auth/login", "/api/auth/register",
  "/api/auth/session", "/api/auth/logout",
  "/api/auth/ludopedia/callback",
]);

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
      !isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem da requisição inválida" }, { status: 403 });
  }
  if (publicPaths.has(path)) return NextResponse.next();
  if (isSessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const url = new URL("/login", request.url);
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)"],
};
