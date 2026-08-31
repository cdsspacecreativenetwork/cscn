'use client';

import React, { useState } from 'react';
import { Rocket, ShieldAlert } from 'lucide-react';
import Button from '@/components/ui/Button';
import BoostApplicationModal from './BoostApplicationModal';

interface Props {
  verificationStatus?: string;
}

export default function PendingApprovalBanner({ verificationStatus }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (verificationStatus !== 'PENDING') return null;

  return (
    <>
      <div className="w-full bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-300/40 rounded-[14px] p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-[#040B37]">
              Your instructor profile is pending admin approval
            </h4>
            <p className="text-[13px] font-medium text-[#4B5563]">
              Submit additional background or CV details to stand out and speed up review.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 border-amber-500/40 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 font-semibold"
          leftIcon={<Rocket size={16} className="text-amber-600" />}
        >
          Boost application
        </Button>
      </div>

      <BoostApplicationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
