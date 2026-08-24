import { describe, expect, it } from "vitest";

import { sanitizeArticleHtml } from "./article-html";

describe("sanitizeArticleHtml", () => {
  it("removes executable and unsupported markup", () => {
    const result = sanitizeArticleHtml(
      '<p onclick="alert(1)">Hello<script>alert(2)</script><img src=x onerror=alert(3)></p>',
    );

    expect(result).toBe("<p>Hello</p>");
  });

  it("allows safe article structure and hardens links", () => {
    const result = sanitizeArticleHtml('<h2>Read</h2><a href="https://example.com">Source</a>');

    expect(result).toContain("<h2>Read</h2>");
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it("drops unsafe URL schemes", () => {
    expect(sanitizeArticleHtml('<a href="javascript:alert(1)">Open</a>')).not.toContain("javascript:");
  });
});
