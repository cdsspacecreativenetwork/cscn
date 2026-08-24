import { describe, expect, it } from "vitest";

import { parseFocusAreas, safeMentorshipReturnPath } from "./cohort-mentorship";

describe("cohort mentorship input rules", () => {
  it("normalizes and deduplicates focus areas", () => {
    expect(parseFocusAreas("Portfolio review, project feedback, Portfolio review")).toEqual(["Portfolio review", "project feedback"]);
  });

  it("only accepts local return paths", () => {
    expect(safeMentorshipReturnPath("/dashboard/cohorts/october")).toBe("/dashboard/cohorts/october");
    expect(safeMentorshipReturnPath("https://attacker.test/redirect")).toBe("/mentorship");
    expect(safeMentorshipReturnPath("//attacker.test/redirect")).toBe("/mentorship");
  });
});
