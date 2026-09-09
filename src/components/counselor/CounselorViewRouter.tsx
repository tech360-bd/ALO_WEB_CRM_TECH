'use client';

import { usePortalStore } from '@/lib/stores/portal-store';
import CounselorDashboard from './CounselorDashboard';

export default function CounselorViewRouter() {
  const currentView = usePortalStore((s) => s.currentView);

  // All counselor views map to dashboard for now (can be expanded later)
  if (currentView.startsWith('counselor-')) {
    return <CounselorDashboard />;
  }

  return <CounselorDashboard />;
}
