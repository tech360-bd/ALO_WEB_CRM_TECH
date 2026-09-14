'use client';

import PremiumStudentDashboard from '@/components/student/PremiumStudentDashboard';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

export default function StudentDashboardPage() {
  return (
    <div className="space-y-4">
      <DashboardCommunicationWidget role="STUDENT" unreadCount={2} slaOverdueCount={0} onNavigateToInbox={() => window.location.href='/student/messages'} />
      <PremiumStudentDashboard />
    </div>
  );
}
