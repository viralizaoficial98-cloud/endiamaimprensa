/** Removes every audio created by seed-demo-audios.ts, including its generated
 * WAV files, once real editorial audio content is ready to take their place. */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_TAG = "(dados de demonstração)";

async function main() {
  const demoAudios = await prisma.audio.findMany({ where: { interviewee: { contains: DEMO_TAG } } });
  for (const audio of demoAudios) {
    const filename = audio.audioUrl.split("/").pop();
    if (filename) {
      const filePath = path.join(__dirname, "..", "uploads", "audios", filename);
      fs.unlink(filePath, () => undefined);
    }
  }
  const { count } = await prisma.audio.deleteMany({ where: { interviewee: { contains: DEMO_TAG } } });
  console.log(`Removidos ${count} áudios de demonstração.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
