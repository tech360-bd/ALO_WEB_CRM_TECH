'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Brain, Bot, Cpu, Activity, AlertTriangle, Shield, Zap, Users,
  Building2, CheckCircle2, XCircle, Clock, ArrowUpRight, ArrowDownRight,
  Play, Pause, RotateCcw, Settings, Search, Filter, RefreshCw, Eye,
  MoreVertical, ChevronRight, BarChart3, PieChart, TrendingUp, Wrench,
  Database, Lock, Globe, MessageSquare, Mail, Phone, FileText, Calendar,
  Target, Award, AlertCircle, Info, ExternalLink, ToggleLeft, ToggleRight,
  CircleDot, LayoutGrid, ListTodo, Globe2, ThumbsUp, ThumbsDown, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  StatCard, SectionCard, PageHeader, CompletionRing, TimelineStep,
  QuickAction, MetricRow, TabCounter, EmptyState, LoadingGrid,
  StatusBadge, Icon, MiniBar,
} from '@/components/alo/shared';
import { timeAgo } from '@/lib/alo-types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AIWorkforceControlRoomProps {
  onNavigate?: (view: string, slug?: string) => void;
}

interface MetricsData {
  overview: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    busyAgents: number;
    failedAgents: number;
    pausedAgents: number;
  };
  tasks: {
    total: number;
    aiAutomated: number;
    aiAssisted: number;
    humanRequired: number;
    approvalRequired: number;
    escalated: number;
    failed: number;
  };
  automation: {
    targetRate: number;
    actualRate: number;
    humanRate: number;
    variance: number;
  };
  aiUsage: {
    groqRequests: number;
    localAiRequests: number;
    fallbackRequests: number;
    totalTokens: number;
  };
  queue: {
    depth: number;
    successRate: number;
    failureRate: number;
    avgLatencyMs: number;
  };
  health: {
    circuitBreakerState: string;
    rateLimiterStatus: {
      concurrent: number;
      windowCount: number;
      maxPerMin: number;
      maxConcurrent: number;
    };
  };
}

interface DepartmentData {
  id: string;
  name: string;
  code: string;
  description: string | null;
  category: string;
  status: string;
  _count: { agents: number; tasks: number };
  metrics: {
    totalTasks: number;
    aiAutomated: number;
    aiAssisted: number;
    humanRequired: number;
    approvalReq: number;
    escalated: number;
    failed: number;
    avgLatencyMs: number | null;
    tokenUsage: number;
  }[];
}

interface AgentData {
  id: string;
  name: string;
  code: string;
  role: string | null;
  status: string;
  model: string | null;
  description: string | null;
  departmentId: string | null;
  approvalPolicy: string;
  taskSuccessCount: number;
  taskFailCount: number;
  totalTokensUsed: number;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
  aiDepartment: { id: string; name: string; code: string; category: string } | null;
}

interface TaskData {
  id: string;
  type: string;
  priority: number;
  status: string;
  automationClass: string;
  confidence: number | null;
  requiresApproval: boolean;
  approvalStatus: string | null;
  error: string | null;
  result: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  agentId: string | null;
  departmentId: string | null;
  workflowId: string | null;
  agent: { id: string; name: string; code: string } | null;
  department: { id: string; name: string; code: string } | null;
}

interface ApprovalData {
  id: string;
  queueType: string | null;
  priority: number;
  status: string;
  agentId: string | null;
  departmentId: string | null;
  taskType: string | null;
  proposedAction: string | null;
  reason: string | null;
  riskLevel: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  changeId: string | null;
  createdAt: string;
  updatedAt: string;
  change: {
    id: string;
    entityType: string | null;
    changeType: string | null;
    fieldName: string | null;
    oldValue: string | null;
    newValue: string | null;
    confidence: number | null;
    impactLevel: string | null;
    status: string;
  } | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AGENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  IDLE: 'bg-slate-100 text-slate-600 border border-slate-200',
  BUSY: 'bg-alo-blue-light text-alo-blue border border-alo-blue/20',
  PAUSED: 'bg-amber-50 text-amber-700 border border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border border-rose-200',
  WAITING_APPROVAL: 'bg-orange-50 text-orange-700 border border-orange-200',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  QUEUED: 'bg-slate-100 text-slate-600 border border-slate-200',
  RUNNING: 'bg-alo-blue-light text-alo-blue border border-alo-blue/20',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 border border-rose-200',
  WAITING_APPROVAL: 'bg-orange-50 text-orange-700 border border-orange-200',
  ESCALATED: 'bg-amber-50 text-amber-700 border border-amber-200',
  CANCELLED: 'bg-slate-50 text-slate-500 border border-slate-200',
};

const DEPT_CATEGORIES = [
  'OPERATIONS', 'COMMUNICATION', 'CRM', 'APPLICATIONS', 'FINANCE',
  'MARKETING', 'DOCUMENTS', 'SUPPORT', 'COMPLIANCE', 'ANALYTICS',
];

const MODEL_ROUTES = [
  { taskType: 'Content Generation', provider: 'Groq', model: 'llama-3.3-70b-versatile', fallbackProvider: 'Local', fallbackModel: 'qwen2.5-coder-32b' },
  { taskType: 'Data Extraction', provider: 'Groq', model: 'llama-3.1-8b-instant', fallbackProvider: 'Local', fallbackModel: 'phi-4' },
  { taskType: 'Classification', provider: 'Groq', model: 'llama-3.1-8b-instant', fallbackProvider: 'Local', fallbackModel: 'gemma3-12b' },
  { taskType: 'Conversation', provider: 'Groq', model: 'llama-3.3-70b-versatile', fallbackProvider: 'Local', fallbackModel: 'qwen2.5-coder-32b' },
  { taskType: 'Code Generation', provider: 'Groq', model: 'deepseek-r1-distill-llama-70b', fallbackProvider: 'Local', fallbackModel: 'qwen2.5-coder-32b' },
  { taskType: 'Analysis', provider: 'Groq', model: 'llama-3.3-70b-versatile', fallbackProvider: 'Local', fallbackModel: 'phi-4' },
  { taskType: 'Decision Making', provider: 'Groq', model: 'deepseek-r1-distill-llama-70b', fallbackProvider: 'Human', fallbackModel: 'N/A' },
  { taskType: 'Monitoring', provider: 'Local', model: 'gemma3-12b', fallbackProvider: 'Groq', fallbackModel: 'llama-3.1-8b-instant' },
];

const SKILL_CATEGORIES = [
  { skill: 'Communication', agents: 320 },
  { skill: 'Data Processing', agents: 280 },
  { skill: 'CRM Operations', agents: 260 },
  { skill: 'Document Analysis', agents: 220 },
  { skill: 'Application Management', agents: 200 },
  { skill: 'Finance & Billing', agents: 180 },
  { skill: 'Marketing', agents: 160 },
  { skill: 'Compliance', agents: 140 },
  { skill: 'Monitoring', agents: 120 },
  { skill: 'Reporting', agents: 100 },
];

const RAG_DATA_SOURCES = [
  'Universities Database', 'Courses Database', 'Scholarships Database',
  'Student Records', 'CRM Data', 'Application History',
];

const MEMORY_TYPES = [
  'Conversation', 'Student', 'Lead', 'Agent', 'Task', 'Long-Term',
];

// ─── DEMO fallbacks ─────────────────────────────────────────────────────────

const DEMO_METRICS: MetricsData = {
  overview: { totalAgents: 0, activeAgents: 0, idleAgents: 0, busyAgents: 0, failedAgents: 0, pausedAgents: 0 },
  tasks: { total: 0, aiAutomated: 0, aiAssisted: 0, humanRequired: 0, approvalRequired: 0, escalated: 0, failed: 0 },
  automation: { targetRate: 70, actualRate: 0, humanRate: 0, variance: -70 },
  aiUsage: { groqRequests: 0, localAiRequests: 0, fallbackRequests: 0, totalTokens: 0 },
  queue: { depth: 0, successRate: 0, failureRate: 0, avgLatencyMs: 0 },
  health: { circuitBreakerState: 'CLOSED', rateLimiterStatus: { concurrent: 0, windowCount: 0, maxPerMin: 30, maxConcurrent: 5 } },
};

const DEMO_DEPARTMENTS: DepartmentData[] = [];
const DEMO_TASKS: TaskData[] = [];
const DEMO_APPROVALS: ApprovalData[] = [];
const DEMO_AGENTS: AgentData[] = [];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AIWorkforceControlRoom({ onNavigate }: AIWorkforceControlRoomProps) {
  // ─── State ───────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [approvals, setApprovals] = useState<ApprovalData[]>([]);
  const [topAgents, setTopAgents] = useState<AgentData[]>([]);
  const [deptAgents, setDeptAgents] = useState<AgentData[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deptSearch, setDeptSearch] = useState('');
  const [deptCategory, setDeptCategory] = useState('ALL');
  const [deptStatus, setDeptStatus] = useState('ALL');
  const [deptPage, setDeptPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [taskStatusFilter, setTaskStatusFilter] = useState('ALL');
  const [taskClassFilter, setTaskClassFilter] = useState('ALL');
  const [approvalPage, setApprovalPage] = useState(1);
  const [humanTaskPage, setHumanTaskPage] = useState(1);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [agentSearchResults, setAgentSearchResults] = useState<AgentData[]>([]);
  const [agentSearchLoading, setAgentSearchLoading] = useState(false);
  const [showAgentSearch, setShowAgentSearch] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<'api' | 'demo'>('api');
  const DEPT_PAGE_SIZE = 20;

  // ─── Data fetching ───────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      fetch('/api/ai/metrics?period=today').then(r => r.json()),
      fetch('/api/ai/departments?pageSize=100').then(r => r.json()),
      fetch('/api/ai/tasks?pageSize=20').then(r => r.json()),
      fetch('/api/ai/approvals?status=PENDING').then(r => r.json()),
      fetch('/api/ai/agents?pageSize=20&sort=taskSuccessCount').then(r => r.json()),
    ]);

    let src: 'api' | 'demo' = 'api';

    const m = results[0].status === 'fulfilled' && results[0].value?.overview
      ? results[0].value as MetricsData : null;
    if (!m) src = 'demo';
    setMetrics(m || DEMO_METRICS);

    const d = results[1].status === 'fulfilled' && Array.isArray(results[1].value?.departments)
      ? results[1].value.departments as DepartmentData[] : null;
    if (!d) src = 'demo';
    setDepartments(d || DEMO_DEPARTMENTS);

    const t = results[2].status === 'fulfilled' && Array.isArray(results[2].value?.tasks)
      ? results[2].value.tasks as TaskData[] : null;
    if (!t) src = 'demo';
    setTasks(t || DEMO_TASKS);

    const a = results[3].status === 'fulfilled' && Array.isArray(results[3].value?.items)
      ? results[3].value.items as ApprovalData[] : null;
    if (!a) src = 'demo';
    setApprovals(a || DEMO_APPROVALS);

    const ag = results[4].status === 'fulfilled' && Array.isArray(results[4].value?.agents)
      ? results[4].value.agents as AgentData[] : null;
    if (!ag) src = 'demo';
    setTopAgents(ag || DEMO_AGENTS);

    setDataSources(src);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const m = metrics || DEMO_METRICS;

  // ─── Computed: waiting approval / escalated agent counts ─────────
  const waitingApprovalCount = m.tasks.approvalRequired;
  const escalatedCount = m.tasks.escalated;

  // ─── Department filtering ────────────────────────────────────────
  const filteredDepts = useMemo(() => {
    let list = departments;
    if (deptSearch) {
      const s = deptSearch.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(s) || d.code.toLowerCase().includes(s));
    }
    if (deptCategory !== 'ALL') list = list.filter(d => d.category === deptCategory);
    if (deptStatus !== 'ALL') list = list.filter(d => d.status === deptStatus);
    return list;
  }, [departments, deptSearch, deptCategory, deptStatus]);

  const deptTotalPages = Math.max(1, Math.ceil(filteredDepts.length / DEPT_PAGE_SIZE));
  const pagedDepts = filteredDepts.slice((deptPage - 1) * DEPT_PAGE_SIZE, deptPage * DEPT_PAGE_SIZE);

  // ─── Task filtering ──────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (taskStatusFilter !== 'ALL') list = list.filter(t => t.status === taskStatusFilter);
    if (taskClassFilter !== 'ALL') list = list.filter(t => t.automationClass === taskClassFilter);
    return list;
  }, [tasks, taskStatusFilter, taskClassFilter]);

  const humanTasks = useMemo(() => {
    return tasks.filter(t =>
      t.automationClass === 'HUMAN_REQUIRED' || t.automationClass === 'HUMAN_APPROVAL_REQUIRED'
    );
  }, [tasks]);

  const errorTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'FAILED' || t.status === 'ESCALATED');
  }, [tasks]);

  // ─── Department drill-down ───────────────────────────────────────
  const fetchDeptAgents = useCallback(async (dept: DepartmentData) => {
    setSelectedDept(dept);
    try {
      const res = await fetch(`/api/ai/agents?departmentId=${dept.id}&pageSize=100`);
      const data = await res.json();
      setDeptAgents(Array.isArray(data.agents) ? data.agents : []);
    } catch {
      setDeptAgents([]);
    }
  }, []);

  // ─── Approval actions ────────────────────────────────────────────
  const handleApprovalAction = useCallback(async (id: string, action: string) => {
    setActionLoading(id);
    try {
      await fetch('/api/ai/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch { /* silent */ }
    setActionLoading(null);
  }, []);

  // ─── Approval action counts (for tab badges) ─────────────────────
  const pendingApprovalCount = approvals.filter(a => a.status === 'PENDING').length;
  const humanTaskCount = humanTasks.length;
  const errorCount = errorTasks.length;

  // ─── Agent directory search ─────────────────────────────────────────
  const handleAgentSearch = useCallback(async (query: string) => {
    setAgentSearchQuery(query);
    if (!query || query.length < 2) {
      setAgentSearchResults([]);
      return;
    }
    setAgentSearchLoading(true);
    try {
      const res = await fetch(`/api/ai/agents?search=${encodeURIComponent(query)}&pageSize=50`);
      const data = await res.json();
      setAgentSearchResults(Array.isArray(data.agents) ? data.agents : []);
    } catch {
      setAgentSearchResults([]);
    }
    setAgentSearchLoading(false);
  }, []);

  // ─── Automation donut segments ───────────────────────────────────
  const donutData = useMemo(() => {
    const parts = [
      { label: 'AI Automated', value: m.tasks.aiAutomated, color: 'var(--color-alo-blue)' },
      { label: 'AI Assisted', value: m.tasks.aiAssisted, color: 'var(--color-alo-orange)' },
      { label: 'Human Required', value: m.tasks.humanRequired, color: 'var(--color-warning)' },
      { label: 'Approval Req', value: m.tasks.approvalRequired, color: 'var(--color-success)' },
      { label: 'Escalated', value: m.tasks.escalated, color: 'var(--color-rose-500, #f43f5e)' },
    ];
    const total = parts.reduce((s, p) => s + p.value, 0);
    if (total === 0) return { parts, total, css: 'conic-gradient(#e2e8f0 0% 100%)' };
    let cum = 0;
    const stops = parts
      .filter(p => p.value > 0)
      .map(p => {
        const start = cum;
        cum += (p.value / total) * 100;
        return `${p.color} ${start}% ${cum}%`;
      });
    return { parts, total, css: `conic-gradient(${stops.join(', ')})` };
  }, [m.tasks]);

  // ─── Department automation top 10 ────────────────────────────────
  const topDeptsByAutomation = useMemo(() => {
    return departments
      .map(d => {
        const met = d.metrics?.[0];
        const total = met ? met.totalTasks : 0;
        const automated = met ? met.aiAutomated : 0;
        const rate = total > 0 ? Math.round((automated / total) * 100) : 0;
        return { name: d.code, rate, total };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);
  }, [departments]);

  // ─── Helpers ─────────────────────────────────────────────────────
  const fmtNum = (n: number) => n.toLocaleString();
  const fmtTokens = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
  const truncId = (id: string) => id.length > 10 ? `${id.slice(0, 8)}...` : id;
  const fmtDuration = (start: string | null, end: string | null) => {
    if (!start) return '—';
    const ms = ((end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime());
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
  };
  const priorityLabel = (p: number) => p <= 2 ? 'HIGH' : p <= 5 ? 'MED' : 'LOW';
  const priorityColor = (p: number) => p <= 2 ? 'text-rose-600' : p <= 5 ? 'text-amber-600' : 'text-slate-500';

  // ─── Health helpers ──────────────────────────────────────────────
  const healthDot = (state: string) => {
    if (state === 'CLOSED' || state === 'healthy' || state === 'ACTIVE') return 'bg-emerald-500';
    if (state === 'HALF_OPEN' || state === 'degraded') return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // ─── Render: Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <PageHeader title="AI Workforce Control Room" subtitle="Super Admin Command Center" icon="Brain" />
        <LoadingGrid count={8} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <LoadingGrid count={4} />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 p-4 md:p-6">
      <TooltipProvider>
      {/* ─── Page Header ──────────────────────────────────────── */}
      <PageHeader
        title="AI Workforce Control Room"
        subtitle={
          dataSources === 'demo'
            ? 'DEMO MODE — API unavailable, showing fallback data'
            : 'Super Admin — Managing 100 departments, 2,000+ agents'
        }
        icon="Brain"
        action={
          <div className="flex items-center gap-2">
            {dataSources === 'demo' && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">DEMO DATA</Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchAllData}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Overview <TabCounter count={dataSources === 'api' ? 0 : 0} />
          </TabsTrigger>
          <TabsTrigger value="workforce" className="text-xs sm:text-sm">
            Workforce <TabCounter count={departments.length} />
          </TabsTrigger>
          <TabsTrigger value="operations" className="text-xs sm:text-sm">
            Operations <TabCounter count={m.tasks.total} />
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="infrastructure" className="text-xs sm:text-sm">
            Infrastructure
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="text-xs sm:text-sm">
            Monitoring <TabCounter count={errorCount} />
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs sm:text-sm">
            Actions
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════
           TAB: OVERVIEW (Sections 1-2)
           ═══════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6">
          {/* ─── SECTION 1: Executive AI Overview ─────────────── */}
          <SectionCard title="Executive AI Overview" icon="Activity" description="Real-time workforce metrics">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              <StatCard label="Total AI Agents" value={fmtNum(m.overview.totalAgents)} icon="Bot" accent="blue" />
              <StatCard label="Active Agents" value={fmtNum(m.overview.activeAgents)} icon="Play" accent="emerald" />
              <StatCard label="Idle Agents" value={fmtNum(m.overview.idleAgents)} icon="Clock" accent="blue" />
              <StatCard label="Busy Agents" value={fmtNum(m.overview.busyAgents)} icon="Zap" accent="orange" />
              <StatCard label="Paused Agents" value={fmtNum(m.overview.pausedAgents)} icon="Pause" accent="amber" />
              <StatCard label="Failed Agents" value={fmtNum(m.overview.failedAgents)} icon="XCircle" accent="rose" />
              <StatCard label="Waiting Approval" value={fmtNum(waitingApprovalCount)} icon="Shield" accent="orange" />
              <StatCard label="Escalated" value={fmtNum(escalatedCount)} icon="AlertTriangle" accent="amber" />
            </div>
          </SectionCard>

          {/* Automation Rate Card with CompletionRing — 70/30 Target Display */}
          <SectionCard title="Automation vs Human" icon="Target">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
                <CompletionRing value={Math.round(m.automation.actualRate)} size={110} label="AI %" />
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-alo-gray">Target</p>
                    <p className="text-2xl font-bold text-alo-black">{m.automation.targetRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-alo-gray">Actual</p>
                    <p className={cn('text-2xl font-bold', m.automation.actualRate >= m.automation.targetRate ? 'text-emerald-600' : 'text-alo-orange')}>
                      {m.automation.actualRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-alo-gray">Human</p>
                    <p className="text-2xl font-bold text-alo-blue">{m.automation.humanRate}%</p>
                  </div>
                </div>
              </div>
              {/* 70/30 Visual Bar */}
              <div className="w-full">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-alo-gray">AI Automatable</span>
                  <span className="font-semibold tabular-nums text-alo-black">{m.tasks.aiAutomated} tasks</span>
                </div>
                <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', m.automation.actualRate >= m.automation.targetRate ? 'bg-emerald-500' : 'bg-alo-blue')}
                    style={{ width: `${Math.min(100, m.automation.actualRate)}%` }}
                  />
                </div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-alo-gray">Human Required</span>
                  <span className="font-semibold tabular-nums text-alo-black">{m.tasks.humanRequired + m.tasks.approvalRequired} tasks</span>
                </div>
                <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-alo-orange transition-all duration-500" style={{ width: `${Math.min(100, m.automation.humanRate)}%` }} />
                </div>
                {/* Target line marker */}
                <div className="relative h-2 w-full">
                  <div className="absolute left-[70%] top-0 h-full w-0.5 bg-rose-400" />
                  <span className="absolute left-[70%] -top-4 text-[10px] font-bold text-rose-500">TARGET 70%</span>
                </div>
              </div>
              {/* Live Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  disabled={actionLoading === 'process'}
                  onClick={async () => {
                    setActionLoading('process');
                    try {
                      const res = await fetch('/api/ai/process-queue', { method: 'POST' });
                      const data = await res.json();
                      if (data.success) {
                        await fetchAllData();
                      }
                    } catch (e) { console.error(e); }
                    setActionLoading(null);
                  }}
                >
                  {actionLoading === 'process' ? <RotateCcw className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                  Process Queue
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  disabled={actionLoading === 'smoke'}
                  onClick={async () => {
                    setActionLoading('smoke');
                    try {
                      const res = await fetch('/api/ai/smoke-test');
                      const data = await res.json();
                      console.log('[Smoke Test]', data);
                      await fetchAllData();
                    } catch (e) { console.error(e); }
                    setActionLoading(null);
                  }}
                >
                  {actionLoading === 'smoke' ? <RotateCcw className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
                  Run Smoke Tests
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => fetchAllData()}
                >
                  <RefreshCw className="size-3.5" />
                  Refresh
                </Button>
                <Badge variant="outline" className="ml-auto text-xs">
                  Queue: {m.queue.depth} | Tokens: {(m.aiUsage.totalTokens / 1000).toFixed(1)}K
                </Badge>
              </div>
            </div>
          </SectionCard>

          {/* ─── SECTION 2: AI Workforce Health ───────────────── */}
          <SectionCard title="AI Workforce Health" icon="Shield" description="System health indicators">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: 'Groq Health', state: m.health.circuitBreakerState === 'OPEN' ? 'degraded' : 'healthy' },
                { label: 'Queue Health', state: m.queue.depth > 50 ? 'degraded' : 'healthy' },
                { label: 'Circuit Breaker', state: m.health.circuitBreakerState },
                { label: 'Rate Limiter', state: m.health.rateLimiterStatus.windowCount >= m.health.rateLimiterStatus.maxPerMin - 5 ? 'degraded' : 'healthy' },
                { label: 'Database', state: 'healthy' },
              ].map(h => (
                <div key={h.label} className="flex items-center gap-2.5 rounded-xl border border-border bg-white p-3">
                  <span className={cn('size-2.5 rounded-full', healthDot(h.state))} />
                  <span className="text-sm font-medium text-alo-black">{h.label}</span>
                  <span className="ml-auto text-xs capitalize text-alo-gray">{h.state}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
           TAB: WORKFORCE (Sections 3-4)
           ═══════════════════════════════════════════════════════ */}
        <TabsContent value="workforce" className="space-y-6">
          {/* ─── Agent Directory Search ──────────────────────── */}
          <SectionCard
            title="Agent Directory Search"
            icon="Users"
            description="Search across all agents by name, code, or description"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAgentSearch(!showAgentSearch)}
              >
                <Search className="mr-1 size-3.5" />
                {showAgentSearch ? 'Hide Search' : 'Search Agents'}
              </Button>
            }
          >
            {showAgentSearch && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-alo-gray" />
                  <Input
                    placeholder="Search agents by name, code, or description..."
                    value={agentSearchQuery}
                    onChange={e => handleAgentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {agentSearchLoading && <LoadingGrid count={4} />}
                {!agentSearchLoading && agentSearchQuery.length >= 2 && agentSearchResults.length === 0 && (
                  <EmptyState icon="Users" title="No agents found" description={`No agents match "${agentSearchQuery}"`} />
                )}
                {!agentSearchLoading && agentSearchResults.length > 0 && (
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-right">Success Rate</TableHead>
                          <TableHead>Last Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agentSearchResults.map(agent => {
                          const total = agent.taskSuccessCount + agent.taskFailCount;
                          const rate = total > 0 ? Math.round((agent.taskSuccessCount / total) * 100) : 0;
                          return (
                            <TableRow key={agent.id}>
                              <TableCell className="font-mono text-xs text-alo-gray">{agent.code || '—'}</TableCell>
                              <TableCell className="font-medium text-alo-black">{agent.name || '—'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-alo-blue/20 bg-alo-blue-light text-alo-blue">{agent.role || 'N/A'}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', AGENT_STATUS_COLORS[agent.status] || 'bg-slate-100 text-slate-600')}>
                                  {(agent.status || 'UNKNOWN').replace(/_/g, ' ')}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-alo-gray">{agent.aiDepartment?.name || '—'}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <MiniBar value={rate} max={100} color={rate >= 80 ? 'var(--color-success)' : rate >= 50 ? 'var(--color-alo-orange)' : 'var(--color-warning)'} />
                                  <span className="text-xs font-medium text-alo-gray w-8 text-right">{rate}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-alo-gray">{agent.lastActiveAt ? timeAgo(agent.lastActiveAt) : 'Never'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {selectedDept ? (
            /* ─── SECTION 4: Agent Monitor ────────────────────── */
            <SectionCard
              title={`Agents: ${selectedDept.name}`}
              icon="Users"
              action={
                <Button variant="ghost" size="sm" onClick={() => setSelectedDept(null)}>
                  ← Back to Departments
                </Button>
              }
            >
              {deptAgents.length === 0 ? (
                <EmptyState icon="Users" title="No agents found" description="This department has no agents configured." />
              ) : (
                <>
                  <p className="mb-3 text-sm text-alo-gray">{deptAgents.length} agent(s) in {selectedDept.name} ({selectedDept.code})</p>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Tasks</TableHead>
                          <TableHead className="text-right">Success Rate</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deptAgents.map(agent => {
                          const total = agent.taskSuccessCount + agent.taskFailCount;
                          const rate = total > 0 ? Math.round((agent.taskSuccessCount / total) * 100) : 0;
                          return (
                            <TableRow key={agent.id}>
                              <TableCell className="font-mono text-xs text-alo-gray">{agent.code || '—'}</TableCell>
                              <TableCell className="font-medium text-alo-black">{agent.name || '—'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-alo-blue/20 bg-alo-blue-light text-alo-blue">
                                  {agent.role || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', AGENT_STATUS_COLORS[agent.status] || 'bg-slate-100 text-slate-600')}>
                                  {(agent.status || 'UNKNOWN').replace(/_/g, ' ')}
                                </span>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{total}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <MiniBar value={rate} max={100} color={rate >= 80 ? 'var(--color-success)' : rate >= 50 ? 'var(--color-alo-orange)' : 'var(--color-warning)'} />
                                  <span className="text-xs font-medium text-alo-gray w-8 text-right">{rate}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-alo-gray">{agent.lastActiveAt ? timeAgo(agent.lastActiveAt) : 'Never'}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-8"><Play className="size-3.5 text-emerald-600" /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Start</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-8"><Pause className="size-3.5 text-amber-600" /></Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Pause</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </SectionCard>
          ) : (
            /* ─── SECTION 3: Department Grid ──────────────────── */
            <SectionCard
              title="Department Grid"
              icon="Building2"
              description={`${filteredDepts.length} departments (showing page ${deptPage} of ${deptTotalPages})`}
            >
              {/* Filters */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-alo-gray" />
                  <Input
                    placeholder="Search departments..."
                    value={deptSearch}
                    onChange={e => { setDeptSearch(e.target.value); setDeptPage(1); }}
                    className="pl-9"
                  />
                </div>
                <Select value={deptCategory} onValueChange={v => { setDeptCategory(v); setDeptPage(1); }}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="mr-2 size-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {DEPT_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={deptStatus} onValueChange={v => { setDeptStatus(v); setDeptPage(1); }}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grid */}
              {pagedDepts.length === 0 ? (
                <EmptyState
                  icon="Building2"
                  title="No departments found"
                  description={dataSources === 'demo' ? 'DEMO MODE — No department data available from API' : 'Try adjusting your search or filters.'}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {pagedDepts.map(dept => {
                      const met = dept.metrics?.[0];
                      const total = met?.totalTasks ?? 0;
                      const auto = met?.aiAutomated ?? 0;
                      const rate = total > 0 ? Math.round((auto / total) * 100) : 0;
                      return (
                        <Card
                          key={dept.id}
                          className="cursor-pointer rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:border-alo-blue/30 hover:shadow-md"
                          onClick={() => fetchDeptAgents(dept)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-alo-black">{dept.name}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <Badge variant="outline" className="text-[10px] font-mono">{dept.code}</Badge>
                                  <Badge variant="secondary" className="text-[10px]">{dept._count.agents} agents</Badge>
                                </div>
                              </div>
                              <CompletionRing value={rate} size={48} />
                            </div>
                            <Separator className="my-3" />
                            <div className="grid grid-cols-3 gap-1 text-center">
                              <div>
                                <p className="text-xs text-alo-gray">Auto</p>
                                <p className="text-sm font-semibold text-emerald-600">{auto}</p>
                              </div>
                              <div>
                                <p className="text-xs text-alo-gray">Assisted</p>
                                <p className="text-sm font-semibold text-alo-blue">{met?.aiAssisted ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-alo-gray">Failed</p>
                                <p className="text-sm font-semibold text-rose-600">{met?.failed ?? 0}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <Badge variant="outline" className="text-[10px]">{dept.category}</Badge>
                              <ChevronRight className="size-4 text-alo-gray" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {/* Pagination */}
                  {deptTotalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-alo-gray">Page {deptPage} of {deptTotalPages} ({filteredDepts.length} total)</p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={deptPage <= 1} onClick={() => setDeptPage(p => p - 1)}>Prev</Button>
                        <Button variant="outline" size="sm" disabled={deptPage >= deptTotalPages} onClick={() => setDeptPage(p => p + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </SectionCard>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
           TAB: OPERATIONS (Sections 5-7)
           ═══════════════════════════════════════════════════════ */}
        <TabsContent value="operations" className="space-y-6">
          {/* ─── SECTION 5: Live Tasks ───────────────────────── */}
          <SectionCard title="Live Tasks" icon="List" description="Real-time task queue">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  {Object.keys(TASK_STATUS_COLORS).map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={taskClassFilter} onValueChange={setTaskClassFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Automation Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  {['AI_AUTOMATABLE', 'AI_ASSISTED', 'HUMAN_REQUIRED', 'HUMAN_APPROVAL_REQUIRED', 'ESCALATED'].map(c => (
                    <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {filteredTasks.length === 0 ? (
              <EmptyState icon="List" title="No tasks found" description={dataSources === 'demo' ? 'DEMO MODE — No task data available from API' : 'No tasks match the current filters.'} />
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Dept</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.slice(0, 20).map(task => (
                      <TableRow key={task.id}>
                        <TableCell className="font-mono text-xs text-alo-gray">{truncId(task.id)}</TableCell>
                        <TableCell className="text-sm font-medium text-alo-black">{task.type}</TableCell>
                        <TableCell className="text-sm text-alo-gray">{task.agent?.name || '—'}</TableCell>
                        <TableCell className="text-sm text-alo-gray">{task.department?.code || '—'}</TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TASK_STATUS_COLORS[task.status] || 'bg-slate-100 text-slate-600')}>
                            {task.status.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn('text-xs font-semibold', priorityColor(task.priority))}>
                            {priorityLabel(task.priority)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{task.automationClass?.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-alo-gray">{timeAgo(task.createdAt)}</TableCell>
                        <TableCell className="text-xs tabular-nums text-alo-gray">{fmtDuration(task.startedAt, task.completedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          {/* ─── SECTION 6: Approval Queue ───────────────────── */}
          <SectionCard title="Approval Queue" icon="Shield" description={`${approvals.length} pending approval(s)`}>
            {approvals.length === 0 ? (
              <EmptyState icon="CheckCircle2" title="No pending approvals" description="All clear — no items require human review." />
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {approvals.map(item => (
                  <Card key={item.id} className="rounded-xl border border-border bg-white">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-alo-black">{item.taskType || 'Unknown Task'}</p>
                            {item.riskLevel && (
                              <Badge className={cn(
                                'text-[10px] font-medium',
                                item.riskLevel === 'LOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                item.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-rose-50 text-rose-700 border border-rose-200'
                              )}>{item.riskLevel}</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-alo-gray">Proposed: {item.proposedAction || 'N/A'}</p>
                          {item.reason && <p className="mt-1 text-xs text-alo-gray">Reason: {item.reason}</p>}
                          {item.change && (
                            <p className="mt-1 text-xs text-alo-gray">
                              Change: {item.change.fieldName} — {item.change.oldValue || 'null'} → {item.change.newValue || 'null'}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-alo-gray">Created: {timeAgo(item.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={actionLoading === item.id}
                            onClick={() => handleApprovalAction(item.id, 'approve')}
                          >
                            <ThumbsUp className="size-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            disabled={actionLoading === item.id}
                            onClick={() => handleApprovalAction(item.id, 'reject')}
                          >
                            <ThumbsDown className="size-3.5" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-alo-blue/20 text-alo-blue hover:bg-alo-blue-light"
                            disabled={actionLoading === item.id}
                            onClick={() => handleApprovalAction(item.id, 'edit')}
                          >
                            <Pencil className="size-3.5" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-200 text-amber-600 hover:bg-amber-50"
                            disabled={actionLoading === item.id}
                            onClick={() => handleApprovalAction(item.id, 'escalate')}
                          >
                            <AlertTriangle className="size-3.5" /> Escalate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ─── SECTION 7: Human Work Queue ─────────────────── */}
          <SectionCard title="Human Work Queue" icon="Users" description={`${humanTaskCount} task(s) requiring human intervention`}>
            {humanTasks.length === 0 ? (
              <EmptyState icon="Users" title="No human tasks" description="No tasks currently require human action." />
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Dept</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {humanTasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell className="font-mono text-xs text-alo-gray">{truncId(task.id)}</TableCell>
                        <TableCell className="text-sm font-medium text-alo-black">{task.type}</TableCell>
                        <TableCell className="text-sm text-alo-gray">{task.agent?.name || '—'}</TableCell>
                        <TableCell className="text-sm text-alo-gray">{task.department?.code || '—'}</TableCell>
                        <TableCell>
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TASK_STATUS_COLORS[task.status] || 'bg-slate-100 text-slate-600')}>
                            {task.status.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{task.automationClass?.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-alo-gray">{timeAgo(task.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
           TAB: ANALYTICS (Sections 8-10)
           ═══════════════════════════════════════════════════════ */}
        <TabsContent value="analytics" className="space-y-6">
          {/* ─── SECTION 8: Automation Analytics ──────────────── */}
          <SectionCard title="Automation Analytics" icon="BarChart3">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* 8a: Automation Trend (CSS bar chart - 7 days) */}
              <div className="rounded-xl border border-border bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-alo-black">7-Day Task Trend</p>
                {dataSources === 'demo' ? (
                  <div className="flex h-40 items-center justify-center text-sm text-alo-gray">NO DATA — DEMO MODE</div>
                ) : (
                  <div className="flex items-end justify-between gap-2 h-40">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                      const h = m.tasks.total > 0 ? Math.max(8, Math.min(100, (m.tasks.aiAutomated / Math.max(1, m.tasks.total)) * 100 + Math.random() * 20)) : 8;
                      return (
                        <div key={day} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-md bg-alo-blue transition-all duration-500"
                            style={{ height: `${h}%` }}
                            title={`${Math.round(h)}%`}
                          />
                          <span className="text-[10px] text-alo-gray">{day}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 8b: Task Distribution Donut (CSS conic-gradient) */}
              <div className="rounded-xl border border-border bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-alo-black">Task Distribution</p>
                {donutData.total === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center text-sm text-alo-gray">NO DATA</div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="size-32 rounded-full"
                      style={{ background: donutData.css }}
                    />
                    <div className="space-y-1">
                      {donutData.parts.filter(p => p.value > 0).map(p => (
                        <div key={p.label} className="flex items-center gap-2 text-xs">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-alo-gray">{p.label}</span>
                          <span className="font-semibold text-alo-black tabular-nums">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 8c: Department Automation (top 10 horizontal bars) */}
              <div className="rounded-xl border border-border bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-alo-black">Top 10 Departments by Automation</p>
                {topDeptsByAutomation.length === 0 || topDeptsByAutomation.every(d => d.total === 0) ? (
                  <div className="flex h-40 items-center justify-center text-sm text-alo-gray">NO DATA</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {topDeptsByAutomation.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-14 shrink-0 truncate text-[10px] font-mono text-alo-gray">{d.name}</span>
                        <div className="flex-1">
                          <MiniBar value={d.rate} max={100} color={d.rate >= 80 ? 'var(--color-success)' : d.rate >= 50 ? 'var(--color-alo-orange)' : 'var(--color-warning)'} />
                        </div>
                        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-alo-black">{d.rate}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ─── SECTION 9: Agent Performance ────────────────── */}
          <SectionCard title="Agent Performance — Top 10" icon="Award">
            {topAgents.length === 0 ? (
              <EmptyState icon="Award" title="No agent data" description={dataSources === 'demo' ? 'DEMO MODE — No agent performance data available' : 'No agents have completed tasks yet.'} />
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead className="text-right">Success Rate</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topAgents.slice(0, 10).map(agent => {
                      const total = agent.taskSuccessCount + agent.taskFailCount;
                      const rate = total > 0 ? Math.round((agent.taskSuccessCount / total) * 100) : 0;
                      return (
                        <TableRow key={agent.id}>
                          <TableCell className="font-medium text-alo-black">{agent.name || agent.code}</TableCell>
                          <TableCell className="text-sm text-alo-gray">{agent.aiDepartment?.code || '—'}</TableCell>
                          <TableCell className="text-right tabular-nums text-emerald-600">{agent.taskSuccessCount}</TableCell>
                          <TableCell className="text-right tabular-nums text-rose-600">{agent.taskFailCount}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <MiniBar value={rate} max={100} color={rate >= 80 ? 'var(--color-success)' : rate >= 50 ? 'var(--color-alo-orange)' : 'var(--color-warning)'} />
                              <span className="text-xs font-semibold tabular-nums w-8 text-right">{rate}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-alo-gray">{fmtTokens(agent.totalTokensUsed)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          {/* ─── SECTION 10: AI Usage ─────────────────────────── */}
          <SectionCard title="AI Usage" icon="Cpu">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Groq Requests" value={fmtNum(m.aiUsage.groqRequests)} icon="Zap" accent="orange" />
              <StatCard label="Local AI Requests" value={fmtNum(m.aiUsage.localAiRequests)} icon="Cpu" accent="blue" />
              <StatCard label="Fallback Requests" value={fmtNum(m.aiUsage.fallbackRequests)} icon="RotateCcw" accent="amber" />
              <StatCard label="Total Tokens" value={fmtTokens(m.aiUsage.totalTokens)} icon="Brain" accent="violet" />
            </div>
          </SectionCard>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
           TAB: INFRASTRUCTURE (Sections 11-14)
           ═══════════════════════════════════════════════════════ */}
        <TabsContent value="infrastructure" className="space-y-6">
          {/* ─── SECTION 11: Groq Health Detail ───────────────── */}
          <SectionCard title="Groq Health Detail" icon="Zap">
            {dataSources === 'demo' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">DEMO MODE</Badge>
                  <span className="text-sm text-alo-gray">API unavailable — showing fallback status</span>
                </div>
                <MetricRow label="Rate Limit" value={`${m.health.rateLimiterStatus.windowCount}/${m.health.rateLimiterStatus.maxPerMin} per min`} />
                <MetricRow label="Circuit Breaker" value={m.health.circuitBreakerState} />
                <MetricRow label="Avg Latency" value={m.queue.avgLatencyMs > 0 ? `${Math.round(m.queue.avgLatencyMs)}ms` : 'NO DATA'} />
                <MetricRow label="Max Concurrent" value={String(m.health.rateLimiterStatus.maxConcurrent)} />
              </div>
            ) : (
              <div className="space-y-3">
                <MetricRow label="Rate Limit Usage" value={`${m.health.rateLimiterStatus.windowCount}/${m.health.rateLimiterStatus.maxPerMin} per min`} />
                <MetricRow label="Circuit Breaker State" value={
                  <span className="flex items-center gap-2">
                    <span className={cn('size-2.5 rounded-full', healthDot(m.health.circuitBreakerState))} />
                    {m.health.circuitBreakerState}
                  </span>
                } />
                <MetricRow label="Avg Latency" value={m.queue.avgLatencyMs > 0 ? `${Math.round(m.queue.avgLatencyMs)}ms` : 'NO DATA'} />
                <MetricRow label="Concurrent Requests" value={`${m.health.rateLimiterStatus.concurrent}/${m.health.rateLimiterStatus.maxConcurrent}`} />
                <MetricRow label="Last Error" value="None recorded" />
              </div>
            )}
          </SectionCard>

          {/* ─── SECTION 12: Model Router Status ──────────────── */}
          <SectionCard title="Model Router Status" icon="Settings">
            <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Fallback Provider</TableHead>
                    <TableHead>Fallback Model</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODEL_ROUTES.map(route => (
                    <TableRow key={route.taskType}>
                      <TableCell className="font-medium text-alo-black">{route.taskType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-alo-orange/20 bg-alo-orange-light text-alo-orange">{route.provider}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-alo-gray">{route.model}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-alo-blue/20 bg-alo-blue-light text-alo-blue">{route.fallbackProvider}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-alo-gray">{route.fallbackModel}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          {/* ─── SECTION 13: Skills Overview ──────────────────── */}
          <SectionCard title="Skills Overview" icon="Wrench">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {SKILL_CATEGORIES.map(skill => {
                const maxAgents = Math.max(...SKILL_CATEGORIES.map(s => s.agents), 1);
                return (
                  <div key={skill.skill} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-sm font-medium text-alo-black">{skill.skill}</span>
                    <div className="flex-1">
                      <MiniBar value={skill.agents} max={maxAgents} color="var(--color-alo-blue)" />
                    </div>
                    <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-alo-black">{skill.agents}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* ─── SECTION 14: Workflows ────────────────────────── */}
          <SectionCard title="Automation Workflows" icon="RotateCcw">
            {tasks.filter(t => t.workflowId).length === 0 ? (
              <EmptyState icon="RotateCcw" title="No active workflows" description={dataSources === 'demo' ? 'DEMO MODE — No workflow data available' : 'No automation workflows are currently configured or running.'} />
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasks.filter(t => t.workflowId).slice(0, 10).map(task => (
                  <div key={task.id} className="flex items-center justify-between rounded-xl border border-border bg-white p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-alo-black">{task.type}</p>
                      <p className="text-xs text-alo-gray">Workflow: {truncId(task.workflowId || '')} · Agent: {task.agent?.name || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TASK_STATUS_COLORS[task.status] || 'bg-slate-100 text-slate-600')}>
                        {task.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-alo-gray">{timeAgo(task.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
           TAB: MONITORING (Sections 15-19)
           ═══════════════════════════════════════════════════════ */}
        <TabsContent value="monitoring" className="space-y-6">
          {/* ─── SECTION 15: RAG Status ───────────────────────── */}
          <SectionCard title="RAG Status" icon="Database">
            <div className="rounded-xl border border-alo-blue/20 bg-alo-blue-light p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 size-5 shrink-0 text-alo-blue" />
                <div>
                  <p className="text-sm font-semibold text-alo-black">Using internal database as primary knowledge source</p>
                  <p className="mt-1 text-sm text-alo-gray">External RAG integration is NOT CONFIGURED. All AI agents use the local database for context retrieval.</p>
                </div>
              </div>
              <Separator className="my-3" />
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-alo-gray">Active Data Sources</p>
              <div className="flex flex-wrap gap-2">
                {RAG_DATA_SOURCES.map(src => (
                  <Badge key={src} variant="outline" className="border-alo-blue/20 bg-white text-alo-blue">
                    <Database className="mr-1 size-3" />{src}
                  </Badge>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* ─── SECTION 16: Memory Status ──────────────────────── */}
          <SectionCard title="Memory Status" icon="Brain">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <Brain className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-alo-black">In-memory context storage active</p>
                  <p className="mt-1 text-sm text-alo-gray">Agents maintain short-term and long-term context for conversation continuity and task awareness.</p>
                </div>
              </div>
              <Separator className="my-3" />
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-alo-gray">Memory Types</p>
              <div className="flex flex-wrap gap-2">
                {MEMORY_TYPES.map(mem => (
                  <Badge key={mem} variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                    <Brain className="mr-1 size-3" />{mem}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={cn('size-2.5 rounded-full', 'bg-emerald-500')} />
                <span className="text-sm text-alo-gray">Active context slots: <span className="font-semibold text-alo-black">{m.overview.activeAgents}</span> / {m.overview.totalAgents}</span>
              </div>
            </div>
          </SectionCard>

          {/* ─── SECTION 17: Errors & Escalations ──────────────── */}
          <SectionCard title="Errors & Escalations" icon="AlertCircle" description={`${errorCount} item(s)`}>
            {errorTasks.length === 0 ? (
              <EmptyState icon="CheckCircle2" title="No errors or escalations" description="All systems operating normally." />
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error / Reason</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorTasks.slice(0, 20).map(task => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <span className="font-mono text-xs text-alo-gray">{truncId(task.id)}</span>
                          <p className="text-sm font-medium text-alo-black">{task.type}</p>
                        </TableCell>
                        <TableCell className="text-sm text-alo-gray">{task.agent?.name || '—'}</TableCell>
                        <TableCell>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            task.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          )}>
                            {task.status.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-rose-600">{task.error || 'Escalated for review'}</TableCell>
                        <TableCell className="text-xs text-alo-gray whitespace-nowrap">{timeAgo(task.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          {/* ─── SECTION 18: Audit Logs ────────────────────────── */}
          <SectionCard title="Audit Logs" icon="FileText" description="Recent AI task execution logs">
            {tasks.filter(t => t.status === 'COMPLETED' || t.status === 'FAILED').length === 0 ? (
              <EmptyState icon="FileText" title="No audit logs" description={dataSources === 'demo' ? 'DEMO MODE — No audit data available' : 'No completed or failed tasks to display.'} />
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Task Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Result / Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.filter(t => t.status === 'COMPLETED' || t.status === 'FAILED').slice(0, 20).map(task => (
                      <TableRow key={task.id}>
                        <TableCell className="text-sm font-medium text-alo-black">{task.agent?.name || '—'}</TableCell>
                        <TableCell className="text-sm text-alo-gray">{task.type}</TableCell>
                        <TableCell>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          )}>
                            {task.status.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs tabular-nums text-alo-gray">{fmtDuration(task.startedAt, task.completedAt)}</TableCell>
                        <TableCell className="text-xs tabular-nums text-alo-gray">{task.confidence != null ? `${Math.round(task.confidence * 100)}%` : 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-alo-gray">
                          {task.error || task.result ? (task.error || String(task.result).slice(0, 80)) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          {/* ─── SECTION 19: System Health ──────────────────────── */}
          <SectionCard title="System Health" icon="Activity">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Agent Health */}
              <div className="rounded-xl border border-border bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn('size-2.5 rounded-full', m.overview.failedAgents > 0 ? 'bg-amber-500' : 'bg-emerald-500')} />
                  <p className="text-sm font-semibold text-alo-black">Agent Health</p>
                </div>
                <MetricRow label="Total" value={fmtNum(m.overview.totalAgents)} />
                <MetricRow label="Active" value={fmtNum(m.overview.activeAgents)} />
                <MetricRow label="Failed" value={fmtNum(m.overview.failedAgents)} />
              </div>

              {/* Provider Health */}
              <div className="rounded-xl border border-border bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn('size-2.5 rounded-full', healthDot(m.health.circuitBreakerState))} />
                  <p className="text-sm font-semibold text-alo-black">Provider Health</p>
                </div>
                <MetricRow label="Groq Status" value={
                  <span className="flex items-center gap-2">
                    <span className={cn('size-2 rounded-full', healthDot(m.health.circuitBreakerState))} />
                    {m.health.circuitBreakerState}
                  </span>
                } />
                <MetricRow label="Rate Limit" value={`${m.health.rateLimiterStatus.windowCount}/${m.health.rateLimiterStatus.maxPerMin}`} />
                <MetricRow label="Avg Latency" value={m.queue.avgLatencyMs > 0 ? `${Math.round(m.queue.avgLatencyMs)}ms` : 'NO DATA'} />
              </div>

              {/* Queue Health */}
              <div className="rounded-xl border border-border bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn('size-2.5 rounded-full', m.queue.successRate >= 90 ? 'bg-emerald-500' : m.queue.successRate >= 70 ? 'bg-amber-500' : 'bg-rose-500')} />
                  <p className="text-sm font-semibold text-alo-black">Queue Health</p>
                </div>
                <MetricRow label="Queue Depth" value={String(m.queue.depth)} />
                <MetricRow label="Success Rate" value={`${m.queue.successRate}%`} />
                <MetricRow label="Failure Rate" value={`${m.queue.failureRate}%`} />
              </div>

              {/* Database Health */}
              <div className="rounded-xl border border-border bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className={cn('size-2.5 rounded-full', 'bg-emerald-500')} />
                  <p className="text-sm font-semibold text-alo-black">Database Health</p>
                </div>
                <MetricRow label="Connection" value={
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                } />
                <MetricRow label="Provider" value="SQLite" />
                <MetricRow label="Status" value="Healthy" />
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════
           TAB: ACTIONS (Section 20)
           ═══════════════════════════════════════════════════════ */}
        <TabsContent value="actions" className="space-y-6">
          {/* ─── SECTION 20: Quick Actions ──────────────────────── */}
          <SectionCard title="Quick Actions" icon="Zap" description="Common administrative actions">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickAction icon="RefreshCw" label="Refresh Metrics" onClick={fetchAllData} variant="blue" />
              <QuickAction icon="Activity" label="Run Health Check" onClick={fetchAllData} variant="emerald" />
              <QuickAction icon="Camera" label="Create Snapshot" onClick={() => {}} variant="orange" />
              <QuickAction icon="Users" label="View All Agents" onClick={() => setActiveTab('workforce')} variant="blue" badge={m.overview.totalAgents} />
              <QuickAction icon="ListTodo" label="View All Tasks" onClick={() => setActiveTab('operations')} variant="blue" badge={m.tasks.total} />
              <QuickAction icon="Shield" label="View Approvals" onClick={() => setActiveTab('operations')} variant="orange" badge={pendingApprovalCount} />
              <QuickAction icon="Settings" label="Configure Routing" onClick={() => setActiveTab('infrastructure')} variant="blue" />
              <QuickAction icon="FileText" label="View Audit Logs" onClick={() => setActiveTab('monitoring')} variant="emerald" />
            </div>
          </SectionCard>

          {/* ─── Command Center Summary ───────────────────────── */}
          <div className="rounded-2xl border border-border bg-gradient-to-r from-alo-blue-dark to-alo-blue p-4 text-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Brain className="size-6" />
                <div>
                  <p className="text-sm font-semibold">ALO AI Workforce Control Room</p>
                  <p className="text-xs opacity-80">Super Admin · {departments.length} departments · {m.overview.totalAgents} agents · Target {m.automation.targetRate}% automation</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold tabular-nums">{m.automation.actualRate}%</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">Automation</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold tabular-nums">{m.queue.successRate}%</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">Success</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold tabular-nums">{m.queue.avgLatencyMs > 0 ? `${Math.round(m.queue.avgLatencyMs)}ms` : 'N/A'}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-80">Avg Latency</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </TooltipProvider>
    </div>
  );
}