import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  memberFindFirst: vi.fn(),
  seatPackageFindFirst: vi.fn(),
  programCourseFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    organizationMember: { findFirst: mocks.memberFindFirst },
    organizationSeatPackage: { findFirst: mocks.seatPackageFindFirst },
    programCourse: { findMany: mocks.programCourseFindMany },
  },
}));

import { allocateOrganizationSeat, canManageOrganization, canManageOrganizationBilling } from "./organization.service";

describe("organization seat access", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps management and billing roles explicitly scoped", () => {
    expect(canManageOrganization("MANAGER")).toBe(true);
    expect(canManageOrganizationBilling("MANAGER")).toBe(false);
    expect(canManageOrganizationBilling("BILLING")).toBe(true);
  });

  it("rejects allocation by a learner", async () => {
    mocks.memberFindFirst.mockResolvedValue(null);
    const result = await allocateOrganizationSeat({ organizationId: "org-1", seatPackageId: "package-1", organizationMemberId: "member-1", actorUserId: "learner-1" });
    expect(result).toMatchObject({ success: false });
    expect(mocks.seatPackageFindFirst).not.toHaveBeenCalled();
  });

  it("rejects packages that have not been activated", async () => {
    mocks.memberFindFirst.mockResolvedValue({ id: "manager-member" });
    mocks.seatPackageFindFirst.mockResolvedValue(null);
    const result = await allocateOrganizationSeat({ organizationId: "org-1", seatPackageId: "package-1", organizationMemberId: "member-1", actorUserId: "manager-1" });
    expect(result).toEqual({ success: false, error: "This seat package is not active." });
  });

  it("keeps an existing active allocation idempotent", async () => {
    mocks.memberFindFirst.mockResolvedValue({ id: "manager-member" });
    mocks.seatPackageFindFirst.mockResolvedValue({ id: "package-1", quantity: 1, programId: "program-1", cohortId: null, cohort: null, allocations: [{ id: "allocation-1", organizationMemberId: "member-1" }] });
    const result = await allocateOrganizationSeat({ organizationId: "org-1", seatPackageId: "package-1", organizationMemberId: "member-1", actorUserId: "manager-1" });
    expect(result).toEqual({ success: true, idempotent: true });
    expect(mocks.programCourseFindMany).not.toHaveBeenCalled();
  });

  it("does not over-allocate purchased capacity", async () => {
    mocks.memberFindFirst.mockResolvedValue({ id: "manager-member" });
    mocks.seatPackageFindFirst.mockResolvedValue({ id: "package-1", quantity: 1, programId: "program-1", cohortId: null, cohort: null, allocations: [{ id: "allocation-1", organizationMemberId: "other-member" }] });
    const result = await allocateOrganizationSeat({ organizationId: "org-1", seatPackageId: "package-1", organizationMemberId: "member-1", actorUserId: "manager-1" });
    expect(result).toEqual({ success: false, error: "Every purchased seat is already allocated." });
  });
});
