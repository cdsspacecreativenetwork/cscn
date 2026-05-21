import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCourseFeedback } from "@/data/course-feedback";
import { getCourseRole } from "@/data/instructor";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug: courseId } = await params;
  const userId = session.user.id;
  // @ts-ignore
  const userRole = session.user.role as string | undefined;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  if (!isAdmin) {
    const role = await getCourseRole(courseId, userId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const items = await getCourseFeedback(courseId);
  return NextResponse.json(items);
}
