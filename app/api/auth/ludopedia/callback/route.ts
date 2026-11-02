import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, getLudopediaIdentity, getLudopediaReturnPath } from "@/client/ludopedia-oauth";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { linkLudopediaAccount, LudopediaLinkError } from "@/lib/link-ludopedia";
import { getRequestOrigin } from "@/lib/auth-policy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ludopedia_oauth_state")?.value;
  const expectedUserId = cookieStore.get("ludopedia_oauth_user")?.value;
  const returnTo = getLudopediaReturnPath(cookieStore.get("ludopedia_oauth_return_to")?.value);
  cookieStore.delete("ludopedia_oauth_state");
  cookieStore.delete("ludopedia_oauth_return_to");
  cookieStore.delete("ludopedia_oauth_user");

  const errorUrl = new URL(returnTo, origin);
  errorUrl.searchParams.set("ludopedia_error", "1");

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(errorUrl);
  }

  try {
    const userId = await getCurrentUserId();
    if (userId !== expectedUserId) return NextResponse.redirect(errorUrl);
    const redirectUri = new URL("/api/auth/ludopedia/callback", origin).toString();
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const identity = await getLudopediaIdentity(tokens.accessToken);
    await linkLudopediaAccount(userId, identity);

    cookieStore.set("ludopedia_access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(tokens.expiresAt),
      path: "/",
    });

    if (tokens.refreshToken) {
      cookieStore.set("ludopedia_refresh_token", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return NextResponse.redirect(new URL(returnTo, origin));
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.redirect(new URL("/login", origin));
    }
    if (error instanceof LudopediaLinkError) {
      errorUrl.searchParams.set("ludopedia_error", error.code);
      return NextResponse.redirect(errorUrl);
    }
    console.error(
      "[GET /api/auth/ludopedia/callback] Falha ao conectar com a Ludopedia",
      error instanceof Error ? error.name : typeof error
    );
    return NextResponse.redirect(errorUrl);
  }
}
