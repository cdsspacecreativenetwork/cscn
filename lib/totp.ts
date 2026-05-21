import crypto from "crypto";

/**
 * Decodes a Base32 string into a binary Buffer.
 */
function base32Decode(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  const length = cleaned.length;
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error("Invalid base32 character: " + cleaned[i]);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Generates a 6-digit TOTP code for a given secret key and time step offset.
 * Implements standard RFC 6238 TOTP with HMAC-SHA1.
 */
export function generateTOTP(secret: string, timeOffsetSteps = 0): string {
  const key = base32Decode(secret);
  
  // 30-second steps
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30) + timeOffsetSteps;
  
  // Write counter as 8-byte big-endian integer
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(0, 0); 
  buffer.writeUInt32BE(counter, 4); 

  // HMAC-SHA1
  const hmac = crypto.createHmac("sha1", key);
  hmac.update(buffer);
  const hash = hmac.digest();

  // Dynamic Truncation
  const offset = hash[hash.length - 1] & 0xf;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit TOTP code against a secret key with a step window for time drift.
 */
export function verifyTOTP(secret: string, code: string): boolean {
  const cleanedCode = code.trim();
  if (cleanedCode.length !== 6 || !/^\d+$/.test(cleanedCode)) {
    return false;
  }

  // Allow ±1 step leeway (30s window before and after) to prevent clock drift failures
  for (let offset = -1; offset <= 1; offset++) {
    if (generateTOTP(secret, offset) === cleanedCode) {
      return true;
    }
  }
  return false;
}

/**
 * Generates a random 16-character base32 secret.
 */
export function generateBase32Secret(length = 16): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = crypto.randomBytes(length);
  let secret = "";
  for (let i = 0; i < length; i++) {
    secret += alphabet[bytes[i] % alphabet.length];
  }
  return secret;
}
