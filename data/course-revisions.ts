import { db } from "@/lib/db";
import type { CourseRevisionStatus, Prisma } from "@prisma/client";

const ACTIVE_REVISION_STATUSES: CourseRevisionStatus[] = [
  "DRAFT",
  "PENDING_REVIEW",
  "CHANGES_REQUESTED",
  "REJECTED",
];

export type CourseSnapshot = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDesc: string | null;
  thumbnail: string | null;
  promoVideo: string | null;
  difficulty: string;
  courseType?: string;
  status: string;
  previewCount: number;
  categoryId: string | null;
  requirements: Prisma.JsonValue | null;
  includes: Prisma.JsonValue | null;
  certificateEnabled: boolean;
  examGated: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  price: Prisma.Decimal | number | string | null;
  baseCurrency: string;
  finalExamId: string | null;
  modules: Array<{
    id: string;
    title: string;
    position: number;
    isPublished: boolean;
    isDefault: boolean;
    lessons: Array<{
      id: string;
      title: string;
      position: number;
      videoUrl: string | null;
      overview: string | null;
      duration: number | null;
      isPublished: boolean;
      isPreview: boolean;
      transcript: string | null;
      bodyContent: string | null;
      contentType: string;
      muxStatus: string;
      muxPlaybackId: string | null;
      quiz: Prisma.JsonValue | null;
      resources: Array<{ id: string; title: string; url: string; type: string }>;
    }>;
  }>;
};

export type RevisionMeta = {
  id: string;
  status: CourseRevisionStatus;
  version: number;
  submittedAt: Date | null;
  changeSummary: Prisma.JsonValue | null;
};

function toJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function makeDraftId(prefix: string) {
  return `draft-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeDraftModuleId() {
  return makeDraftId("module");
}

export function makeDraftLessonId() {
  return makeDraftId("lesson");
}

export async function getCourseStatus(courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { status: true },
  });
  if (!course) throw new Error("Course not found");
  return course.status;
}

export async function createCourseSnapshot(courseId: string): Promise<CourseSnapshot> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      shortDesc: true,
      thumbnail: true,
      promoVideo: true,
      difficulty: true,
      courseType: true,
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
      finalExamId: true,
      modules: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          position: true,
          isPublished: true,
          isDefault: true,
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
              muxStatus: true,
              muxPlaybackId: true,
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
                        select: { id: true, text: true, isCorrect: true, position: true },
                      },
                    },
                  },
                },
              },
              resources: {
                select: { id: true, title: true, url: true, type: true },
              },
            },
          },
        },
      },
    },
  });
  if (!course) throw new Error("Course not found");
  return JSON.parse(JSON.stringify(course)) as CourseSnapshot;
}

export function summarizeCourseChanges(live: CourseSnapshot | null, draft: CourseSnapshot) {
  if (!live) {
    return { mode: "initial_publish", changedFields: [], addedModules: [], removedModules: [], editedModules: [], addedLessons: [], removedLessons: [], editedLessons: [] };
  }

  const changedFields = [
    "title",
    "slug",
    "description",
    "shortDesc",
    "thumbnail",
    "promoVideo",
    "difficulty",
    "courseType",
    "previewCount",
    "categoryId",
    "certificateEnabled",
    "examGated",
    "metaTitle",
    "metaDescription",
    "finalExamId",
  ].filter((field) => JSON.stringify(live[field as keyof CourseSnapshot]) !== JSON.stringify(draft[field as keyof CourseSnapshot]));

  const liveModules = new Map(live.modules.map((module) => [module.id, module]));
  const draftModules = new Map(draft.modules.map((module) => [module.id, module]));
  const addedModules = draft.modules.filter((module) => !liveModules.has(module.id)).map((module) => module.title);
  const removedModules = live.modules.filter((module) => !draftModules.has(module.id)).map((module) => module.title);
  const editedModules = draft.modules
    .filter((module) => {
      const liveModule = liveModules.get(module.id);
      return liveModule && (liveModule.title !== module.title || liveModule.position !== module.position || liveModule.isPublished !== module.isPublished);
    })
    .map((module) => module.title);

  const flattenLessons = (snapshot: CourseSnapshot) =>
    snapshot.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title, moduleId: module.id })));
  const liveLessons = new Map(flattenLessons(live).map((lesson) => [lesson.id, lesson]));
  const draftLessons = new Map(flattenLessons(draft).map((lesson) => [lesson.id, lesson]));
  const addedLessons = Array.from(draftLessons.values()).filter((lesson) => !liveLessons.has(lesson.id)).map((lesson) => lesson.title);
  const removedLessons = Array.from(liveLessons.values()).filter((lesson) => !draftLessons.has(lesson.id)).map((lesson) => lesson.title);
  const editedLessons = Array.from(draftLessons.values())
    .filter((lesson) => {
      const liveLesson = liveLessons.get(lesson.id);
      return liveLesson && JSON.stringify(liveLesson) !== JSON.stringify(lesson);
    })
    .map((lesson) => lesson.title);

  return { mode: "update", changedFields, addedModules, removedModules, editedModules, addedLessons, removedLessons, editedLessons };
}

export async function getActiveCourseRevision(courseId: string) {
  return db.courseRevision.findFirst({
    where: { courseId, status: { in: ACTIVE_REVISION_STATUSES } },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      status: true,
      liveSnapshot: true,
      draftSnapshot: true,
      changeSummary: true,
      submittedAt: true,
    },
  });
}

export async function findActiveRevisionContainingDraftItem(itemId: string, itemType: "module" | "lesson") {
  const revisions = await db.courseRevision.findMany({
    where: { status: { in: ACTIVE_REVISION_STATUSES } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      courseId: true,
      draftSnapshot: true,
    },
    take: 100,
  });

  for (const revision of revisions) {
    const snapshot = revision.draftSnapshot as CourseSnapshot;
    const found =
      itemType === "module"
        ? snapshot.modules.some((module) => module.id === itemId)
        : snapshot.modules.some((module) => module.lessons.some((lesson) => lesson.id === itemId));
    if (found) return revision;
  }

  return null;
}

export async function ensureDraftCourseRevision(courseId: string, userId?: string) {
  const existing = await getActiveCourseRevision(courseId);
  if (existing && existing.status !== "PENDING_REVIEW") return existing;
  if (existing?.status === "PENDING_REVIEW") {
    throw new Error("This course update is already pending review. Withdraw it before editing again.");
  }

  const liveSnapshot = await createCourseSnapshot(courseId);
  const latest = await db.courseRevision.findFirst({
    where: { courseId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (latest?.version ?? 0) + 1;

  return db.courseRevision.create({
    data: {
      courseId,
      version,
      status: "DRAFT",
      liveSnapshot: toJson(liveSnapshot),
      draftSnapshot: toJson(liveSnapshot),
      submittedById: userId,
      changeSummary: toJson(summarizeCourseChanges(liveSnapshot, liveSnapshot)),
    },
    select: {
      id: true,
      version: true,
      status: true,
      liveSnapshot: true,
      draftSnapshot: true,
      changeSummary: true,
      submittedAt: true,
    },
  });
}

export async function mutateDraftCourseRevision(
  courseId: string,
  userId: string | undefined,
  mutator: (draft: CourseSnapshot) => CourseSnapshot
) {
  const revision = await ensureDraftCourseRevision(courseId, userId);
  const liveSnapshot = revision.liveSnapshot as CourseSnapshot | null;
  const currentDraft = revision.draftSnapshot as CourseSnapshot;
  const nextDraft = mutator(JSON.parse(JSON.stringify(currentDraft)) as CourseSnapshot);
  const changeSummary = summarizeCourseChanges(liveSnapshot, nextDraft);

  return db.courseRevision.update({
    where: { id: revision.id },
    data: {
      draftSnapshot: toJson(nextDraft),
      changeSummary: toJson(changeSummary),
      status: revision.status === "REJECTED" || revision.status === "CHANGES_REQUESTED" ? "DRAFT" : revision.status,
    },
    select: {
      id: true,
      version: true,
      status: true,
      liveSnapshot: true,
      draftSnapshot: true,
      changeSummary: true,
      submittedAt: true,
    },
  });
}

export async function submitCourseRevisionForReview(courseId: string, userId: string) {
  const revision = await ensureDraftCourseRevision(courseId, userId);
  const draftSnapshot = revision.draftSnapshot as CourseSnapshot;
  const liveSnapshot = revision.liveSnapshot as CourseSnapshot | null;
  const changeSummary = summarizeCourseChanges(liveSnapshot, draftSnapshot);

  return db.courseRevision.update({
    where: { id: revision.id },
    data: {
      status: "PENDING_REVIEW",
      submittedById: userId,
      submittedAt: new Date(),
      changeSummary: toJson(changeSummary),
    },
    select: { id: true, version: true, status: true, changeSummary: true },
  });
}

export async function getStudioCourseRevisionOverlay(courseId: string): Promise<{ snapshot: CourseSnapshot; meta: RevisionMeta } | null> {
  const revision = await getActiveCourseRevision(courseId);
  if (!revision) return null;
  return {
    snapshot: revision.draftSnapshot as CourseSnapshot,
    meta: {
      id: revision.id,
      version: revision.version,
      status: revision.status,
      submittedAt: revision.submittedAt,
      changeSummary: revision.changeSummary,
    },
  };
}

export async function promoteCourseRevision(revisionId: string, reviewerId: string, reviewNote?: string) {
  const revision = await db.courseRevision.findUnique({
    where: { id: revisionId },
    select: { id: true, courseId: true, draftSnapshot: true, status: true },
  });
  if (!revision) throw new Error("Course revision not found.");
  if (revision.status !== "PENDING_REVIEW") {
    throw new Error("Only pending course revisions can be approved.");
  }

  const draft = revision.draftSnapshot as CourseSnapshot;

  await db.course.update({
    where: { id: revision.courseId },
    data: {
      title: draft.title,
      slug: draft.slug,
      description: draft.description,
      shortDesc: draft.shortDesc,
      thumbnail: draft.thumbnail,
      promoVideo: draft.promoVideo,
      difficulty: draft.difficulty as never,
      courseType: (draft.courseType ?? "FULL_COURSE") as never,
      previewCount: draft.previewCount,
      categoryId: draft.categoryId,
      requirements: draft.requirements === null ? undefined : toJson(draft.requirements),
      includes: draft.includes === null ? undefined : toJson(draft.includes),
      certificateEnabled: draft.certificateEnabled,
      examGated: draft.examGated,
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      finalExamId: draft.finalExamId,
      status: "PUBLISHED",
    },
  });

  const liveModules = await db.module.findMany({
    where: { courseId: revision.courseId },
    select: { id: true, lessons: { select: { id: true } } },
  });
  const liveModuleIds = new Set(liveModules.map((module) => module.id));
  const draftModuleIds = new Set(draft.modules.filter((module) => !module.id.startsWith("draft-")).map((module) => module.id));

  for (const module of liveModules) {
    if (!draftModuleIds.has(module.id)) {
      await db.module.update({ where: { id: module.id }, data: { isPublished: false } });
    }
  }

  for (const module of draft.modules) {
    let moduleId = module.id;
    if (module.id.startsWith("draft-") || !liveModuleIds.has(module.id)) {
      const created = await db.module.create({
        data: {
          courseId: revision.courseId,
          title: module.title,
          position: module.position,
          isPublished: module.isPublished,
          isDefault: module.isDefault,
        },
        select: { id: true },
      });
      moduleId = created.id;
    } else {
      await db.module.update({
        where: { id: module.id },
        data: {
          title: module.title,
          position: module.position,
          isPublished: module.isPublished,
          isDefault: module.isDefault,
        },
      });
    }

    const liveLessons = await db.lesson.findMany({
      where: { moduleId },
      select: { id: true },
    });
    const liveLessonIds = new Set(liveLessons.map((lesson) => lesson.id));
    const draftLessonIds = new Set(module.lessons.filter((lesson) => !lesson.id.startsWith("draft-")).map((lesson) => lesson.id));
    for (const lesson of liveLessons) {
      if (!draftLessonIds.has(lesson.id)) {
        await db.lesson.update({ where: { id: lesson.id }, data: { isPublished: false } });
      }
    }

    for (const lesson of module.lessons) {
      let lessonId = lesson.id;
      const lessonData = {
        title: lesson.title,
        position: lesson.position,
        videoUrl: lesson.videoUrl,
        overview: lesson.overview,
        duration: lesson.duration,
        isPublished: lesson.isPublished,
        isPreview: lesson.isPreview,
        transcript: lesson.transcript,
        bodyContent: lesson.bodyContent,
        contentType: lesson.contentType as never,
      };

      if (lesson.id.startsWith("draft-") || !liveLessonIds.has(lesson.id)) {
        const created = await db.lesson.create({
          data: { ...lessonData, moduleId },
          select: { id: true },
        });
        lessonId = created.id;
      } else {
        await db.lesson.update({ where: { id: lesson.id }, data: lessonData });
      }

      await db.lessonResource.deleteMany({ where: { lessonId } });
      if (lesson.resources.length > 0) {
        await db.lessonResource.createMany({
          data: lesson.resources.map((resource) => ({
            lessonId,
            title: resource.title,
            url: resource.url,
            type: resource.type as never,
          })),
        });
      }
    }
  }

  await db.courseRevision.update({
    where: { id: revision.id },
    data: {
      status: "APPROVED",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNote: reviewNote?.trim() || null,
    },
  });
}

export async function markCourseRevisionReviewed(
  revisionId: string,
  reviewerId: string,
  status: Extract<CourseRevisionStatus, "CHANGES_REQUESTED" | "REJECTED">,
  reviewNote?: string
) {
  return db.courseRevision.update({
    where: { id: revisionId },
    data: {
      status,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNote: reviewNote?.trim() || null,
    },
  });
}
