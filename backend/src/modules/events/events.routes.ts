import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok } from "../../common/api-response";
import { AppError } from "../../common/app-error";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { ensureUniqueSlug } from "../../utils/slug";
import { recordAudit } from "../audit/audit.service";

const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  coverImage: z.string().min(1),
  location: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  registrationUrl: z.string().optional(),
  organizer: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(["DRAFT", "UPCOMING", "ONGOING", "FINISHED", "CANCELLED"]).optional(),
  isFeatured: z.boolean().optional(),
});

/** Lean projection for list views — excludes precise geo-coordinates and audit
 * timestamps that only the detail page / admin need, to keep the homepage and
 * /eventos payload small (see performance pass, item 27). */
const EVENT_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImage: true,
  location: true,
  address: true,
  startDate: true,
  endDate: true,
  startTime: true,
  endTime: true,
  status: true,
  organizer: true,
  registrationUrl: true,
  contactEmail: true,
  contactPhone: true,
  capacity: true,
  isFeatured: true,
} as const;

export const eventsPublicRouter = Router();
eventsPublicRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 5, 60);
    const includePast = req.query.includePast === "true";
    ok(
      res,
      await prisma.event.findMany({
        where: includePast ? {} : { status: { in: ["UPCOMING", "ONGOING"] } },
        orderBy: { startDate: includePast ? "desc" : "asc" },
        take: limit,
        select: EVENT_LIST_SELECT,
      })
    );
  })
);
eventsPublicRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findFirst({ where: { slug: req.params.slug } });
    if (!event) throw AppError.notFound("Evento não encontrado.");
    ok(res, event);
  })
);

export const eventsAdminRouter = Router();
eventsAdminRouter.use(authenticate, authorize("events.manage"));

eventsAdminRouter.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.event.findMany({ orderBy: { startDate: "desc" } }))));
eventsAdminRouter.post(
  "/",
  validate(eventSchema),
  asyncHandler(async (req, res) => {
    const slug = await ensureUniqueSlug(req.body.title, async (c) => Boolean(await prisma.event.findUnique({ where: { slug: c } })));
    const event = await prisma.event.create({ data: { ...req.body, slug } });
    await recordAudit({ req, action: "CREATE", module: "events", entity: "Event", entityId: event.id });
    created(res, event, "Evento criado com sucesso.");
  })
);
eventsAdminRouter.patch(
  "/:id",
  validate(eventSchema.partial()),
  asyncHandler(async (req, res) => {
    const event = await prisma.event.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ req, action: "UPDATE", module: "events", entity: "Event", entityId: event.id });
    ok(res, event, "Evento actualizado com sucesso.");
  })
);
eventsAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.event.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "events", entity: "Event", entityId: req.params.id });
    ok(res, null, "Evento removido com sucesso.");
  })
);
