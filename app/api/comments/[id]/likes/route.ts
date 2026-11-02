import { prisma } from "@/lib/prisma";
import { requireSocialComment, socialResponse } from "@/lib/social-server";

async function like(params: Promise<{ id: string }>, liked: boolean) {
  return socialResponse("[/api/comments/:id/likes]", async (userId) => {
    const { id: commentId } = await params;
    await requireSocialComment(commentId);
    if (liked) {
      await prisma.commentLike.createMany({ data: [{ userId, commentId }], skipDuplicates: true });
    } else {
      await prisma.commentLike.deleteMany({ where: { userId, commentId } });
    }
    return { liked, count: await prisma.commentLike.count({ where: { commentId } }) };
  });
}
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, true);
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, false);
}
