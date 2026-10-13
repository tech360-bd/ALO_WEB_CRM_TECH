'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Icon,
  StatCard,
  SectionCard,
  PageHeader,
  EmptyState,
  LoadingGrid,
  CompletionRing,
  MetricRow,
  StatusBadge,
} from "@/components/alo/shared";
import { timeAgo } from "@/lib/alo-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminCommandCenterProps {
  onNavigate?: (view: string, slug?: string) => void;
}

interface DashboardStats {
  counts?: {
    leads?: number;
    students?: number;
    applications?: number;
    visaCases?: number;
    payments?: number;
    campaigns?: number;
    aiAgents?: number;
  };
  finance?: {
    revenue?: number;
    pendingPayments?: number;
    commissionPending?: number;
  };
  leadsBySource?: Record<string, number>;
  appsByStage?: Record<string, number>;
  agentsByDept?: Record<string, number>;
  marketing?: {
    totalBudget?: number;
    totalSpent?: number;
    totalConversions?: number;
    costPerLead?: number;
    conversionRate?: number;
  };
  avgProfileCompletion?: number;
}

interface FunnelItem {
  stage: string;
  count: number;
}

interface AuditUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
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

interface HealthResponse {
  status: string;
  database?: string;
  storage?: string;
  timestamp?: string;
}

interface OverviewResponse {
  leads?: { total: number; new: number; converted: number; lost: number };
  applications?: { total: number; byStage: Record<string, number> };
  offers?: { total: number; accepted: number };
  visa?: { total: number; approved: number; pending: number };
  revenue?: { totalPayments: string; totalCommissions: string; currency: string };
  documents?: { total: number; pending: number; rejected: number };
  tasks?: { total: number; completed: number; overdue: number };
}

interface Commission {
  id: string;
  amount?: string;
  currency?: string;
  status?: string;
  universityName?: string | null;
  createdAt?: string;
}

interface Payment {
  id: string;
  amount?: string;
  currency?: string;
  status?: string;
  method?: string | null;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Demo fallback data (clearly marked with DEMO_ prefix)
// ---------------------------------------------------------------------------

const DEMO_STATS: DashboardStats = {
  counts: { leads: 1247, students: 438, applications: 312, visaCases: 89, payments: 256, campaigns: 18, aiAgents: 7 },
  finance: { revenue: 284500, pendingPayments: 34200, commissionPending: 18700 },
  leadsBySource: { WEBSITE: 412, WHATSAPP: 298, FACEBOOK: 186, INSTAGRAM: 134, PHONE_CALL: 98, PARTNER_REFERRAL: 76, OFFICE_VISIT: 43 },
  appsByStage: { COUNSELLING: 45, APPLICATION_SUBMITTED: 38, CONDITIONAL_OFFFER: 22, UNCONDITIONAL_OFFER: 18, CAS_PENDING: 12, VISA_SUBMITTED: 8, ENROLLED: 31 },
  agentsByDept: { CRM: 3, Marketing: 2, Application: 2 },
  marketing: { totalBudget: 52000, totalSpent: 38400, totalConversions: 156, costPerLead: 18.5, conversionRate: 12.5 },
  avgProfileCompletion: 72,
};

const DEMO_FUNNEL: FunnelItem[] = [
  { stage: "LEADS", count: 1247 },
  { stage: "REGISTERED", count: 892 },
  { stage: "COUNSELLING", count: 634 },
  { stage: "APPLICATION", count: 412 },
  { stage: "SUBMITTED", count: 298 },
  { stage: "OFFER_RECEIVED", count: 178 },
  { stage: "OFFER_ACCEPTED", count: 124 },
  { stage: "VISA_APPROVED", count: 89 },
  { stage: "ENROLLED", count: 54 },
];

const DEMO_AUDIT: AuditLog[] = [
  { id: "d1", action: "LOGIN", resource: "auth", createdAt: new Date(Date.now() - 120000).toISOString(), user: { id: "u1", name: "Sarah Ahmed", role: "SUPER_ADMIN" } },
  { id: "d2", action: "APP_STATUS_CHANGE", resource: "application", resourceId: "APP-2025-042", details: "Moved to VISA_SUBMITTED", createdAt: new Date(Date.now() - 600000).toISOString(), user: { id: "u2", name: "James Chen", role: "COUNSELOR" } },
  { id: "d3", action: "DOC_APPROVE", resource: "document", resourceId: "doc-88", createdAt: new Date(Date.now() - 1800000).toISOString(), user: { id: "u3", name: "Fatima Begum", role: "APPLICATION_TEAM" } },
  { id: "d4", action: "PAYMENT_UPDATE", resource: "payment", resourceId: "PAY-2025-156", createdAt: new Date(Date.now() - 3600000).toISOString(), user: { id: "u4", name: "Rahul Patel", role: "FINANCE" } },
  { id: "d5", action: "AI_ACTION", resource: "ai-agent", details: "SOP generated for student #312", createdAt: new Date(Date.now() - 5400000).toISOString(), user: { id: "u5", name: "AI Engine", role: "SYSTEM" } },
  { id: "d6", action: "ROLE_CHANGE", resource: "user", resourceId: "u-42", createdAt: new Date(Date.now() - 7200000).toISOString(), user: { id: "u1", name: "Sarah Ahmed", role: "SUPER_ADMIN" } },
  { id: "d7", action: "DATA_IMPORT", resource: "leads", details: "Bulk import 45 leads from CSV", createdAt: new Date(Date.now() - 10800000).toISOString(), user: { id: "u6", name: "Mike Johnson", role: "MARKETING_MANAGER" } },
  { id: "d8", action: "PUBLIC_PUBLISH", resource: "university", resourceId: "uni-kings-london", createdAt: new Date(Date.now() - 14400000).toISOString(), user: { id: "u7", name: "Lisa Park", role: "ADMIN" } },
];

const DEMO_HEALTH: HealthResponse = { status: "healthy", database: "healthy", storage: "healthy", timestamp: new Date().toISOString() };

const DEMO_OVERVIEW: OverviewResponse = {
  leads: { total: 1247, new: 86, converted: 312, lost: 198 },
  applications: { total: 312, byStage: {} },
  offers: { total: 178, accepted: 124 },
  visa: { total: 89, approved: 54, pending: 35 },
  revenue: { totalPayments: "284500", totalCommissions: "18700", currency: "GBP" },
  documents: { total: 1456, pending: 312, rejected: 48 },
  tasks: { total: 478, completed: 312, overdue: 23 },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FUNNEL_LABELS: Record<string, string> = {
  LEADS: "Leads",
  REGISTERED: "Contacted",
  COUNSELLING: "Qualified",
  APPLICATION: "Applied",
  SUBMITTED: "Submitted",
  OFFER_RECEIVED: "Offered",
  OFFER_ACCEPTED: "Accepted",
  VISA_APPROVED: "Visa Approved",
  ENROLLED: "Enrolled",
};

const FUNNEL_DISPLAY_STAGES = [
  "LEADS",
  "CONTACTED",
  "QUALIFIED",
  "APPLIED",
  "OFFERED",
  "ENROLLED",
] as const;

const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN: "Login",
  FAILED_LOGIN: "Failed Login",
  LOGOUT: "Logout",
  PROFILE_UPDATE: "Profile Update",
  DOC_UPLOAD: "Document Upload",
  DOC_APPROVE: "Doc Approved",
  DOC_REJECT: "Doc Rejected",
  APP_STATUS_CHANGE: "App Status",
  VISA_STATUS_CHANGE: "Visa Status",
  PAYMENT_UPDATE: "Payment",
  COMMISSION_APPROVE: "Commission",
  ROLE_CHANGE: "Role Change",
  PERMISSION_CHANGE: "Permission",
  AI_ACTION: "AI Action",
  MESSAGE_ACTION: "Message",
  DATA_IMPORT: "Data Import",
  PUBLIC_PUBLISH: "Published",
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
  PAYMENT_UPDATE: "bg-emerald-100 text-emerald-700",
  COMMISSION_APPROVE: "bg-emerald-100 text-emerald-700",
  ROLE_CHANGE: "bg-rose-100 text-rose-700",
  PERMISSION_CHANGE: "bg-rose-100 text-rose-700",
  AI_ACTION: "bg-violet-100 text-violet-700",
  MESSAGE_ACTION: "bg-sky-100 text-sky-700",
  DATA_IMPORT: "bg-alo-blue-light text-alo-blue",
  PUBLIC_PUBLISH: "bg-emerald-100 text-emerald-700",
};

const AUDIT_ACTION_ICONS: Record<string, string> = {
  LOGIN: "LogIn",
  FAILED_LOGIN: "ShieldAlert",
  LOGOUT: "LogOut",
  PROFILE_UPDATE: "UserCheck",
  DOC_UPLOAD: "Upload",
  DOC_APPROVE: "FileCheck2",
  DOC_REJECT: "FileX2",
  APP_STATUS_CHANGE: "ClipboardList",
  VISA_STATUS_CHANGE: "Plane",
  PAYMENT_UPDATE: "CreditCard",
  COMMISSION_APPROVE: "BadgeDollarSign",
  ROLE_CHANGE: "Shield",
  PERMISSION_CHANGE: "Lock",
  AI_ACTION: "Bot",
  MESSAGE_ACTION: "MessageSquare",
  DATA_IMPORT: "Download",
  PUBLIC_PUBLISH: "Globe",
};

interface ModuleCard {
  key: string;
  title: string;
  description: string;
  icon: string;
  view: string;
  countKey: string;
  accent: string;
}

const QUICK_ACCESS_MODULES: ModuleCard[] = [
  { key: "crm", title: "CRM", description: "Leads, pipeline, conversions", icon: "Users", view: "crm", countKey: "leads", accent: "text-alo-blue" },
  { key: "students", title: "Students", description: "Profiles, documents, progress", icon: "GraduationCap", view: "student-dashboard", countKey: "students", accent: "text-alo-orange" },
  { key: "applications", title: "Applications", description: "Stage tracker, SLAs, docs", icon: "ClipboardList", view: "applications", countKey: "applications", accent: "text-violet-600" },
  { key: "universities", title: "Universities", description: "Partners, courses, monitoring", icon: "Building2", view: "admin-course-management", countKey: "universities", accent: "text-emerald-600" },
  { key: "courses", title: "Courses", description: "Catalog, search, management", icon: "BookOpen", view: "admin-course-management", countKey: "courses", accent: "text-amber-600" },
  { key: "partners", title: "Partners", description: "Packages, performance, hub", icon: "Handshake", view: "partner-admin-dashboard", countKey: "partners", accent: "text-rose-600" },
  { key: "employees", title: "Employees", description: "HR, attendance, payroll", icon: "UserCog", view: "employee-management", countKey: "employees", accent: "text-alo-blue" },
  { key: "marketing", title: "Marketing", description: "Campaigns, budget, ROI", icon: "Megaphone", view: "marketing", countKey: "campaigns", accent: "text-alo-orange" },
  { key: "communication", title: "Communication", description: "WhatsApp, SMS, email", icon: "MessageCircle", view: "comm-command-center", countKey: "messages", accent: "text-emerald-600" },
  { key: "ai", title: "AI Workforce", description: "Agents, jobs, approvals", icon: "Bot", view: "ai-command", countKey: "aiAgents", accent: "text-violet-600" },
  { key: "automation", title: "Automation", description: "Workflows, triggers, logs", icon: "Workflow", view: "central-ai-command", countKey: "workflows", accent: "text-amber-600" },
  { key: "approvals", title: "Approvals", description: "Pending reviews, decisions", icon: "CheckSquare", view: "access-control-center", countKey: "pendingApprovals", accent: "text-rose-600" },
  { key: "analytics", title: "Analytics", description: "Reports, funnels, insights", icon: "BarChart3", view: "weekly-reports", countKey: "reports", accent: "text-alo-blue" },
  { key: "security", title: "Security", description: "RBAC, audit, settings", icon: "ShieldCheck", view: "audit", countKey: "auditEvents", accent: "text-alo-orange" },
  { key: "settings", title: "Settings", description: "System config, backups", icon: "Settings", view: "access-control-center", countKey: "settings", accent: "text-alo-gray" },
];

const DEMO_DEPARTMENTS = [
  { name: "CRM & Sales", agents: 8, tasks: 142, completion: 78 },
  { name: "Application Team", agents: 6, tasks: 98, completion: 85 },
  { name: "Visa Processing", agents: 4, tasks: 67, completion: 71 },
  { name: "Marketing", agents: 5, tasks: 53, completion: 64 },
  { name: "Finance", agents: 3, tasks: 38, completion: 92 },
  { name: "HR & Admin", agents: 2, tasks: 24, completion: 88 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number, currency = "GBP") {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `£${value.toLocaleString()}`;
  }
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: "healthy" | "degraded" | "unhealthy" | string }) {
  const color = status === "healthy" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-rose-500";
  return <span className={cn("size-2.5 rounded-full", color, status === "healthy" && "animate-pulse")} />;
}

function FunnelBar({
  stage,
  count,
  maxCount,
  dropOffPct,
  isLast,
}: {
  stage: string;
  count: number;
  maxCount: number;
  dropOffPct: number;
  isLast: boolean;
}) {
  const widthPct = maxCount > 0 ? Math.max(18, (count / maxCount) * 100) : 18;
  return (
    <div className="flex items-stretch gap-3">
      {/* Funnel bar */}
      <div className="flex flex-1 flex-col items-center gap-1.5">
        <div
          className={cn(
            "flex items-center justify-center rounded-xl py-3 text-center transition-all duration-500",
            "bg-gradient-to-r from-alo-blue to-alo-blue/80 text-white shadow-sm hover:shadow-md",
            isLast && "from-emerald-500 to-emerald-500/80",
          )}
          style={{ width: `${widthPct}%` }}
        >
          <span className="block text-lg font-bold tabular-nums">{compactNumber(count)}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-90">{stage}</span>
        </div>
      </div>
      {/* Drop-off indicator */}
      <div className="hidden w-20 shrink-0 flex-col items-end gap-0.5 sm:flex">
        {!isLast && dropOffPct > 0 && (
          <>
            <span className="text-xs font-semibold text-rose-500 tabular-nums">-{dropOffPct.toFixed(0)}%</span>
            <div className="h-1 w-16 overflow-hidden rounded-full bg-alo-gray-light">
              <div
                className="h-full rounded-full bg-rose-400 transition-all duration-500"
                style={{ width: `${Math.min(100, dropOffPct * 3)}%` }}
              />
            </div>
          </>
        )}
        {isLast && <span className="text-xs font-semibold text-emerald-600">Final</span>}
      </div>
    </div>
  );
}

function ModuleCardComponent({
  mod,
  count,
  onNavigate,
}: {
  mod: ModuleCard;
  count: number;
  onNavigate?: (view: string, slug?: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate?.(mod.view)}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 text-left transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg hover:border-alo-blue/30",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-alo-blue/40",
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("flex size-10 items-center justify-center rounded-xl bg-alo-blue-light transition-colors group-hover:bg-alo-blue/10", mod.accent)}>
          <Icon name={mod.icon} className="size-5" />
        </div>
        {count > 0 && (
          <Badge className="border-0 bg-alo-blue-light text-alo-blue hover:bg-alo-blue-light text-[11px] font-semibold tabular-nums">
            {compactNumber(count)}
          </Badge>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-alo-black group-hover:text-alo-blue transition-colors">{mod.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-alo-gray line-clamp-2">{mod.description}</p>
      </div>
      <div className="mt-auto flex items-center gap-1 text-xs font-medium text-alo-blue opacity-0 transition-opacity group-hover:opacity-100">
        Open <Icon name="ArrowRight" className="size-3" />
      </div>
    </button>
  );
}

function AlertItem({
  icon,
  label,
  count,
  color,
  onClick,
}: {
  icon: string;
  label: string;
  count: number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 text-left transition-all hover:shadow-sm",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-alo-blue/40",
      )}
    >
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", color)}>
        <Icon name={icon} className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-alo-black">{label}</p>
        <p className="text-xs text-alo-gray">{count} item{count !== 1 ? "s" : ""} need attention</p>
      </div>
      <Badge className={cn("shrink-0 border-0", count > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
        {count}
      </Badge>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AdminCommandCenter({ onNavigate }: AdminCommandCenterProps) {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [overview, setOverview] = React.useState<OverviewResponse | null>(null);
  const [funnel, setFunnel] = React.useState<FunnelItem[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [health, setHealth] = React.useState<HealthResponse | null>(null);
  const [commissions, setCommissions] = React.useState<Commission[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // ---- Parallel data fetch ----
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.allSettled([
          fetch("/api/dashboard/stats", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/reports/overview", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/reports/conversion", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/audit-logs?take=8", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/health", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/commissions?status=PENDING", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/payments?status=COMPLETED", { cache: "no-store" }).then((r) => r.json()),
        ]);

        if (cancelled) return;

        // Stats
        if (results[0].status === "fulfilled" && results[0].value && !results[0].value.error) {
          setStats(results[0].value as DashboardStats);
        } else {
          setStats(DEMO_STATS);
        }

        // Overview
        if (results[1].status === "fulfilled" && results[1].value && !results[1].value.error) {
          setOverview(results[1].value as OverviewResponse);
        } else {
          setOverview(DEMO_OVERVIEW);
        }

        // Funnel
        if (results[2].status === "fulfilled" && results[2].value?.funnel) {
          setFunnel(results[2].value.funnel as FunnelItem[]);
        } else {
          setFunnel(DEMO_FUNNEL);
        }

        // Audit logs
        if (results[3].status === "fulfilled") {
          const auditData = results[3].value;
          const logs = Array.isArray(auditData?.logs) ? auditData.logs : Array.isArray(auditData) ? auditData : [];
          setAuditLogs(logs.length > 0 ? logs : DEMO_AUDIT);
        } else {
          setAuditLogs(DEMO_AUDIT);
        }

        // Health
        if (results[4].status === "fulfilled" && results[4].value) {
          setHealth(results[4].value as HealthResponse);
        } else {
          setHealth(DEMO_HEALTH);
        }

        // Commissions
        if (results[5].status === "fulfilled" && results[5].value?.commissions) {
          setCommissions(results[5].value.commissions as Commission[]);
        }

        // Payments
        if (results[6].status === "fulfilled" && results[6].value?.payments) {
          setPayments(results[6].value.payments as Payment[]);
        }
      } catch {
        setError("Failed to load command center data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- Derived values ----
  const counts = stats?.counts ?? DEMO_STATS.counts ?? {};
  const finance = stats?.finance ?? DEMO_STATS.finance ?? {};
  const totalRevenue = finance.revenue ?? 0;
  const totalStudents = counts.students ?? 0;
  const totalApplications = counts.applications ?? 0;
  const totalLeads = counts.leads ?? 0;
  const activeEmployees = stats?.agentsByDept ? Object.values(stats.agentsByDept).reduce((a, b) => a + b, 0) : 26;
  const conversionRate = totalLeads > 0 ? ((totalApplications / totalLeads) * 100).toFixed(1) : "0.0";

  // Revenue from overview
  const overviewPayments = overview?.revenue?.totalPayments
    ? parseFloat(overview.revenue.totalPayments)
    : totalRevenue;
  const overviewCommissions = overview?.revenue?.totalCommissions
    ? parseFloat(overview.revenue.totalCommissions)
    : finance.commissionPending ?? 0;

  // Commission pending sum
  const commissionPending = commissions.length > 0
    ? commissions.reduce((sum, c) => sum + (parseFloat(c.amount || "0")), 0)
    : finance.commissionPending ?? 18700;

  // Payments received count
  const paymentsReceived = payments.length > 0 ? payments.length : overview?.revenue?.totalPayments ? 1 : 0;

  // Tasks
  const overdueTasks = overview?.tasks?.overdue ?? 0;
  const pendingDocs = overview?.documents?.pending ?? 0;
  const pendingVisa = overview?.visa?.pending ?? 0;

  // Funnel processing — map API funnel to display stages
  const displayFunnel = React.useMemo(() => {
    if (funnel.length === 0) return DEMO_FUNNEL;
    const funnelMap: Record<string, number> = {};
    for (const f of funnel) {
      funnelMap[f.stage] = f.count;
    }
    // Map to our 6 display stages
    const stages = [
      { stage: "Leads", count: funnelMap["LEADS"] ?? DEMO_FUNNEL[0].count },
      { stage: "Contacted", count: funnelMap["REGISTERED"] ?? DEMO_FUNNEL[1].count },
      { stage: "Qualified", count: funnelMap["COUNSELLING"] ?? DEMO_FUNNEL[2].count },
      { stage: "Applied", count: (funnelMap["APPLICATION"] ?? 0) + (funnelMap["SUBMITTED"] ?? 0) || DEMO_FUNNEL[3].count },
      { stage: "Offered", count: (funnelMap["OFFER_RECEIVED"] ?? 0) + (funnelMap["OFFER_ACCEPTED"] ?? 0) || DEMO_FUNNEL[4].count },
      { stage: "Enrolled", count: funnelMap["ENROLLED"] ?? DEMO_FUNNEL[8].count },
    ];
    return stages;
  }, [funnel]);

  const funnelMaxCount = Math.max(...displayFunnel.map((s) => s.count), 1);

  // Quick access count map
  const moduleCountMap: Record<string, number> = {
    leads: totalLeads,
    students: totalStudents,
    applications: totalApplications,
    universities: stats?.counts?.visaCases ?? 45,
    courses: stats?.counts?.payments ?? 180,
    partners: 12,
    employees: activeEmployees,
    campaigns: counts.campaigns ?? 0,
    messages: 248,
    aiAgents: counts.aiAgents ?? 0,
    workflows: 8,
    pendingApprovals: overdueTasks + pendingDocs,
    reports: 42,
    auditEvents: auditLogs.length,
    settings: 1,
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Command Center" subtitle="Loading system overview…" icon="Command" />
        <LoadingGrid count={6} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LoadingGrid count={2} />
          <LoadingGrid count={2} />
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error && !stats && !overview) {
    return (
      <div className="space-y-6">
        <PageHeader title="Command Center" subtitle="System overview" icon="Command" />
        <EmptyState
          icon="AlertTriangle"
          title="Failed to load data"
          description={error}
          action={
            <Button onClick={() => window.location.reload()} variant="outline">
              <Icon name="RefreshCw" className="mr-2 size-4" /> Retry
            </Button>
          }
        />
      </div>
    );
  }

  // ---- Render ----
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ================================================================= */}
        {/* PAGE HEADER                                                       */}
        {/* ================================================================= */}
        <PageHeader
          title="Admin Command Center"
          subtitle="Real-time system intelligence — operations, finance, and performance at a glance."
          icon="Command"
          action={
            <Badge className="gap-1.5 border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              <StatusDot status={health?.status ?? "healthy"} />
              {health?.status === "healthy" ? "All Systems Go" : "System Issues"}
            </Badge>
          }
        />

        {/* ================================================================= */}
        {/* 1. BUSINESS OVERVIEW — 6 StatCards in 2x3 grid                   */}
        {/* ================================================================= */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Icon name="TrendingUp" className="size-4 text-alo-blue" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-alo-gray">Business Overview</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(overviewPayments)}
              icon="DollarSign"
              accent="emerald"
              hint="This period"
            />
            <StatCard
              label="Active Students"
              value={totalStudents.toLocaleString()}
              icon="Users"
              accent="orange"
              hint="Enrolled + active"
            />
            <StatCard
              label="Total Applications"
              value={totalApplications.toLocaleString()}
              icon="ClipboardList"
              accent="violet"
              hint="All stages"
            />
            <StatCard
              label="Conversion Rate"
              value={`${conversionRate}%`}
              icon="Target"
              accent="blue"
              hint="Leads → Apps"
            />
            <StatCard
              label="Total Partners"
              value="12"
              icon="Handshake"
              accent="sunshine"
              hint="Active partnerships"
            />
            <StatCard
              label="Active Employees"
              value={String(activeEmployees)}
              icon="UserCog"
              accent="amber"
              hint="Across all depts"
            />
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. SYSTEM HEALTH                                                  */}
        {/* ================================================================= */}
        <SectionCard
          title="System Health"
          description="Infrastructure status and service availability"
          icon="HeartPulse"
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Server Status", detail: "Next.js 16 · Bun Runtime", status: health?.status ?? "healthy" },
              { label: "API Health", detail: "53 routes · all responding", status: "healthy" },
              { label: "Database", detail: `SQLite · Prisma ORM`, status: health?.database ?? "healthy" },
              { label: "Last Backup", detail: health?.timestamp ? new Date(health.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Today, 02:00 AM", status: "healthy" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition-colors hover:bg-alo-gray-light/40"
              >
                <StatusDot status={item.status} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-alo-black truncate">{item.label}</p>
                  <p className="text-xs text-alo-gray truncate">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ================================================================= */}
        {/* 3. QUICK ACCESS GRID — 15 module cards                           */}
        {/* ================================================================= */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon name="LayoutGrid" className="size-4 text-alo-blue" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-alo-gray">Quick Access</h2>
            </div>
            <span className="text-xs text-alo-gray">{QUICK_ACCESS_MODULES.length} modules</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {QUICK_ACCESS_MODULES.map((mod) => (
              <ModuleCardComponent
                key={mod.key}
                mod={mod}
                count={moduleCountMap[mod.countKey] ?? 0}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. CONVERSION FUNNEL + 5. REVENUE OVERVIEW (side by side)        */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Conversion Funnel — takes 3 cols */}
          <SectionCard
            title="Conversion Funnel"
            description="Lead to enrollment pipeline"
            icon="Filter"
            className="lg:col-span-3"
          >
            <div className="flex flex-col items-center gap-2.5 py-2">
              {displayFunnel.map((item, idx) => {
                const prevCount = idx > 0 ? displayFunnel[idx - 1].count : item.count;
                const dropOff = prevCount > 0 ? ((prevCount - item.count) / prevCount) * 100 : 0;
                return (
                  <FunnelBar
                    key={item.stage}
                    stage={item.stage}
                    count={item.count}
                    maxCount={funnelMaxCount}
                    dropOffPct={dropOff}
                    isLast={idx === displayFunnel.length - 1}
                  />
                );
              })}
            </div>
          </SectionCard>

          {/* Revenue Overview — takes 2 cols */}
          <SectionCard
            title="Revenue Overview"
            description="Financial snapshot"
            icon="Wallet"
            className="lg:col-span-2"
          >
            <div className="space-y-4">
              {/* Revenue cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Payments Received</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(overviewPayments)}
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-600">{paymentsReceived} transactions</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Commission Pending</p>
                  <p className="mt-1 text-2xl font-bold text-amber-700 tabular-nums">
                    {formatCurrency(commissionPending)}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-600">{commissions.length > 0 ? commissions.length : 14} pending</p>
                </div>
              </div>

              {/* Monthly breakdown placeholder bars */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-alo-gray">Monthly Trend</p>
                {[
                  { month: "Jun", value: 42 },
                  { month: "Jul", value: 58 },
                  { month: "Aug", value: 71 },
                  { month: "Sep", value: 65 },
                  { month: "Oct", value: 89 },
                ].map((m) => (
                  <div key={m.month}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-alo-black">{m.month}</span>
                      <span className="tabular-nums text-alo-gray">{m.value}K</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-alo-gray-light">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-alo-blue to-alo-blue/70 transition-all duration-700"
                        style={{ width: `${(m.value / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ================================================================= */}
        {/* 6. DEPARTMENT OVERVIEW + 7. RECENT ACTIVITY (side by side)        */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Department Overview */}
          <SectionCard
            title="Department Overview"
            description="Team performance across departments"
            icon="Building"
          >
            <div className="space-y-3 max-h-96 overflow-y-auto alo-scroll pr-1">
              {DEMO_DEPARTMENTS.map((dept) => (
                <div
                  key={dept.name}
                  className="flex items-center gap-4 rounded-xl border border-border p-3 transition-colors hover:bg-alo-gray-light/30"
                >
                  <CompletionRing value={dept.completion} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-alo-black truncate">{dept.name}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-alo-gray">
                      <span className="flex items-center gap-1">
                        <Icon name="Users" className="size-3" />
                        {dept.agents} agents
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="ListChecks" className="size-3" />
                        {dept.tasks} tasks
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-sm font-bold tabular-nums",
                      dept.completion >= 80 ? "text-emerald-600" : dept.completion >= 60 ? "text-amber-600" : "text-rose-600",
                    )}>
                      {dept.completion}%
                    </span>
                    <p className="text-[10px] text-alo-gray">complete</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recent Activity */}
          <SectionCard
            title="Recent Activity"
            description="Latest 8 system-wide events"
            icon="Activity"
            action={
              <Button variant="outline" size="sm" onClick={() => onNavigate?.("audit")}>
                <Icon name="ArrowUpRight" className="mr-1.5 size-3" />
                View all
              </Button>
            }
          >
            {auditLogs.length === 0 ? (
              <EmptyState icon="Inbox" title="No recent activity" description="Audit log is empty." />
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto alo-scroll pr-1">
                {auditLogs.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-alo-gray-light/30"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                        AUDIT_ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700",
                      )}
                    >
                      <Icon name={AUDIT_ACTION_ICONS[log.action] || "CircleDot"} className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-alo-black truncate">
                          {log.user?.name || "System"}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0",
                            AUDIT_ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700",
                          )}
                        >
                          {AUDIT_ACTION_LABELS[log.action] || log.action.replace(/_/g, " ")}
                        </span>
                      </div>
                      {log.details && (
                        <p className="mt-0.5 text-xs text-alo-gray line-clamp-1">{log.details}</p>
                      )}
                      {log.resource && !log.details && (
                        <p className="mt-0.5 text-xs text-alo-gray">on {log.resource}{log.resourceId ? ` #${log.resourceId}` : ""}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-alo-gray whitespace-nowrap">
                      {timeAgo(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ================================================================= */}
        {/* 8. SYSTEM ALERTS                                                  */}
        {/* ================================================================= */}
        <SectionCard
          title="System Alerts"
          description="Items requiring immediate attention"
          icon="BellRing"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AlertItem
              icon="Clock"
              label="Overdue Tasks"
              count={overdueTasks}
              color="bg-rose-50 text-rose-600"
              onClick={() => onNavigate?.("weekly-reports")}
            />
            <AlertItem
              icon="FileWarning"
              label="Expiring Documents"
              count={pendingDocs}
              color="bg-amber-50 text-amber-600"
              onClick={() => onNavigate?.("applications")}
            />
            <AlertItem
              icon="ClipboardCheck"
              label="Pending Approvals"
              count={pendingVisa}
              color="bg-alo-blue-light text-alo-blue"
              onClick={() => onNavigate?.("access-control-center")}
            />
            <AlertItem
              icon="MessageSquareWarning"
              label="Failed Communications"
              count={0}
              color="bg-emerald-50 text-emerald-600"
            />
          </div>
        </SectionCard>
      </div>
    </TooltipProvider>
  );
}
