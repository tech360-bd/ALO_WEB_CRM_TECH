'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  CalendarClock,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowUpDown,
  X,
  Clock,
  FileText,
  Filter,
  GitBranch,
  Globe,
  GraduationCap,
  Sparkles,
  Eye,
  PhoneCall,
  MessageCircle,
  Video,
  Calendar,
  Star,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowDownRight,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  StatCard,
  SectionCard,
  PageHeader,
  CompletionRing,
  TimelineStep,
  QuickAction,
  MetricRow,
  TabCounter,
  EmptyState,
  LoadingGrid,
  PipelineStage,
  StatusBadge,
  Icon,
  MiniBar,
} from '@/components/alo/shared';
import {
  LEAD_SOURCES,
  SOURCE_LABELS,
  timeAgo,
} from '@/lib/alo-types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CrmDashboardProps {
  onNavigate?: (view: string, slug?: string) => void;
}

interface Lead {
  id: string;
  leadId: string;
  fullName: string;
  email?: string;
  phone: string;
  source: string;
  sourceDetail?: string;
  preferredCountry?: string;
  preferredCourse?: string;
  status: string;
  score?: number;
  counselorId?: string;
  counselor?: { id: string; name: string; email?: string } | null;
  lastActivity?: string;
  createdAt: string;
  notes?: string;
  [key: string]: unknown;
}

interface DashboardStats {
  counts?: Record<string, number>;
  leadsBySource?: Record<string, number>;
  leadsByStatus?: Record<string, number>;
  appsByStage?: Record<string, number>;
  docsByStatus?: Record<string, number>;
  finance?: {
    revenue?: number;
    pendingPayments?: number;
  };
  marketing?: {
    conversionRate?: number;
  };
  avgProfileCompletion?: number;
  todayNewLeads?: number;
  recentAudit?: unknown[];
  [key: string]: unknown;
}

interface ConversionFunnel {
  stages?: { label: string; count: number; rate?: number }[];
  [key: string]: unknown;
}

interface AuditLog {
  id: string;
  action: string;
  entity?: string;
  details?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
  [key: string]: unknown;
}

type SortField = 'fullName' | 'score' | 'createdAt' | 'status';
type SortDir = 'asc' | 'desc';

// ─── Constants ───────────────────────────────────────────────────────────────

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-700',
  CONTACTED: 'bg-alo-blue-light text-alo-blue',
  QUALIFIED: 'bg-violet-100 text-violet-700',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-rose-100 text-rose-700',
  DUPLICATE: 'bg-slate-100 text-slate-600',
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  CONVERTED: 'Converted',
  LOST: 'Lost',
  DUPLICATE: 'Duplicate',
};

const PIPELINE_STAGES = [
  { key: 'NEW', label: 'New', color: 'amber' as const },
  { key: 'CONTACTED', label: 'Contacted', color: 'blue' as const },
  { key: 'QUALIFIED', label: 'Qualified', color: 'violet' as const },
  { key: 'CONVERTED', label: 'Converted', color: 'emerald' as const },
  { key: 'LOST', label: 'Lost', color: 'rose' as const },
];

const ACTIVITY_ICONS: Record<string, string> = {
  LEAD_CREATED: 'UserPlus',
  STATUS_CHANGED: 'GitBranch',
  CALL_MADE: 'Phone',
  EMAIL_SENT: 'Mail',
  NOTE_ADDED: 'FileText',
  ASSIGNED: 'UserCheck',
  CONVERTED: 'CheckCircle2',
  APPLICATION_CREATED: 'ClipboardList',
  DOCUMENT_UPLOADED: 'Upload',
  LOGIN: 'LogIn',
};

// ─── Demo Fallback Data ──────────────────────────────────────────────────────

const DEMO_STATS: DashboardStats = {
  counts: { leads: 284, students: 142, applications: 89, todayLeads: 12 },
  leadsBySource: { WEBSITE: 78, WHATSAPP: 62, FACEBOOK: 45, INSTAGRAM: 38, PHONE_CALL: 24, PARTNER_REFERRAL: 18, OFFICE_VISIT: 12, EVENT: 5, SMS: 2 },
  leadsByStatus: { NEW: 67, CONTACTED: 84, QUALIFIED: 52, CONVERTED: 63, LOST: 18 },
  appsByStage: { APPLICATION_SUBMITTED: 32, CONDITIONAL_OFFER: 21, CAS_PENDING: 15, VISA_SUBMITTED: 12, ENROLLED: 9 },
  docsByStatus: { PENDING: 34, UPLOADED: 67, UNDER_REVIEW: 23, APPROVED: 89, REJECTED: 5 },
  finance: { revenue: 184500, pendingPayments: 32500 },
  marketing: { conversionRate: 22.2 },
  avgProfileCompletion: 72,
  todayNewLeads: 12,
};

const DEMO_PRIORITY_LEADS: Lead[] = [
  { id: 'd1', leadId: 'ALO-L-0042', fullName: 'Ahmed Al-Rashid', email: 'ahmed@email.com', phone: '+971501234567', source: 'WEBSITE', preferredCountry: 'UK', preferredCourse: 'MSc Computer Science', status: 'QUALIFIED', score: 95, counselor: { id: 'c1', name: 'Sarah Johnson' }, lastActivity: '2h ago', createdAt: '2025-01-10T10:00:00Z' },
  { id: 'd2', leadId: 'ALO-L-0038', fullName: 'Priya Sharma', email: 'priya@email.com', phone: '+919876543210', source: 'WHATSAPP', preferredCountry: 'Australia', preferredCourse: 'MBA', status: 'CONTACTED', score: 91, counselor: { id: 'c2', name: 'Mike Chen' }, lastActivity: '5h ago', createdAt: '2025-01-12T14:00:00Z' },
  { id: 'd3', leadId: 'ALO-L-0051', fullName: 'Fatima Hassan', email: 'fatima@email.com', phone: '+966551234567', source: 'PARTNER_REFERRAL', preferredCountry: 'Canada', preferredCourse: 'BEng Mechanical', status: 'NEW', score: 88, counselor: null, lastActivity: '1d ago', createdAt: '2025-01-14T09:00:00Z' },
  { id: 'd4', leadId: 'ALO-L-0029', fullName: 'James Okonkwo', email: 'james@email.com', phone: '+2348012345678', source: 'FACEBOOK', preferredCountry: 'USA', preferredCourse: 'MS Data Science', status: 'QUALIFIED', score: 85, counselor: { id: 'c1', name: 'Sarah Johnson' }, lastActivity: '3h ago', createdAt: '2025-01-08T11:00:00Z' },
  { id: 'd5', leadId: 'ALO-L-0060', fullName: 'Nguyen Thi Lan', email: 'lan@email.com', phone: '+84901234567', source: 'INSTAGRAM', preferredCountry: 'Germany', preferredCourse: 'MSc AI', status: 'CONTACTED', score: 82, counselor: { id: 'c3', name: 'Anna Weber' }, lastActivity: '8h ago', createdAt: '2025-01-15T16:00:00Z' },
];

const DEMO_LEADS: Lead[] = Array.from({ length: 25 }, (_, i) => ({
  id: `demo-${i}`,
  leadId: `ALO-L-${String(100 + i).padStart(4, '0')}`,
  fullName: ['Ahmed Al-Rashid', 'Priya Sharma', 'Fatima Hassan', 'James Okonkwo', 'Nguyen Thi Lan', 'Maria Santos', 'Chen Wei', 'Olga Petrov', 'Kwame Asante', 'Yuki Tanaka', 'Ravi Patel', 'Sofia Martinez', 'Mohamed Ali', 'Emily Chen', 'David Kim', 'Aisha Bello', 'Carlos Ruiz', 'Hannah Lee', 'Omar Farah', 'Lisa Wang', 'Raj Kumar', 'Elena Volkov', 'John Mwangi', 'Mei Lin', 'Tomas Novak'][i],
  email: `lead${i}@email.com`,
  phone: `+1234567890${i}`,
  source: ['WEBSITE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'PHONE_CALL', 'PARTNER_REFERRAL', 'OFFICE_VISIT', 'EVENT', 'SMS'][i % 9],
  preferredCountry: ['UK', 'USA', 'Canada', 'Australia', 'Germany', 'Ireland', 'Malaysia', 'New Zealand', 'Finland'][i % 9],
  preferredCourse: ['MSc Computer Science', 'MBA', 'BEng Mechanical', 'MS Data Science', 'MSc AI', 'BBA', 'MSc Finance', 'LLM', 'MPH'][i % 9],
  status: ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'][i % 5],
  score: 95 - i * 3,
  counselor: i % 3 === 0 ? null : { id: `c-${i % 3}`, name: ['Sarah Johnson', 'Mike Chen', 'Anna Weber'][i % 3] },
  lastActivity: `${1 + i}h ago`,
  createdAt: new Date(Date.now() - (i + 1) * 3600000 * 24).toISOString(),
}));

const DEMO_CONVERSION: ConversionFunnel = {
  stages: [
    { label: 'Total Leads', count: 284, rate: 100 },
    { label: 'Contacted', count: 151, rate: 53.2 },
    { label: 'Qualified', count: 52, rate: 18.3 },
    { label: 'Applied', count: 38, rate: 13.4 },
    { label: 'Offered', count: 28, rate: 9.9 },
    { label: 'Enrolled', count: 18, rate: 6.3 },
  ],
};

const DEMO_ACTIVITY: AuditLog[] = [
  { id: 'a1', action: 'LEAD_CREATED', entity: 'Lead', details: 'New lead created via website form', userName: 'System', createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: 'a2', action: 'STATUS_CHANGED', entity: 'Lead', details: 'Status changed from NEW to CONTACTED', userName: 'Sarah Johnson', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a3', action: 'CALL_MADE', entity: 'Lead', details: 'Outbound call completed — 4min 32s', userName: 'Mike Chen', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'a4', action: 'EMAIL_SENT', entity: 'Lead', details: 'Course brochure sent via email', userName: 'Sarah Johnson', createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: 'a5', action: 'CONVERTED', entity: 'Lead', details: 'Lead converted to student — application started', userName: 'Anna Weber', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 'a6', action: 'NOTE_ADDED', entity: 'Lead', details: 'Follow-up scheduled for next Tuesday', userName: 'Mike Chen', createdAt: new Date(Date.now() - 21600000).toISOString() },
  { id: 'a7', action: 'ASSIGNED', entity: 'Lead', details: 'Lead assigned to Sarah Johnson', userName: 'Admin', createdAt: new Date(Date.now() - 28800000).toISOString() },
  { id: 'a8', action: 'APPLICATION_CREATED', entity: 'Application', details: 'New application for MSc CS at University of Manchester', userName: 'Sarah Johnson', createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 'a9', action: 'STATUS_CHANGED', entity: 'Lead', details: 'Status changed from CONTACTED to QUALIFIED', userName: 'Mike Chen', createdAt: new Date(Date.now() - 57600000).toISOString() },
  { id: 'a10', action: 'DOCUMENT_UPLOADED', entity: 'Document', details: 'Passport copy uploaded', userName: 'System', createdAt: new Date(Date.now() - 72000000).toISOString() },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
}

function getScoreColor(score: number | undefined): string {
  if (!score) return 'text-alo-gray';
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-alo-blue';
  if (score >= 50) return 'text-alo-orange';
  return 'text-rose-600';
}

function getNextBestAction(status: string): { icon: string; label: string; description: string } {
  switch (status) {
    case 'NEW':
      return { icon: 'Phone', label: 'Make First Contact', description: 'Call within 5 minutes for highest conversion.' };
    case 'CONTACTED':
      return { icon: 'GraduationCap', label: 'Schedule Counseling', description: 'Book a counseling session to assess eligibility.' };
    case 'QUALIFIED':
      return { icon: 'FileText', label: 'Start Application', description: 'Begin document collection and university shortlisting.' };
    case 'CONVERTED':
      return { icon: 'CheckCircle2', label: 'Track Application', description: 'Monitor application progress and CAS status.' };
    default:
      return { icon: 'AlertTriangle', label: 'Review Lead', description: 'Re-evaluate lead quality and next steps.' };
  }
}

function getActivityColor(action: string): string {
  if (action.includes('CREATED') || action === 'CONVERTED') return 'bg-emerald-100 text-emerald-600';
  if (action.includes('STATUS')) return 'bg-alo-blue-light text-alo-blue';
  if (action === 'CALL_MADE') return 'bg-alo-orange-light text-alo-orange';
  if (action === 'EMAIL_SENT') return 'bg-violet-100 text-violet-600';
  if (action === 'NOTE_ADDED') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export function CrmDashboard({ onNavigate }: CrmDashboardProps) {
  // ── Data state ──
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [priorityLeads, setPriorityLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [conversion, setConversion] = useState<ConversionFunnel | null>(null);
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ── Filter / UI state ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [pipelineFilter, setPipelineFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ── Sheet state ──
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // ── Fetch all data ──
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const [statsRes, priorityRes, leadsRes, conversionRes, activityRes] =
          await Promise.allSettled([
            fetch('/api/dashboard/stats?role=CRM'),
            fetch('/api/leads?limit=5&sortBy=score&order=desc'),
            fetch('/api/leads'),
            fetch('/api/reports/conversion'),
            fetch('/api/audit-logs?limit=10'),
          ]);

        if (!alive) return;

        const parse = (r: PromiseSettledResult<Response>) => {
          if (r.status === 'fulfilled') return r.value.json();
          return null;
        };

        const [statsData, priorityData, leadsData, conversionData, activityData] =
          await Promise.all([
            parse(statsRes),
            parse(priorityRes),
            parse(leadsRes),
            parse(conversionRes),
            parse(activityRes),
          ]);

        setStats(statsData ?? DEMO_STATS);
        setPriorityLeads(
          (Array.isArray(priorityData?.leads) ? priorityData.leads : null) ??
          (Array.isArray(priorityData) ? priorityData : DEMO_PRIORITY_LEADS),
        );
        setAllLeads(
          (Array.isArray(leadsData?.leads) ? leadsData.leads : null) ??
          (Array.isArray(leadsData) ? leadsData : DEMO_LEADS),
        );
        setConversion(conversionData ?? DEMO_CONVERSION);
        setActivities(
          (Array.isArray(activityData?.logs) ? activityData.logs : null) ??
          (Array.isArray(activityData) ? activityData : DEMO_ACTIVITY),
        );
      } catch {
        setError(true);
        setStats(DEMO_STATS);
        setPriorityLeads(DEMO_PRIORITY_LEADS);
        setAllLeads(DEMO_LEADS);
        setConversion(DEMO_CONVERSION);
        setActivities(DEMO_ACTIVITY);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ── Derived data ──
  const leadsByStatus = stats?.leadsByStatus ?? {};
  const leadsBySource = stats?.leadsBySource ?? {};
  const docsByStatus = stats?.docsByStatus ?? {};
  const funnelStages = conversion?.stages ?? DEMO_CONVERSION.stages ?? [];

  const filteredLeads = useMemo(() => {
    let result = [...allLeads];

    // Pipeline filter
    if (pipelineFilter && pipelineFilter !== 'ALL') {
      result = result.filter((l) => l.status === pipelineFilter);
    }
    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((l) => l.status === statusFilter);
    }
    // Source filter
    if (sourceFilter !== 'ALL') {
      result = result.filter((l) => l.source === sourceFilter);
    }
    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.fullName.toLowerCase().includes(q) ||
          l.leadId.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.preferredCountry?.toLowerCase().includes(q) ||
          l.preferredCourse?.toLowerCase().includes(q),
      );
    }
    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'fullName') cmp = a.fullName.localeCompare(b.fullName);
      else if (sortField === 'score') cmp = (a.score ?? 0) - (b.score ?? 0);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [allLeads, pipelineFilter, statusFilter, sourceFilter, search, sortField, sortDir]);

  const handleSort = useCallback((field: SortField) => {
    setSortDir((d) => (sortField === field && d === 'desc' ? 'asc' : 'desc'));
    setSortField(field);
  }, [sortField]);

  const openLeadSheet = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  }, []);

  const activePipelineCount = pipelineFilter
    ? (leadsByStatus[pipelineFilter] ?? 0)
    : allLeads.length;

  // ── Loading State ──
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="CRM Dashboard"
          subtitle="Manage your leads, pipeline, and conversion metrics"
          icon="Users"
          action={
            <Button
              onClick={() => onNavigate?.('landing')}
              className="h-10 bg-alo-orange text-white hover:bg-alo-orange-dark"
            >
              <UserPlus className="mr-2 size-4" />
              New Lead
            </Button>
          }
        />
        <LoadingGrid count={4} />
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error && !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="CRM Dashboard" subtitle="Lead management and pipeline" icon="Users" />
        <EmptyState
          icon="WifiOff"
          title="Unable to load CRM data"
          description="Showing demo data. Check your connection and try again."
        />
      </div>
    );
  }

  // ── RENDER ──
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ═══ 1. COMMAND CENTER HEADER ═══ */}
        <PageHeader
          title="CRM Dashboard"
          subtitle="Manage your leads, pipeline, and conversion metrics"
          icon="Users"
          action={
            <Button
              onClick={() => onNavigate?.('landing')}
              className="h-10 bg-alo-orange text-white hover:bg-alo-orange-dark"
            >
              <UserPlus className="mr-2 size-4" />
              New Lead
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Leads"
            value={stats?.counts?.leads ?? 0}
            icon="Users"
            accent="blue"
            hint={`${leadsByStatus.NEW ?? 0} new · ${leadsByStatus.CONVERTED ?? 0} converted`}
          />
          <StatCard
            label="Today's New"
            value={stats?.todayNewLeads ?? stats?.counts?.todayLeads ?? 0}
            icon="UserPlus"
            accent="orange"
            hint="Leads received today"
          />
          <StatCard
            label="Conversion Rate"
            value={`${stats?.marketing?.conversionRate ?? 0}%`}
            icon="TrendingUp"
            accent="emerald"
            hint={`${leadsByStatus.CONVERTED ?? 0} of ${stats?.counts?.leads ?? 0} leads`}
          />
          <StatCard
            label="Revenue"
            value={formatCurrency(stats?.finance?.revenue ?? 0)}
            icon="DollarSign"
            accent="sunshine"
            hint={`${formatCurrency(stats?.finance?.pendingPayments ?? 0)} pending`}
          />
        </div>

        {/* ═══ 2. LEAD PIPELINE ═══ */}
        <SectionCard
          title="Lead Pipeline"
          description={`${activePipelineCount} lead${activePipelineCount !== 1 ? 's' : ''} ${pipelineFilter ? `in ${LEAD_STATUS_LABELS[pipelineFilter] ?? pipelineFilter}` : 'total'}`}
          icon="GitBranch"
        >
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 alo-scroll sm:gap-2">
            <button
              onClick={() => setPipelineFilter(null)}
              className={cn(
                'flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-4 py-3 transition-all duration-200',
                !pipelineFilter
                  ? 'bg-alo-blue text-white shadow-md'
                  : 'bg-alo-gray-light text-alo-gray hover:bg-alo-gray-light/80',
              )}
            >
              <span className="text-lg font-bold tabular-nums">{allLeads.length}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide">All</span>
            </button>
            {PIPELINE_STAGES.map((stage) => {
              const count = leadsByStatus[stage.key] ?? 0;
              const isActive = pipelineFilter === stage.key;
              return (
                <button
                  key={stage.key}
                  onClick={() => setPipelineFilter(isActive ? null : stage.key)}
                >
                  <PipelineStage
                    label={stage.label}
                    count={count}
                    color={stage.color}
                    active={isActive}
                  />
                </button>
              );
            })}
          </div>
          {/* Connector arrows between pipeline stages (desktop) */}
          <div className="mt-3 hidden items-center justify-center gap-1 text-alo-gray/40 lg:flex">
            {['New →', 'Contacted →', 'Qualified →', 'Converted', 'Lost'].map((s, i) => (
              <span key={i} className="text-[10px] font-medium uppercase tracking-widest">
                {s}
              </span>
            ))}
          </div>
        </SectionCard>

        {/* ═══ 3. PRIORITY LEADS + 4. ACTIVITY FEED (side by side on desktop) ═══ */}
        <div className="grid gap-4 lg:grid-cols-5">
          {/* ── Priority Leads Panel ── */}
          <SectionCard
            title="Priority Leads"
            description="Top 5 by score"
            icon="Star"
            className="lg:col-span-3"
          >
            <div className="space-y-3">
              {priorityLeads.length === 0 ? (
                <EmptyState
                  icon="UserX"
                  title="No priority leads"
                  description="Leads will appear here once scored."
                />
              ) : (
                priorityLeads.map((lead, idx) => {
                  const score = lead.score ?? 0;
                  return (
                    <div
                      key={lead.id}
                      onClick={() => openLeadSheet(lead)}
                      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-white p-4 transition-all duration-200 hover:border-alo-blue/30 hover:shadow-md"
                    >
                      {/* Rank */}
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-alo-blue-light text-sm font-bold text-alo-blue">
                        #{idx + 1}
                      </div>

                      {/* Avatar + Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-alo-black">
                            {lead.fullName}
                          </span>
                          <Badge
                            variant="outline"
                            className="shrink-0 border-alo-blue/20 bg-alo-blue-light text-[10px] font-medium text-alo-blue"
                          >
                            {SOURCE_LABELS[lead.source] ?? lead.source}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-alo-gray">
                          {lead.preferredCountry && (
                            <span className="flex items-center gap-1">
                              <Globe className="size-3" />
                              {lead.preferredCountry}
                            </span>
                          )}
                          {lead.preferredCourse && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="size-3" />
                              <span className="truncate max-w-[140px]">{lead.preferredCourse}</span>
                            </span>
                          )}
                          {lead.lastActivity && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {lead.lastActivity}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score Ring + Contact Action */}
                      <div className="flex shrink-0 items-center gap-3">
                        <CompletionRing value={score} size={48} />
                        <Button
                          size="sm"
                          className="h-8 bg-alo-blue px-3 text-xs text-white hover:bg-alo-blue-dark"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLeadSheet(lead);
                          }}
                        >
                          <Phone className="mr-1.5 size-3" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>

          {/* ── 7. Recent Activity Feed ── */}
          <SectionCard
            title="Recent Activity"
            description="Last 10 actions"
            icon="Activity"
            className="lg:col-span-2"
          >
            <div className="max-h-[420px] space-y-2 overflow-y-auto alo-scroll pr-1">
              {activities.length === 0 ? (
                <p className="py-8 text-center text-sm text-alo-gray">No recent activity.</p>
              ) : (
                activities.map((log) => (
                  <div
                    key={log.id}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-white p-3 transition-all duration-200 hover:border-alo-blue/20 hover:shadow-sm"
                  >
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        getActivityColor(log.action),
                      )}
                    >
                      <Icon name={ACTIVITY_ICONS[log.action] ?? 'CircleDot'} className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-alo-black">
                        {log.details ?? log.action}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-alo-gray">
                        {log.userName && <span className="font-medium">{log.userName}</span>}
                        <span>·</span>
                        <span>{timeAgo(log.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        {/* ═══ 6. QUICK STATS CHARTS ═══ */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Leads by Source — Mini Bar Chart */}
          <SectionCard title="Leads by Source" icon="Filter">
            <div className="space-y-2.5">
              {(() => {
                const entries = Object.entries(leadsBySource).sort((a, b) => b[1] - a[1]);
                const maxVal = Math.max(1, ...entries.map(([, v]) => v));
                return entries.slice(0, 6).map(([source, count]) => (
                  <div key={source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-alo-gray">
                        {SOURCE_LABELS[source] ?? source}
                      </span>
                      <span className="font-bold tabular-nums text-alo-black">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-alo-gray-light">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-alo-blue to-alo-blue-dark transition-all duration-500"
                        style={{ width: `${Math.max(4, (count / maxVal) * 100)}%` }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </SectionCard>

          {/* Conversion Funnel — Mini Progress Bars */}
          <SectionCard title="Conversion Funnel" icon="TrendingUp">
            <div className="space-y-3">
              {funnelStages.map((stage, idx) => {
                const width = stage.rate ?? 0;
                const colors = [
                  'bg-alo-blue',
                  'bg-alo-blue/80',
                  'bg-violet-500',
                  'bg-alo-orange',
                  'bg-alo-sunshine',
                  'bg-emerald-500',
                ];
                return (
                  <div key={stage.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-alo-black">
                        <span className="flex size-5 items-center justify-center rounded-full bg-alo-blue-light text-[10px] font-bold text-alo-blue">
                          {idx + 1}
                        </span>
                        {stage.label}
                      </span>
                      <span className="font-bold tabular-nums text-alo-black">
                        {stage.count}
                        <span className="ml-1 font-normal text-alo-gray">{stage.rate}%</span>
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-alo-gray-light">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          colors[idx % colors.length],
                        )}
                        style={{ width: `${Math.max(3, width)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Docs Status — Mini Donut (CSS-only) */}
          <SectionCard title="Documents Status" icon="FileText">
            <div className="flex flex-col items-center">
              {/* CSS Donut */}
              {(() => {
                const total = Object.values(docsByStatus).reduce((s, n) => s + n, 0) || 1;
                const approved = docsByStatus.APPROVED ?? 0;
                const pct = Math.round((approved / total) * 100);
                const review = docsByStatus.UNDER_REVIEW ?? 0;
                const pending = docsByStatus.PENDING ?? 0;
                const uploaded = docsByStatus.UPLOADED ?? 0;
                const rejected = docsByStatus.REJECTED ?? 0;

                // Conic gradient for donut
                const approvedDeg = (approved / total) * 360;
                const uploadedDeg = (uploaded / total) * 360;
                const reviewDeg = (review / total) * 360;
                const pendingDeg = (pending / total) * 360;
                // rejected fills the rest

                const gradient = `conic-gradient(
                  #10b981 0deg ${approvedDeg}deg,
                  #0ea5e9 ${approvedDeg}deg ${approvedDeg + uploadedDeg}deg,
                  #8b5cf6 ${approvedDeg + uploadedDeg}deg ${approvedDeg + uploadedDeg + reviewDeg}deg,
                  #f59e0b ${approvedDeg + uploadedDeg + reviewDeg}deg ${approvedDeg + uploadedDeg + reviewDeg + pendingDeg}deg,
                  #ef4444 ${approvedDeg + uploadedDeg + reviewDeg + pendingDeg}deg 360deg
                )`;

                return (
                  <>
                    <div
                      className="relative flex size-32 items-center justify-center rounded-full"
                      style={{ background: gradient }}
                    >
                      <div className="flex size-20 flex-col items-center justify-center rounded-full bg-white">
                        <span className="text-2xl font-bold text-alo-black tabular-nums">{pct}%</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide text-alo-gray">
                          Approved
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid w-full grid-cols-2 gap-2">
                      {[
                        { label: 'Approved', count: approved, color: 'bg-emerald-500' },
                        { label: 'Uploaded', count: uploaded, color: 'bg-sky-500' },
                        { label: 'Review', count: review, color: 'bg-violet-500' },
                        { label: 'Pending', count: pending, color: 'bg-amber-500' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-xs">
                          <div className={cn('size-2.5 rounded-full', item.color)} />
                          <span className="text-alo-gray">{item.label}</span>
                          <span className="ml-auto font-bold tabular-nums text-alo-black">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </SectionCard>
        </div>

        {/* ═══ 5. LEADS TABLE ═══ */}
        <SectionCard
          title="All Leads"
          description={`${filteredLeads.length} lead${filteredLeads.length !== 1 ? 's' : ''} shown`}
          icon="Users"
        >
          {/* Filters Bar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-alo-gray" />
              <Input
                placeholder="Search name, ID, email, country, course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl border-border pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-[140px] rounded-xl border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-10 w-[150px] rounded-xl border-border">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sources</SelectItem>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(statusFilter !== 'ALL' || sourceFilter !== 'ALL' || pipelineFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-xs text-alo-gray"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setSourceFilter('ALL');
                    setPipelineFilter(null);
                    setSearch('');
                  }}
                >
                  <X className="mr-1 size-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          {filteredLeads.length === 0 ? (
            <EmptyState
              icon="UserX"
              title="No leads match your filters"
              description="Try adjusting the search, status, or source filter."
            />
          ) : (
            <div className="max-h-[420px] overflow-x-auto rounded-xl border border-border alo-scroll">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                  <TableRow>
                    <TableHead className="pl-4">
                      <button
                        onClick={() => handleSort('fullName')}
                        className="flex items-center gap-1 hover:text-alo-blue"
                      >
                        Name
                        <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Source</TableHead>
                    <TableHead className="hidden lg:table-cell">Country</TableHead>
                    <TableHead className="hidden xl:table-cell">Course</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-alo-blue"
                      >
                        Status
                        <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      <button
                        onClick={() => handleSort('score')}
                        className="flex items-center gap-1 hover:text-alo-blue"
                      >
                        Score
                        <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Counselor</TableHead>
                    <TableHead className="hidden md:table-cell">Last Activity</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer transition-colors hover:bg-alo-blue-light/30"
                      onClick={() => openLeadSheet(lead)}
                    >
                      <TableCell className="pl-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-alo-black">{lead.fullName}</span>
                          <span className="font-mono text-[11px] text-alo-gray">{lead.leadId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className="border-alo-blue/20 bg-alo-blue-light text-[11px] font-medium text-alo-blue"
                        >
                          {SOURCE_LABELS[lead.source] ?? lead.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {lead.preferredCountry ?? '—'}
                      </TableCell>
                      <TableCell className="hidden max-w-[160px] truncate text-sm xl:table-cell">
                        {lead.preferredCourse ?? '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={lead.status}
                          colorMap={LEAD_STATUS_COLORS}
                          labels={LEAD_STATUS_LABELS}
                        />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={cn('text-sm font-bold tabular-nums', getScoreColor(lead.score))}>
                          {lead.score ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {lead.counselor?.name ?? (
                          <span className="italic text-alo-gray">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-xs text-alo-gray md:table-cell">
                        {lead.lastActivity ?? timeAgo(lead.createdAt)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-alo-blue hover:text-alo-blue-dark"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLeadSheet(lead);
                          }}
                        >
                          <Eye className="mr-1 size-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>

        {/* ═══ 5. LEAD DETAIL SHEET ═══ */}
        <LeadDetailSheet
          lead={selectedLead}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onNavigate={onNavigate}
        />
      </div>
    </TooltipProvider>
  );
}

// ─── LEAD DETAIL SHEET COMPONENT ─────────────────────────────────────────────

function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  onNavigate,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onNavigate?: (view: string, slug?: string) => void;
}) {
  if (!lead) return null;

  const nba = getNextBestAction(lead.status);
  const score = lead.score ?? 0;

  // Simulated timeline for demo purposes
  const demoTimeline = [
    { step: 1, label: 'Lead Created', status: 'completed' as const },
    { step: 2, label: 'First Contact', status: lead.status !== 'NEW' ? ('completed' as const) : ('current' as const) },
    { step: 3, label: 'Eligibility Assessed', status: ['QUALIFIED', 'CONVERTED'].includes(lead.status) ? ('completed' as const) : (lead.status === 'CONTACTED' ? ('current' as const) : ('upcoming' as const)) },
    { step: 4, label: 'Counseling Session', status: lead.status === 'CONVERTED' ? ('completed' as const) : (['QUALIFIED', 'CONTACTED'].includes(lead.status) ? ('current' as const) : ('upcoming' as const)) },
    { step: 5, label: 'Application Started', status: lead.status === 'CONVERTED' ? ('current' as const) : ('upcoming' as const) },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto alo-scroll bg-white sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2 text-alo-blue">
            <Users className="size-5" />
            Lead Detail
          </SheetTitle>
          <SheetDescription className="text-alo-gray">
            Viewing {lead.fullName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-8 pt-4">
          {/* ── Profile Header ── */}
          <div className="rounded-2xl bg-alo-blue-light p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-alo-black">{lead.fullName}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-alo-blue/20 bg-white text-[11px] font-medium text-alo-blue"
                  >
                    {lead.leadId}
                  </Badge>
                  <StatusBadge
                    status={lead.status}
                    colorMap={LEAD_STATUS_COLORS}
                    labels={LEAD_STATUS_LABELS}
                  />
                  <Badge
                    variant="outline"
                    className="border-alo-orange/20 bg-alo-orange-light text-[11px] font-medium text-alo-orange"
                  >
                    {SOURCE_LABELS[lead.source] ?? lead.source}
                  </Badge>
                </div>
              </div>
              <CompletionRing value={score} size={56} />
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: PhoneCall, label: 'Call', color: 'hover:bg-emerald-50 text-emerald-600' },
              { icon: Mail, label: 'Email', color: 'hover:bg-alo-blue-light text-alo-blue' },
              { icon: MessageCircle, label: 'WhatsApp', color: 'hover:bg-emerald-50 text-emerald-600' },
              { icon: Calendar, label: 'Schedule', color: 'hover:bg-alo-orange-light text-alo-orange' },
            ].map((action) => (
              <button
                key={action.label}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-medium transition-all duration-200',
                  action.color,
                )}
              >
                <action.icon className="size-4" />
                {action.label}
              </button>
            ))}
          </div>

          {/* ── Contact Info ── */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-alo-blue">
              <FileText className="size-4" />
              Contact Information
            </h4>
            <div className="rounded-xl border border-border bg-white">
              <MetricRow label="Email" value={lead.email ?? '—'} />
              <MetricRow label="Phone" value={lead.phone} />
              <MetricRow label="Country" value={lead.preferredCountry ?? '—'} />
              <MetricRow label="Course" value={lead.preferredCourse ?? '—'} />
              <MetricRow label="Source Detail" value={lead.sourceDetail ?? '—'} />
              <MetricRow label="Counselor" value={lead.counselor?.name ?? 'Unassigned'} />
              <MetricRow label="Created" value={timeAgo(lead.createdAt)} />
              {lead.notes && <MetricRow label="Notes" value={lead.notes} />}
            </div>
          </div>

          {/* ── Pipeline Timeline ── */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-alo-blue">
              <GitBranch className="size-4" />
              Pipeline Progress
            </h4>
            <div className="rounded-xl border border-border bg-white p-4">
              {demoTimeline.map((step, idx) => (
                <TimelineStep
                  key={step.step}
                  step={step.step}
                  label={step.label}
                  status={step.status}
                  isLast={idx === demoTimeline.length - 1}
                />
              ))}
            </div>
          </div>

          {/* ── Next Best Action ── */}
          <div className="rounded-xl border-2 border-alo-orange/20 bg-alo-orange-light p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-alo-orange-dark">
              <Zap className="size-4" />
              Next Best Action
            </div>
            <p className="text-sm font-bold text-alo-black">{nba.label}</p>
            <p className="mt-1 text-xs text-alo-gray">{nba.description}</p>
            <Button
              size="sm"
              className="mt-3 h-9 bg-alo-orange text-white hover:bg-alo-orange-dark"
            >
              <Target className="mr-1.5 size-3.5" />
              Take Action
            </Button>
          </div>

          {/* ── Application Status (if converted) ── */}
          {lead.status === 'CONVERTED' && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-alo-blue">
                <CheckCircle2 className="size-4" />
                Application Status
              </h4>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="size-4" />
                  Application In Progress
                </div>
                <p className="mt-1 text-xs text-emerald-600/80">
                  This lead has been converted. Track the full application in the Application Manager.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 h-9 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-100"
                  onClick={() => onNavigate?.('applications')}
                >
                  <ChevronRight className="mr-1.5 size-3.5" />
                  View Application
                </Button>
              </div>
            </div>
          )}

          {/* ── CTA ── */}
          <Button
            className="h-12 w-full bg-alo-blue text-white hover:bg-alo-blue-dark"
            onClick={() => {
              onOpenChange(false);
              onNavigate?.('student-360', lead.id);
            }}
          >
            <Sparkles className="mr-2 size-4" />
            Open Full Student 360
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
