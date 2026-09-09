'use client';

import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';
import PartnerDashboard from './PartnerDashboard';
import PartnerProfilePage from './PartnerProfilePage';
import PartnerLeadsPage from './PartnerLeadsPage';
import PartnerStudentsPage from './PartnerStudentsPage';
import PartnerApplicationsPage from './PartnerApplicationsPage';
import PartnerDocumentsPage from './PartnerDocumentsPage';
import PartnerCommissionPage from './PartnerCommissionPage';
import PartnerReportsPage from './PartnerReportsPage';
import PartnerMessagesPage from './PartnerMessagesPage';
import PartnerResourcesPage from './PartnerResourcesPage';
import PartnerReferralsPage from './PartnerReferralsPage';
import PartnerNotificationsPage from './PartnerNotificationsPage';
import PartnerSettingsPage from './PartnerSettingsPage';
import PartnerHelpPage from './PartnerHelpPage';

const partnerViewMap: Partial<Record<PortalView, React.ComponentType>> = {
  'partner-dashboard': PartnerDashboard,
  'partner-profile': PartnerProfilePage,
  'partner-leads': PartnerLeadsPage,
  'partner-students': PartnerStudentsPage,
  'partner-applications': PartnerApplicationsPage,
  'partner-documents': PartnerDocumentsPage,
  'partner-commission': PartnerCommissionPage,
  'partner-reports': PartnerReportsPage,
  'partner-messages': PartnerMessagesPage,
  'partner-resources': PartnerResourcesPage,
  'partner-referrals': PartnerReferralsPage,
  'partner-notifications': PartnerNotificationsPage,
  'partner-settings': PartnerSettingsPage,
  'partner-help': PartnerHelpPage,
};

export default function PartnerViewRouter() {
  const currentView = usePortalStore((s) => s.currentView);

  const ViewComponent = partnerViewMap[currentView] || PartnerDashboard;
  return <ViewComponent />;
}
