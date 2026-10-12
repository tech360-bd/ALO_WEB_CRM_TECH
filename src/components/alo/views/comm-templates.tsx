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
} from "@/components/alo/shared";
import {
  DataTable,
  type DataTableColumn,
  SearchInput,
  Pill,
  fetchJson,
  channelMeta,
  timeAgoShort,
} from "@/components/alo/comm-helpers";

// ─── Types ────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  templateId?: string | null;
  name: string;
  category: string;
  channel: string;
  language?: string | null;
  subject?: string | null;
  body: string;
  variables?: string | null;
  status: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface QuickReply {
  id: string;
  title: string;
  body: string;
  category?: string | null;
  channel?: string | null;
  shortcut?: string | null;
  sortOrder?: number | null;
  isActive: boolean;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  LOCKED: "bg-violet-100 text-violet-700",
  ARCHIVED: "bg-rose-100 text-rose-700",
};

const VARIABLE_SUGGESTIONS = [
  "{{student_name}}",
  "{{student_id}}",
  "{{university}}",
  "{{program}}",
  "{{country}}",
  "{{counselor_name}}",
  "{{application_stage}}",
  "{{next_deadline}}",
  "{{interview_date}}",
  "{{visa_status}}",
];

const CHANNEL_OPTIONS = [
  "WHATSAPP",
  "EMAIL",
  "SMS",
  "PHONE",
  "PORTAL",
  "WEBSITE_CHAT",
  "FACEBOOK",
  "INSTAGRAM",
];

const CATEGORY_OPTIONS = [
  "GREETING",
  "INQUIRY",
  "DOCUMENT_REQUEST",
  "APPOINTMENT",
  "FOLLOW_UP",
  "VISA_UPDATE",
  "APPLICATION_UPDATE",
  "PAYMENT_REMINDER",
  "INTERVIEW_PREP",
  "COMPLAINT",
  "HOLIDAY",
  "GENERAL",
];

// ─── Main Component ────────────────────────────────────────────────────────

export function CommTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [quickReplies, setQuickReplies] = React.useState<QuickReply[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [channel, setChannel] = React.useState("ALL");
  const [category, setCategory] = React.useState("ALL");
  const [status, setStatus] = React.useState("ALL");
  const [createTemplateOpen, setCreateTemplateOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<Template | null>(null);
  const [createQuickReplyOpen, setCreateQuickReplyOpen] = React.useState(false);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [tplRes, qrRes] = await Promise.all([
        fetchJson<{ templates: Template[] }>("/api/communications/templates"),
        fetchJson<{ quickReplies: QuickReply[] }>("/api/communications/quick-replies"),
      ]);
      setTemplates(tplRes.templates || []);
      setQuickReplies(qrRes.quickReplies || []);
    } catch (err) {
      console.error("[comm-templates]", err);
      setError(true);
      toast({
        title: "Failed to load templates",
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

  const filteredTemplates = templates.filter((t) => {
    if (channel !== "ALL" && t.channel !== channel) return false;
    if (category !== "ALL" && t.category !== category) return false;
    if (status !== "ALL" && t.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleArchive = async (t: Template) => {
    try {
      await fetchJson(`/api/communications/templates/${t.id}`, { method: "DELETE" });
      toast({ title: "Template archived", description: t.name });
      setTemplates((arr) => arr.filter((x) => x.id !== t.id));
    } catch (err) {
      toast({
        title: "Failed to archive template",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  const handleToggleLock = async (t: Template) => {
    try {
      await fetchJson(`/api/communications/templates/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isLocked: !t.isLocked }),
      });
      toast({ title: t.isLocked ? "Template unlocked" : "Template locked" });
      void fetchAll();
    } catch (err) {
      toast({
        title: "Failed to update template",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (t: Template) => {
    try {
      await fetchJson(`/api/communications/templates/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED", isLocked: true, approvedById: "manager-placeholder" }),
      });
      toast({ title: "Template approved & locked" });
      void fetchAll();
    } catch (err) {
      toast({
        title: "Failed to approve template",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Communication Templates" subtitle="Manage reusable message templates with variables and approval workflow." icon="FileText" />
        <LoadingGrid count={5} />
      </div>
    );
  }

  if (error && templates.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Communication Templates" subtitle="Manage reusable message templates with variables and approval workflow." icon="FileText" />
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-[#991B1B]">Failed to load templates</p>
          <Button onClick={() => void fetchAll()} className="mt-3" size="sm">Retry</Button>
        </div>
      </div>
    );
  }

  const counts = {
    total: templates.length,
    approved: templates.filter((t) => t.status === "APPROVED").length,
    pending: templates.filter((t) => t.status === "PENDING_APPROVAL").length,
    locked: templates.filter((t) => t.isLocked).length,
    drafts: templates.filter((t) => t.status === "DRAFT").length,
    archived: templates.filter((t) => t.status === "ARCHIVED").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Communication Templates"
        subtitle="Manage reusable message templates with variables and approval workflow."
        icon="FileText"
        action={
          <Button
            onClick={() => setCreateTemplateOpen(true)}
            className="h-10 bg-[#0057B8] text-white hover:bg-[#003a7a]"
          >
            <Icon name="Plus" className="mr-2 size-4" />
            New Template
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total" value={counts.total} icon="FileText" accent="blue" />
        <KpiCard label="Approved" value={counts.approved} icon="CheckCircle2" accent="emerald" />
        <KpiCard label="Pending Approval" value={counts.pending} icon="Clock" accent="amber" />
        <KpiCard label="Locked" value={counts.locked} icon="Lock" accent="violet" />
        <KpiCard label="Drafts" value={counts.drafts} icon="FileEdit" accent="orange" />
        <KpiCard label="Archived" value={counts.archived} icon="Archive" accent="rose" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search templates…"
          className="sm:w-72"
        />
        <div className="flex flex-wrap gap-2">
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="h-9 w-full sm:w-40">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All channels</SelectItem>
              {CHANNEL_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {channelMeta(c).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replace(/_/g, " ").toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {["DRAFT", "PENDING_APPROVAL", "APPROVED", "LOCKED", "ARCHIVED"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ").toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates table */}
      <SectionCard
        title="Templates"
        description={`${filteredTemplates.length} of ${templates.length} template(s)`}
        icon="FileText"
      >
        <TemplatesTable
          templates={filteredTemplates}
          onEdit={(t) => setEditingTemplate(t)}
          onArchive={(t) => void handleArchive(t)}
          onToggleLock={(t) => void handleToggleLock(t)}
          onApprove={(t) => void handleApprove(t)}
        />
      </SectionCard>

      {/* Quick Replies */}
      <SectionCard
        title="Quick Replies"
        description={`${quickReplies.length} quick reply snippet(s)`}
        icon="Zap"
        action={
          <Button
            onClick={() => setCreateQuickReplyOpen(true)}
            className="h-9 bg-[#0057B8] text-white hover:bg-[#003a7a]"
          >
            <Icon name="Plus" className="mr-1.5 size-4" />
            New Quick Reply
          </Button>
        }
      >
        <QuickRepliesTable quickReplies={quickReplies} />
      </SectionCard>

      <TemplateEditDialog
        open={createTemplateOpen || !!editingTemplate}
        template={editingTemplate}
        onOpenChange={(o) => {
          if (!o) setEditingTemplate(null);
          setCreateTemplateOpen(o);
        }}
        onSaved={() => void fetchAll()}
      />
      <QuickReplyDialog
        open={createQuickReplyOpen}
        onOpenChange={setCreateQuickReplyOpen}
        onSaved={() => void fetchAll()}
      />
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
          <p className="mt-1 text-lg font-bold tabular-nums text-[#0F172A] sm:text-xl">{value}</p>
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", accentMap[accent])}>
          <Icon name={icon} className="size-4" />
        </span>
      </div>
    </div>
  );
}

function TemplatesTable({
  templates,
  onEdit,
  onArchive,
  onToggleLock,
  onApprove,
}: {
  templates: Template[];
  onEdit: (t: Template) => void;
  onArchive: (t: Template) => void;
  onToggleLock: (t: Template) => void;
  onApprove: (t: Template) => void;
}) {
  const columns: DataTableColumn<Template>[] = [
    {
      key: "name",
      header: "Name",
      render: (t) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#0F172A]">{t.name}</p>
            {t.isLocked && (
              <Icon name="Lock" className="size-3 text-violet-600" />
            )}
          </div>
          {t.subject && <p className="text-[11px] text-[#64748B]">Subject: {t.subject}</p>}
        </div>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      render: (t) => {
        const m = channelMeta(t.channel);
        return (
          <Pill className={cn("gap-1", m.bg, m.text)}>
            <Icon name={m.icon} className="size-3" />
            {m.label}
          </Pill>
        );
      },
    },
    {
      key: "category",
      header: "Category",
      render: (t) => (
        <span className="text-xs">{t.category.replace(/_/g, " ").toLowerCase()}</span>
      ),
    },
    {
      key: "language",
      header: "Lang",
      render: (t) => <span className="text-xs">{t.language || "en"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <Pill className={STATUS_COLORS[t.status] || "bg-slate-100 text-slate-700"}>
          {t.status.replace(/_/g, " ").toLowerCase()}
        </Pill>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (t) => <span className="text-xs">{timeAgoShort(t.updatedAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (t) => (
        <div className="flex justify-end gap-1">
          {t.status === "PENDING_APPROVAL" && (
            <Button
              size="sm"
              className="h-7 bg-emerald-600 px-2 text-[10px] hover:bg-emerald-700"
              onClick={() => onApprove(t)}
            >
              Approve
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[10px]"
            onClick={() => onToggleLock(t)}
            disabled={t.status === "ARCHIVED"}
          >
            <Icon name={t.isLocked ? "Unlock" : "Lock"} className="mr-1 size-3" />
            {t.isLocked ? "Unlock" : "Lock"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[10px]"
            onClick={() => onEdit(t)}
            disabled={t.isLocked}
          >
            <Icon name="Edit" className="mr-1 size-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-rose-200 px-2 text-[10px] text-rose-600 hover:bg-rose-50"
            onClick={() => onArchive(t)}
          >
            <Icon name="Archive" className="size-3" />
          </Button>
        </div>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={templates}
      rowKey={(t) => t.id}
      emptyTitle="No templates found"
      emptyDescription="Create your first communication template to standardize counselor responses."
      emptyIcon="FileText"
      maxHeight="520px"
    />
  );
}

function QuickRepliesTable({ quickReplies }: { quickReplies: QuickReply[] }) {
  const columns: DataTableColumn<QuickReply>[] = [
    {
      key: "title",
      header: "Title",
      render: (q) => (
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">{q.title}</p>
          {q.shortcut && (
            <p className="font-mono text-[11px] text-[#64748B]">/{q.shortcut}</p>
          )}
        </div>
      ),
    },
    {
      key: "body",
      header: "Body",
      render: (q) => (
        <span className="line-clamp-2 text-xs text-[#475569]">{q.body}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (q) => (
        <span className="text-xs">{q.category?.replace(/_/g, " ").toLowerCase() || "—"}</span>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      render: (q) => <span className="text-xs">{q.channel || "ALL"}</span>,
    },
    {
      key: "isActive",
      header: "Active",
      render: (q) =>
        q.isActive ? (
          <Pill className="bg-emerald-100 text-emerald-700">Yes</Pill>
        ) : (
          <Pill className="bg-slate-100 text-slate-600">No</Pill>
        ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={quickReplies}
      rowKey={(q) => q.id}
      emptyTitle="No quick replies"
      emptyDescription="Quick replies are short, ready-to-send snippets for fast counselor responses."
      emptyIcon="Zap"
      maxHeight="420px"
    />
  );
}

function TemplateEditDialog({
  open,
  template,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  template: Template | null;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("GREETING");
  const [channel, setChannel] = React.useState("WHATSAPP");
  const [language, setLanguage] = React.useState("en");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [status, setStatus] = React.useState("DRAFT");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setChannel(template.channel);
      setLanguage(template.language || "en");
      setSubject(template.subject || "");
      setBody(template.body);
      setStatus(template.status);
    } else {
      setName("");
      setCategory("GREETING");
      setChannel("WHATSAPP");
      setLanguage("en");
      setSubject("");
      setBody("");
      setStatus("DRAFT");
    }
  }, [template, open]);

  const insertVariable = (v: string) => {
    setBody((b) => b + v);
  };

  const submit = async () => {
    if (!name.trim() || !body.trim()) {
      toast({ title: "Name and body are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      if (template) {
        await fetchJson(`/api/communications/templates/${template.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: name.trim(),
            category,
            channel,
            language,
            subject: subject.trim() || null,
            body: body.trim(),
            status,
          }),
        });
        toast({ title: "Template updated" });
      } else {
        await fetchJson("/api/communications/templates", {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            category,
            channel,
            language,
            subject: subject.trim() || undefined,
            body: body.trim(),
            status,
          }),
        });
        toast({ title: "Template created" });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast({
        title: "Failed to save template",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "New Template"}</DialogTitle>
          <DialogDescription>
            Use variables like &#123;&#123;student_name&#125;&#125; for personalization at send time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tpl-name">Template Name</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. WhatsApp Welcome Message"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {channelMeta(c).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, " ").toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["en", "bn", "hi"].map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["DRAFT", "PENDING_APPROVAL", "APPROVED"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ").toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {channel === "EMAIL" && (
            <div>
              <Label htmlFor="tpl-subject">Subject (Email only)</Label>
              <Input
                id="tpl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="mt-1"
              />
            </div>
          )}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="tpl-body">Body</Label>
              <div className="flex flex-wrap gap-1">
                {VARIABLE_SUGGESTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="rounded bg-[#EFF6FF] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#0057B8] hover:bg-[#DBEAFE]"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              id="tpl-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hello {{student_name}}, this is {{counselor_name}} from ALO Education…"
              className="mt-1 min-h-[180px] font-mono text-sm"
            />
            <p className="mt-1 text-[11px] text-[#94A3B8]">
              Click a variable above to insert it into your message.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-[#0057B8] text-white hover:bg-[#003a7a]"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Saving…" : template ? "Save Changes" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuickReplyDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [category, setCategory] = React.useState("GENERAL");
  const [channel, setChannel] = React.useState("ALL");
  const [shortcut, setShortcut] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Title and body are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetchJson("/api/communications/quick-replies", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category,
          channel,
          shortcut: shortcut.trim() || undefined,
          isActive: true,
        }),
      });
      toast({ title: "Quick reply created" });
      setTitle("");
      setBody("");
      setShortcut("");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast({
        title: "Failed to create quick reply",
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
          <DialogTitle>New Quick Reply</DialogTitle>
          <DialogDescription>
            A short, ready-to-send snippet that counselors can use to respond quickly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="qr-title">Title</Label>
            <Input
              id="qr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Office Hours"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="qr-body">Body</Label>
            <Textarea
              id="qr-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Our office is open Sunday–Thursday, 9 AM – 6 PM."
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {CHANNEL_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="qr-shortcut">Shortcut</Label>
              <Input
                id="qr-shortcut"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="hours"
                className="mt-1 font-mono"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-[#0057B8] text-white hover:bg-[#003a7a]"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Creating…" : "Create Quick Reply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
