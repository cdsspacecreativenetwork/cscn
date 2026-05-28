import { AnnouncementAudience, AnnouncementStatus, UserRole } from "@prisma/client";

import { db } from "@/lib/db";

export interface AdminAnnouncementRow {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  priority: number;
  linkUrl: string | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string | null; email: string } | null;
}

export interface ActiveAnnouncement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  priority: number;
  linkUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

export function getAnnouncementAudienceForRole(role?: string | null): AnnouncementAudience[] {
  const audiences: AnnouncementAudience[] = [AnnouncementAudience.ALL];
  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) audiences.push(AnnouncementAudience.ADMINS);
  if (role === UserRole.INSTRUCTOR || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    audiences.push(AnnouncementAudience.INSTRUCTORS);
  }
  audiences.push(AnnouncementAudience.STUDENTS);
  return Array.from(new Set(audiences));
}

export async function getAdminAnnouncements(): Promise<AdminAnnouncementRow[]> {
  const announcements = await db.announcement.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  const authorIds = Array.from(new Set(announcements.map((item) => item.authorId)));
  const authors = await db.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, email: true },
  });
  const authorMap = new Map(authors.map((author) => [author.id, author]));

  return announcements.map((announcement) => ({
    ...announcement,
    author: authorMap.get(announcement.authorId) ?? null,
  }));
}

export async function getActiveAnnouncementsForRole(
  role?: string | null,
  limit = 5
): Promise<ActiveAnnouncement[]> {
  const now = new Date();

  return db.announcement.findMany({
    where: {
      status: AnnouncementStatus.PUBLISHED,
      audience: { in: getAnnouncementAudienceForRole(role) },
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
      AND: [
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      ],
    },
    orderBy: [{ priority: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      body: true,
      audience: true,
      priority: true,
      linkUrl: true,
      publishedAt: true,
      createdAt: true,
    },
  });
}
