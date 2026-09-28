import React, { Suspense } from 'react';
import { Metadata } from 'next';
import UniversitiesListing from '@/components/website/UniversitiesListing';

// No hardcoded university counts in metadata: the live directory count comes
// from the database at request time (see UniversitiesListing), so static
// numeric claims here would inevitably drift out of sync with reality.
export const metadata: Metadata = {
  title: 'Partner Universities Worldwide | ALO Education Directory',
  description: 'Browse our complete directory of partner universities across the UK, USA, Canada, Australia, Germany, New Zealand, Ireland, and Dubai. Find entry requirements, tuition fees, and scholarship guidance — DB-driven, verified, with related content engine.',
  alternates: {
    canonical: 'https://aloeducation.com/universities',
  },
  openGraph: {
    title: 'Partner Universities Worldwide | ALO Education',
    description: 'Explore verified international partner universities. Check admission criteria, IELTS waivers, and scholarship availability — DB-driven.',
    url: 'https://aloeducation.com/universities',
    type: 'website',
  },
};

export default function UniversitiesDirectoryPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-gray-500 font-medium">Loading Universities Directory — DB-driven...</div>}>
          <UniversitiesListing />
        </Suspense>
      </main>
    </div>
  );
}
