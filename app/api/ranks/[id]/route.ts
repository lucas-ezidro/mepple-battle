import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const body: RankBody = await request.json();

    const existing = await prisma.rank.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Top não encontrado" }, { status: 404 });
    }

    if (body.type === "100") {
      const otherTop100 = await prisma.rank.findFirst({
        where: { userId, type: "100", NOT: { id } },
      });
      if (otherTop100) {
        return NextResponse.json({ error: "Já existe um Top 100 criado" }, { status: 409 });
      }
    }

    const rank = await prisma.$transaction(async (tx) => {
      await tx.rankGame.deleteMany({ where: { rankId: id } });
      return tx.rank.update({
        where: { id },
        data: {
          type: body.type,
          year: body.year ?? null,
          theme: body.theme ?? null,
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
    });

    return NextResponse.json(rank);
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    console.error("[PUT /api/ranks/:id] Falha ao atualizar o top", error);
    return NextResponse.json({ error: "Falha ao atualizar o top" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;

    const existing = await prisma.rank.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Top não encontrado" }, { status: 404 });
    }

    await prisma.rank.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    console.error("[DELETE /api/ranks/:id] Falha ao remover o top", error);
    return NextResponse.json({ error: "Falha ao remover o top" }, { status: 500 });
  }
}
