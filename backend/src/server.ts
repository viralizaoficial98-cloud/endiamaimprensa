import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/prisma";
import { startScheduledJobs } from "./jobs/scheduler";

async function main() {
  await prisma.$connect();
  logger.info(`Ligação à base de dados estabelecida.`);

  const app = createApp();

  const server = app.listen(env.port, "0.0.0.0", () => {
    logger.info(`ENDIAMA Notícias API a correr em http://0.0.0.0:${env.port}`);
    logger.info(`Documentação Swagger disponível em ${env.apiBaseUrl}/api/docs`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      logger.error(`A porta ${env.port} já está em uso por outro processo. Encerre-o antes de iniciar o servidor novamente.`);
      process.exit(1);
    }
    throw error;
  });

  startScheduledJobs();
}

main().catch((err) => {
  logger.error({ err }, "Falha ao iniciar o servidor.");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
