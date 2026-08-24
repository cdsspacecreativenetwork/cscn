import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

export const organizationRequestInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  type: z.enum(["COMPANY", "NONPROFIT", "SCHOOL", "AGENCY", "COMMUNITY", "OTHER"]),
  description: z.string().trim().min(30).max(2000),
  websiteUrl: z.string().url().max(500).nullable(),
  officialDomain: z.string().trim().toLowerCase().max(190).nullable(),
  country: z.string().trim().min(2).max(100),
});

export const organizationInvitationInput = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["ADMIN", "MANAGER", "BILLING", "LEARNER"]),
  teamId: z.string().trim().min(1).nullable(),
});

export const seatRequestInput = z.object({
  programId: z.string().trim().min(1).nullable(),
  cohortId: z.string().trim().min(1).nullable(),
  quantity: z.coerce.number().int().min(1).max(500),
  notes: z.string().trim().max(2000).nullable(),
}).refine((value) => Boolean(value.programId) !== Boolean(value.cohortId), {
  message: "Choose either one program or one cohort.",
});

export function optionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

export function optionalWebUrl(value: FormDataEntryValue | null) {
  const normalized = optionalText(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function createInvitationToken() {
  return randomBytes(24).toString("base64url");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function formatOrganizationRole(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
