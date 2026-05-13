'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ExamHeader } from '@/components/dashboard/exams/ExamHeader';
import { QuestionMap, QuestionStatus } from '@/components/dashboard/exams/QuestionMap';
import { QuestionRenderer, QuestionData } from '@/components/dashboard/exams/QuestionRenderer';
import { FlagToast } from '@/components/dashboard/exams/FlagToast';
import { EndExamModal } from '@/components/dashboard/exams/EndExamModal';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import Button from '@/components/ui/Button';

// 50+ Frontend Certification Questions
const MOCK_QUESTIONS: QuestionData[] = [
  {
    id: 1,
    type: 'mcq',
    question: "What is the primary purpose of the 'alt' attribute on an <img> tag?",
    options: ["To style the image", "To provide a text alternative for screen readers", "To define the image source", "To link to another page"]
  },
  {
    id: 2,
    type: 'mcq',
    question: "Which CSS property is used to control the layout of child elements in a flexible container?",
    options: ["float", "position", "display: flex", "align-content"]
  },
  {
    id: 3,
    type: 'coding',
    question: "Implement a function 'isPalindrome' that checks if a given string reads the same forwards and backwards.",
    codeContext: `function isPalindrome(str) {\n  // Your solution here\n}`,
    placeholder: "Write your solution here..."
  },
  {
    id: 4,
    type: 'mcq',
    question: "What does the 'defer' attribute in a <script> tag do?",
    options: ["Executes the script immediately", "Loads the script in parallel and executes after DOM parsing", "Blocks DOM parsing until script is loaded", "Ignores the script"]
  },
  {
    id: 5,
    type: 'mcq',
    question: "In React, what is the 'useEffect' hook primarily used for?",
    options: ["Updating local state", "Handling side effects like data fetching", "Creating new components", "Defining routes"]
  },
  // Adding more questions to reach 50...
  ...Array.from({ length: 45 }, (_, i) => ({
    id: i + 6,
    type: (i + 6) % 10 === 0 ? 'coding' : 'mcq' as any,
    question: `Advanced Frontend Assessment Question ${i + 6}: Deep dive into ${(i + 6) % 2 === 0 ? 'JavaScript Closures' : 'CSS Grid Performance'}.`,
    options: (i + 6) % 10 !== 0 ? ["Option A", "Option B", "Option C", "Option D"] : undefined,
    codeContext: (i + 6) % 10 === 0 ? `function solveChallenge${i + 6}() {\n  // Implement logic here\n}` : undefined
  }))
];

export default function ExamTakePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // UI State
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  const currentQuestion = MOCK_QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === MOCK_QUESTIONS.length - 1;

  const handleAnswerChange = (val: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
        setIsToastVisible(true);
      }
      return next;
    });
  };

  const questionStatuses: QuestionStatus[] = MOCK_QUESTIONS.map((q, idx) => ({
    id: q.id,
    status: idx === currentIndex ? 'current' : flagged.has(q.id) ? 'flagged' : answers[q.id] ? 'answered' : 'unanswered'
  }));

  const handleEndExam = () => {
    setIsEndModalOpen(true);
  };

  const confirmEndExam = () => {
    router.push('/dashboard/schedule?completed=3'); // Mock exam ID 3 completed
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col font-jakarta">
      <ExamHeader
        title="Front-End Development Certification"
        initialTime={5400} // 90 minutes
        onSubmit={handleEndExam}
        onExit={() => router.push('/dashboard/schedule')}
      />

      <div className="flex-grow flex flex-col lg:flex-row gap-6 lg:gap-10 px-4 md:px-[clamp(16px,2.3vw,40px)] py-6 md:py-10 max-w-[1728px] mx-auto w-full">
        {/* Main Area */}
        <div className="flex-grow bg-white rounded-[20px] md:rounded-[24px] shadow-sm border border-[#E3E8F4] overflow-hidden flex flex-col h-fit lg:sticky lg:top-[136px] z-10">
          <div className="flex-grow p-6 md:p-[clamp(24px,4.6vw,60px)] min-h-[400px] md:min-h-[600px] max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
            <QuestionRenderer
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswerChange={handleAnswerChange}
            />
          </div>

          {/* Navigation Bar */}
          <div className="px-4 md:px-[clamp(16px,4vw,60px)] py-6 md:py-8 border-t border-[#E3E8F4] flex items-center justify-between bg-white gap-2 md:gap-4 overflow-hidden shrink-0">
            <Button 
              variant="secondary" 
              rounded="[10px]"
              className="bg-[#F4F6FB] !text-[#1C4ED1] h-[48px] md:h-[52px] px-3! md:px-8! font-bold whitespace-nowrap shrink-0"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              leftIcon={<ArrowLeft size={18} />}
              disabled={currentIndex === 0}
            >
              <span className="hidden xl:inline">Previous</span>
              <span className="hidden md:inline xl:hidden">Prev</span>
            </Button>

            <Button 
              variant="outline" 
              rounded="[10px]"
              className={`h-[48px] md:h-[52px] px-4! md:px-10! border-[#E3E8F4] font-bold whitespace-nowrap shrink-0 ${flagged.has(currentQuestion.id) ? 'bg-orange-50 border-orange-200 text-orange-600' : ''}`}
              onClick={toggleFlag}
              leftIcon={<Flag size={18} className={flagged.has(currentQuestion.id) ? 'fill-orange-600' : ''} />}
            >
              <span className="hidden xl:inline">{flagged.has(currentQuestion.id) ? 'Flagged' : 'Flag Question'}</span>
              <span className="hidden md:inline xl:hidden">Flag</span>
              <span className="md:hidden">Flag</span>
            </Button>

            <Button 
              variant="primary" 
              rounded="[10px]"
              className="h-[48px] md:h-[52px] px-3! md:px-10! font-bold whitespace-nowrap shrink-0"
              onClick={() => {
                if (isLastQuestion) handleEndExam();
                else setCurrentIndex(prev => Math.min(MOCK_QUESTIONS.length - 1, prev + 1));
              }}
              rightIcon={!isLastQuestion ? <ArrowRight size={18} /> : undefined}
            >
              <span className="hidden xl:inline">{isLastQuestion ? 'End Exam' : 'Next Question'}</span>
              <span className="hidden md:inline xl:hidden">{isLastQuestion ? 'End' : 'Next'}</span>
              {/* <span className="md:hidden">{isLastQuestion ? 'End' : 'Next'}</span> */}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-[400px] shrink-0">
          <QuestionMap
            questions={questionStatuses}
            currentIndex={currentIndex}
            onJumpTo={(idx) => setCurrentIndex(idx)}
          />
        </div>
      </div>

      <FlagToast
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />

      <EndExamModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        onConfirm={confirmEndExam}
        stats={{
          answered: Object.keys(answers).length,
          total: MOCK_QUESTIONS.length
        }}
      />
    </div>
  );
}
