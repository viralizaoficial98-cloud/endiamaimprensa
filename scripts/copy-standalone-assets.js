/**
 * next build (with output: "standalone") produces a self-contained server at
 * .next/standalone/server.js, but deliberately excludes public/ and
 * .next/static/ to keep that bundle minimal — Next's own documented
 * standalone deployment instructions say to copy them in afterwards. Runs as
 * the "postbuild" npm script, right after every `npm run build`, so this
 * step is never a manual thing to remember at deploy time.
 *
 * Plain Node (fs.cpSync), not a shell `cp -r` — this project's deploy target
 * (cPanel) and local dev machine aren't the same OS, so nothing here may
 * assume a POSIX shell or Windows-only tooling.
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");

if (!fs.existsSync(standaloneDir)) {
  console.error('.next/standalone não existe — confirme que next.config.ts tem output: "standalone" e que o build correu sem erros.');
  process.exit(1);
}

const copies = [
  { from: path.join(root, "public"), to: path.join(standaloneDir, "public") },
  { from: path.join(root, ".next", "static"), to: path.join(standaloneDir, ".next", "static") },
];

for (const { from, to } of copies) {
  if (!fs.existsSync(from)) continue;
  fs.cpSync(from, to, { recursive: true });
  console.log(`Copiado: ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}

console.log("Assets estáticos copiados para .next/standalone — pronto para `node .next/standalone/server.js`.");
