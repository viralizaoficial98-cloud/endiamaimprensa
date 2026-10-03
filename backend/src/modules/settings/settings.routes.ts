import { Router } from "express";
import { z } from "zod";
import type { SettingGroup } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { ok } from "../../common/api-response";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { recordAudit } from "../audit/audit.service";

const PUBLIC_GROUPS: SettingGroup[] = ["GENERAL", "APPEARANCE", "SOCIAL", "PORTAL", "SEO"];

export const settingsPublicRouter = Router();
settingsPublicRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const settings = await prisma.setting.findMany({ where: { group: { in: PUBLIC_GROUPS } } });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    ok(res, map);
  })
);

export const settingsAdminRouter = Router();
settingsAdminRouter.use(authenticate, authorize("settings.manage"));

settingsAdminRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const where = req.query.group ? { group: req.query.group as never } : {};
    ok(res, await prisma.setting.findMany({ where, orderBy: { group: "asc" } }));
  })
);

settingsAdminRouter.put(
  "/:key",
  validate(z.object({ value: z.string().nullable(), type: z.enum(["STRING", "NUMBER", "BOOLEAN", "JSON"]).optional(), group: z.enum(["GENERAL", "APPEARANCE", "SEO", "SOCIAL", "EMAIL", "SECURITY", "ANALYTICS", "PORTAL"]).optional(), description: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const setting = await prisma.setting.upsert({
      where: { key: req.params.key },
      update: { value: req.body.value, type: req.body.type, group: req.body.group, description: req.body.description, updatedById: req.user!.id },
      create: {
        key: req.params.key,
        value: req.body.value,
        type: req.body.type ?? "STRING",
        group: req.body.group ?? "GENERAL",
        description: req.body.description,
        updatedById: req.user!.id,
      },
    });
    await recordAudit({ req, action: "UPDATE", module: "settings", entity: "Setting", entityId: setting.id, newData: { key: setting.key, value: setting.value } });
    ok(res, setting, "Configuração actualizada com sucesso.");
  })
);
