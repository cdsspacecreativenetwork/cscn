import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ hasCourseCollaborations: false }, { status: 401 });
  }

  const count = await db.courseInstructor.count({
    where: {
      userId: session.user.id,
      role: { in: ["CO_INSTRUCTOR", "TEACHING_ASSISTANT"] },
    },
  });

  return NextResponse.json({ hasCourseCollaborations: count > 0 });
}
