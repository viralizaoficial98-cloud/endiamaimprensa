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
import { sanitizeContentBlocks, sanitizePlainText } from "../../utils/sanitize";
import { recordAudit } from "../audit/audit.service";

const blockSchema = z.object({ type: z.string(), content: z.string(), caption: z.string().optional() });

const interviewSchema = z.object({
  title: z.string().min(2),
  excerpt: z.string().min(5),
  content: z.array(blockSchema).min(1),
  intervieweeName: z.string().min(2),
  intervieweePosition: z.string().optional(),
  intervieweeCompany: z.string().optional(),
  intervieweePhoto: z.string().optional(),
  coverImage: z.string().min(1),
  categoryId: z.string().optional(),
  videoUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

const include = { category: true, interviewer: { select: { id: true, name: true } } };

export const interviewsPublicRouter = Router();
interviewsPublicRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit) || 20;
    ok(res, await prisma.interview.findMany({ where: { status: "PUBLISHED" }, include, orderBy: { publishedAt: "desc" }, take: limit }));
  })
);
interviewsPublicRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const interview = await prisma.interview.findFirst({ where: { slug: req.params.slug, status: "PUBLISHED" }, include });
    if (!interview) throw AppError.notFound("Entrevista não encontrada.");
    ok(res, interview);
  })
);

export const interviewsAdminRouter = Router();
interviewsAdminRouter.use(authenticate, authorize("interviews.manage"));

interviewsAdminRouter.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.interview.findMany({ include, orderBy: { createdAt: "desc" } }))));
interviewsAdminRouter.post(
  "/",
  validate(interviewSchema),
  asyncHandler(async (req, res) => {
    const slug = await ensureUniqueSlug(req.body.title, async (c) => Boolean(await prisma.interview.findUnique({ where: { slug: c } })));
    const interview = await prisma.interview.create({
      data: {
        ...req.body,
        title: sanitizePlainText(req.body.title),
        content: sanitizeContentBlocks(req.body.content),
        slug,
        interviewerId: req.user!.id,
        publishedAt: req.body.status === "PUBLISHED" ? new Date() : null,
      },
      include,
    });
    await recordAudit({ req, action: "CREATE", module: "interviews", entity: "Interview", entityId: interview.id });
    created(res, interview, "Entrevista criada com sucesso.");
  })
);
interviewsAdminRouter.patch(
  "/:id",
  validate(interviewSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.interview.findUnique({ where: { id: req.params.id } });
    if (!existing) throw AppError.notFound("Entrevista não encontrada.");
    const data: Record<string, unknown> = { ...req.body };
    if (req.body.content) data.content = sanitizeContentBlocks(req.body.content);
    if (req.body.status === "PUBLISHED" && existing.status !== "PUBLISHED") data.publishedAt = new Date();
    const interview = await prisma.interview.update({ where: { id: req.params.id }, data, include });
    await recordAudit({ req, action: "UPDATE", module: "interviews", entity: "Interview", entityId: interview.id });
    ok(res, interview, "Entrevista actualizada com sucesso.");
  })
);
interviewsAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.interview.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "interviews", entity: "Interview", entityId: req.params.id });
    ok(res, null, "Entrevista removida com sucesso.");
  })
);
