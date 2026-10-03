import type { Category } from "./category";
import type { Tag } from "./tag";

export type BannerTextPosition = "LEFT" | "CENTER" | "RIGHT";

export interface EndiamaBanner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  imageAlt: string;
  mobileImage?: string;
  videoUrl?: string;
  category?: Category;
  relatedNews?: { id: string; slug: string; title: string };
  tags: Tag[];
  buttonText?: string;
  buttonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  overlayOpacity: number;
  textPosition: BannerTextPosition;
  order: number;
}

/**
 * Data-source-agnostic shape the public Hero renders — built from either an
 * active Banner or (as a fallback, when no banner is active) a featured News
 * article, so the slideshow component itself never needs to know which one
 * it's looking at. See src/app/page.tsx for the hybrid selection logic.
 */
export interface HeroSlide {
  id: string;
  categoryName?: string;
  title: string;
  excerpt?: string;
  coverImage: string;
  coverImageAlt: string;
  publishedAt?: string;
  readTimeMinutes?: number;
  isFeaturedBadge?: boolean;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}
