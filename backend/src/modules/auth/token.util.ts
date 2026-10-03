import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
}

/** Refresh tokens are opaque random strings; only their SHA-256 hash is persisted. */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshExpiryDate(): Date {
  const match = /^(\d+)([smhd])$/.exec(env.jwtRefreshExpiresIn);
  const amount = match ? Number(match[1]) : 30;
  const unit = match ? match[2] : "d";
  const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
  return new Date(Date.now() + amount * multiplier);
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
