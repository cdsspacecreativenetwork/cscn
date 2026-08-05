import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";
import { getMarketplaceResourceBySlug, userCanDownloadResource } from "@/data/marketplace-resources";
import { db } from "@/lib/db";

const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resource = await getMarketplaceResourceBySlug((await params).slug);
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowed = resource.ownerId === session.user.id || await userCanDownloadResource(session.user.id, resource.id);
  if (!allowed) return NextResponse.json({ error: "Resource access is required" }, { status: 403 });
  
  if (resource.filePath.startsWith("/uploads/")) {
    await db.resourceDownload.create({ data: { resourceId: resource.id, userId: session.user.id } });
    return NextResponse.redirect(new URL(resource.filePath, _.url).toString());
  }

  const { data, error } = await storage.storage.from("marketplace-resources").createSignedUrl(resource.filePath, 60, { download: resource.fileName });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Download unavailable" }, { status: 503 });
  await db.resourceDownload.create({ data: { resourceId: resource.id, userId: session.user.id } });
  return NextResponse.redirect(data.signedUrl);
}
