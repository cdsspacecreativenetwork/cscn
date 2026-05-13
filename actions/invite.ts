"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const createInvite = async (role: UserRole, email?: string) => {
  const session = await auth();
  const callerRole = session?.user?.role as string | undefined;

  if (!session?.user || (callerRole !== "ADMIN" && callerRole !== "SUPER_ADMIN")) {
    return { error: "Unauthorized" };
  }

  // Regular ADMINs can only invite INSTRUCTORs
  if (callerRole === "ADMIN" && (role as string) !== "INSTRUCTOR") {
    return { error: "Admins can only invite Instructors" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  try {
    await db.inviteToken.create({
      data: {
        token,
        email: email || null,
        role,
        createdBy: session.user.id!,
        expiresAt,
      },
    });

    revalidatePath("/dashboard/admin/invites");
    return { success: true, token };
  } catch {
    return { error: "Failed to create invite" };
  }
};

export const claimInvite = async (token: string) => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/invite/${token}`);
  }

  const invite = await db.inviteToken.findUnique({ where: { token } });

  if (!invite) return { error: "This invite link is invalid." };
  if (invite.usedAt) return { error: "This invite has already been used." };
  if (invite.expiresAt < new Date()) return { error: "This invite has expired." };
  if (invite.email && invite.email !== session.user.email) {
    return { error: "This invite was sent to a different email address." };
  }

  try {
    await db.$transaction([
      db.user.update({
        where: { id: session.user.id },
        data: { role: invite.role },
      }),
      db.inviteToken.update({
        where: { token },
        data: { usedBy: session.user.id, usedAt: new Date() },
      }),
    ]);
  } catch {
    return { error: "Failed to claim invite. Please try again." };
  }

  redirect("/dashboard");
};

export const deleteInvite = async (id: string) => {
  const session = await auth();

  const callerRole = session?.user?.role as string | undefined;
  if (!session?.user || (callerRole !== "ADMIN" && callerRole !== "SUPER_ADMIN")) {
    return { error: "Unauthorized" };
  }

  try {
    await db.inviteToken.delete({ where: { id } });
    revalidatePath("/dashboard/admin/invites");
    return { success: true };
  } catch {
    return { error: "Failed to delete invite" };
  }
};
