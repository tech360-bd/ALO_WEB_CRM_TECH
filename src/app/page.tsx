"use client";

import * as React from "react";
import { AppShell } from "@/components/alo/app-shell";
import { PublicShell } from "@/components/alo/public-shell";
import { AiChatWidget } from "@/components/alo/ai-chat-widget";
import { PrivacyProvider } from "@/components/alo/privacy-mode";
import { type ViewKey } from "@/lib/alo-types";
import { LandingView } from "@/components/alo/views/landing";
import { StudentDashboard } from "@/components/alo/views/student-dashboard";
import { StudentProfileForm } from "@/components/alo/views/student-profile-form";
import { DocumentHub } from "@/components/alo/views/document-hub";
import { ApplicationsView } from "@/components/alo/views/applications";
import { EnglishTestView } from "@/components/alo/views/english-test";
import { AiInterviewView } from "@/components/alo/views/ai-interview";
import { CrmDashboard } from "@/components/alo/views/crm-dashboard";
import { Student360 } from "@/components/alo/views/student-360";
import { VisaDashboard } from "@/components/alo/views/visa-dashboard";
import { MarketingDashboard } from "@/components/alo/views/marketing-dashboard";
import { AiCommandCenter } from "@/components/alo/views/ai-command-center";
import { AuditLogs } from "@/components/alo/views/audit-logs";
import { PublicHome } from "@/components/alo/views/public-home";
import { PublicDestinations } from "@/components/alo/views/public-destinations";
import { PublicCountry } from "@/components/alo/views/public-country";
import { PublicUniversities } from "@/components/alo/views/public-universities";
import { PublicUniversity } from "@/components/alo/views/public-university";
import { PublicCourses } from "@/components/alo/views/public-courses";
import { PublicCourse } from "@/components/alo/views/public-course";
import { PublicExams } from "@/components/alo/views/public-exams";
import { PublicExam } from "@/components/alo/views/public-exam";
import { PublicCourseFinder } from "@/components/alo/views/public-course-finder";
import { CounselorDashboard } from "@/components/alo/views/counselor-dashboard";
import { CounselorStudent360 } from "@/components/alo/views/counselor-student-360";
import { UnifiedInbox } from "@/components/alo/views/unified-inbox";
import { SopStudio } from "@/components/alo/views/sop-studio";
import { PermissionMatrix } from "@/components/alo/views/permission-matrix";
import { WeeklyReports } from "@/components/alo/views/weekly-reports";
import { MarketingAi } from "@/components/alo/views/marketing-ai";
import { ScholarshipFinder } from "@/components/alo/views/scholarship-finder";
import { PartnerPortal } from "@/components/alo/views/partner-portal";
import { ApplicationTeamDashboard } from "@/components/alo/views/application-team-dashboard";
import { FinanceDashboard } from "@/components/alo/views/finance-dashboard";
import { HrmDashboard } from "@/components/alo/views/hrm-dashboard";
import { ImportCenter } from "@/components/alo/views/import-center";
import { EnglishTestDashboard } from "@/components/alo/views/english-test-dashboard";
import { AccessControlCenter } from "@/components/alo/views/access-control-center";
import { EmployeeManagement } from "@/components/alo/views/employee-management";
import { PartnerAdminDashboard } from "@/components/alo/views/partner-admin-dashboard";
import { PartnerMarketingStudio } from "@/components/alo/views/partner-marketing-studio";
import { StudentCourseFinder } from "@/components/alo/views/student-course-finder";
import { StudentSop } from "@/components/alo/views/student-sop";
import { StudentCv } from "@/components/alo/views/student-cv";
import { StudentVisaReadiness } from "@/components/alo/views/student-visa-readiness";
import { StudentVisaChecklist } from "@/components/alo/views/student-visa-checklist";
import { StudentCas } from "@/components/alo/views/student-cas";
import { StudentTimeline } from "@/components/alo/views/student-timeline";
import { StudentNotifications } from "@/components/alo/views/student-notifications";
import { StudentAppointments } from "@/components/alo/views/student-appointments";
import { StudentReferrals } from "@/components/alo/views/student-referrals";
import { StudentHelp } from "@/components/alo/views/student-help";
import { PublicOffices } from "@/components/alo/views/public-offices";
import { PublicPartners } from "@/components/alo/views/public-partners";
import { PublicCareers } from "@/components/alo/views/public-careers";
import { PublicRefundPolicy } from "@/components/alo/views/public-refund-policy";
import { PublicHigherStudy } from "@/components/alo/views/public-higher-study";
import { AdminCourseManagement } from "@/components/alo/views/admin-course-management";
import { CsvImportCenter } from "@/components/alo/views/csv-import-center";
import { AuthLogin } from "@/components/alo/views/auth-login";
import { AuthRegister } from "@/components/alo/views/auth-register";
import { AuthResetPassword } from "@/components/alo/views/auth-reset-password";
import { AuthVerifyOtp } from "@/components/alo/views/auth-verify-otp";
import { SuperAdminDashboard } from "@/components/alo/views/super-admin-dashboard";
import { EnterpriseHrDashboard } from "@/components/alo/views/enterprise-hr-dashboard";
import { ApplicationManagerPortal } from "@/components/alo/views/application-manager-portal";
import { EnterpriseAiCommand } from "@/components/alo/views/enterprise-ai-command";
import { OmnichannelCommunicationCenter } from "@/components/alo/views/omnichannel-communication-center";
import { KnowledgeCenter } from "@/components/alo/views/knowledge-center";
import { CentralAiCommand } from "@/components/alo/views/central-ai-command";
import { UniversityMonitoring } from "@/components/alo/views/university-monitoring";
import { ReviewDashboard } from "@/components/alo/views/review-dashboard";
import { StorageMonitoring } from "@/components/alo/views/storage-monitoring";
import { PublicReviewSubmit } from "@/components/alo/views/public-review-submit";
import { PublicAbout } from "@/components/alo/views/public-about";
import { PublicTeam } from "@/components/alo/views/public-team";
import { PublicServices } from "@/components/alo/views/public-services";
import { PublicBlog } from "@/components/alo/views/public-blog";
import { PublicNews } from "@/components/alo/views/public-news";
import { PublicEvents } from "@/components/alo/views/public-events";
import { PublicSuccessStories } from "@/components/alo/views/public-success-stories";
import { PublicFaq } from "@/components/alo/views/public-faq";
import { PublicContact } from "@/components/alo/views/public-contact";
import { PublicVisaSupport } from "@/components/alo/views/public-visa-support";
import { PublicAdmissionRequirements } from "@/components/alo/views/public-admission-requirements";
import { PublicApplicationProcess } from "@/components/alo/views/public-application-process";
import { PublicJourney } from "@/components/alo/views/public-journey";
import { PublicResources } from "@/components/alo/views/public-resources";
import { PublicPrivacy } from "@/components/alo/views/public-privacy";
import { PublicTerms } from "@/components/alo/views/public-terms";
import { PublicCookie } from "@/components/alo/views/public-cookie";
import { PublicAccessibility } from "@/components/alo/views/public-accessibility";
import { PublicSearch } from "@/components/alo/views/public-search";
import { StudentMessages } from "@/components/alo/views/student-messages";
import { StudentPayments } from "@/components/alo/views/student-payments";
import { StudentOffers } from "@/components/alo/views/student-offers";
import { StudentShortlist } from "@/components/alo/views/student-shortlist";
import { StudentCompare } from "@/components/alo/views/student-compare";
import { StudentMockTests } from "@/components/alo/views/student-mock-tests";
import { CrmTasks } from "@/components/alo/views/crm-tasks";
import { CrmFollowups } from "@/components/alo/views/crm-followups";
import { CrmAppointments } from "@/components/alo/views/crm-appointments";
import { CrmEmail } from "@/components/alo/views/crm-email";
import { CrmSms } from "@/components/alo/views/crm-sms";
import { CrmCalls } from "@/components/alo/views/crm-calls";
import { CrmInvoices } from "@/components/alo/views/crm-invoices";
import { CrmAnalytics } from "@/components/alo/views/crm-analytics";
import { CrmSettings } from "@/components/alo/views/crm-settings";
import { EmployeeWorkspace } from "@/components/alo/views/employee-workspace";
import { CommCommandCenter } from "@/components/alo/views/comm-command-center";
import { ApprovalCenter } from "@/components/alo/views/approval-center";
import { NexAbroadDashboard } from "@/components/alo/views/nexabroad-dashboard";
import { WhatsappCommandCenter } from "@/components/alo/views/whatsapp-command-center";
import { PhoneCallCenter } from "@/components/alo/views/phone-call-center";
import { SlaPerformance } from "@/components/alo/views/sla-performance";
import { SocialDashboard } from "@/components/alo/views/social-dashboard";
import { CommTemplates } from "@/components/alo/views/comm-templates";
import { PartnerCommHub } from "@/components/alo/views/partner-comm-hub";

const PUBLIC_VIEWS: ViewKey[] = [
  "landing", "public-home", "public-destinations", "public-country",
  "public-universities", "public-university", "public-courses", "public-course",
  "public-exams", "public-exam", "public-course-finder", "scholarship-finder",
  "auth-login", "auth-register", "auth-reset-password", "auth-verify-otp",
  "public-review-submit",
  "public-about", "public-team", "public-services", "public-blog", "public-news",
  "public-events", "public-success-stories", "public-faq", "public-contact",
  "public-visa-support", "public-admission-requirements", "public-application-process",
  "public-journey", "public-resources", "public-privacy", "public-terms",
  "public-cookie", "public-accessibility", "public-search",
  "public-offices", "public-partners", "public-careers", "public-refund-policy", "public-higher-study",
];

export default function Home() {
  const [view, setView] = React.useState<ViewKey>("public-home");
  const [role, setRole] = React.useState<string>("SUPER_ADMIN");
  const [slug, setSlug] = React.useState<string | undefined>(undefined);

  const navigate = React.useCallback((v: ViewKey, s?: string) => {
    setView(v);
    setSlug(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Detect /review/{token} or ?review={token} URL on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    const reviewMatch = path.match(/^\/review\/([a-f0-9]+)$/i);
    if (reviewMatch) {
      setSlug(reviewMatch[1]);
      setView("public-review-submit");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const reviewToken = params.get("review");
    if (reviewToken) {
      setSlug(reviewToken);
      setView("public-review-submit");
    }
  }, []);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.view) navigate(detail.view as ViewKey, detail.slug);
    };
    window.addEventListener("alo-navigate", handler);
    return () => window.removeEventListener("alo-navigate", handler);
  }, [navigate]);

  const isPublic = PUBLIC_VIEWS.includes(view);

  // Public review submission — standalone full-page view (no shell, no nav)
  if (view === "public-review-submit" && slug) {
    return <PublicReviewSubmit token={slug} />;
  }

  // NexAbroad AI — standalone dark-themed dashboard (own navigation)
  if (view === "nexabroad") {
    return <NexAbroadDashboard />;
  }

  if (isPublic) {
    return (
      <PublicShell view={view} onNavigate={navigate}>
        {view === "landing" && <LandingView onNavigate={navigate} />}
        {view === "public-home" && <PublicHome onNavigate={navigate} />}
        {view === "public-destinations" && <PublicDestinations onNavigate={navigate} />}
        {view === "public-country" && <PublicCountry slug={slug} onNavigate={navigate} />}
        {view === "public-universities" && <PublicUniversities onNavigate={navigate} />}
        {view === "public-university" && <PublicUniversity slug={slug} onNavigate={navigate} />}
        {view === "public-courses" && <PublicCourses onNavigate={navigate} />}
        {view === "public-course" && <PublicCourse slug={slug} onNavigate={navigate} />}
        {view === "public-exams" && <PublicExams onNavigate={navigate} />}
        {view === "public-exam" && <PublicExam slug={slug} onNavigate={navigate} />}
        {view === "public-course-finder" && <PublicCourseFinder onNavigate={navigate} />}
        {view === "scholarship-finder" && <ScholarshipFinder onNavigate={navigate} />}
        {view === "public-about" && <PublicAbout onNavigate={navigate} />}
        {view === "public-team" && <PublicTeam onNavigate={navigate} />}
        {view === "public-services" && <PublicServices slug={slug} onNavigate={navigate} />}
        {view === "public-blog" && <PublicBlog slug={slug} onNavigate={navigate} />}
        {view === "public-news" && <PublicNews slug={slug} onNavigate={navigate} />}
        {view === "public-events" && <PublicEvents slug={slug} onNavigate={navigate} />}
        {view === "public-success-stories" && <PublicSuccessStories slug={slug} onNavigate={navigate} />}
        {view === "public-faq" && <PublicFaq onNavigate={navigate} />}
        {view === "public-contact" && <PublicContact onNavigate={navigate} />}
        {view === "public-visa-support" && <PublicVisaSupport onNavigate={navigate} />}
        {view === "public-admission-requirements" && <PublicAdmissionRequirements onNavigate={navigate} />}
        {view === "public-application-process" && <PublicApplicationProcess onNavigate={navigate} />}
        {view === "public-journey" && <PublicJourney onNavigate={navigate} />}
        {view === "public-resources" && <PublicResources onNavigate={navigate} />}
        {view === "public-privacy" && <PublicPrivacy onNavigate={navigate} />}
        {view === "public-terms" && <PublicTerms onNavigate={navigate} />}
        {view === "public-cookie" && <PublicCookie onNavigate={navigate} />}
        {view === "public-accessibility" && <PublicAccessibility onNavigate={navigate} />}
        {view === "public-offices" && <PublicOffices onNavigate={navigate} />}
        {view === "public-partners" && <PublicPartners onNavigate={navigate} />}
        {view === "public-careers" && <PublicCareers onNavigate={navigate} />}
        {view === "public-refund-policy" && <PublicRefundPolicy onNavigate={navigate} />}
        {view === "public-higher-study" && <PublicHigherStudy onNavigate={navigate} />}
        {view === "public-search" && <PublicSearch onNavigate={navigate} />}
        {view === "auth-login" && <AuthLogin onNavigate={navigate} />}
        {view === "auth-register" && <AuthRegister onNavigate={navigate} />}
        {view === "auth-reset-password" && <AuthResetPassword onNavigate={navigate} />}
        {view === "auth-verify-otp" && <AuthVerifyOtp onNavigate={navigate} />}
        <AiChatWidget />
      </PublicShell>
    );
  }

  return (
    <PrivacyProvider>
      <AppShell view={view} role={role} onViewChange={setView} onRoleChange={setRole}>
        {view === "student-dashboard" && <StudentDashboard onNavigate={setView} />}
        {view === "student-profile" && <StudentProfileForm />}
        {view === "document-hub" && <DocumentHub />}
        {view === "applications" && <ApplicationsView />}
        {view === "english-test" && <EnglishTestView />}
        {view === "student-course-finder" && <StudentCourseFinder onNavigate={navigate} />}
        {view === "student-sop" && <StudentSop />}
        {view === "student-cv" && <StudentCv />}
        {view === "student-visa-readiness" && <StudentVisaReadiness />}
        {view === "student-visa-checklist" && <StudentVisaChecklist />}
        {view === "student-cas" && <StudentCas />}
        {view === "student-timeline" && <StudentTimeline />}
        {view === "student-notifications" && <StudentNotifications />}
        {view === "student-appointments" && <StudentAppointments />}
        {view === "student-referrals" && <StudentReferrals />}
        {view === "student-help" && <StudentHelp />}
        {view === "student-messages" && <StudentMessages />}
        {view === "student-payments" && <StudentPayments />}
        {view === "student-offers" && <StudentOffers />}
        {view === "student-shortlist" && <StudentShortlist />}
        {view === "student-compare" && <StudentCompare />}
        {view === "student-mock-tests" && <StudentMockTests />}
        {view === "ai-interview" && <AiInterviewView />}
        {view === "counselor-dashboard" && <CounselorDashboard onNavigate={navigate} />}
        {view === "counselor-student-360" && <CounselorStudent360 slug={slug} onNavigate={navigate} />}
        {view === "unified-inbox" && <UnifiedInbox />}
        {view === "sop-studio" && <SopStudio onNavigate={navigate} />}
        {view === "crm" && <CrmDashboard onNavigate={setView} />}
        {view === "crm-tasks" && <CrmTasks />}
        {view === "crm-followups" && <CrmFollowups />}
        {view === "crm-appointments" && <CrmAppointments />}
        {view === "crm-email" && <CrmEmail />}
        {view === "crm-sms" && <CrmSms />}
        {view === "crm-calls" && <CrmCalls />}
        {view === "crm-invoices" && <CrmInvoices />}
        {view === "crm-analytics" && <CrmAnalytics />}
        {view === "crm-settings" && <CrmSettings />}
        {view === "employee-workspace" && <EmployeeWorkspace onNavigate={navigate} />}
        {view === "comm-command-center" && <CommCommandCenter />}
        {view === "approval-center" && <ApprovalCenter />}
        {view === "whatsapp-command-center" && <WhatsappCommandCenter />}
        {view === "phone-call-center" && <PhoneCallCenter />}
        {view === "sla-performance" && <SlaPerformance />}
        {view === "social-dashboard" && <SocialDashboard />}
        {view === "comm-templates" && <CommTemplates />}
        {view === "partner-comm-hub" && <PartnerCommHub />}
        {view === "super-admin-dashboard" && <SuperAdminDashboard onNavigate={navigate} />}
        {view === "student-360" && <Student360 />}
        {view === "visa" && <VisaDashboard />}
        {view === "marketing" && <MarketingDashboard />}
        {view === "marketing-ai" && <MarketingAi />}
        {view === "weekly-reports" && <WeeklyReports />}
        {view === "import-center" && <ImportCenter />}
        {view === "csv-import-center" && <CsvImportCenter />}
        {view === "admin-course-management" && <AdminCourseManagement />}
        {view === "permission-matrix" && <PermissionMatrix />}
        {view === "access-control-center" && <AccessControlCenter />}
        {view === "employee-management" && <EmployeeManagement />}
        {view === "partner-admin-dashboard" && <PartnerAdminDashboard />}
        {view === "partner-marketing-studio" && <PartnerMarketingStudio />}
        {view === "partner-portal" && <PartnerPortal />}
        {view === "application-team" && <ApplicationTeamDashboard />}
        {view === "application-manager-portal" && <ApplicationManagerPortal />}
        {view === "enterprise-hr-dashboard" && <EnterpriseHrDashboard />}
        {view === "finance-dashboard" && <FinanceDashboard />}
        {view === "hrm-dashboard" && <HrmDashboard />}
        {view === "english-test-dashboard" && <EnglishTestDashboard />}
        {view === "ai-command" && <AiCommandCenter />}
        {view === "enterprise-ai-command" && <EnterpriseAiCommand />}
        {view === "audit" && <AuditLogs />}
        {view === "omnichannel-communication-center" && <OmnichannelCommunicationCenter />}
        {view === "knowledge-center" && <KnowledgeCenter />}
        {view === "central-ai-command" && <CentralAiCommand />}
        {view === "university-monitoring" && <UniversityMonitoring onNavigate={navigate} />}
        {view === "review-dashboard" && <ReviewDashboard onNavigate={navigate} />}
        {view === "storage-monitoring" && <StorageMonitoring onNavigate={navigate} />}
        <AiChatWidget />
      </AppShell>
    </PrivacyProvider>
  );
}
