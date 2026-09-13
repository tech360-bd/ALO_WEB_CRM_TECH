'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import ResourceDetailHub from '@/components/website/ResourceDetailHub';

export default function ResourceDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="min-h-screen flex flex-col bg-white pt-20">
      <main className="flex-1">
        <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading Resource Detail — DB-driven with 22 sections...</div>}>
          <ResourceDetailHub slug={slug || ''} />
        </Suspense>
      </main>
    </div>
  );
}
