"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createAuditLog } from "@/data/audit-logs";
import { createNotification } from "@/data/notifications";
import { db } from "@/lib/db";
import { validateRubricScores } from "@/lib/project-submission";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitPeerReviewAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const cohortSlug = text(formData, "cohortSlug");
  const assignmentId = text(formData, "assignmentId");
  let destination = `/dashboard/cohorts/${cohortSlug}?tab=peer-reviews`;

  try {
    const assignment = await db.peerReviewAssignment.findFirst({
      where: {
        id: assignmentId,
        reviewerId: session.user.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        project: { cohort: { slug: cohortSlug, memberships: { some: { userId: session.user.id, role: "LEARNER", status: "ACTIVE" } } } },
      },
      select: {
        id: true,
        revieweeId: true,
        project: { select: { id: true, title: true, rubricCriteria: { orderBy: { position: "asc" }, select: { id: true, maxScore: true } } } },
      },
    });
    if (!assignment) throw new Error("This peer review is unavailable or already submitted.");
    const overallNote = text(formData, "overallNote");
    if (overallNote.length < 40 || overallNote.length > 4000) throw new Error("Write at least 40 characters of constructive overall feedback.");
    const scores = assignment.project.rubricCriteria.map((criterion) => ({
      criterionId: criterion.id,
      score: Number(text(formData, `score:${criterion.id}`)),
      note: text(formData, `note:${criterion.id}`),
    }));
    const scoreError = validateRubricScores(assignment.project.rubricCriteria, scores);
    if (scoreError) throw new Error(scoreError);
    const totalScore = scores.reduce((total, score) => total + score.score, 0);
    const maxScore = assignment.project.rubricCriteria.reduce((total, criterion) => total + criterion.maxScore, 0);
    await db.$transaction(async (tx) => {
      const response = await tx.peerReviewResponse.upsert({
        where: { assignmentId: assignment.id },
        create: { assignmentId: assignment.id, overallNote, totalScore, maxScore },
        update: { overallNote, totalScore, maxScore },
        select: { id: true },
      });
      await tx.peerReviewCriterionScore.deleteMany({ where: { responseId: response.id } });
      await tx.peerReviewCriterionScore.createMany({ data: scores.map((score) => ({ responseId: response.id, ...score, note: score.note || null })) });
      await tx.peerReviewAssignment.update({ where: { id: assignment.id }, data: { status: "SUBMITTED", submittedAt: new Date(), releasedAt: new Date() } });
    });
    await Promise.all([
      createNotification(assignment.revieweeId, "SYSTEM", "New peer feedback", `A classmate reviewed your work for ${assignment.project.title}.`, { kind: "PEER_REVIEW" }, { actionLabel: "View feedback", actionUrl: `/dashboard/cohorts/${cohortSlug}?tab=peer-reviews` }),
      createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "cohort.peer_review_submitted", entityType: "PEER_REVIEW_ASSIGNMENT", entityId: assignment.id, entityName: assignment.project.title }),
    ]);
    revalidatePath(`/dashboard/cohorts/${cohortSlug}`);
    destination += `&success=${encodeURIComponent("Peer review submitted.")}`;
  } catch (error) {
    destination += `&error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to submit peer review.")}`;
  }
  redirect(destination);
}
