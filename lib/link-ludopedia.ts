import { prisma } from "@/lib/prisma";

export class LudopediaLinkError extends Error {
  constructor(public readonly code: "account_in_use" | "already_linked" | "top_conflict") {
    super(code);
  }
}

export async function linkLudopediaAccount(
  userId: string,
  identity: { id_usuario: number; nome?: string }
) {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.ludopediaUserId !== null && user.ludopediaUserId !== identity.id_usuario) {
      throw new LudopediaLinkError("already_linked");
    }
    const previous = await tx.user.findUnique({
      where: { ludopediaUserId: identity.id_usuario },
      include: { credential: { select: { userId: true } } },
    });
    if (previous && previous.id !== userId) {
      if (previous.credential) throw new LudopediaLinkError("account_in_use");
      const top100s = await tx.rank.count({
        where: { userId: { in: [userId, previous.id] }, type: "100" },
      });
      if (top100s > 1) throw new LudopediaLinkError("top_conflict");

      await tx.rank.updateMany({ where: { userId: previous.id }, data: { userId } });
      await tx.comment.updateMany({ where: { userId: previous.id }, data: { userId } });
      const [rankLikes, commentLikes] = await Promise.all([
        tx.rankLike.findMany({ where: { userId: previous.id }, select: { rankId: true } }),
        tx.commentLike.findMany({ where: { userId: previous.id }, select: { commentId: true } }),
      ]);
      if (rankLikes.length) await tx.rankLike.createMany({
        data: rankLikes.map(({ rankId }) => ({ rankId, userId })), skipDuplicates: true,
      });
      if (commentLikes.length) await tx.commentLike.createMany({
        data: commentLikes.map(({ commentId }) => ({ commentId, userId })), skipDuplicates: true,
      });
      const follows = await tx.follow.findMany({
        where: { OR: [{ followerId: previous.id }, { followingId: previous.id }] },
      });
      const transferred = follows.map((follow) => ({
        followerId: follow.followerId === previous.id ? userId : follow.followerId,
        followingId: follow.followingId === previous.id ? userId : follow.followingId,
        createdAt: follow.createdAt,
      })).filter((follow) => follow.followerId !== follow.followingId);
      if (transferred.length) await tx.follow.createMany({ data: transferred, skipDuplicates: true });

      // Only a verified Ludopedia identity can reclaim a pre-local-auth account.
      await tx.user.delete({ where: { id: previous.id } });
    }
    await tx.user.update({
      where: { id: userId },
      data: {
        ludopediaUserId: identity.id_usuario,
        name: identity.nome,
        username: user.username ?? previous?.username,
        avatarUrl: user.avatarUrl ?? previous?.avatarUrl,
      },
    });
  }, { isolationLevel: "Serializable" });
}
