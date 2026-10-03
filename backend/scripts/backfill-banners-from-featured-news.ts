/**
 * The public Hero now reads from the Banner table first (falling back to
 * isFeatured news only when there are no active banners — see the hybrid
 * approach chosen for this feature). Without this backfill, switching over
 * would instantly hide the 9 real published articles currently driving the
 * Hero and show only the 3 old, disconnected institutional banners instead.
 *
 * This copies each currently-featured published article into its own real
 * Banner row — title/subtitle/image copied once as an editorial snapshot,
 * `newsId` kept so the CTA still points at the real article and the two
 * stay traceably linked. The News rows themselves are never modified.
 * Idempotent — skipped if a banner already links to that newsId.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const featured = await prisma.news.findMany({
    where: { isFeatured: true, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  const maxOrder = await prisma.banner.aggregate({ _max: { order: true } });
  let nextOrder = (maxOrder._max.order ?? -1) + 1;

  for (const news of featured) {
    const existing = await prisma.banner.findFirst({ where: { newsId: news.id } });
    if (existing) {
      console.log(`Já existe banner para: ${news.title}`);
      continue;
    }

    await prisma.banner.create({
      data: {
        title: news.title,
        subtitle: news.subtitle ?? undefined,
        description: news.excerpt,
        image: news.coverImage,
        imageAlt: news.coverImageAlt ?? news.title,
        categoryId: news.categoryId,
        newsId: news.id,
        buttonText: "Ler Notícia",
        buttonUrl: `/noticia/${news.slug}`,
        order: nextOrder,
        status: "ACTIVE",
      },
    });
    console.log(`Criado banner para: ${news.title} (ordem ${nextOrder})`);
    nextOrder += 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
