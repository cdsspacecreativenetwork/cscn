'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type FAQEntry = {
  question: string;
  answer: string;
};

const HOME_FAQS: FAQEntry[] = [
  {
    question: 'What is CSCN?',
    answer: 'CSCN (CDS Space Creative Network) is a global learning platform offering courses, mentorship, and community support to help creatives and professionals grow real-world skills.',
  },
  {
    question: 'What can I learn on CSCN?',
    answer: 'You can learn design, product development, creative technology, and practical digital skills taught by industry professionals.',
  },
  {
    question: 'Do I need prior experience to start?',
    answer: 'No experience is required. CSCN offers beginner-friendly learning paths designed to help you start and grow step by step.',
  },
  {
    question: 'Can I try a course before enrolling?',
    answer: 'Yes. Selected courses offer previews so you can explore the learning experience before committing.',
  },
  {
    question: 'What do I gain as a community member?',
    answer: 'You get access to mentorship, feedback, collaboration opportunities, and a network of creatives learning and building together.',
  },
];

type FAQSectionProps = {
  title?: string;
  items?: FAQEntry[];
  sectionClassName?: string;
  defaultOpenIndex?: number | null;
};

export default function FAQSection({
  title = 'FAQs, clearly answered',
  items = HOME_FAQS,
  sectionClassName = 'py-24',
  defaultOpenIndex = 0,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  return (
    <section className={`bg-[#F4F6FB] ${sectionClassName}`}>
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] md:text-[3rem] font-semibold text-navy leading-[1.24] tracking-tight font-inter">
            {title}
          </h2>
        </div>

        <div className="max-w-[850px] mx-auto flex flex-col gap-6">
          {items.map((faq, i) => (
            <FAQItem 
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ 
  question, 
  answer, 
  isOpen, 
  onClick 
}: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onClick: () => void;
}) {
  return (
    <div className="flex gap-4 md:gap-6 group cursor-pointer" onClick={onClick}>
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 rounded-full border border-stroke-ii ${isOpen ? 'bg-text-mute' : 'bg-stroke-ii'} flex items-center justify-center transition-all duration-300`}>
          <div className={`relative w-4 h-4`}>
            <div className={`absolute top-1/2 left-0 w-4 h-[2px] bg-white -translate-y-1/2 transition-colors ${isOpen ? 'bg-stroke-ii' : ''}`} />
            <div className={`absolute top-0 left-1/2 w-[2px] h-4 bg-white -translate-x-1/2 transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0' : ''}`} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 pb-6 border-b border-[#C8D1E0]">
        <h4 className={`text-lg font-medium leading-tight font-inter transition-colors ${isOpen ? 'text-navy' : 'text-[#040B37]'}`}>
          {question}
        </h4>
        
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <p className="text-base font-medium text-[#4B5563] leading-relaxed font-inter pr-4">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
