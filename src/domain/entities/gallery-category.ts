export interface GallerySubcategory {
  id: string;
  name: string;
  slug: string;
}

export interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  subcategories: GallerySubcategory[];
}
