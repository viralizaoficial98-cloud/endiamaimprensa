import type { Request } from "express";
import { prisma } from "../../config/prisma";
import { AppError } from "../../common/app-error";
import { buildPagination, type PaginationMeta } from "../../common/api-response";
import type { ListQuery } from "../../common/list-query";
import { recordAudit } from "../audit/audit.service";
import { hashPassword } from "../auth/password.util";

const publicSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  phone: true,
  avatar: true,
  position: true,
  department: true,
  roleId: true,
  role: true,
  status: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface CreateUserInput {
  name: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
  avatar?: string;
  position?: string;
  department?: string;
  roleId: string;
  status?: "ACTIVE" | "INACTIVE" | "BLOCKED" | "PENDING";
}

export async function listUsers(query: ListQuery) {
  const where = {
    deletedAt: null,
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search } },
            { email: { contains: query.search } },
            { username: { contains: query.search } },
          ],
        }
      : {}),
    ...(query.status ? { status: query.status as never } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: publicSelect, orderBy: { [query.sortBy]: query.sortOrder }, skip: query.skip, take: query.limit }),
  ]);

  const pagination: PaginationMeta = buildPagination(query.page, query.limit, total);
  return { data: rows, pagination };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: publicSelect });
  if (!user) throw AppError.notFound("Utilizador não encontrado.");
  return user;
}

export async function createUser(input: CreateUserInput, req?: Request) {
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      username: input.username,
      passwordHash,
      phone: input.phone,
      avatar: input.avatar,
      position: input.position,
      department: input.department,
      roleId: input.roleId,
      status: input.status ?? "ACTIVE",
      mustChangePassword: true,
    },
    select: publicSelect,
  });
  await recordAudit({ req, action: "CREATE", module: "users", entity: "User", entityId: user.id, newData: { email: user.email } });
  return user;
}

export async function updateUser(
  id: string,
  input: Partial<Omit<CreateUserInput, "password">> & { password?: string },
  req?: Request
) {
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw AppError.notFound("Utilizador não encontrado.");

  const data: Record<string, unknown> = { ...input };
  delete data.password;
  if (input.password) {
    data.passwordHash = await hashPassword(input.password);
    data.mustChangePassword = true;
  }

  const user = await prisma.user.update({ where: { id }, data, select: publicSelect });
  await recordAudit({ req, action: "UPDATE", module: "users", entity: "User", entityId: id, oldData: { email: existing.email }, newData: input });
  return user;
}

export async function deleteUser(id: string, req?: Request) {
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw AppError.notFound("Utilizador não encontrado.");
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  await recordAudit({ req, action: "DELETE", module: "users", entity: "User", entityId: id });
}
