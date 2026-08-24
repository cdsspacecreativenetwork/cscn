import { afterEach, describe, expect, it, vi } from "vitest";

import { authorizeCronRequest } from "./operational-auth";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("authorizeCronRequest", () => {
  it("accepts the configured bearer secret", () => {
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    const request = new Request("http://localhost/api/cron/test", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    expect(authorizeCronRequest(request)).toEqual({ authorized: true });
  });

  it("rejects an incorrect secret", () => {
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    const request = new Request("http://localhost/api/cron/test", {
      headers: { authorization: "Bearer incorrect" },
    });
    expect(authorizeCronRequest(request)).toMatchObject({ authorized: false, status: 401 });
  });

  it("fails closed when production has no secret", () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(authorizeCronRequest(new Request("http://localhost/api/cron/test"))).toMatchObject({
      authorized: false,
      status: 503,
    });
  });
});
