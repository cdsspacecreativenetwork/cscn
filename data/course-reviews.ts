import { db } from "@/lib/db";
import type { ReviewStatus, CourseStatus } from "@prisma/client";
import { createNotification } from "@/data/notifications";
import type { NotificationType } from "@prisma/client";

// CHANGES_REQUESTED keeps the course in PENDING_REVIEW (admin is leaving feedback, not rejecting).
// REJECTED sends it back to DRAFT so the instructor can rework and resubmit.
const REVIEW_TO_COURSE_STATUS: Partial<Record<ReviewStatus, CourseStatus>> = {
  APPROVED: "PUBLISHED",
  REJECTED:  "DRAFT",
  // CHANGES_REQUESTED intentionally omitted — course status does not change
};

const REVIEW_TO_NOTIFICATION: Record<ReviewStatus, NotificationType> = {
  APPROVED:          "COURSE_PUBLISHED",
  CHANGES_REQUESTED: "COURSE_CHANGES_REQUESTED",
  REJECTED:          "COURSE_REJECTED",
};

const REVIEW_TITLES: Record<ReviewStatus, string> = {
  APPROVED:          "Course approved and published",
  CHANGES_REQUESTED: "Changes requested on your course",
  REJECTED:          "Course rejected — please revise and resubmit",
};

export async function submitCourseReview(
  courseId: string,
  reviewerId: string,
  status: ReviewStatus,
  comment?: string
) {
  const reviewer = await db.user.findUnique({
    where: { id: reviewerId },
    select: { role: true },
  });
  if (!reviewer || (reviewer.role !== "ADMIN" && reviewer.role !== "SUPER_ADMIN")) {
    throw new Error("Only admins can review courses.");
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true, instructorId: true, status: true },
  });
  if (!course) throw new Error("Course not found.");
  if (course.status !== "PENDING_REVIEW") {
    throw new Error("Only courses pending review can be reviewed.");
  }

  const newCourseStatus = REVIEW_TO_COURSE_STATUS[status];

  const [review] = await Promise.all([
    db.courseReview.create({
      data: { courseId, reviewerId, status, comment },
      select: { id: true, status: true, comment: true, createdAt: true },
    }),
    // Only update course status for APPROVED and REJECTED
    ...(newCourseStatus
      ? [db.course.update({ where: { id: courseId }, data: { status: newCourseStatus } })]
      : []),
  ]);

  const body = comment ? `Reviewer note: "${comment}"` : undefined;
  await createNotification(
    course.instructorId,
    REVIEW_TO_NOTIFICATION[status],
    `${REVIEW_TITLES[status]}: ${course.title}`,
    body,
    { courseId, reviewId: review.id }
  );

  return review;
}

export async function markReviewAddressed(reviewId: string, instructorId: string) {
  const review = await db.courseReview.findUnique({
    where: { id: reviewId },
    select: { courseId: true, status: true, addressedAt: true,
              course: { select: { instructorId: true } } },
  });
  if (!review) throw new Error("Review not found.");
  if (review.course.instructorId !== instructorId) throw new Error("Forbidden.");
  if (review.status !== "CHANGES_REQUESTED") throw new Error("Only change-request reviews can be marked addressed.");
  if (review.addressedAt) throw new Error("Already marked as addressed.");

  return db.courseReview.update({
    where: { id: reviewId },
    data: { addressedAt: new Date(), addressedBy: instructorId },
    select: { id: true, addressedAt: true },
  });
}

export async function getCourseReviews(courseId: string) {
  return db.courseReview.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      comment: true,
      addressedAt: true,
      createdAt: true,
      reviewer: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function getLatestCourseReview(courseId: string) {
  return db.courseReview.findFirst({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      comment: true,
      addressedAt: true,
      createdAt: true,
      reviewer: { select: { name: true, image: true } },
    },
  });
}
