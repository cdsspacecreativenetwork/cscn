import { NextRequest, NextResponse } from "next/server";
import { listCourses, listCategories } from "@/lib/services/courses.service";
import { toCardProps } from "@/lib/course-adapter";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const category = searchParams.get("category") ?? undefined;

  const [{ courses, total, totalPages }, categories] = await Promise.all([
    listCourses(page, category),
    listCategories(),
  ]);

  return NextResponse.json({
    courses: courses.map(toCardProps),
    total,
    page,
    totalPages,
    categories: categories.map((c) => c.name),
  });
}
