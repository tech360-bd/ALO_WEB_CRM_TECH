'use client';

import PremiumStudentDashboard from '@/components/student/PremiumStudentDashboard';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';
import { usePortalStore } from '@/lib/stores/portal-store';

/**
 * Shared student home used by the legacy portal shell.
 * The dedicated /student/dashboard route also renders PremiumStudentDashboard;
 * keeping both entry points on the same real-data component prevents the old
 * SPA route from showing sample profiles, applications or deadlines.
 */
export default function StudentDashboard() {
  const setView = usePortalStore((state) => state.setView);

  return (
    <div className="space-y-4">
      <DashboardCommunicationWidget
        role="STUDENT"
        unreadCount={null}
        onNavigateToInbox={() => setView('student-messages')}
      />
      <PremiumStudentDashboard />
    </div>
  );
}
