import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import UniversitiesListing from '@/components/website/UniversitiesListing';

export const metadata: Metadata = {
  title: 'All University Information | ALO Education',
  description: 'Search published university records by name and country. Open a university profile to review recorded courses, admissions, fees, scholarships, rankings and official sources.',
  alternates: { canonical: 'https://aloeducation.com/all-university-information' },
};

// The root public layout owns the single header/footer. Reuse the existing
// public directory and its publication policy; do not expose the CRM endpoint.
export default function AllUniversityInformationPage() {
  return <main className="min-h-screen bg-white pt-20 pb-16">
    <Suspense fallback={<p role="status" className="p-8 text-center">Loading university information…</p>}>
      <UniversitiesListing
        title="All University Information"
        description="Search published, verified, source-linked university records by name, city or country. Open a university profile to review recorded courses, admission requirements, intakes, tuition fees, scholarships, campuses, rankings and official sources. Missing information is not inferred; this directory is not a claim that every university worldwide has been researched."
      />
    </Suspense>
  </main>;
}
