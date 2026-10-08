'use client';

import { useRouter } from 'next/navigation';
import PremiumStudentDashboard from '@/components/student/PremiumStudentDashboard';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

export default function StudentDashboardPage() {
  const router = useRouter();
  return (
    <div className="space-y-4">
      <DashboardCommunicationWidget role="STUDENT" unreadCount={null} slaOverdueCount={null} onNavigateToInbox={() => router.push('/student/messages')} />
      <PremiumStudentDashboard />
    </div>
  );
}
