'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Search, TrendingUp, Globe, FileText, Users, Target,
  ArrowUpRight, ArrowDownRight, BarChart3, Activity,
  Wrench, Shield, Clock, Eye, ChevronRight,
  BookOpen, Pencil, CheckCircle2, Circle, AlertTriangle,
  RefreshCw, Zap, MapPin, ArrowRight,
} from 'lucide-react';

// ── TypeScript Interfaces ──────────────────────────────────────────────────

interface KpiData {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
  sub: string;
}

interface TopKeyword {
  keyword: string;
  position: number;
  change: number;
  volume: number;
  ctr: string;
  url: string;
}

interface ContentPipelineStatus {
  published: number;
  inReview: number;
  draft: number;
  scheduled: number;
}

interface DestinationPerformance {
  destination: string;
  flag: string;
  keywordCount: number;
  traffic: number;
  maxTraffic: number;
  color: string;
}

interface SeoActivity {
  id: number;
  action: string;
  type: 'published' | 'updated' | 'keyword' | 'technical' | 'link';
  timestamp: string;
  user: string;
}

interface CompetitorVisibility {
  name: string;
  keywords: number;
  avgPosition: number;
  maxKeywords: number;
}

interface WeekMilestone {
  week: number;
  title: string;
  status: 'completed' | 'in_progress' | 'upcoming';
}

// ── Mock Data ───────────────────────────────────────────────────────────────

const kpis: KpiData[] = [
  { label: 'Organic Traffic', value: '12,847', change: '+23.5%', up: true, icon: Globe, sub: 'Sessions this month' },
  { label: 'Keywords Ranking (1–20)', value: '186', change: '+34', up: true, icon: Target, sub: 'Positions 1–20' },
  { label: 'Indexed Pages', value: '247', change: '+12', up: true, icon: FileText, sub: 'Google indexed' },
  { label: 'SEO-Originated Leads', value: '94', change: '+18.2%', up: true, icon: Users, sub: 'This month' },
  { label: 'SEO Conversion Rate', value: '0.73%', change: '+0.08%', up: true, icon: TrendingUp, sub: 'Traffic → Leads' },
  { label: 'Average Position', value: '8.4', change: '-1.2', up: true, icon: BarChart3, sub: 'Across all keywords' },
];

const topKeywords: TopKeyword[] = [
  { keyword: 'study in uk', position: 3, change: 2, volume: 18100, ctr: '42.3%', url: '/study-in-uk' },
  { keyword: 'study in uk from bangladesh', position: 2, change: 1, volume: 6600, ctr: '51.7%', url: '/study-in-uk-from-bangladesh' },
  { keyword: 'uk student visa requirements', position: 5, change: -1, volume: 14800, ctr: '28.4%', url: '/uk-student-visa-guide' },
  { keyword: 'affordable universities in uk', position: 4, change: 3, volume: 9900, ctr: '34.1%', url: '/affordable-uk-universities' },
  { keyword: 'study in usa from bangladesh', position: 7, change: 5, volume: 5400, ctr: '18.6%', url: '/study-in-usa' },
  { keyword: 'uk scholarship for bangladeshi students', position: 6, change: 2, volume: 3200, ctr: '22.3%', url: '/uk-scholarships' },
  { keyword: 'canada student visa process', position: 9, change: 4, volume: 12100, ctr: '12.8%', url: '/canada-student-visa' },
  { keyword: 'best universities in australia', position: 11, change: 8, volume: 8800, ctr: '9.1%', url: '/study-in-australia' },
  { keyword: 'ielts requirement for uk', position: 8, change: -2, volume: 7200, ctr: '15.7%', url: '/ielts-requirements-uk' },
  { keyword: 'ms in uk for international students', position: 12, change: 6, volume: 4400, ctr: '7.5%', url: '/ms-in-uk' },
];

const contentPipeline: ContentPipelineStatus = {
  published: 24,
  inReview: 8,
  draft: 14,
  scheduled: 6,
};

const destinations: DestinationPerformance[] = [
  { destination: 'United Kingdom', flag: '🇬🇧', keywordCount: 78, traffic: 5840, maxTraffic: 5840, color: 'bg-[var(--alo-success)]' },
  { destination: 'United States', flag: '🇺🇸', keywordCount: 52, traffic: 3680, maxTraffic: 5840, color: 'bg-[var(--alo-brand)]' },
  { destination: 'Canada', flag: '🇨🇦', keywordCount: 34, traffic: 2100, maxTraffic: 5840, color: 'bg-[var(--alo-error)]' },
  { destination: 'Australia', flag: '🇦🇺', keywordCount: 22, traffic: 1227, maxTraffic: 5840, color: 'bg-[var(--alo-warning)]' },
];

const recentActivities: SeoActivity[] = [
  { id: 1, action: 'Published: Complete Guide to Study in UK 2026', type: 'published', timestamp: '2 hours ago', user: 'SEO Team' },
  { id: 2, action: 'Updated: UK Student Visa Requirements & Process', type: 'updated', timestamp: '5 hours ago', user: 'Content Team' },
  { id: 3, action: 'New keyword tracked: affordable universities in uk', type: 'keyword', timestamp: '8 hours ago', user: 'SEO Team' },
  { id: 4, action: 'Fixed 404 errors on 3 program pages', type: 'technical', timestamp: '12 hours ago', user: 'Dev Team' },
  { id: 5, action: 'Published: Canada Student Visa Step-by-Step Guide', type: 'published', timestamp: '1 day ago', user: 'SEO Team' },
  { id: 6, action: 'Backlink acquired from educationblog.com', type: 'link', timestamp: '1 day ago', user: 'Outreach Team' },
  { id: 7, action: 'New keyword tracked: ielts requirement for uk', type: 'keyword', timestamp: '1 day ago', user: 'SEO Team' },
  { id: 8, action: 'Updated meta descriptions for 12 blog posts', type: 'technical', timestamp: '2 days ago', user: 'SEO Team' },
  { id: 9, action: 'Published: Top 10 UK Scholarships for Bangladeshi Students', type: 'published', timestamp: '2 days ago', user: 'Content Team' },
  { id: 10, action: 'Schema markup added to university listing pages', type: 'technical', timestamp: '3 days ago', user: 'Dev Team' },
];

const competitors: CompetitorVisibility[] = [
  { name: 'ALO Education', keywords: 186, avgPosition: 8.4, maxKeywords: 186 },
  { name: 'IDP Education', keywords: 342, avgPosition: 6.1, maxKeywords: 342 },
  { name: 'Shabuj Global', keywords: 78, avgPosition: 14.2, maxKeywords: 342 },
  { name: 'AECC Global', keywords: 215, avgPosition: 9.8, maxKeywords: 342 },
  { name: 'Edwise International', keywords: 145, avgPosition: 11.5, maxKeywords: 342 },
];

const weekMilestones: WeekMilestone[] = [
  { week: 1, title: 'Technical Audit & Fix', status: 'completed' },
  { week: 2, title: 'Keyword Research & Mapping', status: 'completed' },
  { week: 3, title: 'On-Page Optimization', status: 'completed' },
  { week: 4, title: 'Content Strategy Finalize', status: 'completed' },
  { week: 5, title: 'Pillar Pages (UK)', status: 'completed' },
  { week: 6, title: 'Pillar Pages (USA/CAN)', status: 'completed' },
  { week: 7, title: 'Blog Publishing Sprint', status: 'completed' },
  { week: 8, title: 'Link Building Outreach', status: 'completed' },
  { week: 9, title: 'Content Refresh & Optimize', status: 'in_progress' },
  { week: 10, title: 'Authority Content Push', status: 'upcoming' },
  { week: 11, title: 'Local SEO Optimization', status: 'upcoming' },
  { week: 12, title: 'Review & Scale Plan', status: 'upcoming' },
];

const TECHNICAL_HEALTH_SCORE = 78;

// ── Helper Components ────────────────────────────────────────────────────────

function ActivityTypeIcon({ type }: { type: SeoActivity['type'] }) {
  switch (type) {
    case 'published':
      return <CheckCircle2 className="w-3.5 h-3.5 text-crm-success-text" />;
    case 'updated':
      return <RefreshCw className="w-3.5 h-3.5 text-[var(--alo-brand)]" />;
    case 'keyword':
      return <Target className="w-3.5 h-3.5 text-[var(--alo-brand)]" />;
    case 'technical':
      return <Wrench className="w-3.5 h-3.5 text-crm-warning-text" />;
    case 'link':
      return <Zap className="w-3.5 h-3.5 text-[var(--alo-cta)]" />;
    default:
      return <Activity className="w-3.5 h-3.5 text-[var(--alo-text-muted)]" />;
  }
}

function ActivityTypeBadge({ type }: { type: SeoActivity['type'] }) {
  const map: Record<string, string> = {
    published: 'bg-crm-success-bg text-crm-success-text',
    updated: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
    keyword: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
    technical: 'bg-crm-warning-bg text-crm-warning-text',
    link: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]',
  };
  const labels: Record<string, string> = {
    published: 'Published',
    updated: 'Updated',
    keyword: 'Keyword',
    technical: 'Technical',
    link: 'Link',
  };
  return (
    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${map[type] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}`}>
      {labels[type]}
    </span>
  );
}

function HealthScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#059669' : score >= 60 ? '#92400E' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-[var(--alo-text)]">{score}</span>
        <span className="text-[11px] text-[var(--alo-text-muted)]">out of 100</span>
      </div>
    </div>
  );
}

function ContentPipelineBlock({ label, count, color, icon: Icon }: { label: string; count: number; color: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--alo-border)] bg-white">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-[var(--alo-text)]">{count}</p>
        <p className="text-[11px] text-[var(--alo-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CrmSeoGrowthDashboard() {
 return <section className="space-y-4 rounded-xl border bg-white p-6"><h1 className="text-2xl font-bold">SEO Growth Dashboard</h1><p role="status">Measured growth and attribution are not verified. Hard-coded traffic, conversion and revenue figures are not operational evidence.</p><a href="/crm/seo-manager" className="text-[var(--alo-brand)] underline">Open existing SEO draft and approval workbench</a><p className="text-sm">Live provider and production workflows remain unverified.</p></section>;
}
/** Historical design fixture; not an operational dashboard. */
function LegacyUnverifiedCrmSeoGrowthDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const filteredKeywords = topKeywords.filter((kw) =>
    kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedWeeks = weekMilestones.filter((w) => w.status === 'completed').length;
  const progressPercent = Math.round((completedWeeks / 12) * 100);
  const currentWeek = weekMilestones.find((w) => w.status === 'in_progress');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 bg-white min-h-screen p-4 lg:p-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--alo-text)]">SEO Growth Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge className="bg-[var(--alo-success-dark)] text-white text-[11px] hover:bg-[var(--alo-success-dark)]">
              <TrendingUp className="w-3 h-3 mr-1" />SEO Growth System
            </Badge>
            <span className="text-sm text-[var(--alo-text-muted)]">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="text-[var(--alo-body)]">
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="bg-[var(--alo-success-dark)] hover:bg-[var(--alo-success-dark)] text-white">
            <ArrowRight className="w-4 h-4" /> View Full Report
          </Button>
        </div>
      </div>

      {/* ── KPI Cards Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-white rounded-lg border border-[var(--alo-border)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-5 h-5 text-crm-success-text" />
                <span
                  className={`inline-flex items-center text-[11px] font-medium ${
                    kpi.up ? 'text-crm-success-text' : 'text-crm-danger-text'
                  }`}
                >
                  {kpi.up ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-[var(--alo-text)]">{kpi.value}</p>
              <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">{kpi.label}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)]">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 90-Day Execution Progress ───────────────────────────────── */}
      <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-crm-success-text" /> 90-Day SEO Execution Progress
            </CardTitle>
            <Badge className="bg-crm-success-bg text-crm-success-text text-[11px] hover:bg-crm-success-bg">
              Week {currentWeek?.week ?? '?'} of 12
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Progress value={progressPercent} className="h-3 bg-crm-success-bg mb-3 [&>div]:bg-[var(--alo-success)]" />
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
            {weekMilestones.map((m) => (
              <div
                key={m.week}
                className={`text-center p-2 rounded-lg border text-[11px] transition-colors ${
                  m.status === 'completed'
                    ? 'border-crm-success-border bg-crm-success-bg text-crm-success-text'
                    : m.status === 'in_progress'
                    ? 'border-crm-warning-border bg-crm-warning-bg text-crm-warning-text ring-2 ring-amber-400'
                    : 'border-[var(--alo-border)] bg-[var(--alo-page)] text-[var(--alo-text-muted)]'
                }`}
              >
                <div className="flex items-center justify-center mb-0.5">
                  {m.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-crm-success-text" />
                  ) : m.status === 'in_progress' ? (
                    <Circle className="w-3.5 h-3.5 text-crm-warning-text fill-amber-400" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[var(--alo-placeholder)]" />
                  )}
                </div>
                <p className="font-semibold">W{m.week}</p>
                <p className="leading-tight mt-0.5 hidden sm:block">{m.title}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Main Content Grid ──────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--alo-surface-muted)]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ──────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column — Keywords Table + Destinations */}
            <div className="lg:col-span-2 space-y-6">
              {/* Content Pipeline */}
              <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-crm-success-text" /> Content Pipeline Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ContentPipelineBlock label="Published" count={contentPipeline.published} color="bg-[var(--alo-success)]" icon={CheckCircle2} />
                    <ContentPipelineBlock label="In Review" count={contentPipeline.inReview} color="bg-[var(--alo-brand)]" icon={Eye} />
                    <ContentPipelineBlock label="Draft" count={contentPipeline.draft} color="bg-[var(--alo-warning)]" icon={Pencil} />
                    <ContentPipelineBlock label="Scheduled" count={contentPipeline.scheduled} color="bg-[var(--alo-brand-pale)]0" icon={Clock} />
                  </div>
                  <div className="mt-4">
                    <div className="flex h-3 rounded-full overflow-hidden bg-[var(--alo-surface-muted)]">
                      <div className="bg-[var(--alo-success)]" style={{ width: `${(contentPipeline.published / 52) * 100}%` }} />
                      <div className="bg-[var(--alo-brand)]" style={{ width: `${(contentPipeline.inReview / 52) * 100}%` }} />
                      <div className="bg-[var(--alo-warning)]" style={{ width: `${(contentPipeline.draft / 52) * 100}%` }} />
                      <div className="bg-[var(--alo-brand-pale)]0" style={{ width: `${(contentPipeline.scheduled / 52) * 100}%` }} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--alo-text-muted)]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--alo-success)]" />Published</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--alo-brand)]" />In Review</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--alo-warning)]" />Draft</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--alo-brand-pale)]0" />Scheduled</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Destination Performance */}
              <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-crm-success-text" /> Destination Performance Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {destinations.map((d) => (
                      <div key={d.destination} className="p-4 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] hover:border-crm-success-border transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{d.flag}</span>
                          <span className="text-sm font-semibold text-[var(--alo-text)]">{d.destination}</span>
                        </div>
                        <div className="flex items-end gap-1 h-20">
                          <div className="w-full rounded-t-md bg-[var(--alo-page)] overflow-hidden">
                            <div
                              className={`w-full ${d.color} rounded-t-md transition-all`}
                              style={{ height: `${(d.traffic / d.maxTraffic) * 100}%`, marginTop: `${100 - (d.traffic / d.maxTraffic) * 100}%` }}
                            />
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--alo-text-muted)]">Keywords</span>
                          <span className="text-xs font-semibold text-[var(--alo-text)]">{d.keywordCount}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-[var(--alo-text-muted)]">Traffic</span>
                          <span className="text-xs font-semibold text-crm-success-text">{d.traffic.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column — Activity Feed + Health Score */}
            <div className="space-y-6">
              {/* Technical SEO Health */}
              <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-crm-success-text" /> Technical SEO Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center py-2">
                    <HealthScoreRing score={TECHNICAL_HEALTH_SCORE} />
                    <p className="text-sm font-medium text-crm-warning-text mt-3 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Needs Improvement
                    </p>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    {[
                      { label: 'Core Web Vitals', value: 'Pass', pass: true },
                      { label: 'Mobile Friendly', value: 'Pass', pass: true },
                      { label: 'HTTPS / SSL', value: 'Pass', pass: true },
                      { label: 'Structured Data', value: 'Partial', pass: false },
                      { label: 'Crawl Errors', value: '3 issues', pass: false },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs text-[var(--alo-body)]">{item.label}</span>
                        <Badge
                          className={`text-[11px] hover:${
                            item.pass ? 'bg-crm-success-bg text-crm-success-text hover:bg-crm-success-bg' : 'bg-crm-warning-bg text-crm-warning-text hover:bg-crm-warning-bg'
                          }`}
                          variant="outline"
                          style={{
                            backgroundColor: item.pass ? '#ecfdf5' : 'var(--alo-warning-soft)',
                            color: item.pass ? '#047857' : '#b45309',
                            borderColor: item.pass ? '#a7f3d0' : '#fde68a',
                          }}
                        >
                          {item.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent SEO Activity Feed */}
              <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
                      <Activity className="w-4 h-4 text-crm-success-text" /> Recent Activity
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px]">Last 10</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {recentActivities.map((act) => (
                      <div key={act.id} className="p-2.5 rounded-lg border border-[var(--alo-border)] hover:bg-[var(--alo-page)] transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            <ActivityTypeIcon type={act.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <ActivityTypeBadge type={act.type} />
                              <span className="text-[11px] text-[var(--alo-text-muted)] whitespace-nowrap">{act.timestamp}</span>
                            </div>
                            <p className="text-xs text-[var(--alo-body)] leading-relaxed truncate">{act.action}</p>
                            <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">{act.user}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Keywords Tab ──────────────────────────────────────────── */}
        <TabsContent value="keywords" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
                      <Target className="w-4 h-4 text-crm-success-text" /> Top Performing Keywords
                    </CardTitle>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)]" />
                      <Input
                        placeholder="Search keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs text-[var(--alo-text-muted)]">Keyword</TableHead>
                          <TableHead className="text-xs text-[var(--alo-text-muted)] text-center">Position</TableHead>
                          <TableHead className="text-xs text-[var(--alo-text-muted)] text-center">Change</TableHead>
                          <TableHead className="text-xs text-[var(--alo-text-muted)] text-right">Volume</TableHead>
                          <TableHead className="text-xs text-[var(--alo-text-muted)] text-right">CTR</TableHead>
                          <TableHead className="text-xs text-[var(--alo-text-muted)]">URL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredKeywords.map((kw) => (
                          <TableRow key={kw.keyword}>
                            <TableCell className="text-sm font-medium text-[var(--alo-text)]">{kw.keyword}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={`text-[11px] hover:opacity-80 ${
                                  kw.position <= 3
                                    ? 'bg-crm-success-bg text-crm-success-text hover:bg-crm-success-bg'
                                    : kw.position <= 10
                                    ? 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]'
                                    : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] hover:bg-[var(--alo-surface-muted)]'
                                }`}
                                variant="outline"
                              >
                                #{kw.position}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`text-xs font-semibold flex items-center justify-center gap-0.5 ${kw.change > 0 ? 'text-crm-success-text' : 'text-crm-danger-text'}`}>
                                {kw.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(kw.change)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-[var(--alo-body)] text-right">{kw.volume.toLocaleString()}</TableCell>
                            <TableCell className="text-sm font-medium text-[var(--alo-body)] text-right">{kw.ctr}</TableCell>
                            <TableCell className="text-xs text-[var(--alo-text-muted)]">{kw.url}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competitor Comparison */}
            <div className="space-y-6">
              <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-crm-success-text" /> Competitor Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competitors.map((comp, i) => (
                      <div key={comp.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${i === 0 ? 'text-crm-success-text' : 'text-[var(--alo-body)]'}`}>
                            {comp.name}
                            {i === 0 && (
                              <Badge className="bg-crm-success-bg text-crm-success-text text-[11px] ml-1.5 hover:bg-crm-success-bg" variant="outline">You</Badge>
                            )}
                          </span>
                          <span className="text-xs text-[var(--alo-text-muted)]">{comp.keywords} keywords</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-[var(--alo-surface-muted)] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              i === 0 ? 'bg-[var(--alo-success)]' : 'bg-[var(--alo-page)]'
                            }`}
                            style={{ width: `${(comp.keywords / comp.maxKeywords) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">Avg Position: {comp.avgPosition}</p>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="p-3 rounded-lg bg-crm-success-bg border border-crm-success-border">
                    <p className="text-xs text-crm-success-text font-medium flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3" /> Opportunity Gap
                    </p>
                    <p className="text-[11px] text-crm-success-text mt-1">
                      You rank for 186 keywords vs IDP&apos;s 342. Focus on long-tail keywords in the USA &amp; Canada segments to close the gap.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Content Tab ────────────────────────────────────────────── */}
        <TabsContent value="content" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-crm-success-text" /> Content Pipeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <ContentPipelineBlock label="Published" count={contentPipeline.published} color="bg-[var(--alo-success)]" icon={CheckCircle2} />
                    <ContentPipelineBlock label="In Review" count={contentPipeline.inReview} color="bg-[var(--alo-brand)]" icon={Eye} />
                    <ContentPipelineBlock label="Draft" count={contentPipeline.draft} color="bg-[var(--alo-warning)]" icon={Pencil} />
                    <ContentPipelineBlock label="Scheduled" count={contentPipeline.scheduled} color="bg-[var(--alo-brand-pale)]0" icon={Clock} />
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {[
                      { title: 'Complete Guide to Study in UK 2026', status: 'published', date: 'Dec 10' },
                      { title: 'Canada Student Visa Step-by-Step Guide', status: 'published', date: 'Dec 8' },
                      { title: 'Top 10 UK Scholarships for Bangladeshi Students', status: 'published', date: 'Dec 6' },
                      { title: 'How to Write a Winning SOP for UK Universities', status: 'in_review', date: 'Dec 12' },
                      { title: 'Study in USA: Complete University Guide', status: 'in_review', date: 'Dec 12' },
                      { title: 'IELTS vs TOEFL: Which One for UK Study?', status: 'draft', date: 'Dec 14' },
                      { title: 'Australia Nursing Programs Guide 2026', status: 'draft', date: 'Dec 15' },
                      { title: 'Part-Time Work Rules for International Students in UK', status: 'scheduled', date: 'Dec 18' },
                    ].map((item, i) => {
                      const statusMap: Record<string, { bg: string; text: string }> = {
                        published: { bg: 'bg-crm-success-bg', text: 'text-crm-success-text' },
                        in_review: { bg: 'bg-[var(--alo-brand-pale)]', text: 'text-[var(--alo-brand)]' },
                        draft: { bg: 'bg-crm-warning-bg', text: 'text-crm-warning-text' },
                        scheduled: { bg: 'bg-[var(--alo-brand-pale)]', text: 'text-[var(--alo-brand)]' },
                      };
                      const s = statusMap[item.status] || statusMap.draft;
                      return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[var(--alo-border)] hover:bg-[var(--alo-page)] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-[var(--alo-text-muted)] flex-shrink-0" />
                            <span className="text-sm text-[var(--alo-body)] truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[11px] text-[var(--alo-text-muted)]">{item.date}</span>
                            <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${s.bg} ${s.text}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-crm-success-text" /> Destination Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {destinations.map((d) => (
                      <div key={d.destination} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{d.flag}</span>
                          <span className="text-sm font-medium text-[var(--alo-body)]">{d.destination}</span>
                        </div>
                        <div className="flex items-end gap-1 h-16">
                          <div className="w-full rounded-t-md bg-[var(--alo-page)] overflow-hidden">
                            <div
                              className={`w-full ${d.color} rounded-t-md transition-all`}
                              style={{ height: `${(d.traffic / d.maxTraffic) * 100}%`, marginTop: `${100 - (d.traffic / d.maxTraffic) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--alo-text-muted)]">{d.keywordCount} keywords</span>
                          <span className="font-semibold text-[var(--alo-body)]">{d.traffic.toLocaleString()} sessions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Technical Tab ──────────────────────────────────────────── */}
        <TabsContent value="technical" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-crm-success-text" /> Technical SEO Health Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Core Web Vitals', score: '94/100', status: 'pass', detail: 'LCP: 1.8s, FID: 12ms, CLS: 0.02' },
                      { label: 'Mobile Usability', score: '100/100', status: 'pass', detail: 'All pages mobile-friendly' },
                      { label: 'HTTPS Security', score: '100/100', status: 'pass', detail: 'SSL certificate valid' },
                      { label: 'Page Speed', score: '87/100', status: 'pass', detail: 'Avg load: 2.1s' },
                      { label: 'Structured Data', score: '65/100', status: 'partial', detail: 'Missing FAQ schema on 14 pages' },
                      { label: 'XML Sitemap', score: '100/100', status: 'pass', detail: '247 URLs submitted, 241 indexed' },
                      { label: 'Robots.txt', score: '100/100', status: 'pass', detail: 'Properly configured' },
                      { label: 'Canonical Tags', score: '72/100', status: 'partial', detail: 'Self-referencing missing on 38 pages' },
                      { label: 'Crawl Errors', score: '60/100', status: 'fail', detail: '3 404 errors, 2 redirect chains' },
                      { label: 'Internal Links', score: '81/100', status: 'pass', detail: 'Orphan pages: 5 found' },
                    ].map((item) => (
                      <div key={item.label} className="p-4 rounded-lg border border-[var(--alo-border)] hover:bg-[var(--alo-page)] transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[var(--alo-text)]">{item.label}</span>
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                              item.status === 'pass'
                                ? 'bg-crm-success-bg text-crm-success-text'
                                : item.status === 'partial'
                                ? 'bg-crm-warning-bg text-crm-warning-text'
                                : 'bg-crm-danger-bg text-crm-danger-text'
                            }`}
                          >
                            {item.score}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--alo-text-muted)]">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-white rounded-lg border border-[var(--alo-border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[var(--alo-text)] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-crm-success-text" /> Overall Health Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center py-4">
                    <HealthScoreRing score={TECHNICAL_HEALTH_SCORE} />
                    <p className="text-sm font-medium text-crm-warning-text mt-3 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Needs Improvement
                    </p>
                    <p className="text-xs text-[var(--alo-text-muted)] mt-1 text-center">
                      Fix crawl errors and add structured data to reach 85+
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
