import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PublicCourseFinder from '@/components/course-finder/PublicCourseFinder';

export const metadata: Metadata = {
  title: 'Course Finder | Search Courses & Universities | ALO Education',
  description:
    'Search verified study-abroad courses and universities by subject, study level, destination country and intake. Compare tuition fees, interview requirements, intakes and world rankings, then apply online.',
  alternates: { canonical: 'https://aloeducation.com/course-finder' },
  openGraph: {
    title: 'Course Finder | Search Courses & Universities | ALO Education',
    description:
      'Find your course from published, source-verified catalogue data: tuition, intakes, deadlines, interview requirement and world ranking.',
    url: 'https://aloeducation.com/course-finder',
    type: 'website',
  },
};

export default function CourseFinderPageRoute() {
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-10 pb-16">
        <Suspense fallback={<div className="p-12 text-center font-medium text-alo-text-muted">Loading Course Finder…</div>}>
          <PublicCourseFinder />
        </Suspense>
      </main>
    </div>
  );
}
