import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  projectFindFirst: vi.fn(),
  submissionFindUnique: vi.fn(),
  submissionUpsert: vi.fn(),
  versionCreate: vi.fn(),
  submissionUpdate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    cohortProject: { findFirst: mocks.projectFindFirst },
    projectSubmission: { findUnique: mocks.submissionFindUnique, upsert: mocks.submissionUpsert },
    $transaction: vi.fn(async (callback) => callback({
      projectSubmission: { findUnique: mocks.submissionFindUnique, update: mocks.submissionUpdate },
      projectSubmissionVersion: { create: mocks.versionCreate },
    })),
  },
}));

import { saveProjectSubmissionDraft, submitProjectForReview } from "./project-submissions.service";

const input = {
  title: "A documented creative workflow",
  summary: "A sufficiently detailed project summary explaining the problem, process, decisions, evaluation method, revisions, and final outcome for review.",
  artifactUrl: "https://example.test/artifact",
  repositoryUrl: "",
  demoUrl: "",
  coverImageUrl: "",
  showcaseConsent: true,
};

describe("project submission service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.projectFindFirst.mockResolvedValue({ id: "project-1", dueAt: null, cohort: { slug: "cohort" } });
    mocks.submissionFindUnique.mockResolvedValue(null);
    mocks.submissionUpsert.mockResolvedValue({ id: "submission-1", status: "DRAFT" });
  });

  it("refuses drafts when the learner has no active cohort access", async () => {
    mocks.projectFindFirst.mockResolvedValue(null);
    const result = await saveProjectSubmissionDraft("project-1", "learner-1", input);
    expect(result).toMatchObject({ success: false });
    expect(mocks.submissionUpsert).not.toHaveBeenCalled();
  });

  it("preserves an immutable version before locking work for review", async () => {
    const current = { id: "submission-1", status: "CHANGES_REQUESTED", currentVersion: 2, ...input, artifactUrl: input.artifactUrl, repositoryUrl: null, demoUrl: null, coverImageUrl: null };
    mocks.submissionFindUnique.mockResolvedValueOnce({ id: "submission-1", status: "CHANGES_REQUESTED" }).mockResolvedValueOnce(current);
    mocks.submissionUpdate.mockResolvedValue({ id: "submission-1", currentVersion: 3 });
    const submittedAt = new Date("2026-08-23T16:00:00.000Z");

    const result = await submitProjectForReview("project-1", "learner-1", input, submittedAt);

    expect(result).toMatchObject({ success: true, status: "SUBMITTED", version: 3 });
    expect(mocks.versionCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ submissionId: "submission-1", version: 3, submittedAt }) });
    expect(mocks.submissionUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "SUBMITTED", currentVersion: 3 }) }));
  });
});
