'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ResourceCard from '@/components/ui/ResourceCard';
import { RESOURCES, type Resource } from '@/lib/resources';

const CATEGORIES = ['All Resources', 'Mockups', 'Templates', 'Assets'] as const;

// --- Custom Dropdown Component (Matches Courses Page) ---
interface DropdownProps {
  options: readonly string[] | string[];
  selected: string;
  onChange: (value: string) => void;
}

const CustomDropdown = ({ options, selected, onChange }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full md:w-fit" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white border border-[#C8D1E0] rounded-sm px-4 py-2.5 text-[14px] font-medium text-[#040B37] transition-all group cursor-pointer md:min-w-[160px] w-full hover:border-primary/30"
      >
        <span className="whitespace-nowrap mr-2">{selected}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 flex items-center justify-center opacity-50"
        >
          <Image src="/assets/courses/arrow-down-01.svg" alt="" width={20} height={20} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[100] right-0 mt-2 bg-white border border-[#C8D1E0] rounded-sm shadow-2xl overflow-hidden p-1 min-w-full w-max"
          >
            <div className="flex flex-col gap-0.5">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-sm text-base font-medium transition-all text-left whitespace-nowrap ${selected === option
                    ? 'bg-[#1C4ED1] text-white'
                    : 'text-[#4B5563] hover:bg-[#F4F6FB] hover:text-[#1C4ED1]'
                    }`}
                >
                  <span className="pr-2">{option}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ResourcesFilter() {
  const [activeCategory, setActiveCategory] = useState<string>('All Resources');
  const [sortOrder, setSortOrder] = useState<'Popular' | 'Newest'>('Popular');

  const filteredResources = useMemo(() => {
    return RESOURCES.filter(resource => {
      if (activeCategory === 'All Resources') return true;
      if (activeCategory === 'Mockups') return resource.id.includes('mockup');
      if (activeCategory === 'Templates') return resource.id.includes('template');
      return true;
    });
  }, [activeCategory]);

  return (
    <div className="flex flex-col gap-10">
      {/* Filter Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-[32px] font-semibold text-[#040B37] tracking-[-0.02em] leading-[1.24] font-inter">
          Resources
        </h1>

        <div className="grid grid-cols-2 gap-3 w-full md:flex md:w-auto md:items-center md:gap-4">
          {/* Category Dropdown */}
          <div className="w-full">
            <CustomDropdown 
              options={CATEGORIES}
              selected={activeCategory}
              onChange={setActiveCategory}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="w-full">
            <CustomDropdown 
              options={['Sort: Popular', 'Sort: Newest']}
              selected={sortOrder === 'Popular' ? 'Sort: Popular' : 'Sort: Newest'}
              onChange={(val) => setSortOrder(val.includes('Popular') ? 'Popular' : 'Newest')}
            />
          </div>
        </div>
      </div>

      {/* Grid - 3 Columns on LG screens to match 1328px width, 4 on XL */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredResources.map((resource) => (
            <motion.div
              layout
              key={resource.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <ResourceCard {...resource} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
