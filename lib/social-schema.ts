import { z } from "zod";

export const SOCIAL_PAGE_SIZE = 10;
export const commentInputSchema = z.strictObject({
  body: z.string().trim().min(1, "Escreva um comentário").max(2000, "Use até 2000 caracteres"),
  parentId: z.string().min(1).max(128).optional(),
});
export const searchUsersSchema = z.string().trim().min(2).max(80);
const cursorDataSchema = z.strictObject({
  id: z.string().min(1).max(128),
  createdAt: z.iso.datetime(),
});
export type SocialCursor = z.infer<typeof cursorDataSchema>;

export function encodeSocialCursor(item: { id: string; createdAt: Date }) {
  return Buffer.from(JSON.stringify({ id: item.id, createdAt: item.createdAt.toISOString() })).toString("base64url");
}

export function decodeSocialCursor(value: string | null): SocialCursor | null {
  if (value === null) return null;
  if (!/^[\w-]{1,512}$/.test(value)) throw new Error("invalid_cursor");
  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    throw new Error("invalid_cursor");
  }
  const parsed = cursorDataSchema.safeParse(data);
  if (!parsed.success) throw new Error("invalid_cursor");
  return parsed.data;
}

export function socialCursorWhere(cursor: SocialCursor | null) {
  return cursor ? {
    OR: [
      { createdAt: { lt: new Date(cursor.createdAt) } },
      { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
    ],
  } : {};
}

export function socialFeedWhere(viewerId: string) {
  return {
    OR: [
      { userId: viewerId },
      { user: { followers: { some: { followerId: viewerId } } } },
    ],
  };
}

export interface SocialUser {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}
export interface SocialPage<T> { items: T[]; nextCursor: string | null }
export interface LikeState { liked: boolean; count: number }
export interface UserProfile extends SocialUser {
  isSelf: boolean;
  isFollowing: boolean;
  followers: number;
  following: number;
  tops: number;
}
export interface SocialPost {
  id: string;
  type: string;
  year: number | null;
  theme: string | null;
  createdAt: string;
  author: SocialUser;
  games: { gameId: number; name: string; thumb: string }[];
  likes: LikeState;
  commentCount: number;
}
export interface SocialComment {
  id: string;
  body: string;
  createdAt: string;
  author: SocialUser;
  likes: LikeState;
  replyCount: number;
}
