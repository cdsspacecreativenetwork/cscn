import crypto from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyPaystackSignature } from "./paystack";

afterEach(() => vi.unstubAllEnvs());

describe("verifyPaystackSignature", () => {
  it("accepts the expected HMAC and rejects malformed signatures", () => {
    const secret = "local-paystack-webhook-secret";
    const body = '{"event":"charge.success"}';
    vi.stubEnv("PAYSTACK_SECRET_KEY", secret);
    const signature = crypto.createHmac("sha512", secret).update(body).digest("hex");

    expect(verifyPaystackSignature(body, signature)).toBe(true);
    expect(verifyPaystackSignature(body, "wrong-length")).toBe(false);
    expect(verifyPaystackSignature(body, null)).toBe(false);
  });
});
