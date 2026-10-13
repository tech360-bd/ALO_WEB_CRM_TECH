'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Zap,
  Activity,
  ListTodo,
  ClipboardCheck,
  Search,
  GraduationCap,
  MessageSquare,
  Megaphone,
  FileText,
  Video,
  Image,
  BarChart3,
  Mail,
  Globe,
  UserPlus,
  Brain,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  CompletionRing,
  QuickAction,
  EmptyState,
  LoadingGrid,
  StatusBadge,
  Icon,
  MiniBar,
} from '@/components/alo/shared';
import { timeAgo } from '@/lib/alo-types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AICommandCenterProps {
  onNavigate?: (view: string, slug?: string) => void;
}

interface Department {
  id: string;
  name: string;
  icon: string;
  activeAgents: number;
  tasksQueue: number;
  completionRate: number;
}

interface Agent {
  id: string;
  name: string;
  departmentId: string;
  currentTask: string | null;
  status: 'idle' | 'working' | 'error';
  performanceScore: number;
  lastActivity: string;
}

interface AITask {
  id: string;
  taskName: string;
  department: string;
  agent: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  output: string | null;
  createdAt: string;
}

interface ApprovalItem {
  id: string;
  type: 'content' | 'decision' | 'communication';
  department: string;
  agent: string;
  previewSnippet: string;
  createdAt: string;
}

interface Workflow {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error';
  progress: number;
  description: string;
}

interface DashboardStats {
  counts?: Record<string, number>;
  aiAgents?: { active?: number; tasksToday?: number; completedToday?: number; pendingApprovals?: number };
  recentAudit?: AuditLog[];
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

// ─── Constants ───────────────────────────────────────────────────────────────

const AGENT_STATUS_COLORS: Record<string, string> = {
  idle: 'bg-slate-100 text-slate-600',
  working: 'bg-alo-blue-light text-alo-blue',
  error: 'bg-rose-100 text-rose-700',
};

const AGENT_STATUS_LABELS: Record<string, string> = {
  idle: 'Idle',
  working: 'Working',
  error: 'Error',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  queued: 'bg-slate-100 text-slate-600',
  running: 'bg-alo-blue-light text-alo-blue',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
};

const TASK_STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

const WORKFLOW_STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  error: 'bg-rose-100 text-rose-700',
};

const APPROVAL_TYPE_COLORS: Record<string, string> = {
  content: 'bg-violet-100 text-violet-700',
  decision: 'bg-alo-orange-light text-alo-orange',
  communication: 'bg-alo-blue-light text-alo-blue',
};

const APPROVAL_TYPE_LABELS: Record<string, string> = {
  content: 'Content',
  decision: 'Decision',
  communication: 'Communication',
};

// ─── Demo Fallback Data ──────────────────────────────────────────────────────

const DEMO_STATS: DashboardStats = {
  counts: {},
  aiAgents: { active: 24, tasksToday: 156, completedToday: 132, pendingApprovals: 14 },
};

const DEMO_DEPARTMENTS: Department[] = [
  { id: 'dept1', name: 'Research', icon: 'Search', activeAgents: 3, tasksQueue: 12, completionRate: 89 },
  { id: 'dept2', name: 'Admissions', icon: 'UserPlus', activeAgents: 4, tasksQueue: 28, completionRate: 76 },
  { id: 'dept3', name: 'Counselling', icon: 'MessageSquare', activeAgents: 3, tasksQueue: 15, completionRate: 92 },
  { id: 'dept4', name: 'Marketing', icon: 'Megaphone', activeAgents: 3, tasksQueue: 22, completionRate: 84 },
  { id: 'dept5', name: 'Content', icon: 'FileText', activeAgents: 3, tasksQueue: 18, completionRate: 71 },
  { id: 'dept6', name: 'SEO', icon: 'Globe', activeAgents: 2, tasksQueue: 8, completionRate: 95 },
  { id: 'dept7', name: 'Documents', icon: 'ClipboardCheck', activeAgents: 2, tasksQueue: 25, completionRate: 68 },
  { id: 'dept8', name: 'Video', icon: 'Video', activeAgents: 1, tasksQueue: 6, completionRate: 83 },
  { id: 'dept9', name: 'Image', icon: 'Image', activeAgents: 1, tasksQueue: 4, completionRate: 91 },
  { id: 'dept10', name: 'Analytics', icon: 'BarChart3', activeAgents: 1, tasksQueue: 10, completionRate: 97 },
  { id: 'dept11', name: 'Communication', icon: 'Mail', activeAgents: 1, tasksQueue: 8, completionRate: 88 },
];

const DEMO_AGENTS: Record<string, Agent[]> = {
  dept1: [
    { id: 'a1', name: 'UniRank Scout', departmentId: 'dept1', currentTask: 'Scanning UK Russell Group rankings 2025', status: 'working', performanceScore: 96, lastActivity: '2025-01-16T14:32:00Z' },
    { id: 'a2', name: 'Scholarship Finder', departmentId: 'dept1', currentTask: null, status: 'idle', performanceScore: 91, lastActivity: '2025-01-16T13:15:00Z' },
    { id: 'a3', name: 'Course Matcher', departmentId: 'dept1', currentTask: 'Matching 23 profiles to programs', status: 'working', performanceScore: 88, lastActivity: '2025-01-16T14:28:00Z' },
  ],
  dept2: [
    { id: 'a4', name: 'App Processor', departmentId: 'dept2', currentTask: 'Processing 5 new applications', status: 'working', performanceScore: 94, lastActivity: '2025-01-16T14:35:00Z' },
    { id: 'a5', name: 'Doc Verifier', departmentId: 'dept2', currentTask: 'Verifying IELTS certificates', status: 'working', performanceScore: 89, lastActivity: '2025-01-16T14:30:00Z' },
    { id: 'a6', name: 'CAS Tracker', departmentId: 'dept2', currentTask: null, status: 'idle', performanceScore: 82, lastActivity: '2025-01-16T12:00:00Z' },
    { id: 'a7', name: 'Offer Matcher', departmentId: 'dept2', currentTask: 'Matching conditional offers', status: 'error', performanceScore: 76, lastActivity: '2025-01-16T14:20:00Z' },
  ],
  dept3: [
    { id: 'a8', name: 'Lead Scorer', departmentId: 'dept3', currentTask: 'Scoring 45 new leads', status: 'working', performanceScore: 93, lastActivity: '2025-01-16T14:33:00Z' },
    { id: 'a9', name: 'Follow-up Bot', departmentId: 'dept3', currentTask: null, status: 'idle', performanceScore: 87, lastActivity: '2025-01-16T11:45:00Z' },
    { id: 'a10', name: 'Counselor Assist', departmentId: 'dept3', currentTask: 'Preparing student briefing notes', status: 'working', performanceScore: 90, lastActivity: '2025-01-16T14:31:00Z' },
  ],
  dept4: [
    { id: 'a11', name: 'Ad Copywriter', departmentId: 'dept4', currentTask: 'Writing Facebook ad copy for UK intake', status: 'working', performanceScore: 85, lastActivity: '2025-01-16T14:29:00Z' },
    { id: 'a12', name: 'Campaign Optimizer', departmentId: 'dept4', currentTask: 'Analyzing campaign ROI data', status: 'working', performanceScore: 88, lastActivity: '2025-01-16T14:27:00Z' },
    { id: 'a13', name: 'A/B Test Runner', departmentId: 'dept4', currentTask: null, status: 'idle', performanceScore: 79, lastActivity: '2025-01-16T10:00:00Z' },
  ],
  dept5: [
    { id: 'a14', name: 'Blog Writer', departmentId: 'dept5', currentTask: 'Drafting: Top 10 UK universities for Engineering', status: 'working', performanceScore: 92, lastActivity: '2025-01-16T14:34:00Z' },
    { id: 'a15', name: 'SEO Content Bot', departmentId: 'dept5', currentTask: 'Optimizing existing blog posts', status: 'working', performanceScore: 86, lastActivity: '2025-01-16T14:26:00Z' },
    { id: 'a16', name: 'Social Caption Gen', departmentId: 'dept5', currentTask: null, status: 'idle', performanceScore: 90, lastActivity: '2025-01-16T13:50:00Z' },
  ],
};

const DEMO_TASKS: AITask[] = [
  { id: 't1', taskName: 'Generate UK university comparison blog', department: 'Content', agent: 'Blog Writer', status: 'completed', output: '3,200-word article generated', createdAt: '2025-01-16T14:00:00Z' },
  { id: 't2', taskName: 'Score 45 new leads from WhatsApp', department: 'Counselling', agent: 'Lead Scorer', status: 'running', output: null, createdAt: '2025-01-16T14:30:00Z' },
  { id: 't3', taskName: 'Verify IELTS certificate for Ahmed Al-Rashid', department: 'Admissions', agent: 'Doc Verifier', status: 'completed', output: 'Certificate verified — Band 7.5', createdAt: '2025-01-16T14:15:00Z' },
  { id: 't4', taskName: 'Match 23 student profiles to programs', department: 'Research', agent: 'Course Matcher', status: 'running', output: null, createdAt: '2025-01-16T14:20:00Z' },
  { id: 't5', taskName: 'Create Instagram carousel for Australia', department: 'Marketing', agent: 'Ad Copywriter', status: 'queued', output: null, createdAt: '2025-01-16T14:35:00Z' },
  { id: 't6', taskName: 'Process 5 new student applications', department: 'Admissions', agent: 'App Processor', status: 'running', output: null, createdAt: '2025-01-16T14:25:00Z' },
  { id: 't7', taskName: 'Draft email follow-up for 12 leads', department: 'Communication', agent: 'Follow-up Bot', status: 'failed', output: 'Rate limit exceeded', createdAt: '2025-01-16T14:10:00Z' },
  { id: 't8', taskName: 'Analyze scholarship eligibility for batch', department: 'Research', agent: 'Scholarship Finder', status: 'completed', output: '18 matches found', createdAt: '2025-01-16T13:45:00Z' },
  { id: 't9', taskName: 'Optimize blog SEO for 8 posts', department: 'Content', agent: 'SEO Content Bot', status: 'completed', output: 'Average score improved to 82', createdAt: '2025-01-16T13:30:00Z' },
  { id: 't10', taskName: 'Generate visa checklist for Canada batch', department: 'Admissions', agent: 'CAS Tracker', status: 'queued', output: null, createdAt: '2025-01-16T14:38:00Z' },
];

const DEMO_APPROVALS: ApprovalItem[] = [
  { id: 'ap1', type: 'content', department: 'Content', agent: 'Blog Writer', previewSnippet: 'The University of Oxford continues to lead global rankings in 2025, with Cambridge close behind. For students interested in Engineering...', createdAt: '2025-01-16T14:20:00Z' },
  { id: 'ap2', type: 'communication', department: 'Marketing', agent: 'Ad Copywriter', previewSnippet: 'Dear [Student Name], Congratulations! Based on your profile, you have been shortlisted for the September 2025 intake at...', createdAt: '2025-01-16T14:15:00Z' },
  { id: 'ap3', type: 'decision', department: 'Admissions', agent: 'Offer Matcher', previewSnippet: 'Recommendation: Approve conditional offer for Priya Sharma — MSc Data Science at University of Edinburgh. Profile score: 91/100...', createdAt: '2025-01-16T14:10:00Z' },
  { id: 'ap4', type: 'content', department: 'Content', agent: 'Social Caption Gen', previewSnippet: '🌍 Study in Germany with ZERO tuition fees! 🎓 Top public universities, world-class research, and vibrant student life...', createdAt: '2025-01-16T14:05:00Z' },
  { id: 'ap5', type: 'decision', department: 'Counselling', agent: 'Lead Scorer', previewSnippet: 'Lead James Okonkwo scored 85/100. Recommendation: Fast-track to counsellor assignment. Source: Facebook, interested in USA MS...', createdAt: '2025-01-16T13:55:00Z' },
  { id: 'ap6', type: 'communication', department: 'Communication', agent: 'Follow-up Bot', previewSnippet: 'Hi [Name], it\'s been a while since we last spoke about your study plans in Australia. We have some exciting updates about...', createdAt: '2025-01-16T13:45:00Z' },
];

const DEMO_WORKFLOWS: Workflow[] = [
  { id: 'w1', name: 'Lead Auto-Scoring Pipeline', status: 'active', progress: 78, description: 'Scores and prioritizes new leads automatically' },
  { id: 'w2', name: 'Document Verification Chain', status: 'active', progress: 45, description: 'Validates uploaded documents against university requirements' },
  { id: 'w3', name: 'Content Publishing Flow', status: 'active', progress: 92, description: 'AI draft → Human review → Publish to channels' },
  { id: 'w4', name: 'Scholarship Matcher', status: 'paused', progress: 30, description: 'Matches student profiles with active scholarships' },
  { id: 'w5', name: 'Application Status Sync', status: 'error', progress: 12, description: 'Syncs application status across all partner universities' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AICommandCenter({ onNavigate }: AICommandCenterProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [agents, setAgents] = useState<Record<string, Agent[]>>({});
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, auditRes] = await Promise.all([
        fetch('/api/dashboard/stats').then((r) => r.json()).catch(() => null),
        fetch('/api/audit-logs').then((r) => r.json()).catch(() => null),
      ]);
      setStats(statsRes?.data ?? statsRes ?? DEMO_STATS);
      setDepartments(DEMO_DEPARTMENTS);
      setAgents(DEMO_AGENTS);
      setTasks(DEMO_TASKS);
      setApprovals(DEMO_APPROVALS);
      setWorkflows(DEMO_WORKFLOWS);
    } catch {
      setError('Failed to load AI command center data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTasks = taskSearch
    ? tasks.filter(
        (t) =>
          t.taskName.toLowerCase().includes(taskSearch.toLowerCase()) ||
          t.department.toLowerCase().includes(taskSearch.toLowerCase()) ||
          t.agent.toLowerCase().includes(taskSearch.toLowerCase()),
      )
    : tasks;

  const selectedDeptData = departments.find((d) => d.id === selectedDept);
  const selectedAgents = selectedDept ? agents[selectedDept] ?? [] : [];

  const activeAgents = stats?.aiAgents?.active ?? DEMO_STATS.aiAgents?.active ?? 24;
  const tasksToday = stats?.aiAgents?.tasksToday ?? DEMO_STATS.aiAgents?.tasksToday ?? 156;
  const completedToday = stats?.aiAgents?.completedToday ?? DEMO_STATS.aiAgents?.completedToday ?? 132;
  const pendingApprovals = stats?.aiAgents?.pendingApprovals ?? DEMO_STATS.aiAgents?.pendingApprovals ?? 14;

  // ── Loading ──
  if (loading) return <LoadingGrid count={4} />;

  // ── Error ──
  if (error) {
    return (
      <EmptyState
        icon="AlertTriangle"
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

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="AI Command Center"
        subtitle="Monitor agents, tasks, and automation workflows"
        icon="Bot"
      />

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Agents" value={activeAgents} icon="Bot" accent="blue" hint="across 11 departments" />
        <StatCard label="Tasks Today" value={tasksToday} icon="ListTodo" accent="orange" hint="in pipeline" trend="+18 vs yesterday" />
        <StatCard label="Completed Today" value={completedToday} icon="CheckCircle2" accent="emerald" hint="success rate: 84.6%" />
        <StatCard label="Pending Approvals" value={pendingApprovals} icon="Clock" accent="amber" hint={pendingApprovals > 0 ? 'needs your attention' : 'all clear'} />
      </div>

      {/* ── Department Grid + Agent Drill-Down ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Department Grid */}
        <SectionCard
          className="lg:col-span-2"
          title="Departments"
          description={`${departments.length} active departments`}
          icon="Cpu"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {departments.map((dept) => {
              const isSelected = selectedDept === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(isSelected ? null : dept.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200',
                    isSelected
                      ? 'border-alo-blue bg-alo-blue-light shadow-sm ring-2 ring-alo-blue/20'
                      : 'border-border bg-white hover:border-alo-blue/40 hover:shadow-sm',
                  )}
                >
                  <div className={cn('flex size-10 items-center justify-center rounded-xl', isSelected ? 'bg-alo-blue text-white' : 'bg-slate-100 text-slate-600')}>
                    <Icon name={dept.icon} className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-alo-black">{dept.name}</p>
                    <p className="text-xs text-alo-gray">{dept.activeAgents} agents</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-alo-gray">
                    <span>{dept.tasksQueue} queued</span>
                    <span className="text-alo-black font-medium">{dept.completionRate}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Agent Drill-Down Panel */}
        <SectionCard
          title={selectedDeptData ? `${selectedDeptData.name} Agents` : 'Agent Details'}
          description={selectedDeptData ? `${selectedAgents.length} agent${selectedAgents.length !== 1 ? 's' : ''}` : 'Select a department to view agents'}
          icon="Bot"
        >
          {!selectedDept ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Bot className="size-6" />
              </div>
              <p className="mt-3 text-sm text-alo-gray">Click a department to explore its agents</p>
            </div>
          ) : selectedAgents.length === 0 ? (
            <EmptyState icon="Bot" title="No agents found" description="This department has no configured agents" />
          ) : (
            <div className="space-y-3">
              {selectedAgents.map((agent) => (
                <div key={agent.id} className="rounded-xl border border-border bg-white p-3 transition-colors hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-alo-black truncate">{agent.name}</p>
                        <StatusBadge status={agent.status} colorMap={AGENT_STATUS_COLORS} labels={AGENT_STATUS_LABELS} />
                      </div>
                      {agent.currentTask ? (
                        <p className="mt-1 text-xs text-alo-gray truncate">{agent.currentTask}</p>
                      ) : (
                        <p className="mt-1 text-xs text-alo-gray italic">No active task</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn('text-sm font-bold tabular-nums', agent.performanceScore >= 90 ? 'text-emerald-600' : agent.performanceScore >= 75 ? 'text-alo-blue' : 'text-amber-600')}>
                        {agent.performanceScore}
                      </span>
                      <span className="text-[10px] text-alo-gray">{timeAgo(agent.lastActivity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Task Queue Table ── */}
      <SectionCard
        title="Task Queue"
        description="Recent AI task executions"
        icon="ListTodo"
        action={
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-alo-gray" />
            <Input
              placeholder="Search tasks..."
              className="h-8 pl-8 text-xs"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
          </div>
        }
      >
        <ScrollArea className="max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Task</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Department</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Agent</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Output</TableHead>
                <TableHead className="text-xs text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-alo-gray">
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell className="text-sm font-medium text-alo-black max-w-[200px] truncate">{task.taskName}</TableCell>
                    <TableCell className="text-sm text-alo-gray hidden sm:table-cell">{task.department}</TableCell>
                    <TableCell className="text-sm text-alo-gray hidden md:table-cell">{task.agent}</TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} colorMap={TASK_STATUS_COLORS} labels={TASK_STATUS_LABELS} />
                    </TableCell>
                    <TableCell className="text-sm text-alo-gray max-w-[180px] truncate hidden lg:table-cell">{task.output || '—'}</TableCell>
                    <TableCell className="text-xs text-alo-gray text-right whitespace-nowrap">{timeAgo(task.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </SectionCard>

      {/* ── Human Approval Queue + Workflow Monitor ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Approval Queue */}
        <SectionCard
          className="lg:col-span-3"
          title="Human Approval Queue"
          description={`${approvals.length} items awaiting review`}
          icon="ClipboardCheck"
          action={
            <Badge variant="outline" className="bg-alo-orange-light text-alo-orange border-alo-orange/20">
              {approvals.length} pending
            </Badge>
          }
        >
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {approvals.length === 0 ? (
              <EmptyState icon="CheckCircle2" title="All caught up!" description="No items pending approval" />
            ) : (
              approvals.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-white p-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={item.type} colorMap={APPROVAL_TYPE_COLORS} labels={APPROVAL_TYPE_LABELS} />
                        <span className="text-xs text-alo-gray">{item.department} · {item.agent}</span>
                      </div>
                      <p className="mt-2 text-sm text-alo-black line-clamp-2 leading-relaxed">{item.previewSnippet}</p>
                      <p className="mt-1.5 text-xs text-alo-gray">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      <ThumbsUp className="size-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-rose-300 text-rose-700 hover:bg-rose-50">
                      <ThumbsDown className="size-3" /> Reject
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-alo-blue/30 text-alo-blue hover:bg-alo-blue-light">
                      <Pencil className="size-3" /> Revise
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Workflow Monitor */}
        <SectionCard
          className="lg:col-span-2"
          title="Workflow Monitor"
          description="Active automation workflows"
          icon="Activity"
        >
          <div className="space-y-3">
            {workflows.length === 0 ? (
              <EmptyState icon="Activity" title="No workflows" description="No automation workflows configured" />
            ) : (
              workflows.map((wf) => (
                <div key={wf.id} className="rounded-xl border border-border bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-alo-black truncate">{wf.name}</p>
                        <StatusBadge status={wf.status} colorMap={WORKFLOW_STATUS_COLORS} labels={{ active: 'Active', paused: 'Paused', error: 'Error' }} />
                      </div>
                      <p className="mt-1 text-xs text-alo-gray line-clamp-1">{wf.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <MiniBar
                        value={wf.progress}
                        max={100}
                        color={
                          wf.status === 'active'
                            ? 'var(--color-emerald-500)'
                            : wf.status === 'error'
                              ? 'var(--color-rose-500)'
                              : 'var(--color-amber-500)'
                        }
                      />
                    </div>
                    <span className={cn('text-xs font-bold tabular-nums', wf.progress >= 80 ? 'text-emerald-600' : 'text-alo-gray')}>
                      {wf.progress}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Quick Actions ── */}
      <SectionCard title="Quick Actions" icon="Zap">
        <div className="flex flex-wrap gap-2">
          <QuickAction icon="Plus" label="New Agent" variant="blue" onClick={() => {}} />
          <QuickAction icon="Play" label="Run Workflow" variant="emerald" onClick={() => {}} />
          <QuickAction icon="Eye" label="Review Queue" variant="orange" onClick={() => {}} badge={approvals.length} />
          <QuickAction icon="BarChart3" label="AI Analytics" variant="blue" onClick={() => {}} />
        </div>
      </SectionCard>
    </div>
  );
}
