import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok, okPaginated, buildPagination } from "../../common/api-response";
import { parseListQuery } from "../../common/list-query";
import { AppError } from "../../common/app-error";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { ensureUniqueSlug } from "../../utils/slug";
import { recordAudit } from "../audit/audit.service";

const documentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.enum(["PDF", "DOCX", "XLSX", "PPTX", "ZIP", "OTHER"]).optional(),
  fileSize: z.number().int().nonnegative().optional(),
  coverImage: z.string().optional(),
  categoryId: z.string().optional(),
  documentDate: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const documentsPublicRouter = Router();
documentsPublicRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req, "createdAt");
    const where = {
      status: "PUBLISHED" as const,
      ...(query.search ? { title: { contains: query.search } } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.document.findMany({ where, include: { category: true }, orderBy: { [query.sortBy]: query.sortOrder }, skip: query.skip, take: query.limit }),
      prisma.document.count({ where }),
    ]);
    okPaginated(res, data, buildPagination(query.page, query.limit, total));
  })
);
documentsPublicRouter.post(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const document = await prisma.document.update({ where: { id: req.params.id }, data: { downloadsCount: { increment: 1 } } }).catch(() => null);
    if (!document) throw AppError.notFound("Documento não encontrado.");
    ok(res, { fileUrl: document.fileUrl, downloadsCount: document.downloadsCount });
  })
);

export const documentsAdminRouter = Router();
documentsAdminRouter.use(authenticate, authorize("documents.manage"));

documentsAdminRouter.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.document.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } }))));
documentsAdminRouter.post(
  "/",
  validate(documentSchema),
  asyncHandler(async (req, res) => {
    const slug = await ensureUniqueSlug(req.body.title, async (c) => Boolean(await prisma.document.findUnique({ where: { slug: c } })));
    const document = await prisma.document.create({ data: { ...req.body, slug } });
    await recordAudit({ req, action: "CREATE", module: "documents", entity: "Document", entityId: document.id });
    created(res, document, "Documento criado com sucesso.");
  })
);
documentsAdminRouter.patch(
  "/:id",
  validate(documentSchema.partial()),
  asyncHandler(async (req, res) => {
    const document = await prisma.document.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ req, action: "UPDATE", module: "documents", entity: "Document", entityId: document.id });
    ok(res, document, "Documento actualizado com sucesso.");
  })
);
documentsAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.document.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "documents", entity: "Document", entityId: req.params.id });
    ok(res, null, "Documento removido com sucesso.");
  })
);
