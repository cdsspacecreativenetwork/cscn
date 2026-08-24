'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Zap,
  Plus,
  HelpCircle,
  AlertCircle,
  FileCheck2,
  Trash2,
  Sparkles,
  Save,
  GraduationCap,
  Code2,
  FileQuestion,
  Edit3,
  Eye,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import {
  updateCourseExamSettingsAction,
  createAndLinkExamAction,
  unlinkCourseExamAction,
  addExamQuestionAction,
  updateExamQuestionAction,
  deleteExamQuestionAction
} from '@/actions/instructor';

export interface ExamQuestionItem {
  id: string;
  question: string;
  type: string; // "mcq" | "coding"
  options?: any; // string[] | null
  correctAnswer: string;
  codeContext?: string | null;
  points: number;
  position: number;
}

export interface ExamSummary {
  id: string;
  title: string;
  duration: number;
  passingScore: number;
  retakeCooldownHours?: number;
  schedulingMode?: string;
  description?: string | null;
  questions?: ExamQuestionItem[];
  _count?: {
    questions: number;
    attempts?: number;
  };
}

interface CourseData {
  id: string;
  title: string;
  courseType?: string | null;
  certificateEnabled?: boolean;
  examGated?: boolean;
  finalExamId?: string | null;
  finalExam?: ExamSummary | null;
}

interface Props {
  course: CourseData;
  availableExams: ExamSummary[];
  isLocked?: boolean;
  onRefresh?: () => void;
}

export default function CourseExamsTab({
  course,
  availableExams,
  isLocked = false,
  onRefresh
}: Props) {
  const [isSaving, startSave] = useTransition();
  const [isCreating, startCreate] = useTransition();
  const [isQuestionAction, startQuestionAction] = useTransition();

  // Settings State
  const [certificateEnabled, setCertificateEnabled] = useState(
    course.certificateEnabled ?? false
  );
  const [examGated, setExamGated] = useState(course.examGated ?? false);
  const [selectedExamId, setSelectedExamId] = useState<string>(
    course.finalExamId ?? (course.finalExam?.id || '')
  );

  // Active Linked Exam Properties
  const activeExam =
    course.finalExam?.id === selectedExamId
      ? course.finalExam
      : availableExams.find((e) => e.id === selectedExamId);

  const [examTitle, setExamTitle] = useState(activeExam?.title ?? '');
  const [duration, setDuration] = useState(activeExam?.duration ?? 60);
  const [passingScore, setPassingScore] = useState(activeExam?.passingScore ?? 75);
  const [retakeCooldownHours, setRetakeCooldownHours] = useState(
    activeExam?.retakeCooldownHours ?? 24
  );
  const [schedulingMode, setSchedulingMode] = useState<'FLEXI' | 'SCHEDULED_SLOT'>(
    (activeExam?.schedulingMode as 'FLEXI' | 'SCHEDULED_SLOT') ?? 'FLEXI'
  );
  const [description, setDescription] = useState(activeExam?.description ?? '');

  // Questions State
  const [questions, setQuestions] = useState<ExamQuestionItem[]>(
    activeExam?.questions || []
  );

  // Modal State for Quick Creating Exam
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(60);
  const [newPassScore, setNewPassScore] = useState(75);
  const [newCooldown, setNewCooldown] = useState(24);
  const [newMode, setNewMode] = useState<'FLEXI' | 'SCHEDULED_SLOT'>('FLEXI');

  // Question Modal & Editor State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestionItem | null>(null);
  const [qType, setQType] = useState<'mcq' | 'coding'>('mcq');
  const [qPrompt, setQPrompt] = useState('');
  const [qPoints, setQPoints] = useState(5);
  const [qOptions, setQOptions] = useState<string[]>(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
  const [qCorrectAnswer, setQCorrectAnswer] = useState('Option 1');
  const [qCodeContext, setQCodeContext] = useState('');

  // Student Live Simulator Modal State
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [simActiveIndex, setSimActiveIndex] = useState(0);
  const [simAnswers, setSimAnswers] = useState<Record<string, string>>({});

  // Update state when active exam changes
  useEffect(() => {
    if (activeExam) {
      setExamTitle(activeExam.title);
      setDuration(activeExam.duration);
      setPassingScore(activeExam.passingScore);
      setRetakeCooldownHours(activeExam.retakeCooldownHours ?? 24);
      setSchedulingMode(
        (activeExam.schedulingMode as 'FLEXI' | 'SCHEDULED_SLOT') ?? 'FLEXI'
      );
      setDescription(activeExam.description ?? '');
      setQuestions(activeExam.questions || []);
    }
  }, [selectedExamId, activeExam]);

  const handleSaveSettings = () => {
    startSave(async () => {
      try {
        await updateCourseExamSettingsAction(course.id, {
          certificateEnabled,
          examGated,
          finalExamId: examGated ? selectedExamId || null : null,
          title: examGated && selectedExamId ? examTitle : undefined,
          duration: examGated && selectedExamId ? Number(duration) : undefined,
          passingScore: examGated && selectedExamId ? Number(passingScore) : undefined,
          retakeCooldownHours: examGated && selectedExamId ? Number(retakeCooldownHours) : undefined,
          schedulingMode: examGated && selectedExamId ? schedulingMode : undefined,
          description: examGated && selectedExamId ? description : undefined
        });

        toast.success('Exam and certification settings saved successfully!');
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save exam settings.');
      }
    });
  };

  const handleCreateNewExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Please enter an exam title.');
      return;
    }

    startCreate(async () => {
      try {
        const res = await createAndLinkExamAction(course.id, {
          title: newTitle.trim(),
          duration: Number(newDuration),
          passingScore: Number(newPassScore),
          retakeCooldownHours: Number(newCooldown),
          schedulingMode: newMode
        });

        if (res.examId) {
          setSelectedExamId(res.examId);
          setCertificateEnabled(true);
          setExamGated(true);
          setShowCreateModal(false);
          setNewTitle('');
          toast.success('Exam created and linked to course!');
          if (onRefresh) onRefresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create exam.');
      }
    });
  };

  const handleUnlinkExam = () => {
    if (!confirm('Are you sure you want to unlink this exam from the course?')) return;
    startSave(async () => {
      try {
        await unlinkCourseExamAction(course.id);
        setSelectedExamId('');
        setExamGated(false);
        setQuestions([]);
        toast.success('Exam unlinked successfully.');
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to unlink exam.');
      }
    });
  };

  // Open question modal for creation
  const handleOpenAddQuestion = (type: 'mcq' | 'coding') => {
    if (!selectedExamId) {
      toast.error('Please select or create an exam first.');
      return;
    }
    setEditingQuestion(null);
    setQType(type);
    setQPrompt('');
    setQPoints(type === 'coding' ? 10 : 5);
    setQOptions(['Option A', 'Option B', 'Option C', 'Option D']);
    setQCorrectAnswer('Option A');
    setQCodeContext(
      type === 'coding'
        ? '// Write your TypeScript / JavaScript solution here\nfunction main() {\n  // TODO: implement logic\n}'
        : ''
    );
    setShowQuestionModal(true);
  };

  // Open question modal for editing
  const handleOpenEditQuestion = (q: ExamQuestionItem) => {
    setEditingQuestion(q);
    setQType(q.type as 'mcq' | 'coding');
    setQPrompt(q.question);
    setQPoints(q.points);
    let parsedOpts: string[] = ['Option A', 'Option B'];
    if (Array.isArray(q.options)) {
      parsedOpts = q.options;
    } else if (typeof q.options === 'string') {
      try {
        parsedOpts = JSON.parse(q.options);
      } catch {
        parsedOpts = [q.options];
      }
    }
    setQOptions(parsedOpts);
    setQCorrectAnswer(q.correctAnswer || (parsedOpts[0] ?? ''));
    setQCodeContext(q.codeContext || '');
    setShowQuestionModal(true);
  };

  // Save question (Add or Update)
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPrompt.trim()) {
      toast.error('Question prompt is required.');
      return;
    }
    if (qType === 'mcq' && qOptions.filter((o) => o.trim()).length < 2) {
      toast.error('At least 2 valid options are required for MCQ.');
      return;
    }

    startQuestionAction(async () => {
      try {
        const cleanedOpts = qOptions.filter((o) => o.trim());
        if (editingQuestion) {
          await updateExamQuestionAction(editingQuestion.id, course.id, {
            question: qPrompt.trim(),
            type: qType,
            options: qType === 'mcq' ? cleanedOpts : undefined,
            correctAnswer: qCorrectAnswer,
            codeContext: qType === 'coding' ? qCodeContext : null,
            points: Number(qPoints)
          });
          toast.success('Question updated!');
        } else {
          await addExamQuestionAction(selectedExamId, course.id, {
            question: qPrompt.trim(),
            type: qType,
            options: qType === 'mcq' ? cleanedOpts : undefined,
            correctAnswer: qCorrectAnswer,
            codeContext: qType === 'coding' ? qCodeContext : null,
            points: Number(qPoints)
          });
          toast.success('Question added!');
        }
        setShowQuestionModal(false);
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save question.');
      }
    });
  };

  // Delete question
  const handleDeleteQuestion = (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    startQuestionAction(async () => {
      try {
        await deleteExamQuestionAction(questionId, course.id);
        toast.success('Question deleted!');
        if (onRefresh) onRefresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete question.');
      }
    });
  };

  // Calculate totals
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  // Color badge for passing score
  const getPassScoreBadge = (score: number) => {
    if (score < 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (score <= 80) return 'bg-blue-50 text-[#1C4ED1] border-[#C8D7FF]';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-16 font-jakarta">
      {/* ── MAIN STUDIO 2-COLUMN GRID LAYOUT ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Exam Rules & Credential Settings (5 cols) ────────── */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* SECTION 1: Certificate Strategy */}
          <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-stroke pb-4">
              <div>
                <h3 className="font-semibold text-navy text-base flex items-center gap-2">
                  <Award className="text-[#1C4ED1]" size={18} />
                  1. Credential Award Strategy
                </h3>
                <p className="text-xs text-text-mute mt-0.5">
                  Choose whether students earn a verified certificate upon finishing this course.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={certificateEnabled}
                  onChange={(e) => {
                    setCertificateEnabled(e.target.checked);
                    if (!e.target.checked) setExamGated(false);
                  }}
                  disabled={isLocked}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C4ED1]"></div>
              </label>
            </div>

            {certificateEnabled && (
              <div className="flex flex-col gap-4">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">
                  Evaluation Mode
                </label>

                <div className="grid grid-cols-1 gap-3">
                  {/* Option A: Completion Based */}
                  <div
                    onClick={() => !isLocked && setExamGated(false)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      !examGated
                        ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 shadow-sm ring-1 ring-[#1C4ED1]'
                        : 'border-stroke bg-white hover:border-[#C8D7FF]'
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                        !examGated
                          ? 'border-[#1C4ED1] bg-[#1C4ED1] text-white'
                          : 'border-stroke bg-white'
                      }`}
                    >
                      {!examGated && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-navy">
                          Completion-Based Certificate
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Standard
                        </span>
                      </div>
                      <p className="text-xs text-text-mute mt-1 leading-relaxed">
                        Certificate is automatically awarded as soon as the student completes 100% of all lessons and modules.
                      </p>
                    </div>
                  </div>

                  {/* Option B: Exam Gated */}
                  <div
                    onClick={() => !isLocked && setExamGated(true)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3.5 ${
                      examGated
                        ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 shadow-sm ring-1 ring-[#1C4ED1]'
                        : 'border-stroke bg-white hover:border-[#C8D7FF]'
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                        examGated
                          ? 'border-[#1C4ED1] bg-[#1C4ED1] text-white'
                          : 'border-stroke bg-white'
                      }`}
                    >
                      {examGated && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-navy">
                          Exam-Gated Certification
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1C4ED1] text-[10px] font-bold">
                          Pro Credential
                        </span>
                      </div>
                      <p className="text-xs text-text-mute mt-1 leading-relaxed">
                        Students must pass a graded final assessment with a qualifying score to earn their verified certificate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Linked Assessment & Parameters */}
          {certificateEnabled && examGated && (
            <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stroke pb-4">
                <div>
                  <h3 className="font-semibold text-navy text-base flex items-center gap-2">
                    <ShieldCheck className="text-[#1C4ED1]" size={18} />
                    2. Graded Certification Exam Rules
                  </h3>
                  <p className="text-xs text-text-mute mt-0.5">
                    Link an assessment and configure time limits, passing scores, and scheduling rules.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  disabled={isLocked}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C4ED1]/10 text-[#1C4ED1] hover:bg-[#1C4ED1]/20 text-xs font-bold transition-colors w-fit shrink-0"
                >
                  <Plus size={15} />
                  New Exam
                </button>
              </div>

              {/* Exam Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center justify-between">
                  <span>Select Linked Exam</span>
                  {activeExam && (
                    <span className="text-[11px] text-text-mute font-normal">
                      {questions.length} Questions
                    </span>
                  )}
                </label>

                {availableExams.length > 0 ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      disabled={isLocked}
                      className="flex-1 h-[42px] px-3.5 rounded-xl border border-stroke bg-white text-sm font-semibold text-navy focus:border-[#1C4ED1] outline-none"
                    >
                      <option value="">-- Choose an Exam --</option>
                      {availableExams.map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.title} ({exam.duration}m • {exam.passingScore}% Pass)
                        </option>
                      ))}
                    </select>

                    {selectedExamId && (
                      <button
                        type="button"
                        onClick={handleUnlinkExam}
                        disabled={isLocked}
                        className="px-3 h-[42px] rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                        title="Unlink Exam"
                      >
                        <Trash2 size={15} />
                        <span>Unlink</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                      <span>No existing exams found. Create a new assessment.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors text-xs shrink-0"
                    >
                      + Quick Create
                    </button>
                  </div>
                )}
              </div>

              {/* Exam Rules Form */}
              {selectedExamId && (
                <div className="flex flex-col gap-5 pt-1">
                  {/* Title & Duration */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">
                      Exam Title
                    </label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      disabled={isLocked}
                      placeholder="e.g. AWS Certified System Specialist"
                      className="h-[42px] px-4 rounded-xl border border-stroke bg-white text-sm font-semibold text-navy focus:border-[#1C4ED1] outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">
                      Time Limit (Minutes)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={360}
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        disabled={isLocked}
                        className="h-[42px] px-4 rounded-xl border border-stroke bg-white text-sm font-semibold text-navy focus:border-[#1C4ED1] outline-none flex-1"
                      />
                      <div className="flex gap-1">
                        {[30, 60, 90].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setDuration(mins)}
                            className={`px-2.5 h-[42px] rounded-xl text-xs font-bold border transition-colors ${
                              duration === mins
                                ? 'bg-[#1C4ED1] text-white border-[#1C4ED1]'
                                : 'bg-white text-text-mute border-stroke hover:bg-[#F8FAFF]'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Passing Threshold Slider */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl border border-stroke bg-[#F8FAFF]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                        Passing Threshold (%)
                      </label>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getPassScoreBadge(
                          passingScore
                        )}`}
                      >
                        {passingScore}% Required
                      </span>
                    </div>
                    <div className="flex items-center gap-4 pt-1">
                      <input
                        type="range"
                        min={50}
                        max={100}
                        step={5}
                        value={passingScore}
                        onChange={(e) => setPassingScore(Number(e.target.value))}
                        disabled={isLocked}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1C4ED1]"
                      />
                      <span className="text-sm font-bold text-navy w-10 text-right">
                        {passingScore}%
                      </span>
                    </div>
                  </div>

                  {/* Retake Cooldown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                      <Clock size={14} className="text-[#1C4ED1]" />
                      Retake Cooldown Period
                    </label>
                    <select
                      value={retakeCooldownHours}
                      onChange={(e) => setRetakeCooldownHours(Number(e.target.value))}
                      disabled={isLocked}
                      className="h-[42px] px-3.5 rounded-xl border border-stroke bg-white text-sm font-semibold text-navy focus:border-[#1C4ED1] outline-none"
                    >
                      <option value={0}>Immediate (No wait)</option>
                      <option value={12}>12 Hours Cooldown</option>
                      <option value={24}>24 Hours Cooldown (Recommended)</option>
                      <option value={48}>48 Hours Cooldown</option>
                      <option value={72}>72 Hours Cooldown (Strict)</option>
                    </select>
                  </div>

                  {/* Access Mode */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">
                      Student Access Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSchedulingMode('FLEXI')}
                        disabled={isLocked}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                          schedulingMode === 'FLEXI'
                            ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 ring-1 ring-[#1C4ED1]'
                            : 'border-stroke bg-white hover:border-[#C8D7FF]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                          <Zap size={14} className="text-amber-500" />
                          Flexi-Take
                        </div>
                        <span className="text-[10px] text-text-mute leading-tight">
                          Take on-demand anytime.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSchedulingMode('SCHEDULED_SLOT')}
                        disabled={isLocked}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                          schedulingMode === 'SCHEDULED_SLOT'
                            ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 ring-1 ring-[#1C4ED1]'
                            : 'border-stroke bg-white hover:border-[#C8D7FF]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                          <Calendar size={14} className="text-[#1C4ED1]" />
                          AWS Date-Slot
                        </div>
                        <span className="text-[10px] text-text-mute leading-tight">
                          Book calendar slot.
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: Save Button Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-stroke bg-white shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-text-mute">
              <Sparkles size={16} className="text-[#1C4ED1]" />
              <span>Save rules to activate updates.</span>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving || isLocked}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C4ED1] text-white font-bold text-xs hover:bg-[#173FA8] transition-all shadow-md shadow-[#1C4ED1]/20 disabled:opacity-50"
            >
              <Save size={15} />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Question Builder & Management Studio (7 cols) ──── */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm flex flex-col gap-6 min-h-[600px]">
            {/* Question Studio Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stroke pb-4">
              <div>
                <h3 className="font-bold text-navy text-base flex items-center gap-2">
                  <FileQuestion className="text-[#1C4ED1]" size={20} />
                  Exam Question Builder Studio
                </h3>
                <p className="text-xs text-text-mute mt-0.5">
                  Create and manage multiple choice questions and coding challenges for this assessment.
                </p>
              </div>

              {selectedExamId && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSimulatorModal(true)}
                    disabled={questions.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke text-navy hover:bg-[#F8FAFF] text-xs font-bold transition-all disabled:opacity-40"
                    title="Interactive Student Live Simulator"
                  >
                    <Eye size={15} className="text-[#1C4ED1]" />
                    <span>Live Preview</span>
                  </button>

                  <div className="relative group">
                    <button
                      type="button"
                      disabled={isLocked}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C4ED1] text-white hover:bg-[#173FA8] text-xs font-bold shadow-md shadow-[#1C4ED1]/20 transition-all"
                    >
                      <Plus size={15} />
                      <span>Add Question</span>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-stroke bg-white p-1.5 shadow-xl hidden group-hover:block z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => handleOpenAddQuestion('mcq')}
                        className="w-full px-3 py-2 rounded-lg text-left text-xs font-bold text-navy hover:bg-[#1C4ED1]/5 hover:text-[#1C4ED1] flex items-center gap-2 transition-colors"
                      >
                        <FileQuestion size={15} className="text-[#1C4ED1]" />
                        Multiple Choice (MCQ)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddQuestion('coding')}
                        className="w-full px-3 py-2 rounded-lg text-left text-xs font-bold text-navy hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                      >
                        <Code2 size={15} className="text-emerald-600" />
                        Coding Challenge
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Questions Summary Metrics Strip */}
            {selectedExamId ? (
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-[#E3E8F4] bg-[#F8FAFF]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-mute uppercase tracking-wider">
                    Total Questions
                  </span>
                  <span className="text-lg font-bold text-navy">{questions.length}</span>
                </div>
                <div className="flex flex-col border-l border-stroke pl-3">
                  <span className="text-[10px] font-bold text-text-mute uppercase tracking-wider">
                    Total Points
                  </span>
                  <span className="text-lg font-bold text-[#1C4ED1]">{totalPoints} pts</span>
                </div>
                <div className="flex flex-col border-l border-stroke pl-3">
                  <span className="text-[10px] font-bold text-text-mute uppercase tracking-wider">
                    Required Pass
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    {Math.ceil((totalPoints * passingScore) / 100)} pts ({passingScore}%)
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl border border-dashed border-stroke bg-[#F8FAFF] flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#1C4ED1]/10 flex items-center justify-center text-[#1C4ED1]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy">No Exam Linked to Course</h4>
                  <p className="text-xs text-text-mute mt-1 max-w-sm">
                    {'Select an existing exam from the left panel or click "+ New Exam" to start adding questions.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#1C4ED1] text-white text-xs font-bold hover:bg-[#173FA8] transition-colors"
                >
                  + Create Certification Exam
                </button>
              </div>
            )}

            {/* Questions List */}
            {selectedExamId && (
              <div className="flex flex-col gap-3">
                {questions.length > 0 ? (
                  questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="group rounded-xl border border-stroke bg-white p-4 hover:border-[#C8D7FF] hover:shadow-sm transition-all flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="h-6 w-6 rounded-lg bg-[#1C4ED1]/10 text-[#1C4ED1] text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                            Q{index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {q.type === 'coding' ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                  <Code2 size={12} />
                                  Coding Challenge
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1C4ED1] text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                  <FileQuestion size={12} />
                                  Multiple Choice
                                </span>
                              )}
                              <span className="text-xs font-bold text-navy">
                                {q.points} {q.points === 1 ? 'Point' : 'Points'}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-navy leading-snug">
                              {q.question}
                            </p>
                          </div>
                        </div>

                        {/* Question Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q)}
                            disabled={isLocked}
                            className="p-2 rounded-lg text-text-mute hover:text-[#1C4ED1] hover:bg-[#1C4ED1]/10 transition-colors"
                            title="Edit Question"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            disabled={isLocked}
                            className="p-2 rounded-lg text-text-mute hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Display Question Details Preview */}
                      {q.type === 'mcq' && Array.isArray(q.options) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9 pt-1">
                          {q.options.map((opt: string, optIdx: number) => {
                            const isCorrect = opt === q.correctAnswer;
                            return (
                              <div
                                key={optIdx}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-between ${
                                  isCorrect
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold'
                                    : 'border-stroke bg-gray-50 text-text-body'
                                }`}
                              >
                                <span className="truncate">{opt}</span>
                                {isCorrect && (
                                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 ml-2" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'coding' && (
                        <div className="pl-9 pt-1 flex flex-col gap-1.5">
                          {q.codeContext && (
                            <div className="p-2.5 rounded-lg bg-navy text-emerald-400 font-mono text-[11px] overflow-x-auto">
                              <pre>{q.codeContext}</pre>
                            </div>
                          )}
                          <div className="text-[11px] font-semibold text-text-mute flex items-center gap-1.5">
                            <span className="font-bold text-navy">Expected Output:</span>
                            <code className="px-2 py-0.5 rounded bg-gray-100 text-navy font-mono text-[11px]">
                              {q.correctAnswer}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-stroke bg-[#F8FAFF] flex flex-col items-center justify-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#1C4ED1]/10 flex items-center justify-center text-[#1C4ED1]">
                      <FileQuestion size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy">No Questions Added Yet</h4>
                      <p className="text-xs text-text-mute mt-1 max-w-sm">
                        Start building your certification exam by adding Multiple Choice Questions or Coding Challenges.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAddQuestion('mcq')}
                        className="px-3.5 py-2 rounded-xl bg-[#1C4ED1] text-white text-xs font-bold hover:bg-[#173FA8] transition-colors"
                      >
                        + Add MCQ Question
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddQuestion('coding')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                      >
                        + Add Coding Challenge
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── QUESTION EDITOR MODAL ───────────────────────────────────────────── */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-2xl border border-stroke bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-stroke pb-3">
              <h3 className="font-bold text-navy text-base flex items-center gap-2">
                {qType === 'coding' ? (
                  <Code2 className="text-emerald-600" size={20} />
                ) : (
                  <FileQuestion className="text-[#1C4ED1]" size={20} />
                )}
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="text-text-mute hover:text-navy text-sm font-bold p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="flex flex-col gap-5 mt-4">
              {/* Question Type Switch */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-[#F8FAFF] border border-stroke w-fit">
                <button
                  type="button"
                  onClick={() => setQType('mcq')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    qType === 'mcq'
                      ? 'bg-[#1C4ED1] text-white shadow-sm'
                      : 'text-text-mute hover:text-navy'
                  }`}
                >
                  <FileQuestion size={14} />
                  Multiple Choice (MCQ)
                </button>
                <button
                  type="button"
                  onClick={() => setQType('coding')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    qType === 'coding'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-text-mute hover:text-navy'
                  }`}
                >
                  <Code2 size={14} />
                  Coding Challenge
                </button>
              </div>

              {/* Question Prompt */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center justify-between">
                  <span>Question Prompt *</span>
                  <span className="text-[11px] text-text-mute font-normal">
                    Points: {qPoints}
                  </span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={qPrompt}
                  onChange={(e) => setQPrompt(e.target.value)}
                  placeholder={
                    qType === 'coding'
                      ? 'e.g. Write a function that reverses a linked list and returns the new head node.'
                      : 'e.g. What is the main advantage of using Server Components in Next.js 15?'
                  }
                  className="p-3.5 rounded-xl border border-stroke bg-white text-sm font-medium text-navy focus:border-[#1C4ED1] outline-none"
                />
              </div>

              {/* Points Allocation */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">
                  Points Allocation
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={qPoints}
                  onChange={(e) => setQPoints(Number(e.target.value))}
                  className="h-[42px] px-4 rounded-xl border border-stroke bg-white text-sm font-semibold text-navy w-32"
                />
              </div>

              {/* MCQ Options Builder */}
              {qType === 'mcq' && (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-stroke bg-[#F8FAFF]">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center justify-between">
                    <span>Options & Correct Answer</span>
                    <span className="text-[11px] text-[#1C4ED1] font-semibold">
                      Select radio for correct answer
                    </span>
                  </label>

                  <div className="flex flex-col gap-2.5">
                    {qOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={qCorrectAnswer === opt}
                          onChange={() => setQCorrectAnswer(opt)}
                          className="h-4 w-4 text-[#1C4ED1] accent-[#1C4ED1] cursor-pointer"
                        />
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...qOptions];
                            newOpts[idx] = e.target.value;
                            if (qCorrectAnswer === opt) setQCorrectAnswer(e.target.value);
                            setQOptions(newOpts);
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 h-[40px] px-3.5 rounded-xl border border-stroke bg-white text-sm font-medium text-navy focus:border-[#1C4ED1] outline-none"
                        />
                        {qOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = qOptions.filter((_, i) => i !== idx);
                              setQOptions(newOpts);
                              if (qCorrectAnswer === opt) setQCorrectAnswer(newOpts[0] || '');
                            }}
                            className="p-2 text-text-mute hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {qOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setQOptions([...qOptions, `Option ${qOptions.length + 1}`])}
                      className="mt-1 text-xs font-bold text-[#1C4ED1] hover:underline flex items-center gap-1 w-fit"
                    >
                      <Plus size={14} />
                      Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Coding Challenge Editor */}
              {qType === 'coding' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">
                      Baseline Starter Code Template (`codeContext`)
                    </label>
                    <textarea
                      rows={4}
                      value={qCodeContext}
                      onChange={(e) => setQCodeContext(e.target.value)}
                      placeholder="// Baseline code provided to students"
                      className="p-3.5 rounded-xl border border-stroke bg-navy text-emerald-400 font-mono text-xs outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">
                      Expected Test Output / Solution (`correctAnswer`) *
                    </label>
                    <input
                      type="text"
                      required
                      value={qCorrectAnswer}
                      onChange={(e) => setQCorrectAnswer(e.target.value)}
                      placeholder="e.g. [1, 2, 3, 4, 5] or PASS"
                      className="h-[42px] px-4 rounded-xl border border-stroke bg-white text-sm font-semibold text-navy font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-stroke mt-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl border border-stroke text-text-body hover:bg-gray-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isQuestionAction}
                  className="px-5 py-2 rounded-xl bg-[#1C4ED1] text-white text-xs font-bold hover:bg-[#173FA8] transition-colors"
                >
                  {isQuestionAction ? 'Saving Question...' : editingQuestion ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUICK CREATE EXAM MODAL ────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-stroke bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-stroke pb-3">
              <h3 className="font-bold text-navy text-base flex items-center gap-2">
                <FileCheck2 className="text-[#1C4ED1]" size={18} />
                Create New Certification Exam
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-text-mute hover:text-navy text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewExam} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. System Architecture Certification Exam"
                  className="h-[42px] px-4 rounded-xl border border-stroke bg-white text-sm font-semibold text-navy focus:border-[#1C4ED1] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={360}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="h-[42px] px-4 rounded-xl border border-stroke bg-white text-sm font-semibold text-navy"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Pass Score (%)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newPassScore}
                    onChange={(e) => setNewPassScore(Number(e.target.value))}
                    className="h-[42px] px-4 rounded-xl border border-stroke bg-white text-sm font-semibold text-navy"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stroke mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-stroke text-text-body hover:bg-gray-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-[#1C4ED1] text-white text-xs font-bold hover:bg-[#173FA8] transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create & Link Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STUDENT LIVE TEST-DRIVE SIMULATOR MODAL ───────────────────────── */}
      {showSimulatorModal && questions.length > 0 && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-navy/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-2xl border border-stroke bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stroke pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold uppercase flex items-center gap-1">
                  <Eye size={14} />
                  Student Simulator Mode
                </span>
                <h3 className="font-bold text-navy text-base">{examTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulatorModal(false)}
                className="text-text-mute hover:text-navy text-sm font-bold p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sim Body */}
            <div className="flex flex-col gap-6 mt-4">
              {/* Timer Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFF] border border-stroke text-xs font-bold text-navy">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#1C4ED1]" />
                  <span>Time Remaining: {duration}:00 Mins</span>
                </div>
                <span>
                  Question {simActiveIndex + 1} of {questions.length}
                </span>
              </div>

              {/* Active Question Display */}
              {questions[simActiveIndex] && (
                <div className="flex flex-col gap-4 p-5 rounded-2xl border border-stroke bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#1C4ED1] uppercase tracking-wider">
                      Question {simActiveIndex + 1} • {questions[simActiveIndex].points} Points
                    </span>
                    <span className="text-xs font-bold text-text-mute">
                      {questions[simActiveIndex].type === 'coding' ? 'Coding Challenge' : 'Multiple Choice'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-navy">
                    {questions[simActiveIndex].question}
                  </h4>

                  {/* MCQ Options */}
                  {questions[simActiveIndex].type === 'mcq' &&
                    Array.isArray(questions[simActiveIndex].options) && (
                      <div className="flex flex-col gap-2.5 pt-2">
                        {questions[simActiveIndex].options.map((opt: string, optIdx: number) => {
                          const isSelected =
                            simAnswers[questions[simActiveIndex].id] === opt;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() =>
                                setSimAnswers({
                                  ...simAnswers,
                                  [questions[simActiveIndex].id]: opt
                                })
                              }
                              className={`p-3.5 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-[#1C4ED1] bg-[#1C4ED1]/10 text-[#1C4ED1] ring-1 ring-[#1C4ED1]'
                                  : 'border-stroke bg-white text-navy hover:bg-gray-50'
                              }`}
                            >
                              <span>{opt}</span>
                              <div
                                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-[#1C4ED1] bg-[#1C4ED1] text-white'
                                    : 'border-stroke'
                                }`}
                              >
                                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* Coding Simulator */}
                  {questions[simActiveIndex].type === 'coding' && (
                    <div className="flex flex-col gap-3 pt-2">
                      <textarea
                        rows={6}
                        value={
                          simAnswers[questions[simActiveIndex].id] ??
                          questions[simActiveIndex].codeContext ??
                          ''
                        }
                        onChange={(e) =>
                          setSimAnswers({
                            ...simAnswers,
                            [questions[simActiveIndex].id]: e.target.value
                          })
                        }
                        className="p-3.5 rounded-xl border border-stroke bg-navy text-emerald-400 font-mono text-xs outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sim Navigation */}
              <div className="flex items-center justify-between border-t border-stroke pt-4">
                <button
                  type="button"
                  disabled={simActiveIndex === 0}
                  onClick={() => setSimActiveIndex(simActiveIndex - 1)}
                  className="px-4 py-2 rounded-xl border border-stroke text-xs font-bold text-navy hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>

                {simActiveIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setSimActiveIndex(simActiveIndex + 1)}
                    className="px-5 py-2 rounded-xl bg-[#1C4ED1] text-white text-xs font-bold hover:bg-[#173FA8]"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      toast.success('Simulator finished! Exam workflow validated.');
                      setShowSimulatorModal(false);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                  >
                    Submit Exam (Test-Drive Complete)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
