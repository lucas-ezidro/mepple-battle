import { prisma } from "@/lib/prisma";
import { commentInputSchema } from "@/lib/social-schema";
import { requireSocialComment, requireSocialRank, socialComments, socialResponse } from "@/lib/social-server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return socialResponse("[GET /api/ranks/:id/comments]", async (viewerId) => {
    const { id } = await params;
    const query = new URL(request.url).searchParams;
    const parentId = query.get("parentId");
    await requireSocialRank(id);
    if (parentId !== null) await requireSocialComment(parentId, id);
    return socialComments(viewerId, id, parentId, query.get("cursor"));
  });
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return socialResponse("[POST /api/ranks/:id/comments]", async (userId) => {
    const { id: rankId } = await params;
    const { body, parentId } = commentInputSchema.parse(await request.json());
    await requireSocialRank(rankId);
    if (parentId) await requireSocialComment(parentId, rankId);
    const comment = await prisma.comment.create({ data: { rankId, userId, body, parentId }, select: { id: true } });
    return { ...comment, commentCount: await prisma.comment.count({ where: { rankId } }) };
  }, 201);
}
