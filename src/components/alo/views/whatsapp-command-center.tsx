"use client";

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
  EmptyState,
  LoadingGrid,
  InfoRow,
} from "@/components/alo/shared";
import {
  SearchInput,
  Pill,
  fetchJson,
  slaCountdown,
  timeAgoShort,
  fmtTime,
} from "@/components/alo/comm-helpers";

// ─── Types ────────────────────────────────────────────────────────────────

interface InboxMessage {
  id: string;
  channel: string;
  direction: string;
  fromName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  body: string;
  aiAssisted?: boolean | null;
  read?: boolean | null;
  receivedAt: string;
  sentAt?: string | null;
  deliveryStatus?: string | null;
  studentId?: string | null;
  counselorId?: string | null;
}

interface Conversation {
  key: string;
  channel: string;
  studentId?: string | null;
  studentName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  messages: InboxMessage[];
  unread: number;
  lastMessageAt: string;
}

interface InboxResponse {
  conversations: Conversation[];
  slaStats: unknown[];
  totalMessages: number;
}

interface StudentSummary {
  id: string;
  studentId: string;
  fullName: string;
  email?: string | null;
  mobile?: string | null;
  counselorId?: string | null;
  counselorName?: string | null;
  studyDestination?: string | null;
  programTitle?: string | null;
  studyLevel?: string | null;
  applicationStage?: string | null;
  profileCompletion?: number | null;
  hasPassport?: boolean | null;
  missingDocuments?: string[];
}

interface ContactMatchResponse {
  matched: boolean;
  matchType: "STUDENT" | "LEAD" | "PARTNER" | "NONE";
  matchedId?: string;
  confidence: number;
  reviewId: string;
  possibleDuplicates: Array<{ type: string; id: string; label: string; field?: string }>;
}

interface DraftPayload {
  channel: string;
  socialInboxMessageId?: string;
  studentId?: string;
  draftBody: string;
  aiGenerated: boolean;
  aiConfidence: number;
  aiReasoning?: string | null;
  riskLevel: string;
  mode: string;
  status: string;
}

interface QuickReply {
  id: string;
  title: string;
  body: string;
  shortcut?: string | null;
  category?: string | null;
}

interface Template {
  id: string;
  name: string;
  body: string;
  category?: string | null;
  variables?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────

const WHATSAPP_BRAND = "#16a34a";

// ─── Main Component ───────────────────────────────────────────────────────

export function WhatsappCommandCenter() {
  const { toast } = useToast();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"ALL" | "UNREAD" | "SLA_OVERDUE">("ALL");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [student, setStudent] = React.useState<StudentSummary | null>(null);
  const [studentLoading, setStudentLoading] = React.useState(false);
  const [contactMatch, setContactMatch] = React.useState<ContactMatchResponse | null>(null);
  const [matchReviewOpen, setMatchReviewOpen] = React.useState(false);

  // Active conversation state
  const [aiDraft, setAiDraft] = React.useState<{ body: string; confidence: number; reasoning?: string } | null>(null);
  const [draftLoading, setDraftLoading] = React.useState(false);
  const [draftError, setDraftError] = React.useState<string | null>(null);
  const [editedDraft, setEditedDraft] = React.useState("");
  const [composerText, setComposerText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [quickReplies, setQuickReplies] = React.useState<QuickReply[]>([]);
  const [templates, setTemplates] = React.useState<Template[]>([]);

  const fetchInbox = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchJson<InboxResponse>("/api/inbox/unified?channel=WHATSAPP");
      const sorted = (data.conversations || []).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
      setConversations(sorted);
      if (!activeKey && sorted.length > 0) setActiveKey(sorted[0].key);
    } catch (err) {
      console.error("[whatsapp inbox]", err);
      setError(true);
      toast({
        title: "Failed to load WhatsApp conversations",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeKey, toast]);

  const fetchQuickReplies = React.useCallback(async () => {
    try {
      const res = await fetchJson<{ quickReplies: QuickReply[] }>(
        "/api/communications/quick-replies?channel=WHATSAPP&isActive=true"
      );
      setQuickReplies(res.quickReplies || []);
    } catch {
      // Non-critical — silently ignore
    }
  }, []);

  const fetchTemplates = React.useCallback(async () => {
    try {
      const res = await fetchJson<{ templates: Template[] }>(
        "/api/communications/templates?channel=WHATSAPP"
      );
      setTemplates(res.templates || []);
    } catch {
      // Non-critical
    }
  }, []);

  React.useEffect(() => {
    void fetchInbox();
    void fetchQuickReplies();
    void fetchTemplates();
  }, [fetchInbox, fetchQuickReplies, fetchTemplates]);

  const activeConversation = conversations.find((c) => c.key === activeKey) || null;

  // ── Load student context when active conversation changes ──
  React.useEffect(() => {
    setStudent(null);
    setContactMatch(null);
    setAiDraft(null);
    setEditedDraft("");
    setComposerText("");
    setDraftError(null);

    if (!activeConversation) return;

    if (activeConversation.studentId) {
      void loadStudent(activeConversation.studentId);
    } else if (activeConversation.fromPhone) {
      void attemptContactMatch(activeConversation.fromPhone, activeConversation.studentName || undefined);
    }
  }, [activeKey]);

  const loadStudent = async (studentId: string) => {
    setStudentLoading(true);
    try {
      const data = await fetchJson<StudentSummary | { student: StudentSummary } | StudentSummary[]>(
        `/api/students?id=${encodeURIComponent(studentId)}`
      );
      const stu = Array.isArray(data)
        ? data[0]
        : "student" in (data as Record<string, unknown>)
        ? (data as { student: StudentSummary }).student
        : (data as StudentSummary);
      setStudent(stu || null);
    } catch {
      // Student endpoint may differ — fall back to contact match attempt
      if (activeConversation?.fromPhone) {
        void attemptContactMatch(activeConversation.fromPhone, activeConversation.studentName || undefined);
      }
    } finally {
      setStudentLoading(false);
    }
  };

  const attemptContactMatch = async (phone: string, name?: string) => {
    try {
      const res = await fetchJson<ContactMatchResponse>("/api/communications/contacts/match", {
        method: "POST",
        body: JSON.stringify({ phone, name }),
      });
      setContactMatch(res);
      if (res.matched && res.matchType === "STUDENT" && res.matchedId) {
        void loadStudent(res.matchedId);
      } else if (!res.matched) {
        setMatchReviewOpen(true);
      }
    } catch {
      // Non-critical
    }
  };

  // ── AI Draft generation ──
  const generateAiDraft = async () => {
    if (!activeConversation) return;
    setDraftLoading(true);
    setDraftError(null);
    setAiDraft(null);
    setEditedDraft("");
    try {
      const lastInbound = [...activeConversation.messages]
        .reverse()
        .find((m) => m.direction === "INBOUND");
      if (!lastInbound) {
        setDraftError("No inbound message to generate a reply for.");
        return;
      }
      const res = await fetch("/api/whatsapp/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: activeConversation.fromPhone,
          message: lastInbound.body,
          conversationId: activeConversation.key,
          studentId: activeConversation.studentId,
        }),
      });
      if (!res.ok) throw new Error(`AI service error (${res.status})`);
      const data = (await res.json()) as { reply?: string; requiresOtp?: boolean };
      if (!data.reply) throw new Error("AI returned no reply");
      const draft = {
        body: data.reply,
        confidence: 75,
        reasoning: "Generated by ALO AI assistant using student context.",
      };
      setAiDraft(draft);
      setEditedDraft(draft.body);
    } catch (err) {
      setDraftError(
        err instanceof Error
          ? `AI service unavailable — ${err.message}. You can still type and send a manual reply below.`
          : "AI service unavailable. You can still type and send a manual reply below."
      );
    } finally {
      setDraftLoading(false);
    }
  };

  // ── Approve / reject AI draft ──
  const handleDraftApprove = async () => {
    if (!activeConversation || !aiDraft) return;
    try {
      await fetchJson("/api/communications/drafts", {
        method: "POST",
        body: JSON.stringify({
          channel: "WHATSAPP",
          studentId: activeConversation.studentId || undefined,
          socialInboxMessageId: activeConversation.messages[0]?.id,
          draftBody: aiDraft.body,
          aiGenerated: true,
          aiConfidence: aiDraft.confidence,
          aiReasoning: aiDraft.reasoning,
          riskLevel: "LOW",
          mode: "AI_DRAFT_HUMAN_SEND",
          status: "DRAFT",
        } satisfies DraftPayload),
      });
      toast({ title: "Draft saved for human review", description: "Stored in pending drafts queue." });
      // Send the reply (manual send)
      await sendMessage(editedDraft || aiDraft.body);
      setAiDraft(null);
      setEditedDraft("");
    } catch (err) {
      toast({
        title: "Failed to save draft",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  const handleDraftReject = () => {
    setAiDraft(null);
    setEditedDraft("");
    setDraftError(null);
    toast({ title: "AI draft rejected", description: "Compose a manual reply below." });
  };

  // ── Send reply ──
  const sendMessage = async (text: string) => {
    if (!activeConversation || !text.trim()) return;
    setSending(true);
    try {
      await fetchJson("/api/inbox/unified", {
        method: "POST",
        body: JSON.stringify({
          channel: "WHATSAPP",
          toPhone: activeConversation.fromPhone,
          body: text.trim(),
          studentId: activeConversation.studentId,
          aiAssisted: !!aiDraft,
          humanApproved: true,
        }),
      });
      toast({ title: "Message sent" });
      setComposerText("");
      setAiDraft(null);
      setEditedDraft("");
      // Refresh conversations to show new message
      void fetchInbox();
    } catch (err) {
      toast({
        title: "Failed to send message",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ── Filtered conversation list ──
  const filteredConversations = conversations.filter((c) => {
    if (filter === "UNREAD" && c.unread === 0) return false;
    if (filter === "SLA_OVERDUE") {
      const lastInbound = [...c.messages].reverse().find((m) => m.direction === "INBOUND");
      if (!lastInbound) return false;
      const deadline = new Date(lastInbound.receivedAt);
      deadline.setMinutes(deadline.getMinutes() + 30);
      if (deadline.getTime() > Date.now()) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        (c.studentName || "").toLowerCase().includes(q) ||
        (c.fromPhone || "").toLowerCase().includes(q) ||
        (c.fromEmail || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="WhatsApp Command Center"
          subtitle="Real-time WhatsApp conversation management with AI-assisted drafting and student context."
          icon="MessageCircle"
        />
        <LoadingGrid count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="WhatsApp Command Center"
          subtitle="Real-time WhatsApp conversation management with AI-assisted drafting and student context."
          icon="MessageCircle"
        />
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-[#991B1B]">Failed to load conversations</p>
          <Button onClick={() => void fetchInbox()} className="mt-3" size="sm">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Command Center"
        subtitle="Real-time WhatsApp conversation management with AI-assisted drafting and student context."
        icon="MessageCircle"
        action={
          <Button
            variant="outline"
            className="h-10 border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
            onClick={() => void fetchInbox()}
          >
            <Icon name="RefreshCw" className="mr-2 size-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-4">
        {/* ─── Left: Conversation list ─── */}
        <aside className="lg:col-span-3">
          <ConversationList
            conversations={filteredConversations}
            activeKey={activeKey}
            onSelect={setActiveKey}
            search={search}
            onSearch={setSearch}
            filter={filter}
            onFilter={setFilter}
          />
        </aside>

        {/* ─── Center: Active conversation ─── */}
        <section className="lg:col-span-6">
          {activeConversation ? (
            <ActiveConversation
              conversation={activeConversation}
              aiDraft={aiDraft}
              draftLoading={draftLoading}
              draftError={draftError}
              editedDraft={editedDraft}
              setEditedDraft={setEditedDraft}
              onGenerateDraft={generateAiDraft}
              onApproveDraft={handleDraftApprove}
              onRejectDraft={handleDraftReject}
              composerText={composerText}
              setComposerText={setComposerText}
              onSend={() => void sendMessage(composerText)}
              sending={sending}
              quickReplies={quickReplies}
              templates={templates}
            />
          ) : (
            <div className="flex h-full min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-12 text-center">
              <div
                className="flex size-14 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: WHATSAPP_BRAND }}
              >
                <Icon name="MessageCircle" className="size-7" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#0F172A]">Select a conversation</p>
              <p className="mt-1 text-xs text-[#64748B]">
                Pick a conversation from the list to view messages and student context.
              </p>
            </div>
          )}
        </section>

        {/* ─── Right: Student context / contact match ─── */}
        <aside className="lg:col-span-3">
          {student ? (
            <StudentContextPanel student={student} loading={studentLoading} />
          ) : contactMatch ? (
            <ContactMatchPanel
              match={contactMatch}
              onResolve={(decision) =>
                void resolveContactMatch(contactMatch.reviewId, decision)
              }
              openDialog={matchReviewOpen}
              setOpenDialog={setMatchReviewOpen}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-5 py-6 text-center">
              <p className="text-xs text-[#64748B]">
                Student context & contact match details will appear here when a conversation is selected.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );

  async function resolveContactMatch(reviewId: string, decision: "OPEN_EXISTING" | "MERGE_REQUEST" | "CREATE_NEW") {
    try {
      await fetchJson(`/api/communications/contacts/match/${reviewId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      toast({
        title: `Contact review: ${decision.replace(/_/g, " ").toLowerCase()}`,
        description: "Decision recorded. The conversation is now ready for follow-up.",
      });
      setMatchReviewOpen(false);
    } catch (err) {
      toast({
        title: "Failed to resolve match",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ConversationList({
  conversations,
  activeKey,
  onSelect,
  search,
  onSearch,
  filter,
  onFilter,
}: {
  conversations: Conversation[];
  activeKey: string | null;
  onSelect: (key: string) => void;
  search: string;
  onSearch: (v: string) => void;
  filter: "ALL" | "UNREAD" | "SLA_OVERDUE";
  onFilter: (f: "ALL" | "UNREAD" | "SLA_OVERDUE") => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#E2E8F0] bg-white">
      <div className="border-b border-[#E2E8F0] p-3">
        <SearchInput value={search} onChange={onSearch} placeholder="Search WhatsApp chats…" />
        <div className="mt-2 flex gap-1">
          {[
            { v: "ALL", l: "All" },
            { v: "UNREAD", l: "Unread" },
            { v: "SLA_OVERDUE", l: "SLA Overdue" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => onFilter(opt.v as "ALL" | "UNREAD" | "SLA_OVERDUE")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
                filter === opt.v
                  ? "bg-[#16a34a] text-white"
                  : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
              )}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto alo-scroll" style={{ maxHeight: "calc(100vh - 280px)" }}>
        {conversations.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-[#64748B]">
            No conversations match this filter.
          </div>
        ) : (
          conversations.map((c) => {
            const lastMsg = c.messages[0];
            const active = c.key === activeKey;
            const lastInbound = [...c.messages].reverse().find((m) => m.direction === "INBOUND");
            const slaDeadline = lastInbound
              ? new Date(new Date(lastInbound.receivedAt).getTime() + 30 * 60 * 1000)
              : null;
            const sla = slaCountdown(slaDeadline);
            const overdue = sla.status === "OVERDUE" || sla.status === "URGENT";
            return (
              <button
                key={c.key}
                onClick={() => onSelect(c.key)}
                className={cn(
                  "flex w-full items-start gap-2.5 border-b border-[#E2E8F0] px-3 py-3 text-left transition-colors",
                  active ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"
                )}
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: WHATSAPP_BRAND }}
                >
                  <span className="text-xs font-bold">
                    {(c.studentName || c.fromPhone || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                      {c.studentName || c.fromPhone || "Unknown"}
                    </p>
                    <span className="text-[10px] text-[#94A3B8]">
                      {timeAgoShort(c.lastMessageAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-[#64748B]">
                    {lastMsg?.body || "—"}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {c.unread > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-[#16a34a] px-1.5 text-[10px] font-bold text-white">
                        {c.unread}
                      </span>
                    )}
                    {overdue && (
                      <Pill className="bg-rose-100 text-rose-700">
                        <Icon name="Clock" className="size-2.5" />
                        SLA {sla.text}
                      </Pill>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ActiveConversation({
  conversation,
  aiDraft,
  draftLoading,
  draftError,
  editedDraft,
  setEditedDraft,
  onGenerateDraft,
  onApproveDraft,
  onRejectDraft,
  composerText,
  setComposerText,
  onSend,
  sending,
  quickReplies,
  templates,
}: {
  conversation: Conversation;
  aiDraft: { body: string; confidence: number; reasoning?: string } | null;
  draftLoading: boolean;
  draftError: string | null;
  editedDraft: string;
  setEditedDraft: React.Dispatch<React.SetStateAction<string>>;
  onGenerateDraft: () => void;
  onApproveDraft: () => void;
  onRejectDraft: () => void;
  composerText: string;
  setComposerText: React.Dispatch<React.SetStateAction<string>>;
  onSend: () => void;
  sending: boolean;
  quickReplies: QuickReply[];
  templates: Template[];
}) {
  // Live SLA countdown
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  void tick; // re-render every second

  const lastInbound = [...conversation.messages].reverse().find((m) => m.direction === "INBOUND");
  const slaDeadline = lastInbound
    ? new Date(new Date(lastInbound.receivedAt).getTime() + 30 * 60 * 1000)
    : null;
  const sla = slaCountdown(slaDeadline);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation.messages.length]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#E2E8F0] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-[#0F172A]">
              {conversation.studentName || conversation.fromPhone || "Unknown"}
            </p>
            {conversation.fromPhone && (
              <span className="font-mono text-xs text-[#64748B]">{conversation.fromPhone}</span>
            )}
          </div>
          <p className="text-[11px] text-[#64748B]">
            WhatsApp · {conversation.messages.length} message(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill
            className={cn(
              sla.status === "OVERDUE"
                ? "bg-rose-100 text-rose-700"
                : sla.status === "URGENT"
                ? "bg-orange-100 text-orange-700"
                : sla.status === "WARNING"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            )}
          >
            <Icon name="Clock" className="size-2.5" />
            SLA: {sla.text}
          </Pill>
        </div>
      </div>

      {/* Message thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto alo-scroll px-4 py-4" style={{ maxHeight: "calc(100vh - 480px)", minHeight: 220 }}>
        {conversation.messages.map((m) => {
          const inbound = m.direction === "INBOUND";
          return (
            <div
              key={m.id}
              className={cn("mb-3 flex", inbound ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                  inbound
                    ? "bg-[#F1F5F9] text-[#0F172A] rounded-tl-sm"
                    : "text-white rounded-tr-sm"
                )}
                style={!inbound ? { backgroundColor: WHATSAPP_BRAND } : undefined}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <div
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1 text-[10px]",
                    inbound ? "text-[#94A3B8]" : "text-white/80"
                  )}
                >
                  <span>{fmtTime(m.receivedAt)}</span>
                  {!inbound && (
                    <Icon
                      name={
                        m.deliveryStatus === "READ"
                          ? "CheckCheck"
                          : m.deliveryStatus === "DELIVERED"
                          ? "CheckCheck"
                          : "Check"
                      }
                      className="size-3"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Draft panel */}
      {(aiDraft || draftLoading || draftError) && (
        <div className="border-t border-[#E2E8F0] px-4 py-3">
          <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-violet-600 text-white">
                  <Icon name="Sparkles" className="size-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                    AI Generated Draft
                  </p>
                  {aiDraft && (
                    <p className="text-[10px] text-violet-600">
                      Confidence {aiDraft.confidence}% · {aiDraft.reasoning}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onRejectDraft}
                className="text-[11px] font-semibold text-rose-600 hover:underline"
                aria-label="Dismiss AI draft"
              >
                Dismiss
              </button>
            </div>

            {draftLoading && (
              <div className="flex items-center gap-2 text-xs text-violet-700">
                <Icon name="Loader2" className="size-3.5 animate-spin" />
                Generating draft…
              </div>
            )}

            {draftError && (
              <p className="text-xs text-amber-700">{draftError}</p>
            )}

            {aiDraft && (
              <>
                <Textarea
                  value={editedDraft}
                  onChange={(e) => setEditedDraft(e.target.value)}
                  className="min-h-[80px] bg-white text-sm"
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    className="h-8 flex-1 bg-emerald-600 text-[11px] hover:bg-emerald-700"
                    onClick={onApproveDraft}
                  >
                    <Icon name="Check" className="mr-1 size-3" />
                    Approve & Send
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-rose-200 text-[11px] text-rose-600 hover:bg-rose-50"
                    onClick={onRejectDraft}
                  >
                    <Icon name="X" className="mr-1 size-3" />
                    Reject
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick replies */}
      {quickReplies.length > 0 && (
        <div className="border-t border-[#E2E8F0] px-4 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto alo-scroll pb-1">
            {quickReplies.slice(0, 8).map((q) => (
              <button
                key={q.id}
                onClick={() => setComposerText((c) => (c ? c + " " : "") + q.body)}
                className="shrink-0 rounded-full border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                {q.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-[#E2E8F0] p-3">
        <div className="mb-2 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-violet-200 text-violet-700 hover:bg-violet-50"
            onClick={onGenerateDraft}
            disabled={draftLoading}
          >
            <Icon name="Sparkles" className="mr-1.5 size-3.5" />
            {draftLoading ? "Generating…" : "AI Draft Reply"}
          </Button>
          <Select
            value=""
            onValueChange={(val) => {
              const t = templates.find((x) => x.id === val);
              if (t) setComposerText((c) => (c ? c + " " : "") + t.body);
            }}
          >
            <SelectTrigger className="h-8 w-40 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Icon name="FileText" className="size-3.5" />
                Templates
              </span>
            </SelectTrigger>
            <SelectContent>
              {templates.length === 0 ? (
                <SelectItem value="none" disabled>
                  No templates
                </SelectItem>
              ) : (
                templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <label className="ml-auto cursor-pointer rounded-lg border border-[#E2E8F0] px-2.5 py-1.5 text-[11px] font-medium text-[#475569] hover:bg-[#F1F5F9]">
            <Icon name="Paperclip" className="mr-1 size-3.5" />
            Attach
            <input type="file" className="hidden" onChange={() => toastPlaceholder()} />
          </label>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            placeholder="Type a message…"
            className="min-h-[60px] flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <Button
            className="h-auto px-4 text-white"
            style={{ backgroundColor: WHATSAPP_BRAND }}
            disabled={!composerText.trim() || sending}
            onClick={onSend}
          >
            <Icon name="Send" className="mr-1.5 size-4" />
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-[#94A3B8]">
          Press Cmd/Ctrl + Enter to send. AI replies are saved as drafts pending human approval.
        </p>
      </div>
    </div>
  );

  function toastPlaceholder() {
    // File upload is stubbed — the real flow uses /api/storage/upload + /api/whatsapp/document-upload
  }
}

function StudentContextPanel({
  student,
  loading,
}: {
  student: StudentSummary | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="mt-3 space-y-2">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-3/4 rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      </div>
    );
  }
  if (!student) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-4 text-center text-xs text-[#64748B]">
        No student context available for this conversation.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white">
      <div className="flex items-center gap-3 border-b border-[#E2E8F0] px-4 py-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-alo-gradient text-white">
          <span className="text-sm font-bold">
            {(student.fullName || "?").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#0F172A]">{student.fullName}</p>
          <p className="text-[11px] text-[#64748B]">{student.studentId}</p>
        </div>
      </div>
      <div className="p-4">
        <InfoRow label="Student ID" value={student.studentId} mono />
        <InfoRow label="Counselor" value={student.counselorName || "Unassigned"} />
        <InfoRow label="Stage" value={student.applicationStage?.replace(/_/g, " ") || "—"} />
        <InfoRow label="Destination" value={student.studyDestination || "—"} />
        <InfoRow label="Program" value={student.programTitle || "—"} />
        <InfoRow label="Study Level" value={student.studyLevel || "—"} />
        <InfoRow
          label="Profile"
          value={`${student.profileCompletion ?? 0}% complete`}
        />
        <InfoRow
          label="Passport"
          value={student.hasPassport ? "Yes" : "No"}
        />
        {student.missingDocuments && student.missingDocuments.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
              Missing Documents
            </p>
            <ul className="mt-1 space-y-0.5 text-[11px] text-amber-800">
              {student.missingDocuments.slice(0, 5).map((d, i) => (
                <li key={i} className="flex items-center gap-1">
                  <Icon name="FileWarning" className="size-3" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactMatchPanel({
  match,
  onResolve,
  openDialog,
  setOpenDialog,
}: {
  match: ContactMatchResponse;
  onResolve: (decision: "OPEN_EXISTING" | "MERGE_REQUEST" | "CREATE_NEW") => void;
  openDialog: boolean;
  setOpenDialog: (o: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-white">
          <Icon name="UserSearch" className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#0F172A]">New Contact</p>
          <p className="text-[11px] text-[#64748B]">Contact Match Review</p>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-xs text-[#475569]">
        <InfoRow label="Match Type" value={match.matchType === "NONE" ? "No match" : match.matchType} />
        <InfoRow label="Confidence" value={`${match.confidence}%`} />
        {match.possibleDuplicates.length > 0 && (
          <InfoRow
            label="Possible Duplicates"
            value={`${match.possibleDuplicates.length} found`}
          />
        )}
      </div>
      <div className="mt-3 space-y-1.5">
        <Button
          size="sm"
          className="h-8 w-full bg-[#0057B8] text-[11px] hover:bg-[#003a7a]"
          onClick={() => onResolve("OPEN_EXISTING")}
        >
          <Icon name="FolderOpen" className="mr-1.5 size-3" />
          Open Existing
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-full border-[#E2E8F0] text-[11px] text-[#475569]"
          onClick={() => onResolve("MERGE_REQUEST")}
        >
          <Icon name="GitMerge" className="mr-1.5 size-3" />
          Merge Request
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-full border-emerald-200 text-[11px] text-emerald-700 hover:bg-emerald-50"
          onClick={() => onResolve("CREATE_NEW")}
        >
          <Icon name="UserPlus" className="mr-1.5 size-3" />
          Create New Contact
        </Button>
      </div>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Match Review</DialogTitle>
            <DialogDescription>
              We couldn&apos;t auto-match this phone number to an existing student. Choose how to proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-[#475569]">
            <p>
              Confidence: <strong>{match.confidence}%</strong>
            </p>
            {match.possibleDuplicates.length > 0 && (
              <div>
                <p className="font-semibold text-[#0F172A]">Possible duplicates:</p>
                <ul className="mt-1 space-y-1">
                  {match.possibleDuplicates.map((d) => (
                    <li key={`${d.type}-${d.id}`} className="text-xs">
                      • {d.type}: {d.label} ({d.field || "phone"})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Decide later
            </Button>
            <Button
              className="bg-[#0057B8] text-white hover:bg-[#003a7a]"
              onClick={() => onResolve("CREATE_NEW")}
            >
              Create New Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Aliases for backward compatibility
export const WhatsAppCommandCenter = WhatsappCommandCenter;
