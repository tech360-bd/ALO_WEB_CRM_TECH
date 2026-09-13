'use client';

import dynamic from 'next/dynamic';

const CounselorDashboard = dynamic(() => import('@/components/alo/views/counselor-dashboard'), { ssr: false });

export default function CounselorDashboardPage() {
  return <CounselorDashboard />;
}
