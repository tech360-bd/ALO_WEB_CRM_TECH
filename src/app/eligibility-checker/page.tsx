'use client';

// Canonical eligibility-checker route. The engine component is shared with
// /eligibility-check (the historically-linked route) — both render
// src/components/course-finder/eligibility-checker-enhanced.tsx. Keep this
// page as the stable canonical URL; do not fork the component.

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
