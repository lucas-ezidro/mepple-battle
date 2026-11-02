import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { logProfileError } from "@/lib/profile-errors";
import {
  decodeSocialCursor, encodeSocialCursor, SOCIAL_PAGE_SIZE, socialCursorWhere,
  type SocialPage, type SocialPost, type SocialComment,
} from "@/lib/social-schema";

export class SocialError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

export async function socialResponse(
  context: string, run: (viewerId: string) => Promise<unknown>, status = 200
) {
  try {
    return NextResponse.json(await run(await getCurrentUserId()), {
      status, headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    if (error instanceof SocialError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Dados inválidos. Confira sua solicitação." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "invalid_cursor") {
      return NextResponse.json({ error: "Cursor de paginação inválido" }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2025", "P2003"].includes(error.code)) {
      return NextResponse.json({ error: "Conteúdo não encontrado" }, { status: 404 });
    }
    logProfileError(context, error);
    return NextResponse.json({ error: "Não foi possível concluir a solicitação. Tente novamente." }, { status: 500 });
  }
}

export const socialUserFields = {
  id: true, username: true, fullName: true, avatarUrl: true,
} as const;

export async function requireSocialUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) throw new SocialError("Usuário não encontrado", 404);
}
export async function requireSocialRank(id: string) {
  if (!await prisma.rank.findUnique({ where: { id }, select: { id: true } })) {
    throw new SocialError("Top não encontrado", 404);
  }
}
export async function requireSocialComment(id: string, rankId?: string) {
  if (!await prisma.comment.findFirst({ where: { id, ...(rankId ? { rankId } : {}) }, select: { id: true } })) {
    throw new SocialError("Comentário não encontrado", 404);
  }
}

export async function socialProfile(id: string, viewerId: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...socialUserFields,
      followers: { where: { followerId: viewerId }, select: { followerId: true }, take: 1 },
      _count: { select: { followers: true, following: true, ranks: true } },
    },
  });
  if (!user) throw new SocialError("Usuário não encontrado", 404);
  return {
    id: user.id, username: user.username, fullName: user.fullName, avatarUrl: user.avatarUrl,
    isSelf: id === viewerId, isFollowing: user.followers.length > 0,
    followers: user._count.followers, following: user._count.following, tops: user._count.ranks,
  };
}

export async function socialPosts(
  viewerId: string, where: Prisma.RankWhereInput, rawCursor: string | null
): Promise<SocialPage<SocialPost>> {
  const cursor = decodeSocialCursor(rawCursor);
  const rows = await prisma.rank.findMany({
    where: { AND: [where, socialCursorWhere(cursor)] },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: SOCIAL_PAGE_SIZE + 1,
    select: {
      id: true, type: true, year: true, theme: true, createdAt: true,
      user: { select: socialUserFields },
      games: { orderBy: { position: "asc" }, select: { gameId: true, name: true, thumb: true } },
      likes: { where: { userId: viewerId }, select: { userId: true }, take: 1 },
      _count: { select: { likes: true, comments: true } },
    },
  });
  const page = rows.slice(0, SOCIAL_PAGE_SIZE);
  return {
    items: page.map((row) => ({
      id: row.id, type: row.type, year: row.year, theme: row.theme,
      createdAt: row.createdAt.toISOString(), author: row.user, games: row.games,
      likes: { liked: row.likes.length > 0, count: row._count.likes }, commentCount: row._count.comments,
    })),
    nextCursor: rows.length > SOCIAL_PAGE_SIZE ? encodeSocialCursor(page[page.length - 1]) : null,
  };
}

export async function socialComments(
  viewerId: string, rankId: string, parentId: string | null, rawCursor: string | null
): Promise<SocialPage<SocialComment>> {
  const cursor = decodeSocialCursor(rawCursor);
  const rows = await prisma.comment.findMany({
    where: { rankId, parentId, ...socialCursorWhere(cursor) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: SOCIAL_PAGE_SIZE + 1,
    select: {
      id: true, body: true, createdAt: true, user: { select: socialUserFields },
      likes: { where: { userId: viewerId }, select: { userId: true }, take: 1 },
      _count: { select: { likes: true, replies: true } },
    },
  });
  const page = rows.slice(0, SOCIAL_PAGE_SIZE);
  return {
    items: page.map((row) => ({
      id: row.id, body: row.body, createdAt: row.createdAt.toISOString(), author: row.user,
      likes: { liked: row.likes.length > 0, count: row._count.likes }, replyCount: row._count.replies,
    })),
    nextCursor: rows.length > SOCIAL_PAGE_SIZE ? encodeSocialCursor(page[page.length - 1]) : null,
  };
}
