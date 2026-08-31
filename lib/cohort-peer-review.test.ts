import { describe, expect, it } from "vitest";
import { buildPeerReviewAssignments } from "./cohort-peer-review";

describe("peer review assignment builder", () => {
  const submissions = [
    { id: "submission-a", userId: "learner-a" },
    { id: "submission-b", userId: "learner-b" },
    { id: "submission-c", userId: "learner-c" },
  ];

  it("assigns the requested number without self-review", () => {
    const assignments = buildPeerReviewAssignments(submissions, 2);
    expect(assignments).toHaveLength(6);
    expect(assignments.every((item) => item.reviewerId !== item.revieweeId)).toBe(true);
    expect(new Set(assignments.map((item) => `${item.submissionId}:${item.reviewerId}`)).size).toBe(6);
  });

  it("caps assignments for small cohorts and skips existing pairs", () => {
    const assignments = buildPeerReviewAssignments(submissions.slice(0, 2), 2, [
      { submissionId: "submission-a", reviewerId: "learner-b" },
    ]);
    expect(assignments).toEqual([
      { submissionId: "submission-b", reviewerId: "learner-a", revieweeId: "learner-b" },
    ]);
  });

  it("returns no assignments when fewer than two learners submitted", () => {
    expect(buildPeerReviewAssignments(submissions.slice(0, 1), 2)).toEqual([]);
  });
});
