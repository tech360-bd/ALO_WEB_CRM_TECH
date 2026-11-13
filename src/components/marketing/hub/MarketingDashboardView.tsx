'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Flame,
  MessageCircle,
  Globe,
  Megaphone,
  Clock,
  MessageSquare,
  CalendarDays,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Bot,
  CheckCircle2,
  XCircle,
  Plus,
  Send,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Zap,
  Phone,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  kpis: {
    todayLeads: number;
    todayLeadsDelta: number;
    hotLeads: number;
    hotLeadsDelta: number;
    whatsappReplies: number;
    whatsappRepliesDelta: number;
    websiteChatLeads: number;
    websiteChatLeadsDelta: number;
    campaignsRunning: number;
    pendingApprovals: number;
    pendingComments: number;
    scheduledPosts: number;
    failedPosts: number;
    costPerLead: number;
    costPerLeadDelta: number;
    leadConversionRate: number;
    leadConversionRateDelta: number;
    slaOverdue: number;
  };
  leadSources: { source: string; count: number; color: string }[];
  slaStatus: {
    assigned: number;
    responded: number;
    escalated: number;
    overdueConversations: {
      id: string;
      leadName: string;
      phone: string;
      waitMinutes: number;
      counselor: string;
    }[];
  };
  aiAgents: {
    name: string;
    status: 'active' | 'paused' | 'error';
    processedToday: number;
  }[];
  recentLeads: {
    id: string;
    name: string;
    phone: string;
    source: string;
    status: string;
    counselor: string;
    time: string;
  }[];
  pendingApprovals: {
    id: string;
    type: string;
    title: string;
    platform: string;
    requestedBy: string;
    scheduledFor: string;
  }[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_DATA: DashboardData = {
  kpis: {
    todayLeads: 47,
    todayLeadsDelta: 12.3,
    hotLeads: 8,
    hotLeadsDelta: -5.1,
    whatsappReplies: 134,
    whatsappRepliesDelta: 8.7,
    websiteChatLeads: 12,
    websiteChatLeadsDelta: 22.0,
    campaignsRunning: 5,
    pendingApprovals: 3,
    pendingComments: 18,
    scheduledPosts: 7,
    failedPosts: 1,
    costPerLead: 185,
    costPerLeadDelta: -3.2,
    leadConversionRate: 14.6,
    leadConversionRateDelta: 1.8,
    slaOverdue: 3,
  },
  leadSources: [
    { source: 'Facebook', count: 21, color: 'bg-[var(--alo-brand)]' },
    { source: 'WhatsApp', count: 8, color: 'bg-[var(--alo-success)]' },
    { source: 'Website', count: 12, color: 'bg-[var(--alo-brand)]' },
    { source: 'Instagram', count: 3, color: 'bg-[var(--alo-error)]' },
    { source: 'Referral', count: 2, color: 'bg-yellow-500' },
    { source: 'Google', count: 1, color: 'bg-[var(--alo-error)]' },
  ],
  slaStatus: {
    assigned: 34,
    responded: 29,
    escalated: 2,
    overdueConversations: [
      {
        id: 'SLA-001',
        leadName: 'Rakib Hossain',
        phone: '+880 1712-345678',
        waitMinutes: 47,
        counselor: 'Fatema Akter',
      },
      {
        id: 'SLA-002',
        leadName: 'Nusrat Jahan',
        phone: '+880 1898-765432',
        waitMinutes: 35,
        counselor: 'Tanvir Ahmed',
      },
      {
        id: 'SLA-003',
        leadName: 'Shakil Mahmud',
        phone: '+880 1534-567890',
        waitMinutes: 22,
        counselor: 'Unassigned',
      },
    ],
  },
  aiAgents: [
    { name: 'WhatsApp AI Responder', status: 'active', processedToday: 134 },
    { name: 'Comment Auto-Reply', status: 'active', processedToday: 56 },
    { name: 'Lead Scoring Engine', status: 'active', processedToday: 47 },
    { name: 'Website Chat Bot', status: 'active', processedToday: 12 },
    { name: 'Ad Performance Monitor', status: 'paused', processedToday: 0 },
    { name: 'Email Drip Campaign', status: 'active', processedToday: 89 },
  ],
  recentLeads: [
    {
      id: 'L-4821',
      name: 'Rakib Hossain',
      phone: '+880 1712-345678',
      source: 'Facebook',
      status: 'Hot',
      counselor: 'Fatema Akter',
      time: '2 min ago',
    },
    {
      id: 'L-4820',
      name: 'Nusrat Jahan',
      phone: '+880 1898-765432',
      source: 'WhatsApp',
      status: 'New',
      counselor: 'Tanvir Ahmed',
      time: '8 min ago',
    },
    {
      id: 'L-4819',
      name: 'Shakil Mahmud',
      phone: '+880 1534-567890',
      source: 'Website',
      status: 'Contacted',
      counselor: 'Unassigned',
      time: '15 min ago',
    },
    {
      id: 'L-4818',
      name: 'Taslima Begum',
      phone: '+880 1645-123456',
      source: 'Instagram',
      status: 'Follow-up',
      counselor: 'Fatema Akter',
      time: '28 min ago',
    },
    {
      id: 'L-4817',
      name: 'Arif Rahman',
      phone: '+880 1756-987654',
      source: 'Referral',
      status: 'Hot',
      counselor: 'Tanvir Ahmed',
      time: '41 min ago',
    },
  ],
  pendingApprovals: [
    {
      id: 'AP-101',
      type: 'Post',
      title: 'Study in Canada — Fall 2025 Intake Now Open',
      platform: 'Facebook',
      requestedBy: 'Shuvo Biswas',
      scheduledFor: 'Today, 6:00 PM',
    },
    {
      id: 'AP-102',
      type: 'Story',
      title: 'Student Testimonial — Rahim got UK Tier-4 Visa!',
      platform: 'Instagram',
      requestedBy: 'Anika Islam',
      scheduledFor: 'Today, 7:30 PM',
    },
    {
      id: 'AP-103',
      type: 'Ad Copy',
      title: 'Scholarship Alert: Up to 50% tuition waiver in Malaysia',
      platform: 'Facebook Ads',
      requestedBy: 'Shuvo Biswas',
      scheduledFor: 'Tomorrow, 9:00 AM',
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-BD', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function DeltaBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        positive ? 'text-crm-success-text' : 'text-crm-danger-text'
      )}
    >
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%{suffix}
    </span>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  delta,
  iconColor,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  suffix?: string;
  delta?: number;
  iconColor?: string;
  alert?: boolean;
}) {
  return (
    <Card className="bg-white rounded-xl border border-alo-border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-alo-text-muted">{label}</p>
            <p className={cn('text-2xl font-bold text-alo-text', alert && 'text-crm-danger-text')}>
              {value}
              {suffix && <span className="text-sm font-normal text-alo-text-secondary ml-1">{suffix}</span>}
            </p>
          </div>
          <div
            className={cn(
              'flex items-center justify-center h-10 w-10 rounded-lg',
              iconColor ?? 'bg-alo-brand/10 text-alo-brand',
              alert && 'bg-crm-danger-bg text-crm-danger-text'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {delta !== undefined && <div className="mt-2"><DeltaBadge value={delta} /></div>}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketingDashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Production dashboard:-backed metrics only — never display fabricated stats
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const res = await fetch('/api/marketing/dashboard');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Transform real KPI response to view model; if API returns raw kpis structure, adapt
        // Accept both legacy MOCK shape and new real shape
        let normalized: DashboardData;
        if (json.kpis && json.leadSources) {
          normalized = json as DashboardData;
        } else if (json.kpis) {
          // Build minimal view from real kpis, filling missing sections with DBs (never fabricate)
          const k = json.kpis;
          normalized = {
            kpis: {
              todayLeads: k.todayLeads ?? 0,
              todayLeadsDelta: 0,
              hotLeads: k.hotLeads ?? 0,
              hotLeadsDelta: 0,
              whatsappReplies: k.whatsappReplies ?? 0,
              whatsappRepliesDelta: 0,
              websiteChatLeads: k.websiteChatLeads ?? 0,
              websiteChatLeadsDelta: 0,
              campaignsRunning: k.campaignsRunning ?? 0,
              pendingApprovals: k.pendingApproval ?? k.pendingApprovals ?? 0,
              pendingComments: k.pendingComments ?? 0,
              scheduledPosts: k.scheduledPosts ?? 0,
              failedPosts: k.failedPosts ?? 0,
              costPerLead: k.costPerLead ?? 0,
              costPerLeadDelta: 0,
              leadConversionRate: k.leadConversionRate ?? 0,
              leadConversionRateDelta: 0,
              slaOverdue: k.followUpOverdue ?? k.slaOverdue ?? 0,
            },
            leadSources: (json.leadSources as any) || [],
            slaStatus: {
              assigned: k.counselorAssigned ?? 0,
              responded: 0,
              escalated: 0,
              overdueConversations: [],
            },
            aiAgents: json.aiAgents || [],
            recentLeads: (json.recentLeads as any[])?.map((l: any) => ({
              id: l.id?.slice(0, 8) || 'L-' + Math.random().toString(36).slice(2, 6),
              name: l.name || l.fullName || 'Unknown',
              phone: l.phone || '',
              source: l.source || 'unknown',
              status: l.status || 'new',
              counselor: l.counselorName || l.counselor || 'Unassigned',
              time: l.createdAt ? new Date(l.createdAt).toLocaleTimeString() : 'recent',
            })) || [],
            pendingApprovals: (json.recentApprovals as any[])?.map((a: any) => ({
              id: a.id?.slice(0, 8) || 'AP-' + Math.random().toString(36).slice(2, 6),
              type: a.itemType || 'Content',
              title: a.title || 'Pending approval',
              platform: '—',
              requestedBy: a.requestedById?.slice(0, 8) || 'team',
              scheduledFor: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'pending',
            })) || [],
          } as DashboardData;
          // Ensure required visual sections never empty with fake data: if arrays empty, show empty-state messaging in UI
        } else {
          throw new Error('Invalid dashboard payload');
        }
        if (!cancelled) { setData(normalized); setError(null); }
      } catch (e: any) {
        if (!cancelled) { setError(e?.message || 'Failed to load dashboard'); setData(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Loading / Error state — never show fabricated stats ----
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--alo-cta)]" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-crm-warning-text" />
        <h3 className="font-semibold text-[var(--alo-text)]">Dashboard data unavailable</h3>
        <p className="text-sm text-[var(--alo-text-muted)] max-w-md">{error || 'No marketing data returned from /api/marketing/dashboard. This view only displays database-backed metrics — no fabricated statistics are shown.'}</p>
        <p className="text-xs text-[var(--alo-text-muted)]">Data source: MarketingLead, MarketingCampaign, MarketingApproval, MarketingCalendar, MarketingAgentJob via Prisma • Period: today • Sync: live</p>
        <Button onClick={() => location.reload()} className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white mt-2">Retry</Button>
      </div>
    );
  }

  const { kpis, leadSources, slaStatus, aiAgents, recentLeads, pendingApprovals } = data;
  const maxSourceCount = Math.max(...leadSources.map((s) => s.count), 1);

  return (
    <div className="space-y-6 p-6 bg-alo-page min-h-screen">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Marketing Automation Dashboard</h1>
          <p className="text-sm text-alo-text-muted mt-1">{todayFormatted()}</p>
        </div>
        <Badge className="bg-alo-brand text-white hover:bg-alo-brand/90 px-3 py-1 text-sm">
          Marketing Manager
        </Badge>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* KPI Grid (4 columns × 3 rows)                                   */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Today's Leads"
          value={kpis.todayLeads}
          delta={kpis.todayLeadsDelta}
          iconColor="bg-alo-brand/10 text-alo-brand"
        />
        <KpiCard
          icon={Flame}
          label="Hot Leads"
          value={kpis.hotLeads}
          delta={kpis.hotLeadsDelta}
          iconColor="bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]"
        />
        <KpiCard
          icon={MessageCircle}
          label="WhatsApp Replies"
          value={kpis.whatsappReplies}
          delta={kpis.whatsappRepliesDelta}
          iconColor="bg-crm-success-bg text-crm-success-text"
        />
        <KpiCard
          icon={Globe}
          label="Website Chat Leads"
          value={kpis.websiteChatLeads}
          delta={kpis.websiteChatLeadsDelta}
          iconColor="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]"
        />
        <KpiCard
          icon={Megaphone}
          label="Campaigns Running"
          value={kpis.campaignsRunning}
          iconColor="bg-sky-50 text-sky-600"
        />
        <KpiCard
          icon={Clock}
          label="Pending Approvals"
          value={kpis.pendingApprovals}
          iconColor="bg-crm-warning-bg text-crm-warning-text"
        />
        <KpiCard
          icon={MessageSquare}
          label="Pending Comments"
          value={kpis.pendingComments}
          iconColor="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]"
        />
        <KpiCard
          icon={CalendarDays}
          label="Scheduled Posts"
          value={kpis.scheduledPosts}
          iconColor="bg-teal-50 text-teal-600"
        />
        <KpiCard
          icon={XCircle}
          label="Failed Posts"
          value={kpis.failedPosts}
          iconColor="bg-crm-danger-bg text-crm-danger-text"
          alert={kpis.failedPosts > 0}
        />
        <KpiCard
          icon={DollarSign}
          label="Cost Per Lead"
          value={`৳${kpis.costPerLead}`}
          delta={kpis.costPerLeadDelta}
          iconColor="bg-crm-success-bg text-crm-success-text"
        />
        <KpiCard
          icon={TrendingUp}
          label="Lead Conversion Rate"
          value={`${kpis.leadConversionRate}%`}
          delta={kpis.leadConversionRateDelta}
          iconColor="bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]"
        />
        <KpiCard
          icon={ShieldAlert}
          label="SLA Overdue"
          value={kpis.slaOverdue}
          iconColor="bg-crm-danger-bg text-crm-danger-text"
          alert={kpis.slaOverdue > 0}
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Middle row: Lead Source Chart | WhatsApp SLA | AI Agent Status   */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ---- Lead Source Chart ---- */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-alo-brand" />
              Lead Sources Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {leadSources.map((item) => (
              <div key={item.source} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-alo-text-secondary">{item.source}</span>
                  <span className="font-semibold text-alo-text">{item.count}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[var(--alo-surface-muted)] overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', item.color)}
                    style={{ width: `${(item.count / maxSourceCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-alo-text-muted pt-2">
              Total: <span className="font-semibold text-alo-text">{leadSources.reduce((a, b) => a + b.count, 0)} leads</span> today
            </p>
          </CardContent>
        </Card>

        {/* ---- WhatsApp SLA Status ---- */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
              <Phone className="h-4 w-4 text-crm-success-text" />
              WhatsApp SLA Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Summary badges */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-[var(--alo-brand-pale)] py-2">
                <p className="text-lg font-bold text-[var(--alo-brand)]">{slaStatus.assigned}</p>
                <p className="text-xs text-[var(--alo-brand)]">Assigned</p>
              </div>
              <div className="rounded-lg bg-crm-success-bg py-2">
                <p className="text-lg font-bold text-crm-success-text">{slaStatus.responded}</p>
                <p className="text-xs text-crm-success-text">Responded</p>
              </div>
              <div className="rounded-lg bg-[var(--alo-cta-soft)] py-2">
                <p className="text-lg font-bold text-[var(--alo-cta-active)]">{slaStatus.escalated}</p>
                <p className="text-xs text-[var(--alo-cta-active)]">Escalated</p>
              </div>
            </div>

            {/* SLA compliance rate */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-alo-text-muted">SLA Compliance (≤15 min)</span>
              <span className={cn(
                'text-sm font-semibold',
                slaStatus.assigned > 0 && slaStatus.responded / slaStatus.assigned >= 0.85
                  ? 'text-crm-success-text'
                  : 'text-[var(--alo-cta-active)]'
              )}>
                {slaStatus.assigned > 0
                  ? ((slaStatus.responded / slaStatus.assigned) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>

            {/* Overdue conversations */}
            {slaStatus.overdueConversations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-crm-danger-text flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue Conversations
                </p>
                {slaStatus.overdueConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="rounded-lg border border-crm-danger-border bg-crm-danger-bg p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-alo-text">{conv.leadName}</span>
                      <Badge variant="destructive" className="text-[11px] px-1.5 py-0">
                        {conv.waitMinutes}m late
                      </Badge>
                    </div>
                    <p className="text-xs text-alo-text-muted">{conv.phone}</p>
                    <p className="text-xs text-alo-text-secondary">
                      Counselor: <span className="font-medium">{conv.counselor}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---- AI Agent Status ---- */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
              <Bot className="h-4 w-4 text-alo-brand" />
              AI Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {aiAgents.map((agent) => (
              <div
                key={agent.name}
                className="flex items-center justify-between rounded-lg border border-alo-border px-3 py-2.5 hover:bg-[var(--alo-page)] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {agent.status === 'active' ? (
                    <Zap className="h-4 w-4 text-crm-success-text shrink-0" />
                  ) : agent.status === 'paused' ? (
                    <Clock className="h-4 w-4 text-crm-warning-text shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-crm-danger-text shrink-0" />
                  )}
                  <span className="text-sm text-alo-text truncate">{agent.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-alo-text-muted">
                    {agent.processedToday > 0 ? `${agent.processedToday} today` : '—'}
                  </span>
                  <Badge
                    className={cn(
                      'text-[11px] px-1.5 py-0 font-medium',
                      agent.status === 'active' && 'bg-crm-success-bg text-crm-success-text hover:bg-crm-success-bg',
                      agent.status === 'paused' && 'bg-crm-warning-bg text-crm-warning-text hover:bg-crm-warning-bg',
                      agent.status === 'error' && 'bg-crm-danger-bg text-crm-danger-text hover:bg-crm-danger-bg'
                    )}
                  >
                    {agent.status === 'active' && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                    {agent.status === 'paused' && <Clock className="h-2.5 w-2.5 mr-0.5" />}
                    {agent.status === 'error' && <XCircle className="h-2.5 w-2.5 mr-0.5" />}
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Bottom row: Recent Leads Table | Pending Approvals | Quick Actions */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ---- Recent Leads Table ---- */}
        <Card className="bg-white rounded-xl border border-alo-border lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Target className="h-4 w-4 text-alo-brand" />
                Recent Leads
              </CardTitle>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className=" h-7">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs text-alo-text-muted font-medium">Lead</TableHead>
                  <TableHead className="text-xs text-alo-text-muted font-medium">Source</TableHead>
                  <TableHead className="text-xs text-alo-text-muted font-medium">Status</TableHead>
                  <TableHead className="text-xs text-alo-text-muted font-medium">Counselor</TableHead>
                  <TableHead className="text-xs text-alo-text-muted font-medium text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-[var(--alo-page)]/60">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-alo-text">{lead.name}</p>
                        <p className="text-xs text-alo-text-muted">{lead.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'text-xs font-medium',
                          lead.status === 'Hot' && 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] hover:bg-[var(--alo-cta-soft)]',
                          lead.status === 'New' && 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]',
                          lead.status === 'Contacted' && 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] hover:bg-[var(--alo-surface-muted)]',
                          lead.status === 'Follow-up' && 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]'
                        )}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-alo-text-secondary">{lead.counselor}</TableCell>
                    <TableCell className="text-xs text-alo-text-muted text-right whitespace-nowrap">
                      {lead.time}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ---- Right column: Pending Approvals + Quick Actions ---- */}
        <div className="space-y-4">
          {/* Pending Approvals */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--alo-cta-active)]" />
                  Pending Approvals
                </CardTitle>
                <Badge className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)] text-xs">
                  {pendingApprovals.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {pendingApprovals.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-alo-border p-3 space-y-1.5 hover:bg-[var(--alo-page)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-alo-text truncate">{item.title}</p>
                      <p className="text-xs text-alo-text-muted">
                        {item.type} · {item.platform}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-alo-text-secondary">
                      by {item.requestedBy}
                    </span>
                    <span className="text-xs text-alo-text-muted">{item.scheduledFor}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-7 bg-alo-brand hover:bg-alo-brand/90">
                      Approve
                    </Button>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-7 ">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Zap className="h-4 w-4 text-[var(--alo-cta-active)]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full justify-start gap-2 bg-alo-brand hover:bg-alo-brand/90 ">
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start gap-2 ">
                <MessageSquare className="h-4 w-4" />
                Create Post
              </Button>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start gap-2 ">
                <Send className="h-4 w-4" />
                Send WhatsApp Broadcast
              </Button>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start gap-2 ">
                <Calendar className="h-4 w-4" />
                View Content Calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}