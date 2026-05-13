'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface FlagToastProps {
  isVisible: boolean;
  onClose: () => void;
}

export const FlagToast = ({ isVisible, onClose }: FlagToastProps) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-[#16A34A] rounded-[12px] px-6 py-4 flex  items-center gap-4 shadow-[0px_12px_24px_rgba(4,11,55,0.25)] border border-white/10"
          data-node-id="9139:4236"
        >
          <div className="relative w-5 h-5 shrink-0">
            <Image src="/assets/dashboard/flag-01.svg" alt="Flag" fill className="object-contain invert brightness-0" />
          </div>
          <span className="text-white text-[14px] font-bold tracking-tight">
            Question Flagged Successfully
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
