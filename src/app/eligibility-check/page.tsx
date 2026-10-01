'use client';

// Eligibility check page — the REAL engine-backed checker.
//
// This route is the one linked across the public site (destinations course
// lists, services, success stories, blogs, admission requirements), so it must
// run the same production eligibility engine as /eligibility-checker
// (src/components/course-finder/eligibility-checker-enhanced.tsx) instead of a
// hardcoded demo course. Previously this page rendered a static "Oxford MSc
// Data Science" sample; it now uses the shared component — one source of
// truth, no duplicate logic.

import { EligibilityCheckerEnhanced } from '@/components/course-finder/eligibility-checker-enhanced';

export default function EligibilityCheckPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 pt-16">
        <EligibilityCheckerEnhanced />
      </main>
    </div>
  );
}
