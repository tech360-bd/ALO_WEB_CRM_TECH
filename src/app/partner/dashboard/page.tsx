'use client';

import { useRouter } from 'next/navigation';
import PartnerDashboard from '@/components/partner/PartnerDashboard';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

export default function PartnerDashboardPage() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <DashboardCommunicationWidget role="PARTNER" unreadCount={null} slaOverdueCount={null} onNavigateToInbox={() => router.push('/partner/messages')} />
      <PartnerDashboard />
    </div>
  );
}
