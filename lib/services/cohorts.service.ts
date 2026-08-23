import { db } from "@/lib/db";

const publicProgramWhere = {
  status: "PUBLISHED" as const,
  school: { status: "PUBLISHED" as const },
};

export async function listUpcomingCohorts(limit?: number) {
  return db.cohort.findMany({
    where: {
      status: { in: ["APPLICATIONS_OPEN", "APPLICATIONS_CLOSED"] },
      endsAt: { gte: new Date() },
      program: publicProgramWhere,
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    include: {
      program: {
        include: { school: { select: { name: true, slug: true } } },
      },
      leadInstructor: {
        select: { name: true, headline: true, image: true, publicProfileSlug: true },
      },
    },
  });
}

export async function getPublicCohort(slug: string) {
  return db.cohort.findFirst({
    where: {
      slug,
      status: { notIn: ["DRAFT", "CANCELLED"] },
      program: publicProgramWhere,
    },
    include: {
      program: {
        include: {
          school: { select: { name: true, slug: true, description: true } },
          courses: {
            orderBy: { position: "asc" },
            include: {
              course: {
                select: { id: true, title: true, slug: true, shortDesc: true, difficulty: true },
              },
            },
          },
        },
      },
      leadInstructor: {
        select: { name: true, headline: true, image: true, bio: true, publicProfileSlug: true },
      },
    },
  });
}

export async function getUserCohortApplication(cohortId: string, userId: string) {
  return db.cohortApplication.findUnique({
    where: { cohortId_userId: { cohortId, userId } },
    include: { purchaseOrder: { select: { status: true, paidAt: true } } },
  });
}
