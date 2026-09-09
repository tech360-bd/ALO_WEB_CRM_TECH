'use client';

import { useParams } from 'next/navigation';
import { PublicResourcesPage } from '@/components/website/public-pages/PublicPages';

export default function ResourceDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="min-h-screen flex flex-col bg-white pt-20">
      <main className="flex-1">
        <PublicResourcesPage />
      </main>
    </div>
  );
}
