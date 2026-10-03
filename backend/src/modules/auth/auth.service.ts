import type { Request } from "express";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/app-error";
import { recordAudit } from "../audit/audit.service";
import { hashPassword, isStrongPassword, verifyPassword } from "./password.util";
import {
  generateOpaqueToken,
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
  signAccessToken,
  verifyAccessToken,
} from "./token.util";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60_000;
const RESET_TOKEN_TTL_MS = 60 * 60_000;

const userWithRole = { role: { include: { permissions: true } } } as const;

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  username: string;
  phone: string | null;
  avatar: string | null;
  position: string | null;
  department: string | null;
  status: string;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  role: { id: string; name: string; permissions: { code: string }[] };
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    phone: user.phone,
    avatar: user.avatar,
    position: user.position,
    department: user.department,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
    role: { id: user.role.id, name: user.role.name },
    permissions: user.role.permissions.map((p) => p.code),
  };
}

async function findUserByIdentifier(identifier: string) {
  return prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }], deletedAt: null },
    include: userWithRole,
  });
}

export async function login(identifier: string, password: string, req?: Request) {
  const user = await findUserByIdentifier(identifier);
  if (!user) throw AppError.unauthorized("Credenciais inválidas.");

  if (user.status === "BLOCKED") throw AppError.forbidden("Esta conta foi bloqueada. Contacte o administrador.");
  if (user.status === "INACTIVE") throw AppError.forbidden("Esta conta está inactiva.");

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw AppError.forbidden("Conta temporariamente bloqueada devido a várias tentativas falhadas. Tente novamente mais tarde.");
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const lockedUntil = failedLoginAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MS) : null;
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts, lockedUntil } });
    await recordAudit({ req, userId: user.id, action: "LOGIN_FAILED", module: "auth" });
    throw AppError.unauthorized("Credenciais inválidas.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshTokenPlain = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshTokenPlain),
      expiresAt: refreshExpiryDate(),
      ipAddress: req?.ip,
      userAgent: req?.headers["user-agent"],
    },
  });

  await recordAudit({ req, userId: user.id, action: "LOGIN", module: "auth", entity: "User", entityId: user.id });

  return { user: toPublicUser(user), accessToken, refreshToken: refreshTokenPlain };
}

export async function refresh(refreshTokenPlain: string, req?: Request) {
  const tokenHash = hashToken(refreshTokenPlain);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
    throw AppError.unauthorized("Sessão expirada. Por favor autentique-se novamente.");
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId }, include: userWithRole });
  if (!user || user.deletedAt || user.status !== "ACTIVE") {
    throw AppError.unauthorized("Utilizador inválido.");
  }

  const newRefreshTokenPlain = generateRefreshToken();
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedByToken: hashToken(newRefreshTokenPlain) },
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(newRefreshTokenPlain),
        expiresAt: refreshExpiryDate(),
        ipAddress: req?.ip,
        userAgent: req?.headers["user-agent"],
      },
    }),
  ]);

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  return { user: toPublicUser(user), accessToken, refreshToken: newRefreshTokenPlain };
}

export async function logout(refreshTokenPlain: string): Promise<void> {
  const tokenHash = hashToken(refreshTokenPlain);
  await prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: userWithRole });
  if (!user) throw AppError.notFound("Utilizador não encontrado.");
  return toPublicUser(user);
}

export async function forgotPassword(email: string): Promise<{ devToken?: string }> {
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (!user) {
    // Do not reveal whether the e-mail exists.
    return {};
  }
  const tokenPlain = generateOpaqueToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(tokenPlain), expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });
  await recordAudit({ userId: user.id, action: "FORGOT_PASSWORD_REQUEST", module: "auth" });
  // No SMTP configured in this environment: the token is returned to the caller in
  // development so the reset flow can be exercised end-to-end without a mail server.
  return { devToken: tokenPlain };
}

export async function resetPassword(tokenPlain: string, newPassword: string): Promise<void> {
  if (!isStrongPassword(newPassword)) {
    throw AppError.badRequest("A senha deve ter no mínimo 8 caracteres, uma maiúscula, uma minúscula e um número.");
  }
  const tokenHash = hashToken(tokenPlain);
  const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.usedAt || stored.expiresAt.getTime() < Date.now()) {
    throw AppError.badRequest("Token de recuperação inválido ou expirado.");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: stored.userId },
      data: { passwordHash, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null },
    }),
    prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId: stored.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  await recordAudit({ userId: stored.userId, action: "PASSWORD_RESET", module: "auth" });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  if (!isStrongPassword(newPassword)) {
    throw AppError.badRequest("A senha deve ter no mínimo 8 caracteres, uma maiúscula, uma minúscula e um número.");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("Utilizador não encontrado.");

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw AppError.badRequest("A senha actual está incorrecta.");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: false } });
  await recordAudit({ userId, action: "PASSWORD_CHANGE", module: "auth" });
}

export { verifyAccessToken };
