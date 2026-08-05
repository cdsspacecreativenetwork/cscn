'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen } from 'lucide-react';
import { ResourceHeader } from '@/components/dashboard/resources/ResourceHeader';
import { ResourceCard, ResourceCardSkeleton } from '@/components/dashboard/resources/ResourceCard';
import { CreateResourceModal } from '@/components/dashboard/resources/CreateResourceModal';
import { getResources, Resource, type ResourceScope, type InstructorCourseOption } from '@/lib/resourceService';
import { deleteMarketplaceResourceAction, duplicateMarketplaceResourceAction } from '@/actions/marketplace-resources';

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [scope, setScope] = useState<ResourceScope>('student');
  const [courses, setCourses] = useState<string[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<InstructorCourseOption[]>([]);
  const [canViewTeachingResources, setCanViewTeachingResources] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Load bookmarks from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cscn_saved_resources');
      if (saved) setBookmarkedIds(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to parse bookmarks:', e);
    }
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('cscn_saved_resources', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save bookmark:', e);
      }
      return next;
    });
  }, []);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getResources(searchQuery, selectedType, selectedCourse, scope);
      setResources(data.resources);
      setCourses(data.courses);
      if (data.instructorCourses) {
        setInstructorCourses(data.instructorCourses);
      }
      setCanViewTeachingResources(data.canViewTeachingResources);
      if (scope === 'instructor' && !data.canViewTeachingResources) {
        setScope('student');
        setSelectedCourse('All Courses');
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      setResources([]);
      if (scope === 'instructor') {
        setScope('student');
        setSelectedCourse('All Courses');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedType, selectedCourse, scope]);

  useEffect(() => {
    const debounce = setTimeout(fetchResources, 300);
    return () => clearTimeout(debounce);
  }, [fetchResources]);

  const handleEditResource = useCallback((resource: Resource) => {
    setEditingResource(resource);
    setIsCreateModalOpen(true);
  }, []);

  const handleDeleteResource = useCallback(async (resourceId: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      try {
        const res = await deleteMarketplaceResourceAction(resourceId);
        if (res?.success) {
          fetchResources();
        } else if (res?.error) {
          alert(res.error);
        }
      } catch (err: any) {
        console.error('Failed to delete resource:', err);
      }
    }
  }, [fetchResources]);

  const handleDuplicateResource = useCallback(async (resourceId: string) => {
    try {
      const res = await duplicateMarketplaceResourceAction(resourceId);
      if (res?.success) {
        fetchResources();
      } else if (res?.error) {
        alert(res.error);
      }
    } catch (err: any) {
      console.error('Failed to duplicate resource:', err);
    }
  }, [fetchResources]);

  const handleModalClose = useCallback(() => {
    setIsCreateModalOpen(false);
    setEditingResource(null);
  }, []);

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
        onCreateClick={() => {
          setEditingResource(null);
          setIsCreateModalOpen(true);
        }}
        courses={courses}
        scope={scope}
        canViewTeachingResources={canViewTeachingResources}
      />

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 bg-white rounded-[14px] p-6 md:p-8">
        {isLoading ? (
          // Shimmer Skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))
        ) : resources.length > 0 ? (
          resources.map((resource) => (
            <ResourceCard 
              key={resource.id} 
              resource={resource}
              isBookmarked={bookmarkedIds.includes(resource.id)}
              onToggleBookmark={toggleBookmark}
              onEdit={scope === 'instructor' ? handleEditResource : undefined}
              onDelete={scope === 'instructor' ? handleDeleteResource : undefined}
              onDuplicate={scope === 'instructor' ? handleDuplicateResource : undefined}
            />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-[8px] flex items-center justify-center border border-[#1C4ED1]/15">
              <FolderOpen size={34} strokeWidth={1.8} className="text-[#1C4ED1]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[20px] font-bold text-[#040B37]">No resources found</h3>
              <p className="text-[14px] text-[#9CA3AF]">
                Try adjusting your search criteria or clear your active filters.
              </p>
            </div>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedType('All Types');
                setSelectedCourse('All Courses');
              }}
              className="text-[#1C4ED1] font-bold hover:underline font-jakarta"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Resource Modal for Instructors */}
      <CreateResourceModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSuccess={() => {
          fetchResources();
        }}
        instructorCourses={instructorCourses}
        editingResource={editingResource}
      />
    </div>
  );
}
