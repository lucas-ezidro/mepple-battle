import { prisma } from "@/lib/prisma";
import { faqQuestionInputSchema } from "@/lib/faq-schema";
import { socialFaqQuestions, socialResponse } from "@/lib/social-server";

export async function GET(request: Request) {
  return socialResponse("[GET /api/faq]", (viewerId) => socialFaqQuestions(
    viewerId, new URL(request.url).searchParams.get("cursor")
  ));
}

export async function POST(request: Request) {
  return socialResponse("[POST /api/faq]", async (userId) => {
    const { title, body, theme, game } = faqQuestionInputSchema.parse(await request.json());
    return prisma.faqQuestion.create({
      data: {
        userId, title, body, theme,
        gameId: game?.gameId, gameName: game?.name, gameThumb: game?.thumb,
      },
      select: { id: true },
    });
  }, 201);
}
