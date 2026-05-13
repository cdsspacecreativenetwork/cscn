'use client';

import React from 'react';
import { BaseModal } from '../../ui/BaseModal';
import Button from '../../ui/Button';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    type: string;
  };
  onConfirm: () => void;
}

const ModalSkeleton = ({ 
  isOpen, 
  onClose, 
  title, 
  type, 
  question, 
  actionLabel, 
  onConfirm 
}: ScheduleModalProps & { title: string; type: string; question: string; actionLabel: string }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col font-jakarta bg-white rounded-[16px] w-full max-w-[564px] overflow-hidden" data-node-id="9044:6707">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E3E8F4]" data-node-id="9044:6709">
          <h3 className="font-semibold text-[#4B5563] text-base leading-tight max-w-[85%]" data-node-id="9044:6710">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            data-node-id="9044:6711"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6" data-node-id="9044:6715">
          <div className="flex flex-col gap-4 items-start" data-node-id="9052:6759">
            <div className="flex items-center gap-2" data-node-id="9052:6760">
              <div className="size-2 rounded-full bg-[#DC2626]" data-node-id="9052:6749" />
              <span className="text-base font-medium text-[#9CA3AF] tracking-[-0.012em]" data-node-id="9052:6762">
                {type}
              </span>
            </div>
            <p className="text-base font-medium text-[#040B37] tracking-[-0.012em]" data-node-id="9052:6763">
              {question}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 flex items-center justify-end gap-6 border-t border-[#E3E8F4]" data-node-id="9044:6727">
          <Button
            variant="secondary"
            onClick={onClose}
            rounded="sm"
            className="w-[104px] bg-[#E3E8F4] !text-[#1C4ED1] hover:bg-[#D4DAE8]"
            data-node-id="9044:6728"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            rounded="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-[164px]"
            data-node-id="9044:6733"
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export const JoinSessionModal = (props: ScheduleModalProps) => (
  <ModalSkeleton 
    {...props} 
    title={props.event.title}
    type="Live Session"
    question="Are you ready to join session?"
    actionLabel="Join Session"
  />
);

export const SetReminderModal = (props: ScheduleModalProps) => (
  <ModalSkeleton 
    {...props} 
    title={props.event.title}
    type="Lesson"
    question="Are you ready to set reminder?"
    actionLabel="Set Reminder"
  />
);

export const ViewDetailsModal = (props: ScheduleModalProps) => (
  <ModalSkeleton 
    {...props} 
    title={props.event.title}
    type="Exam"
    question="Are you ready to view details?"
    actionLabel="Get Started"
  />
);
