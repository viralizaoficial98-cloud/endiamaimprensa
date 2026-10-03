import type { EndiamaEvent } from "../entities/event";

export interface EventRepository {
  getUpcoming(limit?: number): Promise<EndiamaEvent[]>;
  getArchive(limit?: number): Promise<EndiamaEvent[]>;
  getBySlug(slug: string): Promise<EndiamaEvent | null>;
}
