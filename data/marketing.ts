import { ReviewPublishStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const MARKETING_LAUNCH_SETTING_KEY = "marketing.launch";
export const PIONEER_COHORT = "PIONEER_2026";

export type HomepageCoursesMode = "FEATURED_ONLY";

export interface MarketingSettings {
  launchMode: boolean;
  firstCourseRolloutDate: string;
  pioneerBadgeEnabled: boolean;
  homepageReviewsEnabled: boolean;
  homepageCoursesMode: HomepageCoursesMode;
  launchHeadline: string;
  launchBody: string;
  launchCtaLabel: string;
  normalCtaLabel: string;
}

export const DEFAULT_MARKETING_SETTINGS: MarketingSettings = {
  launchMode: true,
  firstCourseRolloutDate: "2026-09-01",
  pioneerBadgeEnabled: true,
  homepageReviewsEnabled: true,
  homepageCoursesMode: "FEATURED_ONLY",
  launchHeadline: "Join the CSCN Pioneer Cohort",
  launchBody:
    "Courses begin rolling out September 1st. Create your account now to reserve early access, shape the first learning tracks, and earn founding learner recognition.",
  launchCtaLabel: "Join Pioneer Cohort",
  normalCtaLabel: "Start Learning",
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeMarketingSettings(value: unknown): MarketingSettings {
  const raw = asObject(value);
  const mode = raw.homepageCoursesMode === "FEATURED_ONLY" ? "FEATURED_ONLY" : DEFAULT_MARKETING_SETTINGS.homepageCoursesMode;

  return {
    launchMode: asBoolean(raw.launchMode, DEFAULT_MARKETING_SETTINGS.launchMode),
    firstCourseRolloutDate: asString(raw.firstCourseRolloutDate, DEFAULT_MARKETING_SETTINGS.firstCourseRolloutDate),
    pioneerBadgeEnabled: asBoolean(raw.pioneerBadgeEnabled, DEFAULT_MARKETING_SETTINGS.pioneerBadgeEnabled),
    homepageReviewsEnabled: asBoolean(raw.homepageReviewsEnabled, DEFAULT_MARKETING_SETTINGS.homepageReviewsEnabled),
    homepageCoursesMode: mode,
    launchHeadline: asString(raw.launchHeadline, DEFAULT_MARKETING_SETTINGS.launchHeadline),
    launchBody: asString(raw.launchBody, DEFAULT_MARKETING_SETTINGS.launchBody),
    launchCtaLabel: asString(raw.launchCtaLabel, DEFAULT_MARKETING_SETTINGS.launchCtaLabel),
    normalCtaLabel: asString(raw.normalCtaLabel, DEFAULT_MARKETING_SETTINGS.normalCtaLabel),
  };
}

export async function getMarketingSettings(): Promise<MarketingSettings> {
  const setting = await db.platformSetting.findUnique({
    where: { key: MARKETING_LAUNCH_SETTING_KEY },
    select: { value: true },
  });

  return normalizeMarketingSettings(setting?.value);
}

export async function upsertMarketingSettings(settings: MarketingSettings) {
  const value = settings as unknown as Prisma.InputJsonValue;
  return db.platformSetting.upsert({
    where: { key: MARKETING_LAUNCH_SETTING_KEY },
    update: { value },
    create: { key: MARKETING_LAUNCH_SETTING_KEY, value },
  });
}

export async function listPublishedHomepageReviews(limit = 9) {
  return db.homepageReview.findMany({
    where: {
      status: ReviewPublishStatus.PUBLISHED,
      featured: true,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function listAdminHomepageReviews() {
  return db.homepageReview.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
}
