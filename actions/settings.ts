"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { currentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { deleteAvatar } from "@/actions/upload";

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
    }
  });

  revalidatePath("/dashboard/profile");

  return { success: "Settings Updated!" };
};
