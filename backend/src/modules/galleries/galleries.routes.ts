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

const gallerySchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  coverImage: z.string().min(1),
  galleryCategoryId: z.string().min(1, "A categoria da galeria é obrigatória."),
  gallerySubcategoryId: z.string().optional().nullable(),
  // Editorial/original date of the gallery — used for migrating historical albums.
  // Required: the public ordering and the card's displayed date both rely on it.
  eventDate: z.string().datetime({ message: "Data da galeria inválida." }),
  location: z.string().optional(),
  photographer: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
});

const imageSchema = z.object({
  imageUrl: z.string().min(1),
  thumbnailUrl: z.string().optional(),
  caption: z.string().optional(),
  altText: z.string().min(1, "O texto alternativo é obrigatório."),
  credit: z.string().optional(),
  order: z.number().int().optional(),
});

const bulkImagesSchema = z.object({
  images: z.array(imageSchema).min(1).max(300),
});

const reorderImagesSchema = z.object({
  order: z.array(z.object({ id: z.string(), order: z.number().int() })),
});

// Lean shape for listings/cards — deliberately never loads the (potentially
// hundreds-long) photo array; only a count, so the "Galeria Premium" grid and
// the admin table stay fast regardless of how many photos an album holds.
const listInclude = {
  galleryCategory: true,
  gallerySubcategory: true,
  _count: { select: { images: true } },
};

// Full shape for a single album's detail page.
const detailInclude = {
  galleryCategory: true,
  gallerySubcategory: true,
  images: { orderBy: { order: "asc" as const } },
};

// ── Gallery categories/subcategories (fixed taxonomy, read-only) ──────────
export const galleryCategoriesPublicRouter = Router();
galleryCategoriesPublicRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.galleryCategory.findMany({
      orderBy: { order: "asc" },
      include: { subcategories: { orderBy: { order: "asc" } } },
    });
    ok(res, categories);
  })
);

// ── Galleries (public) ─────────────────────────────────────────────────────
export const galleriesPublicRouter = Router();
galleriesPublicRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    // Ordering/date-of-record for galleries is the editorial eventDate, not
    // createdAt — a gallery migrated today from 2017 must sort as a 2017 item.
    const query = parseListQuery(req, "eventDate");
    const galleryCategory = typeof req.query.galleryCategory === "string" ? req.query.galleryCategory : undefined;
    const gallerySubcategory = typeof req.query.gallerySubcategory === "string" ? req.query.gallerySubcategory : undefined;
    const where = {
      status: "PUBLISHED" as const,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search } },
              { description: { contains: query.search } },
              { galleryCategory: { name: { contains: query.search } } },
            ],
          }
        : {}),
      ...(galleryCategory ? { galleryCategory: { slug: galleryCategory } } : {}),
      ...(gallerySubcategory ? { gallerySubcategory: { slug: gallerySubcategory } } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.gallery.findMany({ where, include: listInclude, orderBy: { [query.sortBy]: query.sortOrder }, skip: query.skip, take: query.limit }),
      prisma.gallery.count({ where }),
    ]);
    okPaginated(res, data, buildPagination(query.page, query.limit, total));
  })
);
galleriesPublicRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const gallery = await prisma.gallery.findFirst({ where: { slug: req.params.slug, status: "PUBLISHED" }, include: detailInclude });
    if (!gallery) throw AppError.notFound("Galeria não encontrada.");
    ok(res, gallery);
  })
);

// ── Galleries (admin) ───────────────────────────────────────────────────────
export const galleriesAdminRouter = Router();
galleriesAdminRouter.use(authenticate, authorize("galleries.manage"));

galleriesAdminRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req, "eventDate");
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const where = {
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search } },
              { description: { contains: query.search } },
              { galleryCategory: { name: { contains: query.search } } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
      ...(category ? { galleryCategory: { slug: category } } : {}),
      ...(query.dateFrom || query.dateTo
        ? { eventDate: { ...(query.dateFrom ? { gte: query.dateFrom } : {}), ...(query.dateTo ? { lte: query.dateTo } : {}) } }
        : {}),
    };
    const orderBy = query.sortBy === "photoCount" ? { images: { _count: query.sortOrder } } : { [query.sortBy]: query.sortOrder };
    const [data, total] = await Promise.all([
      prisma.gallery.findMany({ where, include: listInclude, orderBy, skip: query.skip, take: query.limit }),
      prisma.gallery.count({ where }),
    ]);
    okPaginated(res, data, buildPagination(query.page, query.limit, total));
  })
);
galleriesAdminRouter.post(
  "/",
  validate(gallerySchema),
  asyncHandler(async (req, res) => {
    const slug = await ensureUniqueSlug(req.body.title, async (c) => Boolean(await prisma.gallery.findUnique({ where: { slug: c } })));
    const gallery = await prisma.gallery.create({ data: { ...req.body, slug }, include: detailInclude });
    await recordAudit({ req, action: "CREATE", module: "galleries", entity: "Gallery", entityId: gallery.id });
    created(res, gallery, "Galeria criada com sucesso.");
  })
);
galleriesAdminRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const gallery = await prisma.gallery.findUnique({ where: { id: req.params.id }, include: detailInclude });
    if (!gallery) throw AppError.notFound("Galeria não encontrada.");
    ok(res, gallery);
  })
);
galleriesAdminRouter.patch(
  "/:id",
  validate(gallerySchema.partial()),
  asyncHandler(async (req, res) => {
    const gallery = await prisma.gallery.update({ where: { id: req.params.id }, data: req.body, include: detailInclude });
    await recordAudit({ req, action: "UPDATE", module: "galleries", entity: "Gallery", entityId: gallery.id });
    ok(res, gallery, "Galeria actualizada com sucesso.");
  })
);
galleriesAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.gallery.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "galleries", entity: "Gallery", entityId: req.params.id });
    ok(res, null, "Galeria removida com sucesso.");
  })
);

galleriesAdminRouter.post(
  "/:galleryId/images",
  validate(imageSchema),
  asyncHandler(async (req, res) => {
    const image = await prisma.galleryImage.create({ data: { ...req.body, galleryId: req.params.galleryId } });
    await recordAudit({ req, action: "CREATE", module: "galleries", entity: "GalleryImage", entityId: image.id });
    created(res, image, "Fotografia adicionada com sucesso.");
  })
);
galleriesAdminRouter.post(
  "/:galleryId/images/bulk",
  validate(bulkImagesSchema),
  asyncHandler(async (req, res) => {
    const gallery = await prisma.gallery.findUnique({ where: { id: req.params.galleryId } });
    if (!gallery) throw AppError.notFound("Galeria não encontrada.");
    const maxOrder = await prisma.galleryImage.aggregate({ where: { galleryId: req.params.galleryId }, _max: { order: true } });
    const startOrder = (maxOrder._max.order ?? -1) + 1;
    const images = req.body.images as z.infer<typeof imageSchema>[];
    const rows = await prisma.$transaction(
      images.map((img, i) =>
        prisma.galleryImage.create({ data: { ...img, order: img.order ?? startOrder + i, galleryId: req.params.galleryId } })
      )
    );
    await recordAudit({ req, action: "CREATE", module: "galleries", entity: "GalleryImage", entityId: "bulk", newData: { count: rows.length } });
    created(res, rows, `${rows.length} fotografia(s) adicionada(s) com sucesso.`);
  })
);
galleriesAdminRouter.post(
  "/:galleryId/images/reorder",
  validate(reorderImagesSchema),
  asyncHandler(async (req, res) => {
    await prisma.$transaction(
      req.body.order.map((item: { id: string; order: number }) => prisma.galleryImage.update({ where: { id: item.id }, data: { order: item.order } }))
    );
    await recordAudit({ req, action: "REORDER", module: "galleries", entity: "GalleryImage", entityId: "bulk" });
    ok(res, null, "Ordem das fotografias actualizada com sucesso.");
  })
);
galleriesAdminRouter.patch(
  "/images/:id",
  validate(imageSchema.partial()),
  asyncHandler(async (req, res) => {
    const image = await prisma.galleryImage.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ req, action: "UPDATE", module: "galleries", entity: "GalleryImage", entityId: image.id });
    ok(res, image, "Fotografia actualizada com sucesso.");
  })
);
galleriesAdminRouter.delete(
  "/images/:id",
  asyncHandler(async (req, res) => {
    const image = await prisma.galleryImage.findUnique({ where: { id: req.params.id } });
    if (!image) throw AppError.notFound("Fotografia não encontrada.");
    const gallery = await prisma.gallery.findUnique({ where: { id: image.galleryId } });

    await prisma.galleryImage.delete({ where: { id: req.params.id } });

    // Never leave the gallery pointing at a cover that no longer exists.
    if (gallery?.coverImage === image.imageUrl) {
      const nextCover = await prisma.galleryImage.findFirst({
        where: { galleryId: image.galleryId, id: { not: image.id } },
        orderBy: { order: "asc" },
      });
      if (nextCover) await prisma.gallery.update({ where: { id: image.galleryId }, data: { coverImage: nextCover.imageUrl } });
    }

    await recordAudit({ req, action: "DELETE", module: "galleries", entity: "GalleryImage", entityId: req.params.id });
    ok(res, null, "Fotografia removida com sucesso.");
  })
);
