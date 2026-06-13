import { db } from "@/lib/db";
import { createNotification } from "@/data/notifications";

type AdminReviewAudience = "COURSE_REVIEW" | "PRICING_REVIEW";

async function getCourseNotificationContext(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      instructorId: true,
      enrollments: {
        where: { status: "ACTIVE" },
        select: { userId: true },
      },
    },
  });
}

async function getAdminRecipients(audience: AdminReviewAudience) {
  const permissionWhere =
    audience === "PRICING_REVIEW"
      ? { canManageBilling: true }
      : { OR: [{ canReviewCourses: true }, { canPublishCourses: true }, { canManageCourses: true }] };

  return db.user.findMany({
    where: {
      OR: [
        { role: "SUPER_ADMIN" },
        {
          role: "ADMIN",
          ...permissionWhere,
        },
      ],
    },
    select: { id: true },
  });
}

export async function notifyCourseReviewAdmins(courseId: string, kind: "NEW_COURSE" | "PUBLISHED_UPDATE") {
  const [course, admins] = await Promise.all([
    getCourseNotificationContext(courseId),
    getAdminRecipients("COURSE_REVIEW"),
  ]);
  if (!course || admins.length === 0) return;

  const title =
    kind === "PUBLISHED_UPDATE"
      ? `Course update needs review: ${course.title}`
      : `Course needs review: ${course.title}`;
  const body =
    kind === "PUBLISHED_UPDATE"
      ? "An instructor submitted changes to a published course. The live course remains untouched until approval."
      : "An instructor submitted a course for review before it can go live.";

  for (const admin of admins) {
    await createNotification(admin.id, "SYSTEM", title, body, {
      kind: "COURSE_REVIEW",
      courseId,
    }, {
      actionRequired: true,
      actionLabel: "Review course",
      actionUrl: `/dashboard/admin/courses/${courseId}`,
    });
  }
}

export async function notifyPricingReviewAdmins(courseId: string) {
  const [course, admins] = await Promise.all([
    getCourseNotificationContext(courseId),
    getAdminRecipients("PRICING_REVIEW"),
  ]);
  if (!course || admins.length === 0) return;

  for (const admin of admins) {
    const existing = await db.notification.findFirst({
      where: {
        userId: admin.id,
        readAt: null,
        actionStatus: "PENDING",
        data: {
          path: ["kind"],
          equals: "PRICING_REVIEW",
        },
      },
      select: { id: true, data: true },
    });
    const existingData = existing?.data as { courseId?: string } | null;
    if (existingData?.courseId === courseId) continue;

    await createNotification(admin.id, "SYSTEM", `Pricing needs review: ${course.title}`, "A course price was proposed and needs finance approval.", {
      kind: "PRICING_REVIEW",
      courseId,
    }, {
      actionRequired: true,
      actionLabel: "Review pricing",
      actionUrl: `/dashboard/admin/courses/${courseId}?tab=settings`,
    });
  }
}

export async function notifyEnrolledStudentsCourseUpdated(courseId: string) {
  const course = await getCourseNotificationContext(courseId);
  if (!course) return;

  for (const enrollment of course.enrollments) {
    await createNotification(
      enrollment.userId,
      "SYSTEM",
      `Course updated: ${course.title}`,
      "New approved course updates are now available in your learning experience.",
      { kind: "COURSE_UPDATE_PUBLISHED", courseId },
      {
        actionLabel: "View course",
        actionUrl: `/courses/${course.slug}`,
      }
    );
  }
}
