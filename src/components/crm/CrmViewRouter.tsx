'use client';

import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';

// Dashboard router (routes by CRM role)
import CrmDashboardRouter from './dashboards/CrmDashboardRouter';

// CRM Page components
import CrmLeadsPage from './pages/CrmLeadsPage';
import CrmStudentsPage from './pages/CrmStudentsPage';
import CrmApplicationsPage from './pages/CrmApplicationsPage';
import CrmDocumentsPage from './pages/CrmDocumentsPage';
import CrmVisaPage from './pages/CrmVisaPage';
import CrmCourseFinderPage from './pages/CrmCourseFinderPage';
import CrmUniversitiesPage from './pages/CrmUniversitiesPage';
import CrmScholarshipsPage from './pages/CrmScholarshipsPage';
import CrmInboxPage from './pages/CrmInboxPage';
import CrmCommunicationsPage from './pages/CrmCommunicationsPage';
import CrmWhatsAppPage from './pages/CrmWhatsAppPage';
import CrmSocialPage from './pages/CrmSocialPage';
import SocialMediaManagementHub from '@/components/social/SocialMediaManagementHub';
import CrmSupportPage from './pages/CrmSupportPage';
import CrmTasksPage from './pages/CrmTasksPage';
import CrmAppointmentsPage from './pages/CrmAppointmentsPage';
import CrmPartnersPage from './pages/CrmPartnersPage';
import CrmCommissionsPage from './pages/CrmCommissionsPage';
import CrmFinancePage from './pages/CrmFinancePage';
import CrmAccountingPage from './pages/CrmAccountingPage';
import CrmProcurementPage from './pages/CrmProcurementPage';
import CrmMarketingPage from './pages/CrmMarketingPage';
import CrmHRMPage from './pages/CrmHRMPage';
import CrmAgentOperationsPage from './pages/CrmAgentOperationsPage';
import CrmAnalyticsPage from './pages/CrmAnalyticsPage';
import CrmReportsPage from './pages/CrmReportsPage';
import CrmUsersPage from './pages/CrmUsersPage';
import CrmRolesPage from './pages/CrmRolesPage';
import CrmPermissionsPage from './pages/CrmPermissionsPage';
import CrmAuditLogsPage from './pages/CrmAuditLogsPage';
import CrmSettingsPage from './pages/CrmSettingsPage';

// SEO Growth System
import CrmSeoGrowthDashboard from './seo/CrmSeoGrowthDashboard';
import CrmSeoKeywordTracker from './seo/CrmSeoKeywordTracker';
import CrmSeoContentWorkflow from './seo/CrmSeoContentWorkflow';
import CrmSeoCompetitorAnalysis from './seo/CrmSeoCompetitorAnalysis';
import CrmSeoTechnicalAudit from './seo/CrmSeoTechnicalAudit';
import CrmSeoPolicyWatcher from './seo/CrmSeoPolicyWatcher';

const crmViewMap: Partial<Record<PortalView, React.ComponentType>> = {
  // Dashboard — uses role-based router
  'crm-dashboard': CrmDashboardRouter,

  // Student Management
  'crm-leads': CrmLeadsPage,
  'crm-students': CrmStudentsPage,
  'crm-applications': CrmApplicationsPage,
  'crm-documents': CrmDocumentsPage,
  'crm-visa': CrmVisaPage,

  // Course & University
  'crm-course-finder': CrmCourseFinderPage,
  'crm-universities': CrmUniversitiesPage,
  'crm-scholarships': CrmScholarshipsPage,

  // Communication
  'crm-inbox': CrmInboxPage,
  'crm-communications': CrmCommunicationsPage,
  'crm-whatsapp': CrmWhatsAppPage,
  'crm-social': CrmSocialPage,
  'social-media-hub': () => <SocialMediaManagementHub portal="crm" />,
  'social-inbox': () => <SocialMediaManagementHub portal="crm" />,
  'social-analytics': () => <SocialMediaManagementHub portal="crm" />,
  'social-content': () => <SocialMediaManagementHub portal="crm" />,
  'social-posts': () => <SocialMediaManagementHub portal="crm" />,
  'social-automation': () => <SocialMediaManagementHub portal="crm" />,
  'crm-support': CrmSupportPage,

  // Operations
  'crm-tasks': CrmTasksPage,
  'crm-appointments': CrmAppointmentsPage,
  'crm-partners': CrmPartnersPage,
  'crm-commissions': CrmCommissionsPage,

  // Business
  'crm-finance': CrmFinancePage,
  'crm-accounting': CrmAccountingPage,
  'crm-procurement': CrmProcurementPage,
  'crm-marketing': CrmMarketingPage,
  'crm-hrm': CrmHRMPage,
  'crm-ai-command': CrmAgentOperationsPage,

  // SEO Growth System
  'crm-seo-dashboard': CrmSeoGrowthDashboard,
  'crm-seo-keywords': CrmSeoKeywordTracker,
  'crm-seo-content': CrmSeoContentWorkflow,
  'crm-seo-competitors': CrmSeoCompetitorAnalysis,
  'crm-seo-technical': CrmSeoTechnicalAudit,
  'crm-seo-policy': CrmSeoPolicyWatcher,

  // System
  'crm-reports': CrmReportsPage,
  'crm-users': CrmUsersPage,
  'crm-roles': CrmRolesPage,
  'crm-permissions': CrmPermissionsPage,
  'crm-audit-logs': CrmAuditLogsPage,
  'crm-settings': CrmSettingsPage,
  'crm-analytics': CrmAnalyticsPage,
};

export default function CrmViewRouter() {
  const currentView = usePortalStore((s) => s.currentView);

  const ViewComponent = crmViewMap[currentView] || CrmDashboardRouter;
  return <ViewComponent />;
}
