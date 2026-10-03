/**
 * One-off data migration: remaps the legacy category taxonomy to the official
 * 14-category list requested in the "Sala de Imprensa" functional revision.
 * Renames preserve the category id (so existing News.categoryId etc. keep
 * pointing at the same row); merges reassign referencing rows before deleting
 * the obsolete category. Safe to re-run (idempotent).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RENAMES: Array<{ fromSlug: string; toSlug: string; toName: string }> = [
  { fromSlug: "endiama-mining", toSlug: "operacoes-mineiras", toName: "Operações Mineiras" },
  { fromSlug: "sodiam", toSlug: "grupo-endiama", toName: "Grupo ENDIAMA" },
  { fromSlug: "mercado-diamantifero", toSlug: "comercializacao", toName: "Comercialização" },
];

const MERGES: Array<{ fromSlug: string; intoSlug: string }> = [
  { fromSlug: "projectos-mineiros", intoSlug: "operacoes-mineiras" },
  { fromSlug: "economia", intoSlug: "comercializacao" },
  { fromSlug: "clinica-sagrada-esperanca", intoSlug: "responsabilidade-social" },
];

const NEW_CATEGORIES: Array<{ name: string; slug: string; description: string; color: string; order: number }> = [
  { name: "Multimédia", slug: "multimedia", description: "Conteúdos multimédia da ENDIAMA E.P.", color: "#16874C", order: 13 },
  { name: "Lapidação", slug: "lapidacao", description: "Lapidação e valorização do diamante angolano.", color: "#C9A24B", order: 14 },
  { name: "Ouro", slug: "ouro", description: "Exploração e mercado do ouro.", color: "#C9A24B", order: 15 },
  { name: "Diamante", slug: "diamante", description: "Notícias dedicadas ao diamante angolano.", color: "#0E6B3E", order: 16 },
];

async function renameCategories() {
  for (const rename of RENAMES) {
    const existing = await prisma.category.findUnique({ where: { slug: rename.fromSlug } });
    if (!existing) {
      console.log(`(skip) categoria "${rename.fromSlug}" não encontrada — já migrada?`);
      continue;
    }
    await prisma.category.update({
      where: { id: existing.id },
      data: { name: rename.toName, slug: rename.toSlug },
    });
    console.log(`✔ Renomeada "${rename.fromSlug}" → "${rename.toSlug}" (${rename.toName})`);
  }
}

async function mergeCategories() {
  for (const merge of MERGES) {
    const from = await prisma.category.findUnique({ where: { slug: merge.fromSlug } });
    if (!from) {
      console.log(`(skip) categoria "${merge.fromSlug}" não encontrada — já migrada?`);
      continue;
    }
    const into = await prisma.category.findUniqueOrThrow({ where: { slug: merge.intoSlug } });

    const [news, videos, podcasts, interviews, documents, banners, clippings] = await Promise.all([
      prisma.news.updateMany({ where: { categoryId: from.id }, data: { categoryId: into.id } }),
      prisma.video.updateMany({ where: { categoryId: from.id }, data: { categoryId: into.id } }),
      prisma.podcast.updateMany({ where: { categoryId: from.id }, data: { categoryId: into.id } }),
      prisma.interview.updateMany({ where: { categoryId: from.id }, data: { categoryId: into.id } }),
      prisma.document.updateMany({ where: { categoryId: from.id }, data: { categoryId: into.id } }),
      prisma.banner.updateMany({ where: { categoryId: from.id }, data: { categoryId: into.id } }),
      prisma.clipping.updateMany({ where: { categoryId: from.id }, data: { categoryId: into.id } }),
    ]);

    // Category.parentId also references categories — reparent any children before deleting.
    await prisma.category.updateMany({ where: { parentId: from.id }, data: { parentId: into.id } });

    await prisma.category.delete({ where: { id: from.id } });
    console.log(
      `✔ Fundida "${merge.fromSlug}" em "${merge.intoSlug}" — reatribuídos: ${news.count} notícias, ${videos.count} vídeos, ${podcasts.count} podcasts, ${interviews.count} entrevistas, ${documents.count} documentos, ${banners.count} banners, ${clippings.count} clippings.`,
    );
  }
}

async function createNewCategories() {
  for (const category of NEW_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { ...category, status: "ACTIVE" },
    });
  }
  console.log(`✔ ${NEW_CATEGORIES.length} novas categorias garantidas (Multimédia, Lapidação, Ouro, Diamante).`);
}

const FINAL_ORDER = [
  "institucional",
  "operacoes-mineiras",
  "comercializacao",
  "sustentabilidade",
  "responsabilidade-social",
  "grupo-endiama",
  "cultura",
  "multimedia",
  "desporto",
  "lapidacao",
  "tecnologia",
  "internacional",
  "ouro",
  "diamante",
];

async function fixOrder() {
  for (const [index, slug] of FINAL_ORDER.entries()) {
    await prisma.category.updateMany({ where: { slug }, data: { order: index } });
  }
  console.log("✔ Ordem final das categorias ajustada.");
}

async function main() {
  console.log("Iniciando migração de categorias para a lista oficial de 14…");
  await renameCategories();
  await mergeCategories();
  await createNewCategories();
  await fixOrder();

  const final = await prisma.category.findMany({ orderBy: { order: "asc" }, select: { name: true, slug: true } });
  console.log(`\nCategorias finais (${final.length}):`);
  for (const c of final) console.log(`  - ${c.name} (${c.slug})`);
}

main()
  .catch((err) => {
    console.error("Falha na migração de categorias:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
