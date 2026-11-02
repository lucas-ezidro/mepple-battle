import { socialPosts, socialResponse } from "@/lib/social-server";
import { socialFeedWhere } from "@/lib/social-schema";

export async function GET(request: Request) {
  return socialResponse("[GET /api/feed]", (viewerId) => socialPosts(
    viewerId, socialFeedWhere(viewerId),
    new URL(request.url).searchParams.get("cursor")
  ));
}
