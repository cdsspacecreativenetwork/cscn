import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  membershipFindFirst: vi.fn(),
  announcementFindMany: vi.fn(),
  scheduleFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    cohortMembership: { findFirst: mocks.membershipFindFirst, findMany: vi.fn() },
    announcement: { findMany: mocks.announcementFindMany },
    scheduleEvent: { findMany: mocks.scheduleFindMany },
  },
}));

vi.mock("@/lib/services/cohort-mentorship.service", () => ({
  getCohortMentorshipForLearner: vi.fn().mockResolvedValue(null),
}));

import { getCohortLearningDashboard } from "./cohort-learning.service";

describe("cohort learning service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.announcementFindMany.mockResolvedValue([]);
    mocks.scheduleFindMany.mockResolvedValue([]);
  });

  it("does not expose a cohort dashboard without active membership", async () => {
    mocks.membershipFindFirst.mockResolvedValue(null);
    expect(await getCohortLearningDashboard("learner-1", "private-cohort")).toBeNull();
    expect(mocks.announcementFindMany).not.toHaveBeenCalled();
    expect(mocks.scheduleFindMany).not.toHaveBeenCalled();
  });

  it("calculates course and overall progress from published lessons", async () => {
    mocks.membershipFindFirst.mockResolvedValue({
      id: "membership-1",
      status: "ACTIVE",
      joinedAt: new Date(),
      completedAt: null,
      cohort: {
        id: "cohort-1",
        title: "October cohort",
        slug: "october-cohort",
        status: "APPLICATIONS_CLOSED",
        startsAt: new Date("2026-10-01T00:00:00Z"),
        endsAt: new Date("2026-12-01T00:00:00Z"),
        timezone: "Africa/Lagos",
        scheduleSummary: "Weekly",
        weeklySchedule: [],
        graduationRules: [],
        leadInstructor: null,
        program: {
          title: "Program",
          shortDescription: "Description",
          estimatedDurationWeeks: 8,
          school: { name: "School" },
          courses: [{
            position: 1,
            required: true,
            minimumCompletionPercentage: 80,
            course: {
              id: "course-1",
              title: "Course",
              slug: "course",
              shortDesc: null,
              thumbnail: null,
              enrollments: [{ id: "enrollment-1" }],
              modules: [{ lessons: [
                { id: "lesson-1", title: "Done", progress: [{ percentComplete: 100, completedAt: new Date() }] },
                { id: "lesson-2", title: "Next", progress: [] },
              ] }],
            },
          }],
        },
      },
    });

    const result = await getCohortLearningDashboard("learner-1", "october-cohort");
    expect(result?.courses[0]).toMatchObject({ progress: 50, completedLessons: 1, lessonCount: 2, nextLessonId: "lesson-2" });
    expect(result?.overallProgress).toBe(50);
  });
});
