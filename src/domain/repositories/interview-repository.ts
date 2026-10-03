import type { Interview } from "../entities/interview";

export interface InterviewRepository {
  getLatest(limit?: number): Promise<Interview[]>;
  getBySlug(slug: string): Promise<Interview | null>;
}
