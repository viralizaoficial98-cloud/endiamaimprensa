import type { Interview } from "@/domain/entities";
import { repositories } from "@/infrastructure/di";

export function getLatestInterviews(limit?: number): Promise<Interview[]> {
  return repositories.interview.getLatest(limit);
}

export function getInterviewBySlug(slug: string): Promise<Interview | null> {
  return repositories.interview.getBySlug(slug);
}
