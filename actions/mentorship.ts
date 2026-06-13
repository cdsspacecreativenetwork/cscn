"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createNotification } from "@/data/notifications";
import { db } from "@/lib/db";
import { normalizeScheduleTimeZone } from "@/lib/schedule-time";

function requireString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseIntField(formData: FormData, key: string, fallback: number) {
  const value = Number(requireString(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function parseTopics(value: string) {
  return value
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function validTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

async function requireMentorshipOwner() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const profile = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      instructorProfileEnabled: true,
      mentorshipEligible: true,
    },
  });

  if (!profile) redirect("/signin");
  if (!["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(profile.role)) redirect("/dashboard");
  return profile;
}

export async function updateMentorshipSettingsAction(formData: FormData) {
  const profile = await requireMentorshipOwner();
  if (!profile.mentorshipEligible) redirect("/dashboard/instructor/mentorship?error=not-eligible");

  const mentorshipEnabled = requireString(formData, "mentorshipEnabled") === "on";
  const mentorshipFree = requireString(formData, "mentorshipFree") === "on";
  const mentorshipBio = requireString(formData, "mentorshipBio");
  const mentorshipInstructions = requireString(formData, "mentorshipInstructions");
  const mentorshipTopics = parseTopics(requireString(formData, "mentorshipTopics"));
  const mentorshipCurrency = requireString(formData, "mentorshipCurrency") || "NGN";
  const mentorshipPriceValue = Number(requireString(formData, "mentorshipPrice"));

  await db.user.update({
    where: { id: profile.id },
    data: {
      mentorshipEnabled,
      mentorshipFree,
      mentorshipBio: mentorshipBio || null,
      mentorshipInstructions: mentorshipInstructions || null,
      mentorshipTopics,
      mentorshipCurrency: mentorshipCurrency.toUpperCase().slice(0, 3),
      mentorshipPrice: mentorshipFree || !Number.isFinite(mentorshipPriceValue) ? null : mentorshipPriceValue,
    },
  });

  revalidatePath("/dashboard/instructor/mentorship");
  revalidatePath("/mentorship");
  redirect("/dashboard/instructor/mentorship?updated=1");
}

export async function createMentorAvailabilityAction(formData: FormData) {
  const profile = await requireMentorshipOwner();
  if (!profile.mentorshipEligible) redirect("/dashboard/instructor/mentorship?error=not-eligible");

  const type = requireString(formData, "type") === "DATE" ? "DATE" : "WEEKLY";
  const weekday = type === "WEEKLY" ? parseIntField(formData, "weekday", 1) : null;
  const date = type === "DATE" ? requireString(formData, "date") : null;
  const startTime = requireString(formData, "startTime");
  const endTime = requireString(formData, "endTime");
  const timezone = normalizeScheduleTimeZone(requireString(formData, "timezone") || "Africa/Lagos");
  const sessionDuration = Math.min(180, Math.max(15, parseIntField(formData, "sessionDuration", 45)));
  const bufferMinutes = Math.min(60, Math.max(0, parseIntField(formData, "bufferMinutes", 10)));
  const maxBookings = Math.min(12, Math.max(1, parseIntField(formData, "maxBookings", 1)));

  if (!validTime(startTime) || !validTime(endTime) || endTime <= startTime) {
    redirect("/dashboard/instructor/mentorship?error=invalid-time");
  }

  if (type === "WEEKLY" && (weekday === null || weekday < 0 || weekday > 6)) {
    redirect("/dashboard/instructor/mentorship?error=invalid-day");
  }

  if (type === "DATE" && !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
    redirect("/dashboard/instructor/mentorship?error=invalid-date");
  }

  await db.mentorAvailability.create({
    data: {
      mentorId: profile.id,
      type,
      weekday,
      date,
      startTime,
      endTime,
      timezone,
      sessionDuration,
      bufferMinutes,
      maxBookings,
      recurrence: type === "WEEKLY" ? "WEEKLY" : "ONCE",
      status: "ACTIVE",
    },
  });

  revalidatePath("/dashboard/instructor/mentorship");
  redirect("/dashboard/instructor/mentorship?availability=created");
}

export async function setMentorAvailabilityStatusAction(formData: FormData) {
  const profile = await requireMentorshipOwner();
  const availabilityId = requireString(formData, "availabilityId");
  const statusInput = requireString(formData, "status");
  const status = statusInput === "PAUSED" ? "PAUSED" : statusInput === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";

  const availability = await db.mentorAvailability.findFirst({
    where: {
      id: availabilityId,
      mentorId: profile.id,
    },
    select: { id: true },
  });

  if (!availability) redirect("/dashboard/instructor/mentorship?error=availability-access");

  await db.mentorAvailability.update({
    where: { id: availability.id },
    data: { status },
  });

  revalidatePath("/dashboard/instructor/mentorship");
  redirect("/dashboard/instructor/mentorship?availability=updated");
}

export async function submitMentorshipApplicationAction(formData: FormData) {
  const profile = await requireMentorshipOwner();
  if (profile.mentorshipEligible) redirect("/dashboard/instructor/mentorship?error=already-eligible");

  const pitch = requireString(formData, "pitch");
  const audience = requireString(formData, "audience");
  const instructions = requireString(formData, "instructions");
  const topics = parseTopics(requireString(formData, "topics"));
  const sessionTypes = parseList(requireString(formData, "sessionTypes"));
  const mentorshipFree = requireString(formData, "mentorshipFree") === "on";
  const proposedCurrency = (requireString(formData, "proposedCurrency") || "NGN").toUpperCase().slice(0, 3);
  const proposedPriceValue = Number(requireString(formData, "proposedPrice"));

  if (!pitch || topics.length === 0) redirect("/dashboard/instructor/mentorship?error=application-required");

  const latestApplication = await db.mentorshipApplication.findFirst({
    where: { instructorId: profile.id },
    orderBy: { submittedAt: "desc" },
    select: { id: true, status: true },
  });

  if (latestApplication?.status === "PENDING") {
    redirect("/dashboard/instructor/mentorship?error=application-pending");
  }

  await db.mentorshipApplication.create({
    data: {
      instructorId: profile.id,
      status: "PENDING",
      pitch,
      audience: audience || null,
      instructions: instructions || null,
      topics,
      sessionTypes,
      mentorshipFree,
      proposedCurrency,
      proposedPrice: mentorshipFree || !Number.isFinite(proposedPriceValue) ? null : proposedPriceValue,
    },
  });

  const admins = await db.user.findMany({
    where: {
      OR: [
        { role: "SUPER_ADMIN" },
        { role: "ADMIN", canManageInstructors: true },
        { role: "ADMIN", canVerifyInstructors: true },
      ],
    },
    select: { id: true },
  });

  for (const admin of admins) {
    await createNotification(
      admin.id,
      "SYSTEM",
      "Mentorship application submitted",
      "An instructor applied to become a mentor and needs review.",
      { kind: "MENTORSHIP_APPLICATION", instructorId: profile.id },
      {
        actionRequired: true,
        actionLabel: "Review application",
        actionUrl: "/dashboard/admin/mentorship",
      }
    );
  }

  revalidatePath("/dashboard/instructor/mentorship");
  revalidatePath("/dashboard/admin/mentorship");
  redirect("/dashboard/instructor/mentorship?application=submitted");
}

export async function withdrawMentorshipApplicationAction(formData: FormData) {
  const profile = await requireMentorshipOwner();
  const applicationId = requireString(formData, "applicationId");

  const application = await db.mentorshipApplication.findFirst({
    where: { id: applicationId, instructorId: profile.id, status: "PENDING" },
    select: { id: true },
  });

  if (!application) redirect("/dashboard/instructor/mentorship?error=application-access");

  await db.mentorshipApplication.update({
    where: { id: application.id },
    data: { status: "WITHDRAWN" },
  });

  revalidatePath("/dashboard/instructor/mentorship");
  revalidatePath("/dashboard/admin/mentorship");
  redirect("/dashboard/instructor/mentorship?application=withdrawn");
}
