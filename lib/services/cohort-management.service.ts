import { db } from "@/lib/db";

export async function getAdminCohortDirectory() {
  const [cohorts, programs, instructors] = await Promise.all([
    db.cohort.findMany({
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        startsAt: true,
        endsAt: true,
        capacity: true,
        price: true,
        currency: true,
        program: { select: { title: true, school: { select: { name: true } } } },
        leadInstructor: { select: { name: true } },
        _count: { select: { memberships: true, applications: true, projects: true, scheduleEvents: true } },
      },
    }),
    db.program.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      select: { id: true, title: true, school: { select: { name: true } } },
    }),
    db.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  return { cohorts, programs, instructors };
}

export async function getCohortOperationsDashboard(slug: string) {
  const cohort = await db.cohort.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      capacity: true,
      price: true,
      currency: true,
      applicationRequired: true,
      applicationOpenAt: true,
      applicationCloseAt: true,
      scheduleSummary: true,
      completionPolicy: true,
      graduationRules: true,
      program: { select: { id: true, title: true, school: { select: { name: true } } } },
      memberships: {
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          role: true,
          status: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true, image: true, role: true } },
        },
      },
      projects: {
        orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          assignmentType: true,
          status: true,
          dueAt: true,
          releaseAt: true,
          peerReviewEnabled: true,
          peerReviewDueAt: true,
          showcaseEligible: true,
          rubricCriteria: { orderBy: { position: "asc" }, select: { id: true, title: true, description: true, maxScore: true } },
          submissions: {
            where: { status: "SUBMITTED" },
            orderBy: { submittedAt: "asc" },
            select: { id: true, title: true, summary: true, showcaseConsent: true, currentVersion: true, submittedAt: true, user: { select: { name: true, email: true } } },
          },
          _count: { select: { submissions: true, peerReviewAssignments: true } },
        },
      },
      scheduleEvents: {
        orderBy: { startsAt: "asc" },
        take: 30,
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          startsAt: true,
          endsAt: true,
          meetingUrl: true,
          recordingUrl: true,
          attendees: {
            orderBy: { user: { name: "asc" } },
            select: { id: true, status: true, user: { select: { id: true, name: true, email: true } } },
          },
          _count: { select: { attendees: true } },
        },
      },
      announcements: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, status: true, publishedAt: true },
      },
    },
  });
  if (!cohort) return null;

  const learnerIds = cohort.memberships.filter((item) => item.role === "LEARNER" && item.status === "ACTIVE").map((item) => item.user.id);
  const [attendance, submissions, peerReviews, quizAttempts] = await Promise.all([
    db.scheduleEventAttendee.groupBy({
      by: ["status"],
      where: { event: { cohortId: cohort.id }, userId: { in: learnerIds } },
      _count: { status: true },
    }),
    db.projectSubmission.groupBy({
      by: ["status"],
      where: { project: { cohortId: cohort.id }, userId: { in: learnerIds } },
      _count: { status: true },
    }),
    db.peerReviewAssignment.groupBy({
      by: ["status"],
      where: { project: { cohortId: cohort.id } },
      _count: { status: true },
    }),
    db.quizAttempt.aggregate({
      where: {
        userId: { in: learnerIds },
        status: "SUBMITTED",
        quiz: { lesson: { module: { course: { programs: { some: { programId: cohort.program.id } } } } } },
      },
      _avg: { percentage: true },
      _count: { id: true },
    }),
  ]);

  return { cohort, attendance, submissions, peerReviews, quizAttempts };
}

export async function getInstructorCohorts(userId: string) {
  return db.cohortMembership.findMany({
    where: { userId, role: { in: ["INSTRUCTOR", "TEACHING_ASSISTANT"] }, status: "ACTIVE" },
    orderBy: { cohort: { startsAt: "desc" } },
    select: {
      role: true,
      cohort: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          startsAt: true,
          endsAt: true,
          program: { select: { title: true } },
          _count: { select: { memberships: { where: { role: "LEARNER", status: "ACTIVE" } }, projects: true, scheduleEvents: true } },
        },
      },
    },
  });
}

export async function canOperateCohort(userId: string, slug: string, isCohortAdmin: boolean) {
  if (isCohortAdmin) return true;
  const membership = await db.cohortMembership.findFirst({
    where: { userId, status: "ACTIVE", role: { in: ["INSTRUCTOR", "TEACHING_ASSISTANT"] }, cohort: { slug } },
    select: { id: true },
  });
  return Boolean(membership);
}
