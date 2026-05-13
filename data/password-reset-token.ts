import { db } from "@/lib/db";

export async function getPasswordResetTokenByEmail(email: string) {
  return db.passwordResetToken.findFirst({ where: { email } });
}

export async function getPasswordResetTokenByToken(token: string) {
  return db.passwordResetToken.findUnique({ where: { token } });
}

export async function generatePasswordResetToken(email: string) {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const existing = await getPasswordResetTokenByEmail(email);
  if (existing) {
    await db.passwordResetToken.delete({ where: { id: existing.id } });
  }

  return db.passwordResetToken.create({
    data: { email, expiresAt },
    select: { token: true, email: true, expiresAt: true },
  });
}
