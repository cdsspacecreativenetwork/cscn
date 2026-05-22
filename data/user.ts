import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const getUserByEmail = async (email: string) => {
  try {
    return await db.user.findUnique({ where: { email } });
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    return await db.user.findUnique({ where: { id } });
  } catch {
    return null;
  }
};

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  createdAt: true,
  canManageUsers: true,
  canManageCourses: true,
  canManageBilling: true,
  canViewAnalytics: true,
} as any;

export const PAGE_SIZE = 25;

export const getAllUsers = async (page = 1) => {
  try {
    const [users, total] = await Promise.all([
      db.user.findMany({
        select: USER_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.user.count(),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  } catch {
    return { users: [], total: 0, page: 1, totalPages: 1 };
  }
};

export const getUserStats = async () => {
  try {
    const [total, superAdmins, admins, instructors, students] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "SUPER_ADMIN" as UserRole } }),
      db.user.count({ where: { role: "ADMIN" as UserRole } }),
      db.user.count({ where: { role: "INSTRUCTOR" as UserRole } }),
      db.user.count({ where: { role: "USER" as UserRole } }),
    ]);
    return { total, superAdmins, admins, instructors, students };
  } catch {
    return { total: 0, superAdmins: 0, admins: 0, instructors: 0, students: 0 };
  }
};

export const adminExists = async () => {
  try {
    const superAdmin = await db.user.findFirst({
      where: { role: "SUPER_ADMIN" as UserRole }, 
    });
    return !!superAdmin;
  } catch {
    return false;
  }
};
