'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Search, TrendingUp, TrendingDown, ExternalLink,
  BarChart3, Globe, Link2, FileText, Zap, Target, AlertTriangle,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
  ChevronRight, Shield, Activity, Eye, Clock
} from 'lucide-react';

// Types
interface KeywordData {
  keyword: string;
  position: number;
  previousPosition: number;
  volume: number;
  difficulty: number;
  url: string;
}

interface CoreWebVital {
  metric: string;
  value: number;
  unit: string;
  status: 'good' | 'needs-improvement' | 'poor';
  threshold: string;
}

interface CompetitorData {
  name: string;
  domainAuthority: number;
  backlinks: number;
  organicTraffic: number;
  keywords: number;
}

interface ContentGap {
  keyword: string;
  competitorRanks: { name: string; position: number }[];
  volume: number;
  difficulty: number;
  opportunity: 'high' | 'medium' | 'low';
}

// Mock Data
const KEYWORDS: KeywordData[] = [
  { keyword: 'study in uk', position: 3, previousPosition: 5, volume: 18100, difficulty: 72, url: '/uk' },
  { keyword: 'study in australia', position: 5, previousPosition: 7, volume: 14800, difficulty: 68, url: '/australia' },
  { keyword: 'study in canada', position: 7, previousPosition: 6, volume: 12100, difficulty: 65, url: '/canada' },
  { keyword: 'study abroad consultants', position: 2, previousPosition: 3, volume: 9900, difficulty: 58, url: '/services' },
  { keyword: 'IELTS preparation', position: 4, previousPosition: 4, volume: 8100, difficulty: 45, url: '/exams/ielts' },
  { keyword: 'SOP writing tips', position: 1, previousPosition: 2, volume: 6600, difficulty: 35, url: '/resources/sop-guide' },
  { keyword: 'student visa uk', position: 6, previousPosition: 8, volume: 5400, difficulty: 62, url: '/uk/visa' },
  { keyword: 'scholarships for indian students', position: 8, previousPosition: 12, volume: 4400, difficulty: 55, url: '/scholarships' },
  { keyword: 'MBA in UK', position: 3, previousPosition: 4, volume: 3600, difficulty: 60, url: '/uk/mba' },
  { keyword: 'MS in Canada', position: 9, previousPosition: 11, volume: 2900, difficulty: 50, url: '/canada/ms' },
  { keyword: 'education consultants near me', position: 12, previousPosition: 15, volume: 2400, difficulty: 40, url: '/contact' },
  { keyword: 'university application deadline', position: 5, previousPosition: 5, volume: 2200, difficulty: 38, url: '/resources' },
];

const CORE_WEB_VITALS: CoreWebVital[] = [
  { metric: 'LCP', value: 1.8, unit: 's', status: 'good', threshold: '< 2.5s' },
  { metric: 'FID', value: 45, unit: 'ms', status: 'good', threshold: '< 100ms' },
  { metric: 'CLS', value: 0.08, unit: '', status: 'good', threshold: '< 0.1' },
  { metric: 'TTFB', value: 320, unit: 'ms', status: 'needs-improvement', threshold: '< 200ms' },
  { metric: 'INP', value: 120, unit: 'ms', status: 'needs-improvement', threshold: '< 200ms' },
];

const COMPETITORS: CompetitorData[] = [
  { name: 'ALO Education', domainAuthority: 42, backlinks: 1850, organicTraffic: 28500, keywords: 1240 },
  { name: 'IDP Education', domainAuthority: 68, backlinks: 12400, organicTraffic: 95000, keywords: 5200 },
  { name: 'StudyPortals', domainAuthority: 72, backlinks: 18600, organicTraffic: 120000, keywords: 8100 },
  { name: 'Y-Axis', domainAuthority: 45, backlinks: 3200, organicTraffic: 35000, keywords: 1800 },
  { name: 'Leapscholar', domainAuthority: 38, backlinks: 2100, organicTraffic: 22000, keywords: 980 },
];

const CONTENT_GAPS: ContentGap[] = [
  { keyword: 'study in germany free', competitorRanks: [{ name: 'IDP', position: 3 }, { name: 'StudyPortals', position: 5 }], volume: 8100, difficulty: 52, opportunity: 'high' },
  { keyword: 'IELTS vs TOEFL', competitorRanks: [{ name: 'StudyPortals', position: 2 }, { name: 'Y-Axis', position: 7 }], volume: 6600, difficulty: 45, opportunity: 'high' },
  { keyword: 'part time jobs for students', competitorRanks: [{ name: 'Leapscholar', position: 4 }, { name: 'IDP', position: 8 }], volume: 5400, difficulty: 38, opportunity: 'high' },
  { keyword: 'student accommodation uk', competitorRanks: [{ name: 'StudyPortals', position: 1 }, { name: 'IDP', position: 6 }], volume: 4400, difficulty: 55, opportunity: 'medium' },
  { keyword: 'post study work visa', competitorRanks: [{ name: 'Y-Axis', position: 5 }, { name: 'StudyPortals', position: 3 }], volume: 3600, difficulty: 48, opportunity: 'medium' },
  { keyword: 'duolingo english test', competitorRanks: [{ name: 'Leapscholar', position: 2 }], volume: 2900, difficulty: 32, opportunity: 'high' },
  { keyword: 'mba without gmat', competitorRanks: [{ name: 'Y-Axis', position: 4 }], volume: 2200, difficulty: 35, opportunity: 'medium' },
  { keyword: 'education loan for abroad', competitorRanks: [{ name: 'Leapscholar', position: 3 }, { name: 'Y-Axis', position: 6 }], volume: 1800, difficulty: 42, opportunity: 'low' },
];

const vitalStatusColor: Record<string, string> = {
  good: 'text-emerald-600 bg-emerald-50',
  'needs-improvement': 'text-amber-600 bg-amber-50',
  poor: 'text-red-600 bg-red-50',
};

const opportunityColor: Record<string, string> = {
  high: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-gray-50 text-gray-700',
};

interface SeoDashboardPageProps {
  onBack?: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

export function SeoDashboardPage({ onBack, onNavigate }: SeoDashboardPageProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAudit, setLastAudit] = useState('2025-03-04 14:30');
  const [auditData, setAuditData] = useState<Record<string, unknown> | null>(null);

  const runAudit = useCallback(async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/seo/audit');
      const data = await res.json();
      setAuditData(data);
      setLastAudit(new Date().toLocaleString());
    } catch {
      setLastAudit(new Date().toLocaleString());
    }
    setIsAuditing(false);
  }, []);

  const positionChange = (current: number, previous: number) => {
    const diff = previous - current;
    if (diff > 0) return <span className="flex items-center text-emerald-600 text-xs"><ArrowUpRight className="h-3 w-3" />+{diff}</span>;
    if (diff < 0) return <span className="flex items-center text-red-500 text-xs"><ArrowDownRight className="h-3 w-3" />{diff}</span>;
    return <span className="flex items-center text-gray-400 text-xs"><Minus className="h-3 w-3" />0</span>;
  };

  const difficultyBar = (diff: number) => {
    const color = diff < 30 ? 'bg-emerald-500' : diff < 60 ? 'bg-amber-500' : 'bg-red-500';
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-gray-100 rounded-full">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${diff}%` }} />
        </div>
        <span className="text-[10px] text-[#9ca3af]">{diff}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <header className="bg-[#2d3142] text-white px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1 text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold">SEO Dashboard</h1>
              <p className="text-xs text-white/50">Organic search performance & optimization</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40">Last audit: {lastAudit}</span>
            <Button
              onClick={runAudit}
              disabled={isAuditing}
              size="sm"
              className="bg-[#bf4520] hover:bg-[#a33a1a] text-white text-xs h-7"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isAuditing ? 'animate-spin' : ''}`} />
              {isAuditing ? 'Auditing...' : 'Run Audit'}
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <div className="bg-white border-b border-[#e5e7eb] px-4">
          <div className="max-w-[1400px] mx-auto overflow-x-auto">
            <TabsList className="bg-transparent h-10 gap-0.5 p-0">
              {[
                { value: 'overview', icon: BarChart3, label: 'Overview' },
                { value: 'keywords', icon: Search, label: 'Keywords' },
                { value: 'performance', icon: Zap, label: 'Performance' },
                { value: 'competitors', icon: Target, label: 'Competitors' },
                { value: 'gaps', icon: AlertTriangle, label: 'Content Gaps' },
                { value: 'sitemap', icon: Globe, label: 'Indexation' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#bf4520] data-[state=active]:text-[#2d3142] data-[state=active]:font-semibold text-[#6b7280] h-10 rounded-none px-3 text-xs whitespace-nowrap"
                >
                  <tab.icon className="h-3.5 w-3.5 mr-1.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Overview */}
        <TabsContent value="overview" className="flex-1 m-0 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-6 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Organic Traffic', value: '28,500', change: '+12.4%', up: true, icon: BarChart3 },
                { label: 'Domain Authority', value: '42', change: '+3', up: true, icon: Shield },
                { label: 'Backlinks', value: '1,850', change: '+124', up: true, icon: Link2 },
                { label: 'Indexed Pages', value: '342', change: '+18', up: true, icon: FileText },
              ].map(metric => (
                <Card key={metric.label} className="bg-white" style={{ borderRadius: '8px' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[#6b7280]">{metric.label}</p>
                        <p className="text-2xl font-bold text-[#2d3142] mt-1">{metric.value}</p>
                      </div>
                      <div className="p-2 bg-[#f5f5f5] rounded" style={{ borderRadius: '6px' }}>
                        <metric.icon className="h-4 w-4 text-[#bf4520]" />
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${metric.up ? 'text-emerald-600' : 'text-red-500'}`}>
                      {metric.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {metric.change} this month
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Core Web Vitals */}
            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardHeader>
                <CardTitle className="text-sm text-[#2d3142] flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#bf4520]" />
                  Core Web Vitals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {CORE_WEB_VITALS.map(vital => (
                    <div key={vital.metric} className="text-center p-3 bg-[#f5f5f5] rounded" style={{ borderRadius: '6px' }}>
                      <p className="text-xs font-bold text-[#2d3142]">{vital.metric}</p>
                      <p className={`text-xl font-bold mt-1 ${vitalStatusColor[vital.status].split(' ')[0]}`}>
                        {vital.value}{vital.unit}
                      </p>
                      <Badge className={`text-[10px] mt-2 ${vitalStatusColor[vital.status]}`} style={{ borderRadius: '4px' }}>
                        {vital.status === 'good' ? 'Good' : vital.status === 'needs-improvement' ? 'Improve' : 'Poor'}
                      </Badge>
                      <p className="text-[10px] text-[#9ca3af] mt-1">{vital.threshold}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Keywords Quick View */}
            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardHeader>
                <CardTitle className="text-sm text-[#2d3142] flex items-center gap-2">
                  <Search className="h-4 w-4 text-[#bf4520]" />
                  Top Performing Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {KEYWORDS.slice(0, 5).map(kw => (
                    <div key={kw.keyword} className="flex items-center justify-between p-2 bg-[#f5f5f5] rounded" style={{ borderRadius: '4px' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#2d3142]">#{kw.position}</span>
                        <div>
                          <p className="text-sm text-[#2d3142]">{kw.keyword}</p>
                          <p className="text-[10px] text-[#9ca3af]">{kw.volume.toLocaleString()} searches/mo</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {positionChange(kw.position, kw.previousPosition)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Keywords */}
        <TabsContent value="keywords" className="flex-1 m-0 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-6">
            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardHeader>
                <CardTitle className="text-sm text-[#2d3142]">Keyword Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e5e7eb]">
                        <th className="text-left p-3 text-xs font-medium text-[#6b7280]">Keyword</th>
                        <th className="text-center p-3 text-xs font-medium text-[#6b7280]">Position</th>
                        <th className="text-center p-3 text-xs font-medium text-[#6b7280]">Change</th>
                        <th className="text-center p-3 text-xs font-medium text-[#6b7280]">Volume</th>
                        <th className="text-left p-3 text-xs font-medium text-[#6b7280]">Difficulty</th>
                        <th className="text-left p-3 text-xs font-medium text-[#6b7280]">URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {KEYWORDS.map(kw => (
                        <tr key={kw.keyword} className="border-b border-[#f5f5f5] hover:bg-[#f5f5f5]">
                          <td className="p-3 font-medium text-[#2d3142]">{kw.keyword}</td>
                          <td className="p-3 text-center">
                            <Badge
                              className={`text-xs ${kw.position <= 3 ? 'bg-emerald-50 text-emerald-700' : kw.position <= 10 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-700'}`}
                              style={{ borderRadius: '4px' }}
                            >
                              #{kw.position}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">{positionChange(kw.position, kw.previousPosition)}</td>
                          <td className="p-3 text-center text-[#2d3142]">{kw.volume.toLocaleString()}</td>
                          <td className="p-3">{difficultyBar(kw.difficulty)}</td>
                          <td className="p-3 text-xs text-[#bf4520] font-mono truncate max-w-[200px]">{kw.url}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="flex-1 m-0 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-6 space-y-6">
            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardHeader>
                <CardTitle className="text-sm text-[#2d3142] flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#bf4520]" />
                  Page Performance Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CORE_WEB_VITALS.map(vital => (
                    <div key={vital.metric} className="p-4 bg-[#f5f5f5] rounded" style={{ borderRadius: '6px' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-[#2d3142]">{vital.metric}</h4>
                          <p className="text-xs text-[#6b7280]">Threshold: {vital.threshold}</p>
                        </div>
                        <Badge className={`text-xs ${vitalStatusColor[vital.status]}`} style={{ borderRadius: '4px' }}>
                          {vital.status === 'good' ? 'Pass' : vital.status === 'needs-improvement' ? 'Warning' : 'Fail'}
                        </Badge>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold ${vitalStatusColor[vital.status].split(' ')[0]}`}>
                          {vital.value}
                        </span>
                        <span className="text-sm text-[#6b7280] mb-1">{vital.unit}</span>
                      </div>
                      <Progress
                        value={vital.metric === 'LCP' ? Math.min((vital.value / 4) * 100, 100) :
                               vital.metric === 'CLS' ? Math.min((vital.value / 0.25) * 100, 100) :
                               vital.metric === 'FID' ? Math.min((vital.value / 300) * 100, 100) :
                               vital.metric === 'TTFB' ? Math.min((vital.value / 800) * 100, 100) :
                               Math.min((vital.value / 500) * 100, 100)}
                        className="h-2 mt-3"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Page Speed Suggestions */}
            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardHeader>
                <CardTitle className="text-sm text-[#2d3142]">Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { priority: 'High', issue: 'Reduce TTFB by implementing edge caching', impact: '~120ms improvement' },
                  { priority: 'Medium', issue: 'Optimize INP by deferring non-critical JS', impact: '~60ms improvement' },
                  { priority: 'Low', issue: 'Preload critical fonts for faster LCP', impact: '~200ms improvement' },
                  { priority: 'Low', issue: 'Add fetchpriority="high" to hero images', impact: '~100ms improvement' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#f5f5f5] rounded" style={{ borderRadius: '4px' }}>
                    <Badge className={`text-[10px] shrink-0 ${
                      item.priority === 'High' ? 'bg-red-50 text-red-700' :
                      item.priority === 'Medium' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-50 text-gray-700'
                    }`} style={{ borderRadius: '4px' }}>
                      {item.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm text-[#2d3142]">{item.issue}</p>
                      <p className="text-[10px] text-[#9ca3af] mt-0.5">{item.impact}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competitors */}
        <TabsContent value="competitors" className="flex-1 m-0 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-6">
            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardHeader>
                <CardTitle className="text-sm text-[#2d3142] flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#bf4520]" />
                  Competitor Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e5e7eb]">
                        <th className="text-left p-3 text-xs font-medium text-[#6b7280]">Website</th>
                        <th className="text-center p-3 text-xs font-medium text-[#6b7280]">DA</th>
                        <th className="text-center p-3 text-xs font-medium text-[#6b7280]">Backlinks</th>
                        <th className="text-center p-3 text-xs font-medium text-[#6b7280]">Organic Traffic</th>
                        <th className="text-center p-3 text-xs font-medium text-[#6b7280]">Keywords</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPETITORS.map(comp => (
                        <tr key={comp.name} className={`border-b border-[#f5f5f5] ${comp.name === 'ALO Education' ? 'bg-[#bf4520]/5' : ''}`}>
                          <td className="p-3 font-medium text-[#2d3142] flex items-center gap-2">
                            {comp.name === 'ALO Education' && <span className="text-[10px] bg-[#bf4520] text-white px-1.5 py-0.5 rounded">You</span>}
                            {comp.name}
                          </td>
                          <td className="p-3 text-center font-bold text-[#2d3142]">{comp.domainAuthority}</td>
                          <td className="p-3 text-center text-[#2d3142]">{comp.backlinks.toLocaleString()}</td>
                          <td className="p-3 text-center text-[#2d3142]">{comp.organicTraffic.toLocaleString()}</td>
                          <td className="p-3 text-center text-[#2d3142]">{comp.keywords.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Gaps */}
        <TabsContent value="gaps" className="flex-1 m-0 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2d3142] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#bf4520]" />
                Content Gap Analysis
              </h2>
              <p className="text-xs text-[#6b7280]">Keywords competitors rank for that ALO doesn&apos;t</p>
            </div>

            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardContent className="p-0">
                <div className="divide-y divide-[#f5f5f5]">
                  {CONTENT_GAPS.map(gap => (
                    <div key={gap.keyword} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#2d3142]">{gap.keyword}</p>
                          <Badge className={`text-[10px] ${opportunityColor[gap.opportunity]}`} style={{ borderRadius: '4px' }}>
                            {gap.opportunity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-[#9ca3af]">{gap.volume.toLocaleString()} vol/mo</span>
                          <span className="text-[10px] text-[#9ca3af]">Diff: {gap.difficulty}</span>
                          <span className="text-[10px] text-[#6b7280]">
                            Ranked by: {gap.competitorRanks.map(c => `${c.name} (#${c.position})`).join(', ')}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs shrink-0"
                        onClick={() => onNavigate?.('blog')}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Create Content
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sitemap / Indexation */}
        <TabsContent value="sitemap" className="flex-1 m-0 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total URLs in Sitemap', value: '387', icon: Globe },
                { label: 'Indexed by Google', value: '342', icon: CheckCircle2 },
                { label: 'Indexation Rate', value: '88.4%', icon: Eye },
              ].map(stat => (
                <Card key={stat.label} className="bg-white" style={{ borderRadius: '8px' }}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-[#f5f5f5] rounded" style={{ borderRadius: '6px' }}>
                      <stat.icon className="h-4 w-4 text-[#bf4520]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7280]">{stat.label}</p>
                      <p className="text-xl font-bold text-[#2d3142]">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardHeader>
                <CardTitle className="text-sm text-[#2d3142]">Sitemap Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { url: '/sitemap.xml', status: 'Valid', lastSubmitted: '2 days ago', items: 387 },
                  { url: '/sitemap-countries.xml', status: 'Valid', lastSubmitted: '2 days ago', items: 45 },
                  { url: '/sitemap-universities.xml', status: 'Valid', lastSubmitted: '2 days ago', items: 124 },
                  { url: '/sitemap-courses.xml', status: 'Valid', lastSubmitted: '2 days ago', items: 98 },
                  { url: '/sitemap-blog.xml', status: 'Warning', lastSubmitted: '5 days ago', items: 56 },
                  { url: '/sitemap-pages.xml', status: 'Valid', lastSubmitted: '2 days ago', items: 64 },
                ].map(sitemap => (
                  <div key={sitemap.url} className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded" style={{ borderRadius: '4px' }}>
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-[#6b7280]" />
                      <div>
                        <p className="text-sm font-mono text-[#2d3142]">{sitemap.url}</p>
                        <p className="text-[10px] text-[#9ca3af]">{sitemap.items} URLs · Submitted {sitemap.lastSubmitted}</p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${sitemap.status === 'Valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`} style={{ borderRadius: '4px' }}>
                      {sitemap.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardHeader>
                <CardTitle className="text-sm text-[#2d3142]">Not Indexed (45 URLs)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                {[
                  '/blog/scholarship-deadlines-2025',
                  '/countries/new-zealand/student-visa',
                  '/universities/queensland-belfast',
                  '/courses/diploma-hospitality-australia',
                  '/resources/education-loan-comparison',
                ].map(url => (
                  <div key={url} className="flex items-center justify-between p-2 bg-[#f5f5f5] rounded text-sm" style={{ borderRadius: '4px' }}>
                    <span className="font-mono text-[#2d3142] text-xs">{url}</span>
                    <div className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
                      <Clock className="h-3 w-3" />
                      Discovered 3 days ago
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
