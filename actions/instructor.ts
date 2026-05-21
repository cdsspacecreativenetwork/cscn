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
} from "@/data/instructor";
import type { CourseInstructorRole, Difficulty, ContentType } from "@prisma/client";

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
