import { prisma } from "@/lib/prisma";
import { commentInputSchema } from "@/lib/social-schema";
import {
  requireSocialTierListComment, requireSocialTierListPost, socialResponse, socialTierListComments,
} from "@/lib/social-server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return socialResponse("[GET /api/tier-list-posts/:id/comments]", async (viewerId) => {
    const { id } = await params;
    const query = new URL(request.url).searchParams;
    const parentId = query.get("parentId");
    await requireSocialTierListPost(id);
    if (parentId !== null) await requireSocialTierListComment(parentId, id);
    return socialTierListComments(viewerId, id, parentId, query.get("cursor"));
  });
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return socialResponse("[POST /api/tier-list-posts/:id/comments]", async (userId) => {
    const { id: tierListPostId } = await params;
    const { body, parentId } = commentInputSchema.parse(await request.json());
    await requireSocialTierListPost(tierListPostId);
    if (parentId) await requireSocialTierListComment(parentId, tierListPostId);
    const comment = await prisma.tierListPostComment.create({
      data: { tierListPostId, userId, body, parentId }, select: { id: true },
    });
    return { ...comment, commentCount: await prisma.tierListPostComment.count({ where: { tierListPostId } }) };
  }, 201);
}
