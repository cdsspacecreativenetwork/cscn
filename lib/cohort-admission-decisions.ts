import type { CohortApplicationStatus } from "@prisma/client";

export const REVIEW_DECISIONS = ["UNDER_REVIEW", "ACCEPTED", "WAITLISTED", "DECLINED"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

const allowedTransitions: Record<CohortApplicationStatus, readonly ReviewDecision[]> = {
  DRAFT: [],
  SUBMITTED: ["UNDER_REVIEW", "ACCEPTED", "WAITLISTED", "DECLINED"],
  UNDER_REVIEW: ["ACCEPTED", "WAITLISTED", "DECLINED"],
  ACCEPTED: [],
  WAITLISTED: ["UNDER_REVIEW", "ACCEPTED", "DECLINED"],
  DECLINED: [],
  WITHDRAWN: [],
};

export function canTransitionCohortApplication(
  current: CohortApplicationStatus,
  next: ReviewDecision,
) {
  return allowedTransitions[current].includes(next);
}

export function validateReviewNote(decision: ReviewDecision, note: string) {
  const trimmed = note.trim();
  if ((decision === "WAITLISTED" || decision === "DECLINED") && trimmed.length < 10) {
    return "Add a review note of at least 10 characters for this decision.";
  }
  if (trimmed.length > 2000) return "Review notes cannot exceed 2,000 characters.";
  return null;
}

export function isOfferExpired(offerExpiresAt: Date | null, now = new Date()) {
  return Boolean(offerExpiresAt && offerExpiresAt.getTime() < now.getTime());
}

export function validatePaidCohortAccess(input: {
  applicationStatus: CohortApplicationStatus;
  applicationUserId: string;
  orderUserId: string;
  orderAmount: number;
  cohortPrice: number;
  paidAmount: number;
  orderCurrency: string;
  cohortCurrency: string;
  paidCurrency: string;
  offerExpiresAt: Date | null;
  paidAt: Date;
}) {
  if (input.applicationStatus !== "ACCEPTED") return false;
  if (input.applicationUserId !== input.orderUserId) return false;
  if (input.offerExpiresAt && input.paidAt.getTime() > input.offerExpiresAt.getTime()) return false;
  if (input.orderCurrency !== input.cohortCurrency || input.paidCurrency !== input.orderCurrency) return false;
  return Math.abs(input.paidAmount - input.orderAmount) <= 0.01
    && Math.abs(input.paidAmount - input.cohortPrice) <= 0.01;
}
