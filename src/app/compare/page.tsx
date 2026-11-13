import React, { Suspense } from 'react';
import CourseComparePage from '@/components/course-finder/CourseComparePage';

// Real comparison of up to 4 verified, published courses (previously a static
// placeholder card).
export default function ComparePageRoute() {
  return (
    <div className="min-h-screen bg-[var(--alo-page)]">
      <main className="flex-1 pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-[var(--alo-text-muted)] font-medium">Loading comparison…</div>}>
          <CourseComparePage />
        </Suspense>
      </main>
    </div>
  );
}
