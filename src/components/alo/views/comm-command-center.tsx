"use client";

/**
 * ALO Education — Unified Communication & Social Command Center
 * ==============================================================
 * One workspace for WhatsApp, Email, SMS, Phone, Portal & Social channels.
 *
 * Sections:
 *   1. PageHeader
 *   2. 6 KPI cards (pending, SLA %, open tasks, escalations, AI drafts, unread)
 *   3. Channel grid (8 channel cards)
 *   4. Unified inbox preview (DataTable, 10 rows)
 *   5. Communication tasks list + Create Task dialog
 *   6. AI Drafts pending approval (AISuggestionCard)
 *   7. Escalation feed (Timeline)
 *
 * All API calls use relative paths only.
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
  KpiCard,
  PageHeader,
  SectionCard,
  EmptyState,
  ErrorState,
  LoadingGrid,
  LoadingSkeleton,
  StatusBadge,
  DataTable,
  Timeline,
  type AccentColor,
  type Column,
} from "@/components/alo/ui";
import { AISuggestionCard } from "@/components/alo/cards";
import { fmtDate, timeAgo, type ViewKey } from "@/lib/alo-types";

// ─────────────────────────────────────────────────────────────────────────────
// Types — match API response shapes
// ─────────────────────────────────────────────────────────────────────────────

interface SlaDashboardResponse {
  stats: {
    totalAssigned: number;
    responded: number;
    pending: number;
    overdue: number;
    slaCompliancePct: number;
    avgResponseTime: number;
    escalations: number;
    openEscalations: number;
    acknowledgedEscalations: number;
    justifications: { pending: number; accepted: number; total: number };
    incidentCounters: number;
    totalBreaches: number;
    totalValidExclusions: number;
  };
  topUnresolvedConversations: Array<{
    id: string;
    channel: string;
    body?: string | null;
    fromName?: string | null;
    fromPhone?: string | null;
    receivedAt: string;
    read?: boolean;
  }>;
}

interface OmniDashboardResponse {
  stats: {
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
    totalConsent: number;
    optedIn: number;
    optedOut: number;
    totalDocuments: number;
    documentVersions: number;
    aiClassified: number;
    pendingReview: number;
    timelineEvents: number;
    socialMessages: number;
    whatsappMessages: number;
    pendingDrafts: number;
    pendingJustifications: number;
    openEscalations: number;
    openTasks: number;
    templatesCount: number;
    slaCompliance: number;
  };
}

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountType?: string | null;
  connectionStatus: string;
  tokenStatus?: string | null;
  webhookStatus?: string | null;
  requiresConfig: boolean;
  ownerEmployeeId?: string | null;
  owner?: { id: string; name: string; role: string; email: string } | null;
}

interface CommunicationTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  source?: string | null;
  assignedTo?: string | null;
  studentId?: string | null;
  applicationId?: string | null;
  deadline?: string | null;
  createdAt: string;
}

interface CommunicationDraft {
  id: string;
  channel: string;
  draftBody: string;
  editedBody?: string | null;
  status: string;
  aiGenerated: boolean;
  aiConfidence?: number | null;
  aiReasoning?: string | null;
  riskLevel?: string | null;
  mode?: string | null;
  studentId?: string | null;
  applicationId?: string | null;
  createdBy?: string | null;
  approvedBy?: string | null;
  createdAt: string;
}

interface EscalationEvent {
  id: string;
  type: string;
  level: number;
  message: string;
  status: string;
  studentId?: string | null;
  counselorId?: string | null;
  supervisorId?: string | null;
  createdAt: string;
}

interface InboxConversation {
  key: string;
  channel: string;
  studentId?: string | null;
  studentName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  messages: Array<{
    id: string;
    channel: string;
    direction: string;
    body: string;
    fromName?: string | null;
    read?: boolean;
    receivedAt: string;
    aiAssisted?: boolean;
  }>;
  unread: number;
  lastMessageAt: string;
}

interface InboxResponse {
  conversations: InboxConversation[];
  slaStats: Array<{ status: string; _count: number | { _all: number } }>;
  totalMessages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Channel metadata
// ─────────────────────────────────────────────────────────────────────────────

interface ChannelMeta {
  key: string;
  name: string;
  icon: string;
  accent: AccentColor;
  targetView: ViewKey;
}

const CHANNELS: ChannelMeta[] = [
  { key: "WHATSAPP", name: "WhatsApp", icon: "MessageCircle", accent: "emerald", targetView: "whatsapp-command-center" },
  { key: "EMAIL", name: "Email", icon: "Mail", accent: "violet", targetView: "unified-inbox" },
  { key: "SMS", name: "SMS", icon: "MessageSquare", accent: "blue", targetView: "unified-inbox" },
  { key: "PHONE", name: "Phone", icon: "PhoneCall", accent: "orange", targetView: "phone-call-center" },
  { key: "PORTAL", name: "Portal", icon: "LayoutDashboard", accent: "sky", targetView: "unified-inbox" },
  { key: "WEBSITE_CHAT", name: "Website Chat", icon: "Globe", accent: "blue", targetView: "unified-inbox" },
  { key: "FACEBOOK", name: "Facebook", icon: "Facebook", accent: "sky", targetView: "unified-inbox" },
  { key: "INSTAGRAM", name: "Instagram", icon: "Instagram", accent: "rose", targetView: "unified-inbox" },
];

function channelMeta(key: string): ChannelMeta {
  return CHANNELS.find((c) => c.key === key) || {
    key,
    name: key.replace(/_/g, " "),
    icon: "MessageSquare",
    accent: "slate",
    targetView: "unified-inbox" as ViewKey,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SLA helpers
// ─────────────────────────────────────────────────────────────────────────────

type SlaSeverity = "NORMAL" | "WARNING" | "OVERDUE" | "CRITICAL";

function slaSeverityForConversation(conv: InboxConversation): SlaSeverity {
  // Use the time since the most recent inbound message to estimate SLA state.
  const inbound = conv.messages.find((m) => m.direction === "INBOUND");
  const ts = inbound?.receivedAt || conv.lastMessageAt;
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins >= 120) return "CRITICAL";
  if (mins >= 60) return "OVERDUE";
  if (mins >= 30) return "WARNING";
  return "NORMAL";
}

const SLA_ACCENT: Record<SlaSeverity, AccentColor> = {
  NORMAL: "emerald",
  WARNING: "amber",
  OVERDUE: "rose",
  CRITICAL: "rose",
};

function formatSlaCountdown(ts: string): string {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Color & status maps
// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_COLOR_MAP: Record<string, AccentColor> = {
  LOW: "slate",
  MEDIUM: "sky",
  HIGH: "amber",
  URGENT: "rose",
};

const TASK_STATUS_COLOR_MAP: Record<string, AccentColor> = {
  OPEN: "blue",
  IN_PROGRESS: "amber",
  COMPLETED: "emerald",
  CANCELLED: "slate",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const ESCALATION_ACCENT: Record<number, AccentColor> = {
  1: "amber",
  2: "orange",
  3: "rose",
};

// ─────────────────────────────────────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────────────────────────────────────

function SlaStatusDot({ severity }: { severity: SlaSeverity }) {
  const dotColor =
    severity === "NORMAL" ? "bg-[var(--alo-success)]" :
    severity === "WARNING" ? "bg-[var(--alo-warning)]" :
    "bg-[var(--alo-danger)]";
  const pulse = severity !== "NORMAL";
  return (
    <span
      className={cn("inline-block size-2 rounded-full", dotColor, pulse && "pulse-dot")}
      title={severity}
    />
  );
}

function navigate(view: ViewKey) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("alo-navigate", { detail: { view } }));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CommCommandCenter() {
  const { toast } = useToast();

  // Top-level fetch state (combined across multiple endpoints)
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [slaStats, setSlaStats] = React.useState<SlaDashboardResponse["stats"] | null>(null);
  const [omniStats, setOmniStats] = React.useState<OmniDashboardResponse["stats"] | null>(null);
  const [socialAccounts, setSocialAccounts] = React.useState<SocialAccount[]>([]);
  const [conversations, setConversations] = React.useState<InboxConversation[]>([]);
  const [tasks, setTasks] = React.useState<CommunicationTask[]>([]);
  const [drafts, setDrafts] = React.useState<CommunicationDraft[]>([]);
  const [escalations, setEscalations] = React.useState<EscalationEvent[]>([]);

  // Create-task dialog state
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [creatingTask, setCreatingTask] = React.useState(false);
  const [taskForm, setTaskForm] = React.useState({
    title: "",
    studentId: "",
    assignedTo: "",
    priority: "MEDIUM",
    deadline: "",
    description: "",
  });

  // Acting user (best-effort — fallback to "system" if session unavailable)
  const [currentUserId, setCurrentUserId] = React.useState<string>("system");
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem("alo-current-user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) setCurrentUserId(parsed.id);
      }
    } catch {
      // ignore — fall back to "system"
    }
  }, []);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      fetch("/api/communications/sla/dashboard", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/omnichannel/dashboard", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/communications/social-accounts", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/inbox/unified", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/communications/tasks?status=OPEN", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/communications/drafts?status=DRAFT", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/communications/escalations?status=OPEN", { cache: "no-store" }).then((r) => r.json()),
    ]);

    const [slaRes, omniRes, socialRes, inboxRes, tasksRes, draftsRes, escRes] = results;

    // If literally every endpoint failed, surface a global error.
    if (results.every((r) => r.status === "rejected")) {
      setError("Failed to load command center data. Check your network and try again.");
      setLoading(false);
      return;
    }

    if (slaRes.status === "fulfilled" && slaRes.value?.stats) setSlaStats(slaRes.value.stats as SlaDashboardResponse["stats"]);
    if (omniRes.status === "fulfilled" && omniRes.value?.stats) setOmniStats(omniRes.value.stats as OmniDashboardResponse["stats"]);
    if (socialRes.status === "fulfilled" && Array.isArray(socialRes.value?.socialAccounts)) setSocialAccounts(socialRes.value.socialAccounts as SocialAccount[]);
    if (inboxRes.status === "fulfilled" && Array.isArray(inboxRes.value?.conversations)) setConversations(inboxRes.value.conversations as InboxConversation[]);
    if (tasksRes.status === "fulfilled" && Array.isArray(tasksRes.value?.tasks)) setTasks(tasksRes.value.tasks as CommunicationTask[]);
    if (draftsRes.status === "fulfilled" && Array.isArray(draftsRes.value?.drafts)) setDrafts(draftsRes.value.drafts as CommunicationDraft[]);
    if (escRes.status === "fulfilled" && Array.isArray(escRes.value?.escalations)) setEscalations(escRes.value.escalations as EscalationEvent[]);

    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Derived channel stats ──────────────────────────────────────────────
  const channelStats = React.useMemo(() => {
    const map: Record<string, { unread: number; pending: number; severity: SlaSeverity }> = {};
    for (const c of CHANNELS) {
      map[c.key] = { unread: 0, pending: 0, severity: "NORMAL" };
    }
    let worstSeverity: SlaSeverity = "NORMAL";
    for (const conv of conversations) {
      const ch = map[conv.channel];
      if (!ch) continue;
      ch.unread += conv.unread;
      ch.pending += conv.messages.filter((m) => m.direction === "INBOUND" && !m.read).length;
      const sev = slaSeverityForConversation(conv);
      // escalate the channel's severity to its worst conversation
      const order: SlaSeverity[] = ["NORMAL", "WARNING", "OVERDUE", "CRITICAL"];
      if (order.indexOf(sev) > order.indexOf(ch.severity)) ch.severity = sev;
      if (order.indexOf(sev) > order.indexOf(worstSeverity)) worstSeverity = sev;
    }
    return { map, worstSeverity };
  }, [conversations]);

  // Per-channel "configuration required" check
  const requiresConfigForChannel = React.useCallback(
    (channelKey: string): boolean => {
      // Social-style channels: need a configured SocialAccountOwnership
      if (["WHATSAPP", "FACEBOOK", "INSTAGRAM", "WEBSITE_CHAT"].includes(channelKey)) {
        const accounts = socialAccounts.filter(
          (a) => a.platform === channelKey || a.platform === channelKey.replace("_", "")
        );
        if (accounts.length === 0) return true;
        const connected = accounts.some(
          (a) => a.connectionStatus === "CONNECTED" && !a.requiresConfig
        );
        return !connected;
      }
      return false;
    },
    [socialAccounts]
  );

  // ── Task creation ──────────────────────────────────────────────────────
  async function handleCreateTask() {
    if (!taskForm.title.trim()) {
      toast({ title: "Title required", description: "Please provide a task title.", variant: "destructive" });
      return;
    }
    setCreatingTask(true);
    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        studentId: taskForm.studentId.trim() || undefined,
        assignedTo: taskForm.assignedTo.trim() || undefined,
        priority: taskForm.priority,
        source: "COMMUNICATION",
        deadline: taskForm.deadline ? new Date(taskForm.deadline).toISOString() : undefined,
        createdBy: currentUserId,
      };
      const res = await fetch("/api/communications/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed (${res.status})`);
      }
      const data = (await res.json()) as { task: CommunicationTask };
      setTasks((prev) => [data.task, ...prev]);
      setTaskDialogOpen(false);
      setTaskForm({ title: "", studentId: "", assignedTo: "", priority: "MEDIUM", deadline: "", description: "" });
      toast({ title: "Task created", description: `Created: ${data.task.title}` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Failed to create task", description: msg, variant: "destructive" });
    } finally {
      setCreatingTask(false);
    }
  }

  // ── Draft approval / rejection ─────────────────────────────────────────
  async function handleDraftAction(draft: CommunicationDraft, action: "APPROVED" | "REJECTED") {
    try {
      const res = await fetch(`/api/communications/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "APPROVED"
            ? { status: "APPROVED", approvedBy: currentUserId }
            : { status: "REJECTED" }
        ),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed (${res.status})`);
      }
      setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
      toast({
        title: action === "APPROVED" ? "Draft approved" : "Draft rejected",
        description:
          action === "APPROVED"
            ? "The AI draft is now approved and ready to send."
            : "The AI draft has been rejected.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
    }
  }

  async function handleDraftEdit(draft: CommunicationDraft) {
    // Open the inbox / WhatsApp view for full editing
    const target = draft.channel === "WHATSAPP" ? "whatsapp-command-center" : "unified-inbox";
    navigate(target as ViewKey);
    toast({ title: "Open composer", description: "Opening the conversation composer to edit this draft." });
  }

  // ── Render ─────────────────────────────────────────────────────────────
  const pendingCount = slaStats?.pending ?? omniStats?.pendingDrafts ?? 0;
  const slaPct = slaStats?.slaCompliancePct ?? omniStats?.slaCompliance ?? 100;
  const openTasksCount = omniStats?.openTasks ?? tasks.length;
  const openEscalations = slaStats?.openEscalations ?? omniStats?.openEscalations ?? escalations.length;
  const aiDraftsPending = omniStats?.pendingDrafts ?? drafts.length;
  const unreadConvos = conversations.filter((c) => c.unread > 0).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Unified Communication Command Center"
        subtitle="One workspace for WhatsApp, Email, SMS, Phone, Portal & Social channels"
        icon="MessagesSquare"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchAll()}>
              <Icon name="RefreshCw" className="size-3.5" /> Refresh
            </Button>
            <Button variant="alo" size="sm" onClick={() => setTaskDialogOpen(true)}>
              <Icon name="Plus" className="size-3.5" /> Create Task
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <LoadingGrid count={6} />
          <SectionCard title="Loading channels…">
            <LoadingSkeleton lines={4} />
          </SectionCard>
        </div>
      ) : error ? (
        <ErrorState title="Failed to load" description={error} onRetry={fetchAll} />
      ) : (
        <>
          {/* ─── 2. KPI cards ─── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              label="Pending Messages"
              value={pendingCount}
              icon="Inbox"
              accent="orange"
              hint="Unresponded inbound"
            />
            <KpiCard
              label="SLA Compliance"
              value={`${slaPct}%`}
              icon="GaugeCircle"
              accent="blue"
              hint={`${slaStats?.responded ?? 0} / ${slaStats?.totalAssigned ?? 0} responded`}
              trend={{
                value: slaPct >= 90 ? "On target" : slaPct >= 70 ? "Watch closely" : "Below target",
                direction: slaPct >= 90 ? "up" : slaPct >= 70 ? "flat" : "down",
              }}
            />
            <KpiCard
              label="Open Tasks"
              value={openTasksCount}
              icon="CheckSquare"
              accent="amber"
              hint="Communication tasks"
            />
            <KpiCard
              label="Open Escalations"
              value={openEscalations}
              icon="AlertOctagon"
              accent="rose"
              hint={`${slaStats?.acknowledgedEscalations ?? 0} acknowledged`}
            />
            <KpiCard
              label="AI Drafts Pending"
              value={aiDraftsPending}
              icon="Sparkles"
              accent="violet"
              hint="Awaiting approval"
            />
            <KpiCard
              label="Unread Conversations"
              value={unreadConvos}
              icon="MessageSquare"
              accent="emerald"
              hint="Across all channels"
            />
          </div>

          {/* ─── 3. Channel grid ─── */}
          <SectionCard
            title="Channels"
            description="Status across all communication channels. Click any channel to open its workspace."
            icon="Radio"
            accent="blue"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {CHANNELS.map((ch) => {
                const stats = channelStats.map[ch.key] || { unread: 0, pending: 0, severity: "NORMAL" as SlaSeverity };
                const needsConfig = requiresConfigForChannel(ch.key);
                return (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() => navigate(ch.targetView)}
                    className="group flex flex-col gap-3 rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-surface)] p-4 text-left shadow-[var(--alo-shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[var(--alo-border-strong)] hover:shadow-[var(--alo-shadow-md)] focus:outline-none focus:ring-[3px] focus:ring-[var(--alo-blue)]/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center rounded-xl",
                            ch.accent === "blue" && "bg-[var(--alo-blue-soft)] text-[var(--alo-blue-strong)]",
                            ch.accent === "orange" && "bg-[var(--alo-orange-soft)] text-[var(--alo-orange-strong)]",
                            ch.accent === "emerald" && "bg-[var(--alo-success-soft)] text-[var(--alo-success-strong)]",
                            ch.accent === "amber" && "bg-[var(--alo-warning-soft)] text-[var(--alo-warning-strong)]",
                            ch.accent === "violet" && "bg-violet-50 text-violet-700",
                            ch.accent === "rose" && "bg-[var(--alo-danger-soft)] text-[var(--alo-danger-strong)]",
                            ch.accent === "sky" && "bg-[var(--alo-info-soft)] text-[var(--alo-info-strong)]",
                            ch.accent === "slate" && "bg-[var(--alo-surface-muted)] text-[var(--alo-text-secondary)]"
                          )}
                        >
                          <Icon name={ch.icon} className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--alo-text)]">{ch.name}</p>
                          <p className="text-xs text-[var(--alo-muted)]">
                            {stats.pending} pending · {stats.unread} unread
                          </p>
                        </div>
                      </div>
                      <Icon
                        name="ArrowUpRight"
                        className="size-4 text-[var(--alo-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <SlaStatusDot severity={stats.severity} />
                        <span
                          className={cn(
                            "font-semibold uppercase tracking-wide",
                            stats.severity === "NORMAL" && "text-[var(--alo-success-strong)]",
                            stats.severity === "WARNING" && "text-[var(--alo-warning-strong)]",
                            (stats.severity === "OVERDUE" || stats.severity === "CRITICAL") && "text-[var(--alo-danger-strong)]"
                          )}
                        >
                          {stats.severity}
                        </span>
                      </div>
                      {needsConfig && (
                        <Badge variant="warning" className="gap-1 text-[11px]">
                          <Icon name="Settings2" className="size-2.5" />
                          Configuration required
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* ─── 4. Unified inbox preview ─── */}
          <SectionCard
            title="Unified Inbox Preview"
            description="Latest inbound conversations across all channels — prioritized by SLA."
            icon="Inbox"
            accent="orange"
            action={
              <Button variant="outline" size="sm" onClick={() => navigate("unified-inbox")}>
                <Icon name="ExternalLink" className="size-3.5" /> Open full inbox
              </Button>
            }
          >
            {conversations.length === 0 ? (
              <EmptyState
                icon="Inbox"
                title="No conversations yet"
                description="Inbound messages from WhatsApp, Email, SMS, Phone, Portal and Social channels will appear here."
                accent="blue"
              />
            ) : (
              <DataTable
                columns={inboxColumns}
                data={conversations.slice(0, 10).map((c) => ({ ...c, id: c.key }))}
                pageSize={10}
                emptyMessage="No conversations found"
                onRowClick={(row) => {
                  const meta = channelMeta(row.channel);
                  navigate(meta.targetView);
                }}
              />
            )}
          </SectionCard>

          {/* ─── 5. Communication tasks ─── */}
          <SectionCard
            title="Communication Tasks"
            description="Open tasks assigned to counselors and the application team."
            icon="CheckSquare"
            accent="amber"
            action={
              <Button variant="alo" size="sm" onClick={() => setTaskDialogOpen(true)}>
                <Icon name="Plus" className="size-3.5" /> Create Task
              </Button>
            }
          >
            {tasks.length === 0 ? (
              <EmptyState
                icon="CheckSquare"
                title="No open tasks"
                description="Create a task to assign work to a counselor or team member."
                accent="amber"
                action={
                  <Button variant="outline" size="sm" onClick={() => setTaskDialogOpen(true)}>
                    <Icon name="Plus" className="size-3.5" /> Create first task
                  </Button>
                }
              />
            ) : (
              <DataTable
                columns={taskColumns}
                data={tasks}
                pageSize={8}
                emptyMessage="No open tasks"
              />
            )}
          </SectionCard>

          {/* ─── 6. AI Drafts pending approval ─── */}
          <SectionCard
            title="AI Drafts Pending Approval"
            description="AI-generated replies awaiting human review before sending."
            icon="Sparkles"
            accent="violet"
          >
            {drafts.length === 0 ? (
              <EmptyState
                icon="Sparkles"
                title="No drafts waiting"
                description="AI-generated draft replies will appear here for your approval."
                accent="violet"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {drafts.map((draft) => {
                  const meta = channelMeta(draft.channel);
                  return (
                    <AISuggestionCard
                      key={draft.id}
                      title={`Draft ${meta.name} reply`}
                      suggestion={draft.editedBody || draft.draftBody}
                      reasoning={draft.aiReasoning || undefined}
                      confidence={draft.aiConfidence ?? undefined}
                      category={`${meta.name} · ${draft.riskLevel || "LOW"} risk`}
                      onApply={() => handleDraftAction(draft, "APPROVED")}
                      onDismiss={() => handleDraftAction(draft, "REJECTED")}
                    />
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* ─── 7. Escalation feed ─── */}
          <SectionCard
            title="Escalation Feed"
            description="Open escalations across the communication stack — newest first."
            icon="AlertOctagon"
            accent="rose"
          >
            {escalations.length === 0 ? (
              <EmptyState
                icon="ShieldCheck"
                title="No open escalations"
                description="When SLAs are breached or complaints come in, escalations will appear here."
                accent="emerald"
              />
            ) : (
              <Timeline
                items={escalations.slice(0, 10).map((e) => ({
                  id: e.id,
                  title: e.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                  description: e.message,
                  timestamp: e.createdAt,
                  icon: e.level >= 3 ? "AlertOctagon" : e.level === 2 ? "AlertTriangle" : "Info",
                  accent: ESCALATION_ACCENT[e.level] || "amber",
                }))}
              />
            )}
          </SectionCard>
        </>
      )}

      {/* ─── Create Task Dialog ─── */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Communication Task</DialogTitle>
            <DialogDescription>
              Assign a follow-up task to a counselor or team member. Linked conversations & students
              will appear in their workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                placeholder="e.g. Follow up with student about IELTS score"
                value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="task-student">Student ID</Label>
                <Input
                  id="task-student"
                  placeholder="e.g. AE-2024100123"
                  value={taskForm.studentId}
                  onChange={(e) => setTaskForm((f) => ({ ...f, studentId: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-assigned">Assigned To</Label>
                <Input
                  id="task-assigned"
                  placeholder="User ID or name"
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm((f) => ({ ...f, assignedTo: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) => setTaskForm((f) => ({ ...f, priority: v }))}
                >
                  <SelectTrigger id="task-priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-deadline">Deadline</Label>
                <Input
                  id="task-deadline"
                  type="datetime-local"
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                placeholder="Context, links, and what the assignee needs to do."
                value={taskForm.description}
                onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setTaskDialogOpen(false)} disabled={creatingTask}>
              Cancel
            </Button>
            <Button variant="alo" onClick={handleCreateTask} disabled={creatingTask}>
              {creatingTask ? (
                <>
                  <Icon name="Loader2" className="size-3.5 animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <Icon name="Plus" className="size-3.5" /> Create Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column definitions (declared outside component for stable identity)
// ─────────────────────────────────────────────────────────────────────────────

type InboxRow = InboxConversation & { id: string };

const inboxColumns: Column<InboxRow>[] = [
  {
    key: "priority",
    header: "Priority",
    width: "90px",
    cell: (row) => {
      const sev = slaSeverityForConversation(row);
      const accent = SLA_ACCENT[sev];
      const cls =
        accent === "emerald" ? "bg-[var(--alo-success-soft)] text-[var(--alo-success-strong)] border-[var(--alo-success)]" :
        accent === "amber" ? "bg-[var(--alo-warning-soft)] text-[var(--alo-warning-strong)] border-[var(--alo-warning)]" :
        "bg-[var(--alo-danger-soft)] text-[var(--alo-danger-strong)] border-[var(--alo-danger)]";
      return (
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", cls)}>
          <SlaStatusDot severity={sev} />
          {sev}
        </span>
      );
    },
    sortable: true,
    sortAccessor: (row) => {
      const order = ["NORMAL", "WARNING", "OVERDUE", "CRITICAL"];
      return order.indexOf(slaSeverityForConversation(row));
    },
  },
  {
    key: "sla",
    header: "SLA",
    width: "100px",
    cell: (row) => {
      const inbound = row.messages.find((m) => m.direction === "INBOUND");
      const ts = inbound?.receivedAt || row.lastMessageAt;
      return (
        <span className="font-mono text-xs text-[var(--alo-text-secondary)]">
          {formatSlaCountdown(ts)}
        </span>
      );
    },
    sortable: true,
    sortAccessor: (row) => new Date(row.lastMessageAt).getTime(),
  },
  {
    key: "channel",
    header: "Channel",
    width: "120px",
    cell: (row) => {
      const meta = channelMeta(row.channel);
      return (
        <Badge variant="neutral" className="gap-1">
          <Icon name={meta.icon} className="size-3" />
          {meta.name}
        </Badge>
      );
    },
    sortable: true,
    sortAccessor: (row) => row.channel,
  },
  {
    key: "student",
    header: "Student / Sender",
    cell: (row) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--alo-text)]">
          {row.studentName || row.fromPhone || row.fromEmail || "Unknown"}
        </p>
        <p className="truncate text-xs text-[var(--alo-muted)]">
          {row.fromPhone || row.fromEmail || row.studentId || "—"}
        </p>
      </div>
    ),
    sortable: true,
    sortAccessor: (row) => row.studentName || row.fromPhone || row.fromEmail || "",
  },
  {
    key: "message",
    header: "Message",
    cell: (row) => {
      const last = row.messages[0];
      const body = last?.body || "";
      return (
        <span className="line-clamp-1 max-w-xs text-sm text-[var(--alo-text-secondary)]" title={body}>
          {body || "—"}
        </span>
      );
    },
  },
  {
    key: "intent",
    header: "Intent",
    width: "120px",
    cell: (row) => {
      const last = row.messages[0];
      if (!last) return <span className="text-[var(--alo-muted)]">—</span>;
      // Lightweight intent classifier — frontend heuristic only
      const body = (last.body || "").toLowerCase();
      let intent = "GENERAL";
      if (/passport|visa|cas|i20|offer/.test(body)) intent = "DOCUMENT";
      else if (/payment|invoice|fee|refund|deposit/.test(body)) intent = "PAYMENT";
      else if (/deadline|intake|apply|application/.test(body)) intent = "APPLICATION";
      else if (/interview|mock/.test(body)) intent = "INTERVIEW";
      return (
        <Badge variant="blue" className="text-[11px]">
          {intent}
        </Badge>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    width: "110px",
    cell: (row) => (
      <span className="inline-flex items-center gap-1 text-xs">
        {row.unread > 0 ? (
          <Badge variant="warning" className="gap-0.5">
            <Icon name="CircleDot" className="size-2.5" />
            {row.unread} unread
          </Badge>
        ) : (
          <Badge variant="success" className="gap-0.5">
            <Icon name="Check" className="size-2.5" />
            Read
          </Badge>
        )}
      </span>
    ),
  },
  {
    key: "deadline",
    header: "Received",
    width: "120px",
    cell: (row) => (
      <span className="text-xs text-[var(--alo-muted)]">{timeAgo(row.lastMessageAt)}</span>
    ),
    sortable: true,
    sortAccessor: (row) => new Date(row.lastMessageAt).getTime(),
  },
];

const taskColumns: Column<CommunicationTask>[] = [
  {
    key: "title",
    header: "Title",
    cell: (row) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--alo-text)]">{row.title}</p>
        {row.description && (
          <p className="line-clamp-1 max-w-md text-xs text-[var(--alo-muted)]">{row.description}</p>
        )}
      </div>
    ),
    sortable: true,
    sortAccessor: (row) => row.title,
  },
  {
    key: "student",
    header: "Student",
    width: "140px",
    cell: (row) => (
      <span className="font-mono text-xs text-[var(--alo-text-secondary)]">
        {row.studentId ? row.studentId.slice(0, 14) : "—"}
      </span>
    ),
  },
  {
    key: "assigned",
    header: "Assigned To",
    width: "150px",
    cell: (row) => (
      <span className="text-xs text-[var(--alo-text-secondary)]">
        {row.assignedTo ? row.assignedTo.slice(0, 12) + "…" : "Unassigned"}
      </span>
    ),
  },
  {
    key: "priority",
    header: "Priority",
    width: "110px",
    cell: (row) => (
      <StatusBadge status={row.priority} colorMap={PRIORITY_COLOR_MAP} />
    ),
    sortable: true,
    sortAccessor: (row) => row.priority,
  },
  {
    key: "status",
    header: "Status",
    width: "120px",
    cell: (row) => (
      <StatusBadge
        status={row.status}
        colorMap={TASK_STATUS_COLOR_MAP}
        labels={TASK_STATUS_LABELS}
      />
    ),
    sortable: true,
    sortAccessor: (row) => row.status,
  },
  {
    key: "deadline",
    header: "Deadline",
    width: "120px",
    cell: (row) => (
      <span className="text-xs text-[var(--alo-muted)]">{row.deadline ? fmtDate(row.deadline) : "—"}</span>
    ),
    sortable: true,
    sortAccessor: (row) => (row.deadline ? new Date(row.deadline).getTime() : 0),
  },
  {
    key: "source",
    header: "Source",
    width: "120px",
    cell: (row) => (
      <Badge variant="neutral" className="text-[11px]">
        {row.source || "—"}
      </Badge>
    ),
  },
];

export default CommCommandCenter;
