import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Indique o email ou nome de utilizador."),
  password: z.string().min(1, "Indique a senha."),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
