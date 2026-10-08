'use client';

import dynamic from 'next/dynamic';

const SeoManager = dynamic(() => import('@/components/alo/views/seo-manager'), { ssr: false });

export default function CrmSeoManagerPage() {
  return <SeoManager />;
}
