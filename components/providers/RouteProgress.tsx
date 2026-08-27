'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Finish loading when pathname or searchParams change
  useEffect(() => {
    if (isLoading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Listen to global click events on internal links to start progress immediately
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      // Ignore external links, anchor links (#), or _blank targets
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        targetAttr === '_blank' ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      // Check if it is an internal route transition
      try {
        const currentUrl = new URL(window.location.href);
        const destinationUrl = new URL(href, window.location.href);

        if (
          currentUrl.origin === destinationUrl.origin &&
          (currentUrl.pathname !== destinationUrl.pathname ||
            currentUrl.search !== destinationUrl.search)
        ) {
          setIsLoading(true);
          setProgress(25);
          // Increment progress slightly while waiting
          setTimeout(() => setProgress(65), 150);
          setTimeout(() => setProgress(85), 400);
        }
      } catch {
        // Fallthrough if invalid URL string
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none bg-[#E3E8F4]"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#1C4ED1] via-[#3B82F6] to-[#60A5FA] shadow-[0_0_10px_rgba(28,78,209,0.5)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
