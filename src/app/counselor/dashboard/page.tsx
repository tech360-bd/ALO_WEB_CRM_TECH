'use client';

import dynamic from 'next/dynamic';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

const CounselorDashboard = dynamic(() => import('@/components/alo/views/counselor-dashboard'), { ssr: false });

export default function CounselorDashboardPage() {
  const handleNavigate = (view: any, slug?: string) => {
    if (slug) window.location.href = `/counselor/${view}/${slug}`;
    else window.location.href = `/counselor/${view}`;
  };
  return (
    <div className="space-y-4">
      <div className="p-4 pb-0"><DashboardCommunicationWidget role="COUNSELOR" unreadCount={7} slaOverdueCount={2} onNavigateToInbox={() => window.location.href='/crm/inbox'} /></div>
      <CounselorDashboard onNavigate={handleNavigate} />
    </div>
  );
}
