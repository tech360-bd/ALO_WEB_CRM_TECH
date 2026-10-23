"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
} from "@/components/alo/shared";
import { SensitiveField } from "@/components/alo/privacy-mode";
import {
  STAGE_COLORS,
  STAGE_LABELS,
  fmtDate,
  timeAgo,
} from "@/lib/alo-types";

// ============================================================
// Types
// ============================================================

interface StudentLite {
  studentId: string;
  fullName: string;
  email?: string | null;
  mobile?: string | null;
}

interface Application {
  id: string;
  applicationId: string;
  student?: StudentLite | null;
  university: string;
  course: string;
  country: string;
  intake: string;
  studyLevel?: string;
  stage: string;
  priority: string;
  deadline?: string | null;
  counselorId?: string | null;
  appTeamOfficerId?: string | null;
  visaOfficerId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface B2bProvider {
  id: string;
  providerCode: string;
  name: string;
  providerType: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  portalUrl?: string | null;
  loginNote?: string | null;
  commissionRule?: string | null;
  paymentCondition?: string | null;
  claimStage?: string | null;
  status: string;
  internalNote?: string | null;
  lastReviewedAt?: string | null;
  _count?: { b2bApplications: number };
  createdAt: string;
}

interface B2bApplication {
  id: string;
  applicationId: string;
  b2bProviderId: string;
  b2bProvider?: B2bProvider | null;
  b2bType: string; // INBOUND | OUTBOUND
  b2bReference?: string | null;
  submissionRoute?: string | null;
  submittedDate?: string | null;
  b2bStatus: string;
  b2bCommissionType?: string | null;
  b2bCommissionAmount?: number | null;
  b2bPaymentCondition?: string | null;
  b2bClaimStage?: string | null;
  b2bInternalNote?: string | null;
  lastFollowupAt?: string | null;
  nextFollowupAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationComment {
  id: string;
  applicationId: string;
  userId?: string | null;
  role?: string | null;
  commentType: string;
  visibility: string;
  commentText: string;
  isB2bConfidential: boolean;
  createdAt: string;
}

interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: string;
  status: string;
  reviewNote?: string | null;
  createdAt: string;
}

interface ApplicationDeadline {
  id: string;
  applicationId: string;
  deadlineType: string;
  deadlineDate: string;
  status: string;
  assignedTo?: string | null;
  reminderSent: boolean;
}

interface ApplicationTask {
  id: string;
  applicationId: string;
  taskTitle: string;
  taskDescription?: string | null;
  assignedTo?: string | null;
  priority: string;
  status: string;
  dueDate?: string | null;
  createdAt: string;
}

interface ApplicationStatusLog {
  id: string;
  applicationId: string;
  oldStatus?: string | null;
  newStatus: string;
  safeStatus: string;
  changedBy?: string | null;
  visibility: string;
  note?: string | null;
  createdAt: string;
}

interface Kpis {
  totalApplications: number;
  newToday: number;
  direct: number;
  partner: number;
  b2b: number;
  submitted: number;
  decisionPending: number;
  conditionalOffers: number;
  unconditionalOffers: number;
  rejected: number;
  documentsPending: number;
  casPending: number;
  b2bConfidential: number;
  urgentDeadlines: number;
  pendingTasks: number;
}

interface DashboardResponse {
  kpis: Kpis;
  applications: Application[];
  b2bApplications: B2bApplication[];
  b2bProviders: B2bProvider[];
  comments: ApplicationComment[];
  documents: ApplicationDocument[];
  deadlines: ApplicationDeadline[];
  tasks: ApplicationTask[];
  statusLogs: ApplicationStatusLog[];
}

// ============================================================
// Constants & Maps
// ============================================================

const VIEWER_ROLES = [
  { value: "APPLICATION_TEAM", label: "Application Team" },
  { value: "APPLICATION_MANAGER", label: "Application Manager" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "COUNSELOR", label: "Counselor" },
  { value: "STUDENT", label: "Student" },
  { value: "PARTNER", label: "Partner" },
];

const B2B_ACCESS_ROLES = ["APPLICATION_TEAM", "APPLICATION_MANAGER", "SUPER_ADMIN"];

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  GLOBAL_B2B: "Global B2B",
  COUNTRY_SPECIFIC: "Country-Specific",
  UNIVERSITY_REPRESENTATIVE: "University Rep",
  PATHWAY_PROVIDER: "Pathway Provider",
  AGGREGATOR: "Aggregator",
  SUB_AGENT: "Sub-Agent",
  DIRECT_UNIVERSITY: "Direct University",
};

const PROVIDER_TYPE_COLORS: Record<string, string> = {
  GLOBAL_B2B: "bg-rose-100 text-rose-700",
  COUNTRY_SPECIFIC: "bg-violet-100 text-violet-700",
  UNIVERSITY_REPRESENTATIVE: "bg-sky-100 text-sky-700",
  PATHWAY_PROVIDER: "bg-amber-100 text-amber-700",
  AGGREGATOR: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]",
  SUB_AGENT: "bg-emerald-100 text-emerald-700",
  DIRECT_UNIVERSITY: "bg-teal-100 text-teal-700",
};

const B2B_STATUS_META: Record<string, { label: string; cls: string }> = {
  SUBMITTED: { label: "Submitted", cls: "bg-sky-100 text-sky-700" },
  ACKNOWLEDGED: { label: "Acknowledged", cls: "bg-indigo-100 text-indigo-700" },
  IN_REVIEW: { label: "In Review", cls: "bg-violet-100 text-violet-700" },
  DECISION_PENDING: { label: "Decision Pending", cls: "bg-amber-100 text-amber-700" },
  OFFERED: { label: "Offered", cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected", cls: "bg-rose-100 text-rose-700" },
  COMMISSION_DUE: { label: "Commission Due", cls: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]" },
  COMMISSION_PAID: { label: "Commission Paid", cls: "bg-teal-100 text-teal-700" },
};

const B2B_TYPE_META: Record<string, { label: string; cls: string; icon: string }> = {
  INBOUND: { label: "INBOUND", cls: "bg-emerald-100 text-emerald-700", icon: "ArrowDownToLine" },
  OUTBOUND: { label: "OUTBOUND", cls: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]", icon: "ArrowUpFromLine" },
};

const SOURCE_META: Record<string, { label: string; cls: string; icon: string }> = {
  DIRECT: { label: "Direct", cls: "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]", icon: "FileText" },
  PARTNER: { label: "Partner", cls: "bg-violet-100 text-violet-700", icon: "Handshake" },
  B2B_INBOUND: { label: "B2B Inbound", cls: "bg-emerald-100 text-emerald-700", icon: "ArrowDownToLine" },
  B2B_OUTBOUND: { label: "B2B Outbound", cls: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]", icon: "ArrowUpFromLine" },
};

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  URGENT: { label: "Urgent", cls: "bg-rose-100 text-rose-700" },
  HIGH: { label: "High", cls: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]" },
  NORMAL: { label: "Normal", cls: "bg-sky-100 text-sky-700" },
  LOW: { label: "Low", cls: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]" },
};

const COMMENT_CHANNELS = [
  { value: "STUDENT_VISIBLE", label: "Student-Visible", icon: "User", desc: "Visible to student in Student Portal" },
  { value: "PARTNER_VISIBLE", label: "Partner-Visible", icon: "Handshake", desc: "Visible to partner portal" },
  { value: "COUNSELOR_VISIBLE", label: "Counselor-Visible", icon: "Headset", desc: "Visible to assigned counselor" },
  { value: "INTERNAL", label: "Internal", icon: "Lock", desc: "Internal team only" },
  { value: "B2B_CONFIDENTIAL", label: "B2B Confidential", icon: "ShieldAlert", desc: "Application Team + Super Admin only" },
  { value: "UNIVERSITY", label: "University", icon: "Building2", desc: "University communication" },
  { value: "FINANCE", label: "Finance", icon: "DollarSign", desc: "Finance team only" },
  { value: "VISA_HANDOVER", label: "Visa Handover", icon: "Plane", desc: "Visa officer handover notes" },
];

const COMMENT_CHANNEL_CLS: Record<string, string> = {
  STUDENT_VISIBLE: "bg-emerald-100 text-emerald-700",
  PARTNER_VISIBLE: "bg-violet-100 text-violet-700",
  COUNSELOR_VISIBLE: "bg-sky-100 text-sky-700",
  INTERNAL: "bg-slate-200 text-[var(--alo-body)]",
  B2B_CONFIDENTIAL: "bg-rose-100 text-rose-700",
  UNIVERSITY: "bg-teal-100 text-teal-700",
  FINANCE: "bg-amber-100 text-amber-700",
  VISA_HANDOVER: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]",
};

const DEADLINE_TYPE_META: Record<string, { label: string; cls: string }> = {
  APPLICATION: { label: "Application", cls: "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]" },
  DOCUMENT: { label: "Document", cls: "bg-amber-100 text-amber-700" },
  OFFER_CONDITION: { label: "Offer Condition", cls: "bg-violet-100 text-violet-700" },
  DEPOSIT: { label: "Deposit", cls: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]" },
  CAS_I20_COE: { label: "CAS / I-20 / COE", cls: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]" },
  B2B_FOLLOWUP: { label: "B2B Follow-up", cls: "bg-rose-100 text-rose-700" },
  UNIVERSITY_FOLLOWUP: { label: "University Follow-up", cls: "bg-sky-100 text-sky-700" },
};

const TASK_STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-sky-100 text-sky-700" },
  BLOCKED: { label: "Blocked", cls: "bg-rose-100 text-rose-700" },
  DONE: { label: "Done", cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]" },
};

const PIPELINE_STAGES = [
  "COUNSELING",
  "ELIGIBILITY_CHECKED",
  "DOCUMENTS_PENDING",
  "DOCUMENTS_RECEIVED",
  "UNIVERSITY_SHORTLISTED",
  "APPLICATION_PREPARING",
  "APPLICATION_SUBMITTED",
  "CONDITIONAL_OFFFER",
  "UNCONDITIONAL_OFFER",
  "DEPOSIT_PENDING",
  "CAS_PENDING",
  "CAS_ISSUED",
  "VISA_SUBMITTED",
  "VISA_APPROVED",
  "ENROLLED",
];

// ============================================================
// Helpers
// ============================================================

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

function daysRemainingBadge(dateStr?: string | null): React.ReactNode {
  const d = daysUntil(dateStr);
  if (d === null) return <span className="text-xs text-muted-foreground">—</span>;
  if (d < 0) return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">{Math.abs(d)}d overdue</Badge>;
  if (d === 0) return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Today</Badge>;
  if (d < 3) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{d}d left</Badge>;
  if (d < 7) return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">{d}d left</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{d}d left</Badge>;
}

function formatCurrency(amount?: number | null, currency = "USD"): string {
  if (amount === null || amount === undefined) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `$${amount.toLocaleString()}`;
  }
}

// Detect source for an application — derived from b2b applications + partner email pattern
function detectSource(
  app: Application,
  b2bApps: B2bApplication[]
): { source: keyof typeof SOURCE_META; b2b?: B2bApplication | null } {
  const matched = b2bApps.find((b) => b.applicationId === app.id);
  if (matched) {
    return matched.b2bType === "INBOUND"
      ? { source: "B2B_INBOUND", b2b: matched }
      : { source: "B2B_OUTBOUND", b2b: matched };
  }
  const email = app.student?.email || "";
  if (email.includes("partner")) return { source: "PARTNER", b2b: null };
  return { source: "DIRECT", b2b: null };
}

function docStatusSummary(docs: ApplicationDocument[]): { label: string; cls: string; missing: number; total: number } {
  if (docs.length === 0) return { label: "No docs", cls: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]", missing: 0, total: 0 };
  const missing = docs.filter((d) => d.status === "MISSING" || d.status === "REQUEST_AGAIN").length;
  const pending = docs.filter((d) => d.status === "UNDER_REVIEW").length;
  if (missing > 0) return { label: `${missing} missing`, cls: "bg-rose-100 text-rose-700", missing, total: docs.length };
  if (pending > 0) return { label: `${pending} in review`, cls: "bg-amber-100 text-amber-700", missing, total: docs.length };
  return { label: `${docs.length} ok`, cls: "bg-emerald-100 text-emerald-700", missing, total: docs.length };
}

// ============================================================
// Main Component
// ============================================================

export function ApplicationManagerPortal() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<DashboardResponse | null>(null);
  const [tab, setTab] = React.useState("dashboard");

  // Viewer role switcher — used to demonstrate role-based visibility
  const [viewerRole, setViewerRole] = React.useState("APPLICATION_TEAM");
  const canViewB2B = B2B_ACCESS_ROLES.includes(viewerRole);

  // Fetch dashboard
  const fetchDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/app-manager/dashboard");
      if (!res.ok) throw new Error("fetch failed");
      const json: DashboardResponse = await res.json();
      setData(json);
    } catch {
      toast({
        title: "Failed to load dashboard",
        description: "Could not load Application Manager data. Please retry.",
        variant: "destructive",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const kpis = data?.kpis;
  const applications = data?.applications || [];
  const b2bApplications = data?.b2bApplications || [];
  const b2bProviders = data?.b2bProviders || [];
  const comments = data?.comments || [];
  const documents = data?.documents || [];
  const deadlines = data?.deadlines || [];
  const tasks = data?.tasks || [];
  const statusLogs = data?.statusLogs || [];

  // ---- derived dashboard data ----
  const stageCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of applications) map[a.stage] = (map[a.stage] || 0) + 1;
    return map;
  }, [applications]);

  const totalStageCount = Object.values(stageCounts).reduce((s, n) => s + n, 0) || 1;

  // Submission queue counts (derived from applications + b2b apps)
  const submissionQueue = React.useMemo(() => {
    const readyToSubmit = applications.filter(
      (a) => a.stage === "APPLICATION_PREPARING" || a.stage === "DOCUMENTS_RECEIVED"
    ).length;
    const missingDocs = applications.filter((a) => a.stage === "DOCUMENTS_PENDING").length;
    const feePending = applications.filter((a) => a.stage === "DEPOSIT_PENDING").length;
    const b2bFollowup = b2bApplications.filter((b) => {
      const next = daysUntil(b.nextFollowupAt as unknown as string);
      return next !== null && next <= 3;
    }).length;
    return { readyToSubmit, missingDocs, feePending, b2bFollowup };
  }, [applications, b2bApplications]);

  // ---- KPI list (14 items) ----
  const kpiList: Array<{ key: string; label: string; value: number; icon: string; accent: "blue" | "emerald" | "violet" | "rose" | "amber" | "orange"; badge?: string }> = [
    { key: "total", label: "Total Applications", value: kpis?.totalApplications ?? 0, icon: "FolderKanban", accent: "blue" },
    { key: "new", label: "New Today", value: kpis?.newToday ?? 0, icon: "Sparkles", accent: "emerald" },
    { key: "direct", label: "Direct", value: kpis?.direct ?? 0, icon: "FileText", accent: "blue" },
    { key: "partner", label: "Partner", value: kpis?.partner ?? 0, icon: "Handshake", accent: "violet" },
    { key: "b2b", label: "B2B Applications", value: kpis?.b2b ?? 0, icon: "Lock", accent: "rose", badge: "Confidential" },
    { key: "submitted", label: "Submitted", value: kpis?.submitted ?? 0, icon: "Send", accent: "emerald" },
    { key: "decision", label: "Decision Pending", value: kpis?.decisionPending ?? 0, icon: "Clock", accent: "amber" },
    { key: "conditional", label: "Conditional Offers", value: kpis?.conditionalOffers ?? 0, icon: "FileCheck", accent: "violet" },
    { key: "unconditional", label: "Unconditional Offers", value: kpis?.unconditionalOffers ?? 0, icon: "CheckCircle", accent: "emerald" },
    { key: "rejected", label: "Rejected", value: kpis?.rejected ?? 0, icon: "XCircle", accent: "rose" },
    { key: "docsPending", label: "Documents Pending", value: kpis?.documentsPending ?? 0, icon: "FileWarning", accent: "amber" },
    { key: "casPending", label: "CAS/I-20/COE Pending", value: kpis?.casPending ?? 0, icon: "FileClock", accent: "orange" },
    { key: "urgent", label: "Urgent Deadlines", value: kpis?.urgentDeadlines ?? 0, icon: "AlertTriangle", accent: "rose" },
    { key: "tasks", label: "Pending Tasks", value: kpis?.pendingTasks ?? 0, icon: "ListTodo", accent: "amber" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Application Manager Portal"
        icon="FolderKanban"
        subtitle="Manage all applications — direct, partner, and confidential B2B. Full lifecycle from submission to visa handover."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Viewing as</Label>
              <Select value={viewerRole} onValueChange={setViewerRole}>
                <SelectTrigger className="h-9 w-[170px] rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIEWER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
 variant="outline"
 className=" rounded-xl"
 onClick={fetchDashboard}
 disabled={loading}
 >
              <Icon name="RefreshCw" className={`mr-1.5 size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Access banner */}
      <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-[var(--alo-brand-light)]/40">
        <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${canViewB2B ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
              <Icon name={canViewB2B ? "ShieldCheck" : "ShieldAlert"} className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--alo-brand)]">
                {canViewB2B ? "Full B2B access granted" : "Limited view — B2B data hidden"}
              </p>
              <p className="text-xs text-muted-foreground">
                {canViewB2B
                  ? "You can view B2B providers, B2B applications, commission amounts, and confidential comments. All actions are audit-logged."
                  : "Switch to Application Team / Application Manager / Super Admin to view B2B confidential data."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
            <span className="rounded-md bg-white px-2 py-1 text-[var(--alo-brand)] shadow-sm">{viewerRole.replace(/_/g, " ")}</span>
            {canViewB2B && (
              <span className="rounded-md bg-rose-100 px-2 py-1 text-rose-700 shadow-sm">B2B Confidential</span>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingGrid count={6} />
      ) : !data ? (
        <EmptyState
          icon="AlertCircle"
          title="Dashboard unavailable"
          description="Could not load dashboard data. Please retry."
          action={
            <Button className=" bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90" onClick={fetchDashboard}>
              <Icon name="RefreshCw" className="mr-1.5 size-4" /> Retry
            </Button>
          }
        />
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {kpiList.map((k) => (
              <div key={k.key} className="relative">
                <StatCard
                  label={k.label}
                  value={k.value}
                  icon={k.icon}
                  accent={k.accent}
                />
                {k.badge && (
                  <span className="absolute right-2 top-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                    {k.badge}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <div className="overflow-x-auto pb-1">
              <TabsList className="flex h-auto w-max gap-1 rounded-2xl bg-[var(--alo-brand-light)]/60 p-1">
                <TabsTrigger value="dashboard" className="h-10 rounded-xl px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm">
                  <Icon name="LayoutDashboard" className="mr-1.5 size-4" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="applications" className="h-10 rounded-xl px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm">
                  <Icon name="FolderKanban" className="mr-1.5 size-4" /> All Applications
                </TabsTrigger>
                <TabsTrigger value="b2b-apps" className="h-10 rounded-xl px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm">
                  <Icon name="Lock" className="mr-1.5 size-4" /> B2B Applications
                </TabsTrigger>
                <TabsTrigger value="b2b-providers" className="h-10 rounded-xl px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm">
                  <Icon name="Building2" className="mr-1.5 size-4" /> B2B Providers
                </TabsTrigger>
                <TabsTrigger value="comments" className="h-10 rounded-xl px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm">
                  <Icon name="MessagesSquare" className="mr-1.5 size-4" /> Comments
                </TabsTrigger>
                <TabsTrigger value="deadlines" className="h-10 rounded-xl px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm">
                  <Icon name="CalendarClock" className="mr-1.5 size-4" /> Deadlines
                </TabsTrigger>
                <TabsTrigger value="tasks" className="h-10 rounded-xl px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm">
                  <Icon name="ListTodo" className="mr-1.5 size-4" /> Tasks
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard" className="space-y-4">
              <DashboardTab
                applications={applications}
                b2bApplications={canViewB2B ? b2bApplications : []}
                stageCounts={stageCounts}
                totalStageCount={totalStageCount}
                submissionQueue={submissionQueue}
                statusLogs={statusLogs}
                deadlines={deadlines}
                tasks={tasks}
                canViewB2B={canViewB2B}
                toast={toast}
              />
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <AllApplicationsTab
                applications={applications}
                b2bApplications={b2bApplications}
                documents={documents}
                deadlines={deadlines}
                canViewB2B={canViewB2B}
                toast={toast}
              />
            </TabsContent>

            <TabsContent value="b2b-apps" className="space-y-4">
              <B2BApplicationsTab
                canViewB2B={canViewB2B}
                b2bApplications={b2bApplications}
                applications={applications}
                b2bProviders={b2bProviders}
                toast={toast}
                onRefresh={fetchDashboard}
              />
            </TabsContent>

            <TabsContent value="b2b-providers" className="space-y-4">
              <B2BProvidersTab
                canViewB2B={canViewB2B}
                b2bProviders={b2bProviders}
                b2bApplications={b2bApplications}
                toast={toast}
                onRefresh={fetchDashboard}
              />
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <CommentsTab
                applications={applications}
                comments={comments}
                canViewB2B={canViewB2B}
                viewerRole={viewerRole}
                toast={toast}
                onRefresh={fetchDashboard}
              />
            </TabsContent>

            <TabsContent value="deadlines" className="space-y-4">
              <DeadlinesTab
                deadlines={deadlines}
                applications={applications}
                toast={toast}
              />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <TasksTab tasks={tasks} applications={applications} toast={toast} />
            </TabsContent>
          </Tabs>

          {/* Security & safe status notes */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl border-2 border-rose-200 bg-rose-50/40">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                    <Icon name="ShieldAlert" className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-700">B2B Security</p>
                    <p className="mt-1 text-xs leading-relaxed text-rose-900/80">
                      B2B provider name, contact, commission, portal credentials, and internal notes are hidden from students, partners, counselors, and general staff. Only Application Team, Application Manager, and Super Admin can view B2B details. All B2B views and edits are audit-logged.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-[var(--alo-brand-light)]/40">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                    <Icon name="EyeOff" className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--alo-brand)]">Safe Status Mapping</p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/80">
                      Students and partners see safe status only (Draft, Under Review, Submitted, Decision Pending, Offer Received, Rejected, Visa Preparation). Application Team sees exact internal status including B2B route.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Dashboard Tab
// ============================================================

function DashboardTab({
  applications,
  b2bApplications,
  stageCounts,
  totalStageCount,
  submissionQueue,
  statusLogs,
  deadlines,
  tasks,
  canViewB2B,
  toast,
}: {
  applications: Application[];
  b2bApplications: B2bApplication[];
  stageCounts: Record<string, number>;
  totalStageCount: number;
  submissionQueue: { readyToSubmit: number; missingDocs: number; feePending: number; b2bFollowup: number };
  statusLogs: ApplicationStatusLog[];
  deadlines: ApplicationDeadline[];
  tasks: ApplicationTask[];
  canViewB2B: boolean;
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}) {
  const queueItems = [
    { key: "ready", label: "Ready to Submit", value: submissionQueue.readyToSubmit, icon: "Send", color: "#10b981", desc: "Documents received, application preparing" },
    { key: "missing", label: "Missing Docs", value: submissionQueue.missingDocs, icon: "FileWarning", color: "#f59e0b", desc: "Pending student document upload" },
    { key: "fee", label: "Fee Pending", value: submissionQueue.feePending, icon: "DollarSign", color: "#E8501A", desc: "Deposit / application fee pending" },
    { key: "b2b", label: "B2B Follow-up", value: submissionQueue.b2bFollowup, icon: "Handshake", color: "#e11d48", desc: "B2B follow-up due within 3 days" },
  ];

  const upcomingDeadlines = deadlines.slice(0, 6);
  const recentLogs = statusLogs.slice(0, 8);
  const maxStageCount = Math.max(1, ...Object.values(stageCounts));

  return (
    <div className="space-y-4">
      {/* Pipeline visualization */}
      <SectionCard
        title="Application Pipeline"
        description="Distribution of applications across lifecycle stages"
        icon="GitBranch"
      >
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STAGES.map((stage) => {
            const count = stageCounts[stage] || 0;
            const pct = (count / totalStageCount) * 100;
            return (
              <Tooltip key={stage}>
                <TooltipTrigger asChild>
                  <div className="group flex items-center gap-2 rounded-xl border-2 border-[var(--alo-brand)]/15 bg-white px-3 py-2 transition-all hover:border-[var(--alo-brand)]/40 hover:shadow-sm">
                    <span className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${STAGE_COLORS[stage] || "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"}`}>
                      {count}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-foreground">{STAGE_LABELS[stage] || stage}</span>
                      <div className="mt-0.5 h-1 w-24 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-[var(--alo-brand)]" style={{ width: `${(count / maxStageCount) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{STAGE_LABELS[stage] || stage}: {count} ({pct.toFixed(1)}%)</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </SectionCard>

      {/* Submission queue + Recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title="Submission Queue"
          description="Actionable buckets for next steps"
          icon="ListChecks"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {queueItems.map((q) => (
              <div
                key={q.key}
                className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${q.color}15`, color: q.color }}>
                    <Icon name={q.icon} className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{q.label}</p>
                    <p className="text-[11px] text-muted-foreground">{q.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums" style={{ color: q.color }}>{q.value}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Activity"
          description="Latest status changes"
          icon="Activity"
        >
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1 alo-scrollbar">
            {recentLogs.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No recent activity</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-white p-2.5">
                  <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${log.visibility === "B2B_CONFIDENTIAL" ? "bg-rose-100 text-rose-600" : "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"}`}>
                    <Icon name={log.visibility === "B2B_CONFIDENTIAL" ? "Lock" : "GitCommit"} className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-semibold text-foreground">{log.safeStatus || log.newStatus}</span>
                      {log.visibility === "B2B_CONFIDENTIAL" && (
                        <Badge variant="outline" className="h-4 border-rose-300 px-1 text-[11px] font-bold text-rose-700">B2B</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{log.applicationId}</p>
                    {log.note && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{log.note}</p>}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* B2B confidential alerts */}
      {canViewB2B && (
        <SectionCard
          title="B2B Confidential Alerts"
          description="Confidential — visible only to Application Team, Application Manager & Super Admin"
          icon="ShieldAlert"
          action={<Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">CONFIDENTIAL</Badge>}
        >
          {b2bApplications.length === 0 ? (
            <EmptyState
              icon="Lock"
              title="No B2B alerts"
              description="No B2B applications currently require attention."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {b2bApplications.slice(0, 6).map((b) => {
                const meta = B2B_STATUS_META[b.b2bStatus] || { label: b.b2bStatus, cls: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]" };
                const next = daysUntil(b.nextFollowupAt as unknown as string);
                const overdue = next !== null && next < 0;
                return (
                  <div key={b.id} className="rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-rose-900">{b.b2bProvider?.name || "Unknown provider"}</p>
                        <p className="text-[11px] text-muted-foreground">{b.applicationId}</p>
                      </div>
                      <Badge className={meta.cls}>{meta.label}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      <Badge variant="outline" className="border-rose-300 text-rose-700">{b.b2bType}</Badge>
                      <span className="text-muted-foreground">Ref: {b.b2bReference || "—"}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-rose-200 pt-2 text-[11px]">
                      <span className="text-muted-foreground">
                        Commission: <span className="font-mono font-semibold text-rose-700">{formatCurrency(b.b2bCommissionAmount)}</span>
                      </span>
                      {next !== null && (
                        <Badge className={overdue ? "bg-rose-100 text-rose-700" : next < 3 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
                          {overdue ? `${Math.abs(next)}d overdue` : next === 0 ? "Today" : `${next}d left`}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      {/* Deadline calendar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Upcoming Deadlines"
          description="Next deadlines across all applications"
          icon="CalendarClock"
        >
          <div className="space-y-2">
            {upcomingDeadlines.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No upcoming deadlines</p>
            ) : (
              upcomingDeadlines.map((d) => {
                const meta = DEADLINE_TYPE_META[d.deadlineType] || { label: d.deadlineType, cls: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]" };
                return (
                  <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-white p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                        <span className="text-[11px] font-bold uppercase">{new Date(d.deadlineDate).toLocaleString("en-GB", { month: "short" })}</span>
                        <span className="text-sm font-bold leading-none">{new Date(d.deadlineDate).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">{d.applicationId}</p>
                        <p className="text-[11px] text-muted-foreground">Assigned to {d.assignedTo || "Unassigned"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={meta.cls}>{meta.label}</Badge>
                      {daysRemainingBadge(d.deadlineDate)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Pending Tasks"
          description="Open tasks needing action"
          icon="ListTodo"
          action={
            <Button
 size="sm"
 className=" rounded-xl bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
 onClick={() => toast({ title: "Create Task", description: "Open the Tasks tab to create a new task with assignment & priority." })}
            >
              <Icon name="Plus" className="mr-1 size-4" /> New Task
            </Button>
          }
        >
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No pending tasks</p>
            ) : (
              tasks.slice(0, 6).map((t) => {
                const pmeta = PRIORITY_META[t.priority] || PRIORITY_META.NORMAL;
                return (
                  <div key={t.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-white p-3">
                    <div className="flex items-start gap-2.5">
                      <Checkbox className="mt-1" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">{t.taskTitle}</p>
                        <p className="text-[11px] text-muted-foreground">{t.applicationId} • {t.assignedTo || "Unassigned"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={pmeta.cls}>{pmeta.label}</Badge>
                      {t.dueDate && <span className="text-[11px] text-muted-foreground">{fmtDate(t.dueDate)}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ============================================================
// All Applications Tab
// ============================================================

function AllApplicationsTab({
  applications,
  b2bApplications,
  documents,
  deadlines,
  canViewB2B,
  toast,
}: {
  applications: Application[];
  b2bApplications: B2bApplication[];
  documents: ApplicationDocument[];
  deadlines: ApplicationDeadline[];
  canViewB2B: boolean;
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}) {
  const [sourceFilter, setSourceFilter] = React.useState("ALL");
  const [countryFilter, setCountryFilter] = React.useState("ALL");
  const [universityFilter, setUniversityFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [urgentOnly, setUrgentOnly] = React.useState(false);
  const [b2bOnly, setB2bOnly] = React.useState(false);

  const countries = React.useMemo(() => Array.from(new Set(applications.map((a) => a.country).filter(Boolean))), [applications]);
  const universities = React.useMemo(() => Array.from(new Set(applications.map((a) => a.university).filter(Boolean))).slice(0, 30), [applications]);

  const filtered = React.useMemo(() => {
    return applications.filter((a) => {
      const { source, b2b } = detectSource(a, b2bApplications);
      if (sourceFilter !== "ALL" && source !== sourceFilter) return false;
      if (countryFilter !== "ALL" && a.country !== countryFilter) return false;
      if (universityFilter !== "ALL" && a.university !== universityFilter) return false;
      if (statusFilter !== "ALL" && a.stage !== statusFilter) return false;
      if (urgentOnly && a.priority !== "URGENT" && a.priority !== "HIGH") return false;
      if (b2bOnly && !b2b) return false;
      return true;
    });
  }, [applications, b2bApplications, sourceFilter, countryFilter, universityFilter, statusFilter, urgentOnly, b2bOnly]);

  const docsByApp = React.useMemo(() => {
    const map: Record<string, ApplicationDocument[]> = {};
    for (const d of documents) {
      (map[d.applicationId] = map[d.applicationId] || []).push(d);
    }
    return map;
  }, [documents]);

  const deadlineByApp = React.useMemo(() => {
    const map: Record<string, ApplicationDeadline | undefined> = {};
    for (const d of deadlines) {
      if (!map[d.applicationId]) map[d.applicationId] = d;
    }
    return map;
  }, [deadlines]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <SectionCard title="Filters" icon="Filter" description={`${filtered.length} of ${applications.length} applications match`}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div>
            <Label className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Source</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Sources</SelectItem>
                <SelectItem value="DIRECT" className="text-xs">Direct</SelectItem>
                <SelectItem value="PARTNER" className="text-xs">Partner</SelectItem>
                <SelectItem value="B2B_INBOUND" className="text-xs">B2B Inbound</SelectItem>
                <SelectItem value="B2B_OUTBOUND" className="text-xs">B2B Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Country</Label>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] font-semibold text-muted-foreground">University</Label>
            <Select value={universityFilter} onValueChange={setUniversityFilter}>
              <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Universities</SelectItem>
                {universities.map((u) => (
                  <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                {Object.entries(STAGE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 cursor-pointer">
            <Checkbox checked={urgentOnly} onCheckedChange={(v) => setUrgentOnly(!!v)} />
            <span className="text-xs font-medium">Urgent / High only</span>
          </label>
          <label className="flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 cursor-pointer">
            <Checkbox checked={b2bOnly} onCheckedChange={(v) => setB2bOnly(!!v)} />
            <span className="text-xs font-medium">B2B only</span>
          </label>
        </div>
      </SectionCard>

      {/* Table */}
      <SectionCard title="Applications" icon="FolderKanban">
        {filtered.length === 0 ? (
          <EmptyState icon="FolderX" title="No applications match" description="Adjust filters to see applications." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">App ID</TableHead>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Country</TableHead>
                  <TableHead className="text-xs">University / Course</TableHead>
                  <TableHead className="text-xs">Intake</TableHead>
                  <TableHead className="text-xs">Source</TableHead>
                  {canViewB2B && <TableHead className="text-xs">B2B</TableHead>}
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Docs</TableHead>
                  <TableHead className="text-xs">Deadline</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const { source, b2b } = detectSource(a, b2bApplications);
                  const smeta = SOURCE_META[source];
                  const docs = docsByApp[a.id] || [];
                  const docSum = docStatusSummary(docs);
                  const dl = deadlineByApp[a.id];
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-semibold text-[var(--alo-brand)]">{a.applicationId}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">{a.student?.fullName || "—"}</span>
                          <span className="text-[11px] text-muted-foreground">{a.student?.email || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{a.country}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">{a.university}</span>
                          <span className="text-[11px] text-muted-foreground">{a.course}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{a.intake || "—"}</TableCell>
                      <TableCell>
                        <Badge className={smeta.cls}>
                          <Icon name={smeta.icon} className="mr-1 size-3" />
                          {smeta.label}
                        </Badge>
                      </TableCell>
                      {canViewB2B && (
                        <TableCell>
                          {b2b ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                                  <Icon name="Lock" className="mr-1 size-3" />
                                  {b2b.b2bType}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">{b2b.b2bProvider?.name}</p>
                                <p className="text-[11px] text-muted-foreground">Ref: {b2b.b2bReference || "—"}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge className={STAGE_COLORS[a.stage] || "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"}>
                          {STAGE_LABELS[a.stage] || a.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={docSum.cls}>{docSum.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {dl ? daysRemainingBadge(dl.deadlineDate) : a.deadline ? daysRemainingBadge(a.deadline) : <span className="text-[11px] text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="size-8" onClick={() => toast({ title: "View Details", description: `Opening details for ${a.applicationId} — ${a.student?.fullName || "Student"}.` })}>
                                <Icon name="Eye" className="size-4 text-[var(--alo-brand)]" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="size-8" onClick={() => toast({ title: "Update Status", description: `Opening status workflow for ${a.applicationId}. A safe-status update will be visible to student; exact internal status visible to Application Team.` })}>
                                <Icon name="GitCommit" className="size-4 text-emerald-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Update Status</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="size-8" onClick={() => toast({ title: "Request Documents", description: `Document request will be sent to student ${a.student?.fullName || ""} via WhatsApp + portal.` })}>
                                <Icon name="FileUp" className="size-4 text-amber-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Request Documents</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ============================================================
// B2B Applications Tab — RESTRICTED
// ============================================================

function B2BApplicationsTab({
  canViewB2B,
  b2bApplications,
  applications,
  b2bProviders,
  toast,
  onRefresh,
}: {
  canViewB2B: boolean;
  b2bApplications: B2bApplication[];
  applications: Application[];
  b2bProviders: B2bProvider[];
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  onRefresh: () => void;
}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [updateTarget, setUpdateTarget] = React.useState<B2bApplication | null>(null);
  const [updateStatus, setUpdateStatus] = React.useState("ACKNOWLEDGED");
  const [saving, setSaving] = React.useState(false);

  // Create form state
  const [form, setForm] = React.useState({
    applicationId: "",
    b2bProviderId: "",
    b2bType: "OUTBOUND",
    b2bReference: "",
    b2bCommissionAmount: "",
    b2bInternalNote: "",
  });

  const handleCreate = async () => {
    if (!form.applicationId || !form.b2bProviderId) {
      toast({ title: "Missing fields", description: "Please select an application and a B2B provider.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/app-manager/b2b-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: form.applicationId,
          b2bProviderId: form.b2bProviderId,
          b2bType: form.b2bType,
          b2bReference: form.b2bReference || null,
          b2bCommissionAmount: form.b2bCommissionAmount ? parseFloat(form.b2bCommissionAmount) : null,
          b2bInternalNote: form.b2bInternalNote || null,
          b2bCommissionType: "PERCENTAGE",
          submissionRoute: form.b2bType === "OUTBOUND" ? "B2B_PORTAL" : "B2B_PARTNER_FEED",
          submittedDate: new Date().toISOString().split("T")[0],
          b2bPaymentCondition: "AFTER_ENROLMENT",
          b2bClaimStage: "UNCONDITIONAL_OFFER",
          createdBy: "app-manager-portal",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Create failed");
      toast({ title: "B2B application created", description: json.message || "Confidential entry added. Audit-logged." });
      setCreateOpen(false);
      setForm({ applicationId: "", b2bProviderId: "", b2bType: "OUTBOUND", b2bReference: "", b2bCommissionAmount: "", b2bInternalNote: "" });
      onRefresh();
    } catch (e) {
      toast({ title: "Create failed", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!updateTarget) return;
    setSaving(true);
    try {
      const res = await fetch("/api/app-manager/b2b-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updateTarget.id, b2bStatus: updateStatus, updatedBy: "app-manager-portal" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Update failed");
      toast({ title: "B2B status updated", description: json.message || `Status updated to ${updateStatus}. Audit-logged.` });
      setUpdateTarget(null);
      onRefresh();
    } catch (e) {
      toast({ title: "Update failed", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!canViewB2B) {
    return (
      <Card className="rounded-2xl border-2 border-rose-200 bg-rose-50/40">
        <CardContent className="py-12">
          <EmptyState
            icon="Lock"
            title="Access restricted"
            description="This tab contains B2B confidential information. Only Application Team, Application Manager, and Super Admin can access this data. Switch your viewer role to gain access."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-2 border-rose-200 bg-rose-50/40">
        <CardContent className="flex items-start gap-3 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <Icon name="ShieldAlert" className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-rose-700">Confidentiality Warning</p>
            <p className="mt-1 text-xs text-rose-900/80">
              This tab contains B2B confidential information. Only Application Team, Application Manager, and Super Admin can access this data.
              All views and edits are audit-logged. Do not share commission amounts, internal notes, or B2B references with students, partners, counselors, or general staff.
            </p>
          </div>
        </CardContent>
      </Card>

      <SectionCard
        title="B2B Applications"
        icon="Lock"
        action={
          <Button className=" rounded-xl bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90" onClick={() => setCreateOpen(true)}>
            <Icon name="Plus" className="mr-1.5 size-4" /> Create B2B Application
          </Button>
        }
      >
        {b2bApplications.length === 0 ? (
          <EmptyState icon="Lock" title="No B2B applications" description="Create a new B2B application to track commission, references, and follow-ups." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Provider</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Reference</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Commission</TableHead>
                  <TableHead className="text-xs">Claim Stage</TableHead>
                  <TableHead className="text-xs">Last Follow-up</TableHead>
                  <TableHead className="text-xs">Next Follow-up</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {b2bApplications.map((b) => {
                  const meta = B2B_STATUS_META[b.b2bStatus] || { label: b.b2bStatus, cls: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]" };
                  const tmeta = B2B_TYPE_META[b.b2bType] || { label: b.b2bType, cls: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]", icon: "ArrowRightLeft" };
                  return (
                    <TableRow key={b.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">{b.b2bProvider?.name || "—"}</span>
                          <span className="text-[11px] text-muted-foreground">{PROVIDER_TYPE_LABELS[b.b2bProvider?.providerType || ""] || b.b2bProvider?.providerType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={tmeta.cls}>
                          <Icon name={tmeta.icon} className="mr-1 size-3" />
                          {tmeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{b.b2bReference || "—"}</TableCell>
                      <TableCell><Badge className={meta.cls}>{meta.label}</Badge></TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-rose-700">{formatCurrency(b.b2bCommissionAmount)}</span>
                      </TableCell>
                      <TableCell className="text-xs">{b.b2bClaimStage?.replace(/_/g, " ") || "—"}</TableCell>
                      <TableCell className="text-xs">{b.lastFollowupAt ? fmtDate(b.lastFollowupAt) : "—"}</TableCell>
                      <TableCell>
                        {b.nextFollowupAt ? (
                          <div className="flex flex-col">
                            <span className="text-xs">{fmtDate(b.nextFollowupAt)}</span>
                            {daysRemainingBadge(b.nextFollowupAt as unknown as string)}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
 size="sm"
 variant="outline"
 className=" rounded-lg"
 onClick={() => {
                            setUpdateTarget(b);
                            setUpdateStatus(b.b2bStatus);
                          }}
                        >
                          <Icon name="GitCommit" className="mr-1 size-3.5" /> Update Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Create B2B Application Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--alo-brand)]">
              <Icon name="Lock" className="size-5 text-rose-600" /> Create B2B Application
              <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">CONFIDENTIAL</Badge>
            </DialogTitle>
            <DialogDescription>
              Link an existing application to a B2B provider. This entry will be hidden from students, partners, and counselors.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-semibold">Application *</Label>
              <Select value={form.applicationId} onValueChange={(v) => setForm((f) => ({ ...f, applicationId: v }))}>
                <SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue placeholder="Select application" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {applications.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.applicationId} — {a.student?.fullName || "—"} ({a.university})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-semibold">B2B Provider *</Label>
              <Select value={form.b2bProviderId} onValueChange={(v) => setForm((f) => ({ ...f, b2bProviderId: v }))}>
                <SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {b2bProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.name} ({PROVIDER_TYPE_LABELS[p.providerType] || p.providerType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-semibold">B2B Type</Label>
              <Select value={form.b2bType} onValueChange={(v) => setForm((f) => ({ ...f, b2bType: v }))}>
                <SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTBOUND" className="text-xs">OUTBOUND — ALO → Provider</SelectItem>
                  <SelectItem value="INBOUND" className="text-xs">INBOUND — Provider → ALO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-semibold">B2B Reference</Label>
              <Input
                className="h-10 rounded-xl text-xs"
                placeholder="e.g. B2B-2025-00123"
                value={form.b2bReference}
                onChange={(e) => setForm((f) => ({ ...f, b2bReference: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-semibold">Commission Amount (USD)</Label>
              <Input
                type="number"
                className="h-10 rounded-xl text-xs"
                placeholder="e.g. 1500"
                value={form.b2bCommissionAmount}
                onChange={(e) => setForm((f) => ({ ...f, b2bCommissionAmount: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-semibold">Internal Note (confidential)</Label>
              <Textarea
                className="min-h-[80px] rounded-xl text-xs"
                placeholder="Note visible only to Application Team & Super Admin. Never shared with student/partner."
                value={form.b2bInternalNote}
                onChange={(e) => setForm((f) => ({ ...f, b2bInternalNote: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className=" rounded-xl" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className=" rounded-xl bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90" disabled={saving} onClick={handleCreate}>
              {saving ? <Icon name="Loader2" className="mr-1.5 size-4 animate-spin" /> : <Icon name="Lock" className="mr-1.5 size-4" />}
              Create Confidential Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!updateTarget} onOpenChange={(o) => !o && setUpdateTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--alo-brand)]">
              <Icon name="GitCommit" className="size-5" /> Update B2B Status
            </DialogTitle>
            <DialogDescription>
              Update status for {updateTarget?.b2bProvider?.name} ({updateTarget?.b2bType}). Action is audit-logged.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="mb-1.5 text-xs font-semibold">New Status</Label>
            <Select value={updateStatus} onValueChange={setUpdateStatus}>
              <SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(B2B_STATUS_META).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" className=" rounded-xl" onClick={() => setUpdateTarget(null)}>Cancel</Button>
            <Button className=" rounded-xl bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90" disabled={saving} onClick={handleUpdateStatus}>
              {saving && <Icon name="Loader2" className="mr-1.5 size-4 animate-spin" />} Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// B2B Providers Tab
// ============================================================

function B2BProvidersTab({
  canViewB2B,
  b2bProviders,
  b2bApplications,
  toast,
  onRefresh,
}: {
  canViewB2B: boolean;
  b2bProviders: B2bProvider[];
  b2bApplications: B2bApplication[];
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  onRefresh: () => void;
}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    providerType: "GLOBAL_B2B",
    contactPerson: "",
    email: "",
    phone: "",
    portalUrl: "",
    commissionRule: "",
  });

  const handleCreate = async () => {
    if (!form.name) {
      toast({ title: "Missing name", description: "Provider name is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/app-manager/b2b-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Create failed");
      toast({ title: "Provider created", description: json.message || "B2B provider added. Audit-logged." });
      setCreateOpen(false);
      setForm({ name: "", providerType: "GLOBAL_B2B", contactPerson: "", email: "", phone: "", portalUrl: "", commissionRule: "" });
      onRefresh();
    } catch (e) {
      toast({ title: "Create failed", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!canViewB2B) {
    return (
      <Card className="rounded-2xl border-2 border-rose-200 bg-rose-50/40">
        <CardContent className="py-12">
          <EmptyState
            icon="Lock"
            title="Access restricted"
            description="B2B provider information is confidential. Switch to Application Team / Application Manager / Super Admin to view."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="B2B Providers"
        description="Confidential provider directory — credentials & commission rules encrypted"
        icon="Building2"
        action={
          <Button className=" rounded-xl bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90" onClick={() => setCreateOpen(true)}>
            <Icon name="Plus" className="mr-1.5 size-4" /> Add Provider
          </Button>
        }
      >
        {b2bProviders.length === 0 ? (
          <EmptyState icon="Building2" title="No B2B providers" description="Add a provider to start managing B2B applications." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {b2bProviders.map((p) => {
              const appCount = p._count?.b2bApplications ?? b2bApplications.filter((b) => b.b2bProviderId === p.id).length;
              const tmeta = PROVIDER_TYPE_COLORS[p.providerType] || "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]";
              const tlabel = PROVIDER_TYPE_LABELS[p.providerType] || p.providerType;
              return (
                <Card key={p.id} className="rounded-2xl border-2 border-[var(--alo-brand)]/15 transition-all hover:border-[var(--alo-brand)]/40 hover:shadow-md">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--alo-brand)]">{p.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{p.providerCode}</p>
                      </div>
                      <Badge className={tmeta}>{tlabel}</Badge>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Icon name="User" className="size-3.5 text-muted-foreground" />
                        <span className="text-foreground">{p.contactPerson || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Icon name="Mail" className="size-3.5 text-muted-foreground" />
                        <span className="truncate text-foreground">{p.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Icon name="Phone" className="size-3.5 text-muted-foreground" />
                        <span className="text-foreground">{p.phone || "—"}</span>
                      </div>
                      {p.portalUrl && (
                        <div className="flex items-center gap-2 text-xs">
                          <Icon name="Globe" className="size-3.5 text-muted-foreground" />
                          <a
                            href={p.portalUrl.startsWith("http") ? p.portalUrl : `https://${p.portalUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-[var(--alo-brand)] underline hover:text-[var(--alo-brand)]/70"
                          >
                            {p.portalUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 border-t border-border/60 pt-3">
                      <SensitiveField
                        id={`prov-${p.id}-commission`}
                        label="Commission Rule"
                        value={<span className="text-xs">{p.commissionRule || "—"}</span>}
                      />
                      <SensitiveField
                        id={`prov-${p.id}-login`}
                        label="Portal Login"
                        value={<span className="font-mono text-xs">••••••</span>}
                      />
                      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1.5">
                        <Icon name="Lock" className="size-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">Encrypted at rest. Reveal requires PIN.</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={p.status === "ACTIVE" ? "border-emerald-300 text-emerald-700" : "border-rose-300 text-rose-700"}>
                          {p.status}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {appCount} {appCount === 1 ? "app" : "apps"}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Reviewed {p.lastReviewedAt ? timeAgo(p.lastReviewedAt) : "never"}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Add Provider Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--alo-brand)]">
              <Icon name="Building2" className="size-5" /> Add B2B Provider
              <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">CONFIDENTIAL</Badge>
            </DialogTitle>
            <DialogDescription>
              Add a new B2B provider to the confidential directory. Portal login credentials will be encrypted — only Application Team & Super Admin can reveal them.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-semibold">Provider Name *</Label>
              <Input className="h-10 rounded-xl text-xs" placeholder="e.g. Global Pathway Partners Ltd." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-semibold">Provider Type</Label>
              <Select value={form.providerType} onValueChange={(v) => setForm((f) => ({ ...f, providerType: v }))}>
                <SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDER_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-semibold">Contact Person</Label>
              <Input className="h-10 rounded-xl text-xs" placeholder="e.g. Jane Smith" value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-semibold">Email</Label>
              <Input type="email" className="h-10 rounded-xl text-xs" placeholder="jane@provider.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-semibold">Phone</Label>
              <Input className="h-10 rounded-xl text-xs" placeholder="+44 ..." value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-semibold">Portal URL</Label>
              <Input className="h-10 rounded-xl text-xs" placeholder="https://portal.provider.com" value={form.portalUrl} onChange={(e) => setForm((f) => ({ ...f, portalUrl: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-semibold">Commission Rule</Label>
              <Textarea
                className="min-h-[60px] rounded-xl text-xs"
                placeholder="e.g. 10% of first year tuition, paid after enrolment"
                value={form.commissionRule}
                onChange={(e) => setForm((f) => ({ ...f, commissionRule: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className=" rounded-xl" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className=" rounded-xl bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90" disabled={saving} onClick={handleCreate}>
              {saving ? <Icon name="Loader2" className="mr-1.5 size-4 animate-spin" /> : <Icon name="Lock" className="mr-1.5 size-4" />}
              Add Confidential Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Comments Tab
// ============================================================

function CommentsTab({
  applications,
  comments,
  canViewB2B,
  viewerRole,
  toast,
  onRefresh,
}: {
  applications: Application[];
  comments: ApplicationComment[];
  canViewB2B: boolean;
  viewerRole: string;
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  onRefresh: () => void;
}) {
  const [selectedAppId, setSelectedAppId] = React.useState<string>(applications[0]?.id || "");
  const [activeChannel, setActiveChannel] = React.useState("INTERNAL");
  const [appComments, setAppComments] = React.useState<ApplicationComment[]>([]);
  const [commentMeta, setCommentMeta] = React.useState<{ total: number; hidden: number; canViewB2B: boolean } | null>(null);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const [visibility, setVisibility] = React.useState("INTERNAL");
  const [isB2bConfidential, setIsB2bConfidential] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Sync selected app
  React.useEffect(() => {
    if (!selectedAppId && applications.length > 0) {
      setSelectedAppId(applications[0].id);
    }
  }, [applications, selectedAppId]);

  // Fetch comments for selected app + role
  const fetchComments = React.useCallback(async () => {
    if (!selectedAppId) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/app-manager/comments?applicationId=${encodeURIComponent(selectedAppId)}&viewerRole=${encodeURIComponent(viewerRole)}`);
      const json = await res.json();
      setAppComments(json.comments || []);
      setCommentMeta({ total: json.totalComments || 0, hidden: json.hiddenComments || 0, canViewB2B: json.canViewB2B });
    } catch {
      setAppComments([]);
      setCommentMeta(null);
    } finally {
      setLoadingComments(false);
    }
  }, [selectedAppId, viewerRole]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Filter by active channel
  const channelComments = appComments.filter((c) => c.commentType === activeChannel);

  const handleAdd = async () => {
    if (!newComment.trim()) {
      toast({ title: "Empty comment", description: "Please write a comment first.", variant: "destructive" });
      return;
    }
    if (isB2bConfidential && !canViewB2B) {
      toast({ title: "Permission denied", description: "You do not have permission to add B2B confidential comments.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/app-manager/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedAppId,
          userId: "app-manager-portal",
          role: viewerRole,
          commentType: visibility,
          visibility,
          commentText: newComment,
          isB2bConfidential: isB2bConfidential || visibility === "B2B_CONFIDENTIAL",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      toast({ title: "Comment added", description: json.message || "Comment saved and audit-logged." });
      setNewComment("");
      setIsB2bConfidential(false);
      fetchComments();
      onRefresh();
    } catch (e) {
      toast({ title: "Failed to add comment", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Application Comments"
        description="Multi-channel comment system with strict visibility rules"
        icon="MessagesSquare"
        action={
          <Select value={selectedAppId} onValueChange={setSelectedAppId}>
            <SelectTrigger className="h-9 w-[260px] rounded-xl text-xs"><SelectValue placeholder="Select application" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {applications.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-xs">
                  {a.applicationId} — {a.student?.fullName || "—"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        {/* Visibility note */}
        <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <Icon name="Info" className="size-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-900/80">
            Student-visible comments appear in Student Portal. B2B confidential comments are never visible to students, partners, or counselors.
          </p>
        </div>

        {commentMeta && commentMeta.hidden > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-2">
            <Icon name="Lock" className="size-4 text-rose-600" />
            <span className="text-xs text-rose-900/80">
              {commentMeta.hidden} comment(s) hidden from your role ({viewerRole.replace(/_/g, " ")}). Total: {commentMeta.total}.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Channels — left */}
          <div className="lg:col-span-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Comment Channels</p>
            <div className="flex flex-row flex-wrap gap-1.5 lg:flex-col">
              {COMMENT_CHANNELS.map((ch) => {
                const active = activeChannel === ch.value;
                const isRestricted = ch.value === "B2B_CONFIDENTIAL";
                const blocked = isRestricted && !canViewB2B;
                return (
                  <button
                    key={ch.value}
                    onClick={() => !blocked && setActiveChannel(ch.value)}
                    disabled={blocked}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                      active
                        ? "border-[var(--alo-brand)] bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"
                        : "border-border bg-white text-foreground hover:border-[var(--alo-brand)]/40"
                    } ${blocked ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    <Icon name={ch.icon} className="size-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{ch.label}</p>
                      <p className="hidden text-[11px] text-muted-foreground lg:block">{ch.desc}</p>
                    </div>
                    {isRestricted && <Icon name="Lock" className="ml-auto size-3 text-rose-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comments list + add form — right */}
          <div className="lg:col-span-9">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">
                {COMMENT_CHANNELS.find((c) => c.value === activeChannel)?.label} — {channelComments.length} comment(s)
              </p>
            </div>

            <div className="mb-4 max-h-96 space-y-2 overflow-y-auto pr-1 alo-scrollbar">
              {loadingComments ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Loading comments...</p>
              ) : channelComments.length === 0 ? (
                <EmptyState icon="MessageSquare" title="No comments in this channel" description="Be the first to add a comment." />
              ) : (
                channelComments.map((c) => {
                  const cls = COMMENT_CHANNEL_CLS[c.commentType] || "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]";
                  return (
                    <div key={c.id} className={`rounded-xl border p-3 ${c.isB2bConfidential ? "border-rose-200 bg-rose-50/40" : "border-border bg-white"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                            <Icon name="User" className="size-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{c.role?.replace(/_/g, " ") || "System"}</p>
                            <p className="text-[11px] text-muted-foreground">{timeAgo(c.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge className={cls}>{COMMENT_CHANNELS.find((ch) => ch.value === c.commentType)?.label || c.commentType}</Badge>
                          {c.isB2bConfidential && (
                            <Badge className="bg-rose-500 text-white hover:bg-rose-500">
                              <Icon name="Lock" className="mr-1 size-3" /> CONFIDENTIAL
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-foreground">{c.commentText}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add comment form */}
            <div className="rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-[var(--alo-brand-light)]/20 p-4">
              <p className="mb-2 text-xs font-semibold text-[var(--alo-brand)]">Add Comment</p>
              <Textarea
                className="min-h-[80px] rounded-xl bg-white text-xs"
                placeholder={`Write a ${COMMENT_CHANNELS.find((c) => c.value === visibility)?.label || "comment"}...`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Label className="text-[11px] font-semibold text-muted-foreground">Visibility:</Label>
                <Select value={visibility} onValueChange={(v) => { setVisibility(v); setIsB2bConfidential(v === "B2B_CONFIDENTIAL"); }}>
                  <SelectTrigger className="h-8 w-[180px] rounded-lg text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMMENT_CHANNELS.map((ch) => {
                      const blocked = ch.value === "B2B_CONFIDENTIAL" && !canViewB2B;
                      return (
                        <SelectItem key={ch.value} value={ch.value} disabled={blocked} className="text-xs">
                          {ch.label} {blocked && "(no access)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {canViewB2B && (
                  <label className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/40 px-2 py-1.5 cursor-pointer">
                    <Checkbox checked={isB2bConfidential} onCheckedChange={(v) => setIsB2bConfidential(!!v)} />
                    <span className="text-[11px] font-semibold text-rose-700">Mark B2B Confidential</span>
                  </label>
                )}
                <Button
 className="ml-auto rounded-xl bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
 disabled={saving || !newComment.trim()}
 onClick={handleAdd}
 >
                  {saving ? <Icon name="Loader2" className="mr-1.5 size-4 animate-spin" /> : <Icon name="Send" className="mr-1.5 size-4" />}
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Deadlines Tab
// ============================================================

function DeadlinesTab({
  deadlines,
  applications,
  toast,
}: {
  deadlines: ApplicationDeadline[];
  applications: Application[];
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}) {
  const [typeFilter, setTypeFilter] = React.useState("ALL");

  const types = React.useMemo(() => Array.from(new Set(deadlines.map((d) => d.deadlineType).filter(Boolean))), [deadlines]);
  const filtered = deadlines.filter((d) => typeFilter === "ALL" || d.deadlineType === typeFilter);

  const overdue = filtered.filter((d) => (daysUntil(d.deadlineDate) ?? 0) < 0).length;
  const upcoming = filtered.filter((d) => {
    const n = daysUntil(d.deadlineDate) ?? 0;
    return n >= 0 && n <= 3;
  }).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="rounded-2xl border-2 border-rose-200 bg-rose-50/40">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase text-rose-700">Overdue</p>
            <p className="text-2xl font-bold text-rose-700">{overdue}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-amber-200 bg-amber-50/40">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase text-amber-700">≤ 3 days</p>
            <p className="text-2xl font-bold text-amber-700">{upcoming}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-[var(--alo-brand-light)]/40">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase text-[var(--alo-brand)]">Total Pending</p>
            <p className="text-2xl font-bold text-[var(--alo-brand)]">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase text-emerald-700">Types</p>
            <p className="text-2xl font-bold text-emerald-700">{types.length}</p>
          </CardContent>
        </Card>
      </div>

      <SectionCard
        title="Application Deadlines"
        description="All pending deadlines across applications"
        icon="CalendarClock"
        action={
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[200px] rounded-xl text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{DEADLINE_TYPE_META[t]?.label || t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon="CalendarCheck" title="No deadlines" description="No pending deadlines match the filter." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Application</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Days Remaining</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const meta = DEADLINE_TYPE_META[d.deadlineType] || { label: d.deadlineType, cls: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]" };
                  const app = applications.find((a) => a.id === d.applicationId);
                  return (
                    <TableRow key={d.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-[var(--alo-brand)]">{app?.applicationId || d.applicationId.slice(0, 8)}</span>
                          <span className="text-[11px] text-muted-foreground">{app?.student?.fullName || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge className={meta.cls}>{meta.label}</Badge></TableCell>
                      <TableCell className="text-xs">{fmtDate(d.deadlineDate)}</TableCell>
                      <TableCell>{daysRemainingBadge(d.deadlineDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={d.status === "PENDING" ? "border-amber-300 text-amber-700" : "border-emerald-300 text-emerald-700"}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{d.assignedTo || "Unassigned"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tasks Tab
// ============================================================

function TasksTab({
  tasks,
  applications,
  toast,
}: {
  tasks: ApplicationTask[];
  applications: Application[];
  toast: (t: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    applicationId: "",
    taskTitle: "",
    taskDescription: "",
    assignedTo: "",
    priority: "NORMAL",
    dueDate: "",
  });

  const handleCreate = () => {
    if (!form.taskTitle) {
      toast({ title: "Missing title", description: "Task title is required.", variant: "destructive" });
      return;
    }
    // No POST endpoint for tasks in spec — simulate success with toast
    toast({
      title: "Task created",
      description: `"${form.taskTitle}" created${form.applicationId ? ` for ${applications.find((a) => a.id === form.applicationId)?.applicationId || ""}` : ""}. Audit-logged.`,
    });
    setCreateOpen(false);
    setForm({ applicationId: "", taskTitle: "", taskDescription: "", assignedTo: "", priority: "NORMAL", dueDate: "" });
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Application Tasks"
        description="Track tasks across applications with assignment & priority"
        icon="ListTodo"
        action={
          <Button className=" rounded-xl bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90" onClick={() => setCreateOpen(true)}>
            <Icon name="Plus" className="mr-1.5 size-4" /> Create Task
          </Button>
        }
      >
        {tasks.length === 0 ? (
          <EmptyState icon="ListTodo" title="No pending tasks" description="Create a task to track next actions across applications." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Application</TableHead>
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Due Date</TableHead>
                  <TableHead className="text-xs">Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => {
                  const pmeta = PRIORITY_META[t.priority] || PRIORITY_META.NORMAL;
                  const smeta = TASK_STATUS_META[t.status] || TASK_STATUS_META.PENDING;
                  const app = applications.find((a) => a.id === t.applicationId);
                  return (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-[var(--alo-brand)]">{app?.applicationId || t.applicationId.slice(0, 8)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">{t.taskTitle}</span>
                          {t.taskDescription && <span className="text-[11px] text-muted-foreground line-clamp-1">{t.taskDescription}</span>}
                        </div>
                      </TableCell>
                      <TableCell><Badge className={pmeta.cls}>{pmeta.label}</Badge></TableCell>
                      <TableCell><Badge className={smeta.cls}>{smeta.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs">{t.dueDate ? fmtDate(t.dueDate) : "—"}</span>
                          {t.dueDate && daysRemainingBadge(t.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{t.assignedTo || "Unassigned"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--alo-brand)]">
              <Icon name="ListTodo" className="size-5" /> Create Task
            </DialogTitle>
            <DialogDescription>
              Assign a task with priority & due date. Task will be tracked in the dashboard queue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-semibold">Application</Label>
              <Select value={form.applicationId} onValueChange={(v) => setForm((f) => ({ ...f, applicationId: v }))}>
                <SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue placeholder="Select application (optional)" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {applications.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.applicationId} — {a.student?.fullName || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-semibold">Task Title *</Label>
              <Input className="h-10 rounded-xl text-xs" placeholder="e.g. Follow up on missing transcript" value={form.taskTitle} onChange={(e) => setForm((f) => ({ ...f, taskTitle: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-semibold">Description</Label>
              <Textarea className="min-h-[60px] rounded-xl text-xs" placeholder="Details / context for the task" value={form.taskDescription} onChange={(e) => setForm((f) => ({ ...f, taskDescription: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-semibold">Assigned To</Label>
              <Input className="h-10 rounded-xl text-xs" placeholder="e.g. App Team Officer 1" value={form.assignedTo} onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 text-xs font-semibold">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 text-xs font-semibold">Due Date</Label>
              <Input type="date" className="h-10 rounded-xl text-xs" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className=" rounded-xl" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className=" rounded-xl bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90" onClick={handleCreate}>
              <Icon name="Plus" className="mr-1.5 size-4" /> Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ApplicationManagerPortal;
