import type { QuizQuestionType } from "@prisma/client";

type QuizOptionDraft = {
  id?: string;
  text?: string | null;
  isCorrect?: boolean | null;
};

type QuizQuestionDraft = {
  id?: string;
  type: QuizQuestionType;
  prompt?: string | null;
  points?: number | null;
  options?: QuizOptionDraft[];
};

type QuizDraft = {
  mode?: "PRACTICE" | "GRADED" | null;
  passingScore?: number | null;
  questions?: QuizQuestionDraft[];
};

export type QuizReadinessItem = {
  id:
    | "questions"
    | "graded_passing_score"
    | "prompt"
    | "options"
    | "correct_answer"
    | "points";
  label: string;
  complete: boolean;
};

export type QuizReadiness = {
  ready: boolean;
  items: QuizReadinessItem[];
  missingLabels: string[];
};

function hasText(value?: string | null) {
  return !!value?.trim();
}

function hasValidPassingScore(score?: number | null) {
  return typeof score === "number" && Number.isFinite(score) && score >= 1 && score <= 100;
}

function questionHasEnoughOptions(question: QuizQuestionDraft) {
  const validOptions = question.options?.filter((option) => hasText(option.text)) ?? [];
  if (question.type === "TRUE_FALSE") return validOptions.length === 2;
  return validOptions.length >= 2;
}

function questionHasCorrectAnswer(question: QuizQuestionDraft) {
  const correctOptions = question.options?.filter((option) => option.isCorrect && hasText(option.text)) ?? [];
  if (question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE") return correctOptions.length === 1;
  return correctOptions.length >= 1;
}

export function getQuizReadiness(quiz: QuizDraft): QuizReadiness {
  const questions = quiz.questions ?? [];
  const items: QuizReadinessItem[] = [
    {
      id: "questions",
      label: "At least one question",
      complete: questions.length > 0,
    },
    ...(quiz.mode === "GRADED"
      ? [{
          id: "graded_passing_score" as const,
          label: "Graded quizzes need a passing score between 1 and 100",
          complete: hasValidPassingScore(quiz.passingScore),
        }]
      : []),
    {
      id: "prompt",
      label: "Every question has prompt text",
      complete: questions.length > 0 && questions.every((question) => hasText(question.prompt)),
    },
    {
      id: "options",
      label: "Every question has enough answer options",
      complete: questions.length > 0 && questions.every(questionHasEnoughOptions),
    },
    {
      id: "correct_answer",
      label: "Every question has a valid correct answer",
      complete: questions.length > 0 && questions.every(questionHasCorrectAnswer),
    },
    {
      id: "points",
      label: "Every question has positive points",
      complete:
        questions.length > 0 &&
        questions.every((question) => typeof question.points === "number" && question.points > 0),
    },
  ];

  const missingLabels = items.filter((item) => !item.complete).map((item) => item.label);
  return {
    ready: missingLabels.length === 0,
    items,
    missingLabels,
  };
}

export function assertQuizReadyForPublish(quiz: QuizDraft) {
  const readiness = getQuizReadiness(quiz);
  if (readiness.ready) return readiness;
  throw new Error(`Complete the quiz before publishing: ${readiness.missingLabels.join(", ")}.`);
}
