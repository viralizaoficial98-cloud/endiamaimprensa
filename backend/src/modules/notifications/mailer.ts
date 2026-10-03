import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : null;

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an e-mail when SMTP credentials are configured; otherwise logs the
 * message so flows that depend on e-mail (password reset, newsletter) can
 * still be exercised end-to-end in this environment.
 */
export async function sendMail(options: MailOptions): Promise<void> {
  if (!transporter) {
    logger.info({ to: options.to, subject: options.subject }, "[mailer] SMTP não configurado — email registado em log em vez de enviado");
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, ...options });
}
