import type { GalleryAlbum, GalleryAlbumSummary, GalleryCategory } from "@/domain/entities";
import type { GalleryListParams } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { repositories } from "@/infrastructure/di";

export function getGalleryCategories(): Promise<GalleryCategory[]> {
  return repositories.gallery.listCategories();
}

export function listGalleryAlbums(params?: GalleryListParams): Promise<Paginated<GalleryAlbumSummary>> {
  return repositories.gallery.listAlbums(params);
}

export function getGalleryAlbumsPreview(limit?: number): Promise<GalleryAlbumSummary[]> {
  return repositories.gallery.getAlbumsPreview(limit);
}

export function getGalleryAlbumBySlug(slug: string): Promise<GalleryAlbum | null> {
  return repositories.gallery.getAlbumBySlug(slug);
}
