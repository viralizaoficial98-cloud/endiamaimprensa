import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok } from "../../common/api-response";
import { AppError } from "../../common/app-error";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { recordAudit } from "../audit/audit.service";

const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissionCodes: z.array(z.string()).default([]),
});

export const rolesRouter = Router();
rolesRouter.use(authenticate);

rolesRouter.get(
  "/",
  authorize("users.read", "users.update"),
  asyncHandler(async (_req, res) => {
    const roles = await prisma.role.findMany({ include: { permissions: true, _count: { select: { users: true } } }, orderBy: { name: "asc" } });
    ok(res, roles);
  })
);

rolesRouter.post(
  "/",
  authorize("users.update"),
  validate(roleSchema),
  asyncHandler(async (req, res) => {
    const role = await prisma.role.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        permissions: { connect: req.body.permissionCodes.map((code: string) => ({ code })) },
      },
      include: { permissions: true },
    });
    await recordAudit({ req, action: "CREATE", module: "roles", entity: "Role", entityId: role.id, newData: { name: role.name } });
    created(res, role, "Perfil criado com sucesso.");
  })
);

rolesRouter.patch(
  "/:id",
  authorize("users.update"),
  validate(roleSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!existing) throw AppError.notFound("Perfil não encontrado.");
    if (existing.isSystem && req.body.permissionCodes) {
      throw AppError.forbidden("Não é possível alterar as permissões de um perfil do sistema.");
    }
    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        description: req.body.description,
        permissions: req.body.permissionCodes
          ? { set: req.body.permissionCodes.map((code: string) => ({ code })) }
          : undefined,
      },
      include: { permissions: true },
    });
    await recordAudit({ req, action: "UPDATE", module: "roles", entity: "Role", entityId: role.id });
    ok(res, role, "Perfil actualizado com sucesso.");
  })
);

rolesRouter.delete(
  "/:id",
  authorize("users.update"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.role.findUnique({ where: { id: req.params.id }, include: { _count: { select: { users: true } } } });
    if (!existing) throw AppError.notFound("Perfil não encontrado.");
    if (existing.isSystem) throw AppError.forbidden("Não é possível eliminar um perfil do sistema.");
    if (existing._count.users > 0) throw AppError.conflict("Não é possível eliminar um perfil com utilizadores associados.");
    await prisma.role.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "roles", entity: "Role", entityId: req.params.id });
    ok(res, null, "Perfil removido com sucesso.");
  })
);

export const permissionsRouter = Router();
permissionsRouter.use(authenticate);
permissionsRouter.get(
  "/",
  authorize("users.read", "users.update"),
  asyncHandler(async (_req, res) => {
    const permissions = await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { code: "asc" }] });
    ok(res, permissions);
  })
);
