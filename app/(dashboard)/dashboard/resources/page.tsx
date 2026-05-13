'use client';

import React, { useState, useEffect } from 'react';
import { ResourceHeader } from '@/components/dashboard/resources/ResourceHeader';
import { ResourceCard, ResourceCardSkeleton } from '@/components/dashboard/resources/ResourceCard';
import { getResources, Resource } from '@/lib/resourceService';

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        const data = await getResources(searchQuery, selectedType, selectedCourse);
        setResources(data);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchResources, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedType, selectedCourse]);

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto font-jakarta">
      {/* Search & Header Section */}
      <ResourceHeader 
        onSearch={setSearchQuery}
        onTypeChange={setSelectedType}
        onCourseChange={setSelectedCourse}
      />

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {isLoading ? (
          // Shimmer Skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))
        ) : resources.length > 0 ? (
          resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-[#F4F6FB] rounded-full flex items-center justify-center">
              <span className="text-[32px]">📂</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-[20px] font-bold text-[#040B37]">No resources found</h3>
              <p className="text-[#9CA3AF] max-w-xs">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedType('All Types');
                setSelectedCourse('All Courses');
              }}
              className="text-[#1C4ED1] font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
