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
import { mkdir, writeFile } from "node:fs/promises";
import nodePath from "node:path";

const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const BUCKET = "marketplace-resources";
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function requireCreator() {
  const user = await currentUser();
  if (!user?.id || !["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(user.role ?? "")) throw new Error("Only instructors can create marketplace resources.");
  return user as { id: string; role?: string };
}

export async function createMarketplaceResourceAction(formData: FormData) {
  const user = await requireCreator();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "ASSET");
  const price = Number(formData.get("price") ?? 0);
  const file = formData.get("file") as File | null;
  const thumbnail = formData.get("thumbnail") as File | null;
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const resourceType = String(formData.get("type") ?? "FILE");

  if (!title) return { error: "Resource title is required." };
  if (!file && !linkUrl) return { error: "Please upload a file or provide a web link URL." };
  if (file && file.size > 100 * 1024 * 1024) return { error: "Files must be 100MB or smaller." };
  if (price < 0) return { error: "Price cannot be negative." };

  let path = linkUrl;
  let fileName = linkUrl ? title : "file";
  let fileSize = 0;
  let mimeType: string | null = resourceType === "LINK" ? "url" : "application/octet-stream";

  if (file && file.size > 0) {
    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type || "application/octet-stream";

    try {
      const { data: buckets } = await storage.storage.listBuckets();
      if (!buckets?.some((bucket) => bucket.name === BUCKET)) {
        await storage.storage.createBucket(BUCKET, { public: false });
      }
      path = `${user.id}/${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error: uploadError } = await storage.storage.from(BUCKET).upload(path, file, { contentType: mimeType });
      if (uploadError) throw new Error(uploadError.message);
    } catch (err: unknown) {
      console.warn("Supabase upload failed, falling back to local file storage:", err instanceof Error ? err.message : err);
      const localDir = nodePath.join(process.cwd(), "public", "uploads");
      await mkdir(localDir, { recursive: true });
      const uniqueName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const localPath = nodePath.join(localDir, uniqueName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(localPath, buffer);
      path = `/uploads/${uniqueName}`;
    }
  }

  let thumbnailUrl: string | null = null;
  if (thumbnail?.size) {
    if (!thumbnail.type.startsWith("image/")) return { error: "Thumbnail must be an image file." };
    try {
      const thumbnailBucket = "marketplace-thumbnails";
      const { data: thumbnailBuckets } = await storage.storage.listBuckets();
      if (!thumbnailBuckets?.some((bucket) => bucket.name === thumbnailBucket)) {
        await storage.storage.createBucket(thumbnailBucket, { public: true });
      }
      const thumbnailPath = `${user.id}/${uuidv4()}-${thumbnail.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error: thumbnailError } = await storage.storage.from(thumbnailBucket).upload(thumbnailPath, thumbnail, { contentType: thumbnail.type });
      if (thumbnailError) throw new Error(thumbnailError.message);
      thumbnailUrl = storage.storage.from(thumbnailBucket).getPublicUrl(thumbnailPath).data.publicUrl;
    } catch (err: unknown) {
      console.warn("Supabase thumbnail upload failed, falling back to local storage:", err instanceof Error ? err.message : err);
      const localDir = nodePath.join(process.cwd(), "public", "uploads");
      await mkdir(localDir, { recursive: true });
      const uniqueName = `${uuidv4()}-${thumbnail.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const localPath = nodePath.join(localDir, uniqueName);
      const buffer = Buffer.from(await thumbnail.arrayBuffer());
      await writeFile(localPath, buffer);
      thumbnailUrl = `/uploads/${uniqueName}`;
    }
  }

  const courseId = String(formData.get("courseId") || "") || null;
  const moduleId = String(formData.get("moduleId") || "") || null;
  const lessonId = String(formData.get("lessonId") || "") || null;

  if (courseId) {
    const linkedCourse = await db.course.findFirst({
      where: {
        id: courseId,
        OR: [
          { instructorId: user.id },
          { instructors: { some: { userId: user.id } } },
        ],
      },
      select: { id: true },
    });
    if (!linkedCourse) return { error: "Choose a course that you instruct." };
  }

  const isPaidStandalone = !courseId && price > 0;
  const status = isPaidStandalone ? "PENDING_REVIEW" : "PUBLISHED";

  const slug = `${slugify(title)}-${uuidv4().slice(0, 6)}`;
  const resource = await db.marketplaceResource.create({
    data: {
      ownerId: user.id,
      title,
      slug,
      description: description || title,
      category: category as never,
      thumbnailUrl,
      filePath: path,
      fileName,
      fileSize,
      mimeType,
      isFree: price === 0,
      price: price || null,
      courseId,
      moduleId,
      lessonId,
      currency: String(formData.get("currency") || "NGN"),
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/resources");
  revalidatePath("/dashboard/instructor/resources");
  return { success: true, resourceId: resource.id, status };
}

export async function updateMarketplaceResourceAction(resourceId: string, formData: FormData) {
  const user = await requireCreator();
  const existing = await db.marketplaceResource.findFirst({
    where: { id: resourceId, ownerId: user.id },
  });
  if (!existing) return { error: "Resource not found or unauthorized." };

  const title = String(formData.get("title") ?? "").trim() || existing.title;
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const file = formData.get("file") as File | null;
  const thumbnail = formData.get("thumbnail") as File | null;
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const resourceType = String(formData.get("type") ?? "FILE");

  let path = existing.filePath;
  let fileName = existing.fileName;
  let fileSize = existing.fileSize;
  let mimeType = existing.mimeType;

  if (linkUrl) {
    path = linkUrl;
    fileName = title;
    fileSize = 0;
    mimeType = "url";
  } else if (file && file.size > 0) {
    if (file.size > 100 * 1024 * 1024) return { error: "Files must be 100MB or smaller." };
    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type || "application/octet-stream";

    try {
      const { data: buckets } = await storage.storage.listBuckets();
      if (!buckets?.some((b) => b.name === BUCKET)) {
        await storage.storage.createBucket(BUCKET, { public: false });
      }
      path = `${user.id}/${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error: uploadError } = await storage.storage.from(BUCKET).upload(path, file, { contentType: mimeType });
      if (uploadError) throw new Error(uploadError.message);
    } catch (err: unknown) {
      console.warn("Supabase file update failed, falling back to local storage:", err instanceof Error ? err.message : err);
      const localDir = nodePath.join(process.cwd(), "public", "uploads");
      await mkdir(localDir, { recursive: true });
      const uniqueName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const localPath = nodePath.join(localDir, uniqueName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(localPath, buffer);
      path = `/uploads/${uniqueName}`;
    }
  }

  let thumbnailUrl = existing.thumbnailUrl;
  if (thumbnail?.size) {
    if (!thumbnail.type.startsWith("image/")) return { error: "Thumbnail must be an image file." };
    try {
      const thumbnailBucket = "marketplace-thumbnails";
      const { data: thumbnailBuckets } = await storage.storage.listBuckets();
      if (!thumbnailBuckets?.some((b) => b.name === thumbnailBucket)) {
        await storage.storage.createBucket(thumbnailBucket, { public: true });
      }
      const thumbnailPath = `${user.id}/${uuidv4()}-${thumbnail.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error: thumbnailError } = await storage.storage.from(thumbnailBucket).upload(thumbnailPath, thumbnail, { contentType: thumbnail.type });
      if (thumbnailError) throw new Error(thumbnailError.message);
      thumbnailUrl = storage.storage.from(thumbnailBucket).getPublicUrl(thumbnailPath).data.publicUrl;
    } catch (err: unknown) {
      console.warn("Supabase thumbnail update failed, falling back to local storage:", err instanceof Error ? err.message : err);
      const localDir = nodePath.join(process.cwd(), "public", "uploads");
      await mkdir(localDir, { recursive: true });
      const uniqueName = `${uuidv4()}-${thumbnail.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const localPath = nodePath.join(localDir, uniqueName);
      const buffer = Buffer.from(await thumbnail.arrayBuffer());
      await writeFile(localPath, buffer);
      thumbnailUrl = `/uploads/${uniqueName}`;
    }
  }

  const courseId = String(formData.get("courseId") || "") || null;
  const moduleId = String(formData.get("moduleId") || "") || null;
  const lessonId = String(formData.get("lessonId") || "") || null;

  const isPaidStandalone = !courseId && price > 0;
  const status = isPaidStandalone ? "PENDING_REVIEW" : "PUBLISHED";

  await db.marketplaceResource.update({
    where: { id: resourceId },
    data: {
      title,
      description: description || title,
      thumbnailUrl,
      filePath: path,
      fileName,
      fileSize,
      mimeType,
      isFree: price === 0,
      price: price || null,
      courseId,
      moduleId,
      lessonId,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : existing.publishedAt,
    },
  });

  revalidatePath("/dashboard/resources");
  return { success: true, status };
}

export async function deleteMarketplaceResourceAction(resourceId: string) {
  const user = await requireCreator();
  const existing = await db.marketplaceResource.findFirst({
    where: { id: resourceId, ownerId: user.id },
  });

  if (!existing) return { error: "Resource not found or unauthorized." };

  await db.marketplaceResource.delete({
    where: { id: resourceId },
  });

  revalidatePath("/dashboard/resources");
  return { success: true };
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

export async function duplicateMarketplaceResourceAction(resourceId: string) {
  const user = await requireCreator();
  const existing = await db.marketplaceResource.findFirst({
    where: { id: resourceId, ownerId: user.id },
  });

  if (!existing) return { error: "Resource not found or unauthorized." };

  const slug = `${slugify(existing.title)}-copy-${uuidv4().slice(0, 4)}`;

  const duplicated = await db.marketplaceResource.create({
    data: {
      ownerId: user.id,
      title: `${existing.title} (Copy)`,
      slug,
      description: existing.description,
      category: existing.category,
      thumbnailUrl: existing.thumbnailUrl,
      filePath: existing.filePath,
      fileName: existing.fileName,
      fileSize: existing.fileSize,
      mimeType: existing.mimeType,
      isFree: existing.isFree,
      price: existing.price,
      currency: existing.currency,
      courseId: existing.courseId,
      moduleId: existing.moduleId,
      lessonId: existing.lessonId,
      status: "DRAFT",
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/resources");
  revalidatePath("/dashboard/instructor/resources");
  return { success: true, resourceId: duplicated.id };
}
