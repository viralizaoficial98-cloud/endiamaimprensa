import type { GalleryAlbum, GalleryAlbumSummary, GalleryCategory } from "@/domain/entities";
import type { GalleryListParams, GalleryRepository } from "@/domain/repositories";
import type { Paginated } from "@/domain/shared/pagination";
import { apiGet, apiGetPaginated, buildQuery } from "../http-client";
import type { GalleryCategoryDto, GalleryDto, GalleryListItemDto } from "../dto";
import { mapGalleryAlbum, mapGalleryAlbumSummary, mapGalleryCategory } from "../mappers";

export class ApiGalleryRepository implements GalleryRepository {
  async listCategories(): Promise<GalleryCategory[]> {
    const data = await apiGet<GalleryCategoryDto[]>("/public/gallery-categories");
    return data.map(mapGalleryCategory);
  }

  async listAlbums(params: GalleryListParams = {}): Promise<Paginated<GalleryAlbumSummary>> {
    const { data, pagination } = await apiGetPaginated<GalleryListItemDto>(
      `/public/galleries${buildQuery({
        page: params.page,
        limit: params.limit ?? 12,
        galleryCategory: params.galleryCategory,
        gallerySubcategory: params.gallerySubcategory,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      })}`
    );
    return { data: data.map(mapGalleryAlbumSummary), pagination };
  }

  async getAlbumsPreview(limit = 9): Promise<GalleryAlbumSummary[]> {
    const { data } = await this.listAlbums({ limit });
    return data;
  }

  async getAlbumBySlug(slug: string): Promise<GalleryAlbum | null> {
    try {
      const data = await apiGet<GalleryDto>(`/public/galleries/${slug}`);
      return mapGalleryAlbum(data);
    } catch {
      return null;
    }
  }
}
