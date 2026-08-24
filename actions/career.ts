"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/data/audit-logs";
import { currentUser } from "@/lib/auth";
import { parseCommaList, safeHttpUrl, talentProfileInput } from "@/lib/community-career";
import { db } from "@/lib/db";

async function requireUser(returnTo = "/career") {
  const user = await currentUser();
  if (!user?.id) redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  return { ...user, id: user.id };
}

export async function toggleSavedOpportunityAction(formData: FormData) {
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const user = await requireUser();
  const opportunity = await db.careerOpportunity.findFirst({ where: { id: opportunityId, status: "PUBLISHED" }, select: { id: true } });
  if (!opportunity) return;
  const existing = await db.savedCareerOpportunity.findUnique({ where: { opportunityId_userId: { opportunityId, userId: user.id } }, select: { id: true } });
  if (existing) await db.savedCareerOpportunity.delete({ where: { id: existing.id } });
  else await db.savedCareerOpportunity.create({ data: { opportunityId, userId: user.id } });
  revalidatePath("/career");
  revalidatePath("/dashboard/career");
}

export async function applyToOpportunityAction(formData: FormData) {
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const user = await requireUser();
  const opportunity = await db.careerOpportunity.findFirst({
    where: {
      id: opportunityId,
      status: "PUBLISHED",
      OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }],
    },
    select: { id: true, applicationUrl: true },
  });
  if (!opportunity) redirect("/career?careerError=Opportunity%20is%20no%20longer%20available");
  await db.careerOpportunityInterest.upsert({ where: { opportunityId_userId: { opportunityId, userId: user.id } }, create: { opportunityId, userId: user.id, status: "STARTED" }, update: { status: "STARTED" } });
  redirect(opportunity.applicationUrl);
}

export async function markOpportunityAppliedAction(formData: FormData) {
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const user = await requireUser("/dashboard/career");
  await db.careerOpportunityInterest.updateMany({ where: { opportunityId, userId: user.id }, data: { status: "APPLIED", appliedAt: new Date() } });
  revalidatePath("/career");
  revalidatePath("/dashboard/career");
}

export async function updateTalentProfileAction(formData: FormData) {
  const user = await requireUser("/dashboard/career");
  const parsed = talentProfileInput.safeParse({ discoverable: formData.get("discoverable") === "on", targetRoles: parseCommaList(formData.get("targetRoles"), 8), skills: parseCommaList(formData.get("skills"), 16), availability: String(formData.get("availability") ?? ""), preferredWorkplace: String(formData.get("preferredWorkplace") ?? "") || null, cvUrl: safeHttpUrl(formData.get("cvUrl")), statement: String(formData.get("statement") ?? "") });
  if (!parsed.success) redirect(`/dashboard/career?careerError=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check your career profile.")}`);
  await db.careerTalentProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...parsed.data }, update: parsed.data });
  revalidatePath("/dashboard/career");
}

export async function createCareerOpportunityAction(formData: FormData) {
  const { requireAnyAdminPermission } = await import("@/lib/admin-guards");
  const session = await requireAnyAdminPermission(["canManageMarketing", "canManageLearners"]);
  const applicationUrl = safeHttpUrl(formData.get("applicationUrl"));
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
  const role = String(formData.get("role") ?? "").trim().slice(0, 120);
  const company = String(formData.get("company") ?? "").trim().slice(0, 120);
  const summary = String(formData.get("summary") ?? "").trim().slice(0, 240);
  const description = String(formData.get("description") ?? "").trim().slice(0, 5000);
  const deadlineValue = String(formData.get("applicationDeadline") ?? "").trim();
  const applicationDeadline = deadlineValue ? new Date(`${deadlineValue}T22:59:59.000Z`) : null;
  if (!slug || !role || !company || !applicationUrl || summary.length < 20 || description.length < 40 || (applicationDeadline && Number.isNaN(applicationDeadline.getTime()))) return;
  const opportunity = await db.careerOpportunity.create({ data: { slug, role, company, summary, description, location: String(formData.get("location") ?? "Remote").trim().slice(0, 120), workplaceType: String(formData.get("workplaceType") ?? "REMOTE") as "REMOTE" | "HYBRID" | "ONSITE", employmentType: String(formData.get("employmentType") ?? "FULL_TIME") as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "FREELANCE", level: String(formData.get("level") ?? "ANY") as "ENTRY" | "MID" | "SENIOR" | "ANY", skills: parseCommaList(formData.get("skills"), 16), salaryText: String(formData.get("salaryText") ?? "").trim().slice(0, 120) || null, applicationUrl, source: String(formData.get("source") ?? "Direct").trim().slice(0, 120), applicationDeadline, postedAt: new Date(), status: "PUBLISHED", createdById: session.user.id } });
  await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "career.opportunity_published", entityType: "CAREER_OPPORTUNITY", entityId: opportunity.id, entityName: `${company} · ${role}` });
  revalidatePath("/career");
  revalidatePath("/dashboard/admin/community-career");
}

export async function setCareerOpportunityStatusAction(formData: FormData) {
  const { requireAnyAdminPermission } = await import("@/lib/admin-guards");
  const session = await requireAnyAdminPermission(["canManageMarketing", "canManageLearners"]);
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const status = String(formData.get("status") ?? "") as "PUBLISHED" | "CLOSED" | "ARCHIVED";
  if (!["PUBLISHED", "CLOSED", "ARCHIVED"].includes(status)) return;
  await db.careerOpportunity.update({ where: { id: opportunityId }, data: { status } });
  await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: "career.opportunity_status_changed", entityType: "CAREER_OPPORTUNITY", entityId: opportunityId, metadata: { status } });
  revalidatePath("/career");
  revalidatePath("/dashboard/admin/community-career");
}
