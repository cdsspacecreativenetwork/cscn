"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";

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

function getSafeRedirectPath(value?: string | null, intent?: string, isInstructor?: boolean) {
  if (value && value.startsWith("/") && !value.startsWith("//") && value !== "/auth/continue") {
    return value;
  }
  if (isInstructor || intent?.toUpperCase() === "INSTRUCTOR") {
    return "/instructor/onboarding";
  }
  if (intent?.toUpperCase() === "ADMIN") {
    return "/dashboard/admin";
  }
  return "/onboarding/intent";
}

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { password, firstName, lastName, callbackUrl, isInstructor, intent, role } = validatedFields.data;
  const email = validatedFields.data.email.toLowerCase().trim();

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

  const isNonStudent =
    Boolean(isInstructor) ||
    intent?.toUpperCase() === "INSTRUCTOR" ||
    intent?.toUpperCase() === "ADMIN" ||
    role?.toUpperCase() === "ADMIN" ||
    role?.toUpperCase() === "SUPER_ADMIN" ||
    Boolean(callbackUrl?.toLowerCase().includes("/instructor")) ||
    Boolean(callbackUrl?.toLowerCase().includes("/admin"));

  const isStudent = !isNonStudent;

  const marketingSettings = await getMarketingSettings();
  const shouldAwardPioneer = isStudent && marketingSettings.launchMode && marketingSettings.pioneerBadgeEnabled;

  let user: { id: string };
  try {
    user = await db.user.create({
      data: {
        firstName,
        lastName,
        name: fullName,
        email,
        password: hashedPassword,
        image: avatarUrl,
        profile: {
          create: {
            timezone: "Africa/Lagos",
          },
        },
        learnerProfile: {
          create: {
            onboardingCohort: shouldAwardPioneer ? PIONEER_COHORT : null,
            pioneerJoinedAt: shouldAwardPioneer ? new Date() : null,
          },
        },
      },
      select: { id: true },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Email already in use!" };
    }
    throw err;
  }

  if (shouldAwardPioneer) {
    await awardPioneerAchievement(user.id);
  }

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(
    verificationToken.identifier,
    verificationToken.token,
    fullName
  );

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: getSafeRedirectPath(callbackUrl, intent, Boolean(isInstructor)),
    });

    return {
      success: shouldAwardPioneer
        ? "Welcome onboard. You're part of the CSCN Pioneer Cohort."
        : "Registration successful!",
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Account created, but auto sign-in failed. Please sign in manually." };
        default:
          return { error: "Something went wrong during sign-in." };
      }
    }

    throw error;
  }
};
