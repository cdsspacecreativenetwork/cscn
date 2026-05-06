'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function CoursesHero() {
  return (
    <section className="pt-40 pb-20 bg-white relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -translate-x-1/2 pointer-events-none" />

      <div className="container relative z-10">
        <div className="max-w-[720px] flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 px-3 py-1 bg-[#F4F6FB] rounded-full w-fit border border-stroke">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Industry Vetted</span>
            </div>
            <h1 className="text-4xl md:text-[4rem] font-semibold text-navy leading-[1.05] tracking-tight font-inter">
              Choose Your Path <br /> to <span className="text-primary italic">Mastery.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-text-body font-medium leading-relaxed font-inter max-w-[600px]"
          >
            Discover industry-vetted courses designed to help you build real skills, launch your career, and grow as a creative professional.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
