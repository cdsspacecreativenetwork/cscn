import { describe, expect, it } from "vitest";

import { parseCommaList, safeHttpUrl, valuesFromJson } from "@/lib/community-career";

describe("community and career input helpers", () => {
  it("normalizes and deduplicates comma lists", () => {
    expect(parseCommaList("Design, AI, Design,  Research ", 8)).toEqual(["Design", "AI", "Research"]);
  });

  it("accepts only web URLs", () => {
    expect(safeHttpUrl("https://example.com/jobs/1")).toBe("https://example.com/jobs/1");
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
  });

  it("reads only string JSON array values", () => {
    expect(valuesFromJson(["React", 3, "Design"])).toEqual(["React", "Design"]);
  });
});
