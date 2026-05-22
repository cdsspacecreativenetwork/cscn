'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  {
    q: 'What is CSCN?',
    a: 'CSCN (CDS Space Creative Network) is a global learning platform offering courses, mentorship, and community support to help creatives and professionals grow real-world skills.'
  },
  {
    q: 'What can I learn on CSCN?',
    a: 'You can learn design, product development, creative technology, and practical digital skills taught by industry professionals.'
  },
  {
    q: 'Do I need prior experience to start?',
    a: 'No experience is required. CSCN offers beginner-friendly learning paths designed to help you start and grow step by step.'
  },
  {
    q: 'Can I try a course before enrolling?',
    a: 'Yes. Selected courses offer previews so you can explore the learning experience before committing.'
  },
  {
    q: 'What do I gain as a community member?',
    a: 'You get access to mentorship, feedback, collaboration opportunities, and a network of creatives learning and building together.'
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First one open by default as in design

  return (
    <section className="py-24 bg-[#F4F6FB]">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-[2.5rem] md:text-[3rem] font-semibold text-navy leading-[1.24] tracking-tight font-inter">
            FAQs, clearly answered
          </h2>
        </div>

        {/* FAQ List */}
        <div className="max-w-[850px] mx-auto flex flex-col gap-6">
          {FAQS.map((faq, i) => (
            <FAQItem 
              key={i}
              question={faq.q}
              answer={faq.a}
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
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className={`w-10 h-10 rounded-full border border-[#C8D1E0] bg-white flex items-center justify-center transition-all duration-300 ${isOpen ? 'border-primary' : 'group-hover:border-primary/50'}`}>
          <div className="relative w-4 h-4">
            {/* Horizontal Line */}
            <div className={`absolute top-1/2 left-0 w-4 h-[2px] bg-[#9CA3AF] -translate-y-1/2 transition-colors ${isOpen ? 'bg-primary' : ''}`} />
            {/* Vertical Line */}
            <div className={`absolute top-0 left-1/2 w-[2px] h-4 bg-[#9CA3AF] -translate-x-1/2 transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0' : ''}`} />
          </div>
        </div>
      </div>

      {/* Content */}
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
