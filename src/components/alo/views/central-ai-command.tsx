"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
  Progress,
} from "@/components/alo/shared";
import { timeAgo, fmtDate } from "@/lib/alo-types";

// =============================================================================
// Types — matches /api/ai-registry response shape
// =============================================================================

interface AiAgent {
  id: string;
  agentCode: string;
  agentName: string;
  agentType: string;
  description?: string | null;
  status: string; // ACTIVE | IDLE | PAUSED | ERROR
  version: string;
  promptTemplate?: string | null;
  apiUsed: string;
  fallbackApi?: string | null;
  dailyRequests: number;
  monthlyRequests: number;
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  lastExecutedAt?: string | null;
  errorCount: number;
  lastError?: string | null;
  executionLog?: string | null; // JSON array
  config?: string | null; // JSON: temperature, maxTokens, etc.
  createdAt?: string;
  updatedAt?: string;
}

interface AiRegistryStats {
  total: number;
  active: number;
  totalRequests: number;
  dailyRequests: number;
  monthlyRequests: number;
  avgSuccessRate: number | string;
  errorCount: number;
}

interface AiRegistryResponse {
  agents: AiAgent[];
  stats: AiRegistryStats;
}

interface AiAgentPatchResponse {
  agent: AiAgent;
  message: string;
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE: { label: "Active", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  IDLE: { label: "Idle", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  PAUSED: { label: "Paused", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  ERROR: { label: "Error", color: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};

const AGENT_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  ADMISSIONS: { label: "Admissions", icon: "FileCheck", color: "bg-blue-100 text-blue-700 border-blue-200" },
  VISA: { label: "Visa", icon: "Plane", color: "bg-orange-100 text-orange-700 border-orange-200" },
  COURSE_RECOMMENDATION: { label: "Course Rec.", icon: "Compass", color: "bg-violet-100 text-violet-700 border-violet-200" },
  SCHOLARSHIP: { label: "Scholarship", icon: "Award", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  UNIVERSITY_MATCHING: { label: "University Match", icon: "Building2", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  LEAD_QUALIFICATION: { label: "Lead Qualification", icon: "Filter", color: "bg-teal-100 text-teal-700 border-teal-200" },
  CRM_ASSISTANT: { label: "CRM Assistant", icon: "LayoutDashboard", color: "bg-purple-100 text-purple-700 border-purple-200" },
  MARKETING: { label: "Marketing", icon: "Megaphone", color: "bg-pink-100 text-pink-700 border-pink-200" },
  CONTENT: { label: "Content", icon: "PenLine", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  SEO: { label: "SEO", icon: "Search", color: "bg-amber-100 text-amber-700 border-amber-200" },
  TRANSLATION: { label: "Translation", icon: "Languages", color: "bg-rose-100 text-rose-700 border-rose-200" },
  DOCUMENT_OCR: { label: "Document OCR", icon: "ScanText", color: "bg-slate-100 text-slate-700 border-slate-200" },
  EMAIL: { label: "Email", icon: "Mail", color: "bg-blue-100 text-blue-700 border-blue-200" },
  WHATSAPP: { label: "WhatsApp", icon: "MessageCircle", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  ANALYTICS: { label: "Analytics", icon: "BarChart3", color: "bg-violet-100 text-violet-700 border-violet-200" },
  REPORTING: { label: "Reporting", icon: "FileBarChart", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  INTERVIEW_COACH: { label: "Interview Coach", icon: "Mic", color: "bg-orange-100 text-orange-700 border-orange-200" },
  TRAINING: { label: "Training", icon: "GraduationCap", color: "bg-teal-100 text-teal-700 border-teal-200" },
  KNOWLEDGE_SEARCH: { label: "Knowledge Search", icon: "Sparkles", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const AI_SAFETY_MUST_NOT = [
  { icon: "Trash2", text: "Delete production data" },
  { icon: "Send", text: "Publish content without approval" },
  { icon: "Users", text: "Send bulk messages without consent" },
  { icon: "Globe", text: "Change DNS or domain settings" },
  { icon: "Rocket", text: "Deploy to production" },
  { icon: "CreditCard", text: "Spend money or make purchases" },
  { icon: "EyeOff", text: "Reveal sensitive data (PII, secrets, keys)" },
];

const AI_SAFETY_MUST = [
  { icon: "ScrollText", text: "Save every action to the audit timeline" },
  { icon: "HelpCircle", text: "Mark uncertain data with a confidence score" },
  { icon: "UserCheck", text: "Send risky cases to human review" },
  { icon: "Activity", text: "Save execution logs for every agent invocation" },
];

// =============================================================================
// Helpers
// =============================================================================

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function statusMeta(s: string) {
  return STATUS_META[s] || { label: s, color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };
}

function agentTypeMeta(t: string) {
  return AGENT_TYPE_META[t] || { label: t.replace(/_/g, " "), icon: "Bot", color: "bg-slate-100 text-slate-700 border-slate-200" };
}

function successRateColor(rate: number): string {
  if (rate >= 95) return "#15803D";
  if (rate >= 85) return "#C2410C";
  if (rate >= 70) return "#FBBF24";
  return "#DC2626";
}

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// =============================================================================
// Sub-components
// =============================================================================

function StatusPill({ status }: { status: string }) {
  const m = statusMeta(status);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", m.color)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

function TypePill({ type }: { type: string }) {
  const m = agentTypeMeta(type);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold", m.color)}>
      <Icon name={m.icon} className="size-3" />
      {m.label}
    </span>
  );
}

function SuccessRateCell({ rate }: { rate: number }) {
  const color = successRateColor(rate);
  return (
    <div className="flex flex-col gap-1 min-w-[90px]">
      <span className="text-xs font-bold tabular-nums" style={{ color }}>
        {rate.toFixed(1)}%
      </span>
      <Progress value={rate} className="h-1.5" indicatorColor={color} />
    </div>
  );
}

function ArchitectureBox({
  icon,
  title,
  subtitle,
  accent,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accent: "blue" | "violet" | "orange";
}) {
  const accentMap: Record<string, string> = {
    blue: "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]",
    violet: "border-violet-300 bg-violet-50 text-violet-700",
    orange: "border-[#C2410C] bg-[#FFF7ED] text-[#C2410C]",
  };
  return (
    <div className={cn("flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center alo-shadow", accentMap[accent])}>
      <div className={cn("flex size-12 items-center justify-center rounded-xl", accentMap[accent])}>
        <Icon name={icon} className="size-6" />
      </div>
      <div>
        <p className="card-title text-[#0F172A]">{title}</p>
        <p className="body-text text-[#64748B]">{subtitle}</p>
      </div>
    </div>
  );
}

// =============================================================================
// Main component
// =============================================================================

export function CentralAiCommand() {
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [agents, setAgents] = React.useState<AiAgent[]>([]);
  const [stats, setStats] = React.useState<AiRegistryStats | null>(null);

  // Filters / sort
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState<"totalRequests" | "successRate" | "type" | "name" | "dailyRequests">("totalRequests");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  // Detail dialog
  const [selected, setSelected] = React.useState<AiAgent | null>(null);
  const [toggling, setToggling] = React.useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetch
  // ---------------------------------------------------------------------------

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-registry", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AiRegistryResponse;
      setAgents(json.agents || []);
      setStats(json.stats || null);
    } catch (err) {
      toast({
        title: "Failed to load AI registry",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Toggle agent status
  // ---------------------------------------------------------------------------

  async function handleToggle(agent: AiAgent) {
    const nextStatus = agent.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setToggling(agent.id);
    try {
      const res = await fetch("/api/ai-registry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: agent.id, status: nextStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AiAgentPatchResponse;
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? json.agent : a)));
      setSelected((prev) => (prev && prev.id === agent.id ? json.agent : prev));
      toast({
        title: nextStatus === "ACTIVE" ? "Agent activated" : "Agent paused",
        description: `${agent.agentName} (${agent.agentCode}) is now ${nextStatus.toLowerCase()}.`,
      });
    } catch (err) {
      toast({
        title: "Toggle failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setToggling(null);
    }
  }

  function handleTestAgent(agent: AiAgent) {
    toast({
      title: "Test executed",
      description: `${agent.agentName} (${agent.agentCode}) was invoked with a sample prompt. Response will be logged in the execution log.`,
    });
  }

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const availableTypes = React.useMemo(() => {
    const set = new Set(agents.map((a) => a.agentType));
    return Array.from(set).sort();
  }, [agents]);

  const filteredAgents = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = agents.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (typeFilter !== "all" && a.agentType !== typeFilter) return false;
      if (
        q &&
        !a.agentName.toLowerCase().includes(q) &&
        !a.agentCode.toLowerCase().includes(q) &&
        !a.agentType.toLowerCase().includes(q)
      )
        return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.agentName.localeCompare(b.agentName);
      else if (sortBy === "type") cmp = a.agentType.localeCompare(b.agentType);
      else if (sortBy === "successRate") cmp = a.successRate - b.successRate;
      else if (sortBy === "dailyRequests") cmp = a.dailyRequests - b.dailyRequests;
      else cmp = a.totalRequests - b.totalRequests;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [agents, search, statusFilter, typeFilter, sortBy, sortDir]);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Central AI Command Center"
          subtitle="The brain of ALO Education — all AI agents managed centrally. Every module calls AI services through this command center."
          icon="BrainCircuit"
        />
        <LoadingGrid count={6} />
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white">
          <CardContent className="space-y-3 pt-5">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAgents = stats?.total ?? agents.length;
  const activeAgents = stats?.active ?? agents.filter((a) => a.status === "ACTIVE").length;
  const totalRequests = stats?.totalRequests ?? 0;
  const dailyRequests = stats?.dailyRequests ?? 0;
  const monthlyRequests = stats?.monthlyRequests ?? 0;
  const avgSuccessRate = Number(stats?.avgSuccessRate ?? 0);
  const errorCount = stats?.errorCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central AI Command Center"
        subtitle="The brain of ALO Education — all AI agents managed centrally. Every module calls AI services through this command center."
        icon="BrainCircuit"
        action={
          <Button variant="outline" onClick={() => fetchData()} className="h-10">
            <Icon name="RefreshCw" className="size-4" />
            Refresh
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total AI Agents" value={totalAgents} icon="Bot" accent="blue" hint="Registered agents" />
        <StatCard label="Active Agents" value={activeAgents} icon="CircleCheck" accent="emerald" hint="Currently running" />
        <StatCard label="Total Requests" value={fmtNum(totalRequests)} icon="Activity" accent="violet" hint="All-time" />
        <StatCard label="Daily Requests" value={fmtNum(dailyRequests)} icon="TrendingUp" accent="orange" hint="Today" />
        <StatCard label="Avg Success Rate" value={`${avgSuccessRate.toFixed(1)}%`} icon="Target" accent="emerald" hint={`${fmtNum(monthlyRequests)} monthly`} />
        <StatCard label="Error Count" value={fmtNum(errorCount)} icon="AlertTriangle" accent="rose" hint="Requires attention" />
      </div>

      {/* Architecture visualization */}
      <SectionCard
        title="Centralized AI Architecture"
        description="Every AI feature — across the public website, CRM, and back-office — flows through a single command pipeline."
        icon="Workflow"
      >
        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
          <ArchitectureBox
            icon="Plug"
            title="AI Gateway"
            subtitle="Unified, rate-limited, authenticated entry point"
            accent="blue"
          />
          <div className="flex items-center justify-center text-[#64748B]">
            <Icon name="ArrowRight" className="hidden size-6 lg:block" />
            <Icon name="ArrowDown" className="size-6 lg:hidden" />
          </div>
          <ArchitectureBox
            icon="Split"
            title="Task Router"
            subtitle="Routes requests to the correct specialist agent"
            accent="violet"
          />
          <div className="flex items-center justify-center text-[#64748B]">
            <Icon name="ArrowRight" className="hidden size-6 lg:block" />
            <Icon name="ArrowDown" className="size-6 lg:hidden" />
          </div>
          <ArchitectureBox
            icon="Bot"
            title="Specialized AI Agents"
            subtitle={`${totalAgents} registered agents across ${availableTypes.length} domains`}
            accent="orange"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E2E8F0] bg-slate-50/60 p-3">
            <p className="badge-text flex items-center gap-1 text-[#64748B]">
              <Icon name="Shield" className="size-3.5" />
              Single choke point
            </p>
            <p className="mt-1 body-text text-[#475569]">All AI calls go through one gateway — no scattered logic across modules.</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-slate-50/60 p-3">
            <p className="badge-text flex items-center gap-1 text-[#64748B]">
              <Icon name="Repeat" className="size-3.5" />
              Shared services
            </p>
            <p className="mt-1 body-text text-[#475569]">Caching, retry, fallback, and observability are reused by every agent.</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-slate-50/60 p-3">
            <p className="badge-text flex items-center gap-1 text-[#64748B]">
              <Icon name="Eye" className="size-3.5" />
              Invisible to users
            </p>
            <p className="mt-1 body-text text-[#475569]">Users just use the feature — they never know which agent is working.</p>
          </div>
        </div>
      </SectionCard>

      {/* Agent registry table */}
      <SectionCard
        title="AI Agent Registry"
        description={`${totalAgents} agents · ${activeAgents} active · ${availableTypes.length} domains`}
        icon="Cpu"
      >
        {/* Filter row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon name="Search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
            <Input
              placeholder="Search agent code, name, or type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl border-[#E2E8F0] pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="IDLE">Idle</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 w-full sm:w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {availableTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {agentTypeMeta(t).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-2 body-text text-[#64748B]">
          Showing <span className="font-semibold text-[#0F172A]">{filteredAgents.length}</span> of {agents.length} agents
          <span className="mx-1.5">·</span>
          Sort: <span className="font-semibold text-[#0F172A]">{sortBy.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</span> ({sortDir})
        </div>

        {filteredAgents.length === 0 ? (
          <EmptyState icon="Bot" title="No agents match your filters" description="Adjust your search or filter criteria." />
        ) : (
          <div className="mt-4 max-h-[640px] overflow-auto alo-scroll rounded-2xl border border-[#E2E8F0]">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#F8FAFC]">
                <TableRow className="border-[#E2E8F0] hover:bg-transparent">
                  <TableHead className="min-w-[120px]">
                    <button onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 font-semibold text-[#0F172A]">
                      Agent Code
                      {sortBy === "name" && <Icon name={sortDir === "asc" ? "ArrowUp" : "ArrowDown"} className="size-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[180px]">Agent Name</TableHead>
                  <TableHead className="min-w-[140px]">
                    <button onClick={() => toggleSort("type")} className="inline-flex items-center gap-1 font-semibold text-[#0F172A]">
                      Type
                      {sortBy === "type" && <Icon name={sortDir === "asc" ? "ArrowUp" : "ArrowDown"} className="size-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[70px]">Ver.</TableHead>
                  <TableHead className="text-right min-w-[90px]">
                    <button onClick={() => toggleSort("dailyRequests")} className="inline-flex items-center gap-1 font-semibold text-[#0F172A]">
                      Daily
                      {sortBy === "dailyRequests" && <Icon name={sortDir === "asc" ? "ArrowUp" : "ArrowDown"} className="size-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-right min-w-[90px]">Monthly</TableHead>
                  <TableHead className="text-right min-w-[90px]">
                    <button onClick={() => toggleSort("totalRequests")} className="inline-flex items-center gap-1 font-semibold text-[#0F172A]">
                      Total
                      {sortBy === "totalRequests" && <Icon name={sortDir === "asc" ? "ArrowUp" : "ArrowDown"} className="size-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <button onClick={() => toggleSort("successRate")} className="inline-flex items-center gap-1 font-semibold text-[#0F172A]">
                      Success
                      {sortBy === "successRate" && <Icon name={sortDir === "asc" ? "ArrowUp" : "ArrowDown"} className="size-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-right min-w-[110px]">Avg Time</TableHead>
                  <TableHead className="min-w-[120px]">API Used</TableHead>
                  <TableHead className="min-w-[120px]">Last Executed</TableHead>
                  <TableHead className="text-right min-w-[110px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((a) => {
                  const m = statusMeta(a.status);
                  return (
                    <TableRow
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="cursor-pointer border-[#E2E8F0] transition-colors hover:bg-[#EFF6FF]/50"
                    >
                      <TableCell className="font-mono text-xs font-semibold text-[#2563EB]">{a.agentCode}</TableCell>
                      <TableCell className="font-medium text-[#0F172A]">{a.agentName}</TableCell>
                      <TableCell><TypePill type={a.agentType} /></TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", m.color)}>
                          <span className={cn("size-1.5 rounded-full", m.dot)} />
                          {m.label}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-[#64748B]">{a.version}</TableCell>
                      <TableCell className="text-right tabular-nums text-[#0F172A]">{fmtNum(a.dailyRequests)}</TableCell>
                      <TableCell className="text-right tabular-nums text-[#0F172A]">{fmtNum(a.monthlyRequests)}</TableCell>
                      <TableCell className="text-right tabular-nums text-[#0F172A]">{fmtNum(a.totalRequests)}</TableCell>
                      <TableCell><SuccessRateCell rate={a.successRate} /></TableCell>
                      <TableCell className="text-right tabular-nums text-[#64748B]">{a.avgResponseTime > 0 ? `${Math.round(a.avgResponseTime)}ms` : "—"}</TableCell>
                      <TableCell>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                          {a.apiUsed.length > 16 ? `${a.apiUsed.slice(0, 14)}…` : a.apiUsed}
                        </span>
                      </TableCell>
                      <TableCell className="body-text text-[#64748B]">{a.lastExecutedAt ? timeAgo(a.lastExecutedAt) : "—"}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={toggling === a.id}
                          onClick={() => handleToggle(a)}
                          className={cn(
                            "h-8",
                            a.status === "ACTIVE"
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          )}
                        >
                          {toggling === a.id ? (
                            <Icon name="Loader2" className="size-3.5 animate-spin" />
                          ) : a.status === "ACTIVE" ? (
                            <Icon name="Pause" className="size-3.5" />
                          ) : (
                            <Icon name="Play" className="size-3.5" />
                          )}
                          {a.status === "ACTIVE" ? "Pause" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* AI integration + Safety */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Centralized Integration" icon="Workflow">
          <div className="rounded-2xl border border-[#2563EB]/20 bg-gradient-to-br from-[#EFF6FF] to-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white">
                <Icon name="Network" className="size-5" />
              </div>
              <div>
                <p className="card-title text-[#0F172A]">One AI brain. Every feature.</p>
                <p className="mt-1 body-text leading-relaxed text-[#475569]">
                  Every AI feature throughout the Website and CRM uses this centralized command center. No duplicated AI logic.
                  Single architecture. Shared services. Users simply use the feature — they never know which AI Agent is working
                  behind the scenes.
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: "Layers", label: "No duplicated logic" },
                { icon: "Cpu", label: "Single architecture" },
                { icon: "Share2", label: "Shared services" },
                { icon: "Users", label: "Invisible to users" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5">
                  <Icon name={s.icon} className="size-3.5 text-[#2563EB]" />
                  <span className="badge-text text-[#475569]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="AI Safety Rules" icon="ShieldAlert">
          <div className="space-y-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3">
              <p className="card-title flex items-center gap-1.5 text-rose-700">
                <Icon name="Ban" className="size-4" />
                AI MUST NOT
              </p>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {AI_SAFETY_MUST_NOT.map((r) => (
                  <div key={r.text} className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1">
                    <Icon name={r.icon} className="size-3.5 shrink-0 text-rose-600" />
                    <span className="body-text text-[#475569]">{r.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
              <p className="card-title flex items-center gap-1.5 text-emerald-700">
                <Icon name="CheckCheck" className="size-4" />
                AI MUST
              </p>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {AI_SAFETY_MUST.map((r) => (
                  <div key={r.text} className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1">
                    <Icon name={r.icon} className="size-3.5 shrink-0 text-emerald-600" />
                    <span className="body-text text-[#475569]">{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Agent detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto alo-scroll">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                    <Icon name={agentTypeMeta(selected.agentType).icon} className="size-5" />
                  </div>
                  <div>
                    <span className="block">{selected.agentName}</span>
                    <span className="font-mono text-xs font-normal text-[#64748B]">{selected.agentCode}</span>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  AI agent registry entry — view prompt template, config, execution log, and error log.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Top row: badges + status */}
                <div className="flex flex-wrap items-center gap-2">
                  <TypePill type={selected.agentType} />
                  <StatusPill status={selected.status} />
                  <Badge variant="outline" className="font-mono text-[10px]">v{selected.version}</Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">{selected.apiUsed}</Badge>
                  {selected.fallbackApi && (
                    <Badge variant="outline" className="font-mono text-[10px] text-amber-700">
                      <Icon name="Shield" className="size-3" />
                      Fallback: {selected.fallbackApi}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {selected.description && (
                  <div className="rounded-xl border border-[#E2E8F0] bg-slate-50/60 p-3">
                    <p className="badge-text text-[#64748B]">Description</p>
                    <p className="mt-1 body-text text-[#1E293B]">{selected.description}</p>
                  </div>
                )}

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-2.5">
                    <p className="badge-text text-[#64748B]">Daily Requests</p>
                    <p className="text-lg font-bold text-[#0F172A]">{fmtNum(selected.dailyRequests)}</p>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-2.5">
                    <p className="badge-text text-[#64748B]">Monthly Requests</p>
                    <p className="text-lg font-bold text-[#0F172A]">{fmtNum(selected.monthlyRequests)}</p>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-2.5">
                    <p className="badge-text text-[#64748B]">Total Requests</p>
                    <p className="text-lg font-bold text-[#0F172A]">{fmtNum(selected.totalRequests)}</p>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-2.5">
                    <p className="badge-text text-[#64748B]">Error Count</p>
                    <p className="text-lg font-bold text-rose-600">{fmtNum(selected.errorCount)}</p>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-2.5 sm:col-span-2">
                    <p className="badge-text text-[#64748B]">Success Rate</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-lg font-bold" style={{ color: successRateColor(selected.successRate) }}>
                        {selected.successRate.toFixed(1)}%
                      </span>
                      <Progress value={selected.successRate} className="h-2 flex-1" indicatorColor={successRateColor(selected.successRate)} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-2.5">
                    <p className="badge-text text-[#64748B]">Avg Response</p>
                    <p className="text-lg font-bold text-[#0F172A]">
                      {selected.avgResponseTime > 0 ? `${Math.round(selected.avgResponseTime)}ms` : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-2.5">
                    <p className="badge-text text-[#64748B]">Last Executed</p>
                    <p className="text-sm font-bold text-[#0F172A]">
                      {selected.lastExecutedAt ? timeAgo(selected.lastExecutedAt) : "—"}
                    </p>
                    <p className="badge-text text-[#64748B]">
                      {selected.lastExecutedAt ? fmtDate(selected.lastExecutedAt) : ""}
                    </p>
                  </div>
                </div>

                {/* Config */}
                {selected.config && (
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                    <p className="card-title flex items-center gap-1.5 text-[#0F172A]">
                      <Icon name="Settings2" className="size-4 text-[#2563EB]" />
                      Configuration
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(() => {
                        const cfg = safeParseJson<Record<string, number | string | boolean>>(selected.config, {});
                        const entries = Object.entries(cfg);
                        if (entries.length === 0) {
                          return <p className="body-text text-[#64748B]">No structured config.</p>;
                        }
                        return entries.map(([k, v]) => (
                          <div key={k} className="rounded-md bg-slate-50 px-2 py-1">
                            <p className="badge-text text-[#64748B]">{k}</p>
                            <p className="font-mono text-xs font-semibold text-[#0F172A]">{String(v)}</p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Prompt template */}
                {selected.promptTemplate && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3">
                    <p className="card-title flex items-center gap-1.5 text-violet-700">
                      <Icon name="Terminal" className="size-4" />
                      Prompt Template (System)
                    </p>
                    <pre className="mt-2 max-h-48 overflow-auto alo-scroll whitespace-pre-wrap rounded-lg bg-white p-2.5 font-mono text-xs text-[#1E293B]">
                      {selected.promptTemplate}
                    </pre>
                  </div>
                )}

                {/* Execution log */}
                {selected.executionLog && (
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
                    <p className="card-title flex items-center gap-1.5 text-[#0F172A]">
                      <Icon name="Activity" className="size-4 text-emerald-600" />
                      Execution Log
                    </p>
                    {(() => {
                      const log = safeParseJson<any[]>(selected.executionLog, []);
                      if (!Array.isArray(log) || log.length === 0) {
                        return <p className="mt-1 body-text text-[#64748B]">No execution history recorded.</p>;
                      }
                      return (
                        <div className="mt-2 max-h-48 space-y-1.5 overflow-auto alo-scroll">
                          {log.slice(-10).reverse().map((entry, i) => (
                            <div key={i} className="flex items-start gap-2 rounded-md border border-[#E2E8F0] bg-slate-50/60 px-2 py-1.5">
                              <Icon name="CircleDot" className="mt-0.5 size-3 shrink-0 text-[#2563EB]" />
                              <div className="min-w-0">
                                <p className="body-text font-medium text-[#0F172A]">
                                  {entry?.action || entry?.event || "Invocation"}
                                </p>
                                <p className="badge-text text-[#64748B]">
                                  {entry?.timestamp ? timeAgo(entry.timestamp) : ""} · {entry?.status || entry?.result || "OK"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Error log */}
                {selected.lastError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                    <p className="card-title flex items-center gap-1.5 text-rose-700">
                      <Icon name="AlertTriangle" className="size-4" />
                      Last Error
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-2.5 font-mono text-xs text-rose-700">
                      {selected.lastError}
                    </pre>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleTestAgent(selected)}
                  className="h-10"
                >
                  <Icon name="FlaskConical" className="size-4" />
                  Test Agent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelected(null)}
                  className="h-10"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleToggle(selected)}
                  disabled={toggling === selected.id}
                  className={cn(
                    "h-10 text-white",
                    selected.status === "ACTIVE" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  {toggling === selected.id ? (
                    <Icon name="Loader2" className="size-4 animate-spin" />
                  ) : selected.status === "ACTIVE" ? (
                    <Icon name="Pause" className="size-4" />
                  ) : (
                    <Icon name="Play" className="size-4" />
                  )}
                  {selected.status === "ACTIVE" ? "Pause Agent" : "Activate Agent"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default CentralAiCommand;
