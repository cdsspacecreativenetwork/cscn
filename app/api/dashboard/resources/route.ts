import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import type { Prisma, ResourceType } from '@prisma/client';

function isResourceType(value: string | null): value is ResourceType {
  return value === 'PDF' || value === 'LINK' || value === 'FILE';
}

function deriveResourceType(mimeType: string | null, filePath: string): ResourceType {
  if (filePath.toLowerCase().endsWith('.pdf') || mimeType?.includes('pdf')) return 'PDF';
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || mimeType === 'url') return 'LINK';
  return 'FILE';
}

function formatBytes(bytes: number | null | undefined): string | undefined {
  if (!bytes || bytes === 0) return undefined;
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
  const role = session.user.role as string | undefined;

  const instructorCoursesRaw = await db.course.findMany({
    where: {
      OR: [
        { instructorId: userId },
        { instructors: { some: { userId } } },
      ],
    },
    select: {
      id: true,
      title: true,
      modules: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          lessons: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: { title: 'asc' },
  });

  const canViewTeachingResources =
    instructorCoursesRaw.length > 0 || role === 'INSTRUCTOR';

  if (scope === 'instructor' && !canViewTeachingResources) {
    return NextResponse.json({ error: 'Teaching resources are not available for this account.' }, { status: 403 });
  }

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

  // 1. Fetch Lesson Resources
  const whereLessonResource: Prisma.LessonResourceWhereInput = {
    ...(query ? { title: { contains: query, mode: 'insensitive' as const } } : {}),
    ...(isResourceType(type) ? { type } : {}),
    ...(courseTitle && courseTitle !== 'General Resources' ? {
      lesson: {
        module: {
          course: {
            ...courseAccess,
            title: courseTitle,
          },
        },
      },
    } : {
      lesson: {
        module: {
          course: courseAccess,
        },
      },
    }),
  };

  const lessonRows = courseTitle === 'General Resources' ? [] : await db.lessonResource.findMany({
    where: whereLessonResource,
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

  // 2. Fetch Marketplace Resources (Standalone or Course-linked)
  const whereMarketplaceResource: Prisma.MarketplaceResourceWhereInput = scope === 'instructor'
    ? {
        ownerId: userId,
        ...(query ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' as const } },
            { description: { contains: query, mode: 'insensitive' as const } },
          ],
        } : {}),
        ...(courseTitle === 'General Resources'
          ? { courseId: null }
          : courseTitle && courseTitle !== 'All Courses'
          ? { course: { title: courseTitle } }
          : {}),
      }
    : {
        status: 'PUBLISHED',
        ...(query ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' as const } },
            { description: { contains: query, mode: 'insensitive' as const } },
          ],
        } : {}),
        ...(courseTitle === 'General Resources'
          ? { courseId: null }
          : courseTitle && courseTitle !== 'All Courses'
          ? { course: { title: courseTitle } }
          : {}),
      };

  const marketplaceRows = await db.marketplaceResource.findMany({
    where: whereMarketplaceResource,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      title: true,
      description: true,
      filePath: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      thumbnailUrl: true,
      category: true,
      isFree: true,
      price: true,
      currency: true,
      courseId: true,
      moduleId: true,
      lessonId: true,
      course: { select: { title: true } },
      lesson: { select: { title: true } },
      slug: true,
    },
  });

  const formattedLessonResources = scope === 'instructor'
    ? Array.from(
        lessonRows.reduce((map, row) => {
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
            type: row.type as ResourceType,
            category: row.lesson.module.course.category?.name ?? row.lesson.module.title,
            courseTitle: row.lesson.module.course.title,
            lessonTitle: row.lesson.title,
            scope,
            usageCount: 1,
            isStandalone: false,
            isFree: true,
          });
          return map;
        }, new Map<string, any>())
      ).map(([, resource]) => resource)
    : lessonRows.map((row) => ({
        id: row.id,
        title: row.title,
        url: row.url,
        type: row.type as ResourceType,
        category: row.lesson.module.course.category?.name ?? row.lesson.module.title,
        courseTitle: row.lesson.module.course.title,
        lessonTitle: row.lesson.title,
        scope,
        isStandalone: false,
        isFree: true,
      }));

  const formattedMarketplaceResources = marketplaceRows.map((row) => {
    const derivedType = deriveResourceType(row.mimeType, row.filePath);
    const downloadUrl = row.filePath.startsWith('http')
      ? row.filePath
      : `/api/resources/${row.slug}/download`;

    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      url: downloadUrl,
      type: derivedType,
      size: formatBytes(row.fileSize),
      thumbnail: row.thumbnailUrl || undefined,
      category: row.category || 'General',
      courseTitle: row.course?.title || 'General Resource',
      lessonTitle: row.lesson?.title || (row.courseId ? 'Course Asset' : 'Standalone Download'),
      scope,
      isStandalone: !row.courseId,
      courseId: row.courseId || undefined,
      moduleId: row.moduleId || undefined,
      lessonId: row.lessonId || undefined,
      isFree: row.isFree,
      price: row.price ? Number(row.price) : undefined,
      currency: row.currency || 'NGN',
    };
  });

  const combinedResources = [...formattedMarketplaceResources, ...formattedLessonResources];

  // Filter by ResourceType if specified
  const filteredResources = isResourceType(type)
    ? combinedResources.filter((r) => r.type === type)
    : combinedResources;

  const rawCourses = Array.from(new Set(combinedResources.map((resource) => resource.courseTitle))).sort();
  const courses = ['All Courses', 'General Resources', ...rawCourses.filter((c) => c !== 'General Resource')];

  return NextResponse.json({
    resources: filteredResources,
    courses: Array.from(new Set(courses)),
    canViewTeachingResources,
    instructorCourses: instructorCoursesRaw,
  });
}
