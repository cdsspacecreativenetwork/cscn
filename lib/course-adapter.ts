import type { CourseCardProps } from "@/components/ui/CourseCard";

type DbPublicCourse = {
  id: string;
  slug: string;
  title: string;
  shortDesc: string | null;
  thumbnail: string | null;
  promoVideo?: string | null;
  difficulty: string;
  courseType?: string;
  previewCount: number;
  price: unknown;
  baseCurrency: string;
  category: { name: string; slug: string } | null;
  instructor: {
    id: string;
    name: string | null;
    image: string | null;
    headline: string | null;
  };
  _count: { enrollments: number };
  modules: { _count: { lessons: number } }[];
  ratingAverage?: number;
  ratingCount?: number;
};

export function formatCourseType(type?: string | null) {
  if (type === "SHORT_COURSE") return "Short Course";
  if (type === "PROFESSIONAL_CERTIFICATE") return "Professional Certificate";
  return "Full Course";
}

export function formatDifficulty(difficulty?: string | null) {
  if (difficulty === "ALL_LEVELS") return "All Levels";
  if (!difficulty) return "Beginner";
  return difficulty
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function toCardProps(
  course: DbPublicCourse,
  priceLabels?: { baseLabel: string; approximateLabel: string | null }
): CourseCardProps {
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m._count.lessons,
    0
  );

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    category: course.category?.name ?? "General",
    description: course.shortDesc ?? course.title,
    lessons: `${totalLessons}`,
    duration: "",
    author: course.instructor.name ?? "CSCN Instructor",
    authorAvatar: course.instructor.image ?? "/assets/default-avatar.svg",
    image: course.thumbnail ?? "/assets/default-course.jpg",
    trailerUrl: course.promoVideo ?? undefined,
    students: course._count.enrollments.toLocaleString(),
    rating: course.ratingAverage && course.ratingAverage > 0 ? course.ratingAverage : 0,
    reviews: course.ratingCount ?? 0,
    level: formatDifficulty(course.difficulty),
    courseType: formatCourseType(course.courseType),
    priceLabel: priceLabels?.baseLabel,
    localizedPriceLabel: priceLabels?.approximateLabel ?? undefined,
  };
}
