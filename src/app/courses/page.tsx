import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AllCoursesListing from '@/components/website/AllCoursesListing';

/**
 * /courses — the complete browsable course catalogue.
 *
 * Previously this route only redirected to /course-finder. It now renders the
 * full catalogue index (same public, source-linked API the Course Finder
 * uses) while /course-finder keeps the advanced multi-criteria search.
 * Course detail pages remain at /course/[slug] and /courses/[slug].
 */
export const metadata: Metadata = {
  title: 'All Courses | Study Abroad Course Catalogue | ALO Education',
  description:
    'Browse all published study abroad courses in the ALO Education catalogue — verified tuition fees, intakes, IELTS requirements and official university links where recorded.',
  alternates: { canonical: 'https://aloeducation.com/courses' },
  openGraph: {
    title: 'All Courses | ALO Education',
    description:
      'Every published course, with fees and intakes shown only where verified against official sources.',
    url: 'https://aloeducation.com/courses',
    type: 'website',
  },
};

export default function CoursesIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 pb-16 pt-24">
        <Suspense
          fallback={
            <div className="p-12 text-center font-medium text-gray-500">Loading courses…</div>
          }
        >
          <AllCoursesListing />
        </Suspense>
      </main>
    </div>
  );
}
