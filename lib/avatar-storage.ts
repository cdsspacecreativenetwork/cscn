import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export type AvatarValidationResult =
  | { success: true; extension: string }
  | { success: false; error: string };

export function validateAvatarFile(file: File): AvatarValidationResult {
  if (file.size <= 0) {
    return { success: false, error: "Choose a non-empty image file." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { success: false, error: "Avatar images must be 5 MB or smaller." };
  }

  const extension = AVATAR_EXTENSIONS[file.type.toLowerCase()];
  if (!extension) {
    return { success: false, error: "Use a JPEG, PNG, WebP, or AVIF image." };
  }

  return { success: true, extension };
}

export function createAvatarObjectPath(userId: string, id: string, extension: string) {
  return `${userId}/${id}.${extension}`;
}

export function getOwnedAvatarObjectPath(
  publicUrl: string,
  userId: string,
  supabaseUrl: string
) {
  try {
    const parsedPublicUrl = new URL(publicUrl);
    const parsedSupabaseUrl = new URL(supabaseUrl);
    if (parsedPublicUrl.origin !== parsedSupabaseUrl.origin) return null;

    const marker = "/storage/v1/object/public/avatars/";
    const markerIndex = parsedPublicUrl.pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const objectPath = decodeURIComponent(
      parsedPublicUrl.pathname.slice(markerIndex + marker.length)
    );
    const isCurrentLayout = objectPath.startsWith(`${userId}/`);
    const isLegacyLayout = !objectPath.includes("/") && objectPath.startsWith(`${userId}-`);

    return isCurrentLayout || isLegacyLayout ? objectPath : null;
  } catch {
    return null;
  }
}

export function getAvatarStorageClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || serviceKey === "local-preview-disabled") return null;
  return createClient(url, serviceKey);
}

export async function removeOwnedAvatar(
  publicUrl: string,
  userId: string,
  client = getAvatarStorageClient()
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!client || !supabaseUrl) return { success: false as const, error: "Avatar storage is not configured." };

  const objectPath = getOwnedAvatarObjectPath(publicUrl, userId, supabaseUrl);
  if (!objectPath) return { success: false as const, error: "Avatar does not belong to this account." };

  const { error } = await client.storage.from("avatars").remove([objectPath]);
  if (error) return { success: false as const, error: "Failed to delete the avatar." };
  return { success: true as const };
}
