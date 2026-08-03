"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePaymentReference } from "@/lib/payments/ledger";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { getAppBaseUrl } from "@/lib/payments/url";
import { getMarketplaceResourceBySlug } from "@/data/marketplace-resources";

const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const BUCKET = "marketplace-resources";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function requireCreator() {
  const user = await currentUser();
  if (!user?.id || !["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(user.role ?? "")) throw new Error("Only instructors can create marketplace resources.");
  return user;
}

export async function createMarketplaceResourceAction(formData: FormData) {
  const user = await requireCreator();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "OTHER");
  const price = Number(formData.get("price") ?? 0);
  const file = formData.get("file") as File | null;
  const thumbnail = formData.get("thumbnail") as File | null;
  if (!title || !description || !file) return { error: "Title, description, and a download file are required." };
  if (file.size > 100 * 1024 * 1024) return { error: "Files must be 100MB or smaller." };
  if (price < 0) return { error: "Price cannot be negative." };
  const { data: buckets } = await storage.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.name === BUCKET)) await storage.storage.createBucket(BUCKET, { public: false });
  const path = `${user.id}/${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const { error: uploadError } = await storage.storage.from(BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) return { error: uploadError.message };
  let thumbnailUrl: string | null = null;
  if (thumbnail?.size) {
    if (!thumbnail.type.startsWith("image/")) return { error: "Thumbnail must be an image." };
    const thumbnailBucket = "marketplace-thumbnails";
    const { data: thumbnailBuckets } = await storage.storage.listBuckets();
    if (!thumbnailBuckets?.some((bucket) => bucket.name === thumbnailBucket)) await storage.storage.createBucket(thumbnailBucket, { public: true });
    const thumbnailPath = `${user.id}/${uuidv4()}-${thumbnail.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error: thumbnailError } = await storage.storage.from(thumbnailBucket).upload(thumbnailPath, thumbnail, { contentType: thumbnail.type });
    if (thumbnailError) return { error: thumbnailError.message };
    thumbnailUrl = storage.storage.from(thumbnailBucket).getPublicUrl(thumbnailPath).data.publicUrl;
  }
  const courseId = String(formData.get("courseId") || "") || null;
  const moduleId = String(formData.get("moduleId") || "") || null;
  const lessonId = String(formData.get("lessonId") || "") || null;
  if (courseId) {
    const linkedCourse = await db.course.findFirst({ where: { id: courseId, instructorId: user.id, ...(moduleId ? { modules: { some: { id: moduleId, ...(lessonId ? { lessons: { some: { id: lessonId } } } : {}) } } } : {}) }, select: { id: true } });
    if (!linkedCourse) return { error: "Choose a course, module, and lesson that you own." };
  }
  const slug = `${slugify(title)}-${uuidv4().slice(0, 6)}`;
  const resource = await db.marketplaceResource.create({ data: { ownerId: user.id, title, slug, description, category: category as never, filePath: path, fileName: file.name, fileSize: file.size, mimeType: file.type || null, isFree: price === 0, price: price || null, courseId, moduleId, lessonId, currency: String(formData.get("currency") || "NGN") }, select: { id: true } });
  revalidatePath("/dashboard/instructor/resources");
  return { success: true, resourceId: resource.id };
}

export async function submitMarketplaceResourceAction(resourceId: string) {
  const user = await requireCreator();
  await db.marketplaceResource.updateMany({ where: { id: resourceId, ownerId: user.id, status: { in: ["DRAFT", "UNPUBLISHED"] } }, data: { status: "PENDING_REVIEW" } });
  revalidatePath("/dashboard/instructor/resources");
}

export async function claimFreeResourceAction(slug: string) {
  const user = await currentUser();
  if (!user?.id) redirect(`/signin?callbackUrl=/resources/${slug}`);
  const resource = await getMarketplaceResourceBySlug(slug);
  if (!resource || !resource.isFree) return { error: "This free resource is unavailable." };
  await db.resourceAccess.upsert({ where: { resourceId_userId: { resourceId: resource.id, userId: user.id } }, create: { resourceId: resource.id, userId: user.id, source: "FREE_CLAIM" }, update: { revokedAt: null } });
  redirect(`/api/resources/${slug}/download`);
}

export async function redirectToResourceCheckoutAction(slug: string) {
  const user = await currentUser();
  if (!user?.id || !user.email) return { error: "Sign in before purchasing a resource." };
  const resource = await getMarketplaceResourceBySlug(slug);
  if (!resource || resource.isFree || !resource.price) return { error: "This paid resource is unavailable." };
  if (resource.currency !== "NGN") return { error: "Paystack checkout currently supports NGN resources only." };
  const existing = await db.resourceAccess.findUnique({ where: { resourceId_userId: { resourceId: resource.id, userId: user.id } }, select: { id: true } });
  if (existing) redirect(`/api/resources/${slug}/download`);
  const amount = Number(resource.price); const reference = generatePaymentReference("cscn_resource");
  const order = await db.purchaseOrder.create({ data: { userId: user.id, resourceId: resource.id, type: "RESOURCE", status: "PENDING", amount, currency: resource.currency, provider: "PAYSTACK", providerReference: reference, metadata: { resourceSlug: slug } }, select: { id: true } });
  await db.payment.create({ data: { orderId: order.id, userId: user.id, provider: "PAYSTACK", status: "PENDING", amount, currency: resource.currency, providerReference: reference } });
  const initialized = await initializePaystackTransaction({ email: user.email, amount, currency: resource.currency, reference, callbackUrl: `${await getAppBaseUrl()}/api/payments/paystack/callback?reference=${reference}`, metadata: { orderId: order.id, resourceId: resource.id, type: "RESOURCE" } });
  if (!initialized.status || !initialized.data?.authorization_url) return { error: initialized.message || "Unable to initialize Paystack checkout." };
  redirect(initialized.data.authorization_url);
}

export async function reviewMarketplaceResourceAction(resourceId: string, decision: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED", note?: string) {
  const user = await currentUser();
  if (!user?.id || !["ADMIN", "SUPER_ADMIN"].includes(user.role ?? "")) return { error: "Only administrators can review resources." };
  const status = decision === "APPROVED" ? "PUBLISHED" : decision === "CHANGES_REQUESTED" ? "DRAFT" : "ARCHIVED";
  await db.$transaction([
    db.resourceReview.create({ data: { resourceId, reviewerId: user.id, status: decision, note: note?.trim() || null } }),
    db.marketplaceResource.update({ where: { id: resourceId }, data: { status, publishedAt: decision === "APPROVED" ? new Date() : null } }),
  ]);
  revalidatePath("/resources");
  return { success: true };
}

export async function grantMarketplaceResourceAccessAction(resourceId: string, email: string, expiresAt?: string) {
  const user = await requireCreator();
  const recipient = await db.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  if (!recipient) return { error: "The learner must have a CSCN account before access can be granted." };
  const owned = await db.marketplaceResource.findFirst({ where: { id: resourceId, ownerId: user.id }, select: { id: true } });
  if (!owned) return { error: "Resource not found." };
  await db.resourceAccess.upsert({ where: { resourceId_userId: { resourceId, userId: recipient.id } }, create: { resourceId, userId: recipient.id, source: "GRANT", grantedById: user.id, expiresAt: expiresAt ? new Date(expiresAt) : null }, update: { source: "GRANT", grantedById: user.id, expiresAt: expiresAt ? new Date(expiresAt) : null, revokedAt: null } });
  return { success: true };
}
