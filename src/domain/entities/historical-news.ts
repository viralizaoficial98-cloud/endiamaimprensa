export interface HistoricalNewsImage {
  url: string;
  alt: string;
}

/** A news item read live from the old WordPress archive (category "news"),
 * never stored in our own database — see ApiHistoricalNewsRepository. */
export interface HistoricalNews {
  id: number;
  title: string;
  excerpt: string;
  publishedAt: string;
  sourceUrl: string;
  image: HistoricalNewsImage | null;
}
