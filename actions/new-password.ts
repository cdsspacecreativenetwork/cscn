"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";

const Schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function newPasswordAction(values: z.infer<typeof Schema>) {
  const parsed = Schema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { token, password } = parsed.data;

  const resetToken = await getPasswordResetTokenByToken(token);
  if (!resetToken) return { error: "Invalid or expired reset link." };
  if (resetToken.expiresAt < new Date()) return { error: "This reset link has expired. Please request a new one." };

  const user = await db.user.findUnique({
    where: { email: resetToken.email },
    select: { id: true },
  });
  if (!user) return { error: "Account not found." };

  const hashed = await bcrypt.hash(password, 12);

  await Promise.all([
    db.user.update({ where: { id: user.id }, data: { password: hashed } }),
    db.passwordResetToken.delete({ where: { id: resetToken.id } }),
  ]);

  return { success: "Password updated! You can now sign in." };
}
