import { Router } from "express";
import { asyncHandler } from "../../common/async-handler";
import { ok } from "../../common/api-response";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import * as analyticsService from "./analytics.service";

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, authorize("reports.view"));

analyticsRouter.get("/summary", asyncHandler(async (_req, res) => ok(res, await analyticsService.dashboardSummary())));
analyticsRouter.get("/views", asyncHandler(async (req, res) => ok(res, await analyticsService.viewsOverTime(Number(req.query.days) || undefined))));
analyticsRouter.get("/top-news", asyncHandler(async (req, res) => ok(res, await analyticsService.topNews(Number(req.query.limit) || undefined))));
analyticsRouter.get("/categories", asyncHandler(async (_req, res) => ok(res, await analyticsService.categoriesBreakdown())));
analyticsRouter.get("/authors", asyncHandler(async (_req, res) => ok(res, await analyticsService.authorsBreakdown())));
analyticsRouter.get("/traffic", asyncHandler(async (_req, res) => ok(res, await analyticsService.trafficBreakdown())));
