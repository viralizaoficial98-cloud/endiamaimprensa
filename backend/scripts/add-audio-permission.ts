/**
 * Adds the "audios.manage" permission (new Áudios CMS module) and grants it to
 * the roles that already manage other multimedia content, without re-running
 * the full seed (which would touch unrelated data). Idempotent.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES_TO_GRANT = ["Super Administrador", "Administrador", "Editor-Chefe", "Operador Multimédia"];

async function main() {
  const permission = await prisma.permission.upsert({
    where: { code: "audios.manage" },
    update: {},
    create: { code: "audios.manage", name: "Gerir áudios", module: "audios", description: "CRUD completo de áudios institucionais." },
  });
  console.log(`Permissão pronta: ${permission.code}`);

  for (const roleName of ROLES_TO_GRANT) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.log(`Papel não encontrado, a ignorar: ${roleName}`);
      continue;
    }
    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: { connect: { id: permission.id } } },
    });
    console.log(`Concedida a: ${roleName}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
