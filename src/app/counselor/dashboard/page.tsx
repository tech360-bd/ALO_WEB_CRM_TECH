'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

const CounselorDashboard = dynamic(() => import('@/components/alo/views/counselor-dashboard'), { ssr: false });

export default function CounselorDashboardPage() {
  const router = useRouter();
  const handleNavigate = (view: any, slug?: string) => {
    const pathname = slug ? `/counselor/${view}/${slug}` : `/counselor/${view}`;
    router.push(pathname);
  };
  return (
    <div className="space-y-4">
      <div className="p-4 pb-0"><DashboardCommunicationWidget role="COUNSELOR" unreadCount={null} slaOverdueCount={null} onNavigateToInbox={() => router.push('/crm/inbox')} /></div>
      <CounselorDashboard onNavigate={handleNavigate} />
    </div>
  );
}
