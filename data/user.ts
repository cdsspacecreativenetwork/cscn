import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export type AdminUsersFilter = {
  page?: number;
  tab?: string;
  query?: string;
  sort?: string;
};

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
  headline: true,
  instructorProfileEnabled: true,
  instructorVerificationStatus: true,
  instructorFeatured: true,
  instructorFeaturedOrder: true,
  mentorshipEnabled: true,
  createdAt: true,
  canManageUsers: true,
  canManageCourses: true,
  canManageBilling: true,
  canViewAnalytics: true,
  taughtCourses: {
    where: { status: "PUBLISHED" as const },
    select: {
      id: true,
      _count: { select: { enrollments: true, ratings: true } },
      ratings: { select: { rating: true } },
    },
  },
  _count: { select: { enrollments: true } },
} as any;

export const PAGE_SIZE = 25;

function getRoleWhere(tab?: string) {
  if (tab === "students") return { role: "USER" as UserRole };
  if (tab === "instructors") return { instructorProfileEnabled: true };
  if (tab === "admins") return { role: { in: ["ADMIN", "SUPER_ADMIN"] as UserRole[] } };
  if (tab === "pending") return { instructorProfileEnabled: true, instructorVerificationStatus: "PENDING" as const };
  if (tab === "featured") return { instructorProfileEnabled: true, instructorFeatured: true };
  return {};
}

function sortUsers(users: any[], sort = "newest") {
  const getInstructorStudents = (user: any) =>
    user.taughtCourses?.reduce((sum: number, course: any) => sum + course._count.enrollments, 0) ?? 0;
  const getAverageRating = (user: any) => {
    const ratings = user.taughtCourses?.flatMap((course: any) => course.ratings.map((rating: any) => rating.rating)) ?? [];
    return ratings.length > 0 ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length : 0;
  };

  return [...users].sort((a, b) => {
    if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    if (sort === "name") return (a.name ?? a.email).localeCompare(b.name ?? b.email);
    if (sort === "courses") return (b.taughtCourses?.length ?? 0) - (a.taughtCourses?.length ?? 0);
    if (sort === "students") return getInstructorStudents(b) - getInstructorStudents(a);
    if (sort === "rating") return getAverageRating(b) - getAverageRating(a);
    if (sort === "enrolled") return (b._count?.enrollments ?? 0) - (a._count?.enrollments ?? 0);
    if (sort === "featured") return (a.instructorFeaturedOrder ?? 999) - (b.instructorFeaturedOrder ?? 999);
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export const getAllUsers = async (filters: AdminUsersFilter = {}) => {
  try {
    const page = Math.max(1, filters.page ?? 1);
    const query = filters.query?.trim();
    const where = {
      ...getRoleWhere(filters.tab),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
              { headline: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [allUsers, total] = await Promise.all([
      db.user.findMany({
        where,
        select: USER_SELECT,
        take: 500,
      }),
      db.user.count({ where }),
    ]);
    const sorted = sortUsers(allUsers, filters.sort);
    const users = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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
      db.user.count({ where: { instructorProfileEnabled: true } }),
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
