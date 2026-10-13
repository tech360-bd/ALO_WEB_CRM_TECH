'use client';

import { useState, useCallback } from 'react';
import {
  BarChart3, Eye, Users, Timer, TrendingUp, TrendingDown,
  Globe, Monitor, Smartphone, Tablet, MapPin, ArrowRight,
  Search, Filter, RefreshCcw, Download, Calendar, Clock,
  Shield, ExternalLink, ChevronRight, Activity, Zap,
  FileText, MousePointerClick, Play, Share2, Link2,
  Mail, ArrowUpRight, ArrowDownRight, Minus,
  Layers, Hash, Target, ShoppingBag, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  StatCard, SectionCard, PageHeader, StatusBadge, Icon, InfoRow, MiniBar,
} from '@/components/alo/shared';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────

interface AnalyticsDashboardPageProps {
  onBack?: () => void;
  onNavigate?: (view: string, slug?: string) => void;
}

// ─── Umami-inspired Analytics Data ──────────────────────────────────

const HOURLY_VISITORS = [
  { hour: '00', visitors: 12, pageViews: 34 }, { hour: '01', visitors: 8, pageViews: 22 },
  { hour: '02', visitors: 5, pageViews: 14 }, { hour: '03', visitors: 3, pageViews: 8 },
  { hour: '04', visitors: 4, pageViews: 11 }, { hour: '05', visitors: 7, pageViews: 19 },
  { hour: '06', visitors: 15, pageViews: 42 }, { hour: '07', visitors: 28, pageViews: 78 },
  { hour: '08', visitors: 45, pageViews: 126 }, { hour: '09', visitors: 67, pageViews: 189 },
  { hour: '10', visitors: 82, pageViews: 231 }, { hour: '11', visitors: 91, pageViews: 256 },
  { hour: '12', visitors: 78, pageViews: 218 }, { hour: '13', visitors: 85, pageViews: 238 },
  { hour: '14', visitors: 93, pageViews: 261 }, { hour: '15', visitors: 88, pageViews: 247 },
  { hour: '16', visitors: 76, pageViews: 213 }, { hour: '17', visitors: 62, pageViews: 174 },
  { hour: '18', visitors: 48, pageViews: 135 }, { hour: '19', visitors: 39, pageViews: 109 },
  { hour: '20', visitors: 31, pageViews: 87 }, { hour: '21', visitors: 25, pageViews: 70 },
  { hour: '22', visitors: 19, pageViews: 53 }, { hour: '23', visitors: 14, pageViews: 39 },
];

const DAILY_TREND = [
  { date: 'Mon', visitors: 423, pageViews: 1189, bounceRate: 42 }, { date: 'Tue', visitors: 512, pageViews: 1436, bounceRate: 38 },
  { date: 'Wed', visitors: 489, pageViews: 1372, bounceRate: 40 }, { date: 'Thu', visitors: 567, pageViews: 1590, bounceRate: 36 },
  { date: 'Fri', visitors: 534, pageViews: 1498, bounceRate: 37 }, { date: 'Sat', visitors: 312, pageViews: 876, bounceRate: 48 },
  { date: 'Sun', visitors: 278, pageViews: 780, bounceRate: 51 },
];

const TOP_PAGES = [
  { page: '/', title: 'Homepage', views: 4523, visitors: 3210, bounceRate: 32, avgTime: '2m 14s' },
  { page: '/courses', title: 'Course Finder', views: 2891, visitors: 1876, bounceRate: 28, avgTime: '3m 42s' },
  { page: '/universities', title: 'Universities', views: 2345, visitors: 1523, bounceRate: 35, avgTime: '2m 58s' },
  { page: '/about', title: 'About ALO', views: 1567, visitors: 1234, bounceRate: 45, avgTime: '1m 32s' },
  { page: '/scholarships', title: 'Scholarships', views: 1432, visitors: 987, bounceRate: 38, avgTime: '2m 45s' },
  { page: '/contact', title: 'Contact Us', views: 1298, visitors: 876, bounceRate: 52, avgTime: '1m 08s' },
  { page: '/blog', title: 'Blog', views: 1156, visitors: 789, bounceRate: 41, avgTime: '3m 15s' },
  { page: '/destinations', title: 'Destinations', views: 987, visitors: 654, bounceRate: 36, avgTime: '2m 30s' },
  { page: '/exams', title: 'Exam Pages', views: 876, visitors: 567, bounceRate: 39, avgTime: '2m 12s' },
  { page: '/visa-guide', title: 'Visa Guide', views: 765, visitors: 498, bounceRate: 33, avgTime: '4m 05s' },
];

const CUSTOM_EVENTS = [
  { name: 'Lead Form Submitted', category: 'Conversion', count: 342, unique: 289, trend: 12.5, lastTriggered: '2 min ago' },
  { name: 'CTA: Apply Now Clicked', category: 'CTA', count: 891, unique: 678, trend: 8.3, lastTriggered: '5 min ago' },
  { name: 'CTA: Download Brochure', category: 'CTA', count: 567, unique: 456, trend: -2.1, lastTriggered: '12 min ago' },
  { name: 'Video: Testimonial Played', category: 'Media', count: 234, unique: 198, trend: 15.7, lastTriggered: '18 min ago' },
  { name: 'Search: Course Finder Used', category: 'Search', count: 1234, unique: 987, trend: 5.4, lastTriggered: '1 min ago' },
  { name: 'Scholarship: Eligibility Check', category: 'Feature', count: 456, unique: 389, trend: 22.1, lastTriggered: '8 min ago' },
  { name: 'Chat: AI Assistant Started', category: 'Feature', count: 789, unique: 634, trend: 18.6, lastTriggered: '3 min ago' },
  { name: 'Auth: Student Registered', category: 'Conversion', count: 156, unique: 156, trend: 6.8, lastTriggered: '25 min ago' },
  { name: 'Document: Upload Completed', category: 'Feature', count: 89, unique: 76, trend: -5.2, lastTriggered: '1 hr ago' },
  { name: 'Payment: Fee Submitted', category: 'Conversion', count: 67, unique: 67, trend: 3.1, lastTriggered: '2 hr ago' },
];

const REFERRERS = [
  { source: 'Google', type: 'search', visitors: 4523, pageViews: 12674, bounceRate: 38 },
  { source: 'Direct', type: 'direct', visitors: 1876, pageViews: 5263, bounceRate: 32 },
  { source: 'Facebook', type: 'social', visitors: 1234, pageViews: 3456, bounceRate: 45 },
  { source: 'LinkedIn', type: 'social', visitors: 876, pageViews: 2453, bounceRate: 36 },
  { source: 'YouTube', type: 'social', visitors: 654, pageViews: 1832, bounceRate: 42 },
  { source: 'Bing', type: 'search', visitors: 432, pageViews: 1209, bounceRate: 41 },
  { source: 'WhatsApp', type: 'social', visitors: 321, pageViews: 898, bounceRate: 28 },
  { source: 'edu.bd sites', type: 'referral', visitors: 287, pageViews: 804, bounceRate: 35 },
  { source: 'Instagram', type: 'social', visitors: 198, pageViews: 554, bounceRate: 52 },
];

const UTM_CAMPAIGNS = [
  { campaign: 'spring_2025_uk', source: 'google', medium: 'cpc', visitors: 1234, conversions: 89, spend: '$1,250', cpa: '$14.04' },
  { campaign: 'ielts_promo', source: 'facebook', medium: 'social', visitors: 876, conversions: 45, spend: '$680', cpa: '$15.11' },
  { campaign: 'scholarship_awareness', source: 'linkedin', medium: 'social', visitors: 567, conversions: 34, spend: '$420', cpa: '$12.35' },
  { campaign: 'brand_awareness', source: 'google', medium: 'display', visitors: 2345, conversions: 12, spend: '$890', cpa: '$74.17' },
  { campaign: 'whatsapp_nurture', source: 'whatsapp', medium: 'chat', visitors: 432, conversions: 67, spend: '$0', cpa: '$0.00' },
];

const DEVICES = {
  browsers: [
    { name: 'Chrome', share: 58.2, visitors: 4523 },
    { name: 'Safari', share: 24.1, visitors: 1876 },
    { name: 'Firefox', share: 8.6, visitors: 669 },
    { name: 'Edge', share: 6.3, visitors: 490 },
    { name: 'Samsung Internet', share: 1.8, visitors: 140 },
    { name: 'Other', share: 1.0, visitors: 78 },
  ],
  os: [
    { name: 'Windows', share: 42.3, visitors: 3291 },
    { name: 'macOS', share: 18.7, visitors: 1455 },
    { name: 'Android', share: 22.4, visitors: 1743 },
    { name: 'iOS', share: 14.2, visitors: 1105 },
    { name: 'Linux', share: 1.8, visitors: 140 },
    { name: 'Other', share: 0.6, visitors: 47 },
  ],
  deviceTypes: [
    { name: 'Desktop', share: 61.0, visitors: 4748, icon: 'Monitor' },
    { name: 'Mobile', share: 34.6, visitors: 2693, icon: 'Smartphone' },
    { name: 'Tablet', share: 4.4, visitors: 342, icon: 'Tablet' },
  ],
  countries: [
    { name: 'Bangladesh', flag: '🇧🇩', visitors: 4523, pct: 40.2 },
    { name: 'India', flag: '🇮🇳', visitors: 1876, pct: 16.7 },
    { name: 'Nigeria', flag: '🇳🇬', visitors: 987, pct: 8.8 },
    { name: 'Pakistan', flag: '🇵🇰', visitors: 654, pct: 5.8 },
    { name: 'UAE', flag: '🇦🇪', visitors: 432, pct: 3.8 },
    { name: 'UK', flag: '🇬🇧', visitors: 389, pct: 3.5 },
    { name: 'Sri Lanka', flag: '🇱🇰', visitors: 321, pct: 2.9 },
    { name: 'Nepal', flag: '🇳🇵', visitors: 287, pct: 2.6 },
    { name: 'Malaysia', flag: '🇲🇾', visitors: 198, pct: 1.8 },
    { name: 'USA', flag: '🇺🇸', visitors: 176, pct: 1.6 },
  ],
};

const PIE_COLORS = ['#0052B8', '#E8501A', '#15803D', '#C2410C', '#7C3AED', '#94A3B8'];

// ─── Component ──────────────────────────────────────────────────────

export function AnalyticsDashboardPage({ onBack, onNavigate }: AnalyticsDashboardPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');

  const totalVisitors = DAILY_TREND.reduce((a, d) => a + d.visitors, 0);
  const totalPageViews = DAILY_TREND.reduce((a, d) => a + d.pageViews, 0);
  const avgBounce = Math.round(DAILY_TREND.reduce((a, d) => a + d.bounceRate, 0) / DAILY_TREND.length);
  const currentVisitors = HOURLY_VISITORS[14]?.visitors || 88;

  // ─── Render: Overview Tab ──────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Current Online" value={currentVisitors} icon="Activity" accent="emerald" hint="real-time visitors" trend="+12%" />
        <StatCard label="Total Visitors" value={totalVisitors.toLocaleString()} icon="Users" accent="blue" hint="last 7 days" trend="+8.4%" />
        <StatCard label="Page Views" value={totalPageViews.toLocaleString()} icon="Eye" accent="orange" hint="last 7 days" trend="+5.2%" />
        <StatCard label="Bounce Rate" value={`${avgBounce}%`} icon="TrendingDown" accent="violet" hint="avg this week" trend="-3.1%" />
      </div>

      {/* Real-time visitors chart */}
      <SectionCard title="Visitors Today" description="Real-time hourly visitor breakdown" icon="Activity">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HOURLY_VISITORS}>
              <defs>
                <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0052B8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0052B8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                formatter={(value: number, name: string) => [value, name === 'visitors' ? 'Visitors' : 'Page Views']}
              />
              <Area type="monotone" dataKey="visitors" stroke="#0052B8" strokeWidth={2} fill="url(#visGrad)" />
              <Area type="monotone" dataKey="pageViews" stroke="#E8501A" strokeWidth={2} fill="none" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[#0052B8]" /> Visitors</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[#E8501A] border-dashed" /> Page Views</span>
        </div>
      </SectionCard>

      {/* Weekly trend */}
      <SectionCard title="Weekly Trend" description="Visitors and page views over the past week" icon="TrendingUp">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DAILY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
              <Bar dataKey="visitors" fill="#0052B8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pageViews" fill="#E8501A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#0052B8]" /> Visitors</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#E8501A]" /> Page Views</span>
        </div>
      </SectionCard>

      {/* Avg session time + bounce rate line */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Bounce Rate Trend" description="Daily bounce rate this week" icon="TrendingDown">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DAILY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} domain={[0, 60]} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Line type="monotone" dataKey="bounceRate" stroke="#E8501A" strokeWidth={2} dot={{ fill: '#E8501A', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Top Pages Quick View" description="Most visited pages today" icon="FileText">
          <div className="space-y-2">
            {TOP_PAGES.slice(0, 5).map((p, i) => (
              <div key={p.page} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-[#94A3B8] w-4">{i + 1}</span>
                  <span className="text-sm font-medium text-[#0F172A] truncate">{p.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm tabular-nums text-[#475569]">{p.views.toLocaleString()}</span>
                  <MiniBar value={p.views} max={TOP_PAGES[0].views} color="#0052B8" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );

  // ─── Render: Pages Tab ─────────────────────────────────────────────
  const renderPages = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Pages" value="24" icon="FileText" accent="blue" />
        <StatCard label="Avg Time on Page" value="2m 38s" icon="Timer" accent="emerald" />
        <StatCard label="Entry Rate" value="68%" icon="ArrowUpRight" accent="orange" />
        <StatCard label="Exit Rate" value="32%" icon="ArrowDownRight" accent="violet" />
      </div>

      {/* Top pages table */}
      <SectionCard title="Top Pages" description="Pages ranked by total views" icon="BarChart3" action={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#64748B]" />
            <Input placeholder="Search pages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 w-48 text-sm border-[#E2E8F0]" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="size-3.5" /> Export</Button>
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="pb-2 text-left font-medium text-[#64748B]">#</th>
                <th className="pb-2 text-left font-medium text-[#64748B]">Page</th>
                <th className="pb-2 text-right font-medium text-[#64748B]">Views</th>
                <th className="pb-2 text-right font-medium text-[#64748B]">Visitors</th>
                <th className="pb-2 text-right font-medium text-[#64748B]">Bounce Rate</th>
                <th className="pb-2 text-right font-medium text-[#64748B]">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {TOP_PAGES.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((p, i) => (
                <tr key={p.page} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                  <td className="py-2.5 text-[#94A3B8]">{i + 1}</td>
                  <td className="py-2.5">
                    <div>
                      <span className="font-medium text-[#0F172A]">{p.title}</span>
                      <span className="ml-2 text-xs text-[#94A3B8] font-mono">{p.page}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-medium text-[#0F172A]">{p.views.toLocaleString()}</td>
                  <td className="py-2.5 text-right tabular-nums text-[#475569]">{p.visitors.toLocaleString()}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <MiniBar value={p.bounceRate} max={100} color={p.bounceRate > 45 ? '#DC2626' : p.bounceRate > 35 ? '#C2410C' : '#15803D'} />
                      <span className={cn('tabular-nums', p.bounceRate > 45 ? 'text-red-600' : p.bounceRate > 35 ? 'text-amber-600' : 'text-emerald-600')}>{p.bounceRate}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-[#475569]">{p.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Page flow */}
      <SectionCard title="Page Flow" description="Common navigation paths through the site" icon="ArrowRight">
        <div className="space-y-3">
          {[
            { path: ['Homepage', 'Course Finder', 'University Detail'], count: 1234, pct: 18 },
            { path: ['Homepage', 'Scholarships', 'Contact'], count: 876, pct: 13 },
            { path: ['Google', 'Course Finder', 'Apply Now'], count: 654, pct: 10 },
            { path: ['Homepage', 'Blog', 'Scholarships'], count: 432, pct: 6 },
            { path: ['Facebook', 'Destinations', 'Contact'], count: 321, pct: 5 },
          ].map((flow, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5">
                {flow.path.map((step, j) => (
                  <div key={j} className="flex items-center gap-1.5">
                    {j > 0 && <ChevronRight className="size-3.5 text-[#94A3B8]" />}
                    <span className={cn(
                      'px-2 py-1 rounded-md text-xs font-medium',
                      j === 0 ? 'bg-[#EFF6FF] text-[#2563EB]' : j === flow.path.length - 1 ? 'bg-[#FFF7ED] text-[#C2410C]' : 'bg-[#F1F5F9] text-[#475569]'
                    )}>{step}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium tabular-nums text-[#0F172A]">{flow.count.toLocaleString()}</span>
                <span className="text-xs text-[#94A3B8]">{flow.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  // ─── Render: Events Tab ────────────────────────────────────────────
  const renderEvents = () => {
    const totalEvents = CUSTOM_EVENTS.reduce((a, e) => a + e.count, 0);
    const totalUnique = CUSTOM_EVENTS.reduce((a, e) => a + e.unique, 0);
    const conversionEvents = CUSTOM_EVENTS.filter(e => e.category === 'Conversion');
    const totalConversions = conversionEvents.reduce((a, e) => a + e.count, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Events" value={totalEvents.toLocaleString()} icon="Zap" accent="blue" hint="last 7 days" />
          <StatCard label="Unique Events" value={totalUnique.toLocaleString()} icon="Users" accent="emerald" />
          <StatCard label="Conversions" value={totalConversions.toLocaleString()} icon="Target" accent="orange" />
          <StatCard label="Conv. Rate" value="3.8%" icon="TrendingUp" accent="violet" trend="+0.4%" />
        </div>

        {/* Event category breakdown */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Events by Category" icon="PieChart">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Conversion', value: CUSTOM_EVENTS.filter(e => e.category === 'Conversion').reduce((a, e) => a + e.count, 0) },
                      { name: 'CTA', value: CUSTOM_EVENTS.filter(e => e.category === 'CTA').reduce((a, e) => a + e.count, 0) },
                      { name: 'Feature', value: CUSTOM_EVENTS.filter(e => e.category === 'Feature').reduce((a, e) => a + e.count, 0) },
                      { name: 'Media', value: CUSTOM_EVENTS.filter(e => e.category === 'Media').reduce((a, e) => a + e.count, 0) },
                      { name: 'Search', value: CUSTOM_EVENTS.filter(e => e.category === 'Search').reduce((a, e) => a + e.count, 0) },
                    ]}
                    cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                    dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Top Converting Events" icon="Target">
            <div className="space-y-3">
              {conversionEvents.map(ev => (
                <div key={ev.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0F172A]">{ev.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums font-medium text-[#E8501A]">{ev.count}</span>
                    <MiniBar value={ev.count} max={conversionEvents[0].count} color="#E8501A" />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* All events table */}
        <SectionCard title="Custom Events" description="All tracked events with counts and trends" icon="Zap">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="pb-2 text-left font-medium text-[#64748B]">Event</th>
                  <th className="pb-2 text-left font-medium text-[#64748B]">Category</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">Count</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">Unique</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">Trend</th>
                  <th className="pb-2 text-left font-medium text-[#64748B]">Last</th>
                </tr>
              </thead>
              <tbody>
                {CUSTOM_EVENTS.map(ev => (
                  <tr key={ev.name} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                    <td className="py-2.5 font-medium text-[#0F172A]">{ev.name}</td>
                    <td className="py-2.5">
                      <Badge variant="outline" className="text-[10px]">{ev.category}</Badge>
                    </td>
                    <td className="py-2.5 text-right tabular-nums font-medium text-[#0F172A]">{ev.count.toLocaleString()}</td>
                    <td className="py-2.5 text-right tabular-nums text-[#475569]">{ev.unique.toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span className={cn('inline-flex items-center gap-0.5 tabular-nums text-xs font-medium', ev.trend > 0 ? 'text-emerald-600' : ev.trend < 0 ? 'text-red-600' : 'text-[#94A3B8]')}>
                        {ev.trend > 0 ? <ArrowUpRight className="size-3" /> : ev.trend < 0 ? <ArrowDownRight className="size-3" /> : <Minus className="size-3" />}
                        {Math.abs(ev.trend)}%
                      </span>
                    </td>
                    <td className="py-2.5 text-[#64748B]">{ev.lastTriggered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  };

  // ─── Render: Referrers Tab ─────────────────────────────────────────
  const renderReferrers = () => {
    const totalRefVisitors = REFERRERS.reduce((a, r) => a + r.visitors, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Traffic Sources" value={REFERRERS.length} icon="Globe" accent="blue" />
          <StatCard label="Organic Search" value="62%" icon="Search" accent="emerald" hint="of total traffic" />
          <StatCard label="Social" value="24%" icon="Share2" accent="orange" hint="of total traffic" />
          <StatCard label="Direct" value="14%" icon="Link2" accent="violet" hint="of total traffic" />
        </div>

        {/* Source breakdown */}
        <SectionCard title="Traffic Sources" description="Where visitors come from" icon="Globe">
          <div className="space-y-2">
            {REFERRERS.map(r => (
              <div key={r.source} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex size-8 items-center justify-center rounded-lg',
                    r.type === 'search' ? 'bg-emerald-50 text-emerald-600' :
                    r.type === 'social' ? 'bg-blue-50 text-blue-600' :
                    r.type === 'direct' ? 'bg-violet-50 text-violet-600' :
                    'bg-amber-50 text-amber-600'
                  )}>
                    {r.type === 'search' ? <Search className="size-4" /> :
                     r.type === 'social' ? <Share2 className="size-4" /> :
                     r.type === 'direct' ? <Link2 className="size-4" /> :
                     <ExternalLink className="size-4" />}
                  </div>
                  <div>
                    <span className="font-medium text-[#0F172A]">{r.source}</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">{r.type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-[#0F172A]">{r.visitors.toLocaleString()}</p>
                    <p className="text-[10px] text-[#94A3B8]">{((r.visitors / totalRefVisitors) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="w-24">
                    <MiniBar value={r.visitors} max={REFERRERS[0].visitors} color={r.type === 'search' ? '#15803D' : r.type === 'social' ? '#2563EB' : '#7C3AED'} />
                  </div>
                  <div className="text-right w-16">
                    <span className={cn('text-xs tabular-nums', r.bounceRate > 45 ? 'text-red-600' : 'text-[#475569]')}>{r.bounceRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* UTM Campaigns */}
        <SectionCard title="UTM Campaign Tracking" description="Marketing campaign performance by UTM parameters" icon="Target">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="pb-2 text-left font-medium text-[#64748B]">Campaign</th>
                  <th className="pb-2 text-left font-medium text-[#64748B]">Source / Medium</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">Visitors</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">Conversions</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">Spend</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">CPA</th>
                </tr>
              </thead>
              <tbody>
                {UTM_CAMPAIGNS.map(c => (
                  <tr key={c.campaign} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                    <td className="py-2.5 font-medium text-[#0F172A]">{c.campaign}</td>
                    <td className="py-2.5 text-[#475569]">{c.source} / {c.medium}</td>
                    <td className="py-2.5 text-right tabular-nums text-[#0F172A]">{c.visitors.toLocaleString()}</td>
                    <td className="py-2.5 text-right tabular-nums text-[#E8501A] font-medium">{c.conversions}</td>
                    <td className="py-2.5 text-right tabular-nums text-[#475569]">{c.spend}</td>
                    <td className="py-2.5 text-right tabular-nums font-medium text-[#0F172A]">{c.cpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  };

  // ─── Render: Devices Tab ───────────────────────────────────────────
  const renderDevices = () => (
    <div className="space-y-6">
      {/* Device type cards */}
      <div className="grid grid-cols-3 gap-4">
        {DEVICES.deviceTypes.map(d => (
          <Card key={d.name} className="rounded-2xl border border-[#E2E8F0] bg-white">
            <CardContent className="p-5 text-center">
              <Icon name={d.icon} className="size-8 mx-auto text-[#0052B8]" />
              <p className="mt-2 text-2xl font-bold text-[#0F172A]">{d.share}%</p>
              <p className="text-sm text-[#64748B]">{d.name}</p>
              <p className="text-xs text-[#94A3B8]">{d.visitors.toLocaleString()} visitors</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Browsers */}
        <SectionCard title="Browsers" icon="Globe">
          <div className="space-y-3">
            {DEVICES.browsers.map(b => (
              <div key={b.name} className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#0F172A]">{b.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-[#475569]">{b.visitors.toLocaleString()}</span>
                  <div className="w-20">
                    <MiniBar value={b.share} max={100} color="#0052B8" />
                  </div>
                  <span className="text-xs tabular-nums font-medium text-[#0F172A] w-12 text-right">{b.share}%</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Operating Systems */}
        <SectionCard title="Operating Systems" icon="Monitor">
          <div className="space-y-3">
            {DEVICES.os.map(o => (
              <div key={o.name} className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#0F172A]">{o.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-[#475569]">{o.visitors.toLocaleString()}</span>
                  <div className="w-20">
                    <MiniBar value={o.share} max={100} color="#E8501A" />
                  </div>
                  <span className="text-xs tabular-nums font-medium text-[#0F172A] w-12 text-right">{o.share}%</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Countries */}
      <SectionCard title="Countries" description="Top 10 countries by visitor count" icon="MapPin" action={
        <Button variant="outline" size="sm" className="gap-1.5"><Download className="size-3.5" /> Export</Button>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="pb-2 text-left font-medium text-[#64748B]">Country</th>
                <th className="pb-2 text-right font-medium text-[#64748B]">Visitors</th>
                <th className="pb-2 text-right font-medium text-[#64748B]">Share</th>
              </tr>
            </thead>
            <tbody>
              {DEVICES.countries.map(c => (
                <tr key={c.name} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{c.flag}</span>
                      <span className="font-medium text-[#0F172A]">{c.name}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-medium text-[#0F172A]">{c.visitors.toLocaleString()}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <MiniBar value={c.pct} max={DEVICES.countries[0].pct} color="#0052B8" />
                      <span className="text-xs tabular-nums text-[#475569]">{c.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );

  // ─── Main Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <PageHeader
            title="Analytics Dashboard"
            subtitle="Privacy-friendly website analytics powered by Umami"
            icon="BarChart3"
            action={
              <div className="flex items-center gap-2">
                {/* Date range selector */}
                <div className="flex items-center rounded-lg border border-[#E2E8F0] bg-white p-0.5">
                  {(['24h', '7d', '30d', '90d'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={cn(
                        'px-3 py-1 rounded-md text-xs font-medium transition-all',
                        dateRange === range ? 'bg-[#0052B8] text-white' : 'text-[#64748B] hover:text-[#0F172A]'
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={onBack}>
                  Back
                </Button>
              </div>
            }
          />
        </div>

        {/* Privacy notice */}
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
          <Shield className="size-4 shrink-0" />
          <span>
            <strong>Privacy-friendly analytics:</strong> No cookies used. IP addresses are anonymized. GDPR & PECR compliant. Data is aggregated and cannot identify individuals.
          </span>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-[#E2E8F0] rounded-xl p-1 h-auto flex-wrap">
            <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-lg px-4">
              <Activity className="size-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-lg px-4">
              <FileText className="size-3.5" /> Pages
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-lg px-4">
              <Zap className="size-3.5" /> Events
            </TabsTrigger>
            <TabsTrigger value="referrers" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-lg px-4">
              <Globe className="size-3.5" /> Referrers
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-lg px-4">
              <Monitor className="size-3.5" /> Devices
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview">{renderOverview()}</TabsContent>
            <TabsContent value="pages">{renderPages()}</TabsContent>
            <TabsContent value="events">{renderEvents()}</TabsContent>
            <TabsContent value="referrers">{renderReferrers()}</TabsContent>
            <TabsContent value="devices">{renderDevices()}</TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
