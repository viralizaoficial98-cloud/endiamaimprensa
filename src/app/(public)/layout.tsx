import { getLocale } from "next-intl/server";
import { getAllCategories } from "@/application/use-cases/category-use-cases";
import { getSocialLinks } from "@/application/use-cases/social-link-use-cases";
import { MiniPlayer } from "@/presentation/components/audio/mini-player";
import { BackToTop } from "@/presentation/components/layout/back-to-top";
import { Footer } from "@/presentation/components/layout/footer";
import { Header } from "@/presentation/components/layout/header";
import { AudioPlayerProvider } from "@/presentation/providers/audio-player-provider";
import { SmoothScrollProvider } from "@/presentation/providers/smooth-scroll-provider";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const [categories, socialLinks] = await Promise.all([
    getAllCategories(locale).catch(() => []),
    getSocialLinks().catch(() => []),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <SmoothScrollProvider>
        <AudioPlayerProvider>
          <Header categories={categories} socialLinks={socialLinks} />
          <main className="flex-1">{children}</main>
          <Footer />
          <BackToTop />
          <MiniPlayer />
        </AudioPlayerProvider>
      </SmoothScrollProvider>
    </div>
  );
}
