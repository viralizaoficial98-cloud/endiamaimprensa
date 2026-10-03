import type { EndiamaEvent } from "@/domain/entities";
import { repositories } from "@/infrastructure/di";

export function getUpcomingEvents(limit?: number): Promise<EndiamaEvent[]> {
  return repositories.event.getUpcoming(limit);
}

/** Concluded/cancelled events — kept off the homepage, shown only in the /eventos archive (see item 5 of the events brief). */
export function getArchivedEvents(limit?: number): Promise<EndiamaEvent[]> {
  return repositories.event.getArchive(limit);
}

export function getEventBySlug(slug: string): Promise<EndiamaEvent | null> {
  return repositories.event.getBySlug(slug);
}
