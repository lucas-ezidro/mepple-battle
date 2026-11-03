import { prisma } from "@/lib/prisma";
import { requireSocialFaqComment, socialResponse } from "@/lib/social-server";

async function like(params: Promise<{ id: string }>, liked: boolean) {
  return socialResponse("[/api/faq-comments/:id/likes]", async (userId) => {
    const { id: commentId } = await params;
    await requireSocialFaqComment(commentId);
    if (liked) {
      await prisma.faqQuestionCommentLike.createMany({ data: [{ userId, commentId }], skipDuplicates: true });
    } else {
      await prisma.faqQuestionCommentLike.deleteMany({ where: { userId, commentId } });
    }
    return { liked, count: await prisma.faqQuestionCommentLike.count({ where: { commentId } }) };
  });
}
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, true);
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, false);
}
