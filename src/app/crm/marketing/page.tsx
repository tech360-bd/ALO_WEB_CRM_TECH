'use client';

import dynamic from 'next/dynamic';

const MarketingDashboard = dynamic(() => import('@/components/alo/views/marketing-dashboard'), { ssr: false });

export default function CrmMarketingPage() {
  return <MarketingDashboard />;
}
