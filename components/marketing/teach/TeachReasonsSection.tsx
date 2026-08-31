import React from 'react';
import { BookOpen, Users, Award } from 'lucide-react';

export default function TeachReasonsSection() {
  return (
    <section className="w-full bg-white">
      <div className="w-full max-w-[86rem] mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-[38px] font-semibold tracking-tight text-[#040B37] text-center mb-16">
          So many reasons to start
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 lg:gap-20 max-w-6xl mx-auto">
          {/* Reason 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 flex items-center justify-center text-[#040B37] mb-5">
              <BookOpen size={46} strokeWidth={1.4} />
            </div>
            <h3 className="text-xl font-bold text-[#040B37] mb-2.5">Teach your way</h3>
            <p className="text-sm sm:text-[14.5px] text-[#4B5563] leading-relaxed max-w-[300px]">
              Structure your courses, live cohorts, or 1-on-1 mentorship sessions around real-world tech projects with full creative freedom.
            </p>
          </div>

          {/* Reason 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 flex items-center justify-center text-[#040B37] mb-5">
              <Users size={46} strokeWidth={1.4} />
            </div>
            <h3 className="text-xl font-bold text-[#040B37] mb-2.5">Inspire ambitious creators</h3>
            <p className="text-sm sm:text-[14.5px] text-[#4B5563] leading-relaxed max-w-[300px]">
              Empower thousands of designers, engineers, and product builders worldwide to master industry skills and advance their careers.
            </p>
          </div>

          {/* Reason 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 flex items-center justify-center text-[#040B37] mb-5">
              <Award size={46} strokeWidth={1.4} />
            </div>
            <h3 className="text-xl font-bold text-[#040B37] mb-2.5">Earn & build authority</h3>
            <p className="text-sm sm:text-[14.5px] text-[#4B5563] leading-relaxed max-w-[300px]">
              Grow your personal brand, expand your global tech network, and unlock lucrative direct payouts on every enrollment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
