import { prisma } from "@/lib/prisma";
import { requireSocialTierListPost, socialResponse } from "@/lib/social-server";

async function like(params: Promise<{ id: string }>, liked: boolean) {
  return socialResponse("[/api/tier-list-posts/:id/likes]", async (userId) => {
    const { id: tierListPostId } = await params;
    await requireSocialTierListPost(tierListPostId);
    if (liked) {
      await prisma.tierListPostLike.createMany({ data: [{ userId, tierListPostId }], skipDuplicates: true });
    } else {
      await prisma.tierListPostLike.deleteMany({ where: { userId, tierListPostId } });
    }
    return { liked, count: await prisma.tierListPostLike.count({ where: { tierListPostId } }) };
  });
}
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, true);
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, false);
}
