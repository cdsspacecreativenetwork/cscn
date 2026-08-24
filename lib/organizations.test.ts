import { describe, expect, it } from "vitest";

import { createInvitationToken, hashInvitationToken, optionalWebUrl, organizationRequestInput, seatRequestInput } from "@/lib/organizations";

describe("organization inputs", () => {
  it("requires one learning target for a seat request", () => {
    expect(seatRequestInput.safeParse({ programId: "program-1", cohortId: null, quantity: 8, notes: null }).success).toBe(true);
    expect(seatRequestInput.safeParse({ programId: "program-1", cohortId: "cohort-1", quantity: 8, notes: null }).success).toBe(false);
  });

  it("accepts reviewable organization details", () => {
    expect(organizationRequestInput.safeParse({ name: "Northstar", slug: "northstar", type: "COMPANY", description: "A practical team learning request for a product group.", websiteUrl: null, officialDomain: "northstar.test", country: "Nigeria" }).success).toBe(true);
  });

  it("creates opaque invitation tokens and stable hashes", () => {
    const token = createInvitationToken();
    expect(token.length).toBeGreaterThan(20);
    expect(hashInvitationToken(token)).toBe(hashInvitationToken(token));
    expect(hashInvitationToken(token)).not.toContain(token);
  });

  it("rejects non-web URLs", () => {
    expect(optionalWebUrl("javascript:alert(1)")).toBeNull();
  });
});
