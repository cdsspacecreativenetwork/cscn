"use server";

import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const uploadAvatar = async (formData: FormData) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No file provided" };
    }

    const fileExtension = file.name.split(".").pop() || "png";
    const fileName = `${session.user.id}-${uuidv4()}.${fileExtension}`;

    const { data, error } = await supabase.storage
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

export const deleteAvatar = async (url: string) => {
  try {
    if (!url.includes("supabase.co") || !url.includes("/avatars/")) return { success: true };
    const fileName = url.split("/").pop();
    if (!fileName) return { error: "Invalid URL" };
    
    const { error } = await supabase.storage.from("avatars").remove([fileName]);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Failed to delete avatar:", error);
    return { error: "Failed to delete old avatar" };
  }
};
