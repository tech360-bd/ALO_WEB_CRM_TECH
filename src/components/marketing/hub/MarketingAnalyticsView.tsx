'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Users,
  Flame,
  TrendingUp,
  DollarSign,
  MessageCircle,
  Bot,
  UserCheck,
  ShieldCheck,
  FileText,
  Eye,
  ThumbsUp,
  UserPlus,
  Target,
  Wallet,
  Clock,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Percent,
  Timer,
  Zap,
  Phone,
  Instagram,
  Facebook,
  Globe,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DateRange = 'today' | '7days' | '30days' | 'custom';

interface KPIData {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface ChannelPerformance {
  channel: string;
  icon: React.ReactNode;
  leads: number;
  conversations: number;
  conversion: string;
  responseTime: string;
  status: 'active' | 'paused' | 'low';
}

interface CampaignROI {
  id: string;
  name: string;
  budget: string;
  spent: string;
  leads: number;
  conversions: number;
  revenue: string;
  roi: string;
  status: 'running' | 'completed' | 'paused';
}

interface AIComparison {
  metric: string;
  ai: number;
  human: number;
  unit: string;
}

interface SLAData {
  category: string;
  total: number;
  compliant: number;
  breached: number;
  rate: number;
}

// ---------------------------------------------------------------------------
// Static Data (Bangladesh consultancy realistic numbers)
// ---------------------------------------------------------------------------

const kpis: KPIData[] = [
  {
    label: 'Total Leads',
    value: '1,247',
    change: 12.4,
    icon: <Users className="h-4 w-4" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    label: 'Hot Leads',
    value: '384',
    change: 8.7,
    icon: <Flame className="h-4 w-4" />,
    color: 'text-[var(--alo-cta-active)]',
    bgColor: 'bg-[var(--alo-cta-soft)]',
  },
  {
    label: 'Lead Conversion',
    value: '23.6%',
    change: 3.2,
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    label: 'Cost Per Lead',
    value: '৳187',
    change: -5.1,
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
  },
  {
    label: 'WhatsApp Convos',
    value: '2,891',
    change: 18.3,
    icon: <MessageCircle className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    label: 'AI Handled',
    value: '2,134',
    change: 24.6,
    icon: <Bot className="h-4 w-4" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    label: 'Human Handled',
    value: '757',
    change: -2.3,
    icon: <UserCheck className="h-4 w-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    label: 'SLA Rate',
    value: '94.2%',
    change: 1.8,
    icon: <ShieldCheck className="h-4 w-4" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    label: 'Posts Published',
    value: '48',
    change: 15.0,
    icon: <FileText className="h-4 w-4" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    label: 'Total Reach',
    value: '284K',
    change: 22.1,
    icon: <Eye className="h-4 w-4" />,
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50',
  },
  {
    label: 'Engagement Rate',
    value: '5.8%',
    change: 0.7,
    icon: <ThumbsUp className="h-4 w-4" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    label: 'Followers Gained',
    value: '1,023',
    change: 31.5,
    icon: <UserPlus className="h-4 w-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    label: 'Campaign ROI',
    value: '342%',
    change: 28.9,
    icon: <Target className="h-4 w-4" />,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
  {
    label: 'Revenue',
    value: '৳18.4L',
    change: 19.6,
    icon: <Wallet className="h-4 w-4" />,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
  },
  {
    label: 'Response Rate',
    value: '97.1%',
    change: 2.4,
    icon: <Phone className="h-4 w-4" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  {
    label: 'Avg Response Time',
    value: '1m 42s',
    change: -14.2,
    icon: <Timer className="h-4 w-4" />,
    color: 'text-[var(--alo-brand)]',
    bgColor: 'bg-[var(--alo-brand-pale)]',
  },
];

const leadSources = [
  { source: 'Facebook Ads', count: 487, color: '#1877F2', pct: 39 },
  { source: 'WhatsApp Referral', count: 298, color: '#25D366', pct: 24 },
  { source: 'Website Organic', count: 186, color: '#F59E0B', pct: 15 },
  { source: 'Instagram', count: 124, color: '#E4405F', pct: 10 },
  { source: 'Google Ads', count: 87, color: '#EA4335', pct: 7 },
  { source: 'Referral', count: 65, color: '#8B5CF6', pct: 5 },
];

const channelPerformance: ChannelPerformance[] = [
  {
    channel: 'Facebook Page',
    icon: <Facebook className="h-4 w-4" />,
    leads: 487,
    conversations: 1243,
    conversion: '24.2%',
    responseTime: '2m 10s',
    status: 'active',
  },
  {
    channel: 'WhatsApp Business',
    icon: <MessageCircle className="h-4 w-4 text-green-600" />,
    leads: 298,
    conversations: 1547,
    conversion: '31.5%',
    responseTime: '1m 05s',
    status: 'active',
  },
  {
    channel: 'Instagram',
    icon: <Instagram className="h-4 w-4" />,
    leads: 124,
    conversations: 412,
    conversion: '18.7%',
    responseTime: '3m 45s',
    status: 'active',
  },
  {
    channel: 'Website Chat',
    icon: <Globe className="h-4 w-4" />,
    leads: 186,
    conversations: 623,
    conversion: '22.3%',
    responseTime: '1m 30s',
    status: 'active',
  },
  {
    channel: 'Email Marketing',
    icon: <Mail className="h-4 w-4" />,
    leads: 67,
    conversations: 189,
    conversion: '14.9%',
    responseTime: '45m 00s',
    status: 'low',
  },
  {
    channel: 'SMS Campaign',
    icon: <Phone className="h-4 w-4" />,
    leads: 42,
    conversations: 98,
    conversion: '11.9%',
    responseTime: '8m 20s',
    status: 'paused',
  },
];

const campaignROI: CampaignROI[] = [
  {
    id: 'C-001',
    name: 'UK Spring Intake 2025',
    budget: '৳3,50,000',
    spent: '৳2,87,400',
    leads: 412,
    conversions: 97,
    revenue: '৳8,72,000',
    roi: '203%',
    status: 'running',
  },
  {
    id: 'C-002',
    name: 'Canada Express Entry Rush',
    budget: '৳2,80,000',
    spent: '৳2,65,200',
    leads: 287,
    conversions: 64,
    revenue: '৳6,40,000',
    roi: '141%',
    status: 'running',
  },
  {
    id: 'C-003',
    name: 'Australia Student Visa',
    budget: '৳2,00,000',
    spent: '৳1,92,000',
    leads: 198,
    conversions: 52,
    revenue: '৳5,20,000',
    roi: '171%',
    status: 'completed',
  },
  {
    id: 'C-004',
    name: 'USA F1 Visa Workshop',
    budget: '৳1,50,000',
    spent: '৳1,48,500',
    leads: 156,
    conversions: 38,
    revenue: '৳3,80,000',
    roi: '156%',
    status: 'completed',
  },
  {
    id: 'C-005',
    name: 'Malaysia Fast-Track',
    budget: '৳80,000',
    spent: '৳78,400',
    leads: 94,
    conversions: 31,
    revenue: '৳2,17,000',
    roi: '177%',
    status: 'paused',
  },
  {
    id: 'C-006',
    name: 'Schengen Tourist Visa',
    budget: '৳1,20,000',
    spent: '৳89,600',
    leads: 100,
    conversions: 18,
    revenue: '৳1,08,000',
    roi: '21%',
    status: 'running',
  },
];

const aiVsHuman: AIComparison[] = [
  { metric: 'Conversations Handled', ai: 2134, human: 757, unit: '' },
  { metric: 'Avg Response Time (sec)', ai: 12, human: 245, unit: 's' },
  { metric: 'First Contact Resolution', ai: 78, human: 91, unit: '%' },
  { metric: 'Lead Qualification Rate', ai: 42, human: 67, unit: '%' },
  { metric: 'Customer Satisfaction', ai: 4.2, human: 4.7, unit: '/5' },
  { metric: 'Escalation Rate', ai: 18, human: 5, unit: '%' },
  { metric: 'Cost Per Conversation', ai: 8, human: 85, unit: '৳' },
  { metric: 'Available Hours/Day', ai: 24, human: 10, unit: 'h' },
];

const slaData: SLAData[] = [
  { category: 'Initial Response (<5 min)', total: 2891, compliant: 2784, breached: 107, rate: 96.3 },
  { category: 'Lead Qualification (<15 min)', total: 1247, compliant: 1167, breached: 80, rate: 93.6 },
  { category: 'Document Collection (<24 hrs)', total: 384, compliant: 341, breached: 43, rate: 88.8 },
  { category: 'Follow-up (<2 hrs)', total: 892, compliant: 852, breached: 40, rate: 95.5 },
  { category: 'Complaint Resolution (<4 hrs)', total: 67, compliant: 58, breached: 9, rate: 86.6 },
  { category: 'Payment Query (<1 hr)', total: 124, compliant: 120, breached: 4, rate: 96.8 },
];

// ---------------------------------------------------------------------------
// CSS-only Bar Chart Component
// ---------------------------------------------------------------------------

function CSSBarChart({
  data,
  maxValue,
}: {
  data: { label: string; value: number; color: string; pct: number }[];
  maxValue: number;
}) {
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground truncate max-w-[180px]">
              {item.label}
            </span>
            <span className="font-semibold tabular-nums">
              {item.value.toLocaleString()}{' '}
              <span className="text-muted-foreground text-xs">({item.pct}%)</span>
            </span>
          </div>
          <div className="relative h-7 w-full rounded-md bg-muted/50 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-md transition-all duration-700 ease-out"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
                opacity: 0.85,
              }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-md"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                background: 'linear-gradient(90deg, transparent 60%, rgba(255,255,255,0.2))',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SLA Compliance CSS Chart
// ---------------------------------------------------------------------------

function SLAComplianceChart({ data }: { data: SLAData[] }) {
  return (
    <div className="space-y-4">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground truncate max-w-[220px]">
              {item.category}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {item.compliant}/{item.total}
              </span>
              <span
                className={cn(
                  'font-bold tabular-nums text-sm',
                  item.rate >= 95
                    ? 'text-emerald-600'
                    : item.rate >= 90
                      ? 'text-amber-600'
                      : 'text-red-600'
                )}
              >
                {item.rate}%
              </span>
            </div>
          </div>
          <div className="relative h-6 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${item.rate}%`,
                backgroundColor:
                  item.rate >= 95
                    ? '#10B981'
                    : item.rate >= 90
                      ? '#F59E0B'
                      : '#EF4444',
              }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${item.rate}%`,
                background: 'linear-gradient(90deg, transparent 70%, rgba(255,255,255,0.3))',
              }}
            />
            {/* 95% target line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-400/70"
              style={{ left: '95%' }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[11px] text-red-500 font-medium">
                95%
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI vs Human Comparison Bars
// ---------------------------------------------------------------------------

function AIvsHumanChart({ data }: { data: AIComparison[] }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.ai, d.human)));
  return (
    <div className="space-y-5">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-muted-foreground">
              {item.metric}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-600 font-semibold flex items-center gap-1">
                  <Bot className="h-3 w-3" /> AI
                </span>
                <span className="tabular-nums font-medium">
                  {item.ai}{item.unit}
                </span>
              </div>
              <div className="relative h-4 w-full rounded bg-muted/40 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-cyan-500 transition-all duration-700"
                  style={{ width: `${(item.ai / maxVal) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> Human
                </span>
                <span className="tabular-nums font-medium">
                  {item.human}{item.unit}
                </span>
              </div>
              <div className="relative h-4 w-full rounded bg-muted/40 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-amber-500 transition-all duration-700"
                  style={{ width: `${(item.human / maxVal) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export Button
// ---------------------------------------------------------------------------

function ExportButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export analytics as CSV</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MarketingAnalyticsView() {
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => setExporting(false), 1500);
  };

  const dateRangeLabel = useMemo(() => {
    switch (dateRange) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case 'custom': return 'Custom Range';
      default: return 'Last 30 Days';
    }
  }, [dateRange]);

  const maxLeadSource = Math.max(...leadSources.map((s) => s.count));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Marketing Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            ALO Education — comprehensive marketing performance dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Period Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          <Zap className="h-3 w-3 mr-1" />
          {dateRangeLabel}
        </Badge>
        <span className="text-xs text-muted-foreground">Data refreshed 2 minutes ago</span>
      </div>

      {/* KPI Cards 2x4 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="hover:shadow-md transition-shadow cursor-default">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn('p-2 rounded-lg', kpi.bgColor, kpi.color)}>
                        {kpi.icon}
                      </div>
                      <div className={cn(
                        'flex items-center gap-0.5 text-xs font-medium',
                        kpi.change >= 0 ? 'text-emerald-600' : 'text-red-500'
                      )}>
                        {kpi.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(kpi.change).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-xl font-bold tabular-nums">{kpi.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{kpi.label}: {kpi.value} ({kpi.change >= 0 ? '+' : ''}{kpi.change}% vs prev period)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Lead Source Bar Chart + AI vs Human Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-[var(--alo-cta)]" />
              Lead Sources
            </CardTitle>
            <CardDescription>Breakdown of 1,247 total leads by source channel</CardDescription>
          </CardHeader>
          <CardContent>
            <CSSBarChart
              data={leadSources.map((s) => ({ label: s.source, value: s.count, color: s.color, pct: s.pct }))}
              maxValue={maxLeadSource}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-cyan-500" />
              AI vs Human Performance
            </CardTitle>
            <CardDescription>Comparing automated and manual handling metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] overflow-y-auto pr-2">
              <AIvsHumanChart data={aiVsHuman} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-sky-500" />
            Channel Performance
          </CardTitle>
          <CardDescription>Performance metrics across all marketing channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Conversations</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                  <TableHead className="text-right">Avg Response</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelPerformance.map((ch, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">{ch.icon}{ch.channel}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{ch.leads.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{ch.conversations.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{ch.conversion}</TableCell>
                    <TableCell className="text-right tabular-nums">{ch.responseTime}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={ch.status === 'active' ? 'default' : ch.status === 'paused' ? 'secondary' : 'outline'}
                        className={cn(
                          'text-xs',
                          ch.status === 'active' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
                          ch.status === 'paused' && 'bg-amber-100 text-amber-700 hover:bg-amber-100',
                          ch.status === 'low' && 'bg-red-100 text-red-700 hover:bg-red-100'
                        )}
                      >
                        {ch.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign ROI Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-500" />
                Campaign ROI
              </CardTitle>
              <CardDescription>Return on investment for active and completed campaigns</CardDescription>
            </div>
            <ExportButton />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignROI.map((camp) => (
                  <TableRow key={camp.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{camp.id}</TableCell>
                    <TableCell className="font-medium">{camp.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{camp.budget}</TableCell>
                    <TableCell className="text-right tabular-nums">{camp.spent}</TableCell>
                    <TableCell className="text-right tabular-nums">{camp.leads}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{camp.conversions}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium text-emerald-600">{camp.revenue}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        'font-bold tabular-nums',
                        parseInt(camp.roi) >= 150 ? 'text-emerald-600' : parseInt(camp.roi) >= 100 ? 'text-amber-600' : 'text-red-500'
                      )}>
                        {camp.roi}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={camp.status === 'running' ? 'default' : camp.status === 'completed' ? 'secondary' : 'outline'}
                        className={cn(
                          'text-xs',
                          camp.status === 'running' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
                          camp.status === 'completed' && 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]',
                          camp.status === 'paused' && 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                        )}
                      >
                        {camp.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SLA Compliance Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-500" />
            SLA Compliance
          </CardTitle>
          <CardDescription>Service level adherence across response categories (target: 95%)</CardDescription>
        </CardHeader>
        <CardContent>
          <SLAComplianceChart data={slaData} />
          <div className="mt-6 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>Overall SLA compliance: <span className="font-semibold text-foreground">94.2%</span></span>
            <span>Total breaches this period: <span className="font-semibold text-red-500">283</span></span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Report generated for {dateRangeLabel} • ALO Education Marketing Hub</span>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Download Full Report'}
        </Button>
      </div>
    </div>
  );
}
