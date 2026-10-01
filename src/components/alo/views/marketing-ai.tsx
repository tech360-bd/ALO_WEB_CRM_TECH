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
  channel: string;
  fromName: string;
  originalMessage: string;
  suggestedReply: string;
  studentName?: string;
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
  IDEA: "bg-slate-200 text-slate-700",
  DRAFT: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  SCHEDULED: "bg-sky-100 text-sky-700",
  PUBLISHED: "bg-[#0B5ED7]/15 text-[#0B5ED7]",
};

const CHANNEL_ICONS: Record<string, string> = {
  WHATSAPP: "MessageCircle",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  EMAIL: "Mail",
  WEBSITE_CHAT: "Globe",
  SMS: "Smartphone",
};

// Static sample data for the campaign calendar (ContentCalendar model exists, but no GET API yet)
const SAMPLE_CALENDAR: CalendarItem[] = [
  {
    id: "cal-1",
    title: "UK September Intake Deadline Reminder",
    platform: "FACEBOOK",
    type: "POST",
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    status: "SCHEDULED",
  },
  {
    id: "cal-2",
    title: "Reel: Student Success Story — Canada",
    platform: "INSTAGRAM",
    type: "REEL",
    scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: "DRAFT",
  },
  {
    id: "cal-3",
    title: "Live Q&A: Study in Germany",
    platform: "FACEBOOK",
    type: "LIVE",
    scheduledAt: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: "IDEA",
  },
  {
    id: "cal-4",
    title: "Post: IELTS vs PTE — Which to choose?",
    platform: "LINKEDIN",
    type: "POST",
    scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: "APPROVED",
  },
  {
    id: "cal-5",
    title: "Story: Scholarship deadline this week",
    platform: "INSTAGRAM",
    type: "STORY",
    scheduledAt: new Date(Date.now() - 86400000).toISOString(),
    status: "PUBLISHED",
  },
  {
    id: "cal-6",
    title: "Email: September intake newsletter",
    platform: "EMAIL",
    type: "EMAIL",
    scheduledAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    status: "SCHEDULED",
  },
];

// Static sample data for AI Reply Queue (AiReplyLog model exists, but no GET API yet)
const SAMPLE_REPLY_QUEUE: ReplyQueueItem[] = [
  {
    id: "rq-1",
    channel: "WHATSAPP",
    fromName: "Tahsin Rahman",
    studentName: "ALO-S-20003",
    originalMessage:
      "Hi, I want to know about September intake for UK universities. Is IELTS 6.0 enough?",
    suggestedReply:
      "Hello Tahsin, thank you for reaching out! September intake is open at most UK universities. IELTS 6.0 may work for foundation or some bachelor programs, but most master's courses require 6.5. Would you like to book a free consultation so we can shortlist the best-fit universities for your profile? You can book at alo-education.com/book.",
  },
  {
    id: "rq-2",
    channel: "FACEBOOK",
    fromName: "Anonymous commenter",
    originalMessage: "Do you guarantee visa approval if I apply through ALO?",
    suggestedReply:
      "Thank you for your question! At ALO Education we do not guarantee visa approval — no ethical agency can. What we do promise is a thorough, expert-led application: document verification, financial preparation, mock interviews, and a strong SOP. Our visa approval rate is strong because of preparation, not promises. Book a free consultation to learn more.",
  },
  {
    id: "rq-3",
    channel: "INSTAGRAM",
    fromName: "@rahila_07",
    originalMessage: "What's the cost to study in Canada including living?",
    suggestedReply:
      "Hi Rahila! Great question. For Canada: tuition ranges CAD 15,000–35,000/year depending on the program, plus ~CAD 12,000–15,000/year for living. Total budget roughly BDT 22–35 lakh/year. Scholarships can reduce this. Would you like a personalised budget estimate? Comment 'INFO' and our team will DM you.",
  },
  {
    id: "rq-4",
    channel: "EMAIL",
    fromName: "parent.of.student@gmail.com",
    originalMessage:
      "My son wants to study in Australia. What documents do we need to start? He is in HSC final year.",
    suggestedReply:
      "Dear Parent, thank you for your email — exciting that your son is considering Australia! To start, we'll need: academic transcripts (SSC + HSC), passport copy, English test score (IELTS/PTE), and a brief statement of interest. We can begin counselling even before HSC results. Please book a consultation at alo-education.com/book and we'll guide you step by step.",
  },
  {
    id: "rq-5",
    channel: "WEBSITE_CHAT",
    fromName: "Website visitor",
    originalMessage: "Can I apply with a 2-year study gap? I worked during that time.",
    suggestedReply:
      "Yes, you can absolutely apply with a 2-year study gap — and work experience actually strengthens your application! We'll help you frame the gap credibly in your SOP and CV. Book a free consultation and our counselors will review your profile and recommend suitable universities.",
  },
];

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
    <Card className="rounded-2xl border-2 border-[#F97316]/40 bg-orange-50/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F97316] text-white">
            <Icon name="ShieldAlert" className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base text-[#F97316]">
              AI Content Rules — Brand Compliance Guardrails
            </CardTitle>
            <CardDescription className="text-xs">
              Every AI-generated marketing asset is bound by these rules. Violations block publishing.
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
                "Follow ALO brand voice — professional, encouraging, student-first.",
                "Never promise visa or admission guarantees.",
                "Collect lead info (name, phone, email, interest).",
                "Create a CRM lead for every inbound enquiry.",
                "Handover to a counselor when a query needs human expertise.",
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
          <div className="md:border-l md:border-[#F97316]/20 md:pl-5">
            <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-red-700">
              <Icon name="XCircle" className="size-4" /> AI content must NOT
            </p>
            <ul className="space-y-1.5">
              {[
                "Publish without human approval (where required).",
                "Share private student data without consent.",
                "Post after-hours without manager review.",
                "Use clickbait, false scarcity, or invented deadlines.",
                "Quote specific visa/approval rates as promises.",
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
    cta: "Book a free consultation",
  });
  const [generating, setGenerating] = React.useState(false);
  const [result, setResult] = React.useState<GeneratedContent | null>(null);
  const [checks, setChecks] = React.useState<Record<string, boolean>>({
    "brand-voice": false,
    "no-guarantees": false,
    "clear-cta": false,
    "platform-fit": false,
  });

  const setField = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleGenerate = async () => {
    if (!form.topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic before generating content.",
        variant: "destructive",
      });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/marketing/content-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Content generation failed");
      const data = (await res.json()) as GeneratedContent;
      setResult(data);
      // Auto-tick the brand-voice + clear-cta checks based on what was generated
      setChecks({
        "brand-voice": true,
        "no-guarantees": !/guarantee|100%|sure\s+approval/i.test(data.content),
        "clear-cta": /book|comment|dm|click|contact|visit|message/i.test(data.content),
        "platform-fit": true,
      });
      toast({
        title: "Content generated",
        description: `AI drafted a ${data.contentType} for ${data.platform}. Review the brand checklist before publishing.`,
      });
    } catch (err) {
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Please try again.",
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
      toast({ title: "Copied to clipboard", description: "Content ready to paste." });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please select the text manually.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleSchedule = () => {
    toast({
      title: "Post scheduled",
      description: "Added to the campaign calendar. Will publish at the scheduled time after manager review.",
    });
  };

  const handleApprovePublish = () => {
    const allChecked = Object.values(checks).every(Boolean);
    if (!allChecked) {
      toast({
        title: "Brand checklist incomplete",
        description: "Please confirm all four compliance checks before publishing.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Content approved for publishing",
      description: "Sent to the publishing queue and logged to audit.",
    });
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Form */}
      <SectionCard
        title="Content brief"
        icon="PenLine"
        description="Describe what you need — AI will draft on-brand copy ready for review."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Content type</Label>
              <Select value={form.contentType} onValueChange={(v) => setField("contentType", v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setField("platform", v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Topic</Label>
            <Input
              className="h-11"
              placeholder="e.g. UK September intake — last 2 weeks to apply"
              value={form.topic}
              onChange={(e) => setField("topic", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tone</Label>
              <Select value={form.tone} onValueChange={(v) => setField("tone", v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target audience</Label>
              <Input
                className="h-11"
                placeholder="e.g. HSC graduates in Dhaka"
                value={form.targetAudience}
                onChange={(e) => setField("targetAudience", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Key message</Label>
            <Textarea
              rows={3}
              placeholder="The single most important point the content should communicate."
              value={form.keyMessage}
              onChange={(e) => setField("keyMessage", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Call to action</Label>
            <Input
              className="h-11"
              placeholder="e.g. Book a free consultation"
              value={form.cta}
              onChange={(e) => setField("cta", e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="h-12 w-full bg-[#F97316] hover:bg-[#F97316]/90 text-white"
          >
            <Icon
              name={generating ? "Loader2" : "Sparkles"}
              className={cn("size-4", generating && "animate-spin")}
            />
            {generating ? "AI is drafting..." : "Generate Content"}
          </Button>
        </div>
      </SectionCard>

      {/* Preview / result */}
      <div className="space-y-4">
        <SectionCard
          title="Generated preview"
          icon="FileText"
          description="Review the AI draft, run the brand checklist, then schedule or publish."
        >
          {generating ? (
            <div className="space-y-3">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
              <p className="text-xs text-muted-foreground">
                AI is composing your {form.contentType.toLowerCase()} for {form.platform}...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#e8f0fb] text-[#0B5ED7]">{result.contentType}</Badge>
                <Badge className="bg-[#fdece4] text-[#F97316]">{result.platform}</Badge>
                <Badge variant="outline" className="border-violet-200 text-violet-700">
                  <Icon name="Bot" className="mr-1 size-3" /> AI draft
                </Badge>
              </div>
              <div className="max-h-[280px] overflow-y-auto rounded-xl border border-[#0B5ED7]/15 bg-[#f7f9fc] p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {result.content}
                </pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-10 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
                >
                  <Icon name="Copy" className="size-3.5" /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={generating}
                  className="h-10 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
                >
                  <Icon name="RefreshCw" className="size-3.5" /> Regenerate
                </Button>
                <Button
                  size="sm"
                  onClick={handleSchedule}
                  className="h-10 bg-[#0B5ED7] hover:bg-[#0B5ED7]/90 text-white"
                >
                  <Icon name="CalendarClock" className="size-3.5" /> Schedule Post
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprovePublish}
                  className="h-10 bg-emerald-600 hover:bg-emerald-600/90 text-white"
                >
                  <Icon name="Send" className="size-3.5" /> Approve & Publish
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="Sparkles"
              title="No content generated yet"
              description="Fill in the brief on the left and click Generate Content. The AI draft will appear here with a brand-compliance checklist."
            />
          )}
        </SectionCard>

        {/* Brand compliance checklist */}
        <SectionCard
          title="Brand compliance checklist"
          icon="ShieldCheck"
          description="Confirm all four checks before approving for publish."
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {BRAND_CHECKLIST.map((c) => (
              <label
                key={c.id}
                htmlFor={c.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-3 transition-colors",
                  checks[c.id]
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <Checkbox
                  id={c.id}
                  checked={checks[c.id]}
                  onCheckedChange={(v) =>
                    setChecks((s) => ({ ...s, [c.id]: !!v }))
                  }
                  className={cn(
                    "size-5 rounded-md border-2",
                    checks[c.id]
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300"
                  )}
                />
                <Icon
                  name={c.icon}
                  className={cn(
                    "size-4",
                    checks[c.id] ? "text-emerald-600" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    checks[c.id] ? "text-emerald-800" : "text-foreground"
                  )}
                >
                  {c.label}
                </span>
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
  const [filter, setFilter] = React.useState<string>("ALL");
  const [items, setItems] = React.useState<CalendarItem[]>(SAMPLE_CALENDAR);

  const statusOptions = ["ALL", "IDEA", "DRAFT", "APPROVED", "SCHEDULED", "PUBLISHED"];
  const filtered = React.useMemo(
    () => (filter === "ALL" ? items : items.filter((i) => i.status === filter)),
    [items, filter]
  );

  const handleNewIdea = () => {
    toast({
      title: "New content idea",
      description: "Opening the idea capture form. AI can expand it into a full brief on request.",
    });
  };

  const handleItemAction = (item: CalendarItem, action: "edit" | "duplicate" | "publish") => {
    const messages = {
      edit: { title: "Opening editor", description: `Editing "${item.title}".` },
      duplicate: { title: "Content duplicated", description: `A copy of "${item.title}" was added as DRAFT.` },
      publish: { title: "Content published", description: `"${item.title}" is now live.` },
    } as const;
    toast(messages[action]);
    if (action === "duplicate") {
      setItems((prev) => [
        { ...item, id: `cal-${Date.now()}`, status: "DRAFT", title: `${item.title} (copy)` },
        ...prev,
      ]);
    }
    if (action === "publish") {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "PUBLISHED" } : i))
      );
    }
  };

  return (
    <SectionCard
      title="Campaign calendar"
      icon="CalendarRange"
      description="Upcoming posts, reels, stories, lives, and email drops across all channels."
      action={
        <Button
          onClick={handleNewIdea}
          className="h-10 bg-[#F97316] hover:bg-[#F97316]/90 text-white"
        >
          <Icon name="Plus" className="size-4" /> New Content Idea
        </Button>
      }
    >
      {/* Filter row */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {statusOptions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border-2 px-3 py-1 text-[11px] font-semibold transition-colors",
              filter === s
                ? "border-[#0B5ED7] bg-[#0B5ED7] text-white"
                : "border-[#0B5ED7]/15 bg-white text-[#0B5ED7] hover:bg-[#e8f0fb]"
            )}
          >
            {s === "ALL" ? "All statuses" : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="CalendarX"
          title="No content in this status"
          description="Try a different filter or add a new content idea."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const icon = CONTENT_TYPE_ICONS[item.type] || "FileText";
            const platformIcon = PLATFORM_ICONS[item.platform] || "Globe";
            return (
              <Card
                key={item.id}
                className="flex flex-col rounded-2xl border-2 border-[#0B5ED7]/12 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0B5ED7]">
                    <Icon name={icon} className="size-4.5" />
                  </div>
                  <Badge className={STATUS_COLORS[item.status] || "bg-slate-100 text-slate-700"}>
                    {item.status}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Icon name={platformIcon} className="size-3" />
                    {item.platform}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="Clock" className="size-3" />
                    {fmtDate(item.scheduledAt)}
                  </span>
                </div>
                <div className="mt-3 flex gap-1.5 border-t border-[#0B5ED7]/10 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleItemAction(item, "edit")}
                    className="h-8 flex-1 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
                  >
                    <Icon name="Pencil" className="size-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleItemAction(item, "duplicate")}
                    className="h-8 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
                  >
                    <Icon name="Copy" className="size-3" />
                  </Button>
                  {item.status === "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() => handleItemAction(item, "publish")}
                      className="h-8 bg-emerald-600 hover:bg-emerald-600/90 text-white"
                    >
                      <Icon name="Send" className="size-3" /> Publish
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function ReplyQueueTab() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<ReplyQueueItem[]>(SAMPLE_REPLY_QUEUE);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const handleApprove = (item: ReplyQueueItem) => {
    toast({
      title: "Reply sent and logged",
      description: `Approved reply sent via ${item.channel}. Logged to the student timeline and audit.`,
    });
    removeItem(item.id);
  };

  const handleEditApprove = (item: ReplyQueueItem) => {
    setEditingId(item.id);
    setEditText(item.suggestedReply);
  };

  const handleSaveEdit = (item: ReplyQueueItem) => {
    toast({
      title: "Edited reply sent and logged",
      description: `Your edited reply was sent via ${item.channel}. Logged to timeline.`,
    });
    setEditingId(null);
    setEditText("");
    removeItem(item.id);
  };

  const handleReject = (item: ReplyQueueItem) => {
    toast({
      title: "Reply rejected",
      description: `AI suggestion discarded. Logged for model retraining feedback.`,
      variant: "destructive",
    });
    removeItem(item.id);
  };

  return (
    <SectionCard
      title="AI reply queue"
      icon="Inbox"
      description="AI-drafted replies awaiting manager approval. Review, edit, or reject each one."
    >
      {/* Compliance note */}
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border-2 border-violet-200 bg-violet-50/50 p-3">
        <Icon name="Bot" className="mt-0.5 size-4 shrink-0 text-violet-700" />
        <p className="text-xs text-violet-900/80">
          AI replies follow ALO brand guidelines and never promise visa or admission outcomes. Every
          approved reply is logged to the student timeline and audit.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="CheckCircle2"
          title="Queue is clear"
          description="No AI replies waiting for approval. New suggestions will appear here as they come in."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const channelIcon = CHANNEL_ICONS[item.channel] || "MessageSquare";
            return (
              <Card
                key={item.id}
                className="rounded-2xl border-2 border-[#0B5ED7]/12 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#e8f0fb] text-[#0B5ED7]">
                      <Icon name={channelIcon} className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.fromName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.channel}
                        {item.studentName ? ` · Student ${item.studentName}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-violet-200 text-violet-700">
                    <Icon name="Bot" className="mr-1 size-3" /> AI drafted
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Original message
                    </p>
                    <p className="text-sm text-foreground">{item.originalMessage}</p>
                  </div>

                  {editingId === item.id ? (
                    <div className="rounded-xl border-2 border-[#0B5ED7]/30 bg-[#e8f0fb]/30 p-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#0B5ED7]">
                        Edit reply
                      </p>
                      <Textarea
                        rows={5}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="border-[#0B5ED7]/20"
                      />
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(item)}
                          className="h-9 bg-[#0B5ED7] hover:bg-[#0B5ED7]/90 text-white"
                        >
                          <Icon name="Send" className="size-3.5" /> Send edited reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditText("");
                          }}
                          className="h-9 border-slate-300 text-slate-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-violet-200 bg-violet-50/40 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                        <Icon name="Sparkles" className="size-3" /> Suggested AI reply
                      </p>
                      <p className="text-sm leading-relaxed text-foreground">
                        {item.suggestedReply}
                      </p>
                    </div>
                  )}
                </div>

                {editingId !== item.id && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[#0B5ED7]/10 pt-3">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item)}
                      className="h-9 bg-emerald-600 hover:bg-emerald-600/90 text-white"
                    >
                      <Icon name="Check" className="size-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEditApprove(item)}
                      className="h-9 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
                      variant="outline"
                    >
                      <Icon name="Pencil" className="size-3.5" /> Edit & Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReject(item)}
                      className="h-9 border-red-300 text-red-600 hover:bg-red-50"
                      variant="outline"
                    >
                      <Icon name="X" className="size-3.5" /> Reject
                    </Button>
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

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export function MarketingAi() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing AI Engine"
        icon="Sparkles"
        subtitle="AI-powered content generation, campaign management, and social media automation."
      />

      <BrandRulesBanner />

      {/* Campaign performance summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Campaigns"
          value="6"
          icon="Megaphone"
          accent="blue"
          hint="2 scheduled this week"
        />
        <StatCard
          label="Leads This Week"
          value="145"
          icon="Users"
          accent="orange"
          trend="+18% vs last week"
        />
        <StatCard
          label="Conversion Rate"
          value="17%"
          icon="Target"
          accent="emerald"
          trend="+2.3 pts"
        />
        <StatCard
          label="Cost Per Lead"
          value="৳351"
          icon="DollarSign"
          accent="violet"
          hint="Facebook strongest channel"
        />
      </div>

      <Tabs defaultValue="generator">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl bg-[#e8f0fb] p-1.5">
          <TabsTrigger
            value="generator"
            className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0B5ED7] data-[state=active]:shadow-sm"
          >
            <Icon name="PenLine" className="mr-1.5 size-3.5" />
            Content Generator
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0B5ED7] data-[state=active]:shadow-sm"
          >
            <Icon name="CalendarRange" className="mr-1.5 size-3.5" />
            Campaign Calendar
          </TabsTrigger>
          <TabsTrigger
            value="queue"
            className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0B5ED7] data-[state=active]:shadow-sm"
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
