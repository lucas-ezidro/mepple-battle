import { requireSocialUser, socialPosts, socialResponse } from "@/lib/social-server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return socialResponse("[GET /api/users/:id/ranks]", async (viewerId) => {
    const { id } = await params;
    await requireSocialUser(id);
    return socialPosts(viewerId, { userId: id }, new URL(request.url).searchParams.get("cursor"));
  });
}
