import type { Prisma } from "@prisma/client";

export async function activateCohortLearnerMembership(
  tx: Prisma.TransactionClient,
  input: { cohortId: string; userId: string; joinedAt: Date },
) {
  const courses = await tx.programCourse.findMany({
    where: { program: { cohorts: { some: { id: input.cohortId } } }, required: true },
    select: { courseId: true },
    orderBy: { position: "asc" },
  });

  const membership = await tx.cohortMembership.upsert({
    where: { cohortId_userId: { cohortId: input.cohortId, userId: input.userId } },
    create: {
      cohortId: input.cohortId,
      userId: input.userId,
      role: "LEARNER",
      status: "ACTIVE",
      joinedAt: input.joinedAt,
    },
    update: { role: "LEARNER", status: "ACTIVE", joinedAt: input.joinedAt },
  });

  await Promise.all(courses.map(({ courseId }) => tx.enrollment.upsert({
    where: { userId_courseId: { userId: input.userId, courseId } },
    create: { userId: input.userId, courseId, status: "ACTIVE", enrolledAt: input.joinedAt },
    update: { status: "ACTIVE" },
  })));

  return { membership, courseIds: courses.map(({ courseId }) => courseId) };
}
