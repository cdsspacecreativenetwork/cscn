import React from 'react';
import ResourcesFilter from '@/components/marketing/ResourcesFilter';
import CourseMaterials from '@/components/marketing/CourseMaterials';

export const metadata = {
  title: 'Resources | CSCN Learning Platform',
  description: 'Download high-quality design assets, mockups, and course materials to accelerate your learning and career.',
};

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[83rem] px-4 pt-32 pb-10">
        
        {/* Main Content Layout - Stacked with 132px Gap */}
        <div className="flex flex-col gap-[8.25rem]">
          
          {/* Resources Catalog */}
          <section className="w-full">
            <ResourcesFilter />
          </section>

          {/* Course Materials */}
          <section className="w-full">
            <CourseMaterials />
          </section>
          
        </div>
      </div>
    </main>
  );
}
