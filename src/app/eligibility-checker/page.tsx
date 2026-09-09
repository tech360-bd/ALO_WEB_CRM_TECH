'use client';

import { EligibilityCheckerEnhanced } from '@/components/course-finder/eligibility-checker-enhanced';

export default function EligibilityCheckerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 pt-16">
        <EligibilityCheckerEnhanced />
      </main>
    </div>
  );
}
