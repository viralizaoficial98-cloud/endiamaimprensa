import { prisma } from "../../config/prisma";

export async function notifyUser(userId: string, title: string, message: string, link?: string, type = "INFO") {
  return prisma.notification.create({ data: { userId, title, message, link, type } });
}

/** Notifies every active user holding at least one of the given permission codes. */
export async function notifyUsersWithPermission(permissionCodes: string[], title: string, message: string, link?: string) {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      role: { permissions: { some: { code: { in: permissionCodes } } } },
    },
    select: { id: true },
  });
  if (users.length === 0) return;
  await prisma.notification.createMany({
    data: users.map((u) => ({ userId: u.id, title, message, link, type: "INFO" })),
  });
}
