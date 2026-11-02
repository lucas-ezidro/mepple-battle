import z from "zod";
import { CURRENT_YEAR, RANK_TYPES } from "./helpers";

export const formSchema = z
  .object({
    type: z.enum(RANK_TYPES, { message: "Selecione o tipo do top" }),
    year: z.string().optional(),
    theme: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "100") {
      const year = Number(data.year);

      if (!data.year || Number.isNaN(year)) {
        ctx.addIssue({ code: "custom", message: "Selecione o ano", path: ["year"] });
      } else if (year > CURRENT_YEAR) {
        ctx.addIssue({
          code: "custom",
          message: `O ano deve ser menor ou igual a ${CURRENT_YEAR}`,
          path: ["year"],
        });
      }
    } else if (!data.theme || data.theme.trim().length < 3) {
      ctx.addIssue({
        code: "custom",
        message: "Descreva o tema do top com pelo menos 3 caracteres",
        path: ["theme"],
      });
    }
  });