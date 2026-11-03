import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { TierListDTO, TierListUpdateInput } from "@/lib/tier-list-schema";

export class TierListEmptyError extends Error {}

const DEFAULT_COLUMN_LABELS = ["S", "A", "B", "C", "D"];
const POOL_POSITION = -1;

const tierListInclude = {
  columns: {
    orderBy: { position: "asc" },
    include: { games: { orderBy: { position: "asc" } } },
  },
} satisfies Prisma.TierListInclude;

type TierListWithColumns = Prisma.TierListGetPayload<{ include: typeof tierListInclude }>;

function toDTO(tierList: TierListWithColumns): TierListDTO {
  const pool = tierList.columns.find((column) => column.kind === "pool")?.games ?? [];
  const columns = tierList.columns
    .filter((column) => column.kind !== "pool")
    .map((column) => ({
      id: column.id,
      label: column.label,
      games: column.games.map((game) => ({ gameId: game.gameId, name: game.name, thumb: game.thumb })),
    }));

  return {
    pool: pool.map((game) => ({ gameId: game.gameId, name: game.name, thumb: game.thumb })),
    columns,
  };
}

export async function getOrCreateUserTierList(userId: string): Promise<TierListDTO> {
  const existing = await prisma.tierList.findUnique({ where: { userId }, include: tierListInclude });
  if (existing) return toDTO(existing);

  const created = await prisma.tierList.create({
    data: {
      userId,
      columns: {
        create: [
          { kind: "pool", label: "Não alocados", position: POOL_POSITION },
          ...DEFAULT_COLUMN_LABELS.map((label, index) => ({ kind: "tier", label, position: index })),
        ],
      },
    },
    include: tierListInclude,
  });

  return toDTO(created);
}

export async function saveUserTierList(userId: string, input: TierListUpdateInput): Promise<TierListDTO> {
  const tierList = await prisma.tierList.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const saved = await prisma.$transaction(async (tx) => {
    await tx.tierListColumn.deleteMany({ where: { tierListId: tierList.id } });

    await tx.tierListColumn.create({
      data: {
        tierListId: tierList.id,
        kind: "pool",
        label: "Não alocados",
        position: POOL_POSITION,
        games: {
          create: input.pool.map((game, index) => ({
            position: index,
            gameId: game.gameId,
            name: game.name,
            thumb: game.thumb,
          })),
        },
      },
    });

    for (const [index, column] of input.columns.entries()) {
      await tx.tierListColumn.create({
        data: {
          tierListId: tierList.id,
          kind: "tier",
          label: column.label,
          position: index,
          games: {
            create: column.games.map((game, gameIndex) => ({
              position: gameIndex,
              gameId: game.gameId,
              name: game.name,
              thumb: game.thumb,
            })),
          },
        },
      });
    }

    return tx.tierList.findUniqueOrThrow({ where: { id: tierList.id }, include: tierListInclude });
  });

  return toDTO(saved);
}

export async function publishTierListPost(userId: string): Promise<{ id: string }> {
  const { columns } = await getOrCreateUserTierList(userId);
  const hasGames = columns.some((column) => column.games.length > 0);
  if (!hasGames) throw new TierListEmptyError();

  return prisma.tierListPost.create({
    data: {
      userId,
      columns: columns.map((column) => ({ label: column.label, games: column.games })) as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
}
