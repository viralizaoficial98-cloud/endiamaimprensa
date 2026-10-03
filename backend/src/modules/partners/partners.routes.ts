import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok } from "../../common/api-response";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { recordAudit } from "../audit/audit.service";

const partnerSchema = z.object({
  name: z.string().min(2),
  logo: z.string().min(1),
  website: z.string().optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const partnersPublicRouter = Router();
partnersPublicRouter.get(
  "/",
  asyncHandler(async (_req, res) =>
    ok(
      res,
      await prisma.partner.findMany({
        where: { status: "ACTIVE" },
        orderBy: { order: "asc" },
        select: { id: true, name: true, logo: true, website: true, description: true, order: true },
      })
    )
  )
);

export const partnersAdminRouter = Router();
partnersAdminRouter.use(authenticate, authorize("settings.manage"));
partnersAdminRouter.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.partner.findMany({ orderBy: { order: "asc" } }))));
partnersAdminRouter.post(
  "/",
  validate(partnerSchema),
  asyncHandler(async (req, res) => {
    const partner = await prisma.partner.create({ data: req.body });
    await recordAudit({ req, action: "CREATE", module: "partners", entity: "Partner", entityId: partner.id });
    created(res, partner, "Parceiro criado com sucesso.");
  })
);
partnersAdminRouter.patch(
  "/:id",
  validate(partnerSchema.partial()),
  asyncHandler(async (req, res) => {
    const partner = await prisma.partner.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ req, action: "UPDATE", module: "partners", entity: "Partner", entityId: partner.id });
    ok(res, partner, "Parceiro actualizado com sucesso.");
  })
);
partnersAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.partner.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "partners", entity: "Partner", entityId: req.params.id });
    ok(res, null, "Parceiro removido com sucesso.");
  })
);
