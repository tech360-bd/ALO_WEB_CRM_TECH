'use client';

import React, { Suspense } from 'react';
import { CourseFinderPublic } from '@/components/course-finder/course-finder-public';

export default function CourseFinderPageRoute() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading Course Finder...</div>}>
          <CourseFinderPublic />
        </Suspense>
      </main>
    </div>
  );
}
