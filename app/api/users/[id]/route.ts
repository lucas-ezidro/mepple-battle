import { socialProfile, socialResponse } from "@/lib/social-server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return socialResponse("[GET /api/users/:id]", async (viewerId) =>
    socialProfile((await params).id, viewerId));
}
