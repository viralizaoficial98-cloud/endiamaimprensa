import type { NewsComment } from "@/domain/entities";
import { repositories } from "@/infrastructure/di";

export function getCommentsByNewsId(newsId: string): Promise<NewsComment[]> {
  return repositories.comment.getByNewsId(newsId);
}

export function submitComment(newsId: string, input: { content: string; guestName: string }): Promise<void> {
  return repositories.comment.create(newsId, input);
}
