"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
  Progress,
  MiniBar,
  StatusBadge,
} from "@/components/alo/shared";
import { fmtDate, timeAgo } from "@/lib/alo-types";

// ─────────────────────────────────────────────────────────────────────────────
// Types — match /api/omnichannel/dashboard response shape
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardStats {
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
}

interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
  accountId: string;
  connectionStatus: string;
  lastSync: string | null;
  lastActivity: string | null;
  assignedTo: string | null;
  autoSync?: boolean | null;
}

interface PhoneCall {
  id: string;
  callType: string;
  fromNumber: string;
  toNumber: string;
  duration: number;
  callNotes: string | null;
  disposition: string;
  createdAt: string;
}

interface EmailMsg {
  id: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  folder: string;
  isRead: boolean;
  matchedToCRM: boolean;
  createdAt: string;
}

interface SmsLog {
  id: string;
  direction: string;
  fromNumber: string;
  toNumber: string;
  messageText: string;
  deliveryStatus: string;
  readStatus: boolean;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  recipientType: string;
  channel: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

interface ConsentRecord {
  id: string;
  studentId: string;
  channel: string;
  consentStatus: string;
  preferredLanguage: string | null;
  consentDate: string | null;
  optOutDate: string | null;
}

interface DocVersion {
  id: string;
  documentId: string;
  version: number;
  filePath: string | null;
  reviewStatus: string;
  reviewerNote: string | null;
  isLatest: boolean;
  uploadedAt: string;
}

interface AiClassification {
  id: string;
  documentId: string;
  detectedType: string;
  confidence: number;
  extractedData: string;
  humanVerified: boolean;
  createdAt: string;
}

interface TimelineEvent {
  type: string;
  title: string;
  description?: string | null;
  timestamp: string;
  channel: string;
  user?: string | null;
}

interface RecentTimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  createdAt: string;
  user: { name: string | null; role: string | null } | null;
}

interface DashboardResponse {
  stats: DashboardStats;
  connectedAccounts: ConnectedAccount[];
  phoneCalls: PhoneCall[];
  emails: EmailMsg[];
  sms: SmsLog[];
  notifications: NotificationItem[];
  consentRecords: ConsentRecord[];
  documentVersions: DocVersion[];
  aiClassifications: AiClassification[];
  unifiedTimeline: TimelineEvent[];
  recentTimelineEvents: RecentTimelineEvent[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants — colors, channel metadata, document type reference
// ─────────────────────────────────────────────────────────────────────────────

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  NOT_VERIFIED: "bg-slate-100 text-slate-700 border border-slate-200",
  CONNECTED: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  DISCONNECTED: "bg-slate-100 text-slate-700 border border-slate-200",
  EXPIRED: "bg-amber-100 text-amber-700 border border-amber-200",
  PERMISSION_ERROR: "bg-rose-100 text-rose-700 border border-rose-200",
  RECONNECT_REQUIRED: "bg-orange-100 text-orange-700 border border-orange-200",
};

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  NOT_VERIFIED: "Not verified",
  CONNECTED: "Connected",
  DISCONNECTED: "Disconnected",
  EXPIRED: "Expired",
  PERMISSION_ERROR: "Permission Error",
  RECONNECT_REQUIRED: "Reconnect Required",
};

const PLATFORM_META: Record<
  string,
  { label: string; icon: string; color: string; bg: string; text: string }
> = {
  WHATSAPP: { label: "WhatsApp", icon: "MessageCircle", color: "#16a34a", bg: "bg-green-50", text: "text-green-700" },
  FACEBOOK: { label: "Facebook", icon: "Facebook", color: "#1877f2", bg: "bg-blue-50", text: "text-blue-700" },
  INSTAGRAM: { label: "Instagram", icon: "Instagram", color: "#e1306c", bg: "bg-pink-50", text: "text-pink-700" },
  GMAIL: { label: "Gmail", icon: "Mail", color: "#7c3aed", bg: "bg-violet-50", text: "text-violet-700" },
  OUTLOOK: { label: "Outlook", icon: "Mail", color: "#2563EB", bg: "bg-[#EFF6FF]", text: "text-[#2563EB]" },
  SMS_GATEWAY: { label: "SMS Gateway", icon: "MessageSquare", color: "#15803D", bg: "bg-emerald-50", text: "text-emerald-700" },
  CALL_CENTER: { label: "Call Center", icon: "Phone", color: "#C2410C", bg: "bg-orange-50", text: "text-orange-700" },
  TELEGRAM: { label: "Telegram", icon: "Send", color: "#0088cc", bg: "bg-sky-50", text: "text-sky-700" },
  LINKEDIN: { label: "LinkedIn", icon: "Linkedin", color: "#0a66c2", bg: "bg-blue-50", text: "text-blue-700" },
  TWITTER: { label: "Twitter / X", icon: "Twitter", color: "#0f172a", bg: "bg-slate-100", text: "text-slate-700" },
};

const CHANNEL_META: Record<
  string,
  { label: string; icon: string; bg: string; text: string; dot: string }
> = {
  WHATSAPP: { label: "WhatsApp", icon: "MessageCircle", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  FACEBOOK: { label: "Facebook", icon: "Facebook", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  INSTAGRAM: { label: "Instagram", icon: "Instagram", bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-500" },
  EMAIL: { label: "Email", icon: "Mail", bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  SMS: { label: "SMS", icon: "MessageSquare", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  PHONE: { label: "Phone", icon: "Phone", bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  CRM: { label: "CRM", icon: "Activity", bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500" },
  MESSENGER: { label: "Messenger", icon: "Send", bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
};

const CALL_TYPE_COLORS: Record<string, string> = {
  INCOMING: "bg-blue-100 text-blue-700",
  OUTGOING: "bg-emerald-100 text-emerald-700",
  MISSED: "bg-rose-100 text-rose-700",
};

const DELIVERY_COLORS: Record<string, string> = {
  SENT: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
  PENDING: "bg-amber-100 text-amber-700",
};

const FOLDER_COLORS: Record<string, string> = {
  INBOX: "bg-blue-100 text-blue-700",
  SENT: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-amber-100 text-amber-700",
  ARCHIVE: "bg-slate-100 text-slate-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-rose-100 text-rose-700",
  HIGH: "bg-orange-100 text-orange-700",
  NORMAL: "bg-blue-100 text-blue-700",
  LOW: "bg-slate-100 text-slate-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  COMMUNICATION: "bg-blue-100 text-blue-700",
  DOCUMENT: "bg-violet-100 text-violet-700",
  DEADLINE: "bg-rose-100 text-rose-700",
  APPLICATION: "bg-emerald-100 text-emerald-700",
  PAYMENT: "bg-amber-100 text-amber-700",
  VISA: "bg-orange-100 text-orange-700",
  SYSTEM: "bg-slate-100 text-slate-700",
  MARKETING: "bg-pink-100 text-pink-700",
};

const CONSENT_COLORS: Record<string, string> = {
  OPTED_IN: "bg-emerald-100 text-emerald-700",
  OPTED_OUT: "bg-rose-100 text-rose-700",
  UNKNOWN: "bg-slate-100 text-slate-700",
  PENDING: "bg-amber-100 text-amber-700",
};

const REVIEW_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
};

const DOC_TYPES_27 = [
  { code: "PASSPORT", label: "Passport" },
  { code: "NID", label: "National ID" },
  { code: "BIRTH_CERT", label: "Birth Certificate" },
  { code: "SSC", label: "SSC Certificate" },
  { code: "HSC", label: "HSC Certificate" },
  { code: "DIPLOMA", label: "Diploma" },
  { code: "BACHELOR", label: "Bachelor Degree" },
  { code: "MASTERS", label: "Master's Degree" },
  { code: "TRANSCRIPT", label: "Academic Transcript" },
  { code: "RECOMMENDATION", label: "Recommendation Letter" },
  { code: "CV", label: "Curriculum Vitae" },
  { code: "EMPLOYMENT_LETTER", label: "Employment Letter" },
  { code: "OFFER_LETTER", label: "Offer Letter" },
  { code: "CAS", label: "CAS Statement" },
  { code: "COE", label: "Confirmation of Enrolment" },
  { code: "VISA", label: "Visa / Visa Grant" },
  { code: "IELTS", label: "IELTS Test Report" },
  { code: "TOEFL", label: "TOEFL Score Report" },
  { code: "PTE", label: "PTE Academic Score" },
  { code: "MOI", label: "Medium of Instruction" },
  { code: "POLICE_CLEARANCE", label: "Police Clearance" },
  { code: "MEDICAL", label: "Medical Certificate" },
  { code: "BANK_STATEMENT", label: "Bank Statement" },
  { code: "FINANCIAL_AFFIDAVIT", label: "Financial Affidavit" },
  { code: "SPONSOR_LETTER", label: "Sponsor Letter" },
  { code: "PHOTO", label: "Passport Photo" },
  { code: "SIGNATURE", label: "Signature" },
];

const PLATFORM_OPTIONS = Object.keys(PLATFORM_META);

const safeParse = (raw: unknown): Record<string, unknown> => {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  try {
    return JSON.parse(String(raw)) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const fmtTime = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const fmtDuration = (s: number) => {
  if (!s || s < 1) return "0:00";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function OmnichannelCommunicationCenter() {
  const { toast } = useToast();
  const [data, setData] = React.useState<DashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("connected-accounts");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/omnichannel/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = (await res.json()) as DashboardResponse;
      setData(json);
    } catch (err) {
      toast({
        title: "Failed to load communication center",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ── Account actions ──
  const handleAccountAction = async (account: ConnectedAccount, action: "sync" | "disconnect" | "reconnect") => {
    try {
      const res = await fetch("/api/omnichannel/connected-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: account.id, action }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Provider action is not available.");
      toast({
        title: action === "disconnect" ? "Local access disabled" : "Provider action completed",
        description: result?.message || `${account.platform} account updated.`,
      });
      // Only local disconnection has an implemented effect; never synthesize a
      // provider sync, reconnect, or connected state in the browser.
      if (data && action === "disconnect") {
        setData({
          ...data,
          connectedAccounts: data.connectedAccounts.map((a) =>
            a.id === account.id ? { ...a, connectionStatus: "DISCONNECTED" } : a
          ),
        });
      }
    } catch (err) {
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Omnichannel Communication Center"
          subtitle="Administrator view of locally stored communication records. Provider connections, external delivery, and live synchronization are not verified."
          icon="Radio"
        />
        <LoadingGrid count={6} />
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Omnichannel Communication Center"
        subtitle="Administrator view of locally stored communication records. Provider connections, external delivery, and live synchronization are not verified."
        icon="Radio"
        action={
          <Button
            variant="outline"
            className="h-12 border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
            onClick={() => void fetchData()}
          >
            <Icon name="RefreshCw" className="size-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* ─── Stats grid (12 cards) ─── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <StatCard
          label="Connected Accounts"
          value={stats.connectedAccounts}
          icon="Link"
          accent="blue"
          hint={`${stats.connectedActive}/${stats.connectedAccounts} active`}
        />
        <StatCard
          label="Phone Calls"
          value={stats.totalPhoneCalls}
          icon="Phone"
          accent="violet"
          hint={`${stats.missedCalls} missed`}
        />
        <StatCard
          label="Emails"
          value={stats.totalEmails}
          icon="Mail"
          accent="orange"
          hint={`${stats.unreadEmails} unread`}
        />
        <StatCard
          label="SMS"
          value={stats.totalSms}
          icon="MessageSquare"
          accent="emerald"
          hint={`${stats.deliveredSms} delivered`}
        />
        <StatCard
          label="Notifications"
          value={stats.totalNotifications}
          icon="Bell"
          accent="amber"
          hint={`${stats.unreadNotifications} unread`}
        />
        <StatCard
          label="Consent"
          value={stats.totalConsent}
          icon="ShieldCheck"
          accent="rose"
          hint={`${stats.optedIn} in · ${stats.optedOut} out`}
        />
        <StatCard
          label="Documents"
          value={stats.totalDocuments}
          icon="FileText"
          accent="blue"
          hint={`${stats.documentVersions} versions`}
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingReview}
          icon="Clock"
          accent="amber"
          hint={`${stats.aiClassified} AI-classified`}
        />
        <StatCard
          label="Timeline Events"
          value={stats.timelineEvents}
          icon="Activity"
          accent="violet"
          hint="recent events"
        />
        <StatCard
          label="WhatsApp Messages"
          value={stats.whatsappMessages}
          icon="MessageCircle"
          accent="emerald"
          hint="messages"
        />
        <StatCard
          label="Social Messages"
          value={stats.socialMessages}
          icon="Share2"
          accent="blue"
          hint="FB / IG / Messenger"
        />
        <StatCard
          label="Unified Timeline"
          value={data.unifiedTimeline.length}
          icon="Layers"
          accent="blue"
          hint="merged events"
        />
      </div>

      {/* ─── Tabs ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <div className="overflow-x-auto alo-scroll rounded-xl border border-[#E2E8F0] bg-white p-1.5">
          <TabsList className="h-auto w-max gap-1 bg-transparent">
            <TabsTrigger value="connected-accounts" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0B5ED7]">
              <Icon name="Link" className="size-3.5 mr-1.5" /> Connected Accounts
            </TabsTrigger>
            <TabsTrigger value="unified-timeline" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0B5ED7]">
              <Icon name="Layers" className="size-3.5 mr-1.5" /> Unified Timeline
            </TabsTrigger>
            <TabsTrigger value="phone-calls" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0B5ED7]">
              <Icon name="Phone" className="size-3.5 mr-1.5" /> Phone Calls
            </TabsTrigger>
            <TabsTrigger value="emails" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0B5ED7]">
              <Icon name="Mail" className="size-3.5 mr-1.5" /> Emails
            </TabsTrigger>
            <TabsTrigger value="sms" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0B5ED7]">
              <Icon name="MessageSquare" className="size-3.5 mr-1.5" /> SMS
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0B5ED7]">
              <Icon name="Bell" className="size-3.5 mr-1.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="consent" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0B5ED7]">
              <Icon name="ShieldCheck" className="size-3.5 mr-1.5" /> Consent Management
            </TabsTrigger>
            <TabsTrigger value="ai-classification" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0B5ED7]">
              <Icon name="Sparkles" className="size-3.5 mr-1.5" /> AI Document Classification
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="connected-accounts" className="space-y-4">
          <ConnectedAccountsTab
            accounts={data.connectedAccounts}
            onAction={handleAccountAction}
            onCreated={() => void fetchData()}
          />
        </TabsContent>

        <TabsContent value="unified-timeline" className="space-y-4">
          <UnifiedTimelineTab events={data.unifiedTimeline} />
        </TabsContent>

        <TabsContent value="phone-calls" className="space-y-4">
          <PhoneCallsTab calls={data.phoneCalls} onLogged={() => void fetchData()} />
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <EmailsTab emails={data.emails} />
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <SmsTab sms={data.sms} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsTab notifications={data.notifications} onMarkRead={() => void fetchData()} />
        </TabsContent>

        <TabsContent value="consent" className="space-y-4">
          <ConsentTab records={data.consentRecords} onUpdated={() => void fetchData()} />
        </TabsContent>

        <TabsContent value="ai-classification" className="space-y-4">
          <AiClassificationTab classifications={data.aiClassifications} onClassified={() => void fetchData()} />
        </TabsContent>
      </Tabs>

      {/* ─── Chairman Command Center note ─── */}
      <SectionCard
        title="Chairman Command Center"
        icon="Crown"
        className="border-[#0B5ED7]/20 bg-[#EFF6FF]/40"
      >
        <p className="body-text text-[#0F172A]">
          Chairman can monitor all official communication accounts, assign channels to branches,
          departments, and employees, and view traffic, unread, pending, failures, and sync errors
          across the entire organization.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
            <p className="badge-text uppercase tracking-wide text-[#64748B]">Total Channels</p>
            <p className="mt-1 text-xl font-bold text-[#0F172A]">{stats.connectedAccounts}</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
            <p className="badge-text uppercase tracking-wide text-[#64748B]">Active</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">{stats.connectedActive}</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
            <p className="badge-text uppercase tracking-wide text-[#64748B]">Expired / Errors</p>
            <p className="mt-1 text-xl font-bold text-amber-600">{stats.expiredAccounts}</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
            <p className="badge-text uppercase tracking-wide text-[#64748B]">Unread / Pending</p>
            <p className="mt-1 text-xl font-bold text-rose-600">
              {stats.unreadNotifications + stats.unreadEmails + stats.pendingReview}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ─── Auto Lead Creation note ─── */}
      <SectionCard
        title="Auto Lead Creation from Unknown Contacts"
        icon="UserPlus"
        className="border-emerald-200 bg-emerald-50/40"
      >
        <p className="body-text text-[#0F172A]">
          When communication arrives from an unknown contact, the system automatically: identifies
          sender → searches CRM by phone / email / passport / student ID → if not found, creates Lead
          with ID → assigns counselor → notifies Chairman → saves to timeline.
        </p>
      </SectionCard>

      {/* ─── Document Rules note ─── */}
      <SectionCard
        title="Document Version & Deletion Rules"
        icon="FileLock2"
        className="border-[#C2410C]/30 bg-orange-50/40"
      >
        <p className="body-text text-[#0F172A]">
          Each document type supports maximum <strong>2 versions</strong>. Students, partners,
          counselors, visa officers, marketing, and HR cannot delete documents. Only{" "}
          <strong>Super Admin</strong> and <strong>Admin</strong> can permanently delete with reason,
          approval, and audit log.
        </p>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Connected Accounts Tab
// ─────────────────────────────────────────────────────────────────────────────

function ConnectedAccountsTab({
  accounts,
  onAction,
  onCreated,
}: {
  accounts: ConnectedAccount[];
  onAction: (a: ConnectedAccount, action: "disconnect") => Promise<void>;
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const handleAction = async (account: ConnectedAccount) => {
    setBusyId(account.id);
    try {
      await onAction(account, "disconnect");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="card-title text-[#0F172A]">Connected Communication Accounts</p>
          <p className="body-text text-[#64748B]">
            Account records are disconnected placeholders until official provider OAuth and live verification are implemented.
          </p>
        </div>
        <Button
          className="h-12 bg-[#C2410C] text-white hover:bg-[#C2410C]/90"
          onClick={() => setOpen(true)}
        >
          <Icon name="Plus" className="size-4 mr-2" />
          Create placeholder
        </Button>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-[#EFF6FF]/30 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Icon name="ShieldCheck" className="size-4 mt-0.5 text-[#0B5ED7] shrink-0" />
          <p className="body-text text-[#0F172A]">
            <strong>Integration status:</strong> No provider token is collected here. Existing provider states are NOT VERIFIED, and local disconnect does not revoke access at the provider.
          </p>
        </div>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon="Link"
          title="No account placeholders"
          description="Provider connections are not configured. Creating a placeholder does not connect a channel or receive messages."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const meta = PLATFORM_META[acc.platform] || {
              label: acc.platform,
              icon: "Plug",
              color: "#64748B",
              bg: "bg-slate-100",
              text: "text-slate-700",
            };
            const status = acc.connectionStatus;
            const isDisconnected = status === "DISCONNECTED";
            return (
              <Card key={acc.id} className="rounded-2xl border border-[#E2E8F0] bg-white alo-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex size-11 items-center justify-center rounded-xl", meta.bg, meta.text)}>
                        <Icon name={meta.icon} className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="card-title text-[#0F172A] truncate">{meta.label}</p>
                        <p className="body-text text-[#64748B] truncate">{acc.accountName}</p>
                      </div>
                    </div>
                    <StatusBadge
                      status={status}
                      colorMap={ACCOUNT_STATUS_COLORS}
                      labels={ACCOUNT_STATUS_LABELS}
                    />
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">Account ID</span>
                      <span className="font-mono text-[#0F172A]">{acc.accountId}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">Assigned To</span>
                      <span className="text-[#0F172A]">{acc.assignedTo || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">Last Sync</span>
                      <span className="text-[#0F172A]">{acc.lastSync ? timeAgo(acc.lastSync) : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B]">Last Activity</span>
                      <span className="text-[#0F172A]">{acc.lastActivity ? timeAgo(acc.lastActivity) : "—"}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled title="Provider sync is not implemented or verified">
                      <Icon name="ShieldAlert" className="size-3.5 mr-1.5" />
                      Sync unavailable
                    </Button>
                    {!isDisconnected && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 border-rose-200 text-rose-700 hover:bg-rose-50"
                        disabled={busyId === acc.id}
                        onClick={() => void handleAction(acc)}
                        title="Clears local credentials only; no provider-side revocation is performed"
                      >
                        <Icon name="Unplug" className="size-3.5 mr-1.5" />
                        {busyId === acc.id ? "Clearing…" : "Clear local credentials"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConnectAccountDialog open={open} onOpenChange={setOpen} onCreated={onCreated} />
    </div>
  );
}

function ConnectAccountDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [platform, setPlatform] = React.useState("WHATSAPP");
  const [accountName, setAccountName] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [assignedTo, setAssignedTo] = React.useState("COMPANY");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!accountName.trim()) {
      toast({ title: "Account name required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/omnichannel/connected-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          accountName: accountName.trim(),
          accountId: accountId.trim() || undefined,
          assignedTo,
        }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Provider setup is not available.");
      toast({
        title: "Configuration placeholder created",
        description: result?.message || `${platform} is not connected or verified.`,
      });
      onOpenChange(false);
      setAccountName("");
      setAccountId("");
      onCreated();
    } catch (err) {
      toast({
        title: "Connection failed",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Link" className="size-5 text-[#0B5ED7]" />
            Connect Communication Account
          </DialogTitle>
          <DialogDescription>
            Create a disconnected configuration placeholder. Provider OAuth and live verification are not configured; no tokens are collected here.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#0F172A]">Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((p) => {
                  const m = PLATFORM_META[p];
                  return (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <Icon name={m.icon} className="size-3.5" />
                        {m.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[#0F172A]">Account Name *</Label>
            <Input
              className="h-11"
              placeholder="e.g. ALO Education Official"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#0F172A]">Account ID (optional)</Label>
            <Input
              className="h-11"
              placeholder="Optional account identifier, if known"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#0F172A]">Assigned To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPANY">Company-wide</SelectItem>
                <SelectItem value="BRANCH_DHAKA">Dhaka Branch</SelectItem>
                <SelectItem value="BRANCH_CHITTAGONG">Chittagong Branch</SelectItem>
                <SelectItem value="MARKETING">Marketing Team</SelectItem>
                <SelectItem value="COUNSELING">Counseling Team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-800">
              <Icon name="ShieldAlert" className="size-3 inline mr-1" />
              This creates a disconnected configuration placeholder only. OAuth, token storage, and provider verification are not implemented.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="h-11 bg-[#C2410C] text-white hover:bg-[#C2410C]/90"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? (
              <>
                <Icon name="Loader2" className="size-4 mr-2 animate-spin" /> Connecting…
              </>
            ) : (
              <>
                <Icon name="Plus" className="size-4 mr-2" /> Create placeholder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified Timeline Tab — the key feature
// ─────────────────────────────────────────────────────────────────────────────

function UnifiedTimelineTab({ events }: { events: TimelineEvent[] }) {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [channel, setChannel] = React.useState("ALL");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (channel !== "ALL" && e.channel !== channel) return false;
      if (!q) return true;
      return (
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q)
      );
    });
  }, [events, query, channel]);

  const exportFiltered = () => {
    if (filtered.length === 0) {
      toast({ title: "Nothing to export", description: "No timeline records match the current filter." });
      return;
    }
    const escapeCsv = (value: unknown) => {
      let text = String(value ?? '').replaceAll(String.fromCharCode(13), ' ').replaceAll(String.fromCharCode(10), ' ');
      if (/^[=+@-]/.test(text) || text.startsWith(String.fromCharCode(9))) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = [
      ['Type', 'Title', 'Description', 'Timestamp', 'Channel', 'Actor'],
      ...filtered.map((event) => [event.type, event.title, event.description || '', event.timestamp, event.channel, event.user || '']),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join(String.fromCharCode(13, 10));
    const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `alo-communication-timeline-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Unified Communication Timeline"
        icon="Layers"
        description="This view merges available local CRM records. External channels, live ingestion, and synchronization are not verified; it does not represent every interaction."
        action={
          <Button
            variant="outline"
            className="h-11 border-[#E2E8F0] text-[#0B5ED7] hover:bg-[#EFF6FF]"
            onClick={exportFiltered}
          >
            <Icon name="Download" className="size-4 mr-2" />
            Export Timeline
          </Button>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon name="Search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
            <Input
              className="h-11 pl-9"
              placeholder="Search timeline by title, description, type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="h-11 w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All channels</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="FACEBOOK">Facebook</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="PHONE">Phone</SelectItem>
              <SelectItem value="CRM">CRM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      {filtered.length === 0 ? (
        <EmptyState
          icon="Layers"
          title="No timeline events"
          description="Try clearing filters or wait for new communications to arrive."
        />
      ) : (
        <SectionCard title={`Merged Timeline (${filtered.length})`} icon="Activity">
          <div className="relative max-h-[40rem] overflow-y-auto alo-scroll pr-2">
            <div className="relative pl-6">
              {/* Vertical connector */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#0B5ED7] via-[#2563EB] to-[#E2E8F0]" />
              <ul className="space-y-5">
                {filtered.map((ev, idx) => {
                  const meta =
                    CHANNEL_META[ev.channel] ||
                    CHANNEL_META[ev.type] || {
                      label: ev.channel,
                      icon: "Activity",
                      bg: "bg-slate-100",
                      text: "text-slate-700",
                      dot: "bg-slate-500",
                    };
                  return (
                    <li key={idx} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[22px] top-1 flex size-6 items-center justify-center rounded-full ring-4 ring-white",
                          meta.bg,
                          meta.text
                        )}
                      >
                        <Icon name={meta.icon} className="size-3.5" />
                      </span>
                      <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 alo-shadow transition hover:alo-shadow-lg">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="card-title text-[#0F172A]">{ev.title || ev.type}</p>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 badge-text capitalize",
                                meta.bg,
                                meta.text
                              )}
                            >
                              {meta.label}
                            </span>
                            <span className="badge-text text-[#64748B]">
                              {fmtDate(ev.timestamp)} · {fmtTime(ev.timestamp)}
                            </span>
                          </div>
                        </div>
                        {ev.description && (
                          <p className="mt-1 body-text text-[#475569] line-clamp-2">
                            {ev.description}
                          </p>
                        )}
                        {ev.user && (
                          <p className="mt-1.5 badge-text text-[#64748B]">
                            by {ev.user}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Phone Calls Tab
// ─────────────────────────────────────────────────────────────────────────────

function PhoneCallsTab({
  calls,
  onLogged,
}: {
  calls: PhoneCall[];
  onLogged: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="card-title text-[#0F172A]">Phone Call Log</p>
          <p className="body-text text-[#64748B]">All incoming, outgoing, and missed calls.</p>
        </div>
        <Button className="h-12 bg-[#C2410C] text-white hover:bg-[#C2410C]/90" onClick={() => setOpen(true)}>
          <Icon name="PhoneCall" className="size-4 mr-2" />
          Log Call
        </Button>
      </div>

      {calls.length === 0 ? (
        <EmptyState icon="Phone" title="No calls logged" />
      ) : (
        <SectionCard title={`Call Log (${calls.length})`} icon="Phone">
          <div className="max-h-[40rem] overflow-auto alo-scroll">
            <Table>
              <TableHeader className="sticky top-0 bg-[#F8FAFC] z-10">
                <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                  <TableHead className="text-[#64748B]">Type</TableHead>
                  <TableHead className="text-[#64748B]">From</TableHead>
                  <TableHead className="text-[#64748B]">To</TableHead>
                  <TableHead className="text-[#64748B]">Duration</TableHead>
                  <TableHead className="text-[#64748B]">Disposition</TableHead>
                  <TableHead className="text-[#64748B]">Notes</TableHead>
                  <TableHead className="text-[#64748B] text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((c) => (
                  <TableRow key={c.id} className="border-[#E2E8F0]">
                    <TableCell>
                      <StatusBadge status={c.callType} colorMap={CALL_TYPE_COLORS} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#0F172A]">{c.fromNumber}</TableCell>
                    <TableCell className="font-mono text-xs text-[#0F172A]">{c.toNumber}</TableCell>
                    <TableCell className="tabular-nums text-[#0F172A]">{fmtDuration(c.duration)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#E2E8F0] text-[#475569]">
                        {c.disposition}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="body-text text-[#475569] line-clamp-2">
                        {c.callNotes || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="body-text text-[#0F172A]">{fmtDate(c.createdAt)}</p>
                      <p className="badge-text text-[#64748B]">{fmtTime(c.createdAt)}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <LogCallDialog open={open} onOpenChange={setOpen} onLogged={onLogged} />
    </div>
  );
}

function LogCallDialog({
  open,
  onOpenChange,
  onLogged,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLogged: () => void;
}) {
  const { toast } = useToast();
  const [callType, setCallType] = React.useState("OUTGOING");
  const [fromNumber, setFromNumber] = React.useState("");
  const [toNumber, setToNumber] = React.useState("");
  const [duration, setDuration] = React.useState("60");
  const [disposition, setDisposition] = React.useState("ANSWERED");
  const [callNotes, setCallNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!fromNumber.trim() || !toNumber.trim()) {
      toast({ title: "Both phone numbers are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/omnichannel/phone-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callType, fromNumber, toNumber, duration: Number(duration), disposition, callNotes }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Manual call log could not be saved.");
      toast({
        title: "Manual call log saved",
        description: "Saved in the call log only. No telephone call was placed and no CRM timeline link was created.",
      });
      onOpenChange(false);
      setToNumber("");
      setCallNotes("");
      onLogged();
    } catch (err) {
      toast({
        title: "Failed to log call",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="PhoneCall" className="size-5 text-[#0B5ED7]" />
            Log Phone Call
          </DialogTitle>
          <DialogDescription>
            Create a manual call-log record only. This does not place a telephone call or link a person to the CRM timeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#0F172A]">Call Type</Label>
              <Select value={callType} onValueChange={setCallType}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOMING">Incoming</SelectItem>
                  <SelectItem value="OUTGOING">Outgoing</SelectItem>
                  <SelectItem value="MISSED">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#0F172A]">Disposition</Label>
              <Select value={disposition} onValueChange={setDisposition}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANSWERED">Answered</SelectItem>
                  <SelectItem value="VOICEMAIL">Voicemail</SelectItem>
                  <SelectItem value="MISSED">Missed</SelectItem>
                  <SelectItem value="BUSY">Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#0F172A]">From</Label>
              <Input className="h-11 font-mono" value={fromNumber} onChange={(e) => setFromNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#0F172A]">To *</Label>
              <Input className="h-11 font-mono" placeholder="+8801805020100" value={toNumber} onChange={(e) => setToNumber(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#0F172A]">Duration (seconds)</Label>
            <Input className="h-11" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#0F172A]">Call Notes</Label>
            <Textarea
              className="min-h-[80px]"
              placeholder="Summary of conversation, student intent, follow-up actions…"
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="h-11 bg-[#C2410C] text-white hover:bg-[#C2410C]/90" disabled={submitting} onClick={submit}>
            {submitting ? (
              <><Icon name="Loader2" className="size-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              <><Icon name="Save" className="size-4 mr-2" /> Save Call</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Emails Tab
// ─────────────────────────────────────────────────────────────────────────────

function EmailsTab({ emails }: { emails: EmailMsg[] }) {
  const { toast } = useToast();
  const [folder, setFolder] = React.useState("ALL");

  const filtered = React.useMemo(() => {
    if (folder === "ALL") return emails;
    return emails.filter((e) => e.folder === folder);
  }, [emails, folder]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="card-title text-[#0F172A]">Email Sync</p>
          <p className="body-text text-[#64748B]">Inbox, sent, drafts — auto-matched to CRM contacts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={folder} onValueChange={setFolder}>
            <SelectTrigger className="h-11 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All folders</SelectItem>
              <SelectItem value="INBOX">Inbox</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ARCHIVE">Archive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-11 border-[#E2E8F0] text-[#0B5ED7] hover:bg-[#EFF6FF]"
            onClick={() => toast({ title: "Email sync started", description: "Checking for new messages…" })}
          >
            <Icon name="RefreshCw" className="size-4 mr-2" />
            Sync Email
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="Mail" title="No emails" description="No emails in this folder." />
      ) : (
        <SectionCard title={`Emails (${filtered.length})`} icon="Mail">
          <div className="max-h-[40rem] overflow-auto alo-scroll">
            <Table>
              <TableHeader className="sticky top-0 bg-[#F8FAFC] z-10">
                <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                  <TableHead className="text-[#64748B]">From</TableHead>
                  <TableHead className="text-[#64748B]">To</TableHead>
                  <TableHead className="text-[#64748B]">Subject</TableHead>
                  <TableHead className="text-[#64748B]">Folder</TableHead>
                  <TableHead className="text-[#64748B]">Read</TableHead>
                  <TableHead className="text-[#64748B]">CRM Match</TableHead>
                  <TableHead className="text-[#64748B] text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id} className={cn("border-[#E2E8F0]", !e.isRead && "bg-[#EFF6FF]/40")}>
                    <TableCell className="text-xs text-[#0F172A]">{e.fromEmail}</TableCell>
                    <TableCell className="text-xs text-[#0F172A]">{e.toEmail}</TableCell>
                    <TableCell>
                      <p className={cn("body-text", e.isRead ? "text-[#475569] font-normal" : "text-[#0F172A] font-semibold")}>
                        {e.subject}
                      </p>
                      <p className="badge-text text-[#64748B] line-clamp-1">{e.bodyText?.slice(0, 80)}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={e.folder} colorMap={FOLDER_COLORS} />
                    </TableCell>
                    <TableCell>
                      {e.isRead ? (
                        <Badge variant="outline" className="border-[#E2E8F0] text-[#64748B]">Read</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-700">Unread</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {e.matchedToCRM ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <Icon name="Check" className="size-3 mr-1" /> Matched
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-[#E2E8F0] text-[#64748B]">
                          <Icon name="X" className="size-3 mr-1" /> No match
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="body-text text-[#0F172A]">{fmtDate(e.createdAt)}</p>
                      <p className="badge-text text-[#64748B]">{fmtTime(e.createdAt)}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMS Tab
// ─────────────────────────────────────────────────────────────────────────────

function SmsTab({ sms }: { sms: SmsLog[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="card-title text-[#0F172A]">SMS Log</p>
          <p className="body-text text-[#64748B]">Outbound & inbound SMS with delivery status.</p>
        </div>
        <Button className="h-12" variant="outline" disabled title="No authorized SMS provider is configured">
          <Icon name="ShieldAlert" className="size-4 mr-2" />
          SMS not configured
        </Button>
      </div>

      {sms.length === 0 ? (
        <EmptyState icon="MessageSquare" title="No SMS" />
      ) : (
        <SectionCard title={`SMS Log (${sms.length})`} icon="MessageSquare">
          <div className="max-h-[40rem] overflow-auto alo-scroll">
            <Table>
              <TableHeader className="sticky top-0 bg-[#F8FAFC] z-10">
                <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                  <TableHead className="text-[#64748B]">Direction</TableHead>
                  <TableHead className="text-[#64748B]">From</TableHead>
                  <TableHead className="text-[#64748B]">To</TableHead>
                  <TableHead className="text-[#64748B]">Message</TableHead>
                  <TableHead className="text-[#64748B]">Delivery</TableHead>
                  <TableHead className="text-[#64748B]">Read</TableHead>
                  <TableHead className="text-[#64748B] text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sms.map((s) => (
                  <TableRow key={s.id} className="border-[#E2E8F0]">
                    <TableCell>
                      <Badge
                        className={cn(
                          s.direction === "OUTBOUND"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {s.direction === "OUTBOUND" ? "Out" : "In"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#0F172A]">{s.fromNumber}</TableCell>
                    <TableCell className="font-mono text-xs text-[#0F172A]">{s.toNumber}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="body-text text-[#475569] line-clamp-2">{s.messageText}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.deliveryStatus} colorMap={DELIVERY_COLORS} />
                    </TableCell>
                    <TableCell>
                      {s.readStatus ? (
                        <Badge variant="outline" className="border-[#E2E8F0] text-[#64748B]">Read</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">Unread</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="body-text text-[#0F172A]">{fmtDate(s.createdAt)}</p>
                      <p className="badge-text text-[#64748B]">{fmtTime(s.createdAt)}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications Tab
// ─────────────────────────────────────────────────────────────────────────────

function NotificationsTab({
  notifications,
  onMarkRead,
}: {
  notifications: NotificationItem[];
  onMarkRead: () => void;
}) {
  const { toast } = useToast();
  const [category, setCategory] = React.useState("ALL");
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (category === "ALL") return notifications;
    return notifications.filter((n) => n.category === category);
  }, [notifications, category]);

  const markAllRead = async () => {
    const unread = filtered.filter((n) => !n.isRead);
    if (unread.length === 0) {
      toast({ title: "Nothing to mark", description: "All visible notifications are already read." });
      return;
    }
    setBusy(true);
    try {
      const responses = await Promise.all(
        unread.map((n) => fetch("/api/omnichannel/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: n.id, isRead: true }),
        }))
      );
      const failed = responses.find((response) => !response.ok);
      if (failed) {
        const result = await failed.json().catch(() => null);
        throw new Error(result?.error || "One or more notifications could not be updated.");
      }
      toast({ title: "Notifications updated", description: `${unread.length} notifications marked read.` });
      onMarkRead();
    } catch {
      toast({ title: "Failed to mark read", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const markOne = async (id: string, isRead: boolean) => {
    try {
      const response = await fetch("/api/omnichannel/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: !isRead }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Notification could not be updated.");
      onMarkRead();
    } catch (error) {
      toast({ title: "Failed to update", description: error instanceof Error ? error.message : "Notification could not be updated.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="card-title text-[#0F172A]">Notification Engine</p>
          <p className="body-text text-[#64748B]">In-app, email, push, and SMS notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              <SelectItem value="COMMUNICATION">Communication</SelectItem>
              <SelectItem value="DOCUMENT">Document</SelectItem>
              <SelectItem value="DEADLINE">Deadline</SelectItem>
              <SelectItem value="APPLICATION">Application</SelectItem>
              <SelectItem value="PAYMENT">Payment</SelectItem>
              <SelectItem value="VISA">Visa</SelectItem>
              <SelectItem value="SYSTEM">System</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-11 border-[#E2E8F0] text-[#0B5ED7] hover:bg-[#EFF6FF]"
            disabled={busy}
            onClick={markAllRead}
          >
            <Icon name="CheckCheck" className="size-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="Bell" title="No notifications" />
      ) : (
        <SectionCard title={`Notifications (${filtered.length})`} icon="Bell">
          <ul className="max-h-[40rem] space-y-2 overflow-y-auto alo-scroll pr-1">
            {filtered.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "rounded-xl border px-4 py-3 transition",
                  n.isRead
                    ? "border-[#E2E8F0] bg-white"
                    : "border-[#0B5ED7]/30 bg-[#EFF6FF]/40"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!n.isRead && (
                        <span className="inline-block size-2 rounded-full bg-[#C2410C]" />
                      )}
                      <p className={cn("card-title", n.isRead ? "text-[#475569]" : "text-[#0F172A]")}>
                        {n.title}
                      </p>
                      <StatusBadge status={n.category} colorMap={CATEGORY_COLORS} />
                      <StatusBadge status={n.priority} colorMap={PRIORITY_COLORS} />
                    </div>
                    <p className="mt-1 body-text text-[#475569]">{n.message}</p>
                    <p className="mt-1.5 badge-text text-[#64748B]">
                      {n.recipientType} · {n.channel} · {fmtDate(n.createdAt)} {fmtTime(n.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-[#0B5ED7] hover:bg-[#EFF6FF]"
                    onClick={() => markOne(n.id, n.isRead)}
                  >
                    {n.isRead ? "Mark unread" : "Mark read"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Consent Management Tab
// ─────────────────────────────────────────────────────────────────────────────

function ConsentTab({
  records,
  onUpdated,
}: {
  records: ConsentRecord[];
  onUpdated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const optedIn = records.filter((r) => r.consentStatus === "OPTED_IN").length;
  const optedOut = records.filter((r) => r.consentStatus === "OPTED_OUT").length;
  const unknown = records.filter((r) => r.consentStatus === "UNKNOWN" || r.consentStatus === "PENDING").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <p className="badge-text uppercase tracking-wide text-emerald-700">Opted In</p>
            <Icon name="Check" className="size-5 text-emerald-600" />
          </div>
          <p className="mt-1 text-3xl font-bold text-emerald-700 tabular-nums">{optedIn}</p>
          <p className="body-text text-emerald-700/80">Can receive marketing</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
          <div className="flex items-center justify-between">
            <p className="badge-text uppercase tracking-wide text-rose-700">Opted Out</p>
            <Icon name="X" className="size-5 text-rose-600" />
          </div>
          <p className="mt-1 text-3xl font-bold text-rose-700 tabular-nums">{optedOut}</p>
          <p className="body-text text-rose-700/80">No marketing contact</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="badge-text uppercase tracking-wide text-slate-700">Unknown / Pending</p>
            <Icon name="HelpCircle" className="size-5 text-slate-600" />
          </div>
          <p className="mt-1 text-3xl font-bold text-slate-700 tabular-nums">{unknown}</p>
          <p className="body-text text-slate-700/80">Request consent before sending</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="card-title text-[#0F172A]">Consent Records</p>
          <p className="body-text text-[#64748B]">GDPR / data-protection compliant consent ledger.</p>
        </div>
        <Button className="h-12 bg-[#C2410C] text-white hover:bg-[#C2410C]/90" onClick={() => setOpen(true)}>
          <Icon name="RefreshCw" className="size-4 mr-2" />
          Update Consent
        </Button>
      </div>

      {records.length === 0 ? (
        <EmptyState icon="ShieldCheck" title="No consent records" />
      ) : (
        <SectionCard title={`Consent Ledger (${records.length})`} icon="ScrollText">
          <div className="max-h-[40rem] overflow-auto alo-scroll">
            <Table>
              <TableHeader className="sticky top-0 bg-[#F8FAFC] z-10">
                <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                  <TableHead className="text-[#64748B]">Student / Lead</TableHead>
                  <TableHead className="text-[#64748B]">Channel</TableHead>
                  <TableHead className="text-[#64748B]">Status</TableHead>
                  <TableHead className="text-[#64748B]">Preferred Language</TableHead>
                  <TableHead className="text-[#64748B]">Consent Date</TableHead>
                  <TableHead className="text-[#64748B]">Opt-Out Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id} className="border-[#E2E8F0]">
                    <TableCell className="font-mono text-xs text-[#0F172A]">{r.studentId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#E2E8F0] text-[#475569]">
                        {r.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.consentStatus} colorMap={CONSENT_COLORS} />
                    </TableCell>
                    <TableCell className="text-[#0F172A]">{r.preferredLanguage || "—"}</TableCell>
                    <TableCell className="text-[#0F172A]">{fmtDate(r.consentDate)}</TableCell>
                    <TableCell className="text-[#0F172A]">{fmtDate(r.optOutDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      <div className="rounded-xl border border-[#C2410C]/30 bg-orange-50/40 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Icon name="ShieldAlert" className="size-4 mt-0.5 text-[#C2410C] shrink-0" />
          <p className="body-text text-[#0F172A]">
            <strong>Compliance:</strong> Never send marketing without recorded consent. Respect
            opt-in, opt-out, STOP, UNSUBSCRIBE, BLOCK commands.
          </p>
        </div>
      </div>

      <UpdateConsentDialog open={open} onOpenChange={setOpen} onUpdated={onUpdated} />
    </div>
  );
}

function UpdateConsentDialog({
  open,
  onOpenChange,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [studentId, setStudentId] = React.useState("");
  const [channel, setChannel] = React.useState("WHATSAPP");
  const [consentStatus, setConsentStatus] = React.useState("OPTED_IN");
  const [evidenceReference, setEvidenceReference] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!studentId.trim()) {
      toast({ title: "Student or lead ID required", variant: "destructive" });
      return;
    }
    if (["OPTED_IN", "OPTED_OUT"].includes(consentStatus) && evidenceReference.trim().length < 4) {
      toast({ title: "Evidence reference required", description: "Add a record reference or evidence note for an opt-in/opt-out entry.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/omnichannel/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId.trim(),
          channel,
          consentStatus,
          evidenceReference: evidenceReference.trim(),
        }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Failed to update consent");
      toast({
        title: "Manual consent record saved",
        description: result?.message || `Status saved as ${consentStatus}; evidence was not independently verified.`,
      });
      onOpenChange(false);
      setStudentId("");
      setEvidenceReference("");
      onUpdated();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="ShieldCheck" className="size-5 text-[#0B5ED7]" />
            Update Consent
          </DialogTitle>
          <DialogDescription>
            Manual administrator entry only. STOP/UNSUBSCRIBE provider ingestion is not configured; recorded evidence is not independently verified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[#0F172A]">Student / Lead ID *</Label>
            <Input className="h-11 font-mono" placeholder="ALO-S-XXXXX" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#0F172A]">Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PHONE">Phone</SelectItem>
                  <SelectItem value="FACEBOOK">Facebook</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#0F172A]">Consent Status</Label>
              <Select value={consentStatus} onValueChange={setConsentStatus}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPTED_IN">Opted In</SelectItem>
                  <SelectItem value="OPTED_OUT">Opted Out</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#0F172A]">Evidence note or record reference</Label>
            <Input className="h-11" maxLength={250} placeholder="Required for opt-in or opt-out" value={evidenceReference} onChange={(e) => setEvidenceReference(e.target.value)} />
            <p className="text-xs text-[#64748B]">Stored in the audit trail as a manual assertion; it does not prove provider-side consent.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="h-11 bg-[#C2410C] text-white hover:bg-[#C2410C]/90" disabled={submitting} onClick={submit}>
            {submitting ? (
              <><Icon name="Loader2" className="size-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              <><Icon name="Save" className="size-4 mr-2" /> Save Consent</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Document Classification Tab
// ─────────────────────────────────────────────────────────────────────────────

function AiClassificationTab({
  classifications,
  onClassified,
}: {
  classifications: AiClassification[];
  onClassified: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const avgConfidence =
    classifications.length > 0
      ? classifications.reduce((sum, c) => sum + (c.confidence || 0), 0) / classifications.length
      : 0;
  const humanVerified = classifications.filter((c) => c.humanVerified).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="badge-text uppercase tracking-wide text-[#64748B]">Classified</p>
            <Icon name="Sparkles" className="size-5 text-[#0B5ED7]" />
          </div>
          <p className="mt-1 text-3xl font-bold text-[#0F172A] tabular-nums">{classifications.length}</p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="badge-text uppercase tracking-wide text-[#64748B]">Avg Confidence</p>
            <Icon name="Target" className="size-5 text-[#15803D]" />
          </div>
          <p className="mt-1 text-3xl font-bold text-[#15803D] tabular-nums">
            {Math.round(avgConfidence * 100)}%
          </p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="badge-text uppercase tracking-wide text-[#64748B]">Human Verified</p>
            <Icon name="BadgeCheck" className="size-5 text-[#C2410C]" />
          </div>
          <p className="mt-1 text-3xl font-bold text-[#C2410C] tabular-nums">{humanVerified}</p>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="badge-text uppercase tracking-wide text-[#64748B]">Not human verified</p>
            <Icon name="Wand2" className="size-5 text-violet-600" />
          </div>
          <p className="mt-1 text-3xl font-bold text-violet-600 tabular-nums">
            {classifications.length - humanVerified}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="card-title text-[#0F172A]">AI Document Classification</p>
          <p className="body-text text-[#64748B]">Classification is disabled until an approved private OCR/AI pipeline and data-retention controls are configured.</p>
        </div>
        <Button className="h-12" variant="outline" disabled title="OCR/AI pipeline is not configured">
          <Icon name="ShieldAlert" className="size-4 mr-2" />
          Not configured
        </Button>
      </div>

      {classifications.length === 0 ? (
        <EmptyState
          icon="Sparkles"
          title="No classifications yet"
          description="Upload a document and run AI classification to see results here."
        />
      ) : (
        <SectionCard title={`Classification Log (${classifications.length})`} icon="Sparkles">
          <div className="max-h-[40rem] overflow-auto alo-scroll">
            <Table>
              <TableHeader className="sticky top-0 bg-[#F8FAFC] z-10">
                <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                  <TableHead className="text-[#64748B]">Document</TableHead>
                  <TableHead className="text-[#64748B]">Detected Type</TableHead>
                  <TableHead className="text-[#64748B]">Confidence</TableHead>
                  <TableHead className="text-[#64748B]">Human Verified</TableHead>
                  <TableHead className="text-[#64748B] text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classifications.map((c) => (
                  <TableRow key={c.id} className="border-[#E2E8F0]">
                    <TableCell className="font-mono text-xs text-[#0F172A]">{c.documentId}</TableCell>
                    <TableCell>
                      <Badge className="bg-[#EFF6FF] text-[#0B5ED7] border border-[#2563EB]/30">
                        {c.detectedType}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.round((c.confidence || 0) * 100)} className="h-2 flex-1" />
                        <span className="badge-text tabular-nums text-[#0F172A]">
                          {Math.round((c.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.humanVerified ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <Icon name="Check" className="size-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-200 text-amber-700">
                          <Icon name="Clock" className="size-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="body-text text-[#0F172A]">{fmtDate(c.createdAt)}</p>
                      <p className="badge-text text-[#64748B]">{fmtTime(c.createdAt)}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {/* Document types reference */}
      <SectionCard title="Supported Document Types (27)" icon="FileText">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {DOC_TYPES_27.map((t) => (
            <div
              key={t.code}
              className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2"
            >
              <Icon name="FileCheck2" className="size-3.5 text-[#0B5ED7] shrink-0" />
              <div className="min-w-0">
                <p className="badge-text font-mono text-[#0F172A] truncate">{t.code}</p>
                <p className="text-[11px] text-[#64748B] truncate">{t.label}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* OCR extraction note */}
      <div className="rounded-xl border border-violet-200 bg-violet-50/40 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Icon name="ScanText" className="size-4 mt-0.5 text-violet-600 shrink-0" />
          <p className="body-text text-[#0F172A]">
            <strong>OCR extraction:</strong> AI extracts Full Name, DOB, Gender, Nationality,
            Passport Number, Issue/Expiry Date, Institution, CGPA, Band Score, Account Number, Bank
            Name. Auto-fills student profile. <strong>Never overwrites manually verified data</strong>{" "}
            without approval.
          </p>
        </div>
      </div>

      <RunClassificationDialog open={open} onOpenChange={setOpen} onClassified={onClassified} />
    </div>
  );
}

function RunClassificationDialog({
  open,
  onOpenChange,
  onClassified,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onClassified: () => void;
}) {
  const { toast } = useToast();
  const [documentId, setDocumentId] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [documentText, setDocumentText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<{
    detectedType: string;
    confidence: number;
    extractedData: Record<string, unknown>;
    message?: string;
  } | null>(null);

  const submit = async () => {
    if (!documentId.trim() || !fileName.trim()) {
      toast({ title: "Document ID and filename required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/omnichannel/document-classification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: documentId.trim(),
          fileName: fileName.trim(),
          documentText: documentText.trim(),
        }),
      });
      if (!res.ok) throw new Error("Classification failed");
      const json = await res.json();
      setResult({
        detectedType: json.detectedType || "UNKNOWN",
        confidence: json.confidence || 0,
        extractedData: json.extractedData || safeParse(json.classification?.extractedData) || {},
        message: json.message,
      });
      toast({
        title: "Classification complete",
        description: json.message || `Detected: ${json.detectedType}`,
      });
      onClassified();
    } catch (err) {
      toast({
        title: "Classification failed",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDocumentId("");
    setFileName("");
    setDocumentText("");
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Sparkles" className="size-5 text-[#0B5ED7]" />
            Run AI Document Classification
          </DialogTitle>
          <DialogDescription>
            AI will classify the document into one of 27 supported types and extract data via OCR.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#0F172A]">Document ID *</Label>
              <Input className="h-11 font-mono" placeholder="doc-uuid" value={documentId} onChange={(e) => setDocumentId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#0F172A]">File Name *</Label>
              <Input className="h-11" placeholder="passport_scan.pdf" value={fileName} onChange={(e) => setFileName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#0F172A]">OCR Text (optional)</Label>
            <Textarea
              className="min-h-[100px]"
              placeholder="Paste extracted OCR text or leave blank to classify by filename…"
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
            />
          </div>

          {result && (
            <div className="rounded-xl border border-[#0B5ED7]/30 bg-[#EFF6FF]/40 p-4">
              <div className="flex items-center justify-between">
                <p className="card-title text-[#0F172A]">AI Result</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#0B5ED7] text-white">{result.detectedType}</Badge>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {Math.round(result.confidence * 100)}% confidence
                  </Badge>
                </div>
              </div>
              <div className="mt-2">
                <MiniBar value={result.confidence * 100} max={100} color="#15803D" />
              </div>
              {Object.keys(result.extractedData).length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {Object.entries(result.extractedData).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5">
                      <p className="badge-text uppercase tracking-wide text-[#64748B]">{k}</p>
                      <p className="body-text text-[#0F172A] truncate">
                        {v === null || v === undefined ? "—" : String(v)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 badge-text text-[#64748B]">
                <Icon name="ShieldAlert" className="size-3 inline mr-1" />
                Verify extracted data before applying to student profile.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={reset}>
            Close
          </Button>
          <Button
            className="h-11 bg-[#C2410C] text-white hover:bg-[#C2410C]/90"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? (
              <><Icon name="Loader2" className="size-4 mr-2 animate-spin" /> Classifying…</>
            ) : (
              <><Icon name="Sparkles" className="size-4 mr-2" /> Run Classification</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default OmnichannelCommunicationCenter;
