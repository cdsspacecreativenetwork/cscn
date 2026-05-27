'use client';

import { useState } from 'react';
import { CourseHeader } from './CourseHeader';
import { VideoPlayer } from './VideoPlayer';
import { TranscriptSidebar } from './TranscriptSidebar';
import { CourseTabs } from './CourseTabs';
import { CourseContentSidebar } from './CourseContentSidebar';
import { CourseRatingPanel } from './CourseRatingPanel';
import { ArticleContent } from './ArticleContent';
import { LessonNotesPanel } from './LessonNotesPanel';
import { QuizPlayer } from './QuizPlayer';
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
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(lesson.progress?.lastSeekTime ?? 0);
  const [seekRequest, setSeekRequest] = useState<{ id: number; seconds: number } | null>(null);
  const canWriteNotes = canWatch && isEnrolled && !isPreviewMode;
  const isQuizLesson = lesson.contentType === 'QUIZ';

  const handleSeekToNote = (seconds: number) => {
    setCurrentPlaybackTime(seconds);
    setSeekRequest({ id: Date.now(), seconds });
  };

  const notesPanel = (
    <LessonNotesPanel
      lessonId={lesson.id}
      initialNotes={lesson.notes}
      currentTime={currentPlaybackTime}
      canWrite={canWriteNotes}
      onSeek={handleSeekToNote}
    />
  );

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
        allowManualComplete={!isQuizLesson}
      />

      <div className={`grid w-full grid-cols-1 gap-6 lg:items-start ${
        isQuizLesson ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,72%)_minmax(300px,28%)]'
      }`}>
        <div className="flex min-w-0 flex-col gap-5">
          <div className="w-full">
            {lesson.contentType === 'ARTICLE' && canWatch ? (
              <ArticleReader title={lesson.title} body={lesson.bodyContent} />
            ) : lesson.contentType === 'QUIZ' && canWatch ? (
              lesson.quiz ? (
                <QuizPlayer
                  lessonTitle={lesson.title}
                  quiz={lesson.quiz}
                  courseSlug={courseSlug}
                  nextLessonId={nextLessonId}
                  isCompleted={isCurrentLessonCompleted}
                />
              ) : (
                <div className="w-full rounded-[24px] border border-[#E3E8F4] bg-white p-10 text-center text-sm font-semibold text-text-mute">
                  This quiz has not been set up yet.
                </div>
              )
            ) : (
              <VideoPlayer
                lessonId={lesson.id}
                videoUrl={lesson.videoUrl}
                muxPlaybackId={lesson.muxPlaybackId}
                muxToken={lesson.muxToken}
                timestamps={lesson.timestamps}
                initialProgress={lesson.progress}
                seekRequest={seekRequest}
                onPlaybackTimeChange={setCurrentPlaybackTime}
                canWatch={canWatch}
                isAuthenticated={isAuthenticated}
                isEnrolled={isEnrolled}
                courseSlug={courseSlug}
                lessonTitle={lesson.title}
              />
            )}
          </div>

          {!isQuizLesson && (
            <CourseTabs
              description={courseDescription}
              lessonOverview={lesson.overview}
              instructorName={instructorName}
              resources={lesson.resources}
            />
          )}
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

        {!isQuizLesson && (
          <div className="flex w-full min-w-[300px] flex-col gap-4">
            {lesson.contentType === 'VIDEO' && (
              <TranscriptSidebar transcript={lesson.transcript} />
            )}
            {notesPanel}
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
