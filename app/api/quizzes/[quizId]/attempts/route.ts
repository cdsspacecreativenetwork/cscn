import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { completeLessonForUser } from "@/lib/services/courses.service";

function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((item) => set.has(item));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quizId } = await params;
  const body = await request.json().catch(() => null);
  const answers = Array.isArray(body?.answers) ? body.answers : [];

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      lesson: {
        select: {
          id: true,
          isPublished: true,
          module: {
            select: {
              isPublished: true,
              courseId: true,
            },
          },
        },
      },
      questions: {
        orderBy: { position: "asc" },
        include: {
          options: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  if (!quiz.lesson.isPublished || !quiz.lesson.module.isPublished) {
    return NextResponse.json({ error: "Quiz is not available yet" }, { status: 400 });
  }

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: quiz.lesson.module.courseId,
      },
    },
  });

  if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });

  const submittedAttempts = await db.quizAttempt.count({
    where: {
      quizId,
      userId: session.user.id,
      status: "SUBMITTED",
    },
  });

  if (quiz.maxAttempts && submittedAttempts >= quiz.maxAttempts) {
    return NextResponse.json({ error: "No attempts remaining" }, { status: 400 });
  }

  const answerMap = new Map<string, string[]>();
  answers.forEach((answer: unknown) => {
    if (!answer || typeof answer !== "object") return;
    const record = answer as Record<string, unknown>;
    const questionId = typeof record.questionId === "string" ? record.questionId : "";
    const selectedOptionIds = Array.isArray(record.selectedOptionIds)
      ? record.selectedOptionIds.filter((id): id is string => typeof id === "string")
      : [];
    if (questionId) answerMap.set(questionId, selectedOptionIds);
  });

  const attemptNumber = submittedAttempts + 1;
  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      userId: session.user.id,
      attemptNumber,
      status: "IN_PROGRESS",
      maxScore: quiz.questions.length,
    },
    select: { id: true },
  });

  let score = 0;
  const feedback = [];

  for (const question of quiz.questions) {
    const selectedOptionIds = answerMap.get(question.id) ?? [];
    const correctOptionIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id);
    const isCorrect = sameSet(selectedOptionIds, correctOptionIds);
    const pointsAwarded = isCorrect ? 1 : 0;
    score += pointsAwarded;

    await db.quizAnswer.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        selectedOptionIds,
        isCorrect,
        pointsAwarded,
        questionPromptSnapshot: question.prompt,
        optionSnapshots: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
          position: option.position,
        })),
      },
    });

    feedback.push({
      questionId: question.id,
      isCorrect,
      selectedOptionIds,
      correctOptionIds,
      explanation: question.explanation,
    });
  }

  const maxScore = Math.max(quiz.questions.length, 1);
  const percentage = Math.round((score / maxScore) * 100);
  const passed = quiz.mode === "PRACTICE" || percentage >= (quiz.passingScore ?? 0);

  await db.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "SUBMITTED",
      score,
      maxScore,
      percentage,
      passed,
      submittedAt: new Date(),
    },
  });

  const shouldCompleteLesson =
    quiz.mode === "PRACTICE" ||
    passed ||
    (quiz.mode === "GRADED" && !quiz.gateUntilPassed);

  if (shouldCompleteLesson) {
    await completeLessonForUser(session.user.id, quiz.lesson.id);
  }

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      attemptNumber,
      score,
      maxScore,
      percentage,
      passed,
      attemptsRemaining: quiz.maxAttempts ? Math.max(0, quiz.maxAttempts - attemptNumber) : null,
      lessonCompleted: shouldCompleteLesson,
    },
    feedback: quiz.showAnswers ? feedback : [],
  });
}
