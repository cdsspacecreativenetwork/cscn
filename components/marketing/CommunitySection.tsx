'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Project {
  id: string;
  img: string;
  height: number;
}

interface CommunitySectionProps {
  initialAvatars?: string[];
  initialProjects?: Project[];
}

const DEFAULT_AVATARS = [
  '/assets/projects/cartoon-man-wearing-glasses.svg',
  '/assets/projects/2d800191-fe2a-4f40-9f32-d6aeb7bde3df.svg',
  '/assets/projects/9439678.svg',
  '/assets/projects/3d-rendering-zoom-call-avatar.svg',
  '/assets/projects/46944d8a-fe90-442a-a288-75f50fa34ca3.svg',
  '/assets/projects/9434619.svg',
  '/assets/projects/memoji-african-american-man-white-background-emoji (1).svg',
  '/assets/projects/10496273.svg',
  '/assets/projects/dugb_o5sj_230522.svg',
  '/assets/projects/9334392.svg'
];

const DEFAULT_PROJECTS = [
  { id: '1', img: '/assets/projects/start from zero.svg', height: 344 },
  { id: '2', img: '/assets/projects/start from zero-1.svg', height: 240 },
  { id: '3', img: '/assets/projects/start from zero-2.svg', height: 240 },
  { id: '4', img: '/assets/projects/start from zero-3.svg', height: 344 },
  { id: '5', img: '/assets/projects/start from zero-4.svg', height: 344 },
  { id: '6', img: '/assets/projects/start from zero-5.svg', height: 240 },
  { id: '7', img: '/assets/projects/start from zero-6.svg', height: 240 },
  { id: '8', img: '/assets/projects/start from zero-7.svg', height: 344 },
  { id: '9', img: '/assets/projects/start from zero-8.svg', height: 344 },
  { id: '10', img: '/assets/projects/start from zero-9.svg', height: 240 }
];

export default function CommunitySection({ 
  initialAvatars = DEFAULT_AVATARS, 
  initialProjects = DEFAULT_PROJECTS 
}: CommunitySectionProps) {
  return (
    <motion.section 
      id="community" 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-24 bg-white overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 md:mb-16 gap-6 md:gap-8 px-0">
          <div className="flex flex-col gap-4 md:gap-6 w-full lg:max-w-[650px]">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-[2.25rem] md:text-[3rem] font-semibold text-navy leading-[1.1] tracking-tighter font-inter break-words"
            >
              A Community of Creatives
            </motion.h2>
            
            {/* Avatars + Text */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 md:gap-3 bg-background border border-stroke-ii rounded-full p-1.5 md:p-2 pr-4 md:pr-5 w-fit shadow-sm max-w-full"
            >
              <div className="flex items-center ml-2 md:ml-3">
                {initialAvatars.map((avatar, i) => (
                  <div 
                    key={i} 
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white bg-white overflow-hidden -ml-2 md:-ml-3 first:ml-0 relative shadow-sm ${i > 4 ? 'hidden md:block' : ''}`}
                    style={{ zIndex: initialAvatars.length - i }}
                  >
                    <Image
                      src={avatar}
                      alt="Avatar"
                      fill
                      className="object-cover"
                      sizes="32px"
                      unoptimized={avatar.endsWith('.svg')}
                    />
                  </div>
                ))}
                {/* Mobile "+" indicator */}
                <div className="md:hidden w-7 h-7 rounded-full border-2 border-white bg-[#F4F6FB] flex items-center justify-center -ml-2 z-0">
                  <span className="text-[10px] font-bold text-primary">+{initialAvatars.length - 5}</span>
                </div>
              </div>
              <span className="text-[11px] md:text-sm font-medium text-text-body font-inter whitespace-nowrap overflow-hidden text-ellipsis">
                Class projects by students
              </span>
            </motion.div>
          </div>

          <motion.p 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-base md:text-lg font-medium text-text-body max-w-full lg:max-w-[340px] leading-relaxed font-inter lg:text-right"
          >
            Get inspired, share your work, and grow your skills with people like you.
          </motion.p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 px-0 mb-16">
          {/* Column 1 */}
          <div className="flex flex-col gap-2 md:gap-4">
            <ProjectImage id={initialProjects[0].id} src={initialProjects[0].img} height={initialProjects[0].height} />
            <ProjectImage id={initialProjects[1].id} src={initialProjects[1].img} height={initialProjects[1].height} />
          </div>
          {/* Column 2 */}
          <div className="flex flex-col gap-2 md:gap-4">
            <ProjectImage id={initialProjects[2].id} src={initialProjects[2].img} height={initialProjects[2].height} />
            <ProjectImage id={initialProjects[3].id} src={initialProjects[3].img} height={initialProjects[3].height} />
          </div>
          {/* Column 4 */}
          <div className="flex flex-col gap-2 md:gap-4 md:hidden lg:flex">
            <ProjectImage id={initialProjects[6].id} src={initialProjects[6].img} height={initialProjects[6].height} />
            <ProjectImage id={initialProjects[7].id} src={initialProjects[7].img} height={initialProjects[7].height} />
          </div>
          {/* Column 3 */}
          <div className="flex flex-col gap-2 md:gap-4">
            <ProjectImage id={initialProjects[4].id} src={initialProjects[4].img} height={initialProjects[4].height} />
            <ProjectImage id={initialProjects[5].id} src={initialProjects[5].img} height={initialProjects[5].height} />
          </div>
          {/* Column 5 */}
          <div className="flex flex-col gap-2 md:gap-4 hidden lg:flex">
            <ProjectImage id={initialProjects[8].id} src={initialProjects[8].img} height={initialProjects[8].height} />
            <ProjectImage id={initialProjects[9].id} src={initialProjects[9].img} height={initialProjects[9].height} />
          </div>
        </div>

        {/* CTA Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center px-4"
        >
          <div className="p-[2px] border border-[#648EFC] rounded-full bg-background shadow-sm active:scale-95 transition-transform group">
            <button className="bg-gradient-to-br from-[#0035C1] to-[#0575FF] text-white px-10 py-4 rounded-full font-semibold text-lg hover:brightness-110 transition-all font-inter shadow-md">
              Get a course today
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function ProjectImage({ id, src, height }: { id: string; src: string; height: number }) {
  return (
    <Link href={`/projects/${id}`} scroll={false}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-500"
        style={{ height: `${height}px` }}
      >
        <Image 
          src={src} 
          alt="Student Project" 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-in-out" 
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 220px"
          unoptimized={src.endsWith('.svg')}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </motion.div>
    </Link>
  );
}
