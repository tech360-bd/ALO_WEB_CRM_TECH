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
import PartnerNotificationsPage from './PartnerNotificationsPage';
import PartnerSettingsPage from './PartnerSettingsPage';
import PartnerHelpPage from './PartnerHelpPage';
import PartnerSuperAdminDashboard from './PartnerSuperAdminDashboard';
import PartnerAdminUsersPage from './PartnerAdminUsersPage';
import PartnerVouchersPage from './PartnerVouchersPage';
import PartnerQuotaPage from './PartnerQuotaPage';
import PartnerEnglishPrepView from './PartnerEnglishPrepView';
import { PartnerMarketingStudio } from '@/components/alo/views/partner-marketing-studio';
import SocialMediaManagementHub from '@/components/social/SocialMediaManagementHub';
import { PublicCourseFinderPage } from '@/components/website/public-pages/PublicPages';

const partnerViewMap: Partial<Record<PortalView, React.ComponentType>> = {
  'partner-admin-dashboard': PartnerSuperAdminDashboard,
  'partner-admin-users': PartnerAdminUsersPage,
  'partner-admin-users-create': PartnerAdminUsersPage,
  'partner-admin-roles': PartnerAdminUsersPage,
  'partner-admin-students': PartnerStudentsPage,
  'partner-admin-leads': PartnerLeadsPage,
  'partner-admin-applications': PartnerApplicationsPage,
  'partner-admin-documents': PartnerDocumentsPage,
  'partner-admin-company-profile': PartnerProfilePage,
  'partner-admin-reports': PartnerReportsPage,
  'partner-admin-settings': PartnerSettingsPage,
  'partner-admin-support-request': PartnerHelpPage,
  'partner-admin-usage-quota': PartnerQuotaPage,
  'partner-admin-voucher-codes': PartnerVouchersPage,
  'partner-admin-mock-tests': PartnerVouchersPage,
  'partner-admin-interview-prep': PartnerEnglishPrepView,
  'partner-admin-course-finder': PublicCourseFinderPage,
  'partner-admin-marketing-studio': PartnerMarketingStudio,
  'partner-admin-content-generator': PartnerMarketingStudio,
  'partner-admin-image-generator': PartnerMarketingStudio,
  'partner-admin-video-generator': PartnerMarketingStudio,
  'partner-admin-social-scheduler': () => <SocialMediaManagementHub portal="partner" />,
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
  'partner-referrals': PartnerLeadsPage,
  'partner-notifications': PartnerNotificationsPage,
  'partner-settings': PartnerSettingsPage,
  'partner-help': PartnerHelpPage,
};

export default function PartnerViewRouter() {
  const currentView = usePortalStore((s) => s.currentView);

  const ViewComponent = partnerViewMap[currentView] || PartnerDashboard;
  return <ViewComponent />;
}
