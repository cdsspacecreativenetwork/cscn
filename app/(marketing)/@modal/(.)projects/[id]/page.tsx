'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { PROJECTS_DETAILS } from '@/lib/projects';
import { useParams } from 'next/navigation';

export default function ProjectSidebarModal() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const project = PROJECTS_DETAILS[id];
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: scrollRef,
  });

  // Dynamic transforms for the collapsing header
  const rawHeaderHeight = useTransform(scrollYProgress, [0, 0.2], [400, 180]);
  const rawTitleScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.85]);
  const rawTitleY = useTransform(scrollYProgress, [0, 0.2], [0, -15]);
  const rawOverlayOpacity = useTransform(scrollYProgress, [0, 0.2], [0.6, 0.85]);

  // Spring physics for smoothness
  const springConfig = { damping: 30, stiffness: 200, mass: 0.5 };
  const headerHeight = useSpring(rawHeaderHeight, springConfig);
  const titleScale = useSpring(rawTitleScale, springConfig);
  const titleY = useSpring(rawTitleY, springConfig);
  const overlayOpacity = useSpring(rawOverlayOpacity, springConfig);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  if (!project) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => router.back()}
          className="absolute inset-0 bg-navy/40 backdrop-blur-sm cursor-pointer"
        />

        {/* Sidebar Content */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-[600px] h-full bg-white shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Collapsing Header Image Area */}
          <motion.div 
            style={{ height: headerHeight }}
            className="relative w-full flex-shrink-0 z-20 overflow-hidden"
          >
            <Image 
              src={project.image} 
              alt={project.title} 
              fill 
              className="object-cover" 
              priority
            />
            {/* Close Button */}
            <button 
              onClick={() => router.back()}
              className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-navy transition-all z-30"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
            
            <motion.div 
              style={{ opacity: overlayOpacity }}
              className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" 
            />
            
            <motion.div 
              style={{ scale: titleScale, y: titleY }}
              className="absolute bottom-6 left-8 right-8 origin-bottom-left"
            >
              <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block">
                CSCN Project
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {project.title}
              </h1>
            </motion.div>
          </motion.div>

          {/* Details Area (Scrollable) */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 custom-scrollbar pt-10"
          >
            {/* Student Info */}
            <div className="flex items-center gap-4 mb-10 pb-8 border-b border-stroke">
              <div className="w-16 h-16 rounded-2xl bg-background border border-stroke flex items-center justify-center text-2xl font-bold text-primary">
                {project.student.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-text-mute uppercase tracking-wider mb-1">Created By</p>
                <h3 className="text-xl font-bold text-navy">{project.student}</h3>
              </div>
            </div>

            {/* Course & Instructor */}
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div>
                <p className="text-sm font-medium text-text-mute uppercase tracking-wider mb-2">Course</p>
                <p className="text-base font-semibold text-navy leading-snug">{project.course}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-text-mute uppercase tracking-wider mb-2">Instructor</p>
                <p className="text-base font-semibold text-navy">{project.instructor}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-10">
              <p className="text-sm font-medium text-text-mute uppercase tracking-wider mb-4">Project Brief</p>
              <p className="text-lg text-text-body leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Outcomes/Highlights */}
            <div className="mb-10">
              <p className="text-sm font-medium text-text-mute uppercase tracking-wider mb-4">Key Outcomes</p>
              <div className="space-y-3">
                {project.outcomes.map((outcome, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <p className="text-base text-navy font-medium">{outcome}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="mb-12">
              <p className="text-sm font-medium text-text-mute uppercase tracking-wider mb-4">Tools Used</p>
              <div className="flex flex-wrap gap-2">
                {project.tools.map((tool, i) => (
                  <span key={i} className="px-4 py-2 bg-background border border-stroke rounded-xl text-sm font-semibold text-navy">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button className="w-full bg-navy text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary transition-colors flex items-center justify-center gap-3 group">
              Start Learning Like {project.student.split(' ')[0]}
              <svg className="group-hover:translate-x-1 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
