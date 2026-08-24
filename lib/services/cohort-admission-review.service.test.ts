import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applicationFindUnique: vi.fn(),
  applicationUpdateMany: vi.fn(),
  membershipUpsert: vi.fn(),
  programCourseFindMany: vi.fn(),
  enrollmentUpsert: vi.fn(),
  notification: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    cohortApplication: { findUnique: mocks.applicationFindUnique },
    $transaction: vi.fn(async (callback) => callback({
      cohortApplication: { updateMany: mocks.applicationUpdateMany },
      cohortMembership: { upsert: mocks.membershipUpsert },
      programCourse: { findMany: mocks.programCourseFindMany },
      enrollment: { upsert: mocks.enrollmentUpsert },
    })),
  },
}));
vi.mock("@/data/notifications", () => ({ createNotification: mocks.notification }));
vi.mock("@/data/audit-logs", () => ({ createAuditLog: mocks.audit }));

import { reviewCohortApplication } from "./cohort-admission-review.service";

const reviewer = { id: "admin-1", name: "Admissions Admin", email: "admin@example.test" };
const now = new Date("2026-08-23T12:00:00Z");

function application(price: number) {
  return {
    id: "application-1",
    userId: "learner-1",
    status: "UNDER_REVIEW",
    user: { name: "Learner", email: "learner@example.test" },
    cohort: {
      id: "cohort-1",
      title: "Preview cohort",
      slug: "preview-cohort",
      startsAt: new Date("2026-10-01T12:00:00Z"),
      capacity: 20,
      price,
      currency: "NGN",
      _count: { memberships: 2 },
    },
  };
}

describe("cohort application review service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.applicationUpdateMany.mockResolvedValue({ count: 1 });
    mocks.membershipUpsert.mockResolvedValue({ id: "membership-1" });
    mocks.programCourseFindMany.mockResolvedValue([{ courseId: "course-1" }]);
    mocks.enrollmentUpsert.mockResolvedValue({ id: "enrollment-1" });
    mocks.notification.mockResolvedValue({ id: "notification-1" });
    mocks.audit.mockResolvedValue({ id: "audit-1" });
  });

  it("accepts a paid learner without creating membership before payment", async () => {
    mocks.applicationFindUnique.mockResolvedValue(application(85000));
    const result = await reviewCohortApplication("application-1", "ACCEPTED", "Strong fit for this cohort.", reviewer, now);
    expect(result).toMatchObject({ success: true, membershipCreated: false });
    expect(mocks.membershipUpsert).not.toHaveBeenCalled();
    expect(mocks.applicationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ offerExpiresAt: new Date("2026-08-30T12:00:00Z") }),
    }));
  });

  it("activates free-cohort membership idempotently on acceptance", async () => {
    mocks.applicationFindUnique.mockResolvedValue(application(0));
    const result = await reviewCohortApplication("application-1", "ACCEPTED", "Ready for a no-tuition place.", reviewer, now);
    expect(result).toMatchObject({ success: true, membershipCreated: true, offerExpiresAt: null });
    expect(mocks.membershipUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { cohortId_userId: { cohortId: "cohort-1", userId: "learner-1" } },
      create: expect.objectContaining({ status: "ACTIVE" }),
      update: expect.objectContaining({ status: "ACTIVE" }),
    }));
    expect(mocks.enrollmentUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_courseId: { userId: "learner-1", courseId: "course-1" } },
      create: expect.objectContaining({ status: "ACTIVE" }),
    }));
  });

  it("refuses self-review", async () => {
    mocks.applicationFindUnique.mockResolvedValue(application(0));
    const result = await reviewCohortApplication("application-1", "ACCEPTED", "Ready for a place.", { ...reviewer, id: "learner-1" }, now);
    expect(result).toMatchObject({ success: false, error: "Reviewers cannot decide their own application." });
    expect(mocks.applicationUpdateMany).not.toHaveBeenCalled();
  });
});
