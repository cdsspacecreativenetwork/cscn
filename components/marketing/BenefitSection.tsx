'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function BenefitSection() {
  // Prevent right-click/download on the entire section
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const images = {
    left: '/assets/one/left.svg',
    middle: '/assets/one/learn from experts.svg',
    right: '/assets/one/right.svg'
  };

  return (
    <section className="py-24 bg-white overflow-hidden no-select" onContextMenu={handleContextMenu}>
      <div className="">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-[3rem] font-semibold text-navy leading-[1.2] tracking-tight font-inter">
            One class can change <br className="hidden md:block" /> everything.
          </h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-[1328px] mx-auto"
        >
          <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6">
            {/* Left Column Section */}
            <div className="flex-1 relative aspect-[426/600] group overflow-hidden rounded-[24px]">
              <Image 
                src={images.left}
                alt="Start from Zero"
                fill
                className="object-contain pointer-events-none select-none"
                draggable={false}
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
              {/* Invisible protection overlay */}
              <div className="absolute inset-0 z-20 cursor-default" />
            </div>

            {/* Middle Column Section */}
            <div className="flex-1 relative aspect-[426/600] group overflow-hidden rounded-[24px]">
              <Image 
                src={images.middle}
                alt="Learn from Professionals"
                fill
                className="object-contain pointer-events-none select-none"
                draggable={false}
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
              {/* Invisible protection overlay */}
              <div className="absolute inset-0 z-20 cursor-default" />
            </div>

            {/* Right Column Section */}
            <div className="flex-1 relative aspect-[426/600] group overflow-hidden rounded-[24px]">
              <Image 
                src={images.right}
                alt="Create Portfolio"
                fill
                className="object-contain pointer-events-none select-none"
                draggable={false}
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
              {/* Invisible protection overlay */}
              <div className="absolute inset-0 z-20 cursor-default" />
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .no-select {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-user-drag: none;
          -webkit-touch-callout: none;
        }
      `}</style>
    </section>
  );
}
