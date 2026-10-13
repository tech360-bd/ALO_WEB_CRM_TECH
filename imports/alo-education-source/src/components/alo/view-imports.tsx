"use client";

// ── Explicit import map for all portal views ──────────────────────
// Keys MUST match NAV_ITEMS[].key in alo-types.ts exactly.
// AppShell does viewImports[view] — any mismatch shows "View not found".

import type { ComponentType } from 'react';

export interface ViewLoadResult {
  default: ComponentType<any>;
  fallback: ComponentType<any>;
}

const loading = (): JSX.Element => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin size-8 border-4 border-[#E2E8F0] border-t-[#F37021] rounded-full" />
  </div>
);

export { loading };

// Helper: resolve named export or default export
const v = (importFn: () => Promise<any>, exportName: string) =>
  () => importFn().then(m => ({ default: (m as any).default || (m as any)[exportName] as ComponentType<any> }));

export const viewImports: Record<string, () => Promise<ViewLoadResult>> = {
  // ── Public ────────────────────────────────────────────────────────
  'landing':                    v(() => import('@/components/alo/views/landing'), 'LandingView'),
  'public-home':                v(() => import('@/components/alo/views/public-home'), 'PublicHome'),
  'public-destinations':        v(() => import('@/components/alo/views/public-destinations'), 'PublicDestinations'),
  'public-country':             v(() => import('@/components/alo/views/public-country'), 'PublicCountry'),
  'public-universities':        v(() => import('@/components/alo/views/public-universities'), 'PublicUniversities'),
  'public-university':          v(() => import('@/components/alo/views/public-university'), 'PublicUniversity'),
  'public-courses':             v(() => import('@/components/alo/views/public-courses'), 'PublicCourses'),
  'public-course':              v(() => import('@/components/alo/views/public-course'), 'PublicCourse'),
  'public-exams':               v(() => import('@/components/alo/views/public-exams'), 'PublicExams'),
  'public-exam':                v(() => import('@/components/alo/views/public-exam'), 'PublicExam'),
  'public-course-finder':       v(() => import('@/components/alo/views/public-course-finder'), 'PublicCourseFinder'),
  'public-review-submit':       v(() => import('@/components/alo/views/public-review-submit'), 'PublicReviewSubmit'),
  'scholarship-finder':         v(() => import('@/components/alo/views/scholarship-finder'), 'ScholarshipFinder'),

  // ── Auth ──────────────────────────────────────────────────────────
  'auth-login':                 v(() => import('@/components/alo/views/auth-login'), 'AuthLogin'),
  'auth-register':              v(() => import('@/components/alo/views/auth-register'), 'AuthRegister'),
  'auth-reset-password':        v(() => import('@/components/alo/views/auth-reset-password'), 'AuthResetPassword'),
  'auth-verify-otp':            v(() => import('@/components/alo/views/auth-verify-otp'), 'AuthVerifyOtp'),

  // ── Student Portal ───────────────────────────────────────────────
  'student-dashboard':          v(() => import('@/components/alo/views/student-dashboard'), 'StudentDashboard'),
  'student-profile':            v(() => import('@/components/alo/views/student-profile-form'), 'StudentProfileForm'),
  'document-hub':               v(() => import('@/components/alo/views/document-hub'), 'DocumentHub'),
  'applications':               v(() => import('@/components/alo/views/applications'), 'ApplicationsView'),
  'english-test':               v(() => import('@/components/alo/views/english-test'), 'EnglishTestView'),
  'ai-interview':               v(() => import('@/components/alo/views/ai-interview'), 'AiInterviewView'),
  'student-course-finder':      v(() => import('@/components/alo/views/student-course-finder'), 'StudentCourseFinder'),

  // ── Counselor Portal ─────────────────────────────────────────────
  'counselor-dashboard':        v(() => import('@/components/alo/views/counselor-dashboard'), 'CounselorDashboard'),
  'counselor-student-360':      v(() => import('@/components/alo/views/counselor-student-360'), 'CounselorStudent360'),
  'unified-inbox':              v(() => import('@/components/alo/views/unified-inbox'), 'UnifiedInbox'),
  'sop-studio':                 v(() => import('@/components/alo/views/sop-studio'), 'SopStudio'),
  'application-manager-portal': v(() => import('@/components/alo/views/application-manager-portal'), 'ApplicationManagerPortal'),

  // ── CRM & Operations ─────────────────────────────────────────────
  'crm':                        v(() => import('@/components/alo/views/crm-dashboard'), 'CrmDashboard'),
  'student-360':                v(() => import('@/components/alo/views/student-360'), 'Student360'),
  'visa':                       v(() => import('@/components/alo/views/visa-dashboard'), 'VisaDashboard'),
  'marketing':                  v(() => import('@/components/alo/views/marketing-dashboard'), 'MarketingDashboard'),
  'marketing-ai':               v(() => import('@/components/alo/views/marketing-ai'), 'MarketingAi'),

  // ── System ────────────────────────────────────────────────────────
  'weekly-reports':             v(() => import('@/components/alo/views/weekly-reports'), 'WeeklyReports'),
  'import-center':              v(() => import('@/components/alo/views/import-center'), 'ImportCenter'),
  'csv-import-center':          v(() => import('@/components/alo/views/csv-import-center'), 'CsvImportCenter'),
  'admin-course-management':    v(() => import('@/components/alo/views/admin-course-management'), 'AdminCourseManagement'),
  'permission-matrix':          v(() => import('@/components/alo/views/permission-matrix'), 'PermissionMatrix'),
  'access-control-center':      v(() => import('@/components/alo/views/access-control-center'), 'AccessControlCenter'),
  'employee-management':        v(() => import('@/components/alo/views/employee-management'), 'EmployeeManagement'),
  'employee-profile':           v(() => import('@/components/alo/views/employee-management'), 'EmployeeManagement'),
  'enterprise-hr-dashboard':    v(() => import('@/components/alo/views/enterprise-hr-dashboard'), 'EnterpriseHrDashboard'),
  'ai-command':                 v(() => import('@/components/alo/views/ai-command-center'), 'AiCommandCenter'),
  'enterprise-ai-command':      v(() => import('@/components/alo/views/enterprise-ai-command'), 'EnterpriseAiCommand'),
  'audit':                      v(() => import('@/components/alo/views/audit-logs'), 'AuditLogs'),
  'omnichannel-communication-center': v(() => import('@/components/alo/views/omnichannel-communication-center'), 'OmnichannelCommunicationCenter'),
  'knowledge-center':           v(() => import('@/components/alo/views/knowledge-center'), 'KnowledgeCenter'),
  'central-ai-command':         v(() => import('@/components/alo/views/central-ai-command'), 'CentralAiCommand'),
  'university-monitoring':      v(() => import('@/components/alo/views/university-monitoring'), 'UniversityMonitoring'),
  'review-dashboard':           v(() => import('@/components/alo/views/review-dashboard'), 'ReviewDashboard'),
  'storage-monitoring':         v(() => import('@/components/alo/views/storage-monitoring'), 'StorageMonitoring'),
  'english-test-dashboard':     v(() => import('@/components/alo/views/english-test-dashboard'), 'EnglishTestDashboard'),

  // ── Communication ────────────────────────────────────────────────
  'comm-command-center':        v(() => import('@/components/alo/views/comm-command-center'), 'CommCommandCenter'),
  'whatsapp-command-center':    v(() => import('@/components/alo/views/whatsapp-command-center'), 'WhatsappCommandCenter'),
  'phone-call-center':          v(() => import('@/components/alo/views/phone-call-center'), 'PhoneCallCenter'),
  'sla-performance':            v(() => import('@/components/alo/views/sla-performance'), 'SlaPerformance'),
  'social-dashboard':           v(() => import('@/components/alo/views/social-dashboard'), 'SocialDashboard'),
  'comm-templates':             v(() => import('@/components/alo/views/comm-templates'), 'CommTemplates'),

  // ── Portals ──────────────────────────────────────────────────────
  'partner-portal':             v(() => import('@/components/alo/views/partner-portal'), 'PartnerPortal'),
  'partner-admin-dashboard':    v(() => import('@/components/alo/views/partner-admin-dashboard'), 'PartnerAdminDashboard'),
  'partner-marketing-studio':   v(() => import('@/components/alo/views/partner-marketing-studio'), 'PartnerMarketingStudio'),
  'partner-comm-hub':           v(() => import('@/components/alo/views/partner-comm-hub'), 'PartnerCommHub'),
  'application-team':           v(() => import('@/components/alo/views/application-team-dashboard'), 'ApplicationTeamDashboard'),
  'finance-dashboard':          v(() => import('@/components/alo/views/finance-dashboard'), 'FinanceDashboard'),
  'hrm-dashboard':              v(() => import('@/components/alo/views/hrm-dashboard'), 'HrmDashboard'),
  'super-admin-dashboard':      v(() => import('@/components/alo/views/super-admin-dashboard'), 'SuperAdminDashboard'),
};
