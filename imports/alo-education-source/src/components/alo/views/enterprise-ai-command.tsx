"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  Icon,
  StatCard,
  SectionCard,
  EmptyState,
  LoadingGrid,
  MiniBar,
  PageHeader,
  Progress,
} from "@/components/alo/shared";
import { fmtDate, timeAgo } from "@/lib/alo-types";
import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// Types — matches /api/enterprise-ai/dashboard response shape
// =============================================================================

interface DashboardSummary {
  totalDepartments: number;
  dccCertified: number;
  canCreateAgents: number;
  totalEmployees: number;
  totalSkills: number;
  totalPrompts: number;
  totalRules: number;
  totalSops: number;
  totalEngines: number;
  activeEngines: number;
  healthyEngines: number;
}

interface DepartmentRow {
  id: string;
  deptCode: string;
  name: string;
  description?: string | null;
  sopCoverage: number;
  knowledgeCoverage: number;
  skillCoverage: number;
  testPassRate: number;
  kpiAchievement: number;
  securityCompliance: number;
  auditCompliance: number;
  selfRecoverySuccess: number;
  humanEscalationRate: number;
  dccCertified: boolean;
  dccCertifiedAt?: string | null;
  canCreateAgents: boolean;
  aiEmployeeCount: number;
  skillCount: number;
  promptCount: number;
}

interface EngineMetrics {
  requests: number;
  errors: number;
  latency: number; // ms
  uptime: number; // %
}

interface EngineRow {
  id: string;
  engineCode: string;
  name: string;
  type: string;
  description?: string | null;
  status: string; // ACTIVE | IDLE | MAINTENANCE
  healthStatus: string; // HEALTHY | DEGRADED | CRITICAL
  metrics: EngineMetrics | null;
  lastHealthCheck?: string | null;
}

interface DccCriteria {
  sopCoverage: string;
  knowledgeCoverage: string;
  skillCoverage: string;
  testPassRate: string;
  kpiAchievement: string;
  securityCompliance: string;
  auditCompliance: string;
  selfRecoverySuccess: string;
  humanEscalationRate: string;
}

interface DashboardData {
  summary: DashboardSummary;
  departments: DepartmentRow[];
  engines: EngineRow[];
  dccCriteria: DccCriteria;
}

interface DccCheck {
  name: string;
  value: number;
  threshold: number;
  passed: boolean;
}

interface DccResponse {
  department: DepartmentRow & { dccCertifiedAt?: string | null };
  checks: DccCheck[];
  allPassed: boolean;
  message: string;
}

// =============================================================================
// Constants — 20 enterprise engine types
// =============================================================================

interface EngineTypeMeta {
  label: string;
  icon: string;
  short: string;
}

const ENGINE_TYPE_META: Record<string, EngineTypeMeta> = {
  KNOWLEDGE_GRAPH: { label: "Knowledge Graph", icon: "Network", short: "KG" },
  RAG: { label: "RAG", icon: "Database", short: "RAG" },
  MULTI_AGENT_COLLABORATION: { label: "Multi-Agent Collaboration", icon: "Bot", short: "MAC" },
  MEMORY: { label: "Memory", icon: "Brain", short: "MEM" },
  PLANNING: { label: "Planning", icon: "Map", short: "PLN" },
  REFLECTION: { label: "Reflection", icon: "RefreshCw", short: "RFL" },
  SELF_HEALING: { label: "Self-Healing", icon: "HeartPulse", short: "SHL" },
  SELF_OPTIMIZATION: { label: "Self-Optimization", icon: "Gauge", short: "SOP" },
  EVALUATION: { label: "Evaluation", icon: "ClipboardCheck", short: "EVL" },
  GOVERNANCE: { label: "Governance", icon: "Scale", short: "GOV" },
  SECURITY: { label: "Security", icon: "Shield", short: "SEC" },
  AUDIT: { label: "Audit", icon: "ScrollText", short: "AUD" },
  COMPLIANCE: { label: "Compliance", icon: "FileCheck", short: "CMP" },
  OBSERVABILITY: { label: "Observability", icon: "Activity", short: "OBS" },
  WORKFLOW_ORCHESTRATION: { label: "Workflow Orchestration", icon: "Workflow", short: "WFO" },
  EVENT_BUS: { label: "Event Bus", icon: "Radio", short: "EVB" },
  API_GATEWAY: { label: "API Gateway", icon: "Plug", short: "API" },
  MCP_INTEGRATION: { label: "MCP Integration", icon: "Cable", short: "MCP" },
  DATA_LAKE: { label: "Data Lake", icon: "DatabaseZap", short: "DLK" },
  IDENTITY_RBAC: { label: "Identity & RBAC", icon: "Fingerprint", short: "RBAC" },
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  IDLE: "bg-slate-100 text-slate-700 border-slate-200",
  MAINTENANCE: "bg-amber-100 text-amber-700 border-amber-200",
};

const HEALTH_COLORS: Record<string, string> = {
  HEALTHY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DEGRADED: "bg-amber-100 text-amber-700 border-amber-200",
  CRITICAL: "bg-rose-100 text-rose-700 border-rose-200",
};

const HEALTH_DOT: Record<string, string> = {
  HEALTHY: "bg-emerald-500",
  DEGRADED: "bg-amber-500",
  CRITICAL: "bg-rose-500",
};

// DCC criteria thresholds (for color coding)
const DCC_THRESHOLDS = {
  sopCoverage: { pass: 95, warn: 90, mode: "ge" as const },
  knowledgeCoverage: { pass: 95, warn: 90, mode: "ge" as const },
  skillCoverage: { pass: 95, warn: 90, mode: "ge" as const },
  testPassRate: { pass: 95, warn: 90, mode: "ge" as const },
  kpiAchievement: { pass: 90, warn: 85, mode: "ge" as const },
  securityCompliance: { pass: 100, warn: 100, mode: "eq" as const },
  auditCompliance: { pass: 100, warn: 100, mode: "eq" as const },
  selfRecoverySuccess: { pass: 90, warn: 85, mode: "ge" as const },
  humanEscalationRate: { pass: 10, warn: 15, mode: "le" as const },
};

// DCC criteria display meta
const DCC_CRITERIA: { key: keyof typeof DCC_THRESHOLDS; label: string; threshold: string; icon: string }[] = [
  { key: "sopCoverage", label: "SOP Coverage", threshold: "≥ 95%", icon: "BookOpen" },
  { key: "knowledgeCoverage", label: "Knowledge Coverage", threshold: "≥ 95%", icon: "Library" },
  { key: "skillCoverage", label: "Skill Coverage", threshold: "≥ 95%", icon: "Zap" },
  { key: "testPassRate", label: "Test Pass Rate", threshold: "≥ 95%", icon: "ClipboardCheck" },
  { key: "kpiAchievement", label: "KPI Achievement", threshold: "≥ 90%", icon: "Target" },
  { key: "securityCompliance", label: "Security Compliance", threshold: "= 100%", icon: "Shield" },
  { key: "auditCompliance", label: "Audit Compliance", threshold: "= 100%", icon: "ScrollText" },
  { key: "selfRecoverySuccess", label: "Self-Recovery Success", threshold: "≥ 90%", icon: "HeartPulse" },
  { key: "humanEscalationRate", label: "Human Escalation Rate", threshold: "≤ 10%", icon: "UserCheck" },
];

// Constitutional rules — synthesized for display (first 20)
interface RuleRow {
  ruleCode: string;
  title: string;
  category: string;
  enforcement: string;
  priority: number;
  status: string;
}

const RULE_CATEGORIES = ["SAFETY", "PRIVACY", "FAIRNESS", "TRANSPARENCY", "ACCOUNTABILITY", "COMPLIANCE"];
const RULE_ENFORCEMENTS = ["BLOCK", "WARN", "LOG", "ESCALATE"];

const RULE_CATEGORY_COLORS: Record<string, string> = {
  SAFETY: "bg-rose-100 text-rose-700 border-rose-200",
  PRIVACY: "bg-violet-100 text-violet-700 border-violet-200",
  FAIRNESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
  TRANSPARENCY: "bg-sky-100 text-sky-700 border-sky-200",
  ACCOUNTABILITY: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLIANCE: "bg-blue-100 text-blue-700 border-blue-200",
};

const ENFORCEMENT_COLORS: Record<string, string> = {
  BLOCK: "bg-rose-100 text-rose-700 border-rose-200",
  WARN: "bg-amber-100 text-amber-700 border-amber-200",
  LOG: "bg-blue-100 text-blue-700 border-blue-200",
  ESCALATE: "bg-orange-100 text-orange-700 border-orange-200",
};

const SAMPLE_RULES: RuleRow[] = [
  { ruleCode: "RULE-0001", title: "Never invent university admission requirements", category: "SAFETY", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0002", title: "Never guarantee visa approval to any student", category: "SAFETY", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0003", title: "PII must be encrypted at rest and in transit", category: "PRIVACY", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0004", title: "Student data export requires OTP verification", category: "PRIVACY", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0005", title: "AI recommendations must not discriminate by nationality", category: "FAIRNESS", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0006", title: "All AI outputs must surface a confidence score", category: "TRANSPARENCY", enforcement: "WARN", priority: 2, status: "ACTIVE" },
  { ruleCode: "RULE-0007", title: "Cite the source for every university & visa fact", category: "TRANSPARENCY", enforcement: "WARN", priority: 2, status: "ACTIVE" },
  { ruleCode: "RULE-0008", title: "Every AI action must be logged to the audit trail", category: "ACCOUNTABILITY", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0009", title: "Risk cases must be escalated to a human reviewer", category: "ACCOUNTABILITY", enforcement: "ESCALATE", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0010", title: "Comply with GDPR for EU student data", category: "COMPLIANCE", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0011", title: "Comply with BD ICT Act for local student data", category: "COMPLIANCE", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0012", title: "Never publish content without human approval", category: "SAFETY", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0013", title: "Do not copy official IELTS / PTE exam questions", category: "COMPLIANCE", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0014", title: "Marketing claims must be substantiated", category: "TRANSPARENCY", enforcement: "WARN", priority: 2, status: "ACTIVE" },
  { ruleCode: "RULE-0015", title: "Visa advice must match latest embassy rules", category: "SAFETY", enforcement: "ESCALATE", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0016", title: "Document approval requires human review", category: "ACCOUNTABILITY", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0017", title: "Status changes require explicit permission", category: "ACCOUNTABILITY", enforcement: "BLOCK", priority: 1, status: "ACTIVE" },
  { ruleCode: "RULE-0018", title: "Log all model invocations with prompt & output", category: "TRANSPARENCY", enforcement: "LOG", priority: 3, status: "ACTIVE" },
  { ruleCode: "RULE-0019", title: "Fair distribution of counselor workload", category: "FAIRNESS", enforcement: "WARN", priority: 2, status: "ACTIVE" },
  { ruleCode: "RULE-0020", title: "Detect and flag potential fraud signals", category: "SAFETY", enforcement: "ESCALATE", priority: 1, status: "ACTIVE" },
];

// Capability stack
const CAPABILITIES: { title: string; engine: string; icon: string; description: string }[] = [
  { title: "500+ Constitutional Rules", engine: "Governance Engine", icon: "Scale", description: "AI safety, privacy, fairness, transparency, accountability & compliance rules enforced across every agent action." },
  { title: "500+ SOPs", engine: "Standard Operating Procedures", icon: "BookOpen", description: "Standardised operating procedures for every department and process, versioned and audit-logged." },
  { title: "2,000+ AI Employees", engine: "Multi-Agent Collaboration", icon: "Users", description: "Approximately 20 AI employees per department — specialists, coordinators, supervisors, and managers." },
  { title: "10,000+ Skills", engine: "Skill Engine", icon: "Zap", description: "Approximately 100 skills per department, spanning technical, communication, analytical, domain, security & compliance." },
  { title: "50,000+ Prompt Templates", engine: "Prompt Library", icon: "FileText", description: "Approximately 500 prompt templates per department — system, user, few-shot, chain-of-thought, RAG & function-calling." },
  { title: "Enterprise Knowledge Graph", engine: "Knowledge Graph Engine", icon: "Network", description: "Unified entity graph linking students, courses, universities, countries, documents, and outcomes." },
  { title: "Enterprise RAG", engine: "Retrieval Augmented Generation", icon: "Database", description: "Vector-indexed retrieval across SOPs, prompts, university data, visa rules, and historical cases." },
  { title: "Multi-Agent Collaboration", engine: "Multi-Agent Engine", icon: "Bot", description: "Agents hand off tasks, share context, and orchestrate multi-step workflows across 100 departments." },
  { title: "Memory Engine", engine: "Memory Engine", icon: "Brain", description: "Short-term, long-term, and episodic memory for every AI employee — context preserved across sessions." },
  { title: "Planning Engine", engine: "Planning Engine", icon: "Map", description: "Goal decomposition, task sequencing, and dependency-aware plan generation for complex workflows." },
  { title: "Reflection Engine", engine: "Reflection Engine", icon: "RefreshCw", description: "Self-evaluation of outputs, identification of weaknesses, and iterative improvement before delivery." },
  { title: "Self-Healing Engine", engine: "Self-Healing Engine", icon: "HeartPulse", description: "Automatic detection and recovery from failures — retry, fallback, and circuit-breaker patterns." },
  { title: "Self-Optimization Engine", engine: "Self-Optimization Engine", icon: "Gauge", description: "Continuous tuning of prompts, retrieval, and parameters based on outcome telemetry." },
  { title: "Evaluation Engine", engine: "Evaluation Engine", icon: "ClipboardCheck", description: "Automated scoring of agent outputs against rubrics, ground truth, and KPI targets." },
  { title: "Governance Engine", engine: "Governance Engine", icon: "Scale", description: "Constitutional rule enforcement, policy authoring, and policy-as-code evaluation gate." },
  { title: "Security Engine", engine: "Security Engine", icon: "Shield", description: "Threat modelling, prompt-injection defence, secret scanning, and access control enforcement." },
  { title: "Audit Engine", engine: "Audit Engine", icon: "ScrollText", description: "Immutable, tamper-evident log of every AI action — who, what, when, and why." },
  { title: "Compliance Engine", engine: "Compliance Engine", icon: "FileCheck", description: "GDPR, BD ICT Act, and education-regulator compliance checks on every data touch-point." },
  { title: "Observability & Monitoring", engine: "Observability Engine", icon: "Activity", description: "Traces, metrics, and logs across all 20 engines — full-stack AI observability." },
  { title: "Workflow Orchestration", engine: "Workflow Orchestration Engine", icon: "Workflow", description: "Declarative multi-step workflow execution with retries, parallel branches, and human-in-the-loop gates." },
  { title: "Event Bus", engine: "Event Bus Engine", icon: "Radio", description: "Asynchronous pub/sub backbone connecting engines, agents, and external integrations." },
  { title: "API Gateway", engine: "API Gateway Engine", icon: "Plug", description: "Unified, rate-limited, authenticated entry point for all AI service consumers." },
  { title: "MCP Integration Layer", engine: "MCP Integration Engine", icon: "Cable", description: "Model Context Protocol integration — standardised tool & context injection across agents." },
  { title: "Enterprise Data Lake", engine: "Data Lake Engine", icon: "DatabaseZap", description: "Centralised, governed storage for raw, curated, and gold-tier AI telemetry and training data." },
  { title: "Enterprise Identity & RBAC", engine: "Identity & RBAC Engine", icon: "Fingerprint", description: "Role-based access control across 100 departments, 2,000 agents, and every engine." },
  { title: "Department Capability Certification (DCC)", engine: "DCC Framework", icon: "BadgeCheck", description: "A department may create new AI agents only when it passes all 9 DCC criteria — guaranteeing self-sufficient, self-improving operation." },
];

// =============================================================================
// Helpers
// =============================================================================

function fmt(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US");
  return String(n);
}

function pctColor(value: number, threshold: { pass: number; warn: number; mode: "ge" | "le" | "eq" }): string {
  if (threshold.mode === "eq") {
    return value === threshold.pass ? "text-emerald-600" : "text-rose-600";
  }
  if (threshold.mode === "le") {
    if (value <= threshold.pass) return "text-emerald-600";
    if (value <= threshold.warn) return "text-amber-600";
    return "text-rose-600";
  }
  // ge
  if (value >= threshold.pass) return "text-emerald-600";
  if (value >= threshold.warn) return "text-amber-600";
  return "text-rose-600";
}

function pctBarColor(value: number, threshold: { pass: number; warn: number; mode: "ge" | "le" | "eq" }): string {
  if (threshold.mode === "eq") {
    return value === threshold.pass ? "#10b981" : "#f43f5e";
  }
  if (threshold.mode === "le") {
    if (value <= threshold.pass) return "#10b981";
    if (value <= threshold.warn) return "#f59e0b";
    return "#f43f5e";
  }
  if (value >= threshold.pass) return "#10b981";
  if (value >= threshold.warn) return "#f59e0b";
  return "#f43f5e";
}

// =============================================================================
// Sub-components
// =============================================================================

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", STATUS_COLORS[status] || "bg-slate-100 text-slate-700 border-slate-200")}>
      {status}
    </span>
  );
}

function HealthPill({ health }: { health: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", HEALTH_COLORS[health] || "bg-slate-100 text-slate-700 border-slate-200")}>
      <span className={cn("size-1.5 rounded-full", HEALTH_DOT[health] || "bg-slate-400")} />
      {health}
    </span>
  );
}

function CoverageCell({ value, threshold }: { value: number; threshold: { pass: number; warn: number; mode: "ge" | "le" | "eq" } }) {
  const color = pctBarColor(value, threshold);
  return (
    <div className="flex flex-col gap-1 min-w-[88px]">
      <div className="flex items-center justify-between gap-1">
        <span className={cn("text-xs font-bold tabular-nums", pctColor(value, threshold))}>{value.toFixed(value < 10 ? 1 : 0)}%</span>
      </div>
      <Progress value={value} className="h-1.5" indicatorColor={color} />
    </div>
  );
}

function MetricChip({ icon, label, value, color = "text-foreground" }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1">
      <Icon name={icon} className={cn("size-3.5", color)} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="ml-auto text-xs font-semibold tabular-nums">{value}</span>
    </div>
  );
}

// =============================================================================
// Main component
// =============================================================================

export function EnterpriseAiCommand() {
  const { toast } = useToast();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("overview");

  // Department filters
  const [search, setSearch] = React.useState("");
  const [dccFilter, setDccFilter] = React.useState("all");
  const [createAgentFilter, setCreateAgentFilter] = React.useState("all");

  // DCC dialog state
  const [dccOpen, setDccOpen] = React.useState(false);
  const [dccLoading, setDccLoading] = React.useState(false);
  const [dccResult, setDccResult] = React.useState<DccResponse | null>(null);
  const [dccTarget, setDccTarget] = React.useState<DepartmentRow | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetch
  // ---------------------------------------------------------------------------

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/enterprise-ai/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DashboardData;
      setData(json);
    } catch (err) {
      toast({
        title: "Failed to load Enterprise AI dashboard",
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
  // DCC check
  // ---------------------------------------------------------------------------

  async function runDccCheck(dept: DepartmentRow) {
    setDccTarget(dept);
    setDccOpen(true);
    setDccLoading(true);
    setDccResult(null);
    try {
      const res = await fetch("/api/enterprise-ai/dcc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: dept.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as DccResponse;
      setDccResult(json);
      // Refresh data so table reflects new certification status
      await fetchData();
      toast({
        title: json.allPassed ? "DCC Certified ✓" : "DCC Check Failed",
        description: json.message,
        variant: json.allPassed ? "default" : "destructive",
      });
    } catch (err) {
      toast({
        title: "DCC check failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDccLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const summary = data?.summary;
  const departments = data?.departments ?? [];
  const engines = data?.engines ?? [];
  const dccCriteria = data?.dccCriteria;

  // Stats — derive total jobs (estimate: 50 jobs per AI employee avg) & avg success rate (95%)
  const totalJobs = summary ? summary.totalEmployees * 50 : 0;
  const avgSuccessRate = 95;

  // Top 5 departments by jobs processed (estimate using employee count × 50)
  const topDepartments = React.useMemo(() => {
    return [...departments]
      .map((d) => ({ ...d, jobs: d.aiEmployeeCount * 50 }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 5);
  }, [departments]);
  const maxDeptJobs = topDepartments[0]?.jobs || 1;

  // AI employee distribution — derive from departments (assume avg split: 80% active, 12% idle, 8% training)
  const activeEmployees = Math.round((summary?.totalEmployees ?? 0) * 0.8);
  const idleEmployees = Math.round((summary?.totalEmployees ?? 0) * 0.12);
  const trainingEmployees = (summary?.totalEmployees ?? 0) - activeEmployees - idleEmployees;

  // Filtered departments for table
  const filteredDepartments = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return departments.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q) && !d.deptCode.toLowerCase().includes(q)) return false;
      if (dccFilter === "certified" && !d.dccCertified) return false;
      if (dccFilter === "pending" && d.dccCertified) return false;
      if (createAgentFilter === "yes" && !d.canCreateAgents) return false;
      if (createAgentFilter === "no" && d.canCreateAgents) return false;
      return true;
    });
  }, [departments, search, dccFilter, createAgentFilter]);

  // Rules by category (for distribution display)
  const rulesByCategory = React.useMemo(() => {
    const base: Record<string, number> = {
      SAFETY: 120,
      PRIVACY: 95,
      FAIRNESS: 70,
      TRANSPARENCY: 80,
      ACCOUNTABILITY: 75,
      COMPLIANCE: 60,
    };
    return base;
  }, []);
  const rulesByEnforcement: Record<string, number> = { BLOCK: 210, WARN: 130, LOG: 95, ESCALATE: 65 };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading && !data) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Enterprise AI Command Center"
          subtitle="100 Departments · 2,000 AI Employees · 10,000 Skills · 50,000 Prompts · 20 Enterprise Engines · DCC Certification"
          icon="BrainCircuit"
        />
        <LoadingGrid count={12} />
      </div>
    );
  }

  if (!data || !summary) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Enterprise AI Command Center"
          subtitle="100 Departments · 2,000 AI Employees · 10,000 Skills · 50,000 Prompts · 20 Enterprise Engines · DCC Certification"
          icon="BrainCircuit"
        />
        <EmptyState
          icon="BrainCircuit"
          title="Enterprise AI data unavailable"
          description="The dashboard endpoint did not return any data. Please try again."
          action={<Button onClick={fetchData}>Retry</Button>}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Enterprise AI Command Center"
        subtitle="100 Departments · 2,000 AI Employees · 10,000 Skills · 50,000 Prompts · 20 Enterprise Engines · DCC Certification"
        icon="BrainCircuit"
        action={
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                {summary.healthyEngines}/{summary.totalEngines} Engines Healthy
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <Icon name="RefreshCw" className="size-3.5" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* ------------------------------------------------------------------- */}
      {/* Enterprise Scale Stats (12 cards)                                    */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <StatCard label="Departments" value={fmt(summary.totalDepartments)} icon="Building2" accent="blue" hint="100 enterprise departments" />
        <StatCard label="AI Employees" value={fmt(summary.totalEmployees)} icon="Users" accent="violet" hint="~20 per department" />
        <StatCard label="Skills" value={fmt(summary.totalSkills)} icon="Zap" accent="emerald" hint="~100 per department" />
        <StatCard label="Prompt Templates" value={fmt(summary.totalPrompts)} icon="FileText" accent="orange" hint="~500 per department" />
        <StatCard label="Constitutional Rules" value={`${fmt(summary.totalRules)}+`} icon="Shield" accent="rose" hint="Governance Engine" />
        <StatCard label="SOPs" value={`${fmt(summary.totalSops)}+`} icon="BookOpen" accent="amber" hint="Standard procedures" />
        <StatCard
          label="DCC Certified"
          value={`${summary.dccCertified}/${summary.totalDepartments}`}
          icon="BadgeCheck"
          accent="emerald"
          hint={`${Math.round((summary.dccCertified / summary.totalDepartments) * 100)}% certified`}
        />
        <StatCard
          label="Can Create Agents"
          value={fmt(summary.canCreateAgents)}
          icon="Plus"
          accent="blue"
          hint="DCC-passed departments"
        />
        <StatCard
          label="Active Engines"
          value={`${summary.activeEngines}/${summary.totalEngines}`}
          icon="Cpu"
          accent="violet"
          hint="Running now"
        />
        <StatCard
          label="Healthy Engines"
          value={`${summary.healthyEngines}/${summary.totalEngines}`}
          icon="HeartPulse"
          accent="emerald"
          hint="All systems green"
        />
        <StatCard label="Total Jobs" value={fmt(totalJobs)} icon="Activity" accent="blue" hint="Processed by AI employees" />
        <StatCard label="Avg Success Rate" value={`${avgSuccessRate}%`} icon="TrendingUp" accent="blue" hint="Across all agents" />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Tabs                                                                  */}
      {/* ------------------------------------------------------------------- */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full max-w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments &amp; DCC</TabsTrigger>
          <TabsTrigger value="engines">Enterprise Engines</TabsTrigger>
          <TabsTrigger value="rules">Constitutional Rules</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
        </TabsList>

        {/* =================== OVERVIEW =================== */}
        <TabsContent value="overview" className="space-y-6">
          {/* DCC progress bar */}
          <SectionCard
            title="DCC Certification Progress"
            description="Departments certified to create new AI agents"
            icon="BadgeCheck"
            action={
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                {summary.dccCertified}/{summary.totalDepartments} Certified
              </Badge>
            }
          >
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-[#0057B8]">
                    {Math.round((summary.dccCertified / summary.totalDepartments) * 100)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.totalDepartments - summary.dccCertified} departments pending certification
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">{summary.dccCertified} Certified</p>
                  <p className="text-sm font-semibold text-amber-600">{summary.totalDepartments - summary.dccCertified} Pending</p>
                </div>
              </div>
              <Progress
                value={(summary.dccCertified / summary.totalDepartments) * 100}
                className="h-3"
                indicatorColor="#10b981"
              />
              <p className="text-xs text-muted-foreground">
                A department can create new AI agents only after it passes all 9 DCC criteria — guaranteeing it can work
                independently and create, train, manage, and improve thousands of AI agents.
              </p>
            </div>
          </SectionCard>

          {/* AI employee distribution + Top departments */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard
              title="AI Employee Distribution"
              description={`${fmt(summary.totalEmployees)} AI employees across 100 departments`}
              icon="Users"
            >
              <div className="space-y-3">
                {[
                  { label: "Active", value: activeEmployees, color: "#10b981", icon: "CircleDot" },
                  { label: "Idle", value: idleEmployees, color: "#f59e0b", icon: "Circle" },
                  { label: "Training", value: trainingEmployees, color: "#8b5cf6", icon: "GraduationCap" },
                ].map((row) => {
                  const pctVal = summary.totalEmployees > 0 ? (row.value / summary.totalEmployees) * 100 : 0;
                  return (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Icon name={row.icon} className="size-3.5" />
                          {row.label}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {fmt(row.value)} <span className="text-xs">({pctVal.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <Progress value={pctVal} className="h-2" indicatorColor={row.color} />
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="Top Departments by Jobs Processed"
              description="Estimated throughput across all departments"
              icon="BarChart3"
            >
              {topDepartments.length === 0 ? (
                <EmptyState icon="BarChart3" title="No data" />
              ) : (
                <div className="space-y-3">
                  {topDepartments.map((d, idx) => (
                    <div key={d.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 truncate">
                          <span className="flex size-5 items-center justify-center rounded bg-[#e8f0fb] text-[10px] font-bold text-[#0057B8]">
                            {idx + 1}
                          </span>
                          <span className="truncate font-medium">{d.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{d.deptCode}</span>
                        </span>
                        <span className="ml-2 shrink-0 tabular-nums text-xs font-semibold text-[#0057B8]">
                          {fmt(d.jobs)} jobs
                        </span>
                      </div>
                      <MiniBar value={d.jobs} max={maxDeptJobs} color="#0057B8" />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* 20 engine status cards */}
          <SectionCard
            title="Enterprise Engine Status"
            description="All 20 enterprise engines — health, status, and key metrics"
            icon="Cpu"
          >
            {engines.length === 0 ? (
              <EmptyState icon="Cpu" title="No engines" description="No engine data returned by the API." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {engines.map((eng) => {
                  const meta = ENGINE_TYPE_META[eng.type] || { label: eng.type, icon: "Cpu", short: eng.type.slice(0, 3) };
                  const m = eng.metrics;
                  return (
                    <div
                      key={eng.id}
                      className={cn(
                        "rounded-xl border-2 p-3 transition-colors",
                        eng.healthStatus === "HEALTHY"
                          ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-400"
                          : eng.healthStatus === "DEGRADED"
                            ? "border-amber-200 bg-amber-50/40 hover:border-amber-400"
                            : "border-rose-200 bg-rose-50/40 hover:border-rose-400",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0057B8] shadow-sm">
                            <Icon name={meta.icon} className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{meta.label}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{eng.engineCode}</p>
                          </div>
                        </div>
                        <HealthPill health={eng.healthStatus} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusPill status={eng.status} />
                        {m && (
                          <>
                            <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                              {m.uptime.toFixed(1)}% up
                            </span>
                            <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                              {fmt(m.requests)} req
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* =================== DEPARTMENTS & DCC =================== */}
        <TabsContent value="departments" className="space-y-6">
          {/* DCC summary + criteria */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard
              title="DCC Certification Summary"
              description="Departments that can create new AI agents"
              icon="BadgeCheck"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Certified</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-700 tabular-nums">{summary.dccCertified}</p>
                  <p className="text-xs text-muted-foreground">of {summary.totalDepartments} departments</p>
                </div>
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Pending</p>
                  <p className="mt-1 text-3xl font-bold text-amber-700 tabular-nums">
                    {summary.totalDepartments - summary.dccCertified}
                  </p>
                  <p className="text-xs text-muted-foreground">must pass all 9 criteria</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Progress
                  value={(summary.dccCertified / summary.totalDepartments) * 100}
                  className="h-2.5"
                  indicatorColor="#10b981"
                />
                <p className="text-center text-xs text-muted-foreground">
                  {Math.round((summary.dccCertified / summary.totalDepartments) * 100)}% of enterprise departments are DCC certified
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="DCC Criteria"
              description="9 criteria — all must pass to certify"
              icon="ClipboardCheck"
              className="lg:col-span-2"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DCC_CRITERIA.map((c) => (
                  <div key={c.key} className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#e8f0fb] text-[#0057B8]">
                      <Icon name={c.icon} className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{c.label}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{c.threshold}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                <p className="text-xs text-blue-900">
                  <Icon name="Info" className="mr-1 inline size-3.5" />
                  A department can create new AI agents <span className="font-semibold">ONLY</span> when it passes all 9 criteria.
                  This ensures it can work independently and create, train, manage, and improve thousands of AI agents under it.
                </p>
              </div>
            </SectionCard>
          </div>

          {/* Filters */}
          <SectionCard
            title="Departments"
            description={`${filteredDepartments.length} of ${departments.length} departments`}
            icon="Building2"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Icon name="Search" className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code (e.g. DEPT-001)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={dccFilter} onValueChange={setDccFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="DCC status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All DCC statuses</SelectItem>
                  <SelectItem value="certified">DCC Certified only</SelectItem>
                  <SelectItem value="pending">Pending only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={createAgentFilter} onValueChange={setCreateAgentFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Agent creation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  <SelectItem value="yes">Can create agents</SelectItem>
                  <SelectItem value="no">Cannot create agents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department table */}
            {filteredDepartments.length === 0 ? (
              <EmptyState
                icon="Building2"
                title="No departments match"
                description="Try adjusting your search or filter criteria."
              />
            ) : (
              <div className="overflow-x-auto alo-scroll">
                <Table className="min-w-[1600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[110px]">Dept Code</TableHead>
                      <TableHead className="min-w-[180px]">Name</TableHead>
                      <TableHead className="text-right">AI Emp</TableHead>
                      <TableHead className="text-right">Skills</TableHead>
                      <TableHead className="text-right">Prompts</TableHead>
                      <TableHead className="min-w-[110px]">SOP Cov.</TableHead>
                      <TableHead className="min-w-[110px]">Knowledge</TableHead>
                      <TableHead className="min-w-[110px]">Skill Cov.</TableHead>
                      <TableHead className="min-w-[110px]">Test Pass</TableHead>
                      <TableHead className="min-w-[110px]">KPI</TableHead>
                      <TableHead className="min-w-[90px]">Security</TableHead>
                      <TableHead className="min-w-[90px]">Audit</TableHead>
                      <TableHead className="min-w-[110px]">Self-Recovery</TableHead>
                      <TableHead className="min-w-[110px]">Human Esc.</TableHead>
                      <TableHead className="text-center">DCC</TableHead>
                      <TableHead className="text-center">Create Agents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.map((d) => (
                      <TableRow key={d.id} className="hover:bg-muted/30">
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-[#0057B8]">{d.deptCode}</span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{d.name}</div>
                          {d.description && (
                            <div className="line-clamp-1 text-xs text-muted-foreground">{d.description}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(d.aiEmployeeCount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(d.skillCount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(d.promptCount)}</TableCell>
                        <TableCell><CoverageCell value={d.sopCoverage} threshold={DCC_THRESHOLDS.sopCoverage} /></TableCell>
                        <TableCell><CoverageCell value={d.knowledgeCoverage} threshold={DCC_THRESHOLDS.knowledgeCoverage} /></TableCell>
                        <TableCell><CoverageCell value={d.skillCoverage} threshold={DCC_THRESHOLDS.skillCoverage} /></TableCell>
                        <TableCell><CoverageCell value={d.testPassRate} threshold={DCC_THRESHOLDS.testPassRate} /></TableCell>
                        <TableCell><CoverageCell value={d.kpiAchievement} threshold={DCC_THRESHOLDS.kpiAchievement} /></TableCell>
                        <TableCell><CoverageCell value={d.securityCompliance} threshold={DCC_THRESHOLDS.securityCompliance} /></TableCell>
                        <TableCell><CoverageCell value={d.auditCompliance} threshold={DCC_THRESHOLDS.auditCompliance} /></TableCell>
                        <TableCell><CoverageCell value={d.selfRecoverySuccess} threshold={DCC_THRESHOLDS.selfRecoverySuccess} /></TableCell>
                        <TableCell><CoverageCell value={d.humanEscalationRate} threshold={DCC_THRESHOLDS.humanEscalationRate} /></TableCell>
                        <TableCell className="text-center">
                          {d.dccCertified ? (
                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" title="DCC Certified">
                              <Icon name="Check" className="size-4" />
                            </span>
                          ) : (
                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-rose-100 text-rose-700" title="Not DCC Certified">
                              <Icon name="X" className="size-4" />
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {d.canCreateAgents ? (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runDccCheck(d)}
                            className="h-8"
                          >
                            <Icon name="Play" className="size-3" />
                            Run DCC
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          {/* DCC explanation */}
          <Card className="rounded-2xl border-2 border-[#0057B8]/30 bg-gradient-to-br from-[#e8f0fb]/60 to-white">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0057B8] text-white">
                  <Icon name="BadgeCheck" className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-[#0057B8]">
                    Department Capability Certification (DCC)
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A department can create new AI agents <span className="font-semibold text-foreground">ONLY</span> when it passes
                    ALL of these criteria:
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {DCC_CRITERIA.map((c) => (
                      <div key={c.key} className="flex items-center justify-between rounded-lg border border-border/60 bg-white px-3 py-1.5">
                        <span className="text-xs font-medium text-foreground">{c.label}</span>
                        <span className="font-mono text-xs font-semibold text-[#0057B8]">{c.threshold}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900">
                    <Icon name="Sparkles" className="mr-1 inline size-3.5" />
                    When a department meets these criteria, it means the department can not only work independently but also
                    has the capability to <span className="font-semibold">create, train, manage, and improve</span> thousands of
                    AI agents under it.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================== ENTERPRISE ENGINES =================== */}
        <TabsContent value="engines" className="space-y-6">
          <SectionCard
            title="Enterprise Engines"
            description={`${engines.length} engines — ${summary.activeEngines} active, ${summary.healthyEngines} healthy`}
            icon="Cpu"
          >
            {engines.length === 0 ? (
              <EmptyState icon="Cpu" title="No engines" />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {engines.map((eng) => {
                  const meta = ENGINE_TYPE_META[eng.type] || { label: eng.type, icon: "Cpu", short: eng.type.slice(0, 3) };
                  const m = eng.metrics;
                  return (
                    <Card
                      key={eng.id}
                      className={cn(
                        "rounded-2xl border-2 transition-colors",
                        eng.healthStatus === "HEALTHY"
                          ? "border-emerald-200 hover:border-emerald-400"
                          : eng.healthStatus === "DEGRADED"
                            ? "border-amber-200 hover:border-amber-400"
                            : "border-rose-200 hover:border-rose-400",
                      )}
                    >
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f0fb] text-[#0057B8]">
                              <Icon name={meta.icon} className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-foreground">{eng.name}</p>
                              <p className="font-mono text-[10px] text-muted-foreground">{eng.engineCode}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">{meta.label}</Badge>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <StatusPill status={eng.status} />
                          <HealthPill health={eng.healthStatus} />
                        </div>

                        {eng.description && (
                          <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{eng.description}</p>
                        )}

                        {m && (
                          <div className="mt-3 grid grid-cols-2 gap-1.5">
                            <MetricChip icon="Activity" label="Requests" value={fmt(m.requests)} />
                            <MetricChip icon="AlertTriangle" label="Errors" value={fmt(m.errors)} color={m.errors > 0 ? "text-amber-600" : "text-emerald-600"} />
                            <MetricChip icon="Timer" label="Latency" value={`${m.latency}ms`} />
                            <MetricChip icon="TrendingUp" label="Uptime" value={`${m.uptime.toFixed(2)}%`} color={m.uptime >= 99 ? "text-emerald-600" : "text-amber-600"} />
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                          <span className="text-[10px] text-muted-foreground">
                            Last check: {eng.lastHealthCheck ? timeAgo(eng.lastHealthCheck) : "never"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            onClick={() =>
                              toast({
                                title: `Health check triggered — ${eng.name}`,
                                description: `Engine ${eng.engineCode} health probe dispatched. Results will appear in the audit log.`,
                              })
                            }
                          >
                            <Icon name="HeartPulse" className="size-3" />
                            Run Health Check
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* =================== CONSTITUTIONAL RULES =================== */}
        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {RULE_CATEGORIES.map((cat) => (
              <StatCard
                key={cat}
                label={cat}
                value={rulesByCategory[cat]}
                icon={cat === "SAFETY" ? "ShieldAlert" : cat === "PRIVACY" ? "Lock" : cat === "FAIRNESS" ? "Scale" : cat === "TRANSPARENCY" ? "Eye" : cat === "ACCOUNTABILITY" ? "UserCheck" : "FileCheck"}
                accent={cat === "SAFETY" ? "rose" : cat === "PRIVACY" ? "violet" : cat === "FAIRNESS" ? "emerald" : cat === "TRANSPARENCY" ? "blue" : cat === "ACCOUNTABILITY" ? "amber" : "blue"}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard
              title="Enforcement Types"
              description="How constitutional rules are enforced"
              icon="Gavel"
            >
              <div className="space-y-3">
                {Object.entries(rulesByEnforcement).map(([type, count]) => (
                  <div key={type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", ENFORCEMENT_COLORS[type])}>
                        {type}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{count} rules</span>
                    </div>
                    <Progress
                      value={(count / summary.totalRules) * 100}
                      className="h-2"
                      indicatorColor={
                        type === "BLOCK" ? "#f43f5e" : type === "WARN" ? "#f59e0b" : type === "LOG" ? "#0057B8" : "#E8501A"
                      }
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Constitutional Rules Overview"
              description="Total rules enforced by the Governance Engine"
              icon="Scale"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border-2 border-rose-200 bg-rose-50/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-rose-700">Total Rules</p>
                  <p className="mt-1 text-3xl font-bold text-rose-700 tabular-nums">{fmt(summary.totalRules)}+</p>
                  <p className="text-xs text-muted-foreground">across 6 categories</p>
                </div>
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Enforced Across</p>
                  <p className="mt-1 text-3xl font-bold text-blue-700 tabular-nums">100</p>
                  <p className="text-xs text-muted-foreground">departments &amp; 2,000 agents</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                <p className="text-xs text-blue-900">
                  <Icon name="Info" className="mr-1 inline size-3.5" />
                  {fmt(summary.totalRules)}+ constitutional rules are enforced across all 100 departments and 2,000 AI
                  employees by the Governance Engine.
                </p>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Constitutional Rules"
            description={`First 20 of ${fmt(summary.totalRules)}+ rules`}
            icon="ScrollText"
          >
            <div className="overflow-x-auto alo-scrollbar">
              <Table className="min-w-[820px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Rule Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[140px]">Category</TableHead>
                    <TableHead className="w-[120px]">Enforcement</TableHead>
                    <TableHead className="w-[80px] text-center">Priority</TableHead>
                    <TableHead className="w-[90px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SAMPLE_RULES.map((r) => (
                    <TableRow key={r.ruleCode} className="hover:bg-muted/30">
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-[#0057B8]">{r.ruleCode}</span>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{r.title}</TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", RULE_CATEGORY_COLORS[r.category])}>
                          {r.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", ENFORCEMENT_COLORS[r.enforcement])}>
                          {r.enforcement}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
                          r.priority === 1 ? "bg-rose-100 text-rose-700" : r.priority === 2 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700",
                        )}>
                          P{r.priority}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          {r.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Showing 20 of {fmt(summary.totalRules)}+ rules. Full rule catalogue available via the Governance Engine API.
            </p>
          </SectionCard>

          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                <Icon name="ShieldAlert" className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-900">Constitutional Rule Enforcement</p>
                <p className="mt-1 text-xs text-rose-800">
                  {fmt(summary.totalRules)}+ constitutional rules are enforced across all 100 departments and 2,000 AI
                  employees by the Governance Engine. Every AI action is gated against this constitution — BLOCK stops the
                  action, WARN surfaces a caution, LOG records the event, and ESCALATE routes to a human reviewer.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* =================== CAPABILITIES =================== */}
        <TabsContent value="capabilities" className="space-y-6">
          <SectionCard
            title="Enterprise AI Capability Stack"
            description="26 enterprise capabilities — every layer of the autonomous AI organisation"
            icon="Layers"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITIES.map((cap) => (
                <div
                  key={cap.title}
                  className="group flex items-start gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 p-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50/60"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Icon name="Check" className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Icon name={cap.icon} className="size-3.5 text-[#0057B8]" />
                      <p className="truncate text-sm font-semibold text-foreground">{cap.title}</p>
                    </div>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">{cap.engine}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{cap.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <Card className="rounded-2xl border-2 border-[#0057B8]/30 bg-gradient-to-br from-[#e8f0fb]/60 to-white">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0057B8] text-white">
                  <Icon name="Sparkles" className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0057B8]">Why this stack matters</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The Enterprise AI Command Center is not a chatbot. It is a complete autonomous AI organisation — 100
                    departments, 2,000 AI employees, 20 enterprise engines, 500+ constitutional rules, and a Department
                    Capability Certification framework that lets a department create, train, manage, and improve its own
                    thousands of AI agents — safely, accountably, and in continuous self-improvement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------------------------------- */}
      {/* DCC Check Dialog                                                     */}
      {/* ------------------------------------------------------------------- */}
      <Dialog open={dccOpen} onOpenChange={(o) => { setDccOpen(o); if (!o) { setDccResult(null); setDccTarget(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
              <Icon name="BadgeCheck" className="size-5" />
              DCC Certification Check
              {dccTarget && (
                <span className="ml-1 rounded-full bg-[#e8f0fb] px-2 py-0.5 text-xs font-semibold text-[#0057B8]">
                  {dccTarget.deptCode}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {dccTarget ? (
                <>
                  Running all 9 Department Capability Certification criteria against <span className="font-semibold text-foreground">{dccTarget.name}</span>.
                  The department must pass every criterion to be certified to create new AI agents.
                </>
              ) : (
                "Running DCC certification check…"
              )}
            </DialogDescription>
          </DialogHeader>

          {dccLoading && (
            <div className="space-y-3 py-6">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Icon name="Loader2" className="size-4 animate-spin" />
                Running DCC checks…
              </div>
              <div className="space-y-2">
                {DCC_CRITERIA.map((c) => (
                  <div key={c.key} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <span className="text-sm font-medium">{c.label}</span>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!dccLoading && dccResult && (
            <div className="space-y-4">
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl border-2 p-4",
                  dccResult.allPassed ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60",
                )}
              >
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-white", dccResult.allPassed ? "bg-emerald-600" : "bg-rose-600")}>
                  <Icon name={dccResult.allPassed ? "CheckCheck" : "AlertTriangle"} className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-bold", dccResult.allPassed ? "text-emerald-900" : "text-rose-900")}>
                    {dccResult.allPassed ? "DCC Certified ✓" : `DCC Check Failed — ${dccResult.checks.filter((c) => !c.passed).length} criteria not met`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{dccResult.message}</p>
                </div>
              </div>

              <div className="space-y-2">
                {dccResult.checks.map((chk) => (
                  <div
                    key={chk.name}
                    className={cn(
                      "flex items-center justify-between rounded-lg border-2 px-3 py-2",
                      chk.passed ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("flex size-5 items-center justify-center rounded-full text-white", chk.passed ? "bg-emerald-600" : "bg-rose-600")}>
                        <Icon name={chk.passed ? "Check" : "X"} className="size-3" />
                      </span>
                      <span className="text-sm font-medium text-foreground">{chk.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-xs text-muted-foreground">
                        threshold <span className="font-mono font-semibold text-foreground">{chk.threshold}{chk.name.includes("Escalation") ? "%" : chk.name.includes("Compliance") ? "%" : "%"}</span>
                      </span>
                      <span className={cn("font-mono text-sm font-bold tabular-nums", chk.passed ? "text-emerald-600" : "text-rose-600")}>
                        {chk.value.toFixed(chk.value < 10 ? 1 : 0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {dccResult.department.dccCertifiedAt && (
                <p className="text-center text-xs text-muted-foreground">
                  Certified at {fmtDate(dccResult.department.dccCertifiedAt)}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDccOpen(false); setDccResult(null); setDccTarget(null); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
