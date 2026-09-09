'use client';

import { useParams } from 'next/navigation';
import { PublicLanguagePrepPage } from '@/components/website/public-pages/PublicPages';

export default function EnglishTestPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 pt-20">
        <PublicLanguagePrepPage slug={slug} />
      </main>
    </div>
  );
}
