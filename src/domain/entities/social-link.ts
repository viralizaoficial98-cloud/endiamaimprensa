export type SocialPlatform = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "YOUTUBE" | "TWITTER" | "TIKTOK" | "WHATSAPP";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
}
