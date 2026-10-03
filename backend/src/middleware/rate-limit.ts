import rateLimit from "express-rate-limit";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiados pedidos. Tente novamente mais tarde.", errors: ["rate_limited"] },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Demasiadas tentativas de autenticação. Tente novamente mais tarde.",
    errors: ["rate_limited"],
  },
});
