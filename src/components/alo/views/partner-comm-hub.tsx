"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  InfoRow,
} from "@/components/alo/shared";
import {
  DataTable,
  type DataTableColumn,
  Timeline,
  Notification,
  Pill,
  fetchJson,
  channelMeta,
  fmtDateTime,
  timeAgoShort,
} from "@/components/alo/comm-helpers";

// ─── Types ────────────────────────────────────────────────────────────────

interface Conversation {
  key: string;
  channel: string;
  studentId?: string | null;
  studentName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  messages: Array<{
    id: string;
    direction: string;
    body: string;
    read?: boolean | null;
    receivedAt: string;
    sentAt?: string | null;
  }>;
  unread: number;
  lastMessageAt: string;
}

interface InboxResponse {
  conversations: Conversation[];
  totalMessages: number;
}

interface Application {
  id: string;
  applicationId?: string | null;
  studentName?: string | null;
  university?: string | null;
  program?: string | null;
  country?: string | null;
  intake?: string | null;
  stage?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface DocumentRow {
  id: string;
  documentId?: string | null;
  docType?: string | null;
  fileName?: string | null;
  reviewStatus?: string | null;
  version?: number | null;
  uploadedAt?: string;
  reviewerNote?: string | null;
}

interface CommTask {
  id: string;
  title: string;
  description?: string | null;
  channel?: string | null;
  source?: string | null;
  status: string;
  priority?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

// ─── Main Component ────────────────────────────────────────────────────────

export function PartnerCommHub() {
  const { toast } = useToast();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [documents, setDocuments] = React.useState<DocumentRow[]>([]);
  const [tasks, setTasks] = React.useState<CommTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [activeApp, setActiveApp] = React.useState<Application | null>(null);
  const [contactAloOpen, setContactAloOpen] = React.useState(false);
  const [tab, setTab] = React.useState("messages");

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [inboxRes, appResRaw, docResRaw, taskRes] = await Promise.all([
        fetchJson<InboxResponse>("/api/inbox/unified").catch(() => ({ conversations: [], totalMessages: 0 }) as InboxResponse),
        fetchJson<{ applications?: Application[]; data?: Application[] }>("/api/applications").catch(() => ({ applications: [] as Application[] })),
        fetchJson<{ documents?: DocumentRow[]; data?: DocumentRow[] }>("/api/documents").catch(() => ({ documents: [] as DocumentRow[] })),
        fetchJson<{ tasks: CommTask[] }>("/api/communications/tasks").catch(() => ({ tasks: [] as CommTask[] })),
      ]);
      const appRes = appResRaw as { applications?: Application[]; data?: Application[] };
      const docRes = docResRaw as { documents?: DocumentRow[]; data?: DocumentRow[] };
      setConversations(inboxRes.conversations || []);
      const appList: Application[] = appRes.applications || appRes.data || [];
      setApplications(appList);
      const docList: DocumentRow[] = docRes.documents || docRes.data || [];
      setDocuments(docList);
      setTasks(taskRes.tasks || []);
    } catch (err) {
      console.error("[partner-comm-hub]", err);
      setError(true);
      toast({
        title: "Failed to load partner hub",
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

  const unreadCount = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  const activeApps = applications.filter((a) => a.status !== "REJECTED" && a.status !== "WITHDRAWN").length;
  const pendingActions = tasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;

  const handleReplyViaAlo = async (conv: Conversation) => {
    try {
      await fetchJson("/api/communications/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: `Partner reply request — ${conv.studentName || conv.fromPhone || "unknown"}`,
          description: `Partner requested a reply via the ALO portal. Last message: ${(conv.messages[0]?.body || "").slice(0, 120)}`,
          channel: conv.channel,
          priority: "NORMAL",
          source: "PARTNER_PORTAL",
          status: "OPEN",
          studentId: conv.studentId || undefined,
        }),
      });
      toast({
        title: "Reply request submitted",
        description: "An ALO counselor will respond to this conversation shortly.",
      });
      void fetchAll();
    } catch (err) {
      toast({
        title: "Failed to submit request",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Partner Communication Hub" subtitle="Authorized partner portal — students, applications, and communications explicitly assigned to your account." icon="Handshake" />
        <LoadingGrid count={4} />
      </div>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Partner Communication Hub" subtitle="Authorized partner portal — students, applications, and communications explicitly assigned to your account." icon="Handshake" />
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-[#991B1B]">Failed to load partner hub</p>
          <Button onClick={() => void fetchAll()} className="mt-3" size="sm">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Communication Hub"
        subtitle="Authorized partner portal — students, applications, and communications explicitly assigned to your account."
        icon="Handshake"
        action={
          <Button
            onClick={() => setContactAloOpen(true)}
            className="h-10 bg-[#0057B8] text-white hover:bg-[#003a7a]"
          >
            <Icon name="Headset" className="mr-2 size-4" />
            Contact ALO
          </Button>
        }
      />

      {/* Persistent partner authorization notice */}
      <Notification
        type="warning"
        title="Partner Access Notice"
        description="This portal shows only students, applications, and communications explicitly authorized for your partner account. Any attempt to access unauthorized records will be logged and may result in account suspension."
        icon="ShieldCheck"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Assigned Students" value={applications.length} icon="Users" accent="blue" />
        <KpiCard label="Active Applications" value={activeApps} icon="ClipboardList" accent="emerald" />
        <KpiCard label="Unread Messages" value={unreadCount} icon="Mail" accent="orange" />
        <KpiCard label="Pending Actions" value={pendingActions} icon="ListTodo" accent="amber" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <div className="overflow-x-auto alo-scroll rounded-xl border border-[#E2E8F0] bg-white p-1.5">
          <TabsList className="h-auto w-max gap-1 bg-transparent">
            <TabsTrigger value="messages" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
              <Icon name="Mail" className="mr-1.5 size-3.5" /> Messages
              {unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-[#E8501A] px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
              <Icon name="ClipboardList" className="mr-1.5 size-3.5" /> Applications
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
              <Icon name="FolderLock" className="mr-1.5 size-3.5" /> Documents
            </TabsTrigger>
            <TabsTrigger value="updates" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
              <Icon name="Activity" className="mr-1.5 size-3.5" /> Updates
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Messages tab */}
        <TabsContent value="messages" className="space-y-4">
          <SectionCard
            title="Messages"
            description={`${conversations.length} authorized conversation(s)`}
            icon="Mail"
          >
            <MessagesTable conversations={conversations} onReply={handleReplyViaAlo} />
          </SectionCard>
        </TabsContent>

        {/* Applications tab */}
        <TabsContent value="applications" className="space-y-4">
          <SectionCard
            title="Applications"
            description="Applications explicitly authorized for your partner account"
            icon="ClipboardList"
          >
            <ApplicationsTable
              applications={applications}
              onView={(app) => setActiveApp(app)}
            />
          </SectionCard>
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents" className="space-y-4">
          <SectionCard
            title="Documents"
            description="Documents shared with your partner account"
            icon="FolderLock"
          >
            <Notification
              type="warning"
              title="Documents are read-only"
              description="Partners cannot delete or modify documents. Version history is preserved for all rejected documents — only ALO admins can revoke access."
              icon="Lock"
              className="mb-3"
            />
            <DocumentsTable documents={documents} />
          </SectionCard>
        </TabsContent>

        {/* Updates tab */}
        <TabsContent value="updates" className="space-y-4">
          <SectionCard
            title="Communication Updates"
            description="Recent task & message updates for your partner account"
            icon="Activity"
          >
            {tasks.length === 0 ? (
              <EmptyState
                icon="Activity"
                title="No updates yet"
                description="Communication updates about your assigned students will appear here."
              />
            ) : (
              <Timeline
                items={tasks.slice(0, 15).map((t) => ({
                  id: t.id,
                  title: t.title,
                  description: t.description || undefined,
                  timestamp: timeAgoShort(t.createdAt),
                  accent:
                    t.status === "RESOLVED"
                      ? "emerald"
                      : t.status === "OPEN"
                      ? "amber"
                      : "blue",
                  meta: t.status,
                }))}
              />
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <ApplicationDetailsDialog
        app={activeApp}
        onOpenChange={(o) => !o && setActiveApp(null)}
      />
      <ContactAloDialog open={contactAloOpen} onOpenChange={setContactAloOpen} />
    </div>
  );
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
          <p className="mt-1 text-xl font-bold tabular-nums text-[#0F172A] sm:text-2xl">{value}</p>
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", accentMap[accent])}>
          <Icon name={icon} className="size-4" />
        </span>
      </div>
    </div>
  );
}

function MessagesTable({
  conversations,
  onReply,
}: {
  conversations: Conversation[];
  onReply: (conv: Conversation) => void;
}) {
  const columns: DataTableColumn<Conversation>[] = [
    {
      key: "studentName",
      header: "Student",
      render: (c) => (
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">
            {c.studentName || c.fromPhone || "Unknown"}
          </p>
          {c.studentId && (
            <p className="text-[11px] text-[#64748B]">{c.studentId}</p>
          )}
        </div>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      render: (c) => {
        const m = channelMeta(c.channel);
        return (
          <Pill className={cn("gap-1", m.bg, m.text)}>
            <Icon name={m.icon} className="size-3" />
            {m.label}
          </Pill>
        );
      },
    },
    {
      key: "lastMessage",
      header: "Last Message",
      render: (c) => (
        <span className="line-clamp-1 text-xs text-[#475569]">
          {c.messages[0]?.body || "—"}
        </span>
      ),
    },
    {
      key: "unread",
      header: "Unread",
      render: (c) =>
        c.unread > 0 ? (
          <Pill className="bg-[#E8501A] text-white">{c.unread}</Pill>
        ) : (
          <span className="text-xs text-[#94A3B8]">0</span>
        ),
    },
    {
      key: "lastMessageAt",
      header: "When",
      render: (c) => <span className="text-xs">{timeAgoShort(c.lastMessageAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <Button
          size="sm"
          className="h-7 bg-[#0057B8] px-2 text-[10px] hover:bg-[#003a7a]"
          onClick={() => onReply(c)}
        >
          <Icon name="Reply" className="mr-1 size-3" />
          Reply via ALO
        </Button>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={conversations}
      rowKey={(c) => c.key}
      emptyTitle="No authorized conversations"
      emptyDescription="Conversations for your assigned students will appear here."
      emptyIcon="Mail"
      maxHeight="520px"
    />
  );
}

function ApplicationsTable({
  applications,
  onView,
}: {
  applications: Application[];
  onView: (app: Application) => void;
}) {
  const columns: DataTableColumn<Application>[] = [
    {
      key: "studentName",
      header: "Student",
      render: (a) => (
        <span className="text-sm font-semibold text-[#0F172A]">
          {a.studentName || "—"}
        </span>
      ),
    },
    {
      key: "university",
      header: "University",
      render: (a) => (
        <span className="text-xs text-[#475569]">{a.university || "—"}</span>
      ),
    },
    {
      key: "program",
      header: "Program",
      render: (a) => <span className="text-xs">{a.program || "—"}</span>,
    },
    {
      key: "country",
      header: "Country",
      render: (a) => <span className="text-xs">{a.country || "—"}</span>,
    },
    {
      key: "intake",
      header: "Intake",
      render: (a) => <span className="text-xs">{a.intake || "—"}</span>,
    },
    {
      key: "stage",
      header: "Stage",
      render: (a) => (
        <Pill className="bg-[#EFF6FF] text-[#0057B8]">
          {a.stage?.replace(/_/g, " ").toLowerCase() || "—"}
        </Pill>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (a) => <span className="text-xs">{timeAgoShort(a.updatedAt || a.createdAt || "")}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-[10px]"
          onClick={() => onView(a)}
        >
          <Icon name="Eye" className="mr-1 size-3" />
          View
        </Button>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={applications}
      rowKey={(a) => a.id}
      emptyTitle="No authorized applications"
      emptyDescription="Applications assigned to your partner account will appear here."
      emptyIcon="ClipboardList"
      maxHeight="520px"
    />
  );
}

function DocumentsTable({ documents }: { documents: DocumentRow[] }) {
  const columns: DataTableColumn<DocumentRow>[] = [
    {
      key: "docType",
      header: "Type",
      render: (d) => (
        <span className="text-sm font-medium text-[#0F172A]">
          {d.docType?.replace(/_/g, " ").toLowerCase() || "Document"}
        </span>
      ),
    },
    {
      key: "fileName",
      header: "File",
      render: (d) => (
        <span className="line-clamp-1 text-xs text-[#475569]">
          {d.fileName || "—"}
        </span>
      ),
    },
    {
      key: "version",
      header: "Version",
      render: (d) => (
        <span className="text-xs tabular-nums">v{d.version || 1}</span>
      ),
    },
    {
      key: "reviewStatus",
      header: "Review",
      render: (d) => {
        const colorMap: Record<string, string> = {
          PENDING: "bg-amber-100 text-amber-700",
          APPROVED: "bg-emerald-100 text-emerald-700",
          REJECTED: "bg-rose-100 text-rose-700",
          UPLOADED: "bg-sky-100 text-sky-700",
        };
        return (
          <Pill className={colorMap[d.reviewStatus || "PENDING"] || "bg-slate-100"}>
            {d.reviewStatus || "PENDING"}
          </Pill>
        );
      },
    },
    {
      key: "uploadedAt",
      header: "Uploaded",
      render: (d) => <span className="text-xs">{fmtDateTime(d.uploadedAt)}</span>,
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={documents}
      rowKey={(d) => d.id}
      emptyTitle="No authorized documents"
      emptyDescription="Documents shared with your partner account will appear here."
      emptyIcon="FolderLock"
      maxHeight="520px"
    />
  );
}

function ApplicationDetailsDialog({
  app,
  onOpenChange,
}: {
  app: Application | null;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={!!app} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>
            Partner-visible fields only — sensitive data is masked.
          </DialogDescription>
        </DialogHeader>
        {app && (
          <div className="space-y-2">
            <InfoRow label="Student" value={app.studentName || "—"} />
            <InfoRow label="University" value={app.university || "—"} />
            <InfoRow label="Program" value={app.program || "—"} />
            <InfoRow label="Country" value={app.country || "—"} />
            <InfoRow label="Intake" value={app.intake || "—"} />
            <InfoRow
              label="Stage"
              value={app.stage?.replace(/_/g, " ").toLowerCase() || "—"}
            />
            <InfoRow label="Status" value={app.status || "—"} />
            <InfoRow label="Updated" value={fmtDateTime(app.updatedAt || app.createdAt)} />
            <Notification
              type="info"
              description="Sensitive fields (financial details, internal notes, visa refusals) are hidden from partner accounts per data-sharing agreement."
              icon="Lock"
              className="mt-3"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactAloDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { toast } = useToast();
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Subject and message are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetchJson("/api/communications/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: `[Partner] ${subject.trim()}`,
          description: message.trim(),
          channel: "PORTAL",
          priority: "NORMAL",
          source: "PARTNER_PORTAL",
          status: "OPEN",
        }),
      });
      toast({ title: "Message sent to ALO", description: "A counselor will respond within 1 business day." });
      setSubject("");
      setMessage("");
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Failed to send message",
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
          <DialogTitle>Contact ALO</DialogTitle>
          <DialogDescription>
            Send a message to the ALO partner support team. We respond within 1 business day.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="alo-subject">Subject</Label>
            <Input
              id="alo-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Question about student application"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="alo-message">Message</Label>
            <Textarea
              id="alo-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message…"
              className="mt-1 min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-[#0057B8] text-white hover:bg-[#003a7a]"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Sending…" : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
