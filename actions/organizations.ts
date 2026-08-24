"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/data/audit-logs";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInvitationToken, hashInvitationToken, optionalText, optionalWebUrl, organizationInvitationInput, organizationRequestInput, seatRequestInput } from "@/lib/organizations";
import { acceptOrganizationInvitation, allocateOrganizationSeat, canManageOrganization, canManageOrganizationBilling } from "@/lib/services/organization.service";

async function requireUser(returnTo: string) {
  const user = await currentUser();
  if (!user?.id) redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  return { ...user, id: user.id };
}

async function requireOrganizationRole(organizationId: string, userId: string, mode: "MANAGE" | "BILLING") {
  const membership = await db.organizationMember.findFirst({ where: { organizationId, userId, status: "ACTIVE", organization: { status: "ACTIVE" } }, select: { id: true, role: true, organization: { select: { slug: true } } } });
  const allowed = membership && (mode === "MANAGE" ? canManageOrganization(membership.role) : canManageOrganizationBilling(membership.role));
  if (!membership || !allowed) return null;
  return membership;
}

export async function requestOrganizationAction(formData: FormData) {
  const user = await requireUser("/teams");
  const parsed = organizationRequestInput.safeParse({
    name: formData.get("name"), slug: formData.get("slug"), type: formData.get("type"), description: formData.get("description"), websiteUrl: optionalWebUrl(formData.get("websiteUrl")), officialDomain: optionalText(formData.get("officialDomain")), country: formData.get("country"),
  });
  if (!parsed.success) redirect(`/teams?teamError=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the organization details.")}#request-team-plan`);
  const existing = await db.organization.findUnique({ where: { slug: parsed.data.slug }, select: { id: true } });
  if (existing) redirect(`/teams?teamError=${encodeURIComponent("That organization URL is already in use.")}#request-team-plan`);
  const organization = await db.$transaction(async (tx) => {
    const created = await tx.organization.create({ data: { ...parsed.data, requestedById: user.id } });
    await tx.organizationMember.create({ data: { organizationId: created.id, userId: user.id, role: "OWNER", status: "ACTIVE", joinedAt: new Date() } });
    return created;
  });
  redirect(`/dashboard/organizations/${organization.slug}`);
}

export async function createOrganizationTeamAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const slug = String(formData.get("organizationSlug") ?? "");
  const user = await requireUser(`/dashboard/organizations/${slug}`);
  const actor = await requireOrganizationRole(organizationId, user.id, "MANAGE");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (!actor || name.length < 2) return;
  await db.organizationTeam.upsert({ where: { organizationId_name: { organizationId, name } }, create: { organizationId, name, description: optionalText(formData.get("description")) }, update: { description: optionalText(formData.get("description")) } });
  revalidatePath(`/dashboard/organizations/${slug}`);
}

export async function inviteOrganizationMemberAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const slug = String(formData.get("organizationSlug") ?? "");
  const user = await requireUser(`/dashboard/organizations/${slug}`);
  const actor = await requireOrganizationRole(organizationId, user.id, "MANAGE");
  const parsed = organizationInvitationInput.safeParse({ email: formData.get("email"), role: formData.get("role"), teamId: optionalText(formData.get("teamId")) });
  if (!actor || !parsed.success) redirect(`/dashboard/organizations/${slug}?teamError=${encodeURIComponent("Check the invitation details.")}`);
  if (parsed.data.teamId) {
    const team = await db.organizationTeam.findFirst({ where: { id: parsed.data.teamId, organizationId }, select: { id: true } });
    if (!team) redirect(`/dashboard/organizations/${slug}?teamError=${encodeURIComponent("Team not found.")}`);
  }
  const existingMember = await db.organizationMember.findFirst({ where: { organizationId, user: { email: parsed.data.email }, status: "ACTIVE" }, select: { id: true } });
  if (existingMember) redirect(`/dashboard/organizations/${slug}?teamError=${encodeURIComponent("That person is already an active member.")}`);
  const token = createInvitationToken();
  await db.$transaction([
    db.organizationInvitation.updateMany({ where: { organizationId, email: parsed.data.email, status: "PENDING" }, data: { status: "REVOKED" } }),
    db.organizationInvitation.create({ data: { organizationId, teamId: parsed.data.teamId, email: parsed.data.email, role: parsed.data.role, invitedById: user.id, tokenHash: hashInvitationToken(token), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }),
  ]);
  const inviteLink = `/teams/invite/${token}`;
  redirect(`/dashboard/organizations/${slug}?inviteLink=${encodeURIComponent(inviteLink)}`);
}

export async function acceptOrganizationInvitationAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const user = await requireUser(`/teams/invite/${token}`);
  if (!user.email) redirect(`/teams/invite/${token}?teamError=${encodeURIComponent("Your account needs an email address.")}`);
  const result = await acceptOrganizationInvitation({ token, userId: user.id, userEmail: user.email });
  if (!result.success) redirect(`/teams/invite/${token}?teamError=${encodeURIComponent(result.error)}`);
  redirect(`/dashboard/organizations/${result.organizationSlug}`);
}

export async function requestOrganizationSeatsAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const slug = String(formData.get("organizationSlug") ?? "");
  const user = await requireUser(`/dashboard/organizations/${slug}`);
  const actor = await requireOrganizationRole(organizationId, user.id, "BILLING");
  const parsed = seatRequestInput.safeParse({ programId: optionalText(formData.get("programId")), cohortId: optionalText(formData.get("cohortId")), quantity: formData.get("quantity"), notes: optionalText(formData.get("notes")) });
  if (!actor || !parsed.success) redirect(`/dashboard/organizations/${slug}?teamError=${encodeURIComponent(parsed.success ? "You cannot request seats." : parsed.error.issues[0]?.message ?? "Check the seat request.")}`);
  if (parsed.data.programId) {
    const program = await db.program.findFirst({ where: { id: parsed.data.programId, status: "PUBLISHED" }, select: { id: true } });
    if (!program) redirect(`/dashboard/organizations/${slug}?teamError=${encodeURIComponent("Program not found.")}`);
  }
  if (parsed.data.cohortId) {
    const cohort = await db.cohort.findFirst({ where: { id: parsed.data.cohortId, status: { not: "CANCELLED" }, OR: [{ organizationId: null }, { organizationId }] }, select: { id: true } });
    if (!cohort) redirect(`/dashboard/organizations/${slug}?teamError=${encodeURIComponent("Cohort not found.")}`);
  }
  await db.organizationSeatPackage.create({ data: { organizationId, programId: parsed.data.programId, cohortId: parsed.data.cohortId, quantity: parsed.data.quantity, pricePerSeat: 0, notes: parsed.data.notes, createdById: user.id, status: "REQUESTED" } });
  revalidatePath(`/dashboard/organizations/${slug}`);
  revalidatePath("/dashboard/admin/organizations");
}

export async function allocateOrganizationSeatAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const slug = String(formData.get("organizationSlug") ?? "");
  const user = await requireUser(`/dashboard/organizations/${slug}`);
  const result = await allocateOrganizationSeat({ organizationId, seatPackageId: String(formData.get("seatPackageId") ?? ""), organizationMemberId: String(formData.get("organizationMemberId") ?? ""), actorUserId: user.id });
  if (!result.success) redirect(`/dashboard/organizations/${slug}?teamError=${encodeURIComponent(result.error)}`);
  revalidatePath(`/dashboard/organizations/${slug}`);
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard/cohorts");
}

export async function createOrganizationAssignmentAction(formData: FormData) {
  const organizationId = String(formData.get("organizationId") ?? "");
  const slug = String(formData.get("organizationSlug") ?? "");
  const user = await requireUser(`/dashboard/organizations/${slug}`);
  const actor = await requireOrganizationRole(organizationId, user.id, "MANAGE");
  const seatPackageId = String(formData.get("seatPackageId") ?? "");
  const teamId = optionalText(formData.get("teamId"));
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const dueValue = optionalText(formData.get("dueAt"));
  if (!actor || title.length < 3) return;
  const seatPackage = await db.organizationSeatPackage.findFirst({ where: { id: seatPackageId, organizationId, status: "ACTIVE" }, select: { id: true, programId: true, cohortId: true } });
  if (!seatPackage) redirect(`/dashboard/organizations/${slug}?teamError=${encodeURIComponent("Choose an active seat package.")}`);
  if (teamId && !(await db.organizationTeam.findFirst({ where: { id: teamId, organizationId }, select: { id: true } }))) return;
  await db.organizationLearningAssignment.create({ data: { organizationId, teamId, seatPackageId, programId: seatPackage.programId, cohortId: seatPackage.cohortId, title, description: optionalText(formData.get("description")), dueAt: dueValue ? new Date(`${dueValue}T22:59:59.000Z`) : null, createdById: user.id } });
  revalidatePath(`/dashboard/organizations/${slug}`);
}

export async function setOrganizationStatusAction(formData: FormData) {
  const { requireAnyAdminPermission } = await import("@/lib/admin-guards");
  const session = await requireAnyAdminPermission(["canManageBilling", "canManageUsers"]);
  const organizationId = String(formData.get("organizationId") ?? "");
  const status = String(formData.get("status") ?? "") as "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  if (!["ACTIVE", "SUSPENDED", "ARCHIVED"].includes(status)) return;
  await db.organization.update({ where: { id: organizationId }, data: { status, approvedById: status === "ACTIVE" ? session.user.id : undefined, approvedAt: status === "ACTIVE" ? new Date() : undefined } });
  await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "organization.status_changed", entityType: "ORGANIZATION", entityId: organizationId, metadata: { status } });
  revalidatePath("/dashboard/admin/organizations");
}

export async function createOrganizationCohortAction(formData: FormData) {
  const { requireAnyAdminPermission } = await import("@/lib/admin-guards");
  const session = await requireAnyAdminPermission(["canManageCourses", "canManageLearners"]);
  const organizationId = String(formData.get("organizationId") ?? "");
  const programId = String(formData.get("programId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));
  const capacity = Number(formData.get("capacity"));
  const scheduleSummary = String(formData.get("scheduleSummary") ?? "").trim().slice(0, 1000);
  if (!organizationId || !programId || title.length < 3 || !slug || !Number.isInteger(capacity) || capacity < 1 || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt || scheduleSummary.length < 10) return;
  const [organization, program] = await Promise.all([db.organization.findFirst({ where: { id: organizationId, status: "ACTIVE" }, select: { id: true } }), db.program.findFirst({ where: { id: programId, status: "PUBLISHED" }, select: { id: true } })]);
  if (!organization || !program) return;
  const cohort = await db.cohort.create({ data: { organizationId, programId, title, slug, status: "APPLICATIONS_CLOSED", applicationOpenAt: new Date(), applicationCloseAt: new Date(), startsAt, endsAt, capacity, price: 0, applicationRequired: false, graduationRules: ["Complete assigned learning", "Meet the program completion threshold"], scheduleSummary, weeklySchedule: [], timezone: "Africa/Lagos" } });
  await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "organization.private_cohort_created", entityType: "COHORT", entityId: cohort.id, entityName: title, metadata: { organizationId, programId } });
  revalidatePath("/dashboard/admin/organizations");
}

export async function issueOrganizationInvoiceAction(formData: FormData) {
  const { requireAnyAdminPermission } = await import("@/lib/admin-guards");
  const session = await requireAnyAdminPermission(["canManageBilling"]);
  const issuerId = session.user.id!;
  const seatPackageId = String(formData.get("seatPackageId") ?? "");
  const pricePerSeat = Number(formData.get("pricePerSeat"));
  const dueValue = optionalText(formData.get("dueAt"));
  if (!Number.isFinite(pricePerSeat) || pricePerSeat < 0) return;
  const seatPackage = await db.organizationSeatPackage.findFirst({ where: { id: seatPackageId, status: { in: ["REQUESTED", "INVOICED"] } }, select: { id: true, quantity: true, organizationId: true, currency: true } });
  if (!seatPackage) return;
  const amount = pricePerSeat * seatPackage.quantity;
  const number = `ORG-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  await db.$transaction(async (tx) => {
    await tx.organizationSeatPackage.update({ where: { id: seatPackage.id }, data: { pricePerSeat, status: "INVOICED" } });
    await tx.organizationInvoice.upsert({ where: { seatPackageId: seatPackage.id }, create: { organizationId: seatPackage.organizationId, seatPackageId: seatPackage.id, number, amount, currency: seatPackage.currency, issuedById: issuerId, dueAt: dueValue ? new Date(`${dueValue}T22:59:59.000Z`) : null }, update: { amount, status: "ISSUED", issuedById: issuerId, issuedAt: new Date(), dueAt: dueValue ? new Date(`${dueValue}T22:59:59.000Z`) : null } });
  });
  revalidatePath("/dashboard/admin/organizations");
}

export async function markOrganizationInvoicePaidAction(formData: FormData) {
  const { requireAnyAdminPermission } = await import("@/lib/admin-guards");
  const session = await requireAnyAdminPermission(["canManageBilling"]);
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const invoice = await db.organizationInvoice.findFirst({ where: { id: invoiceId, status: "ISSUED" }, select: { id: true, seatPackageId: true, organizationId: true } });
  if (!invoice) return;
  await db.$transaction([
    db.organizationInvoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt: new Date() } }),
    db.organizationSeatPackage.update({ where: { id: invoice.seatPackageId }, data: { status: "ACTIVE", startsAt: new Date() } }),
  ]);
  await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "organization.invoice_paid_confirmed", entityType: "ORGANIZATION_INVOICE", entityId: invoice.id, metadata: { organizationId: invoice.organizationId, seatPackageId: invoice.seatPackageId } });
  revalidatePath("/dashboard/admin/organizations");
}
