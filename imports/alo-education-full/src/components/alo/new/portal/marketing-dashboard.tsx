'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Eye,
  Users,
  TrendingUp,
  Calendar,
  Plus,
  Sparkles,
  BarChart3,
  Mail,
  MessageCircle,
  Smartphone,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  ArrowRight,
  MousePointerClick,
  Target,
  Zap,
  Play,
  Pause,
  Pencil,
  Check,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  StatCard,
  SectionCard,
  PageHeader,
  QuickAction,
  EmptyState,
  LoadingGrid,
  StatusBadge,
  PipelineStage,
  Icon,
  MiniBar,
} from '@/components/alo/shared';
import { timeAgo } from '@/lib/alo-types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarketingDashboardProps {
  onNavigate?: (view: string, slug?: string) => void;
}

interface Campaign {
  id: string;
  title: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  channel: 'social' | 'email' | 'whatsapp' | 'sms';
  reach: number;
  engagement: number;
  leads: number;
  conversions: number;
  aiGenerated: boolean;
  humanApproved: boolean;
  createdAt: string;
}

interface CalendarItem {
  id: string;
  title: string;
  type: 'blog' | 'social' | 'email' | 'whatsapp';
  scheduledAt: string;
  status: string;
}

interface ChannelPerformance {
  channel: string;
  reach: number;
  engagement: number;
  leads: number;
  conversions: number;
}

interface AIPipelineItem {
  id: string;
  title: string;
  type: string;
  status: 'draft' | 'review' | 'approved' | 'published';
}

interface DashboardStats {
  counts?: Record<string, number>;
  marketing?: { conversionRate?: number };
  [key: string]: unknown;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  draft: 'bg-slate-100 text-slate-600',
  completed: 'bg-alo-blue-light text-alo-blue',
};

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  draft: 'Draft',
  completed: 'Completed',
};

const CHANNEL_ICONS: Record<string, string> = {
  social: 'Share2',
  email: 'Mail',
  whatsapp: 'MessageCircle',
  sms: 'Smartphone',
};

const CHANNEL_LABELS: Record<string, string> = {
  social: 'Social',
  email: 'Email',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
};

const CHANNEL_COLORS: Record<string, string> = {
  Social: 'var(--color-alo-blue)',
  Email: 'var(--color-alo-orange)',
  WhatsApp: '#25D366',
  SMS: 'var(--color-violet-500)',
  SEO: 'var(--color-emerald-500)',
};

const CALENDAR_TYPE_COLORS: Record<string, string> = {
  blog: 'bg-alo-blue-light text-alo-blue',
  social: 'bg-violet-100 text-violet-700',
  email: 'bg-alo-orange-light text-alo-orange',
  whatsapp: 'bg-emerald-50 text-emerald-700',
};

const CALENDAR_TYPE_LABELS: Record<string, string> = {
  blog: 'Blog',
  social: 'Social',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

// ─── Demo Fallback Data ──────────────────────────────────────────────────────

const DEMO_STATS: DashboardStats = {
  counts: { activeCampaigns: 8, totalReach: 245600, leadsGenerated: 1247, conversionRate: 22.2 },
  marketing: { conversionRate: 22.2 },
};

const DEMO_CAMPAIGNS: Campaign[] = [
  { id: 'c1', title: 'UK September 2025 Intake Blast', status: 'active', channel: 'email', reach: 45200, engagement: 8200, leads: 342, conversions: 78, aiGenerated: true, humanApproved: true, createdAt: '2025-01-10T10:00:00Z' },
  { id: 'c2', title: 'Australia Scholarship Awareness', status: 'active', channel: 'social', reach: 67800, engagement: 12500, leads: 218, conversions: 42, aiGenerated: true, humanApproved: true, createdAt: '2025-01-12T08:00:00Z' },
  { id: 'c3', title: 'Canada Visa Success Stories', status: 'active', channel: 'whatsapp', reach: 23400, engagement: 5600, leads: 189, conversions: 35, aiGenerated: false, humanApproved: true, createdAt: '2025-01-14T14:00:00Z' },
  { id: 'c4', title: 'IELTS Preparation Tips Series', status: 'paused', channel: 'social', reach: 34500, engagement: 7800, leads: 156, conversions: 28, aiGenerated: true, humanApproved: true, createdAt: '2025-01-08T12:00:00Z' },
  { id: 'c5', title: 'New Year Open Day Invite', status: 'completed', channel: 'email', reach: 18200, engagement: 4200, leads: 98, conversions: 15, aiGenerated: false, humanApproved: true, createdAt: '2025-01-02T09:00:00Z' },
  { id: 'c6', title: 'USA F1 Visa Workshop', status: 'draft', channel: 'sms', reach: 0, engagement: 0, leads: 0, conversions: 0, aiGenerated: true, humanApproved: false, createdAt: '2025-01-16T16:00:00Z' },
  { id: 'c7', title: 'Germany Free Tuition Campaign', status: 'active', channel: 'social', reach: 52100, engagement: 9400, leads: 167, conversions: 31, aiGenerated: true, humanApproved: true, createdAt: '2025-01-11T11:00:00Z' },
  { id: 'c8', title: 'Partner Referral Program Q1', status: 'active', channel: 'email', reach: 4400, engagement: 1200, leads: 77, conversions: 12, aiGenerated: false, humanApproved: true, createdAt: '2025-01-15T07:00:00Z' },
];

const DEMO_CALENDAR: CalendarItem[] = [
  { id: 'cal1', title: 'UK University Rankings Blog', type: 'blog', scheduledAt: '2025-01-20T09:00:00Z', status: 'scheduled' },
  { id: 'cal2', title: 'Instagram Reel: Campus Tour', type: 'social', scheduledAt: '2025-01-20T12:00:00Z', status: 'scheduled' },
  { id: 'cal3', title: 'Weekly Newsletter: Scholarships', type: 'email', scheduledAt: '2025-01-20T10:00:00Z', status: 'scheduled' },
  { id: 'cal4', title: 'WhatsApp: Visa Tips', type: 'whatsapp', scheduledAt: '2025-01-21T08:00:00Z', status: 'scheduled' },
  { id: 'cal5', title: 'Facebook Carousel: Courses', type: 'social', scheduledAt: '2025-01-21T14:00:00Z', status: 'draft' },
  { id: 'cal6', title: 'Email Drip: Lead Nurturing', type: 'email', scheduledAt: '2025-01-22T09:00:00Z', status: 'scheduled' },
  { id: 'cal7', title: 'LinkedIn Post: Partner Spotlight', type: 'social', scheduledAt: '2025-01-22T11:00:00Z', status: 'scheduled' },
  { id: 'cal8', title: 'WhatsApp: Deadline Reminder', type: 'whatsapp', scheduledAt: '2025-01-23T07:00:00Z', status: 'scheduled' },
  { id: 'cal9', title: 'Blog: IELTS vs PTE Comparison', type: 'blog', scheduledAt: '2025-01-23T10:00:00Z', status: 'review' },
  { id: 'cal10', title: 'Instagram Story: Student Review', type: 'social', scheduledAt: '2025-01-24T15:00:00Z', status: 'scheduled' },
  { id: 'cal11', title: 'Email: Application Checklist', type: 'email', scheduledAt: '2025-01-24T09:00:00Z', status: 'scheduled' },
  { id: 'cal12', title: 'SMS: Interview Reminder', type: 'whatsapp', scheduledAt: '2025-01-25T08:00:00Z', status: 'draft' },
];

const DEMO_CHANNEL_PERF: ChannelPerformance[] = [
  { channel: 'Social', reach: 154400, engagement: 29700, leads: 541, conversions: 101 },
  { channel: 'Email', reach: 67800, engagement: 13600, leads: 517, conversions: 105 },
  { channel: 'WhatsApp', reach: 23400, engagement: 5600, leads: 189, conversions: 35 },
  { channel: 'SMS', reach: 0, engagement: 0, leads: 0, conversions: 0 },
  { channel: 'SEO', reach: 8900, engagement: 2100, leads: 78, conversions: 18 },
];

const DEMO_AI_PIPELINE: AIPipelineItem[] = [
  { id: 'ai1', title: 'UK September Blog Post', type: 'Blog', status: 'draft' },
  { id: 'ai2', title: 'Instagram Caption Set #12', type: 'Social', status: 'review' },
  { id: 'ai3', title: 'Scholarship Newsletter', type: 'Email', status: 'approved' },
  { id: 'ai4', title: 'WhatsApp Visa Tips Series', type: 'WhatsApp', status: 'published' },
  { id: 'ai5', title: 'Germany Tuition Comparison', type: 'Blog', status: 'review' },
  { id: 'ai6', title: 'Facebook Ad Copy — USA', type: 'Social', status: 'draft' },
  { id: 'ai7', title: 'Lead Nurturing Email #3', type: 'Email', status: 'published' },
  { id: 'ai8', title: 'Campus Tour Reel Script', type: 'Social', status: 'approved' },
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getWeekDay(dateStr: string): number {
  const d = new Date(dateStr).getDay();
  return d === 0 ? 6 : d - 1;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MarketingDashboard({ onNavigate }: MarketingDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [channelPerf, setChannelPerf] = useState<ChannelPerformance[]>([]);
  const [aiPipeline, setAiPipeline] = useState<AIPipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch('/api/dashboard/stats').then((r) => r.json()).catch(() => null),
        fetch('/api/reports/overview').then((r) => r.json()).catch(() => null),
      ]);
      setStats(statsRes?.data ?? statsRes ?? DEMO_STATS);
      setCampaigns(reportsRes?.campaigns ?? DEMO_CAMPAIGNS);
      setCalendarItems(reportsRes?.calendar ?? DEMO_CALENDAR);
      setChannelPerf(reportsRes?.channels ?? DEMO_CHANNEL_PERF);
      setAiPipeline(reportsRes?.aiPipeline ?? DEMO_AI_PIPELINE);
    } catch {
      setError('Failed to load marketing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCampaigns = selectedChannel
    ? campaigns.filter((c) => c.channel === selectedChannel)
    : campaigns;

  const pipelineDraft = aiPipeline.filter((p) => p.status === 'draft');
  const pipelineReview = aiPipeline.filter((p) => p.status === 'review');
  const pipelineApproved = aiPipeline.filter((p) => p.status === 'approved');
  const pipelinePublished = aiPipeline.filter((p) => p.status === 'published');

  const calendarByDay = WEEKDAYS.map((day, idx) => ({
    day,
    items: calendarItems.filter((item) => getWeekDay(item.scheduledAt) === idx),
  }));

  // ── Loading ──
  if (loading) return <LoadingGrid count={4} />;

  // ── Error ──
  if (error) {
    return (
      <EmptyState
        icon="AlertCircle"
        title="Something went wrong"
        description={error}
        action={
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 size-4" /> Retry
          </Button>
        }
      />
    );
  }

  const activeCampaigns = stats?.counts?.activeCampaigns ?? DEMO_STATS.counts?.activeCampaigns ?? 8;
  const totalReach = stats?.counts?.totalReach ?? DEMO_STATS.counts?.totalReach ?? 245600;
  const leadsGenerated = stats?.counts?.leadsGenerated ?? DEMO_STATS.counts?.leadsGenerated ?? 1247;
  const conversionRate = stats?.marketing?.conversionRate ?? DEMO_STATS.marketing?.conversionRate ?? 22.2;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="Marketing Dashboard"
        subtitle="Campaign performance, content calendar & AI production"
        icon="Megaphone"
        action={
          <Button className="gap-2 bg-alo-blue hover:bg-alo-blue/90" onClick={() => {}}>
            <Plus className="size-4" /> New Campaign
          </Button>
        }
      />

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Campaigns" value={activeCampaigns} icon="Megaphone" accent="blue" hint="across all channels" trend="+2 this week" />
        <StatCard label="Total Reach" value={fmtNumber(totalReach)} icon="Eye" accent="orange" hint="impressions this month" trend="+12.4%" />
        <StatCard label="Leads Generated" value={fmtNumber(leadsGenerated)} icon="Users" accent="emerald" hint="from all campaigns" trend="+8.1%" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon="TrendingUp" accent="sunshine" hint="lead to enrollment" trend="+1.3%" />
      </div>

      {/* ── Campaign Cards Grid ── */}
      <SectionCard
        title="Campaigns"
        description={`${filteredCampaigns.length} campaign${filteredCampaigns.length !== 1 ? 's' : ''}`}
        icon="Target"
        action={
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedChannel(null)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', !selectedChannel ? 'bg-alo-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              All
            </button>
            {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedChannel(key === selectedChannel ? null : key)}
                className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap', selectedChannel === key ? 'bg-alo-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {filteredCampaigns.length === 0 ? (
          <EmptyState icon="Megaphone" title="No campaigns found" description={selectedChannel ? 'Try a different channel filter' : 'Create your first campaign to get started'} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="group rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:shadow-md">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-alo-black truncate">{campaign.title}</h3>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <StatusBadge status={campaign.status} colorMap={CAMPAIGN_STATUS_COLORS} labels={CAMPAIGN_STATUS_LABELS} />
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          <Icon name={CHANNEL_ICONS[campaign.channel]} className="size-3" />
                          {CHANNEL_LABELS[campaign.channel]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI/Human Badges */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {campaign.aiGenerated && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 border border-violet-200">
                        <Sparkles className="size-3" /> AI Generated
                      </span>
                    )}
                    {campaign.humanApproved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="size-3" /> Human Approved
                      </span>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                      <p className="text-lg font-bold text-alo-black tabular-nums">{fmtNumber(campaign.reach)}</p>
                      <p className="text-[11px] text-alo-gray">Reach</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                      <p className="text-lg font-bold text-alo-black tabular-nums">{fmtNumber(campaign.engagement)}</p>
                      <p className="text-[11px] text-alo-gray">Engagement</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                      <p className="text-lg font-bold text-alo-blue tabular-nums">{campaign.leads}</p>
                      <p className="text-[11px] text-alo-gray">Leads</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                      <p className="text-lg font-bold text-emerald-600 tabular-nums">{campaign.conversions}</p>
                      <p className="text-[11px] text-alo-gray">Conversions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Content Calendar + Channel Performance ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Calendar */}
        <SectionCard
          className="lg:col-span-3"
          title="Content Calendar"
          description="This week's scheduled content"
          icon="Calendar"
        >
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-alo-gray py-1">
                {day}
              </div>
            ))}
            {calendarByDay.map(({ day, items }) => (
              <div key={day} className="min-h-[80px] rounded-xl border border-border bg-slate-50/50 p-1.5 space-y-1">
                {items.length === 0 && (
                  <p className="text-[10px] text-alo-gray text-center mt-4">—</p>
                )}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border bg-white p-1.5 cursor-pointer transition-colors hover:bg-alo-blue-light/50"
                  >
                    <p className="text-[10px] font-medium text-alo-black leading-tight line-clamp-2">
                      {item.title}
                    </p>
                    <span className={cn('mt-1 inline-block rounded px-1 py-0.5 text-[9px] font-medium', CALENDAR_TYPE_COLORS[item.type])}>
                      {CALENDAR_TYPE_LABELS[item.type]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Channel Performance */}
        <SectionCard
          className="lg:col-span-2"
          title="Channel Performance"
          description="Reach & engagement by channel"
          icon="BarChart3"
        >
          <div className="space-y-5">
            {channelPerf.map((ch) => (
              <div key={ch.channel}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: CHANNEL_COLORS[ch.channel] }}
                    />
                    <span className="text-sm font-medium text-alo-black">{ch.channel}</span>
                  </div>
                  <span className="text-sm text-alo-gray tabular-nums">{fmtNumber(ch.reach)}</span>
                </div>
                <MiniBar value={ch.reach} max={Math.max(...channelPerf.map((c) => c.reach), 1)} color={CHANNEL_COLORS[ch.channel]} />
                <div className="mt-1 flex items-center gap-3 text-[11px] text-alo-gray">
                  <span>Engage: {fmtNumber(ch.engagement)}</span>
                  <span>Leads: {ch.leads}</span>
                  <span>Conv: {ch.conversions}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── AI Content Production Pipeline ── */}
      <SectionCard
        title="AI Content Production"
        description="Automated content pipeline status"
        icon="Sparkles"
      >
        <div className="flex flex-wrap items-center gap-3">
          <PipelineStage label="Pending Drafts" count={pipelineDraft.length} color="amber" active={pipelineDraft.length > 0} />
          <div className="hidden sm:block text-slate-300"><ArrowRight className="size-4" /></div>
          <PipelineStage label="Awaiting Review" count={pipelineReview.length} color="orange" active={pipelineReview.length > 0} />
          <div className="hidden sm:block text-slate-300"><ArrowRight className="size-4" /></div>
          <PipelineStage label="Approved" count={pipelineApproved.length} color="blue" active={pipelineApproved.length > 0} />
          <div className="hidden sm:block text-slate-300"><ArrowRight className="size-4" /></div>
          <PipelineStage label="Published" count={pipelinePublished.length} color="emerald" active={pipelinePublished.length > 0} />
        </div>

        {/* Pipeline Items Grid */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Draft Column */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Drafts</p>
            {pipelineDraft.length === 0 ? (
              <p className="text-xs text-alo-gray">No drafts</p>
            ) : pipelineDraft.map((item) => (
              <div key={item.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                <p className="text-sm font-medium text-alo-black truncate">{item.title}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs text-alo-gray">{item.type}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Review Column */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-alo-orange">Review</p>
            {pipelineReview.length === 0 ? (
              <p className="text-xs text-alo-gray">None pending</p>
            ) : pipelineReview.map((item) => (
              <div key={item.id} className="rounded-xl border border-alo-orange/30 bg-alo-orange-light/30 p-3">
                <p className="text-sm font-medium text-alo-black truncate">{item.title}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs text-alo-gray">{item.type}</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    <Check className="size-3" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Pencil className="size-3" /> Revise
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {/* Approved Column */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-alo-blue">Approved</p>
            {pipelineApproved.length === 0 ? (
              <p className="text-xs text-alo-gray">None yet</p>
            ) : pipelineApproved.map((item) => (
              <div key={item.id} className="rounded-xl border border-alo-blue/20 bg-alo-blue-light/30 p-3">
                <p className="text-sm font-medium text-alo-black truncate">{item.title}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs text-alo-gray">{item.type}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Published Column */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Published</p>
            {pipelinePublished.length === 0 ? (
              <p className="text-xs text-alo-gray">None yet</p>
            ) : pipelinePublished.map((item) => (
              <div key={item.id} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-sm font-medium text-alo-black truncate">{item.title}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-xs text-alo-gray">{item.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── Quick Actions ── */}
      <SectionCard title="Quick Actions" icon="Zap">
        <div className="flex flex-wrap gap-2">
          <QuickAction icon="Plus" label="Create Campaign" variant="blue" onClick={() => {}} />
          <QuickAction icon="Sparkles" label="Generate Content" variant="orange" onClick={() => {}} />
          <QuickAction icon="Calendar" label="Schedule Post" variant="blue" onClick={() => {}} />
          <QuickAction icon="BarChart3" label="View Analytics" variant="emerald" onClick={() => onNavigate?.('marketing')} />
        </div>
      </SectionCard>
    </div>
  );
}
