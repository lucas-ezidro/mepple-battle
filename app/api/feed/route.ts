import { socialFeed, socialResponse } from "@/lib/social-server";

export async function GET(request: Request) {
  return socialResponse("[GET /api/feed]", (viewerId) => socialFeed(
    viewerId, new URL(request.url).searchParams.get("cursor")
  ));
}
