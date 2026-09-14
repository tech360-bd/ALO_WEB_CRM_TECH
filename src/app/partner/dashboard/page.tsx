'use client';

import PartnerDashboard from '@/components/partner/PartnerDashboard';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

export default function PartnerDashboardPage() {
  return (
    <div className="space-y-4">
      <DashboardCommunicationWidget role="PARTNER" unreadCount={3} slaOverdueCount={1} onNavigateToInbox={() => window.location.href='/partner/messages'} />
      <PartnerDashboard />
    </div>
  );
}
