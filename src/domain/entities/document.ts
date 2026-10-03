import type { Category } from "./category";

export type DocumentFileType = "PDF" | "DOCX" | "XLSX" | "PPTX" | "ZIP" | "OTHER";

export interface EndiamaDocument {
  id: string;
  title: string;
  description: string;
  category: Category | null;
  fileType: DocumentFileType;
  fileSizeKB: number;
  documentDate: string | null;
  publishedAt: string;
  downloadUrl: string;
}
