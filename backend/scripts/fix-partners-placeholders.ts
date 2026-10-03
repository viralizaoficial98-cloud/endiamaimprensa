/**
 * Fixes the Partners section per the portal improvement brief:
 *  1. The 3 existing partners (SODIAM, Sociedade Mineira de Catoca, Ministério
 *     dos Recursos Minerais e Petróleos) were all wrongly pointing their `logo`
 *     at ENDIAMA's own logo file — a real-brand misuse. Reset to the
 *     "PLACEHOLDER" sentinel so the frontend renders a professional initials
 *     badge instead, until the real logos are supplied.
 *  2. Adds two more institutional partners as visual demo content (ENDIAMA
 *     Mining, Clínica Sagrada Esperança) so the section isn't sparse — same
 *     PLACEHOLDER convention, easy to find/replace later (order 3 and 4).
 * Idempotent — safe to re-run.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WRONG_LOGO_NAMES = ["SODIAM", "Sociedade Mineira de Catoca", "Ministério dos Recursos Minerais e Petróleos"];

const NEW_PARTNERS = [
  { name: "ENDIAMA Mining", logo: "PLACEHOLDER", order: 3, status: "ACTIVE" as const },
  { name: "Clínica Sagrada Esperança", logo: "PLACEHOLDER", order: 4, status: "ACTIVE" as const },
];

async function main() {
  const fixed = await prisma.partner.updateMany({
    where: { name: { in: WRONG_LOGO_NAMES }, logo: { contains: "logotipo_endiama" } },
    data: { logo: "PLACEHOLDER" },
  });
  console.log(`Corrigidos ${fixed.count} parceiros com logótipo incorrecto (ENDIAMA reaproveitado).`);

  for (const partner of NEW_PARTNERS) {
    const existing = await prisma.partner.findFirst({ where: { name: partner.name } });
    if (existing) {
      console.log(`Já existe, a ignorar: ${partner.name}`);
      continue;
    }
    await prisma.partner.create({ data: partner });
    console.log(`Criado: ${partner.name}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
