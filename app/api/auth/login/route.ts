import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/auth-schema";
import { isSameOriginRequest, isSessionToken, SESSION_COOKIE } from "@/lib/auth-policy";
import { checkAuthRateLimit } from "@/lib/auth-rate-limit";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { logProfileError } from "@/lib/profile-errors";
import { hashSessionToken, newSession, writeSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem da requisição inválida" }, { status: 403 });
  }
  try {
    const body: unknown = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Informe um e-mail e uma senha válidos" }, { status: 400 });
    }
    const { email, password } = parsed.data;
    const limit = await checkAuthRateLimit("login", email);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    }
    const credential = await prisma.credential.findUnique({ where: { email } });
    const valid = await verifyPassword(password, credential?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!credential || !valid) {
      return NextResponse.json({ error: "E-mail ou senha inválidos" }, { status: 401 });
    }
    const oldToken = (await cookies()).get(SESSION_COOKIE)?.value;
    const session = newSession();
    await prisma.$transaction([
      prisma.session.deleteMany({
        where: {
          OR: [
            { expiresAt: { lte: new Date() } },
            ...(isSessionToken(oldToken) ? [{ tokenHash: hashSessionToken(oldToken) }] : []),
          ],
        },
      }),
      prisma.session.create({
        data: { tokenHash: session.tokenHash, userId: credential.userId, expiresAt: session.expiresAt },
      }),
    ]);
    await writeSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    logProfileError("[POST /api/auth/login] Falha ao entrar", error);
    return NextResponse.json({ error: "Não foi possível entrar" }, { status: 500 });
  }
}
