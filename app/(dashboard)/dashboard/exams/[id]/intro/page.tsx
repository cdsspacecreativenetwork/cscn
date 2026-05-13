'use client';

import React, { use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function ExamIntroPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col font-jakarta" data-node-id="9112:7222">
      {/* Top Header */}
      <div className="px-[clamp(16px,2.3vw,40px)] py-8">
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-[#4B5563] font-bold hover:text-[#1C4ED1] transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
          <span className="text-[16px]">Back</span>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="flex-grow flex items-center justify-center px-4 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] shadow-[0px_8px_32px_rgba(4,11,55,0.04)] border border-[#E3E8F4] w-full p-[clamp(24px,4vw,64px)] flex flex-col items-center text-center gap-12"
        >
          {/* Icon Header */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-20 h-20 bg-[#F4F6FB] rounded-full flex items-center justify-center" data-node-id="9112:7225">
               <div className="relative w-10 h-10">
                 <Image src="/assets/dashboard/certificate-01.svg" alt="Certificate" fill className="object-contain" />
               </div>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-[clamp(26px,1.85vw,32px)] font-bold text-[#040B37] tracking-[-0.02em]">
                Front-End Development Certification
              </h1>
              <p className="text-[16px] font-medium text-[#9CA3AF] tracking-tight">
                Final Certification Exam
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            <div className="bg-[#F4F6FB] p-6 py-8 rounded-[20px] flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em]">Format</span>
              <p className="text-[18px] font-bold text-[#040B37]">50 MCQs & 2 Code Challenges</p>
            </div>
            <div className="bg-[#F4F6FB] p-6 py-8 rounded-[20px] flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em]">Duration</span>
              <p className="text-[18px] font-bold text-[#040B37]">90 Minutes</p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-[#dc262614] border-[0.5px] border-[#DC2626] p-8 rounded-[20px] flex gap-5 text-left w-full" data-node-id="9112:7235">
            <div className="w-12 h-12 shrink-0 bg-[#dc262629] rounded-full flex items-center justify-center shadow-sm">
               <div className="relative w-6 h-6">
                 <Image src="/assets/dashboard/alert-01.svg" alt="Alert" fill className="object-contain" />
               </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[16px] font-bold text-[#991B1B] tracking-tight">Proctored Exam</h4>
              <p className="text-[14px] font-medium text-[#991B1B]/70 leading-[1.6]">
                This exam requires webcam and screen sharing. Exiting full-screen mode or switching tabs will result in an automatic failure. Ensure you have a stable connection before proceeding.
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="w-full flex justify-center pt-2">
            <Button 
              variant="primary" 
              size="lg" 
              rounded="[10px]"
              onClick={() => router.push(`/dashboard/exams/${id}/take`)}
              className="w-[180px] h-[54px] text-[16px] font-bold shadow-[0px_12px_24px_rgba(28,78,209,0.2)]"
            >
              Start Exam
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
