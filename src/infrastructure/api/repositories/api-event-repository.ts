import type { EndiamaEvent } from "@/domain/entities";
import type { EventRepository } from "@/domain/repositories";
import { ApiError } from "../http-client";
import { apiGet, buildQuery } from "../http-client";
import type { EventDto } from "../dto";
import { mapEvent } from "../mappers";

export class ApiEventRepository implements EventRepository {
  async getUpcoming(limit = 4): Promise<EndiamaEvent[]> {
    const data = await apiGet<EventDto[]>(`/public/events${buildQuery({ limit })}`);
    return data.map(mapEvent);
  }

  async getArchive(limit = 12): Promise<EndiamaEvent[]> {
    const data = await apiGet<EventDto[]>(`/public/events${buildQuery({ limit, includePast: true })}`);
    return data.map(mapEvent);
  }

  async getBySlug(slug: string): Promise<EndiamaEvent | null> {
    try {
      const data = await apiGet<EventDto>(`/public/events/${slug}`);
      return mapEvent(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  }
}
