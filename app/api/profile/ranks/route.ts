import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { logProfileError } from "@/lib/profile-errors";
import { getUserRanks } from "@/lib/rank-queries";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const ranks = await getUserRanks(userId);

    return NextResponse.json(ranks, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    logProfileError("[GET /api/profile/ranks] Falha ao buscar os tops", error);
    return NextResponse.json({ error: "Falha ao buscar os tops" }, { status: 500 });
  }
}
