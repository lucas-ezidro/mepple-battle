export const SESSION_COOKIE = "meeples_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  return host ? new URL(`${url.protocol}//${host}`).origin : url.origin;
}

export function isSessionToken(value: string | undefined): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function getAuthReturnPath(value: string | null | undefined) {
  return value && ["/", "/profile", "/top-games", "/tier-lists", "/faq"].includes(value)
    ? value
    : "/";
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !URL.canParse(origin)) return false;
  const source = new URL(origin);
  return source.host === request.headers.get("host") &&
    source.protocol === new URL(request.url).protocol;
}
