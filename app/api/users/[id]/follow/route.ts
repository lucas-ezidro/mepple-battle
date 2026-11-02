import { prisma } from "@/lib/prisma";
import { requireSocialUser, SocialError, socialProfile, socialResponse } from "@/lib/social-server";

async function follow(params: Promise<{ id: string }>, following: boolean) {
  return socialResponse("[/api/users/:id/follow]", async (viewerId) => {
    const { id } = await params;
    if (id === viewerId) throw new SocialError("Você não pode seguir a si mesmo");
    await requireSocialUser(id);
    if (following) {
      await prisma.follow.createMany({ data: [{ followerId: viewerId, followingId: id }], skipDuplicates: true });
    } else {
      await prisma.follow.deleteMany({ where: { followerId: viewerId, followingId: id } });
    }
    return socialProfile(id, viewerId);
  });
}
export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return follow(params, true);
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return follow(params, false);
}
