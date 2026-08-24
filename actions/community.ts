"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/data/audit-logs";
import { communityPostInput, communityReportInput } from "@/lib/community-career";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canJoinCommunitySpace } from "@/lib/services/community.service";

async function requireUser(returnTo: string) {
  const user = await currentUser();
  if (!user?.id) redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  return { ...user, id: user.id };
}

export async function joinCommunitySpaceAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const spaceId = String(formData.get("spaceId") ?? "");
  const user = await requireUser(`/community/${slug}`);
  const allowed = await canJoinCommunitySpace(spaceId, user.id);
  if (!allowed.success) redirect(`/community/${slug}?communityError=${encodeURIComponent(allowed.error)}`);
  await db.communityMembership.upsert({ where: { spaceId_userId: { spaceId, userId: user.id } }, create: { spaceId, userId: user.id }, update: { status: "ACTIVE", joinedAt: new Date() } });
  revalidatePath("/community");
  revalidatePath(`/community/${slug}`);
}

export async function leaveCommunitySpaceAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const spaceId = String(formData.get("spaceId") ?? "");
  const user = await requireUser(`/community/${slug}`);
  await db.communityMembership.updateMany({ where: { spaceId, userId: user.id, role: "MEMBER" }, data: { status: "LEFT" } });
  revalidatePath("/community");
  revalidatePath(`/community/${slug}`);
}

export async function createCommunityPostAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const spaceId = String(formData.get("spaceId") ?? "");
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  const user = await requireUser(`/community/${slug}`);
  const parsed = communityPostInput.safeParse({ title: parentId ? undefined : String(formData.get("title") ?? ""), body: String(formData.get("body") ?? "") });
  if (!parsed.success) redirect(`/community/${slug}?communityError=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid post.")}`);
  const membership = await db.communityMembership.findFirst({ where: { spaceId, userId: user.id, status: "ACTIVE" }, select: { id: true } });
  if (!membership) redirect(`/community/${slug}?communityError=${encodeURIComponent("Join this space before posting.")}`);
  if (parentId) {
    const parent = await db.communityPost.findFirst({ where: { id: parentId, spaceId, parentId: null, status: "PUBLISHED" }, select: { id: true } });
    if (!parent) redirect(`/community/${slug}?communityError=${encodeURIComponent("That discussion is no longer available.")}`);
  }
  await db.communityPost.create({ data: { spaceId, authorId: user.id, parentId, title: parsed.data.title, body: parsed.data.body } });
  revalidatePath("/community");
  revalidatePath(`/community/${slug}`);
}

export async function reportCommunityPostAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const user = await requireUser(`/community/${slug}`);
  const parsed = communityReportInput.safeParse({ reason: String(formData.get("reason") ?? "OTHER"), details: String(formData.get("details") ?? "") });
  if (!parsed.success) redirect(`/community/${slug}?communityError=${encodeURIComponent("Choose a valid report reason.")}`);
  const post = await db.communityPost.findFirst({ where: { id: postId, status: "PUBLISHED" }, select: { id: true, authorId: true } });
  if (!post || post.authorId === user.id) redirect(`/community/${slug}?communityError=${encodeURIComponent("This post cannot be reported.")}`);
  await db.communityPostReport.upsert({ where: { postId_reporterId: { postId, reporterId: user.id } }, create: { postId, reporterId: user.id, ...parsed.data }, update: { ...parsed.data, status: "OPEN", reviewedAt: null, reviewedById: null, resolution: null } });
  revalidatePath(`/community/${slug}`);
}

export async function moderateCommunityReportAction(formData: FormData) {
  const { requireAnyAdminPermission } = await import("@/lib/admin-guards");
  const session = await requireAnyAdminPermission(["canManageLearners", "canManageSettings"]);
  const reportId = String(formData.get("reportId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "REMOVE" | "DISMISS";
  const resolution = String(formData.get("resolution") ?? "").trim().slice(0, 500) || null;
  if (!reportId || !["REMOVE", "DISMISS"].includes(decision)) return;
  const report = await db.communityPostReport.findUnique({ where: { id: reportId }, select: { id: true, postId: true, post: { select: { space: { select: { slug: true } } } } } });
  if (!report) return;
  await db.$transaction([
    db.communityPostReport.update({ where: { id: reportId }, data: { status: decision === "REMOVE" ? "RESOLVED" : "DISMISSED", reviewedById: session.user.id, reviewedAt: new Date(), resolution } }),
    ...(decision === "REMOVE" ? [db.communityPost.update({ where: { id: report.postId }, data: { status: "REMOVED" } })] : []),
  ]);
  await createAuditLog({ actorId: session.user.id, actorName: session.user.name, actorEmail: session.user.email, action: decision === "REMOVE" ? "community.post_removed" : "community.report_dismissed", entityType: "COMMUNITY_POST_REPORT", entityId: reportId, metadata: { postId: report.postId, resolution } });
  revalidatePath("/dashboard/admin/community-career");
  revalidatePath(`/community/${report.post.space.slug}`);
}
