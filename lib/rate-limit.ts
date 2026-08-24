import { createHash } from "node:crypto";

import { db } from "@/lib/db";

type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export const RATE_LIMITS = {
  auth: { limit: 5, windowMs: 60_000 },
  passwordReset: { limit: 3, windowMs: 15 * 60_000 },
  enrollment: { limit: 10, windowMs: 60_000 },
  checkout: { limit: 5, windowMs: 60_000 },
  mentorBooking: { limit: 5, windowMs: 5 * 60_000 },
  upload: { limit: 10, windowMs: 10 * 60_000 },
} satisfies Record<string, RateLimitRule>;

export function createRateLimitKey(scope: string, subject: string) {
  const normalized = subject.trim().toLowerCase();
  const digest = createHash("sha256").update(normalized).digest("hex");
  return `${scope}:${digest}`;
}

export async function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
  now = new Date(),
): Promise<RateLimitResult> {
  const expiresAt = new Date(now.getTime() + rule.windowMs);
  const rows = await db.$queryRaw<Array<{ count: number; expiresAt: Date }>>`
    INSERT INTO "RateLimitBucket" ("key", "count", "expiresAt", "updatedAt")
    VALUES (${key}, 1, ${expiresAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt}
        ELSE "RateLimitBucket"."expiresAt"
      END,
      "updatedAt" = ${now}
    RETURNING "count", "expiresAt"
  `;

  const bucket = rows[0] ?? { count: rule.limit + 1, expiresAt };
  return {
    allowed: bucket.count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function enforceRateLimit(scope: string, subject: string, rule: RateLimitRule) {
  return consumeRateLimit(createRateLimitKey(scope, subject), rule);
}
