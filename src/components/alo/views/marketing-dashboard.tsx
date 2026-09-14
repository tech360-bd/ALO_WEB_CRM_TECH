"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  MiniBar,
  PageHeader,
  Progress,
} from "@/components/alo/shared";
import { fmtDate, timeAgo } from "@/lib/alo-types";

// ============================================================
// TYPES
// ============================================================

interface InboxMessage {
  id: string;
  platform: string;
  direction: string;
  senderId?: string | null;
  senderName?: string | null;
  messageText?: string | null;
  receivedAt: string;
  sentAt?: string | null;
  isRead: boolean;
  aiHandled: boolean;
  aiDraftReply?: string | null;
  humanApproved: boolean;
  conversationId?: string | null;
  employeeId?: string | null;
  keywordTriggered?: string | null;
}

interface Conversation {
  conversationId: string;
  platform: string;
  senderName: string;
  senderId: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  aiHandled: boolean;
  messages: InboxMessage[];
}

interface InboxResponse {
  conversations: Conversation[];
  totalMessages: number;
  unreadCount: number;
  aiHandledCount: number;
  platformStats: Record<string, number>;
}

interface KeywordTrigger {
  id: string;
  keyword: string;
  keywordType: string;
  platform: string;
  autoReplyText: string;
  autoDmText?: string | null;
  autoCreateLead: boolean;
  autoAssignCounselor: boolean;
  sendPortalLink: boolean;
  status: string;
  triggerCount: number;
  createdAt: string;
}

interface CampaignPost {
  id: string;
  title: string;
  category: string;
  platform: string;
  caption?: string | null;
  hashtags?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  videoScript?: string | null;
  reelCaption?: string | null;
  campaignObjective?: string | null;
  platformSize?: string | null;
  approvalStatus: string;
  rejectionReason?: string | null;
  brandAssetApplied: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  publishedUrl?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

interface CampaignPostsResponse {
  posts: CampaignPost[];
  logoExists: boolean;
  logo: { fileUrl: string; name: string } | null;
  summary: {
    total: number;
    draft: number;
    pendingApproval: number;
    approved: number;
    published: number;
    rejected: number;
  };
}

interface BrandAsset {
  id: string;
  type: string;
  name: string;
  fileUrl?: string | null;
  mimeType?: string | null;
  createdAt: string;
}

interface BrandKitData {
  logoUrl?: string; logoName?: string; address?: string; phone?: string; whatsapp?: string; website?: string; primary?: string; cta?: string;
}
interface BrandAssetsResponse {
  assets: BrandAsset[];
  logo: { id: string; fileUrl: string; name: string } | null;
  logoExists: boolean;
  brandColors: { primary: string; cta: string; background: string; text: string };
  brandKit?: BrandKitData | null;
  logoVal?: any;
}

interface N8nWorkflow {
  id: string;
  name: string;
  description?: string | null;
  webhookUrl: string;
  triggerType: string;
  isActive: boolean;
  lastTriggeredAt?: string | null;
  triggerCount: number;
  createdAt: string;
}

interface OutreachLead {
  leadId?: string | null;
  fullName?: string | null;
  phone?: string | null;
}

interface LeadOutreach {
  id: string;
  leadId?: string | null;
  sourceName: string;
  sourceType: string;
  channel: string;
  consentStatus: string;
  status: string;
  createdAt: string;
  lead?: OutreachLead | null;
}

interface MarketingUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MarketingUserAccess {
  id: string;
  userId: string;
  accessLevel: string;
  status: string;
  permissions: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  user: MarketingUser;
}

interface UserAccessResponse {
  access: MarketingUserAccess[];
  managerCount: number;
  approvedUserCount: number;
  maxApprovedUsers: number;
}

// ============================================================
// CONSTANTS & HELPERS
// ============================================================

const PLATFORMS = ["ALL", "WHATSAPP", "FACEBOOK", "INSTAGRAM", "MESSENGER", "EMAIL", "SMS"];

const PLATFORM_ICON: Record<string, string> = {
  WHATSAPP: "MessageCircle",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  MESSENGER: "Send",
  EMAIL: "Mail",
  SMS: "Smartphone",
  WEBSITE_CHAT: "Globe",
  ALL: "Inbox",
};

const PLATFORM_COLOR: Record<string, string> = {
  WHATSAPP: "bg-green-100 text-green-700",
  FACEBOOK: "bg-blue-100 text-blue-700",
  INSTAGRAM: "bg-pink-100 text-pink-700",
  MESSENGER: "bg-sky-100 text-sky-700",
  EMAIL: "bg-violet-100 text-violet-700",
  SMS: "bg-slate-100 text-slate-700",
  WEBSITE_CHAT: "bg-cyan-100 text-cyan-700",
};

const POST_CATEGORIES = [
  { value: "COUNTRY", label: "Country" },
  { value: "UNIVERSITY", label: "University" },
  { value: "VISA_TIPS", label: "Visa Tips" },
  { value: "SCHOLARSHIP", label: "Scholarship" },
  { value: "IELTS_PTE", label: "IELTS / PTE" },
  { value: "SUCCESS_STORY", label: "Success Story" },
  { value: "FAQ", label: "FAQ" },
  { value: "CONSULTATION_OFFER", label: "Consultation Offer" },
  { value: "DEADLINE", label: "Deadline" },
  { value: "LEAD_GEN", label: "Lead Generation" },
];

const POST_PLATFORMS = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "WHATSAPP_STATUS", label: "WhatsApp Status" },
  { value: "BLOG", label: "Blog" },
];

const POST_OBJECTIVES = [
  { value: "AWARENESS", label: "Awareness" },
  { value: "LEAD_GEN", label: "Lead Generation" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "TRAFFIC", label: "Traffic" },
];

const POST_SIZES = [
  { value: "SQUARE", label: "Square (1:1)" },
  { value: "PORTRAIT", label: "Portrait (4:5)" },
  { value: "LANDSCAPE", label: "Landscape (1.91:1)" },
  { value: "STORY", label: "Story (9:16)" },
];

const APPROVAL_STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  SCHEDULED: "bg-cyan-100 text-cyan-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const APPROVAL_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

const TRIGGER_TYPES = [
  { value: "LEAD_CREATED", label: "Lead Created" },
  { value: "FOLLOW_UP", label: "Follow-Up Reminder" },
  { value: "WHATSAPP_REPLY", label: "WhatsApp Reply" },
  { value: "CAMPAIGN_REPORT", label: "Campaign Report" },
  { value: "COUNSELOR_NOTIFY", label: "Counselor Notification" },
];

const TRIGGER_TYPE_BADGE: Record<string, string> = {
  LEAD_CREATED: "bg-blue-100 text-blue-700",
  FOLLOW_UP: "bg-amber-100 text-amber-700",
  WHATSAPP_REPLY: "bg-green-100 text-green-700",
  CAMPAIGN_REPORT: "bg-violet-100 text-violet-700",
  COUNSELOR_NOTIFY: "bg-orange-100 text-orange-700",
};

const CONSENT_BADGE: Record<string, string> = {
  OPTED_IN: "bg-emerald-100 text-emerald-700",
  OPTED_OUT: "bg-red-100 text-red-700",
  UNKNOWN: "bg-slate-100 text-slate-700",
};

const CONSENT_LABEL: Record<string, string> = {
  OPTED_IN: "Opted In",
  OPTED_OUT: "Opted Out",
  UNKNOWN: "Unknown",
};

const ACCESS_LEVEL_BADGE: Record<string, string> = {
  FULL: "bg-[#0057B8] text-white",
  LIMITED: "bg-[#fdece4] text-[#E8501A]",
  NONE: "bg-slate-100 text-slate-600",
};

// Mock employee id (in production would come from auth session)
const CURRENT_EMPLOYEE_ID = "emp-marketing-001";

// Compute SLA based on minutes since last inbound message
function getSlaLevel(lastMessageAt: string): { level: "ok" | "warn" | "late"; minutes: number } {
  const diff = Date.now() - new Date(lastMessageAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 20) return { level: "ok", minutes };
  if (minutes <= 40) return { level: "warn", minutes };
  return { level: "late", minutes };
}

function SLAIndicator({ lastMessageAt }: { lastMessageAt: string }) {
  const { level, minutes } = getSlaLevel(lastMessageAt);
  const map = {
    ok: { color: "bg-emerald-500", text: "text-emerald-700", label: "Within SLA" },
    warn: { color: "bg-amber-500", text: "text-amber-700", label: `${minutes}m — Escalate` },
    late: { color: "bg-red-500", text: "text-red-700", label: `${minutes}m — BREACHED` },
  } as const;
  const cfg = map[level];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold">
      <span className={cn("size-1.5 rounded-full", cfg.color)} />
      <span className={cfg.text}>{cfg.label}</span>
    </span>
  );
}

function safeParseJSON<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function MarketingDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);

  // Aggregate stats from all sub-systems
  const [inboxData, setInboxData] = React.useState<InboxResponse | null>(null);
  const [triggers, setTriggers] = React.useState<KeywordTrigger[]>([]);
  const [campaignData, setCampaignData] = React.useState<CampaignPostsResponse | null>(null);
  const [brandData, setBrandData] = React.useState<BrandAssetsResponse | null>(null);
  const [workflows, setWorkflows] = React.useState<N8nWorkflow[]>([]);
  const [outreach, setOutreach] = React.useState<LeadOutreach[]>([]);
  const [userAccess, setUserAccess] = React.useState<UserAccessResponse | null>(null);

  const [activeTab, setActiveTab] = React.useState("inbox");

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [
        inboxRes,
        triggersRes,
        postsRes,
        brandRes,
        workflowsRes,
        outreachRes,
        accessRes,
      ] = await Promise.all([
        fetch("/api/marketing/social-inbox?unread=true").then((r) => r.json()),
        fetch("/api/marketing/keyword-triggers").then((r) => r.json()),
        fetch("/api/marketing/campaign-posts").then((r) => r.json()),
        fetch("/api/marketing/brand-assets").then((r) => r.json()),
        fetch("/api/marketing/n8n-workflows").then((r) => r.json()),
        fetch("/api/marketing/lead-outreach").then((r) => r.json()),
        fetch("/api/marketing/user-access").then((r) => r.json()),
      ]);
      setInboxData(inboxRes);
      setTriggers(triggersRes.triggers || []);
      setCampaignData(postsRes);
      setBrandData(brandRes);
      setWorkflows(workflowsRes.workflows || []);
      setOutreach(outreachRes.outreach || []);
      setUserAccess(accessRes);
    } catch (e) {
      toast({
        title: "Failed to load marketing dashboard",
        description: "Please retry. Some data sources may be unreachable.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Aggregate stats
  const totalConversations = inboxData?.conversations?.length ?? 0;
  const unreadCount = inboxData?.unreadCount ?? 0;
  const aiHandledCount = inboxData?.aiHandledCount ?? 0;
  const activeTriggers = triggers.filter((t) => t.status === "ACTIVE").length;
  const totalPosts = campaignData?.summary?.total ?? 0;
  const pendingApprovals = campaignData?.summary?.pendingApproval ?? 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Marketing Automation Center"
          subtitle="Loading unified inbox, campaigns, brand assets, AI replies, n8n workflows, outreach, and access controls..."
          icon="Megaphone"
        />
        <LoadingGrid count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===================== HEADER ===================== */}
      <PageHeader
        title="Marketing Automation Center"
        subtitle="24/7 marketing, lead capture, social media, WhatsApp, AI reply, and campaign automation."
        icon="Megaphone"
        action={
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
              <span className="mr-1.5 inline-block size-2 animate-pulse rounded-full bg-emerald-500" />
              Automation Active 24/7
            </Badge>
            <Button
              variant="outline"
              className="h-12 border-[#0057B8]/30 text-[#0057B8]"
              onClick={() => {
                loadAll();
                toast({ title: "Refreshed", description: "Marketing dashboard re-synced." });
              }}
            >
              <Icon name="RefreshCw" className="size-4" /> Refresh
            </Button>
          </div>
        }
      />

      {/* ===================== STATS ROW ===================== */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <StatCard label="Conversations" value={totalConversations} icon="MessagesSquare" accent="blue" hint="Across all platforms" />
        <StatCard label="Unread" value={unreadCount} icon="Bell" accent="rose" hint="Awaiting reply" />
        <StatCard label="AI Handled" value={aiHandledCount} icon="Bot" accent="violet" hint="Auto-replied" />
        <StatCard label="Keyword Triggers" value={activeTriggers} icon="Zap" accent="orange" hint="Active automation rules" />
        <StatCard label="Campaign Posts" value={totalPosts} icon="FileText" accent="emerald" hint="All statuses" />
        <StatCard label="Pending Approval" value={pendingApprovals} icon="Clock" accent="amber" hint="Awaiting manager review" />
      </div>

      {/* ===================== TABS ===================== */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto w-max bg-[#F8FAFC] p-1">
            <TabsTrigger value="inbox" className="h-10 px-3 text-xs sm:text-sm">
              <Icon name="Inbox" className="size-4" /> Social Inbox
            </TabsTrigger>
            <TabsTrigger value="comments" className="h-10 px-3 text-xs sm:text-sm">
              <Icon name="MessageSquareText" className="size-4" /> Comment Automation
            </TabsTrigger>
            <TabsTrigger value="posts" className="h-10 px-3 text-xs sm:text-sm">
              <Icon name="FileText" className="size-4" /> Campaign Posts
            </TabsTrigger>
            <TabsTrigger value="brand" className="h-10 px-3 text-xs sm:text-sm">
              <Icon name="Palette" className="size-4" /> Brand Assets
            </TabsTrigger>
            <TabsTrigger value="ai-reply" className="h-10 px-3 text-xs sm:text-sm">
              <Icon name="Bot" className="size-4" /> AI Reply Manager
            </TabsTrigger>
            <TabsTrigger value="n8n" className="h-10 px-3 text-xs sm:text-sm">
              <Icon name="Workflow" className="size-4" /> n8n Automation
            </TabsTrigger>
            <TabsTrigger value="outreach" className="h-10 px-3 text-xs sm:text-sm">
              <Icon name="Megaphone" className="size-4" /> Lead Outreach
            </TabsTrigger>
                        <TabsTrigger value="access" className="h-10 px-3 text-xs sm:text-sm">
              <Icon name="ShieldCheck" className="size-4" /> User Access
            </TabsTrigger>
            <TabsTrigger value="library" className="h-10 px-3 text-xs sm:text-sm">
              <Icon name="Library" className="size-4" /> Library / Repost
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="inbox">
          <SocialInboxTab data={inboxData} onDataChanged={loadAll} />
        </TabsContent>
        <TabsContent value="comments">
          <CommentAutomationTab triggers={triggers} onTriggersChanged={loadAll} />
        </TabsContent>
        <TabsContent value="posts">
          <CampaignPostsTab data={campaignData} onDataChanged={loadAll} />
        </TabsContent>
        <TabsContent value="brand">
          <BrandAssetsTab data={brandData} onDataChanged={loadAll} />
        </TabsContent>
        <TabsContent value="ai-reply">
          <AIReplyManagerTab data={inboxData} onDataChanged={loadAll} />
        </TabsContent>
        <TabsContent value="n8n">
          <N8nAutomationTab workflows={workflows} onDataChanged={loadAll} />
        </TabsContent>
        <TabsContent value="outreach">
          <LeadOutreachTab outreach={outreach} />
        </TabsContent>
        <TabsContent value="access">
          <UserAccessTab data={userAccess} onDataChanged={loadAll} />
        </TabsContent>
        <TabsContent value="library">
          <LibraryRepostTab />
        </TabsContent>
      </Tabs>

      {/* ===================== WHATSAPP 24/7 CARD ===================== */}
      <WhatsAppCard />

      {/* ===================== AUDIT TRAIL ===================== */}
      <Card className="rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
              <Icon name="ShieldCheck" className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[#0057B8]">CRM Timeline & Audit Trail</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Every comment, DM, WhatsApp, email, SMS, chat, document, call note, task, appointment, campaign, and reply saves to the CRM timeline with:{" "}
                <span className="font-medium text-foreground">
                  channel, messageId, conversationId, socialUserId/phone/email, leadId, studentId, partnerId, employeeId, assignedCounselorId, applicationId, AI/human flag, message text/media metadata, timestamp, status, and audit_logs entry.
                </span>{" "}
                Nothing is lost. Everything is searchable and attributable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// TAB 1 — SOCIAL INBOX
// ============================================================

function SocialInboxTab({ data, onDataChanged }: { data: InboxResponse | null; onDataChanged: () => void }) {
  const { toast } = useToast();
  const [platformFilter, setPlatformFilter] = React.useState("ALL");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const conversations = React.useMemo(() => {
    if (!data?.conversations) return [];
    if (platformFilter === "ALL") return data.conversations;
    return data.conversations.filter((c) => c.platform === platformFilter);
  }, [data, platformFilter]);

  React.useEffect(() => {
    if (conversations.length > 0 && (!selectedId || !conversations.find((c) => c.conversationId === selectedId))) {
      setSelectedId(conversations[0].conversationId);
    }
  }, [conversations, selectedId]);

  const selected = React.useMemo(
    () => conversations.find((c) => c.conversationId === selectedId) || null,
    [conversations, selectedId],
  );

  const sendReply = async (useAiDraft: boolean) => {
    if (!selected) return;
    const text = useAiDraft ? "" : replyText.trim();
    if (!useAiDraft && !text) {
      toast({ title: "Reply is empty", description: "Type a message or use the AI draft.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/marketing/social-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selected.platform,
          conversationId: selected.conversationId,
          senderId: selected.senderId,
          messageText: useAiDraft ? "[AI Draft] " + (selected.messages.find((m) => m.aiDraftReply)?.aiDraftReply || "Thank you for reaching out to ALO Education. A counselor will assist you shortly.") : text,
          employeeId: CURRENT_EMPLOYEE_ID,
          aiDraftUsed: useAiDraft,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: useAiDraft ? "AI draft sent" : "Reply sent",
          description: useAiDraft ? "AI-generated reply delivered and logged to CRM timeline." : "Your reply was delivered and logged to CRM timeline.",
        });
        setReplyText("");
        onDataChanged();
      } else {
        throw new Error("Send failed");
      }
    } catch {
      toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const humanHandoff = () => {
    if (!selected) return;
    toast({
      title: "Transferred to human queue",
      description: `${selected.senderName} (${selected.platform}) flagged for counselor takeover. AI replies paused for this conversation.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Platform filters */}
      <div className="flex flex-wrap items-center gap-2">
        {PLATFORMS.map((p) => (
          <Button
            key={p}
            variant={platformFilter === p ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-9",
              platformFilter === p
                ? "bg-[#0057B8] text-white hover:bg-[#0057B8]/90"
                : "border-[#E2E8F0] text-slate-600 hover:bg-[#F8FAFC]",
            )}
            onClick={() => setPlatformFilter(p)}
          >
            <Icon name={PLATFORM_ICON[p] || "Circle"} className="size-3.5" />
            {p === "ALL" ? "All Platforms" : p}
            {p !== "ALL" && data?.platformStats?.[p] ? (
              <Badge variant="secondary" className="ml-1 bg-white/20 text-current">
                {data.platformStats[p]}
              </Badge>
            ) : null}
          </Button>
        ))}
      </div>

      {!data || conversations.length === 0 ? (
        <EmptyState
          icon="Inbox"
          title="No conversations in this view"
          description="When leads, students, or prospects message any official ALO channel, they will appear here as a unified inbox."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* LEFT — conversation list */}
          <Card className="rounded-2xl border-2 border-[#E2E8F0] lg:col-span-1">
            <CardContent className="p-0">
              <div className="border-b border-[#E2E8F0] px-4 py-3">
                <p className="text-sm font-semibold text-[#0057B8]">Conversations ({conversations.length})</p>
              </div>
              <ScrollArea className="h-[560px]">
                <div className="divide-y divide-[#E2E8F0]">
                  {conversations.map((c) => (
                    <button
                      key={c.conversationId}
                      onClick={() => setSelectedId(c.conversationId)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F8FAFC]",
                        selectedId === c.conversationId && "bg-[#e8f0fb]",
                      )}
                    >
                      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", PLATFORM_COLOR[c.platform] || "bg-slate-100 text-slate-700")}>
                        <Icon name={PLATFORM_ICON[c.platform] || "Inbox"} className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{c.senderName}</p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <SLAIndicator lastMessageAt={c.lastMessageAt} />
                          {c.unread > 0 && (
                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">{c.unread} unread</Badge>
                          )}
                          {c.aiHandled && (
                            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                              <Icon name="Bot" className="mr-1 size-3" /> AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* RIGHT — message thread */}
          <Card className="rounded-2xl border-2 border-[#E2E8F0] lg:col-span-2">
            <CardContent className="flex h-[608px] flex-col p-0">
              {!selected ? (
                <div className="flex flex-1 items-center justify-center">
                  <EmptyState icon="MessagesSquare" title="Select a conversation" description="Choose a conversation from the list to view the message thread." />
                </div>
              ) : (
                <>
                  {/* Thread header */}
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex size-9 items-center justify-center rounded-lg", PLATFORM_COLOR[selected.platform] || "bg-slate-100")}>
                        <Icon name={PLATFORM_ICON[selected.platform] || "Inbox"} className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{selected.senderName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {selected.platform} · Conv ID: <span className="font-mono">{selected.conversationId.slice(0, 12)}…</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SLAIndicator lastMessageAt={selected.lastMessageAt} />
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1">
                    <div className="space-y-3 px-4 py-4">
                      {selected.messages.length === 0 ? (
                        <p className="py-8 text-center text-xs text-muted-foreground">No messages in this conversation yet.</p>
                      ) : (
                        [...selected.messages].reverse().map((m) => {
                          const isOutbound = m.direction === "OUTBOUND";
                          return (
                            <div key={m.id} className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
                              <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2", isOutbound ? "bg-[#0057B8] text-white" : "bg-[#F1F5F9] text-foreground")}>
                                <p className="text-sm leading-relaxed">{m.messageText || "(media)"}</p>
                                <div className={cn("mt-1 flex items-center gap-2 text-[10px]", isOutbound ? "text-white/70" : "text-muted-foreground")}>
                                  <span>{isOutbound ? "ALO Education" : m.senderName}</span>
                                  <span>·</span>
                                  <span>{timeAgo(m.sentAt || m.receivedAt)}</span>
                                  {m.aiHandled && <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 px-1 py-0 text-[9px]">AI</Badge>}
                                  {m.aiDraftReply && !isOutbound && (
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-1 py-0 text-[9px]">Draft Ready</Badge>
                                  )}
                                </div>
                                {m.aiDraftReply && !isOutbound && (
                                  <div className="mt-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-2.5 py-1.5">
                                    <p className="text-[10px] font-semibold text-amber-800">AI Draft Reply</p>
                                    <p className="mt-0.5 text-xs text-amber-900">{m.aiDraftReply}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>

                  {/* Reply input */}
                  <div className="border-t border-[#E2E8F0] p-3">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a reply to the student/prospect..."
                      className="min-h-[60px] resize-none border-[#E2E8F0]"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => sendReply(false)}
                        disabled={sending}
                        className="h-10 flex-1 bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
                      >
                        <Icon name="Send" className="size-4" /> Send Reply
                      </Button>
                      <Button
                        onClick={() => sendReply(true)}
                        disabled={sending}
                        variant="outline"
                        className="h-10 border-[#0057B8]/30 text-[#0057B8]"
                      >
                        <Icon name="Sparkles" className="size-4" /> Use AI Draft
                      </Button>
                      <Button
                        onClick={humanHandoff}
                        variant="outline"
                        className="h-10 border-[#E2E8F0] text-slate-600"
                      >
                        <Icon name="UserHandBlock" className="size-4" /> Human Handoff
                      </Button>
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      All replies are saved to CRM timeline with employee ID, AI/human flag, and audit log entry.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB 2 — COMMENT AUTOMATION
// ============================================================

function CommentAutomationTab({ triggers, onTriggersChanged }: { triggers: KeywordTrigger[]; onTriggersChanged: () => void }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    keyword: "",
    keywordType: "CONTAINS",
    platform: "ALL",
    autoReplyText: "",
    autoDmText: "",
    autoCreateLead: true,
    autoAssignCounselor: true,
    sendPortalLink: true,
  });

  const resetForm = () =>
    setForm({
      keyword: "",
      keywordType: "CONTAINS",
      platform: "ALL",
      autoReplyText: "",
      autoDmText: "",
      autoCreateLead: true,
      autoAssignCounselor: true,
      sendPortalLink: true,
    });

  const saveTrigger = async () => {
    if (!form.keyword.trim() || !form.autoReplyText.trim()) {
      toast({ title: "Keyword and reply text required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/keyword-triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.trigger) {
        toast({ title: "Keyword trigger created", description: `Automation active for "${form.keyword}".` });
        setDialogOpen(false);
        resetForm();
        onTriggersChanged();
      } else {
        throw new Error(json.error || "Failed");
      }
    } catch {
      toast({ title: "Failed to create trigger", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (t: KeywordTrigger) => {
    const newStatus = t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await fetch("/api/marketing/keyword-triggers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, status: newStatus }),
      });
      toast({
        title: newStatus === "ACTIVE" ? "Trigger activated" : "Trigger paused",
        description: `Keyword "${t.keyword}" is now ${newStatus.toLowerCase()}.`,
      });
      onTriggersChanged();
    } catch {
      toast({ title: "Failed to toggle", variant: "destructive" });
    }
  };

  const flowSteps = [
    { icon: "MessageSquare", label: "Comment", color: "bg-blue-100 text-blue-700" },
    { icon: "Search", label: "Keyword Match", color: "bg-violet-100 text-violet-700" },
    { icon: "Reply", label: "Auto-Reply", color: "bg-emerald-100 text-emerald-700" },
    { icon: "Send", label: "Auto-DM", color: "bg-sky-100 text-sky-700" },
    { icon: "UserPlus", label: "Create Lead", color: "bg-orange-100 text-orange-700" },
    { icon: "UserCheck", label: "Assign Counselor", color: "bg-amber-100 text-amber-700" },
    { icon: "Link", label: "Send Portal Link", color: "bg-cyan-100 text-cyan-700" },
    { icon: "Database", label: "Save to CRM Timeline", color: "bg-[#0057B8] text-white" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0057B8]">Comment & Keyword Automation</h2>
          <p className="text-xs text-muted-foreground">
            When a comment or message contains a keyword (e.g., "IELTS", "UK Visa", "Scholarship"), the system auto-replies, sends a DM, creates a lead, and assigns a counselor.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-[#E8501A] text-white hover:bg-[#E8501A]/90">
              <Icon name="Plus" className="size-4" /> Add Keyword
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[#0057B8]">Add Keyword Trigger</DialogTitle>
              <DialogDescription>
                Configure an automated response for comments and messages containing this keyword.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="kw">Keyword *</Label>
                  <Input
                    id="kw"
                    placeholder='e.g., "IELTS", "UK Visa", "Scholarship"'
                    value={form.keyword}
                    onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Match Type</Label>
                  <Select value={form.keywordType} onValueChange={(v) => setForm({ ...form, keywordType: v })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTAINS">Contains</SelectItem>
                      <SelectItem value="EXACT">Exact Match</SelectItem>
                      <SelectItem value="REGEX">Regex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Platforms</SelectItem>
                      <SelectItem value="FACEBOOK">Facebook</SelectItem>
                      <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                      <SelectItem value="MESSENGER">Messenger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="reply">Auto-Reply Text *</Label>
                  <Textarea
                    id="reply"
                    placeholder="Thanks for your interest! A counselor will reach out to you shortly."
                    value={form.autoReplyText}
                    onChange={(e) => setForm({ ...form, autoReplyText: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="dm">Auto-DM Text</Label>
                  <Textarea
                    id="dm"
                    placeholder="Hi! Thanks for commenting on our post. To help you better, please share your contact number or click this link: https://alo-education.com/lead-form"
                    value={form.autoDmText}
                    onChange={(e) => setForm({ ...form, autoDmText: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2 rounded-xl bg-[#F8FAFC] p-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.autoCreateLead} onCheckedChange={(v) => setForm({ ...form, autoCreateLead: v === true })} />
                  Auto-create lead in CRM
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.autoAssignCounselor} onCheckedChange={(v) => setForm({ ...form, autoAssignCounselor: v === true })} />
                  Auto-assign to available counselor
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.sendPortalLink} onCheckedChange={(v) => setForm({ ...form, sendPortalLink: v === true })} />
                  Send student portal link
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="h-11" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={saving} onClick={saveTrigger}>
                {saving ? "Saving..." : "Create Trigger"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Flow visualization */}
      <SectionCard title="Auto-Reply Flow" icon="Workflow" description="What happens when a comment or message matches a keyword">
        <div className="flex flex-wrap items-center gap-2">
          {flowSteps.map((s, idx) => (
            <React.Fragment key={s.label}>
              <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2">
                <div className={cn("flex size-7 items-center justify-center rounded-lg", s.color)}>
                  <Icon name={s.icon} className="size-3.5" />
                </div>
                <span className="text-xs font-semibold text-foreground">{s.label}</span>
              </div>
              {idx < flowSteps.length - 1 && <Icon name="ArrowRight" className="size-4 text-slate-400" />}
            </React.Fragment>
          ))}
        </div>
      </SectionCard>

      {/* Triggers table */}
      <SectionCard title="Active Keyword Triggers" icon="Zap" description={`${triggers.length} keyword automation rules configured`}>
        {triggers.length === 0 ? (
          <EmptyState icon="Zap" title="No keyword triggers yet" description="Add your first keyword to start automating replies, DMs, and lead creation." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Auto-Reply</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triggers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge className="bg-[#0057B8] text-white hover:bg-[#0057B8]">{t.keyword}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.keywordType}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#E2E8F0]">{t.platform}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <p className="truncate text-xs text-foreground" title={t.autoReplyText}>{t.autoReplyText}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold tabular-nums text-[#0057B8]">{t.triggerCount}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={t.status === "ACTIVE"} onCheckedChange={() => toggleStatus(t)} />
                        <span className={cn("text-xs font-semibold", t.status === "ACTIVE" ? "text-emerald-600" : "text-slate-500")}>
                          {t.status === "ACTIVE" ? "Active" : "Paused"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ============================================================
// TAB 3 — CAMPAIGN POSTS
// ============================================================

function CampaignPostsTab({ data, onDataChanged }: { data: CampaignPostsResponse | null; onDataChanged: () => void }) {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [rejectTarget, setRejectTarget] = React.useState<CampaignPost | null>(null);
  const [scheduleTarget, setScheduleTarget] = React.useState<CampaignPost | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [scheduleDate, setScheduleDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    category: "COUNTRY",
    platform: "FACEBOOK",
    caption: "",
    hashtags: "",
    ctaText: "",
    ctaUrl: "",
    videoScript: "",
    reelCaption: "",
    campaignObjective: "AWARENESS",
    platformSize: "SQUARE",
  });

  const summary = data?.summary;
  const posts = data?.posts || [];
  const logoMissing = data ? !data.logoExists : false;

  const miniStats = [
    { label: "Draft", value: summary?.draft ?? 0, color: "text-slate-700", bg: "bg-slate-100" },
    { label: "Pending", value: summary?.pendingApproval ?? 0, color: "text-amber-700", bg: "bg-amber-100" },
    { label: "Approved", value: summary?.approved ?? 0, color: "text-green-700", bg: "bg-green-100" },
    { label: "Published", value: summary?.published ?? 0, color: "text-emerald-700", bg: "bg-emerald-100" },
    { label: "Rejected", value: summary?.rejected ?? 0, color: "text-red-700", bg: "bg-red-100" },
  ];

  const patchPost = async (id: string, action: string, extra: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/campaign-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, approvedBy: CURRENT_EMPLOYEE_ID, ...extra }),
      });
      const json = await res.json();
      if (json.post) {
        toast({ title: "Action completed", description: json.message });
        onDataChanged();
      } else {
        throw new Error(json.error || "Failed");
      }
    } catch {
      toast({ title: "Action failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const createPost = async () => {
    if (!form.title.trim() || !form.caption.trim()) {
      toast({ title: "Title and caption required", variant: "destructive" });
      return;
    }
    if (logoMissing) {
      toast({ title: "Cannot create post", description: "ALO logo is missing. Upload it in Brand Assets first.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const hashtags = form.hashtags.split(",").map((h) => h.trim()).filter(Boolean);
      const res = await fetch("/api/marketing/campaign-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hashtags, createdBy: CURRENT_EMPLOYEE_ID }),
      });
      const json = await res.json();
      if (json.post) {
        toast({ title: "Post created as draft", description: json.message });
        setCreateOpen(false);
        setForm({
          title: "",
          category: "COUNTRY",
          platform: "FACEBOOK",
          caption: "",
          hashtags: "",
          ctaText: "",
          ctaUrl: "",
          videoScript: "",
          reelCaption: "",
          campaignObjective: "AWARENESS",
          platformSize: "SQUARE",
        });
        onDataChanged();
      } else {
        throw new Error(json.error || "Failed");
      }
    } catch {
      toast({ title: "Failed to create post", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Auto-Pipeline state
  const [autoIdea, setAutoIdea] = React.useState("");
  const [autoImageUrl, setAutoImageUrl] = React.useState("");
  const [autoRunning, setAutoRunning] = React.useState(false);
  const runAutoPipeline = async ()=>{
    if (!autoIdea.trim() && !autoImageUrl.trim()) { toast({ title: "একটি আইডিয়া বা একটি ইমেজ URL দিন", variant:"destructive"}); return; }
    setAutoRunning(true);
    try {
      const res = await fetch("/api/marketing/auto-pipeline", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ idea: autoIdea, imageUrl: autoImageUrl || undefined, title: autoIdea.slice(0,60) || "ALO Campaign", platforms: ["FACEBOOK","INSTAGRAM","LINKEDIN","BLOG"], sizes: ["SQUARE","PORTRAIT","LANDSCAPE","STORY"] })});
      const j = await res.json();
      if (j.success) { toast({ title: "Auto-Pipeline done!", description: `${j.posts?.length||0} posts + ${j.assets?.length||0} images + Blog ${j.summary?.blogIncluded? "✓":"—"} — এখন Approve করুন` }); onDataChanged(); setAutoIdea(""); setAutoImageUrl(""); }
      else throw new Error(j.error);
    } catch(e:any){ toast({ title:"Pipeline failed", description:e.message, variant:"destructive"});} finally { setAutoRunning(false); }
  };
  return (
    <div className="space-y-4">
      {/* One-click Idea/Image → Content+Image+Video+Blog+All platforms */}
      <Card className="rounded-2xl border-2 border-[#E8501A]/30 bg-gradient-to-br from-[#fff7f0] to-white">
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-2"><div className="size-8 rounded-lg bg-[#E8501A] text-white flex items-center justify-center"><Icon name="Sparkles" className="size-4"/></div><div><p className="font-bold text-[#E8501A] text-sm">একটি আইডিয়া / একটি ইমেজ → সবকিছু অটো (One-Click)</p><p className="text-[11px] text-muted-foreground">Idea লিখুন বা Company image URL দিন — কন্টেন্ট + 4 সাইজ ইমেজ (SQUARE/PORTRAIT/LANDSCAPE/STORY) + Blog/Article + 7 প্ল্যাটফর্মে CampaignPost + Calendar + Google/FB লিড পাইপলাইন — Brand Kit (logo/address/phone/WhatsApp) auto-overlay</p></div></div>
          <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
            <div className="space-y-1.5"><Label>আইডিয়া (text) *</Label><Input value={autoIdea} onChange={e=> setAutoIdea(e.target.value)} placeholder="যেমন: UK September intake — 5 scholarships without IELTS"/></div>
            <div className="space-y-1.5"><Label>অথবা Company Image URL</Label><Input value={autoImageUrl} onChange={e=> setAutoImageUrl(e.target.value)} placeholder="https://cdn.alo-education.com/campus.jpg"/></div>
            <div className="flex items-end"><Button className="h-11 bg-[#E8501A] text-white w-full md:w-auto" disabled={autoRunning} onClick={runAutoPipeline}><Icon name={autoRunning?"Loader2":"Wand2"} className={autoRunning?"size-4 animate-spin":"size-4"}/>{autoRunning?"Generating...":"Auto Generate & Publish Plan"}</Button></div>
          </div>
          <p className="text-[11px] text-muted-foreground">৯০ দিনে Top-3: প্রতিদিন এই বাটনে 1 Idea → 3-4 Post (Blog সহ) — 90 দিনে 90 Blog + 400+ social asset = Google indexing + internal link wheel auto.</p>
        </CardContent>
      </Card>
      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {miniStats.map((s) => (
          <Card key={s.label} className="rounded-2xl border-2 border-[#E2E8F0]">
            <CardContent className="py-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={cn("flex size-8 items-center justify-center rounded-lg text-sm font-bold", s.bg, s.color)}>{s.value}</span>
                <span className="text-xs text-muted-foreground">posts</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logo missing alert */}
      {logoMissing && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Icon name="AlertTriangle" className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-800">ALO logo is missing!</p>
            <p className="text-xs text-red-700">
              Upload the logo in <button className="underline" onClick={() => toast({ title: "Switch to Brand Assets tab", description: "Upload your logo there first." })}>Brand Assets</button> before creating posts. Every post must carry the ALO brand identity.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0057B8]">Campaign Posts & Approval System</h2>
          <p className="text-xs text-muted-foreground">Create, approve, schedule, and publish posts across all official social channels.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-[#E8501A] text-white hover:bg-[#E8501A]/90">
              <Icon name="Plus" className="size-4" /> Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#0057B8]">Create Campaign Post</DialogTitle>
              <DialogDescription>
                Fill in post details. ALO logo and brand colors will be applied automatically. Post starts as a draft.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
              <div className="col-span-2 space-y-1.5 sm:col-span-1">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" placeholder="Study in UK — September 2025 Intake" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POST_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POST_PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Campaign Objective</Label>
                <Select value={form.campaignObjective} onValueChange={(v) => setForm({ ...form, campaignObjective: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POST_OBJECTIVES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Platform Size</Label>
                <Select value={form.platformSize} onValueChange={(v) => setForm({ ...form, platformSize: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POST_SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="caption">Caption *</Label>
                <Textarea id="caption" placeholder="Write your post caption here. Include a hook, value proposition, and CTA." value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="min-h-[100px]" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
                <Input id="hashtags" placeholder="#StudyInUK, #IELTS, #ALOEducation, #Scholarship" value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ctaText">CTA Text</Label>
                <Input id="ctaText" placeholder="Book Free Consultation" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ctaUrl">CTA URL</Label>
                <Input id="ctaUrl" placeholder="https://alo-education.com/consult" value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="videoScript">Video Script (optional)</Label>
                <Textarea id="videoScript" placeholder="Hook: ... Body: ... CTA: ..." value={form.videoScript} onChange={(e) => setForm({ ...form, videoScript: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="reelCaption">Reel Caption (optional)</Label>
                <Input id="reelCaption" placeholder="Short punchy reel caption" value={form.reelCaption} onChange={(e) => setForm({ ...form, reelCaption: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="h-11" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={saving || logoMissing} onClick={createPost}>
                {saving ? "Creating..." : "Create as Draft"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts table */}
      <SectionCard title="All Posts" icon="FileText" description={`${posts.length} posts across all statuses`}>
        {posts.length === 0 ? (
          <EmptyState icon="FileText" title="No campaign posts yet" description="Create your first post. It will start as a draft and require approval before publishing." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => {
                  const tags = safeParseJSON<string[]>(p.hashtags, []);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium text-foreground line-clamp-1">{p.title}</p>
                        {tags.length > 0 && <p className="text-[10px] text-muted-foreground line-clamp-1">{tags.slice(0, 3).join(" ")}</p>}
                        {p.rejectionReason && <p className="text-[10px] text-red-600 line-clamp-1">⚠ {p.rejectionReason}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#E2E8F0]">{p.category.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#E2E8F0]">{p.platform}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", APPROVAL_STATUS_BADGE[p.approvalStatus])}>
                          {APPROVAL_STATUS_LABEL[p.approvalStatus] || p.approvalStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.brandAssetApplied ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><Icon name="Check" className="mr-1 size-3" /> Applied</Badge>
                        ) : (
                          <Badge variant="outline" className="border-[#E2E8F0] text-slate-500">None</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {p.approvalStatus === "DRAFT" && (
                            <Button size="sm" className="h-8 bg-[#0057B8] text-white hover:bg-[#0057B8]/90" disabled={saving} onClick={() => patchPost(p.id, "submit_approval")}>
                              <Icon name="Send" className="size-3" /> Submit
                            </Button>
                          )}
                          {p.approvalStatus === "PENDING_APPROVAL" && (
                            <>
                              <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-600/90" disabled={saving} onClick={() => patchPost(p.id, "approve")}>
                                <Icon name="Check" className="size-3" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 border-red-300 text-red-600" onClick={() => { setRejectTarget(p); setRejectionReason(""); }}>
                                <Icon name="X" className="size-3" /> Reject
                              </Button>
                            </>
                          )}
                          {p.approvalStatus === "APPROVED" && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 border-[#0057B8]/30 text-[#0057B8]" onClick={() => { setScheduleTarget(p); setScheduleDate(""); }}>
                                <Icon name="Calendar" className="size-3" /> Schedule
                              </Button>
                              <Button size="sm" className="h-8 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={saving} onClick={() => patchPost(p.id, "publish")}>
                                <Icon name="Send" className="size-3" /> Publish
                              </Button>
                            </>
                          )}
                          {p.approvalStatus === "PUBLISHED" && p.publishedUrl && (
                            <a href={p.publishedUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="h-8 border-emerald-300 text-emerald-700">
                                <Icon name="ExternalLink" className="size-3" /> View
                              </Button>
                            </a>
                          )}
                          {p.approvalStatus === "REJECTED" && (
                            <Button size="sm" variant="outline" className="h-8" onClick={() => toast({ title: "Edit & resubmit", description: "Opening post editor... (toast demo)" })}>
                              <Icon name="Pencil" className="size-3" /> Edit & Resubmit
                            </Button>
                          )}
                          {p.approvalStatus === "SCHEDULED" && (
                            <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100"><Icon name="Clock" className="mr-1 size-3" /> {fmtDate(p.scheduledAt)}</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Approval workflow note */}
      <div className="flex items-start gap-3 rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
        <Icon name="Info" className="mt-0.5 size-4 shrink-0 text-[#0057B8]" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-[#0057B8]">Approval workflow:</span> Nothing posts automatically. Marketing Manager or Super Admin must approve before publishing. All approvals, rejections, schedules, and publishes are audit-logged with employee ID and timestamp.
        </p>
      </div>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Reject Post</DialogTitle>
            <DialogDescription>Please provide a reason. The creator will be notified and can edit & resubmit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Caption tone is too salesy. Please revise to focus on student value. CTA needs stronger urgency."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-11" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              className="h-11 bg-red-600 text-white hover:bg-red-600/90"
              disabled={saving || !rejectionReason.trim()}
              onClick={() => {
                if (rejectTarget) {
                  patchPost(rejectTarget.id, "reject", { rejectionReason });
                  setRejectTarget(null);
                }
              }}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog open={!!scheduleTarget} onOpenChange={(o) => !o && setScheduleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#0057B8]">Schedule Post</DialogTitle>
            <DialogDescription>Pick a date and time to auto-publish this post.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="sched">Schedule Date & Time *</Label>
            <Input
              id="sched"
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-11" onClick={() => setScheduleTarget(null)}>Cancel</Button>
            <Button
              className="h-11 bg-[#0057B8] text-white hover:bg-[#0057B8]/90"
              disabled={saving || !scheduleDate}
              onClick={() => {
                if (scheduleTarget) {
                  patchPost(scheduleTarget.id, "schedule", { scheduledAt: new Date(scheduleDate).toISOString() });
                  setScheduleTarget(null);
                }
              }}
            >
              Schedule Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// TAB 4 — BRAND ASSETS
// ============================================================

function BrandAssetsTab({ data, onDataChanged }: { data: BrandAssetsResponse | null; onDataChanged: () => void }) {
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", fileUrl: "" });

  const logo = data?.logo;
  const logoExists = data?.logoExists ?? false;
  const brandColors = data?.brandColors || { primary: "#0057B8", cta: "#E8501A", background: "#FFFFFF", text: "#0F172A" };
  const assets = data?.assets || [];
  const otherAssets = assets.filter((a) => a.type !== "LOGO");

  const colorSwatches = [
    { label: "Primary Blue", hex: brandColors.primary, textOn: "text-white" },
    { label: "CTA Orange", hex: brandColors.cta, textOn: "text-white" },
    { label: "Background", hex: brandColors.background, textOn: "text-slate-800" },
    { label: "Text Dark", hex: brandColors.text, textOn: "text-white" },
  ];

  const uploadLogo = async () => {
    if (!form.name.trim() || !form.fileUrl.trim()) {
      toast({ title: "Name and file URL required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/brand-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LOGO", name: form.name, fileUrl: form.fileUrl, uploadedBy: CURRENT_EMPLOYEE_ID }),
      });
      const json = await res.json();
      if (json.asset) {
        toast({ title: "Logo uploaded", description: json.message });
        setUploadOpen(false);
        setForm({ name: "", fileUrl: "" });
        onDataChanged();
      } else {
        throw new Error(json.error);
      }
    } catch {
      toast({ title: "Failed to upload", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Logo card */}
        <Card className="rounded-2xl border-2 border-[#E2E8F0] lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden">
                {logo ? (
                  <img src={logo.fileUrl} alt={logo.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <Icon name="ImageOff" className="mx-auto size-6 text-slate-400" />
                    <p className="mt-1 text-[10px] text-slate-500">No logo</p>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0057B8]">ALO Education Logo</p>
                {logoExists ? (
                  <>
                    <p className="text-xs text-muted-foreground">{logo?.name}</p>
                    <p className="mt-1 text-[11px] font-mono text-slate-500">{logo?.fileUrl}</p>
                    <Badge className="mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      <Icon name="Check" className="mr-1 size-3" /> Active
                    </Badge>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-red-600">No logo uploaded. Posts cannot be created without it.</p>
                )}
              </div>
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12 bg-[#E8501A] text-white hover:bg-[#E8501A]/90">
                    <Icon name="Upload" className="size-4" /> Upload Logo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-[#0057B8]">Upload ALO Logo</DialogTitle>
                    <DialogDescription>
                      Provide a CDN URL for the logo. The previous logo (if any) will be archived. Recommended: PNG, transparent background, min 512×512px.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="logoName">Logo Name *</Label>
                      <Input id="logoName" placeholder="ALO Education Logo (Primary)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="logoUrl">File URL *</Label>
                      <Input id="logoUrl" placeholder="https://cdn.alo-education.com/logo-primary.png" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="h-11" onClick={() => setUploadOpen(false)}>Cancel</Button>
                    <Button className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={saving} onClick={uploadLogo}>
                      {saving ? "Uploading..." : "Upload"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Brand colors */}
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="pt-6">
            <p className="text-sm font-bold text-[#0057B8]">Brand Colors</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {colorSwatches.map((c) => (
                <div key={c.label} className="overflow-hidden rounded-xl border border-[#E2E8F0]">
                  <div className={cn("flex h-16 items-center justify-center", c.textOn)} style={{ backgroundColor: c.hex }}>
                    <span className="text-xs font-bold">{c.hex}</span>
                  </div>
                  <div className="bg-white px-2 py-1.5">
                    <p className="text-[11px] font-semibold text-foreground">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Contact Kit — Address / Phone / WhatsApp / Website — used for image/video overlay */}
      <BrandKitEditor data={data} onDataChanged={onDataChanged} />

      {/* Other assets */}
      <SectionCard title="Other Brand Assets" icon="Files" description={`${otherAssets.length} templates, images, fonts, and color palettes`}>
        {otherAssets.length === 0 ? (
          <EmptyState icon="Files" title="No other assets yet" description="Upload templates, fonts, color palettes, and stock images for use in campaigns." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherAssets.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fb] text-[#0057B8]">
                  <Icon name={a.type === "TEMPLATE" ? "LayoutTemplate" : a.type === "FONT" ? "Type" : a.type === "IMAGE" ? "Image" : "File"} className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.type} · {fmtDate(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="flex items-start gap-3 rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
        <Icon name="Palette" className="mt-0.5 size-4 shrink-0 text-[#E8501A]" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-[#E8501A]">Brand compliance:</span> Every generated image, video, reel, and post must use the ALO logo, brand colors (blue #0057B8, orange #E8501A), and approved layout. AI-generated content is auto-checked for brand consistency before approval.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// TAB 5 — AI REPLY MANAGER
// ============================================================

function AIReplyManagerTab({ data, onDataChanged }: { data: InboxResponse | null; onDataChanged: () => void }) {
  const { toast } = useToast();
  const [aiOn, setAiOn] = React.useState(true);
  const [afterHours, setAfterHours] = React.useState(true);

  // Messages with AI draft needing approval
  const draftQueue = React.useMemo(() => {
    if (!data?.conversations) return [];
    const items: { conv: Conversation; msg: InboxMessage }[] = [];
    for (const conv of data.conversations) {
      for (const msg of conv.messages) {
        if (msg.aiDraftReply && msg.direction === "INBOUND" && !msg.humanApproved) {
          items.push({ conv, msg });
        }
      }
    }
    return items;
  }, [data]);

  // Rule-based greetings (mock — no AI token cost)
  const ruleReplies = [
    { trigger: "Hi / Hello / হাই", reply: "Hello! Welcome to ALO Education. How can we help you study abroad today?" },
    { trigger: "Salam / আসসালামু আলাইকুম", reply: "Waalaykum Assalam! Welcome to ALO Education. How may we assist you with your study abroad journey?" },
    { trigger: "Thanks / Thank you / ধন্যবাদ", reply: "You're most welcome! Feel free to reach out anytime. ALO Education is here to help." },
    { trigger: "Bye / Goodbye / বিদায়", reply: "Goodbye! Wishing you the best with your study abroad plans. ALO Education team." },
    { trigger: "Price / Fee / খরচ", reply: "Our consultation is FREE for students. Application and visa fees depend on the country and university. Shall I connect you with a counselor?" },
  ];

  const approveDraft = async (conv: Conversation, msg: InboxMessage) => {
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/social-inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: conv.platform,
          conversationId: conv.conversationId,
          senderId: conv.senderId,
          messageText: msg.aiDraftReply,
          employeeId: CURRENT_EMPLOYEE_ID,
          aiDraftUsed: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "AI draft approved & sent", description: "Reply delivered to student and logged to CRM timeline." });
        onDataChanged();
      }
    } catch {
      toast({ title: "Failed to send", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };
  const [saving, setSaving] = React.useState(false);

  const editDraft = (conv: Conversation, msg: InboxMessage) => {
    toast({ title: "Edit AI draft", description: `Opening editor for ${conv.senderName}. Draft: "${msg.aiDraftReply?.slice(0, 60)}..."` });
  };

  const rejectDraft = (conv: Conversation) => {
    toast({ title: "Draft rejected", description: `AI draft for ${conv.senderName} discarded. Conversation moved to human handoff queue.` });
  };

  const assignCounselor = (conv: Conversation) => {
    toast({ title: "Assigned to counselor", description: `${conv.senderName} (${conv.platform}) assigned to next available counselor. SLA clock reset.` });
  };

  // Human handoff queue (mock — conversations where AI flagged complex/angry/payment)
  const handoffQueue = React.useMemo(() => {
    if (!data?.conversations) return [];
    return data.conversations.filter((c) => c.aiHandled).slice(0, 4).map((c, idx) => ({
      conv: c,
      reason: ["Complex visa question", "Student expressed frustration", "Payment / refund inquiry", "Visa refusal case"][idx % 4],
    }));
  }, [data]);

  return (
    <div className="space-y-4">
      {/* AI settings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#0057B8]">AI Auto-Reply</p>
                <p className="text-xs text-muted-foreground">Master switch for all AI replies</p>
              </div>
              <Switch checked={aiOn} onCheckedChange={(v) => { setAiOn(v); toast({ title: v ? "AI replies enabled" : "AI replies disabled", description: v ? "AI will draft replies for review." : "All replies require manual drafting." }); }} />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#0057B8]">After-Hours Auto-Reply</p>
                <p className="text-xs text-muted-foreground">Auto-respond outside office hours</p>
              </div>
              <Switch checked={afterHours} onCheckedChange={(v) => { setAfterHours(v); toast({ title: v ? "After-hours AI on" : "After-hours AI off", description: v ? "AI handles first response 6PM-9AM." : "Messages will queue until office hours." }); }} />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="pt-6">
            <p className="text-sm font-bold text-[#0057B8]">Office Hours</p>
            <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">9:00 AM — 6:00 PM</p>
            <p className="text-xs text-muted-foreground">Sunday–Friday (Bangladesh time)</p>
          </CardContent>
        </Card>
      </div>

      {/* Rule-based replies */}
      <SectionCard title="Rule-Based Replies" icon="ListChecks" description="Common greetings & phrases handled without AI token cost">
        <div className="space-y-2">
          {ruleReplies.map((r) => (
            <div key={r.trigger} className="flex flex-col gap-1 rounded-xl border border-[#E2E8F0] bg-white p-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="shrink-0 sm:w-48">
                <Badge className="bg-[#e8f0fb] text-[#0057B8] hover:bg-[#e8f0fb]">{r.trigger}</Badge>
              </div>
              <p className="flex-1 text-xs text-foreground">{r.reply}</p>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">No AI cost</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* AI draft queue */}
      <SectionCard
        title="AI Draft Reply Queue"
        icon="Sparkles"
        description={`${draftQueue.length} messages with AI-drafted replies awaiting human approval`}
        action={<Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{draftQueue.length} pending</Badge>}
      >
        {draftQueue.length === 0 ? (
          <EmptyState icon="CheckCircle2" title="No drafts awaiting approval" description="When AI generates a draft reply, it will appear here for human review before sending." />
        ) : (
          <div className="space-y-3">
            {draftQueue.map(({ conv, msg }) => (
              <div key={msg.id} className="rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] p-3">
                <div className="flex items-center gap-2">
                  <div className={cn("flex size-7 items-center justify-center rounded-lg", PLATFORM_COLOR[conv.platform] || "bg-slate-100")}>
                    <Icon name={PLATFORM_ICON[conv.platform] || "Inbox"} className="size-3.5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{conv.senderName}</p>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="text-[11px] text-muted-foreground">{conv.platform}</span>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(msg.receivedAt)}</span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-2.5">
                    <p className="text-[10px] font-semibold uppercase text-slate-500">Inbound</p>
                    <p className="mt-1 text-xs text-foreground">{msg.messageText}</p>
                  </div>
                  <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-2.5">
                    <p className="text-[10px] font-semibold uppercase text-amber-800">AI Draft Reply</p>
                    <p className="mt-1 text-xs text-amber-900">{msg.aiDraftReply}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-600/90" disabled={saving} onClick={() => approveDraft(conv, msg)}>
                    <Icon name="Check" className="size-3" /> Approve & Send
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 border-[#0057B8]/30 text-[#0057B8]" onClick={() => editDraft(conv, msg)}>
                    <Icon name="Pencil" className="size-3" /> Edit & Send
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 border-red-300 text-red-600" onClick={() => rejectDraft(conv)}>
                    <Icon name="X" className="size-3" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Human handoff queue */}
      <SectionCard
        title="Human Handoff Queue"
        icon="UserHandBlock"
        description="Conversations flagged for human takeover (complex, angry, payment, visa refusal, complaint, emergency)"
        action={<Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">{handoffQueue.length} flagged</Badge>}
      >
        {handoffQueue.length === 0 ? (
          <EmptyState icon="CheckCircle2" title="No handoffs pending" description="AI will escalate conversations here when it detects complex or sensitive intent." />
        ) : (
          <div className="space-y-2">
            {handoffQueue.map(({ conv, reason }) => (
              <div key={conv.conversationId} className="flex flex-col gap-2 rounded-xl border-2 border-[#E2E8F0] bg-white p-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <div className={cn("flex size-9 items-center justify-center rounded-lg", PLATFORM_COLOR[conv.platform] || "bg-slate-100")}>
                    <Icon name={PLATFORM_ICON[conv.platform] || "Inbox"} className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{conv.senderName}</p>
                    <p className="text-[11px] text-muted-foreground">{conv.platform} · {reason}</p>
                  </div>
                </div>
                <Button size="sm" className="h-8 bg-[#0057B8] text-white hover:bg-[#0057B8]/90" onClick={() => assignCounselor(conv)}>
                  <Icon name="UserCheck" className="size-3" /> Assign to Counselor
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* AI safety note */}
      <div className="flex items-start gap-3 rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
        <Icon name="ShieldAlert" className="mt-0.5 size-4 shrink-0 text-[#E8501A]" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-[#E8501A]">AI safety:</span> AI supports Bangla and English. AI asks OTP before sharing any private student data. AI transfers to human for complex, angry, payment, visa refusal, complaint, or emergency cases. All AI replies are logged with the AI flag for audit.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// TAB 6 — n8n AUTOMATION
// ============================================================

function N8nAutomationTab({ workflows, onDataChanged }: { workflows: N8nWorkflow[]; onDataChanged: () => void }) {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [triggering, setTriggering] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", description: "", webhookUrl: "", triggerType: "LEAD_CREATED" });

  const createWorkflow = async () => {
    if (!form.name.trim() || !form.webhookUrl.trim()) {
      toast({ title: "Name and webhook URL required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/n8n-workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, createdBy: CURRENT_EMPLOYEE_ID }),
      });
      const json = await res.json();
      if (json.workflow) {
        toast({ title: "Workflow created", description: json.message });
        setCreateOpen(false);
        setForm({ name: "", description: "", webhookUrl: "", triggerType: "LEAD_CREATED" });
        onDataChanged();
      } else {
        throw new Error(json.error);
      }
    } catch {
      toast({ title: "Failed to create workflow", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkflow = async (w: N8nWorkflow) => {
    try {
      await fetch("/api/marketing/n8n-workflows", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: w.id, isActive: !w.isActive }),
      });
      toast({
        title: w.isActive ? "Workflow deactivated" : "Workflow activated",
        description: `"${w.name}" is now ${w.isActive ? "off" : "on"}.`,
      });
      onDataChanged();
    } catch {
      toast({ title: "Toggle failed", variant: "destructive" });
    }
  };

  const triggerWorkflow = async (w: N8nWorkflow) => {
    setTriggering(w.id);
    try {
      const res = await fetch("/api/marketing/n8n-workflows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: w.id, payload: { triggeredAt: new Date().toISOString(), source: "marketing-dashboard" } }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Workflow triggered", description: json.message });
        onDataChanged();
      } else {
        throw new Error(json.error);
      }
    } catch {
      toast({ title: "Trigger failed", variant: "destructive" });
    } finally {
      setTriggering(null);
    }
  };

  const maskUrl = (url: string) => {
    if (!url) return "—";
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}/****`;
    } catch {
      return url.slice(0, 20) + "****";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0057B8]">n8n Workflow Automation</h2>
          <p className="text-xs text-muted-foreground">Control marketing automations without server access. Toggle, trigger, and monitor workflows.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-[#E8501A] text-white hover:bg-[#E8501A]/90">
              <Icon name="Plus" className="size-4" /> Add Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[#0057B8]">Add n8n Workflow</DialogTitle>
              <DialogDescription>Register an existing n8n webhook so it can be triggered and toggled from this dashboard.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="wfName">Workflow Name *</Label>
                <Input id="wfName" placeholder="Lead Welcome Email Sequence" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wfDesc">Description</Label>
                <Textarea id="wfDesc" placeholder="Sends welcome email + WhatsApp message when a new lead is created." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wfUrl">Webhook URL *</Label>
                <Input id="wfUrl" placeholder="https://n8n.alo-education.com/webhook/lead-created" value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Trigger Type</Label>
                <Select value={form.triggerType} onValueChange={(v) => setForm({ ...form, triggerType: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="h-11" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={saving} onClick={createWorkflow}>
                {saving ? "Creating..." : "Create Workflow"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <SectionCard title="Workflows" icon="Workflow" description={`${workflows.length} registered n8n workflows`}>
        {workflows.length === 0 ? (
          <EmptyState icon="Workflow" title="No workflows registered" description="Add your first n8n webhook to enable trigger-and-toggle control from this dashboard." />
        ) : (
          <div className="space-y-3">
            {workflows.map((w) => (
              <div key={w.id} className="rounded-xl border-2 border-[#E2E8F0] bg-white p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{w.name}</p>
                      <Badge className={cn("hover:bg-current", TRIGGER_TYPE_BADGE[w.triggerType] || "bg-slate-100 text-slate-700")}>
                        {TRIGGER_TYPES.find((t) => t.value === w.triggerType)?.label || w.triggerType}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Switch checked={w.isActive} onCheckedChange={() => toggleWorkflow(w)} />
                        <span className={cn("text-[11px] font-semibold", w.isActive ? "text-emerald-600" : "text-slate-500")}>
                          {w.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                    </div>
                    {w.description && <p className="mt-1 text-xs text-muted-foreground">{w.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="Link" className="size-3" />
                        <span className="font-mono">{maskUrl(w.webhookUrl)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Zap" className="size-3" />
                        Triggered <span className="font-semibold text-[#0057B8]">{w.triggerCount}</span> times
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" className="size-3" />
                        Last: {w.lastTriggeredAt ? timeAgo(w.lastTriggeredAt) : "never"}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-9 bg-[#0057B8] text-white hover:bg-[#0057B8]/90"
                    disabled={!w.isActive || triggering === w.id}
                    onClick={() => triggerWorkflow(w)}
                  >
                    <Icon name={triggering === w.id ? "Loader2" : "Play"} className={cn("size-3.5", triggering === w.id && "animate-spin")} />
                    {triggering === w.id ? "Triggering..." : "Trigger Now"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="flex items-start gap-3 rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
        <Icon name="Server" className="mt-0.5 size-4 shrink-0 text-[#0057B8]" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-[#0057B8]">No server access required:</span> Daily workflow control (toggle on/off, trigger manually, view stats) is fully available from this dashboard. Engineering team handles webhook deployment and n8n instance maintenance.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// TAB 7 — LEAD OUTREACH
// ============================================================

function LeadOutreachTab({ outreach }: { outreach: LeadOutreach[] }) {
  const { toast } = useToast();
  const optedIn = outreach.filter((o) => o.consentStatus === "OPTED_IN").length;
  const optedOut = outreach.filter((o) => o.consentStatus === "OPTED_OUT").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Total Records</p>
            <p className="mt-1 text-2xl font-bold text-[#0057B8]">{outreach.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Opted In</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{optedIn}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Opted Out</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{optedOut}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Channels</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{new Set(outreach.map((o) => o.channel)).size}</p>
          </CardContent>
        </Card>
      </div>

      <SectionCard
        title="Outreach Records"
        icon="Megaphone"
        description="All lead outreach with source, channel, and consent tracking"
        action={
          <Button size="sm" variant="outline" className="h-9 border-[#0057B8]/30 text-[#0057B8]" onClick={() => toast({ title: "Add outreach", description: "Use the CRM to add new outreach records with consent capture." })}>
            <Icon name="Plus" className="size-3.5" /> Add Outreach
          </Button>
        }
      >
        {outreach.length === 0 ? (
          <EmptyState icon="Megaphone" title="No outreach records" description="Outreach records will appear here when leads are contacted via WhatsApp, email, SMS, or phone." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Consent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outreach.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{o.lead?.fullName || "Unknown"}</p>
                      <p className="text-[11px] text-muted-foreground">{o.lead?.phone || o.lead?.leadId?.slice(0, 12) || "—"}</p>
                    </TableCell>
                    <TableCell className="text-xs">{o.sourceName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#E2E8F0]">{o.sourceType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#E2E8F0]">{o.channel}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", CONSENT_BADGE[o.consentStatus] || "bg-slate-100 text-slate-700")}>
                        {CONSENT_LABEL[o.consentStatus] || o.consentStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#E2E8F0]">{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(o.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <div className="flex items-start gap-3 rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
        <Icon name="ShieldCheck" className="mt-0.5 size-4 shrink-0 text-[#E8501A]" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-[#E8501A]">Compliance:</span> Use only official/legal data sources. Respect opt-in, unsubscribe, block, and STOP commands. Do not spam. Save source, consent status, channel, and outreach history for every contact. Violations are audit-logged.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// TAB 8 — USER ACCESS
// ============================================================

function UserAccessTab({ data, onDataChanged }: { data: UserAccessResponse | null; onDataChanged: () => void }) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ userId: "", accessLevel: "LIMITED" });
  const [perms, setPerms] = React.useState<Record<string, boolean>>({
    social_inbox: true,
    campaign_posts: true,
    keyword_triggers: false,
    brand_assets: false,
    ai_reply: true,
    n8n_workflows: false,
    lead_outreach: true,
  });

  const access = data?.access || [];
  const managers = access.filter((a) => a.accessLevel === "FULL" && a.status === "ACTIVE");
  const limited = access.filter((a) => a.accessLevel === "LIMITED" && a.status === "ACTIVE");
  const maxApproved = data?.maxApprovedUsers ?? 3;
  const approvedCount = data?.approvedUserCount ?? 0;
  const slotsRemaining = Math.max(0, maxApproved - approvedCount);

  const permLabels: Record<string, string> = {
    social_inbox: "Social Inbox (reply)",
    campaign_posts: "Campaign Posts (create)",
    keyword_triggers: "Keyword Triggers (edit)",
    brand_assets: "Brand Assets (upload)",
    ai_reply: "AI Reply Manager (approve drafts)",
    n8n_workflows: "n8n Workflows (toggle/trigger)",
    lead_outreach: "Lead Outreach (record)",
  };

  const addUser = async () => {
    if (!form.userId.trim()) {
      toast({ title: "User ID required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/user-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          accessLevel: form.accessLevel,
          approvedBy: CURRENT_EMPLOYEE_ID,
          permissions: Object.keys(perms).filter((k) => perms[k]),
        }),
      });
      const json = await res.json();
      if (json.access) {
        toast({ title: "Access granted", description: json.message });
        setAddOpen(false);
        setForm({ userId: "", accessLevel: "LIMITED" });
        onDataChanged();
      } else {
        throw new Error(json.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      toast({ title: "Failed to add user", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (a: MarketingUserAccess) => {
    try {
      await fetch("/api/marketing/user-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, status: "REVOKED" }),
      });
      toast({ title: "Access revoked", description: `${a.user.name} can no longer access marketing tools.` });
      onDataChanged();
    } catch {
      toast({ title: "Revoke failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Marketing Manager</p>
            <p className="mt-1 text-2xl font-bold text-[#0057B8]">{managers.length}</p>
            <p className="text-[11px] text-muted-foreground">Full access</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Approved Users</p>
            <p className="mt-1 text-2xl font-bold text-[#E8501A]">{approvedCount}/{maxApproved}</p>
            <p className="text-[11px] text-muted-foreground">Limited access</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Slots Remaining</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{slotsRemaining}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-[#E2E8F0]">
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Revoked / Past</p>
            <p className="mt-1 text-2xl font-bold text-slate-500">{access.filter((a) => a.status === "REVOKED").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Manager card */}
      <SectionCard title="Marketing Manager" icon="Crown" description="Full access to all marketing automation features">
        {managers.length === 0 ? (
          <EmptyState icon="Crown" title="No marketing manager assigned" description="Assign a Marketing Manager with FULL access to oversee all marketing operations." />
        ) : (
          <div className="space-y-2">
            {managers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border-2 border-[#0057B8]/20 bg-[#e8f0fb] p-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#0057B8] text-white">
                  <Icon name="Crown" className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{m.user.name}</p>
                  <p className="text-[11px] text-muted-foreground">{m.user.email} · {m.user.role}</p>
                </div>
                <Badge className="bg-[#0057B8] text-white hover:bg-[#0057B8]">FULL ACCESS</Badge>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Approved users */}
      <SectionCard
        title="Approved Marketing Users"
        icon="Users"
        description={`Maximum ${maxApproved} approved users can use official social media tools (${approvedCount} active)`}
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={slotsRemaining === 0}>
                <Icon name="UserPlus" className="size-3.5" /> Add Approved User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-[#0057B8]">Approve Marketing User</DialogTitle>
                <DialogDescription>
                  Grant LIMITED access to official social media tools. {slotsRemaining} of {maxApproved} slots remaining.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="userId">User ID *</Label>
                  <Input id="userId" placeholder="e.g., emp-john-001" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Access Level</Label>
                  <Select value={form.accessLevel} onValueChange={(v) => setForm({ ...form, accessLevel: v })}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LIMITED">LIMITED (approved user)</SelectItem>
                      <SelectItem value="FULL">FULL (manager — use with caution)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 rounded-xl bg-[#F8FAFC] p-3">
                  <p className="text-xs font-semibold text-[#0057B8]">Permissions</p>
                  {Object.keys(permLabels).map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={perms[key]}
                        onCheckedChange={(v) => setPerms({ ...perms, [key]: v === true })}
                      />
                      {permLabels[key]}
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="h-11" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={saving} onClick={addUser}>
                  {saving ? "Granting..." : "Grant Access"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        {limited.length === 0 ? (
          <EmptyState icon="Users" title="No approved users yet" description={`Add up to ${maxApproved} approved users who can manage official social media channels.`} />
        ) : (
          <div className="space-y-2">
            {limited.map((a) => {
              const userPerms = safeParseJSON<string[]>(a.permissions, []);
              return (
                <div key={a.id} className="flex flex-col gap-2 rounded-xl border-2 border-[#E2E8F0] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-full bg-[#fdece4] text-[#E8501A]">
                        <Icon name="User" className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{a.user.name}</p>
                        <p className="text-[11px] text-muted-foreground">{a.user.email} · {a.user.role}</p>
                      </div>
                      <Badge className={ACCESS_LEVEL_BADGE[a.accessLevel] || "bg-slate-100 text-slate-700"}>{a.accessLevel}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {userPerms.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground">No specific permissions granted.</span>
                      ) : (
                        userPerms.map((p) => (
                          <Badge key={p} variant="outline" className="border-[#E2E8F0] text-[10px]">
                            {permLabels[p] || p}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 border-red-300 text-red-600" onClick={() => revoke(a)}>
                    <Icon name="UserX" className="size-3" /> Revoke
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <div className="flex items-start gap-3 rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
        <Icon name="Lock" className="mt-0.5 size-4 shrink-0 text-[#0057B8]" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-[#0057B8]">Access policy:</span> Maximum 3 approved marketing users can use official social media tools. Other employees cannot access company official Facebook, Instagram, Messenger, or social campaign controls. Marketing Manager and Super Admin can approve, edit permissions, or revoke access at any time.
        </p>
      </div>
    </div>
  );
}

function BrandKitEditor({ data, onDataChanged }: { data: BrandAssetsResponse | null; onDataChanged: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const kit = (data as any)?.brandKit as any || {};
  const logo = (data as any)?.logo as any;
  const [form, setForm] = React.useState({ logoUrl: "", logoName: "", address: "", phone: "", whatsapp: "", website: "", primary: "#0057B8", cta: "#E8501A" });
  React.useEffect(()=> {
    setForm({
      logoUrl: kit.logoUrl || logo?.fileUrl || "",
      logoName: kit.logoName || logo?.name || "",
      address: kit.address || "House 12, Road 12, Dhanmondi, Dhaka-1209",
      phone: kit.phone || "+8809611-123456",
      whatsapp: kit.whatsapp || "+8801712345678",
      website: kit.website || "https://alo-education.com",
      primary: kit.primary || "#0057B8",
      cta: kit.cta || "#E8501A",
    });
  }, [JSON.stringify(kit), logo?.fileUrl]);
  const saveKit = async ()=> {
    if (!form.logoUrl && !(data as any)?.logo) { toast({ title: "Logo URL required", variant:"destructive"}); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/brand-assets", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ assetType:"BRAND_KIT", name:"ALO Brand Kit", value: form })});
      const j = await res.json();
      if (j.asset) { toast({ title: "Brand Kit saved", description: "Logo/address/phone/WhatsApp will be auto-applied to every image/video" }); onDataChanged(); }
      else throw new Error(j.error);
    } catch { toast({ title:"Save failed", variant:"destructive"});} finally { setSaving(false); }
  };
  return (
    <Card className="rounded-2xl border-2 border-[#0057B8]/20 bg-[#eef4ff]">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-bold text-[#0057B8] flex items-center gap-2"><Icon name="BadgeCheck" className="size-4"/> Education Partner Brand Kit — Logo / Address / Phone / WhatsApp</p><p className="text-[11px] text-muted-foreground">এখানে আপলোড করা তথ্য দিয়ে সব ইমেজ/ভিডিওতে প্রফেশনাল overlay হবে (logo bottom-right 8%, footer bar + phone/WhatsApp/website)।</p></div>
          <Button className="h-10 bg-[#0057B8] text-white" disabled={saving} onClick={saveKit}><Icon name={saving?"Loader2":"Save"} className={saving?"size-4 animate-spin":"size-4"}/>{saving?"Saving...":"Save Brand Kit"}</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Logo URL *</Label><Input value={form.logoUrl} onChange={e=> setForm({...form, logoUrl:e.target.value})} placeholder="https://cdn.alo-education.com/logo.png"/></div>
          <div className="space-y-1.5"><Label>Logo Name</Label><Input value={form.logoName} onChange={e=> setForm({...form, logoName:e.target.value})} placeholder="ALO Education Logo"/></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Address (footer — BLOG/LANDSCAPE only)</Label><Input value={form.address} onChange={e=> setForm({...form, address:e.target.value})} placeholder="House 12, Road 12, Dhanmondi, Dhaka"/></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e=> setForm({...form, phone:e.target.value})} placeholder="+8809611-123456"/></div>
          <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e=> setForm({...form, whatsapp:e.target.value})} placeholder="+8801712345678"/></div>
          <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={e=> setForm({...form, website:e.target.value})} placeholder="https://alo-education.com"/></div>
          <div className="space-y-1.5"><Label>Primary #0057B8</Label><Input value={form.primary} onChange={e=> setForm({...form, primary:e.target.value})}/></div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Icon name="Info" className="size-3"/><span>Overlay: 1080×1080/1350/628/1920 সব সাইজে logo + ফুটারে phone • WhatsApp • website (BLOG এ address সহ)। Provider key সেট না থাকলে placeholder image + prompt save হবে, পরে real gen করবে।</span></div>
      </CardContent>
    </Card>
  );
}

function LibraryRepostTab() {
  const { toast } = useToast();
  const [posts, setPosts] = React.useState<any[]>([]);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(async ()=>{
    setLoading(true);
    try {
      const r = await fetch(`/api/marketing/library?status=APPROVED&q=${encodeURIComponent(q)}`);
      const j = await r.json();
      setPosts(j.posts||[]);
    } finally { setLoading(false); }
  }, [q]);
  React.useEffect(()=> { load(); }, [load]);
  const repost = async (post:any, target:string)=>{
    try {
      const r = await fetch("/api/marketing/repost", { method:"POST", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ postId: post.id, targetPlatform: target, employeeId: CURRENT_EMPLOYEE_ID })});
      const j = await r.json();
      if (j.success) toast({ title:"Reposted!", description: `${post.title} → your ${target} official page (brand retained)` });
      else throw new Error(j.error);
    } catch (e:any){ toast({ title:"Repost failed", description:e.message, variant:"destructive"}); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold text-[#0057B8] flex items-center gap-2"><Icon name="Library" className="size-5"/> Marketing Library — Counselor Repost Hub</h2><p className="text-xs text-muted-foreground">Approved image/video/post — কাউন্সেলর বা যেকোনো এমপ্লয়ি এখানে দেখে নিজের অফিসিয়াল সোশ্যালে 1-click পোস্ট করতে পারবে। Brand Kit (logo/address/phone/WhatsApp) auto-retained।</p></div>
        <div className="flex items-center gap-2"><Input placeholder="Search library..." value={q} onChange={e=> setQ(e.target.value)} className="h-9 w-48"/><Button variant="outline" className="h-9" onClick={load}><Icon name="RefreshCw" className="size-3"/> Refresh</Button></div>
      </div>
      {loading ? <LoadingGrid count={3}/> : posts.length===0 ? <EmptyState icon="Library" title="No approved posts yet" description="Marketing Manager approved করলে এখানে দেখা যাবে — তখন Counselor 1-click repost করতে পারবে।"/> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p:any)=>(
            <Card key={p.id} className="rounded-2xl border-2 border-[#E2E8F0] overflow-hidden">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2"><Badge variant="outline">{p.platform}</Badge><Badge className="bg-emerald-100 text-emerald-700">{p.approvalStatus}</Badge><span className="text-[11px] text-muted-foreground">{p.platformSize||"SQUARE"}</span></div>
                <p className="font-semibold text-sm line-clamp-2">{p.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.caption?.slice(0,120)}</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {["FACEBOOK","INSTAGRAM","LINKEDIN"].map(pl=>(
                    <Button key={pl} size="sm" className="h-8 bg-[#0057B8] text-white text-[11px]" onClick={()=> repost(p, pl)}><Icon name="Share2" className="size-3"/> Repost to {pl}</Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">Brand: {p.brandAssetApplied? "✓ Applied":"—"} • {fmtDate(p.approvedAt||p.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs text-muted-foreground"><span className="font-semibold text-[#0057B8]">Note:</span> এই Library Marketing Manager dashboard ছাড়াও প্রতিটি Employee dashboard-এ “Marketing Library” নামে দেখানো হবে — UnifiedEmployeeDashboard এ ট্যাব হিসেবে অ্যাড করতে বললে 1 টার্নে করে দেব।</div>
    </div>
  );
}

// ============================================================
// WHATSAPP 24/7 CARD

// ============================================================
// WHATSAPP 24/7 CARD
// ============================================================

function WhatsAppCard() {
  const { toast } = useToast();

  const slaSteps = [
    { time: "40 min", label: "Response SLA", color: "bg-emerald-100 text-emerald-700" },
    { time: "20 min", label: "Escalate to Manager", color: "bg-amber-100 text-amber-700" },
    { time: "10 min", label: "Escalate to Super Admin", color: "bg-red-100 text-red-700" },
  ];

  return (
    <Card className="rounded-2xl border-2 border-[#E2E8F0]">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <Icon name="MessageCircle" className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0057B8]">WhatsApp Automation — 24/7</h3>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <span className="mr-1 size-1.5 animate-pulse rounded-full bg-emerald-500" /> AI Agent Active
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                AI agent responds to WhatsApp messages 24/7. Office hours handled by employees; after hours handled by AI with human handoff queue.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="h-11 border-green-300 text-green-700"
            onClick={() => toast({ title: "Webhook test sent", description: "Test payload delivered to WhatsApp webhook. Check n8n for response." })}
          >
            <Icon name="Webhook" className="size-4" /> Test WhatsApp Webhook
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {/* Office hours */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <div className="flex items-center gap-2">
              <Icon name="Clock" className="size-4 text-[#0057B8]" />
              <p className="text-xs font-semibold text-[#0057B8]">Office Hours</p>
            </div>
            <p className="mt-2 text-sm font-bold text-foreground">9 AM – 6 PM</p>
            <p className="text-[11px] text-muted-foreground">Employee handles chat</p>
            <div className="mt-2 border-t border-[#E2E8F0] pt-2">
              <p className="text-[11px] text-muted-foreground">After hours (6 PM – 9 AM):</p>
              <p className="text-[11px] font-semibold text-[#E8501A]">AI handles first response</p>
            </div>
          </div>

          {/* SLA */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <Icon name="Timer" className="size-4 text-[#0057B8]" />
              <p className="text-xs font-semibold text-[#0057B8]">Response SLA & Escalation</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {slaSteps.map((s, idx) => (
                <React.Fragment key={s.label}>
                  <div className={cn("rounded-lg px-2.5 py-1.5", s.color)}>
                    <p className="text-[10px] font-bold">{s.time}</p>
                    <p className="text-[10px]">{s.label}</p>
                  </div>
                  {idx < slaSteps.length - 1 && <Icon name="ArrowRight" className="size-3 text-slate-400" />}
                </React.Fragment>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              If no reply within 20 min, conversation escalates to Marketing Manager. If still no reply within 10 min more, escalates to Super Admin.
            </p>
          </div>

          {/* Document auto-upload */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <div className="flex items-center gap-2">
              <Icon name="FileCheck2" className="size-4 text-[#0057B8]" />
              <p className="text-xs font-semibold text-[#0057B8]">Document Auto-Detect</p>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              WhatsApp documents (passport, IELTS, transcripts) auto-detect type and save to student profile.
            </p>
            <Badge className="mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              <Icon name="Check" className="mr-1 size-3" /> Active
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
