import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isSessionToken, SESSION_COOKIE, SESSION_DURATION_MS } from "@/lib/auth-policy";

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newSession() {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  };
}

export async function findSession(token: string | undefined) {
  if (!isSessionToken(token)) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      userId: true,
      expiresAt: true,
      user: { select: { id: true, username: true, fullName: true } },
    },
  });
  return session && session.expiresAt > new Date() ? session : null;
}

export const getCurrentSession = cache(async () => {
  return findSession((await cookies()).get(SESSION_COOKIE)?.value);
});

export async function writeSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
  clearLudopediaCookies(store);
}

export function clearLudopediaCookies(store: Awaited<ReturnType<typeof cookies>>) {
  for (const name of [
    "ludopedia_access_token", "ludopedia_refresh_token",
    "ludopedia_oauth_state", "ludopedia_oauth_return_to", "ludopedia_oauth_user",
  ]) store.delete(name);
}
