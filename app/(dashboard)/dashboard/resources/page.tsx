'use client';

import React, { useState, useEffect } from 'react';
import { FolderOpen } from 'lucide-react';
import { ResourceHeader } from '@/components/dashboard/resources/ResourceHeader';
import { ResourceCard, ResourceCardSkeleton } from '@/components/dashboard/resources/ResourceCard';
import { getResources, Resource, type ResourceScope } from '@/lib/resourceService';

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [scope, setScope] = useState<ResourceScope>('student');
  const [courses, setCourses] = useState<string[]>([]);

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        const data = await getResources(searchQuery, selectedType, selectedCourse, scope);
        setResources(data.resources);
        setCourses(data.courses);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchResources, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedType, selectedCourse, scope]);

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1600px] mx-auto font-jakarta">
      {/* Search & Header Section */}
      <ResourceHeader 
        onSearch={setSearchQuery}
        onTypeChange={setSelectedType}
        onCourseChange={setSelectedCourse}
        onScopeChange={(nextScope) => {
          setScope(nextScope);
          setSelectedCourse('All Courses');
        }}
        courses={courses}
        scope={scope}
      />

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 bg-white rounded-[14px] p-6 md:p-8">
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
            <div className="w-20 h-20 rounded-[8px] flex items-center justify-center border border-[#1C4ED1]/15">
              <FolderOpen size={34} strokeWidth={1.8} className="text-[#1C4ED1]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[20px] font-bold text-[#040B37]">No resources found</h3>
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
