"use client";

/**
 * SLA & Counselor Performance — Fair governance surface.
 *
 * Capabilities:
 *  • SLA dashboard KPIs with CompletionRing for compliance %
 *  • SLA Policy table (channel/priority/student-type/SLA minutes)
 *  • Counselor performance table (breaches, exclusions, warnings — highlighted)
 *  • Pending Justifications (ApprovalCard) + Manager review dialog
 *  • Open Escalations timeline (acknowledge/resolve)
 *  • Fair Governance notice + exclusion-category legend
 *
 * APIs:
 *  GET  /api/communications/sla/dashboard
 *  GET  /api/communications/sla/policies
 *  POST /api/communications/sla/policies
 *  GET  /api/communications/sla/incidents
 *  GET  /api/communications/sla/justifications?status=PENDING
 *  POST /api/communications/sla/justifications/[id]/review
 *  GET  /api/communications/escalations?status=OPEN
 *  PATCH /api/communications/escalations/[id]
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Icon,
  PageHeader,
  KpiCard,
  SectionCard,
  EmptyState,
  ErrorState,
  LoadingGrid,
  Notification,
  StatusBadge,
  DataTable,
  CompletionRing,
  Timeline,
  type Column,
  type AccentColor,
  type TimelineItem,
} from "@/components/alo/ui";
import { ApprovalCard } from "@/components/alo/cards";
import { timeAgo, fmtDate } from "@/lib/alo-types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SlaDashboardStats {
  totalAssigned: number;
  responded: number;
  pending: number;
  overdue: number;
  slaCompliancePct: number;
  avgResponseTime: number; // minutes
  escalations: number;
  openEscalations: number;
  acknowledgedEscalations: number;
  justifications: {
    pending: number;
    accepted: number;
    total: number;
  };
  incidentCounters: number;
  totalBreaches: number;
  totalValidExclusions: number;
}

interface SlaPolicy {
  id: string;
  name: string;
  channel: string;
  priority: string;
  studentType: string;
  applicationStage: string;
  messageIntent: string;
  slaMinutes: number;
  warningMinutes: number;
  urgentMinutes: number;
  overdueMinutes: number;
  escalationMinutes: number;
  businessHoursOnly: boolean;
  holidayCalendar?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface SlaIncident {
  id: string;
  counselorId: string;
  period: string;
  totalAssigned: number;
  requiredResponses: number;
  slaBreaches: number;
  validExclusions: number;
  avgResponseTime: number;
  worstDelay: number;
  warningIssued: boolean;
  warningAt?: string | null;
  createdAt: string;
  counselor?: { id: string; name: string; role: string } | null;
}

interface SlaJustification {
  id: string;
  counselorId: string;
  slaEventId?: string | null;
  period: string;
  reason: string;
  category: string;
  explanation: string;
  evidence?: string | null;
  status: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

interface EscalationEvent {
  id: string;
  type: string;
  level: number;
  communicationId?: string | null;
  slaEventId?: string | null;
  studentId?: string | null;
  counselorId?: string | null;
  supervisorId?: string | null;
  message: string;
  actionTaken?: string | null;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CHANNEL_META: Record<string, { accent: AccentColor; icon: string; label: string }> = {
  WHATSAPP: { accent: "emerald", icon: "MessageCircle", label: "WhatsApp" },
  EMAIL: { accent: "violet", icon: "Mail", label: "Email" },
  SMS: { accent: "sky", icon: "MessageSquare", label: "SMS" },
  PHONE: { accent: "orange", icon: "Phone", label: "Phone" },
  PORTAL: { accent: "blue", icon: "Globe", label: "Portal" },
  SOCIAL: { accent: "rose", icon: "Share2", label: "Social" },
};

const PRIORITY_META: Record<string, { accent: AccentColor; label: string }> = {
  URGENT: { accent: "rose", label: "Urgent" },
  HIGH: { accent: "amber", label: "High" },
  NORMAL: { accent: "blue", label: "Normal" },
  LOW: { accent: "slate", label: "Low" },
};

const JUSTIFICATION_CATEGORY_META: Record<
  string,
  { accent: AccentColor; icon: string; label: string; description: string }
> = {
  STUDENT_UNAVAILABLE: {
    accent: "amber",
    icon: "UserX",
    label: "Student Unavailable",
    description: "Student did not respond despite reasonable attempts.",
  },
  UNIVERSITY_WAITING: {
    accent: "sky",
    icon: "Building2",
    label: "University Waiting",
    description: "Blocked on university response — out of counselor control.",
  },
  SYSTEM_ISSUE: {
    accent: "rose",
    icon: "ServerCrash",
    label: "System Issue",
    description: "Platform outage, webhook failure, or DB latency spike.",
  },
  WRONG_ASSIGNMENT: {
    accent: "violet",
    icon: "UserMinus",
    label: "Wrong Assignment",
    description: "Conversation routed to the wrong counselor initially.",
  },
  HIGH_WORKLOAD: {
    accent: "amber",
    icon: "Layers",
    label: "High Workload",
    description: "Spike in volume beyond capacity (with manager approval).",
  },
  EMERGENCY: {
    accent: "rose",
    icon: "Siren",
    label: "Emergency",
    description: "Personal or medical emergency with documentation.",
  },
  APPROVED_LEAVE: {
    accent: "sky",
    icon: "CalendarClock",
    label: "Approved Leave",
    description: "Approved annual/sick leave during the breach window.",
  },
  OTHER: {
    accent: "slate",
    icon: "Circle",
    label: "Other",
    description: "Reviewed case-by-case by manager.",
  },
};

const ESCALATION_TYPE_META: Record<string, { accent: AccentColor; icon: string }> = {
  SLA_WARNING: { accent: "amber", icon: "AlertTriangle" },
  SLA_URGENT: { accent: "orange", icon: "AlertCircle" },
  SLA_OVERDUE: { accent: "rose", icon: "Clock" },
  SLA_ESCALATION: { accent: "rose", icon: "AlertOctagon" },
  MISSED_RESPONSE: { accent: "rose", icon: "XCircle" },
  REPEATED_FAILURE: { accent: "rose", icon: "Repeat" },
};

function formatMinutes(min: number): string {
  if (!min || min <= 0) return "0m";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDateTime(d: string): string {
  try {
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function SlaPerformance() {
  const { toast } = useToast();
  const [stats, setStats] = React.useState<SlaDashboardStats | null>(null);
  const [policies, setPolicies] = React.useState<SlaPolicy[]>([]);
  const [incidents, setIncidents] = React.useState<SlaIncident[]>([]);
  const [justifications, setJustifications] = React.useState<SlaJustification[]>([]);
  const [escalations, setEscalations] = React.useState<EscalationEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialogs
  const [createPolicyOpen, setCreatePolicyOpen] = React.useState(false);
  const [reviewJustification, setReviewJustification] = React.useState<SlaJustification | null>(null);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, polRes, incRes, jusRes, escRes] = await Promise.all([
        fetch("/api/communications/sla/dashboard"),
        fetch("/api/communications/sla/policies"),
        fetch("/api/communications/sla/incidents"),
        fetch("/api/communications/sla/justifications?status=PENDING"),
        fetch("/api/communications/escalations?status=OPEN"),
      ]);
      if (!dashRes.ok) throw new Error("Failed to fetch SLA dashboard");
      const dashJson = await dashRes.json();
      const polJson = polRes.ok ? await polRes.json() : { policies: [] };
      const incJson = incRes.ok ? await incRes.json() : { incidents: [] };
      const jusJson = jusRes.ok ? await jusRes.json() : { justifications: [] };
      const escJson = escRes.ok ? await escRes.json() : { escalations: [] };
      setStats(dashJson.stats);
      setPolicies(polJson.policies || []);
      setIncidents(incJson.incidents || []);
      setJustifications(jusJson.justifications || []);
      setEscalations(escJson.escalations || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load SLA dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Escalation acknowledge / resolve handlers
  const handleEscalationAction = async (
    esc: EscalationEvent,
    action: "ACKNOWLEDGED" | "RESOLVED",
  ) => {
    try {
      const res = await fetch(`/api/communications/escalations/${esc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action,
          actionTaken:
            action === "RESOLVED"
              ? "Marked resolved by manager"
              : "Acknowledged by manager",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update escalation");
      toast({
        title: action === "ACKNOWLEDGED" ? "Escalation acknowledged" : "Escalation resolved",
        description: esc.message.slice(0, 80),
      });
      void fetchAll();
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.message || "Could not update escalation",
        variant: "destructive",
      });
    }
  };

  // Justification review handler
  const handleReviewSubmit = async (
    justificationId: string,
    decision: string,
    reviewNotes: string,
  ) => {
    try {
      const res = await fetch(
        `/api/communications/sla/justifications/${justificationId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewedBy: "manager-demo",
            decision,
            reviewNotes,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit review");
      toast({
        title: `Justification ${decision.toLowerCase().replace(/_/g, " ")}`,
        description: "Counselor has been notified of the decision.",
      });
      setReviewJustification(null);
      void fetchAll();
    } catch (e: any) {
      toast({
        title: "Review failed",
        description: e?.message || "Could not submit review",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="SLA & Counselor Performance"
          subtitle="Fair SLA governance with exclusions & justifications"
          icon="GaugeCircle"
        />
        <LoadingGrid count={6} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeader
          title="SLA & Counselor Performance"
          subtitle="Fair SLA governance with exclusions & justifications"
          icon="GaugeCircle"
        />
        <ErrorState
          title="Could not load SLA dashboard"
          description={error || "Unknown error"}
          onRetry={() => void fetchAll()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="SLA & Counselor Performance"
        subtitle="Fair SLA governance with exclusions & justifications"
        icon="GaugeCircle"
        action={
          <Button variant="alo" onClick={() => setCreatePolicyOpen(true)}>
            <Icon name="Plus" className="size-4" /> Create Policy
          </Button>
        }
      />

      {/* KPI row with CompletionRing for SLA compliance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* SLA Compliance ring */}
        <div className="rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-surface)] p-5 shadow-[var(--alo-shadow-sm)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="caption-text">SLA Compliance</p>
              <p className="mt-1 text-2xl font-bold text-[var(--alo-text)] tabular-nums">
                {stats.slaCompliancePct}%
              </p>
              <p className="mt-1 body-text text-[var(--alo-muted)]">
                {stats.responded} / {stats.totalAssigned} responded
              </p>
            </div>
            <CompletionRing value={stats.slaCompliancePct} size={72} />
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <KpiCard
            label="Avg Response Time"
            value={formatMinutes(stats.avgResponseTime)}
            icon="Timer"
            accent="amber"
          />
          <KpiCard
            label="Pending Responses"
            value={stats.pending}
            icon="Clock"
            accent="sky"
          />
          <KpiCard
            label="Overdue"
            value={stats.overdue}
            icon="AlertOctagon"
            accent="rose"
          />
          <KpiCard
            label="Escalations"
            value={stats.openEscalations}
            icon="AlertTriangle"
            accent="orange"
            hint={`${stats.acknowledgedEscalations} acknowledged`}
          />
        </div>

        {/* Justifications KPI */}
        <KpiCard
          label="Justifications Pending"
          value={stats.justifications.pending}
          icon="Scale"
          accent="violet"
          hint={`${stats.justifications.accepted} accepted · ${stats.totalBreaches} breaches · ${stats.totalValidExclusions} exclusions`}
        />
      </div>

      {/* Fair Governance Notice */}
      <Notification
        type="info"
        title="Fair SLA Governance"
        message={
          <div className="space-y-1">
            <p>
              SLA breaches exclude: <strong>provider outages</strong>,{" "}
              <strong>system outages</strong>, <strong>holidays</strong>,{" "}
              <strong>approved leave</strong>, <strong>incorrect assignments</strong>, and{" "}
              <strong>messages not requiring response</strong>.
            </p>
            <p className="text-xs opacity-90">
              Counselors are not penalized for system failures. Each breach is reviewed
              individually — counselors can submit a justification that managers approve or reject.
            </p>
          </div>
        }
      />

      {/* Exclusion Categories Legend */}
      <SectionCard
        title="Exclusion Categories"
        description="Valid reasons a breach is excluded from counselor performance scoring"
        icon="ShieldCheck"
        accent="emerald"
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(JUSTIFICATION_CATEGORY_META).map(([key, meta]) => (
            <div
              key={key}
              className="flex items-start gap-2.5 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3"
            >
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md",
                  `bg-[var(--alo-${meta.accent === "emerald" ? "success" : meta.accent === "amber" ? "warning" : meta.accent === "rose" ? "danger" : meta.accent === "sky" ? "info" : meta.accent === "blue" ? "blue" : meta.accent === "orange" ? "orange" : "surface-muted"}-soft)]`,
                  `text-[var(--alo-${meta.accent === "emerald" ? "success" : meta.accent === "amber" ? "warning" : meta.accent === "rose" ? "danger" : meta.accent === "sky" ? "info" : meta.accent === "blue" ? "blue" : meta.accent === "orange" ? "orange" : "text-secondary"}-strong)]`,
                )}
              >
                <Icon name={meta.icon} className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--alo-text)]">{meta.label}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-[var(--alo-muted)]">
                  {meta.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Pending Justifications */}
      <PendingJustifications
        justifications={justifications}
        onView={(j) => setReviewJustification(j)}
      />

      {/* SLA Policies Table */}
      <SlaPoliciesTable policies={policies} />

      {/* Counselor Performance Table */}
      <CounselorPerformanceTable incidents={incidents} />

      {/* Escalation Feed */}
      <EscalationFeed
        escalations={escalations}
        onAcknowledge={(e) => handleEscalationAction(e, "ACKNOWLEDGED")}
        onResolve={(e) => handleEscalationAction(e, "RESOLVED")}
      />

      {/* Create Policy Dialog */}
      <CreatePolicyDialog
        open={createPolicyOpen}
        onOpenChange={setCreatePolicyOpen}
        onCreated={() => {
          toast({
            title: "SLA Policy created",
            description: "The new SLA policy is now active.",
          });
          void fetchAll();
        }}
      />

      {/* Review Justification Dialog */}
      <ReviewJustificationDialog
        justification={reviewJustification}
        onOpenChange={(o) => !o && setReviewJustification(null)}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Pending Justifications (ApprovalCard grid)
// ─────────────────────────────────────────────────────────────────────────────

function PendingJustifications({
  justifications,
  onView,
}: {
  justifications: SlaJustification[];
  onView: (j: SlaJustification) => void;
}) {
  if (justifications.length === 0) {
    return (
      <SectionCard
        title="Pending Justifications"
        description="Counselor-submitted explanations awaiting manager review"
        icon="Scale"
        accent="violet"
      >
        <EmptyState
          icon="Scale"
          title="No pending justifications"
          description="When a counselor submits a justification for a breach, it appears here for manager review."
          accent="violet"
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Pending Justifications"
      description={`${justifications.length} counselor-submitted explanations awaiting manager review`}
      icon="Scale"
      accent="violet"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {justifications.map((j) => {
          const cat = JUSTIFICATION_CATEGORY_META[j.category] || JUSTIFICATION_CATEGORY_META.OTHER;
          return (
            <ApprovalCard
              key={j.id}
              title={j.reason}
              description={j.explanation}
              priority="medium"
              metadata={[
                { label: "Counselor", value: j.counselorId.slice(-6) },
                { label: "Period", value: j.period },
                { label: "Submitted", value: timeAgo(j.createdAt) },
                { label: "SLA Event", value: j.slaEventId ? j.slaEventId.slice(-6) : "—" },
              ]}
              onView={() => onView(j)}
            />
          );
        })}
      </div>

      {/* Category badges summary */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="caption-text text-[var(--alo-muted)]">Categories:</span>
        {Object.entries(
          justifications.reduce<Record<string, number>>((acc, j) => {
            acc[j.category] = (acc[j.category] || 0) + 1;
            return acc;
          }, {}),
        ).map(([cat, count]) => {
          const meta = JUSTIFICATION_CATEGORY_META[cat] || JUSTIFICATION_CATEGORY_META.OTHER;
          return (
            <Badge key={cat} variant="neutral" className="gap-1 text-[10px]">
              <Icon name={meta.icon} className="size-3" />
              {meta.label} · {count}
            </Badge>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: SLA Policies Table
// ─────────────────────────────────────────────────────────────────────────────

function SlaPoliciesTable({ policies }: { policies: SlaPolicy[] }) {
  if (policies.length === 0) {
    return (
      <SectionCard
        title="SLA Policies"
        description="Channel / priority / student-type routing rules"
        icon="BookOpen"
        accent="blue"
      >
        <EmptyState
          icon="BookOpen"
          title="No SLA policies configured"
          description="Create your first SLA policy to start governing response-time rules per channel."
          accent="blue"
        />
      </SectionCard>
    );
  }

  const columns: Column<SlaPolicy>[] = [
    {
      key: "channel",
      header: "Channel",
      cell: (r) => {
        const meta = CHANNEL_META[r.channel] || {
          accent: "slate" as AccentColor,
          icon: "Radio",
          label: r.channel,
        };
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <Icon name={meta.icon} className="size-3.5" />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "priority",
      header: "Priority",
      cell: (r) => (
        <StatusBadge
          status={r.priority}
          colorMap={{
            URGENT: "rose",
            HIGH: "amber",
            NORMAL: "blue",
            LOW: "slate",
          }}
          labels={Object.fromEntries(
            Object.entries(PRIORITY_META).map(([k, v]) => [k, v.label]),
          )}
        />
      ),
    },
    {
      key: "studentType",
      header: "Student Type",
      cell: (r) => (
        <Badge variant="neutral" className="text-[10px]">
          {r.studentType}
        </Badge>
      ),
    },
    {
      key: "slaMinutes",
      header: "SLA",
      sortable: true,
      sortAccessor: (r) => r.slaMinutes,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-[var(--alo-blue-strong)]">
          {formatMinutes(r.slaMinutes)}
        </span>
      ),
    },
    {
      key: "warningMinutes",
      header: "Warning",
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--alo-warning-strong)]">
          {formatMinutes(r.warningMinutes)}
        </span>
      ),
    },
    {
      key: "urgentMinutes",
      header: "Urgent",
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--alo-orange-strong)]">
          {formatMinutes(r.urgentMinutes)}
        </span>
      ),
    },
    {
      key: "overdueMinutes",
      header: "Overdue",
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--alo-danger-strong)]">
          {formatMinutes(r.overdueMinutes)}
        </span>
      ),
    },
    {
      key: "escalationMinutes",
      header: "Escalation",
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--alo-danger-strong)]">
          {formatMinutes(r.escalationMinutes)}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Active",
      cell: (r) => (
        <StatusBadge
          status={r.isActive ? "ACTIVE" : "INACTIVE"}
          colorMap={{ ACTIVE: "emerald", INACTIVE: "slate" }}
          labels={{ ACTIVE: "Active", INACTIVE: "Inactive" }}
        />
      ),
    },
  ];

  return (
    <SectionCard
      title="SLA Policies"
      description="Channel / priority / student-type routing rules with warning → urgent → overdue → escalation tiers"
      icon="BookOpen"
      accent="blue"
    >
      <DataTable columns={columns} data={policies} pageSize={10} emptyMessage="No policies configured" />
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Counselor Performance Table
// ─────────────────────────────────────────────────────────────────────────────

function CounselorPerformanceTable({ incidents }: { incidents: SlaIncident[] }) {
  if (incidents.length === 0) {
    return (
      <SectionCard
        title="Counselor Performance"
        description="Per-counselor SLA incident counters with breaches, exclusions & warnings"
        icon="Users"
        accent="orange"
      >
        <EmptyState
          icon="Users"
          title="No counselor performance records"
          description="Once SLA events accumulate, per-counselor incident counters will appear here."
          accent="orange"
        />
      </SectionCard>
    );
  }

  const columns: Column<SlaIncident>[] = [
    {
      key: "counselor",
      header: "Counselor",
      sortable: true,
      sortAccessor: (r) => r.counselor?.name || r.counselorId,
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-[10px] font-bold",
              r.warningIssued
                ? "bg-[var(--alo-danger-soft)] text-[var(--alo-danger-strong)]"
                : "bg-[var(--alo-blue-soft)] text-[var(--alo-blue-strong)]",
            )}
          >
            {(r.counselor?.name || "C").charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[var(--alo-text)]">
              {r.counselor?.name || `Counselor ${r.counselorId.slice(-6)}`}
            </p>
            <p className="text-[10px] text-[var(--alo-muted)]">
              {r.counselor?.role || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "period",
      header: "Period",
      sortable: true,
      sortAccessor: (r) => r.period,
      cell: (r) => <span className="font-mono text-xs">{r.period}</span>,
    },
    {
      key: "totalAssigned",
      header: "Assigned",
      sortable: true,
      sortAccessor: (r) => r.totalAssigned,
      cell: (r) => <span className="font-mono text-xs">{r.totalAssigned}</span>,
    },
    {
      key: "requiredResponses",
      header: "Required",
      sortable: true,
      sortAccessor: (r) => r.requiredResponses,
      cell: (r) => <span className="font-mono text-xs">{r.requiredResponses}</span>,
    },
    {
      key: "slaBreaches",
      header: "Breaches",
      sortable: true,
      sortAccessor: (r) => r.slaBreaches,
      cell: (r) => (
        <span
          className={cn(
            "font-mono text-xs font-semibold",
            r.slaBreaches > 0 ? "text-[var(--alo-danger-strong)]" : "text-[var(--alo-success-strong)]",
          )}
        >
          {r.slaBreaches}
        </span>
      ),
    },
    {
      key: "validExclusions",
      header: "Exclusions",
      sortable: true,
      sortAccessor: (r) => r.validExclusions,
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--alo-info-strong)]">
          {r.validExclusions}
        </span>
      ),
    },
    {
      key: "avgResponseTime",
      header: "Avg Response",
      sortable: true,
      sortAccessor: (r) => r.avgResponseTime,
      cell: (r) => (
        <span className="font-mono text-xs">{formatMinutes(r.avgResponseTime)}</span>
      ),
    },
    {
      key: "worstDelay",
      header: "Worst Delay",
      sortable: true,
      sortAccessor: (r) => r.worstDelay,
      cell: (r) => (
        <span
          className={cn(
            "font-mono text-xs",
            r.worstDelay > 60
              ? "text-[var(--alo-danger-strong)]"
              : r.worstDelay > 30
                ? "text-[var(--alo-warning-strong)]"
                : "text-[var(--alo-text)]",
          )}
        >
          {formatMinutes(r.worstDelay)}
        </span>
      ),
    },
    {
      key: "warningIssued",
      header: "Warning",
      cell: (r) =>
        r.warningIssued ? (
          <Badge variant="danger" className="gap-1 text-[10px]">
            <Icon name="AlertOctagon" className="size-3" />
            Issued
          </Badge>
        ) : (
          <Badge variant="neutral" className="text-[10px]">
            None
          </Badge>
        ),
    },
  ];

  return (
    <SectionCard
      title="Counselor Performance"
      description="Per-counselor incident counters — rows highlighted red have active warnings"
      icon="Users"
      accent="orange"
    >
      <DataTable
        columns={columns}
        data={incidents}
        pageSize={10}
        emptyMessage="No incident counters"
      />
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Escalation Feed (Timeline)
// ─────────────────────────────────────────────────────────────────────────────

function EscalationFeed({
  escalations,
  onAcknowledge,
  onResolve,
}: {
  escalations: EscalationEvent[];
  onAcknowledge: (e: EscalationEvent) => void;
  onResolve: (e: EscalationEvent) => void;
}) {
  if (escalations.length === 0) {
    return (
      <SectionCard
        title="Open Escalations"
        description="SLA breaches that triggered an escalation — acknowledge or resolve"
        icon="AlertTriangle"
        accent="rose"
      >
        <EmptyState
          icon="AlertTriangle"
          title="No open escalations"
          description="When a SLA breach escalates beyond the warning tier, it appears here for manager attention."
          accent="rose"
        />
      </SectionCard>
    );
  }

  const items: TimelineItem[] = escalations.map((e) => {
    const meta = ESCALATION_TYPE_META[e.type] || { accent: "rose" as AccentColor, icon: "AlertTriangle" };
    const levelAccent: AccentColor =
      e.level >= 3 ? "rose" : e.level === 2 ? "orange" : "amber";
    return {
      id: e.id,
      title: `${e.type.replace(/_/g, " ")} · Level ${e.level}`,
      description: e.message,
      timestamp: e.createdAt,
      icon: meta.icon,
      accent: levelAccent,
    };
  });

  return (
    <SectionCard
      title="Open Escalations"
      description={`${escalations.length} escalations awaiting acknowledgement or resolution`}
      icon="AlertTriangle"
      accent="rose"
    >
      <div className="space-y-4">
        <Timeline items={items} />
        <div className="space-y-2 border-t border-[var(--alo-border)] pt-4">
          {escalations.map((e) => (
            <div
              key={e.id}
              className="flex flex-col gap-2 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="danger" className="text-[10px]">
                    {e.type.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="neutral" className="text-[10px]">
                    Level {e.level}
                  </Badge>
                  <span className="text-[10px] text-[var(--alo-muted)]">
                    {timeAgo(e.createdAt)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-[var(--alo-text-secondary)]">
                  {e.message}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {e.status === "OPEN" && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onAcknowledge(e)}
                    className="h-7 border-[var(--alo-warning)] text-[var(--alo-warning-strong)] hover:bg-[var(--alo-warning-soft)]"
                  >
                    <Icon name="Bell" className="size-3" />
                    Acknowledge
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onResolve(e)}
                  className="h-7 border-[var(--alo-success)] text-[var(--alo-success-strong)] hover:bg-[var(--alo-success-soft)]"
                >
                  <Icon name="CheckCircle2" className="size-3" />
                  Resolve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Create Policy Dialog
// ─────────────────────────────────────────────────────────────────────────────

function CreatePolicyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    name: "",
    channel: "WHATSAPP",
    priority: "NORMAL",
    studentType: "ALL",
    applicationStage: "ALL",
    messageIntent: "ALL",
    slaMinutes: 30,
    warningMinutes: 20,
    urgentMinutes: 28,
    overdueMinutes: 30,
    escalationMinutes: 45,
    businessHoursOnly: false,
    isActive: true,
  });
  const [saving, setSaving] = React.useState(false);

  const reset = () => {
    setForm({
      name: "",
      channel: "WHATSAPP",
      priority: "NORMAL",
      studentType: "ALL",
      applicationStage: "ALL",
      messageIntent: "ALL",
      slaMinutes: 30,
      warningMinutes: 20,
      urgentMinutes: 28,
      overdueMinutes: 30,
      escalationMinutes: 45,
      businessHoursOnly: false,
      isActive: true,
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({
        title: "Policy name required",
        description: "Give this SLA policy a descriptive name.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/communications/sla/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create policy");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast({
        title: "Could not create policy",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!saving) {
          if (!o) reset();
          onOpenChange(o);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="BookOpen" className="size-5 text-[var(--alo-blue)]" />
            Create SLA Policy
          </DialogTitle>
          <DialogDescription>
            Define response-time rules for a channel / priority / student-type combination.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-xs">Policy name *</Label>
            <Input
              placeholder="e.g. WhatsApp — High priority VIP students"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10"
            />
          </div>

          {/* Channel / Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Channel</Label>
              <Select
                value={form.channel}
                onValueChange={(v) => setForm({ ...form, channel: v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHANNEL_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student type / Application stage / Message intent */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">Student Type</Label>
              <Select
                value={form.studentType}
                onValueChange={(v) => setForm({ ...form, studentType: v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="EXISTING">Existing</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Application Stage</Label>
              <Select
                value={form.applicationStage}
                onValueChange={(v) => setForm({ ...form, applicationStage: v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="LEAD">Lead</SelectItem>
                  <SelectItem value="APPLICATION">Application</SelectItem>
                  <SelectItem value="VISA">Visa</SelectItem>
                  <SelectItem value="CAS">CAS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Message Intent</Label>
              <Select
                value={form.messageIntent}
                onValueChange={(v) => setForm({ ...form, messageIntent: v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="DOCUMENT_REQUIREMENT">Document Requirement</SelectItem>
                  <SelectItem value="PAYMENT">Payment</SelectItem>
                  <SelectItem value="VISA">Visa</SelectItem>
                  <SelectItem value="INTERVIEW">Interview</SelectItem>
                  <SelectItem value="URGENT_ISSUE">Urgent Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SLA timing grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-[11px]">SLA (min)</Label>
              <Input
                type="number"
                min={1}
                value={form.slaMinutes}
                onChange={(e) => setForm({ ...form, slaMinutes: Number(e.target.value) })}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Warning</Label>
              <Input
                type="number"
                min={1}
                value={form.warningMinutes}
                onChange={(e) => setForm({ ...form, warningMinutes: Number(e.target.value) })}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Urgent</Label>
              <Input
                type="number"
                min={1}
                value={form.urgentMinutes}
                onChange={(e) => setForm({ ...form, urgentMinutes: Number(e.target.value) })}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Overdue</Label>
              <Input
                type="number"
                min={1}
                value={form.overdueMinutes}
                onChange={(e) => setForm({ ...form, overdueMinutes: Number(e.target.value) })}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Escalation</Label>
              <Input
                type="number"
                min={1}
                value={form.escalationMinutes}
                onChange={(e) => setForm({ ...form, escalationMinutes: Number(e.target.value) })}
                className="h-9"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.businessHoursOnly}
                onChange={(e) => setForm({ ...form, businessHoursOnly: e.target.checked })}
                className="size-4"
              />
              Business hours only
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="size-4"
              />
              Active immediately
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (!saving) {
                reset();
                onOpenChange(false);
              }
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button variant="alo" onClick={handleSave} disabled={saving}>
            <Icon name="Save" className="size-3.5" />
            {saving ? "Saving…" : "Create Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Review Justification Dialog
// ─────────────────────────────────────────────────────────────────────────────

function ReviewJustificationDialog({
  justification,
  onOpenChange,
  onSubmit,
}: {
  justification: SlaJustification | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (id: string, decision: string, notes: string) => void;
}) {
  const [decision, setDecision] = React.useState<string>("ACCEPTED");
  const [reviewNotes, setReviewNotes] = React.useState<string>("");

  React.useEffect(() => {
    if (justification) {
      setDecision("ACCEPTED");
      setReviewNotes("");
    }
  }, [justification]);

  if (!justification) return null;

  const cat = JUSTIFICATION_CATEGORY_META[justification.category] || JUSTIFICATION_CATEGORY_META.OTHER;

  return (
    <Dialog open={!!justification} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Scale" className="size-5 text-[var(--alo-violet)]" />
            Review Justification
          </DialogTitle>
          <DialogDescription>
            Manager review — accept, reject, or request clarification from the counselor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reason + Category */}
          <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="caption-text">Reason</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--alo-text)]">
                  {justification.reason}
                </p>
              </div>
              <Badge
                variant="neutral"
                className="gap-1 text-[10px]"
              >
                <Icon name={cat.icon} className="size-3" />
                {cat.label}
              </Badge>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-1">
            <p className="caption-text">Counselor explanation</p>
            <p className="body-text text-[var(--alo-text-secondary)]">
              {justification.explanation}
            </p>
          </div>

          {/* Evidence */}
          {justification.evidence && (
            <div className="space-y-1">
              <p className="caption-text">Evidence</p>
              <p className="body-text text-[var(--alo-text-secondary)]">
                {justification.evidence}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md border border-[var(--alo-border)] p-2.5">
              <p className="caption-text">Counselor</p>
              <p className="mt-0.5 font-mono text-[var(--alo-blue-strong)]">
                {justification.counselorId.slice(-6)}
              </p>
            </div>
            <div className="rounded-md border border-[var(--alo-border)] p-2.5">
              <p className="caption-text">Period</p>
              <p className="mt-0.5 font-mono text-[var(--alo-text)]">{justification.period}</p>
            </div>
            <div className="rounded-md border border-[var(--alo-border)] p-2.5">
              <p className="caption-text">Submitted</p>
              <p className="mt-0.5 text-[var(--alo-text)]">{timeAgo(justification.createdAt)}</p>
            </div>
          </div>

          {/* Manager Review form */}
          <div className="space-y-3 rounded-lg border border-[var(--alo-violet)]/30 bg-violet-50/40 p-3">
            <p className="caption-text text-[var(--alo-violet)]">Manager Review</p>

            <div className="space-y-2">
              <Label className="text-xs">Decision *</Label>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCEPTED">Accept — exclusion valid</SelectItem>
                  <SelectItem value="REJECTED">Reject — breach stands</SelectItem>
                  <SelectItem value="CLARIFICATION_REQUESTED">
                    Request clarification
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Review notes</Label>
              <Textarea
                rows={3}
                placeholder="Optional notes for the counselor…"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={decision === "REJECTED" ? "destructive" : "alo"}
            onClick={() => onSubmit(justification.id, decision, reviewNotes)}
          >
            <Icon name="Gavel" className="size-3.5" />
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default SlaPerformance;
