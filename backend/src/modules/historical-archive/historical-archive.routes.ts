import { Router } from "express";
import { asyncHandler } from "../../common/async-handler";
import { buildPagination, okPaginated } from "../../common/api-response";
import { parseListQuery } from "../../common/list-query";
import { searchHistoricalArchive } from "./historical-archive.service";

export const historicalArchivePublicRouter = Router();

historicalArchivePublicRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = parseListQuery(req);
    const year = typeof req.query.year === "string" && req.query.year.trim() ? Number(req.query.year) : undefined;

    const { data, total } = await searchHistoricalArchive({
      page: query.page,
      limit: query.limit,
      search: query.search,
      year: year !== undefined && Number.isFinite(year) ? year : undefined,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    okPaginated(res, data, buildPagination(query.page, query.limit, total));
  })
);
