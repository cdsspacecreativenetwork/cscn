import { describe, expect, it } from "vitest";

import {
  MAX_AVATAR_BYTES,
  createAvatarObjectPath,
  getOwnedAvatarObjectPath,
  validateAvatarFile,
} from "./avatar-storage";

describe("avatar storage security", () => {
  it("derives a safe extension from the validated MIME type", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "renamed.exe", {
      type: "image/webp",
    });

    expect(validateAvatarFile(file)).toEqual({ success: true, extension: "webp" });
    expect(createAvatarObjectPath("user-1", "asset-1", "webp")).toBe(
      "user-1/asset-1.webp"
    );
  });

  it("rejects unsupported image types", () => {
    const file = new File(["<svg />"], "avatar.svg", { type: "image/svg+xml" });

    expect(validateAvatarFile(file)).toMatchObject({ success: false });
  });

  it("rejects images larger than five megabytes", () => {
    const file = new File([new Uint8Array(MAX_AVATAR_BYTES + 1)], "avatar.png", {
      type: "image/png",
    });

    expect(validateAvatarFile(file)).toEqual({
      success: false,
      error: "Avatar images must be 5 MB or smaller.",
    });
  });

  it("accepts only object paths owned by the current user", () => {
    const supabaseUrl = "https://project.supabase.co";
    const ownUrl = `${supabaseUrl}/storage/v1/object/public/avatars/user-1/avatar.webp`;
    const otherUrl = `${supabaseUrl}/storage/v1/object/public/avatars/user-2/avatar.webp`;

    expect(getOwnedAvatarObjectPath(ownUrl, "user-1", supabaseUrl)).toBe(
      "user-1/avatar.webp"
    );
    expect(getOwnedAvatarObjectPath(otherUrl, "user-1", supabaseUrl)).toBeNull();
  });

  it("recognizes the authenticated user's legacy avatar without trusting another host", () => {
    const supabaseUrl = "https://project.supabase.co";
    const legacyUrl = `${supabaseUrl}/storage/v1/object/public/avatars/user-1-asset.png`;
    const forgedUrl = "https://attacker.example/storage/v1/object/public/avatars/user-1-asset.png";

    expect(getOwnedAvatarObjectPath(legacyUrl, "user-1", supabaseUrl)).toBe(
      "user-1-asset.png"
    );
    expect(getOwnedAvatarObjectPath(forgedUrl, "user-1", supabaseUrl)).toBeNull();
  });
});
