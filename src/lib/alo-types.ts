// ALO Education shared types & constants

export type ViewKey =
  | "landing"
  | "public-home"
  | "public-destinations"
  | "public-country"
  | "public-universities"
  | "public-university"
  | "public-courses"
  | "public-course"
  | "public-exams"
  | "public-exam"
  | "public-course-finder"
  | "student-dashboard"
  | "student-profile"
  | "document-hub"
  | "applications"
  | "english-test"
  | "ai-interview"
  | "crm"
  | "student-360"
  | "visa"
  | "marketing"
  | "ai-command"
  | "audit"
  | "counselor-dashboard"
  | "counselor-student-360"
  | "unified-inbox"
  | "sop-studio"
  | "permission-matrix"
  | "weekly-reports"
  | "marketing-ai"
  | "scholarship-finder"
  | "partner-portal"
  | "application-team"
  | "finance-dashboard"
  | "hrm-dashboard"
  | "import-center"
  | "english-test-dashboard"
  | "access-control-center"
  | "employee-management"
  | "employee-profile"
  | "partner-admin-dashboard"
  | "partner-marketing-studio"
  | "student-course-finder"
  | "admin-course-management"
  | "csv-import-center"
  | "auth-login"
  | "auth-register"
  | "auth-reset-password"
  | "auth-verify-otp"
  | "super-admin-dashboard"
  | "enterprise-hr-dashboard"
  | "application-manager-portal"
  | "enterprise-ai-command"
  | "omnichannel-communication-center"
  | "knowledge-center"
  | "central-ai-command"
  | "university-monitoring"
  | "review-dashboard"
  | "storage-monitoring"
  | "public-review-submit"
  | "public-about"
  | "public-services"
  | "public-blog"
  | "public-news"
  | "public-events"
  | "public-success-stories"
  | "public-faq"
  | "public-contact"
  | "public-visa-support"
  | "public-admission-requirements"
  | "public-application-process"
  | "public-team"
  | "public-resources"
  | "public-journey"
  | "public-privacy"
  | "public-terms"
  | "public-cookie"
  | "public-cookies"
  | "public-accessibility"
  | "public-communication-policy"
  | "public-lead-data-policy"
  | "public-user-guide"
  | "public-search"
  | "student-sop"
  | "student-cv"
  | "student-cas"
  | "student-visa-checklist"
  | "student-referrals"
  | "student-timeline"
  | "student-notifications"
  | "student-appointments"
  | "student-help"
  | "student-visa-readiness"
  | "public-offices"
  | "public-partners"
  | "public-careers"
  | "public-refund-policy"
  | "public-higher-study"
  | "student-messages"
  | "student-payments"
  | "student-offers"
  | "student-shortlist"
  | "student-compare"
  | "student-mock-tests"
  | "crm-tasks"
  | "crm-followups"
  | "crm-appointments"
  | "crm-email"
  | "crm-sms"
  | "crm-calls"
  | "crm-invoices"
  | "crm-analytics"
  | "crm-settings"
  | "employee-workspace"
  | "comm-command-center"
  | "approval-center"
  | "nexabroad"
  | "whatsapp-command-center"
  | "phone-call-center"
  | "sla-performance"
  | "social-dashboard"
  | "comm-templates"
  | "partner-comm-hub";

export interface NavItem {
  key: ViewKey;
  label: string;
  icon: string;
  roles: string[];
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "landing", label: "Home", icon: "Home", roles: ["*"], group: "Public" },
  { key: "student-dashboard", label: "Student Dashboard", icon: "LayoutDashboard", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-profile", label: "Profile Form", icon: "UserSquare", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "document-hub", label: "Document Hub", icon: "FolderLock", roles: ["STUDENT", "COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "applications", label: "Applications", icon: "ClipboardList", roles: ["STUDENT", "COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "english-test", label: "English / Mock Test", icon: "GraduationCap", roles: ["STUDENT", "ENGLISH_TRAINER", "MOCK_TEST_ADMIN", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "ai-interview", label: "AI Interview", icon: "Mic", roles: ["STUDENT", "VISA_INTERVIEW_OFFICER", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "counselor-dashboard", label: "Counselor Portal", icon: "Headset", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER"], group: "Counselor Portal" },
  { key: "counselor-student-360", label: "Student 360", icon: "Orbit", roles: ["COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"], group: "Counselor Portal" },
  { key: "unified-inbox", label: "Unified Inbox", icon: "Inbox", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "MARKETING_MANAGER"], group: "Counselor Portal" },
  { key: "sop-studio", label: "SOP / CV Studio", icon: "FileText", roles: ["COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"], group: "Counselor Portal" },
  { key: "crm", label: "CRM Dashboard", icon: "Users", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "FRONT_DESK"], group: "CRM & Operations" },
  { key: "student-360", label: "Student 360", icon: "Orbit", roles: ["COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"], group: "CRM & Operations" },
  { key: "visa", label: "Visa Officer", icon: "Plane", roles: ["VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "ADMIN", "SUPER_ADMIN"], group: "CRM & Operations" },
  { key: "marketing", label: "Marketing", icon: "Megaphone", roles: ["MARKETING_MANAGER", "MARKETING", "ADMIN", "SUPER_ADMIN"], group: "CRM & Operations" },
  { key: "marketing-ai", label: "Marketing AI Engine", icon: "Sparkles", roles: ["MARKETING_MANAGER", "MARKETING", "ADMIN", "SUPER_ADMIN"], group: "CRM & Operations" },
  { key: "weekly-reports", label: "Weekly Reports", icon: "BarChart3", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "MARKETING_MANAGER", "VISA_OFFICER"], group: "System" },
  { key: "import-center", label: "Import Center", icon: "Download", roles: ["ADMIN", "SUPER_ADMIN"], group: "System" },
  { key: "csv-import-center", label: "CSV Import", icon: "FileSpreadsheet", roles: ["ADMIN", "SUPER_ADMIN"], group: "System" },
  { key: "admin-course-management", label: "Course Management", icon: "BookOpen", roles: ["ADMIN", "SUPER_ADMIN"], group: "System" },
  { key: "student-course-finder", label: "Smart Course Finder", icon: "Sparkles", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-sop", label: "SOP Studio", icon: "PenLine", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-cv", label: "CV Builder", icon: "FileUser", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-visa-readiness", label: "Visa Readiness", icon: "ShieldCheck", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-visa-checklist", label: "Visa Checklist", icon: "ListChecks", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-cas", label: "CAS Center", icon: "FileCheck", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-timeline", label: "My Timeline", icon: "Clock", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-notifications", label: "Notifications", icon: "Bell", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-appointments", label: "Appointments", icon: "Calendar", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-referrals", label: "Refer a Friend", icon: "Gift", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-help", label: "Help Center", icon: "HelpCircle", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-messages", label: "Messages", icon: "MessageSquare", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-payments", label: "Payments", icon: "CreditCard", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-offers", label: "University Offers", icon: "Award", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-shortlist", label: "Shortlist", icon: "Bookmark", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-compare", label: "Compare Courses", icon: "Columns3", roles: ["STUDENT", "COUNSELOR", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "student-mock-tests", label: "Mock Tests", icon: "FileCheck2", roles: ["STUDENT", "ENGLISH_TRAINER", "MOCK_TEST_ADMIN", "ADMIN", "SUPER_ADMIN"], group: "Student Portal" },
  { key: "permission-matrix", label: "Permission Matrix", icon: "Lock", roles: ["SUPER_ADMIN", "ADMIN"], group: "System" },
  { key: "access-control-center", label: "Access Control Center", icon: "Shield", roles: ["SUPER_ADMIN"], group: "System" },
  { key: "employee-management", label: "Employee Management", icon: "UserCog", roles: ["SUPER_ADMIN", "HR_MANAGER", "ADMIN"], group: "System" },
  { key: "enterprise-hr-dashboard", label: "Enterprise HR", icon: "Briefcase", roles: ["SUPER_ADMIN", "HR_MANAGER", "ADMIN", "FINANCE", "BRANCH_MANAGER"], group: "System" },
  { key: "application-manager-portal", label: "Application Manager", icon: "FolderKanban", roles: ["APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"], group: "Counselor Portal" },
  { key: "scholarship-finder", label: "Scholarship Finder", icon: "Award", roles: ["*"], group: "Public" },
  { key: "partner-portal", label: "Partner Portal", icon: "Handshake", roles: ["PARTNER", "ADMIN", "SUPER_ADMIN"], group: "Portals" },
  { key: "partner-admin-dashboard", label: "Partner Admin", icon: "Building", roles: ["PARTNER", "ADMIN", "SUPER_ADMIN"], group: "Portals" },
  { key: "partner-marketing-studio", label: "Partner Marketing", icon: "Megaphone", roles: ["PARTNER", "ADMIN", "SUPER_ADMIN"], group: "Portals" },
  { key: "application-team", label: "Application Team", icon: "ClipboardCheck", roles: ["APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN"], group: "Portals" },
  { key: "finance-dashboard", label: "Finance", icon: "DollarSign", roles: ["FINANCE", "ADMIN", "SUPER_ADMIN"], group: "Portals" },
  { key: "hrm-dashboard", label: "HRM", icon: "Users", roles: ["HR_MANAGER", "ADMIN", "SUPER_ADMIN"], group: "Portals" },
  { key: "english-test-dashboard", label: "English Test Portal", icon: "Languages", roles: ["STUDENT", "ENGLISH_TRAINER", "MOCK_TEST_ADMIN", "ADMIN", "SUPER_ADMIN"], group: "Portals" },
  { key: "ai-command", label: "AI Command Center", icon: "Bot", roles: ["ADMIN", "SUPER_ADMIN"], group: "System" },
  { key: "enterprise-ai-command", label: "Enterprise AI (100 Depts)", icon: "BrainCircuit", roles: ["SUPER_ADMIN"], group: "System" },
  { key: "audit", label: "Audit Logs", icon: "ShieldCheck", roles: ["ADMIN", "SUPER_ADMIN"], group: "System" },
  { key: "omnichannel-communication-center", label: "Omnichannel Center", icon: "Radio", roles: ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "MARKETING_MANAGER", "BRANCH_MANAGER"], group: "System" },
  { key: "knowledge-center", label: "Knowledge Center", icon: "BookMarked", roles: ["SUPER_ADMIN", "ADMIN", "HR_MANAGER", "BRANCH_MANAGER", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "FINANCE", "MARKETING_MANAGER", "MARKETING", "FRONT_DESK", "SUPPORT_STAFF", "ENGLISH_TRAINER"], group: "System" },
  { key: "central-ai-command", label: "Central AI Command", icon: "BrainCircuit", roles: ["SUPER_ADMIN", "ADMIN"], group: "System" },
  { key: "university-monitoring", label: "University Monitor", icon: "SatelliteDish", roles: ["SUPER_ADMIN", "ADMIN"], group: "System" },
  { key: "review-dashboard", label: "Review Center", icon: "Star", roles: ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER", "MARKETING"], group: "System" },
  { key: "storage-monitoring", label: "Storage Control", icon: "HardDrive", roles: ["SUPER_ADMIN", "ADMIN"], group: "System" },
  { key: "crm-tasks", label: "Tasks", icon: "CheckSquare", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "FRONT_DESK"], group: "CRM & Operations" },
  { key: "crm-followups", label: "Follow-ups", icon: "CalendarClock", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "FRONT_DESK"], group: "CRM & Operations" },
  { key: "crm-appointments", label: "Appointments Calendar", icon: "CalendarDays", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "FRONT_DESK"], group: "CRM & Operations" },
  { key: "crm-email", label: "Email Center", icon: "Mail", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER"], group: "CRM & Operations" },
  { key: "crm-sms", label: "SMS Center", icon: "MessageCircle", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER"], group: "CRM & Operations" },
  { key: "crm-calls", label: "Call Logs", icon: "PhoneCall", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "FRONT_DESK"], group: "CRM & Operations" },
  { key: "crm-invoices", label: "Invoices", icon: "ReceiptText", roles: ["FINANCE", "ADMIN", "SUPER_ADMIN", "COUNSELOR"], group: "CRM & Operations" },
  { key: "crm-analytics", label: "CRM Analytics", icon: "TrendingUp", roles: ["ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "MARKETING_MANAGER"], group: "CRM & Operations" },
  { key: "crm-settings", label: "CRM Settings", icon: "Settings2", roles: ["ADMIN", "SUPER_ADMIN"], group: "CRM & Operations" },
  { key: "employee-workspace", label: "My Workspace", icon: "LayoutPanelLeft", roles: ["COUNSELOR", "APPLICATION_TEAM", "ADMIN", "SUPER_ADMIN", "VISA_OFFICER", "FRONT_DESK", "MARKETING"], group: "Counselor Portal" },
  { key: "comm-command-center", label: "Comm Command Center", icon: "MessagesSquare", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "FRONT_DESK", "MARKETING_MANAGER"], group: "Unified Communication" },
  { key: "approval-center", label: "Human Approval Center", icon: "ClipboardCheck", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"], group: "Unified Communication" },
  { key: "nexabroad", label: "NexAbroad AI", icon: "Sparkles", roles: ["SUPER_ADMIN", "ADMIN", "COUNSELOR"], group: "Unified Communication" },
  { key: "whatsapp-command-center", label: "WhatsApp Command", icon: "MessageCircleMore", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "FRONT_DESK"], group: "Unified Communication" },
  { key: "phone-call-center", label: "Phone Call Center", icon: "PhoneCall", roles: ["COUNSELOR", "ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "FRONT_DESK"], group: "Unified Communication" },
  { key: "sla-performance", label: "SLA & Counselor Performance", icon: "GaugeCircle", roles: ["ADMIN", "SUPER_ADMIN", "BRANCH_MANAGER", "COUNSELOR"], group: "Unified Communication" },
  { key: "social-dashboard", label: "Social Accounts Hub", icon: "Share2", roles: ["MARKETING_MANAGER", "MARKETING", "ADMIN", "SUPER_ADMIN"], group: "Unified Communication" },
  { key: "comm-templates", label: "Template Manager", icon: "FileText", roles: ["ADMIN", "SUPER_ADMIN", "COUNSELOR", "BRANCH_MANAGER"], group: "Unified Communication" },
  { key: "partner-comm-hub", label: "Partner Communication", icon: "Handshake", roles: ["PARTNER", "ADMIN", "SUPER_ADMIN"], group: "Portals" },
];

export const ROLES = [
  { value: "STUDENT", label: "Student" },
  { value: "COUNSELOR", label: "Counselor" },
  { value: "APPLICATION_TEAM", label: "Application Team" },
  { value: "VISA_INTERVIEW_OFFICER", label: "Visa Interview Officer" },
  { value: "MARKETING_MANAGER", label: "Marketing Manager" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

export const LEAD_SOURCES = [
  { value: "WEBSITE", label: "Website Form" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "SMS", label: "SMS" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "PHONE_CALL", label: "Phone Call" },
  { value: "PARTNER_REFERRAL", label: "Partner Referral" },
  { value: "OFFICE_VISIT", label: "Office Visit" },
  { value: "EVENT", label: "Event / Webinar" },
  { value: "MOCK_TEST", label: "Free Mock Test" },
];

export const COUNTRIES = ["UK", "USA", "Canada", "Australia", "Germany", "Ireland", "Malaysia", "New Zealand", "Finland", "Sweden"];

export const APP_STAGES = [
  "COUNSELING", "ELIGIBILITY_CHECKED", "DOCUMENTS_PENDING", "DOCUMENTS_RECEIVED",
  "UNIVERSITY_SHORTLISTED", "APPLICATION_PREPARING", "APPLICATION_SUBMITTED",
  "CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER", "DEPOSIT_PENDING", "CAS_INTERVIEW",
  "CAS_PENDING", "CAS_ISSUED", "VISA_DOCUMENTS", "VISA_SUBMITTED",
  "VISA_DECISION_PENDING", "VISA_APPROVED", "VISA_REFUSED", "PRE_DEPARTURE", "ENROLLED",
];

export const STAGE_LABELS: Record<string, string> = {
  COUNSELING: "Counseling",
  ELIGIBILITY_CHECKED: "Eligibility Checked",
  DOCUMENTS_PENDING: "Documents Pending",
  DOCUMENTS_RECEIVED: "Documents Received",
  UNIVERSITY_SHORTLISTED: "University Shortlisted",
  APPLICATION_PREPARING: "Application Preparing",
  APPLICATION_SUBMITTED: "Application Submitted",
  CONDITIONAL_OFFFER: "Conditional Offer",
  UNCONDITIONAL_OFFER: "Unconditional Offer",
  DEPOSIT_PENDING: "Deposit Pending",
  CAS_INTERVIEW: "CAS Interview",
  CAS_PENDING: "CAS Pending",
  CAS_ISSUED: "CAS Issued",
  VISA_DOCUMENTS: "Visa Documents",
  VISA_SUBMITTED: "Visa Submitted",
  VISA_DECISION_PENDING: "Visa Decision Pending",
  VISA_APPROVED: "Visa Approved",
  VISA_REFUSED: "Visa Refused",
  PRE_DEPARTURE: "Pre-departure",
  ENROLLED: "Enrolled",
};

export const STAGE_COLORS: Record<string, string> = {
  COUNSELING: "bg-slate-100 text-slate-700",
  ELIGIBILITY_CHECKED: "bg-slate-100 text-slate-700",
  DOCUMENTS_PENDING: "bg-amber-100 text-amber-700",
  DOCUMENTS_RECEIVED: "bg-sky-100 text-sky-700",
  UNIVERSITY_SHORTLISTED: "bg-sky-100 text-sky-700",
  APPLICATION_PREPARING: "bg-indigo-100 text-indigo-700",
  APPLICATION_SUBMITTED: "bg-indigo-100 text-indigo-700",
  CONDITIONAL_OFFFER: "bg-violet-100 text-violet-700",
  UNCONDITIONAL_OFFER: "bg-violet-100 text-violet-700",
  DEPOSIT_PENDING: "bg-amber-100 text-amber-700",
  CAS_INTERVIEW: "bg-orange-100 text-orange-700",
  CAS_PENDING: "bg-orange-100 text-orange-700",
  CAS_ISSUED: "bg-teal-100 text-teal-700",
  VISA_DOCUMENTS: "bg-amber-100 text-amber-700",
  VISA_SUBMITTED: "bg-blue-100 text-blue-700",
  VISA_DECISION_PENDING: "bg-blue-100 text-blue-700",
  VISA_APPROVED: "bg-emerald-100 text-emerald-700",
  VISA_REFUSED: "bg-red-100 text-red-700",
  PRE_DEPARTURE: "bg-emerald-100 text-emerald-700",
  ENROLLED: "bg-emerald-100 text-emerald-700",
};

export const DOC_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  UPLOADED: "bg-sky-100 text-sky-700",
  UNDER_REVIEW: "bg-indigo-100 text-indigo-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  PHONE_CALL: "Phone Call",
  PARTNER_REFERRAL: "Partner Referral",
  OFFICE_VISIT: "Office Visit",
  EVENT: "Event",
  MOCK_TEST: "Mock Test",
};

export const INTERVIEW_TYPES = [
  { value: "UNIVERSITY_CREDIBILITY", label: "University Credibility Interview" },
  { value: "VISA_INTERVIEW", label: "Visa Interview Practice" },
  { value: "PRE_CAS", label: "Pre-CAS Interview" },
  { value: "SCHOLARSHIP", label: "Scholarship Interview" },
  { value: "GENERAL_ENGLISH", label: "General English Speaking" },
];

export const ENGLISH_TESTS = [
  "IELTS", "IELTS UKVI", "OIETC / ELLT", "PTE", "TOEFL", "GRE", "GMAT",
  "CAE", "ESOL", "ELSA", "OET", "WAEC-NAC", "SAT", "ACT", "DET / Duolingo",
  "English Score", "MOI", "Other",
];

export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function timeAgo(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(date);
}
