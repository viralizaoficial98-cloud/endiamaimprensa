/**
 * Loads migration-backup/postgres-export.json into the (now empty, freshly
 * migrated) MySQL/MariaDB database, preserving every original id, password
 * hash, timestamp, status and relationship exactly as exported.
 *
 * FOREIGN_KEY_CHECKS is disabled for the duration of the load so tables can be
 * inserted without hand-maintaining a perfect topological order across 40+
 * models — the source data already satisfies every constraint (it came from a
 * live, FK-enforced Postgres database), so this only avoids insert-order
 * errors; it does not relax what ends up stored. Re-enabled immediately after,
 * and followed by an explicit integrity re-check (see verify-mysql-migration.js).
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

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

// Fields Prisma returns as JS Date objects when read from Postgres but that
// must be re-hydrated from the JSON string form on the way back in.
function reviveDates(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)) {
      out[k] = new Date(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function main() {
  const backupPath = path.join(__dirname, "..", "migration-backup", "postgres-export.json");
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));

  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
  try {
    for (const model of MODEL_ORDER) {
      const rows = (backup.tables[model] || []).map(reviveDates);
      if (rows.length === 0) {
        console.log(`${model.padEnd(25)} 0 linhas (nada a importar)`);
        continue;
      }
      const result = await prisma[model].createMany({ data: rows, skipDuplicates: true });
      console.log(`${model.padEnd(25)} ${result.count} linhas importadas`);
    }

    const rp = backup.rolePermissions || [];
    if (rp.length > 0) {
      const values = rp.map((r) => `('${r.A}', '${r.B}')`).join(",");
      await prisma.$executeRawUnsafe(`INSERT IGNORE INTO _RolePermissions (A, B) VALUES ${values}`);
      console.log(`_RolePermissions`.padEnd(25) + ` ${rp.length} linhas importadas`);
    }
  } finally {
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
  }

  console.log("\nImportação concluída.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
