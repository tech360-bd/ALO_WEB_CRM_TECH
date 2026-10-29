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
import { EligibilityFlowDiagram } from '@/components/diagrams';
import { AloCtaLink } from '@/components/website/AloCtaLink';

export default function EligibilityCheckPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl py-10 space-y-8">
          <EligibilityFlowDiagram />
          <div className="flex justify-center">
            <AloCtaLink href="/book-consultation">Request a Consultation</AloCtaLink>
          </div>
        </div>
        <EligibilityCheckerEnhanced />
      </main>
    </div>
  );
}
