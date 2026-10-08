import React, { Suspense } from 'react';
import { Metadata } from 'next';
import UniversitiesListing from '@/components/website/UniversitiesListing';

export const metadata: Metadata = {
  title: 'University Directory and Course Information | ALO Education',
  description: 'Browse university records available in ALO Education’s database and review course, intake, international-eligibility, and code information with source and verification status where recorded.',
  alternates: {
    canonical: 'https://aloeducation.com/universities',
  },
  openGraph: {
    title: 'University Directory and Course Information | ALO Education',
    description: 'Search university records and view available course and intake information for international applicants.',
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
