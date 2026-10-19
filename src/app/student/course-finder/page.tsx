'use client';

// ============================================================
// /student/course-finder — thin route wrapper
// ============================================================
// The implementation now lives in one place:
// src/components/student/StudentCourseFinder.tsx, which the portal view map in
// src/app/page.tsx also renders. This file used to hold a second, separate copy
// of the same screen; duplicating it meant the two could drift, and one of them
// (the component) was a static mock while this one was real.
//
// Both entry points now render the same real implementation: live catalogue
// search plus the real eligibility engine, with no fabricated admission-chance
// claim (spec s15, s92, s93).
// ============================================================

import StudentCourseFinder from '@/components/student/StudentCourseFinder';

export default function StudentCourseFinderPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 pt-20 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <StudentCourseFinder />
      </div>
    </div>
  );
}
