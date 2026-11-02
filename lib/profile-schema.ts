import { z } from "zod";
import { authEmailSchema } from "./auth-schema";

export const profileSchema = z.strictObject({
  username: z.string().trim().max(64, "Use até 64 caracteres"),
  email: authEmailSchema,
  fullName: z.string().trim().max(120, "Use até 120 caracteres"),
  avatarUrl: z
    .string()
    .trim()
    .max(2048, "Use até 2048 caracteres")
    .refine((value) => {
      if (!value) return true;
      if (!URL.canParse(value)) return false;
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    }, "Informe um link HTTPS válido, sem credenciais"),
});

export const profileUpdateSchema = profileSchema.partial().refine(
  (value) => Object.values(value).some((field) => field !== undefined),
  "Informe ao menos um campo"
);

export type ProfileFormValues = z.infer<typeof profileSchema>;

export interface ProfileDetails {
  username: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface FollowCounts {
  followers: number;
  following: number;
}
