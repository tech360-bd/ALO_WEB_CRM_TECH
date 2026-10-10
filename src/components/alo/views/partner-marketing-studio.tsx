"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { usePortalStore } from "@/lib/stores/portal-store";
import {
  Icon,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
  Progress,
} from "@/components/alo/shared";
import { SensitiveField } from "@/components/alo/privacy-mode";
import { fmtDate, timeAgo, COUNTRIES, type ViewKey } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// Types — matches the /api/partner-admin/marketing response shape
// ---------------------------------------------------------------------------

type Partner = {
  id: string;
  name?: string;
  fullName?: string;
  email: string;
  role: string;
};

type MarketingQuota = {
  id?: string;
  partnerId: string;
  monthlyImageLimit: number;
  monthlyVideoLimit: number;
  videoDurationLimitSeconds: number;
  autoPublishAllowed: boolean;
  requiresAloApproval: boolean;
};

type MarketingUsage = {
  id?: string;
  partnerId: string;
  monthYear: string;
  imagesUsed: number;
  videosUsed: number;
  ideasSubmitted: number;
  postsScheduled: number;
  postsPublished: number;
};

type MarketingRequest = {
  id: string;
  partnerId: string;
  requestedBy: string;
  idea: string;
  country?: string | null;
  university?: string | null;
  course?: string | null;
  intake?: string | null;
  targetAudience?: string | null;
  language?: string | null;
  cta?: string | null;
  platform: string;
  preferredStyle?: string | null;
  facebookCaption?: string | null;
  instagramCaption?: string | null;
  hashtags?: string | null;
  imagePrompt?: string | null;
  videoPrompt?: string | null;
  videoScript?: string | null;
  reelCaption?: string | null;
  ctaText?: string | null;
  assetUrl?: string | null;
  publishedUrl?: string | null;
  approvalStatus: string;
  rejectionReason?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
};

type SocialAccount = {
  id: string;
  partnerId: string;
  platform: string;
  accountName: string;
  accessTokenMasked?: string | null;
  tokenExpiry?: string | null;
  connectionStatus: string;
  lastSync?: string | null;
  approvedByAlo: boolean;
  status: string;
  createdAt: string;
};

type QuotaData = {
  scope?: 'alo_review';
  quota: MarketingQuota | null;
  usage: MarketingUsage | null;
  requests: MarketingRequest[];
  socialAccounts: SocialAccount[];
  capabilities?: { socialConnections: boolean; scheduling: boolean; publishing: boolean };
  notices?: string[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORMS = [
  { value: "FACEBOOK", label: "Facebook", icon: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram", icon: "Instagram" },
  { value: "LINKEDIN", label: "LinkedIn", icon: "Linkedin" },
];

const SUPPORTED_INTAKES = ["January 2027", "May 2027", "September 2027", "January 2028"];

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Bangla", label: "Bangla" },
  { value: "Bangla+English", label: "Banglish (Bangla + English)" },
];

const STYLES = [
  { value: "Professional", label: "Professional" },
  { value: "Energetic", label: "Energetic" },
  { value: "Educational", label: "Educational" },
  { value: "Emotional", label: "Emotional" },
];

const MARKETING_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  SCHEDULED: "bg-sky-100 text-sky-700",
  PUBLISHED: "bg-[#2563EB]/15 text-[#2563EB]",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SCHEDULED: "Scheduled (legacy)",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
};

const WORKFLOW_STEPS = [
  { label: "Idea", icon: "Lightbulb" },
  { label: "AI or grounded draft", icon: "Sparkles" },
  { label: "Image / video generation", icon: "Clapperboard" },
  { label: "Compliance review", icon: "ShieldCheck" },
  { label: "Submit for approval", icon: "UserCheck" },
  { label: "ALO review (when required)", icon: "Building" },
  { label: "Scheduling unavailable", icon: "CalendarClock" },
  { label: "Publishing unavailable", icon: "Send" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParseHashtags(s?: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter(Boolean) : [];
  } catch {
    return s.split(/[\s,]+/).filter(Boolean);
  }
}

function quotaColor(pct: number): string {
  if (pct >= 80) return "#e11d48"; // rose-600
  if (pct >= 60) return "#f59e0b"; // amber-500
  return "#10b981"; // emerald-500
}

function quotaBadgeClass(pct: number): string {
  if (pct >= 80) return "bg-rose-100 text-rose-700";
  if (pct >= 60) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

// ---------------------------------------------------------------------------
// Quota bar
// ---------------------------------------------------------------------------

function QuotaBar({ label, used, limit, icon, hint }: { label: string; used: number; limit: number; icon: string; hint: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const remaining = Math.max(0, limit - used);
  const color = quotaColor(pct);
  return (
    <Card className="rounded-2xl border-2 border-[#2563EB]/20">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#2563EB]">
              <Icon name={icon} className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
            </div>
          </div>
          <Badge className={quotaBadgeClass(pct)}>{pct}% used</Badge>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {used}
              <span className="text-sm font-medium text-muted-foreground">/{limit}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              <strong className="tabular-nums" style={{ color }}>{remaining}</strong> remaining
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

function CopyButton({ text, label }: { text: string; label: string }) {
  const { toast } = useToast();
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={() => {
        if (!text) return;
        navigator.clipboard?.writeText(text);
        toast({ title: `${label} copied`, description: "Content is now on your clipboard." });
      }}
    >
      <Icon name="Copy" className="size-3" />
      Copy
    </Button>
  );
}

// ---------------------------------------------------------------------------
// AI Content Card
// ---------------------------------------------------------------------------

function AiContentCard({
  title,
  icon,
  content,
  action,
}: {
  title: string;
  icon: string;
  content?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-2 border-[#2563EB]/15">
      <CardContent className="pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#e8f0fb] text-[#2563EB]">
              <Icon name={icon} className="size-3.5" />
            </div>
            <p className="text-sm font-semibold text-[#2563EB]">{title}</p>
          </div>
          {action}
        </div>
        {content ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{content}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Not generated yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PartnerMarketingStudio() {
  const { toast } = useToast();
  const user = usePortalStore((state) => state.user);
  const roleNames = (user?.roles || []).map((role) => role.name.toUpperCase());
  const userType = String(user?.userType || '').toUpperCase();
  const isAloStaff = ['ADMIN', 'SUPER_ADMIN'].includes(userType) || roleNames.some((role) => ['ADMIN', 'SUPER_ADMIN'].includes(role));
  const [data, setData] = React.useState<QuotaData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [tab, setTab] = React.useState(() => isAloStaff ? "history" : "create");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

  // Campaign form state
  const [idea, setIdea] = React.useState("");
  const [country, setCountry] = React.useState("UK");
  const [university, setUniversity] = React.useState("");
  const [course, setCourse] = React.useState("");
  const [intake, setIntake] = React.useState("January 2027");
  const [targetAudience, setTargetAudience] = React.useState("Bangladeshi students");
  const [language, setLanguage] = React.useState("English");
  const [cta, setCta] = React.useState("Book a Consultation");
  const [platform, setPlatform] = React.useState("FACEBOOK");
  const [preferredStyle, setPreferredStyle] = React.useState("Professional");

  // Generation state
  const [generating, setGenerating] = React.useState(false);
  const [currentRequest, setCurrentRequest] = React.useState<MarketingRequest | null>(null);
  const [assetLoading, setAssetLoading] = React.useState<string | null>(null);
  const [workflowLoading, setWorkflowLoading] = React.useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`/api/partner-admin/marketing`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || `HTTP ${res.status}`);
      setData(json as QuotaData);
      if (json.scope === 'alo_review') setTab('history');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again later.";
      setLoadError(msg);
      setData(null);
      toast({ title: "Couldn't load marketing studio", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => { load(); }, [load]);

  const quota = data?.quota;
  const usage = data?.usage;
  const requests = data?.requests ?? [];
  const socialAccounts = data?.socialAccounts ?? [];

  const imageLimit = quota?.monthlyImageLimit ?? 15;
  const videoLimit = quota?.monthlyVideoLimit ?? 10;
  const imagesUsed = usage?.imagesUsed ?? 0;
  const videosUsed = usage?.videosUsed ?? 0;
  const videoDurationLimit = quota?.videoDurationLimitSeconds ?? 30;
  const autoPublishAllowed = quota?.autoPublishAllowed ?? false;
  const requiresAloApproval = quota?.requiresAloApproval ?? true;
  const isPartnerSuperAdmin = String(user?.partnerRole || '').toUpperCase() === 'PARTNER_SUPER_ADMIN' || roleNames.includes('PARTNER_SUPER_ADMIN');
  const isMarketingAssistant = String(user?.partnerRole || '').toUpperCase() === 'PARTNER_MARKETING_ASSISTANT' || roleNames.includes('PARTNER_MARKETING_ASSISTANT');
  const isAloReviewMode = data?.scope === 'alo_review';
  const canCreateCampaign = Boolean(data && (isPartnerSuperAdmin || isMarketingAssistant));
  const canReviewCampaign = isAloStaff || (isPartnerSuperAdmin && !requiresAloApproval);
  const schedulerAvailable = data?.capabilities?.scheduling === true;
  const publisherAvailable = data?.capabilities?.publishing === true;
  const connectedAccounts = socialAccounts.filter((account) => account.connectionStatus.toUpperCase() === 'CONNECTED' && account.approvedByAlo);

  const filteredRequests = React.useMemo(() => {
    if (statusFilter === "ALL") return requests;
    return requests.filter((r) => r.approvalStatus === statusFilter);
  }, [requests, statusFilter]);

  // --- Generate AI content ---
  async function generateContent() {
    if (!idea.trim()) {
      toast({ title: "Describe your campaign", description: "Add a marketing idea before generating AI content.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`/api/partner-admin/marketing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: undefined, // backend finds first PARTNER
          idea: idea.trim(),
          country,
          university: university.trim() || undefined,
          course: course.trim() || undefined,
          intake,
          targetAudience,
          language,
          cta,
          platform,
          preferredStyle,
          requestedBy: undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "AI generation failed", description: json.error || json.message || "Please try again.", variant: "destructive" });
        return;
      }
      setCurrentRequest(json.request as MarketingRequest);
      toast({ title: "AI content ready", description: json.message || "Review the generated captions, prompts, and scripts." });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error.";
      toast({ title: "AI generation failed", description: msg, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  // --- Generate image / video (PATCH with action) ---
  async function runAssetAction(action: "generate_image" | "generate_video") {
    if (!currentRequest) return;
    setAssetLoading(action);
    try {
      const res = await fetch(`/api/partner-admin/marketing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentRequest.id, action, partnerId: undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          toast({
            title: action === "generate_image" ? "Monthly image quota finished" : "Monthly video quota finished",
            description: json.error || "Request extra quota from ALO Education.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Generation failed", description: json.error || "Please try again.", variant: "destructive" });
        }
        return;
      }
      setCurrentRequest(json.request as MarketingRequest);
      toast({
        title: action === "generate_image" ? "Image generated" : "Video generated",
        description: json.message || "Asset ready. Submit it separately when it is ready for review.",
      });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error.";
      toast({ title: "Generation failed", description: msg, variant: "destructive" });
    } finally {
      setAssetLoading(null);
    }
  }

  // --- Workflow actions ---
  async function runWorkflowAction(
    action: "approve" | "publish" | "reject" | "submit",
    options: { rejectionReason?: string } = {},
  ): Promise<boolean> {
    if (!currentRequest) return false;
    setWorkflowLoading(action);
    try {
      const body: Record<string, unknown> = { id: currentRequest.id, action, partnerId: currentRequest.partnerId };
      if (options.rejectionReason) body.rejectionReason = options.rejectionReason;
      const res = await fetch(`/api/partner-admin/marketing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Action failed", description: json.error || "Please try again.", variant: "destructive" });
        return false;
      }
      setCurrentRequest(json.request as MarketingRequest);
      toast({ title: "Action completed", description: json.message });
      await load();
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error.";
      toast({ title: "Action failed", description: msg, variant: "destructive" });
      return false;
    } finally {
      setWorkflowLoading(null);
    }
  }

  async function submitForApproval() {
    await runWorkflowAction("submit");
  }

  async function confirmReject() {
    const completed = await runWorkflowAction("reject", { rejectionReason: rejectionReason.trim() });
    if (completed) {
      setRejectOpen(false);
      setRejectionReason("");
    }
  }

  function openCampaignFromHistory(r: MarketingRequest) {
    setCurrentRequest(r);
    setTab("create");
    setIdea(r.idea);
    setCountry(r.country || "UK");
    setUniversity(r.university || "");
    setCourse(r.course || "");
    setIntake(r.intake || "January 2027");
    setTargetAudience(r.targetAudience || "Bangladeshi students");
    setLanguage(r.language || "English");
    setCta(r.cta || "Book a Consultation");
    setPlatform(r.platform);
    setPreferredStyle(r.preferredStyle || "Professional");
    toast({ title: "Campaign fields loaded", description: "Generating from these values creates a new draft; it does not edit the saved campaign." });
  }

  async function archiveCampaign(r: MarketingRequest) {
    if (r.approvalStatus === "PUBLISHED") return;
    if (!window.confirm(`Archive this campaign? Its generated content will remain in the audit/history record.`)) return;
    setWorkflowLoading("archive");
    try {
      const res = await fetch("/api/partner-admin/marketing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, action: "archive", partnerId: r.partnerId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Archive failed", description: json.error || "Please try again.", variant: "destructive" });
        return;
      }
      if (currentRequest?.id === r.id) setCurrentRequest(json.request as MarketingRequest);
      toast({ title: "Campaign archived", description: json.message });
      await load();
    } catch (e: unknown) {
      toast({ title: "Archive failed", description: e instanceof Error ? e.message : "Network error.", variant: "destructive" });
    } finally {
      setWorkflowLoading(null);
    }
  }

  const hashtags = safeParseHashtags(currentRequest?.hashtags);
  const canPublish = Boolean(
    currentRequest &&
      publisherAvailable &&
      isPartnerSuperAdmin &&
      autoPublishAllowed &&
      currentRequest.approvalStatus === "APPROVED" &&
      connectedAccounts.some((account) => account.platform.toUpperCase() === currentRequest.platform.toUpperCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Marketing Studio"
        icon="Megaphone"
        subtitle="Create partner-scoped marketing drafts and track monthly media quota. Social publishing is not connected in this deployment."
        action={
          <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent("alo-navigate", { detail: { view: "partner-admin-dashboard" as ViewKey } }))}>
            <Icon name="ArrowLeft" className="size-4" />
            Back to Dashboard
          </Button>
        }
      />

      <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {isAloReviewMode
          ? 'ALO review queue: pending campaigns from partner tenants are listed below. Approvals and rejections are persisted; reviewed campaigns leave this queue.'
          : 'Draft creation, media generation (when a provider returns a real asset), submission, and review are persisted. Partner social-account OAuth, scheduled delivery, and publishing are not configured here; those actions are disabled and no external post is simulated.'}
        {!canCreateCampaign && !isAloStaff && <span className="block mt-1">Partner Super Admin or Marketing Assistant access is required to create or submit campaigns.</span>}
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>Marketing Studio data is unavailable: {loadError}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void load()} disabled={loading}>Retry</Button>
        </div>
      )}

      {data?.notices?.map((notice) => (
        <div key={notice} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">{notice}</div>
      ))}

      {/* Quota bar — prominent */}
      {loading ? (
        <LoadingGrid count={2} />
      ) : data && !isAloReviewMode ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <QuotaBar label="Image Quota" icon="Image" used={imagesUsed} limit={imageLimit} hint="AI marketing visuals" />
            <QuotaBar label="Video Quota" icon="Video" used={videosUsed} limit={videoLimit} hint={`Max ${videoDurationLimit}s per video`} />
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-[#2563EB]/15 bg-[#e8f0fb]/40 px-4 py-2.5 text-xs text-foreground/80">
            <Icon name="Info" className="mt-0.5 size-3.5 shrink-0 text-[#2563EB]" />
            <p>
              <strong>Video max duration: {videoDurationLimit} seconds.</strong> Quota resets at the start of each UTC calendar month. Color coding: green &lt;60%, amber 60-80%, red &gt;80%.
              {requiresAloApproval && " ALO approval is required before publishing."}
            </p>
          </div>
        </>
      ) : null}

      {/* Workflow visualization */}
      <SectionCard title="Marketing Workflow" description="Draft, media generation, submission, and review are persisted; external social publishing is unavailable" icon="Workflow">
        <ScrollArea className="w-full">
          <div className="flex min-w-[760px] items-center gap-1 overflow-x-auto pb-2">
            {WORKFLOW_STEPS.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1.5 rounded-xl border border-[#2563EB]/15 bg-white px-3 py-2.5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-alo-gradient text-white">
                    <Icon name={step.icon} className="size-4" />
                  </div>
                  <p className="text-center text-[11px] font-semibold text-foreground">{step.label}</p>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <Icon name="ChevronRight" className="size-4 shrink-0 text-[#2563EB]/40" />
                )}
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </SectionCard>

      {/* Compliance rules card */}
      <SectionCard title="Compliance Rules" description="All AI content must follow ALO Education brand guidelines" icon="ShieldCheck">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border-2 border-[#2563EB]/15 bg-[#e8f0fb]/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="Sparkles" className="size-4 text-[#2563EB]" />
              <p className="text-sm font-semibold text-[#2563EB]">AI Content MUST</p>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-foreground/85">
              <li className="flex items-start gap-1.5"><Icon name="Check" className="mt-0.5 size-3 shrink-0 text-emerald-600" />Follow ALO brand voice: professional, encouraging, student-focused</li>
              <li className="flex items-start gap-1.5"><Icon name="Check" className="mt-0.5 size-3 shrink-0 text-emerald-600" />Review that each draft includes a clear, accurate call-to-action (CTA)</li>
              <li className="flex items-start gap-1.5"><Icon name="Check" className="mt-0.5 size-3 shrink-0 text-emerald-600" />Review for originality; automated plagiarism detection is not provided</li>
            </ul>
          </div>
          <div className="rounded-xl border-2 border-rose-200 bg-rose-50/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="Ban" className="size-4 text-rose-600" />
              <p className="text-sm font-semibold text-rose-700">AI Content MUST NOT</p>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-rose-800/85">
              <li className="flex items-start gap-1.5"><Icon name="X" className="mt-0.5 size-3 shrink-0 text-rose-600" />Promise visa or admission guarantees</li>
              <li className="flex items-start gap-1.5"><Icon name="X" className="mt-0.5 size-3 shrink-0 text-rose-600" />Use misleading claims or false testimonials</li>
              <li className="flex items-start gap-1.5"><Icon name="X" className="mt-0.5 size-3 shrink-0 text-rose-600" />Exceed monthly limits: {imageLimit} images, {videoLimit} videos ({videoDurationLimit}s max)</li>
            </ul>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2.5 text-xs text-amber-800">
          <Icon name="AlertTriangle" className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <p>
            {requiresAloApproval ? <><strong>ALO review is required</strong> after partner submission.</> : <><strong>Partner Super Admin review</strong> applies; ALO review is waived by the package setting.</>}
            {' '}Social publishing remains unavailable until a connection and publisher are configured.
          </p>
        </div>
      </SectionCard>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="h-auto flex-wrap gap-1">
            {!isAloReviewMode && (
              <TabsTrigger value="create" className="gap-1.5">
                <Icon name="Sparkles" className="size-4" />
                Create Campaign
              </TabsTrigger>
            )}
            <TabsTrigger value="history" className="gap-1.5">
              <Icon name="History" className="size-4" />
              {isAloReviewMode ? 'ALO Review Queue' : 'Campaign History'}
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{requests.length}</Badge>
            </TabsTrigger>
            {!isAloReviewMode && (
              <TabsTrigger value="social" className="gap-1.5">
                <Icon name="Share2" className="size-4" />
                Social Connections
              </TabsTrigger>
            )}
          </TabsList>
        </ScrollArea>

        {/* CREATE CAMPAIGN */}
        <TabsContent value="create" className="mt-4">
          {loading ? (
            <LoadingGrid count={3} />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Left: Campaign idea form */}
              <div className="lg:col-span-1">
                <SectionCard title="Campaign Idea" description="Describe what you want to promote" icon="Lightbulb">
                  {!canCreateCampaign && (
                    <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      {isAloStaff ? 'Select a partner in an ALO review workspace to manage cross-partner campaigns.' : 'Your partner role is read-only for Marketing Studio.'}
                    </p>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mkt-idea">Marketing Idea</Label>
                      <Textarea
                        id="mkt-idea"
                        rows={4}
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="e.g. Promote our IELTS mock test for the January 2027 UK intake. Target students in Dhaka who are preparing for an English exam."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Intake</Label>
                        <Select value={intake} onValueChange={setIntake}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_INTAKES.map((supportedIntake) => <SelectItem key={supportedIntake} value={supportedIntake}>{supportedIntake}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mkt-uni">University</Label>
                      <Input id="mkt-uni" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. University of Greenwich" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mkt-course">Course</Label>
                      <Input id="mkt-course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. MSc Data Science" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mkt-aud">Target Audience</Label>
                      <Input id="mkt-aud" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Bangladeshi students" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Platform</Label>
                        <Select value={platform} onValueChange={setPlatform}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="mkt-cta">CTA</Label>
                        <Input id="mkt-cta" value={cta} onChange={(e) => setCta(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select value={preferredStyle} onValueChange={setPreferredStyle}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-[#F97316] text-white hover:bg-[#F97316]/90 h-12"
                      disabled={generating || !canCreateCampaign}
                      onClick={generateContent}
                    >
                      {generating ? (
                        <>
                          <Icon name="Loader2" className="size-4 animate-spin" />
                          AI is generating your marketing content...
                        </>
                      ) : (
                        <>
                          <Icon name="Sparkles" className="size-4" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>
                </SectionCard>
              </div>

              {/* Right: AI-generated content preview */}
              <div className="lg:col-span-2">
                <SectionCard
                  title="AI-Generated Content"
                  description="Review, edit, generate assets, and submit for approval"
                  icon="Sparkles"
                  action={
                    currentRequest ? (
                      <Badge className={MARKETING_STATUS_COLORS[currentRequest.approvalStatus] ?? "bg-slate-100 text-slate-700"}>
                        {STATUS_LABELS[currentRequest.approvalStatus] ?? currentRequest.approvalStatus}
                      </Badge>
                    ) : null
                  }
                >
                  {!currentRequest ? (
                    <EmptyState
                      icon="Sparkles"
                      title="No AI content yet"
                      description="Submit your campaign idea to generate AI captions, hashtags, image and video prompts, and a 30-second video script."
                    />
                  ) : generating ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-alo-gradient text-white alo-shadow">
                        <Icon name="Sparkles" className="size-8 animate-pulse" />
                      </div>
                      <p className="mt-4 font-semibold text-foreground">AI is writing your content...</p>
                      <p className="mt-1 text-sm text-muted-foreground">Generating captions, hashtags, prompts, and scripts.</p>
                      <div className="mt-4 flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="size-2 rounded-full bg-[#2563EB]"
                            style={{ animation: `pulse 1s ease-in-out ${i * 0.15}s infinite` }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AiContentCard
                        title="Facebook Caption"
                        icon="Facebook"
                        content={currentRequest.facebookCaption}
                        action={<CopyButton text={currentRequest.facebookCaption || ""} label="Facebook caption" />}
                      />
                      <AiContentCard
                        title="Instagram Caption"
                        icon="Instagram"
                        content={currentRequest.instagramCaption}
                        action={<CopyButton text={currentRequest.instagramCaption || ""} label="Instagram caption" />}
                      />
                      <Card className="rounded-2xl border-2 border-[#2563EB]/15">
                        <CardContent className="pt-4">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-[#e8f0fb] text-[#2563EB]">
                              <Icon name="Hash" className="size-3.5" />
                            </div>
                            <p className="text-sm font-semibold text-[#2563EB]">Hashtags</p>
                          </div>
                          {hashtags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {hashtags.map((h, i) => (
                                <Badge key={i} variant="outline" className="border-[#2563EB]/20 bg-[#e8f0fb]/40 font-mono text-[#2563EB]">
                                  {h}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm italic text-muted-foreground">No hashtags generated.</p>
                          )}
                        </CardContent>
                      </Card>
                      <AiContentCard
                        title="Image Prompt"
                        icon="Image"
                        content={currentRequest.imagePrompt}
                        action={
                          <div className="flex items-center gap-2">
                            <CopyButton text={currentRequest.imagePrompt || ""} label="Image prompt" />
                            <Button
                              size="sm"
                              className="h-7 bg-[#2563EB] px-2 text-xs text-white hover:bg-[#2563EB]/90"
                              disabled={!canCreateCampaign || assetLoading === "generate_image" || !["DRAFT", "REJECTED"].includes(currentRequest.approvalStatus)}
                              onClick={() => runAssetAction("generate_image")}
                            >
                              {assetLoading === "generate_image" ? (
                                <><Icon name="Loader2" className="size-3 animate-spin" /> Generating...</>
                              ) : (
                                <><Icon name="Sparkles" className="size-3" /> Generate Image</>
                              )}
                            </Button>
                          </div>
                        }
                      />
                      <AiContentCard
                        title="Video Prompt"
                        icon="Video"
                        content={currentRequest.videoPrompt}
                        action={
                          <div className="flex items-center gap-2">
                            <CopyButton text={currentRequest.videoPrompt || ""} label="Video prompt" />
                            <Button
                              size="sm"
                              className="h-7 bg-[#2563EB] px-2 text-xs text-white hover:bg-[#2563EB]/90"
                              disabled={!canCreateCampaign || assetLoading === "generate_video" || !["DRAFT", "REJECTED"].includes(currentRequest.approvalStatus)}
                              onClick={() => runAssetAction("generate_video")}
                            >
                              {assetLoading === "generate_video" ? (
                                <><Icon name="Loader2" className="size-3 animate-spin" /> Generating...</>
                              ) : (
                                <><Icon name="Clapperboard" className="size-3" /> Generate Video</>
                              )}
                            </Button>
                          </div>
                        }
                      />
                      <AiContentCard
                        title="Video Script (30-second, scene-by-scene)"
                        icon="FileText"
                        content={currentRequest.videoScript}
                        action={<CopyButton text={currentRequest.videoScript || ""} label="Video script" />}
                      />
                      <AiContentCard
                        title="Reel Caption"
                        icon="Instagram"
                        content={currentRequest.reelCaption}
                        action={<CopyButton text={currentRequest.reelCaption || ""} label="Reel caption" />}
                      />
                      <AiContentCard
                        title="CTA Text"
                        icon="Megaphone"
                        content={currentRequest.ctaText}
                        action={<CopyButton text={currentRequest.ctaText || ""} label="CTA text" />}
                      />
                      {currentRequest.approvalStatus === "REJECTED" && currentRequest.rejectionReason && (
                        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                          <strong>Review feedback:</strong> {currentRequest.rejectionReason}
                        </div>
                      )}

                      {/* Workflow action buttons */}
                      <Card className="rounded-2xl border-2 border-[#F97316]/30 bg-[#fdece4]/30">
                        <CardContent className="pt-4">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#F97316]">Workflow Actions</p>
                            <Badge className={MARKETING_STATUS_COLORS[currentRequest.approvalStatus] ?? "bg-slate-100 text-slate-700"}>
                              {STATUS_LABELS[currentRequest.approvalStatus] ?? currentRequest.approvalStatus}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-200 text-amber-700 hover:bg-amber-50"
                              disabled={!canCreateCampaign || workflowLoading === "submit" || !["DRAFT", "REJECTED"].includes(currentRequest.approvalStatus) || !currentRequest.assetUrl}
                              onClick={() => void submitForApproval()}
                              title={!currentRequest.assetUrl ? "Generate an image or video asset before submitting." : undefined}
                            >
                              {workflowLoading === "submit" ? <Icon name="Loader2" className="size-3.5 animate-spin" /> : <Icon name="Send" className="size-3.5" />}
                              Submit for review
                            </Button>
                            {canReviewCampaign && currentRequest.approvalStatus === "PENDING_APPROVAL" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                disabled={workflowLoading === "approve"}
                                onClick={() => void runWorkflowAction("approve")}
                              >
                                {workflowLoading === "approve" ? <Icon name="Loader2" className="size-3.5 animate-spin" /> : <Icon name="Check" className="size-3.5" />}
                                Approve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-sky-200 text-sky-700"
                              disabled={!schedulerAvailable || currentRequest.approvalStatus !== "APPROVED" || !currentRequest.assetUrl}
                              title="No scheduled publisher is configured in this deployment."
                            >
                              <Icon name="CalendarClock" className="size-3.5" />
                              Scheduling unavailable
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                              disabled={!canPublish || workflowLoading === "publish"}
                              onClick={() => void runWorkflowAction("publish")}
                              title="Publishing requires an active, approved social connection and publisher."
                            >
                              {workflowLoading === "publish" ? <Icon name="Loader2" className="size-3.5 animate-spin" /> : <Icon name="Send" className="size-3.5" />}
                              Publish unavailable
                            </Button>
                            {canReviewCampaign && currentRequest.approvalStatus === "PENDING_APPROVAL" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                disabled={workflowLoading === "reject"}
                                onClick={() => setRejectOpen(true)}
                              >
                                <Icon name="X" className="size-3.5" />
                                Reject with reason
                              </Button>
                            )}
                          </div>
                          {!canReviewCampaign && currentRequest.approvalStatus === "PENDING_APPROVAL" && (
                            <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700">
                              <Icon name="AlertTriangle" className="mt-0.5 size-3 shrink-0" />
                              <span>{requiresAloApproval ? "ALO review is required; this partner workspace cannot approve the campaign." : "Partner Super Admin review is required."}</span>
                            </p>
                          )}
                          {!canPublish && (
                            <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700">
                              <Icon name="AlertTriangle" className="mt-0.5 size-3 shrink-0" />
                              <span>No partner social-account connection or publishing service is configured. Approval or package settings alone will not publish anything.</span>
                            </p>
                          )}
                          {currentRequest.assetUrl && (
                            <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                              <Icon name="CheckCircle2" className="size-3" />
                              <span>Generated media asset: <code className="font-mono break-all">{currentRequest.assetUrl}</code></span>
                            </p>
                          )}
                          {currentRequest.publishedUrl && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-[#2563EB]">
                              <Icon name="ExternalLink" className="size-3" />
                              <span>Published at <code className="font-mono">{currentRequest.publishedUrl}</code></span>
                            </p>
                          )}
                          {currentRequest.scheduledAt && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-sky-700">
                              <Icon name="CalendarClock" className="size-3" />
                              <span>Legacy schedule record — not dispatched: <strong>{fmtDate(currentRequest.scheduledAt)}</strong></span>
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>
          )}
        </TabsContent>

        {/* CAMPAIGN HISTORY */}
        <TabsContent value="history" className="mt-4">
          {loading ? (
            <LoadingGrid count={4} />
          ) : (
            <SectionCard
              title={isAloReviewMode ? 'ALO Review Queue' : 'Campaign History'}
              description={isAloReviewMode
                ? `${requests.length} campaign${requests.length === 1 ? '' : 's'} waiting for ALO review`
                : `${requests.length} campaign${requests.length === 1 ? '' : 's'} total`}
              icon={isAloReviewMode ? 'ShieldCheck' : 'History'}
              action={
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="SCHEDULED">Legacy scheduled</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              }
            >
              {filteredRequests.length === 0 ? (
                <EmptyState
                  icon={isAloReviewMode ? 'ShieldCheck' : 'History'}
                  title={isAloReviewMode ? 'No campaigns awaiting review' : 'No campaigns yet'}
                  description={isAloReviewMode
                    ? 'Submitted partner campaigns that require ALO review will appear here.'
                    : 'Generate your first marketing campaign in the Create Campaign tab.'}
                  action={!isAloReviewMode ? (
                    <Button className="bg-[#F97316] text-white hover:bg-[#F97316]/90 h-12" onClick={() => setTab("create")}>
                      <Icon name="Sparkles" className="size-4" />
                      Create Campaign
                    </Button>
                  ) : undefined}
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Idea</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead className="hidden lg:table-cell">Legacy schedule record</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="max-w-[280px]">
                            <p className="truncate text-sm font-medium text-foreground">{r.idea}</p>
                            {isAloReviewMode ? (
                              <span className="text-xs text-muted-foreground">Partner {r.partnerId} · {r.requestedBy || 'Unknown submitter'}</span>
                            ) : r.country ? (
                              <span className="text-xs text-muted-foreground">{r.country}{r.university ? ` • ${r.university}` : ""}</span>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-[#2563EB]/20 text-[#2563EB]">
                              {PLATFORM_LABELS[r.platform] ?? r.platform}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={MARKETING_STATUS_COLORS[r.approvalStatus] ?? "bg-slate-100 text-slate-700"}>
                              {STATUS_LABELS[r.approvalStatus] ?? r.approvalStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{timeAgo(r.createdAt)}</TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                            {r.scheduledAt ? `Not dispatched · ${fmtDate(r.scheduledAt)}` : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => openCampaignFromHistory(r)}>
                              <Icon name={isAloReviewMode ? 'ShieldCheck' : 'Eye'} className="size-3.5" />
                              {isAloReviewMode ? 'Review' : 'Open / reuse'}
                            </Button>
                            {!isAloReviewMode && r.approvalStatus !== "PUBLISHED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                disabled={!isPartnerSuperAdmin || workflowLoading === "archive" || r.approvalStatus === "ARCHIVED"}
                                onClick={() => void archiveCampaign(r)}
                                title={!isPartnerSuperAdmin ? "Partner Super Admin access required." : undefined}
                              >
                                <Icon name="Archive" className="size-3.5" />
                                Archive
                              </Button>
                            )}
                          </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </SectionCard>
          )}
        </TabsContent>

        {/* SOCIAL CONNECTIONS */}
        <TabsContent value="social" className="mt-4 space-y-4">
          <SectionCard title="Social account connections" description="No OAuth connection is available in this deployment" icon="Share2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {PLATFORMS.map((item) => (
                <Card key={item.value} className="rounded-2xl border-2 border-slate-200">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Icon name={item.icon} className="size-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{item.label}</p>
                          <p className="text-xs text-muted-foreground">Not connected</p>
                        </div>
                      </div>
                      <Badge variant="outline">Unavailable</Badge>
                    </div>
                    <Button className="mt-4 w-full" variant="outline" disabled title="No social OAuth endpoint or partner connection model is configured.">
                      <Icon name="Link" className="size-4" />
                      Connection unavailable
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Integration status" description="No social tokens or publishing jobs are configured" icon="ShieldCheck">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This workspace has no partner-scoped OAuth flow, social-token storage, scheduled publisher, or live publishing endpoint. No token is stored or claimed to be encrypted, and no external post can be sent from this screen. Package approval flags alone do not enable publishing.
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject campaign</DialogTitle>
            <DialogDescription>Provide a clear reason so the partner knows what must be corrected.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="marketing-rejection-reason">Rejection reason</Label>
            <Textarea
              id="marketing-rejection-reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Explain the issue to fix before resubmission."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button type="button" disabled={workflowLoading === "reject" || !rejectionReason.trim()} onClick={() => void confirmReject()}>
              {workflowLoading === "reject" ? <Icon name="Loader2" className="size-4 animate-spin" /> : <Icon name="X" className="size-4" />}
              Reject campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default PartnerMarketingStudio;
