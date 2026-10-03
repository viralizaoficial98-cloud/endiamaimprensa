import { Router } from "express";
import { authRateLimiter } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../guards/authenticate";
import {
  changePasswordHandler,
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  resetPasswordHandler,
} from "./auth.controller";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
} from "./auth.validators";

export const authRouter = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login por email ou username
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier: { type: string, example: admin@endiama.co.ao }
 *               password: { type: string, example: SuaPasswordForte123! }
 *     responses:
 *       200: { description: Sessão iniciada com sucesso }
 */
authRouter.post("/login", authRateLimiter, validate(loginSchema), loginHandler);
authRouter.post("/refresh", authRateLimiter, validate(refreshSchema), refreshHandler);
authRouter.post("/logout", logoutHandler);
authRouter.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), forgotPasswordHandler);
authRouter.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), resetPasswordHandler);
authRouter.post("/change-password", authenticate, validate(changePasswordSchema), changePasswordHandler);
authRouter.get("/me", authenticate, meHandler);
