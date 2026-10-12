"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
} from "@/components/alo/shared";
import {
  DataTable,
  type DataTableColumn,
  Timeline,
  SearchInput,
  Pill,
  fetchJson,
  channelMeta,
  COMMAND_CENTER_CHANNELS,
  PRIORITY_COLORS,
  TASK_STATUS_COLORS,
  timeAgoShort,
  fmtDateTime,
} from "@/components/alo/comm-helpers";

// ─── Types ────────────────────────────────────────────────────────────────

interface SlaDashboardSummary {
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

interface SlaDashboardResponse {
  summary: SlaDashboardSummary;
  topUnresolved: Array<{
    id: string;
    channel: string;
    fromPhone: string | null;
    fromName: string | null;
    fromEmail: string | null;
    body: string;
    studentId: string | null;
    counselorId: string | null;
    receivedAt: string;
  }>;
}

interface OmnichannelStats {
  connectedAccounts: number;
  connectedActive: number;
  expiredAccounts: number;
  totalPhoneCalls: number;
  missedCalls: number;
  totalEmails: number;
  unreadEmails: number;
  totalSms: number;
  deliveredSms: number;
  totalNotifications: number;
  unreadNotifications: number;
  whatsappMessages: number;
  socialMessages: number;
}

interface OmnichannelResponse {
  stats: OmnichannelStats;
  phoneCalls?: unknown[];
  connectedAccounts?: Array<{ platform: string; connectionStatus: string }>;
}

interface CommTask {
  id: string;
  title: string;
  description?: string | null;
  channel?: string | null;
  source?: string | null;
  priority?: string | null;
  status: string;
  assignedTo?: string | null;
  studentId?: string | null;
  applicationId?: string | null;
  deadline?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

interface CommDraft {
  id: string;
  channel: string;
  draftBody: string;
  editedBody?: string | null;
  aiGenerated?: boolean | null;
  aiConfidence?: number | null;
  aiReasoning?: string | null;
  riskLevel?: string | null;
  mode?: string | null;
  status: string;
  studentId?: string | null;
  socialInboxMessageId?: string | null;
  createdAt: string;
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
  resolvedAt?: string | null;
}

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountType?: string | null;
  connectionStatus: string;
  requiresConfig?: boolean | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function slaStatusFor(channel: string, socialAccounts: SocialAccount[]) {
  const account = socialAccounts.find(
    (a) => a.platform === channel || channelMeta(channel).label === channelMeta(a.platform).label
  );
  if (!account || account.connectionStatus !== "CONNECTED") {
    return { status: "OFFLINE", color: "bg-slate-300" };
  }
  if (account.requiresConfig) {
    return { status: "WARNING", color: "bg-amber-400" };
  }
  return { status: "OK", color: "bg-emerald-500" };
}

// ─── Main Component ────────────────────────────────────────────────────────

export function CommCommandCenter() {
  const { toast } = useToast();
  const [sla, setSla] = React.useState<SlaDashboardSummary | null>(null);
  const [omni, setOmni] = React.useState<OmnichannelStats | null>(null);
  const [socialAccounts, setSocialAccounts] = React.useState<SocialAccount[]>([]);
  const [tasks, setTasks] = React.useState<CommTask[]>([]);
  const [drafts, setDrafts] = React.useState<CommDraft[]>([]);
  const [escalations, setEscalations] = React.useState<Escalation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false);
  const [taskSearch, setTaskSearch] = React.useState("");
  const [taskStatus, setTaskStatus] = React.useState<string>("OPEN");

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [slaRes, omniRes, socialRes, taskRes, draftRes, escRes] = await Promise.all([
        fetchJson<SlaDashboardResponse>("/api/communications/sla/dashboard"),
        fetchJson<OmnichannelResponse>("/api/omnichannel/dashboard"),
        fetchJson<{ socialAccounts: SocialAccount[] }>("/api/communications/social-accounts"),
        fetchJson<{ tasks: CommTask[] }>(
          `/api/communications/tasks?status=${taskStatus}`
        ),
        fetchJson<{ drafts: CommDraft[] }>(
          "/api/communications/drafts?status=DRAFT"
        ),
        fetchJson<{ escalations: Escalation[] }>(
          "/api/communications/escalations?status=OPEN"
        ),
      ]);
      setSla(slaRes.summary);
      setOmni(omniRes.stats);
      setSocialAccounts(socialRes.socialAccounts || []);
      setTasks(taskRes.tasks || []);
      setDrafts(draftRes.drafts || []);
      setEscalations(escRes.escalations || []);
    } catch (err) {
      console.error("[comm-command-center]", err);
      setError(true);
      toast({
        title: "Failed to load command center",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [taskStatus, toast]);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handleDraftAction = async (
    draft: CommDraft,
    action: "APPROVE" | "REJECT"
  ) => {
    try {
      await fetchJson(`/api/communications/drafts/${draft.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      toast({
        title: action === "APPROVE" ? "Draft approved" : "Draft rejected",
        description: `Draft for ${draft.channel} ${action.toLowerCase()}d.`,
      });
      setDrafts((d) => d.filter((x) => x.id !== draft.id));
    } catch (err) {
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  const handleEscalation = async (
    esc: Escalation,
    status: "ACKNOWLEDGED" | "RESOLVED" | "CLOSED"
  ) => {
    try {
      await fetchJson(`/api/communications/escalations/${esc.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast({ title: `Escalation ${status.toLowerCase()}` });
      setEscalations((e) => e.filter((x) => x.id !== esc.id));
    } catch (err) {
      toast({
        title: "Failed to update escalation",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  const handleTaskStatusChange = async (task: CommTask, status: string) => {
    try {
      await fetchJson(`/api/communications/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast({ title: `Task marked ${status.toLowerCase()}` });
      setTasks((t) => t.filter((x) => x.id !== task.id));
    } catch (err) {
      toast({
        title: "Failed to update task",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  if (loading && !sla) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Unified Communication Command Center"
          subtitle="Monitor every conversation channel, SLA performance, AI drafts, escalations, and counselor tasks in real-time."
          icon="Radio"
        />
        <LoadingGrid count={6} />
      </div>
    );
  }

  if (error && !sla) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Unified Communication Command Center"
          subtitle="Monitor every conversation channel, SLA performance, AI drafts, escalations, and counselor tasks in real-time."
          icon="Radio"
        />
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-[#991B1B]">Failed to load command center</p>
          <Button onClick={() => void fetchAll()} className="mt-3" size="sm">Retry</Button>
        </div>
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "OPEN").length;
  const aiDraftsPending = drafts.length;
  const unreadConversations =
    (omni?.unreadEmails || 0) + (omni?.whatsappMessages || 0) + (omni?.unreadNotifications || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unified Communication Command Center"
        subtitle="Monitor every conversation channel, SLA performance, AI drafts, escalations, and counselor tasks in real-time."
        icon="Radio"
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

      {/* ─── KPI cards row ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Pending Messages"
          value={sla?.pending ?? 0}
          icon="MailWarning"
          accent="amber"
          hint="Awaiting reply"
        />
        <KpiCard
          label="SLA Compliance"
          value={`${sla?.slaCompliancePct ?? 0}%`}
          icon="Gauge"
          accent="emerald"
          hint={`${sla?.totalResponded ?? 0}/${sla?.totalAssigned ?? 0} responded`}
        />
        <KpiCard
          label="Open Tasks"
          value={pendingTasks}
          icon="ListTodo"
          accent="blue"
          hint="Counselor queue"
        />
        <KpiCard
          label="Open Escalations"
          value={escalations.length}
          icon="AlertOctagon"
          accent="rose"
          hint="Requires attention"
        />
        <KpiCard
          label="AI Drafts Pending"
          value={aiDraftsPending}
          icon="Sparkles"
          accent="violet"
          hint="Awaiting review"
        />
        <KpiCard
          label="Unread Conversations"
          value={unreadConversations}
          icon="Inbox"
          accent="orange"
          hint="All channels"
        />
      </div>

      {/* ─── Channel grid ─── */}
      <SectionCard
        title="Channel Status"
        description="8 communication channels — live connection & SLA status"
        icon="LayoutGrid"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {COMMAND_CENTER_CHANNELS.map((channel) => {
            const meta = channelMeta(channel);
            const account = socialAccounts.find((a) => a.platform === channel);
            const connected =
              account && account.connectionStatus === "CONNECTED" && !account.requiresConfig;
            const configured = account && !account.requiresConfig;
            return (
              <button
                key={channel}
                type="button"
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border bg-white p-3 text-left transition-all hover:shadow-md",
                  connected
                    ? "border-[#E2E8F0] hover:border-[#0057B8]/30"
                    : "border-dashed border-amber-300 bg-amber-50/40"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className="flex size-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${meta.brandColor}15`, color: meta.brandColor }}
                  >
                    <Icon name={meta.icon} className="size-4" />
                  </span>
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      connected ? "bg-emerald-500" : configured ? "bg-amber-400" : "bg-slate-300"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#0F172A]">{meta.label}</p>
                  <p className="text-[10px] text-[#64748B]">
                    {connected ? "Connected" : configured ? "Config pending" : "Not connected"}
                  </p>
                </div>
                {!account || account.requiresConfig ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                    <Icon name="Settings2" className="size-2.5" />
                    Configuration Required
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── Unified Inbox Preview (left, 2 cols) ─── */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Unified Inbox Preview"
            description="Oldest unread inbound messages across all channels"
            icon="Inbox"
          >
            {sla && <UnifiedInboxPreview rows={[]} /> }
          </SectionCard>

          {/* ─── Communication Tasks ─── */}
          <SectionCard
            title="Communication Tasks"
            description="Counselor task queue"
            icon="ListTodo"
            action={
              <Button
                onClick={() => setCreateTaskOpen(true)}
                className="h-9 bg-[#0057B8] text-white hover:bg-[#003a7a]"
              >
                <Icon name="Plus" className="mr-1.5 size-4" />
                New Task
              </Button>
            }
          >
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput
                value={taskSearch}
                onChange={setTaskSearch}
                placeholder="Search tasks…"
                className="sm:w-64"
              />
              <Select value={taskStatus} onValueChange={setTaskStatus}>
                <SelectTrigger className="h-9 w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TasksTable
              tasks={tasks}
              search={taskSearch}
              onStatusChange={handleTaskStatusChange}
            />
          </SectionCard>
        </div>

        {/* ─── Right column: AI Drafts + Escalations ─── */}
        <div className="space-y-6">
          <SectionCard
            title="AI Drafts Pending Approval"
            description="Human-in-the-loop review"
            icon="Sparkles"
          >
            {drafts.length === 0 ? (
              <EmptyState
                icon="CheckCircle2"
                title="No drafts pending"
                description="AI-generated drafts awaiting approval will appear here."
              />
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto alo-scroll pr-1">
                {drafts.slice(0, 8).map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onAction={handleDraftAction}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Escalation Feed"
            description="Open escalations — acknowledge or resolve"
            icon="AlertOctagon"
          >
            {escalations.length === 0 ? (
              <EmptyState
                icon="ShieldCheck"
                title="No open escalations"
                description="All clear — escalations will appear here when triggered by SLA breaches."
              />
            ) : (
              <>
                <Timeline
                  items={escalations.slice(0, 8).map((e) => ({
                    id: e.id,
                    title: `${e.type.replace(/_/g, " ")} (Level ${e.level ?? 1})`,
                    description: e.message,
                    timestamp: timeAgoShort(e.createdAt),
                    accent: e.status === "OPEN" ? "rose" : e.status === "ACKNOWLEDGED" ? "amber" : "emerald",
                    meta: e.status,
                  }))}
                />
                <div className="mt-3 space-y-2">
                  {escalations.slice(0, 5).map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] px-3 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#0F172A]">
                          {e.type.replace(/_/g, " ")}
                        </p>
                        <p className="truncate text-[11px] text-[#64748B]">{e.message}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => handleEscalation(e, "ACKNOWLEDGED")}
                        >
                          Ack
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 bg-emerald-600 px-2 text-[11px] hover:bg-emerald-700"
                          onClick={() => handleEscalation(e, "RESOLVED")}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </div>

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onCreated={() => void fetchAll()}
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  accent,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  accent: "blue" | "orange" | "emerald" | "amber" | "violet" | "rose";
  hint?: string;
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
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 alo-shadow transition-all hover:alo-shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[#0F172A] sm:text-2xl">{value}</p>
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", accentMap[accent])}>
          <Icon name={icon} className="size-4" />
        </span>
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-[#64748B]">{hint}</p>}
    </div>
  );
}

function UnifiedInboxPreview({ rows }: { rows: unknown[] }) {
  // The detailed unified inbox is rendered in the dedicated Unified Inbox / WhatsApp Command Center views.
  if (rows.length === 0) {
    return (
      <EmptyState
        icon="Inbox"
        title="Use the Unified Inbox"
        description="For real-time message threads, switch to the Unified Inbox or WhatsApp Command Center view."
      />
    );
  }
  return null;
}

function TasksTable({
  tasks,
  search,
  onStatusChange,
}: {
  tasks: CommTask[];
  search: string;
  onStatusChange: (task: CommTask, status: string) => void;
}) {
  const filtered = tasks.filter(
    (t) =>
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const columns: DataTableColumn<CommTask>[] = [
    {
      key: "priority",
      header: "Priority",
      render: (t) => (
        <Pill className={PRIORITY_COLORS[t.priority || "MEDIUM"] || PRIORITY_COLORS.MEDIUM}>
          {(t.priority || "MEDIUM").replace(/_/g, " ").toLowerCase()}
        </Pill>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (t) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#0F172A]">{t.title}</p>
          {t.description && (
            <p className="truncate text-xs text-[#64748B]">{t.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (t) => (
        <span className="text-xs text-[#475569]">
          {(t.source || "COMMUNICATION").replace(/_/g, " ").toLowerCase()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <Pill className={TASK_STATUS_COLORS[t.status] || TASK_STATUS_COLORS.OPEN}>
          {t.status.replace(/_/g, " ").toLowerCase()}
        </Pill>
      ),
    },
    {
      key: "deadline",
      header: "Deadline",
      render: (t) => (
        <span className="text-xs text-[#475569]">
          {t.deadline ? fmtDateTime(t.deadline) : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (t) => <span className="text-xs text-[#64748B]">{timeAgoShort(t.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (t) => (
        <div className="flex justify-end gap-1">
          {t.status === "OPEN" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px]"
              onClick={() => onStatusChange(t, "IN_PROGRESS")}
            >
              Start
            </Button>
          )}
          {(t.status === "OPEN" || t.status === "IN_PROGRESS") && (
            <Button
              size="sm"
              className="h-7 bg-emerald-600 px-2 text-[11px] hover:bg-emerald-700"
              onClick={() => onStatusChange(t, "RESOLVED")}
            >
              Resolve
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={filtered}
      rowKey={(t) => t.id}
      emptyTitle="No tasks"
      emptyDescription="No communication tasks match this filter."
      emptyIcon="ListTodo"
      maxHeight="460px"
    />
  );
}

function DraftCard({
  draft,
  onAction,
}: {
  draft: CommDraft;
  onAction: (draft: CommDraft, action: "APPROVE" | "REJECT") => void;
}) {
  const meta = channelMeta(draft.channel);
  const confidence = draft.aiConfidence ?? 0;
  const riskColor =
    draft.riskLevel === "HIGH"
      ? "bg-rose-100 text-rose-700"
      : draft.riskLevel === "MEDIUM"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 transition-all hover:border-[#0057B8]/30">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex size-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${meta.brandColor}15`, color: meta.brandColor }}
          >
            <Icon name={meta.icon} className="size-3.5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-[#0F172A]">{meta.label}</p>
            <p className="text-[10px] text-[#64748B]">{timeAgoShort(draft.createdAt)}</p>
          </div>
        </div>
        <Pill className={riskColor}>Risk: {draft.riskLevel || "LOW"}</Pill>
      </div>

      <div className="mb-2 rounded-lg bg-violet-50 px-3 py-2">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">
          AI Generated Draft
        </p>
        <p className="line-clamp-3 text-xs text-[#0F172A]">
          {draft.editedBody || draft.draftBody}
        </p>
      </div>

      <div className="mb-2 flex items-center gap-3 text-[10px] text-[#64748B]">
        <span className="inline-flex items-center gap-1">
          <Icon name="Gauge" className="size-3" />
          Confidence {confidence}%
        </span>
        {draft.aiReasoning && (
          <span className="inline-flex items-center gap-1">
            <Icon name="Brain" className="size-3" />
            {draft.aiReasoning.slice(0, 60)}
            {draft.aiReasoning.length > 60 ? "…" : ""}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-8 flex-1 bg-emerald-600 text-[11px] hover:bg-emerald-700"
          onClick={() => onAction(draft, "APPROVE")}
        >
          <Icon name="Check" className="mr-1 size-3" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 flex-1 border-rose-200 text-[11px] text-rose-600 hover:bg-rose-50"
          onClick={() => onAction(draft, "REJECT")}
        >
          <Icon name="X" className="mr-1 size-3" />
          Reject
        </Button>
      </div>
    </div>
  );
}

function CreateTaskDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [channel, setChannel] = React.useState("WHATSAPP");
  const [priority, setPriority] = React.useState("MEDIUM");
  const [deadline, setDeadline] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetchJson("/api/communications/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          channel,
          priority,
          source: "MANUAL",
          status: "OPEN",
          deadline: deadline || undefined,
          studentId: studentId.trim() || undefined,
          assignedTo: assignedTo.trim() || undefined,
        }),
      });
      toast({ title: "Task created", description: title.trim() });
      setTitle("");
      setDescription("");
      setDeadline("");
      setStudentId("");
      setAssignedTo("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast({
        title: "Failed to create task",
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
          <DialogTitle>Create Communication Task</DialogTitle>
          <DialogDescription>
            Create a manual task for a counselor to follow up on a student conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call student about visa documents"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional context for the task"
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMAND_CENTER_CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {channelMeta(c).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="task-student">Student ID (optional)</Label>
              <Input
                id="task-student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="ALO-S-XXXX"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="task-assignee">Assignee User ID (optional)</Label>
              <Input
                id="task-assignee"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="cuid"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="task-deadline">Deadline (optional)</Label>
            <Input
              id="task-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#0057B8] text-white hover:bg-[#003a7a]"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Creating…" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
