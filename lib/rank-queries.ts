import { prisma } from "@/lib/prisma";

export function getUserRanks(userId: string) {
  return prisma.rank.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { games: { orderBy: { position: "asc" } } },
  });
}
