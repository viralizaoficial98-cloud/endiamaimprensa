import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { env } from "../config/env";
import { AppError } from "../common/app-error";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    errors: ["not_found"],
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error({ err }, err.message);
    return res.status(err.statusCode).json({ success: false, message: err.message, errors: err.errors });
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    return res.status(422).json({ success: false, message: "Dados inválidos.", errors });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "campo";
      return res.status(409).json({
        success: false,
        message: `Já existe um registo com o mesmo valor para: ${target}.`,
        errors: [err.code],
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Recurso não encontrado.", errors: [err.code] });
    }
    if (err.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Operação viola uma relação entre registos existentes.",
        errors: [err.code],
      });
    }
  }

  logger.error({ err }, "Erro não tratado");

  const message = env.isProduction
    ? "Não foi possível realizar a operação."
    : err instanceof Error
      ? err.message
      : "Erro desconhecido.";

  return res.status(500).json({
    success: false,
    message,
    errors: env.isProduction ? [] : [err instanceof Error ? (err.stack ?? err.message) : String(err)],
  });
}
