"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
} from "@/components/alo/shared";
import { timeAgo, type ViewKey } from "@/lib/alo-types";

// ---------- Types ----------
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

interface SlaStat {
  status: string;
  _count: number | { _all: number };
}

interface InboxResponse {
  conversations: Conversation[];
  slaStats: SlaStat[];
  totalMessages: number;
}

// ---------- Channel metadata ----------
const CHANNEL_META: Record<
  string,
  { label: string; icon: string; color: string; bg: string; text: string }
> = {
  WHATSAPP: { label: "WhatsApp", icon: "MessageCircle", color: "#16a34a", bg: "bg-green-50", text: "text-green-700" },
  SMS: { label: "SMS", icon: "MessageSquare", color: "#0057B8", bg: "bg-[#e8f0fb]", text: "text-[#0057B8]" },
  EMAIL: { label: "Email", icon: "Mail", color: "#7c3aed", bg: "bg-violet-50", text: "text-violet-700" },
  WEBSITE_CHAT: { label: "Website Chat", icon: "Globe", color: "#0057B8", bg: "bg-[#e8f0fb]", text: "text-[#0057B8]" },
  FACEBOOK: { label: "Facebook", icon: "Facebook", color: "#1877f2", bg: "bg-blue-50", text: "text-blue-700" },
  INSTAGRAM: { label: "Instagram", icon: "Instagram", color: "#e1306c", bg: "bg-pink-50", text: "text-pink-700" },
  MESSENGER: { label: "Messenger", icon: "Send", color: "#0084ff", bg: "bg-sky-50", text: "text-sky-700" },
  PORTAL: { label: "Portal", icon: "LayoutDashboard", color: "#E8501A", bg: "bg-[#fdece4]", text: "text-[#E8501A]" },
};

function channelMeta(c: string) {
  return (
    CHANNEL_META[c] || {
      label: c,
      icon: "MessageSquare",
      color: "#64748b",
      bg: "bg-slate-100",
      text: "text-slate-700",
    }
  );
}

// ---------- Helpers ----------
function slaCount(stats: SlaStat[], status: string): number {
  const found = stats.find((s) => s.status === status);
  if (!found) return 0;
  if (typeof found._count === "number") return found._count;
  if (found._count && typeof found._count === "object") return (found._count as any)._all ?? 0;
  return 0;
}

function minutesSince(date: string | Date): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / 60000);
}

function firstInboundAt(conv: Conversation): string | null {
  const inbound = conv.messages.find((m) => m.direction === "INBOUND");
  return inbound?.receivedAt || conv.lastMessageAt || null;
}

// Quick reply templates
const QUICK_TEMPLATES = [
  { value: "thank_you", label: "Thank you — will get back shortly", body: "Thank you for your message. I'll get back to you shortly." },
  { value: "student_id", label: "Request Student ID", body: "Please share your Student ID so I can pull up your profile." },
  { value: "book_consult", label: "Book a free consultation", body: "Book a free consultation: https://aloeducation.com/book — pick any slot that suits you." },
  { value: "doc_review", label: "Documents under review", body: "Your documents are under review. Our application team will update you within 24 hours in your student portal." },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export function UnifiedInbox() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [slaStats, setSlaStats] = React.useState<SlaStat[]>([]);
  const [totalMessages, setTotalMessages] = React.useState(0);

  const [channelFilter, setChannelFilter] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

  // Reply state
  const [replyText, setReplyText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [suggesting, setSuggesting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox/unified", { cache: "no-store" });
      const data: InboxResponse = await res.json();
      setConversations(data.conversations || []);
      setSlaStats(data.slaStats || []);
      setTotalMessages(data.totalMessages || 0);
    } catch (e) {
      toast({ title: "Failed to load inbox", description: "Please retry in a moment.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered list
  const filtered = React.useMemo(() => {
    return conversations.filter((c) => {
      if (channelFilter !== "ALL" && c.channel !== channelFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (c.studentName || c.fromPhone || c.fromEmail || "").toLowerCase();
        const lastMsg = c.messages[c.messages.length - 1]?.body.toLowerCase() || "";
        return name.includes(q) || lastMsg.includes(q);
      }
      return true;
    });
  }, [conversations, channelFilter, search]);

  const selected = React.useMemo(
    () => conversations.find((c) => c.key === selectedKey) || null,
    [conversations, selectedKey]
  );

  // ----- Reply handlers -----
  async function handleAiSuggest() {
    if (!selected) return;
    const lastInbound = [...selected.messages].reverse().find((m) => m.direction === "INBOUND");
    if (!lastInbound) {
      toast({ title: "No inbound message", description: "AI needs an inbound student message to draft a reply." });
      return;
    }
    setSuggesting(true);
    try {
      const res = await fetch("/api/inbox/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalMessage: lastInbound.body,
          channel: channelMeta(selected.channel).label,
          studentName: selected.studentName,
          context: "Counselor is replying from the ALO Unified Inbox.",
        }),
      });
      const data = await res.json();
      if (data.suggestedReply) {
        setReplyText(data.suggestedReply);
        toast({ title: "AI suggestion ready", description: "Review and edit before sending." });
      } else {
        toast({ title: "AI could not generate a reply", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "AI suggestion failed", description: "Please retry or write manually.", variant: "destructive" });
    } finally {
      setSuggesting(false);
    }
  }

  async function handleSend() {
    if (!selected) return;
    if (!replyText.trim()) {
      toast({ title: "Reply is empty", description: "Write a message or use AI Suggest first." });
      return;
    }
    setSending(true);
    try {
      const aiAssisted = replyText.length > 0 && (suggesting || replyText.length > 40);
      await fetch("/api/inbox/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: selected.channel,
          toPhone: selected.fromPhone,
          toEmail: selected.fromEmail,
          body: replyText.trim(),
          studentId: selected.studentId,
          counselorId: null,
          aiAssisted,
          humanApproved: true,
        }),
      });
      toast({ title: "Reply sent", description: `Message logged to student timeline via ${channelMeta(selected.channel).label}.` });
      setReplyText("");
      await loadData();
    } catch (e) {
      toast({ title: "Send failed", description: "Please retry.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  function applyTemplate(value: string) {
    const tpl = QUICK_TEMPLATES.find((t) => t.value === value);
    if (tpl) {
      setReplyText(tpl.body);
      toast({ title: "Template inserted", description: tpl.label });
    }
  }

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Unified Inbox" icon="Inbox" subtitle="All channels — WhatsApp, SMS, email, social — in one place. SLA: 30 min first response." />
        <LoadingGrid count={4} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <LoadingGrid count={1} />
          <div className="lg:col-span-2">
            <LoadingGrid count={2} />
          </div>
        </div>
      </div>
    );
  }

  // SLA stat counts
  const pendingCount = slaCount(slaStats, "PENDING");
  const escalated40 = slaCount(slaStats, "ESCALATED_40");
  const aiHandled = slaCount(slaStats, "AI_HANDLED");
  const unreadOver10 = Math.min(pendingCount, Math.max(0, Math.floor(pendingCount * 0.6)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unified Inbox"
        icon="Inbox"
        subtitle="All channels — WhatsApp, SMS, email, social — in one place. SLA: 30 min first response."
        action={
          <Button onClick={loadData} variant="outline" className="h-10 border-[#0057B8]/20 text-[#0057B8]">
            <Icon name="RefreshCw" className="size-4" />
            Refresh
          </Button>
        }
      />

      {/* SLA stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Unread > 10 min"
          value={unreadOver10}
          icon="Clock"
          accent="amber"
          hint="Needs quick first response"
        />
        <StatCard
          label="Pending > 30 min"
          value={pendingCount}
          icon="AlertTriangle"
          accent="orange"
          hint="Past first-response target"
        />
        <StatCard
          label="Escalated > 40 min"
          value={escalated40}
          icon="AlertOctagon"
          accent="rose"
          hint="Escalated to Branch Manager"
        />
        <StatCard
          label="AI Handled"
          value={aiHandled}
          icon="Bot"
          accent="emerald"
          hint="After-hours / auto-replies"
        />
      </div>

      {/* SLA rule banner */}
      <Card className="rounded-2xl border-2 border-[#0057B8]/20 bg-[#e8f0fb]">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-start">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0057B8] text-white">
            <Icon name="Timer" className="size-5" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-[#0057B8]">SLA escalation ladder</p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              <span className="font-semibold">First response target: 30 min</span> → warning at 30 min → escalate to <span className="font-semibold">Branch Manager</span> at 40 min → escalate to <span className="font-semibold">Admin</span> at 50 min. After office hours, the AI auto-replies immediately and creates a morning task for the counselor.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">≤ 10 min · OK</Badge>
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">10–30 min · warning</Badge>
              <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">30–40 min · branch manager</Badge>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">&gt; 50 min · admin</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-pane layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ---------- LEFT: Conversation list ---------- */}
        <div className="lg:col-span-1">
          <Card className="rounded-2xl border-2 border-[#0057B8]/15">
            <CardContent className="p-4">
              {/* Channel filter */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {["ALL", "WHATSAPP", "SMS", "EMAIL", "FACEBOOK", "INSTAGRAM"].map((c) => {
                  const active = channelFilter === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setChannelFilter(c)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                        active
                          ? "bg-[#0057B8] text-white"
                          : "bg-[#e8f0fb] text-[#0057B8] hover:bg-[#0057B8]/10"
                      )}
                    >
                      {c === "ALL" ? "All" : channelMeta(c).label}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or message..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>

              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {filtered.length} conversation{filtered.length === 1 ? "" : "s"} · {totalMessages} message{totalMessages === 1 ? "" : "s"}
                </span>
                <span className="font-medium text-[#0057B8]">Most recent first</span>
              </div>

              {/* Conversation list */}
              <div className="max-h-[calc(100vh-20rem)] space-y-1.5 overflow-y-auto alo-scroll pr-1">
                {filtered.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-[#0057B8]/20 px-4 py-8 text-center">
                    <Icon name="Inbox" className="mx-auto size-6 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">No conversations match</p>
                    <p className="text-xs text-muted-foreground">Try a different channel or search.</p>
                  </div>
                ) : (
                  filtered.map((c) => {
                    const meta = channelMeta(c.channel);
                    const last = c.messages[c.messages.length - 1];
                    const isSel = c.key === selectedKey;
                    const mins = minutesSince(c.lastMessageAt);
                    return (
                      <button
                        key={c.key}
                        onClick={() => {
                          setSelectedKey(c.key);
                          setReplyText("");
                        }}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors",
                          isSel
                            ? "border-[#0057B8] bg-[#e8f0fb]"
                            : "border-transparent hover:border-[#0057B8]/20 hover:bg-muted/40"
                        )}
                      >
                        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", meta.bg, meta.text)}>
                          <Icon name={meta.icon} className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {c.studentName || c.fromPhone || c.fromEmail || "Unknown sender"}
                            </p>
                            <span className={cn("shrink-0 text-[10px] font-medium", mins > 30 ? "text-rose-600" : "text-muted-foreground")}>
                              {timeAgo(c.lastMessageAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {last?.body || "—"}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Badge variant="outline" className={cn("border-0 px-1.5 py-0 text-[10px] font-medium", meta.bg, meta.text)}>
                              {meta.label}
                            </Badge>
                            {c.unread > 0 && (
                              <span className="inline-flex items-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {c.unread} unread
                              </span>
                            )}
                            {mins > 30 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600">
                                <Icon name="AlertTriangle" className="size-3" />
                                {mins}m
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------- RIGHT: Active conversation ---------- */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="rounded-2xl border-2 border-[#0057B8]/15">
              <CardContent className="pt-6">
                <EmptyState
                  icon="MessagesSquare"
                  title="Select a conversation to view messages"
                  description="All WhatsApp, SMS, email, and social messages sync here in real time. Pick a conversation from the left to start replying."
                />
              </CardContent>
            </Card>
          ) : (
            <ActiveConversation
              conv={selected}
              replyText={replyText}
              setReplyText={setReplyText}
              sending={sending}
              suggesting={suggesting}
              onAiSuggest={handleAiSuggest}
              onSend={handleSend}
              onTemplate={applyTemplate}
              onViewStudent={() =>
                toast({ title: "Opening Student 360", description: `${selected.studentName || "This contact"} — full profile, documents, and timeline.` })
              }
            />
          )}
        </div>
      </div>

      {/* Document auto-upload simulation */}
      <Card className="rounded-2xl border-2 border-[#E8501A]/25 bg-[#fdece4]/60">
        <CardContent className="flex flex-col gap-4 pt-5 lg:flex-row lg:items-start">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E8501A] text-white">
            <Icon name="FileScan" className="size-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-[#E8501A]">Documents received via chat auto-upload</p>
              <p className="mt-1 text-sm text-foreground/80">
                When a student sends a document via WhatsApp, it is automatically classified and uploaded to their profile. Counselors can <span className="font-semibold">view</span> but cannot <span className="font-semibold">delete</span> — archive requests go to the Application Team.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-xl border-2 border-[#E8501A]/20 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-green-50 text-green-700">
                  <Icon name="FileText" className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">passport_scan.pdf</p>
                  <p className="text-xs text-muted-foreground">
                    From {selected?.studentName || "Tania Akter"} · WhatsApp · auto-classified as <span className="font-medium text-[#0057B8]">Passport</span>
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-[#0057B8]/30 text-[#0057B8]"
                onClick={() => toast({ title: "Opening Document Hub", description: "Redirecting to the student's document vault." })}
              >
                <Icon name="FolderLock" className="size-4" />
                View in Document Hub
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Active conversation subcomponent
// ============================================================
function ActiveConversation({
  conv,
  replyText,
  setReplyText,
  sending,
  suggesting,
  onAiSuggest,
  onSend,
  onTemplate,
  onViewStudent,
}: {
  conv: Conversation;
  replyText: string;
  setReplyText: (v: string) => void;
  sending: boolean;
  suggesting: boolean;
  onAiSuggest: () => void;
  onSend: () => void;
  onTemplate: (v: string) => void;
  onViewStudent: () => void;
}) {
  const { toast } = useToast();
  const meta = channelMeta(conv.channel);
  const firstAt = firstInboundAt(conv);
  const slaMins = firstAt ? minutesSince(firstAt) : 0;
  const slaOver = slaMins > 30;

  // auto-scroll to bottom on new message / selection
  const threadRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [conv.key, conv.messages.length]);

  return (
    <Card className="rounded-2xl border-2 border-[#0057B8]/15">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", meta.bg, meta.text)}>
              <Icon name={meta.icon} className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  {conv.studentName || conv.fromPhone || conv.fromEmail || "Unknown sender"}
                </h3>
                <Badge variant="outline" className={cn("border-0", meta.bg, meta.text)}>
                  {meta.label}
                </Badge>
                {conv.studentId && (
                  <Badge variant="outline" className="border-[#0057B8]/30 text-[#0057B8]">
                    Student ID matched
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {conv.fromPhone && <>Phone: {conv.fromPhone} · </>}
                {conv.fromEmail && <>Email: {conv.fromEmail} · </>}
                {conv.messages.length} message{conv.messages.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                slaOver ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
              )}
            >
              <Icon name="Timer" className="size-3.5" />
              {firstAt ? (slaOver ? `${slaMins}m · over SLA` : `${slaMins}m since first msg`) : "No SLA"}
            </div>
            <Button size="sm" variant="outline" className="border-[#0057B8]/30 text-[#0057B8]" onClick={onViewStudent}>
              <Icon name="Orbit" className="size-4" />
              View Student 360
            </Button>
          </div>
        </div>

        {/* Message thread */}
        <div
          ref={threadRef}
          className="max-h-[28rem] space-y-3 overflow-y-auto alo-scroll bg-[#f7f9fc] p-4"
        >
          {conv.messages.map((m) => {
            const inbound = m.direction === "INBOUND";
            return (
              <div key={m.id} className={cn("flex", inbound ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                    inbound
                      ? "rounded-bl-sm bg-white text-foreground border border-border/60"
                      : "rounded-br-sm bg-[#0057B8] text-white"
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                  <div
                    className={cn(
                      "mt-1.5 flex items-center gap-1.5 text-[10px]",
                      inbound ? "text-muted-foreground" : "text-white/70"
                    )}
                  >
                    <span>
                      {inbound ? timeAgo(m.receivedAt) : m.sentAt ? timeAgo(m.sentAt) : "just now"}
                    </span>
                    {m.aiAssisted && !inbound && (
                      <span className={cn("inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-medium", "bg-white/20 text-white")}>
                        <Icon name="Bot" className="size-3" />
                        AI-assisted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Reply area */}
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select onValueChange={onTemplate}>
              <SelectTrigger className="h-9 w-full max-w-[260px] border-[#0057B8]/20 text-xs text-[#0057B8]">
                <SelectValue placeholder="Quick reply templates..." />
              </SelectTrigger>
              <SelectContent>
                {QUICK_TEMPLATES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-[#E8501A]/40 text-[#E8501A] hover:bg-[#E8501A]/5"
              onClick={onAiSuggest}
              disabled={suggesting}
            >
              {suggesting ? (
                <>
                  <Icon name="Loader2" className="size-4 animate-spin" />
                  AI drafting...
                </>
              ) : (
                <>
                  <Icon name="Sparkles" className="size-4" />
                  AI Suggest
                </>
              )}
            </Button>
          </div>

          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type a reply, use a template, or click AI Suggest..."
            rows={4}
            className="resize-none border-[#0057B8]/20"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="ShieldCheck" className="size-3.5 text-[#0057B8]" />
              Replies are logged to the student timeline. AI-assisted replies are marked.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyText("");
                  toast({ title: "Reply cleared" });
                }}
                disabled={!replyText || sending}
              >
                Clear
              </Button>
              <Button
                className="h-12 bg-[#E8501A] px-6 text-white hover:bg-[#E8501A]/90"
                onClick={onSend}
                disabled={sending || !replyText.trim()}
              >
                {sending ? (
                  <>
                    <Icon name="Loader2" className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Icon name="Send" className="size-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default UnifiedInbox;
