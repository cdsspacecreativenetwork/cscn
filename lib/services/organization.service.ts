import type { OrganizationMemberRole, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { hashInvitationToken } from "@/lib/organizations";

const managementRoles: OrganizationMemberRole[] = ["OWNER", "ADMIN", "MANAGER"];
const billingRoles: OrganizationMemberRole[] = ["OWNER", "ADMIN", "BILLING"];

export function canManageOrganization(role: OrganizationMemberRole) {
  return managementRoles.includes(role);
}

export function canManageOrganizationBilling(role: OrganizationMemberRole) {
  return billingRoles.includes(role);
}

export async function getUserOrganizations(userId: string) {
  return db.organizationMember.findMany({
    where: { userId, status: "ACTIVE", organization: { status: { in: ["ACTIVE", "PENDING_REVIEW"] } } },
    orderBy: { organization: { name: "asc" } },
    select: {
      id: true,
      role: true,
      organization: {
        select: { id: true, name: true, slug: true, type: true, status: true, description: true, _count: { select: { members: { where: { status: "ACTIVE" } }, teams: true } } },
      },
    },
  });
}

async function getAggregateProgress(organizationId: string) {
  const allocations = await db.organizationSeatAllocation.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] }, seatPackage: { organizationId, status: "ACTIVE" } },
    select: {
      organizationMember: { select: { userId: true } },
      seatPackage: {
        select: {
          id: true,
          program: { select: { courses: { select: { course: { select: { modules: { where: { isPublished: true }, select: { lessons: { where: { isPublished: true }, select: { id: true } } } } } } } } } },
          cohort: { select: { program: { select: { courses: { select: { course: { select: { modules: { where: { isPublished: true }, select: { lessons: { where: { isPublished: true }, select: { id: true } } } } } } } } } } } },
        },
      },
    },
  });

  const rows = allocations.map((allocation) => ({
    userId: allocation.organizationMember.userId,
    lessonIds: (allocation.seatPackage.program ?? allocation.seatPackage.cohort?.program)?.courses.flatMap((item) => item.course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id))) ?? [],
  }));
  const userIds = [...new Set(rows.map((row) => row.userId))];
  const lessonIds = [...new Set(rows.flatMap((row) => row.lessonIds))];
  const progress = userIds.length && lessonIds.length
    ? await db.lessonProgress.findMany({ where: { userId: { in: userIds }, lessonId: { in: lessonIds } }, select: { userId: true, lessonId: true, percentComplete: true, completedAt: true } })
    : [];

  const percentages = rows.map((row) => {
    if (!row.lessonIds.length) return 0;
    const completed = progress.filter((item) => item.userId === row.userId && row.lessonIds.includes(item.lessonId) && (item.completedAt || item.percentComplete === 100)).length;
    return Math.round((completed / row.lessonIds.length) * 100);
  });
  return {
    allocatedLearners: rows.length,
    activatedLearners: percentages.filter((value) => value > 0).length,
    completedLearners: percentages.filter((value) => value === 100).length,
    averageCompletion: percentages.length ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length) : 0,
  };
}

export async function getOrganizationDashboard(userId: string, slug: string) {
  const membership = await db.organizationMember.findFirst({
    where: { userId, status: "ACTIVE", organization: { slug, status: { in: ["ACTIVE", "PENDING_REVIEW"] } } },
    select: { id: true, role: true, organization: { select: { id: true, name: true, slug: true, type: true, status: true, description: true, country: true, websiteUrl: true } }, teams: { select: { teamId: true } } },
  });
  if (!membership) return null;

  const canManage = canManageOrganization(membership.role);
  const canManageBilling = canManageOrganizationBilling(membership.role);
  const teamIds = membership.teams.map((item) => item.teamId);
  const [teams, members, invitations, seatPackages, assignments, invoices, report] = await Promise.all([
    db.organizationTeam.findMany({ where: { organizationId: membership.organization.id }, orderBy: { name: "asc" }, select: { id: true, name: true, description: true, _count: { select: { members: true } } } }),
    canManage ? db.organizationMember.findMany({ where: { organizationId: membership.organization.id, status: "ACTIVE" }, orderBy: [{ role: "asc" }, { user: { name: "asc" } }], select: { id: true, role: true, jobTitle: true, joinedAt: true, user: { select: { id: true, name: true, email: true, image: true } }, teams: { select: { team: { select: { id: true, name: true } } } }, seatAllocations: { where: { status: "ACTIVE" }, select: { id: true } } } }) : [],
    canManage ? db.organizationInvitation.findMany({ where: { organizationId: membership.organization.id, status: "PENDING", expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, select: { id: true, email: true, role: true, expiresAt: true, team: { select: { name: true } } } }) : [],
    db.organizationSeatPackage.findMany({ where: { organizationId: membership.organization.id }, orderBy: { createdAt: "desc" }, select: { id: true, quantity: true, pricePerSeat: true, currency: true, status: true, startsAt: true, expiresAt: true, notes: true, program: { select: { id: true, title: true } }, cohort: { select: { id: true, title: true, program: { select: { title: true } } } }, invoice: { select: { id: true, number: true, status: true, amount: true, dueAt: true } }, _count: { select: { allocations: { where: { status: "ACTIVE" } } } } } }),
    db.organizationLearningAssignment.findMany({ where: { organizationId: membership.organization.id, status: "ACTIVE", ...(canManage ? {} : { OR: [{ teamId: null }, { teamId: { in: teamIds } }] }) }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], select: { id: true, title: true, description: true, dueAt: true, team: { select: { name: true } }, program: { select: { title: true, slug: true } }, cohort: { select: { title: true, slug: true, program: { select: { title: true } } } } } }),
    canManageBilling ? db.organizationInvoice.findMany({ where: { organizationId: membership.organization.id }, orderBy: { issuedAt: "desc" }, select: { id: true, number: true, amount: true, currency: true, status: true, issuedAt: true, dueAt: true, paidAt: true, seatPackage: { select: { quantity: true, program: { select: { title: true } }, cohort: { select: { title: true, program: { select: { title: true } } } } } } } }) : [],
    canManage ? getAggregateProgress(membership.organization.id) : Promise.resolve(null),
  ]);

  const visibleSeatPackages = canManageBilling
    ? seatPackages
    : seatPackages.map((seatPackage) => ({ ...seatPackage, pricePerSeat: 0, invoice: null }));
  return { membership, canManage, canManageBilling, teams, members, invitations, seatPackages: visibleSeatPackages, assignments, invoices, report };
}

export async function acceptOrganizationInvitation(input: { token: string; userId: string; userEmail: string }) {
  const invitation = await db.organizationInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(input.token) },
    select: { id: true, email: true, role: true, status: true, expiresAt: true, teamId: true, organization: { select: { id: true, slug: true, status: true } } },
  });
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date() || invitation.organization.status !== "ACTIVE") return { success: false as const, error: "This invitation is invalid or has expired." };
  if (invitation.email.toLowerCase() !== input.userEmail.toLowerCase()) return { success: false as const, error: "Sign in with the email address that received this invitation." };

  await db.$transaction(async (tx) => {
    const member = await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invitation.organization.id, userId: input.userId } },
      create: { organizationId: invitation.organization.id, userId: input.userId, role: invitation.role, status: "ACTIVE", joinedAt: new Date() },
      update: { role: invitation.role, status: "ACTIVE", joinedAt: new Date() },
      select: { id: true },
    });
    if (invitation.teamId) await tx.organizationTeamMember.upsert({ where: { teamId_organizationMemberId: { teamId: invitation.teamId, organizationMemberId: member.id } }, create: { teamId: invitation.teamId, organizationMemberId: member.id }, update: {} });
    await tx.organizationInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
  });
  return { success: true as const, organizationSlug: invitation.organization.slug };
}

export async function allocateOrganizationSeat(input: { organizationId: string; seatPackageId: string; organizationMemberId: string; actorUserId: string }) {
  const actor = await db.organizationMember.findFirst({ where: { organizationId: input.organizationId, userId: input.actorUserId, status: "ACTIVE", role: { in: managementRoles }, organization: { status: "ACTIVE" } }, select: { id: true } });
  if (!actor) return { success: false as const, error: "You do not have permission to allocate seats." };

  const seatPackage = await db.organizationSeatPackage.findFirst({
    where: { id: input.seatPackageId, organizationId: input.organizationId, status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    select: { id: true, quantity: true, programId: true, cohortId: true, cohort: { select: { programId: true } }, allocations: { where: { status: "ACTIVE" }, select: { id: true, organizationMemberId: true } } },
  });
  if (!seatPackage) return { success: false as const, error: "This seat package is not active." };
  if (seatPackage.allocations.some((allocation) => allocation.organizationMemberId === input.organizationMemberId)) return { success: true as const, idempotent: true as const };
  if (seatPackage.allocations.length >= seatPackage.quantity) return { success: false as const, error: "Every purchased seat is already allocated." };
  const member = await db.organizationMember.findFirst({ where: { id: input.organizationMemberId, organizationId: input.organizationId, status: "ACTIVE" }, select: { id: true, userId: true } });
  if (!member) return { success: false as const, error: "Organization member not found." };
  const programId = seatPackage.programId ?? seatPackage.cohort?.programId;
  if (!programId) return { success: false as const, error: "This seat package has no learning program." };
  const courses = await db.programCourse.findMany({ where: { programId }, select: { courseId: true } });

  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.organizationSeatAllocation.upsert({
      where: { seatPackageId_organizationMemberId: { seatPackageId: seatPackage.id, organizationMemberId: member.id } },
      create: { seatPackageId: seatPackage.id, organizationMemberId: member.id, allocatedById: input.actorUserId, status: "ACTIVE" },
      update: { allocatedById: input.actorUserId, status: "ACTIVE", assignedAt: new Date(), revokedAt: null },
    });
    if (seatPackage.cohortId) await tx.cohortMembership.upsert({ where: { cohortId_userId: { cohortId: seatPackage.cohortId, userId: member.userId } }, create: { cohortId: seatPackage.cohortId, userId: member.userId, role: "LEARNER", status: "ACTIVE", joinedAt: new Date() }, update: { role: "LEARNER", status: "ACTIVE", joinedAt: new Date() } });
    for (const course of courses) await tx.enrollment.upsert({ where: { userId_courseId: { userId: member.userId, courseId: course.courseId } }, create: { userId: member.userId, courseId: course.courseId, status: "ACTIVE" }, update: { status: "ACTIVE" } });
  });
  return { success: true as const, idempotent: false as const };
}

export async function getAdminOrganizations() {
  const [organizations, programs, seatPackages, invoices] = await Promise.all([
    db.organization.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100, select: { id: true, name: true, slug: true, type: true, status: true, country: true, createdAt: true, requestedBy: { select: { name: true, email: true } }, _count: { select: { members: { where: { status: "ACTIVE" } }, teams: true, seatPackages: true, invoices: true } } } }),
    db.program.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.organizationSeatPackage.findMany({ where: { status: { in: ["REQUESTED", "INVOICED"] } }, orderBy: { createdAt: "asc" }, take: 100, select: { id: true, quantity: true, pricePerSeat: true, currency: true, status: true, notes: true, organization: { select: { name: true, slug: true } }, program: { select: { title: true } }, cohort: { select: { title: true, program: { select: { title: true } } } }, invoice: { select: { id: true, number: true, amount: true, status: true, dueAt: true } } } }),
    db.organizationInvoice.findMany({ where: { status: { in: ["ISSUED", "OVERDUE"] } }, orderBy: { issuedAt: "asc" }, take: 100, select: { id: true, number: true, amount: true, currency: true, status: true, dueAt: true, organization: { select: { name: true } }, seatPackage: { select: { quantity: true, program: { select: { title: true } }, cohort: { select: { title: true, program: { select: { title: true } } } } } } } }),
  ]);
  return { organizations, programs, seatPackages, invoices };
}
