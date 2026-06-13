"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardPaste, Copy, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { updateLessonQuizAction } from "@/actions/instructor";
import Button from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { getQuizReadiness } from "@/lib/quiz-readiness";
import type { QuizMode, QuizQuestionType } from "@prisma/client";

type QuizOption = {
  id?: string;
  text: string;
  isCorrect: boolean;
  position?: number;
};

type QuizQuestion = {
  id?: string;
  type: QuizQuestionType;
  prompt: string;
  explanation: string | null;
  points: number;
  position?: number;
  required: boolean;
  options: QuizOption[];
};

export type LessonQuiz = {
  id: string;
  mode: QuizMode;
  instructions: string | null;
  passingScore: number | null;
  maxAttempts: number | null;
  showAnswers: boolean;
  gateUntilPassed: boolean;
  shuffleQuestions: boolean;
  timeLimitMinutes: number | null;
  questions: QuizQuestion[];
} | null;

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

type ParsedQuizQuestion = {
  id: string;
  question: QuizQuestion;
  issues: string[];
};

type QuizLessonBuilderProps = {
  lessonId: string;
  courseId: string;
  quiz: LessonQuiz;
  disabled?: boolean;
  onSaved?: (quiz: NonNullable<LessonQuiz>) => void;
};

const inputCls =
  "w-full rounded-[10px] border border-stroke bg-white px-3 py-2.5 text-sm font-medium text-navy placeholder:text-text-mute transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10";

const questionTypeOptions: { value: QuizQuestionType; label: string }[] = [
  { value: "SINGLE_CHOICE", label: "Single choice" },
  { value: "MULTIPLE_SELECT", label: "Multiple select" },
  { value: "TRUE_FALSE", label: "True / False" },
];

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createOption(text = "", isCorrect = false): QuizOption {
  return { id: createId("temp-option"), text, isCorrect };
}

function trueFalseOptions(): QuizOption[] {
  return [createOption("True", true), createOption("False", false)];
}

function createQuestion(type: QuizQuestionType = "SINGLE_CHOICE"): QuizQuestion {
  return {
    id: createId("temp-question"),
    type,
    prompt: "",
    explanation: "",
    points: 1,
    required: true,
    options: type === "TRUE_FALSE" ? trueFalseOptions() : [createOption("", true), createOption("", false)],
  };
}

function normalizeInitialQuiz(quiz: LessonQuiz): NonNullable<LessonQuiz> {
  return {
    id: quiz?.id ?? createId("temp-quiz"),
    mode: quiz?.mode ?? "PRACTICE",
    instructions: quiz?.instructions ?? "Answer this quick check to confirm you understood the lesson.",
    passingScore: quiz?.passingScore ?? null,
    maxAttempts: quiz?.maxAttempts ?? null,
    showAnswers: quiz?.showAnswers ?? true,
    gateUntilPassed: quiz?.gateUntilPassed ?? false,
    shuffleQuestions: quiz?.shuffleQuestions ?? false,
    timeLimitMinutes: quiz?.timeLimitMinutes ?? null,
    questions: quiz?.questions?.length ? quiz.questions : [createQuestion()],
  };
}

function questionSummary(question: QuizQuestion) {
  return question.prompt.trim() || "Untitled question";
}

function correctAnswerHint(type: QuizQuestionType) {
  if (type === "MULTIPLE_SELECT") return "Mark every option that is correct.";
  if (type === "TRUE_FALSE") return "Choose whether True or False is correct.";
  return "Choose one correct answer.";
}

function serializeQuiz(quiz: NonNullable<LessonQuiz>) {
  return JSON.stringify({
    ...quiz,
    questions: quiz.questions.map((question) => ({
      ...question,
      options: question.options,
    })),
  });
}

function normalizeQuestionType(value: string | null): QuizQuestionType | null {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[_-]/g, " ").trim();
  if (normalized.includes("multi")) return "MULTIPLE_SELECT";
  if (normalized.includes("true") || normalized.includes("false")) return "TRUE_FALSE";
  if (normalized.includes("single") || normalized.includes("choice")) return "SINGLE_CHOICE";
  return null;
}

function splitQuestionBlocks(input: string) {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const matches = [...normalized.matchAll(/(?:^|\n)\s*(?:Question|Q)\s*[:.)-]/gi)];
  if (matches.length === 0) return [normalized];

  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? normalized.length;
    return normalized.slice(start, end).trim();
  }).filter(Boolean);
}

function parseCorrectTokens(value: string) {
  return value
    .replace(/^answer\s*[:.)-]\s*/i, "")
    .split(/[,;/]|\band\b/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

function parsePastedQuizQuestions(input: string): ParsedQuizQuestion[] {
  return splitQuestionBlocks(input).map((block, blockIndex) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const options: { letter: string; text: string }[] = [];
    const issues: string[] = [];
    let prompt = "";
    let explicitType: QuizQuestionType | null = null;
    let correctRaw = "";
    let explanation = "";
    let activeField: "prompt" | "explanation" | null = null;

    for (const line of lines) {
      const questionMatch = line.match(/^(?:Question|Q)\s*[:.)-]\s*(.+)$/i);
      const typeMatch = line.match(/^Type\s*[:.)-]\s*(.+)$/i);
      const correctMatch = line.match(/^(?:Correct|Answer)\s*[:.)-]\s*(.+)$/i);
      const explanationMatch = line.match(/^(?:Explanation|Reason|Why)\s*[:.)-]\s*(.+)$/i);
      const optionMatch = line.match(/^([A-H])[\.)]\s+(.+)$/i);

      if (questionMatch) {
        prompt = questionMatch[1].trim();
        activeField = "prompt";
        continue;
      }

      if (typeMatch) {
        explicitType = normalizeQuestionType(typeMatch[1]);
        if (!explicitType) issues.push(`Question ${blockIndex + 1}: type is not recognized.`);
        activeField = null;
        continue;
      }

      if (optionMatch) {
        options.push({ letter: optionMatch[1].toUpperCase(), text: optionMatch[2].trim() });
        activeField = null;
        continue;
      }

      if (correctMatch) {
        correctRaw = correctMatch[1].trim();
        activeField = null;
        continue;
      }

      if (explanationMatch) {
        explanation = explanationMatch[1].trim();
        activeField = "explanation";
        continue;
      }

      if (activeField === "prompt") {
        prompt = `${prompt} ${line}`.trim();
      } else if (activeField === "explanation") {
        explanation = `${explanation} ${line}`.trim();
      } else if (!prompt) {
        prompt = line;
        activeField = "prompt";
      }
    }

    const correctTokens = parseCorrectTokens(correctRaw);
    const trueFalseByCorrect =
      correctTokens.some((token) => /^(true|false)$/i.test(token)) ||
      (options.length === 0 && /^(true|false)$/i.test(correctRaw));

    const inferredType: QuizQuestionType =
      explicitType ??
      (trueFalseByCorrect || options.every((option) => /^(true|false)$/i.test(option.text)) && options.length === 2
        ? "TRUE_FALSE"
        : correctTokens.length > 1
          ? "MULTIPLE_SELECT"
          : "SINGLE_CHOICE");

    const optionSource =
      inferredType === "TRUE_FALSE" && options.length === 0
        ? [
            { letter: "A", text: "True" },
            { letter: "B", text: "False" },
          ]
        : options;

    const correctLetters = new Set<string>();
    const correctValues = new Set<string>();
    for (const token of correctTokens) {
      const letterMatch = token.match(/^[A-H]$/i);
      if (letterMatch) correctLetters.add(token.toUpperCase());
      else correctValues.add(token.toLowerCase());
    }

    const parsedOptions = optionSource.map((option) => {
      const isCorrect =
        correctLetters.has(option.letter) ||
        correctValues.has(option.text.toLowerCase()) ||
        (inferredType === "TRUE_FALSE" && correctValues.has(option.text.toLowerCase()));
      return createOption(option.text, isCorrect);
    });

    if (!prompt.trim()) issues.push("Missing question prompt.");
    if (parsedOptions.length < 2) issues.push("Add at least two answer options.");
    if (!correctRaw.trim()) issues.push("Missing correct answer.");
    if (correctLetters.size > 0) {
      for (const letter of correctLetters) {
        if (!optionSource.some((option) => option.letter === letter)) {
          issues.push(`Correct answer ${letter} does not match any option.`);
        }
      }
    }
    if (parsedOptions.filter((option) => option.isCorrect).length === 0) {
      issues.push("No option was marked correct.");
    }
    if (inferredType === "SINGLE_CHOICE" && parsedOptions.filter((option) => option.isCorrect).length > 1) {
      issues.push("Single choice questions can only have one correct answer.");
    }
    if (inferredType === "TRUE_FALSE" && parsedOptions.length !== 2) {
      issues.push("True / false questions should have exactly two options.");
    }

    return {
      id: createId("parsed-question"),
      question: {
        id: createId("temp-question"),
        type: inferredType,
        prompt,
        explanation: explanation || "",
        points: 1,
        required: true,
        options: parsedOptions,
      },
      issues: Array.from(new Set(issues)),
    };
  });
}

export default function QuizLessonBuilder({ lessonId, courseId, quiz, disabled = false, onSaved }: QuizLessonBuilderProps) {
  const [saving, startSaving] = useTransition();
  const [draft, setDraft] = useState(() => normalizeInitialQuiz(quiz));
  const [expandedQuestionId, setExpandedQuestionId] = useState(draft.questions[0]?.id ?? null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [pastePanelOpen, setPastePanelOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuizQuestion[] | null>(null);
  const lastSavedRef = useRef(serializeQuiz(draft));
  const mountedRef = useRef(false);

  const readiness = useMemo(() => getQuizReadiness(draft), [draft]);
  const isGraded = draft.mode === "GRADED";
  const isDirty = serializeQuiz(draft) !== lastSavedRef.current;

  const setQuestion = (questionId: string | undefined, updater: (question: QuizQuestion) => QuizQuestion) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) => question.id === questionId ? updater(question) : question),
    }));
    setSaveStatus("dirty");
  };

  const setDraftDirty = (updater: (current: NonNullable<LessonQuiz>) => NonNullable<LessonQuiz>) => {
    setDraft(updater);
    setSaveStatus("dirty");
  };

  const addQuestion = () => {
    const question = createQuestion();
    setDraftDirty((current) => ({ ...current, questions: [...current.questions, question] }));
    setExpandedQuestionId(question.id ?? null);
  };

  const previewPastedQuestions = () => {
    const parsed = parsePastedQuizQuestions(pasteText);
    if (parsed.length === 0) {
      toast.error("Paste at least one question first.");
      return;
    }
    setParsedQuestions(parsed);
  };

  const importParsedQuestions = () => {
    if (!parsedQuestions) return;
    const validQuestions = parsedQuestions
      .filter((item) => item.issues.length === 0)
      .map((item, index) => ({
        ...item.question,
        id: createId("temp-question"),
        position: draft.questions.length + index + 1,
        options: item.question.options.map((option, optionIndex) => ({
          ...option,
          id: createId("temp-option"),
          position: optionIndex + 1,
        })),
      }));

    if (validQuestions.length === 0) {
      toast.error("Fix or remove invalid pasted questions before importing.");
      return;
    }

    setDraftDirty((current) => ({ ...current, questions: [...current.questions, ...validQuestions] }));
    setExpandedQuestionId(null);
    setPastePanelOpen(false);
    setPasteText("");
    setParsedQuestions(null);
    toast.success(`${validQuestions.length} question${validQuestions.length === 1 ? "" : "s"} added.`);
  };

  const changeQuestionType = (question: QuizQuestion, type: QuizQuestionType) => {
    setQuestion(question.id, (current) => ({
      ...current,
      type,
      options: type === "TRUE_FALSE" ? trueFalseOptions() : current.options.length >= 2 ? current.options : [createOption("", true), createOption("", false)],
    }));
  };

  const setCorrectOption = (question: QuizQuestion, optionId: string | undefined, checked: boolean) => {
    setQuestion(question.id, (current) => ({
      ...current,
      options: current.options.map((option) => {
        if (current.type === "MULTIPLE_SELECT") {
          return option.id === optionId ? { ...option, isCorrect: checked } : option;
        }
        return { ...option, isCorrect: option.id === optionId };
      }),
    }));
  };

  const saveQuiz = (showToast = false) => {
    if (disabled || saving || !isDirty) return;
    setSaveStatus("saving");
    startSaving(async () => {
      try {
        const saved = await updateLessonQuizAction(lessonId, courseId, {
          mode: draft.mode,
          instructions: draft.instructions,
          passingScore: isGraded ? draft.passingScore ?? 70 : null,
          maxAttempts: isGraded ? draft.maxAttempts ?? 3 : null,
          showAnswers: draft.showAnswers,
          gateUntilPassed: isGraded ? draft.gateUntilPassed : false,
          shuffleQuestions: draft.shuffleQuestions,
          timeLimitMinutes: null,
          questions: draft.questions.map((question) => ({
            ...question,
            points: 1,
          })),
        });
        setDraft(saved);
        lastSavedRef.current = serializeQuiz(saved);
        setSaveStatus("saved");
        onSaved?.(saved);
        if (showToast) toast.success("Quiz saved.");
      } catch (error) {
        setSaveStatus("error");
        toast.error(error instanceof Error ? error.message : "Failed to save quiz.");
      }
    });
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (disabled || !isDirty) return;
    const timeoutId = window.setTimeout(() => saveQuiz(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [draft, disabled, isDirty]);

  useEffect(() => {
    if (disabled || saving || !isDirty || saveStatus !== "saved") return;
    const timeoutId = window.setTimeout(() => saveQuiz(false), 400);
    return () => window.clearTimeout(timeoutId);
  }, [disabled, saving, isDirty, saveStatus]);

  const saveStatusLabel =
    saveStatus === "saving" || saving ? "Saving..." :
    saveStatus === "saved" && !isDirty ? "Saved" :
    saveStatus === "error" ? "Save failed" :
    isDirty ? "Unsaved changes" : "Saved";

  return (
    <div className="space-y-5 rounded-[16px] border border-[#DCE5F5] bg-[#F8FAFF] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[12px] font-bold text-primary shadow-sm">
            <CheckCircle2 size={14} />
            Knowledge Check
          </div>
          <h3 className="mt-3 text-[18px] font-bold text-navy">Build the quiz for this lesson</h3>
          <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-text-body">
            Practice checks are light and Boot.dev-style: students answer, learn from feedback, and continue. Switch to graded only when this quiz should formally gate progress.
          </p>
          <p className={`mt-2 text-xs font-bold ${
            saveStatus === "error" ? "text-red-500" :
            saveStatus === "saving" || saving ? "text-primary" :
            isDirty ? "text-amber-600" : "text-emerald-600"
          }`}>
            {saveStatusLabel}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          rounded="[10px]"
          disabled={disabled || saving || !isDirty}
          loading={saving}
          leftIcon={<Save size={14} />}
          onClick={() => saveQuiz(true)}
        >
          Save quiz
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[14px] border border-stroke bg-white p-4">
          <label className="text-sm font-semibold text-navy">Quiz mode</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              { value: "PRACTICE" as QuizMode, title: "Practice Check", body: "No passing score. Great for quick understanding checks." },
              { value: "GRADED" as QuizMode, title: "Graded Quiz", body: "Optional passing score, attempts, and lesson gating." },
            ].map((mode) => (
              <button
                key={mode.value}
                type="button"
                disabled={disabled}
                onClick={() => setDraftDirty((current) => ({ ...current, mode: mode.value }))}
                className={`rounded-[12px] border p-4 text-left transition ${
                  draft.mode === mode.value ? "border-primary bg-primary/5" : "border-stroke bg-white hover:border-primary/30"
                }`}
              >
                <p className="text-sm font-bold text-navy">{mode.title}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-text-mute">{mode.body}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-stroke bg-white p-4">
          <label className="text-sm font-semibold text-navy">Student instructions</label>
          <textarea
            value={draft.instructions ?? ""}
            disabled={disabled}
            onChange={(event) => setDraftDirty((current) => ({ ...current, instructions: event.target.value }))}
            className={`${inputCls} mt-2 min-h-[104px] resize-y`}
            placeholder="Tell students what to do before they answer..."
          />
        </div>
      </div>

      {isGraded && (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Passing score (%)
            <input
              type="number"
              min={1}
              max={100}
              disabled={disabled}
              value={draft.passingScore ?? 70}
              onChange={(event) => setDraftDirty((current) => ({ ...current, passingScore: Number(event.target.value) }))}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
            Attempts allowed
            <input
              type="number"
              min={1}
              max={50}
              disabled={disabled}
              value={draft.maxAttempts ?? 3}
              onChange={(event) => setDraftDirty((current) => ({ ...current, maxAttempts: Number(event.target.value) }))}
              className={inputCls}
            />
            <span className="text-[11px] font-medium leading-4 text-text-mute">
              How many submitted tries a student gets to reach the passing score.
            </span>
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { key: "showAnswers", label: "Show correct answers after submit", enabled: draft.showAnswers },
          { key: "shuffleQuestions", label: "Shuffle question order", enabled: draft.shuffleQuestions },
          ...(isGraded ? [{ key: "gateUntilPassed", label: "Gate next lesson until passed", enabled: draft.gateUntilPassed }] : []),
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={disabled}
            onClick={() => setDraftDirty((current) => ({ ...current, [item.key]: !item.enabled }))}
            className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
              item.enabled ? "border-primary/30 bg-primary/10 text-primary" : "border-stroke bg-white text-text-mute hover:text-navy"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-navy">Questions</h4>
            <p className="text-xs font-medium text-text-mute">
              Start with one question for a simple knowledge check. Each question is weighted equally.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              rounded="[10px]"
              disabled={disabled}
              leftIcon={<ClipboardPaste size={14} />}
              onClick={() => {
                setPastePanelOpen((value) => !value);
                setParsedQuestions(null);
              }}
            >
              Paste questions
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              rounded="[10px]"
              disabled={disabled}
              leftIcon={<Plus size={14} />}
              onClick={addQuestion}
            >
              Add question
            </Button>
          </div>
        </div>

        {pastePanelOpen && (
          <div className="rounded-[16px] border border-[#C8D7FF] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-primary">
                  <ClipboardPaste size={13} />
                  Paste multiple questions
                </div>
                <h5 className="mt-3 text-[16px] font-black text-navy">Import structured quiz questions</h5>
                <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-text-body">
                  Paste single choice, multiple select, or true/false questions. Preview them first, then import the valid ones into this quiz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPastePanelOpen(false);
                  setParsedQuestions(null);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-stroke text-text-mute transition hover:text-navy"
                aria-label="Close paste questions panel"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <textarea
                  value={pasteText}
                  disabled={disabled}
                  onChange={(event) => {
                    setPasteText(event.target.value);
                    setParsedQuestions(null);
                  }}
                  className={`${inputCls} min-h-[260px] resize-y font-mono text-[13px] leading-6`}
                  placeholder={`Question: What is the best first step before sending DMs?\nType: single\nA. Create a random offer\nB. Optimize your profile around one clear promise\nC. Message everyone\nD. Lower your price\nCorrect: B\nExplanation: Your profile needs to make the DM feel relevant and trustworthy.`}
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    size="sm"
                    rounded="[10px]"
                    disabled={disabled || !pasteText.trim()}
                    leftIcon={<CheckCircle2 size={14} />}
                    onClick={previewPastedQuestions}
                  >
                    Preview questions
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    rounded="[10px]"
                    onClick={() => {
                      setPasteText("");
                      setParsedQuestions(null);
                    }}
                    disabled={disabled || !pasteText}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#DCE5F5] bg-[#F8FAFF] p-4">
                <p className="text-[12px] font-black uppercase tracking-[0.12em] text-primary">Supported format</p>
                <div className="mt-3 space-y-3 text-[12px] font-semibold leading-5 text-text-body">
                  <p><span className="font-black text-navy">Single:</span> use one correct letter like <span className="font-black">Correct: B</span>.</p>
                  <p><span className="font-black text-navy">Multiple:</span> add <span className="font-black">Type: multiple</span> and use <span className="font-black">Correct: A, C</span>.</p>
                  <p><span className="font-black text-navy">True/False:</span> use <span className="font-black">Correct: True</span> or options A/B.</p>
                  <p className="rounded-[10px] bg-white p-3 text-text-mute">
                    Tip: You can paste many questions at once. Start each one with <span className="font-black text-navy">Question:</span>.
                  </p>
                </div>
              </div>
            </div>

            {parsedQuestions && (
              <div className="mt-5 rounded-[14px] border border-[#DCE5F5] bg-[#F8FAFF] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h5 className="text-sm font-black text-navy">Review parsed questions</h5>
                    <p className="mt-1 text-xs font-semibold text-text-mute">
                      {parsedQuestions.filter((item) => item.issues.length === 0).length} ready · {parsedQuestions.filter((item) => item.issues.length > 0).length} need attention
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    rounded="[10px]"
                    disabled={disabled || parsedQuestions.every((item) => item.issues.length > 0)}
                    leftIcon={<Plus size={14} />}
                    onClick={importParsedQuestions}
                  >
                    Add valid questions
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {parsedQuestions.map((item, index) => (
                    <div
                      key={item.id}
                      className={`rounded-[14px] border bg-white p-4 ${
                        item.issues.length > 0 ? "border-red-200" : "border-emerald-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                              item.issues.length > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {item.issues.length > 0 ? "Needs attention" : "Ready"}
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-[0.08em] text-text-mute">
                              {questionTypeOptions.find((option) => option.value === item.question.type)?.label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-black leading-6 text-navy">
                            {index + 1}. {item.question.prompt || "Untitled question"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setParsedQuestions((current) => current?.filter((question) => question.id !== item.id) ?? null)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-text-mute transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove parsed question"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {item.issues.length > 0 && (
                        <div className="mt-3 rounded-[10px] bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-600">
                          {item.issues.join(" ")}
                        </div>
                      )}

                      <div className="mt-3 grid gap-2">
                        {item.question.options.map((option, optionIndex) => (
                          <div
                            key={option.id ?? optionIndex}
                            className={`rounded-[10px] border px-3 py-2 text-xs font-bold ${
                              option.isCorrect
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-[#E3E8F4] bg-[#F8FAFF] text-text-body"
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option.text || "Empty option"}
                            {option.isCorrect ? " · Correct" : ""}
                          </div>
                        ))}
                      </div>

                      {item.question.explanation && (
                        <p className="mt-3 text-xs font-semibold leading-5 text-text-mute">
                          <span className="font-black text-navy">Explanation:</span> {item.question.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {draft.questions.map((question, questionIndex) => {
          const isOpen = expandedQuestionId === question.id;
          const correctCount = question.options.filter((option) => option.isCorrect).length;
          const isValid = question.prompt.trim() && question.options.filter((option) => option.text.trim()).length >= 2 && correctCount > 0;

          return (
            <div key={question.id ?? questionIndex} className="overflow-hidden rounded-sm border border-stroke bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setExpandedQuestionId(isOpen ? null : question.id ?? null)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#F8FAFF]"
              >
                {isOpen ? <ChevronDown size={16} className="text-text-mute" /> : <ChevronRight size={16} className="text-text-mute" />}
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  isValid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {isValid ? <Check size={14} /> : questionIndex + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy">{questionSummary(question)}</p>
                  <p className="mt-0.5 text-xs font-medium text-text-mute">
                    {questionTypeOptions.find((item) => item.value === question.type)?.label} · {correctCount} correct answer{correctCount === 1 ? "" : "s"}
                  </p>
                </div>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-stroke p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <CustomSelect
                      value={question.type}
                      options={questionTypeOptions}
                      disabled={disabled}
                      className="w-full lg:w-[220px]"
                      onChange={(value) => changeQuestionType(question, value as QuizQuestionType)}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        rounded="[10px]"
                        disabled={disabled}
                        leftIcon={<Copy size={13} />}
                        onClick={() => {
                          const duplicate = {
                            ...question,
                            id: createId("temp-question"),
                            options: question.options.map((option) => ({ ...option, id: createId("temp-option") })),
                          };
                          setDraftDirty((current) => ({
                            ...current,
                            questions: [
                              ...current.questions.slice(0, questionIndex + 1),
                              duplicate,
                              ...current.questions.slice(questionIndex + 1),
                            ],
                          }));
                          setExpandedQuestionId(duplicate.id ?? null);
                        }}
                      >
                        Duplicate
                      </Button>
                      <button
                        type="button"
                        disabled={disabled || draft.questions.length <= 1}
                        onClick={() => {
                          const nextQuestion = draft.questions[questionIndex - 1] ?? draft.questions[questionIndex + 1] ?? null;
                          setDraftDirty((current) => ({ ...current, questions: current.questions.filter((_, index) => index !== questionIndex) }));
                          setExpandedQuestionId(nextQuestion?.id ?? null);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-[10px] text-text-mute transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Delete question"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={question.prompt}
                    disabled={disabled}
                    onChange={(event) => setQuestion(question.id, (current) => ({ ...current, prompt: event.target.value }))}
                    className={`${inputCls} min-h-[88px] resize-y`}
                    placeholder="Ask a clear, specific question..."
                  />

                  <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wide text-text-mute">
                    Explanation shown after answer
                    <input
                      value={question.explanation ?? ""}
                      disabled={disabled}
                      onChange={(event) => setQuestion(question.id, (current) => ({ ...current, explanation: event.target.value }))}
                      className={inputCls}
                      placeholder="Why is the correct answer correct?"
                    />
                  </label>

                  <div className="rounded-[12px] border border-[#DCE5F5] bg-[#F8FAFF] p-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-black uppercase tracking-wide text-navy">Mark correct answer</p>
                      <p className="text-xs font-medium text-text-mute">{correctAnswerHint(question.type)}</p>
                    </div>

                    <div className="mt-3 space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={option.id ?? optionIndex} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                          <label className="flex items-center gap-2 rounded-[10px] border border-stroke bg-white px-3 py-2 text-xs font-bold text-navy">
                            <input
                              type={question.type === "MULTIPLE_SELECT" ? "checkbox" : "radio"}
                              checked={option.isCorrect}
                              disabled={disabled}
                              onChange={(event) => setCorrectOption(question, option.id, event.target.checked)}
                              className="h-4 w-4 accent-primary"
                            />
                            Correct
                          </label>
                          <input
                            value={option.text}
                            disabled={disabled || question.type === "TRUE_FALSE"}
                            onChange={(event) => setQuestion(question.id, (current) => ({
                              ...current,
                              options: current.options.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item),
                            }))}
                            className={inputCls}
                            placeholder={`Answer option ${optionIndex + 1}`}
                          />
                          {question.type !== "TRUE_FALSE" && (
                            <button
                              type="button"
                              disabled={disabled || question.options.length <= 2}
                              onClick={() => setQuestion(question.id, (current) => ({ ...current, options: current.options.filter((item) => item.id !== option.id) }))}
                              className="flex h-10 w-10 items-center justify-center rounded-[10px] text-text-mute transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Delete option"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}

                      {question.type !== "TRUE_FALSE" && (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => setQuestion(question.id, (current) => ({ ...current, options: [...current.options, createOption()] }))}
                          className="inline-flex items-center gap-1.5 rounded-[10px] border border-dashed border-[#C8D1E0] px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus size={13} />
                          Add option
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!disabled && draft.questions.length > 1 && (
          <div className="sticky bottom-3 z-10 rounded-[14px] border border-[#C8D7FF] bg-white/95 p-2 shadow-[0_16px_34px_rgba(4,11,55,0.12)] backdrop-blur">
            <Button
              type="button"
              variant="primary"
              size="sm"
              rounded="[10px]"
              className="w-full"
              leftIcon={<Plus size={14} />}
              onClick={addQuestion}
            >
              Add another question
            </Button>
          </div>
        )}
      </div>

      {!readiness.ready && (
        <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          To publish this quiz lesson later, complete: {readiness.missingLabels.join(", ")}.
        </div>
      )}
    </div>
  );
}
