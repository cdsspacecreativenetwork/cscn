import { describe, expect, it } from "vitest";

import { canEditProjectSubmission, projectDraftSchema, projectSubmissionSchema, validateRubricScores } from "./project-submission";

describe("project submission rules", () => {
  it("requires meaningful evidence and an http(s) link", () => {
    const result = projectSubmissionSchema.safeParse({ title: "Capstone", summary: "short", artifactUrl: "javascript:alert(1)", repositoryUrl: "", demoUrl: "", coverImageUrl: "", showcaseConsent: true });
    expect(result.success).toBe(false);
  });

  it("allows an incomplete draft without weakening final submission rules", () => {
    const draft = { title: "", summary: "", artifactUrl: "", repositoryUrl: "", demoUrl: "", coverImageUrl: "", showcaseConsent: false };
    expect(projectDraftSchema.safeParse(draft).success).toBe(true);
    expect(projectSubmissionSchema.safeParse(draft).success).toBe(false);
  });

  it("locks submitted and approved work while allowing requested revisions", () => {
    expect(canEditProjectSubmission("SUBMITTED")).toBe(false);
    expect(canEditProjectSubmission("APPROVED")).toBe(false);
    expect(canEditProjectSubmission("CHANGES_REQUESTED")).toBe(true);
  });

  it("requires one bounded integer score per criterion", () => {
    const criteria = [{ id: "quality", maxScore: 5 }, { id: "clarity", maxScore: 3 }];
    expect(validateRubricScores(criteria, [{ criterionId: "quality", score: 5 }, { criterionId: "clarity", score: 3 }])).toBeNull();
    expect(validateRubricScores(criteria, [{ criterionId: "quality", score: 6 }, { criterionId: "clarity", score: 3 }])).toBeTruthy();
    expect(validateRubricScores(criteria, [{ criterionId: "quality", score: 5 }])).toBeTruthy();
  });
});
