import type { Category } from "./category";
import type { NewsBlock } from "./news";

export interface Interview {
  id: string;
  slug: string;
  title: string;
  intervieweeName: string;
  intervieweeRole: string;
  intervieweeCompany?: string;
  intervieweePhoto: string;
  excerpt: string;
  blocks: NewsBlock[];
  coverImage: string;
  category: Category;
  interviewerName?: string;
  videoUrl?: string;
  audioUrl?: string;
  publishedAt: string;
}
