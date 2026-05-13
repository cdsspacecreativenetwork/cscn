'use client';

import { CourseHeader } from './CourseHeader';
import { VideoPlayer } from './VideoPlayer';
import { TranscriptSidebar } from './TranscriptSidebar';
import { CourseTabs } from './CourseTabs';
import { CourseContentSidebar } from './CourseContentSidebar';
import type { SidebarModule, PlayerLesson } from '@/types/player';

export interface CoursePlayerViewProps {
  courseSlug: string;
  courseTitle: string;
  courseDescription: string;
  instructorName: string;
  lesson: PlayerLesson;
  modules: SidebarModule[];
  canWatch: boolean;
  isEnrolled: boolean;
  isAuthenticated: boolean;
  nextLessonId: string | null;
  isCurrentLessonCompleted: boolean;
}

export const CoursePlayerView = ({
  courseSlug,
  lesson,
  modules,
  canWatch,
  isEnrolled,
  isAuthenticated,
  nextLessonId,
  isCurrentLessonCompleted,
  courseDescription,
  instructorName,
}: CoursePlayerViewProps) => {
  return (
    <div className="p-6 lg:p-10 flex flex-col gap-8 max-w-[1728px] mx-auto w-full overflow-x-hidden font-jakarta">
      <CourseHeader
        title={lesson.title}
        lessonId={lesson.id}
        courseSlug={courseSlug}
        nextLessonId={nextLessonId}
        isEnrolled={isEnrolled}
        isCompleted={isCurrentLessonCompleted}
      />

      <div className="flex flex-col lg:flex-row gap-6 lg:items-start w-full">
        <div className="w-full lg:w-[72%] shrink-0">
          <VideoPlayer
            videoUrl={lesson.videoUrl}
            canWatch={canWatch}
            isAuthenticated={isAuthenticated}
            isEnrolled={isEnrolled}
            courseSlug={courseSlug}
            lessonTitle={lesson.title}
          />
        </div>
        <div className="w-full lg:w-[28%] min-w-[300px]">
          <TranscriptSidebar transcript={lesson.transcript} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:items-start w-full">
        <div className="w-full lg:w-[72%] shrink-0">
          <CourseTabs
            description={courseDescription}
            instructorName={instructorName}
            resources={lesson.resources}
          />
        </div>
        <div className="w-full lg:w-[28%] min-w-[300px]">
          <CourseContentSidebar
            modules={modules}
            courseSlug={courseSlug}
            currentLessonId={lesson.id}
          />
        </div>
      </div>
    </div>
  );
};
