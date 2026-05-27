"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { generatePasswordResetToken } from "@/data/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/mail";

const Schema = z.object({ email: z.string().email() });

export async function forgotPasswordAction(values: z.infer<typeof Schema>) {
  const parsed = Schema.safeParse(values);
  if (!parsed.success) return { error: "Invalid email address." };

  const email = parsed.data.email.toLowerCase();

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, password: true },
  });

  // Always return success to prevent email enumeration
  if (!user || !user.password) {
    return { success: "If an account exists, a reset link has been sent." };
  }

  const resetToken = await generatePasswordResetToken(email);
  const result = await sendPasswordResetEmail(email, resetToken.token, user.name ?? undefined);

  if (!result || "error" in result) {
    return {
      error: result?.error ?? "We could not send the reset email. Please try again in a few minutes.",
    };
  }

  return { success: "Password reset link sent! Check your email." };
}
