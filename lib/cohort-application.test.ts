import { describe, expect, it } from "vitest";

import {
  cohortApplicationSubmissionSchema,
  isCohortApplicationOpen,
  readApplicationAnswers,
} from "./cohort-application";

describe("cohort application rules", () => {
  it("opens only an explicitly open cohort inside its application window", () => {
    const cohort = {
      status: "APPLICATIONS_OPEN",
      applicationOpenAt: new Date("2026-08-01T00:00:00Z"),
      applicationCloseAt: new Date("2026-09-01T00:00:00Z"),
    };

    expect(isCohortApplicationOpen(cohort, new Date("2026-08-23T12:00:00Z"))).toBe(true);
    expect(isCohortApplicationOpen({ ...cohort, status: "APPLICATIONS_CLOSED" }, new Date("2026-08-23T12:00:00Z"))).toBe(false);
    expect(isCohortApplicationOpen(cohort, new Date("2026-09-02T00:00:00Z"))).toBe(false);
  });

  it("requires substantive answers and readiness confirmation before submission", () => {
    const result = cohortApplicationSubmissionSchema.safeParse({
      background: "Too short",
      goals: "Too short",
      prerequisites: "Too short",
      portfolioUrl: "",
      country: "Nigeria",
      experienceLevel: "NEW",
      weeklyHours: 8,
      hasLaptop: false,
      hasReliableInternet: true,
      commitmentConfirmed: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        background: expect.any(Array),
        goals: expect.any(Array),
        hasLaptop: expect.any(Array),
        commitmentConfirmed: expect.any(Array),
      });
    }
  });

  it("reads only known answer fields from stored JSON", () => {
    expect(readApplicationAnswers({ country: "Ghana", experienceLevel: "SOME_EXPERIENCE", weeklyHours: 6, hasLaptop: true })).toEqual({
      country: "Ghana",
      experienceLevel: "SOME_EXPERIENCE",
      weeklyHours: 6,
      hasLaptop: true,
      hasReliableInternet: false,
      commitmentConfirmed: false,
    });
  });
});
