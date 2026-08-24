import type { Prisma } from "@prisma/client";

import { valuesFromJson } from "@/lib/community-career";
import { db } from "@/lib/db";

export type CareerOpportunityFilters = { query?: string; workplace?: string; type?: string; level?: string };

export async function getCareerHub(filters: CareerOpportunityFilters = {}, userId?: string) {
  const where: Prisma.CareerOpportunityWhereInput = { status: "PUBLISHED", OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }] };
  if (filters.query) where.AND = [{ OR: [{ role: { contains: filters.query, mode: "insensitive" } }, { company: { contains: filters.query, mode: "insensitive" } }, { summary: { contains: filters.query, mode: "insensitive" } }] }];
  if (["REMOTE", "HYBRID", "ONSITE"].includes(filters.workplace ?? "")) where.workplaceType = filters.workplace as Prisma.EnumCareerWorkplaceTypeFilter;
  if (["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"].includes(filters.type ?? "")) where.employmentType = filters.type as Prisma.EnumCareerEmploymentTypeFilter;
  if (["ENTRY", "MID", "SENIOR", "ANY"].includes(filters.level ?? "")) where.level = filters.level as Prisma.EnumCareerOpportunityLevelFilter;

  const [opportunities, workshops, talentProfile] = await Promise.all([
    db.careerOpportunity.findMany({ where, orderBy: [{ featured: "desc" }, { postedAt: "desc" }], take: 60, select: { id: true, slug: true, company: true, role: true, summary: true, description: true, location: true, workplaceType: true, employmentType: true, level: true, skills: true, salaryText: true, applicationDeadline: true, applicationUrl: true, source: true, postedAt: true, featured: true, saves: { where: { userId: userId ?? "" }, select: { id: true }, take: 1 }, interests: { where: { userId: userId ?? "" }, select: { status: true }, take: 1 } } }),
    db.scheduleEvent.findMany({ where: { type: "PLATFORM_EVENT", status: { in: ["SCHEDULED", "LIVE"] }, startsAt: { gte: new Date() }, metadata: { path: ["kind"], equals: "CAREER_WORKSHOP" } }, orderBy: { startsAt: "asc" }, take: 4, select: { id: true, title: true, description: true, startsAt: true, endsAt: true, timezone: true, meetingUrl: true } }),
    userId ? db.careerTalentProfile.findUnique({ where: { userId }, select: { discoverable: true, targetRoles: true, skills: true, availability: true, preferredWorkplace: true, cvUrl: true, statement: true } }) : null,
  ]);
  return { opportunities: opportunities.map((item) => ({ ...item, skills: valuesFromJson(item.skills), saved: item.saves.length > 0, interestStatus: item.interests[0]?.status ?? null, saves: undefined, interests: undefined })), workshops, talentProfile: talentProfile ? { ...talentProfile, targetRoles: valuesFromJson(talentProfile.targetRoles), skills: valuesFromJson(talentProfile.skills) } : null };
}

export async function getAdminCommunityCareer() {
  const [reports, opportunities, stats] = await Promise.all([
    db.communityPostReport.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, take: 50, select: { id: true, reason: true, details: true, createdAt: true, reporter: { select: { name: true, email: true } }, post: { select: { id: true, body: true, status: true, author: { select: { name: true, email: true } }, space: { select: { title: true, slug: true } } } } } }),
    db.careerOpportunity.findMany({ orderBy: { createdAt: "desc" }, take: 80, select: { id: true, slug: true, company: true, role: true, status: true, postedAt: true, applicationDeadline: true, _count: { select: { saves: true, interests: true } } } }),
    Promise.all([db.communitySpace.count({ where: { status: "PUBLISHED" } }), db.communityPost.count({ where: { status: "PUBLISHED" } }), db.careerTalentProfile.count({ where: { discoverable: true } })]),
  ]);
  return { reports, opportunities, stats: { spaces: stats[0], posts: stats[1], discoverableTalent: stats[2] } };
}
