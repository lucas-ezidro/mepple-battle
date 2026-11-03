import { z } from "zod";

export const tierListGameSchema = z.object({
  gameId: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  thumb: z.string().trim().max(2048),
});

export const tierListColumnSchema = z.object({
  label: z.string().trim().min(1, "Informe um título").max(40, "Use até 40 caracteres"),
  games: z.array(tierListGameSchema).max(500),
});

export const tierListUpdateSchema = z
  .object({
    pool: z.array(tierListGameSchema).max(500),
    columns: z.array(tierListColumnSchema).min(1, "Mantenha ao menos uma coluna").max(20, "Use até 20 colunas"),
  })
  .refine((data) => {
    const ids = [...data.pool, ...data.columns.flatMap((column) => column.games)].map((game) => game.gameId);
    return ids.length === new Set(ids).size;
  }, "Cada jogo só pode aparecer uma vez no tier list");

export type TierListGameInput = z.infer<typeof tierListGameSchema>;
export type TierListUpdateInput = z.infer<typeof tierListUpdateSchema>;

export const tierListPostColumnsSchema = z.array(tierListColumnSchema).max(20);
export type TierListPostColumns = z.infer<typeof tierListPostColumnsSchema>;

export interface TierListGameDTO {
  gameId: number;
  name: string;
  thumb: string;
}

export interface TierListColumnDTO {
  id: string;
  label: string;
  games: TierListGameDTO[];
}

export interface TierListDTO {
  pool: TierListGameDTO[];
  columns: TierListColumnDTO[];
}
