export interface NewsComment {
  id: string;
  newsId: string;
  authorName: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
  likes: number;
}
