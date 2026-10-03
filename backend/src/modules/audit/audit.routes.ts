import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../common/async-handler";
import { okPaginated } from "../../common/api-response";
import { parseListQuery } from "../../common/list-query";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";

export const auditRouter = Router();
auditRouter.use(authenticate, authorize("audit.view"));

auditRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req);
    const where = {
      ...(req.query.module ? { module: String(req.query.module) } : {}),
      ...(req.query.action ? { action: String(req.query.action) } : {}),
      ...(req.query.userId ? { userId: String(req.query.userId) } : {}),
      ...(query.dateFrom || query.dateTo
        ? { createdAt: { ...(query.dateFrom ? { gte: query.dateFrom } : {}), ...(query.dateTo ? { lte: query.dateTo } : {}) } }
        : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
      }),
    ]);
    okPaginated(res, rows, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
      hasNextPage: query.skip + query.limit < total,
      hasPreviousPage: query.page > 1,
    });
  })
);
