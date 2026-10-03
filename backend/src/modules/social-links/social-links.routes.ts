import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok } from "../../common/api-response";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { recordAudit } from "../audit/audit.service";

const socialSchema = z.object({
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE", "TWITTER", "TIKTOK", "WHATSAPP"]),
  url: z.string().min(1),
  icon: z.string().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const socialLinksPublicRouter = Router();
socialLinksPublicRouter.get(
  "/",
  asyncHandler(async (_req, res) => ok(res, await prisma.socialLink.findMany({ where: { isActive: true }, orderBy: { order: "asc" } })))
);

export const socialLinksAdminRouter = Router();
socialLinksAdminRouter.use(authenticate, authorize("settings.manage"));
socialLinksAdminRouter.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.socialLink.findMany({ orderBy: { order: "asc" } }))));
socialLinksAdminRouter.post(
  "/",
  validate(socialSchema),
  asyncHandler(async (req, res) => {
    const link = await prisma.socialLink.create({ data: req.body });
    await recordAudit({ req, action: "CREATE", module: "social-links", entity: "SocialLink", entityId: link.id });
    created(res, link, "Rede social criada com sucesso.");
  })
);
socialLinksAdminRouter.patch(
  "/:id",
  validate(socialSchema.partial()),
  asyncHandler(async (req, res) => {
    const link = await prisma.socialLink.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ req, action: "UPDATE", module: "social-links", entity: "SocialLink", entityId: link.id });
    ok(res, link, "Rede social actualizada com sucesso.");
  })
);
socialLinksAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.socialLink.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "social-links", entity: "SocialLink", entityId: req.params.id });
    ok(res, null, "Rede social removida com sucesso.");
  })
);
