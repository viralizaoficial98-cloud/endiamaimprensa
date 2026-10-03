import type { Category } from "./category";

export type EventStatus = "DRAFT" | "UPCOMING" | "ONGOING" | "FINISHED" | "CANCELLED";

export interface EndiamaEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  address?: string;
  startsAt: string;
  endsAt?: string;
  startTime?: string;
  endTime?: string;
  status: EventStatus;
  organizer?: string;
  registrationUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  capacity?: number;
  isFeatured: boolean;
  category: Category;
}
