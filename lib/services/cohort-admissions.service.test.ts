import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cohortFindFirst: vi.fn(),
  applicationFindUnique: vi.fn(),
  applicationUpsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    cohort: { findFirst: mocks.cohortFindFirst },
    cohortApplication: {
      findUnique: mocks.applicationFindUnique,
      upsert: mocks.applicationUpsert,
    },
  },
}));

import { saveCohortApplication } from "./cohort-admissions.service";

const now = new Date("2026-08-23T12:00:00Z");
const input = {
  background: "I have completed several self-directed projects and regularly work through structured feedback with peers.",
  goals: "I want to build a strong end-to-end project and explain the decisions clearly in a portfolio case study.",
  prerequisites: "I have a suitable laptop, can use web applications, and have prepared the required foundations.",
  portfolioUrl: "https://example.test/work",
  country: "Nigeria",
  experienceLevel: "SOME_EXPERIENCE" as const,
  weeklyHours: 8,
  hasLaptop: true,
  hasReliableInternet: true,
  commitmentConfirmed: true,
};

describe("cohort admissions service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cohortFindFirst.mockResolvedValue({
      id: "cohort-1",
      status: "APPLICATIONS_OPEN",
      applicationOpenAt: new Date("2026-08-01T00:00:00Z"),
      applicationCloseAt: new Date("2026-09-01T00:00:00Z"),
    });
    mocks.applicationFindUnique.mockResolvedValue(null);
    mocks.applicationUpsert.mockResolvedValue({ id: "application-1" });
  });

  it("saves an idempotent draft for an open cohort", async () => {
    const result = await saveCohortApplication("preview-cohort", "user-1", input, { now });

    expect(result).toEqual({ success: true, applicationId: "application-1", status: "DRAFT" });
    expect(mocks.applicationUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { cohortId_userId: { cohortId: "cohort-1", userId: "user-1" } },
    }));
  });

  it("submits a complete application once", async () => {
    const result = await saveCohortApplication("preview-cohort", "user-1", input, { submit: true, now });

    expect(result).toEqual({ success: true, applicationId: "application-1", status: "SUBMITTED" });
    expect(mocks.applicationUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ status: "SUBMITTED", submittedAt: now }),
    }));
  });

  it("refuses applications outside the published window", async () => {
    const result = await saveCohortApplication("preview-cohort", "user-1", input, {
      now: new Date("2026-09-02T00:00:00Z"),
    });

    expect(result).toMatchObject({ success: false, code: "APPLICATIONS_CLOSED" });
    expect(mocks.applicationUpsert).not.toHaveBeenCalled();
  });

  it("locks an application after submission", async () => {
    mocks.applicationFindUnique.mockResolvedValue({ id: "application-1", status: "SUBMITTED" });

    const result = await saveCohortApplication("preview-cohort", "user-1", input, { now });

    expect(result).toMatchObject({ success: false, code: "APPLICATION_LOCKED" });
    expect(mocks.applicationUpsert).not.toHaveBeenCalled();
  });
});
