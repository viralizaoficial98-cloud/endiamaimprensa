import { z } from "zod";

export const updateConfigSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  showSection: z.boolean().optional(),
  showBreakingBar: z.boolean().optional(),
  showViewAll: z.boolean().optional(),
  viewAllLabel: z.string().min(1).optional(),
  breakingNewsId: z.string().nullable().optional(),
  breakingTitle: z.string().nullable().optional(),
  breakingActive: z.boolean().optional(),
  breakingStartsAt: z.string().datetime().nullable().optional(),
  breakingEndsAt: z.string().datetime().nullable().optional(),
  publishAt: z.string().datetime().nullable().optional(),
});

export const setItemSchema = z.object({
  newsId: z.string().min(1),
  position: z.enum(["MAIN", "SECONDARY"]),
  sortOrder: z.number().int().min(0).optional(),
});

export const setItemsSchema = z.object({
  items: z.array(setItemSchema).max(3),
});

export const reorderItemsSchema = z.object({
  order: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })),
});

export const toggleItemSchema = z.object({
  active: z.boolean(),
});
