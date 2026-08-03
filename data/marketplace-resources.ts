import { db } from "@/lib/db";

export async function getPublishedMarketplaceResources() {
  return db.marketplaceResource.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, description: true, category: true, thumbnailUrl: true, isFree: true, price: true, currency: true, owner: { select: { name: true, image: true } }, course: { select: { title: true, slug: true } } },
  });
}

export async function getMarketplaceResourceBySlug(slug: string) {
  return db.marketplaceResource.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, title: true, slug: true, description: true, category: true, thumbnailUrl: true, fileName: true, isFree: true, price: true, currency: true, ownerId: true, filePath: true, owner: { select: { name: true } } },
  });
}

export async function userCanDownloadResource(userId: string, resourceId: string) {
  const access = await db.resourceAccess.findFirst({ where: { userId, resourceId, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, select: { id: true } });
  return Boolean(access);
}
