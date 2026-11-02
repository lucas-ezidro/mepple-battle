import { prisma } from "@/lib/prisma";
import { requireSocialRank, socialResponse } from "@/lib/social-server";

async function like(params: Promise<{ id: string }>, liked: boolean) {
  return socialResponse("[/api/ranks/:id/likes]", async (userId) => {
    const { id: rankId } = await params;
    await requireSocialRank(rankId);
    if (liked) {
      await prisma.rankLike.createMany({ data: [{ userId, rankId }], skipDuplicates: true });
    } else {
      await prisma.rankLike.deleteMany({ where: { userId, rankId } });
    }
    return { liked, count: await prisma.rankLike.count({ where: { rankId } }) };
  });
}
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, true);
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, false);
}
