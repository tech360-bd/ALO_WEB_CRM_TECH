import React, { Suspense } from 'react';
import { Metadata } from 'next';
import ScholarshipsListing from '@/components/website/ScholarshipsListing';

export const metadata: Metadata = {
  title: 'Study Abroad Scholarships | ALO Education Bangladesh',
  description: 'Find verified scholarships for Bangladeshi students — Chevening, Commonwealth, Fulbright, ALO Merit Grants, and country-specific funding opportunities. Verified sources only.',
  alternates: { canonical: 'https://aloeducation.com/scholarships' },
  openGraph: {
    title: 'Study Abroad Scholarships | ALO Education',
    description: 'Find verified scholarships for UK, USA, Canada, Australia and Europe.',
    url: 'https://aloeducation.com/scholarships',
    type: 'website',
  },
};

export default function ScholarshipsPageRoute() {
  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-[var(--alo-text-muted)] font-medium">Loading scholarships…</div>}>
          <ScholarshipsListing />
        </Suspense>
      </main>
    </div>
  );
}
