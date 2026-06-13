import "server-only";

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getSecretKey() {
  const secret = process.env.CALENDAR_TOKEN_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Calendar token encryption secret is not configured.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptToken(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Invalid encrypted token format.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
