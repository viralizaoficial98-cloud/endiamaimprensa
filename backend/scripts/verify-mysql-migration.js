/** Phase 8 validation: compares every table's row count between the original
 * PostgreSQL backup snapshot and the live MySQL database, then spot-checks
 * relational integrity (every FK on the MySQL side actually resolves). */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const backupPath = path.join(__dirname, "..", "migration-backup", "postgres-export.json");
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));

  console.log("Tabela".padEnd(25) + "PostgreSQL".padEnd(12) + "MySQL".padEnd(10) + "Resultado");
  console.log("-".repeat(60));

  let allOk = true;
  for (const model of Object.keys(backup.tables)) {
    const pgCount = backup.tables[model].length;
    const myCount = await prisma[model].count();
    const ok = pgCount === myCount;
    if (!ok) allOk = false;
    console.log(model.padEnd(25) + String(pgCount).padEnd(12) + String(myCount).padEnd(10) + (ok ? "OK" : "DIVERGENTE"));
  }

  const pgRp = backup.rolePermissions.length;
  const myRp = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as c FROM _RolePermissions"))[0].c;
  const rpOk = pgRp === Number(myRp);
  if (!rpOk) allOk = false;
  console.log("_RolePermissions".padEnd(25) + String(pgRp).padEnd(12) + String(myRp).padEnd(10) + (rpOk ? "OK" : "DIVERGENTE"));

  console.log("\n--- Integridade referencial (amostras) ---");
  const checks = [
    { name: "news.categoryId -> category", fn: async () => {
      const rows = await prisma.news.findMany({ select: { id: true, categoryId: true } });
      const catIds = new Set((await prisma.category.findMany({ select: { id: true } })).map((c) => c.id));
      return rows.every((r) => catIds.has(r.categoryId));
    }},
    { name: "news.authorId -> user", fn: async () => {
      const rows = await prisma.news.findMany({ select: { id: true, authorId: true } });
      const userIds = new Set((await prisma.user.findMany({ select: { id: true } })).map((u) => u.id));
      return rows.every((r) => userIds.has(r.authorId));
    }},
    { name: "galleryImage.galleryId -> gallery", fn: async () => {
      const rows = await prisma.galleryImage.findMany({ select: { galleryId: true } });
      const ids = new Set((await prisma.gallery.findMany({ select: { id: true } })).map((g) => g.id));
      return rows.every((r) => ids.has(r.galleryId));
    }},
    { name: "user.roleId -> role", fn: async () => {
      const rows = await prisma.user.findMany({ select: { roleId: true } });
      const ids = new Set((await prisma.role.findMany({ select: { id: true } })).map((r) => r.id));
      return rows.every((r) => ids.has(r.roleId));
    }},
    { name: "newsVersion.newsId -> news", fn: async () => {
      const rows = await prisma.newsVersion.findMany({ select: { newsId: true } });
      const ids = new Set((await prisma.news.findMany({ select: { id: true } })).map((n) => n.id));
      return rows.every((r) => ids.has(r.newsId));
    }},
    { name: "latestNewsItem.configId/newsId -> latestNewsConfig/news", fn: async () => {
      const rows = await prisma.latestNewsItem.findMany({ select: { configId: true, newsId: true } });
      const configIds = new Set((await prisma.latestNewsConfig.findMany({ select: { id: true } })).map((c) => c.id));
      const newsIds = new Set((await prisma.news.findMany({ select: { id: true } })).map((n) => n.id));
      return rows.every((r) => configIds.has(r.configId) && newsIds.has(r.newsId));
    }},
  ];

  for (const check of checks) {
    const ok = await check.fn();
    if (!ok) allOk = false;
    console.log(`${ok ? "OK " : "FAIL"} — ${check.name}`);
  }

  console.log("\n--- Amostra de hash de password (preservação de credenciais) ---");
  const users = await prisma.user.findMany({ select: { email: true, passwordHash: true } });
  for (const u of users) {
    console.log(`${u.email}: ${u.passwordHash.slice(0, 20)}... (${u.passwordHash.length} chars)`);
  }

  console.log(allOk ? "\n✓ VALIDAÇÃO COMPLETA — todas as tabelas e integridade referencial OK." : "\n✗ DIVERGÊNCIAS ENCONTRADAS — ver acima.");
  process.exitCode = allOk ? 0 : 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
