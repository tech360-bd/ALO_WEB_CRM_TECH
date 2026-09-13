'use client';

import dynamic from 'next/dynamic';

const MarketingManagerDashboard = dynamic(() => import('@/components/alo/views/marketing-manager-dashboard'), { ssr: false });

export default function CrmMarketingManagerPage() {
  return <MarketingManagerDashboard />;
}
