import { listFeaturedCourses } from '@/lib/services/courses.service';
import CommunityClient, { type CommunityCourse } from './CommunityClient';

export default async function CommunityPage() {
  const courses = await listFeaturedCourses(2);

  const communityCourses: CommunityCourse[] = courses.map((course) => {
    const lessons = course.modules.reduce((sum, module) => sum + module._count.lessons, 0);
    const author = course.instructor.name ?? 'CSCN Instructor';

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      meta: `${lessons} lesson${lessons === 1 ? '' : 's'}`,
      author,
      authorAvatar: course.instructor.image ?? '/assets/avatars/avatar1.png',
      image: course.thumbnail ?? '/assets/courses/Frame 2147239560.svg',
    };
  });

  return <CommunityClient courses={communityCourses} />;
}
