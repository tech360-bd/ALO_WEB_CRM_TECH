import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ScholarshipsListing from '@/components/website/ScholarshipsListing';

export const metadata: Metadata = {
  title: 'Study Abroad Scholarships | ALO Education Bangladesh',
  description: 'Find verified scholarships for Bangladeshi students — Chevening, Commonwealth, Fulbright, ALO Merit Grants, and country-specific funding opportunities. DB-driven, verified only, with source verification.',
  alternates: { canonical: 'https://aloeducation.com/scholarships' },
  openGraph: {
    title: 'Study Abroad Scholarships | ALO Education',
    description: 'Find scholarships for UK, USA, Canada, Australia, and Europe — verified, DB-driven.',
    url: 'https://aloeducation.com/scholarships',
    type: 'website',
  },
};

export default function ScholarshipsPageRoute() {
  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-gray-500 font-medium">Loading International Scholarships — DB-driven...</div>}>
          <ScholarshipsListing />
        </Suspense>
      </main>
    </div>
  );
}
