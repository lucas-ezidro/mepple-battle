import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { getUserRanks } from "@/lib/rank-queries";
import { unstable_rethrow } from "next/navigation";

interface RankGameInput {
  id_jogo: number;
  nm_jogo: string;
  thumb: string;
}

interface RankBody {
  type: "100" | "10" | "5" | "3";
  year?: number;
  theme?: string;
  games: RankGameInput[];
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const ranks = await getUserRanks(userId);

    return NextResponse.json(ranks);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    console.error("[GET /api/ranks] Falha ao buscar os tops", error);
    return NextResponse.json({ error: "Falha ao buscar os tops" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body: RankBody = await request.json();

    if (body.type === "100") {
      const existingTop100 = await prisma.rank.findFirst({ where: { userId, type: "100" } });
      if (existingTop100) {
        return NextResponse.json({ error: "Já existe um Top 100 criado" }, { status: 409 });
      }
    }

    const rank = await prisma.rank.create({
      data: {
        userId,
        type: body.type,
        year: body.year,
        theme: body.theme,
        games: {
          create: body.games.map((game, index) => ({
            position: index,
            gameId: game.id_jogo,
            name: game.nm_jogo,
            thumb: game.thumb,
          })),
        },
      },
      include: { games: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(rank, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    console.error("[POST /api/ranks] Falha ao criar o top", error);
    return NextResponse.json({ error: "Falha ao criar o top" }, { status: 500 });
  }
}
