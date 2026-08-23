import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  courseFindUnique: vi.fn(),
  enrollmentFindUnique: vi.fn(),
  enrollmentUpsert: vi.fn(),
  purchaseOrderFindUnique: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    course: { findUnique: mocks.courseFindUnique },
    enrollment: {
      findUnique: mocks.enrollmentFindUnique,
      upsert: mocks.enrollmentUpsert,
    },
    purchaseOrder: { findUnique: mocks.purchaseOrderFindUnique },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  enrollInPublishedFreeCourse,
  grantPaidCourseAccess,
} from "./enrollment-access.service";

describe("enrollment access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enrollmentFindUnique.mockResolvedValue(null);
    mocks.enrollmentUpsert.mockResolvedValue({ id: "enrollment-1" });
  });

  it("allows a learner to enroll in a published free course", async () => {
    mocks.courseFindUnique.mockResolvedValue({
      id: "course-free",
      slug: "qa-free-course",
      price: 0,
    });

    const result = await enrollInPublishedFreeCourse("learner-1", "qa-free-course");

    expect(result).toMatchObject({
      success: true,
      courseId: "course-free",
      alreadyEnrolled: false,
    });
    expect(mocks.enrollmentUpsert).toHaveBeenCalledOnce();
  });

  it("refuses direct enrollment in a paid course", async () => {
    mocks.courseFindUnique.mockResolvedValue({
      id: "course-paid",
      slug: "qa-paid-course",
      price: 25000,
    });

    const result = await enrollInPublishedFreeCourse("learner-1", "qa-paid-course");

    expect(result).toEqual({
      success: false,
      code: "PAYMENT_REQUIRED",
      error: "Payment is required before enrolling in this course.",
    });
    expect(mocks.enrollmentUpsert).not.toHaveBeenCalled();
  });

  it("grants paid access only after a matching successful payment", async () => {
    mocks.purchaseOrderFindUnique.mockResolvedValue({
      id: "order-1",
      userId: "learner-1",
      courseId: "course-paid",
      status: "PAID",
      amount: 25000,
      currency: "NGN",
      paidAt: new Date("2026-08-23T10:00:00Z"),
      course: { id: "course-paid", slug: "qa-paid-course" },
      payments: [
        {
          amount: 25000,
          currency: "NGN",
          paidAt: new Date("2026-08-23T10:00:00Z"),
        },
      ],
    });

    const result = await grantPaidCourseAccess("order-1");

    expect(result).toMatchObject({ success: true, courseId: "course-paid" });
    expect(mocks.enrollmentUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_courseId: { userId: "learner-1", courseId: "course-paid" },
        },
      })
    );
  });

  it("refuses a paid order whose successful payment does not match", async () => {
    mocks.purchaseOrderFindUnique.mockResolvedValue({
      id: "order-1",
      userId: "learner-1",
      courseId: "course-paid",
      status: "PAID",
      amount: 25000,
      currency: "NGN",
      paidAt: new Date("2026-08-23T10:00:00Z"),
      course: { id: "course-paid", slug: "qa-paid-course" },
      payments: [
        {
          amount: 100,
          currency: "NGN",
          paidAt: new Date("2026-08-23T10:00:00Z"),
        },
      ],
    });

    const result = await grantPaidCourseAccess("order-1");

    expect(result).toMatchObject({ success: false, code: "PAYMENT_MISMATCH" });
    expect(mocks.enrollmentUpsert).not.toHaveBeenCalled();
  });

  it("keeps an existing active enrollment idempotent", async () => {
    mocks.courseFindUnique.mockResolvedValue({
      id: "course-paid",
      slug: "qa-paid-course",
      price: 25000,
    });
    mocks.enrollmentFindUnique.mockResolvedValue({
      id: "enrollment-1",
      status: "ACTIVE",
    });

    const result = await enrollInPublishedFreeCourse("learner-1", "qa-paid-course");

    expect(result).toMatchObject({ success: true, alreadyEnrolled: true });
    expect(mocks.enrollmentUpsert).not.toHaveBeenCalled();
  });
});
