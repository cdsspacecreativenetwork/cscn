'use client';

import React from 'react';
import { BaseModal } from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';

interface EndExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  stats: {
    answered: number;
    total: number;
  };
}

export const EndExamModal = ({ isOpen, onClose, onConfirm, stats }: EndExamModalProps) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-[24px] p-6 md:p-10 flex flex-col items-center text-center gap-6 md:gap-8 w-[calc(100vw-32px)] max-w-[516px] font-jakarta" data-node-id="9147:4340">
        <div className="flex flex-col gap-3">
          <h3 className="text-[20px] md:text-[24px] font-bold text-[#040B37] tracking-tight">
            Are you sure you want to end exam?
          </h3>
          <p className="text-[14px] md:text-[16px] font-medium text-[#9CA3AF] leading-relaxed px-2">
            You have answered {stats.answered} out of {stats.total} questions. You won't be able to change your answers after submitting.
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-6 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            rounded="[10px]"
            className="flex-1 bg-[#F4F6FB] !text-[#1C4ED1] h-[48px] md:h-[58px] text-[13px] md:text-[16px] font-bold whitespace-nowrap px-2"
          >
            Return to Exam
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            rounded="[10px]"
            className="flex-1 h-[48px] md:h-[58px] text-[13px] md:text-[16px] font-bold shadow-[0px_8px_16px_rgba(28,78,209,0.2)] whitespace-nowrap px-2"
          >
            End & Submit
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
