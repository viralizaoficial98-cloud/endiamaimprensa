import type { Interview } from "@/domain/entities";
import type { InterviewRepository } from "@/domain/repositories";
import { apiGet } from "../http-client";
import type { InterviewDto } from "../dto";
import { mapInterview } from "../mappers";

export class ApiInterviewRepository implements InterviewRepository {
  async getLatest(limit = 4): Promise<Interview[]> {
    const data = await apiGet<InterviewDto[]>("/public/interviews");
    return data.slice(0, limit).map(mapInterview);
  }

  async getBySlug(slug: string): Promise<Interview | null> {
    try {
      const data = await apiGet<InterviewDto>(`/public/interviews/${slug}`);
      return mapInterview(data);
    } catch {
      return null;
    }
  }
}
