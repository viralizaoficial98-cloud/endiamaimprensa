import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AppError } from "../common/app-error";
import { verifyAccessToken } from "../modules/auth/token.util";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw AppError.unauthorized("Token de acesso em falta.");
    }
    const token = header.slice("Bearer ".length);

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw AppError.unauthorized("Token de acesso inválido ou expirado.");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: { include: { permissions: true } } },
    });

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw AppError.unauthorized("Utilizador inválido ou inactivo.");
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: user.role.permissions.map((p) => p.code),
      mustChangePassword: user.mustChangePassword,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/** Attaches req.user when a valid token is present, but never rejects the request. */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: { include: { permissions: true } } },
    });
    if (user && !user.deletedAt && user.status === "ACTIVE") {
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        roleId: user.roleId,
        roleName: user.role.name,
        permissions: user.role.permissions.map((p) => p.code),
        mustChangePassword: user.mustChangePassword,
      };
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}
