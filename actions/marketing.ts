"use server";

import { revalidatePath } from "next/cache";
import { ReviewPublishStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-guards";
import {
  DEFAULT_MARKETING_SETTINGS,
  type MarketingSettings,
  normalizeMarketingSettings,
  upsertMarketingSettings,
} from "@/data/marketing";
import { createAuditLog } from "@/data/audit-logs";

type MarketingSettingsInput = Partial<Record<keyof MarketingSettings, unknown>>;

function normalizeDateString(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid rollout date.");
  return value;
}

function parseMarketingSettingsInput(input: MarketingSettingsInput): MarketingSettings {
  const settings = normalizeMarketingSettings({
    launchMode: Boolean(input.launchMode),
    firstCourseRolloutDate:
      typeof input.firstCourseRolloutDate === "string"
        ? normalizeDateString(input.firstCourseRolloutDate)
        : DEFAULT_MARKETING_SETTINGS.firstCourseRolloutDate,
    pioneerBadgeEnabled: Boolean(input.pioneerBadgeEnabled),
    homepageReviewsEnabled: Boolean(input.homepageReviewsEnabled),
    homepageCoursesMode: "FEATURED_ONLY",
    launchHeadline: input.launchHeadline,
    launchBody: input.launchBody,
    launchCtaLabel: input.launchCtaLabel,
    normalCtaLabel: input.normalCtaLabel,
  });

  if (settings.launchHeadline.length < 4) throw new Error("Launch headline is too short.");
  if (settings.launchBody.length < 20) throw new Error("Launch message is too short.");
  if (settings.launchCtaLabel.length < 2) throw new Error("Launch CTA is required.");
  if (settings.normalCtaLabel.length < 2) throw new Error("Normal CTA is required.");
  return settings;
}

export async function updateMarketingSettingsAction(input: MarketingSettingsInput) {
  const session = await requireAdminPermission("canManageMarketing");

  try {
    const settings = parseMarketingSettingsInput(input);
    await upsertMarketingSettings(settings);
    await createAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      action: "marketing.settings.updated",
      entityType: "PLATFORM_SETTING",
      entityId: "marketing.launch",
      entityName: "Marketing launch settings",
      metadata: { ...settings },
    });
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admin/marketing");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update marketing settings." };
  }
}

interface HomepageReviewInput {
  name: string;
  role?: string;
  avatarUrl?: string;
  content: string;
  rating?: number | null;
  source?: string;
  featured?: boolean;
  status?: ReviewPublishStatus;
}

function normalizeReviewInput(input: HomepageReviewInput) {
  const name = input.name.trim();
  const content = input.content.trim();
  if (name.length < 2) throw new Error("Reviewer name is required.");
  if (content.length < 20) throw new Error("Review content should be at least 20 characters.");
  const rating = input.rating ? Math.max(1, Math.min(5, Number(input.rating))) : null;

  return {
    name,
    role: input.role?.trim() || null,
    avatarUrl: input.avatarUrl?.trim() || null,
    content,
    rating,
    source: input.source?.trim() || null,
    featured: Boolean(input.featured),
    status: input.status ?? ReviewPublishStatus.PENDING,
  };
}

export async function createHomepageReviewAction(input: HomepageReviewInput) {
  const session = await requireAdminPermission("canManageMarketing");

  try {
    const review = await db.homepageReview.create({
      data: normalizeReviewInput(input),
      select: { id: true, name: true, status: true },
    });
    await createAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      action: "homepage_review.created",
      entityType: "HOMEPAGE_REVIEW",
      entityId: review.id,
      entityName: review.name,
      metadata: { status: review.status },
    });
    revalidatePath("/");
    revalidatePath("/dashboard/admin/marketing");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create homepage review." };
  }
}

export async function updateHomepageReviewStatusAction(id: string, status: ReviewPublishStatus, featured: boolean) {
  const session = await requireAdminPermission("canManageMarketing");

  try {
    const review = await db.homepageReview.update({
      where: { id },
      data: { status, featured },
      select: { id: true, name: true, status: true, featured: true },
    });
    await createAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      action: "homepage_review.status_updated",
      entityType: "HOMEPAGE_REVIEW",
      entityId: review.id,
      entityName: review.name,
      metadata: { status: review.status, featured: review.featured },
    });
    revalidatePath("/");
    revalidatePath("/dashboard/admin/marketing");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update homepage review." };
  }
}
