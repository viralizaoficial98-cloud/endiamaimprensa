import type { Request } from "express";
import { prisma } from "../../config/prisma";

interface AuditParams {
  req?: Request;
  userId?: string | null;
  action: string;
  module: string;
  entity?: string;
  entityId?: string;
  oldData?: unknown;
  newData?: unknown;
}

export async function recordAudit(params: AuditParams): Promise<void> {
  const { req, userId, action, module, entity, entityId, oldData, newData } = params;
  await prisma.auditLog.create({
    data: {
      userId: userId ?? req?.user?.id ?? null,
      action,
      module,
      entity,
      entityId,
      oldData: oldData === undefined ? undefined : (oldData as object),
      newData: newData === undefined ? undefined : (newData as object),
      ipAddress: req?.ip,
      userAgent: req?.headers["user-agent"],
    },
  });
}
