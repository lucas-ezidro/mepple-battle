import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { logProfileError } from "@/lib/profile-errors";
import { tierListPostColumnsSchema } from "@/lib/tier-list-schema";
import {
  decodeSocialCursor, encodeSocialCursor, socialFeedWhere, SOCIAL_PAGE_SIZE, socialCursorWhere,
  type SocialPage, type SocialPost, type SocialComment, type SocialFeedItem, type SocialTierListColumn,
  type SocialFaqQuestion,
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
export async function requireSocialTierListPost(id: string) {
  if (!await prisma.tierListPost.findUnique({ where: { id }, select: { id: true } })) {
    throw new SocialError("Tier list não encontrada", 404);
  }
}
export async function requireSocialTierListComment(id: string, tierListPostId?: string) {
  if (!await prisma.tierListPostComment.findFirst({
    where: { id, ...(tierListPostId ? { tierListPostId } : {}) }, select: { id: true },
  })) {
    throw new SocialError("Comentário não encontrado", 404);
  }
}
export async function requireSocialFaqQuestion(id: string) {
  if (!await prisma.faqQuestion.findUnique({ where: { id }, select: { id: true } })) {
    throw new SocialError("Dúvida não encontrada", 404);
  }
}
export async function requireSocialFaqComment(id: string, faqQuestionId?: string) {
  if (!await prisma.faqQuestionComment.findFirst({
    where: { id, ...(faqQuestionId ? { faqQuestionId } : {}) }, select: { id: true },
  })) {
    throw new SocialError("Comentário não encontrado", 404);
  }
}

function parseTierListPostColumns(value: unknown): SocialTierListColumn[] {
  const parsed = tierListPostColumnsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
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
      kind: "rank" as const, id: row.id, type: row.type, year: row.year, theme: row.theme,
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

export async function socialTierListComments(
  viewerId: string, tierListPostId: string, parentId: string | null, rawCursor: string | null
): Promise<SocialPage<SocialComment>> {
  const cursor = decodeSocialCursor(rawCursor);
  const rows = await prisma.tierListPostComment.findMany({
    where: { tierListPostId, parentId, ...socialCursorWhere(cursor) },
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

interface FeedCandidate { id: string; createdAt: Date; item: SocialFeedItem }

async function rankFeedCandidates(viewerId: string, cursor: ReturnType<typeof decodeSocialCursor>, take: number) {
  const rows = await prisma.rank.findMany({
    where: { AND: [socialFeedWhere(viewerId), socialCursorWhere(cursor)] },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take,
    select: {
      id: true, type: true, year: true, theme: true, createdAt: true,
      user: { select: socialUserFields },
      games: { orderBy: { position: "asc" }, select: { gameId: true, name: true, thumb: true } },
      likes: { where: { userId: viewerId }, select: { userId: true }, take: 1 },
      _count: { select: { likes: true, comments: true } },
    },
  });
  return rows.map((row): FeedCandidate => ({
    id: row.id, createdAt: row.createdAt,
    item: {
      kind: "rank", id: row.id, type: row.type, year: row.year, theme: row.theme,
      createdAt: row.createdAt.toISOString(), author: row.user, games: row.games,
      likes: { liked: row.likes.length > 0, count: row._count.likes }, commentCount: row._count.comments,
    },
  }));
}

async function tierListPostFeedCandidates(viewerId: string, cursor: ReturnType<typeof decodeSocialCursor>, take: number) {
  const rows = await prisma.tierListPost.findMany({
    where: { AND: [socialFeedWhere(viewerId), socialCursorWhere(cursor)] },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take,
    select: {
      id: true, createdAt: true, columns: true,
      user: { select: socialUserFields },
      likes: { where: { userId: viewerId }, select: { userId: true }, take: 1 },
      _count: { select: { likes: true, comments: true } },
    },
  });
  return rows.map((row): FeedCandidate => ({
    id: row.id, createdAt: row.createdAt,
    item: {
      kind: "tier-list", id: row.id, createdAt: row.createdAt.toISOString(), author: row.user,
      columns: parseTierListPostColumns(row.columns),
      likes: { liked: row.likes.length > 0, count: row._count.likes }, commentCount: row._count.comments,
    },
  }));
}

export async function socialFeed(viewerId: string, rawCursor: string | null): Promise<SocialPage<SocialFeedItem>> {
  const cursor = decodeSocialCursor(rawCursor);
  const take = SOCIAL_PAGE_SIZE + 1;
  const [ranks, tierLists] = await Promise.all([
    rankFeedCandidates(viewerId, cursor, take),
    tierListPostFeedCandidates(viewerId, cursor, take),
  ]);
  const merged = [...ranks, ...tierLists].sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  const page = merged.slice(0, SOCIAL_PAGE_SIZE);
  return {
    items: page.map((candidate) => candidate.item),
    nextCursor: merged.length > SOCIAL_PAGE_SIZE
      ? encodeSocialCursor({ id: page[page.length - 1].id, createdAt: page[page.length - 1].createdAt })
      : null,
  };
}

export async function socialFaqQuestions(
  viewerId: string, rawCursor: string | null
): Promise<SocialPage<SocialFaqQuestion>> {
  const cursor = decodeSocialCursor(rawCursor);
  const rows = await prisma.faqQuestion.findMany({
    where: socialCursorWhere(cursor),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: SOCIAL_PAGE_SIZE + 1,
    select: {
      id: true, title: true, body: true, theme: true, createdAt: true,
      gameId: true, gameName: true, gameThumb: true,
      user: { select: socialUserFields },
      likes: { where: { userId: viewerId }, select: { userId: true }, take: 1 },
      _count: { select: { likes: true, comments: true } },
    },
  });
  const page = rows.slice(0, SOCIAL_PAGE_SIZE);
  return {
    items: page.map((row) => ({
      kind: "faq" as const, id: row.id, title: row.title, body: row.body, theme: row.theme,
      game: row.gameId && row.gameName && row.gameThumb
        ? { gameId: row.gameId, name: row.gameName, thumb: row.gameThumb } : null,
      createdAt: row.createdAt.toISOString(), author: row.user,
      likes: { liked: row.likes.length > 0, count: row._count.likes }, commentCount: row._count.comments,
    })),
    nextCursor: rows.length > SOCIAL_PAGE_SIZE ? encodeSocialCursor(page[page.length - 1]) : null,
  };
}

export async function socialFaqComments(
  viewerId: string, faqQuestionId: string, parentId: string | null, rawCursor: string | null
): Promise<SocialPage<SocialComment>> {
  const cursor = decodeSocialCursor(rawCursor);
  const rows = await prisma.faqQuestionComment.findMany({
    where: { faqQuestionId, parentId, ...socialCursorWhere(cursor) },
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
