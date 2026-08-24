import { z } from "zod";

export const communityPostInput = z.object({
  title: z.string().trim().max(120).optional().transform((value) => value || null),
  body: z.string().trim().min(3, "Write at least 3 characters.").max(3000),
});

export const communityReportInput = z.object({
  reason: z.enum(["SPAM", "HARASSMENT", "UNSAFE", "MISINFORMATION", "OTHER"]),
  details: z.string().trim().max(500).optional().transform((value) => value || null),
});

export const talentProfileInput = z.object({
  discoverable: z.boolean(),
  targetRoles: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
  skills: z.array(z.string().trim().min(1).max(60)).min(1).max(16),
  availability: z.string().trim().max(100).optional().transform((value) => value || null),
  preferredWorkplace: z.enum(["REMOTE", "HYBRID", "ONSITE"]).nullable(),
  cvUrl: z.string().url().max(500).nullable(),
  statement: z.string().trim().max(800).optional().transform((value) => value || null),
});

export function parseCommaList(value: FormDataEntryValue | null, limit: number) {
  return [...new Set(String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean))].slice(0, limit);
}

export function safeHttpUrl(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function valuesFromJson(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
