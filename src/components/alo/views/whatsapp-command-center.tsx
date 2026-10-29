"use client";

/**
 * ALO Education — WhatsApp Command Center
 * ========================================
 * Three-column workspace:
 *   • Left   — conversation list (search + filter: All / Unread / SLA Overdue)
 *   • Center — active conversation (header w/ live SLA timer, student context banner,
 *              message thread, AI draft reply panel, quick replies, composer, templates)
 *   • Right  — student/contact context panel + AI message classification +
 *              WhatsApp document receipt (when inbound attachment detected)
 *
 * Resilient to AI/webhook failures: shows "AI service unavailable" gracefully.
 * All API calls use relative paths only.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  SearchInput,
  IconButton,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  InfoRow,
  StatusBadge,
  SectionCard,
  FileUploader,
  type AccentColor,
} from "@/components/alo/ui";
import { AISuggestionCard } from "@/components/alo/cards";
import { fmtDate, timeAgo, type ViewKey } from "@/lib/alo-types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface InboxMessage {
  id: string;
  channel: string;
  direction: string; // INBOUND | OUTBOUND
  fromName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  body: string;
  aiAssisted?: boolean;
  read?: boolean;
  receivedAt: string;
  sentAt?: string | null;
  deliveryStatus?: string | null;
  attachmentsJson?: string | null;
}

interface Attachment {
  id?: string;
  name: string;
  type: string; // mime type
  size: number;
  url?: string;
}

interface Conversation {
  key: string;
  source?: 'communication_thread' | 'ucc_conversation';
  channel: string;
  studentId?: string | null;
  studentName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  messages: InboxMessage[];
  unread: number;
  lastMessageAt: string;
}

interface ContactMatchCandidate {
  kind: 'student' | 'lead' | 'partner_contact' | 'unknown';
  id: string;
  reference?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface InboxResponse {
  conversations: Conversation[];
  totalMessages: number;
}

interface StudentContext {
  id: string;
  studentId: string;
  fullName: string;
  mobile?: string | null;
  altMobile?: string | null;
  email?: string | null;
  studyDestination?: string | null;
  programTitle?: string | null;
  profileCompletion?: number;
  hasPassport?: boolean;
  status?: string;
  counselor?: { id: string; name: string; email?: string | null } | null;
  applications?: Array<{
    id: string;
    universityName?: string | null;
    courseName?: string | null;
    stage: string;
    isB2bConfidential?: boolean;
  }>;
  hasB2bConfidentialApplications?: boolean;
  canManageB2bDocuments?: boolean;
  documents?: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
  }>;
  payments?: Array<{
    id: string;
    amount?: number | null;
    status?: string | null;
    type?: string | null;
  }>;
  interviews?: Array<{
    id: string;
    type?: string | null;
    score?: number | null;
    startedAt?: string | null;
  }>;
  timelineEvents?: Array<{
    id: string;
    type: string;
    title: string;
    createdAt: string;
  }>;
}

interface QuickReply {
  id: string;
  title: string;
  body: string;
  category?: string | null;
  channel?: string | null;
  shortcut?: string | null;
}

interface Template {
  id: string;
  templateId: string;
  name: string;
  body: string;
  category?: string | null;
  channel: string;
  status: string;
  language?: string | null;
}

interface AiReplyResponse {
  reply?: string;
  requiresOtp?: boolean;
  verificationAvailable?: boolean;
  requiresHumanApproval?: boolean;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const SLA_TARGET_MINUTES = 30; // WARNING threshold
const SLA_OVERDUE_MINUTES = 60; // OVERDUE threshold
const SLA_CRITICAL_MINUTES = 120; // CRITICAL threshold

type SlaSeverity = "NORMAL" | "WARNING" | "OVERDUE" | "CRITICAL";

function severityFor(ts: string): SlaSeverity {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins >= SLA_CRITICAL_MINUTES) return "CRITICAL";
  if (mins >= SLA_OVERDUE_MINUTES) return "OVERDUE";
  if (mins >= SLA_TARGET_MINUTES) return "WARNING";
  return "NORMAL";
}

function formatCountdown(ts: string): string {
  const elapsed = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (elapsed < 60) return `${elapsed}s`;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  return `${hrs}h ${m}m`;
}

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function parseAttachments(json?: string | null): Attachment[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is Attachment =>
        !!a &&
        typeof a === "object" &&
        typeof (a as Attachment).name === "string"
    );
  } catch {
    return [];
  }
}

function fileSizeLabel(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileTypeIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "Image";
  if (["pdf"].includes(ext)) return "FileText";
  if (["doc", "docx"].includes(ext)) return "FileText";
  if (["xls", "xlsx", "csv"].includes(ext)) return "Sheet";
  if (["mp4", "mov", "avi"].includes(ext)) return "Video";
  return "File";
}

const SEVERITY_LABEL: Record<SlaSeverity, string> = {
  NORMAL: "Normal",
  WARNING: "Warning",
  OVERDUE: "Overdue",
  CRITICAL: "Critical",
};

function SlaTimer({ ts, live }: { ts: string; live: boolean }) {
  // Re-render every second while live
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!live) return;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [live]);

  const sev = severityFor(ts);
  const dotColor =
    sev === "NORMAL" ? "bg-[var(--alo-success)]" :
    sev === "WARNING" ? "bg-[var(--alo-warning)]" :
    "bg-[var(--alo-danger)]";
  const textColor =
    sev === "NORMAL" ? "text-[var(--alo-success-strong)]" :
    sev === "WARNING" ? "text-[var(--alo-warning-strong)]" :
    "text-[var(--alo-danger-strong)]";

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] px-2 py-1 text-xs">
      <span className={cn("inline-block size-2 rounded-full", dotColor, sev !== "NORMAL" && "pulse-dot")} />
      <span className={cn("font-semibold uppercase tracking-wide", textColor)}>
        {SEVERITY_LABEL[sev]}
      </span>
      <span className="font-mono text-[var(--alo-text-secondary)]">·</span>
      <span className="font-mono text-[var(--alo-text-secondary)]">{formatCountdown(ts)}</span>
    </div>
  );
}

function DeliveryStatus({ status }: { status?: string | null }) {
  // SENT = single check, DELIVERED = double check, READ = blue double check
  if (!status || status === "PENDING") {
    return <Icon name="Clock" className="size-3 text-[var(--alo-muted)]" />;
  }
  if (status === "SENT") {
    return <Icon name="Check" className="size-3 text-[var(--alo-muted)]" />;
  }
  if (status === "DELIVERED") {
    return <Icon name="CheckCheck" className="size-3 text-[var(--alo-muted)]" />;
  }
  if (status === "READ") {
    return <Icon name="CheckCheck" className="size-3 text-[var(--alo-blue)]" />;
  }
  if (status === "FAILED") {
    return <Icon name="AlertCircle" className="size-3 text-[var(--alo-danger)]" />;
  }
  return <Icon name="Check" className="size-3 text-[var(--alo-muted)]" />;
}

function navigate(view: ViewKey) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("alo-navigate", { detail: { view } }));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function WhatsAppCommandCenter() {
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "unread" | "overdue">("all");

  // Selected conversation context
  const [student, setStudent] = React.useState<StudentContext | null>(null);
  const [studentLoading, setStudentLoading] = React.useState(false);
  const [studentError, setStudentError] = React.useState<string | null>(null);
  const [contactMatchId, setContactMatchId] = React.useState<string | null>(null);
  const [contactMatchCandidates, setContactMatchCandidates] = React.useState<ContactMatchCandidate[]>([]);

  // AI draft
  const [aiDraft, setAiDraft] = React.useState<string | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [aiOtpRequired, setAiOtpRequired] = React.useState(false);

  // Quick replies & templates
  const [quickReplies, setQuickReplies] = React.useState<QuickReply[]>([]);
  const [templates, setTemplates] = React.useState<Template[]>([]);

  // Composer
  const [composerText, setComposerText] = React.useState("");
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [outboundApplicationId, setOutboundApplicationId] = React.useState('');
  const [sending, setSending] = React.useState(false);

  // Acting user
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
      // ignore
    }
  }, []);

  // ── Fetch conversation list ─────────────────────────────────────────────
  const fetchInbox = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inbox/unified?channel=WHATSAPP", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch inbox (${res.status})`);
      const data = (await res.json()) as InboxResponse;
      const conversations = Array.isArray(data?.conversations) ? data.conversations : [];
      setConversations(conversations);
      if (conversations.length > 0 && !selectedKey) {
        setSelectedKey(conversations[0].key);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  React.useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // ── Fetch quick replies + templates ─────────────────────────────────────
  React.useEffect(() => {
    Promise.allSettled([
      fetch("/api/communications/quick-replies?channel=WHATSAPP&isActive=true", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/communications/templates?channel=WHATSAPP&status=APPROVED", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([qrRes, tplRes]) => {
      if (qrRes.status === "fulfilled" && Array.isArray(qrRes.value?.quickReplies)) {
        setQuickReplies(qrRes.value.quickReplies as QuickReply[]);
      }
      if (tplRes.status === "fulfilled" && Array.isArray(tplRes.value?.templates)) {
        setTemplates(tplRes.value.templates as Template[]);
      }
    });
  }, []);

  // ── Selected conversation ──────────────────────────────────────────────
  const selected = React.useMemo(
    () => conversations.find((c) => c.key === selectedKey) || null,
    [conversations, selectedKey]
  );
  React.useEffect(() => setOutboundApplicationId(''), [selectedKey]);

  // ── Filtered list ──────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    let list = conversations;
    if (filter === "unread") list = list.filter((c) => c.unread > 0);
    if (filter === "overdue") {
      list = list.filter((c) => {
        const inbound = c.messages.find((m) => m.direction === "INBOUND");
        const ts = inbound?.receivedAt || c.lastMessageAt;
        return severityFor(ts) !== "NORMAL";
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        const name = (c.studentName || c.fromPhone || c.fromEmail || "").toLowerCase();
        const lastMsg = c.messages[0]?.body?.toLowerCase() || "";
        return name.includes(q) || lastMsg.includes(q);
      });
    }
    return list;
  }, [conversations, filter, search]);

  // ── Load student context when a conversation is selected ────────────────
  React.useEffect(() => {
    if (!selected) {
      setStudent(null);
      setContactMatchId(null);
      setContactMatchCandidates([]);
      return;
    }
    setContactMatchId(null);
    setContactMatchCandidates([]);
    if (selected.studentId) {
      setStudentLoading(true);
      setStudentError(null);
      fetch(`/api/students?id=${encodeURIComponent(selected.studentId)}`, { cache: "no-store" })
        .then(async (r) => {
          if (!r.ok) throw new Error(`Failed (${r.status})`);
          const data = (await r.json()) as { student: StudentContext };
          setStudent(data.student);
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : "Failed to load student";
          setStudentError(msg);
          setStudent(null);
        })
        .finally(() => setStudentLoading(false));
    } else {
      setStudent(null);
      // For new contacts, attempt to fetch a contact match review by POSTing the phone.
      // This is best-effort — failures just hide the match panel.
      if (selected.fromPhone) {
        fetch("/api/communications/contacts/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: selected.fromPhone,
            name: selected.studentName,
            conversationId: selected.source === 'ucc_conversation' ? selected.key.replace(/^ucc_conversation:/, '') : undefined,
          }),
        })
          .then(async (r) => {
            if (!r.ok) return null;
            const data = await r.json();
            if (data?.review?.id) setContactMatchId(data.review.id);
            const matches = Array.isArray(data?.candidates) ? data.candidates : data?.existingRecord ? [data.existingRecord] : [];
            setContactMatchCandidates(matches.filter((item: unknown): item is ContactMatchCandidate =>
              !!item && typeof item === 'object' && typeof (item as ContactMatchCandidate).id === 'string'
            ));
          })
          .catch(() => {
            // ignore — UI gracefully falls back to NEW CONTACT view
          });
      }
    }
    // Reset AI draft on conversation switch
    setAiDraft(null);
    setAiError(null);
    setAiOtpRequired(false);
  }, [selected]);

  // ── Generate AI reply ──────────────────────────────────────────────────
  async function generateAiReply() {
    if (!selected) return;
    const lastInbound = [...selected.messages]
      .reverse()
      .find((m) => m.direction === "INBOUND");
    if (!lastInbound) {
      toast({
        title: "No inbound message",
        description: "Select or wait for an inbound message before generating a reply.",
        variant: "destructive",
      });
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiOtpRequired(false);
    try {
      const res = await fetch("/api/whatsapp/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: lastInbound.body,
          conversationId: selected.key,
          conversationSource: selected.source || 'communication_thread',
          studentId: selected.studentId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `AI service error (${res.status})`);
      }
      const data = (await res.json()) as AiReplyResponse;
      if (data.error) throw new Error(data.error);
      if (data.requiresOtp) {
        setAiOtpRequired(true);
        setAiDraft(data.reply || "For security, use the secure student portal or contact the assigned counselor. No OTP is sent by this drafting flow.");
        toast({
          title: "Private details blocked",
          description: data.verificationAvailable
            ? "Complete the secure verification process before sharing private information."
            : "This flow cannot send or verify an OTP. Use the secure portal or assigned-counselor process.",
        });
        return;
      }
      setAiDraft(data.reply || "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setAiError(msg);
      toast({
        title: "AI service unavailable",
        description: "Manual reply required. You can still type and send a reply below.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  }

  // ── Approve & send AI draft ────────────────────────────────────────────
  async function sendReplyText(text: string, aiAssisted = false) {
    if (!selected) throw new Error('Select a WhatsApp conversation first.');
    const isUcc = selected.source === 'ucc_conversation';
    const endpoint = isUcc
      ? `/api/crm/ucc/conversations/${encodeURIComponent(selected.key)}/reply`
      : '/api/inbox/unified';
    const payload = isUcc
      ? { content: text, aiGenerated: aiAssisted, aiApproved: aiAssisted }
      : { threadId: selected.key, channel: 'WHATSAPP', content: text, aiAssisted };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.error || `Send failed (${response.status})`);
    return result;
  }

  async function approveAndSendDraft() {
    if (!selected || !aiDraft) return;
    setSending(true);
    let providerConfirmed = false;
    try {
      // Persist the human-review draft before any external send is attempted.
      const draftRes = await fetch('/api/communications/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'WHATSAPP',
          studentId: selected.studentId || undefined,
          conversationId: selected.source === 'ucc_conversation' ? selected.key : undefined,
          threadId: selected.source === 'ucc_conversation' ? undefined : selected.key,
          draftBody: aiDraft,
          aiGenerated: true,
          mode: 'AI_DRAFT_HUMAN_SEND',
        }),
      });
      const draftData = await draftRes.json().catch(() => ({}));
      if (!draftRes.ok || !draftData.success || !draftData.draft?.id) throw new Error(draftData.error || `Draft could not be saved (${draftRes.status}); the reply was not sent.`);

      const send = await sendReplyText(aiDraft, true);
      const providerMessageId = typeof send.providerMessageId === 'string' ? send.providerMessageId : '';
      if (!providerMessageId) throw new Error('WhatsApp did not return a provider message ID; the draft was not marked as sent.');
      providerConfirmed = true;

      const statusResponse = await fetch(`/api/communications/drafts/${encodeURIComponent(draftData.draft.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT', providerMessageId }),
      });
      const statusResult = await statusResponse.json().catch(() => ({}));
      const auditStatusSaved = statusResponse.ok && statusResult.success;

      const sentAt = new Date().toISOString();
      setConversations((previous) => previous.map((conversation) => conversation.key === selected.key
        ? { ...conversation, messages: [{ id: send?.message?.id || providerMessageId, channel: 'WHATSAPP', direction: 'OUTBOUND', body: aiDraft, receivedAt: sentAt, sentAt, deliveryStatus: 'SENT', read: true, aiAssisted: true }, ...conversation.messages], lastMessageAt: sentAt }
        : conversation));
      setAiDraft(null);
      toast({ title: auditStatusSaved ? 'Reply sent' : 'Reply sent; audit update pending', description: auditStatusSaved ? 'WhatsApp confirmed the AI-assisted reply.' : 'WhatsApp confirmed the reply, but its draft audit status could not be finalized. Do not resend.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (providerConfirmed) {
        setAiDraft(null);
        toast({ title: 'Reply sent; audit update pending', description: `${msg} Do not resend this message.`, variant: 'destructive' });
      } else {
        toast({ title: 'Failed to send', description: msg, variant: 'destructive' });
      }
    } finally {
      setSending(false);
    }
  }

  function rejectDraft() {
    setAiDraft(null);
    setAiOtpRequired(false);
    toast({ title: "Draft rejected", description: "You can write a manual reply below." });
  }

  function editDraft() {
    if (aiDraft) setComposerText(aiDraft);
    setAiDraft(null);
    toast({ title: "Moved to composer", description: "Edit the draft text below before sending." });
  }

  // ── Send manual message ────────────────────────────────────────────────
  async function sendMessage() {
    if (!selected) return;
    const text = composerText.trim();
    if (!text && attachments.length === 0) return;
    setSending(true);
    let sentAttachmentCount = 0;
    try {
      const sentMessages: Array<{ id: string; body: string }> = [];
      if (attachments.length > 0) {
        if (student?.hasB2bConfidentialApplications && !student.canManageB2bDocuments) throw new Error('This student’s B2B-confidential media must be handled by a B2B-authorized staff member. No attachment was sent.');
        if (student?.hasB2bConfidentialApplications && student.canManageB2bDocuments && !outboundApplicationId) throw new Error('Select the application for this B2B-confidential media before sending.');
        if (selected.source !== 'ucc_conversation') throw new Error('Secure media sending requires an assigned UCC WhatsApp conversation. No attachment was sent.');
        if (attachments.length > 5) throw new Error('Send no more than five attachments in one reply.');
        for (const file of attachments) {
          if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name} exceeds the 20 MB WhatsApp document limit.`);
          if (file.type && !['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
            throw new Error(`${file.name} is not a supported PDF or image file.`);
          }
        }
        const uploaded: Array<{ id: string; fileName: string }> = [];
        for (const file of attachments) {
          const form = new FormData();
          form.append('conversationId', selected.key);
          form.append('purpose', 'outbound_media');
          if (selected.studentId) form.append('studentId', selected.studentId);
          if (outboundApplicationId) form.append('applicationId', outboundApplicationId);
          form.append('file', file, file.name);
          const uploadResponse = await fetch('/api/crm/ucc/documents/upload', { method: 'POST', body: form });
          const upload = await uploadResponse.json().catch(() => ({}));
          if (!uploadResponse.ok || !upload.success || !upload.attachment?.id) {
            throw new Error(upload.error || `Private upload failed (${uploadResponse.status}); no message was sent.`);
          }
          uploaded.push({ id: upload.attachment.id, fileName: upload.attachment.fileName || file.name });
        }
        for (let index = 0; index < uploaded.length; index += 1) {
          const item = uploaded[index];
          const response = await fetch(`/api/crm/ucc/conversations/${encodeURIComponent(selected.key)}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: index === 0 ? text : '', attachment: { attachmentId: item.id } }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || !result.success) {
            throw new Error(result.error || `WhatsApp attachment send failed (${response.status}). Any remaining files are stored privately and were not marked as sent.`);
          }
          sentMessages.push({ id: result.message?.id || `local-${Date.now()}-${index}`, body: text && index === 0 ? text : `[Attachment: ${item.fileName}]` });
          sentAttachmentCount += 1;
        }
      } else {
        const result = await sendReplyText(text, false);
        sentMessages.push({ id: result?.message?.id || result?.providerMessageId || `local-${Date.now()}`, body: text });
      }

      const sentAt = new Date().toISOString();
      const optimisticMessages: InboxMessage[] = [...sentMessages].reverse().map((message) => ({ id: message.id, channel: 'WHATSAPP', direction: 'OUTBOUND', body: message.body, receivedAt: sentAt, sentAt, deliveryStatus: 'SENT', read: true, aiAssisted: false }));
      setConversations((previous) => previous.map((conversation) => conversation.key === selected.key
        ? { ...conversation, messages: [...optimisticMessages, ...conversation.messages], lastMessageAt: sentAt }
        : conversation));
      setComposerText('');
      setAttachments([]);
      toast({ title: 'Message sent', description: 'WhatsApp confirmed the reply.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (sentAttachmentCount > 0) {
        setAttachments(attachments.slice(sentAttachmentCount));
        setComposerText('');
        void fetchInbox();
      }
      toast({ title: 'Failed to send', description: sentAttachmentCount > 0 ? `${sentAttachmentCount} attachment(s) were confirmed sent. Remaining files stay selected. ${msg}` : msg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  // ── Resolve contact match (Open Existing / Merge / Create New) ──────────
  async function resolveContact(decision: "OPEN_EXISTING" | "MERGE_REQUEST" | "CREATE_NEW", candidate?: ContactMatchCandidate) {
    if (!contactMatchId) {
      toast({
        title: "No review record",
        description: "There's no ContactMatchReview to resolve for this conversation.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(`/api/communications/contacts/match/${contactMatchId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          candidate: candidate ? { kind: candidate.kind, id: candidate.id } : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed (${res.status})`);
      }
      toast({
        title: "Decision recorded",
        description: `Contact resolution: ${decision.replace(/_/g, " ").toLowerCase()}`,
      });
      setContactMatchId(null);
      setContactMatchCandidates([]);
      // Refetch inbox so the conversation is re-grouped correctly
      fetchInbox();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Failed to resolve", description: msg, variant: "destructive" });
    }
  }

  // ── WhatsApp document upload ──────────────────────────────────────────
  async function createDocumentUploadEvent(attachment: Attachment, documentType: string, applicationId?: string) {
    if (!selected || selected.source !== 'ucc_conversation' || !attachment.id) {
      toast({ title: 'Attachment unavailable', description: 'This message has no securely stored WhatsApp file ID to link.', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/whatsapp/document-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selected.key, attachmentId: attachment.id, documentType, applicationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || `Failed (${res.status})`);
      toast({
        title: data.duplicate ? 'Document already linked' : 'Document attached',
        description: data.message || `"${attachment.name}" is stored privately and remains pending human review.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Document link failed', description: msg, variant: 'destructive' });
    }
  }

  // ── Latest inbound message & its attachments ──────────────────────────
  const lastInbound = React.useMemo(() => {
    if (!selected) return null;
    return [...selected.messages]
      .filter((message) => message.direction === 'INBOUND')
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())[0] || null;
  }, [selected]);

  const lastInboundAttachments = React.useMemo(() => {
    if (!lastInbound) return [] as Attachment[];
    return parseAttachments(lastInbound.attachmentsJson);
  }, [lastInbound]);

  // ── Student context derived values ───────────────────────────────────
  const activeApplications = student?.applications?.filter((a) =>
    !["VISA_REFUSED", "ENROLLED"].includes(a.stage)
  ) || [];
  const missingDocuments = student?.documents?.filter((d) =>
    d.status === "PENDING" || d.status === "REJECTED"
  ) || [];
  const latestOffer = student?.applications?.find((a) =>
    ["CONDITIONAL_OFFFER", "UNCONDITIONAL_OFFER"].includes(a.stage)
  ) || null;
  const latestPayment = student?.payments?.[0] || null;
  const latestInterview = student?.interviews?.[0] || null;
  const lastCommunication = student?.timelineEvents?.find((e) =>
    e.type === "MESSAGE_SENT" || e.type === "MESSAGE_RECEIVED"
  ) || student?.timelineEvents?.[0] || null;

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[640px] flex-col gap-4 p-3 sm:p-4 lg:p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-alo-gradient text-white shadow-[var(--alo-shadow-blue)]">
            <Icon name="MessageCircleMore" className="size-5" />
          </div>
          <div>
            <h1 className="crm-page-title text-[var(--alo-text)]">WhatsApp Command Center</h1>
            <p className="body-text text-[var(--alo-muted)]">
              Live conversations · AI-assisted replies · 24/7 first response
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("comm-command-center")}>
          <Icon name="ArrowLeft" className="size-3.5" />
          Back to Command Center
        </Button>
      </div>

      {/* 3-column grid */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12">
        {/* ─── LEFT — conversation list ─── */}
        <aside className="flex h-full min-h-[300px] flex-col gap-2 lg:col-span-3">
          <SectionCard className="flex h-full flex-col overflow-hidden">
            <div className="space-y-2 border-b border-[var(--alo-border)] p-3">
              <SearchInput
                placeholder="Search name, phone, message…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
                size="sm"
              />
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="h-8 w-full text-xs" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conversations</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                  <SelectItem value="overdue">SLA overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="alo-scroll flex-1">
              {loading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <LoadingSkeleton key={i} lines={2} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon="MessageCircle"
                  title="No conversations"
                  description="Inbound WhatsApp messages will appear here once received."
                  accent="emerald"
                />
              ) : (
                <ul className="divide-y divide-[var(--alo-border)]">
                  {filtered.map((conv) => {
                    const isActive = conv.key === selectedKey;
                    const inbound = conv.messages.find((m) => m.direction === "INBOUND");
                    const ts = inbound?.receivedAt || conv.lastMessageAt;
                    const sev = severityFor(ts);
                    const sevDot =
                      sev === "NORMAL" ? "bg-[var(--alo-success)]" :
                      sev === "WARNING" ? "bg-[var(--alo-warning)]" :
                      "bg-[var(--alo-danger)]";
                    return (
                      <li key={conv.key}>
                        <button
                          type="button"
                          onClick={() => setSelectedKey(conv.key)}
                          className={cn(
                            "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                            isActive
                              ? "bg-[var(--alo-blue-soft)]"
                              : "hover:bg-[var(--alo-surface-muted)]"
                          )}
                        >
                          <Avatar className="size-9 shrink-0">
                            <AvatarFallback className="bg-[var(--alo-blue-soft)] text-xs font-semibold text-[var(--alo-blue-strong)]">
                              {initials(conv.studentName || conv.fromPhone)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-[var(--alo-text)]">
                                {conv.studentName || conv.fromPhone || "Unknown"}
                              </p>
                              <span className="shrink-0 text-[11px] text-[var(--alo-muted)]">
                                {timeAgo(conv.lastMessageAt)}
                              </span>
                            </div>
                            <p className="truncate text-xs text-[var(--alo-muted)]">
                              {conv.messages[0]?.body || "—"}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "inline-block size-1.5 rounded-full",
                                  sevDot,
                                  sev !== "NORMAL" && "pulse-dot"
                                )}
                              />
                              <span className="text-[11px] uppercase tracking-wide text-[var(--alo-muted)]">
                                {SEVERITY_LABEL[sev]}
                              </span>
                              {conv.unread > 0 && (
                                <Badge variant="warning" className="ml-auto h-4 px-1 text-[11px]">
                                  {conv.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </SectionCard>
        </aside>

        {/* ─── CENTER — active conversation ─── */}
        <main className="flex h-full min-h-[400px] flex-col gap-3 lg:col-span-6">
          {!selected ? (
            <SectionCard className="flex h-full items-center justify-center">
              <EmptyState
                icon="MessageCircleMore"
                title="Select a conversation"
                description="Choose a conversation from the list to view the message thread, AI draft reply, and student context."
                accent="blue"
              />
            </SectionCard>
          ) : (
            <SectionCard className="flex h-full flex-col overflow-hidden">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--alo-border)] p-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-[var(--alo-success-soft)] text-xs font-semibold text-[var(--alo-success-strong)]">
                      {initials(selected.studentName || selected.fromPhone)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-[var(--alo-text)]">
                        {selected.studentName || selected.fromPhone || "Unknown contact"}
                      </p>
                      <Badge variant="success" className="gap-1 text-[11px]">
                        <Icon name="MessageCircle" className="size-2.5" /> WhatsApp
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-[var(--alo-muted)] font-mono">
                      {selected.fromPhone || selected.fromEmail || "—"}
                    </p>
                  </div>
                </div>

                {/* Live SLA timer */}
                {lastInbound ? (
                  <SlaTimer ts={lastInbound.receivedAt} live />
                ) : (
                  <Badge variant="neutral">No inbound</Badge>
                )}
              </div>

              {/* Student context banner (if matched) */}
              {selected.studentId && student && (
                <div className="flex flex-wrap items-center gap-2 border-b border-[var(--alo-border)] bg-[var(--alo-blue-soft)]/40 px-3 py-2 text-xs">
                  <Icon name="Orbit" className="size-3.5 text-[var(--alo-blue)]" />
                  <span className="font-semibold text-[var(--alo-blue-strong)]">Student</span>
                  <Badge variant="blue" className="text-[11px]">{student.studentId}</Badge>
                  {student.counselor?.name && (
                    <span className="text-[var(--alo-text-secondary)]">
                      Counselor: <span className="font-medium">{student.counselor.name}</span>
                    </span>
                  )}
                  {activeApplications[0]?.stage && (
                    <Badge variant="warning" className="text-[11px]">
                      Stage: {activeApplications[0].stage.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  )}
                </div>
              )}

              {/* Message thread */}
              <ScrollArea className="alo-scroll flex-1 bg-[var(--alo-surface-muted)]/30 p-3">
                <div className="space-y-3">
                  {selected.messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[var(--alo-muted)]">
                      No messages yet.
                    </p>
                  ) : (
                    selected.messages
                      .slice()
                      .reverse()
                      .map((m) => {
                        const isOutbound = m.direction === "OUTBOUND";
                        const atts = parseAttachments(m.attachmentsJson);
                        return (
                          <div
                            key={m.id}
                            className={cn(
                              "flex items-end gap-2",
                              isOutbound ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isOutbound && (
                              <Avatar className="size-7">
                                <AvatarFallback className="bg-[var(--alo-surface-muted)] text-[11px] font-semibold text-[var(--alo-text-secondary)]">
                                  {initials(selected.studentName || selected.fromPhone)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={cn(
                                "max-w-[78%] rounded-2xl border px-3 py-2 text-sm shadow-[var(--alo-shadow-xs)]",
                                isOutbound
                                  ? "rounded-br-md border-[var(--alo-blue)]/30 bg-[var(--alo-blue-soft)] text-[var(--alo-text)]"
                                  : "rounded-bl-md border-[var(--alo-border)] bg-[var(--alo-surface)] text-[var(--alo-text)]"
                              )}
                            >
                              {m.aiAssisted && (
                                <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-blue-strong)]">
                                  <Icon name="Sparkles" className="size-2.5" />
                                  AI-assisted
                                </span>
                              )}
                              <p className="whitespace-pre-wrap break-words">{m.body}</p>
                              {atts.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {atts.map((a, i) => (
                                    <a
                                      key={a.id || i}
                                      href={a.url || undefined}
                                      target={a.url ? '_blank' : undefined}
                                      rel={a.url ? 'noreferrer' : undefined}
                                      className="flex items-center gap-1.5 rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] px-2 py-1 text-xs hover:border-[var(--alo-blue)]"
                                      aria-label={a.url ? `Open private attachment ${a.name}` : a.name}
                                    >
                                      <Icon name={fileTypeIcon(a.name)} className="size-3.5 text-[var(--alo-blue)]" />
                                      <span className="max-w-[120px] truncate" title={a.name}>{a.name}</span>
                                      <span className="text-[11px] text-[var(--alo-muted)]">{fileSizeLabel(a.size)}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                              <div
                                className={cn(
                                  "mt-1 flex items-center gap-1 text-[11px] text-[var(--alo-muted)]",
                                  isOutbound ? "justify-end" : "justify-start"
                                )}
                              >
                                <span>{timeAgo(m.receivedAt)}</span>
                                {isOutbound && <DeliveryStatus status={m.deliveryStatus} />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </ScrollArea>

              {/* AI Draft Reply panel */}
              <div className="border-t border-[var(--alo-border)] p-3">
                {aiDraft !== null ? (
                  <div className="space-y-2 rounded-xl border border-[var(--alo-blue)]/30 bg-gradient-to-br from-[var(--alo-blue-soft)]/60 to-[var(--alo-surface)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--alo-blue-strong)]">
                        <Icon name="Sparkles" className="size-3.5" />
                        AI Generated Draft
                      </div>
                      <IconButton
                        icon="X"
                        label="Discard draft"
                        size="sm"
                        variant="ghost"
                        onClick={rejectDraft}
                      />
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-[var(--alo-text)]">{aiDraft}</p>
                    {aiOtpRequired && (
                      <div className="flex items-center gap-1.5 rounded-md bg-[var(--alo-warning-soft)] px-2 py-1 text-xs text-[var(--alo-warning-strong)]">
                        <Icon name="ShieldAlert" className="size-3.5" />
                        Private details are blocked here. This draft flow cannot send or verify an OTP; use the secure student portal or assigned-counselor process.
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={editDraft}>
                        <Icon name="Pencil" className="size-3.5" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={rejectDraft} className="text-[var(--alo-danger-strong)] border-[var(--alo-danger)]/40 hover:bg-[var(--alo-danger-soft)]">
                        <Icon name="X" className="size-3.5" /> Reject
                      </Button>
                      <Button
                        variant="alo"
                        size="sm"
                        onClick={approveAndSendDraft}
                        disabled={sending || aiOtpRequired}
                        className="ml-auto"
                      >
                        {sending ? (
                          <>
                            <Icon name="Loader2" className="size-3.5 animate-spin" /> Sending…
                          </>
                        ) : (
                          <>
                            <Icon name="Send" className="size-3.5" /> Approve & Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--alo-muted)]">
                      <Icon name="Sparkles" className="size-3.5 text-[var(--alo-blue)]" />
                      Generate an AI draft reply for the latest inbound message.
                    </div>
                    <Button
                      variant="alo"
                      size="sm"
                      onClick={generateAiReply}
                      disabled={aiLoading || !lastInbound}
                    >
                      {aiLoading ? (
                        <>
                          <Icon name="Loader2" className="size-3.5 animate-spin" /> Generating…
                        </>
                      ) : (
                        <>
                          <Icon name="Sparkles" className="size-3.5" /> Generate AI Reply
                        </>
                      )}
                    </Button>
                  </div>
                )}
                {aiError && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--alo-danger-strong)]">
                    <Icon name="AlertTriangle" className="size-3.5" />
                    AI service unavailable — manual reply required. ({aiError})
                  </p>
                )}

                {/* Quick replies */}
                {quickReplies.length > 0 && (
                  <div className="mt-3">
                    <p className="caption-text text-[var(--alo-muted)]">Quick replies</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {quickReplies.slice(0, 8).map((qr) => (
                        <button
                          key={qr.id}
                          type="button"
                          onClick={() => setComposerText((c) => (c ? `${c}\n\n${qr.body}` : qr.body))}
                          className="rounded-full border border-[var(--alo-border)] bg-[var(--alo-surface)] px-2.5 py-1 text-xs text-[var(--alo-text-secondary)] transition-colors hover:border-[var(--alo-blue)] hover:bg-[var(--alo-blue-soft)] hover:text-[var(--alo-blue-strong)]"
                          title={qr.body}
                        >
                          {qr.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Templates dropdown */}
                {templates.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <Label className="text-xs text-[var(--alo-muted)]">Template:</Label>
                    <Select
                      value=""
                      onValueChange={(v) => {
                        const tpl = templates.find((t) => t.id === v);
                        if (tpl) setComposerText((c) => (c ? `${c}\n\n${tpl.body}` : tpl.body));
                      }}
                    >
                      <SelectTrigger className="h-8 flex-1 text-xs" size="sm">
                        <SelectValue placeholder="Insert approved WhatsApp template…" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} {t.language ? `(${t.language})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Composer */}
                <div className="mt-3 space-y-2">
                  {attachments.length > 0 && (student?.applications?.length || 0) > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs text-[var(--alo-muted)]">Associate media with an application (optional unless required by access policy)</Label>
                      <Select value={outboundApplicationId} onValueChange={setOutboundApplicationId}>
                        <SelectTrigger className="h-8 w-full text-xs" size="sm"><SelectValue placeholder="Choose an application, if relevant…" /></SelectTrigger>
                        <SelectContent>
                          {student?.applications?.map((application) => (
                            <SelectItem key={application.id} value={application.id}>
                              {application.universityName || 'Application'} · {application.stage.replace(/_/g, ' ').toLowerCase()}{application.isB2bConfidential ? ' · B2B confidential' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {attachments.length > 0 && student?.hasB2bConfidentialApplications && !student.canManageB2bDocuments && (
                    <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">This student has B2B-confidential applications. Media sending is blocked until an authorized B2B user handles the file.</p>
                  )}
                  {attachments.length > 0 && student?.hasB2bConfidentialApplications && student.canManageB2bDocuments && !outboundApplicationId && (
                    <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900">Select the relevant application before uploading this media.</p>
                  )}
                  <Textarea
                    placeholder="Type your reply…"
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {attachments.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] px-2 py-1 text-xs"
                        >
                          <Icon name={fileTypeIcon(f.name)} className="size-3.5 text-[var(--alo-blue)]" />
                          <span className="truncate max-w-[120px]" title={f.name}>{f.name}</span>
                          <span className="text-[11px] text-[var(--alo-muted)]">{fileSizeLabel(f.size)}</span>
                          <button
                            type="button"
                            onClick={() => setAttachments((a) => a.filter((_, idx) => idx !== i))}
                            className="text-[var(--alo-muted)] hover:text-[var(--alo-danger)]"
                            aria-label="Remove attachment"
                          >
                            <Icon name="X" className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <FileUploader
                        onFiles={(files) => setAttachments((a) => [...a, ...files])}
                        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                        multiple
                        maxSizeMB={10}
                        hint=""
                        className="!px-3 !py-2 !text-xs"
                      />
                      {/* Inline upload button (compact) */}
                      <label className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface)] text-[var(--alo-text-secondary)] hover:bg-[var(--alo-surface-muted)]">
                        <Icon name="Paperclip" className="size-3.5" />
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length) setAttachments((a) => [...a, ...files]);
                          }}
                        />
                      </label>
                    </div>
                    <Button
                      variant="alo"
                      size="sm"
                      onClick={sendMessage}
                      disabled={sending || (!composerText.trim() && attachments.length === 0) || (attachments.length > 0 && Boolean(student?.hasB2bConfidentialApplications && (!student.canManageB2bDocuments || !outboundApplicationId)))}
                    >
                      {sending ? (
                        <>
                          <Icon name="Loader2" className="size-3.5 animate-spin" /> Sending…
                        </>
                      ) : (
                        <>
                          <Icon name="Send" className="size-3.5" /> Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Status bar */}
                <div className="mt-3 flex items-center justify-between border-t border-[var(--alo-border)] pt-2 text-[11px] text-[var(--alo-muted)]">
                  <span className="flex items-center gap-1">
                    <Icon name="Check" className="size-2.5" /> Sent
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="CheckCheck" className="size-2.5" /> Delivered
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="CheckCheck" className="size-2.5 text-[var(--alo-blue)]" /> Read
                  </span>
                </div>
              </div>
            </SectionCard>
          )}
        </main>

        {/* ─── RIGHT — student/contact context ─── */}
        <aside className="flex h-full min-h-[400px] flex-col gap-3 overflow-y-auto lg:col-span-3">
          {!selected ? (
            <SectionCard>
              <EmptyState
                icon="UserCircle2"
                title="No contact selected"
                description="Select a conversation to see student context, AI classification, and document receipts."
                accent="slate"
              />
            </SectionCard>
          ) : studentError ? (
            <ErrorState title="Failed to load student" description={studentError} />
          ) : studentLoading ? (
            <SectionCard title="Loading student…">
              <LoadingSkeleton lines={6} />
            </SectionCard>
          ) : student ? (
            <StudentContextPanel
              student={student}
              activeApplications={activeApplications}
              missingDocuments={missingDocuments}
              latestOffer={latestOffer}
              latestPayment={latestPayment}
              latestInterview={latestInterview}
              lastCommunication={lastCommunication}
            />
          ) : (
            <NewContactPanel
              phone={selected.fromPhone || selected.fromEmail || "—"}
              contactMatchId={contactMatchId}
              candidates={contactMatchCandidates}
              onResolve={resolveContact}
            />
          )}

          {/* AI Message Classification */}
          {selected && (
            <AiClassificationPanel
              message={lastInbound?.body || ""}
              studentId={selected.studentId}
            />
          )}

          {/* WhatsApp Document Receipt */}
          {selected && lastInbound && lastInboundAttachments.length > 0 && (
            <DocumentReceiptPanel
              key={`${selected.key}-${lastInbound.id}`}
              attachments={lastInboundAttachments}
              studentId={selected.studentId}
              activeApplications={activeApplications}
              onCreateUploadEvent={createDocumentUploadEvent}
            />
          )}
          {selected && lastInbound && lastInboundAttachments.length === 0 && student && (
            <SectionCard
              title="Document Receipt"
              icon="FileText"
              accent="orange"
              description="No inbound attachment on the selected message."
            >
              <p className="text-xs text-[var(--alo-muted)]">
                When the student sends an image or PDF via WhatsApp, the document receipt panel
                will appear here for matching to a student record and application.
              </p>
            </SectionCard>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Right-column sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StudentContextPanel({
  student,
  activeApplications,
  missingDocuments,
  latestOffer,
  latestPayment,
  latestInterview,
  lastCommunication,
}: {
  student: StudentContext;
  activeApplications: NonNullable<StudentContext["applications"]>;
  missingDocuments: NonNullable<StudentContext["documents"]>;
  latestOffer: NonNullable<StudentContext["applications"]>[number] | null;
  latestPayment: NonNullable<StudentContext["payments"]>[number] | null;
  latestInterview: NonNullable<StudentContext["interviews"]>[number] | null;
  lastCommunication: NonNullable<StudentContext["timelineEvents"]>[number] | null;
}) {
  return (
    <SectionCard
      title="Student Context"
      icon="UserSquare"
      accent="blue"
      className="flex-shrink-0"
    >
      <div className="space-y-1">
        <InfoRow label="Name" value={student.fullName} />
        <InfoRow label="Student ID" value={student.studentId} mono />
        <InfoRow label="Phone" value={student.mobile || "—"} mono />
        <InfoRow label="Counselor" value={student.counselor?.name || "Unassigned"} />
        <InfoRow label="Destination" value={student.studyDestination || "—"} />
        <InfoRow
          label="Profile"
          value={
            <span className="flex items-center gap-1.5">
              <span className="font-mono">{student.profileCompletion || 0}%</span>
              <span className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--alo-surface-muted)]">
                <span
                  className="block h-full rounded-full bg-alo-gradient"
                  style={{ width: `${student.profileCompletion || 0}%` }}
                />
              </span>
            </span>
          }
        />
      </div>

      {activeApplications.length > 0 && (
        <div className="mt-3">
          <p className="caption-text text-[var(--alo-muted)]">Active applications</p>
          <div className="mt-1.5 space-y-1.5">
            {activeApplications.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-2 text-xs"
              >
                <p className="font-medium text-[var(--alo-text)]">
                  {a.universityName || "—"}
                </p>
                <p className="text-[var(--alo-muted)]">
                  {a.courseName || "—"}
                </p>
                <Badge variant="warning" className="mt-1 text-[11px]">
                  {a.stage.replace(/_/g, " ").toLowerCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {missingDocuments.length > 0 && (
        <div className="mt-3">
          <p className="caption-text text-[var(--alo-muted)]">Missing documents</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {missingDocuments.slice(0, 6).map((d) => (
              <Badge key={d.id} variant="danger" className="text-[11px]">
                {d.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 space-y-1">
        <InfoRow
          label="Latest offer"
          value={
            latestOffer
              ? `${latestOffer.universityName || "—"} · ${latestOffer.stage.replace(/_/g, " ").toLowerCase()}`
              : "—"
          }
        />
        <InfoRow
          label="Payment status"
          value={
            latestPayment
              ? `${latestPayment.status || "—"} · ${latestPayment.amount || 0} BDT`
              : "—"
          }
        />
        <InfoRow
          label="Interview"
          value={
            latestInterview
              ? `${latestInterview.type || "—"} · score ${latestInterview.score ?? "—"}`
              : "—"
          }
        />
        <InfoRow
          label="Last communication"
          value={lastCommunication ? timeAgo(lastCommunication.createdAt) : "—"}
        />
      </div>

      {/* AI Next Best Action */}
      <div className="mt-3">
        <AISuggestionCard
          title="Next best action"
          suggestion={suggestNextBestAction(student, missingDocuments.length, activeApplications)}
          reasoning="Inferred from current application stage, missing documents and recent timeline events."
          confidence={78}
          category="Recommendation"
        />
      </div>
    </SectionCard>
  );
}

function suggestNextBestAction(
  student: StudentContext,
  missingDocs: number,
  activeApps: NonNullable<StudentContext["applications"]>
): string {
  if (missingDocs > 0) {
    return `Request the ${missingDocs} missing document${missingDocs > 1 ? "s" : ""} from the student. Send a friendly checklist via WhatsApp and offer upload assistance.`;
  }
  if (activeApps.length === 0) {
    return "No active applications. Recommend booking a consultation to shortlist universities and programs.";
  }
  const latestStage = activeApps[0]?.stage;
  if (latestStage === "APPLICATION_SUBMITTED") {
    return "Application submitted — share typical offer turnaround times and keep the student engaged with weekly check-ins.";
  }
  if (latestStage === "CONDITIONAL_OFFFER" || latestStage === "UNCONDITIONAL_OFFFER") {
    return "Offer received — guide the student toward deposit payment and CAS issuance. Send the deposit instructions template.";
  }
  if (latestStage && latestStage.startsWith("VISA_")) {
    return "Visa stage in progress — share the visa document checklist and pre-departure checklist.";
  }
  return `Continue counseling ${student.fullName} on ${student.studyDestination || "their destination"} of choice.`;
}

function NewContactPanel({
  phone,
  contactMatchId,
  candidates,
  onResolve,
}: {
  phone: string;
  contactMatchId: string | null;
  candidates: ContactMatchCandidate[];
  onResolve: (d: "OPEN_EXISTING" | "MERGE_REQUEST" | "CREATE_NEW", candidate?: ContactMatchCandidate) => void;
}) {
  const linkableCandidates = candidates.filter((candidate) => candidate.kind !== 'unknown');
  return (
    <>
      <SectionCard title={linkableCandidates.length ? "Identity Review" : "Unlinked Contact"} icon="UserPlus" accent="orange">
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-md bg-[var(--alo-orange-soft)] px-3 py-2 text-sm">
            <Icon name="Phone" className="size-4 text-[var(--alo-orange-strong)]" />
            <span className="font-mono font-semibold text-[var(--alo-orange-strong)]">{phone}</span>
          </div>
          <p className="body-text text-[var(--alo-text-secondary)]">
            An inbound message is not promotional consent. Verify identity and capture separate channel- and purpose-specific consent before marketing outreach.
          </p>
          {linkableCandidates.length > 0 ? (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-[var(--alo-text-secondary)]">Possible existing records (review before linking):</p>
              {linkableCandidates.map((candidate) => (
                <div key={`${candidate.kind}:${candidate.id}`} className="flex items-center justify-between gap-2 rounded-md border border-[var(--alo-border)] p-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{candidate.name || candidate.reference || candidate.kind}</p>
                    <p className="truncate text-[11px] text-[var(--alo-muted)]">
                      {candidate.kind.replace('_', ' ')}{candidate.reference ? ` · ${candidate.reference}` : ''}{candidate.phone ? ` · ${candidate.phone}` : ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled={!contactMatchId} onClick={() => onResolve("OPEN_EXISTING", candidate)}>
                    <Icon name="FolderOpen" className="size-3.5" /> Open Existing
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--alo-muted)]">No in-scope CRM candidate is confirmed. The contact remains unlinked until reviewed.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Contact Match Review"
        icon="Shuffle"
        accent="amber"
        description="A human decision is required. Merge requests are queued; this screen never merges student records."
      >
        {!contactMatchId ? (
          <p className="text-xs text-[var(--alo-muted)]">A review record is unavailable. No identity link or new contact was created.</p>
        ) : (
          <p className="text-xs text-[var(--alo-muted)]">
            Review ID: <span className="font-mono">{contactMatchId.slice(0, 12)}…</span>
          </p>
        )}
        <div className="mt-3 flex flex-col gap-2">
          <Button variant="outline" size="sm" disabled={!contactMatchId} onClick={() => onResolve("MERGE_REQUEST")}>
            <Icon name="GitMerge" className="size-3.5" /> Request Human Merge Review
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!contactMatchId}
            onClick={() => onResolve("CREATE_NEW")}
            className="text-[var(--alo-orange-strong)] border-[var(--alo-orange)]/40 hover:bg-[var(--alo-orange-soft)]"
          >
            <Icon name="UserPlus" className="size-3.5" /> Create Unlinked Contact (Authorized Role Only)
          </Button>
        </div>
      </SectionCard>
    </>
  );
}

function AiClassificationPanel({
  message,
  studentId,
}: {
  message: string;
  studentId?: string | null;
}) {
  // Lightweight client-side heuristic for display purposes only.
  const lower = message.toLowerCase();
  let intent = "GENERAL_INQUIRY";
  let linkedApp = studentId ? "Linked to most recent active application" : "Not linked (new contact)";
  if (/passport|visa|cas|i20|offer|document/.test(lower)) {
    intent = "DOCUMENT_REQUIREMENT";
  } else if (/payment|invoice|fee|refund|deposit/.test(lower)) {
    intent = "PAYMENT_QUESTION";
  } else if (/deadline|intake|apply|application/.test(lower)) {
    intent = "APPLICATION_STATUS";
  } else if (/interview|mock/.test(lower)) {
    intent = "INTERVIEW_PREP";
  } else if (/hi|hello|hey|salam|assalam/.test(lower)) {
    intent = "GREETING";
  }

  const nextBest: Record<string, string> = {
    DOCUMENT_REQUIREMENT: "Verify document identity via OTP, then share the document checklist with upload instructions.",
    PAYMENT_QUESTION: "Share the latest invoice and accepted payment methods. Escalate to finance if disputed.",
    APPLICATION_STATUS: "Verify identity via OTP, then share current stage and next milestone timeline.",
    INTERVIEW_PREP: "Recommend booking a mock interview session via the AI Interview Studio.",
    GREETING: "Send a warm welcome and offer to help with their query.",
    GENERAL_INQUIRY: "Clarify the student's question, then route to the relevant counselor.",
  };

  return (
    <SectionCard title="AI Message Classification" icon="BrainCircuit" accent="violet">
      <div className="space-y-2">
        <InfoRow label="Detected intent" value={<Badge variant="info" className="text-[11px]">{intent.replace(/_/g, " ")}</Badge>} />
        <InfoRow label="Linked application" value={linkedApp} />
      </div>
      <div className="mt-3">
        <AISuggestionCard
          title="Next best action"
          suggestion={nextBest[intent] || nextBest.GENERAL_INQUIRY}
          confidence={intent === "GREETING" ? 90 : 65}
          category={intent}
        />
      </div>
    </SectionCard>
  );
}

function DocumentReceiptPanel({
  attachments,
  studentId,
  activeApplications,
  onCreateUploadEvent,
}: {
  attachments: Attachment[];
  studentId?: string | null;
  activeApplications: NonNullable<StudentContext["applications"]>;
  onCreateUploadEvent: (attachment: Attachment, documentType: string, applicationId?: string) => void;
}) {
  const [selectedAppId, setSelectedAppId] = React.useState<string>("");
  const [selectedDocRequirement, setSelectedDocRequirement] = React.useState<string>("");

  return (
    <SectionCard
      title="WhatsApp Document Receipt"
      icon="FileText"
      accent="orange"
      description="Inbound attachment received via WhatsApp. Match it to a student application and document requirement."
    >
      <div className="space-y-2">
        {attachments.map((a, i) => (
          <div
            key={i}
            className="rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-2.5"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--alo-orange-soft)] text-[var(--alo-orange-strong)]">
                <Icon name={fileTypeIcon(a.name)} className="size-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--alo-text)]" title={a.name}>
                  {a.name}
                </p>
                <p className="text-xs text-[var(--alo-muted)]">
                  {a.type || "Unknown type"} · {fileSizeLabel(a.size)}
                </p>
              </div>
            </div>
            {a.url && <a href={a.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-medium text-[var(--alo-blue)] underline underline-offset-2">Open private attachment</a>}

            {/* Match-to-application dropdown */}
            <div className="mt-2 space-y-2">
              {!studentId ? (
                <div className="flex items-center gap-1.5 rounded-md bg-[var(--alo-warning-soft)] px-2 py-1 text-xs text-[var(--alo-warning-strong)]">
                  <Icon name="AlertTriangle" className="size-3.5" />
                  Sender is not linked to a student. Match the contact before adding this file to a student profile; the private file remains in this conversation.
                </div>
              ) : (
                <>
                  {activeApplications.length > 0 ? (
                    <div>
                      <Label className="text-[11px] uppercase tracking-wide text-[var(--alo-muted)]">
                        Match to application
                      </Label>
                      <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                        <SelectTrigger className="mt-0.5 h-8 w-full text-xs" size="sm">
                          <SelectValue placeholder="Select an active application…" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeApplications.map((a2) => (
                            <SelectItem key={a2.id} value={a2.id}>
                              {a2.universityName || "—"} · {a2.stage.replace(/_/g, " ").toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--alo-muted)]">No active application is available; you can still link this file to the student profile.</p>
                  )}
                  <div>
                    <Label className="text-[11px] uppercase tracking-wide text-[var(--alo-muted)]">
                      Match to document requirement
                    </Label>
                    <Select value={selectedDocRequirement} onValueChange={setSelectedDocRequirement}>
                      <SelectTrigger className="mt-0.5 h-8 w-full text-xs" size="sm">
                        <SelectValue placeholder="Select document type…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PASSPORT">Passport</SelectItem>
                        <SelectItem value="ACADEMIC_CERT">Academic Certificate</SelectItem>
                        <SelectItem value="TRANSCRIPT">Academic Transcript</SelectItem>
                        <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                        <SelectItem value="IELTS_CERT">English Test Certificate</SelectItem>
                        <SelectItem value="CV">CV / Resume</SelectItem>
                        <SelectItem value="SOP">Statement of Purpose</SelectItem>
                        <SelectItem value="VISA_DOC">Visa Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button
                variant="alo"
                size="sm"
                className="w-full"
                disabled={!studentId || !selectedDocRequirement || (activeApplications.length > 0 && !selectedAppId)}
                onClick={() => onCreateUploadEvent(a, selectedDocRequirement, selectedAppId || undefined)}
              >
                <Icon name="FileUp" className="size-3.5" /> Attach to student profile (pending review)
              </Button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default WhatsAppCommandCenter;
// Backward-compat alias — both PascalCase interpretations resolve to the same component.
export { WhatsAppCommandCenter as WhatsappCommandCenter };
