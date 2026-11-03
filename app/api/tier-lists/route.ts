import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { logProfileError } from "@/lib/profile-errors";
import { tierListUpdateSchema } from "@/lib/tier-list-schema";
import { getOrCreateUserTierList, saveUserTierList } from "@/lib/tier-list-queries";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const tierList = await getOrCreateUserTierList(userId);

    return NextResponse.json(tierList, { headers: privateHeaders });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    logProfileError("[GET /api/tier-lists] Falha ao buscar o tier list", error);
    return NextResponse.json({ error: "Falha ao buscar o tier list" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
      }
      throw error;
    }

    const result = tierListUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Dados do tier list inválidos" }, { status: 400 });
    }

    const tierList = await saveUserTierList(userId, result.data);
    return NextResponse.json(tierList, { headers: privateHeaders });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    logProfileError("[PUT /api/tier-lists] Falha ao salvar o tier list", error);
    return NextResponse.json({ error: "Falha ao salvar o tier list" }, { status: 500 });
  }
}
