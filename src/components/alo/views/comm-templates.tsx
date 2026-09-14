"use client";

/**
 * ALO Education — Communication Template Manager
 * ===============================================
 * Official approved templates for WhatsApp, Email & SMS.
 * Plus a Quick Replies management surface.
 *
 * Backend contracts:
 *   GET    /api/communications/templates?channel&category&status&language
 *   POST   /api/communications/templates
 *   PATCH  /api/communications/templates/[id]
 *   DELETE /api/communications/templates/[id]  (archives, sets status=ARCHIVED)
 *   GET    /api/communications/quick-replies?channel&category&isActive
 *   POST   /api/communications/quick-replies
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
import { Checkbox } from "@/components/ui/checkbox";
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
  SearchInput,
  RichTextEditor,
  Notification,
  StatusBadge,
  type Column,
  type AccentColor,
} from "@/components/alo/ui";
import { fmtDate, timeAgo } from "@/lib/alo-types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  templateId: string;
  name: string;
  category: string;
  channel: string;
  language: string;
  subject: string | null;
  body: string;
  variables: string; // JSON array string
  version: number;
  status: string; // DRAFT | PENDING_APPROVAL | APPROVED | LOCKED | ARCHIVED
  isLocked: boolean;
  approvedById: string | null;
  approvedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface QuickReply {
  id: string;
  title: string;
  body: string;
  category: string;
  channel: string;
  shortcut: string | null;
  sortOrder: number;
  isActive: boolean;
  usedCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants & metadata
// ─────────────────────────────────────────────────────────────────────────────

const CHANNELS = [
  { value: "WHATSAPP", label: "WhatsApp", icon: "MessageCircle" },
  { value: "EMAIL", label: "Email", icon: "Mail" },
  { value: "SMS", label: "SMS", icon: "MessageSquare" },
  { value: "PORTAL", label: "Portal", icon: "LayoutDashboard" },
];

const CATEGORIES = [
  { value: "DOCUMENT_REQUEST", label: "Document Request" },
  { value: "OFFER_NOTIFICATION", label: "Offer Notification" },
  { value: "PAYMENT_INSTRUCTION", label: "Payment Instruction" },
  { value: "PAYMENT_REMINDER", label: "Payment Reminder" },
  { value: "INTERVIEW_REMINDER", label: "Interview Reminder" },
  { value: "VISA_REMINDER", label: "Visa Reminder" },
  { value: "SUCCESS", label: "Success" },
  { value: "REVIEW_REQUEST", label: "Review Request" },
  { value: "GREETING", label: "Greeting" },
  { value: "FOLLOW_UP", label: "Follow-up" },
];

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "LOCKED", label: "Locked" },
  { value: "ARCHIVED", label: "Archived" },
];

const TEMPLATE_STATUS_ACCENT: Record<string, AccentColor> = {
  DRAFT: "slate",
  PENDING_APPROVAL: "amber",
  APPROVED: "emerald",
  LOCKED: "blue",
  ARCHIVED: "rose",
};

const TEMPLATE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  LOCKED: "Locked",
  ARCHIVED: "Archived",
};

const CHANNEL_META: Record<string, { label: string; icon: string; accent: AccentColor }> = {
  WHATSAPP: { label: "WhatsApp", icon: "MessageCircle", accent: "emerald" },
  EMAIL: { label: "Email", icon: "Mail", accent: "violet" },
  SMS: { label: "SMS", icon: "MessageSquare", accent: "sky" },
  PORTAL: { label: "Portal", icon: "LayoutDashboard", accent: "orange" },
};

const QUICK_REPLY_CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "DOCUMENT", label: "Document" },
  { value: "PAYMENT", label: "Payment" },
  { value: "VISA", label: "Visa" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "APPLICATION", label: "Application" },
];

const VARIABLE_SUGGESTIONS = [
  { token: "{{student_name}}", label: "Student name" },
  { token: "{{university}}", label: "University" },
  { token: "{{deadline}}", label: "Deadline" },
  { token: "{{amount}}", label: "Amount" },
  { token: "{{counselor_name}}", label: "Counselor name" },
  { token: "{{appointment_date}}", label: "Appointment date" },
];

// Demo role — the real RBAC will come from session. UI gates the Lock action on this.
const CURRENT_ROLE = "SUPER_ADMIN"; // SUPER_ADMIN | ADMIN | COUNSELOR | others
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const isAdmin = ADMIN_ROLES.includes(CURRENT_ROLE);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseVariables(raw: string): { name: string }[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function extractVariablesFromText(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
  return Array.from(new Set(matches.map((m) => m.trim())));
}

function suggestTemplateId(category: string, channel: string, language: string): string {
  if (!category || !channel) return "";
  const cat = category.split("_")[0];
  const ch = channel.slice(0, 2);
  const lang = (language || "en").toLowerCase();
  return `${cat}_${ch}_${lang}_V1`.toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Template form state
// ─────────────────────────────────────────────────────────────────────────────

interface TemplateFormState {
  templateId: string;
  name: string;
  category: string;
  channel: string;
  language: string;
  subject: string;
  body: string;
  variables: string; // JSON
  status: string;
  isLocked: boolean;
}

const EMPTY_FORM: TemplateFormState = {
  templateId: "",
  name: "",
  category: "DOCUMENT_REQUEST",
  channel: "WHATSAPP",
  language: "en",
  subject: "",
  body: "",
  variables: "[]",
  status: "DRAFT",
  isLocked: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function CommTemplates() {
  const { toast } = useToast();

  // ── Template state ──────────────────────────────────────────────────────
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [tplLoading, setTplLoading] = React.useState(true);
  const [tplError, setTplError] = React.useState<string | null>(null);

  // Filters
  const [fChannel, setFChannel] = React.useState<string>("ALL");
  const [fCategory, setFCategory] = React.useState<string>("ALL");
  const [fStatus, setFStatus] = React.useState<string>("ALL");
  const [fSearch, setFSearch] = React.useState<string>("");

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Template | null>(null);
  const [saving, setSaving] = React.useState(false);

  // ── Quick replies state ─────────────────────────────────────────────────
  const [replies, setReplies] = React.useState<QuickReply[]>([]);
  const [qrLoading, setQrLoading] = React.useState(true);
  const [qrError, setQrError] = React.useState<string | null>(null);
  const [qrCreateOpen, setQrCreateOpen] = React.useState(false);
  const [qrSaving, setQrSaving] = React.useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch templates
  // ─────────────────────────────────────────────────────────────────────────
  const loadTemplates = React.useCallback(async () => {
    setTplLoading(true);
    setTplError(null);
    try {
      const params = new URLSearchParams();
      if (fChannel !== "ALL") params.set("channel", fChannel);
      if (fCategory !== "ALL") params.set("category", fCategory);
      if (fStatus !== "ALL") params.set("status", fStatus);
      const res = await fetch(`/api/communications/templates?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (e: any) {
      setTplError(e?.message || "Failed to load templates");
    } finally {
      setTplLoading(false);
    }
  }, [fChannel, fCategory, fStatus]);

  React.useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch quick replies
  // ─────────────────────────────────────────────────────────────────────────
  const loadReplies = React.useCallback(async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await fetch(`/api/communications/quick-replies`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReplies(Array.isArray(data.quickReplies) ? data.quickReplies : []);
    } catch (e: any) {
      setQrError(e?.message || "Failed to load quick replies");
    } finally {
      setQrLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReplies();
  }, [loadReplies]);

  // ─────────────────────────────────────────────────────────────────────────
  // KPIs
  // ─────────────────────────────────────────────────────────────────────────
  const kpis = React.useMemo(() => {
    const total = templates.length;
    const approved = templates.filter((t) => t.status === "APPROVED").length;
    const pending = templates.filter((t) => t.status === "PENDING_APPROVAL").length;
    const locked = templates.filter((t) => t.isLocked || t.status === "LOCKED").length;
    const drafts = templates.filter((t) => t.status === "DRAFT").length;
    const archived = templates.filter((t) => t.status === "ARCHIVED").length;
    return { total, approved, pending, locked, drafts, archived };
  }, [templates]);

  // ─────────────────────────────────────────────────────────────────────────
  // Filtered templates (client-side search on top of server filters)
  // ─────────────────────────────────────────────────────────────────────────
  const filteredTemplates = React.useMemo(() => {
    const q = fSearch.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.templateId.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q),
    );
  }, [templates, fSearch]);

  // ─────────────────────────────────────────────────────────────────────────
  // Create / Update / Archive handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleCreate = async (form: TemplateFormState) => {
    setSaving(true);
    try {
      const variables = extractVariablesFromText(form.body).map((name) => ({ name }));
      const res = await fetch(`/api/communications/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: form.templateId,
          name: form.name,
          category: form.category,
          channel: form.channel,
          language: form.language,
          subject: form.channel === "EMAIL" ? form.subject : undefined,
          body: form.body,
          variables,
          createdBy: "session-user",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast({ title: "Template created", description: `${form.name} saved as Draft.` });
      setCreateOpen(false);
      await loadTemplates();
    } catch (e: any) {
      toast({
        title: "Failed to create template",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, form: TemplateFormState, patch: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      const variables = extractVariablesFromText(form.body).map((name) => ({ name }));
      const body: Record<string, unknown> = {
        name: form.name,
        category: form.category,
        channel: form.channel,
        language: form.language,
        subject: form.channel === "EMAIL" ? form.subject : null,
        body: form.body,
        variables,
        status: form.status,
        ...patch,
        actionById: "session-user",
      };
      const res = await fetch(`/api/communications/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast({ title: "Template updated", description: `${form.name} saved successfully.` });
      setEditTarget(null);
      await loadTemplates();
    } catch (e: any) {
      toast({
        title: "Failed to update template",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive template "${name}"? It will be hidden from active lists but preserved in history.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/communications/templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast({ title: "Template archived", description: `${name} was archived.` });
      setEditTarget(null);
      await loadTemplates();
    } catch (e: any) {
      toast({
        title: "Failed to archive template",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async (tpl: Template) => {
    if (!isAdmin) {
      toast({ title: "Not authorized", description: "Only admins can lock templates.", variant: "destructive" });
      return;
    }
    if (tpl.status !== "APPROVED") {
      toast({
        title: "Cannot lock template",
        description: "Template must be Approved before it can be locked.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/communications/templates/${tpl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isLocked: true,
          approvedById: "session-user",
          actionById: "session-user",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast({ title: "Template locked", description: `${tpl.name} is now an official locked template.` });
      setEditTarget(null);
      await loadTemplates();
    } catch (e: any) {
      toast({
        title: "Failed to lock template",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Quick reply create
  // ─────────────────────────────────────────────────────────────────────────
  const handleCreateReply = async (form: {
    title: string;
    body: string;
    category: string;
    channel: string;
    shortcut: string;
  }) => {
    setQrSaving(true);
    try {
      const res = await fetch(`/api/communications/quick-replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          category: form.category,
          channel: form.channel,
          shortcut: form.shortcut || undefined,
          isActive: true,
          createdBy: "session-user",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      toast({ title: "Quick reply created", description: `${form.title} added.` });
      setQrCreateOpen(false);
      await loadReplies();
    } catch (e: any) {
      toast({
        title: "Failed to create quick reply",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setQrSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DataTable columns
  // ─────────────────────────────────────────────────────────────────────────
  const tplColumns: Column<Template>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortAccessor: (r) => r.name.toLowerCase(),
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-semibold text-[var(--alo-text)]">{r.name}</p>
          <p className="font-mono text-xs text-[var(--alo-muted)]">{r.templateId}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (r) => (
        <Badge variant="neutral" className="whitespace-nowrap">
          {CATEGORIES.find((c) => c.value === r.category)?.label || r.category}
        </Badge>
      ),
    },
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
      key: "language",
      header: "Lang",
      cell: (r) => (
        <span className="font-mono text-xs uppercase text-[var(--alo-text-secondary)]">{r.language}</span>
      ),
    },
    {
      key: "version",
      header: "Ver",
      cell: (r) => <span className="font-mono text-xs text-[var(--alo-muted)]">v{r.version}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge
          status={r.status}
          colorMap={TEMPLATE_STATUS_ACCENT}
          labels={TEMPLATE_STATUS_LABELS}
        />
      ),
    },
    {
      key: "isLocked",
      header: "Lock",
      cell: (r) =>
        r.isLocked ? (
          <span className="inline-flex items-center gap-1 text-[var(--alo-blue-strong)]" title="Official locked template">
            <Icon name="Lock" className="size-4" />
            <span className="sr-only">Locked</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[var(--alo-muted)]" title="Not locked">
            <Icon name="LockOpen" className="size-4" />
            <span className="sr-only">Unlocked</span>
          </span>
        ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      sortable: true,
      sortAccessor: (r) => new Date(r.updatedAt).getTime(),
      cell: (r) => (
        <span className="text-xs text-[var(--alo-muted)]" title={fmtDate(r.updatedAt)}>
          {timeAgo(r.updatedAt)}
        </span>
      ),
    },
  ];

  const qrColumns: Column<QuickReply>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      sortAccessor: (r) => r.title.toLowerCase(),
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-semibold text-[var(--alo-text)]">{r.title}</p>
          {r.shortcut && (
            <p className="font-mono text-xs text-[var(--alo-blue-strong)]">{r.shortcut}</p>
          )}
        </div>
      ),
    },
    {
      key: "body",
      header: "Body",
      cell: (r) => (
        <p className="line-clamp-2 max-w-md text-xs text-[var(--alo-text-secondary)]" title={r.body}>
          {r.body}
        </p>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (r) => (
        <Badge variant="neutral">{QUICK_REPLY_CATEGORIES.find((c) => c.value === r.category)?.label || r.category}</Badge>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      cell: (r) => (
        <span className="text-xs text-[var(--alo-text-secondary)]">
          {CHANNEL_META[r.channel]?.label || r.channel}
        </span>
      ),
    },
    {
      key: "shortcut",
      header: "Shortcut",
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--alo-muted)]">{r.shortcut || "—"}</span>
      ),
    },
    {
      key: "isActive",
      header: "Active",
      cell: (r) =>
        r.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="neutral">Inactive</Badge>
        ),
    },
    {
      key: "usedCount",
      header: "Used",
      sortable: true,
      sortAccessor: (r) => r.usedCount,
      cell: (r) => (
        <span className="font-mono text-xs tabular-nums text-[var(--alo-text-secondary)]">{r.usedCount}</span>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Communication Templates"
        subtitle="Official approved templates for WhatsApp, Email & SMS"
        icon="FileText"
        action={
          <Button variant="alo" onClick={() => setCreateOpen(true)}>
            <Icon name="Plus" className="size-4" /> Create Template
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total Templates" value={kpis.total} icon="FileText" accent="blue" />
        <KpiCard label="Approved" value={kpis.approved} icon="CheckCircle2" accent="emerald" />
        <KpiCard label="Pending Approval" value={kpis.pending} icon="Clock" accent="amber" />
        <KpiCard label="Locked (Official)" value={kpis.locked} icon="Lock" accent="violet" />
        <KpiCard label="Drafts" value={kpis.drafts} icon="FilePen" accent="sky" />
        <KpiCard label="Archived" value={kpis.archived} icon="Archive" accent="rose" />
      </div>

      {/* Filter bar */}
      <SectionCard>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-[var(--alo-muted)]">Channel</Label>
            <Select value={fChannel} onValueChange={setFChannel}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All channels</SelectItem>
                {CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[var(--alo-muted)]">Category</Label>
            <Select value={fCategory} onValueChange={setFCategory}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[var(--alo-muted)]">Status</Label>
            <Select value={fStatus} onValueChange={setFStatus}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[var(--alo-muted)]">Search</Label>
            <SearchInput
              placeholder="Search by name, ID, body…"
              value={fSearch}
              onClear={() => setFSearch("")}
              onChange={(e) => setFSearch(e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Templates table */}
      <SectionCard
        title="Templates"
        description={`${filteredTemplates.length} of ${templates.length} templates`}
        icon="FileText"
        action={
          <Button variant="outline" size="sm" onClick={() => loadTemplates()}>
            <Icon name="RefreshCw" className="size-3.5" /> Refresh
          </Button>
        }
      >
        {tplLoading ? (
          <LoadingGrid count={4} />
        ) : tplError ? (
          <ErrorState error={tplError} onRetry={loadTemplates} />
        ) : filteredTemplates.length === 0 ? (
          <EmptyState
            icon="FileText"
            title="No templates found"
            description="Try adjusting filters, or create your first template."
            action={
              <Button variant="alo" size="sm" onClick={() => setCreateOpen(true)}>
                <Icon name="Plus" className="size-4" /> Create Template
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={tplColumns}
            data={filteredTemplates}
            pageSize={10}
            onRowClick={(row) => setEditTarget(row)}
            emptyMessage="No templates match your filters."
          />
        )}
      </SectionCard>

      {/* Quick Replies section */}
      <SectionCard
        title="Quick Replies"
        description="Pre-approved short responses for counselors"
        icon="Zap"
        action={
          <Button variant="alo" size="sm" onClick={() => setQrCreateOpen(true)}>
            <Icon name="Plus" className="size-4" /> Create Quick Reply
          </Button>
        }
      >
        {qrLoading ? (
          <LoadingGrid count={3} />
        ) : qrError ? (
          <ErrorState error={qrError} onRetry={loadReplies} />
        ) : replies.length === 0 ? (
          <EmptyState
            icon="Zap"
            title="No quick replies yet"
            description="Create quick replies to help counselors respond faster."
            action={
              <Button variant="alo" size="sm" onClick={() => setQrCreateOpen(true)}>
                <Icon name="Plus" className="size-4" /> Create Quick Reply
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={qrColumns}
            data={replies}
            pageSize={10}
            emptyMessage="No quick replies match."
          />
        )}
      </SectionCard>

      {/* Create dialog */}
      <TemplateFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(form) => handleCreate(form)}
        saving={saving}
        mode="create"
      />

      {/* Edit dialog */}
      <TemplateFormDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        template={editTarget}
        onSubmit={(form, patch) => editTarget && handleUpdate(editTarget.id, form, patch ?? {})}
        onArchive={editTarget ? () => handleArchive(editTarget.id, editTarget.name) : undefined}
        onLock={editTarget ? () => handleLock(editTarget) : undefined}
        saving={saving}
        mode="edit"
      />

      {/* Quick reply create dialog */}
      <QuickReplyFormDialog
        open={qrCreateOpen}
        onOpenChange={setQrCreateOpen}
        onSubmit={handleCreateReply}
        saving={qrSaving}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Template form dialog — used for both Create and Edit modes
// ═══════════════════════════════════════════════════════════════════════════

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  template?: Template | null;
  onSubmit: (form: TemplateFormState, patch?: Record<string, unknown>) => void;
  onArchive?: () => void;
  onLock?: () => void;
  saving?: boolean;
  mode: "create" | "edit";
}

function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSubmit,
  onArchive,
  onLock,
  saving = false,
  mode,
}: TemplateFormDialogProps) {
  const [form, setForm] = React.useState<TemplateFormState>(EMPTY_FORM);
  const [bodyKey, setBodyKey] = React.useState(0); // force RichTextEditor remount

  // Hydrate form when template changes (edit mode)
  React.useEffect(() => {
    if (template) {
      setForm({
        templateId: template.templateId,
        name: template.name,
        category: template.category,
        channel: template.channel,
        language: template.language,
        subject: template.subject || "",
        body: template.body,
        variables: template.variables,
        status: template.status,
        isLocked: template.isLocked,
      });
      setBodyKey((k) => k + 1);
    } else if (open && mode === "create") {
      setForm({ ...EMPTY_FORM });
      setBodyKey((k) => k + 1);
    }
  }, [template, open, mode]);

  // Auto-suggest templateId on create when category/channel/lang changes
  React.useEffect(() => {
    if (mode !== "create") return;
    const suggested = suggestTemplateId(form.category, form.channel, form.language);
    // Only auto-fill if the user hasn't manually customized
    setForm((f) => {
      const isAuto = !f.templateId || /^([A-Z]+_[A-Z]{2}_[A-Z]{2}_V\d+)$/.test(f.templateId);
      if (!isAuto) return f;
      return { ...f, templateId: suggested };
    });
  }, [form.category, form.channel, form.language, mode]);

  const isLocked = template?.isLocked || form.isLocked;
  const isArchived = template?.status === "ARCHIVED";
  const isEmail = form.channel === "EMAIL";
  const variables = parseVariables(form.variables);
  const detectedVars = extractVariablesFromText(form.body);

  const insertVariable = (token: string) => {
    setForm((f) => ({ ...f, body: `${f.body}${f.body ? " " : ""}${token}` }));
    setBodyKey((k) => k + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.templateId || !form.name || !form.body) return;
    onSubmit({ ...form, variables: JSON.stringify(detectedVars.map((name) => ({ name }))) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto alo-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--alo-text)]">
            <Icon name={mode === "create" ? "Plus" : "PenLine"} className="size-5 text-[var(--alo-blue)]" />
            {mode === "create" ? "Create Communication Template" : "Edit Template"}
          </DialogTitle>
          <DialogDescription className="text-[var(--alo-muted)]">
            {mode === "create"
              ? "Define a reusable template for WhatsApp, Email or SMS communication."
              : `Edit ${template?.name} (${template?.templateId}).`}
          </DialogDescription>
        </DialogHeader>

        {isLocked && !isAdmin && (
          <Notification type="warning" title="This is an official locked template" message="Editing requires admin authorization. Fields are read-only." />
        )}

        {isArchived && (
          <Notification type="info" title="This template is archived" message="Archived templates are read-only. Create a new template to replace it." />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Template ID + Name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-id" className="text-xs">Template ID</Label>
              <Input
                id="tpl-id"
                value={form.templateId}
                onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                placeholder="DOCREQ_WH_EN_V1"
                disabled={!!isLocked || isArchived || mode === "edit"}
                className="font-mono"
                required
              />
              <p className="text-xs text-[var(--alo-muted)]">Auto-suggested: CATEGORY_CHANNEL_LANG_V1</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name" className="text-xs">Template Name</Label>
              <Input
                id="tpl-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Document Request — Passport"
                disabled={!!isLocked || isArchived}
                required
              />
            </div>
          </div>

          {/* Row 2: Category + Channel + Language */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
                disabled={!!isLocked || isArchived}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Channel</Label>
              <Select
                value={form.channel}
                onValueChange={(v) => setForm({ ...form, channel: v })}
                disabled={!!isLocked || isArchived}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Language</Label>
              <Select
                value={form.language}
                onValueChange={(v) => setForm({ ...form, language: v })}
                disabled={!!isLocked || isArchived}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="bn">বাংলা (Bangla)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Subject (only for EMAIL) */}
          {isEmail && (
            <div className="space-y-1.5">
              <Label htmlFor="tpl-subject" className="text-xs">Subject (Email only)</Label>
              <Input
                id="tpl-subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Action required: submit your passport scan"
                disabled={!!isLocked || isArchived}
              />
            </div>
          )}

          {/* Row 4: Body with variable insertion */}
          <div className="space-y-1.5">
            <Label className="text-xs">Body</Label>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLE_SUGGESTIONS.map((v) => (
                <button
                  key={v.token}
                  type="button"
                  onClick={() => insertVariable(v.token)}
                  disabled={!!isLocked || isArchived}
                  title={`Insert ${v.label}`}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] px-2 py-0.5 text-xs font-mono text-[var(--alo-text-secondary)] hover:border-[var(--alo-blue)] hover:bg-[var(--alo-blue-soft)] hover:text-[var(--alo-blue-strong)] disabled:opacity-50"
                >
                  <Icon name="Plus" className="size-3" />
                  {v.token}
                </button>
              ))}
            </div>
            <RichTextEditor
              key={bodyKey}
              value={form.body}
              onChange={(html) => setForm((f) => ({ ...f, body: html }))}
              placeholder="Write the template body. Use {{variables}} for dynamic content."
              minHeight={180}
            />
          </div>

          {/* Row 5: Detected variables */}
          <div className="space-y-1.5">
            <Label className="text-xs">Variables (auto-detected)</Label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3">
              {detectedVars.length === 0 ? (
                <span className="text-xs text-[var(--alo-muted)]">
                  No variables detected. Insert variables using the chips above.
                </span>
              ) : (
                detectedVars.map((v) => (
                  <Badge key={v} variant="blue" className="font-mono">{v}</Badge>
                ))
              )}
            </div>
            {variables.length > 0 && (
              <p className="text-xs text-[var(--alo-muted)]">
                Stored variables: {variables.map((v) => v.name).join(", ")}
              </p>
            )}
          </div>

          {/* Row 6: Status + Lock checkbox */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
                disabled={!!isLocked || isArchived}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.filter((s) => s.value !== "ARCHIVED").map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                id="tpl-locked"
                checked={form.isLocked}
                onCheckedChange={(v) => setForm({ ...form, isLocked: v === true })}
                disabled={!isAdmin || mode === "create" || form.status !== "APPROVED"}
              />
              <Label htmlFor="tpl-locked" className="text-sm">
                Lock as official template
                {!isAdmin && <span className="ml-1 text-xs text-[var(--alo-muted)]">(admin only)</span>}
              </Label>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              {mode === "edit" && onArchive && (
                <Button type="button" variant="outline" onClick={onArchive} disabled={saving || isLocked}>
                  <Icon name="Archive" className="size-4" /> Archive
                </Button>
              )}
              {mode === "edit" && onLock && isAdmin && !isLocked && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onLock}
                  disabled={saving || template?.status !== "APPROVED"}
                  title={template?.status !== "APPROVED" ? "Template must be Approved before locking" : "Lock this template as official"}
                >
                  <Icon name="Lock" className="size-4" /> Lock Template
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="alo"
                disabled={saving || !!isLocked || isArchived || !form.templateId || !form.name || !form.body}
              >
                {saving ? (
                  <>
                    <Icon name="Loader2" className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Icon name={mode === "create" ? "Plus" : "Save"} className="size-4" />
                    {mode === "create" ? "Create Template" : "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Quick reply form dialog
// ═══════════════════════════════════════════════════════════════════════════

interface QuickReplyFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (form: { title: string; body: string; category: string; channel: string; shortcut: string }) => void;
  saving?: boolean;
}

function QuickReplyFormDialog({ open, onOpenChange, onSubmit, saving = false }: QuickReplyFormDialogProps) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [category, setCategory] = React.useState("GENERAL");
  const [channel, setChannel] = React.useState("ALL");
  const [shortcut, setShortcut] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setBody("");
      setCategory("GENERAL");
      setChannel("ALL");
      setShortcut("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    onSubmit({ title, body, category, channel, shortcut });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto alo-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--alo-text)]">
            <Icon name="Zap" className="size-5 text-[var(--alo-orange)]" />
            Create Quick Reply
          </DialogTitle>
          <DialogDescription className="text-[var(--alo-muted)]">
            Pre-approved short responses counselors can insert with a shortcut.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qr-title" className="text-xs">Title</Label>
            <Input
              id="qr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Passport upload reminder"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qr-body" className="text-xs">Body</Label>
            <Textarea
              id="qr-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi {{student_name}}, please upload a clear scan of your passport. Let us know if you need help."
              rows={4}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUICK_REPLY_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All channels</SelectItem>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-shortcut" className="text-xs">Shortcut</Label>
              <Input
                id="qr-shortcut"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="/passport"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="alo" disabled={saving || !title || !body}>
              {saving ? (
                <>
                  <Icon name="Loader2" className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Icon name="Plus" className="size-4" /> Create
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default CommTemplates;
