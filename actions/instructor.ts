"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import {
  createCourse,
  updateCourseSettings,
  toggleCoursePublish,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  moveAndReorderLessons,
  getCourseAnalytics,
  getCourseInstructors,
  createCourseInvite,
  removeCourseInstructor,
  updateCourseInstructorRole,
  requireCourseAccess,
} from "@/data/instructor";
import type { CourseInstructorRole, Difficulty, ContentType, ResourceType } from "@prisma/client";
import { assertCreatorReadyForReview } from "@/lib/trust-gates";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireInstructor() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) throw new Error("Unauthorized");
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }
  return user.id;
}

// ── Course ────────────────────────────────────────────────────────────────────

export async function createCourseAction(data: {
  title: string;
  categoryId?: string;
  difficulty?: Difficulty;
}) {
  const userId = await requireInstructor();
  await assertCreatorReadyForReview(userId);
  const course = await createCourse(userId, data);
  revalidatePath("/dashboard/instructor/courses");
  return { courseId: course.id, slug: course.slug };
}

export async function updateCourseSettingsAction(
  courseId: string,
  data: {
    title?: string;
    shortDesc?: string;
    description?: string;
    thumbnail?: string;
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
  const userId = await requireInstructor();
  await updateCourseSettings(courseId, userId, data);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
  revalidatePath("/dashboard/instructor/courses");
}

export async function togglePublishAction(courseId: string) {
  const userId = await requireInstructor();
  const result = await toggleCoursePublish(courseId, userId);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
  revalidatePath("/dashboard/instructor/courses");
  revalidatePath(`/courses`);
  return result;
}

export async function submitForReviewAction(courseId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  await import("@/data/instructor").then(({ requireCourseAccess }) =>
    requireCourseAccess(courseId, userId, "OWNER")
  );
  await assertCreatorReadyForReview(userId);
  await import("@/lib/db").then(({ db }) =>
    db.course.update({ where: { id: courseId }, data: { status: "PENDING_REVIEW" } })
  );
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

export async function withdrawFromReviewAction(courseId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  await import("@/data/instructor").then(({ requireCourseAccess }) =>
    requireCourseAccess(courseId, userId, "OWNER")
  );
  await import("@/lib/db").then(({ db }) =>
    db.course.update({ where: { id: courseId }, data: { status: "DRAFT" } })
  );
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

export async function markFeedbackAddressedAction(reviewId: string, courseId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  const { markReviewAddressed } = await import("@/data/course-reviews");
  await markReviewAddressed(reviewId, userId);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
  revalidatePath(`/dashboard/admin/courses/${courseId}`);
  return { success: true };
}

export async function resolveFeedbackAction(itemId: string, courseId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  const { resolveFeedback } = await import("@/data/course-feedback");
  await resolveFeedback(itemId, userId);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
  revalidatePath(`/dashboard/admin/courses/${courseId}`);
  return { success: true };
}

export async function deleteCourseAction(courseId: string) {
  const userId = await requireInstructor();
  await deleteCourse(courseId, userId);
  revalidatePath("/dashboard/instructor/courses");
}

export async function uploadThumbnailAction(
  courseId: string,
  formData: FormData
) {
  const userId = await requireInstructor();
  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `courses/${courseId}/${uuidv4()}.${ext}`;

  const { error } = await supabase.storage
    .from("thumbnails")
    .upload(fileName, file, { contentType: file.type, cacheControl: "3600", upsert: true });

  if (error) return { error: error.message ?? "Upload failed" };

  const { data: urlData } = supabase.storage
    .from("thumbnails")
    .getPublicUrl(fileName);

  await updateCourseSettings(courseId, userId, { thumbnail: urlData.publicUrl });
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
  return { url: urlData.publicUrl };
}

// ── Modules ───────────────────────────────────────────────────────────────────

export async function createModuleAction(courseId: string, title: string) {
  const userId = await requireInstructor();
  const mod = await createModule(courseId, userId, title);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
  return mod;
}

export async function updateModuleAction(moduleId: string, title: string, courseId: string) {
  const userId = await requireInstructor();
  await updateModule(moduleId, userId, title);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

export async function deleteModuleAction(moduleId: string, courseId: string) {
  const userId = await requireInstructor();
  await deleteModule(moduleId, userId);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

export async function reorderModulesAction(courseId: string, orderedIds: string[]) {
  const userId = await requireInstructor();
  await reorderModules(courseId, userId, orderedIds);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export async function createLessonAction(
  moduleId: string,
  title: string,
  courseId: string
) {
  const userId = await requireInstructor();
  const lesson = await createLesson(moduleId, userId, title);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
  return lesson;
}

export async function updateLessonAction(
  lessonId: string,
  courseId: string,
  data: {
    title?: string;
    videoUrl?: string | null;
    duration?: number | null;
    isPreview?: boolean;
    transcript?: string | null;
    bodyContent?: string | null;
    contentType?: ContentType;
  }
) {
  const userId = await requireInstructor();
  await updateLesson(lessonId, userId, data);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

export async function deleteLessonAction(lessonId: string, courseId: string) {
  const userId = await requireInstructor();
  await deleteLesson(lessonId, userId);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

export async function reorderLessonsAction(
  moduleId: string,
  courseId: string,
  orderedIds: string[]
) {
  const userId = await requireInstructor();
  await reorderLessons(moduleId, userId, orderedIds);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

export async function moveAndReorderLessonsAction(
  lessonId: string,
  sourceModuleId: string,
  targetModuleId: string,
  targetOrderedIds: string[],
  courseId: string
) {
  const userId = await requireInstructor();
  await moveAndReorderLessons(lessonId, sourceModuleId, targetModuleId, targetOrderedIds, userId);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

// â”€â”€ Lesson resources â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type LessonResourcePayload = {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
};

function normalizeResourceUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function safeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

async function ensureLessonResourcesBucket() {
  const bucketName = "lesson-resources";
  const { data } = await supabase.storage.listBuckets();
  if (data?.some((bucket) => bucket.name === bucketName)) return bucketName;

  await supabase.storage.createBucket(bucketName, {
    public: true,
  });

  return bucketName;
}

async function ensureLessonMediaBucket() {
  const bucketName = "lesson-media";
  const { data } = await supabase.storage.listBuckets();
  if (data?.some((bucket) => bucket.name === bucketName)) return bucketName;

  await supabase.storage.createBucket(bucketName, {
    public: true,
  });

  return bucketName;
}

async function requireLessonAccess(courseId: string, lessonId: string, userId: string) {
  await requireCourseAccess(courseId, userId, "CO_INSTRUCTOR");
  const lesson = await import("@/lib/db").then(({ db }) =>
    db.lesson.findFirst({
      where: { id: lessonId, module: { courseId } },
      select: { id: true },
    })
  );
  if (!lesson) throw new Error("Lesson not found");
}

export async function listReusableLessonResourcesAction(
  courseId: string,
  lessonId: string
): Promise<LessonResourcePayload[]> {
  const userId = await requireInstructor();
  await requireLessonAccess(courseId, lessonId, userId);
  const { db } = await import("@/lib/db");

  const resources = await db.lessonResource.findMany({
    where: {
      lessonId: { not: lessonId },
      lesson: { module: { courseId } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, url: true, type: true },
    take: 80,
  });

  const seen = new Set<string>();
  return resources.filter((resource) => {
    const key = `${resource.url}::${resource.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function addLessonResourceLinkAction(
  courseId: string,
  lessonId: string,
  data: { title: string; url: string }
): Promise<{ resource?: LessonResourcePayload; error?: string }> {
  try {
    const userId = await requireInstructor();
    await requireLessonAccess(courseId, lessonId, userId);

    const title = data.title.trim();
    const url = normalizeResourceUrl(data.url);
    if (!title) return { error: "Resource title is required." };
    if (!/^https?:\/\/\S+\.\S+/i.test(url)) return { error: "Enter a valid URL." };

    const { db } = await import("@/lib/db");
    const resource = await db.lessonResource.create({
      data: { lessonId, title, url, type: "LINK" },
      select: { id: true, title: true, url: true, type: true },
    });

    revalidatePath(`/dashboard/instructor/courses/${courseId}`);
    return { resource };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to add resource." };
  }
}

export async function uploadLessonResourceAction(
  courseId: string,
  lessonId: string,
  formData: FormData
): Promise<{ resource?: LessonResourcePayload; error?: string }> {
  try {
    const userId = await requireInstructor();
    await requireLessonAccess(courseId, lessonId, userId);

    const file = formData.get("file") as File | null;
    const rawTitle = String(formData.get("title") ?? "").trim();
    if (!file) return { error: "Choose a file to upload." };
    if (file.size > 50 * 1024 * 1024) return { error: "Resource files must be 50MB or smaller." };

    const title = rawTitle || file.name.replace(/\.[^.]+$/, "");
    const ext = file.name.split(".").pop()?.toLowerCase() || "file";
    const path = `courses/${courseId}/lessons/${lessonId}/${uuidv4()}-${safeFileName(file.name)}`;
    const type: ResourceType = file.type === "application/pdf" || ext === "pdf" ? "PDF" : "FILE";
    const bucketName = await ensureLessonResourcesBucket();

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) return { error: error.message ?? "Upload failed." };

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    const { db } = await import("@/lib/db");
    const resource = await db.lessonResource.create({
      data: { lessonId, title, url: urlData.publicUrl, type },
      select: { id: true, title: true, url: true, type: true },
    });

    revalidatePath(`/dashboard/instructor/courses/${courseId}`);
    return { resource };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to upload resource." };
  }
}

export async function uploadLessonMediaImageAction(
  courseId: string,
  lessonId: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    const userId = await requireInstructor();
    await requireLessonAccess(courseId, lessonId, userId);

    const file = formData.get("file") as File | null;
    if (!file) return { error: "Choose an image to upload." };
    if (!file.type.startsWith("image/")) return { error: "Only image files can be inserted into article lessons." };
    if (file.size > 10 * 1024 * 1024) return { error: "Images must be 10MB or smaller." };

    const path = `courses/${courseId}/lessons/${lessonId}/images/${uuidv4()}-${safeFileName(file.name)}`;
    const bucketName = await ensureLessonMediaBucket();

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) return { error: error.message ?? "Image upload failed." };

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    return { url: urlData.publicUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to upload image." };
  }
}

export async function attachExistingLessonResourceAction(
  courseId: string,
  lessonId: string,
  sourceResourceId: string
): Promise<{ resource?: LessonResourcePayload; error?: string }> {
  try {
    const userId = await requireInstructor();
    await requireLessonAccess(courseId, lessonId, userId);
    const { db } = await import("@/lib/db");

    const source = await db.lessonResource.findFirst({
      where: {
        id: sourceResourceId,
        lesson: { module: { courseId } },
      },
      select: { title: true, url: true, type: true },
    });
    if (!source) return { error: "Reusable resource not found." };

    const duplicate = await db.lessonResource.findFirst({
      where: { lessonId, url: source.url },
      select: { id: true, title: true, url: true, type: true },
    });
    if (duplicate) return { resource: duplicate };

    const resource = await db.lessonResource.create({
      data: {
        lessonId,
        title: source.title,
        url: source.url,
        type: source.type,
      },
      select: { id: true, title: true, url: true, type: true },
    });

    revalidatePath(`/dashboard/instructor/courses/${courseId}`);
    return { resource };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to attach resource." };
  }
}

export async function deleteLessonResourceAction(
  courseId: string,
  lessonId: string,
  resourceId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const userId = await requireInstructor();
    await requireLessonAccess(courseId, lessonId, userId);
    const { db } = await import("@/lib/db");
    await db.lessonResource.deleteMany({
      where: { id: resourceId, lessonId },
    });
    revalidatePath(`/dashboard/instructor/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete resource." };
  }
}

export async function getCourseAnalyticsAction(courseId: string) {
  const userId = await requireInstructor();
  return getCourseAnalytics(courseId, userId);
}

// ── Co-instructor Actions ─────────────────────────────────────────────────────

export async function getCourseInstructorsAction(courseId: string) {
  const userId = await requireInstructor();
  return getCourseInstructors(courseId, userId);
}

export async function inviteCoInstructorAction(
  courseId: string,
  email: string,
  role: CourseInstructorRole = "CO_INSTRUCTOR"
) {
  const userId = await requireInstructor();
  const invite = await createCourseInvite(courseId, userId, email, role);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
  return invite;
}

export async function removeCourseInstructorAction(
  courseId: string,
  targetUserId: string
) {
  const userId = await requireInstructor();
  await removeCourseInstructor(courseId, userId, targetUserId);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

export async function updateCourseInstructorRoleAction(
  courseId: string,
  targetUserId: string,
  role: CourseInstructorRole
) {
  const userId = await requireInstructor();
  await updateCourseInstructorRole(courseId, userId, targetUserId, role);
  revalidatePath(`/dashboard/instructor/courses/${courseId}`);
}

export async function getAvailableExamsAction() {
  await requireInstructor();
  const { db } = await import("@/lib/db");
  return db.exam.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, duration: true },
  });
}
