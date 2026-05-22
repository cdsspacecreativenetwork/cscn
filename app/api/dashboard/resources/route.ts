import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import type { Prisma, ResourceType } from '@prisma/client';

function isResourceType(value: string | null): value is ResourceType {
  return value === 'PDF' || value === 'LINK' || value === 'FILE';
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') === 'instructor' ? 'instructor' : 'student';
  const query = searchParams.get('q')?.trim();
  const type = searchParams.get('type');
  const courseTitle = searchParams.get('course')?.trim();

  const courseAccess: Prisma.CourseWhereInput =
    scope === 'instructor'
      ? {
          OR: [
            { instructorId: userId },
            { instructors: { some: { userId } } },
          ],
        }
      : {
          enrollments: {
            some: {
              userId,
              status: { not: 'CANCELLED' as const },
            },
          },
        };

  const where: Prisma.LessonResourceWhereInput = {
    ...(query ? { title: { contains: query, mode: 'insensitive' as const } } : {}),
    ...(isResourceType(type) ? { type } : {}),
    lesson: {
      module: {
        course: {
          ...courseAccess,
          ...(courseTitle ? { title: courseTitle } : {}),
        },
      },
    },
  };

  const rows = await db.lessonResource.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      title: true,
      url: true,
      type: true,
      lesson: {
        select: {
          title: true,
          module: {
            select: {
              title: true,
              course: {
                select: {
                  title: true,
                  category: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const resources = scope === 'instructor'
    ? Array.from(
        rows.reduce((map, row) => {
          const key = `${row.type}::${row.url}::${row.title}`;
          const existing = map.get(key);
          if (existing) {
            existing.usageCount += 1;
            existing.lessonTitle = 'Multiple lessons';
            return map;
          }

          map.set(key, {
            id: row.id,
            title: row.title,
            url: row.url,
            type: row.type,
            category: row.lesson.module.course.category?.name ?? row.lesson.module.title,
            courseTitle: row.lesson.module.course.title,
            lessonTitle: row.lesson.title,
            scope,
            usageCount: 1,
          });
          return map;
        }, new Map<string, {
          id: string;
          title: string;
          url: string;
          type: ResourceType;
          category: string;
          courseTitle: string;
          lessonTitle: string;
          scope: typeof scope;
          usageCount: number;
        }>())
      ).map(([, resource]) => resource)
    : rows.map((row) => ({
        id: row.id,
        title: row.title,
        url: row.url,
        type: row.type,
        category: row.lesson.module.course.category?.name ?? row.lesson.module.title,
        courseTitle: row.lesson.module.course.title,
        lessonTitle: row.lesson.title,
        scope,
      }));

  const courses = Array.from(new Set(resources.map((resource) => resource.courseTitle))).sort();

  return NextResponse.json({ resources, courses });
}
