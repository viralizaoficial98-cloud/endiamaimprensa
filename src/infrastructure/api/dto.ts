/** Minimal shapes returned by the ENDIAMA backend API — only the fields the frontend actually consumes. */

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
}

export interface AuthorDto {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  position: string | null;
  department: string | null;
}

export interface TagDto {
  id: string;
  slug: string;
  name: string;
}

export interface NewsBlockImageDto {
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
}

export interface NewsBlockDto {
  type: string;
  content?: string;
  caption?: string;
  alt?: string;
  title?: string;
  images?: NewsBlockImageDto[];
  videoType?: "UPLOAD" | "YOUTUBE" | "VIMEO" | "EXTERNAL";
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
}

export interface NewsDto {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  content: NewsBlockDto[];
  coverImage: string;
  coverImageAlt: string | null;
  category: CategoryDto;
  author: AuthorDto;
  publishedAt: string | null;
  updatedAt: string;
  readingTime: number;
  viewsCount: number;
  likesCount: number;
  tags: TagDto[];
  format: string;
  isBreaking: boolean;
  isFeatured: boolean;
}

export interface VideoDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail: string;
  videoUrl: string;
  videoType: "UPLOAD" | "YOUTUBE" | "VIMEO" | "EXTERNAL";
  duration: number;
  category: CategoryDto;
  publishedAt: string | null;
  viewsCount: number;
}

export interface GalleryImageDto {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  altText: string;
  order: number;
}

export interface GallerySubcategoryRefDto {
  id: string;
  name: string;
  slug: string;
}

export interface GalleryCategoryRefDto {
  id: string;
  name: string;
  slug: string;
}

export interface GalleryCategoryDto extends GalleryCategoryRefDto {
  subcategories: GallerySubcategoryRefDto[];
}

export interface GalleryDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string;
  galleryCategory: GalleryCategoryRefDto;
  gallerySubcategory: GallerySubcategoryRefDto | null;
  location: string | null;
  eventDate: string | null;
  images: GalleryImageDto[];
  createdAt: string;
}

/** Lean, card-shaped listing payload — the backend never sends the full
 * `images[]` array for a list request, only a count, so the "Galeria Premium"
 * grid stays fast no matter how many photos an album holds. */
export interface GalleryListItemDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string;
  galleryCategory: GalleryCategoryRefDto;
  gallerySubcategory: GallerySubcategoryRefDto | null;
  eventDate: string | null;
  createdAt: string;
  _count: { images: number };
}

export interface InterviewDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: NewsBlockDto[];
  intervieweeName: string;
  intervieweePosition: string | null;
  intervieweeCompany: string | null;
  intervieweePhoto: string | null;
  coverImage: string;
  category: CategoryDto | null;
  interviewer: { id: string; name: string } | null;
  videoUrl: string | null;
  audioUrl: string | null;
  publishedAt: string | null;
}

export interface EventDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string;
  location: string | null;
  address?: string | null;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  organizer?: string | null;
  registrationUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  capacity?: number | null;
  isFeatured?: boolean;
}

export interface BannerDto {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  imageAlt: string | null;
  mobileImage: string | null;
  videoUrl: string | null;
  category: CategoryDto | null;
  news: { id: string; slug: string; title: string } | null;
  tags: TagDto[];
  buttonText: string | null;
  buttonUrl: string | null;
  secondaryButtonText: string | null;
  secondaryButtonUrl: string | null;
  overlayOpacity: number;
  textPosition: "LEFT" | "CENTER" | "RIGHT";
  order: number;
  status?: "ACTIVE" | "INACTIVE";
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface LatestNewsSectionDto {
  title: string;
  subtitle: string;
  showSection: boolean;
  showBreakingBar: boolean;
  showViewAll: boolean;
  viewAllLabel: string;
  main: NewsDto | null;
  secondary: NewsDto[];
  breaking: NewsDto | null;
}

export interface AudioDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string;
  audioUrl: string;
  duration: number;
  category: CategoryDto | null;
  interviewee: string | null;
  location: string | null;
  event?: { id: string; title: string; slug: string } | null;
  isFeatured: boolean;
  publishedAt: string | null;
}

export interface DocumentDto {
  id: string;
  title: string;
  description: string | null;
  category: CategoryDto | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  documentDate: string | null;
  createdAt: string;
}

export interface ClippingDto {
  id: string;
  title: string;
  source: string;
  clippingDate: string;
  mediaType: string;
  category: CategoryDto | null;
  description: string | null;
  url: string | null;
  documentUrl: string | null;
  imageUrl: string | null;
}

export interface PartnerDto {
  id: string;
  name: string;
  logo: string;
  website: string | null;
  description?: string | null;
  order?: number;
}

export interface CommentDto {
  id: string;
  newsId: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null } | null;
  guestName: string | null;
}

export interface SocialLinkDto {
  id: string;
  platform: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "YOUTUBE" | "TWITTER" | "TIKTOK" | "WHATSAPP";
  url: string;
}
