import { z } from "zod";

export const authEmailSchema = z.string().trim().toLowerCase().max(254).pipe(
  z.email("Informe um e-mail válido")
);

export const loginSchema = z.strictObject({
  email: authEmailSchema,
  password: z.string().min(1, "Informe sua senha").max(128, "Use até 128 caracteres"),
});

export const registerSchema = z.strictObject({
  fullName: z.string().trim().min(2, "Informe seu nome completo").max(120, "Use até 120 caracteres"),
  email: authEmailSchema,
  password: z.string().min(12, "Use pelo menos 12 caracteres").max(128, "Use até 128 caracteres"),
  confirmPassword: z.string().max(128, "Use até 128 caracteres"),
}).refine((value) => value.password === value.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});
