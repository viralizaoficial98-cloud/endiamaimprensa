import type { Author, Category, Clipping, ClippingMediaType, EndiamaAudio, EndiamaBanner, EndiamaDocument, EndiamaEvent, GalleryAlbum, GalleryAlbumSummary, GalleryCategory, GalleryItemCategoryRef, GalleryPhoto, Interview, LatestNewsSectionData, News, NewsBlock, NewsComment, Partner, SocialLink, Tag, Video } from "@/domain/entities";
import { resolveMediaUrl, getCategoryFallback, INTERVIEW_PROFILE_FALLBACK } from "@/lib/media";
import { getPartnerInitials } from "@/lib/partner-initials";
import type {
  AudioDto,
  AuthorDto,
  BannerDto,
  CategoryDto,
  ClippingDto,
  CommentDto,
  DocumentDto,
  EventDto,
  GalleryCategoryDto,
  GalleryCategoryRefDto,
  GalleryDto,
  GalleryImageDto,
  GalleryListItemDto,
  InterviewDto,
  LatestNewsSectionDto,
  NewsBlockDto,
  NewsDto,
  PartnerDto,
  SocialLinkDto,
  TagDto,
  VideoDto,
} from "./dto";

/** Real local photograph used as a byline fallback when an author has no uploaded avatar — never an icon/illustration. */
const FALLBACK_AVATAR = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}`.replace(/\/api$/, "") + "/uploads/interviews/journalist-01.jpg";

const FALLBACK_CATEGORY: Category = {
  id: "institucional",
  slug: "institucional",
  name: "Institucional",
  description: "Comunicados e vida institucional da ENDIAMA.",
  accentColor: "#2FA968",
};

const SUPPORTED_BLOCK_TYPES = new Set<NewsBlock["type"]>(["paragraph", "heading", "quote", "image", "richtext", "gallery", "video", "audio"]);

export function mapCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    description: dto.description ?? undefined,
    accentColor: dto.color ?? undefined,
  };
}

export function mapAuthor(dto: AuthorDto): Author {
  return {
    id: dto.id,
    slug: dto.username,
    name: dto.name,
    role: dto.position ?? "Redacção ENDIAMA",
    avatarUrl: resolveMediaUrl(dto.avatar, FALLBACK_AVATAR),
    bio: dto.department ?? undefined,
  };
}

export function mapTag(dto: TagDto): Tag {
  return { id: dto.id, slug: dto.slug, name: dto.name };
}

function mapBlock(dto: NewsBlockDto): NewsBlock {
  const type = SUPPORTED_BLOCK_TYPES.has(dto.type as NewsBlock["type"]) ? (dto.type as NewsBlock["type"]) : "paragraph";
  return {
    type,
    content: dto.content,
    caption: dto.caption,
    alt: dto.alt,
    title: dto.title,
    images: dto.images,
    videoType: dto.videoType,
    videoUrl: dto.videoUrl,
    audioUrl: dto.audioUrl,
    thumbnailUrl: dto.thumbnailUrl,
  };
}

export function mapNews(dto: NewsDto): News {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    subtitle: dto.subtitle ?? undefined,
    excerpt: dto.excerpt,
    blocks: dto.content.map(mapBlock),
    coverImage: resolveMediaUrl(dto.coverImage, getCategoryFallback(dto.category?.slug)),
    coverImageAlt: dto.coverImageAlt ?? dto.title,
    category: mapCategory(dto.category),
    author: mapAuthor(dto.author),
    publishedAt: dto.publishedAt ?? dto.updatedAt,
    updatedAt: dto.updatedAt,
    readTimeMinutes: dto.readingTime,
    views: dto.viewsCount,
    likes: dto.likesCount,
    tags: dto.tags.map(mapTag),
    format: (["article", "infographic", "report", "international"] as const).includes(dto.format as News["format"]) ? (dto.format as News["format"]) : "article",
    isBreaking: dto.isBreaking,
    isFeatured: dto.isFeatured,
  };
}

export function mapLatestNewsSection(dto: LatestNewsSectionDto): LatestNewsSectionData {
  return {
    title: dto.title,
    subtitle: dto.subtitle,
    showSection: dto.showSection,
    showBreakingBar: dto.showBreakingBar,
    showViewAll: dto.showViewAll,
    viewAllLabel: dto.viewAllLabel,
    main: dto.main ? mapNews(dto.main) : null,
    secondary: dto.secondary.map(mapNews),
    breaking: dto.breaking ? mapNews(dto.breaking) : null,
  };
}

export function mapVideo(dto: VideoDto): Video {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.description ?? "",
    thumbnailUrl: resolveMediaUrl(dto.thumbnail, getCategoryFallback(dto.category?.slug)),
    videoUrl: dto.videoUrl,
    videoType: dto.videoType ?? "UPLOAD",
    durationSeconds: dto.duration,
    category: mapCategory(dto.category),
    publishedAt: dto.publishedAt ?? new Date().toISOString(),
    views: dto.viewsCount,
  };
}

export function mapBanner(dto: BannerDto): EndiamaBanner {
  return {
    id: dto.id,
    title: dto.title,
    subtitle: dto.subtitle ?? undefined,
    description: dto.description ?? undefined,
    image: resolveMediaUrl(dto.image),
    imageAlt: dto.imageAlt ?? dto.title,
    mobileImage: dto.mobileImage ? resolveMediaUrl(dto.mobileImage) : undefined,
    videoUrl: dto.videoUrl ?? undefined,
    category: dto.category ? mapCategory(dto.category) : undefined,
    relatedNews: dto.news ?? undefined,
    tags: dto.tags.map(mapTag),
    buttonText: dto.buttonText ?? undefined,
    buttonUrl: dto.buttonUrl ?? undefined,
    secondaryButtonText: dto.secondaryButtonText ?? undefined,
    secondaryButtonUrl: dto.secondaryButtonUrl ?? undefined,
    overlayOpacity: dto.overlayOpacity,
    textPosition: dto.textPosition,
    order: dto.order,
  };
}

export function mapAudio(dto: AudioDto): EndiamaAudio {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.description ?? "",
    coverImage: resolveMediaUrl(dto.coverImage, getCategoryFallback(dto.category?.slug)),
    audioUrl: dto.audioUrl,
    durationSeconds: dto.duration,
    category: dto.category ? mapCategory(dto.category) : null,
    interviewee: dto.interviewee ?? undefined,
    location: dto.location ?? undefined,
    relatedEvent: dto.event ?? undefined,
    isFeatured: dto.isFeatured,
    publishedAt: dto.publishedAt ?? new Date().toISOString(),
  };
}

export function mapGalleryCategory(dto: GalleryCategoryDto): GalleryCategory {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    subcategories: dto.subcategories.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
  };
}

function mapGalleryCategoryRef(dto: GalleryCategoryRefDto): GalleryItemCategoryRef {
  return { id: dto.id, name: dto.name, slug: dto.slug };
}

export function mapGalleryAlbumSummary(dto: GalleryListItemDto): GalleryAlbumSummary {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.description ?? undefined,
    coverImage: resolveMediaUrl(dto.coverImage, getCategoryFallback(dto.galleryCategory.slug)),
    category: mapGalleryCategoryRef(dto.galleryCategory),
    subcategory: dto.gallerySubcategory ? mapGalleryCategoryRef(dto.gallerySubcategory) : undefined,
    // Editorial date always wins; only pre-existing albums that never had one
    // fall back to their system creation date.
    eventDate: dto.eventDate ?? dto.createdAt,
    photoCount: dto._count.images,
  };
}

function mapGalleryPhoto(dto: GalleryImageDto): GalleryPhoto {
  return {
    id: dto.id,
    imageUrl: resolveMediaUrl(dto.imageUrl),
    thumbnailUrl: dto.thumbnailUrl ? resolveMediaUrl(dto.thumbnailUrl) : undefined,
    caption: dto.caption ?? undefined,
    altText: dto.altText,
    order: dto.order,
  };
}

export function mapGalleryAlbum(dto: GalleryDto): GalleryAlbum {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.description ?? undefined,
    coverImage: resolveMediaUrl(dto.coverImage, getCategoryFallback(dto.galleryCategory.slug)),
    category: mapGalleryCategoryRef(dto.galleryCategory),
    subcategory: dto.gallerySubcategory ? mapGalleryCategoryRef(dto.gallerySubcategory) : undefined,
    eventDate: dto.eventDate ?? dto.createdAt,
    photoCount: dto.images.length,
    photos: [...dto.images].sort((a, b) => a.order - b.order).map(mapGalleryPhoto),
  };
}

export function mapInterview(dto: InterviewDto): Interview {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    intervieweeName: dto.intervieweeName,
    intervieweeRole: dto.intervieweePosition ?? "",
    intervieweeCompany: dto.intervieweeCompany ?? undefined,
    intervieweePhoto: resolveMediaUrl(dto.intervieweePhoto, INTERVIEW_PROFILE_FALLBACK),
    excerpt: dto.excerpt,
    blocks: dto.content.map(mapBlock),
    coverImage: resolveMediaUrl(dto.coverImage, getCategoryFallback(dto.category?.slug)),
    category: dto.category ? mapCategory(dto.category) : FALLBACK_CATEGORY,
    interviewerName: dto.interviewer?.name ?? undefined,
    videoUrl: dto.videoUrl ?? undefined,
    audioUrl: dto.audioUrl ?? undefined,
    publishedAt: dto.publishedAt ?? new Date().toISOString(),
  };
}

const EVENT_STATUSES = new Set<EndiamaEvent["status"]>(["DRAFT", "UPCOMING", "ONGOING", "FINISHED", "CANCELLED"]);

export function mapEvent(dto: EventDto): EndiamaEvent {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.description ?? "",
    imageUrl: resolveMediaUrl(dto.coverImage),
    location: dto.location ?? "Luanda, Angola",
    address: dto.address ?? undefined,
    startsAt: dto.startDate,
    endsAt: dto.endDate ?? undefined,
    startTime: dto.startTime ?? undefined,
    endTime: dto.endTime ?? undefined,
    status: EVENT_STATUSES.has(dto.status as EndiamaEvent["status"]) ? (dto.status as EndiamaEvent["status"]) : "UPCOMING",
    organizer: dto.organizer ?? undefined,
    registrationUrl: dto.registrationUrl ?? undefined,
    contactEmail: dto.contactEmail ?? undefined,
    contactPhone: dto.contactPhone ?? undefined,
    capacity: dto.capacity ?? undefined,
    isFeatured: dto.isFeatured ?? false,
    category: FALLBACK_CATEGORY,
  };
}

export function mapDocument(dto: DocumentDto): EndiamaDocument {
  const fileType = (["PDF", "DOCX", "XLSX", "PPTX", "ZIP", "OTHER"] as const).includes(dto.fileType as EndiamaDocument["fileType"])
    ? (dto.fileType as EndiamaDocument["fileType"])
    : "PDF";
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? "",
    category: dto.category ? mapCategory(dto.category) : null,
    fileType,
    fileSizeKB: Math.round(dto.fileSize / 1024),
    documentDate: dto.documentDate,
    publishedAt: dto.createdAt,
    downloadUrl: dto.fileUrl,
  };
}

const CLIPPING_MEDIA_TYPES = new Set<ClippingMediaType>(["IMPRENSA_ESCRITA", "TELEVISAO", "RADIO", "PORTAL_DIGITAL", "PUBLICACAO_ONLINE"]);

export function mapClipping(dto: ClippingDto): Clipping {
  return {
    id: dto.id,
    title: dto.title,
    source: dto.source,
    clippingDate: dto.clippingDate,
    mediaType: CLIPPING_MEDIA_TYPES.has(dto.mediaType as ClippingMediaType) ? (dto.mediaType as ClippingMediaType) : "PORTAL_DIGITAL",
    category: dto.category ? mapCategory(dto.category) : null,
    description: dto.description,
    url: dto.url,
    documentUrl: dto.documentUrl,
    imageUrl: dto.imageUrl,
  };
}

/** A logo value that isn't a usable, distinct image (empty, or the placeholder token
 * used while the official logo hasn't been supplied yet) falls back to an initials badge
 * instead of rendering a broken or wrong-brand image — see PartnerCard. */
export function mapPartner(dto: PartnerDto): Partner {
  const hasLogo = Boolean(dto.logo) && dto.logo !== "PLACEHOLDER";
  return {
    id: dto.id,
    name: dto.name,
    logoUrl: hasLogo ? resolveMediaUrl(dto.logo) : "",
    initials: getPartnerInitials(dto.name),
    url: dto.website ?? "#",
    description: dto.description ?? undefined,
    order: dto.order ?? 0,
  };
}

export function mapComment(dto: CommentDto): NewsComment {
  return {
    id: dto.id,
    newsId: dto.newsId,
    authorName: dto.user?.name ?? dto.guestName ?? "Visitante",
    avatarUrl: resolveMediaUrl(dto.user?.avatar, FALLBACK_AVATAR),
    content: dto.content,
    createdAt: dto.createdAt,
    likes: 0,
  };
}

export function mapSocialLink(dto: SocialLinkDto): SocialLink {
  return { id: dto.id, platform: dto.platform, url: dto.url };
}
