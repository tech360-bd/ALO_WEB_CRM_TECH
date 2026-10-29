"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  PageHeader,
} from "@/components/alo/shared";
import { fmtDate } from "@/lib/alo-types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface GeneratedContent {
  id: string;
  content: string;
  contentType: string;
  topic: string;
  platform: string;
}

interface CalendarItem {
  id: string;
  title: string;
  platform: string;
  type: string;
  scheduledAt: string;
  status: string;
}

interface ReplyQueueItem {
  id: string;
  messageId: string;
  conversationId: string;
  channel: string;
  canEdit: boolean;
  fromName: string;
  originalMessage: string;
  suggestedReply: string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const CONTENT_TYPES = [
  { value: "Post Caption", label: "Post Caption" },
  { value: "Ad Copy", label: "Ad Copy" },
  { value: "Video Script", label: "Video Script" },
  { value: "Email Newsletter", label: "Email Newsletter" },
  { value: "Reel Script", label: "Reel Script" },
  { value: "Blog Post", label: "Blog Post" },
];

const PLATFORMS = [
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Email", label: "Email" },
];

const TONES = [
  { value: "Professional", label: "Professional" },
  { value: "Warm", label: "Warm" },
  { value: "Energetic", label: "Energetic" },
  { value: "Educational", label: "Educational" },
];

const PLATFORM_ICONS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "Linkedin",
  WHATSAPP: "MessageCircle",
  EMAIL: "Mail",
  Facebook: "Facebook",
  Instagram: "Instagram",
  LinkedIn: "Linkedin",
  WhatsApp: "MessageCircle",
  Email: "Mail",
};

const CONTENT_TYPE_ICONS: Record<string, string> = {
  POST: "FileText",
  REEL: "Video",
  STORY: "Bookmark",
  LIVE: "Radio",
  EMAIL: "Mail",
};

const STATUS_COLORS: Record<string, string> = {
  IDEA: "bg-slate-200 text-[var(--alo-body)]",
  DRAFT: "bg-amber-100 text-amber-700",
  PENDING_APPROVAL: "bg-violet-100 text-violet-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  SCHEDULED: "bg-sky-100 text-sky-700",
  PUBLISHED: "bg-[var(--alo-brand)]/15 text-[var(--alo-brand)]",
  CANCELLED: "bg-slate-200 text-slate-700",
  FAILED: "bg-red-100 text-red-700",
};

const CHANNEL_ICONS: Record<string, string> = {
  WHATSAPP: "MessageCircle",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  EMAIL: "Mail",
  WEBSITE_CHAT: "Globe",
  SMS: "Smartphone",
};

const BRAND_CHECKLIST = [
  { id: "brand-voice", label: "Follows ALO brand voice", icon: "Sparkles" },
  { id: "no-guarantees", label: "No visa/admission guarantees", icon: "ShieldCheck" },
  { id: "clear-cta", label: "Clear call-to-action", icon: "MousePointerClick" },
  { id: "platform-fit", label: "Appropriate for platform", icon: "Smartphone" },
];

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function BrandRulesBanner() {
  return (
    <Card className="rounded-2xl border-2 border-[var(--alo-cta)]/40 bg-[var(--alo-cta-soft)]/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-cta)] text-white">
            <Icon name="ShieldAlert" className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base text-[var(--alo-cta)]">
              Marketing review guardrails
            </CardTitle>
            <CardDescription className="text-xs">
              Staff review reminders only. This screen does not automatically enforce, approve, or publish content.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Icon name="CheckCircle2" className="size-4" /> AI content MUST
            </p>
            <ul className="space-y-1.5">
              {[
                "Use accurate, source-checked claims and identify information that may change.",
                "Never promise visa, admission, scholarship, or employment outcomes.",
                "Use a clear, optional next step without implying consent to marketing.",
                "Do not invent prices, deadlines, availability, or service guarantees.",
                "Refer case-specific eligibility or immigration questions for qualified human review.",
              ].map((rule) => (
                <li
                  key={rule}
                  className="flex items-start gap-2 text-xs text-foreground"
                >
                  <Icon name="Check" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:border-l md:border-[var(--alo-cta)]/20 md:pl-5">
            <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-red-700">
              <Icon name="XCircle" className="size-4" /> AI content must NOT
            </p>
            <ul className="space-y-1.5">
              {[
                "Treat AI output as verified fact or publish without required human approval.",
                "Share private student or lead information without an approved lawful basis.",
                "Claim an account, number, scheduler, or provider is connected without verification.",
                "Use false scarcity, invented deadlines, or unsupported service promises.",
                "Treat an enquiry or inbound message as promotional consent.",
              ].map((rule) => (
                <li
                  key={rule}
                  className="flex items-start gap-2 text-xs text-foreground"
                >
                  <Icon name="X" className="mt-0.5 size-3.5 shrink-0 text-red-600" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentGeneratorTab() {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    contentType: "Post Caption",
    topic: "",
    platform: "Facebook",
    tone: "Warm",
    targetAudience: "",
    keyMessage: "",
    cta: "",
  });
  const [generating, setGenerating] = React.useState(false);
  const [savingPlan, setSavingPlan] = React.useState(false);
  const [result, setResult] = React.useState<GeneratedContent | null>(null);
  const [planningAt, setPlanningAt] = React.useState("");
  const [checks, setChecks] = React.useState<Record<string, boolean>>({
    "brand-voice": false,
    "no-guarantees": false,
    "clear-cta": false,
    "platform-fit": false,
  });

  const setField = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleGenerate = async () => {
    const topic = form.topic.trim();
    if (!topic) {
      toast({ title: "Topic required", description: "Enter a topic before generating content.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch("/api/marketing/content?action=generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: form.contentType,
          topic,
          keywords: form.keyMessage.trim() ? [form.keyMessage.trim()] : [],
          language: "english",
          platform: form.platform.toLowerCase(),
          tone: form.tone.toLowerCase(),
          cta: form.cta.trim(),
          includeImage: false,
          includeVideo: false,
          variations: 1,
          approvalRequired: true,
          targetStudentType: form.targetAudience.trim(),
          targetCountry: "",
          targetCourse: "",
        }),
      });
      const payload = await response.json().catch(() => null);
      const content = payload?.content;
      if (!response.ok || !content?.id || typeof content.body !== "string") {
        throw new Error(payload?.error || "Content generation or persistence failed.");
      }
      setResult({
        id: content.id,
        content: content.body,
        contentType: form.contentType,
        topic,
        platform: form.platform,
      });
      setPlanningAt("");
      setChecks({ "brand-voice": false, "no-guarantees": false, "clear-cta": false, "platform-fit": false });
      toast({
        title: "Draft saved for manager review",
        description: "The content and approval request were stored. Nothing was published.",
      });
    } catch (error) {
      toast({
        title: "Content was not generated or saved",
        description: error instanceof Error ? error.message : "The server could not complete the request.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.content) return;
    try {
      await navigator.clipboard.writeText(result.content);
      toast({ title: "Copied to clipboard", description: "The draft is ready to paste." });
    } catch {
      toast({ title: "Copy failed", description: "Select and copy the text manually.", variant: "destructive" });
    }
  };

  const handleSavePlanningDraft = async () => {
    if (!result) return;
    if (!planningAt) {
      toast({ title: "Planning date required", description: "Choose a date and time for the calendar planning entry.", variant: "destructive" });
      return;
    }
    const plannedDate = new Date(planningAt);
    if (Number.isNaN(plannedDate.getTime())) {
      toast({ title: "Invalid planning date", description: "Choose a valid date and time.", variant: "destructive" });
      return;
    }
    setSavingPlan(true);
    try {
      const response = await fetch("/api/marketing/calendar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.topic,
          description: result.content.slice(0, 2000),
          platform: result.platform.toLowerCase(),
          scheduledAt: plannedDate.toISOString(),
          contentId: result.id,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || payload.scheduled) {
        throw new Error(payload?.error || "The planning entry was not saved.");
      }
      toast({
        title: "Planning draft saved",
        description: payload.message || "Saved to the database calendar. No scheduler or provider post was created.",
      });
    } catch (error) {
      toast({ title: "Planning draft not saved", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <SectionCard title="Content brief" icon="PenLine" description="Create a draft for human review; generation stores it in the marketing approval workflow and does not publish it.">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Content type</Label>
              <Select value={form.contentType} onValueChange={(value) => setField("contentType", value)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Platform</Label>
              <Select value={form.platform} onValueChange={(value) => setField("platform", value)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Topic</Label>
            <Input className="h-11" placeholder="Enter a topic to develop" value={form.topic} onChange={(event) => setField("topic", event.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tone</Label>
              <Select value={form.tone} onValueChange={(value) => setField("tone", value)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{TONES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target audience (optional)</Label>
              <Input className="h-11" placeholder="Describe the intended audience" value={form.targetAudience} onChange={(event) => setField("targetAudience", event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Key message (optional)</Label>
            <Textarea rows={3} placeholder="The main point the draft should communicate." value={form.keyMessage} onChange={(event) => setField("keyMessage", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Call to action (optional)</Label>
            <Input className="h-11" placeholder="Add a verified, appropriate next step" value={form.cta} onChange={(event) => setField("cta", event.target.value)} />
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="h-12 w-full bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90">
            <Icon name={generating ? "Loader2" : "Sparkles"} className={cn("size-4", generating && "animate-spin")} />
            {generating ? "Generating and saving..." : "Generate Review Draft"}
          </Button>
        </div>
      </SectionCard>

      <div className="space-y-4">
        <SectionCard title="Generated draft" icon="FileText" description="Review the saved text. AI output may contain errors; verify every factual claim before approval or use.">
          {generating ? (
            <div className="space-y-3" aria-live="polite">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <p className="text-xs text-muted-foreground">Generating and saving a draft for {form.platform}...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">{result.contentType}</Badge>
                <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]">{result.platform}</Badge>
                <Badge variant="outline" className="border-violet-200 text-violet-700"><Icon name="Bot" className="mr-1 size-3" /> Pending manager review</Badge>
              </div>
              <div className="max-h-[280px] overflow-y-auto rounded-xl border border-[var(--alo-brand)]/15 bg-[var(--alo-page)] p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{result.content}</pre>
              </div>
              <p className="text-xs text-muted-foreground">Content ID: <span className="font-mono">{result.id}</span>. This screen does not publish content or deliver it to a social platform.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy} className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"><Icon name="Copy" className="size-3.5" /> Copy</Button>
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generating} className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"><Icon name="RefreshCw" className="size-3.5" /> Generate another draft</Button>
              </div>
              <div className="space-y-2 rounded-xl border border-[var(--alo-border)] bg-white p-3">
                <Label className="text-xs font-semibold">Optional calendar planning date</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input type="datetime-local" value={planningAt} onChange={(event) => setPlanningAt(event.target.value)} className="min-w-0" aria-label="Calendar planning date and time" />
                  <Button size="sm" onClick={handleSavePlanningDraft} disabled={savingPlan} className="shrink-0 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90">
                    <Icon name={savingPlan ? "Loader2" : "CalendarClock"} className={cn("size-3.5", savingPlan && "animate-spin")} />
                    {savingPlan ? "Saving..." : "Save planning draft"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">This saves a calendar plan only. No publication schedule or provider post is created; the linked draft remains in the approval workflow and calendar notes are limited to 2,000 characters.</p>
              </div>
            </div>
          ) : (
            <EmptyState icon="Sparkles" title="No content generated yet" description="Enter a topic and generate a review draft. It will be saved through the marketing approval workflow." />
          )}
        </SectionCard>

        <SectionCard title="Human review checklist" icon="ShieldCheck" description="Local reminders only. Checking these boxes does not approve, publish, or audit the saved draft.">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {BRAND_CHECKLIST.map((item) => (
              <label key={item.id} htmlFor={item.id} className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-3 transition-colors", checks[item.id] ? "border-emerald-300 bg-emerald-50/50" : "border-[var(--alo-border)] bg-white hover:bg-[var(--alo-page)]")}>
                <Checkbox id={item.id} checked={checks[item.id]} onCheckedChange={(value) => setChecks((current) => ({ ...current, [item.id]: !!value }))} className={cn("size-5 rounded-md border-2", checks[item.id] ? "border-emerald-600 bg-emerald-600 text-white" : "border-[var(--alo-border-strong)]")} />
                <Icon name={item.icon} className={cn("size-4", checks[item.id] ? "text-emerald-600" : "text-muted-foreground")} />
                <span className={cn("text-xs font-medium", checks[item.id] ? "text-emerald-800" : "text-foreground")}>{item.label}</span>
              </label>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function CampaignCalendarTab() {
  const { toast } = useToast();
  const [filter, setFilter] = React.useState("ALL");
  const [items, setItems] = React.useState<CalendarItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [platform, setPlatform] = React.useState("");
  const [scheduledAt, setScheduledAt] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/marketing/calendar", { credentials: "include" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !Array.isArray(payload.items)) {
        throw new Error(payload?.error || "Unable to load the saved marketing calendar.");
      }
      setItems(payload.items as CalendarItem[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the saved marketing calendar.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const statusOptions = [
    { value: "ALL", label: "All statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "PENDING_APPROVAL", label: "Pending approval" },
    { value: "APPROVED", label: "Approved" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "PUBLISHED", label: "Published" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "FAILED", label: "Failed" },
  ];
  const filtered = React.useMemo(
    () => filter === "ALL" ? items : items.filter((item) => item.status.toUpperCase() === filter),
    [items, filter],
  );

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const plannedDate = new Date(scheduledAt);
    if (!title.trim() || !platform || !scheduledAt || Number.isNaN(plannedDate.getTime())) {
      toast({ title: "Planning details required", description: "Add a title, platform, and valid planning date.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/marketing/calendar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), platform, scheduledAt: plannedDate.toISOString() }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || payload.scheduled) {
        throw new Error(payload?.error || "The planning entry was not saved.");
      }
      toast({ title: "Planning draft saved", description: payload.message || "Saved locally; no social post was scheduled." });
      setTitle("");
      setDescription("");
      setPlatform("");
      setScheduledAt("");
      setCreateOpen(false);
      await load();
    } catch (saveError) {
      toast({ title: "Planning draft not saved", description: saveError instanceof Error ? saveError.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPlan = async (item: CalendarItem) => {
    if (item.type !== "calendar") return;
    setSaving(true);
    try {
      const response = await fetch("/api/marketing/calendar", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: "cancelled" }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || payload.published) {
        throw new Error(payload?.error || "The planning record was not cancelled.");
      }
      toast({ title: "Planning record cancelled", description: payload.message || "The local planning entry was cancelled." });
      await load();
    } catch (cancelError) {
      toast({ title: "Planning record not changed", description: cancelError instanceof Error ? cancelError.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title="Marketing planning calendar"
      icon="CalendarRange"
      description="Database-backed planning records and campaign-post workflow statuses. No connected scheduler or provider publishes from this calendar."
      action={<Button onClick={() => setCreateOpen((open) => !open)} className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90"><Icon name={createOpen ? "X" : "Plus"} className="size-4" /> {createOpen ? "Close form" : "Add planning entry"}</Button>}
    >
      {createOpen && (
        <form onSubmit={handleCreate} className="mb-5 space-y-3 rounded-xl border-2 border-[var(--alo-border)] bg-[var(--alo-page)] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="calendar-title" className="text-xs font-semibold">Planning title</Label>
              <Input id="calendar-title" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="Choose a platform" /></SelectTrigger>
                <SelectContent>
                  {["facebook", "instagram", "whatsapp", "linkedin", "tiktok", "email", "sms", "website"].map((value) => <SelectItem key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calendar-description" className="text-xs font-semibold">Planning notes (optional)</Label>
            <Textarea id="calendar-description" maxLength={2000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="space-y-1.5 sm:max-w-sm">
            <Label htmlFor="calendar-date" className="text-xs font-semibold">Planning date and time</Label>
            <Input id="calendar-date" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={saving} className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"><Icon name={saving ? "Loader2" : "Save"} className={cn("size-3.5", saving && "animate-spin")} /> {saving ? "Saving..." : "Save planning draft"}</Button>
            <span className="text-xs text-muted-foreground">This is not an executable social publishing schedule.</span>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {statusOptions.map((status) => (
            <button key={status.value} type="button" onClick={() => setFilter(status.value)} className={cn("rounded-full border-2 px-3 py-1 text-[11px] font-semibold transition-colors", filter === status.value ? "border-[var(--alo-brand)] bg-[var(--alo-brand)] text-white" : "border-[var(--alo-brand)]/15 bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]")}>
              {status.label}
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading || saving}><Icon name="RefreshCw" className={cn("size-3.5", loading && "animate-spin")} /> Refresh</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-sm text-muted-foreground"><Icon name="Loader2" className="size-4 animate-spin" /> Loading saved calendar records...</div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>Retry</Button></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="CalendarX" title={items.length ? "No records in this status" : "No saved calendar records"} description={items.length ? "Choose another status filter." : "Planning drafts saved to the database calendar will appear here."} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const statusKey = item.status.toUpperCase();
            const platformIcon = PLATFORM_ICONS[item.platform.toUpperCase()] || PLATFORM_ICONS[item.platform] || "Globe";
            const canCancel = item.type === "calendar" && ["draft", "scheduled"].includes(item.status.toLowerCase());
            return (
              <Card key={`${item.type}:${item.id}`} className="flex flex-col rounded-2xl border-2 border-[var(--alo-brand)]/12 p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"><Icon name={CONTENT_TYPE_ICONS[item.type.toUpperCase()] || "CalendarDays"} className="size-4" /></div>
                  <Badge className={STATUS_COLORS[statusKey] || "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]"}>{statusKey.replaceAll("_", " ")}</Badge>
                </div>
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Icon name={platformIcon} className="size-3" /> {item.platform}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1"><Icon name="Clock" className="size-3" /> {fmtDate(item.scheduledAt)}</span>
                  <span>·</span>
                  <span>{item.type === "campaignPost" ? "Campaign post" : "Planning record"}</span>
                </div>
                {canCancel && <div className="mt-3 border-t border-[var(--alo-brand)]/10 pt-3"><Button size="sm" variant="outline" disabled={saving} onClick={() => void handleCancelPlan(item)} className="h-8 border-red-300 text-red-700 hover:bg-red-50"><Icon name="X" className="size-3" /> Cancel planning record</Button></div>}
              </Card>
            );
          })}
        </div>
      )}
      <p className="mt-4 rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs text-muted-foreground">Calendar records are plans only unless a separately verified publishing integration is configured. Statuses shown for campaign posts come from their approval workflow; they do not confirm external delivery.</p>
    </SectionCard>
  );
}

function ReplyQueueTab() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<ReplyQueueItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/marketing/social-inbox", { credentials: "include" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !Array.isArray(payload.conversations)) {
        throw new Error(payload?.error || "Unable to load the assigned social inbox.");
      }
      const queue: ReplyQueueItem[] = payload.conversations.flatMap((conversation: any) =>
        (Array.isArray(conversation.messages) ? conversation.messages : [])
          .filter((message: any) => message.direction === "INBOUND" && typeof message.aiDraftReply === "string" && message.aiDraftReply.trim() && !message.humanApproved)
          .map((message: any) => ({
            id: message.id,
            messageId: message.id,
            conversationId: typeof message.conversationId === "string" ? message.conversationId : "",
            channel: String(message.platform || conversation.platform || "UNKNOWN").toUpperCase(),
            canEdit: Boolean(message.conversationId) && ["FACEBOOK", "INSTAGRAM", "WHATSAPP", "EMAIL", "SMS", "WEBSITE_CHAT"].includes(String(message.platform || conversation.platform || "").toUpperCase()),
            fromName: message.senderName || conversation.senderName || message.senderId || "Unknown sender",
            originalMessage: message.messageText || "(No text content on this inbound message)",
            suggestedReply: message.aiDraftReply,
          })),
      );
      setItems(queue);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the assigned social inbox.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const postAction = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/marketing/social-inbox", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success || payload.sent) {
      throw new Error(payload?.error || "The inbox action was not completed.");
    }
    return payload;
  };

  const handleApproveDraft = async (item: ReplyQueueItem) => {
    setSavingId(item.id);
    try {
      const payload = await postAction({ action: "approve_draft", messageId: item.messageId });
      toast({ title: "Draft approved internally", description: payload.message || "No message was sent." });
      await load();
    } catch (actionError) {
      toast({ title: "Draft was not approved", description: actionError instanceof Error ? actionError.message : "The server rejected this action.", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const handleRejectDraft = async (item: ReplyQueueItem) => {
    setSavingId(item.id);
    try {
      const payload = await postAction({ action: "reject_draft", messageId: item.messageId });
      toast({ title: "Draft rejected", description: payload.message || "The draft was removed. No message was sent." });
      await load();
    } catch (actionError) {
      toast({ title: "Draft was not rejected", description: actionError instanceof Error ? actionError.message : "The server rejected this action.", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const handleEditDraft = (item: ReplyQueueItem) => {
    setEditingId(item.id);
    setEditText(item.suggestedReply);
  };

  const handleSaveEdit = async (item: ReplyQueueItem) => {
    const draft = editText.trim();
    if (!draft) {
      toast({ title: "Reply draft is empty", description: "Enter text before saving the revised draft.", variant: "destructive" });
      return;
    }
    setSavingId(item.id);
    try {
      const payload = await postAction({
        action: "save_draft",
        platform: item.channel,
        conversationId: item.conversationId,
        messageText: draft,
        aiDraftUsed: true,
      });
      toast({ title: "Revised draft saved", description: payload.message || "Saved for manager review. No message was sent." });
      setEditingId(null);
      setEditText("");
      await load();
    } catch (actionError) {
      toast({ title: "Revised draft not saved", description: actionError instanceof Error ? actionError.message : "The server rejected this action.", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SectionCard title="AI reply draft queue" icon="Inbox" description="Database-backed inbound reply drafts. Review, revise, approve internally, or reject; approval here never sends a message.">
      <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border-2 border-violet-200 bg-violet-50/50 p-3">
        <div className="flex items-start gap-2.5">
          <Icon name="Bot" className="mt-0.5 size-4 shrink-0 text-violet-700" />
          <p className="text-xs text-violet-900/80">AI suggestions must be fact-checked by a person. Approving or saving a draft records an internal workflow action only; no reply is delivered by this screen.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading || savingId !== null} aria-label="Refresh reply drafts"><Icon name="RefreshCw" className={cn("size-3.5", loading && "animate-spin")} /></Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-sm text-muted-foreground"><Icon name="Loader2" className="size-4 animate-spin" /> Loading reply drafts...</div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>Retry</Button></div>
      ) : items.length === 0 ? (
        <EmptyState icon="Inbox" title="No pending reply drafts" description="Only saved inbound drafts awaiting internal review are shown here. This screen does not create sample conversations." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const channelIcon = CHANNEL_ICONS[item.channel] || "MessageSquare";
            return (
              <Card key={item.id} className="rounded-2xl border-2 border-[var(--alo-brand)]/12 p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"><Icon name={channelIcon} className="size-4" /></div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.fromName}</p>
                      <p className="text-[11px] text-muted-foreground">{item.channel}{item.studentName ? ` · Record ${item.studentName}` : ""}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-violet-200 text-violet-700"><Icon name="Bot" className="mr-1 size-3" /> Pending human review</Badge>
                </div>
                <div className="space-y-2.5">
                  <div className="rounded-xl bg-[var(--alo-page)] p-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Original inbound message</p>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{item.originalMessage}</p>
                  </div>
                  {editingId === item.id ? (
                    <div className="rounded-xl border-2 border-[var(--alo-brand)]/30 bg-[var(--alo-brand-light)]/30 p-3">
                      <Label htmlFor={`reply-edit-${item.id}`} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--alo-brand)]">Edit reply draft</Label>
                      <Textarea id={`reply-edit-${item.id}`} rows={5} maxLength={5000} value={editText} onChange={(event) => setEditText(event.target.value)} className="border-[var(--alo-brand)]/20" />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => void handleSaveEdit(item)} disabled={savingId === item.id} className="h-9 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"><Icon name={savingId === item.id ? "Loader2" : "Save"} className={cn("size-3.5", savingId === item.id && "animate-spin")} /> Save revised draft</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditText(""); }} disabled={savingId === item.id} className="h-9">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-violet-200 bg-violet-50/40 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700"><Icon name="Sparkles" className="size-3" /> Suggested reply draft</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{item.suggestedReply}</p>
                    </div>
                  )}
                </div>
                {editingId !== item.id && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--alo-brand)]/10 pt-3">
                    <Button size="sm" onClick={() => void handleApproveDraft(item)} disabled={savingId === item.id} className="h-9 bg-emerald-700 text-white hover:bg-emerald-700/90"><Icon name={savingId === item.id ? "Loader2" : "Check"} className={cn("size-3.5", savingId === item.id && "animate-spin")} /> Approve internally</Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditDraft(item)} disabled={savingId === item.id} className="h-9 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"><Icon name="Pencil" className="size-3.5" /> Edit draft</Button>
                    <Button size="sm" variant="outline" onClick={() => void handleRejectDraft(item)} disabled={savingId === item.id} className="h-9 border-red-300 text-red-700 hover:bg-red-50"><Icon name="X" className="size-3.5" /> Reject draft</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function MarketingDataSummary() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [summary, setSummary] = React.useState({ planningRecords: 0, conversations: 0, pendingDrafts: 0 });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [calendarResponse, inboxResponse] = await Promise.all([
        fetch("/api/marketing/calendar", { credentials: "include" }),
        fetch("/api/marketing/social-inbox", { credentials: "include" }),
      ]);
      const [calendar, inbox] = await Promise.all([
        calendarResponse.json().catch(() => null),
        inboxResponse.json().catch(() => null),
      ]);
      if (!calendarResponse.ok || !calendar?.success || !Array.isArray(calendar.items) || !inboxResponse.ok || !inbox?.success || !Array.isArray(inbox.conversations)) {
        throw new Error("Marketing data is unavailable.");
      }
      const pendingDrafts = inbox.conversations.reduce((total: number, conversation: any) => total + (Array.isArray(conversation.messages) ? conversation.messages.filter((message: any) => message.direction === "INBOUND" && typeof message.aiDraftReply === "string" && message.aiDraftReply.trim() && !message.humanApproved).length : 0), 0);
      setSummary({ planningRecords: calendar.items.length, conversations: inbox.conversations.length, pendingDrafts });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Calendar records" value={loading ? "…" : error ? "—" : summary.planningRecords} icon="CalendarDays" accent="blue" hint="Database records; not proof of publishing" />
        <StatCard label="Inbox conversations" value={loading ? "…" : error ? "—" : summary.conversations} icon="Inbox" accent="orange" hint="Visible under your current access scope" />
        <StatCard label="Pending reply drafts" value={loading ? "…" : error ? "—" : summary.pendingDrafts} icon="MessageSquare" accent="violet" hint="Internal review only; no messages sent" />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{error ? "Live marketing counts could not be loaded; values are not estimated." : "Counts are loaded from the authenticated marketing APIs."}</span>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}><Icon name="RefreshCw" className={cn("size-3.5", loading && "animate-spin")} /> Refresh</Button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export function MarketingAi() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing AI Engine"
        icon="Sparkles"
        subtitle="AI-assisted marketing drafts, database-backed planning, and human-reviewed inbox drafts. No social provider is published to from this screen."
      />

      <BrandRulesBanner />

      <MarketingDataSummary />

      <Tabs defaultValue="generator">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl bg-[var(--alo-brand-light)] p-1.5">
          <TabsTrigger
            value="generator"
            className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm"
          >
            <Icon name="PenLine" className="mr-1.5 size-3.5" />
            Content Generator
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm"
          >
            <Icon name="CalendarRange" className="mr-1.5 size-3.5" />
            Campaign Calendar
          </TabsTrigger>
          <TabsTrigger
            value="queue"
            className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm"
          >
            <Icon name="Inbox" className="mr-1.5 size-3.5" />
            AI Reply Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="mt-5">
          <ContentGeneratorTab />
        </TabsContent>
        <TabsContent value="calendar" className="mt-5">
          <CampaignCalendarTab />
        </TabsContent>
        <TabsContent value="queue" className="mt-5">
          <ReplyQueueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default MarketingAi;
