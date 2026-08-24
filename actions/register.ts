"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { signIn } from "@/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { generateTapbackAvatar } from "@/lib/avatar";
import { getMarketingSettings, PIONEER_COHORT } from "@/data/marketing";
import { awardPioneerAchievement } from "@/lib/services/achievements.service";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function getSafeRedirectPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_LOGIN_REDIRECT;
  }

  return value;
}

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, firstName, lastName, callbackUrl } = validatedFields.data;
  const rateLimit = await enforceRateLimit("register", email, RATE_LIMITS.auth);
  if (!rateLimit.allowed) {
    return { error: `Too many registration attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` };
  }
  const fullName = `${firstName} ${lastName}`;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const avatarUrl = generateTapbackAvatar(fullName);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  const marketingSettings = await getMarketingSettings();
  const shouldAwardPioneer = marketingSettings.launchMode && marketingSettings.pioneerBadgeEnabled;

  const user = await db.user.create({
    data: {
      firstName,
      lastName,
      name: fullName,
      email,
      password: hashedPassword,
      image: avatarUrl,
      onboardingCohort: shouldAwardPioneer ? PIONEER_COHORT : null,
      pioneerJoinedAt: shouldAwardPioneer ? new Date() : null,
    },
    select: { id: true },
  });

  if (shouldAwardPioneer) {
    await awardPioneerAchievement(user.id);
  }

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(
    verificationToken.identifier,
    verificationToken.token,
    fullName
  );

  await signIn("credentials", {
    email,
    password,
    redirectTo: getSafeRedirectPath(callbackUrl),
  });

  return {
    success: shouldAwardPioneer
      ? "Welcome onboard. You're part of the CSCN Pioneer Cohort."
      : "Registration successful!",
  };
};
