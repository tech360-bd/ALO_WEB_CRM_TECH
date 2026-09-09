import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { PublicScholarshipsPage } from '@/components/website/public-pages/PublicPages';

export const metadata: Metadata = {
  title: 'Study Abroad Scholarships | ALO Education Bangladesh',
  description: 'Find verified scholarships for Bangladeshi students — Chevening, Commonwealth, Fulbright, ALO Merit Grants, and country-specific funding opportunities.',
  alternates: { canonical: 'https://aloeducation.com/scholarships' },
  openGraph: {
    title: 'Study Abroad Scholarships | ALO Education',
    description: 'Find scholarships for UK, USA, Canada, Australia, and Europe.',
    url: 'https://aloeducation.com/scholarships',
    type: 'website',
  },
};

export default function ScholarshipsPageRoute() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="flex-1 pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading International Scholarships...</div>}>
          <PublicScholarshipsPage />
        </Suspense>
      </main>
    </div>
  );
}
