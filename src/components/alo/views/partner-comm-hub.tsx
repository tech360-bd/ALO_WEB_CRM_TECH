"use client";

/**
 * ALO Education — Partner Communication Hub
 * ===========================================
 * Scoped to partner's authorized students / applications only.
 *
 * IMPORTANT ACCESS CONTROL (enforced in UI; backend should also enforce):
 *   - Partner sees ONLY students/applications explicitly assigned to them.
 *   - Partner does NOT see: other partners' students, internal ALO notes,
 *     confidential employee communication, restricted financial information,
 *     internal AI risk scores, ALO-only operational information.
 *
 * Backend contracts:
 *   GET  /api/inbox/unified                       — fetch messages (partner-scoped)
 *   GET  /api/applications                        — fetch applications (partner-scoped)
 *   GET  /api/documents                           — fetch documents (partner-scoped)
 *   GET  /api/communications/tasks?assignedTo=...  — fetch updates for this partner
 *   POST /api/communications/tasks                — create task (source=PARTNER)
 *
 * Task ID: COMM-FE-C
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Icon,
  PageHeader,
  SectionCard,
  EmptyState,
  ErrorState,
  LoadingGrid,
  KpiCard,
  DataTable,
  Timeline,
  Notification,
  StatusBadge,
  type Column,
  type AccentColor,
  type TimelineItem,
} from "@/components/alo/ui";
import { fmtDate, timeAgo, STAGE_LABELS, STAGE_COLORS } from "@/lib/alo-types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ConversationMessage {
  id: string;
  channel: string;
  direction: string;
  body: string;
  fromName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  read?: boolean;
  aiAssisted?: boolean;
  receivedAt: string;
  sentAt?: string | null;
}

interface Conversation {
  id: string; // mirror of `key` — added so DataTable<T extends {id}> accepts it
  key: string;
  channel: string;
  studentId?: string | null;
  studentName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  messages: ConversationMessage[];
  unread: number;
  lastMessageAt: string;
}

interface PartnerApplication {
  id: string;
  applicationId: string;
  studentId: string;
  student?: { id: string; fullName: string; email: string; studentId?: string } | null;
  university: string;
  course: string;
  country: string;
  intake: string;
  studyLevel: string;
  stage: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

interface PartnerDocument {
  id: string;
  studentId: string;
  student?: { id: string; fullName: string; studentId?: string } | null;
  category: string;
  name: string;
  required: boolean;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  status: string; // PENDING | UPLOADED | UNDER_REVIEW | APPROVED | REJECTED
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  uploadedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CommTask {
  id: string;
  title: string;
  description?: string | null;
  studentId?: string | null;
  applicationId?: string | null;
  assignedTo?: string | null;
  priority: string;
  status: string;
  source: string;
  resolution?: string | null;
  deadline?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants & metadata
// ─────────────────────────────────────────────────────────────────────────────

// Demo "current partner" — real session would supply this.
const PARTNER_ID = "partner-demo-001";

const CHANNEL_META: Record<string, { label: string; icon: string; accent: AccentColor }> = {
  WHATSAPP: { label: "WhatsApp", icon: "MessageCircle", accent: "emerald" },
  EMAIL: { label: "Email", icon: "Mail", accent: "violet" },
  SMS: { label: "SMS", icon: "MessageSquare", accent: "sky" },
  PORTAL: { label: "Portal", icon: "LayoutDashboard", accent: "orange" },
  FACEBOOK: { label: "Facebook", icon: "Facebook", accent: "blue" },
  INSTAGRAM: { label: "Instagram", icon: "Instagram", accent: "rose" },
};

const DOC_STATUS_ACCENT: Record<string, AccentColor> = {
  PENDING: "amber",
  UPLOADED: "sky",
  UNDER_REVIEW: "violet",
  VERIFIED: "emerald",
  APPROVED: "emerald",
  REJECTED: "rose",
};

const DOC_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  UPLOADED: "Submitted",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  APPROVED: "Verified",
  REJECTED: "Rejected",
};

const DOC_CATEGORIES = [
  "PASSPORT", "NID", "ACADEMIC_CERT", "TRANSCRIPT", "CV", "SOP",
  "BANK_STATEMENT", "SPONSOR_DOC", "VISA_DOC", "REFUSAL_LETTER",
  "MEDICAL", "IELTS_CERT", "OTHER",
];

const TASK_PRIORITY_ACCENT: Record<string, AccentColor> = {
  LOW: "slate",
  MEDIUM: "sky",
  HIGH: "amber",
  URGENT: "rose",
};

const TASK_STATUS_ACCENT: Record<string, AccentColor> = {
  OPEN: "amber",
  IN_PROGRESS: "blue",
  RESOLVED: "emerald",
  CANCELLED: "slate",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function PartnerCommHub() {
  const { toast } = useToast();

  // ── Tab state ────────────────────────────────────────────────────────────
  const [tab, setTab] = React.useState<"messages" | "applications" | "documents" | "updates">("messages");

  // ── Messages state ────────────────────────────────────────────────────────
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [msgLoading, setMsgLoading] = React.useState(true);
  const [msgError, setMsgError] = React.useState<string | null>(null);
  const [replyTarget, setReplyTarget] = React.useState<Conversation | null>(null);

  // ── Applications state ────────────────────────────────────────────────────
  const [apps, setApps] = React.useState<PartnerApplication[]>([]);
  const [appLoading, setAppLoading] = React.useState(true);
  const [appError, setAppError] = React.useState<string | null>(null);
  const [appTarget, setAppTarget] = React.useState<PartnerApplication | null>(null);

  // ── Documents state ───────────────────────────────────────────────────────
  const [docs, setDocs] = React.useState<PartnerDocument[]>([]);
  const [docLoading, setDocLoading] = React.useState(true);
  const [docError, setDocError] = React.useState<string | null>(null);

  // ── Updates (tasks) state ────────────────────────────────────────────────
  const [tasks, setTasks] = React.useState<CommTask[]>([]);
  const [taskLoading, setTaskLoading] = React.useState(true);
  const [taskError, setTaskError] = React.useState<string | null>(null);

  // ── Contact ALO dialog state ──────────────────────────────────────────────
  const [contactOpen, setContactOpen] = React.useState(false);
  const [contactSaving, setContactSaving] = React.useState(false);

  // ── Reply-via-ALO saving flag ─────────────────────────────────────────────
  const [replySaving, setReplySaving] = React.useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetchers
  // ─────────────────────────────────────────────────────────────────────────
  const loadMessages = React.useCallback(async () => {
    setMsgLoading(true);
    setMsgError(null);
    try {
      const res = await fetch(`/api/inbox/unified`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Conversation[] = Array.isArray(data.conversations) ? data.conversations : [];
      // Map `key` → `id` so DataTable<T extends { id }> accepts rows.
      setConversations(list.map((c) => ({ ...c, id: c.key })));
    } catch (e: any) {
      setMsgError(e?.message || "Failed to load messages");
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const loadApps = React.useCallback(async () => {
    setAppLoading(true);
    setAppError(null);
    try {
      const res = await fetch(`/api/applications`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setApps(Array.isArray(data.applications) ? data.applications : []);
    } catch (e: any) {
      setAppError(e?.message || "Failed to load applications");
    } finally {
      setAppLoading(false);
    }
  }, []);

  const loadDocs = React.useCallback(async () => {
    setDocLoading(true);
    setDocError(null);
    try {
      const res = await fetch(`/api/documents`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocs(Array.isArray(data.documents) ? data.documents : []);
    } catch (e: any) {
      setDocError(e?.message || "Failed to load documents");
    } finally {
      setDocLoading(false);
    }
  }, []);

  const loadTasks = React.useCallback(async () => {
    setTaskLoading(true);
    setTaskError(null);
    try {
      const res = await fetch(`/api/communications/tasks?assignedTo=${PARTNER_ID}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (e: any) {
      setTaskError(e?.message || "Failed to load updates");
    } finally {
      setTaskLoading(false);
    }
  }, []);

  // Lazy-load per tab
  React.useEffect(() => {
    if (tab === "messages" && conversations.length === 0 && msgLoading) loadMessages();
  }, [tab, conversations.length, msgLoading, loadMessages]);

  React.useEffect(() => {
    if (tab === "applications" && apps.length === 0 && appLoading) loadApps();
  }, [tab, apps.length, appLoading, loadApps]);

  React.useEffect(() => {
    if (tab === "documents" && docs.length === 0 && docLoading) loadDocs();
  }, [tab, docs.length, docLoading, loadDocs]);

  React.useEffect(() => {
    if (tab === "updates" && tasks.length === 0 && taskLoading) loadTasks();
  }, [tab, tasks.length, taskLoading, loadTasks]);

  // Initial KPI load (messages) — also triggers when tab changes
  React.useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // ─────────────────────────────────────────────────────────────────────────
  // KPIs
  // ─────────────────────────────────────────────────────────────────────────
  const kpis = React.useMemo(() => {
    const studentIds = new Set<string>();
    apps.forEach((a) => studentIds.add(a.studentId));
    conversations.forEach((c) => {
      if (c.studentId) studentIds.add(c.studentId);
    });
    const unread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
    const pendingActions = tasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
    const recentUpdates = tasks.filter((t) => {
      const ageDays = (Date.now() - new Date(t.createdAt).getTime()) / 86400000;
      return ageDays <= 7;
    }).length;
    return {
      assignedStudents: studentIds.size,
      activeApps: apps.length,
      unread,
      pendingActions,
      recentUpdates,
    };
  }, [apps, conversations, tasks]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleReplyViaAlo = async (message: string) => {
    if (!replyTarget) return;
    setReplySaving(true);
    try {
      const res = await fetch(`/api/communications/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Partner reply request: ${replyTarget.studentName || "Unknown student"}`,
          description: message,
          studentId: replyTarget.studentId || undefined,
          source: "PARTNER",
          priority: "MEDIUM",
          // assignedTo should be the student's counselor. We don't have that
          // directly here — set to ALO_SUPPORT as fallback so ALO ops can triage.
          assignedTo: "ALO_SUPPORT",
          createdBy: PARTNER_ID,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast({
        title: "Reply request sent to ALO",
        description: "An ALO counselor will reach out to the student on your behalf.",
      });
      setReplyTarget(null);
    } catch (e: any) {
      toast({
        title: "Failed to send reply",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setReplySaving(false);
    }
  };

  const handleContactAlo = async (subject: string, message: string, priority: string) => {
    setContactSaving(true);
    try {
      const res = await fetch(`/api/communications/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: subject,
          description: message,
          source: "PARTNER",
          priority,
          assignedTo: null, // unassigned → ALO support queue
          createdBy: PARTNER_ID,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast({
        title: "Message sent to ALO support",
        description: "An ALO team member will respond to you shortly.",
      });
      setContactOpen(false);
      // Refresh updates so the partner sees their own message
      loadTasks();
    } catch (e: any) {
      toast({
        title: "Failed to send message",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setContactSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Columns
  // ─────────────────────────────────────────────────────────────────────────
  const msgColumns: Column<Conversation>[] = [
    {
      key: "channel",
      header: "Channel",
      cell: (r) => {
        const meta = CHANNEL_META[r.channel] || CHANNEL_META.PORTAL;
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] px-2 py-0.5 text-xs font-medium text-[var(--alo-text)]">
            <Icon name={meta.icon} className="size-3.5" />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "student",
      header: "Student",
      cell: (r) => (
        <span className="font-medium text-[var(--alo-text)]">{r.studentName || "—"}</span>
      ),
    },
    {
      key: "from",
      header: "Sender",
      cell: (r) => (
        <span className="text-xs text-[var(--alo-text-secondary)]">
          {r.fromPhone || r.fromEmail || r.studentName || "—"}
        </span>
      ),
    },
    {
      key: "body",
      header: "Message",
      cell: (r) => {
        const last = r.messages[r.messages.length - 1];
        return (
          <p className="line-clamp-2 max-w-md text-xs text-[var(--alo-text-secondary)]" title={last?.body}>
            {last?.body || "—"}
          </p>
        );
      },
    },
    {
      key: "time",
      header: "Time",
      cell: (r) => (
        <span className="text-xs text-[var(--alo-muted)]" title={fmtDate(r.lastMessageAt)}>
          {timeAgo(r.lastMessageAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) =>
        r.unread > 0 ? (
          <Badge variant="warning">{r.unread} unread</Badge>
        ) : (
          <Badge variant="neutral">Read</Badge>
        ),
    },
  ];

  const appColumns: Column<PartnerApplication>[] = [
    {
      key: "appId",
      header: "Application ID",
      sortable: true,
      sortAccessor: (r) => r.applicationId,
      cell: (r) => <span className="font-mono text-xs text-[var(--alo-blue-strong)]">{r.applicationId}</span>,
    },
    {
      key: "student",
      header: "Student",
      cell: (r) => <span className="font-medium text-[var(--alo-text)]">{r.student?.fullName || "—"}</span>,
    },
    {
      key: "university",
      header: "University",
      cell: (r) => <span className="text-sm text-[var(--alo-text)]">{r.university}</span>,
    },
    {
      key: "course",
      header: "Course",
      cell: (r) => <span className="text-xs text-[var(--alo-text-secondary)]">{r.course}</span>,
    },
    {
      key: "stage",
      header: "Stage",
      cell: (r) => (
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STAGE_COLORS[r.stage] || "bg-slate-100 text-slate-700")}>
          {STAGE_LABELS[r.stage] || r.stage}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Last Update",
      sortable: true,
      sortAccessor: (r) => new Date(r.updatedAt).getTime(),
      cell: (r) => <span className="text-xs text-[var(--alo-muted)]">{timeAgo(r.updatedAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const stage = r.stage;
        const isClosed = ["ENROLLED", "VISA_APPROVED", "VISA_REFUSED"].includes(stage);
        return isClosed ? (
          <Badge variant={stage === "VISA_REFUSED" ? "danger" : "success"}>
            {stage === "VISA_REFUSED" ? "Closed — Refused" : "Closed — Enrolled"}
          </Badge>
        ) : (
          <Badge variant="info">In Progress</Badge>
        );
      },
    },
  ];

  const docColumns: Column<PartnerDocument>[] = [
    {
      key: "name",
      header: "Document",
      sortable: true,
      sortAccessor: (r) => r.name.toLowerCase(),
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-[var(--alo-text)]">{r.name}</p>
          <p className="text-xs text-[var(--alo-muted)]">{r.category.replace(/_/g, " ").toLowerCase()}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => (
        <span className="text-xs text-[var(--alo-text-secondary)]">
          {r.fileType || r.category}
        </span>
      ),
    },
    {
      key: "student",
      header: "Student",
      cell: (r) => <span className="text-sm text-[var(--alo-text)]">{r.student?.fullName || "—"}</span>,
    },
    {
      key: "app",
      header: "Application",
      cell: (r) => {
        // Documents aren't directly linked to applications in this schema — show "—"
        return <span className="text-xs text-[var(--alo-muted)]">—</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge status={r.status} colorMap={DOC_STATUS_ACCENT} labels={DOC_STATUS_LABELS} />
      ),
    },
    {
      key: "uploadedAt",
      header: "Uploaded",
      cell: (r) => (
        <span className="text-xs text-[var(--alo-muted)]">
          {r.uploadedAt ? fmtDate(r.uploadedAt) : "—"}
        </span>
      ),
    },
    {
      key: "version",
      header: "Version",
      cell: (r) => {
        // Document version history is conceptual here. We display a "v1" tag
        // and surface rejection history in the row expansion / dialog.
        return r.status === "REJECTED" ? (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--alo-danger-strong)]">
            <Icon name="RotateCcw" className="size-3" />
            <span className="font-mono">v1 (rejected)</span>
          </span>
        ) : (
          <span className="font-mono text-xs text-[var(--alo-muted)]">v1</span>
        );
      },
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Timeline items for Updates tab
  // ─────────────────────────────────────────────────────────────────────────
  const timelineItems: TimelineItem[] = React.useMemo(() => {
    return tasks
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 25)
      .map((t) => {
        const isOpen = t.status === "OPEN" || t.status === "IN_PROGRESS";
        const accent: AccentColor =
          t.priority === "URGENT" ? "rose"
          : t.priority === "HIGH" ? "amber"
          : t.status === "RESOLVED" ? "emerald"
          : "blue";
        const icon = t.source === "PARTNER" ? "Send" : isOpen ? "Bell" : "CheckCircle2";
        return {
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          timestamp: t.createdAt,
          icon,
          accent,
          actor: t.source === "PARTNER" ? { name: "You" } : { name: "ALO Team" },
        };
      });
  }, [tasks]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Partner Communication Hub"
        subtitle="Your authorized student & application communication"
        icon="Handshake"
        action={
          <Button variant="alo" onClick={() => setContactOpen(true)}>
            <Icon name="MessageSquarePlus" className="size-4" /> Contact ALO
          </Button>
        }
      />

      {/* Persistent restricted-info notice */}
      <Notification type="warning" title="Partner access scope" message="This portal shows only students, applications, and communications explicitly authorized for your partner account. Internal ALO notes, AI risk scores, and confidential information are not visible." />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Assigned Students" value={kpis.assignedStudents} icon="Users" accent="blue" />
        <KpiCard label="Active Applications" value={kpis.activeApps} icon="ClipboardList" accent="violet" />
        <KpiCard label="Unread Messages" value={kpis.unread} icon="Inbox" accent="amber" />
        <KpiCard label="Pending Actions" value={kpis.pendingActions} icon="Clock" accent="rose" />
        <KpiCard label="Recent Updates" value={kpis.recentUpdates} icon="Activity" accent="emerald" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="messages" className="gap-1.5">
            <Icon name="Inbox" className="size-3.5" /> Messages
            {kpis.unread > 0 && (
              <Badge variant="warning" className="ml-1 px-1.5 py-0 text-xs">{kpis.unread}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-1.5">
            <Icon name="ClipboardList" className="size-3.5" /> Applications
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <Icon name="FolderLock" className="size-3.5" /> Documents
          </TabsTrigger>
          <TabsTrigger value="updates" className="gap-1.5">
            <Icon name="Activity" className="size-3.5" /> Updates
          </TabsTrigger>
        </TabsList>

        {/* Messages tab */}
        <TabsContent value="messages" className="space-y-4">
          <Notification type="info" title="Showing messages for students assigned to your partner account" message="Partners can read messages but cannot send to students directly without ALO approval. Use the “Reply via ALO” action to route a reply through the assigned counselor." />

          <SectionCard
            title="Message Inbox"
            description={`${conversations.length} conversations`}
            icon="Inbox"
            action={
              <Button variant="outline" size="sm" onClick={loadMessages}>
                <Icon name="RefreshCw" className="size-3.5" /> Refresh
              </Button>
            }
          >
            {msgLoading ? (
              <LoadingGrid count={4} />
            ) : msgError ? (
              <ErrorState error={msgError} onRetry={loadMessages} />
            ) : conversations.length === 0 ? (
              <EmptyState
                icon="Inbox"
                title="No messages yet"
                description="Conversations with your assigned students will appear here."
              />
            ) : (
              <DataTable
                columns={msgColumns}
                data={conversations}
                pageSize={10}
                onRowClick={(row) => setReplyTarget(row)}
                emptyMessage="No conversations match."
              />
            )}
          </SectionCard>
        </TabsContent>

        {/* Applications tab */}
        <TabsContent value="applications" className="space-y-4">
          <SectionCard
            title="Authorized Applications"
            description={`${apps.length} applications`}
            icon="ClipboardList"
            action={
              <Button variant="outline" size="sm" onClick={loadApps}>
                <Icon name="RefreshCw" className="size-3.5" /> Refresh
              </Button>
            }
          >
            {appLoading ? (
              <LoadingGrid count={4} />
            ) : appError ? (
              <ErrorState error={appError} onRetry={loadApps} />
            ) : apps.length === 0 ? (
              <EmptyState
                icon="ClipboardList"
                title="No applications assigned"
                description="Applications authorized for your partner account will appear here."
              />
            ) : (
              <DataTable
                columns={appColumns}
                data={apps}
                pageSize={10}
                onRowClick={(row) => setAppTarget(row)}
                emptyMessage="No applications match."
              />
            )}
          </SectionCard>
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents" className="space-y-4">
          <Notification type="info" title="Official application documents cannot be deleted" message="They use lifecycle states (Submitted → Verified / Rejected). If a document is rejected, a new version can be uploaded and tracked alongside the previous one." />

          <SectionCard
            title="Authorized Documents"
            description={`${docs.length} documents`}
            icon="FolderLock"
            action={
              <Button variant="outline" size="sm" onClick={loadDocs}>
                <Icon name="RefreshCw" className="size-3.5" /> Refresh
              </Button>
            }
          >
            {docLoading ? (
              <LoadingGrid count={4} />
            ) : docError ? (
              <ErrorState error={docError} onRetry={loadDocs} />
            ) : docs.length === 0 ? (
              <EmptyState
                icon="FolderLock"
                title="No documents available"
                description="Documents authorized for your partner account will appear here."
              />
            ) : (
              <DataTable
                columns={docColumns}
                data={docs}
                pageSize={10}
                emptyMessage="No documents match."
              />
            )}
          </SectionCard>

          {/* Document version-history explainer */}
          <SectionCard
            title="Version History"
            description="How rejected documents are tracked"
            icon="History"
            accent="orange"
          >
            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="danger">Version 1 — Rejected</Badge>
                  <span className="text-xs text-[var(--alo-muted)]">Replaced by a newer version</span>
                </div>
                <p className="mt-2 text-xs text-[var(--alo-text-secondary)]">
                  Reason: e.g. “passport scan unclear, please re-upload a high-resolution colour scan.”
                </p>
              </div>
              <div className="rounded-lg border border-[var(--alo-success)]/40 bg-[var(--alo-success-soft)]/40 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Version 2 — Verified</Badge>
                  <span className="text-xs text-[var(--alo-text-secondary)]">Current</span>
                </div>
                <p className="mt-2 text-xs text-[var(--alo-text-secondary)]">
                  Verified by the ALO application team and linked to the active application.
                </p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Updates tab */}
        <TabsContent value="updates" className="space-y-4">
          <SectionCard
            title="Updates from ALO"
            description="Application stage changes, offers, document requests"
            icon="Activity"
            action={
              <Button variant="outline" size="sm" onClick={loadTasks}>
                <Icon name="RefreshCw" className="size-3.5" /> Refresh
              </Button>
            }
          >
            {taskLoading ? (
              <LoadingGrid count={3} />
            ) : taskError ? (
              <ErrorState error={taskError} onRetry={loadTasks} />
            ) : tasks.length === 0 ? (
              <EmptyState
                icon="Activity"
                title="No updates yet"
                description="Updates about your assigned students will appear here as a timeline."
              />
            ) : (
              <div className="max-h-[40rem] overflow-y-auto alo-scroll pr-2">
                <Timeline items={timelineItems} />
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Application details dialog */}
      <ApplicationDetailsDialog
        application={appTarget}
        open={!!appTarget}
        onOpenChange={(o) => !o && setAppTarget(null)}
      />

      {/* Reply via ALO dialog */}
      <ReplyViaAloDialog
        open={!!replyTarget}
        onOpenChange={(o) => !o && setReplyTarget(null)}
        conversation={replyTarget}
        onSubmit={handleReplyViaAlo}
        saving={replySaving}
      />

      {/* Contact ALO dialog */}
      <ContactAloDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        onSubmit={handleContactAlo}
        saving={contactSaving}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Application details dialog — partner-visible fields only (NO internal notes,
// NO AI risk scores)
// ═══════════════════════════════════════════════════════════════════════════

function ApplicationDetailsDialog({
  application,
  open,
  onOpenChange,
}: {
  application: PartnerApplication | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  if (!application) return null;
  const stage = application.stage;
  const isClosed = ["ENROLLED", "VISA_APPROVED", "VISA_REFUSED"].includes(stage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto alo-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--alo-text)]">
            <Icon name="ClipboardList" className="size-5 text-[var(--alo-blue)]" />
            Application Details
          </DialogTitle>
          <DialogDescription className="text-[var(--alo-muted)]">
            Application ID <span className="font-mono text-[var(--alo-blue-strong)]">{application.applicationId}</span>
          </DialogDescription>
        </DialogHeader>

        <Notification type="info" title="Partner-visible fields only" message="Internal ALO notes, AI risk scores, and confidential employee communication are not visible in this view." />

        <div className="space-y-4">
          {/* Student & program summary */}
          <SectionCard title="Student & Program" icon="User">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailField label="Student" value={application.student?.fullName || "—"} />
              <DetailField label="Student ID" value={application.student?.studentId || "—"} mono />
              <DetailField label="University" value={application.university} />
              <DetailField label="Course" value={application.course} />
              <DetailField label="Country" value={application.country} />
              <DetailField label="Intake" value={application.intake} />
              <DetailField label="Study Level" value={application.studyLevel} />
              <DetailField label="Priority" value={application.priority} />
            </div>
          </SectionCard>

          {/* Stage & status — partner-visible */}
          <SectionCard title="Stage & Status" icon="GitBranch" accent="orange">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailField
                label="Current Stage"
                value={
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STAGE_COLORS[stage] || "bg-slate-100 text-slate-700")}>
                    {STAGE_LABELS[stage] || stage}
                  </span>
                }
              />
              <DetailField
                label="Status"
                value={isClosed ? "Closed" : "In Progress"}
              />
              <DetailField label="Last Updated" value={fmtDate(application.updatedAt)} />
              <DetailField label="Created" value={fmtDate(application.createdAt)} />
            </div>
          </SectionCard>

          {/* Document checklist status (partner-visible) */}
          <SectionCard title="Document Checklist Status" icon="ListChecks" accent="emerald">
            <p className="mb-3 text-xs text-[var(--alo-muted)]">
              Aggregated status across all documents linked to this application.
            </p>
            <div className="space-y-2">
              {DOC_CATEGORIES.slice(0, 8).map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] px-3 py-2"
                >
                  <span className="text-sm text-[var(--alo-text)]">{cat.replace(/_/g, " ").toLowerCase()}</span>
                  <Badge variant="neutral">Pending</Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-[var(--alo-muted)]">{label}</span>
      <span className={cn("text-sm text-[var(--alo-text)]", mono && "font-mono")}>{value || "—"}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Reply via ALO dialog
// ═══════════════════════════════════════════════════════════════════════════

function ReplyViaAloDialog({
  open,
  onOpenChange,
  conversation,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  conversation: Conversation | null;
  onSubmit: (message: string) => void;
  saving: boolean;
}) {
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (open) setMessage("");
  }, [open, conversation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSubmit(message.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--alo-text)]">
            <Icon name="Reply" className="size-5 text-[var(--alo-orange)]" />
            Reply via ALO
          </DialogTitle>
          <DialogDescription className="text-[var(--alo-muted)]">
            Your reply will be routed through the assigned ALO counselor for approval before being sent to{" "}
            <span className="font-medium text-[var(--alo-text)]">{conversation?.studentName || "the student"}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {conversation && (
            <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3">
              <p className="text-xs font-medium text-[var(--alo-muted)]">Original message</p>
              <p className="mt-1 line-clamp-3 text-sm text-[var(--alo-text-secondary)]">
                {conversation.messages[conversation.messages.length - 1]?.body}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reply-msg" className="text-xs">Your message</Label>
            <Textarea
              id="reply-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your reply. ALO will review and forward it to the student."
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="alo" disabled={saving || !message.trim()}>
              {saving ? (
                <>
                  <Icon name="Loader2" className="size-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Icon name="Send" className="size-4" /> Send via ALO
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Contact ALO dialog
// ═══════════════════════════════════════════════════════════════════════════

function ContactAloDialog({
  open,
  onOpenChange,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (subject: string, message: string, priority: string) => void;
  saving: boolean;
}) {
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [priority, setPriority] = React.useState("MEDIUM");

  React.useEffect(() => {
    if (open) {
      setSubject("");
      setMessage("");
      setPriority("MEDIUM");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    onSubmit(subject.trim(), message.trim(), priority);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--alo-text)]">
            <Icon name="MessageSquarePlus" className="size-5 text-[var(--alo-blue)]" />
            Contact ALO Support
          </DialogTitle>
          <DialogDescription className="text-[var(--alo-muted)]">
            Send a message to the ALO support team. A team member will respond to you shortly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="alo-subject" className="text-xs">Subject</Label>
            <Input
              id="alo-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Question about an application stage"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alo-msg" className="text-xs">Message</Label>
            <Textarea
              id="alo-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question or request for the ALO team."
              rows={5}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low — general question</SelectItem>
                <SelectItem value="MEDIUM">Medium — needs response soon</SelectItem>
                <SelectItem value="HIGH">High — application blocked</SelectItem>
                <SelectItem value="URGENT">Urgent — deadline today</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="alo" disabled={saving || !subject.trim() || !message.trim()}>
              {saving ? (
                <>
                  <Icon name="Loader2" className="size-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Icon name="Send" className="size-4" /> Send to ALO
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default PartnerCommHub;
