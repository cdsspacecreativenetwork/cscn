"use server";

import { revalidatePath } from "next/cache";
import { AnnouncementAudience, AnnouncementStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-guards";
import { createAuditLog } from "@/data/audit-logs";

interface AnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  priority?: number;
  linkUrl?: string;
  publishedAt?: string;
  expiresAt?: string;
}

function parseOptionalDate(value?: string) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date supplied.");
  return date;
}

function normalizeInput(input: AnnouncementInput) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3) throw new Error("Announcement title is required.");
  if (body.length < 8) throw new Error("Announcement message is required.");

  const publishedAt =
    input.status === AnnouncementStatus.PUBLISHED
      ? parseOptionalDate(input.publishedAt) ?? new Date()
      : parseOptionalDate(input.publishedAt);
  const expiresAt = parseOptionalDate(input.expiresAt);

  if (publishedAt && expiresAt && expiresAt <= publishedAt) {
    throw new Error("Expiry date must be after the publish date.");
  }

  return {
    title,
    body,
    audience: input.audience,
    status: input.status,
    priority: Math.max(0, Math.min(10, Number(input.priority ?? 0))),
    linkUrl: input.linkUrl?.trim() || null,
    publishedAt,
    expiresAt,
  };
}

export async function createAnnouncementAction(input: AnnouncementInput) {
  const session = await requireAdminPermission("canManageAnnouncements");
  const authorId = session.user.id;
  if (!authorId) return { error: "Missing admin session." };

  try {
    const announcement = await db.announcement.create({
      data: {
        ...normalizeInput(input),
        authorId,
      },
      select: { id: true, title: true, status: true, audience: true },
    });
    await createAuditLog({
      actorId: authorId,
      actorName: session.user.name,
      actorEmail: session.user.email,
      action: "announcement.created",
      entityType: "ANNOUNCEMENT",
      entityId: announcement.id,
      entityName: announcement.title,
      metadata: { status: announcement.status, audience: announcement.audience },
    });
    revalidatePath("/dashboard/admin/announcements");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create announcement." };
  }
}

export async function updateAnnouncementAction(id: string, input: AnnouncementInput) {
  const session = await requireAdminPermission("canManageAnnouncements");

  try {
    const announcement = await db.announcement.update({
      where: { id },
      data: normalizeInput(input),
      select: { id: true, title: true, status: true, audience: true },
    });
    await createAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      action: "announcement.updated",
      entityType: "ANNOUNCEMENT",
      entityId: announcement.id,
      entityName: announcement.title,
      metadata: { status: announcement.status, audience: announcement.audience },
    });
    revalidatePath("/dashboard/admin/announcements");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update announcement." };
  }
}

export async function archiveAnnouncementAction(id: string) {
  const session = await requireAdminPermission("canManageAnnouncements");

  try {
    const announcement = await db.announcement.update({
      where: { id },
      data: { status: AnnouncementStatus.ARCHIVED, expiresAt: new Date() },
      select: { id: true, title: true, status: true },
    });
    await createAuditLog({
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      action: "announcement.archived",
      entityType: "ANNOUNCEMENT",
      entityId: announcement.id,
      entityName: announcement.title,
      metadata: { status: announcement.status },
    });
    revalidatePath("/dashboard/admin/announcements");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to archive announcement." };
  }
}
