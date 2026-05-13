'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type QuestionType = 'mcq' | 'coding' | 'asset';

export interface QuestionData {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  codeContext?: string;
  placeholder?: string;
}

interface QuestionRendererProps {
  question: QuestionData;
  answer?: string;
  onAnswerChange: (answer: string) => void;
}

export const QuestionRenderer = ({ question, answer, onAnswerChange }: QuestionRendererProps) => {
  return (
    <div className="flex flex-col gap-10 font-jakarta">
      <div className="flex flex-col gap-4">
        <span className="text-[14px] font-bold text-[#9CA3AF] uppercase tracking-wider">
          Question {question.id} of 50
        </span>
        <h2 className="text-[clamp(18px,1.4vw,24px)] font-bold text-[#040B37] leading-snug tracking-tight">
          {question.question}
        </h2>
      </div>

      {/* MCQ Type */}
      {question.type === 'mcq' && question.options && (
        <div className="flex flex-col gap-4">
          {question.options.map((option, idx) => {
            const isSelected = answer === option;
            return (
              <label 
                key={idx}
                className={`
                  flex items-center gap-4 p-6 rounded-[16px] border cursor-pointer transition-all duration-300 group
                  ${isSelected ? 'bg-[#1C4ED1]/5 border-[#1C4ED1]' : 'bg-white border-[#E3E8F4] hover:border-[#1C4ED1]/50'}
                `}
              >
                <input 
                  type="radio" 
                  name={`q-${question.id}`}
                  className="hidden"
                  checked={isSelected}
                  onChange={() => onAnswerChange(option)}
                />
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected ? 'border-[#1C4ED1]' : 'border-[#E3E8F4] group-hover:border-[#1C4ED1]/50'}
                `}>
                  {isSelected && <div className="w-3 h-3 rounded-full bg-[#1C4ED1]" />}
                </div>
                <span className={`text-[16px] font-semibold ${isSelected ? 'text-[#1C4ED1]' : 'text-[#4B5563]'}`}>
                  {option}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {/* Coding Type */}
      {question.type === 'coding' && (
        <div className="flex flex-col gap-6">
          {question.codeContext && (
            <div className="bg-[#040B37] rounded-[16px] p-8 font-mono text-[14px] text-white/90 leading-relaxed overflow-x-auto border border-white/10">
              <pre className="whitespace-pre-wrap">
                <code>{question.codeContext}</code>
              </pre>
            </div>
          )}
          <textarea
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={question.placeholder || "Write your solution here..."}
            className="w-full h-[300px] bg-[#F4F6FB] rounded-[20px] p-8 text-[16px] font-medium text-[#4B5563] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1C4ED1]/20 border border-transparent focus:border-[#1C4ED1]/50 transition-all resize-none"
          />
        </div>
      )}
    </div>
  );
};
