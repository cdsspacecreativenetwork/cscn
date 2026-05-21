import jwt from 'jsonwebtoken';

type AudienceType = 'v' | 't' | 's' | 'g'; // video, thumbnail, storyboard, GIF

/**
 * Signs a Mux playback token using RS256.
 * The signing key Mux provides is a base64-encoded RSA private key (PEM format).
 *
 * Smart expiry: 3× lesson duration + 30 min buffer, minimum 60 min, maximum 12 hours.
 * This ensures a token never expires mid-lesson even if the user pauses for a while.
 */
export function signMuxToken(
  playbackId: string,
  type: AudienceType = 'v',
  lessonDurationMins: number | null = null
): string {
  const keyId = process.env.MUX_SIGNING_KEY_ID!;
  const rawKey = process.env.MUX_SIGNING_KEY_SECRET!;
  const privateKey = Buffer.from(rawKey, 'base64').toString('ascii');

  const durationMins = lessonDurationMins ?? 0;
  const expiryMins = Math.min(Math.max(durationMins * 3 + 30, 60), 720);

  return jwt.sign(
    { sub: playbackId, aud: type },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: `${expiryMins}m`,
      keyid: keyId,
    }
  );
}
