'use client';

import { CourseHeader } from './CourseHeader';
import { VideoPlayer } from './VideoPlayer';
import { TranscriptSidebar } from './TranscriptSidebar';
import { CourseTabs } from './CourseTabs';
import { CourseContentSidebar } from './CourseContentSidebar';
import { CourseRatingPanel } from './CourseRatingPanel';
import { ArticleContent } from './ArticleContent';
import type { SidebarModule, PlayerLesson } from '@/types/player';

function ArticleReader({ title, body }: { title: string; body: string | null }) {
  return (
    <div className="w-full min-h-[620px] bg-white rounded-[8px] border border-[#E3E8F4] shadow-sm overflow-y-auto p-6 lg:p-10 font-jakarta">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        <div className="inline-flex items-center w-fit px-3 py-1 rounded-[8px] bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          Article Lesson
        </div>
        <h2 className="text-2xl font-bold text-[#040B37] leading-tight">{title}</h2>
        <ArticleContent body={body} />
      </div>
    </div>
  );
}

function QuizReader({ title }: { title: string }) {
  return (
    <div className="w-full min-h-[472px] bg-white rounded-[8px] border border-[#E3E8F4] shadow-sm p-6 lg:p-10 font-jakarta">
      <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center gap-4 py-24">
        <div className="inline-flex items-center w-fit px-3 py-1 rounded-[8px] bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          Quiz Lesson
        </div>
        <h2 className="text-2xl font-bold text-[#040B37] leading-tight">{title}</h2>
        <p className="text-sm font-medium text-text-mute leading-6">
          Quiz rendering will use a dedicated assessment layout with questions, attempts, scoring, and explanations. This placeholder prevents quiz lessons from inheriting the video/transcript layout.
        </p>
      </div>
    </div>
  );
}

export interface CoursePlayerViewProps {
  courseId: string;
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
  isPreviewMode?: boolean;
  isCourseCompleted: boolean;
  ratingSummary: { average: number; count: number };
  userRating: { rating: number; comment: string | null } | null;
}

export const CoursePlayerView = ({
  courseSlug,
  courseId,
  lesson,
  modules,
  canWatch,
  isEnrolled,
  isAuthenticated,
  nextLessonId,
  isCurrentLessonCompleted,
  courseDescription,
  instructorName,
  isPreviewMode,
  isCourseCompleted,
  ratingSummary,
  userRating,
}: CoursePlayerViewProps) => {
  return (
    <div className="p-6 lg:p-10 flex flex-col gap-8 max-w-[1728px] mx-auto w-full overflow-x-hidden font-jakarta">
      {isPreviewMode && (
        <div className="w-full bg-[#1C4ED1]/5 border border-[#1C4ED1]/20 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1C4ED1] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1C4ED1]"></span>
            </span>
            <p className="text-[14px] font-semibold text-[#1C4ED1] font-jakarta">
              👁️ Creator Preview Mode — You are viewing this lesson with Admin/Instructor permissions.
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#1C4ED1] bg-[#1C4ED1]/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-jakarta">
            Authorized
          </span>
        </div>
      )}

      <CourseHeader
        title={lesson.title}
        lessonId={lesson.id}
        courseSlug={courseSlug}
        nextLessonId={nextLessonId}
        isEnrolled={isEnrolled}
        isCompleted={isCurrentLessonCompleted}
      />

      <div className="flex flex-col lg:flex-row gap-6 lg:items-start w-full">
        <div className={`w-full ${lesson.contentType === 'VIDEO' ? 'lg:w-[72%]' : 'lg:w-[72%]'} shrink-0`}>
          {lesson.contentType === 'ARTICLE' && canWatch ? (
            <ArticleReader title={lesson.title} body={lesson.bodyContent} />
          ) : lesson.contentType === 'QUIZ' && canWatch ? (
            <QuizReader title={lesson.title} />
          ) : (
            <VideoPlayer
              lessonId={lesson.id}
              videoUrl={lesson.videoUrl}
              muxPlaybackId={lesson.muxPlaybackId}
              muxToken={lesson.muxToken}
              initialProgress={lesson.progress}
              canWatch={canWatch}
              isAuthenticated={isAuthenticated}
              isEnrolled={isEnrolled}
              courseSlug={courseSlug}
              lessonTitle={lesson.title}
            />
          )}
        </div>
        {lesson.contentType === 'VIDEO' ? (
          <div className="w-full lg:w-[28%] min-w-[300px]">
            <TranscriptSidebar transcript={lesson.transcript} />
          </div>
        ) : (
          <div className="w-full lg:w-[28%] min-w-[300px]">
            <CourseContentSidebar
              modules={modules}
              courseSlug={courseSlug}
              currentLessonId={lesson.id}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:items-start w-full">
        <div className="w-full lg:w-[72%] shrink-0">
          <CourseTabs
            description={courseDescription}
            instructorName={instructorName}
            resources={lesson.resources}
          />
          {isCourseCompleted && isEnrolled && !isPreviewMode && (
            <div className="mt-6">
              <CourseRatingPanel
                courseId={courseId}
                initialRating={userRating}
                summary={ratingSummary}
              />
            </div>
          )}
        </div>
        {lesson.contentType === 'VIDEO' && (
        <div className="w-full lg:w-[28%] min-w-[300px]">
          <CourseContentSidebar
            modules={modules}
            courseSlug={courseSlug}
            currentLessonId={lesson.id}
          />
        </div>
        )}
      </div>
    </div>
  );
};
