import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { logProfileError } from "@/lib/profile-errors";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { _count: { select: { followers: true, following: true } } },
    });

    return NextResponse.json(user._count, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    logProfileError("[GET /api/profile/follow-counts] Falha ao buscar contagens", error);
    return NextResponse.json({ error: "Falha ao buscar seguidores" }, { status: 500 });
  }
}
