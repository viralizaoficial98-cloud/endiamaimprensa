import type { NewsComment } from "../entities/comment";

export interface CommentRepository {
  getByNewsId(newsId: string): Promise<NewsComment[]>;
  create(newsId: string, input: { content: string; guestName: string }): Promise<void>;
}
