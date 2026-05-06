'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CourseCard from '@/components/ui/CourseCard';
import type { Course } from '@/lib/api';
import Button from '@/components/ui/Button';

import { motion } from 'framer-motion';

interface CoursesSectionProps {
  initialCourses: Course[];
}

const CATEGORIES = ['All', 'Design', 'Development', 'AI', 'Brand'] as const;

export default function CoursesSection({ initialCourses }: CoursesSectionProps) {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-25 bg-white overflow-hidden"
    >
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center mb-16 text-center"
        >
          <h2 className="text-[2.5rem] md:text-[3rem] font-semibold mb-6 leading-[1.2] tracking-tight text-navy font-inter">
            Learn. Build. Level Up.
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {initialCourses.map((course, i) => (
            <motion.div 
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <CourseCard {...course} />
            </motion.div>
          ))}
        </div>

        {initialCourses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-navy mb-2">More courses coming soon!</h3>
            <p className="text-text-mute">We're currently preparing new content.</p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
