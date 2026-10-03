import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { created, ok, okPaginated } from "../../common/api-response";
import { AppError } from "../../common/app-error";
import { parseListQuery } from "../../common/list-query";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { validate } from "../../middleware/validate";
import { generateOpaqueToken } from "../auth/token.util";
import { recordAudit } from "../audit/audit.service";
import { sendMail } from "../notifications/mailer";

const subscribeSchema = z.object({ name: z.string().optional(), email: z.string().email() });

export const newsletterPublicRouter = Router();

newsletterPublicRouter.post(
  "/subscribe",
  validate(subscribeSchema),
  asyncHandler(async (req, res) => {
    const confirmationToken = generateOpaqueToken();
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: req.body.email },
      update: { name: req.body.name, status: "PENDING", confirmationToken, unsubscribedAt: null },
      create: { name: req.body.name, email: req.body.email, confirmationToken, status: "PENDING" },
    });
    await sendMail({
      to: subscriber.email,
      subject: "Confirme a sua subscrição — ENDIAMA Notícias",
      html: `<p>Obrigado por subscrever a newsletter da ENDIAMA. Código de confirmação: <strong>${confirmationToken}</strong></p>`,
    });
    created(res, { email: subscriber.email }, "Subscrição registada. Verifique o seu email para confirmar.");
  })
);

newsletterPublicRouter.get(
  "/confirm/:token",
  asyncHandler(async (req, res) => {
    const subscriber = await prisma.newsletterSubscriber.findFirst({ where: { confirmationToken: req.params.token } });
    if (!subscriber) throw AppError.badRequest("Token de confirmação inválido.");
    await prisma.newsletterSubscriber.update({ where: { id: subscriber.id }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
    ok(res, null, "Subscrição confirmada com sucesso.");
  })
);

newsletterPublicRouter.post(
  "/unsubscribe",
  validate(z.object({ email: z.string().email() })),
  asyncHandler(async (req, res) => {
    await prisma.newsletterSubscriber.updateMany({ where: { email: req.body.email }, data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() } });
    ok(res, null, "Subscrição cancelada com sucesso.");
  })
);

export const newsletterAdminRouter = Router();
newsletterAdminRouter.use(authenticate);

newsletterAdminRouter.get(
  "/subscribers",
  authorize("settings.manage", "reports.view"),
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req);
    const where = query.status ? { status: query.status as never } : {};
    const [total, rows] = await Promise.all([
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.skip, take: query.limit }),
    ]);
    okPaginated(res, rows, { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1, hasNextPage: query.skip + query.limit < total, hasPreviousPage: query.page > 1 });
  })
);

const campaignSchema = z.object({
  subject: z.string().min(2),
  title: z.string().min(2),
  content: z.string().min(2),
  scheduledAt: z.string().datetime().optional(),
  newsIds: z.array(z.string()).optional(),
});

newsletterAdminRouter.get(
  "/campaigns",
  authorize("settings.manage"),
  asyncHandler(async (_req, res) => ok(res, await prisma.newsletterCampaign.findMany({ orderBy: { createdAt: "desc" } })))
);
newsletterAdminRouter.post(
  "/campaigns",
  authorize("settings.manage"),
  validate(campaignSchema),
  asyncHandler(async (req, res) => {
    const campaign = await prisma.newsletterCampaign.create({
      data: {
        subject: req.body.subject,
        title: req.body.title,
        content: req.body.content,
        scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : null,
        status: req.body.scheduledAt ? "SCHEDULED" : "DRAFT",
        news: req.body.newsIds?.length
          ? { create: req.body.newsIds.map((newsId: string, order: number) => ({ newsId, order })) }
          : undefined,
      },
    });
    await recordAudit({ req, action: "CREATE", module: "newsletter", entity: "NewsletterCampaign", entityId: campaign.id });
    created(res, campaign, "Campanha criada com sucesso.");
  })
);
newsletterAdminRouter.post(
  "/campaigns/:id/send",
  authorize("settings.manage"),
  asyncHandler(async (req, res) => {
    const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) throw AppError.notFound("Campanha não encontrada.");
    const subscribers = await prisma.newsletterSubscriber.findMany({ where: { status: "CONFIRMED" } });
    for (const subscriber of subscribers) {
      await sendMail({ to: subscriber.email, subject: campaign.subject, html: campaign.content });
    }
    const updated = await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: { status: "SENT", sentAt: new Date(), recipientsCount: subscribers.length },
    });
    await recordAudit({ req, action: "SEND", module: "newsletter", entity: "NewsletterCampaign", entityId: campaign.id });
    ok(res, updated, "Campanha enviada com sucesso.");
  })
);
