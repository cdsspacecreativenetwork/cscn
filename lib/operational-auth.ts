import { timingSafeEqual } from "node:crypto";

export type OperationalAuthResult =
  | { authorized: true }
  | { authorized: false; status: 401 | 503; error: string };

function secretsMatch(expected: string, provided: string) {
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export function authorizeCronRequest(request: Request): OperationalAuthResult {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return { authorized: false, status: 503, error: "Cron authentication is not configured." };
    }
    return { authorized: true };
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const provided = request.headers.get("x-cron-secret")?.trim() || bearer || "";
  if (!secretsMatch(expected, provided)) {
    return { authorized: false, status: 401, error: "Unauthorized" };
  }
  return { authorized: true };
}
