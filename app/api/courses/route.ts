import { NextRequest, NextResponse } from "next/server";
import { listCourses, listCategories } from "@/lib/services/courses.service";
import { toCardProps } from "@/lib/course-adapter";
import { getRequestCountry, localizePrice } from "@/lib/localization/pricing";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const category = searchParams.get("category") ?? undefined;
  const requestCountry = getRequestCountry(request.headers);

  const [{ courses, total, totalPages }, categories] = await Promise.all([
    listCourses(page, category),
    listCategories(),
  ]);

  return NextResponse.json({
    courses: await Promise.all(courses.map(async (course) => {
      const price = await localizePrice({
        amount: course.price ? Number(course.price) : null,
        baseCurrency: course.baseCurrency,
        countryCode: requestCountry.countryCode,
        source: requestCountry.source,
      });
      return toCardProps(course, price);
    })),
    total,
    page,
    totalPages,
    categories: categories.map((c) => c.name),
  });
}
