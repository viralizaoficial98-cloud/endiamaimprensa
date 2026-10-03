export interface GalleryItemCategoryRef {
  id: string;
  name: string;
  slug: string;
}

/** One photo inside an album — never rendered as its own standalone card;
 * only ever accessed via a GalleryAlbum's `photos` array. */
export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  altText: string;
  order: number;
}

/** The card-level shape — what "Galeria Premium" and the homepage teaser render.
 * One card = one album; the photo count is a real, server-computed number,
 * never a manually-entered field. */
export interface GalleryAlbumSummary {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage: string;
  category: GalleryItemCategoryRef;
  subcategory?: GalleryItemCategoryRef;
  /** Editorial/original date of the album (never the migration/createdAt date). */
  eventDate: string;
  photoCount: number;
}

export interface GalleryAlbum extends GalleryAlbumSummary {
  photos: GalleryPhoto[];
}
