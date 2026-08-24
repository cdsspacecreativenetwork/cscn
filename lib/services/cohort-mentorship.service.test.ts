import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ assignmentFindFirst: vi.fn(), submissionFindFirst: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    cohortMentorAssignment: { findFirst: mocks.assignmentFindFirst },
    projectSubmission: { findFirst: mocks.submissionFindFirst },
  },
}));

import { validateCohortMentorshipBookingContext } from "./cohort-mentorship.service";

describe("cohort mentorship booking context", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires an active mentor assignment and learner membership", async () => {
    mocks.assignmentFindFirst.mockResolvedValue(null);
    const result = await validateCohortMentorshipBookingContext({ cohortId: "cohort-1", mentorId: "mentor-1", studentId: "learner-1" });
    expect(result).toMatchObject({ success: false });
    expect(mocks.submissionFindFirst).not.toHaveBeenCalled();
  });

  it("rejects project context owned by another learner or cohort", async () => {
    mocks.assignmentFindFirst.mockResolvedValue({ id: "assignment-1" });
    mocks.submissionFindFirst.mockResolvedValue(null);
    const result = await validateCohortMentorshipBookingContext({ cohortId: "cohort-1", mentorId: "mentor-1", studentId: "learner-1", projectSubmissionId: "submission-2" });
    expect(result).toMatchObject({ success: false });
  });

  it("accepts a valid assigned mentor and owned project context", async () => {
    mocks.assignmentFindFirst.mockResolvedValue({ id: "assignment-1" });
    mocks.submissionFindFirst.mockResolvedValue({ id: "submission-1" });
    const result = await validateCohortMentorshipBookingContext({ cohortId: "cohort-1", mentorId: "mentor-1", studentId: "learner-1", projectSubmissionId: "submission-1" });
    expect(result).toEqual({ success: true, assignmentId: "assignment-1" });
  });
});
