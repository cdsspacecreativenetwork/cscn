'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Stat, Tool } from '@/lib/api';

interface StatsSectionProps {
  initialData: {
    mainStats: Stat[];
    tools: Tool[];
  };
}

export default function StatsSection({ initialData }: StatsSectionProps) {
  const { mainStats, tools } = initialData;

  // Split tools for two marquee rows
  const row1 = tools.slice(0, 5);
  const row2 = tools.slice(5, 10);

  return (
    <section className="py-10 bg-background overflow-hidden">
      <div className="container flex flex-col items-center gap-12">
        
        {/* Main Stats Cards */}
        <div className="flex flex-wrap justify-center items-center gap-4 flex-col md:flex-row w-full px-4">
          {mainStats.map((stat: Stat, i: number) => (
            <motion.div 
              key={stat.id}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
              className={`w-full md:w-[11.625rem] p-6 md:p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                stat.type === 'rating' ? 'bg-navy text-white' : 'bg-white text-navy'
              } border border-stroke md:border-none shadow-sm md:shadow-none`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[2.5rem] md:text-[2rem] font-bold leading-tight tracking-tight">
                  {stat.value}
                </span>
                {stat.type === 'rating' && (
                  <div className="w-8 h-8 relative">
                    <Image src="/assets/icons/star.svg" alt="Star" fill className="object-contain" />
                  </div>
                )}
              </div>
              <span className={`text-lg md:text-base font-medium tracking-tight whitespace-nowrap ${
                stat.type === 'rating' ? 'text-stroke-ii' : 'text-text-body'
              }`}>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Tools Pills Track */}
        <div className="w-full relative py-4">
          {/* Desktop Layout (Static/Hover rows) */}
          <div className="hidden md:flex flex-col items-center gap-[0.75rem] w-full">
            <div className="flex flex-wrap justify-center items-center gap-[0.75rem] w-full">
              {tools.slice(0, 5).map((tool: Tool) => (
                <ToolPill key={tool.id} tool={tool} />
              ))}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-[0.75rem] w-full">
              {tools.slice(5, 9).map((tool: Tool) => (
                <ToolPill key={tool.id} tool={tool} />
              ))}
            </div>
          </div>

          {/* Mobile Layout (Infinite Horizontal Marquee) */}
          <div className="flex md:hidden flex-col gap-6 w-full">
            {/* Row 1: Right to Left */}
            <div className="flex overflow-hidden group">
              <motion.div 
                className="flex gap-4 pr-4 whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ 
                  duration: 20, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              >
                {[...row1, ...row1].map((tool, i) => (
                  <ToolPill key={`${tool.id}-${i}`} tool={tool} />
                ))}
              </motion.div>
            </div>

            {/* Row 2: Left to Right */}
            <div className="flex overflow-hidden group">
              <motion.div 
                className="flex gap-4 pr-4 whitespace-nowrap"
                animate={{ x: ["-50%", "0%"] }}
                transition={{ 
                  duration: 25, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              >
                {[...row2, ...row2].map((tool, i) => (
                  <ToolPill key={`${tool.id}-${i}`} tool={tool} />
                ))}
              </motion.div>
            </div>
          </div>
          
          {/* Gradient Fades for Marquee */}
          <div className="md:hidden absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
          <div className="md:hidden absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
}

function ToolPill({ tool }: { tool: Tool }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.03 }}
      className="flex items-center justify-center gap-2 px-4 py-3 rounded-full border border-stroke-ii bg-white/50 backdrop-blur-sm hover:bg-white hover:border-primary/20 transition-all duration-300 group shadow-sm"
    >
      <div className="w-5 h-5 relative opacity-80 group-hover:opacity-100 transition-opacity">
        <Image src={tool.icon} alt={tool.name} fill className="object-contain" />
      </div>
      <span className="text-[0.875rem] md:text-base font-medium text-text-body whitespace-nowrap group-hover:text-navy transition-colors">
        {tool.name}
      </span>
    </motion.div>
  );
}