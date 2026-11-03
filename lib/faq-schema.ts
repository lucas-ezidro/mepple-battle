import { z } from "zod";

export const faqGameSchema = z.strictObject({
  gameId: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  thumb: z.string().trim().min(1).max(500),
});

export const faqQuestionInputSchema = z.strictObject({
  title: z.string().trim().min(3, "Escreva um título para a dúvida").max(140, "Use até 140 caracteres"),
  body: z.string().trim().min(10, "Descreva sua dúvida com mais detalhes").max(4000, "Use até 4000 caracteres"),
  theme: z.string().trim().max(60, "Use até 60 caracteres").optional(),
  game: faqGameSchema.optional(),
});
export type FaqQuestionInput = z.infer<typeof faqQuestionInputSchema>;
