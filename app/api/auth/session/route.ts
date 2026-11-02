import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { logProfileError } from "@/lib/profile-errors";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    return NextResponse.json({ user: session.user }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    unstable_rethrow(error);
    logProfileError("[GET /api/auth/session] Falha ao consultar sessão", error);
    return NextResponse.json({ error: "Não foi possível consultar a sessão" }, { status: 500 });
  }
}
