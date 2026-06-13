'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  previewModeLabel?: string | null;
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
  isPreviewMode,
  previewModeLabel,
  isCourseCompleted,
  ratingSummary,
  userRating,
}: CoursePlayerViewProps) => {
  const router = useRouter();
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(lesson.progress?.lastSeekTime ?? 0);
  const [seekRequest, setSeekRequest] = useState<{ id: number; seconds: number } | null>(null);
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [activeMobilePanel, setActiveMobilePanel] = useState<'overview' | 'content' | 'notes' | 'transcript' | 'resources'>('overview');
  const canWriteNotes = canWatch && isEnrolled && !isPreviewMode;
  const isQuizLesson = lesson.contentType === 'QUIZ';
  const nextLesson = useMemo(
    () => modules.flatMap((module) => module.lessons).find((item) => item.id === nextLessonId) ?? null,
    [modules, nextLessonId]
  );

  useEffect(() => {
    const stored = window.localStorage.getItem('cscn.player.autoplayNext');
    if (stored !== null) setAutoplayNext(stored === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('cscn.player.autoplayNext', String(autoplayNext));
  }, [autoplayNext]);

  useEffect(() => {
    if (!showNextPrompt || !autoplayNext || !nextLessonId) return;
    if (countdown <= 0) {
      router.push(`/courses/${courseSlug}/watch/${nextLessonId}`);
      return;
    }
    const timeout = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [autoplayNext, countdown, courseSlug, nextLessonId, router, showNextPrompt]);

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

  const resourcesPanel = (
    lesson.resources.length === 0 ? (
      <div className="rounded-[12px] bg-[#F4F6FB] px-4 py-8 text-center">
        <p className="text-sm font-bold text-[#040B37]">No resources yet</p>
        <p className="mt-1 text-xs font-medium text-text-mute">Any files or links for this lesson will appear here.</p>
      </div>
    ) : (
      <div className="grid gap-3">
        {lesson.resources.map((resource) => (
          <a
            key={resource.id}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[12px] border border-[#E3E8F4] bg-white p-4 transition hover:border-[#1C4ED1]/35 hover:bg-[#F8FAFF]"
          >
            <p className="text-sm font-black text-[#040B37]">{resource.title}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-text-mute">{resource.type}</p>
          </a>
        ))}
      </div>
    )
  );

  const mobilePanels: Array<{ id: typeof activeMobilePanel; label: string; show: boolean; content: ReactNode }> = [
    {
      id: 'overview',
      label: 'Overview',
      show: true,
      content: (
        <div className="rounded-[14px] border border-[#E3E8F4] bg-white p-5">
          <h3 className="text-base font-black text-[#040B37]">Lesson Overview</h3>
          {lesson.overview ? (
            <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-text-body">{lesson.overview}</p>
          ) : (
            <p className="mt-3 text-sm font-medium leading-7 text-text-mute">This lesson does not have an overview yet.</p>
          )}
        </div>
      ),
    },
    {
      id: 'content',
      label: 'Content',
      show: true,
      content: (
        <CourseContentSidebar
          modules={modules}
          courseSlug={courseSlug}
          currentLessonId={lesson.id}
        />
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      show: true,
      content: (
        <LessonNotesPanel
          lessonId={lesson.id}
          initialNotes={lesson.notes}
          currentTime={currentPlaybackTime}
          canWrite={canWriteNotes}
          onSeek={handleSeekToNote}
        />
      ),
    },
    {
      id: 'transcript',
      label: 'Transcript',
      show: lesson.contentType === 'VIDEO',
      content: <TranscriptSidebar transcript={lesson.transcript} />,
    },
    {
      id: 'resources',
      label: 'Resources',
      show: true,
      content: resourcesPanel,
    },
  ];

  const openNextLessonPrompt = () => {
    if (!nextLessonId || !nextLesson) return;
    setCountdown(autoplayNext ? 5 : 0);
    setShowNextPrompt(true);
  };

  return (
    <div className="p-3 lg:p-10 flex flex-col gap-8 max-w-[1728px] mx-auto w-full overflow-x-hidden font-jakarta">
      {isPreviewMode && (
        <div className="flex w-fit max-w-full items-center gap-2 rounded-full border border-[#1C4ED1]/20 bg-[#1C4ED1]/5 px-3 py-2 text-[#1C4ED1]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#1C4ED1]" />
          <p className="truncate text-[12px] font-black uppercase tracking-[0.1em]">
            Preview mode
          </p>
          {previewModeLabel && (
            <span className="shrink-0 rounded-full bg-[#1C4ED1]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em]">
              {previewModeLabel}
            </span>
          )}
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
        isPreviewMode={isPreviewMode}
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
                onEnded={openNextLessonPrompt}
              />
            )}
          </div>

          {showNextPrompt && nextLesson && nextLessonId && (
            <div className="rounded-[12px] border border-[#101828] bg-[#151515] p-5 text-white shadow-[0_18px_60px_rgba(4,11,55,0.22)]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="mt-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15">
                    <span className="ml-1 text-[26px] leading-none">▷</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-white/90">
                      Next lesson will start {autoplayNext ? `in ${countdown} second${countdown === 1 ? '' : 's'}` : 'when you are ready'}
                    </p>
                    <h3 className="mt-2 text-[20px] font-black leading-tight text-white">{nextLesson.title}</h3>
                    <p className="mt-1 text-[14px] font-semibold text-white/75">
                      {nextLesson.contentType === 'ARTICLE' ? 'Reading' : nextLesson.contentType === 'QUIZ' ? 'Quiz' : 'Video'}
                      {nextLesson.duration !== '—' ? ` • ${nextLesson.duration}` : ''}
                    </p>
                  </div>
                </div>
                <label className="flex shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[12px] font-bold text-white/85">
                  <input
                    type="checkbox"
                    checked={autoplayNext}
                    onChange={(event) => {
                      setAutoplayNext(event.target.checked);
                      setCountdown(event.target.checked ? 5 : 0);
                    }}
                    className="h-4 w-4 accent-[#1C4ED1]"
                  />
                  Autoplay next
                </label>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowNextPrompt(false)}
                  className="rounded-[10px] bg-white px-5 py-3 text-[14px] font-bold text-[#151515] transition hover:bg-white/90"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/courses/${courseSlug}/watch/${nextLessonId}`)}
                  className="rounded-[10px] bg-white px-5 py-3 text-[14px] font-bold text-[#151515] transition hover:bg-white/90"
                >
                  Start Now
                </button>
              </div>
            </div>
          )}

          {!isQuizLesson && (
            <>
              <div className="lg:hidden">
                <div className="rounded-[18px] border border-[#E3E8F4] bg-white p-3 shadow-sm">
                  <div className="custom-scrollbar flex gap-2 overflow-x-auto rounded-[12px] bg-[#E3E8F4] p-1">
                    {mobilePanels.filter((panel) => panel.show).map((panel) => (
                      <button
                        key={panel.id}
                        type="button"
                        onClick={() => setActiveMobilePanel(panel.id)}
                        className={`shrink-0 rounded-[10px] px-4 py-2 text-sm font-bold transition ${
                          activeMobilePanel === panel.id
                            ? 'bg-white text-[#1C4ED1] shadow-[0px_2px_8px_rgba(4,11,55,0.08)]'
                            : 'text-text-mute hover:text-[#040B37]'
                        }`}
                      >
                        {panel.label}
                      </button>
                    ))}
                  </div>
                  <div className="custom-scrollbar mt-3 max-h-[62vh] overflow-y-auto">
                    {mobilePanels.find((panel) => panel.id === activeMobilePanel)?.content}
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <CourseTabs
                  lessonOverview={lesson.overview}
                  resources={lesson.resources}
                />
              </div>
            </>
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
          <div className="hidden w-full min-w-[300px] flex-col gap-4 lg:flex">
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
