import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSameOriginRequest, isSessionToken, SESSION_COOKIE } from "@/lib/auth-policy";
import { prisma } from "@/lib/prisma";
import { logProfileError } from "@/lib/profile-errors";
import { clearLudopediaCookies, hashSessionToken } from "@/lib/session";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem da requisição inválida" }, { status: 403 });
  }
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (isSessionToken(token)) {
      await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
    }
    store.delete(SESSION_COOKIE);
    clearLudopediaCookies(store);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logProfileError("[POST /api/auth/logout] Falha ao sair", error);
    return NextResponse.json({ error: "Não foi possível sair" }, { status: 500 });
  }
}
