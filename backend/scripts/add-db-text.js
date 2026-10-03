/** One-time schema pass: Prisma's `String` (no @db.* override) maps to an
 * UNBOUNDED `text` column on PostgreSQL but a `VARCHAR(191)` column on MySQL.
 * Every field here holds free-form content that can legitimately exceed 191
 * characters (descriptions, excerpts, captions, HTML email bodies, browser
 * User-Agent strings, ...) — without @db.Text those would silently cap or
 * reject real data that worked fine on Postgres. Run once, then delete. */
const fs = require("fs");

const file = "prisma/schema.prisma";
const targetLines = [
  148, 164, 219, 248, 249, 314, 315, 316, 317, 341, 345, 349, 407, 408, 429, 430,
  484, 485, 489, 504, 505, 506, 507, 546, 547, 578, 579, 609, 629, 681, 682, 710,
  711, 730, 761, 762, 766, 800, 801, 830, 859, 862, 891, 964, 990, 1028, 1029, 1087, 1105,
];

const lines = fs.readFileSync(file, "utf8").split("\n");

for (const ln of targetLines) {
  const idx = ln - 1;
  const line = lines[idx];
  if (!/String\??/.test(line)) throw new Error(`Line ${ln} has no String field: ${line}`);
  if (line.includes("@db.Text")) continue;
  lines[idx] = line.replace(/(String\??)/, "$1 @db.Text");
}

fs.writeFileSync(file, lines.join("\n"));
console.log(`${targetLines.length} campos marcados com @db.Text`);
