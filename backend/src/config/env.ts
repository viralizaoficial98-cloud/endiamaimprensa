import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? 4000),

  databaseUrl: required("DATABASE_URL"),

  jwtSecret: required("JWT_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? required("JWT_SECRET"),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",

  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5180",
  additionalCorsOrigins: (process.env.ADDITIONAL_CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  apiBaseUrl: process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,

  // 25MB comfortably covers images/audio; video uploads need much more headroom.
  uploadMaxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB ?? 200),

  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "ENDIAMA Notícias <no-reply@endiama.co.ao>",
  },
};

export const corsAllowedOrigins = Array.from(
  new Set([env.frontendUrl, ...env.additionalCorsOrigins].filter(Boolean))
);
