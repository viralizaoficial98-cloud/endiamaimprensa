import type { Request, Response } from "express";
import { asyncHandler } from "../../common/async-handler";
import { ok } from "../../common/api-response";
import * as authService from "./auth.service";

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const result = await authService.login(identifier, password, req);
  ok(res, result, "Sessão iniciada com sucesso.");
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken, req);
  ok(res, result, "Token renovado com sucesso.");
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) await authService.logout(refreshToken);
  ok(res, null, "Sessão terminada com sucesso.");
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  ok(res, user);
});

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  ok(
    res,
    { devToken: result.devToken },
    "Se o email existir na nossa base de dados, receberá instruções para recuperar a senha."
  );
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  ok(res, null, "Senha redefinida com sucesso.");
});

export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  ok(res, null, "Senha alterada com sucesso.");
});
