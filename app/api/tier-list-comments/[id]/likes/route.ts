import { prisma } from "@/lib/prisma";
import { requireSocialTierListComment, socialResponse } from "@/lib/social-server";

async function like(params: Promise<{ id: string }>, liked: boolean) {
  return socialResponse("[/api/tier-list-comments/:id/likes]", async (userId) => {
    const { id: commentId } = await params;
    await requireSocialTierListComment(commentId);
    if (liked) {
      await prisma.tierListPostCommentLike.createMany({ data: [{ userId, commentId }], skipDuplicates: true });
    } else {
      await prisma.tierListPostCommentLike.deleteMany({ where: { userId, commentId } });
    }
    return { liked, count: await prisma.tierListPostCommentLike.count({ where: { commentId } }) };
  });
}
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, true);
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, false);
}
