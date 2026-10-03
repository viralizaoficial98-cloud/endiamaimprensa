import cron from "node-cron";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";
import { sendMail } from "../modules/notifications/mailer";

async function publishScheduledNews() {
  const due = await prisma.news.findMany({ where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } } });
  for (const news of due) {
    await prisma.news.update({ where: { id: news.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    await prisma.auditLog.create({ data: { action: "PUBLISH_SCHEDULED", module: "news", entity: "News", entityId: news.id } });
    logger.info({ newsId: news.id, title: news.title }, "[cron] Notícia agendada publicada automaticamente");
  }
}

async function deactivateExpiredBanners() {
  const result = await prisma.banner.updateMany({
    where: { status: "ACTIVE", endsAt: { lt: new Date() } },
    data: { status: "INACTIVE" },
  });
  if (result.count > 0) logger.info({ count: result.count }, "[cron] Banners expirados desactivados");
}

async function updateEventStatuses() {
  const now = new Date();
  const toOngoing = await prisma.event.updateMany({
    where: { status: "UPCOMING", startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] },
    data: { status: "ONGOING" },
  });
  const toFinished = await prisma.event.updateMany({
    where: { status: { in: ["UPCOMING", "ONGOING"] }, OR: [{ endDate: { lt: now } }, { AND: [{ endDate: null }, { startDate: { lt: now } }] }] },
    data: { status: "FINISHED" },
  });
  if (toOngoing.count > 0 || toFinished.count > 0) {
    logger.info({ toOngoing: toOngoing.count, toFinished: toFinished.count }, "[cron] Estados de eventos actualizados");
  }
}

async function sendScheduledNewsletterCampaigns() {
  const due = await prisma.newsletterCampaign.findMany({ where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } } });
  for (const campaign of due) {
    const subscribers = await prisma.newsletterSubscriber.findMany({ where: { status: "CONFIRMED" } });
    for (const subscriber of subscribers) {
      await sendMail({ to: subscriber.email, subject: campaign.subject, html: campaign.content });
    }
    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: { status: "SENT", sentAt: new Date(), recipientsCount: subscribers.length },
    });
    logger.info({ campaignId: campaign.id }, "[cron] Campanha de newsletter agendada enviada");
  }
}

async function cleanupExpiredTokens() {
  const now = new Date();
  const [resetTokens, refreshTokens] = await Promise.all([
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.refreshToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: new Date(now.getTime() - 7 * 86_400_000) } }] } }),
  ]);
  if (resetTokens.count > 0 || refreshTokens.count > 0) {
    logger.info({ resetTokens: resetTokens.count, refreshTokens: refreshTokens.count }, "[cron] Tokens expirados removidos");
  }
}

async function archiveOldNotifications() {
  const cutoff = new Date(Date.now() - 90 * 86_400_000);
  const result = await prisma.notification.deleteMany({ where: { isRead: true, createdAt: { lt: cutoff } } });
  if (result.count > 0) logger.info({ count: result.count }, "[cron] Notificações antigas arquivadas/removidas");
}

async function runFrequentJobs() {
  await Promise.all([publishScheduledNews(), deactivateExpiredBanners(), updateEventStatuses(), sendScheduledNewsletterCampaigns()]);
}

async function runHourlyJobs() {
  await Promise.all([cleanupExpiredTokens(), archiveOldNotifications()]);
}

export function startScheduledJobs(): void {
  // Every minute: time-sensitive publication/activation checks.
  cron.schedule("* * * * *", () => {
    runFrequentJobs().catch((err) => logger.error({ err }, "[cron] Erro ao executar tarefas agendadas frequentes"));
  });

  // Every hour: housekeeping.
  cron.schedule("0 * * * *", () => {
    runHourlyJobs().catch((err) => logger.error({ err }, "[cron] Erro ao executar tarefas agendadas horárias"));
  });

  logger.info("Agendador de tarefas (cron) iniciado.");
}
