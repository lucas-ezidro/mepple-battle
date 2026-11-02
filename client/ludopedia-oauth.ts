// Server-only: Ludopedia OAuth2 "authorization_code" flow helpers.
// The games endpoint belongs to a logged-in user, so app_id/app_key alone
// are not enough — the user must authorize the app first.
import { randomBytes } from "crypto";
import { z } from "zod";

const AUTHORIZE_URL = "https://ludopedia.com.br/oauth";
const TOKEN_URL = "https://ludopedia.com.br/tokenrequest";

export interface LudopediaTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

function getCredentials() {
  const appId = process.env.LUDOPEDIA_APP_ID;
  const appKey = process.env.LUDOPEDIA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error("LUDOPEDIA_APP_ID/LUDOPEDIA_APP_KEY não configurados");
  }

  return { appId, appKey };
}

export function createOAuthState() {
  return randomBytes(16).toString("hex");
}

export function getLudopediaReturnPath(value: string | null | undefined) {
  return value === "/profile" ? "/profile" : "/top-games";
}

export function getLudopediaAuthorizeUrl(redirectUri: string, state: string) {
  const { appId } = getCredentials();
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<LudopediaTokens> {
  const { appId, appKey } = getCredentials();

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: appId,
      client_secret: appKey,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao trocar o code por access_token (${response.status})`);
  }

  const data = z.object({
    access_token: z.string().min(1),
    refresh_token: z.string().optional(),
    expires_in: z.coerce.number().positive().default(3600),
  }).parse(await response.json());
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

export async function getLudopediaIdentity(accessToken: string) {
  const response = await fetch("https://ludopedia.com.br/api/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Falha ao identificar a conta Ludopedia (${response.status})`);
  return z.object({
    id_usuario: z.number().int().positive(),
    nome: z.string().optional(),
  }).parse(await response.json());
}
