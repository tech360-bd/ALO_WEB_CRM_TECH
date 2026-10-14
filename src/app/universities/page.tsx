import React, { Suspense } from 'react';
import { Metadata } from 'next';
import UniversitiesListing from '@/components/website/UniversitiesListing';

// No hardcoded university counts in metadata: the live directory count comes
// from the database at request time (see UniversitiesListing), so static
// numeric claims here would inevitably drift out of sync with reality.
export const metadata: Metadata = {
  title: 'University Directory Worldwide | ALO Education',
  description: 'Browse published, source-linked university records from available study destinations. Search by university, city, or country and review recorded course and admission information.',
  alternates: {
    canonical: 'https://aloeducation.com/universities',
  },
  openGraph: {
    title: 'Published University Directory | ALO Education',
    description: 'Explore available source-linked university records and the course, admission, ranking, and scholarship facts currently recorded for each institution.',
    url: 'https://aloeducation.com/universities',
    type: 'website',
  },
};

export default function UniversitiesDirectoryPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-gray-500 font-medium">Loading universities…</div>}>
          <UniversitiesListing />
        </Suspense>
      </main>
    </div>
  );
}
