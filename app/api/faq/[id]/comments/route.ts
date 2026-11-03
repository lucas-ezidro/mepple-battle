import { prisma } from "@/lib/prisma";
import { commentInputSchema } from "@/lib/social-schema";
import {
  requireSocialFaqComment, requireSocialFaqQuestion, socialFaqComments, socialResponse,
} from "@/lib/social-server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return socialResponse("[GET /api/faq/:id/comments]", async (viewerId) => {
    const { id } = await params;
    const query = new URL(request.url).searchParams;
    const parentId = query.get("parentId");
    await requireSocialFaqQuestion(id);
    if (parentId !== null) await requireSocialFaqComment(parentId, id);
    return socialFaqComments(viewerId, id, parentId, query.get("cursor"));
  });
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return socialResponse("[POST /api/faq/:id/comments]", async (userId) => {
    const { id: faqQuestionId } = await params;
    const { body, parentId } = commentInputSchema.parse(await request.json());
    await requireSocialFaqQuestion(faqQuestionId);
    if (parentId) await requireSocialFaqComment(parentId, faqQuestionId);
    const comment = await prisma.faqQuestionComment.create({
      data: { faqQuestionId, userId, body, parentId }, select: { id: true },
    });
    return { ...comment, commentCount: await prisma.faqQuestionComment.count({ where: { faqQuestionId } }) };
  }, 201);
}
