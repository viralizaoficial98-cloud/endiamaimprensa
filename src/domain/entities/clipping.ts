import type { Category } from "./category";

export type ClippingMediaType = "IMPRENSA_ESCRITA" | "TELEVISAO" | "RADIO" | "PORTAL_DIGITAL" | "PUBLICACAO_ONLINE";

export interface Clipping {
  id: string;
  title: string;
  source: string;
  clippingDate: string;
  mediaType: ClippingMediaType;
  category: Category | null;
  description: string | null;
  url: string | null;
  documentUrl: string | null;
  imageUrl: string | null;
}
