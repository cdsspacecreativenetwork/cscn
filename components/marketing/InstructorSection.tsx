'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Instructor {
  name: string;
  role: string;
  image: string;
  slug: string;
}

interface InstructorSectionProps {
  instructors?: Instructor[];
}

const DEFAULT_INSTRUCTORS: Instructor[] = [
  {
    name: 'Chris\nJohn',
    role: 'Full-Stack Designer',
    image: '/assets/instructors/Frame 2147238910-5.svg',
    slug: 'chris-john',
  },
  {
    name: 'Ayomide\nAjayi',
    role: 'Digital Designer',
    image: '/assets/instructors/img.svg',
    slug: 'ayomide-ajayi',
  },
  {
    name: 'Honest\nErnest',
    role: 'Product Designer',
    image: '/assets/instructors/img-1.svg',
    slug: 'honest-ernest',
  },
  {
    name: 'Baribor\nDuba',
    role: 'Product Designer',
    image: '/assets/instructors/img.png',
    slug: 'baribor-duba',
  }
];

export default function InstructorSection({ instructors = DEFAULT_INSTRUCTORS }: InstructorSectionProps) {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="py-24 bg-white overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[83rem] px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-[2.5rem] font-semibold text-navy leading-[1.24] tracking-tight font-inter"
          >
            Learn from Creative<br className="hidden md:block" /> Professionals
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-text-body max-w-[550px] text-base font-medium font-inter"
          >
            CSCN instructors are industry professionals sharing real tools, proven techniques, and practical experience to help you grow faster.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {instructors.map((instructor, i) => (
            <Link key={i} href={`/instructor/${instructor.slug}`} className="block">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="relative h-[400px] w-full rounded-3xl overflow-hidden group cursor-pointer"
              >
                {/* Background Image */}
                <div className="absolute inset-0 bg-gray-200">
                  <Image 
                    src={instructor.image} 
                    alt={instructor.name.replace('\n', ' ')} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                    unoptimized={instructor.image.endsWith('.svg')}
                  />
                </div>

                {/* Dark Vignette/Blur Base */}
                <div className="absolute bottom-[-150px] left-[-20px] w-[301px] h-[304px] bg-black/60 blur-[100px] rounded-full pointer-events-none" />

                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col items-center justify-end text-center z-10">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-sm font-medium text-[#E3E8F4] uppercase tracking-tight font-inter opacity-80">
                      Instructor
                    </span>
                    <h3 className="text-[34px] font-semibold text-white leading-[1.04] tracking-tight whitespace-pre-line font-inter">
                      {instructor.name}
                    </h3>
                    <span className="text-sm font-medium text-[#E3E8F4] font-inter opacity-80">
                      {instructor.role}
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
