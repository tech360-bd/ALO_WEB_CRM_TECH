'use client';

import { PublicLegalPage } from '@/components/website/public-pages/PublicPages';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white pt-20">
      <main className="flex-1">
        <PublicLegalPage type="privacy" />
      </main>
    </div>
  );
}