import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { ok, okPaginated } from "../../common/api-response";
import { AppError } from "../../common/app-error";
import { parseListQuery } from "../../common/list-query";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { optionalAuthenticate } from "../../guards/authenticate";
import { validate } from "../../middleware/validate";
import { sanitizePlainText } from "../../utils/sanitize";
import { recordAudit } from "../audit/audit.service";
import { notifyUsersWithPermission } from "../notifications/notifications.service";

const createCommentSchema = z.object({
  content: z.string().min(2, "O comentário não pode estar vazio."),
  parentId: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
});

export const commentsPublicRouter = Router();

commentsPublicRouter.get(
  "/news/:newsId",
  asyncHandler(async (req, res) => {
    const comments = await prisma.comment.findMany({
      where: { newsId: req.params.newsId, status: "APPROVED", parentId: null },
      include: { replies: { where: { status: "APPROVED" } }, user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });
    ok(res, comments);
  })
);

commentsPublicRouter.post(
  "/news/:newsId",
  optionalAuthenticate,
  validate(createCommentSchema),
  asyncHandler(async (req, res) => {
    const news = await prisma.news.findUnique({ where: { id: req.params.newsId } });
    if (!news) throw AppError.notFound("Notícia não encontrada.");
    if (!news.allowComments) throw AppError.forbidden("Os comentários estão desactivados para esta notícia.");
    if (!req.user && !req.body.guestName) throw AppError.badRequest("Indique o seu nome para comentar.");

    const comment = await prisma.comment.create({
      data: {
        newsId: req.params.newsId,
        parentId: req.body.parentId,
        userId: req.user?.id,
        guestName: req.user ? undefined : req.body.guestName,
        guestEmail: req.user ? undefined : req.body.guestEmail,
        content: sanitizePlainText(req.body.content),
        status: "PENDING",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });
    await notifyUsersWithPermission(
      ["comments.moderate"],
      "Novo comentário para moderar",
      `Um novo comentário foi submetido em "${news.title}".`,
      `/admin/comments`
    );
    ok(res, comment, "Comentário enviado. Será publicado após moderação.", 201);
  })
);

export const commentsAdminRouter = Router();
commentsAdminRouter.use(authenticate, authorize("comments.moderate"));

commentsAdminRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req);
    const where = query.status ? { status: query.status as never } : {};
    const [total, rows] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        include: { news: { select: { id: true, title: true, slug: true } }, user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
      }),
    ]);
    okPaginated(res, rows, { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1, hasNextPage: query.skip + query.limit < total, hasPreviousPage: query.page > 1 });
  })
);

commentsAdminRouter.post(
  "/:id/approve",
  asyncHandler(async (req, res) => {
    const comment = await prisma.comment.update({ where: { id: req.params.id }, data: { status: "APPROVED" } });
    await recordAudit({ req, action: "APPROVE", module: "comments", entity: "Comment", entityId: comment.id });
    ok(res, comment, "Comentário aprovado.");
  })
);
commentsAdminRouter.post(
  "/:id/reject",
  asyncHandler(async (req, res) => {
    const comment = await prisma.comment.update({ where: { id: req.params.id }, data: { status: "REJECTED" } });
    await recordAudit({ req, action: "REJECT", module: "comments", entity: "Comment", entityId: comment.id });
    ok(res, comment, "Comentário rejeitado.");
  })
);
commentsAdminRouter.post(
  "/:id/spam",
  asyncHandler(async (req, res) => {
    const comment = await prisma.comment.update({ where: { id: req.params.id }, data: { status: "SPAM" } });
    await recordAudit({ req, action: "MARK_SPAM", module: "comments", entity: "Comment", entityId: comment.id });
    ok(res, comment, "Comentário marcado como spam.");
  })
);
commentsAdminRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.comment.delete({ where: { id: req.params.id } });
    await recordAudit({ req, action: "DELETE", module: "comments", entity: "Comment", entityId: req.params.id });
    ok(res, null, "Comentário removido com sucesso.");
  })
);
