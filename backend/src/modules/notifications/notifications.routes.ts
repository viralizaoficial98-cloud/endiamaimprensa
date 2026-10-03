import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { ok } from "../../common/api-response";
import { authenticate } from "../../guards/authenticate";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    ok(res, notifications);
  })
);

notificationsRouter.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });
    ok(res, notification);
  })
);

notificationsRouter.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true, readAt: new Date() } });
    ok(res, null, "Todas as notificações foram marcadas como lidas.");
  })
);
