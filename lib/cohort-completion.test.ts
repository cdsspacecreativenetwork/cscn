import { describe, expect, it } from "vitest";
import { calculateCohortCompletion, validateCompletionPolicy } from "./cohort-completion";

describe("cohort completion", () => {
  it("requires weights to total 100", () => {
    const result = validateCompletionPolicy({
      weights: { courses: 20, assignments: 20, quizzes: 20, attendance: 20, peerReviews: 10 },
      minimums: {},
      overallMinimum: 70,
    });
    expect(result.valid).toBe(false);
    expect(result.totalWeight).toBe(90);
  });

  it("requires the overall score and every enabled threshold", () => {
    const result = calculateCohortCompletion(undefined, {
      courses: 90,
      assignments: 85,
      quizzes: 80,
      attendance: 90,
      peerReviews: 50,
    });
    expect(result.overall).toBeGreaterThan(70);
    expect(result.eligible).toBe(false);
    expect(result.requirements.find((item) => item.key === "peerReviews")?.met).toBe(false);
  });

  it("ignores disabled categories", () => {
    const result = calculateCohortCompletion({
      weights: { courses: 50, assignments: 50, quizzes: 0, attendance: 0, peerReviews: 0 },
      minimums: { courses: 80, assignments: 70, quizzes: 100, attendance: 100, peerReviews: 100 },
      overallMinimum: 75,
    }, { courses: 90, assignments: 80 });
    expect(result.overall).toBe(85);
    expect(result.eligible).toBe(true);
  });
});
