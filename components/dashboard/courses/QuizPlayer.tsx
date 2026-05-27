"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import type { PlayerQuiz } from "@/types/player";

type QuizPlayerProps = {
  lessonTitle: string;
  quiz: PlayerQuiz;
  courseSlug: string;
  nextLessonId: string | null;
  isCompleted: boolean;
};

type FeedbackItem = {
  questionId: string;
  isCorrect: boolean;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  explanation: string | null;
};

type ResultState = {
  attemptNumber: number;
  percentage: number;
  passed: boolean;
  attemptsRemaining: number | null;
  lessonCompleted: boolean;
  feedback: FeedbackItem[];
};

export function QuizPlayer({ lessonTitle, quiz, courseSlug, nextLessonId, isCompleted }: QuizPlayerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ResultState | null>(null);

  const questions = useMemo(() => {
    if (!quiz.shuffleQuestions) return quiz.questions;
    return [...quiz.questions].sort((a, b) => a.id.localeCompare(b.id));
  }, [quiz.questions, quiz.shuffleQuestions]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((question) => (answers[question.id] ?? []).length > 0).length;
  const isPractice = quiz.mode === "PRACTICE";
  const noAttemptsLeft = quiz.attemptsRemaining !== null && quiz.attemptsRemaining <= 0 && !result;

  const toggleOption = (questionId: string, optionId: string, multiple: boolean) => {
    setAnswers((current) => {
      const existing = current[questionId] ?? [];
      if (!multiple) return { ...current, [questionId]: [optionId] };
      const next = existing.includes(optionId)
        ? existing.filter((id) => id !== optionId)
        : [...existing, optionId];
      return { ...current, [questionId]: next };
    });
  };

  const submitQuiz = () => {
    startTransition(async () => {
      const response = await fetch(`/api/quizzes/${quiz.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: questions.map((question) => ({
            questionId: question.id,
            selectedOptionIds: answers[question.id] ?? [],
          })),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? "Failed to submit quiz.");
        return;
      }

      setResult({
        ...payload.attempt,
        feedback: payload.feedback ?? [],
      });
      router.refresh();
    });
  };

  const resetForRetry = () => {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setStarted(true);
  };

  if (noAttemptsLeft) {
    return (
      <div className="min-h-[620px] rounded-[24px] border border-[#E3E8F4] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-24">
          <AlertCircle size={42} className="text-amber-500" />
          <h2 className="text-[28px] font-bold text-[#040B37]">No attempts remaining</h2>
          <p className="text-[15px] font-medium leading-7 text-[#667085]">
            You have used all allowed attempts for this graded quiz. Please contact your instructor if you need another try.
          </p>
        </div>
      </div>
    );
  }

  if (!started && !result) {
    return (
      <div className="min-h-[620px] rounded-[24px] border border-[#E3E8F4] bg-white p-8 shadow-sm">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 py-20 text-center">
          <span className="rounded-full bg-primary/10 px-4 py-2 text-[12px] font-black uppercase tracking-[0.18em] text-primary">
            {isPractice ? "Practice Check" : "Graded Quiz"}
          </span>
          <div>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-tight tracking-[-0.05em] text-[#040B37]">
              {lessonTitle}
            </h2>
            <p className="mt-4 text-[15px] font-medium leading-7 text-[#667085]">
              {quiz.instructions || "Answer the questions below to check your understanding."}
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] bg-[#F8FAFF] p-4">
              <p className="text-[12px] font-bold uppercase text-[#9CA3AF]">Questions</p>
              <p className="mt-1 text-[24px] font-black text-[#040B37]">{questions.length}</p>
            </div>
            <div className="rounded-[16px] bg-[#F8FAFF] p-4">
              <p className="text-[12px] font-bold uppercase text-[#9CA3AF]">Mode</p>
              <p className="mt-1 text-[18px] font-black text-[#040B37]">{isPractice ? "Practice" : "Graded"}</p>
            </div>
            <div className="rounded-[16px] bg-[#F8FAFF] p-4">
              <p className="text-[12px] font-bold uppercase text-[#9CA3AF]">Attempts</p>
              <p className="mt-1 text-[18px] font-black text-[#040B37]">
                {quiz.maxAttempts ? `${quiz.attemptsRemaining}/${quiz.maxAttempts}` : "Unlimited"}
              </p>
            </div>
          </div>

          {!isPractice && quiz.passingScore && (
            <p className="rounded-full bg-amber-50 px-4 py-2 text-[13px] font-bold text-amber-700">
              Passing score: {quiz.passingScore}%
            </p>
          )}

          <Button type="button" variant="primary" rounded="[10px]" size="lg" onClick={() => setStarted(true)}>
            Start quiz
          </Button>
        </div>
      </div>
    );
  }

  if (result) {
    const passedLike = result.passed || isPractice;
    return (
      <div className="min-h-[620px] rounded-[24px] border border-[#E3E8F4] bg-white p-6 shadow-sm lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className={`rounded-[24px] p-6 text-center ${passedLike ? "bg-emerald-50" : "bg-red-50"}`}>
            {passedLike ? (
              <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
            ) : (
              <XCircle size={44} className="mx-auto text-red-600" />
            )}
            <h2 className="mt-4 text-[30px] font-black tracking-[-0.04em] text-[#040B37]">
              {isPractice ? "Nice work. Review the feedback below." : result.passed ? "You passed the quiz." : "Not quite yet."}
            </h2>
            <p className="mt-2 text-[15px] font-semibold text-[#667085]">
              Score: {result.percentage}%
            </p>
          </div>

          {result.feedback.length > 0 && (
            <div className="mt-6 space-y-4">
              {questions.map((question, index) => {
                const feedback = result.feedback.find((item) => item.questionId === question.id);
                const correctIds = feedback?.correctOptionIds ?? [];
                const selectedIds = feedback?.selectedOptionIds ?? [];
                return (
                  <div key={question.id} className="rounded-[18px] border border-[#E3E8F4] p-5">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        feedback?.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {feedback?.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-[#040B37]">Question {index + 1}</p>
                        <p className="mt-1 text-[16px] font-bold leading-6 text-[#040B37]">{question.prompt}</p>
                        <div className="mt-4 space-y-2">
                          {question.options.map((option) => {
                            const isCorrect = correctIds.includes(option.id);
                            const isSelected = selectedIds.includes(option.id);
                            return (
                              <div
                                key={option.id}
                                className={`rounded-[12px] border px-4 py-3 text-sm font-semibold ${
                                  isCorrect
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : isSelected
                                      ? "border-red-200 bg-red-50 text-red-800"
                                      : "border-[#E3E8F4] bg-[#F8FAFF] text-[#667085]"
                                }`}
                              >
                                {option.text}
                                {isCorrect && <span className="ml-2 text-xs uppercase">Correct</span>}
                                {isSelected && !isCorrect && <span className="ml-2 text-xs uppercase">Your answer</span>}
                              </div>
                            );
                          })}
                        </div>
                        {feedback?.explanation && (
                          <p className="mt-4 rounded-[12px] bg-[#F8FAFF] px-4 py-3 text-sm font-medium leading-6 text-[#667085]">
                            {feedback.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {!result.passed && result.attemptsRemaining !== 0 && !isPractice && (
              <Button type="button" variant="outline" rounded="[10px]" leftIcon={<RotateCcw size={16} />} onClick={resetForRetry}>
                Retry quiz
              </Button>
            )}
            {nextLessonId ? (
              <Button type="button" variant="primary" rounded="[10px]" onClick={() => router.push(`/courses/${courseSlug}/watch/${nextLessonId}`)}>
                Continue to next lesson
              </Button>
            ) : (
              <Button type="button" variant="primary" rounded="[10px]" onClick={() => router.refresh()}>
                Finish course
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const selectedIds = answers[currentQuestion.id] ?? [];
  const multiple = currentQuestion.type === "MULTIPLE_SELECT";

  return (
    <div className="min-h-[620px] rounded-[24px] border border-[#E3E8F4] bg-white p-6 shadow-sm lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-primary">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#9CA3AF]">{answeredCount}/{questions.length} answered</p>
          </div>
          {isCompleted && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              Lesson completed
            </span>
          )}
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#EEF3FF]">
          <div className="h-full rounded-full bg-primary" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="mt-8">
          <h2 className="text-[28px] font-black leading-tight tracking-[-0.04em] text-[#040B37]">
            {currentQuestion.prompt}
          </h2>
          <p className="mt-3 text-sm font-semibold text-[#667085]">
            {multiple ? "Select all answers that apply." : "Select one answer."}
          </p>

          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option) => {
              const selected = selectedIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(currentQuestion.id, option.id, multiple)}
                  className={`flex w-full items-center gap-3 rounded-[16px] border px-5 py-4 text-left transition ${
                    selected
                      ? "border-primary bg-primary/5 text-[#040B37]"
                      : "border-[#E3E8F4] bg-white text-[#667085] hover:border-primary/30 hover:bg-[#F8FAFF]"
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-primary bg-primary text-white" : "border-[#C8D1E0]"
                  }`}>
                    {selected && <CheckCircle2 size={13} />}
                  </span>
                  <span className="text-[15px] font-bold">{option.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            rounded="[10px]"
            disabled={currentIndex === 0}
            leftIcon={<ChevronLeft size={16} />}
            onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
          >
            Previous
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button
              type="button"
              variant="primary"
              rounded="[10px]"
              rightIcon={<ChevronRight size={16} />}
              onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
            >
              Next question
            </Button>
          ) : (
            <Button type="button" variant="primary" rounded="[10px]" loading={pending} disabled={pending} onClick={submitQuiz}>
              Submit quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
