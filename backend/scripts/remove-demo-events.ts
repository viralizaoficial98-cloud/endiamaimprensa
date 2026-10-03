/** Removes every event created by seed-demo-events.ts once real editorial
 * events are ready to take their place. Identifies them by the organizer tag
 * used by the seed script — real events should never use that value. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_ORGANIZER = "ENDIAMA E.P. (dados de demonstração)";

async function main() {
  const { count } = await prisma.event.deleteMany({ where: { organizer: DEMO_ORGANIZER } });
  console.log(`Removidos ${count} eventos de demonstração.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
