import React, { Suspense } from 'react';
import EnhancedCourseFinder from '@/components/course-finder/EnhancedCourseFinder';

export default function CourseFinderPageRoute() {
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-gray-500 font-medium">Loading Course Finder — DB-driven with all filters...</div>}>
          <EnhancedCourseFinder />
        </Suspense>
      </main>
    </div>
  );
}
