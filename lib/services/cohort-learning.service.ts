import { db } from "@/lib/db";
import { calculateCohortCompletion } from "@/lib/cohort-completion";
import { getCohortMentorshipForLearner } from "@/lib/services/cohort-mentorship.service";

const membershipStatuses = ["ACTIVE", "COMPLETED"] as const;

export async function getLearnerCohorts(userId: string) {
  return db.cohortMembership.findMany({
    where: { userId, role: "LEARNER", status: { in: [...membershipStatuses] } },
    orderBy: { cohort: { startsAt: "asc" } },
    select: {
      id: true,
      status: true,
      joinedAt: true,
      completedAt: true,
      cohort: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          startsAt: true,
          endsAt: true,
          timezone: true,
          scheduleSummary: true,
          program: {
            select: {
              id: true,
              title: true,
              shortDescription: true,
              estimatedDurationWeeks: true,
              school: { select: { name: true } },
              _count: { select: { courses: true } },
            },
          },
        },
      },
    },
  });
}

export async function getCohortLearningDashboard(userId: string, cohortSlug: string) {
  const membership = await db.cohortMembership.findFirst({
    where: {
      userId,
      role: "LEARNER",
      status: { in: [...membershipStatuses] },
      cohort: { slug: cohortSlug },
    },
    select: {
      id: true,
      status: true,
      joinedAt: true,
      completedAt: true,
      cohort: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          startsAt: true,
          endsAt: true,
          timezone: true,
          scheduleSummary: true,
          weeklySchedule: true,
          graduationRules: true,
          completionPolicy: true,
          projects: {
            where: { status: "PUBLISHED" },
            orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              title: true,
              slug: true,
              brief: true,
              dueAt: true,
              releaseAt: true,
              assignmentType: true,
              latePolicy: true,
              maxScore: true,
              peerReviewEnabled: true,
              peerReviewDueAt: true,
              submissions: {
                where: { userId },
                select: {
                  id: true,
                  status: true,
                  currentVersion: true,
                  isLate: true,
                  submittedAt: true,
                  reviews: { orderBy: { createdAt: "desc" }, take: 1, select: { totalScore: true, maxScore: true, decision: true, overallNote: true } },
                },
                take: 1,
              },
              _count: { select: { rubricCriteria: true } },
            },
          },
          leadInstructor: { select: { name: true, image: true, headline: true } },
          program: {
            select: {
              id: true,
              title: true,
              shortDescription: true,
              estimatedDurationWeeks: true,
              school: { select: { name: true } },
              courses: {
                orderBy: { position: "asc" },
                select: {
                  position: true,
                  required: true,
                  minimumCompletionPercentage: true,
                  course: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      shortDesc: true,
                      thumbnail: true,
                      modules: {
                        where: { isPublished: true },
                        orderBy: { position: "asc" },
                        select: {
                          lessons: {
                            where: { isPublished: true },
                            orderBy: { position: "asc" },
                            select: {
                              id: true,
                              title: true,
                              progress: {
                                where: { userId },
                                select: { percentComplete: true, completedAt: true },
                              },
                            },
                          },
                        },
                      },
                      enrollments: {
                        where: { userId, status: "ACTIVE" },
                        select: { id: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!membership) return null;

  const now = new Date();
  const [announcements, calendar, mentorship, attendance, quizAttempts, peerReviews, receivedPeerReviews, roster, communities] = await Promise.all([
    db.announcement.findMany({
      where: {
        cohortId: membership.cohort.id,
        status: "PUBLISHED",
        OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, body: true, priority: true, linkUrl: true, publishedAt: true, createdAt: true },
    }),
    db.scheduleEvent.findMany({
      where: {
        cohortId: membership.cohort.id,
        audience: "COHORT_MEMBERS",
        status: { in: ["SCHEDULED", "LIVE", "COMPLETED"] },
        startsAt: { gte: new Date(membership.cohort.startsAt.getTime() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { startsAt: "asc" },
      take: 100,
      select: { id: true, type: true, status: true, title: true, description: true, startsAt: true, endsAt: true, timezone: true, meetingUrl: true, recordingUrl: true },
    }),
    getCohortMentorshipForLearner(membership.cohort.id, userId),
    db.scheduleEventAttendee.findMany({
      where: { userId, event: { cohortId: membership.cohort.id } },
      select: { status: true, event: { select: { id: true, title: true, startsAt: true } } },
    }),
    db.quizAttempt.findMany({
      where: {
        userId,
        status: "SUBMITTED",
        quiz: { lesson: { module: { course: { programs: { some: { programId: membership.cohort.program.id } } } } } },
      },
      select: { percentage: true, passed: true, quiz: { select: { lesson: { select: { title: true, module: { select: { course: { select: { title: true } } } } } } } } },
    }),
    db.peerReviewAssignment.findMany({
      where: { reviewerId: userId, project: { cohortId: membership.cohort.id } },
      orderBy: [{ dueAt: "asc" }, { assignedAt: "asc" }],
      select: {
        id: true, status: true, dueAt: true, submittedAt: true,
        project: { select: { id: true, title: true, rubricCriteria: { orderBy: { position: "asc" }, select: { id: true, title: true, description: true, maxScore: true } } } },
        submission: { select: { id: true, title: true, summary: true, submissionText: true, artifactUrl: true, repositoryUrl: true, demoUrl: true, currentVersion: true } },
        reviewee: { select: { name: true, image: true } },
        response: { select: { overallNote: true, totalScore: true, maxScore: true } },
      },
    }),
    db.peerReviewAssignment.findMany({
      where: { revieweeId: userId, status: "SUBMITTED", project: { cohortId: membership.cohort.id }, response: { isHidden: false } },
      orderBy: { submittedAt: "desc" },
      select: { id: true, submittedAt: true, project: { select: { title: true } }, reviewer: { select: { name: true, image: true } }, response: { select: { overallNote: true, totalScore: true, maxScore: true, scores: { select: { score: true, note: true, criterion: { select: { title: true, maxScore: true } } } } } } },
    }),
    db.cohortMembership.findMany({
      where: { cohortId: membership.cohort.id, status: { in: ["ACTIVE", "COMPLETED"] } },
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
      select: { role: true, status: true, user: { select: { id: true, name: true, image: true, headline: true, publicProfileSlug: true, publicProfileStatus: true } } },
    }),
    db.communitySpace.findMany({
      where: { cohortId: membership.cohort.id, status: "PUBLISHED" },
      orderBy: { title: "asc" },
      select: { id: true, slug: true, title: true, description: true, kind: true },
    }),
  ]);

  const courses = membership.cohort.program.courses.map((item) => {
    const lessons = item.course.modules.flatMap((module) => module.lessons);
    const completedLessons = lessons.filter((lesson) => lesson.progress[0]?.completedAt || lesson.progress[0]?.percentComplete === 100).length;
    const progress = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0;
    const nextLesson = lessons.find((lesson) => !lesson.progress[0]?.completedAt && lesson.progress[0]?.percentComplete !== 100) ?? lessons[0] ?? null;
    return {
      id: item.course.id,
      title: item.course.title,
      slug: item.course.slug,
      shortDesc: item.course.shortDesc,
      thumbnail: item.course.thumbnail,
      position: item.position,
      required: item.required,
      minimumCompletionPercentage: item.minimumCompletionPercentage,
      lessonCount: lessons.length,
      completedLessons,
      progress,
      enrolled: item.course.enrollments.length > 0,
      nextLessonId: nextLesson?.id ?? null,
      nextLessonTitle: nextLesson?.title ?? null,
    };
  });

  const requiredCourses = courses.filter((course) => course.required);
  const overallProgress = requiredCourses.length
    ? Math.round(requiredCourses.reduce((sum, course) => sum + course.progress, 0) / requiredCourses.length)
    : 0;

  const availableProjects = membership.cohort.projects.filter((project) => !project.releaseAt || project.releaseAt <= now);
  const assignmentScores = availableProjects.map((project) => {
    const submission = project.submissions[0];
    const review = submission?.reviews[0];
    if (review?.maxScore) return Math.round((review.totalScore / review.maxScore) * 100);
    return submission && submission.status !== "DRAFT" ? 100 : 0;
  });
  const assignmentsMetric = assignmentScores.length ? Math.round(assignmentScores.reduce((sum, value) => sum + value, 0) / assignmentScores.length) : 0;
  const quizMetric = quizAttempts.length ? Math.round(quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / quizAttempts.length) : 0;
  const markedAttendance = attendance.filter((item) => item.status === "ATTENDED" || item.status === "MISSED");
  const attendanceMetric = markedAttendance.length ? Math.round((markedAttendance.filter((item) => item.status === "ATTENDED").length / markedAttendance.length) * 100) : 0;
  const peerReviewMetric = peerReviews.length ? Math.round((peerReviews.filter((item) => item.status === "SUBMITTED").length / peerReviews.length) * 100) : 0;
  const completion = calculateCohortCompletion(membership.cohort.completionPolicy, { courses: overallProgress, assignments: assignmentsMetric, quizzes: quizMetric, attendance: attendanceMetric, peerReviews: peerReviewMetric });
  const schedule = calendar.filter((event) => event.status === "LIVE" || event.startsAt >= new Date(now.getTime() - 2 * 60 * 60 * 1000)).slice(0, 5);
  const nextPeerReview = peerReviews.find((item) => item.status === "ASSIGNED" || item.status === "IN_PROGRESS");
  const nextAssignment = availableProjects.find((project) => !project.submissions[0] || project.submissions[0].status === "DRAFT");
  const nextCourse = courses.find((course) => course.progress < 100 && course.nextLessonId);
  const nextAction = nextPeerReview
    ? { label: "Complete peer review", href: `?tab=peer-reviews&review=${nextPeerReview.id}` }
    : nextAssignment
      ? { label: "Continue assignment", href: `/dashboard/cohorts/${membership.cohort.slug}/projects/${nextAssignment.id}` }
      : nextCourse
        ? { label: "Continue learning", href: `/courses/${nextCourse.slug}/watch/${nextCourse.nextLessonId}` }
        : { label: "View calendar", href: "?tab=live" };

  return {
    membership,
    announcements,
    schedule,
    calendar,
    courses,
    overallProgress,
    completion,
    quizAttempts,
    attendance,
    peerReviews,
    receivedPeerReviews,
    roster,
    communities,
    availableProjects,
    nextAction,
    startsInFuture: membership.cohort.startsAt.getTime() > now.getTime(),
    mentorship,
  };
}
