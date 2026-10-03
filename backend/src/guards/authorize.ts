import type { NextFunction, Request, Response } from "express";
import { AppError } from "../common/app-error";

const SUPER_ADMIN_ROLE = "Super Administrador";

/** Requires the authenticated user to hold at least one of the given permission codes. */
export function authorize(...permissionCodes: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (req.user.roleName === SUPER_ADMIN_ROLE) return next();
    const hasPermission = permissionCodes.some((code) => req.user!.permissions.includes(code));
    if (!hasPermission) {
      return next(AppError.forbidden("Não tem permissão para aceder a este recurso."));
    }
    next();
  };
}

export function requireRole(...roleNames: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (req.user.roleName === SUPER_ADMIN_ROLE) return next();
    if (!roleNames.includes(req.user.roleName)) {
      return next(AppError.forbidden("O seu perfil não tem acesso a esta operação."));
    }
    next();
  };
}
