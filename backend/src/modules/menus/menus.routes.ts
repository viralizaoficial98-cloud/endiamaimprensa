import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok } from "../../common/api-response";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { toSlug } from "../../utils/slug";
import { recordAudit } from "../audit/audit.service";

const menuItemSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  icon: z.string().optional(),
  order: z.number().int().optional(),
  isExternal: z.boolean().optional(),
  openInNewTab: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  isMegaMenu: z.boolean().optional(),
  parentId: z.string().optional(),
});

const include = { items: { where: { parentId: null }, include: { children: true }, orderBy: { order: "asc" as const } } };

export const menusPublicRouter = Router();
menusPublicRouter.get(
  "/",
  asyncHandler(async (_req, res) => ok(res, await prisma.menu.findMany({ include })))
);

export const menusAdminRouter = Router();
menusAdminRouter.use(authenticate, authorize("settings.manage"));

menusAdminRouter.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.menu.findMany({ include }))));
menusAdminRouter.post(
  "/",
  validate(z.object({ name: z.string().min(2) })),
  asyncHandler(async (req, res) => {
    const menu = await prisma.menu.create({ data: { name: req.body.name, slug: toSlug(req.body.name) } });
    await recordAudit({ req, action: "CREATE", module: "menus", entity: "Menu", entityId: menu.id });
    created(res, menu, "Menu criado com sucesso.");
  })
);
menusAdminRouter.post(
  "/:menuId/items",
  validate(menuItemSchema),
  asyncHandler(async (req, res) => {
    const item = await prisma.menuItem.create({ data: { ...req.body, menuId: req.params.menuId } });
    await recordAudit({ req, action: "CREATE", module: "menus", entity: "MenuItem", entityId: item.id });
    created(res, item, "Item de menu criado com sucesso.");
  })
);
menusAdminRouter.patch(
  "/items/:id",
  validate(menuItemSchema.partial()),
  asyncHandler(async (req, res) => {
    const item = await prisma.menuItem.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ req, action: "UPDATE", module: "menus", entity: "MenuItem", entityId: item.id });
    ok(res, item, "Item de menu actualizado com sucesso.");
  })
);
menusAdminRouter.delete(
  "/items/:id",
  asyncHandler(async (req, res) => {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "menus", entity: "MenuItem", entityId: req.params.id });
    ok(res, null, "Item de menu removido com sucesso.");
  })
);
