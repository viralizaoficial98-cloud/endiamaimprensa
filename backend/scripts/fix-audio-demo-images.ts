/**
 * The demo audio "Declaração do Presidente do Conselho de Administração..."
 * and the SODIAM commercial-director interview were seeded with generic
 * stock portrait photos (portrait-man-02.jpg / portrait-woman-02.jpg) — that
 * reads as "this specific photographed person is the real PCA / director",
 * which is exactly the kind of real-identity misattribution the brief flags.
 * Swap them for non-portrait, sector-appropriate institutional imagery until
 * official photography exists. Idempotent.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FIXES: Array<{ titleContains: string; coverImage: string }> = [
  { titleContains: "Presidente do Conselho de Administração", coverImage: "/images/fallbacks/mining-news-default.webp" },
  { titleContains: "Futuro da Comercialização de Diamantes Angolanos", coverImage: "/images/fallbacks/diamonds-default.webp" },
];

async function main() {
  for (const fix of FIXES) {
    const { count } = await prisma.audio.updateMany({
      where: { title: { contains: fix.titleContains } },
      data: { coverImage: fix.coverImage },
    });
    console.log(`Actualizados ${count} áudio(s) que contêm "${fix.titleContains}" -> ${fix.coverImage}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
