'use client';

import type { ComponentType } from 'react';
import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';
import PartnerPortalShell from '@/components/partner/PartnerPortalShell';
import PartnerSuperAdminDashboard from '@/components/partner/PartnerSuperAdminDashboard';
import PartnerAdminUsersPage from '@/components/partner/PartnerAdminUsersPage';
import PartnerVouchersPage from '@/components/partner/PartnerVouchersPage';
import PartnerQuotaPage from '@/components/partner/PartnerQuotaPage';
import PartnerProfilePage from '@/components/partner/PartnerProfilePage';
import PartnerLeadsPage from '@/components/partner/PartnerLeadsPage';
import PartnerStudentsPage from '@/components/partner/PartnerStudentsPage';
import PartnerApplicationsPage from '@/components/partner/PartnerApplicationsPage';
import PartnerDocumentsPage from '@/components/partner/PartnerDocumentsPage';
import PartnerReportsPage from '@/components/partner/PartnerReportsPage';
import PartnerCommissionPage from '@/components/partner/PartnerCommissionPage';
import PartnerMessagesPage from '@/components/partner/PartnerMessagesPage';
import PartnerResourcesPage from '@/components/partner/PartnerResourcesPage';
import PartnerSettingsPage from '@/components/partner/PartnerSettingsPage';
import PartnerHelpPage from '@/components/partner/PartnerHelpPage';
import PartnerNotificationsPage from '@/components/partner/PartnerNotificationsPage';
import PartnerEnglishPrepView from '@/components/partner/PartnerEnglishPrepView';
import { PartnerMarketingStudio } from '@/components/alo/views/partner-marketing-studio';
import SocialMediaManagementHub from '@/components/social/SocialMediaManagementHub';
import { PublicCourseFinderPage } from '@/components/website/public-pages/PublicPages';

interface MasterPartnerAdminViewProps { currentPath?: string }

const PATH_TO_VIEW: Record<string, PortalView> = {
  '/partner-admin/dashboard': 'partner-admin-dashboard',
  '/partner-admin/users': 'partner-admin-users',
  '/partner-admin/users/create': 'partner-admin-users-create',
  '/partner-admin/students': 'partner-admin-students',
  '/partner-admin/applications': 'partner-admin-applications',
  '/partner-admin/marketing-studio': 'partner-admin-marketing-studio',
  '/partner-admin/content-generator': 'partner-admin-content-generator',
  '/partner-admin/company-profile': 'partner-admin-company-profile',
  '/partner-admin/settings': 'partner-admin-settings',
  '/partner-admin/reports': 'partner-admin-reports',
  '/partner-admin/documents': 'partner-admin-documents',
  '/partner-admin/leads': 'partner-admin-leads',
  '/partner-admin/roles': 'partner-admin-roles',
  '/partner-admin/voucher-codes': 'partner-admin-voucher-codes',
  '/partner-admin/mock-tests': 'partner-admin-mock-tests',
  '/partner-admin/usage-quota': 'partner-admin-usage-quota',
  '/partner-admin/support-request': 'partner-admin-support-request',
  '/partner-admin/course-finder': 'partner-admin-course-finder',
  '/partner-admin/image-generator': 'partner-admin-image-generator',
  '/partner-admin/video-generator': 'partner-admin-video-generator',
  '/partner-admin/interview-prep': 'partner-admin-interview-prep',
  '/partner-admin/social-scheduler': 'partner-admin-social-scheduler',
};

const PARTNER_ADMIN_VIEWS: Partial<Record<PortalView, ComponentType>> = {
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
  'partner-dashboard': PartnerSuperAdminDashboard,
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

export default function MasterPartnerAdminView({ currentPath = '/partner-admin/dashboard' }: MasterPartnerAdminViewProps) {
  const storeView = usePortalStore((state) => state.currentView);
  const routeView = PATH_TO_VIEW[currentPath] || 'partner-admin-dashboard';
  const activeView = storeView === 'website' || storeView === 'portals' ? routeView : storeView;
  const View = PARTNER_ADMIN_VIEWS[activeView] || PARTNER_ADMIN_VIEWS[routeView] || PartnerSuperAdminDashboard;
  return <PartnerPortalShell><View /></PartnerPortalShell>;
}
