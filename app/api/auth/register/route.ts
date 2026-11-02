import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { registerSchema } from "@/lib/auth-schema";
import { isSameOriginRequest } from "@/lib/auth-policy";
import { checkAuthRateLimit } from "@/lib/auth-rate-limit";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { logProfileError } from "@/lib/profile-errors";
import { newSession, writeSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem da requisição inválida" }, { status: 403 });
  }
  try {
    const body: unknown = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Confira os dados do cadastro" }, { status: 400 });
    }
    const { email, password, fullName } = parsed.data;
    const limit = await checkAuthRateLimit("register", email);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    }
    const passwordHash = await hashPassword(password);
    const session = newSession();
    await prisma.user.create({
      data: {
        email,
        fullName,
        credential: { create: { email, passwordHash } },
        sessions: { create: { tokenHash: session.tokenHash, expiresAt: session.expiresAt } },
      },
    });
    await writeSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma conta com este e-mail" }, { status: 409 });
    }
    logProfileError("[POST /api/auth/register] Falha ao criar conta", error);
    return NextResponse.json({ error: "Não foi possível criar a conta" }, { status: 500 });
  }
}
