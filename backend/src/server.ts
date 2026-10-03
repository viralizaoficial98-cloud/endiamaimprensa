import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/prisma";
import { startScheduledJobs } from "./jobs/scheduler";
import { ensureUploadFoldersExist } from "./modules/uploads/upload.config";

let shuttingDown = false;

async function main() {
  ensureUploadFoldersExist();

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

  const scheduledTasks = startScheduledJobs();

  /** Stops accepting new connections, stops cron (so nothing starts a new DB
   * write after this point), then disconnects Prisma — in that order, so an
   * in-flight request/job gets a chance to finish instead of being cut off
   * mid-write. A hard timeout guarantees the process still exits even if a
   * connection never drains (e.g. a stuck keep-alive socket). */
  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} recebido — a encerrar graciosamente...`);

    const forceExit = setTimeout(() => {
      logger.error("Encerramento gracioso excedeu o tempo limite — a forçar saída.");
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    for (const task of scheduledTasks) task.stop();

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();

    clearTimeout(forceExit);
    logger.info("Encerramento gracioso concluído.");
    process.exit(0);
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err }, "Falha ao iniciar o servidor.");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
