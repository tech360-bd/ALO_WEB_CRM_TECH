"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  InfoRow,
  MiniBar,
  Progress,
} from "@/components/alo/shared";
import { PrivacyToggle, SensitiveField, usePrivacy } from "@/components/alo/privacy-mode";
import {
  type ViewKey,
  fmtDate,
  timeAgo,
} from "@/lib/alo-types";

// ============================================================
// Types
// ============================================================
interface Counselor {
  id: string;
  name: string;
  email?: string;
  role?: string;
  phone?: string;
}

interface Hr {
  employeeId: string;
  officialEmail?: string;
  branch?: string;
  designation?: string;
  department?: string;
  joiningDate?: string;
  baseSalary: number;
  salaryCurrency?: string;
  performanceScore?: number;
  targetLeads?: number;
  achievedLeads?: number;
  targetConversion?: number;
  achievedConversion?: number;
}

interface Performance {
  id?: string;
  score?: number;
  leadsHandled?: number;
  conversionRate?: number;
  satisfactionScore?: number;
  slaCompliance?: number;
  period?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  status: string;
  dueDate?: string;
  student?: { studentId: string; fullName: string } | null;
}

interface Appointment {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  status: string;
  student?: { fullName?: string } | null;
  notes?: string;
}

interface SlaEvent {
  id: string;
  channel: string;
  status: string;
  receivedAt: string;
  studentId?: string;
  slaMinutes: number;
}

interface UnreadMessage {
  id: string;
  channel: string;
  direction: string;
  fromName?: string;
  fromPhone?: string;
  body: string;
  receivedAt: string;
  read: boolean;
}

interface Metrics {
  assignedLeads: number;
  newLeadsToday: number;
  hotLeads: number;
  activeStudents: number;
  partnerReferredStudents: number;
  activeApplications: number;
  documentsPending: number;
  sopPending: number;
  unreadWhatsApp: number;
  unreadSocial: number;
  slaOverdue: number;
  followUpsDue: number;
  offersReceived: number;
  casPending: number;
  aiInterviewHighRisk: number;
  pendingCommission: number;
  paidCommission: number;
  todayAppointments: number;
}

interface DashboardData {
  counselor: Counselor;
  hr: Hr | null;
  metrics: Metrics;
  performance?: Performance | null;
  tasks: Task[];
  appointments: Appointment[];
  unreadMessages: UnreadMessage[];
  slaEvents: SlaEvent[];
}

interface HrSelfSummary {
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  totalBonus: number;
  presentDays: number;
  lateDays: number;
  leaveDays: number;
}

// ============================================================
// Color & label maps
// ============================================================
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
  NORMAL: "bg-sky-100 text-sky-700",
  HIGH: "bg-crm-warning-bg text-crm-warning-text",
  URGENT: "bg-crm-warning-bg text-crm-warning-text",
};

const TASK_TYPE_LABELS: Record<string, string> = {
  FOLLOW_UP: "Follow-up",
  DOCUMENT_REQUEST: "Document Request",
  CALL: "Call",
  MEETING: "Meeting",
  SOP_REVIEW: "SOP Review",
  VISA_CHECK: "Visa Check",
  OTHER: "Other",
};

const APPT_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: "Consultation",
  FOLLOW_UP: "Follow-up",
  VISA_PREP: "Visa Prep",
  INTERVIEW_PRACTICE: "Interview Practice",
};

const SLA_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-crm-warning-bg text-crm-warning-text",
  UNREAD: "bg-crm-warning-bg text-crm-warning-text",
  ESCALATED_40: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]",
  ESCALATED_50: "bg-crm-warning-bg text-crm-warning-text",
  RESPONDED: "bg-crm-success-bg text-crm-success-text",
  AI_HANDLED: "bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]",
  MISSED: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
};

const SLA_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  UNREAD: "Unread",
  ESCALATED_40: "Escalated (40%)",
  ESCALATED_50: "Escalated (50%)",
  RESPONDED: "Responded",
  AI_HANDLED: "AI Handled",
  MISSED: "Missed",
};

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: "bg-crm-success-bg text-crm-success-text",
  SMS: "bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]",
  EMAIL: "bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]",
  FACEBOOK: "bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]",
  INSTAGRAM: "bg-crm-danger-bg text-crm-danger-text",
  MESSENGER: "bg-sky-100 text-sky-700",
  WEBSITE_CHAT: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
  PORTAL: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]",
};

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  EMAIL: "Email",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  MESSENGER: "Messenger",
  WEBSITE_CHAT: "Web Chat",
  PORTAL: "Portal",
};

// ============================================================
// Helpers
// ============================================================
function fmtTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtCurrency(amount: number, currency = "BDT") {
  const symbol = currency === "BDT" ? "৳" : currency === "USD" ? "$" : currency + " ";
  return `${symbol}${(amount || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== "string") return val as T;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function CounselorDashboard({ onNavigate = () => {} }: { onNavigate?: (v: ViewKey, slug?: string) => void }) {
  const { toast } = useToast();
  const { privacyOn } = usePrivacy();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [hrSummary, setHrSummary] = React.useState<HrSelfSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [completingTask, setCompletingTask] = React.useState<string | null>(null);

  // Fetch dashboard + HR self-service in parallel
  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [dashRes, hrRes] = await Promise.all([
          fetch("/api/counselor/dashboard"),
          fetch("/api/counselor/hr-self"),
        ]);
        const dash = await dashRes.json();
        const hr = await hrRes.json();
        if (!alive) return;
        if (dash.counselor) {
          setData(dash);
        } else {
          toast({
            title: "Could not load dashboard",
            description: dash.error ?? "Please try again later.",
            variant: "destructive",
          });
        }
        if (hr.summary) setHrSummary(hr.summary);
      } catch {
        if (alive) {
          toast({
            title: "Network error",
            description: "Failed to load counselor dashboard.",
            variant: "destructive",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [toast]);

  // Mark a task complete
  const completeTask = React.useCallback(async (taskId: string) => {
    setCompletingTask(taskId);
    try {
      const res = await fetch("/api/counselor/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "COMPLETED" }),
      });
      const json = await res.json();
      if (json.task) {
        setData((prev) => prev ? {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== taskId),
        } : prev);
        toast({
          title: "Task completed",
          description: "Marked as complete and logged to your activity feed.",
        });
      } else {
        toast({
          title: "Could not complete task",
          description: json.error ?? "Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    } finally {
      setCompletingTask(null);
    }
  }, [toast]);

  const unreadTotal = data?.metrics.unreadWhatsApp ?? 0 + (data?.metrics.unreadSocial ?? 0);
  const totalTasks = data?.tasks.length ?? 0;

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <LoadingGrid count={8} />
      </div>
    );
  }

  const { counselor, hr, metrics, performance, tasks, appointments, unreadMessages, slaEvents } = data;

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* HEADER BAR                                                    */}
      {/* ============================================================ */}
      <Card className="overflow-hidden rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-gradient-to-br from-[var(--alo-brand-light)] to-white">
        <CardContent className="pt-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: identity */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-alo-gradient text-white alo-shadow">
                <Icon name="Headset" className="size-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-[var(--alo-brand)] sm:text-2xl">{counselor.name}</h1>
                  <Badge variant="outline" className="border-[var(--alo-brand)]/30 bg-white font-mono text-[var(--alo-brand)]">
                    {hr?.employeeId ?? "—"}
                  </Badge>
                  <Badge className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90">
                    {counselor.role?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Counselor"}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {hr?.branch && (
                    <span className="flex items-center gap-1">
                      <Icon name="MapPin" className="size-3.5" />
                      {hr.branch}
                    </span>
                  )}
                  {hr?.designation && (
                    <span className="flex items-center gap-1">
                      <Icon name="Briefcase" className="size-3.5" />
                      {hr.designation}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Icon name="Globe" className="size-3.5" />
                    UK · Canada · Australia focus
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-crm-success-bg px-2 py-0.5 font-semibold text-crm-success-text">
                    <span className="size-1.5 animate-pulse rounded-full bg-[var(--alo-success)]" />
                    Online today
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="ListTodo" className="size-3.5" />
                    {totalTasks} open task{totalTasks === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-wrap items-center gap-2">
              <PrivacyToggle />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1.5 rounded-lg border border-crm-success-border bg-crm-success-bg px-2.5 py-1.5 text-xs font-semibold text-crm-success-text">
                      <Icon name="MessageCircle" className="size-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                      <span className="size-1.5 animate-pulse rounded-full bg-[var(--alo-success)]" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>WhatsApp Business connected — {metrics.unreadWhatsApp} unread</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onNavigate("unified-inbox")}
                      className="relative flex size-9 items-center justify-center rounded-lg border border-[var(--alo-brand)]/20 bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                      aria-label="Notifications"
                    >
                      <Icon name="Bell" className="size-4" />
                      {unreadTotal > 0 && (
                        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[var(--alo-cta)] text-[11px] font-bold text-white">
                          {unreadTotal > 9 ? "9+" : unreadTotal}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{unreadTotal} unread messages</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                onClick={() =>
                  toast({
                    title: "Screen safe mode enabled",
                    description: "Sensitive data is now hidden. Salary, commission, and student PII will be masked.",
                  })
                }
                variant="outline"
                className="h-9 rounded-lg border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
              >
                <Icon name="Shield" className="mr-1.5 size-4" />
                <span className="hidden sm:inline">Screen Safe</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* METRICS GRID (16 StatCards)                                   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Assigned Leads" value={metrics.assignedLeads} icon="UserPlus" accent="blue" hint="Total in your pipeline" />
        <StatCard label="New Leads Today" value={metrics.newLeadsToday} icon="Sparkles" accent="orange" hint="Freshly assigned" />
        <StatCard label="Hot Leads" value={metrics.hotLeads} icon="Flame" accent="rose" hint="Qualified & active" />
        <StatCard label="Active Students" value={metrics.activeStudents} icon="Users" accent="violet" hint="Under your counselling" />
        <StatCard label="Partner-Referred" value={metrics.partnerReferredStudents} icon="Handshake" accent="blue" hint="Via referral partners" />
        <StatCard label="Apps in Progress" value={metrics.activeApplications} icon="ClipboardList" accent="orange" hint="Open applications" />
        <StatCard label="Documents Pending" value={metrics.documentsPending} icon="FileWarning" accent="amber" hint="Awaiting upload/review" />
        <StatCard label="SOP/CV Pending" value={metrics.sopPending} icon="FileText" accent="violet" hint="Drafts needing review" />
        <StatCard label="Unread WhatsApp" value={metrics.unreadWhatsApp} icon="MessageCircle" accent="emerald" hint="Inbound messages" />
        <StatCard label="Unread Social" value={metrics.unreadSocial} icon="Share2" accent="blue" hint="FB / IG / Messenger" />
        <StatCard label="SLA Overdue" value={metrics.slaOverdue} icon="AlertTriangle" accent="rose" hint="Escalated 40%+" />
        <StatCard label="Follow-ups Due" value={metrics.followUpsDue} icon="Clock" accent="amber" hint="Scheduled today" />
        <StatCard label="Offers Received" value={metrics.offersReceived} icon="Trophy" accent="emerald" hint="Conditional + Unconditional" />
        <StatCard label="CAS Pending" value={metrics.casPending} icon="FileCheck" accent="orange" hint="Awaiting CAS issue" />
        <StatCard label="AI Interview High-Risk" value={metrics.aiInterviewHighRisk} icon="AlertCircle" accent="rose" hint="Needs human review" />
        <StatCard label="Today's Appointments" value={metrics.todayAppointments} icon="Calendar" accent="blue" hint="Scheduled today" />
      </div>

      {/* ============================================================ */}
      {/* TWO-COLUMN MAIN LAYOUT                                        */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ------------------------- LEFT COLUMN (col-span-2) ------------------------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* TODAY'S TASKS */}
          <SectionCard
            title="Today's Tasks"
            description="Follow-ups, calls and reviews due next"
            icon="ListTodo"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                onClick={() => toast({ title: "Full task list", description: "Open the unified inbox to see all assigned tasks." })}
              >
                View all <Icon name="ArrowRight" className="ml-1 size-3.5" />
              </Button>
            }
          >
            {tasks.length === 0 ? (
              <EmptyState icon="CheckCircle2" title="No pending tasks" description="You're all caught up for now." />
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => {
                  const overdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now();
                  return (
                    <div
                      key={task.id}
                      className="flex flex-col gap-3 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">{task.title}</span>
                          {task.priority && (
                            <StatusBadge status={task.priority} colorMap={PRIORITY_COLORS} />
                          )}
                          {task.type && (
                            <Badge variant="outline" className="text-[11px] text-muted-foreground">
                              {TASK_TYPE_LABELS[task.type] ?? task.type}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {task.student && (
                            <span className="flex items-center gap-1">
                              <Icon name="User" className="size-3" />
                              {task.student.fullName}
                              <span className="font-mono">({task.student.studentId})</span>
                            </span>
                          )}
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 ${overdue ? "font-semibold text-crm-warning-text" : ""}`}>
                              <Icon name="Calendar" className="size-3" />
                              Due {fmtDate(task.dueDate)} {fmtTime(task.dueDate)}
                              {overdue && " · overdue"}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={completingTask === task.id}
                        onClick={() => completeTask(task.id)}
                        className="h-8 shrink-0 bg-[var(--alo-success-dark)] text-white hover:bg-[var(--alo-success-dark)]"
                      >
                        {completingTask === task.id ? (
                          <Icon name="Loader2" className="mr-1 size-3.5 animate-spin" />
                        ) : (
                          <Icon name="Check" className="mr-1 size-3.5" />
                        )}
                        Complete
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* TODAY'S APPOINTMENTS */}
          <SectionCard
            title="Today's Appointments"
            description="Scheduled consults and follow-ups"
            icon="Calendar"
          >
            {appointments.length === 0 ? (
              <EmptyState icon="CalendarOff" title="No appointments scheduled" description="Your calendar is clear for now." />
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
                    <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                      <span className="text-[11px] font-medium uppercase">{new Date(a.scheduledAt).toLocaleDateString("en-GB", { month: "short" })}</span>
                      <span className="text-base font-bold leading-none">{new Date(a.scheduledAt).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{a.title}</span>
                        <Badge variant="outline" className="text-[11px] text-[var(--alo-brand)]">
                          {APPT_TYPE_LABELS[a.type] ?? a.type}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="Clock" className="size-3" />
                          {fmtTime(a.scheduledAt)} · {a.durationMinutes}min
                        </span>
                        {a.student?.fullName && (
                          <span className="flex items-center gap-1">
                            <Icon name="User" className="size-3" />
                            {a.student.fullName}
                          </span>
                        )}
                        {a.location && (
                          <span className="flex items-center gap-1">
                            <Icon name="MapPin" className="size-3" />
                            {a.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* SLA ALERTS */}
          <SectionCard
            title="SLA Alerts"
            description="First-response timer on inbound messages"
            icon="AlertTriangle"
            action={
              <Badge variant="outline" className="border-crm-warning-border bg-crm-warning-bg text-crm-warning-text">
                {slaEvents.length} active
              </Badge>
            }
          >
            {slaEvents.length === 0 ? (
              <EmptyState icon="ShieldCheck" title="No SLA breaches" description="All response times within target." />
            ) : (
              <div className="space-y-3">
                {slaEvents.map((ev) => {
                  const isEscalated = ev.status === "ESCALATED_40" || ev.status === "ESCALATED_50";
                  const minutesSince = Math.floor((Date.now() - new Date(ev.receivedAt).getTime()) / 60000);
                  const overdue = minutesSince > ev.slaMinutes;
                  return (
                    <div
                      key={ev.id}
                      className={`rounded-xl border p-3 ${
                        isEscalated
                          ? "border-crm-warning-border bg-crm-warning-bg/50"
                          : "border-crm-warning-border bg-crm-warning-bg/30"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={ev.status} colorMap={SLA_STATUS_COLORS} labels={SLA_STATUS_LABELS} />
                          <Badge variant="outline" className="text-[11px]">
                            {CHANNEL_LABELS[ev.channel] ?? ev.channel}
                          </Badge>
                          <span className={`text-xs font-semibold ${overdue ? "text-crm-warning-text" : "text-muted-foreground"}`}>
                            {minutesSince}m ago · SLA {ev.slaMinutes}m
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                          onClick={() => onNavigate("unified-inbox")}
                        >
                          Respond <Icon name="ArrowRight" className="ml-1 size-3" />
                        </Button>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {overdue
                          ? "This conversation has breached its first-response SLA — please respond immediately to avoid escalation."
                          : "Inbound message awaiting your first response."}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* RECENT UNREAD MESSAGES */}
          <SectionCard
            title="Recent Unread Messages"
            description="Inbound conversations needing your attention"
            icon="Inbox"
            action={
              <Button
                size="sm"
                onClick={() => onNavigate("unified-inbox")}
                className="h-8 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
              >
                <Icon name="Inbox" className="mr-1.5 size-3.5" />
                Open Inbox
              </Button>
            }
          >
            {unreadMessages.length === 0 ? (
              <EmptyState icon="CheckCircle2" title="Inbox zero" description="No unread inbound messages." />
            ) : (
              <div className="space-y-2">
                {unreadMessages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onNavigate("unified-inbox")}
                    className="flex w-full items-start gap-3 rounded-xl border border-border/60 p-3 text-left transition-colors hover:bg-[var(--alo-brand-light)]/40"
                  >
                    <Badge variant="outline" className={`shrink-0 text-[11px] ${CHANNEL_COLORS[m.channel] ?? "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"}`}>
                      {CHANNEL_LABELS[m.channel] ?? m.channel}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {m.fromName ?? m.fromPhone ?? "Unknown sender"}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(m.receivedAt)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{m.body}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ------------------------- RIGHT COLUMN (col-span-1) ------------------------- */}
        <div className="space-y-6">
          {/* HR SELF-SERVICE CARD (privacy gated) */}
          <SectionCard
            title="HR Self-Service"
            description={privacyOn ? "Privacy ON — reveal sensitive fields with PIN" : "Your compensation & attendance"}
            icon="BadgeDollarSign"
            action={<PrivacyToggle />}
          >
            <div className="space-y-4">
              {/* Profile summary */}
              <div className="rounded-xl bg-[var(--alo-brand-light)]/60 p-3">
                <p className="text-sm font-bold text-[var(--alo-brand)]">{counselor.name}</p>
                <p className="text-xs text-muted-foreground">{hr?.designation ?? "Counselor"} · {hr?.department ?? "Student Success"}</p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">Employee ID</span>
                    <p className="font-mono font-semibold text-foreground">{hr?.employeeId ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Branch</span>
                    <p className="font-semibold text-foreground">{hr?.branch ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Joined</span>
                    <p className="font-semibold text-foreground">{hr?.joiningDate ? fmtDate(hr.joiningDate) : "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Official email</span>
                    <p className="truncate text-xs font-medium text-foreground">{hr?.officialEmail ?? counselor.email ?? "—"}</p>
                  </div>
                </div>
              </div>

              {/* Sensitive fields */}
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon name="Lock" className="size-3" /> Compensation (PIN-protected)
                </p>
                <SensitiveField id="base-salary" label="Base Salary" value={fmtCurrency(hr?.baseSalary ?? 0, hr?.salaryCurrency)} type="currency" mono />
                <SensitiveField id="perf-score" label="Performance Score" value={`${(hr?.performanceScore ?? 0).toFixed(1)} / 100`} />
                <SensitiveField id="pending-comm" label="Pending Commission" value={fmtCurrency(metrics.pendingCommission)} type="currency" mono />
                <SensitiveField id="paid-comm" label="Paid Commission" value={fmtCurrency(metrics.paidCommission)} type="currency" mono />
                <SensitiveField id="total-bonus" label="Total Bonus" value={fmtCurrency(hrSummary?.totalBonus ?? 0)} type="currency" mono />
              </div>

              {/* Attendance summary */}
              {hrSummary && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">This month's attendance</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-crm-success-bg p-2">
                      <p className="text-lg font-bold text-crm-success-text">{hrSummary.presentDays}</p>
                      <p className="text-[11px] font-medium uppercase text-crm-success-text">Present</p>
                    </div>
                    <div className="rounded-lg bg-crm-warning-bg p-2">
                      <p className="text-lg font-bold text-crm-warning-text">{hrSummary.lateDays}</p>
                      <p className="text-[11px] font-medium uppercase text-crm-warning-text">Late</p>
                    </div>
                    <div className="rounded-lg bg-[var(--alo-surface-muted)] p-2">
                      <p className="text-lg font-bold text-[var(--alo-body)]">{hrSummary.leaveDays}</p>
                      <p className="text-[11px] font-medium uppercase text-[var(--alo-body)]">Leave</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Target vs Achieved */}
              {(hr?.targetLeads ?? 0) > 0 && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Target vs Achieved (leads)</span>
                    <span className="font-semibold text-foreground">{hr?.achievedLeads ?? 0} / {hr?.targetLeads ?? 0}</span>
                  </div>
                  <Progress value={Math.min(100, ((hr?.achievedLeads ?? 0) / (hr?.targetLeads ?? 1)) * 100)} className="h-2" />
                </div>
              )}

              <Button
 variant="outline"
 className=" w-full rounded-xl border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 onClick={() =>
                  toast({
                    title: "HR profile",
                    description: "Full HR profile (payslips, increments, bonus history) is available in the HR self-service portal.",
                  })
                }
              >
                <Icon name="ExternalLink" className="mr-2 size-4" />
                View Full HR Profile
              </Button>
            </div>
          </SectionCard>

          {/* COMMISSION ESTIMATE */}
          <SectionCard
            title="Commission Estimate"
            description="Visible only with permission"
            icon="Wallet"
          >
            <div className="space-y-3">
              <SensitiveField id="est-pending" label="Pending (this cycle)" value={fmtCurrency(metrics.pendingCommission)} type="currency" mono />
              <SensitiveField id="est-paid" label="Paid YTD" value={fmtCurrency(metrics.paidCommission)} type="currency" mono />
              <div className="rounded-lg bg-[var(--alo-cta-soft)]/60 p-3 text-xs text-[var(--alo-cta)]">
                <Icon name="Info" className="mr-1 inline size-3.5" />
                Commission is visible only with permission. Each reveal is audit-logged as <code className="font-mono">sensitive_data_revealed</code>.
              </div>
            </div>
          </SectionCard>

          {/* WEEKLY PERFORMANCE */}
          <SectionCard
            title="Weekly Performance"
            description="Latest period snapshot"
            icon="TrendingUp"
          >
            {performance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-[var(--alo-brand-light)]/60 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Overall score</p>
                    <p className="text-2xl font-bold text-[var(--alo-brand)]">{(performance.score ?? 0).toFixed(1)}<span className="text-sm text-muted-foreground">/100</span></p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-full bg-[var(--alo-brand)] text-white">
                    <Icon name="Award" className="size-6" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Leads handled</span>
                    <span className="font-semibold text-foreground">{performance.leadsHandled ?? 0}</span>
                  </div>
                  <MiniBar value={performance.leadsHandled ?? 0} max={Math.max(50, performance.leadsHandled ?? 0)} color="#0057B8" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Conversion rate</span>
                    <span className="font-semibold text-foreground">{(performance.conversionRate ?? 0).toFixed(1)}%</span>
                  </div>
                  <MiniBar value={performance.conversionRate ?? 0} max={100} color="#E8501A" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">SLA compliance</span>
                    <span className="font-semibold text-foreground">{(performance.slaCompliance ?? 0).toFixed(1)}%</span>
                  </div>
                  <MiniBar value={performance.slaCompliance ?? 0} max={100} color="#10b981" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Satisfaction</span>
                    <span className="font-semibold text-foreground">{(performance.satisfactionScore ?? 0).toFixed(1)} / 5</span>
                  </div>
                  <MiniBar value={performance.satisfactionScore ?? 0} max={5} color="#8b5cf6" />
                </div>
              </div>
            ) : (
              <EmptyState icon="BarChart3" title="No performance data" description="Your weekly performance snapshot will appear here." />
            )}
          </SectionCard>

          {/* QUICK ACTIONS */}
          <SectionCard
            title="Quick Actions"
            description="Jump to your most-used tools"
            icon="Zap"
          >
            <div className="grid grid-cols-2 gap-2">
              <QuickActionButton icon="UserPlus" label="Add Lead" onClick={() => onNavigate("crm")} />
              <QuickActionButton icon="Search" label="Search Student" onClick={() => onNavigate("counselor-student-360")} />
              <QuickActionButton icon="MessageCircle" label="Send WhatsApp" onClick={() => onNavigate("unified-inbox")} />
              <QuickActionButton icon="FileUp" label="Request Docs" onClick={() => toast({ title: "Request documents", description: "Opening document request template." })} />
              <QuickActionButton icon="FileText" label="Generate SOP/CV" onClick={() => onNavigate("sop-studio")} />
              <QuickActionButton icon="CalendarPlus" label="Schedule Appt" onClick={() => toast({ title: "Schedule appointment", description: "Appointment form coming up — pick student, time and channel." })} />
              <QuickActionButton icon="Mic" label="AI Interview" onClick={() => onNavigate("ai-interview")} />
              <QuickActionButton icon="Handshake" label="Partner Students" onClick={() => toast({ title: "Partner students", description: "Showing students referred by partners." })} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// QuickActionButton — small helper
// ============================================================
function QuickActionButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-[var(--alo-brand)]/15 bg-white p-3 text-center transition-all hover:border-[var(--alo-brand)]/40 hover:bg-[var(--alo-brand-light)]/50"
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
        <Icon name={icon} className="size-4" />
      </div>
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </button>
  );
}
export default CounselorDashboard;
