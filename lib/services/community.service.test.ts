import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  spaceFindFirst: vi.fn(),
  cohortMembershipFindFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    communitySpace: { findFirst: mocks.spaceFindFirst },
    cohortMembership: { findFirst: mocks.cohortMembershipFindFirst },
  },
}));

import { canJoinCommunitySpace } from "./community.service";

describe("community membership access", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows an authenticated learner to join a public topic space", async () => {
    mocks.spaceFindFirst.mockResolvedValue({ id: "space-1", slug: "critique", title: "Critique", visibility: "PUBLIC", cohortId: null });

    const result = await canJoinCommunitySpace("space-1", "learner-1");

    expect(result).toMatchObject({ success: true });
    expect(mocks.cohortMembershipFindFirst).not.toHaveBeenCalled();
  });

  it("rejects a private space that is not backed by a cohort", async () => {
    mocks.spaceFindFirst.mockResolvedValue({ id: "space-2", slug: "private", title: "Private", visibility: "MEMBERS_ONLY", cohortId: null });

    await expect(canJoinCommunitySpace("space-2", "learner-1")).resolves.toEqual({
      success: false,
      error: "This community space requires an invitation.",
    });
  });

  it("requires active or completed cohort membership for cohort rooms", async () => {
    mocks.spaceFindFirst.mockResolvedValue({ id: "space-3", slug: "cohort", title: "Cohort", visibility: "MEMBERS_ONLY", cohortId: "cohort-1" });
    mocks.cohortMembershipFindFirst.mockResolvedValue(null);

    const denied = await canJoinCommunitySpace("space-3", "outsider-1");
    expect(denied).toMatchObject({ success: false });

    mocks.cohortMembershipFindFirst.mockResolvedValue({ id: "membership-1" });
    const allowed = await canJoinCommunitySpace("space-3", "learner-1");
    expect(allowed).toMatchObject({ success: true });
  });
});
