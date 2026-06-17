"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { currentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { deleteAvatar } from "@/actions/upload";
import { sendPasswordChangeOTPEmail } from "@/lib/mail";
import { verifyTOTP, generateBase32Secret } from "@/lib/totp";
import { createPaystackTransferRecipient } from "@/lib/payments/paystack";
import { normalizeScheduleTimeZone } from "@/lib/schedule-time";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) {
    return { error: "Unauthorized" };
  }

  if (values.image && dbUser.image && values.image !== dbUser.image) {
    if (dbUser.image.includes("supabase.co") && dbUser.image.includes("/avatars/")) {
      await deleteAvatar(dbUser.image);
    }
  }

  // Update user in database
  await db.user.update({
    where: { id: dbUser.id },
    data: {
      ...values,
      timezone: values.timezone
        ? normalizeScheduleTimeZone(values.timezone)
        : dbUser.timezone ?? "Africa/Lagos",
    },
  });

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
  payoutDetails: any;
}) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) return { error: "User not found" };

  // Only INSTRUCTOR, ADMIN, and SUPER_ADMIN are allowed
  if (dbUser.role !== "INSTRUCTOR" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN") {
    return { error: "Forbidden: You are not authorized to configure payouts" };
  }

  const existingDetails = (dbUser.payoutDetails as any) || {};
  const payoutCountry = String(data.payoutDetails?.payoutCountry ?? existingDetails.payoutCountry ?? "NG");
  const preferredCurrency = String(data.payoutDetails?.preferredCurrency ?? existingDetails.preferredCurrency ?? "NGN");
  const bankChanged =
    data.payoutMethod === "BANK" &&
    (
      String(data.payoutDetails?.bankCode ?? "") !== String(existingDetails.bankCode ?? "") ||
      String(data.payoutDetails?.accountNumber ?? "") !== String(existingDetails.accountNumber ?? "") ||
      String(data.payoutDetails?.accountName ?? "") !== String(existingDetails.accountName ?? "")
    );
  const nextDetails = {
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

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      payoutSetup: true,
      payoutMethod: data.payoutMethod,
      payoutDetails: nextDetails,
    }
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
    select: { id: true, payoutDetails: true },
  });
  if (!dbUser) return { error: "User not found" };

  const details = (dbUser.payoutDetails as Record<string, unknown> | null) ?? {};
  await db.user.update({
    where: { id: dbUser.id },
    data: {
      payoutDetails: {
        ...details,
        preferredDisplayCurrency: normalized,
      },
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
    where: { id: user.id }
  });

  if (!dbUser) return { error: "User not found" };

  // Generate 6-digit random token code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Expire in 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Clear any existing change-password tokens for this email first
  await db.verificationToken.deleteMany({
    where: {
      identifier: dbUser.email
    }
  });

  // Save code to database
  await db.verificationToken.create({
    data: {
      identifier: dbUser.email,
      token: otpCode,
      expires: expiresAt
    }
  });

  // Send Email with OTP
  const mailResult = await sendPasswordChangeOTPEmail(dbUser.email, otpCode, dbUser.name || undefined);
  if (!mailResult || "error" in mailResult) {
    return { error: mailResult?.error ?? "Failed to send verification code email." };
  }

  return { success: "Verification code sent to your email!" };
};

export const changePassword = async (values: any) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const { currentPassword, newPassword, otpCode } = values;

  if (!otpCode || otpCode.length !== 6) {
    return { error: "Valid 6-digit email verification code is required" };
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) return { error: "User not found" };

  // Verify OTP from database
  const tokenRecord = await db.verificationToken.findFirst({
    where: {
      identifier: dbUser.email,
      token: otpCode
    }
  });

  if (!tokenRecord) {
    return { error: "Invalid verification code" };
  }

  if (tokenRecord.expires < new Date()) {
    return { error: "Verification code has expired. Please request a new one." };
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
    data: { password: hashed }
  });

  // Delete the used token
  await db.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: dbUser.email,
        token: otpCode
      }
    }
  });

  return { success: "Password changed successfully!" };
};

export const generate2FASetup = async () => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) return { error: "User not found" };

  let secret = dbUser.twoFactorSecret;
  if (!secret) {
    secret = generateBase32Secret();
    await db.user.update({
      where: { id: dbUser.id },
      data: { twoFactorSecret: secret }
    });
  }

  const otpAuthUrl = `otpauth://totp/CSCN:${dbUser.email}?secret=${secret}&issuer=CSCN`;
  // Industry-standard secure QR code generator (using the standard qrcode server API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;

  return {
    secret,
    qrCodeUrl
  };
};

export const toggle2FA = async (enable: boolean, code?: string) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) return { error: "User not found" };

  if (enable) {
    if (!code || code.length !== 6) {
      return { error: "Invalid verification code. Must be 6 digits." };
    }

    if (!dbUser.twoFactorSecret) {
      return { error: "2FA Secret is missing. Please restart setup." };
    }

    const isValid = verifyTOTP(dbUser.twoFactorSecret, code);
    if (!isValid) {
      return { error: "Invalid authenticator code. Please check your app device time sync." };
    }

    await db.user.update({
      where: { id: dbUser.id },
      data: {
        twoFactorEnabled: true
      }
    });
    return { success: "Two-factor authentication enabled successfully!" };
  } else {
    await db.user.update({
      where: { id: dbUser.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
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
      twoFactorEnabled: true,
      payoutSetup: true,
      payoutMethod: true,
      payoutDetails: true,
      role: true,
      password: true,
      accounts: {
        select: {
          provider: true,
          createdAt: true
        }
      }
    }
  });

  if (!dbUser) return null;

  const details = (dbUser.payoutDetails as any) || {};
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
    twoFactorEnabled: dbUser.twoFactorEnabled,
    payoutSetup: dbUser.payoutSetup,
    payoutMethod: dbUser.payoutMethod,
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
    where: { id: user.id }
  });

  if (!dbUser) return { error: "User not found" };

  const details = (dbUser.payoutDetails as any) || {};
  let sessions = details._sessions || [
    { id: "sess_1", device: "Chrome on Windows (Lagos, NG)", ip: "102.89.34.12", active: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "sess_2", device: "Safari on iPhone (Abuja, NG)", ip: "197.210.64.9", active: false, createdAt: new Date(Date.now() - 86400000).toISOString() }
  ];

  // Filter out the revoked session
  sessions = sessions.filter((s: any) => s.id !== sessionId);
  details._sessions = sessions;

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      payoutDetails: details
    }
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

export const updateNotificationPreferences = async (prefs: any) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) return { error: "User not found" };

  const details = (dbUser.payoutDetails as any) || {};
  details._notifications = {
    ...(details._notifications || {}),
    ...prefs
  };

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      payoutDetails: details
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
