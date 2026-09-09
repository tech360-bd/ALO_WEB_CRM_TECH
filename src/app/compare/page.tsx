'use client';

import React, { Suspense } from 'react';
import { PublicComparePage } from '@/components/website/public-pages/PublicPages';

export default function ComparePageRoute() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="flex-1 pt-20 pb-16">
        <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading Course & University Comparison Matrix...</div>}>
          <PublicComparePage />
        </Suspense>
      </main>
    </div>
  );
}
