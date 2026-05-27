import { db } from "@/lib/db";
import type { Difficulty, CourseStatus, CourseInstructorRole, ContentType } from "@prisma/client";
import { createNotification } from "@/data/notifications";
import { sendCourseInviteEmail } from "@/lib/mail";
import { getInstructorRoleTransitionData } from "@/lib/instructor-onboarding";

// ── Ownership guard (OWNER only — for destructive / admin actions) ────────────

export async function verifyCourseOwnership(courseId: string, userId: string) {
  return db.course.findUnique({
    where: { id: courseId, instructorId: userId },
    select: { id: true },
  });
}

// ── Role-based access guard ───────────────────────────────────────────────────
// Throws if the user does not meet the required minimum role.
// OWNER = course.instructorId match (always highest rank)
// Hierarchy: OWNER (3) > CO_INSTRUCTOR (2) > TEACHING_ASSISTANT (1)

const ROLE_RANK = { OWNER: 3, CO_INSTRUCTOR: 2, TEACHING_ASSISTANT: 1 } as const;

export async function requireCourseAccess(
  courseId: string,
  userId: string,
  minimumRole: "TEACHING_ASSISTANT" | "CO_INSTRUCTOR" | "OWNER" = "CO_INSTRUCTOR"
): Promise<void> {
  const required = ROLE_RANK[minimumRole];

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) throw new Error("Course not found");
  if (course.instructorId === userId) return; // Primary owner always passes

  if (required === 3) throw new Error("Only the course owner can perform this action");

  const record = await db.courseInstructor.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { role: true },
  });
  if (!record) throw new Error("Forbidden");
  if (ROLE_RANK[record.role] < required) throw new Error("Insufficient permissions");
}

// Returns the user's effective role on the course, or null if no access.
export async function getCourseRole(
  courseId: string,
  userId: string
): Promise<"OWNER" | "CO_INSTRUCTOR" | "TEACHING_ASSISTANT" | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (course?.instructorId === userId) return "OWNER";

  const record = await db.courseInstructor.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { role: true },
  });
  return record?.role ?? null;
}

// ── Course list ──────────────────────────────────────────────────────────────

export async function getInstructorCourses(userId: string) {
  return db.course.findMany({
    where: {
      OR: [
        { instructorId: userId },
        { instructors: { some: { userId } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail: true,
      status: true,
      difficulty: true,
      updatedAt: true,
      instructorId: true,
      category: { select: { name: true } },
      _count: { select: { enrollments: true, modules: true } },
      modules: { select: { _count: { select: { lessons: true } } } },
    },
  });
}

// ── Course studio (full data for editor) ────────────────────────────────────
// Accessible by OWNER and any CourseInstructor entry (CO_INSTRUCTOR / TEACHING_ASSISTANT)

export async function getStudioCourse(courseId: string, userId: string) {
  return db.course.findFirst({
    where: {
      id: courseId,
      OR: [
        { instructorId: userId },
        { instructors: { some: { userId } } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      shortDesc: true,
      thumbnail: true,
      promoVideo: true,
      difficulty: true,
      status: true,
      previewCount: true,
      categoryId: true,
      requirements: true,
      includes: true,
      certificateEnabled: true,
      examGated: true,
      metaTitle: true,
      metaDescription: true,
      price: true,
      baseCurrency: true,
      instructor: { select: { payoutDetails: true } },
      pricingProposals: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          proposedPrice: true,
          currentPriceSnapshot: true,
          currency: true,
          status: true,
          adminNote: true,
          createdAt: true,
          reviewedAt: true,
        },
      },
      finalExamId: true,
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          isPublished: true,
          lessons: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
              videoUrl: true,
              overview: true,
              duration: true,
              isPublished: true,
              isPreview: true,
              transcript: true,
              bodyContent: true,
              contentType: true,
              quiz: {
                select: {
                  id: true,
                  mode: true,
                  instructions: true,
                  passingScore: true,
                  maxAttempts: true,
                  showAnswers: true,
                  gateUntilPassed: true,
                  shuffleQuestions: true,
                  timeLimitMinutes: true,
                  questions: {
                    orderBy: { position: "asc" },
                    select: {
                      id: true,
                      type: true,
                      prompt: true,
                      explanation: true,
                      points: true,
                      position: true,
                      required: true,
                      options: {
                        orderBy: { position: "asc" },
                        select: {
                          id: true,
                          text: true,
                          isCorrect: true,
                          position: true,
                        },
                      },
                    },
                  },
                },
              },
              muxStatus: true,
              muxPlaybackId: true,
              resources: {
                select: { id: true, title: true, url: true, type: true },
              },
            },
          },
        },
      },
    },
  });
}

// ── Analytics ────────────────────────────────────────────────────────────────

function normalizePrice(value: number | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Enter a valid course price.");
  }
  return Number(value.toFixed(2));
}

function decimalToNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function getPreferredCurrency(payoutDetails: unknown, fallback = "NGN") {
  const details = (payoutDetails as { preferredCurrency?: unknown }) || {};
  const currency = typeof details.preferredCurrency === "string" ? details.preferredCurrency : fallback;
  return currency.toUpperCase();
}

async function submitCoursePricingProposal(
  courseId: string,
  userId: string,
  proposedPrice: number | null
) {
  await requireCourseAccess(courseId, userId, "OWNER");

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      price: true,
      baseCurrency: true,
      instructor: { select: { payoutDetails: true } },
    },
  });
  if (!course) throw new Error("Course not found");
  const currency = getPreferredCurrency(course.instructor.payoutDetails, course.baseCurrency);

  const currentPrice = decimalToNumber(course.price);
  if ((currentPrice ?? null) === (proposedPrice ?? null)) {
    return null;
  }

  const existingPending = await db.coursePricingProposal.findFirst({
    where: { courseId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (existingPending) {
    return db.coursePricingProposal.update({
      where: { id: existingPending.id },
      data: {
        proposedPrice,
        currentPriceSnapshot: course.price,
        currency,
        submittedById: userId,
        adminNote: null,
      },
      select: { id: true },
    });
  }

  return db.coursePricingProposal.create({
    data: {
      courseId,
      proposedPrice,
      currentPriceSnapshot: course.price,
      currency,
      submittedById: userId,
    },
    select: { id: true },
  });
}

export async function getCourseAnalytics(courseId: string, userId: string) {
  const role = await getCourseRole(courseId, userId);
  if (!role) return null;

  const [enrollments, lessonProgressRows, lessons, watchSegments] = await Promise.all([
    db.enrollment.findMany({
      where: { courseId },
      select: { status: true, enrolledAt: true },
      orderBy: { enrolledAt: "asc" },
    }),
    db.lessonProgress.findMany({
      where: {
        percentComplete: { gte: 100 },
        lesson: { module: { courseId } },
      },
      select: { lessonId: true },
    }),
    db.lesson.findMany({
      where: { module: { courseId } },
      orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
      select: { id: true, title: true, contentType: true, module: { select: { title: true } } },
    }),
    db.lessonWatchSegment.groupBy({
      by: ["lessonId", "segmentIndex"],
      where: { lesson: { module: { courseId } } },
      _count: { userId: true },
      _sum: { secondsWatched: true },
      orderBy: [{ lessonId: "asc" }, { segmentIndex: "asc" }],
    }),
  ]);

  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter((e) => e.status === "COMPLETED").length;
  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE").length;
  const completionRate =
    totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  const completionMap = new Map<string, number>();
  for (const row of lessonProgressRows) {
    completionMap.set(row.lessonId, (completionMap.get(row.lessonId) ?? 0) + 1);
  }
  const lessonCompletions = lessons.map((l) => ({
    lessonId: l.id,
    title: l.title,
    moduleTitle: l.module.title,
    count: completionMap.get(l.id) ?? 0,
  }));

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailyMap = new Map<string, number>();
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const e of enrollments) {
    if (e.enrolledAt >= thirtyDaysAgo) {
      const key = e.enrolledAt.toISOString().slice(0, 10);
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }
  }
  const enrollmentsOverTime = Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const watchSegmentMap = new Map<string, { segmentIndex: number; label: string; viewers: number; secondsWatched: number }[]>();
  for (const segment of watchSegments) {
    const startSeconds = segment.segmentIndex * 30;
    const endSeconds = startSeconds + 30;
    const label = `${Math.floor(startSeconds / 60)}:${String(startSeconds % 60).padStart(2, "0")}-${Math.floor(endSeconds / 60)}:${String(endSeconds % 60).padStart(2, "0")}`;
    const current = watchSegmentMap.get(segment.lessonId) ?? [];
    current.push({
      segmentIndex: segment.segmentIndex,
      label,
      viewers: segment._count.userId,
      secondsWatched: segment._sum.secondsWatched ?? 0,
    });
    watchSegmentMap.set(segment.lessonId, current);
  }

  const watchDropOff = lessons
    .filter((lesson) => lesson.contentType === "VIDEO")
    .map((lesson) => ({
      lessonId: lesson.id,
      title: lesson.title,
      moduleTitle: lesson.module.title,
      segments: watchSegmentMap.get(lesson.id) ?? [],
    }));

  return {
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    completionRate,
    lessonCompletions,
    enrollmentsOverTime,
    watchDropOff,
  };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createCourse(
  userId: string,
  data: { title: string; categoryId?: string; difficulty?: Difficulty }
) {
  const base = data.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  let slug = base;
  let attempt = 0;
  while (await db.course.findUnique({ where: { slug }, select: { id: true } })) {
    attempt++;
    slug = `${base}-${attempt}`;
  }

  const owner = await db.user.findUnique({
    where: { id: userId },
    select: { payoutDetails: true },
  });
  const baseCurrency = getPreferredCurrency(owner?.payoutDetails);

  const course = await db.course.create({
    data: {
      title: data.title,
      slug,
      description: "",
      difficulty: data.difficulty ?? "BEGINNER",
      categoryId: data.categoryId ?? null,
      instructorId: userId,
      baseCurrency,
      status: "DRAFT",
    },
    select: { id: true, slug: true },
  });

  await db.courseInstructor.create({
    data: { courseId: course.id, userId, role: "OWNER" },
  });

  return course;
}

// CO_INSTRUCTOR and above can update settings
export async function updateCourseSettings(
  courseId: string,
  userId: string,
  data: {
    title?: string;
    shortDesc?: string;
    description?: string;
    thumbnail?: string;
    promoVideo?: string | null;
    difficulty?: Difficulty;
    categoryId?: string | null;
    previewCount?: number;
    requirements?: string[];
    includes?: string[];
    certificateEnabled?: boolean;
    examGated?: boolean;
    metaTitle?: string | null;
    metaDescription?: string | null;
    price?: number | null;
    finalExamId?: string | null;
  }
) {
  await requireCourseAccess(courseId, userId, "CO_INSTRUCTOR");
  const { price, ...settingsData } = data;
  const normalizedPrice = normalizePrice(price);
  const pricingProposal =
    normalizedPrice !== undefined
      ? await submitCoursePricingProposal(courseId, userId, normalizedPrice)
      : null;

  const course = await db.course.update({
    where: { id: courseId },
    data: {
      ...settingsData,
      requirements: settingsData.requirements ?? undefined,
      includes: settingsData.includes ?? undefined,
      finalExamId: settingsData.finalExamId !== undefined ? settingsData.finalExamId : undefined,
    },
  });

  return { course, pricingProposal };
}

// OWNER only
export async function toggleCoursePublish(courseId: string, userId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId, instructorId: userId },
    select: { status: true },
  });
  if (!course) throw new Error("Not found");
  const newStatus: CourseStatus =
    course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  return db.course.update({
    where: { id: courseId },
    data: { status: newStatus },
    select: { status: true },
  });
}

// OWNER only
export async function deleteCourse(courseId: string, userId: string) {
  await verifyCourseOwnership(courseId, userId);
  return db.course.delete({ where: { id: courseId } });
}

// ── Modules ──────────────────────────────────────────────────────────────────

export async function createModule(courseId: string, userId: string, title: string) {
  await requireCourseAccess(courseId, userId, "CO_INSTRUCTOR");
  const [course, last] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
      select: { status: true },
    }),
    db.module.findFirst({
      where: { courseId },
      orderBy: { position: "desc" },
      select: { position: true },
    }),
  ]);
  if (!course) throw new Error("Course not found");
  const mod = await db.module.create({
    data: {
      title,
      courseId,
      position: (last?.position ?? 0) + 1,
      isPublished: course.status !== "PUBLISHED",
    },
    select: { id: true, title: true, position: true, isPublished: true },
  });
  return { ...mod, lessons: [] as never[] };
}

export async function updateModule(moduleId: string, userId: string, title: string) {
  const mod = await db.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!mod) throw new Error("Module not found");
  await requireCourseAccess(mod.courseId, userId, "CO_INSTRUCTOR");
  return db.module.update({ where: { id: moduleId }, data: { title } });
}

export async function deleteModule(moduleId: string, userId: string) {
  const mod = await db.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!mod) throw new Error("Module not found");
  await requireCourseAccess(mod.courseId, userId, "CO_INSTRUCTOR");
  return db.module.delete({ where: { id: moduleId } });
}

export async function reorderModules(
  courseId: string,
  userId: string,
  orderedIds: string[]
) {
  await requireCourseAccess(courseId, userId, "CO_INSTRUCTOR");
  await Promise.all(
    orderedIds.map((id, idx) =>
      db.module.update({ where: { id }, data: { position: idx + 1 } })
    )
  );
}

// ── Lessons ──────────────────────────────────────────────────────────────────

export async function createLesson(moduleId: string, userId: string, title: string) {
  const mod = await db.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true, course: { select: { status: true } } },
  });
  if (!mod) throw new Error("Module not found");
  await requireCourseAccess(mod.courseId, userId, "CO_INSTRUCTOR");

  const last = await db.lesson.findFirst({
    where: { moduleId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const lesson = await db.lesson.create({
    data: {
      title,
      moduleId,
      position: (last?.position ?? 0) + 1,
      isPublished: mod.course.status !== "PUBLISHED",
    },
    select: {
      id: true, title: true, position: true, isPublished: true, isPreview: true,
      duration: true, videoUrl: true, overview: true, contentType: true, transcript: true,
      bodyContent: true,
      muxStatus: true, muxPlaybackId: true,
    },
  });
  return { ...lesson, quiz: null, resources: [] as { id: string; title: string; url: string; type: string }[] };
}

export async function updateLessonPublishState(lessonId: string, userId: string, isPublished: boolean) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) throw new Error("Lesson not found");
  await requireCourseAccess(lesson.module.courseId, userId, "CO_INSTRUCTOR");
  return db.lesson.update({
    where: { id: lessonId },
    data: { isPublished },
    select: { id: true, isPublished: true },
  });
}

export async function updateModulePublishState(moduleId: string, userId: string, isPublished: boolean) {
  const mod = await db.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!mod) throw new Error("Module not found");
  await requireCourseAccess(mod.courseId, userId, "CO_INSTRUCTOR");
  return db.module.update({
    where: { id: moduleId },
    data: { isPublished },
    select: { id: true, isPublished: true },
  });
}

export async function updateLesson(
  lessonId: string,
  userId: string,
  data: {
    title?: string;
    videoUrl?: string | null;
    overview?: string | null;
    duration?: number | null;
    isPreview?: boolean;
    transcript?: string | null;
    bodyContent?: string | null;
    contentType?: ContentType;
  }
) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) throw new Error("Lesson not found");
  await requireCourseAccess(lesson.module.courseId, userId, "CO_INSTRUCTOR");
  return db.lesson.update({ where: { id: lessonId }, data });
}

export async function deleteLesson(lessonId: string, userId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) throw new Error("Lesson not found");
  await requireCourseAccess(lesson.module.courseId, userId, "CO_INSTRUCTOR");
  return db.lesson.delete({ where: { id: lessonId } });
}

export async function reorderLessons(
  moduleId: string,
  userId: string,
  orderedIds: string[]
) {
  const mod = await db.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  if (!mod) throw new Error("Module not found");
  await requireCourseAccess(mod.courseId, userId, "CO_INSTRUCTOR");
  await Promise.all(
    orderedIds.map((id, idx) =>
      db.lesson.update({ where: { id }, data: { position: idx + 1 } })
    )
  );
}

export async function moveAndReorderLessons(
  lessonId: string,
  sourceModuleId: string,
  targetModuleId: string,
  targetOrderedIds: string[],
  userId: string
) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) throw new Error("Lesson not found");
  await requireCourseAccess(lesson.module.courseId, userId, "CO_INSTRUCTOR");

  const targetMod = await db.module.findUnique({
    where: { id: targetModuleId },
    select: { courseId: true },
  });
  if (!targetMod) throw new Error("Target module not found");
  await requireCourseAccess(targetMod.courseId, userId, "CO_INSTRUCTOR");

  if (lesson.module.courseId !== targetMod.courseId) {
    throw new Error("Cannot move lessons across different courses");
  }

  await db.lesson.update({
    where: { id: lessonId },
    data: { moduleId: targetModuleId },
  });

  await Promise.all(
    targetOrderedIds.map((id, idx) =>
      db.lesson.update({ where: { id }, data: { position: idx + 1 } })
    )
  );

  const sourceLessons = await db.lesson.findMany({
    where: { moduleId: sourceModuleId },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  await Promise.all(
    sourceLessons.map((l, idx) =>
      db.lesson.update({ where: { id: l.id }, data: { position: idx + 1 } })
    )
  );
}

// ── Co-instructor Management ──────────────────────────────────────────────────

// Any roster member can view the team
export async function getCourseInstructors(courseId: string, userId: string) {
  await requireCourseAccess(courseId, userId, "TEACHING_ASSISTANT");
  return db.courseInstructor.findMany({
    where: { courseId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
}

// OWNER only
export async function createCourseInvite(
  courseId: string,
  ownerId: string,
  email: string,
  role: CourseInstructorRole = "CO_INSTRUCTOR"
) {
  await verifyCourseOwnership(courseId, ownerId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [invite, course] = await Promise.all([
    db.courseInvite.create({
      data: { courseId, email, role, invitedBy: ownerId, expiresAt },
      select: { id: true, token: true, email: true, role: true, expiresAt: true },
    }),
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
  ]);

  const roleLabel = role === "CO_INSTRUCTOR" ? "Co-Instructor" : "Teaching Assistant";

  // Always send invite email
  const inviter = await db.user.findUnique({ where: { id: ownerId }, select: { name: true } });
  await sendCourseInviteEmail(email, invite.token, course?.title ?? "a course", role, inviter?.name ?? undefined);

  // If the invited email already belongs to a platform user, also send in-app notification
  const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    await createNotification(
      existingUser.id,
      "COURSE_INVITE",
      `You've been invited as ${roleLabel}`,
      `You have been invited to join "${course?.title ?? "a course"}" as ${roleLabel}.`,
      { token: invite.token, courseId }
    );
  }

  return invite;
}

export async function getPendingCourseInvites(courseId: string, userId: string) {
  await requireCourseAccess(courseId, userId, "OWNER");
  return db.courseInvite.findMany({
    where: {
      courseId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, token: true, email: true, role: true, expiresAt: true, createdAt: true },
  });
}

// Used by the invite acceptance page
export async function getCourseInviteByToken(token: string) {
  return db.courseInvite.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      email: true,
      role: true,
      expiresAt: true,
      usedAt: true,
      courseId: true,
      course: {
        select: { id: true, title: true, thumbnail: true, slug: true },
      },
    },
  });
}

export async function acceptCourseInvite(token: string, userId: string) {
  const invite = await db.courseInvite.findUnique({
    where: { token },
    select: { id: true, courseId: true, role: true, expiresAt: true, usedAt: true, email: true },
  });
  if (!invite) throw new Error("Invalid invite link.");
  if (invite.usedAt) throw new Error("This invite has already been used.");
  if (invite.expiresAt < new Date()) throw new Error("This invite has expired.");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });
  if (user?.email !== invite.email) {
    throw new Error("This invite was sent to a different email address.");
  }

  await db.courseInstructor.create({
    data: { courseId: invite.courseId, userId, role: invite.role },
  });

  await db.courseInvite.update({
    where: { id: invite.id },
    data: { usedAt: new Date(), usedBy: userId },
  });

  // Upgrade user to INSTRUCTOR platform role when accepting as CO_INSTRUCTOR
  if (invite.role === "CO_INSTRUCTOR" && user?.role === "USER") {
    await db.user.update({
      where: { id: userId },
      data: {
        role: "INSTRUCTOR",
        ...getInstructorRoleTransitionData("INSTRUCTOR"),
      },
    });
  }

  return { courseId: invite.courseId };
}

// OWNER only
export async function removeCourseInstructor(
  courseId: string,
  ownerId: string,
  targetUserId: string
) {
  await verifyCourseOwnership(courseId, ownerId);
  if (targetUserId === ownerId) throw new Error("Cannot remove the course owner.");
  return db.courseInstructor.delete({
    where: { courseId_userId: { courseId, userId: targetUserId } },
  });
}

// OWNER only
export async function updateCourseInstructorRole(
  courseId: string,
  ownerId: string,
  targetUserId: string,
  role: CourseInstructorRole
) {
  await verifyCourseOwnership(courseId, ownerId);
  if (targetUserId === ownerId) throw new Error("Cannot change the owner's role.");
  if (role === "OWNER") throw new Error("Cannot transfer ownership via this function.");
  return db.courseInstructor.update({
    where: { courseId_userId: { courseId, userId: targetUserId } },
    data: { role },
  });
}
