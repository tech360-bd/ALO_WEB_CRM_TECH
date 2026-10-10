'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';

// ---- Public Pages ----
import PortalSelector from '@/components/portals/PortalSelector';
import LoginPage from '@/components/auth/LoginPage';
import RegisterPage from '@/components/auth/RegisterPage';
import { AccountSuspended, AccountPending, Unauthorized } from '@/components/auth/AuthStatusPages';
import ForgotPasswordPage from '@/components/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/components/auth/ResetPasswordPage';

// ---- Public Website Homepage ----

import HomepagePart1 from '@/components/website/HomepagePart1';
import HomepagePart2 from '@/components/website/HomepagePart2';
import HomepagePart3 from '@/components/website/HomepagePart3';
import HomepagePart4 from '@/components/website/HomepagePart4';

// ---- Public Website Sub-Pages (SPA-routed via rewrites) ----
import PublicConsultationPage from '@/components/website/public-pages/PublicConsultationPage';
import {
  PublicCourseFinderPage,
  PublicDestinationPage,
  PublicUniversitiesPage,
  PublicScholarshipsPage,
  PublicServicesPage,
  PublicAboutPage,
  PublicSuccessStoriesPage,
  PublicTeamPage,
  PublicFaqsPage,
  PublicContactPage,
  PublicLegalPage,
  PublicLanguagePrepPage,
  PublicResourcesPage,
  PublicVisaReadinessPage,
} from '@/components/website/public-pages/PublicPages';

// ---- Student Portal ----
import StudentPortalShell from '@/components/student/StudentPortalShell';
import StudentDashboard from '@/components/student/StudentDashboard';
import StudentProfilePage from '@/components/student/StudentProfilePage';
import StudentCourseFinder from '@/components/student/StudentCourseFinder';
import StudentAiMatch from '@/components/student/StudentAiMatch';
import StudentCompare from '@/components/student/StudentCompare';
import StudentApplications from '@/components/student/StudentApplications';
import StudentDocuments from '@/components/student/StudentDocuments';
import StudentVisaCenter from '@/components/student/StudentVisaCenter';
import VisaOfficerDashboard from '@/components/visa/VisaOfficerDashboard';
import VisaInterviewWorkspace from '@/components/visa/VisaInterviewWorkspace';
import OldCrmImportCenterPage from '@/components/crm/pages/OldCrmImportCenterPage';
import UniversityDataUpdateCenterPage from '@/components/crm/pages/UniversityDataUpdateCenterPage';
import AccessControlCenterPage from '@/components/admin/AccessControlCenterPage';
import PartnerSuperAdminDashboard from '@/components/partner/PartnerSuperAdminDashboard';
import { PartnerMarketingStudio } from '@/components/alo/views/partner-marketing-studio';
import StudentMessages from '@/components/student/StudentMessages';
import StudentSopCvStudio from '@/components/student/StudentSopCvStudio';
import StudentScholarships from '@/components/student/StudentScholarships';
import StudentPayments from '@/components/student/StudentPayments';
import StudentAppointments from '@/components/student/StudentAppointments';
import { StudentNotifications } from '@/components/student/StudentNotifications';
import { StudentReferrals, StudentHelpCenter, StudentSettings, StudentAIAdvisor, StudentRecommendations } from '@/components/student/StudentMorePages';

// ---- Employee Portal ----
import EmployeePortalShell from '@/components/employee/EmployeePortalShell';
import EmployeeDashboard from '@/components/employee/EmployeeDashboard';
import EmployeeProfilePage from '@/components/employee/EmployeeProfilePage';
import EmployeeTasksPage from '@/components/employee/EmployeeTasksPage';
import EmployeeLeadsPage from '@/components/employee/EmployeeLeadsPage';
import EmployeeStudentsPage from '@/components/employee/EmployeeStudentsPage';
import EmployeeApplicationsPage from '@/components/employee/EmployeeApplicationsPage';
import EmployeeDocumentsPage from '@/components/employee/EmployeeDocumentsPage';
import EmployeeMessagesPage from '@/components/employee/EmployeeMessagesPage';
import EmployeeWhatsAppPage from '@/components/employee/EmployeeWhatsAppPage';
import EmployeeCalendarPage from '@/components/employee/EmployeeCalendarPage';
import EmployeeNotificationsPage from '@/components/employee/EmployeeNotificationsPage';
import EmployeeAttendancePage from '@/components/employee/EmployeeAttendancePage';
import EmployeeLeavePage from '@/components/employee/EmployeeLeavePage';
import EmployeeSalaryPage from '@/components/employee/EmployeeSalaryPage';
import EmployeePerformancePage from '@/components/employee/EmployeePerformancePage';
import EmployeeReportsPage from '@/components/employee/EmployeeReportsPage';
import EmployeeSettingsPage from '@/components/employee/EmployeeSettingsPage';
import EmployeeHelpPage from '@/components/employee/EmployeeHelpPage';

// ---- Partner Portal ----
import PartnerPortalShell from '@/components/partner/PartnerPortalShell';
import PartnerDashboard from '@/components/partner/PartnerDashboard';
import PartnerProfilePage from '@/components/partner/PartnerProfilePage';
import PartnerLeadsPage from '@/components/partner/PartnerLeadsPage';
import PartnerStudentsPage from '@/components/partner/PartnerStudentsPage';
import PartnerApplicationsPage from '@/components/partner/PartnerApplicationsPage';
import PartnerDocumentsPage from '@/components/partner/PartnerDocumentsPage';
import PartnerCommissionPage from '@/components/partner/PartnerCommissionPage';
import PartnerReportsPage from '@/components/partner/PartnerReportsPage';
import PartnerMessagesPage from '@/components/partner/PartnerMessagesPage';
import PartnerResourcesPage from '@/components/partner/PartnerResourcesPage';
import PartnerReferralsPage from '@/components/partner/PartnerReferralsPage';
import PartnerSettingsPage from '@/components/partner/PartnerSettingsPage';
import PartnerHelpPage from '@/components/partner/PartnerHelpPage';
import PartnerNotificationsPage from '@/components/partner/PartnerNotificationsPage';
import PartnerAdminUsersPage from '@/components/partner/PartnerAdminUsersPage';
import PartnerVouchersPage from '@/components/partner/PartnerVouchersPage';
import PartnerQuotaPage from '@/components/partner/PartnerQuotaPage';
import PartnerEnglishPrepView from '@/components/partner/PartnerEnglishPrepView';

// ---- CRM Admin ----
import CrmAdminShell from '@/components/crm/CrmAdminShell';
import CrmDashboardRouter from '@/components/crm/dashboards/CrmDashboardRouter';
import CrmLeadsPage from '@/components/crm/pages/CrmLeadsPage';
import CrmStudentsPage from '@/components/crm/pages/CrmStudentsPage';
import CrmApplicationsPage from '@/components/crm/pages/CrmApplicationsPage';
import CrmDocumentsPage from '@/components/crm/pages/CrmDocumentsPage';
import CrmFinancePage from '@/components/crm/pages/CrmFinancePage';
import CrmCommissionsPage from '@/components/crm/pages/CrmCommissionsPage';
import CrmPartnersPage from '@/components/crm/pages/CrmPartnersPage';
import CrmHRMPage from '@/components/crm/pages/CrmHRMPage';
import CrmMarketingPage from '@/components/crm/pages/CrmMarketingPage';
import CrmVisaPage from '@/components/crm/pages/CrmVisaPage';
import CrmCourseFinderPage from '@/components/crm/pages/CrmCourseFinderPage';
import CrmReportsPage from '@/components/crm/pages/CrmReportsPage';
import CrmAuditLogsPage from '@/components/crm/pages/CrmAuditLogsPage';
import CrmSettingsPage from '@/components/crm/pages/CrmSettingsPage';
import CrmSupportPage from '@/components/crm/pages/CrmSupportPage';
import CrmTasksPage from '@/components/crm/pages/CrmTasksPage';
import CrmAppointmentsPage from '@/components/crm/pages/CrmAppointmentsPage';
import CrmUsersPage from '@/components/crm/pages/CrmUsersPage';
import CrmRolesPage from '@/components/crm/pages/CrmRolesPage';
import CrmPermissionsPage from '@/components/crm/pages/CrmPermissionsPage';
import CrmScholarshipsPage from '@/components/crm/pages/CrmScholarshipsPage';
import CrmInboxPage from '@/components/crm/pages/CrmInboxPage';
import CrmWhatsAppPage from '@/components/crm/pages/CrmWhatsAppPage';
import CrmSocialPage from '@/components/crm/pages/CrmSocialPage';
import SocialMediaManagementHub from '@/components/social/SocialMediaManagementHub';
import CrmCommunicationsPage from '@/components/crm/pages/CrmCommunicationsPage';
import CrmAgentOperationsPage from '@/components/crm/pages/CrmAgentOperationsPage';
import CrmAnalyticsPage from '@/components/crm/pages/CrmAnalyticsPage';
import CrmUniversitiesPage from '@/components/crm/pages/CrmUniversitiesPage';

// ---- Marketing Hub ----
import MarketingHubShell from '@/components/marketing/hub/MarketingHubShell';
import MarketingDashboardView from '@/components/marketing/hub/MarketingDashboardView';
import CampaignBuilderCalendarView from '@/components/marketing/hub/CampaignBuilderCalendarView';
import SocialMediaAutomationView from '@/components/marketing/hub/SocialMediaAutomationView';
import MarketingAnalyticsView from '@/components/marketing/hub/MarketingAnalyticsView';
import UnifiedInboxView from '@/components/marketing/hub/UnifiedInboxView';
import ApprovalQueueView from '@/components/marketing/hub/ApprovalQueueView';
import BrandAssetsPostCreatorView from '@/components/marketing/hub/BrandAssetsPostCreatorView';
import KeywordTriggersView from '@/components/marketing/hub/KeywordTriggersView';
import WhatsAppAutomationView from '@/components/marketing/hub/WhatsAppAutomationView';
import LeadPipelineView from '@/components/marketing/hub/LeadPipelineView';
import AiReplyManagerView from '@/components/marketing/hub/AiReplyManagerView';
import ConversationAssignmentView from '@/components/marketing/hub/ConversationAssignmentView';
import HumanHandoffView from '@/components/marketing/hub/HumanHandoffView';
import N8nWorkflowsView from '@/components/marketing/hub/N8nWorkflowsView';
import MarketingAuditAccessView from '@/components/marketing/hub/MarketingAuditAccessView';

// ---- Knowledge Sharing & International Officer ----
import KnowledgeSharingHub from '@/components/alo/views/knowledge-sharing-hub';
import InternationalOfficerDashboard from '@/components/alo/views/international-officer-dashboard';

// ---- Super Admin Master Command Center — Website CMS + CRM Command ----
import { SuperAdminMasterCommandCenter } from '@/components/admin/SuperAdminMasterCommandCenter';
import { SuperAdminWebsiteCmsHub } from '@/components/admin/SuperAdminWebsiteCmsHub';
import { SuperAdminCrmCommandCenter } from '@/components/admin/SuperAdminCrmCommandCenter';

// ---- SEO Growth System ----
import CrmSeoGrowthDashboard from '@/components/crm/seo/CrmSeoGrowthDashboard';
import CrmSeoKeywordTracker from '@/components/crm/seo/CrmSeoKeywordTracker';
import CrmSeoContentWorkflow from '@/components/crm/seo/CrmSeoContentWorkflow';
import CrmSeoCompetitorAnalysis from '@/components/crm/seo/CrmSeoCompetitorAnalysis';
import CrmSeoTechnicalAudit from '@/components/crm/seo/CrmSeoTechnicalAudit';
import CrmSeoPolicyWatcher from '@/components/crm/seo/CrmSeoPolicyWatcher';

// ============================================================
// VIEW RENDERERS
// ============================================================

function PublicHomepage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        <HomepagePart1 />
        <HomepagePart2 />
        <HomepagePart3 />
        <HomepagePart4 />
      </main>
    </div>
  );
}

function PublicView({ view }: { view: PortalView }) {
  const slug = usePortalStore((s) => s.publicPageSlug);
  switch (view) {
    case 'portals': return <PortalSelector />;
    case 'login': case 'student-login': case 'partner-login': case 'employee-login': case 'admin-login':
      return <LoginPage />;
    case 'register': case 'student-register': case 'partner-register':
      return <RegisterPage />;
    case 'account-suspended': return <AccountSuspended />;
    case 'account-pending': return <AccountPending />;
    case 'unauthorized': return <Unauthorized />;
    case 'forgot-password': return <ForgotPasswordPage />;
    case 'reset-password': return <ResetPasswordPage />;
    case 'verify-otp': return <ResetPasswordPage />;
    case 'website': return <PublicHomepage />;
    // Public sub-pages
    case 'public-consultation': return <PublicConsultationPage />;
    case 'public-contact': return <PublicContactPage />;
    case 'public-course-finder': return <PublicCourseFinderPage />;
    case 'public-destination': return <PublicDestinationPage slug={slug} />;
    case 'public-universities': return <PublicUniversitiesPage />;
    case 'public-scholarships': return <PublicScholarshipsPage />;
    case 'public-services': return <PublicServicesPage />;
    case 'public-about': return <PublicAboutPage />;
    case 'public-success-stories': return <PublicSuccessStoriesPage />;
    case 'public-team': return <PublicTeamPage />;
    case 'public-faqs': return <PublicFaqsPage />;
    case 'public-resources': return <PublicResourcesPage />;
    case 'public-language-prep': case 'public-english-test':
      return <PublicLanguagePrepPage slug={slug} />;
    case 'public-visa-readiness': return <PublicVisaReadinessPage />;
    case 'public-privacy': return <PublicLegalPage type="privacy" />;
    case 'public-terms': return <PublicLegalPage type="terms" />;
    case 'public-cookies': return <PublicLegalPage type="cookies" />;
    case 'public-cookie': return <PublicLegalPage type="cookies" />;
    case 'public-accessibility': return <PublicLegalPage type="accessibility" />;
    case 'public-communication-policy': return <PublicLegalPage type="communication" />;
    case 'public-lead-data-policy': return <PublicLegalPage type="lead-data" />;
    case 'public-user-guide': return <PublicLegalPage type="user-guide" />;
    default: return <PublicHomepage />;
  }
}

function StudentView({ view }: { view: PortalView }) {
  const pageMap: Record<string, React.ReactNode> = {
    'student-dashboard': <StudentDashboard />,
    'student-profile': <StudentProfilePage />,
    'student-course-finder': <StudentCourseFinder />,
    'student-recommendations': <StudentRecommendations />,
    'student-favorites': <StudentAiMatch />,
    'student-compare': <StudentCompare />,
    'student-applications': <StudentApplications />,
    'student-applications-detail': <StudentApplications />,
    'student-documents': <StudentDocuments />,
    'student-messages': <StudentMessages />,
    'student-visa': <StudentVisaCenter />,
    'student-sop': <StudentSopCvStudio />,
    'student-cv': <StudentSopCvStudio />,
    'student-scholarships': <StudentScholarships />,
    'student-appointments': <StudentAppointments />,
    'student-payments': <StudentPayments />,
    'student-notifications': <StudentNotifications />,
    'student-settings': <StudentSettings />,
    'student-help': <StudentHelpCenter />,
    'student-ai-advisor': <StudentAIAdvisor />,
    'student-referrals': <StudentReferrals />,
    'student-events': <StudentHelpCenter />,
    'student-onboarding': <StudentProfilePage />,
    'student-interviews': <StudentVisaCenter />,
    // Social Media — Student sees ALO social content (read-only inspiration)
    'social-media-hub': <SocialMediaManagementHub portal="student" />,
    'social-content': <SocialMediaManagementHub portal="student" />,
    // Knowledge Sharing — included in each dashboard
    'knowledge-sharing-hub': <KnowledgeSharingHub />,
    'knowledge-sharing-detail': <KnowledgeSharingHub />,
  };
  return <StudentPortalShell>{pageMap[view] || <StudentDashboard />}</StudentPortalShell>;
}

const employeePageMap: Record<string, React.ReactNode> = {
  'employee-dashboard': <EmployeeDashboard />,
  'employee-profile': <EmployeeProfilePage />,
  'employee-tasks': <EmployeeTasksPage />,
  'employee-leads': <EmployeeLeadsPage />,
  'employee-students': <EmployeeStudentsPage />,
  'employee-applications': <EmployeeApplicationsPage />,
  'employee-documents': <EmployeeDocumentsPage />,
  'employee-messages': <EmployeeMessagesPage />,
  'employee-whatsapp': <EmployeeWhatsAppPage />,
  'employee-calendar': <EmployeeCalendarPage />,
  'employee-attendance': <EmployeeAttendancePage />,
  'employee-leave': <EmployeeLeavePage />,
  'employee-salary': <EmployeeSalaryPage />,
  'employee-performance': <EmployeePerformancePage />,
  'employee-reports': <EmployeeReportsPage />,
  'employee-notifications': <EmployeeNotificationsPage />,
  'employee-settings': <EmployeeSettingsPage />,
  'employee-help': <EmployeeHelpPage />,
  // Social Media Management — 24 Platforms, Own AI Agent — All Portals
  'social-media-hub': <SocialMediaManagementHub portal="employee" />,
  'social-inbox': <SocialMediaManagementHub portal="employee" />,
  'social-analytics': <SocialMediaManagementHub portal="employee" />,
  'social-content': <SocialMediaManagementHub portal="employee" />,
  'social-posts': <SocialMediaManagementHub portal="employee" />,
  'social-automation': <SocialMediaManagementHub portal="employee" />,
  // Knowledge Sharing & International Officer — included in each dashboard
  'knowledge-sharing-hub': <KnowledgeSharingHub />,
  'knowledge-sharing-detail': <KnowledgeSharingHub />,
  'international-officer-dashboard': <InternationalOfficerDashboard />,
  'international-officer-research': <InternationalOfficerDashboard />,
  'international-officer-communications': <InternationalOfficerDashboard />,
  'international-officer-contacts': <InternationalOfficerDashboard />,
  'international-officer-agreements': <InternationalOfficerDashboard />,
  'international-officer-strategy': <InternationalOfficerDashboard />,
};

function EmployeeView({ view }: { view: PortalView }) {
  return <EmployeePortalShell>{employeePageMap[view] || <EmployeeDashboard />}</EmployeePortalShell>;
}

const partnerPageMap: Record<string, React.ReactNode> = {
  'partner-dashboard': <PartnerDashboard />,
  'partner-admin-dashboard': <PartnerSuperAdminDashboard />,
  'partner-admin-users': <PartnerAdminUsersPage />,
  'partner-admin-users-create': <PartnerAdminUsersPage />,
  'partner-admin-marketing-studio': <PartnerMarketingStudio />,
  'partner-admin-content-generator': <PartnerMarketingStudio />,
  'partner-admin-image-generator': <PartnerMarketingStudio />,
  'partner-admin-video-generator': <PartnerMarketingStudio />,
  'partner-admin-social-scheduler': <SocialMediaManagementHub portal="partner" />,
  'partner-admin-voucher-codes': <PartnerVouchersPage />,
  'partner-admin-mock-tests': <PartnerVouchersPage />,
  'partner-admin-usage-quota': <PartnerQuotaPage />,
  'partner-admin-interview-prep': <PartnerEnglishPrepView />,
  'partner-admin-course-finder': <PublicCourseFinderPage />,
  'partner-admin-company-profile': <PartnerProfilePage />,
  'partner-admin-settings': <PartnerSettingsPage />,
  'partner-admin-support-request': <PartnerHelpPage />,
  'partner-admin-reports': <PartnerReportsPage />,
  'partner-admin-documents': <PartnerDocumentsPage />,
  'partner-admin-applications': <PartnerApplicationsPage />,
  'partner-admin-students': <PartnerStudentsPage />,
  'partner-admin-leads': <PartnerLeadsPage />,
  'partner-admin-roles': <PartnerAdminUsersPage />,
  'partner-profile': <PartnerProfilePage />,
  'partner-leads': <PartnerLeadsPage />,
  'partner-students': <PartnerStudentsPage />,
  'partner-applications': <PartnerApplicationsPage />,
  'partner-documents': <PartnerDocumentsPage />,
  'partner-commission': <PartnerCommissionPage />,
  'partner-reports': <PartnerReportsPage />,
  'partner-messages': <PartnerMessagesPage />,
  'partner-resources': <PartnerResourcesPage />,
  'partner-referrals': <PartnerReferralsPage />,
  'partner-notifications': <PartnerNotificationsPage />,
  'partner-settings': <PartnerSettingsPage />,
  'partner-help': <PartnerHelpPage />,
  // Social Media Management — 24 Platforms, Own AI Agent
  'social-media-hub': <SocialMediaManagementHub portal="partner" />,
  'social-inbox': <SocialMediaManagementHub portal="partner" />,
  'social-analytics': <SocialMediaManagementHub portal="partner" />,
  'social-content': <SocialMediaManagementHub portal="partner" />,
  'social-posts': <SocialMediaManagementHub portal="partner" />,
  'social-automation': <SocialMediaManagementHub portal="partner" />,
  // Knowledge Sharing & International Officer — Partner Dashboard enhanced
  'knowledge-sharing-hub': <KnowledgeSharingHub />,
  'knowledge-sharing-detail': <KnowledgeSharingHub />,
  'international-officer-dashboard': <InternationalOfficerDashboard />,
  'international-officer-research': <InternationalOfficerDashboard />,
  'international-officer-communications': <InternationalOfficerDashboard />,
  'international-officer-contacts': <InternationalOfficerDashboard />,
  'international-officer-agreements': <InternationalOfficerDashboard />,
  'international-officer-strategy': <InternationalOfficerDashboard />,
};

function PartnerView({ view }: { view: PortalView }) {
  return <PartnerPortalShell>{partnerPageMap[view] || <PartnerDashboard />}</PartnerPortalShell>;
}

// ============================================================
// MARKETING HUB VIEW MAP — 15 views
// ============================================================

const marketingPageMap: Record<string, React.ReactNode> = {
  'marketing-dashboard': <MarketingDashboardView />,
  'marketing-campaigns': <CampaignBuilderCalendarView />,
  'marketing-social': <SocialMediaManagementHub portal="marketing" />,
  'marketing-analytics': <MarketingAnalyticsView />,
  'marketing-inbox': <UnifiedInboxView />,
  'social-media-hub': <SocialMediaManagementHub portal="marketing" />,
  'social-inbox': <SocialMediaManagementHub portal="marketing" />,
  'social-analytics': <SocialMediaManagementHub portal="marketing" />,
  'social-content': <SocialMediaManagementHub portal="marketing" />,
  'social-posts': <SocialMediaManagementHub portal="marketing" />,
  'social-automation': <SocialMediaManagementHub portal="marketing" />,
  'marketing-approvals': <ApprovalQueueView />,
  'marketing-brand-assets': <BrandAssetsPostCreatorView />,
  'marketing-keywords': <KeywordTriggersView />,
  'marketing-whatsapp': <WhatsAppAutomationView />,
  'marketing-leads': <LeadPipelineView />,
  'marketing-ai-replies': <AiReplyManagerView />,
  'marketing-assignment': <ConversationAssignmentView />,
  'marketing-handoff': <HumanHandoffView />,
  'marketing-workflows': <N8nWorkflowsView />,
  'marketing-audit': <MarketingAuditAccessView />,
  // Knowledge Sharing & International Officer
  'knowledge-sharing-hub': <KnowledgeSharingHub />,
  'knowledge-sharing-detail': <KnowledgeSharingHub />,
  'international-officer-dashboard': <InternationalOfficerDashboard />,
  'international-officer-research': <InternationalOfficerDashboard />,
  'international-officer-communications': <InternationalOfficerDashboard />,
  'international-officer-contacts': <InternationalOfficerDashboard />,
  'international-officer-agreements': <InternationalOfficerDashboard />,
  'international-officer-strategy': <InternationalOfficerDashboard />,
};

function MarketingView({ view }: { view: PortalView }) {
  return <MarketingHubShell>{() => marketingPageMap[view] || <MarketingDashboardView />}</MarketingHubShell>;
}

// ============================================================
// CRM VIEW MAP — 33 views, each mapped to its own page component
// ============================================================

const crmPageMap: Record<string, React.ReactNode> = {
  // Overview
  'crm-dashboard': <CrmDashboardRouter />,
  'crm-analytics': <CrmAnalyticsPage />,
  // Student Management
  'crm-leads': <CrmLeadsPage />,
  'crm-students': <CrmStudentsPage />,
  'crm-applications': <CrmApplicationsPage />,
  'crm-documents': <CrmDocumentsPage />,
  'crm-scholarships': <CrmScholarshipsPage />,
  // Course & University
  'crm-course-finder': <CrmCourseFinderPage />,
  'crm-universities': <CrmUniversitiesPage />,
  // Communication
  'crm-inbox': <CrmInboxPage />,
  'crm-whatsapp': <CrmWhatsAppPage />,
  'crm-social': <CrmSocialPage />,
  'crm-communications': <CrmCommunicationsPage />,
  // Social Media Management — 24 Platforms, Own AI Agent
  'social-media-hub': <SocialMediaManagementHub portal="crm" />,
  'social-inbox': <SocialMediaManagementHub portal="crm" />,
  'social-analytics': <SocialMediaManagementHub portal="crm" />,
  'social-content': <SocialMediaManagementHub portal="crm" />,
  'social-posts': <SocialMediaManagementHub portal="crm" />,
  'social-automation': <SocialMediaManagementHub portal="crm" />,
  // Operations
  'crm-tasks': <CrmTasksPage />,
  'crm-appointments': <CrmAppointmentsPage />,
  'crm-support': <CrmSupportPage />,
  'crm-visa': <CrmVisaPage />,
  'crm-visa-dashboard': <VisaOfficerDashboard />,
  'crm-visa-cases': <VisaOfficerDashboard />,
  'crm-visa-interviews': <VisaInterviewWorkspace />,
  'crm-visa-readiness': <VisaOfficerDashboard />,
  'crm-visa-reports': <VisaOfficerDashboard />,
  'crm-import-center': <OldCrmImportCenterPage />,
  'crm-university-updates': <UniversityDataUpdateCenterPage />,
  'crm-access-control-center': <AccessControlCenterPage />,
  'partner-admin-dashboard': <PartnerSuperAdminDashboard />,
  'partner-admin-marketing-studio': <PartnerMarketingStudio />,
  'partner-admin-content-generator': <PartnerMarketingStudio />,
  'employee-visa-dashboard': <VisaOfficerDashboard />,
  'employee-visa-officer': <VisaOfficerDashboard />,
  'employee-visa-interview-officer': <VisaOfficerDashboard />,
  'employee-visa-cases': <VisaOfficerDashboard />,
  'employee-visa-interviews': <VisaInterviewWorkspace />,
  'employee-visa-documents': <VisaOfficerDashboard />,
  'employee-visa-readiness': <VisaOfficerDashboard />,
  'employee-visa-reports': <VisaOfficerDashboard />,
  // Business
  'crm-finance': <CrmFinancePage />,
  'crm-commissions': <CrmCommissionsPage />,
  'crm-partners': <CrmPartnersPage />,
  'crm-marketing': <CrmMarketingPage />,
  // System
  'crm-reports': <CrmReportsPage />,
  'crm-audit-logs': <CrmAuditLogsPage />,
  'crm-settings': <CrmSettingsPage />,
  'crm-users': <CrmUsersPage />,
  'crm-roles': <CrmRolesPage />,
  'crm-permissions': <CrmPermissionsPage />,
  'crm-hrm': <CrmHRMPage />,
  // AI
  'crm-ai-command': <CrmAgentOperationsPage />,
  // SEO Growth System
  'crm-seo-dashboard': <CrmSeoGrowthDashboard />,
  'crm-seo-keywords': <CrmSeoKeywordTracker />,
  'crm-seo-content': <CrmSeoContentWorkflow />,
  'crm-seo-competitors': <CrmSeoCompetitorAnalysis />,
  'crm-seo-technical': <CrmSeoTechnicalAudit />,
  'crm-seo-policy': <CrmSeoPolicyWatcher />,
  // Knowledge Sharing — included in each dashboard allowing anyone to upload
  'knowledge-sharing-hub': <KnowledgeSharingHub />,
  'knowledge-sharing-detail': <KnowledgeSharingHub />,
  // International Officer / Partner Dashboard — university research, partnership comms, contacts, business strategy
  'international-officer-dashboard': <InternationalOfficerDashboard />,
  'international-officer-research': <InternationalOfficerDashboard />,
  'international-officer-communications': <InternationalOfficerDashboard />,
  'international-officer-contacts': <InternationalOfficerDashboard />,
  'international-officer-agreements': <InternationalOfficerDashboard />,
  'international-officer-strategy': <InternationalOfficerDashboard />,
  // Super Admin Master Command Center — Website CMS + CRM Command + Agent Tasks + System + Mobile PWA
  'super-admin-master-command': <SuperAdminMasterCommandCenter />,
  'super-admin-website-cms': <SuperAdminWebsiteCmsHub />,
  'super-admin-crm-command': <SuperAdminCrmCommandCenter />,
};

function CrmAdminView({ view }: { view: PortalView }) {
  return <CrmAdminShell>{crmPageMap[view] || <CrmDashboardRouter />}</CrmAdminShell>;
}

// ============================================================
// MAIN ROUTER
// ============================================================

export default function HomePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const { currentView, isAuthenticated, userType } = usePortalStore();
  const setPublicPage = usePortalStore((s) => s.setPublicPage);
  const setSelectedPortal = usePortalStore((s) => s.setSelectedPortal);
  const searchParams = useSearchParams();

  // ============================================================
  // URL → STORE SYNC
  // Reads window.location.pathname and searchParams to match the
  // exact route and set currentView + selectedPortal accurately.
  // ============================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;
    const pParam = searchParams.get('p');
    const slug = searchParams.get('slug');
    const service = searchParams.get('service');

    const pathToViewMap: Record<string, { view: PortalView; portal?: 'student' | 'partner' | 'employee' | 'admin' }> = {
      '/': { view: 'website' },
      '/book-consultation': { view: 'public-consultation' },
      '/contact': { view: 'public-contact' },
      '/course-finder': { view: 'public-course-finder' },
      '/destinations': { view: 'public-destination' },
      '/universities': { view: 'public-universities' },
      '/scholarships': { view: 'public-scholarships' },
      '/services': { view: 'public-services' },
      '/about': { view: 'public-about' },
      '/success-stories': { view: 'public-success-stories' },
      '/team': { view: 'public-team' },
      '/faqs': { view: 'public-faqs' },
      '/resources': { view: 'public-resources' },
      '/visa/readiness': { view: 'public-visa-readiness' },
      '/privacy-policy': { view: 'public-privacy' },
      '/terms': { view: 'public-terms' },
      '/cookies': { view: 'public-cookies' },
      '/communication-policy': { view: 'public-communication-policy' },
      '/lead-data-usage-policy': { view: 'public-lead-data-policy' },
      '/user-guide': { view: 'public-user-guide' },
      '/accessibility': { view: 'public-accessibility' },
      '/student/login': { view: 'student-login', portal: 'student' },
      '/student/register': { view: 'student-register', portal: 'student' },
      '/partner/login': { view: 'partner-login', portal: 'partner' },
      '/partner/register': { view: 'partner-register', portal: 'partner' },
      '/employee/login': { view: 'employee-login', portal: 'employee' },
      '/admin/login': { view: 'admin-login', portal: 'admin' },
      '/admin': { view: 'admin-login', portal: 'admin' },
      '/portals': { view: 'portals' },
    };

    let entry = pathToViewMap[pathname];

    if ((!entry || pathname === '/') && pParam) {
      const pParamMap: Record<string, { view: PortalView; portal?: 'student' | 'partner' | 'employee' | 'admin' }> = {
        'consultation': { view: 'public-consultation' },
        'contact': { view: 'public-contact' },
        'course-finder': { view: 'public-course-finder' },
        'destination': { view: 'public-destination' },
        'destinations': { view: 'public-destination' },
        'universities': { view: 'public-universities' },
        'scholarships': { view: 'public-scholarships' },
        'services': { view: 'public-services' },
        'about': { view: 'public-about' },
        'success-stories': { view: 'public-success-stories' },
        'team': { view: 'public-team' },
        'faqs': { view: 'public-faqs' },
        'resources': { view: 'public-resources' },
        'visa-readiness': { view: 'public-visa-readiness' },
        'privacy': { view: 'public-privacy' },
        'terms': { view: 'public-terms' },
        'cookies': { view: 'public-cookies' },
        'communication-policy': { view: 'public-communication-policy' },
        'lead-data-usage-policy': { view: 'public-lead-data-policy' },
        'user-guide': { view: 'public-user-guide' },
        'accessibility': { view: 'public-accessibility' },
        'student-login': { view: 'student-login', portal: 'student' },
        'student-register': { view: 'student-register', portal: 'student' },
        'partner-login': { view: 'partner-login', portal: 'partner' },
        'partner-register': { view: 'partner-register', portal: 'partner' },
        'employee-login': { view: 'employee-login', portal: 'employee' },
        'admin-login': { view: 'admin-login', portal: 'admin' },
        'portals': { view: 'portals' },
      };
      entry = pParamMap[pParam];
    }

    if (entry) {
      if (entry.portal) setSelectedPortal(entry.portal);
      setPublicPage(entry.view, slug);
      if (service) {
        try { sessionStorage.setItem('alo-consultation-service', service); } catch {}
      }
    } else if (pathname === '/') {
      setPublicPage('website', null);
    }
  }, [searchParams]);

  if (!isAuthenticated || currentView === 'website' || currentView.startsWith('public-')) {
    return <PublicView view={currentView} />;
  }

  if (userType === 'STUDENT') return <StudentView view={currentView} />;
  if (userType === 'PARTNER') return <PartnerView view={currentView} />;
  if (userType === 'EMPLOYEE') return <EmployeeView view={currentView} />;
  if (userType === 'MARKETING' || userType === 'MARKETING_MANAGER') return <MarketingView view={currentView} />;
  if (userType === 'ADMIN' || userType === 'SUPER_ADMIN') return <CrmAdminView view={currentView} />;

  return <PublicView view="website" />;
}
