/**
 * One-time backup/export of every table in the live PostgreSQL database to a
 * single JSON file — serves two purposes:
 *   1. A safety backup of the original data before the MySQL migration touches
 *      anything (the PostgreSQL database itself is never modified).
 *   2. The exact data source the MySQL import script (import-mysql-data.js)
 *      reads from, so both runs are reproducible from this one snapshot.
 *
 * Must be run BEFORE schema.prisma's datasource provider is switched to
 * "mysql" (it needs the Postgres-generated Prisma Client).
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Every Prisma model accessor, in the exact order the MySQL import must
// insert them (parents before children, so foreign keys always resolve).
const MODEL_ORDER = [
  "role",
  "permission",
  "user",
  "refreshToken",
  "passwordResetToken",
  "category",
  "tag",
  "galleryCategory",
  "gallerySubcategory",
  "event",
  "menu",
  "menuItem",
  "podcast",
  "podcastEpisode",
  "news",
  "newsTag",
  "newsVersion",
  "comment",
  "latestNewsConfig",
  "latestNewsItem",
  "banner",
  "bannerTag",
  "video",
  "audio",
  "gallery",
  "galleryImage",
  "interview",
  "document",
  "clipping",
  "newsletterSubscriber",
  "newsletterCampaign",
  "newsletterCampaignNews",
  "setting",
  "socialLink",
  "partner",
  "advertisement",
  "contentView",
  "bookmark",
  "reaction",
  "auditLog",
  "notification",
];

async function main() {
  const out = { exportedAt: new Date().toISOString(), tables: {} };

  for (const model of MODEL_ORDER) {
    const rows = await prisma[model].findMany();
    out.tables[model] = rows;
    console.log(`${model.padEnd(25)} ${rows.length} linhas`);
  }

  // Implicit many-to-many join table (Role <-> Permission) — not a Prisma
  // model accessor, read via raw SQL.
  const rolePermissions = await prisma.$queryRawUnsafe('SELECT "A", "B" FROM "_RolePermissions"');
  out.rolePermissions = rolePermissions;
  console.log(`_RolePermissions`.padEnd(25) + ` ${rolePermissions.length} linhas`);

  const outDir = path.join(__dirname, "..", "migration-backup");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "postgres-export.json");
  fs.writeFileSync(outFile, JSON.stringify(out, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
  console.log(`\nBackup escrito em: ${outFile}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
