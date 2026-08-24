import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

import { createRateLimitKey } from "./rate-limit";

describe("createRateLimitKey", () => {
  it("normalizes a subject without storing the raw identity", () => {
    const first = createRateLimitKey("login", " Learner@Example.com ");
    const second = createRateLimitKey("login", "learner@example.com");

    expect(first).toBe(second);
    expect(first).toMatch(/^login:[a-f0-9]{64}$/);
    expect(first).not.toContain("learner@example.com");
  });
});
