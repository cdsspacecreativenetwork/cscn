"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { currentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { removeOwnedAvatar } from "@/lib/avatar-storage";
import { sendPasswordChangeOTPEmail } from "@/lib/mail";
import { verifyTOTP, generateBase32Secret } from "@/lib/totp";
import { createPaystackTransferRecipient } from "@/lib/payments/paystack";
import { normalizeScheduleTimeZone } from "@/lib/schedule-time";
import type { Prisma } from "@prisma/client";

type SettingsSession = {
  id: string;
  device: string;
  ip: string;
  active: boolean;
  createdAt: string;
};

type NotificationPreferences = Record<string, boolean>;

type SettingsDetails = Record<string, Prisma.JsonValue | undefined> & {
  _sessions?: SettingsSession[];
  _notifications?: NotificationPreferences;
};

function getSettingsDetails(value: Prisma.JsonValue | null): SettingsDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return { ...value } as SettingsDetails;
}

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });

  if (!dbUser) {
    return { error: "Unauthorized" };
  }

  const previousAvatar = values.image && dbUser.image && values.image !== dbUser.image
    ? dbUser.image
    : null;

  const normalizedTimezone = values.timezone
    ? normalizeScheduleTimeZone(values.timezone)
    : dbUser.profile?.timezone ?? "Africa/Lagos";

  const profileData = {
    bio: values.bio,
    headline: values.headline,
    location: values.location,
    timezone: normalizedTimezone,
    socials: values.socials,
    publicProfileSlug: values.publicProfileSlug,
    publicProfileStatus: values.publicProfileStatus,
    websiteUrl: values.websiteUrl,
    portfolioUrl: values.portfolioUrl,
    linkedinUrl: values.linkedinUrl,
    twitterUrl: values.twitterUrl,
    instagramUrl: values.instagramUrl,
    youtubeUrl: values.youtubeUrl,
    githubUrl: values.githubUrl,
    behanceUrl: values.behanceUrl,
    dribbbleUrl: values.dribbbleUrl,
    telegramUrl: values.telegramUrl,
    expertise: values.expertise,
  };

  const learnerData = {
    learningFocus: values.learningFocus,
    onboardingIntent: values.onboardingIntent,
  };

  const userScalarData = {
    ...(values.firstName !== undefined && { firstName: values.firstName }),
    ...(values.lastName !== undefined && { lastName: values.lastName }),
    ...(values.image !== undefined && { image: values.image }),
    name: [values.firstName ?? dbUser.firstName, values.lastName ?? dbUser.lastName].filter(Boolean).join(" ") || dbUser.name,
  };

  // Update user in database along with Profile and LearnerProfile
  await db.user.update({
    where: { id: dbUser.id },
    data: {
      ...userScalarData,
      profile: {
        upsert: {
          create: profileData,
          update: profileData,
        },
      },
      learnerProfile: {
        upsert: {
          create: learnerData,
          update: learnerData,
        },
      },
    },
  });

  if (previousAvatar) {
    const removed = await removeOwnedAvatar(previousAvatar, dbUser.id);
    if (!removed.success && removed.error !== "Avatar storage is not configured.") {
      console.error("Failed to remove replaced avatar:", removed.error);
    }
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin/users");

  return { success: "Settings Updated!" };
};

export const verifyNuban = async (bankCode: string, accountNumber: string) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
    return { error: "Invalid account number. Must be exactly 10 digits." };
  }

  // Simulate remote verification delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Generates a mock name based on the account number digits
  const firstNames = ["Peter", "Emediong", "Access", "David", "Chidi", "Funmi", "Fatima", "Oluwaseun", "Bayo"];
  const lastNames = ["Okonkwo", "Peter", "Adewale", "Balogun", "Nwachukwu", "Ibrahim", "Alabi", "Adebayo"];
  
  const sum = accountNumber.split("").reduce((acc, digit) => acc + parseInt(digit), 0);
  const firstName = firstNames[sum % firstNames.length];
  const lastName = lastNames[(sum + 3) % lastNames.length];
  
  return { 
    success: true, 
    accountName: `${firstName} ${lastName}`.toUpperCase() 
  };
};

export const updatePayoutSettings = async (data: {
  payoutMethod: string;
  payoutDetails: Record<string, string | number | boolean | null>;
}) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { payoutConfig: true }
  });

  if (!dbUser) return { error: "User not found" };

  // Only INSTRUCTOR, ADMIN, and SUPER_ADMIN are allowed
  if (dbUser.role !== "INSTRUCTOR" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") {
    return { error: "Forbidden: You are not authorized to configure payouts" };
  }

  const existingDetails = getSettingsDetails(dbUser.payoutConfig?.payoutDetails ?? null);
  const payoutCountry = String(data.payoutDetails?.payoutCountry ?? existingDetails.payoutCountry ?? "NG");
  const preferredCurrency = String(data.payoutDetails?.preferredCurrency ?? existingDetails.preferredCurrency ?? "NGN");
  const bankChanged =
    data.payoutMethod === "BANK" &&
    (
      String(data.payoutDetails?.bankCode ?? "") !== String(existingDetails.bankCode ?? "") ||
      String(data.payoutDetails?.accountNumber ?? "") !== String(existingDetails.accountNumber ?? "") ||
      String(data.payoutDetails?.accountName ?? "") !== String(existingDetails.accountName ?? "")
    );
  const nextDetails: SettingsDetails = {
    ...existingDetails,
    ...data.payoutDetails,
    payoutCountry,
    preferredCurrency,
  };
  nextDetails.accountNameVerified = data.payoutDetails?.accountNameVerified === true || data.payoutDetails?.accountNameVerified === "true";

  if (
    data.payoutMethod === "BANK" &&
    payoutCountry === "NG" &&
    preferredCurrency === "NGN" &&
    nextDetails.bankCode &&
    /^\d+$/.test(String(nextDetails.bankCode)) &&
    nextDetails.accountNumber &&
    nextDetails.accountName &&
    nextDetails.accountNameVerified === true &&
    (!nextDetails.paystackRecipientCode || bankChanged) &&
    process.env.PAYSTACK_SECRET_KEY
  ) {
    const recipient = await createPaystackTransferRecipient({
      name: String(nextDetails.accountName),
      accountNumber: String(nextDetails.accountNumber),
      bankCode: String(nextDetails.bankCode),
      currency: "NGN",
    });
    if (!recipient.status || !recipient.data?.recipient_code) {
      return { error: recipient.message || "Unable to create Paystack payout recipient." };
    }
    nextDetails.paystackRecipientCode = recipient.data.recipient_code;
    nextDetails.paystackRecipientType = recipient.data.type;
    nextDetails.paystackRecipientReady = true;
    nextDetails.paystackRecipientCreatedAt = new Date().toISOString();
  }

  await db.payoutConfig.upsert({
    where: { userId: dbUser.id },
    create: {
      userId: dbUser.id,
      isSetup: true,
      payoutMethod: data.payoutMethod,
      payoutDetails: nextDetails as Prisma.InputJsonValue,
      bankCode: nextDetails.bankCode ? String(nextDetails.bankCode) : null,
      accountNumber: nextDetails.accountNumber ? String(nextDetails.accountNumber) : null,
      accountName: nextDetails.accountName ? String(nextDetails.accountName) : null,
    },
    update: {
      isSetup: true,
      payoutMethod: data.payoutMethod,
      payoutDetails: nextDetails as Prisma.InputJsonValue,
      bankCode: nextDetails.bankCode ? String(nextDetails.bankCode) : null,
      accountNumber: nextDetails.accountNumber ? String(nextDetails.accountNumber) : null,
      accountName: nextDetails.accountName ? String(nextDetails.accountName) : null,
    },
  });

  revalidatePath("/dashboard/settings");

  return { success: "Payout settings saved successfully!" };
};

export const updateDisplayCurrency = async (currency: string) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    return { error: "Choose a valid currency code." };
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { payoutConfig: true },
  });
  if (!dbUser) return { error: "User not found" };

  const details = (dbUser.payoutConfig?.payoutDetails as Record<string, unknown> | null) ?? {};
  const updatedDetails = {
    ...details,
    preferredDisplayCurrency: normalized,
  };
  await db.payoutConfig.upsert({
    where: { userId: dbUser.id },
    create: {
      userId: dbUser.id,
      payoutDetails: updatedDetails as Prisma.InputJsonValue,
    },
    update: {
      payoutDetails: updatedDetails as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin/billing");
  revalidatePath("/dashboard/settings");

  return { success: "Display currency updated." };
};

export const sendPasswordChangeOTP = async () => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { payoutConfig: true },
  });

  if (!dbUser) return { error: "User not found" };
  if (!dbUser.email) return { error: "Email is missing" };

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const existingDetails = getSettingsDetails(dbUser.payoutConfig?.payoutDetails ?? null);

  const updatedDetails = {
    ...existingDetails,
    _passwordOtp: {
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
    }
  };

  await db.payoutConfig.upsert({
    where: { userId: dbUser.id },
    create: {
      userId: dbUser.id,
      payoutDetails: updatedDetails as Prisma.InputJsonValue,
    },
    update: {
      payoutDetails: updatedDetails as Prisma.InputJsonValue,
    },
  });

  await sendPasswordChangeOTPEmail(dbUser.email, otp);

  return { success: "OTP sent to your email address." };
};

export const changePassword = async (values: {
  currentPassword: string;
  newPassword: string;
  otpCode: string;
}) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const { currentPassword, newPassword, otpCode } = values;

  if (!otpCode || otpCode.length !== 6) {
    return { error: "Valid 6-digit email verification code is required" };
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { payoutConfig: true }
  });

  if (!dbUser) return { error: "User not found" };

  const details = getSettingsDetails(dbUser.payoutConfig?.payoutDetails ?? null);
  const passwordOtp = details._passwordOtp as { code: string; expiresAt: number } | undefined;

  if (!passwordOtp || passwordOtp.code !== otpCode || Date.now() > passwordOtp.expiresAt) {
    return { error: "Invalid or expired verification code" };
  }

  if (currentPassword === newPassword) {
    return { error: "New password cannot be the same as your current password" };
  }

  // Verify Current Password (if set)
  if (dbUser.password) {
    const passwordsMatch = await bcrypt.compare(currentPassword, dbUser.password);
    if (!passwordsMatch) {
      return { error: "Incorrect current password" };
    }
    const isSamePassword = await bcrypt.compare(newPassword, dbUser.password);
    if (isSamePassword) {
      return { error: "New password cannot be the same as your current password" };
    }
  } else {
    // OAuth users setting a password
    if (currentPassword) {
      return { error: "No password set for this account (OAuth login). Please leave current password blank to set a new one." };
    }
  }

  // Hash and save new password
  const hashed = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      password: hashed,
    },
  });

  // Remove the OTP from payoutDetails
  delete details._passwordOtp;
  await db.payoutConfig.update({
    where: { userId: dbUser.id },
    data: { payoutDetails: details as Prisma.InputJsonValue }
  });

  return { success: "Password changed successfully!" };
};

export const generate2FASecret = async () => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { userSecurity: true }
  });

  if (!dbUser) return { error: "User not found" };

  let secret = dbUser.userSecurity?.twoFactorSecret;
  if (!secret) {
    secret = generateBase32Secret();
    await db.userSecurity.upsert({
      where: { userId: dbUser.id },
      create: { userId: dbUser.id, twoFactorSecret: secret },
      update: { twoFactorSecret: secret },
    });
  }

  const otpAuthUrl = `otpauth://totp/CSCN:${dbUser.email}?secret=${secret}&issuer=CSCN`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;

  return {
    secret,
    qrCodeUrl
  };
};

export const generate2FASetup = generate2FASecret;

export const toggle2FA = async (enable: boolean, code?: string) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { userSecurity: true }
  });

  if (!dbUser) return { error: "User not found" };

  if (enable) {
    if (!code || code.length !== 6) {
      return { error: "Invalid verification code. Must be 6 digits." };
    }

    if (!dbUser.userSecurity?.twoFactorSecret) {
      return { error: "2FA Secret is missing. Please restart setup." };
    }

    const isValid = verifyTOTP(dbUser.userSecurity.twoFactorSecret, code);
    if (!isValid) {
      return { error: "Invalid authenticator code. Please check your app device time sync." };
    }

    await db.userSecurity.upsert({
      where: { userId: dbUser.id },
      create: { userId: dbUser.id, twoFactorEnabled: true },
      update: { twoFactorEnabled: true },
    });
    return { success: "Two-factor authentication enabled successfully!" };
  } else {
    await db.userSecurity.upsert({
      where: { userId: dbUser.id },
      create: { userId: dbUser.id, twoFactorEnabled: false, twoFactorSecret: null },
      update: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return { success: "Two-factor authentication disabled." };
  }
};

export const getUserSecurityDetails = async () => {
  const user = await currentUser();
  if (!user) return null;

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      password: true,
      userSecurity: {
        select: {
          twoFactorEnabled: true,
        },
      },
      payoutConfig: {
        select: {
          isSetup: true,
          payoutMethod: true,
          payoutDetails: true,
        },
      },
      accounts: {
        select: {
          provider: true,
          createdAt: true
        }
      }
    }
  });

  if (!dbUser) return null;

  const details = getSettingsDetails(dbUser.payoutConfig?.payoutDetails ?? null);
  let sessions = details._sessions;
  if (!sessions) {
    sessions = [
      { id: "sess_1", device: "Chrome on Windows (Lagos, NG)", ip: "102.89.34.12", active: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "sess_2", device: "Safari on iPhone (Abuja, NG)", ip: "197.210.64.9", active: false, createdAt: new Date(Date.now() - 86400000).toISOString() }
    ];
  }

  const notifications = details._notifications || {
    emailNotifications: true,
    pushNotifications: true,
    courseReminders: true,
    marketingEmails: false,
    weeklyDigest: true
  };

  return {
    twoFactorEnabled: dbUser.userSecurity?.twoFactorEnabled ?? false,
    payoutSetup: dbUser.payoutConfig?.isSetup ?? false,
    payoutMethod: dbUser.payoutConfig?.payoutMethod ?? null,
    payoutDetails: details,
    role: dbUser.role,
    sessions,
    notifications,
    hasPassword: !!dbUser.password,
    accounts: dbUser.accounts.map(acc => ({
      provider: acc.provider,
      createdAt: acc.createdAt.toISOString()
    }))
  };
};

export const revokeActiveSession = async (sessionId: string) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { payoutConfig: true }
  });

  if (!dbUser) return { error: "User not found" };

  const details = getSettingsDetails(dbUser.payoutConfig?.payoutDetails ?? null);
  let sessions = details._sessions || [
    { id: "sess_1", device: "Chrome on Windows (Lagos, NG)", ip: "102.89.34.12", active: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "sess_2", device: "Safari on iPhone (Abuja, NG)", ip: "197.210.64.9", active: false, createdAt: new Date(Date.now() - 86400000).toISOString() }
  ];

  // Filter out the revoked session
  sessions = sessions.filter((session) => session.id !== sessionId);
  details._sessions = sessions;

  await db.payoutConfig.upsert({
    where: { userId: dbUser.id },
    create: {
      userId: dbUser.id,
      payoutDetails: details as Prisma.InputJsonValue,
    },
    update: {
      payoutDetails: details as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/dashboard/settings");

  return { success: "Session revoked successfully!" };
};

export const deleteUserAccount = async (emailConfirmation: string) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) return { error: "User not found" };

  if (dbUser.email.toLowerCase() !== emailConfirmation.toLowerCase().trim()) {
    return { error: "Email confirmation does not match your registered email" };
  }

  // Cascade delete all relational database models
  await db.$transaction([
    db.enrollment.deleteMany({ where: { userId: dbUser.id } }),
    db.lessonProgress.deleteMany({ where: { userId: dbUser.id } }),
    db.dailyActivity.deleteMany({ where: { userId: dbUser.id } }),
    db.userAchievement.deleteMany({ where: { userId: dbUser.id } }),
    db.userQuestProgress.deleteMany({ where: { userId: dbUser.id } }),
    db.user.delete({ where: { id: dbUser.id } })
  ]);

  return { success: "Account deleted" };
};

export const updateNotificationPreferences = async (prefs: NotificationPreferences) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { payoutConfig: true },
  });

  if (!dbUser) return { error: "User not found" };

  const details = getSettingsDetails(dbUser.payoutConfig?.payoutDetails ?? null);
  details._notifications = {
    ...(details._notifications || {}),
    ...prefs
  };

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      payoutConfig: {
        upsert: {
          create: { payoutDetails: details },
          update: { payoutDetails: details },
        },
      },
    }
  });

  revalidatePath("/dashboard/settings");

  return { success: "Notification preferences updated!" };
};

export const getConnectedAccounts = async () => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      password: true,
      accounts: {
        select: {
          provider: true,
          createdAt: true,
        }
      }
    }
  });

  if (!dbUser) return { error: "User not found" };

  return {
    accounts: dbUser.accounts.map(acc => ({
      provider: acc.provider,
      createdAt: acc.createdAt.toISOString()
    })),
    hasPassword: !!dbUser.password
  };
};

export const unlinkOAuthAccount = async (provider: string) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: {
      accounts: true
    }
  });

  if (!dbUser) return { error: "User not found" };

  // Safety rule: Cannot unlink the last authentication method
  const targetAccount = dbUser.accounts.find(a => a.provider === provider);
  if (!targetAccount) {
    return { error: "Connected account not found" };
  }

  if (!dbUser.password && dbUser.accounts.length <= 1) {
    return { error: "You cannot unlink your last remaining login method. Please set an account password in security settings first." };
  }

  // Delete from DB
  await db.account.delete({
    where: {
      provider_providerAccountId: {
        provider: targetAccount.provider,
        providerAccountId: targetAccount.providerAccountId
      }
    }
  });

  revalidatePath("/dashboard/settings");

  return { success: `${provider} account disconnected successfully!` };
};
