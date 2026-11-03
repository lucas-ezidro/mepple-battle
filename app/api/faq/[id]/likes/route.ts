import { prisma } from "@/lib/prisma";
import { requireSocialFaqQuestion, socialResponse } from "@/lib/social-server";

async function like(params: Promise<{ id: string }>, liked: boolean) {
  return socialResponse("[/api/faq/:id/likes]", async (userId) => {
    const { id: faqQuestionId } = await params;
    await requireSocialFaqQuestion(faqQuestionId);
    if (liked) {
      await prisma.faqQuestionLike.createMany({ data: [{ userId, faqQuestionId }], skipDuplicates: true });
    } else {
      await prisma.faqQuestionLike.deleteMany({ where: { userId, faqQuestionId } });
    }
    return { liked, count: await prisma.faqQuestionLike.count({ where: { faqQuestionId } }) };
  });
}
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, true);
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return like(params, false);
}
