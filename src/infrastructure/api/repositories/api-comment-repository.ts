import type { NewsComment } from "@/domain/entities";
import type { CommentRepository } from "@/domain/repositories";
import { apiGet, apiPost } from "../http-client";
import type { CommentDto } from "../dto";
import { mapComment } from "../mappers";

export class ApiCommentRepository implements CommentRepository {
  async getByNewsId(newsId: string): Promise<NewsComment[]> {
    const data = await apiGet<CommentDto[]>(`/public/comments/news/${newsId}`);
    return data.map(mapComment);
  }

  async create(newsId: string, input: { content: string; guestName: string }): Promise<void> {
    await apiPost<CommentDto>(`/public/comments/news/${newsId}`, input);
  }
}
