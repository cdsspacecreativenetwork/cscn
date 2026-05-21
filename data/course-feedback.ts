import { db } from "@/lib/db";
import { createNotification } from "@/data/notifications";

export async function getCourseFeedback(courseId: string) {
  return db.courseFeedbackItem.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      body: true,
      resolvedAt: true,
      resolvedBy: true,
      createdAt: true,
      author: { select: { id: true, name: true, image: true, role: true } },
    },
  });
}

export async function getUnresolvedFeedbackCount(courseId: string) {
  return db.courseFeedbackItem.count({
    where: { courseId, resolvedAt: null },
  });
}

export async function postFeedback(courseId: string, authorId: string, body: string) {
  // Sequential queries — PrismaNeonHttp doesn't support the implicit transaction
  // that concurrent Promise.all operations can trigger on the same client
  const item = await db.courseFeedbackItem.create({
    data: { courseId, authorId, body },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { id: true, name: true, image: true, role: true } },
    },
  });

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      title: true,
      instructorId: true,
      instructors: { select: { userId: true } },
    },
  });

  if (!course) return item;

  const recipientIds = [
    course.instructorId,
    ...course.instructors.map((i) => i.userId),
  ].filter((id) => id !== authorId);

  const uniqueRecipients = [...new Set(recipientIds)];

  for (const userId of uniqueRecipients) {
    await createNotification(
      userId,
      "COURSE_FEEDBACK",
      `New feedback on "${course.title}"`,
      body.length > 120 ? `${body.slice(0, 120)}…` : body,
      { courseId, feedbackId: item.id }
    );
  }

  return item;
}

export async function resolveFeedback(itemId: string, resolvedById: string) {
  const item = await db.courseFeedbackItem.findUnique({
    where: { id: itemId },
    select: {
      resolvedAt: true,
      courseId: true,
      authorId: true,
      course: { select: { title: true, instructorId: true } },
    },
  });

  if (!item) throw new Error("Feedback item not found.");
  if (item.resolvedAt) throw new Error("Already resolved.");

  const updated = await db.courseFeedbackItem.update({
    where: { id: itemId },
    data: { resolvedAt: new Date(), resolvedBy: resolvedById },
    select: { id: true, resolvedAt: true },
  });

  // Notify the original author that feedback was resolved
  if (item.authorId !== resolvedById) {
    await createNotification(
      item.authorId,
      "COURSE_FEEDBACK_RESOLVED",
      `Feedback resolved on "${item.course.title}"`,
      undefined,
      { courseId: item.courseId, feedbackId: itemId }
    );
  }

  return updated;
}
