import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { logProfileError } from "@/lib/profile-errors";
import { publishTierListPost, TierListEmptyError } from "@/lib/tier-list-queries";

export async function POST() {
  try {
    const userId = await getCurrentUserId();
    const post = await publishTierListPost(userId);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    if (error instanceof TierListEmptyError) {
      return NextResponse.json({ error: "Adicione jogos às colunas antes de publicar" }, { status: 400 });
    }
    logProfileError("[POST /api/tier-list-posts] Falha ao publicar o tier list", error);
    return NextResponse.json({ error: "Falha ao publicar o tier list" }, { status: 500 });
  }
}
