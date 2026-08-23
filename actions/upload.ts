"use server";

import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createAvatarObjectPath,
  getAvatarStorageClient,
  removeOwnedAvatar,
  validateAvatarFile,
} from "@/lib/avatar-storage";

export const uploadAvatar = async (formData: FormData) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { error: "No file provided" };
    }

    const validation = validateAvatarFile(file);
    if (!validation.success) return { error: validation.error };

    const supabase = getAvatarStorageClient();
    if (!supabase) return { error: "Avatar storage is not configured." };

    const fileName = createAvatarObjectPath(
      session.user.id,
      uuidv4(),
      validation.extension
    );

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return { error: "Failed to upload image" };
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (error) {
    console.error("Server upload error:", error);
    return { error: "Internal server error" };
  }
};

export const deleteAvatar = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });
    if (!user?.image) return { success: true };

    const removed = await removeOwnedAvatar(user.image, session.user.id);
    if (!removed.success) return { error: removed.error };

    await db.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete avatar:", error);
    return { error: "Failed to delete old avatar" };
  }
};
