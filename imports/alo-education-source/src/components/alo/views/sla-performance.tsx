"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  SectionCard,
  EmptyState,
  LoadingGrid,
  CompletionRing,
  InfoRow,
} from "@/components/alo/shared";
import {
  DataTable,
  type DataTableColumn,
  Timeline,
  Notification,
  Pill,
  fetchJson,
  fmtDateTime,
  fmtMinutes,
  timeAgoShort,
  TASK_STATUS_COLORS,
} from "@/components/alo/comm-helpers";

// ─── Types ────────────────────────────────────────────────────────────────

interface SlaSummary {
  totalAssigned: number;
  totalResponded: number;
  pending: number;
  overdue: number;
  slaCompliancePct: number;
  avgResponseTimeSeconds: number;
  escalations: number;
  justificationsPending: number;
  justificationsAccepted: number;
  totalSlaBreaches: number;
  totalValidExclusions: number;
}

interface SlaPolicy {
  id: string;
  name: string;
  channel: string;
  priority?: string | null;
  studentType?: string | null;
  applicationStage?: string | null;
  messageIntent?: string | null;
  slaMinutes?: number | null;
  warningMinutes?: number | null;
  urgentMinutes?: number | null;
  overdueMinutes?: number | null;
  escalationMinutes?: number | null;
  businessHoursOnly?: boolean | null;
  holidayCalendar?: string | null;
  isActive: boolean;
  updatedAt: string;
}

interface SlaIncident {
  id: string;
  counselorId?: string | null;
  counselorName?: string | null;
  period?: string | null;
  totalAssigned?: number | null;
  totalResponded?: number | null;
  slaBreaches?: number | null;
  validExclusions?: number | null;
  warningIssued?: boolean | null;
  lastBreachAt?: string | null;
  updatedAt: string;
}

interface SlaJustification {
  id: string;
  counselorId: string;
  period: string;
  reason: string;
  category: string;
  explanation: string;
  evidence?: string | null;
  status: string;
  reviewNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

interface Escalation {
  id: string;
  type: string;
  level?: number | null;
  message: string;
  status: string;
  actionTaken?: string | null;
  studentId?: string | null;
  counselorId?: string | null;
  createdAt: string;
}

// ─── Main Component ────────────────────────────────────────────────────────

export function SlaPerformance() {
  const { toast } = useToast();
  const [summary, setSummary] = React.useState<SlaSummary | null>(null);
  const [policies, setPolicies] = React.useState<SlaPolicy[]>([]);
  const [incidents, setIncidents] = React.useState<SlaIncident[]>([]);
  const [justifications, setJustifications] = React.useState<SlaJustification[]>([]);
  const [escalations, setEscalations] = React.useState<Escalation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [createPolicyOpen, setCreatePolicyOpen] = React.useState(false);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [dashRes, polRes, incRes, jusRes, escRes] = await Promise.all([
        fetchJson<{ summary: SlaSummary }>("/api/communications/sla/dashboard"),
        fetchJson<{ policies: SlaPolicy[] }>("/api/communications/sla/policies"),
        fetchJson<{ incidents: SlaIncident[] }>("/api/communications/sla/incidents"),
        fetchJson<{ justifications: SlaJustification[] }>(
          "/api/communications/sla/justifications?status=PENDING"
        ),
        fetchJson<{ escalations: Escalation[] }>(
          "/api/communications/escalations?status=OPEN"
        ),
      ]);
      setSummary(dashRes.summary);
      setPolicies(polRes.policies || []);
      setIncidents(incRes.incidents || []);
      setJustifications(jusRes.justifications || []);
      setEscalations(escRes.escalations || []);
    } catch (err) {
      console.error("[sla-performance]", err);
      setError(true);
      toast({
        title: "Failed to load SLA data",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="SLA & Counselor Performance" subtitle="Monitor SLA compliance, counselor performance, and fairly review justifications." icon="Gauge" />
        <LoadingGrid count={5} />
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="space-y-6">
        <PageHeader title="SLA & Counselor Performance" subtitle="Monitor SLA compliance, counselor performance, and fairly review justifications." icon="Gauge" />
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-[#991B1B]">Failed to load SLA data</p>
          <Button onClick={() => void fetchAll()} className="mt-3" size="sm">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA & Counselor Performance"
        subtitle="Monitor SLA compliance, counselor performance, and fairly review justifications."
        icon="Gauge"
        action={
          <Button
            variant="outline"
            className="h-10 border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
            onClick={() => void fetchAll()}
          >
            <Icon name="RefreshCw" className="mr-2 size-4" />
            Refresh
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 alo-shadow">
          <div className="flex items-center gap-4">
            <CompletionRing value={summary?.slaCompliancePct ?? 0} size={68} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">SLA Compliance</p>
              <p className="text-xs text-[#475569]">
                {summary?.totalResponded ?? 0}/{summary?.totalAssigned ?? 0} responded
              </p>
            </div>
          </div>
        </div>
        <KpiCard label="Avg Response" value={fmtMinutes(summary?.avgResponseTimeSeconds)} icon="Timer" accent="blue" />
        <KpiCard label="Pending" value={summary?.pending ?? 0} icon="Clock" accent="amber" />
        <KpiCard label="Overdue" value={summary?.overdue ?? 0} icon="AlertTriangle" accent="rose" />
        <KpiCard label="Escalations" value={escalations.length} icon="AlertOctagon" accent="violet" />
        <KpiCard label="Justifications Pending" value={justifications.length} icon="Scale" accent="orange" />
      </div>

      {/* Fair governance notice */}
      <Notification
        type="info"
        title="Fair SLA Governance"
        description="SLA breaches are tracked for accountability — but we recognize not every late reply is a counselor's fault. Justifications are reviewed by managers, and valid exclusions (system downtime, weekends, holidays, emergencies) are honored. Use the Pending Justifications section below to review requests fairly."
        icon="Scale"
      />

      {/* SLA Policies */}
      <SectionCard
        title="SLA Policies"
        description="Response time targets per channel, priority, and student stage"
        icon="ListChecks"
        action={
          <Button
            onClick={() => setCreatePolicyOpen(true)}
            className="h-9 bg-[#0057B8] text-white hover:bg-[#003a7a]"
          >
            <Icon name="Plus" className="mr-1.5 size-4" />
            New Policy
          </Button>
        }
      >
        <PoliciesTable policies={policies} />
      </SectionCard>

      {/* Counselor Performance */}
      <SectionCard
        title="Counselor Performance"
        description="Per-counselor SLA incident counters — rows with warnings are highlighted"
        icon="Users"
      >
        <IncidentsTable incidents={incidents} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Justifications */}
        <SectionCard
          title="Pending Justifications"
          description="Counselor-submitted reasons for SLA breaches — review fairly"
          icon="Scale"
        >
          {justifications.length === 0 ? (
            <EmptyState
              icon="CheckCircle2"
              title="No pending justifications"
              description="All counselor SLA justifications have been reviewed."
            />
          ) : (
            <div className="space-y-3">
              {justifications.map((j) => (
                <JustificationCard
                  key={j.id}
                  justification={j}
                  onReview={(decision, notes) =>
                    void reviewJustification(j.id, decision, notes)
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Escalation Feed */}
        <SectionCard
          title="Escalation Feed"
          description="Open escalations timeline"
          icon="AlertOctagon"
        >
          {escalations.length === 0 ? (
            <EmptyState
              icon="ShieldCheck"
              title="No open escalations"
              description="Escalations will appear here when SLA thresholds are breached."
            />
          ) : (
            <Timeline
              items={escalations.slice(0, 12).map((e) => ({
                id: e.id,
                title: `${e.type.replace(/_/g, " ")} (Level ${e.level ?? 1})`,
                description: e.message,
                timestamp: timeAgoShort(e.createdAt),
                accent: e.status === "OPEN" ? "rose" : "amber",
                meta: e.status,
              }))}
            />
          )}
        </SectionCard>
      </div>

      <CreatePolicyDialog
        open={createPolicyOpen}
        onOpenChange={setCreatePolicyOpen}
        onCreated={() => void fetchAll()}
      />
    </div>
  );

  async function reviewJustification(id: string, decision: "ACCEPTED" | "REJECTED" | "CLARIFICATION_REQUESTED", notes: string) {
    try {
      await fetchJson(`/api/communications/sla/justifications/${id}/review`, {
        method: "POST",
        body: JSON.stringify({
          reviewedBy: "manager-placeholder",
          decision,
          reviewNotes: notes,
        }),
      });
      toast({
        title: `Justification ${decision.toLowerCase().replace(/_/g, " ")}`,
        description: "Decision recorded.",
      });
      setJustifications((j) => j.filter((x) => x.id !== id));
    } catch (err) {
      toast({
        title: "Failed to review justification",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  accent: "blue" | "orange" | "emerald" | "amber" | "violet" | "rose";
}) {
  const accentMap: Record<string, string> = {
    blue: "bg-[#EFF6FF] text-[#0057B8]",
    orange: "bg-[#FFF7ED] text-[#C2410C]",
    emerald: "bg-[#DCFCE7] text-[#15803D]",
    amber: "bg-[#FEF3C7] text-[#92400E]",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-[#FEE2E2] text-[#991B1B]",
  };
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 alo-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">{label}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[#0F172A] sm:text-xl">{value}</p>
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", accentMap[accent])}>
          <Icon name={icon} className="size-4" />
        </span>
      </div>
    </div>
  );
}

function PoliciesTable({ policies }: { policies: SlaPolicy[] }) {
  const columns: DataTableColumn<SlaPolicy>[] = [
    {
      key: "name",
      header: "Name",
      render: (p) => (
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">{p.name}</p>
          <p className="text-[11px] text-[#64748B]">{p.channel}</p>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (p) => (
        <span className="text-xs">{p.priority || "NORMAL"}</span>
      ),
    },
    {
      key: "scope",
      header: "Scope",
      render: (p) => (
        <span className="text-xs text-[#475569]">
          {p.studentType || "ALL"} / {p.applicationStage || "ALL"}
        </span>
      ),
    },
    {
      key: "slaMinutes",
      header: "SLA",
      render: (p) => <span className="text-xs tabular-nums">{p.slaMinutes ?? "—"}m</span>,
    },
    {
      key: "warningMinutes",
      header: "Warning",
      render: (p) => <span className="text-xs tabular-nums">{p.warningMinutes ?? "—"}m</span>,
    },
    {
      key: "escalationMinutes",
      header: "Escalation",
      render: (p) => <span className="text-xs tabular-nums">{p.escalationMinutes ?? "—"}m</span>,
    },
    {
      key: "isActive",
      header: "Status",
      render: (p) => (
        <Pill
          className={p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}
        >
          {p.isActive ? "Active" : "Inactive"}
        </Pill>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (p) => <span className="text-xs">{timeAgoShort(p.updatedAt)}</span>,
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={policies}
      rowKey={(p) => p.id}
      emptyTitle="No SLA policies"
      emptyDescription="Create an SLA policy to define response time targets per channel."
      emptyIcon="ListChecks"
      maxHeight="420px"
    />
  );
}

function IncidentsTable({ incidents }: { incidents: SlaIncident[] }) {
  const columns: DataTableColumn<SlaIncident>[] = [
    {
      key: "counselorName",
      header: "Counselor",
      render: (i) => (
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">
            {i.counselorName || "Unknown"}
          </p>
          <p className="text-[11px] text-[#64748B]">{i.counselorId?.slice(0, 8) || "—"}</p>
        </div>
      ),
    },
    {
      key: "period",
      header: "Period",
      render: (i) => <span className="text-xs">{i.period || "—"}</span>,
    },
    {
      key: "totalAssigned",
      header: "Assigned",
      render: (i) => <span className="text-xs tabular-nums">{i.totalAssigned ?? 0}</span>,
    },
    {
      key: "totalResponded",
      header: "Responded",
      render: (i) => <span className="text-xs tabular-nums">{i.totalResponded ?? 0}</span>,
    },
    {
      key: "slaBreaches",
      header: "Breaches",
      render: (i) => (
        <span className={cn("text-xs font-bold tabular-nums", (i.slaBreaches ?? 0) > 0 && "text-rose-600")}>
          {i.slaBreaches ?? 0}
        </span>
      ),
    },
    {
      key: "validExclusions",
      header: "Exclusions",
      render: (i) => <span className="text-xs tabular-nums">{i.validExclusions ?? 0}</span>,
    },
    {
      key: "warningIssued",
      header: "Warning",
      render: (i) =>
        i.warningIssued ? (
          <Pill className="bg-rose-100 text-rose-700">Issued</Pill>
        ) : (
          <Pill className="bg-emerald-100 text-emerald-700">OK</Pill>
        ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={incidents}
      rowKey={(i) => i.id}
      rowClassName={(i) => (i.warningIssued ? "border-l-4 border-l-rose-500 bg-rose-50/30" : "")}
      emptyTitle="No SLA incidents"
      emptyDescription="Per-counselor SLA counters will appear here once messages are processed."
      emptyIcon="Users"
      maxHeight="420px"
    />
  );
}

function JustificationCard({
  justification,
  onReview,
}: {
  justification: SlaJustification;
  onReview: (decision: "ACCEPTED" | "REJECTED" | "CLARIFICATION_REQUESTED", notes: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 transition-all hover:border-[#0057B8]/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0F172A]">
            {justification.reason}
          </p>
          <p className="text-[11px] text-[#64748B]">
            Category: {justification.category} · Period: {justification.period}
          </p>
        </div>
        <Pill className={TASK_STATUS_COLORS[justification.status] || "bg-amber-100 text-amber-700"}>
          {justification.status.toLowerCase()}
        </Pill>
      </div>
      <p className="mt-2 line-clamp-3 text-xs text-[#475569]">{justification.explanation}</p>
      {justification.evidence && (
        <p className="mt-1 text-[11px] text-[#64748B]">
          <Icon name="Paperclip" className="mr-1 inline size-3" />
          Evidence provided
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-[#94A3B8]">Submitted {timeAgoShort(justification.createdAt)}</span>
        <Button
          size="sm"
          className="h-8 bg-[#0057B8] text-[11px] hover:bg-[#003a7a]"
          onClick={() => setOpen(true)}
        >
          <Icon name="Scale" className="mr-1.5 size-3.5" />
          Review
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manager Review</DialogTitle>
            <DialogDescription>
              Review this SLA justification fairly. Valid exclusions (system downtime, holidays, emergencies) should be accepted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <InfoRow label="Reason" value={justification.reason} />
            <InfoRow label="Category" value={justification.category} />
            <InfoRow label="Period" value={justification.period} />
            <div>
              <p className="text-xs font-semibold text-[#64748B]">Explanation</p>
              <p className="mt-1 text-xs text-[#0F172A]">{justification.explanation}</p>
            </div>
            {justification.evidence && (
              <div>
                <p className="text-xs font-semibold text-[#64748B]">Evidence</p>
                <p className="mt-1 text-xs text-[#0F172A]">{justification.evidence}</p>
              </div>
            )}
            <div>
              <Label htmlFor="review-notes">Review Notes</Label>
              <Textarea
                id="review-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for the counselor"
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={() => {
                onReview("CLARIFICATION_REQUESTED", notes);
                setOpen(false);
              }}
            >
              Ask for Clarification
            </Button>
            <Button
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50"
              onClick={() => {
                onReview("REJECTED", notes);
                setOpen(false);
              }}
            >
              Reject
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => {
                onReview("ACCEPTED", notes);
                setOpen(false);
              }}
            >
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  const [name, setName] = React.useState("");
  const [channel, setChannel] = React.useState("WHATSAPP");
  const [priority, setPriority] = React.useState("NORMAL");
  const [studentType, setStudentType] = React.useState("ALL");
  const [applicationStage, setApplicationStage] = React.useState("ALL");
  const [messageIntent, setMessageIntent] = React.useState("ALL");
  const [slaMinutes, setSlaMinutes] = React.useState("30");
  const [warningMinutes, setWarningMinutes] = React.useState("20");
  const [urgentMinutes, setUrgentMinutes] = React.useState("28");
  const [overdueMinutes, setOverdueMinutes] = React.useState("30");
  const [escalationMinutes, setEscalationMinutes] = React.useState("45");
  const [businessHoursOnly, setBusinessHoursOnly] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!name.trim() || !channel) {
      toast({ title: "Name and channel are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetchJson("/api/communications/sla/policies", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          channel,
          priority,
          studentType,
          applicationStage,
          messageIntent,
          slaMinutes: parseInt(slaMinutes, 10) || 30,
          warningMinutes: parseInt(warningMinutes, 10) || 20,
          urgentMinutes: parseInt(urgentMinutes, 10) || 28,
          overdueMinutes: parseInt(overdueMinutes, 10) || 30,
          escalationMinutes: parseInt(escalationMinutes, 10) || 45,
          businessHoursOnly,
          isActive: true,
        }),
      });
      toast({ title: "SLA policy created", description: name.trim() });
      setName("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast({
        title: "Failed to create policy",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create SLA Policy</DialogTitle>
          <DialogDescription>
            Define response time targets for a specific channel, priority, and student type.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="policy-name">Policy Name</Label>
            <Input
              id="policy-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. WhatsApp Urgent - 15 min"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["WHATSAPP", "EMAIL", "SMS", "PHONE", "PORTAL", "WEBSITE_CHAT", "FACEBOOK", "INSTAGRAM"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["LOW", "NORMAL", "HIGH", "URGENT"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Student Type</Label>
              <Select value={studentType} onValueChange={setStudentType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ALL", "NEW", "EXISTING", "VIP"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>App Stage</Label>
              <Select value={applicationStage} onValueChange={setApplicationStage}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ALL", "COUNSELING", "APPLICATION_SUBMITTED", "CAS_PENDING", "VISA_SUBMITTED"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Intent</Label>
              <Select value={messageIntent} onValueChange={setMessageIntent}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ALL", "INQUIRY", "COMPLAINT", "URGENT", "DOCUMENT_REQUEST"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NumField label="SLA (min)" value={slaMinutes} onChange={setSlaMinutes} />
            <NumField label="Warning (min)" value={warningMinutes} onChange={setWarningMinutes} />
            <NumField label="Urgent (min)" value={urgentMinutes} onChange={setUrgentMinutes} />
            <NumField label="Overdue (min)" value={overdueMinutes} onChange={setOverdueMinutes} />
            <NumField label="Escalation (min)" value={escalationMinutes} onChange={setEscalationMinutes} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={businessHoursOnly}
              onChange={(e) => setBusinessHoursOnly(e.target.checked)}
              className="size-4 rounded border-[#E2E8F0]"
            />
            Business hours only (Sun–Thu, 9 AM – 6 PM)
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-[#0057B8] text-white hover:bg-[#003a7a]"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Creating…" : "Create Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      />
    </div>
  );
}
