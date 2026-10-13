'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bot, Cpu, Brain, Zap, Activity, CheckCircle2, Clock, AlertTriangle,
  RefreshCw, ChevronRight, Eye, ThumbsUp, ThumbsDown, Search,
  GraduationCap, MessageSquare, FileText, Mail, Globe, UserPlus,
  ArrowRight, Sparkles, Shield, Database, Layers, TrendingUp,
  Send, Pause, Play, RotateCcw, Trash2, Plus, Filter, MoreHorizontal,
  Gauge, Wallet, Timer, Star, GitBranch, MemoryStick, HardDrive,
  MessageCircle, BookOpen, Lightbulb, Target, Workflow, Server,
  ChevronDown, X, Copy, CheckCheck, BarChart3, PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  StatCard, SectionCard, PageHeader, StatusBadge, Icon,
} from '@/components/alo/shared';

// ─── Types ───────────────────────────────────────────────────────────

interface AICommandCenterPageProps {
  onBack?: () => void;
  onNavigate?: (view: string, slug?: string) => void;
}

// ─── Agent Data (inspired by MetaGPT multi-agent patterns) ──────────

interface Agent {
  id: string;
  name: string;
  icon: string;
  status: 'active' | 'idle' | 'busy' | 'error';
  capabilities: string[];
  tasksCompleted: number;
  tasksQueued: number;
  avgLatencyMs: number;
  successRate: number;
  model: string;
  department: string;
  lastActive: string;
}

const AGENTS: Agent[] = [
  {
    id: 'lead-scorer',
    name: 'Lead Scorer',
    icon: 'Target',
    status: 'active',
    capabilities: ['Lead qualification', 'Intent detection', 'Budget estimation', 'Priority scoring'],
    tasksCompleted: 1247,
    tasksQueued: 12,
    avgLatencyMs: 340,
    successRate: 96.2,
    model: 'GPT-4',
    department: 'Sales',
    lastActive: '2 min ago',
  },
  {
    id: 'doc-analyzer',
    name: 'Document Analyzer',
    icon: 'FileText',
    status: 'busy',
    capabilities: ['SOP review', 'CV parsing', 'Transcript validation', 'Document classification'],
    tasksCompleted: 892,
    tasksQueued: 8,
    avgLatencyMs: 1200,
    successRate: 94.8,
    model: 'Claude',
    department: 'Operations',
    lastActive: 'Active now',
  },
  {
    id: 'visa-advisor',
    name: 'Visa Advisor',
    icon: 'Globe',
    status: 'active',
    capabilities: ['Visa eligibility', 'Document checklist', 'Country compliance', 'Timeline estimation'],
    tasksCompleted: 634,
    tasksQueued: 5,
    avgLatencyMs: 580,
    successRate: 97.1,
    model: 'GLM-5',
    department: 'Visa',
    lastActive: '5 min ago',
  },
  {
    id: 'course-matcher',
    name: 'Course Matcher',
    icon: 'GraduationCap',
    status: 'active',
    capabilities: ['Course recommendation', 'University matching', 'Eligibility check', 'Scholarship matching'],
    tasksCompleted: 2103,
    tasksQueued: 18,
    avgLatencyMs: 450,
    successRate: 95.5,
    model: 'GPT-4',
    department: 'Academic',
    lastActive: '1 min ago',
  },
  {
    id: 'content-gen',
    name: 'Content Generator',
    icon: 'Sparkles',
    status: 'idle',
    capabilities: ['Blog writing', 'Email drafts', 'Social posts', 'Marketing copy'],
    tasksCompleted: 456,
    tasksQueued: 2,
    avgLatencyMs: 2800,
    successRate: 91.3,
    model: 'Gemini',
    department: 'Marketing',
    lastActive: '15 min ago',
  },
  {
    id: 'email-composer',
    name: 'Email Composer',
    icon: 'Mail',
    status: 'active',
    capabilities: ['Follow-up emails', 'Offer letters', 'Reminder sequences', 'Personalization'],
    tasksCompleted: 1876,
    tasksQueued: 9,
    avgLatencyMs: 620,
    successRate: 98.1,
    model: 'Claude',
    department: 'Communication',
    lastActive: '3 min ago',
  },
];

// ─── Model Data (inspired by Free-GPT multi-model patterns) ─────────

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  icon: string;
  status: 'available' | 'rate_limited' | 'offline';
  costPer1kTokens: number;
  avgLatencyMs: number;
  qualityScore: number;
  contextWindow: string;
  specialties: string[];
  totalCallsToday: number;
  errorRate: number;
  fallbackModel?: string;
}

const MODELS: ModelInfo[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4o',
    provider: 'OpenAI',
    icon: '🟢',
    status: 'available',
    costPer1kTokens: 0.03,
    avgLatencyMs: 1200,
    qualityScore: 95,
    contextWindow: '128K',
    specialties: ['Complex reasoning', 'Multi-step tasks', 'Code generation', 'Analysis'],
    totalCallsToday: 3420,
    errorRate: 0.8,
    fallbackModel: 'Claude 3.5 Sonnet',
  },
  {
    id: 'claude-3.5',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    icon: '🟠',
    status: 'available',
    costPer1kTokens: 0.024,
    avgLatencyMs: 900,
    qualityScore: 93,
    contextWindow: '200K',
    specialties: ['Long context', 'Document analysis', 'Writing', 'Safety'],
    totalCallsToday: 2180,
    errorRate: 0.5,
    fallbackModel: 'GPT-4o',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    icon: '🔵',
    status: 'available',
    costPer1kTokens: 0.02,
    avgLatencyMs: 800,
    qualityScore: 90,
    contextWindow: '1M',
    specialties: ['Multimodal', 'Long context', 'Research', 'Summarization'],
    totalCallsToday: 1560,
    errorRate: 1.2,
    fallbackModel: 'GPT-4o',
  },
  {
    id: 'glm-5',
    name: 'GLM-5.2',
    provider: 'Z.ai',
    icon: '🟣',
    status: 'available',
    costPer1kTokens: 0.008,
    avgLatencyMs: 400,
    qualityScore: 88,
    contextWindow: '128K',
    specialties: ['Fast inference', 'Cost-effective', 'Agentic tasks', 'Coding'],
    totalCallsToday: 4200,
    errorRate: 0.3,
    fallbackModel: 'GPT-4o',
  },
  {
    id: 'llama-70b',
    name: 'Llama 3.3 70B',
    provider: 'Groq',
    icon: '⚡',
    status: 'available',
    costPer1kTokens: 0.0008,
    avgLatencyMs: 120,
    qualityScore: 82,
    contextWindow: '128K',
    specialties: ['Ultra-fast', 'Classification', 'Chat', 'Batch tasks'],
    totalCallsToday: 8900,
    errorRate: 0.2,
    fallbackModel: 'GLM-5.2',
  },
];

// ─── Routing Rules (inspired by multi-model API patterns) ───────────

interface RoutingRule {
  id: string;
  taskType: string;
  primaryModel: string;
  fallbackChain: string[];
  condition: string;
  costSavedPct: number;
  enabled: boolean;
}

const ROUTING_RULES: RoutingRule[] = [
  { id: 'r1', taskType: 'Lead Scoring', primaryModel: 'Llama 3.3 70B', fallbackChain: ['GLM-5.2', 'GPT-4o'], condition: 'confidence > 0.7', costSavedPct: 92, enabled: true },
  { id: 'r2', taskType: 'Document Analysis', primaryModel: 'Claude 3.5 Sonnet', fallbackChain: ['GPT-4o', 'Gemini 2.5 Pro'], condition: 'pages > 10', costSavedPct: 15, enabled: true },
  { id: 'r3', taskType: 'Visa Advisory', primaryModel: 'GLM-5.2', fallbackChain: ['GPT-4o', 'Claude 3.5 Sonnet'], condition: 'always', costSavedPct: 73, enabled: true },
  { id: 'r4', taskType: 'Course Matching', primaryModel: 'GPT-4o', fallbackChain: ['Claude 3.5 Sonnet', 'GLM-5.2'], condition: 'complex query', costSavedPct: 0, enabled: true },
  { id: 'r5', taskType: 'Content Generation', primaryModel: 'Gemini 2.5 Pro', fallbackChain: ['GPT-4o', 'Claude 3.5 Sonnet'], condition: 'creative task', costSavedPct: 33, enabled: true },
  { id: 'r6', taskType: 'Email Composition', primaryModel: 'Claude 3.5 Sonnet', fallbackChain: ['GLM-5.2', 'Llama 3.3 70B'], condition: 'template match', costSavedPct: 20, enabled: true },
  { id: 'r7', taskType: 'Chat Response', primaryModel: 'Llama 3.3 70B', fallbackChain: ['GLM-5.2'], condition: 'simple query', costSavedPct: 97, enabled: true },
  { id: 'r8', taskType: 'Complex Reasoning', primaryModel: 'GPT-4o', fallbackChain: ['Claude 3.5 Sonnet', 'Gemini 2.5 Pro'], condition: 'always', costSavedPct: 0, enabled: false },
];

// ─── Memory Data (inspired by ai-memory patterns) ────────────────────

interface MemoryEntry {
  id: string;
  contextType: string;
  contextId: string;
  key: string;
  value: string;
  createdAt: string;
  expiresAt: string;
  size: number;
}

interface ConversationSummary {
  id: string;
  studentName: string;
  agentName: string;
  messageCount: number;
  lastMessage: string;
  lastActivity: string;
  contextSize: number;
  topic: string;
}

const CONVERSATIONS: ConversationSummary[] = [
  { id: 'c1', studentName: 'Priya Sharma', agentName: 'Course Matcher', messageCount: 12, lastMessage: 'Would you like me to compare these 3 programs?', lastActivity: '2 min ago', contextSize: 4200, topic: 'UK University Search' },
  { id: 'c2', studentName: 'Ahmed Al-Farsi', agentName: 'Visa Advisor', messageCount: 8, lastMessage: 'Your visa documents are 85% complete', lastActivity: '5 min ago', contextSize: 3100, topic: 'UK Student Visa' },
  { id: 'c3', studentName: 'Li Wei', agentName: 'Lead Scorer', messageCount: 4, lastMessage: 'Lead scored at 87 — high priority', lastActivity: '10 min ago', contextSize: 1800, topic: 'Lead Qualification' },
  { id: 'c4', studentName: 'Maria Santos', agentName: 'Email Composer', messageCount: 6, lastMessage: 'Follow-up email drafted for review', lastActivity: '15 min ago', contextSize: 2600, topic: 'Application Follow-up' },
  { id: 'c5', studentName: 'Raj Patel', agentName: 'Document Analyzer', messageCount: 3, lastMessage: 'SOP analysis complete — 3 suggestions', lastActivity: '20 min ago', contextSize: 5400, topic: 'SOP Review' },
];

// ─── Task Queue Data ─────────────────────────────────────────────────

interface AITask {
  id: string;
  taskType: string;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval';
  priority: 'low' | 'normal' | 'high' | 'critical';
  progress: number;
  input: string;
  result?: string;
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
  model: string;
  tokensUsed?: number;
  cost?: number;
}

const TASKS: AITask[] = [
  { id: 't1', taskType: 'Lead Scoring', agentName: 'Lead Scorer', status: 'running', priority: 'high', progress: 65, input: 'New lead: John Smith, IELTS 7.5, CS program', createdAt: '1 min ago', model: 'Llama 3.3 70B' },
  { id: 't2', taskType: 'Document Analysis', agentName: 'Doc Analyzer', status: 'running', priority: 'normal', progress: 40, input: 'SOP draft for Manchester University', createdAt: '3 min ago', model: 'Claude 3.5 Sonnet' },
  { id: 't3', taskType: 'Course Matching', agentName: 'Course Matcher', status: 'pending', priority: 'high', progress: 0, input: 'Student: Business Analytics, UK, Budget £25k', createdAt: '5 min ago', model: 'GPT-4o' },
  { id: 't4', taskType: 'Visa Advisory', agentName: 'Visa Advisor', status: 'completed', priority: 'normal', progress: 100, input: 'Visa checklist for Tier 4 Student Visa', result: 'Checklist generated: 12 documents required', createdAt: '8 min ago', completedAt: '6 min ago', durationMs: 2400, model: 'GLM-5.2', tokensUsed: 1840, cost: 0.015 },
  { id: 't5', taskType: 'Email Composition', agentName: 'Email Composer', status: 'completed', priority: 'low', progress: 100, input: 'Follow-up email to confirmed student', result: 'Email drafted with 94% personalization score', createdAt: '12 min ago', completedAt: '10 min ago', durationMs: 1800, model: 'Claude 3.5 Sonnet', tokensUsed: 1200, cost: 0.029 },
  { id: 't6', taskType: 'Content Generation', agentName: 'Content Gen', status: 'awaiting_approval', priority: 'normal', progress: 100, input: 'Blog post: Top 5 UK universities for 2025', result: 'Draft ready — 1200 words, SEO optimized', createdAt: '15 min ago', model: 'Gemini 2.5 Pro' },
  { id: 't7', taskType: 'Lead Scoring', agentName: 'Lead Scorer', status: 'completed', priority: 'critical', progress: 100, input: 'Urgent: Walk-in lead, MBA, £50k budget', result: 'Score: 95/100 — Immediate follow-up recommended', createdAt: '20 min ago', completedAt: '19 min ago', durationMs: 320, model: 'Llama 3.3 70B', tokensUsed: 420, cost: 0.0003 },
  { id: 't8', taskType: 'Document Analysis', agentName: 'Doc Analyzer', status: 'failed', priority: 'normal', progress: 30, input: 'Transcript validation for unknown format', createdAt: '25 min ago', model: 'Claude 3.5 Sonnet' },
];

// ─── Status helpers ──────────────────────────────────────────────────

const agentStatusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  idle: 'bg-amber-100 text-amber-700',
  busy: 'bg-blue-100 text-blue-700',
  error: 'bg-red-100 text-red-700',
};

const taskStatusColor: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  awaiting_approval: 'bg-amber-100 text-amber-700',
};

const modelStatusColor: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  rate_limited: 'bg-amber-100 text-amber-700',
  offline: 'bg-red-100 text-red-700',
};

const priorityColor: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

// ─── Main Component ──────────────────────────────────────────────────

export function AICommandCenterPage({ onBack, onNavigate }: AICommandCenterPageProps) {
  const [activeTab, setActiveTab] = useState('agents');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  // ─── Stats ───────────────────────────────────────────────────────
  const activeAgents = AGENTS.filter(a => a.status === 'active' || a.status === 'busy').length;
  const totalTasksCompleted = AGENTS.reduce((s, a) => s + a.tasksCompleted, 0);
  const avgSuccessRate = AGENTS.reduce((s, a) => s + a.successRate, 0) / AGENTS.length;
  const pendingTasks = TASKS.filter(t => t.status === 'pending').length;
  const runningTasks = TASKS.filter(t => t.status === 'running').length;
  const totalCostToday = TASKS.filter(t => t.cost).reduce((s, t) => s + (t.cost ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="text-[#64748B]">
                ← Back
              </Button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052B8] to-[#003A82]">
                <Brain className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0F172A]">AI Command Center</h1>
                <p className="text-xs text-[#64748B]">Multi-agent orchestration & model management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
              <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
              Refresh
            </Button>
            <Badge className="bg-emerald-100 text-emerald-700 border-0">
              <span className="mr-1 inline-block size-1.5 rounded-full bg-emerald-500" />
              {activeAgents} agents live
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-5">
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active Agents" value={activeAgents} icon="Bot" accent="blue" hint="of 6 total" />
          <StatCard label="Tasks Today" value={totalTasksCompleted.toLocaleString()} icon="CheckCircle2" accent="emerald" hint={`${runningTasks} running`} />
          <StatCard label="Success Rate" value={`${avgSuccessRate.toFixed(1)}%`} icon="TrendingUp" accent="emerald" />
          <StatCard label="Cost Today" value={`$${totalCostToday.toFixed(2)}`} icon="Wallet" accent="orange" hint="optimized routing" />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border border-[#E2E8F0] rounded-xl p-1 h-auto">
            <TabsTrigger value="agents" className="gap-1.5 rounded-lg data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
              <Bot className="size-3.5" /> Agents
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-1.5 rounded-lg data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
              <Cpu className="size-3.5" /> Models
            </TabsTrigger>
            <TabsTrigger value="memory" className="gap-1.5 rounded-lg data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
              <Brain className="size-3.5" /> Memory
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-1.5 rounded-lg data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
              <Layers className="size-3.5" /> Queue
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Multi-Agent Orchestrator ──────────────────────── */}
          <TabsContent value="agents" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#0F172A]">AI Workforce — Multi-Agent Orchestrator</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#94A3B8]" />
                  <Input
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs w-40 bg-white border-[#E2E8F0]"
                  />
                </div>
              </div>
            </div>

            {/* Agent Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {AGENTS
                .filter(a => !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(agent => (
                <Card
                  key={agent.id}
                  className={cn(
                    'rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:shadow-md cursor-pointer',
                    selectedAgent === agent.id && 'ring-2 ring-[#0052B8] border-[#0052B8]'
                  )}
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Agent Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'flex size-9 items-center justify-center rounded-xl',
                          agent.status === 'active' || agent.status === 'busy' ? 'bg-[#EFF6FF] text-[#0052B8]' :
                          agent.status === 'idle' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                        )}>
                          <Icon name={agent.icon} className="size-4.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A]">{agent.name}</p>
                          <p className="text-[10px] text-[#94A3B8]">{agent.department} · {agent.model}</p>
                        </div>
                      </div>
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', agentStatusColor[agent.status])}>
                        {agent.status === 'busy' && <span className="mr-1 animate-pulse">●</span>}
                        {agent.status}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-1.5 rounded-lg bg-[#F8FAFC]">
                        <p className="text-xs font-bold text-[#0F172A]">{agent.tasksCompleted.toLocaleString()}</p>
                        <p className="text-[9px] text-[#94A3B8]">Completed</p>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-[#F8FAFC]">
                        <p className="text-xs font-bold text-[#0F172A]">{agent.successRate}%</p>
                        <p className="text-[9px] text-[#94A3B8]">Success</p>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-[#F8FAFC]">
                        <p className="text-xs font-bold text-[#0F172A]">{agent.avgLatencyMs}ms</p>
                        <p className="text-[9px] text-[#94A3B8]">Latency</p>
                      </div>
                    </div>

                    {/* Queue indicator */}
                    {agent.tasksQueued > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                        <Clock className="size-3" />
                        <span>{agent.tasksQueued} tasks queued</span>
                      </div>
                    )}

                    {/* Capabilities */}
                    {selectedAgent === agent.id && (
                      <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                        <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">Capabilities</p>
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.map(cap => (
                            <Badge key={cap} variant="outline" className="text-[9px] h-5 border-[#CBD5E1] text-[#475569]">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button size="sm" className="h-7 text-[10px] bg-[#0052B8] hover:bg-[#003A82] gap-1">
                            <Play className="size-3" /> Assign Task
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
                            <Eye className="size-3" /> View Logs
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Orchestration Flow Diagram */}
            <SectionCard title="Orchestration Flow" icon="Workflow" className="mt-4">
              <div className="flex items-center justify-center gap-2 py-4 overflow-x-auto">
                {['Event', 'Classify', 'Agent\nSelect', 'Context\nLoad', 'Memory\nLoad', 'Execute', 'Validate', 'Complete'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn(
                        'flex size-10 items-center justify-center rounded-lg text-[9px] font-semibold text-center whitespace-pre-line',
                        i < 5 ? 'bg-[#EFF6FF] text-[#0052B8]' : i === 5 ? 'bg-[#E8501A] text-white' : 'bg-emerald-50 text-emerald-700'
                      )}>
                        {step}
                      </div>
                      {i === 5 && <span className="text-[8px] text-[#E8501A] font-medium">AI Core</span>}
                    </div>
                    {i < 7 && <ArrowRight className="size-3 text-[#94A3B8] shrink-0" />}
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Tab 2: Model Router ───────────────────────────────────── */}
          <TabsContent value="models" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#0F172A]">Model Router — Multi-Model API Gateway</h2>
              <Badge variant="outline" className="text-[10px] border-[#CBD5E1]">
                <Shield className="size-3 mr-1" /> Fallback chains active
              </Badge>
            </div>

            {/* Model Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {MODELS.map(model => (
                <Card
                  key={model.id}
                  className={cn(
                    'rounded-2xl border border-[#E2E8F0] bg-white transition-all hover:shadow-md cursor-pointer',
                    selectedModel === model.id && 'ring-2 ring-[#0052B8] border-[#0052B8]'
                  )}
                  onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Model Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{model.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A]">{model.name}</p>
                          <p className="text-[10px] text-[#94A3B8]">{model.provider} · {model.contextWindow} context</p>
                        </div>
                      </div>
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', modelStatusColor[model.status])}>
                        {model.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Quality / Cost / Latency */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-1.5 rounded-lg bg-[#F8FAFC]">
                        <p className="text-xs font-bold text-[#0F172A]">{model.qualityScore}</p>
                        <p className="text-[9px] text-[#94A3B8]">Quality</p>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-[#F8FAFC]">
                        <p className="text-xs font-bold text-[#0F172A]">${model.costPer1kTokens < 0.01 ? model.costPer1kTokens.toFixed(4) : model.costPer1kTokens.toFixed(3)}</p>
                        <p className="text-[9px] text-[#94A3B8]">/1K tok</p>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-[#F8FAFC]">
                        <p className="text-xs font-bold text-[#0F172A]">{model.avgLatencyMs}ms</p>
                        <p className="text-[9px] text-[#94A3B8]">Latency</p>
                      </div>
                    </div>

                    {/* Call count & error rate */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#64748B]">Calls today</span>
                        <span className="font-medium text-[#0F172A]">{model.totalCallsToday.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#64748B]">Error rate</span>
                        <span className={cn('font-medium', model.errorRate > 1 ? 'text-red-600' : 'text-emerald-600')}>{model.errorRate}%</span>
                      </div>
                    </div>

                    {/* Fallback & Specialties (expanded) */}
                    {selectedModel === model.id && (
                      <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                        {model.fallbackModel && (
                          <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                            <GitBranch className="size-3" />
                            <span>Fallback: <span className="font-medium text-[#0F172A]">{model.fallbackModel}</span></span>
                          </div>
                        )}
                        <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">Specialties</p>
                        <div className="flex flex-wrap gap-1">
                          {model.specialties.map(s => (
                            <Badge key={s} variant="outline" className="text-[9px] h-5 border-[#CBD5E1] text-[#475569]">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Routing Rules Table */}
            <SectionCard title="Routing Rules & Fallback Chains" icon="GitBranch" action={
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
                <Plus className="size-3" /> Add Rule
              </Button>
            }>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-[#64748B] uppercase">Task Type</th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-[#64748B] uppercase">Primary Model</th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-[#64748B] uppercase">Fallback Chain</th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-[#64748B] uppercase">Condition</th>
                      <th className="text-right py-2 px-3 text-[10px] font-medium text-[#64748B] uppercase">Cost Saved</th>
                      <th className="text-center py-2 px-3 text-[10px] font-medium text-[#64748B] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROUTING_RULES.map(rule => (
                      <tr key={rule.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-3 font-medium text-[#0F172A]">{rule.taskType}</td>
                        <td className="py-2.5 px-3 text-[#475569]">{rule.primaryModel}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            {rule.fallbackChain.map((m, i) => (
                              <span key={i} className="flex items-center gap-1">
                                {i > 0 && <ArrowRight className="size-2.5 text-[#94A3B8]" />}
                                <span className="text-[#475569]">{m}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[#64748B] font-mono text-[10px]">{rule.condition}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={cn('font-medium', rule.costSavedPct > 50 ? 'text-emerald-600' : rule.costSavedPct > 0 ? 'text-amber-600' : 'text-[#64748B]')}>
                            {rule.costSavedPct > 0 ? `${rule.costSavedPct}%` : '—'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Switch checked={rule.enabled} disabled className="scale-75" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Cost Optimization Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="rounded-2xl border border-[#E2E8F0] bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">$42.80</p>
                  <p className="text-[10px] text-[#64748B] mt-1">Estimated cost without routing</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border border-[#E2E8F0] bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[#0052B8]">$8.52</p>
                  <p className="text-[10px] text-[#64748B] mt-1">Actual cost with smart routing</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border border-[#E2E8F0] bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[#E8501A]">80%</p>
                  <p className="text-[10px] text-[#64748B] mt-1">Cost savings from intelligent routing</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab 3: AI Memory ──────────────────────────────────────── */}
          <TabsContent value="memory" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#0F172A]">AI Memory — Context & Knowledge Management</h2>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
                <RotateCcw className="size-3" /> Cleanup Expired
              </Button>
            </div>

            {/* Memory Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Memory Entries" value="2,847" icon="Database" accent="blue" hint="across all contexts" />
              <StatCard label="Conversations" value="156" icon="MessageCircle" accent="emerald" hint="active sessions" />
              <StatCard label="Context Usage" value="67%" icon="HardDrive" accent="orange" />
              <StatCard label="Avg Context" value="3.2K" icon="MemoryStick" accent="violet" hint="tokens per session" />
            </div>

            {/* Context Type Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Memory by Context Type" icon="PieChart">
                <div className="space-y-3 py-2">
                  {[
                    { type: 'Conversation', count: 1245, size: '4.2 MB', pct: 44, color: 'bg-[#0052B8]' },
                    { type: 'Student', count: 623, size: '2.1 MB', pct: 22, color: 'bg-emerald-500' },
                    { type: 'Agent', count: 478, size: '1.6 MB', pct: 17, color: 'bg-[#E8501A]' },
                    { type: 'Lead', count: 312, size: '1.0 MB', pct: 11, color: 'bg-amber-500' },
                    { type: 'Task', count: 189, size: '0.6 MB', pct: 6, color: 'bg-violet-500' },
                  ].map(ctx => (
                    <div key={ctx.type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={cn('size-2 rounded-full', ctx.color)} />
                          <span className="font-medium text-[#0F172A]">{ctx.type}</span>
                          <span className="text-[#94A3B8]">({ctx.count.toLocaleString()} entries · {ctx.size})</span>
                        </div>
                        <span className="text-[#64748B]">{ctx.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', ctx.color)} style={{ width: `${ctx.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Context Windows */}
              <SectionCard title="Context Window Utilization" icon="Gauge">
                <div className="space-y-3 py-2">
                  {MODELS.slice(0, 4).map(model => {
                    const usage = Math.floor(Math.random() * 40 + 40);
                    return (
                      <div key={model.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#0F172A]">{model.name}</span>
                          <span className="text-[#64748B]">{usage}% of {model.contextWindow}</span>
                        </div>
                        <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div className={cn(
                            'h-full rounded-full',
                            usage > 80 ? 'bg-red-500' : usage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          )} style={{ width: `${usage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>

            {/* Active Conversations */}
            <SectionCard title="Active Conversations" icon="MessageSquare" action={
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#94A3B8]" />
                <Input placeholder="Search conversations..." className="pl-8 h-7 text-xs w-48 bg-white border-[#E2E8F0]" />
              </div>
            }>
              <div className="space-y-2">
                {CONVERSATIONS.map(conv => (
                  <div key={conv.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors cursor-pointer">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0052B8] shrink-0">
                      <MessageCircle className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-[#0F172A]">{conv.studentName}</p>
                        <Badge variant="outline" className="text-[8px] h-4 border-[#CBD5E1] text-[#64748B]">{conv.topic}</Badge>
                      </div>
                      <p className="text-[10px] text-[#64748B] truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-[#94A3B8]">{conv.lastActivity}</p>
                      <p className="text-[9px] text-[#94A3B8]">{conv.messageCount} msgs · {conv.contextSize} tok</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Knowledge Base Integration */}
            <SectionCard title="Knowledge Base Integration" icon="BookOpen">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-1">
                {[
                  { name: 'University Database', entries: 512, lastSync: '2 min ago', icon: 'GraduationCap' },
                  { name: 'Visa Regulations', entries: 234, lastSync: '1 hour ago', icon: 'Globe' },
                  { name: 'Course Catalog', entries: 1847, lastSync: '5 min ago', icon: 'BookOpen' },
                ].map(kb => (
                  <div key={kb.name} className="p-3 rounded-xl border border-[#E2E8F0] bg-white space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon name={kb.icon} className="size-4 text-[#0052B8]" />
                      <p className="text-xs font-semibold text-[#0F172A]">{kb.name}</p>
                    </div>
                    <p className="text-[10px] text-[#64748B]">{kb.entries.toLocaleString()} entries</p>
                    <p className="text-[9px] text-emerald-600">Synced {kb.lastSync}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Tab 4: Task Queue ─────────────────────────────────────── */}
          <TabsContent value="queue" className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-sm font-semibold text-[#0F172A]">AI Task Queue — Execution & Approval</h2>
              <div className="flex items-center gap-2">
                {/* Filter buttons */}
                {['all', 'pending', 'running', 'completed', 'failed'].map(f => (
                  <Button
                    key={f}
                    size="sm"
                    variant={taskFilter === f ? 'default' : 'outline'}
                    className={cn(
                      'h-7 text-[10px] capitalize',
                      taskFilter === f ? 'bg-[#0052B8] hover:bg-[#003A82]' : 'border-[#CBD5E1]'
                    )}
                    onClick={() => setTaskFilter(f)}
                  >
                    {f}
                    {f !== 'all' && (
                      <Badge className="ml-1 bg-white/20 text-white border-0 text-[8px] h-3.5 min-w-[14px] px-1">
                        {TASKS.filter(t => t.status === f).length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Queue Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-lg font-bold text-[#0F172A]">{pendingTasks}</p>
                <p className="text-[10px] text-[#64748B]">Pending</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-lg font-bold text-[#0F172A]">{runningTasks}</p>
                <p className="text-[10px] text-[#64748B]">Running</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-lg font-bold text-[#0F172A]">{TASKS.filter(t => t.status === 'completed').length}</p>
                <p className="text-[10px] text-[#64748B]">Completed</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-lg font-bold text-[#0F172A]">{TASKS.filter(t => t.status === 'failed').length}</p>
                <p className="text-[10px] text-[#64748B]">Failed</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-lg font-bold text-[#0F172A]">{TASKS.filter(t => t.status === 'awaiting_approval').length}</p>
                <p className="text-[10px] text-[#64748B]">Approval</p>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {TASKS
                .filter(t => taskFilter === 'all' || t.status === taskFilter)
                .map(task => (
                <Card key={task.id} className="rounded-xl border border-[#E2E8F0] bg-white hover:shadow-sm transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className={cn(
                        'flex size-8 items-center justify-center rounded-lg shrink-0 mt-0.5',
                        task.status === 'running' ? 'bg-blue-100 text-blue-600' :
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                        task.status === 'failed' ? 'bg-red-100 text-red-600' :
                        task.status === 'awaiting_approval' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      )}>
                        {task.status === 'running' ? <Activity className="size-4 animate-pulse" /> :
                         task.status === 'completed' ? <CheckCircle2 className="size-4" /> :
                         task.status === 'failed' ? <AlertTriangle className="size-4" /> :
                         task.status === 'awaiting_approval' ? <Clock className="size-4" /> :
                         <Clock className="size-4" />}
                      </div>

                      {/* Task Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-[#0F172A]">{task.taskType}</p>
                          <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium', priorityColor[task.priority])}>
                            {task.priority}
                          </span>
                          <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium', taskStatusColor[task.status])}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#64748B] mt-0.5">{task.input}</p>

                        {/* Progress bar for running tasks */}
                        {(task.status === 'running' || task.status === 'pending') && (
                          <div className="mt-2">
                            <Progress value={task.progress} className="h-1.5" />
                          </div>
                        )}

                        {/* Result for completed tasks */}
                        {task.result && (
                          <div className="mt-1.5 flex items-start gap-1.5">
                            <Lightbulb className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-emerald-700">{task.result}</p>
                          </div>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] text-[#94A3B8]">
                          <span className="flex items-center gap-1"><Bot className="size-2.5" /> {task.agentName}</span>
                          <span className="flex items-center gap-1"><Server className="size-2.5" /> {task.model}</span>
                          <span>{task.createdAt}</span>
                          {task.durationMs && <span>{task.durationMs}ms</span>}
                          {task.tokensUsed && <span>{task.tokensUsed} tokens</span>}
                          {task.cost && <span>${task.cost.toFixed(4)}</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {task.status === 'awaiting_approval' && (
                          <>
                            <Button size="sm" className="h-6 text-[9px] bg-emerald-600 hover:bg-emerald-700 gap-0.5 px-2">
                              <CheckCheck className="size-3" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 text-[9px] border-red-200 text-red-600 hover:bg-red-50 gap-0.5 px-2">
                              <X className="size-3" /> Reject
                            </Button>
                          </>
                        )}
                        {task.status === 'running' && (
                          <Button size="sm" variant="outline" className="h-6 text-[9px] gap-0.5 px-2">
                            <Pause className="size-3" /> Pause
                          </Button>
                        )}
                        {task.status === 'failed' && (
                          <Button size="sm" variant="outline" className="h-6 text-[9px] gap-0.5 px-2">
                            <RotateCcw className="size-3" /> Retry
                          </Button>
                        )}
                        {task.status === 'pending' && (
                          <Button size="sm" className="h-6 text-[9px] bg-[#0052B8] hover:bg-[#003A82] gap-0.5 px-2">
                            <Play className="size-3" /> Run
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Approval Workflow Info */}
            <SectionCard title="Approval Workflow" icon="Shield">
              <div className="flex items-center gap-4 py-2">
                {['Submit', 'Auto\nClassify', 'Human\nReview', 'Approve/\nReject', 'Execute'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'flex size-9 items-center justify-center rounded-lg text-[9px] font-semibold text-center whitespace-pre-line',
                        i < 2 ? 'bg-emerald-50 text-emerald-700' : i === 2 ? 'bg-amber-50 text-amber-700' : 'bg-[#EFF6FF] text-[#0052B8]'
                      )}>
                        {step}
                      </div>
                    </div>
                    {i < 4 && <ArrowRight className="size-3 text-[#94A3B8]" />}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-[#64748B]">
                Tasks classified as <span className="font-medium text-amber-600">HUMAN_APPROVAL_REQUIRED</span> or
                <span className="font-medium text-amber-600"> AI_ASSISTED</span> require explicit approval before execution.
                Auto-classifiable tasks bypass the review step.
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
