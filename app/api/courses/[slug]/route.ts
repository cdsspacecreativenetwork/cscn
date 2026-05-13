import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCourseDetailWithEnrollment } from "@/lib/services/courses.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();

  const result = await getCourseDetailWithEnrollment(slug, session?.user?.id);

  if (!result) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
