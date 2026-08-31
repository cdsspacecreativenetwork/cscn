'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen } from 'lucide-react';
import { ResourceHeader } from '@/components/dashboard/resources/ResourceHeader';
import { ResourceCard, ResourceCardSkeleton } from '@/components/dashboard/resources/ResourceCard';
import { CreateResourceModal } from '@/components/dashboard/resources/CreateResourceModal';
import { getResources, Resource, type ResourceScope, type InstructorCourseOption } from '@/lib/resourceService';
import { deleteMarketplaceResourceAction, duplicateMarketplaceResourceAction } from '@/actions/marketplace-resources';
import { EmptyState, EmptyStateContent, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@/components/ui/EmptyState';

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
      if (saved) queueMicrotask(() => setBookmarkedIds(JSON.parse(saved)));
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
      } catch (err: unknown) {
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
    } catch (err: unknown) {
      console.error('Failed to duplicate resource:', err);
    }
  }, [fetchResources]);

  const handleModalClose = useCallback(() => {
    setIsCreateModalOpen(false);
    setEditingResource(null);
  }, []);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-8 p-4 sm:p-6 md:p-10">
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-6 rounded-[14px] bg-card-bg p-4 sm:p-6 md:p-8">
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
          <EmptyState className="col-span-full py-12 sm:py-16">
            <EmptyStateIcon><FolderOpen size={24} aria-hidden="true" /></EmptyStateIcon>
            <EmptyStateTitle>No resources found</EmptyStateTitle>
            <EmptyStateDescription>Try adjusting your search criteria or clear your active filters.</EmptyStateDescription>
            <EmptyStateContent>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedType('All Types');
                setSelectedCourse('All Courses');
              }}
              className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Clear all filters
            </button>
            </EmptyStateContent>
          </EmptyState>
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
