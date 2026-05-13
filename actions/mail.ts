"use server";

import { auth } from "@/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

/**
 * Manually trigger a resend of the verification email from the dashboard.
 */
export const resendVerificationEmailAction = async () => {
  const session = await auth();

  if (!session?.user) {
    return { error: "Not authenticated" };
  }

  const { email, name, emailVerified } = session.user;

  if (emailVerified) {
    return { error: "Email is already verified" };
  }

  if (!email) {
    return { error: "Email not found in session" };
  }

  try {
    const verificationToken = await generateVerificationToken(email);
    
    const result = await sendVerificationEmail(
      verificationToken.identifier,
      verificationToken.token,
      name ?? "Learner"
    );

    if (!result || 'error' in result) {
      return { error: (result && 'error' in result) ? result.error : "Failed to send email" };
    }

    return { success: "Verification email sent!" };
  } catch (error) {
    console.error("Resend action error:", error);
    return { error: "Failed to resend verification email" };
  }
};
