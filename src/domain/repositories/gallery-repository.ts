import type { GalleryCategory } from "../entities/gallery-category";
import type { GalleryAlbum, GalleryAlbumSummary } from "../entities/gallery-item";
import type { Paginated } from "../shared/pagination";

export interface GalleryListParams {
  page?: number;
  limit?: number;
  galleryCategory?: string;
  gallerySubcategory?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GalleryRepository {
  listCategories(): Promise<GalleryCategory[]>;
  listAlbums(params?: GalleryListParams): Promise<Paginated<GalleryAlbumSummary>>;
  getAlbumsPreview(limit?: number): Promise<GalleryAlbumSummary[]>;
  getAlbumBySlug(slug: string): Promise<GalleryAlbum | null>;
}
