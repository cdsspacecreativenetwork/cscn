import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { enrollInPublishedFreeCourse } from "@/lib/services/enrollment-access.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const result = await enrollInPublishedFreeCourse(session.user.id, slug);

  if (!result.success) {
    const status = result.code === "COURSE_NOT_FOUND"
      ? 404
      : result.code === "PAYMENT_REQUIRED"
        ? 402
        : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json(result);
}
