'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  width?: 'fit-content' | '100%';
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export const Reveal = ({ 
  children, 
  width = '100%', 
  delay = 0.2, 
  duration = 0.5,
  yOffset = 50 
}: RevealProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width, overflow: 'visible' }}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: yOffset },
          visible: { opacity: 1, y: 0 },
        }}
        initial={false}
        animate={!hasMounted || isInView ? "visible" : "hidden"}
        transition={{ 
          duration, 
          delay, 
          ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for a "premium" feel
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
