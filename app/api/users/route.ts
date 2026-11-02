import { prisma } from "@/lib/prisma";
import { searchUsersSchema } from "@/lib/social-schema";
import { socialResponse, socialUserFields } from "@/lib/social-server";

export async function GET(request: Request) {
  return socialResponse("[GET /api/users]", async (viewerId) => {
    const query = searchUsersSchema.parse(new URL(request.url).searchParams.get("q"));
    return prisma.user.findMany({
      where: {
        id: { not: viewerId },
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { fullName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: socialUserFields, orderBy: [{ username: "asc" }, { id: "asc" }], take: 20,
    });
  });
}
