import { describe, expect, it } from "vitest";

import {
  canTransitionCohortApplication,
  isOfferExpired,
  validateReviewNote,
  validatePaidCohortAccess,
} from "./cohort-admission-decisions";

describe("cohort admission decisions", () => {
  it("allows review only after submission", () => {
    expect(canTransitionCohortApplication("DRAFT", "UNDER_REVIEW")).toBe(false);
    expect(canTransitionCohortApplication("SUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("makes accepted and declined decisions terminal", () => {
    expect(canTransitionCohortApplication("ACCEPTED", "DECLINED")).toBe(false);
    expect(canTransitionCohortApplication("DECLINED", "UNDER_REVIEW")).toBe(false);
  });

  it("permits a waitlisted applicant to return to review or receive a decision", () => {
    expect(canTransitionCohortApplication("WAITLISTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionCohortApplication("WAITLISTED", "ACCEPTED")).toBe(true);
  });

  it("requires useful notes for waitlist and decline decisions", () => {
    expect(validateReviewNote("DECLINED", "Too short")).toBeTruthy();
    expect(validateReviewNote("WAITLISTED", "Strong fit; waiting for a place.")).toBeNull();
  });

  it("recognizes expired offers", () => {
    const now = new Date("2026-08-23T12:00:00Z");
    expect(isOfferExpired(new Date("2026-08-22T12:00:00Z"), now)).toBe(true);
    expect(isOfferExpired(new Date("2026-08-24T12:00:00Z"), now)).toBe(false);
  });

  it("requires an accepted, unexpired, amount-matched payment for membership", () => {
    const valid = {
      applicationStatus: "ACCEPTED" as const,
      applicationUserId: "learner-1",
      orderUserId: "learner-1",
      orderAmount: 85000,
      cohortPrice: 85000,
      paidAmount: 85000,
      orderCurrency: "NGN",
      cohortCurrency: "NGN",
      paidCurrency: "NGN",
      offerExpiresAt: new Date("2026-08-30T12:00:00Z"),
      paidAt: new Date("2026-08-25T12:00:00Z"),
    };
    expect(validatePaidCohortAccess(valid)).toBe(true);
    expect(validatePaidCohortAccess({ ...valid, paidAmount: 100 })).toBe(false);
    expect(validatePaidCohortAccess({ ...valid, applicationStatus: "WAITLISTED" })).toBe(false);
    expect(validatePaidCohortAccess({ ...valid, paidAt: new Date("2026-09-01T12:00:00Z") })).toBe(false);
  });
});
