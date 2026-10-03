import type { News } from "./news";

export interface LatestNewsSectionData {
  title: string;
  subtitle: string;
  showSection: boolean;
  showBreakingBar: boolean;
  showViewAll: boolean;
  viewAllLabel: string;
  main: News | null;
  secondary: News[];
  breaking: News | null;
}
