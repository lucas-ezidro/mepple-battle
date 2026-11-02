import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUserId, UnauthenticatedError } from "@/lib/current-user";
import { getRequestOrigin } from "@/lib/auth-policy";
import {
  createOAuthState,
  getLudopediaAuthorizeUrl,
  getLudopediaReturnPath,
} from "@/client/ludopedia-oauth";

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  let userId: string;
  try {
    userId = await getCurrentUserId();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UnauthenticatedError) {
      return NextResponse.redirect(new URL("/login", origin));
    }
    console.error("[Ludopedia login] Falha ao verificar sessão", error instanceof Error ? error.name : typeof error);
    return NextResponse.json({ error: "Não foi possível conectar com a Ludopedia" }, { status: 500 });
  }
  const redirectUri = new URL("/api/auth/ludopedia/callback", origin).toString();
  const state = createOAuthState();

  const cookieStore = await cookies();
  cookieStore.set("ludopedia_oauth_user", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  cookieStore.set("ludopedia_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  cookieStore.set(
    "ludopedia_oauth_return_to",
    getLudopediaReturnPath(request.nextUrl.searchParams.get("returnTo")),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    }
  );

  return NextResponse.redirect(getLudopediaAuthorizeUrl(redirectUri, state));
}
