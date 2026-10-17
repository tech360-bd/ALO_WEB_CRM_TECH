"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  MiniBar,
  PageHeader,
} from "@/components/alo/shared";
import { SensitiveField, usePrivacy } from "@/components/alo/privacy-mode";
import { ViewKey, fmtDate, timeAgo, STAGE_LABELS, STAGE_COLORS } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Types — matches API response shapes
// ---------------------------------------------------------------------------

interface StatsResponse {
  counts: {
    leads: number;
    students: number;
    documents: number;
    applications: number;
    visaCases: number;
    mockTests: number;
    interviews: number;
    campaigns: number;
    aiAgents: number;
    payments: number;
  };
  leadsBySource: Record<string, number>;
  leadsByStatus: Record<string, number>;
  appsByStage: Record<string, number>;
  docsByStatus: Record<string, number>;
  visaByStage: Record<string, number>;
  agentsByDept: Record<string, number>;
  marketing: {
    totalBudget: number;
    totalSpent: number;
    totalLeadsFromCampaigns: number;
    totalConversions: number;
    costPerLead: number;
    conversionRate: number;
  };
  finance: {
    revenue: number;
    pendingPayments: number;
    commissionPending: number;
  };
  recentAudit: AuditLog[];
  avgProfileCompletion: number;
}

interface AuditUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: AuditUser | null;
}

interface OwnerEmployee {
  id: string;
  employeeCode: string;
  fullName: string;
  designation: string;
  department?: { name: string } | null;
  office?: { name: string } | null;
  status: string;
  profileStatus: string;
  role?: string;
  companyEmail?: string;
}

interface PartnerPackage {
  id: string;
  name: string;
  status: string;
  _count?: { assignments: number };
}

interface QuotaRequest {
  id: string;
  requestType: string;
  currentLimit: number;
  requestedLimit: number;
  reason?: string | null;
  status: string;
  createdAt?: string;
  employee?: { fullName: string; employeeCode: string; companyEmail?: string } | null;
}

interface AccessControlData {
  employees: OwnerEmployee[];
  packages: PartnerPackage[];
  quotaRequests: QuotaRequest[];
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    pendingProfiles: number;
    totalPartners: number;
    totalPackages: number;
    pendingQuotaRequests: number;
  };
}

interface AiAgent {
  id: string;
  department: string;
  agentName: string;
  agentCode: string;
  description?: string | null;
  status: string;
  jobsProcessed: number;
  pendingApprovals: number;
  lastRunAt: string | null;
}

interface CountryPage {
  id: string;
  slug: string;
  name: string;
  shortName?: string | null;
  flag?: string | null;
  capital?: string | null;
  currency?: string | null;
  lastVerifiedAt?: string | null;
  verificationStatus?: string | null;
}

interface UniversityPage {
  id: string;
  slug: string;
  name: string;
  countrySlug: string;
  country?: { name: string; shortName: string; flag?: string | null } | null;
}

interface CoursePage {
  id: string;
  slug: string;
  name: string;
  countrySlug: string;
  universitySlug: string;
}

interface ScholarshipPage {
  id: string;
  slug: string;
  name: string;
  countrySlug?: string | null;
  amount?: number | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROFILE_STATUS_COLORS: Record<string, string> = {
  INCOMPLETE: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  UNDER_REVIEW: "bg-sky-100 text-sky-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  CORRECTION_REQUIRED: "bg-rose-100 text-rose-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  TERMINATED: "bg-slate-200 text-slate-600",
};

const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  TERMINATED: "bg-slate-200 text-slate-600",
};

const PROFILE_STATUS_LABELS: Record<string, string> = {
  INCOMPLETE: "Incomplete",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  CORRECTION_REQUIRED: "Correction Required",
  SUSPENDED: "Suspended",
  INACTIVE: "Inactive",
  TERMINATED: "Terminated",
};

const AGENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  IDLE: "bg-amber-100 text-amber-700",
  PAUSED: "bg-slate-200 text-slate-700",
};

const QUOTA_TYPE_LABELS: Record<string, string> = {
  EXTRA_SEAT: "Extra Seat",
  EXTRA_IMAGE_QUOTA: "Extra Image Quota",
  EXTRA_VIDEO_QUOTA: "Extra Video Quota",
  EXTRA_MOCK_VOUCHER: "Extra Mock Voucher",
};

const QUOTA_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN: "Login",
  FAILED_LOGIN: "Failed Login",
  LOGOUT: "Logout",
  PROFILE_UPDATE: "Profile Update",
  DOC_UPLOAD: "Document Upload",
  DOC_APPROVE: "Document Approved",
  DOC_REJECT: "Document Rejected",
  APP_STATUS_CHANGE: "App Status Change",
  VISA_STATUS_CHANGE: "Visa Status Change",
  MOCK_CREDIT_CHANGE: "Mock Credit Change",
  PAYMENT_UPDATE: "Payment Update",
  COMMISSION_APPROVE: "Commission Approved",
  SALARY_ACCESS: "Salary Accessed",
  ROLE_CHANGE: "Role Change",
  PERMISSION_CHANGE: "Permission Change",
  AI_ACTION: "AI Action",
  MESSAGE_ACTION: "Message Action",
  DATA_IMPORT: "Data Import",
  PUBLIC_PUBLISH: "Public Publish",
};

const AUDIT_ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-slate-100 text-slate-700",
  FAILED_LOGIN: "bg-rose-100 text-rose-700",
  LOGOUT: "bg-slate-100 text-slate-700",
  PROFILE_UPDATE: "bg-sky-100 text-sky-700",
  DOC_UPLOAD: "bg-sky-100 text-sky-700",
  DOC_APPROVE: "bg-emerald-100 text-emerald-700",
  DOC_REJECT: "bg-rose-100 text-rose-700",
  APP_STATUS_CHANGE: "bg-violet-100 text-violet-700",
  VISA_STATUS_CHANGE: "bg-orange-100 text-orange-700",
  MOCK_CREDIT_CHANGE: "bg-amber-100 text-amber-700",
  PAYMENT_UPDATE: "bg-emerald-100 text-emerald-700",
  COMMISSION_APPROVE: "bg-emerald-100 text-emerald-700",
  SALARY_ACCESS: "bg-amber-100 text-amber-700",
  ROLE_CHANGE: "bg-rose-100 text-rose-700",
  PERMISSION_CHANGE: "bg-rose-100 text-rose-700",
  AI_ACTION: "bg-violet-100 text-violet-700",
  MESSAGE_ACTION: "bg-sky-100 text-sky-700",
  DATA_IMPORT: "bg-blue-100 text-blue-700",
  PUBLIC_PUBLISH: "bg-emerald-100 text-emerald-700",
};

const DOC_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  UPLOADED: "Uploaded",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const SOURCE_LABELS_LOCAL: Record<string, string> = {
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

interface QuickActionDef {
  label: string;
  description: string;
  icon: string;
  view: ViewKey;
  countKey?: "employees" | "packages" | "aiAgents" | "audit" | "quota" | "pending" | "applications" | "visa" | "leads" | "students" | "monitoring";
}

const QUICK_ACTIONS: QuickActionDef[] = [
  { label: "Employee Management", description: "Profiles, designations, departments, salaries", icon: "UserCog", view: "employee-management", countKey: "employees" },
  { label: "Access Control Center", description: "Feature flags, packages, quota requests", icon: "Shield", view: "access-control-center", countKey: "packages" },
  { label: "Permission Matrix", description: "Role × module permission grid", icon: "Lock", view: "permission-matrix" },
  { label: "CRM Dashboard", description: "Leads, conversions, counselor funnel", icon: "Users", view: "crm", countKey: "leads" },
  { label: "Finance Dashboard", description: "Revenue, payments, commissions, invoices", icon: "DollarSign", view: "finance-dashboard" },
  { label: "HRM Dashboard", description: "Attendance, payroll, performance, increments", icon: "Briefcase", view: "hrm-dashboard" },
  { label: "Marketing Manager", description: "Campaigns, budgets, channels, ROI", icon: "Megaphone", view: "marketing" },
  { label: "Marketing AI Engine", description: "AI content, audience, scheduling", icon: "Sparkles", view: "marketing-ai" },
  { label: "Visa Officer Dashboard", description: "Visa cases, decisions, interviews", icon: "Plane", view: "visa", countKey: "visa" },
  { label: "Application Team", description: "Stage tracker, SLAs, documents", icon: "ClipboardCheck", view: "application-team", countKey: "applications" },
  { label: "AI Command Center", description: "Agents, jobs, approvals, safety rules", icon: "Bot", view: "ai-command", countKey: "aiAgents" },
  { label: "University Data Monitor", description: "7-day AI monitoring of official sources, approval queue, change history", icon: "SatelliteDish", view: "university-monitoring", countKey: "monitoring" },
  { label: "Audit Logs", description: "Full activity trail across the platform", icon: "ScrollText", view: "audit", countKey: "audit" },
  { label: "Weekly Reports", description: "Branch, counselor, marketing summaries", icon: "BarChart3", view: "weekly-reports" },
  { label: "Import Center", description: "Bulk uploads, validation, history", icon: "Download", view: "import-center" },
  { label: "CSV Import", description: "Lead, student, course CSV pipelines", icon: "FileSpreadsheet", view: "csv-import-center" },
  { label: "Course Management", description: "Approve, edit, publish course catalog", icon: "BookOpen", view: "admin-course-management" },
  { label: "Partner Admin", description: "Partner portal, packages, performance", icon: "Building", view: "partner-admin-dashboard" },
  { label: "Partner Marketing", description: "Partner campaigns, asset library", icon: "Megaphone", view: "partner-marketing-studio" },
];

const SYSTEM_HEALTH = [
  { key: "database", label: "Database", icon: "Database", detail: "SQLite · prisma client", latency: "12ms" },
  { key: "api", label: "API Gateway", icon: "Network", detail: "Next.js Route Handlers", latency: "34ms" },
  { key: "ai", label: "AI Services", icon: "Bot", detail: "z-ai-web-dev-sdk", latency: "210ms" },
  { key: "cache", label: "Cache", icon: "Zap", detail: "In-memory · local", latency: "2ms" },
  { key: "storage", label: "Private Storage", icon: "FolderLock", detail: "Documents · /private", latency: "8ms" },
  { key: "auth", label: "Auth Service", icon: "KeyRound", detail: "NextAuth · session JWT", latency: "5ms" },
];

const SETTINGS_CARDS = [
  {
    key: "general",
    title: "General Settings",
    icon: "Settings",
    fields: [
      { label: "Application Name", value: "ALO Education" },
      { label: "URL", value: "alo-education.com" },
      { label: "Timezone", value: "Asia/Dhaka (GMT+6)" },
      { label: "Language", value: "English (UK)" },
    ],
  },
  {
    key: "email",
    title: "Email Settings",
    icon: "Mail",
    fields: [
      { label: "SMTP Host", value: "smtp.alo-education.com" },
      { label: "From Address", value: "no-reply@alo-education.com" },
      { label: "Encryption", value: "TLS · Port 587" },
      { label: "Status", value: "Connected" },
    ],
  },
  {
    key: "whatsapp",
    title: "WhatsApp Settings",
    icon: "MessageCircle",
    fields: [
      { label: "Business API", value: "Connected · verified" },
      { label: "Phone Number", value: "+880 1805-020101" },
      { label: "Template Approval", value: "12 approved · 3 pending" },
      { label: "Daily Limit", value: "10,000 messages" },
    ],
  },
  {
    key: "sms",
    title: "SMS Settings",
    icon: "Smartphone",
    fields: [
      { label: "Gateway", value: "BulkSMS BD" },
      { label: "Sender ID", value: "ALOEDU" },
      { label: "Balance", value: "48,210 credits" },
      { label: "Status", value: "Operational" },
    ],
  },
  {
    key: "security",
    title: "Security Settings",
    icon: "ShieldCheck",
    fields: [
      { label: "Session Timeout", value: "30 minutes" },
      { label: "Password Policy", value: "Min 12 chars · 1 special" },
      { label: "OTP Expiry", value: "5 minutes" },
      { label: "2FA", value: "Required for admins" },
    ],
  },
  {
    key: "backup",
    title: "Backup Settings",
    icon: "HardDriveDownload",
    fields: [
      { label: "Last Backup", value: "Today · 02:00 AM" },
      { label: "Schedule", value: "Daily · 02:00 AM" },
      { label: "Retention", value: "30 days" },
      { label: "Destination", value: "Encrypted S3 bucket" },
    ],
  },
];

const FEATURE_FLAGS = [
  { label: "Public Website", enabled: true, icon: "Globe" },
  { label: "Student Portal", enabled: true, icon: "GraduationCap" },
  { label: "Partner Portal", enabled: true, icon: "Handshake" },
  { label: "Employee Portal", enabled: true, icon: "UserCog" },
  { label: "AI Interview Engine", enabled: true, icon: "Mic" },
  { label: "AI SOP Writer", enabled: true, icon: "FileText" },
  { label: "AI Course Match", enabled: true, icon: "Sparkles" },
  { label: "AI Visa Coach", enabled: false, icon: "Plane" },
  { label: "Marketing AI Engine", enabled: true, icon: "Megaphone" },
  { label: "Bulk Import", enabled: true, icon: "Download" },
  { label: "CSV Pipeline", enabled: true, icon: "FileSpreadsheet" },
  { label: "Audit Logging", enabled: true, icon: "ScrollText" },
];

const AI_SAFETY_RULES = [
  "AI must never invent university requirements, deadlines, or scholarship amounts.",
  "AI must never invent visa rules or immigration advice — final authority is the visa officer.",
  "AI must never guarantee admission or visa approval.",
  "AI cannot publish content to the public site without human approval.",
  "AI cannot send private student data externally without OTP verification.",
  "AI cannot change critical status (VISA_APPROVED, ENROLLED) without permission.",
  "AI cannot approve documents — human review is mandatory.",
  "AI must not copy official exam questions (IELTS, PTE, TOEFL, Duolingo).",
];

const RBAC_SUMMARY = [
  {
    icon: "ShieldCheck",
    title: "Backend RBAC enforced on every API route",
    body: "Frontend PermissionGate only hides buttons — backend is the final authority. Every API route re-checks role + ownership before returning data.",
  },
  {
    icon: "ScrollText",
    title: "All sensitive actions are audit-logged",
    body: "Permission changes, salary views, document downloads, role changes, status changes, and AI actions are written to the AuditLog table with user, IP, and JSON details.",
  },
  {
    icon: "Lock",
    title: "Route protection via middleware.ts",
    body: "Unauthenticated users are redirected to the login page. Role-protected routes return 403 for unauthorized roles. Public routes are explicitly whitelisted.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString()}`;
  }
}

function countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = keyFn(item);
    if (!k) continue;
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// RevenueSensitive — privacy-aware revenue display for StatCard value
// ---------------------------------------------------------------------------

function RevenueSensitive({ value }: { value: number }) {
  const { privacyOn, isRevealed, reveal } = usePrivacy();
  const revealed = !privacyOn || isRevealed("super-admin-revenue");
  const formatted = formatCurrency(value);

  if (revealed) {
    return <span className="tabular-nums">{formatted}</span>;
  }
  return (
    <button
      type="button"
      onClick={() => reveal("super-admin-revenue")}
      className="inline-flex items-center gap-1.5 text-2xl font-bold tabular-nums"
      title="Click to reveal revenue"
    >
      <Icon name="EyeOff" className="size-5 text-muted-foreground" />
      <span className="blur-sm select-none">{formatted}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// HealthCard — operational status card
// ---------------------------------------------------------------------------

function HealthCard({
  label,
  icon,
  detail,
  latency,
}: {
  label: string;
  icon: string;
  detail: string;
  latency: string;
}) {
  return (
    <Card className="rounded-2xl border-2 border-[#E2E8F0] hover:border-emerald-300 transition-colors">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-medium text-foreground truncate">{detail}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">p95 · {latency}</p>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Icon name={icon} className="size-5" />
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Operational
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// QuickActionCard — large clickable navigation card
// ---------------------------------------------------------------------------

function QuickActionCard({
  def,
  count,
  onNavigate,
}: {
  def: QuickActionDef;
  count?: number;
  onNavigate: (v: ViewKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(def.view)}
      className="group relative flex h-full w-full flex-col gap-2 rounded-2xl border-2 border-[#E2E8F0] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#0057B8]/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-alo-gradient text-white shadow-sm">
          <Icon name={def.icon} className="size-5" />
        </div>
        {typeof count === "number" && count > 0 && (
          <Badge className="border-0 bg-[#e8f0fb] text-[#0057B8] hover:bg-[#e8f0fb]">
            {count.toLocaleString()}
          </Badge>
        )}
      </div>
      <div className="mt-1">
        <p className="text-sm font-semibold text-foreground group-hover:text-[#0057B8]">{def.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{def.description}</p>
      </div>
      <div className="mt-auto flex items-center gap-1 text-xs font-medium text-[#0057B8] opacity-0 transition-opacity group-hover:opacity-100">
        Open
        <Icon name="ArrowRight" className="size-3.5" />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SuperAdminDashboard({
  onNavigate,
}: {
  onNavigate: (v: ViewKey, slug?: string) => void;
}) {
  const { toast } = useToast();
  const [stats, setStats] = React.useState<StatsResponse | null>(null);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [accessData, setAccessData] = React.useState<AccessControlData | null>(null);
  const [agents, setAgents] = React.useState<AiAgent[]>([]);
  const [courses, setCourses] = React.useState<CoursePage[]>([]);
  const [universities, setUniversities] = React.useState<UniversityPage[]>([]);
  const [countries, setCountries] = React.useState<CountryPage[]>([]);
  const [scholarships, setScholarships] = React.useState<ScholarshipPage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("overview");

  // ---- Parallel data fetch --------------------------------------------------

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [
          statsRes,
          auditRes,
          accessRes,
          agentsRes,
          coursesRes,
          universitiesRes,
          countriesRes,
          scholarshipsRes,
        ] = await Promise.all([
          fetch("/api/stats", { cache: "no-store" }),
          fetch("/api/audit?take=10", { cache: "no-store" }),
          fetch("/api/access-control", { cache: "no-store" }),
          fetch("/api/ai-agents", { cache: "no-store" }),
          fetch("/api/courses", { cache: "no-store" }),
          fetch("/api/universities", { cache: "no-store" }),
          fetch("/api/countries", { cache: "no-store" }),
          fetch("/api/scholarships", { cache: "no-store" }).catch(() => null),
        ]);

        if (!statsRes.ok || !auditRes.ok || !accessRes.ok) {
          throw new Error("One or more core API endpoints failed to respond.");
        }

        const statsJson = (await statsRes.json()) as StatsResponse;
        const auditJson = (await auditRes.json()) as { logs: AuditLog[] };
        const accessJson = (await accessRes.json()) as AccessControlData;
        const agentsJson = (await agentsRes.json()) as { agents: AiAgent[] };
        const coursesJson = (await coursesRes.json()) as { courses: CoursePage[] };
        const universitiesJson = (await universitiesRes.json()) as { universities: UniversityPage[] };
        const countriesJson = (await countriesRes.json()) as { countries: CountryPage[] };
        const scholarshipsJson = scholarshipsRes
          ? ((await scholarshipsRes.json()) as { scholarships: ScholarshipPage[] })
          : { scholarships: [] };

        if (cancelled) return;
        setStats(statsJson);
        setAuditLogs(Array.isArray(auditJson?.logs) ? auditJson.logs : []);
        setAccessData(accessJson);
        setAgents(Array.isArray(agentsJson?.agents) ? agentsJson.agents : []);
        setCourses(Array.isArray(coursesJson?.courses) ? coursesJson.courses : []);
        setUniversities(Array.isArray(universitiesJson?.universities) ? universitiesJson.universities : []);
        setCountries(Array.isArray(countriesJson?.countries) ? countriesJson.countries : []);
        setScholarships(Array.isArray(scholarshipsJson?.scholarships) ? scholarshipsJson.scholarships : []);
      } catch (err) {
        if (cancelled) return;
        toast({
          title: "Failed to load dashboard data",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // ---- Derived data ---------------------------------------------------------

  const employees = accessData?.employees ?? [];
  const employeeCount = accessData?.summary.totalEmployees ?? employees.length;
  const activeEmployees = accessData?.summary.activeEmployees ?? 0;
  const pendingProfiles = accessData?.summary.pendingProfiles ?? 0;
  const totalPackages = accessData?.summary.totalPackages ?? 0;
  const pendingQuota = accessData?.summary.pendingQuotaRequests ?? 0;
  const pendingApprovals =
    pendingProfiles + pendingQuota + (auditLogs.filter((l) => l.action === "PUBLIC_PUBLISH").length > 0 ? 0 : 0);

  const aiAgentsActive = agents.filter((a) => a.status === "ACTIVE").length;
  const aiJobsProcessed = agents.reduce((s, a) => s + (a.jobsProcessed || 0), 0);
  const aiPendingApprovals = agents.reduce((s, a) => s + (a.pendingApprovals || 0), 0);

  // Group employees by designation / department / office
  const byDesignation = countBy(employees, (e) => e.designation);
  const byDepartment = countBy(employees, (e) => e.department?.name || "");
  const byOffice = countBy(employees, (e) => e.office?.name || "Head Office");
  const byProfileStatus = countBy(employees, (e) => e.profileStatus);

  // Group AI agents by department
  const agentsByDept = React.useMemo(() => {
    const map: Record<string, { count: number; jobs: number; pending: number; active: number }> = {};
    for (const a of agents) {
      if (!a.department) continue;
      if (!map[a.department]) map[a.department] = { count: 0, jobs: 0, pending: 0, active: 0 };
      map[a.department].count += 1;
      map[a.department].jobs += a.jobsProcessed || 0;
      map[a.department].pending += a.pendingApprovals || 0;
      if (a.status === "ACTIVE") map[a.department].active += 1;
    }
    return map;
  }, [agents]);

  // Country intelligence — group universities/courses/scholarships per country
  const countryStats = React.useMemo(() => {
    const uniByCountry = countBy(universities, (u) => u.countrySlug);
    const courseByCountry = countBy(courses, (c) => c.countrySlug);
    const scholByCountry = countBy(scholarships, (s) => s.countrySlug || "");
    return countries.map((c) => ({
      ...c,
      universities: uniByCountry[c.slug] || 0,
      courses: courseByCountry[c.slug] || 0,
      scholarships: scholByCountry[c.slug] || 0,
    }));
  }, [countries, universities, courses, scholarships]);

  // Branch performance — derive per office: employees, plus simulated metrics
  const branchStats = React.useMemo(() => {
    return Object.entries(byOffice)
      .map(([name, empCount]) => ({
        name,
        employees: empCount,
        // Derived metrics — proportional allocation based on employee count share
        share: empCount / Math.max(1, employeeCount),
      }))
      .sort((a, b) => b.employees - a.employees);
  }, [byOffice, employeeCount]);

  // Recent employees (5 latest by joiningDate or createdAt — we only have fullName/designation)
  const recentEmployees = employees.slice(0, 5);

  // Pending approvals list
  const pendingEmployeeProfiles = employees.filter(
    (e) => e.profileStatus === "SUBMITTED" || e.profileStatus === "UNDER_REVIEW",
  );
  const pendingQuotaRequests = (accessData?.quotaRequests ?? []).filter((q) => q.status === "PENDING");

  // ---- Loading state -------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Super Admin Control Center"
          subtitle="Loading full-system overview…"
          icon="ShieldCheck"
        />
        <LoadingGrid count={8} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LoadingGrid count={2} />
          <LoadingGrid count={2} />
        </div>
      </div>
    );
  }

  // ---- Render ---------------------------------------------------------------

  const totalLeads = stats?.counts.leads ?? 0;
  const totalStudents = stats?.counts.students ?? 0;
  const totalApps = stats?.counts.applications ?? 0;
  const totalVisa = stats?.counts.visaCases ?? 0;
  const totalRevenue = stats?.finance.revenue ?? 0;
  const auditEventCount = auditLogs.length + (stats?.recentAudit?.length ?? 0);

  // Map countKey → count for quick action badges
  const countMap: Record<string, number> = {
    employees: employeeCount,
    packages: totalPackages,
    aiAgents: agents.length,
    audit: auditEventCount,
    quota: pendingQuota,
    pending: pendingApprovals,
    applications: totalApps,
    visa: totalVisa,
    leads: totalLeads,
    students: totalStudents,
    monitoring: pendingApprovals, // reuses pending approvals count as a proxy for monitoring queue size
  };

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Page Header                                                     */}
      {/* ----------------------------------------------------------------- */}
      <PageHeader
        title="Super Admin Control Center"
        subtitle="Full system control — employees, partners, courses, finance, AI, and security."
        icon="ShieldCheck"
        action={
          <Badge className="gap-1.5 border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational
          </Badge>
        }
      />

      {/* ----------------------------------------------------------------- */}
      {/* 2. System-wide metrics                                             */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Icon name="Activity" className="size-4 text-[#0057B8]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            System-wide Metrics
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Total Leads" value={totalLeads.toLocaleString()} icon="UserPlus" accent="blue" hint="Across all sources" />
          <StatCard label="Total Students" value={totalStudents.toLocaleString()} icon="Users" accent="orange" hint="Enrolled + active" />
          <StatCard label="Active Applications" value={totalApps.toLocaleString()} icon="ClipboardList" accent="violet" hint="In progress" />
          <StatCard label="Visa Cases" value={totalVisa.toLocaleString()} icon="Plane" accent="rose" hint="Open + decided" />
          <StatCard
            label="Total Revenue"
            value={<RevenueSensitive value={totalRevenue} />}
            icon="DollarSign"
            accent="emerald"
            hint="From paid invoices"
          />
          <StatCard label="Total Employees" value={employeeCount.toLocaleString()} icon="UserCog" accent="amber" hint={`${activeEmployees} active`} />
          <StatCard label="AI Agents Active" value={aiAgentsActive.toLocaleString()} icon="Bot" accent="blue" hint={`${agents.length} total`} />
          <StatCard label="Partner Packages" value={totalPackages.toLocaleString()} icon="Package" accent="orange" hint="Defined packages" />
          <StatCard label="Courses Published" value={courses.length.toLocaleString()} icon="BookOpen" accent="emerald" hint={`${universities.length} universities`} />
          <StatCard label="Universities" value={universities.length.toLocaleString()} icon="Building2" accent="violet" hint={`${countries.length} countries`} />
          <StatCard label="Pending Approvals" value={pendingApprovals.toLocaleString()} icon="Clock" accent="amber" hint="Profiles + quotas" />
          <StatCard label="Audit Events" value={auditEventCount.toLocaleString()} icon="ScrollText" accent="blue" hint="Recent activity" />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Quick Actions Grid                                              */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="LayoutGrid" className="size-4 text-[#0057B8]" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quick Actions · Master Hub
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">{QUICK_ACTIONS.length} modules</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((qa) => (
            <QuickActionCard
              key={qa.view}
              def={qa}
              count={qa.countKey ? countMap[qa.countKey] : undefined}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Tabs                                                            */}
      {/* ----------------------------------------------------------------- */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl border-2 border-[#E2E8F0] bg-white p-1.5">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
            <Icon name="Gauge" className="mr-1.5 size-4" />
            System Overview
          </TabsTrigger>
          <TabsTrigger value="employee" className="rounded-xl data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
            <Icon name="UserCog" className="mr-1.5 size-4" />
            Employee Control
          </TabsTrigger>
          <TabsTrigger value="branch" className="rounded-xl data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
            <Icon name="Building" className="mr-1.5 size-4" />
            Branch Control
          </TabsTrigger>
          <TabsTrigger value="country" className="rounded-xl data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
            <Icon name="Globe" className="mr-1.5 size-4" />
            Country Control
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-xl data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
            <Icon name="Bot" className="mr-1.5 size-4" />
            AI Command
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
            <Icon name="Settings" className="mr-1.5 size-4" />
            System Settings
          </TabsTrigger>
        </TabsList>

        {/* ------------------------- System Overview ------------------------- */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Health cards */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Icon name="HeartPulse" className="size-4 text-emerald-600" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                System Health
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {SYSTEM_HEALTH.map((h) => (
                <HealthCard key={h.key} label={h.label} icon={h.icon} detail={h.detail} latency={h.latency} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent audit logs */}
            <SectionCard
              title="Recent Audit Activity"
              description="Latest 10 events across the platform"
              icon="ScrollText"
              action={
                <Button variant="outline" size="sm" onClick={() => onNavigate("audit")}>
                  <Icon name="ArrowUpRight" className="mr-1.5 size-3.5" />
                  View all
                </Button>
              }
            >
              {auditLogs.length === 0 ? (
                <EmptyState icon="Inbox" title="No audit events" description="Audit log is empty." />
              ) : (
                <div className="max-h-96 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Action</TableHead>
                        <TableHead className="text-xs">User</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Resource</TableHead>
                        <TableHead className="text-xs">Time</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                AUDIT_ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700",
                              )}
                            >
                              {AUDIT_ACTION_LABELS[log.action] || log.action.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium text-foreground">
                              {log.user?.name || "System"}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {log.user?.role || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs hidden md:table-cell text-muted-foreground">
                            {log.resource || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {timeAgo(log.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs hidden lg:table-cell text-muted-foreground font-mono">
                            {log.ipAddress || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </SectionCard>

            {/* Pending approvals */}
            <SectionCard
              title="Pending Approvals"
              description="Items waiting for super admin action"
              icon="Clock"
            >
              <div className="space-y-3">
                {/* Pending employee profiles */}
                <div className="rounded-xl border-2 border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Icon name="UserCheck" className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Employee Profiles</p>
                        <p className="text-xs text-muted-foreground">Submitted / Under review</p>
                      </div>
                    </div>
                    <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
                      {pendingEmployeeProfiles.length}
                    </Badge>
                  </div>
                  {pendingEmployeeProfiles.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => onNavigate("employee-management")}
                    >
                      Review profiles
                      <Icon name="ArrowRight" className="ml-1.5 size-3.5" />
                    </Button>
                  )}
                </div>

                {/* Pending partner registrations */}
                <div className="rounded-xl border-2 border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        <Icon name="Handshake" className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Partner Registrations</p>
                        <p className="text-xs text-muted-foreground">Awaiting activation</p>
                      </div>
                    </div>
                    <Badge className="border-0 bg-violet-100 text-violet-700 hover:bg-violet-100">
                      {accessData?.summary.totalPartners ?? 0}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => onNavigate("partner-admin-dashboard")}
                  >
                    Manage partners
                    <Icon name="ArrowRight" className="ml-1.5 size-3.5" />
                  </Button>
                </div>

                {/* Pending quota requests */}
                <div className="rounded-xl border-2 border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                        <Icon name="PackagePlus" className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Quota Requests</p>
                        <p className="text-xs text-muted-foreground">Extra seats / image / video</p>
                      </div>
                    </div>
                    <Badge className="border-0 bg-rose-100 text-rose-700 hover:bg-rose-100">
                      {pendingQuota}
                    </Badge>
                  </div>
                  {pendingQuotaRequests.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {pendingQuotaRequests.slice(0, 2).map((q) => (
                        <div
                          key={q.id}
                          className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
                        >
                          <span className="font-medium text-foreground truncate">
                            {q.employee?.fullName || "Partner"}
                          </span>
                          <span className="text-muted-foreground">
                            {QUOTA_TYPE_LABELS[q.requestType] || q.requestType}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => onNavigate("access-control-center")}
                  >
                    Review quota requests
                    <Icon name="ArrowRight" className="ml-1.5 size-3.5" />
                  </Button>
                </div>

                {/* Pending import approvals */}
                <div className="rounded-xl border-2 border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#0057B8]">
                        <Icon name="FileCheck2" className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Import Approvals</p>
                        <p className="text-xs text-muted-foreground">Bulk + CSV pipelines</p>
                      </div>
                    </div>
                    <Badge className="border-0 bg-blue-100 text-[#0057B8] hover:bg-blue-100">0</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => onNavigate("import-center")}
                  >
                    Open Import Center
                    <Icon name="ArrowRight" className="ml-1.5 size-3.5" />
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* System metrics charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Leads by source */}
            <SectionCard title="Leads by Source" description="Channel performance" icon="Filter">
              {stats && Object.keys(stats.leadsBySource).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.leadsBySource)
                    .sort((a, b) => b[1] - a[1])
                    .map(([src, n]) => {
                      const max = Math.max(...Object.values(stats.leadsBySource));
                      return (
                        <div key={src}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">
                              {SOURCE_LABELS_LOCAL[src] || src.replace(/_/g, " ")}
                            </span>
                            <span className="tabular-nums text-muted-foreground">{n}</span>
                          </div>
                          <MiniBar value={n} max={max} color="#0057B8" />
                        </div>
                      );
                    })}
                </div>
              ) : (
                <EmptyState icon="BarChart3" title="No lead sources" />
              )}
            </SectionCard>

            {/* Applications by stage */}
            <SectionCard title="Applications by Stage" description="Pipeline distribution" icon="ClipboardList">
              {stats && Object.keys(stats.appsByStage).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(stats.appsByStage).map(([stage, n]) => (
                    <span
                      key={stage}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                        STAGE_COLORS[stage] || "bg-slate-100 text-slate-700",
                      )}
                      title={STAGE_LABELS[stage] || stage}
                    >
                      {STAGE_LABELS[stage] || stage.replace(/_/g, " ")}
                      <span className="ml-1 rounded-full bg-white/60 px-1.5 text-[10px] tabular-nums">{n}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyState icon="ClipboardList" title="No applications" />
              )}
            </SectionCard>

            {/* Documents by status */}
            <SectionCard title="Documents by Status" description="Verification funnel" icon="FolderLock">
              {stats && Object.keys(stats.docsByStatus).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.docsByStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, n]) => {
                      const max = Math.max(...Object.values(stats.docsByStatus));
                      return (
                        <div key={status}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">
                              {DOC_STATUS_LABELS[status] || status.replace(/_/g, " ")}
                            </span>
                            <span className="tabular-nums text-muted-foreground">{n}</span>
                          </div>
                          <MiniBar
                            value={n}
                            max={max}
                            color={
                              status === "APPROVED"
                                ? "#10b981"
                                : status === "REJECTED"
                                  ? "#f43f5e"
                                  : status === "UNDER_REVIEW"
                                    ? "#6366f1"
                                    : status === "UPLOADED"
                                      ? "#0ea5e9"
                                      : "#f59e0b"
                            }
                          />
                        </div>
                      );
                    })}
                </div>
              ) : (
                <EmptyState icon="FolderLock" title="No documents" />
              )}
            </SectionCard>
          </div>
        </TabsContent>

        {/* ------------------------- Employee Control ------------------------ */}
        <TabsContent value="employee" className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0057B8]">Employee Control</h3>
              <p className="text-sm text-muted-foreground">
                {employeeCount} employees · {activeEmployees} active · {pendingProfiles} pending profile
                approvals
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onNavigate("employee-management")}>
                <Icon name="UserCog" className="mr-1.5 size-4" />
                Manage Employees
              </Button>
              <Button variant="outline" onClick={() => onNavigate("access-control-center")}>
                <Icon name="Shield" className="mr-1.5 size-4" />
                Access Control
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* By designation */}
            <SectionCard title="By Designation" description="Headcount distribution" icon="BadgeCheck">
              {Object.keys(byDesignation).length > 0 ? (
                <div className="space-y-2.5">
                  {Object.entries(byDesignation)
                    .sort((a, b) => b[1] - a[1])
                    .map(([desig, n]) => {
                      const max = Math.max(...Object.values(byDesignation));
                      return (
                        <div key={desig}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">{desig}</span>
                            <span className="tabular-nums text-muted-foreground">{n}</span>
                          </div>
                          <MiniBar value={n} max={max} color="#0057B8" />
                        </div>
                      );
                    })}
                </div>
              ) : (
                <EmptyState icon="BadgeCheck" title="No designations recorded" />
              )}
            </SectionCard>

            {/* By department */}
            <SectionCard title="By Department" description="Departmental headcount" icon="Boxes">
              {Object.keys(byDepartment).length > 0 ? (
                <div className="space-y-2.5">
                  {Object.entries(byDepartment)
                    .sort((a, b) => b[1] - a[1])
                    .map(([dept, n]) => {
                      const max = Math.max(...Object.values(byDepartment));
                      return (
                        <div key={dept}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">{dept}</span>
                            <span className="tabular-nums text-muted-foreground">{n}</span>
                          </div>
                          <MiniBar value={n} max={max} color="#E8501A" />
                        </div>
                      );
                    })}
                </div>
              ) : (
                <EmptyState icon="Boxes" title="No departments assigned" />
              )}
            </SectionCard>

            {/* By office */}
            <SectionCard title="By Office / Branch" description="Branch-wise headcount" icon="Building">
              {Object.keys(byOffice).length > 0 ? (
                <div className="space-y-2.5">
                  {Object.entries(byOffice)
                    .sort((a, b) => b[1] - a[1])
                    .map(([office, n]) => {
                      const max = Math.max(...Object.values(byOffice));
                      return (
                        <div key={office}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">{office}</span>
                            <span className="tabular-nums text-muted-foreground">{n}</span>
                          </div>
                          <MiniBar value={n} max={max} color="#8b5cf6" />
                        </div>
                      );
                    })}
                </div>
              ) : (
                <EmptyState icon="Building" title="No offices assigned" />
              )}
            </SectionCard>

            {/* Profile status breakdown */}
            <SectionCard title="Profile Status" description="Approval pipeline" icon="FileCheck">
              {Object.keys(byProfileStatus).length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(byProfileStatus).map(([status, n]) => (
                    <div
                      key={status}
                      className="rounded-xl border-2 border-[#E2E8F0] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <StatusBadge
                          status={status}
                          colorMap={PROFILE_STATUS_COLORS}
                          labels={PROFILE_STATUS_LABELS}
                        />
                        <span className="text-lg font-bold text-foreground tabular-nums">{n}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {((n / Math.max(1, employeeCount)) * 100).toFixed(0)}% of workforce
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="FileCheck" title="No profile data" />
              )}
            </SectionCard>
          </div>

          {/* Quick employee table */}
          <SectionCard
            title="Recent Employees"
            description="5 most recent in the directory"
            icon="ListChecks"
            action={
              <Button variant="outline" size="sm" onClick={() => onNavigate("employee-management")}>
                View all
                <Icon name="ArrowRight" className="ml-1.5 size-3.5" />
              </Button>
            }
          >
            {recentEmployees.length === 0 ? (
              <EmptyState icon="Users" title="No employees yet" description="Employee directory is empty." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Designation</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Department</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Profile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEmployees.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          <div className="font-medium text-foreground text-sm">{e.fullName}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{e.employeeCode}</div>
                        </TableCell>
                        <TableCell className="text-sm">{e.designation}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell text-muted-foreground">
                          {e.department?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={e.status} colorMap={EMPLOYEE_STATUS_COLORS} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={e.profileStatus}
                            colorMap={PROFILE_STATUS_COLORS}
                            labels={PROFILE_STATUS_LABELS}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* ------------------------- Branch Control -------------------------- */}
        <TabsContent value="branch" className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0057B8]">Branch Control</h3>
              <p className="text-sm text-muted-foreground">
                {branchStats.length} branches · {employeeCount} total employees
              </p>
            </div>
            <Button
              onClick={() =>
                toast({
                  title: "Add Branch",
                  description: "Branch creation wizard will open in a future release. Use the Import Center to bulk-add offices.",
                })
              }
            >
              <Icon name="Plus" className="mr-1.5 size-4" />
              Add Branch
            </Button>
          </div>

          {branchStats.length === 0 ? (
            <EmptyState
              icon="Building"
              title="No branches configured"
              description="Add offices via the employee management screen."
              action={
                <Button variant="outline" onClick={() => onNavigate("employee-management")}>
                  Open Employee Management
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {branchStats.map((b) => {
                  const totalLeadsForBranch = Math.round(totalLeads * b.share);
                  const totalStudentsForBranch = Math.round(totalStudents * b.share);
                  const totalRevenueForBranch = Math.round(totalRevenue * b.share);
                  return (
                    <Card
                      key={b.name}
                      className="rounded-2xl border-2 border-[#E2E8F0] hover:border-[#0057B8]/40 transition-colors"
                    >
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                              <Icon name="Building" className="size-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{b.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {((b.share * 100)).toFixed(0)}% of workforce
                              </p>
                            </div>
                          </div>
                          <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
                            {b.employees} staff
                          </Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-muted/40 p-2">
                            <p className="text-muted-foreground">Leads</p>
                            <p className="text-sm font-bold text-foreground tabular-nums">
                              {totalLeadsForBranch.toLocaleString()}
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2">
                            <p className="text-muted-foreground">Students</p>
                            <p className="text-sm font-bold text-foreground tabular-nums">
                              {totalStudentsForBranch.toLocaleString()}
                            </p>
                          </div>
                          <div className="col-span-2 rounded-lg bg-emerald-50 p-2">
                            <p className="text-emerald-700/80">Revenue (share)</p>
                            <p className="text-sm font-bold text-emerald-700 tabular-nums">
                              {formatCurrency(totalRevenueForBranch)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Branch performance comparison */}
              <SectionCard
                title="Branch Performance Comparison"
                description="Headcount distribution across offices"
                icon="BarChart3"
              >
                <div className="space-y-3">
                  {branchStats.map((b) => {
                    const max = Math.max(...branchStats.map((x) => x.employees));
                    return (
                      <div key={b.name}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{b.name}</span>
                          <span className="tabular-nums text-muted-foreground">{b.employees} staff</span>
                        </div>
                        <MiniBar value={b.employees} max={max} color="#0057B8" />
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </>
          )}
        </TabsContent>

        {/* ------------------------- Country Control ------------------------- */}
        <TabsContent value="country" className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0057B8]">Country Control</h3>
              <p className="text-sm text-muted-foreground">
                {countries.length} destinations · {universities.length} universities · {courses.length} courses ·{" "}
                {scholarships.length} scholarships
              </p>
            </div>
            <Button
              onClick={() =>
                toast({
                  title: "Manage Countries",
                  description: "Country management console is part of the Course Management module.",
                })
              }
            >
              <Icon name="Plus" className="mr-1.5 size-4" />
              Manage Countries
            </Button>
          </div>

          {countryStats.length === 0 ? (
            <EmptyState icon="Globe" title="No countries configured" description="Country pages will appear here once published." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {countryStats.map((c) => (
                <Card
                  key={c.id}
                  className="rounded-2xl border-2 border-[#E2E8F0] hover:border-[#0057B8]/40 transition-colors"
                >
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f0fb] text-2xl">
                          {c.flag || "🌍"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.capital ? `Capital: ${c.capital}` : "—"}
                            {c.currency ? ` · ${c.currency}` : ""}
                          </p>
                        </div>
                      </div>
                      {c.verificationStatus === "VERIFIED" ? (
                        <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <Icon name="CheckCircle2" className="mr-1 size-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
                          <Icon name="Clock" className="mr-1 size-3" />
                          Review
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-muted-foreground">Universities</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{c.universities}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-muted-foreground">Courses</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{c.courses}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-muted-foreground">Scholarships</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{c.scholarships}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-2">
                        <p className="text-muted-foreground">Students</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {Math.round(totalStudents * (c.universities / Math.max(1, universities.length))).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Last verified</span>
                      <span className="font-medium">{fmtDate(c.lastVerifiedAt)}</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => onNavigate("public-country", c.slug)}
                    >
                      View country page
                      <Icon name="ArrowRight" className="ml-1.5 size-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Country performance */}
          {countryStats.length > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SectionCard title="Universities per Country" description="Catalog distribution" icon="Building2">
                <div className="space-y-3">
                  {countryStats
                    .slice()
                    .sort((a, b) => b.universities - a.universities)
                    .slice(0, 8)
                    .map((c) => {
                      const max = Math.max(...countryStats.map((x) => x.universities));
                      return (
                        <div key={c.id}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">
                              {c.flag} {c.name}
                            </span>
                            <span className="tabular-nums text-muted-foreground">{c.universities}</span>
                          </div>
                          <MiniBar value={c.universities} max={max} color="#0057B8" />
                        </div>
                      );
                    })}
                </div>
              </SectionCard>

              <SectionCard title="Courses per Country" description="Course catalog depth" icon="BookOpen">
                <div className="space-y-3">
                  {countryStats
                    .slice()
                    .sort((a, b) => b.courses - a.courses)
                    .slice(0, 8)
                    .map((c) => {
                      const max = Math.max(...countryStats.map((x) => x.courses));
                      return (
                        <div key={c.id}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">
                              {c.flag} {c.name}
                            </span>
                            <span className="tabular-nums text-muted-foreground">{c.courses}</span>
                          </div>
                          <MiniBar value={c.courses} max={max} color="#E8501A" />
                        </div>
                      );
                    })}
                </div>
              </SectionCard>
            </div>
          )}
        </TabsContent>

        {/* ------------------------- AI Command ------------------------------ */}
        <TabsContent value="ai" className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0057B8]">AI Command Center</h3>
              <p className="text-sm text-muted-foreground">
                {agents.length} agents across {Object.keys(agentsByDept).length} departments ·{" "}
                {aiJobsProcessed.toLocaleString()} jobs processed
              </p>
            </div>
            <Button onClick={() => onNavigate("ai-command")}>
              <Icon name="Bot" className="mr-1.5 size-4" />
              Open AI Command Center
            </Button>
          </div>

          {/* AI stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Agents" value={agents.length.toLocaleString()} icon="Bot" accent="blue" />
            <StatCard label="Active Agents" value={aiAgentsActive.toLocaleString()} icon="Zap" accent="emerald" />
            <StatCard label="Jobs Processed" value={aiJobsProcessed.toLocaleString()} icon="Cog" accent="orange" />
            <StatCard label="Pending Approvals" value={aiPendingApprovals.toLocaleString()} icon="Clock" accent="amber" />
          </div>

          {/* Department grid */}
          <SectionCard
            title={`Department Grid · ${Object.keys(agentsByDept).length} Departments`}
            description="AI agent distribution by department"
            icon="Boxes"
          >
            {Object.keys(agentsByDept).length === 0 ? (
              <EmptyState icon="Bot" title="No AI agents" description="AI agent seed data is empty." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(agentsByDept)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([dept, info]) => {
                    const max = Math.max(
                      ...Object.values(agentsByDept).map((x) => x.count),
                    );
                    return (
                      <div
                        key={dept}
                        className="rounded-xl border-2 border-[#E2E8F0] p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground">{dept}</p>
                          <Badge className="border-0 bg-violet-100 text-violet-700 hover:bg-violet-100">
                            {info.count} agent{info.count !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <MiniBar value={info.count} max={max} color="#8b5cf6" />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{info.active} active</span>
                          <span>{info.jobs.toLocaleString()} jobs</span>
                          {info.pending > 0 && (
                            <span className="font-medium text-amber-700">{info.pending} pending</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </SectionCard>

          {/* AI safety rules */}
          <SectionCard
            title="AI Safety Rules"
            description="Non-negotiable rules enforced across all AI agents"
            icon="ShieldAlert"
          >
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
              <div className="mb-3 flex items-start gap-2">
                <Icon name="AlertTriangle" className="mt-0.5 size-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-900">AI must NOT</p>
                  <p className="text-xs text-amber-800">
                    These rules are enforced in the AI Command Center safety layer. Violations are
                    audit-logged.
                  </p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {AI_SAFETY_RULES.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                    <Icon name="X" className="mt-0.5 size-3.5 text-rose-600 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ------------------------- System Settings ------------------------- */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0057B8]">System Settings</h3>
              <p className="text-sm text-muted-foreground">
                Global configuration across the entire ALO Education platform
              </p>
            </div>
            <Button variant="outline" onClick={() => onNavigate("audit")}>
              <Icon name="ScrollText" className="mr-1.5 size-4" />
              View Audit Logs
            </Button>
          </div>

          {/* Settings cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SETTINGS_CARDS.map((card) => (
              <Card key={card.key} className="rounded-2xl border-2 border-[#E2E8F0]">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                        <Icon name={card.icon} className="size-4.5" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{card.title}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {card.fields.map((f) => (
                      <div
                        key={f.label}
                        className="flex items-center justify-between border-b border-border/60 py-1.5 text-xs last:border-0"
                      >
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className="font-medium text-foreground text-right">{f.value}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() =>
                      toast({
                        title: `Configure ${card.title}`,
                        description: `${card.title} editor opens in a future release. Use environment variables and the database for now.`,
                      })
                    }
                  >
                    <Icon name="Settings2" className="mr-1.5 size-3.5" />
                    Configure
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature flags */}
          <SectionCard
            title="Feature Flags"
            description="Enable or disable modules across the platform"
            icon="ToggleLeft"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_FLAGS.map((flag) => (
                <div
                  key={flag.label}
                  className={cn(
                    "flex items-center justify-between rounded-xl border-2 p-3 transition-colors",
                    flag.enabled
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-slate-200 bg-slate-50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        flag.enabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500",
                      )}
                    >
                      <Icon name={flag.icon} className="size-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{flag.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toast({
                        title: `Feature flag: ${flag.label}`,
                        description: `Currently ${flag.enabled ? "ENABLED" : "DISABLED"}. Toggles require super admin confirmation — use the Access Control Center.`,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                      flag.enabled ? "bg-emerald-500" : "bg-slate-300",
                    )}
                    aria-label={`Toggle ${flag.label}`}
                  >
                    <span
                      className={cn(
                        "inline-block size-3.5 transform rounded-full bg-white shadow transition-transform",
                        flag.enabled ? "translate-x-5" : "translate-x-1",
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* ----------------------------------------------------------------- */}
      {/* 5. Security & RBAC summary                                         */}
      {/* ----------------------------------------------------------------- */}
      <Card className="rounded-2xl border-2 border-[#0057B8]/20 bg-gradient-to-br from-[#e8f0fb]/40 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#0057B8] text-white alo-shadow">
              <Icon name="ShieldCheck" className="size-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#0057B8]">Security & RBAC Summary</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Defense-in-depth across backend, frontend, and middleware layers.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {RBAC_SUMMARY.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border-2 border-[#E2E8F0] bg-white p-4"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                  <Icon name={item.icon} className="size-4.5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>

          {/* Inline SensitiveField demo — revenue figure */}
          <div className="mt-5 rounded-xl border-2 border-[#E2E8F0] bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="DollarSign" className="size-4 text-emerald-600" />
              <p className="text-sm font-semibold text-foreground">Revenue Snapshot</p>
              <Badge className="ml-auto border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Privacy-protected
              </Badge>
            </div>
            <SensitiveField
              id="super-admin-revenue-detail"
              label="Total paid revenue (USD)"
              value={formatCurrency(totalRevenue)}
              type="currency"
              mono
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Revenue is blurred by default in privacy mode. Click the value to reveal — every view
              is audit-logged under <span className="font-mono">SALARY_ACCESS</span> /{" "}
              <span className="font-mono">PAYMENT_UPDATE</span> actions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default SuperAdminDashboard;
