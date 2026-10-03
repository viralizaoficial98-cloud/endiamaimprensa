/**
 * Single composition point for repository implementations.
 * Etapa 4 (integração com API/BD real) só precisa de trocar as classes
 * importadas aqui — domain, application e presentation não mudam.
 */
import { ApiAudioRepository } from "./api/repositories/api-audio-repository";
import { ApiBannerRepository } from "./api/repositories/api-banner-repository";
import { ApiCategoryRepository } from "./api/repositories/api-category-repository";
import { ApiClippingRepository } from "./api/repositories/api-clipping-repository";
import { ApiCommentRepository } from "./api/repositories/api-comment-repository";
import { ApiDocumentRepository } from "./api/repositories/api-document-repository";
import { ApiEventRepository } from "./api/repositories/api-event-repository";
import { ApiGalleryRepository } from "./api/repositories/api-gallery-repository";
import { ApiInterviewRepository } from "./api/repositories/api-interview-repository";
import { ApiLatestNewsRepository } from "./api/repositories/api-latest-news-repository";
import { ApiNewsRepository } from "./api/repositories/api-news-repository";
import { ApiPartnerRepository } from "./api/repositories/api-partner-repository";
import { ApiSocialLinkRepository } from "./api/repositories/api-social-link-repository";
import { ApiVideoRepository } from "./api/repositories/api-video-repository";

export const repositories = {
  news: new ApiNewsRepository(),
  video: new ApiVideoRepository(),
  audio: new ApiAudioRepository(),
  banner: new ApiBannerRepository(),
  latestNews: new ApiLatestNewsRepository(),
  gallery: new ApiGalleryRepository(),
  event: new ApiEventRepository(),
  interview: new ApiInterviewRepository(),
  document: new ApiDocumentRepository(),
  clipping: new ApiClippingRepository(),
  partner: new ApiPartnerRepository(),
  category: new ApiCategoryRepository(),
  comment: new ApiCommentRepository(),
  socialLink: new ApiSocialLinkRepository(),
};
