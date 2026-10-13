"use client";

// ── Explicit import map for all 66 portal views ──────────────────────
// This avoids a single giant dynamic() call that can be truncated

import type { ComponentType } from 'react';

export interface ViewLoadResult {
  default: ComponentType<any>;
  fallback: ComponentType<any>;
}

const loading = (): JSX.Element => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin size-8 border-4 border-[#E2E8F0] border-t-[#2563EB] rounded-full" />
  </div>
);

export const viewImports: Record<string, () => Promise<ViewLoadResult>> = {
  'landing': () => import('@/components/alo/views/landing').then(m => ({ default: (m as any).default || (m as any).LandingView as ComponentType<any> })),
  'public-home': () => import('@/components/alo/views/public-home').then(m => ({ default: (m as any).default || (m as any).PublicHome as ComponentType<any> })),
  'public-destinations': () => import('@/components/alo/views/public-destinations').then(m => ({ default: (m as any).default || (m as any).PublicDestinations as ComponentType<any> })),
  'public-country': () => import('@/components/alo/views/public-country').then(m => ({ default: (m as any).default || (m as any).PublicCountry as ComponentType<any> })),
  'public-universities': () => import('@/components/alo/views/public-universities').then(m => ({ default: (m as any).default || (m as any).PublicUniversities as ComponentType<any> })),
  'public-university': () => import('@/components/alo/views/public-university').then(m => ({ default: (m as any).default || (m as any).PublicUniversity as ComponentType<any> })),
  'public-courses': () => import('@/components/alo/views/public-courses').then(m => ({ default: (m as any).default || (m as any).PublicCourses as ComponentType<any> })),
  'public-course': () => import('@/components/alo/views/public-course').then(m => ({ default: (m as any).default || (m as any).PublicCourse as ComponentType<any> })),
  'public-exams': () => import('@/components/alo/views/public-exams').then(m => ({ default: (m as any).default || (m as any).PublicExams as ComponentType<any> })),
  'public-exam': () => import('@/components/alo/views/public-exam').then(m => ({ default: (m as any).default || (m as any).PublicExam as ComponentType<any> })),
  'public-course-finder': () => import('@/components/alo/views/public-course-finder').then(m => ({ default: (m as any).default || (m as any).PublicCourseFinder as ComponentType<any> })),
  'public-review-submit': () => import('@/components/alo/views/public-review-submit').then(m => ({ default: (m as any).default || (m as any).PublicReviewSubmit as ComponentType<any> })),
  'auth-login': () => import('@/components/alo/views/auth-login').then(m => ({ default: (m as any).AuthLogin as ComponentType<any> })),
  'auth-register': () => import('@/components/alo/views/auth-register').then(m => ({ default: (m as any).AuthRegister as ComponentType<any> })),
  'auth-reset-password': () => import('@/components/alo/views/auth-reset-password').then(m => ({ default: (m as any).AuthResetPassword as ComponentType<any> })),
  'auth-verify-otp': () => import('@/components/alo/views/auth-verify-otp').then(m => ({ default: (m as any).AuthVerifyOtp as ComponentType<any> })),
  'student-dashboard': () => import('@/components/alo/views/student-dashboard').then(m => ({ default: (m as any).default || (m as any).StudentDashboard as ComponentType<any> })),
  'student-profile': () => import('@/components/alo/views/student-profile-form').then(m => ({ default: (m as any).default || (m as any).StudentProfileForm as ComponentType<any> })),
  'document-hub': () => import('@/components/alo/views/document-hub').then(m => ({ default: (m as any).default || (m as any).DocumentHub as ComponentType<any> })),
  'applications': () => import('@/components/alo/views/applications').then(m => ({ default: (m as any).default || (m as any).ApplicationsView as ComponentType<any> })),
  'english-test': () => import('@/components/alo/views/english-test').then(m => ({ default: (m as any).default || (m as any).EnglishTestView as ComponentType<any> })),
  'ai-interview': () => import('@/components/alo/views/ai-interview').then(m => ({ default: (m as any).default || (m as any).AiInterviewView as ComponentType<any> })),
  'crm': () => import('@/components/alo/views/crm-dashboard').then(m => ({ default: (m as any).default || (m as any).CrmDashboard as ComponentType<any> })),
  'student-360': () => import('@/components/alo/views/student-360').then(m => ({ default: (m as any).default || (m as any).Student360 as ComponentType<any> })),
  'visa': () => import('@/components/alo/views/visa-dashboard').then(m => ({ default: (m as any).default || (m as any).VisaDashboard as ComponentType<any> })),
  'marketing': () => import('@/components/alo/views/marketing-dashboard').then(m => ({ default: (m as any).default || (m as any).MarketingDashboard as ComponentType<any> })),
  'marketing-ai': () => import('@/components/alo/views/marketing-ai').then(m => ({ default: (m as any).default || (m as any).MarketingAi as ComponentType<any> })),
  'finance': () => import('@/components/alo/views/finance-dashboard').then(m => ({ default: (m as any).default || (m as any).FinanceDashboard as ComponentType<any> })),
  'hrm': () => import('@/components/alo/views/hrm-dashboard').then(m => ({ default: (m as any).default || (m as any).HrmDashboard as ComponentType<any> })),
  'enterprise-hr': () => import('@/components/alo/views/enterprise-hr-dashboard').then(m => ({ default: (m as any).default || (m as any).EnterpriseHrDashboard as ComponentType<any> })),
  'employee': () => import('@/components/alo/views/employee-management').then(m => ({ default: (m as any).default || (m as any).EmployeeManagement as ComponentType<any> })),
  'partner-portal': () => import('@/components/alo/views/partner-portal').then(m => ({ default: (m as any).default || (m as any).PartnerPortal as ComponentType<any> })),
  'partner-admin': () => import('@/components/alo/views/partner-admin-dashboard').then(m => ({ default: (m as any).default || (m as any).PartnerAdminDashboard as ComponentType<any> })),
  'partner-marketing': () => import('@/components/alo/views/partner-marketing-studio').then(m => ({ default: (m as any).default || (m as any).PartnerMarketingStudio as ComponentType<any> })),
  'partner-comm': () => import('@/components/alo/views/partner-comm-hub').then(m => ({ default: (m as any).default || (m as any).PartnerCommHub as ComponentType<any> })),
  'counselor': () => import('@/components/alo/views/counselor-dashboard').then(m => ({ default: (m as any).default || (m as any).CounselorDashboard as ComponentType<any> })),
  'counselor-student-360': () => import('@/components/alo/views/counselor-student-360').then(m => ({ default: (m as any).default || (m as any).CounselorStudent360 as ComponentType<any> })),
  'unified-inbox': () => import('@/components/alo/views/unified-inbox').then(m => ({ default: (m as any).default || (m as any).UnifiedInbox as ComponentType<any> })),
  'sop-studio': () => import('@/components/alo/views/sop-studio').then(m => ({ default: (m as any).default || (m as any).SopStudio as ComponentType<any> })),
  'permission-matrix': () => import('@/components/alo/views/permission-matrix').then(m => ({ default: (m as any).default || (m as any).PermissionMatrix as ComponentType<any> })),
  'access-control': () => import('@/components/alo/views/access-control-center').then(m => ({ default: (m as any).default || (m as any).AccessControlCenter as ComponentType<any> })),
  'audit-logs': () => import('@/components/alo/views/audit-logs').then(m => ({ default: (m as any).default || (m as any).AuditLogs as ComponentType<any> })),
  'weekly-reports': () => import('@/components/alo/views/weekly-reports').then(m => ({ default: (m as any).default || (m as any).WeeklyReports as ComponentType<any> })),
  'import-center': () => import('@/components/alo/views/import-center').then(m => ({ default: (m as any).default || (m as any).ImportCenter as ComponentType<any> })),
  'csv-import': () => import('@/components/alo/views/csv-import-center').then(m => ({ default: (m as any).default || (m as any).CsvImportCenter as ComponentType<any> })),
  'admin-courses': () => import('@/components/alo/views/admin-course-management').then(m => ({ default: (m as any).default || (m as any).AdminCourseManagement as ComponentType<any> })),
  'student-course-finder': () => import('@/components/alo/views/student-course-finder').then(m => ({ default: (m as any).default || (m as any).StudentCourseFinder as ComponentType<any> })),
  'ai-command': () => import('@/components/alo/views/ai-command-center').then(m => ({ default: (m as any).default || (m as any).AiCommandCenter as ComponentType<any> })),
  'enterprise-ai': () => import('@/components/alo/views/enterprise-ai-command').then(m => ({ default: (m as any).default || (m as any).EnterpriseAiCommand as ComponentType<any> })),
  'central-ai': () => import('@/components/alo/views/central-ai-command').then(m => ({ default: (m as any).default || (m as any).CentralAiCommand as ComponentType<any> })),
  'omnichannel': () => import('@/components/alo/views/omnichannel-communication-center').then(m => ({ default: (m as any).default || (m as any).OmnichannelCommunicationCenter as ComponentType<any> })),
  'comm-command': () => import('@/components/alo/views/comm-command-center').then(m => ({ default: (m as any).default || (m as any).CommCommandCenter as ComponentType<any> })),
  'whatsapp': () => import('@/components/alo/views/whatsapp-command-center').then(m => ({ default: (m as any).default || (m as any).WhatsappCommandCenter as ComponentType<any> })),
  'phone': () => import('@/components/alo/views/phone-call-center').then(m => ({ default: (m as any).default || (m as any).PhoneCallCenter as ComponentType<any> })),
  'sla': () => import('@/components/alo/views/sla-performance').then(m => ({ default: (m as any).default || (m as any).SlaPerformance as ComponentType<any> })),
  'social': () => import('@/components/alo/views/social-dashboard').then(m => ({ default: (m as any).default || (m as any).SocialDashboard as ComponentType<any> })),
  'comm-templates': () => import('@/components/alo/views/comm-templates').then(m => ({ default: (m as any).default || (m as any).CommTemplates as ComponentType<any> })),
  'knowledge-center': () => import('@/components/alo/views/knowledge-center').then(m => ({ default: (m as any).default || (m as any).KnowledgeCenter as ComponentType<any> })),
  'university-monitoring': () => import('@/components/alo/views/university-monitoring').then(m => ({ default: (m as any).default || (m as any).UniversityMonitoring as ComponentType<any> })),
  'review-dashboard': () => import('@/components/alo/views/review-dashboard').then(m => ({ default: (m as any).default || (m as any).ReviewDashboard as ComponentType<any> })),
  'storage-monitoring': () => import('@/components/alo/views/storage-monitoring').then(m => ({ default: (m as any).default || (m as any).StorageMonitoring as ComponentType<any> })),
  'scholarship-finder': () => import('@/components/alo/views/scholarship-finder').then(m => ({ default: (m as any).default || (m as any).ScholarshipFinder as ComponentType<any> })),
  'application-manager': () => import('@/components/alo/views/application-manager-portal').then(m => ({ default: (m as any).default || (m as any).ApplicationManagerPortal as ComponentType<any> })),
  'application-team': () => import('@/components/alo/views/application-team-dashboard').then(m => ({ default: (m as any).default || (m as any).ApplicationTeamDashboard as ComponentType<any> })),
  'super-admin': () => import('@/components/alo/views/super-admin-dashboard').then(m => ({ default: (m as any).default || (m as any).SuperAdminDashboard as ComponentType<any> })),
  'english-test-dashboard': () => import('@/components/alo/views/english-test-dashboard').then(m => ({ default: (m as any).default || (m as any).EnglishTestDashboard as ComponentType<any> })),
};
