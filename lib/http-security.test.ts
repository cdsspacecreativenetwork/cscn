import { describe, expect, it } from "vitest";

import { readTextBody, RequestBodyTooLargeError } from "./http-security";

describe("readTextBody", () => {
  it("reads a body within the configured limit", async () => {
    const request = new Request("http://localhost/webhook", { method: "POST", body: "hello" });
    await expect(readTextBody(request, 5)).resolves.toBe("hello");
  });

  it("rejects a declared oversized body before reading it", async () => {
    const request = new Request("http://localhost/webhook", {
      method: "POST",
      body: "small",
      headers: { "content-length": "100" },
    });
    await expect(readTextBody(request, 10)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("rejects a streamed body that crosses the limit", async () => {
    const request = new Request("http://localhost/webhook", { method: "POST", body: "six!!!" });
    await expect(readTextBody(request, 5)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });
});
