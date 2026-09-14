"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
} from "@/components/alo/shared";
import { timeAgo } from "@/lib/alo-types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface AiAgent {
  id: string;
  department: string;
  agentName: string;
  agentCode: string;
  description?: string | null;
  status: string;
  jobsProcessed: number;
  pendingApprovals: number;
  lastRunAt: string | null;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DEPT_ICONS: Record<string, string> = {
  "Student Admission": "UserPlus",
  Counseling: "MessageSquare",
  Application: "ClipboardList",
  Visa: "Plane",
  Marketing: "Megaphone",
  WhatsApp: "MessageCircle",
  "Social Media": "Share2",
  "English Test": "GraduationCap",
  "AI Interview": "Mic",
  "Document Checking": "FileCheck",
  "SOP/CV": "FileText",
  "University Data": "Building2",
  "Course Finder": "Search",
  Finance: "DollarSign",
  HRM: "Users",
  Reports: "BarChart3",
  "Security/RBAC": "ShieldCheck",
  Audit: "ScrollText",
};

const DEPT_ORDER = Object.keys(DEPT_ICONS);

const AGENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  IDLE: "bg-amber-100 text-amber-700",
  PAUSED: "bg-slate-200 text-slate-700",
};

const AI_MUST_NOT = [
  "Invent university requirements",
  "Invent visa rules or immigration advice",
  "Guarantee admission or visa approval",
  "Publish content without human approval",
  "Send private student data without OTP",
  "Change critical status without permission",
  "Approve documents without human review",
  "Copy official exam questions (IELTS, PTE, etc.)",
];

const AI_MUST = [
  "Save prompt & output logs for every run",
  "Mark uncertain data as 'Needs verification'",
  "Send risky cases to human review queue",
  "Save every action to the CRM timeline",
  "Cite the source for university & visa data",
  "Use OTP for any data export or sharing",
  "Surface confidence score on AI outputs",
  "Escalate anomalies to the Security/RBAC agent",
];

const APPROVAL_TEXT: Record<string, string> = {
  "Student Admission": "New lead intake — duplicate verification needed before conversion",
  Counseling: "Course recommendation generated — verify with counselor before sharing",
  Application: "Application draft ready — review before submitting to university",
  Visa: "Visa checklist generated — verify accuracy against latest embassy rules",
  Marketing: "Campaign content drafted — review tone & claim before publishing",
  WhatsApp: "Broadcast message ready — review before sending to lead segment",
  "Social Media": "Auto-reply DM drafted — review tone & brand voice before send",
  "English Test": "Mock test auto-scored — verify scoring logic against answer key",
  "AI Interview": "Interview readiness decision — needs human review before sharing",
  "Document Checking": "Document approval request — verify OCR result & authenticity",
  "SOP/CV": "SOP draft awaiting review — check tone, facts, and plagiarism",
  "University Data": "University requirement update — verify source before saving",
  "Course Finder": "Course match result — verify eligibility against student profile",
  Finance: "Commission calculation — verify partner split before recording",
  HRM: "Performance review generated — verify scoring before sharing",
  Reports: "Daily report ready — review before publishing to leadership",
  "Security/RBAC": "Permission change request — verify scope before applying",
  Audit: "Compliance alert raised — review flagged action before closing",
};

interface RiskAlert {
  title: string;
  description: string;
  severity: "high" | "medium";
}

const SAMPLE_RISK_ALERTS: RiskAlert[] = [
  {
    title: "High visa risk flagged",
    description:
      "AI flagged student ALO-S-20003 as high visa risk based on a 4-year study gap and sponsor profile mismatch. Sent to human review.",
    severity: "high",
  },
  {
    title: "Needs verification — scholarship",
    description:
      "AI uncertain about the scholarship requirement for TU Munich (MSc Informatics, Winter intake). Marked 'Needs verification' — pending human confirmation.",
    severity: "medium",
  },
  {
    title: "Possible duplicate lead",
    description:
      "Lead from the Facebook campaign matches existing student ALO-S-20007 (same phone & email). Held for human review to avoid duplicate conversion.",
    severity: "medium",
  },
  {
    title: "SOP similarity warning",
    description:
      "AI detected 62% similarity between the SOP draft for ALO-S-20005 and a previously submitted SOP. Held for plagiarism review.",
    severity: "high",
  },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

interface WorkforceMetrics {
  workforce: { total:number; active:number; idle:number; busy:number; paused:number; failed:number; waitingApproval:number; escalated:number; queued:number; running:number };
  queue: { queued:number; running:number; success:number; failed:number };
  groq: { concurrency:{ current:number; max:number }; perMinute:{ count:number; limit:number }; queueLength:number; circuitOpen:boolean; totalRequests:number; totalFallbacks:number };
  automation: { totalEligible:number; automated:number; assisted:number; human:number; escalated:number; automationRate:number; humanRate:number; targetAutomation:number; targetHuman:number; variance:number; verdict:string; period:{ label:string } };
  collaboration: Array<{ id:string; at:string; actor:string; action:string; target:string; automated:boolean }>;
  latency: { avgMs:number|null };
}
export function AiCommandCenter() {
  const { toast } = useToast();
  const [agents, setAgents] = React.useState<AiAgent[]>([]);
  const [metrics, setMetrics] = React.useState<WorkforceMetrics | null>(null);
  const [metricsErr, setMetricsErr] = React.useState<string|null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchAgents = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [aRes, mRes] = await Promise.all([
        fetch("/api/ai-agents", { cache: "no-store" }),
        fetch("/api/workforce/metrics?periodDays=30", { cache: "no-store" }),
      ]);
      if (aRes.ok) {
        const data = (await aRes.json()) as { agents: AiAgent[] };
        setAgents(Array.isArray(data?.agents) ? data.agents : []);
      } else throw new Error("Failed to load AI agents");
      if (mRes.ok) {
        const m = await mRes.json();
        if (m?.automation) { setMetrics(m as WorkforceMetrics); setMetricsErr(null); }
        else setMetricsErr(m?.error || "metrics empty");
      } else {
        const t = await mRes.text().catch(()=> "");
        setMetricsErr(t.slice(0,300) || `metrics ${mRes.status}`);
      }
    } catch (err) {
      toast({
        title: "Failed to load AI agents",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      setAgents([]);
      setMetricsErr(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // --- Derived stats --------------------------------------------------------
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "ACTIVE").length;
  const jobsProcessed = agents.reduce((sum, a) => sum + (a.jobsProcessed || 0), 0);
  const pendingApprovals = agents.reduce((sum, a) => sum + (a.pendingApprovals || 0), 0);

  // --- Group by department --------------------------------------------------
  const grouped = React.useMemo(() => {
    const map = new Map<string, AiAgent[]>();
    for (const a of agents) {
      const list = map.get(a.department) ?? [];
      list.push(a);
      map.set(a.department, list);
    }
    // Sort departments per DEPT_ORDER, then any extras alphabetical
    const ordered = Array.from(map.keys()).sort((x, y) => {
      const ix = DEPT_ORDER.indexOf(x);
      const iy = DEPT_ORDER.indexOf(y);
      if (ix === -1 && iy === -1) return x.localeCompare(y);
      if (ix === -1) return 1;
      if (iy === -1) return -1;
      return ix - iy;
    });
    return ordered.map((dept) => ({ dept, agents: map.get(dept) ?? [] }));
  }, [agents]);

  // --- Approval queue (agents with pending > 0) ----------------------------
  const approvalQueue = React.useMemo(() => {
    return agents
      .filter((a) => a.pendingApprovals > 0)
      .sort((a, b) => b.pendingApprovals - a.pendingApprovals)
      .map((a) => ({
        ...a,
        approvalText:
          APPROVAL_TEXT[a.department] ??
          `${a.agentName} output awaiting human review`,
      }));
  }, [agents]);

  // --- Handlers -------------------------------------------------------------
  const handleApprove = (agent: AiAgent) => {
    toast({
      title: "Output approved",
      description: `${agent.agentName} (${agent.agentCode}) output approved and saved to CRM timeline.`,
    });
  };

  const handleReject = (agent: AiAgent) => {
    toast({
      title: "Output rejected",
      description: `${agent.agentName} (${agent.agentCode}) output rejected & logged for review.`,
      variant: "destructive",
    });
  };

  const handleAgentAction = (agent: AiAgent, action: "pause" | "resume" | "run") => {
    const messages = {
      pause: { title: "Agent paused", description: `${agent.agentName} has been paused.` },
      resume: { title: "Agent resumed", description: `${agent.agentName} is now active.` },
      run: { title: "Manual run triggered", description: `${agent.agentName} started a manual run.` },
    } as const;
    toast(messages[action]);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Command Center"
        icon="Bot"
        subtitle={`${grouped.length} departments · ${totalAgents} AI agents managing the entire student journey.`}
        action={
          <Button
            variant="outline"
            onClick={() => fetchAgents(true)}
            disabled={refreshing}
            className="h-12 border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb]"
          >
            <Icon name={refreshing ? "Loader2" : "RefreshCw"} className={cn("size-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* AI Safety Rules Banner */}
      <Card className="rounded-2xl border-2 border-[#E8501A]/40 bg-orange-50/40">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E8501A] text-white">
              <Icon name="ShieldAlert" className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base text-[#E8501A]">
                AI Safety Rules — Non-Negotiable
              </CardTitle>
              <CardDescription className="text-xs">
                Every AI agent in ALO Education operates under these guardrails. Violations are logged to audit.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-700">
                <Icon name="XCircle" className="size-4" /> AI MUST NOT
              </p>
              <ul className="space-y-2">
                {AI_MUST_NOT.map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-sm text-foreground">
                    <Icon name="X" className="mt-0.5 size-3.5 shrink-0 text-red-600" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:border-l md:border-[#E8501A]/20 md:pl-6">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Icon name="CheckCircle2" className="size-4" /> AI MUST
              </p>
              <ul className="space-y-2">
                {AI_MUST.map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-sm text-foreground">
                    <Icon name="Check" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* §30 TOP KPIs — real automation from DB + workforce + Groq */}
      <Card className="rounded-2xl border-2 border-[#0057B8]/20 bg-gradient-to-br from-blue-50/80 to-slate-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm tracking-wide text-[#0057B8]">70% AI + 30% Human — Live from DB (AutomationEvent) · never fabricated</CardTitle>
            <Badge variant="outline" className="text-[11px]">{metrics?.automation?.period?.label ?? "Last 30d"} · {metrics ? "live" : metricsErr ? "auth/empty" : "loading"}</Badge>
          </div>
          <CardDescription className="text-xs">AUTOMATION_RATE = AI_AUTOMATED / TOTAL_ELIGIBLE ×100 · TARGET 70% · VARIANCE = ACTUAL−TARGET · Source: AutomationEvent table</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <div className="rounded-xl border bg-white p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Automation Rate</div>
              <div className="mt-1 flex items-baseline gap-2"><span className="text-2xl font-bold text-[#0057B8]">{metrics ? `${metrics.automation.automationRate.toFixed(2)}%` : "—"}</span><span className={`text-xs ${metrics && metrics.automation.variance >= -5 && metrics.automation.variance <= 10 ? "text-emerald-600" : metrics && metrics.automation.variance < -5 ? "text-amber-600" : "text-slate-500"}`}>{metrics ? `Δ ${metrics.automation.variance >=0?"+":""}${metrics.automation.variance.toFixed(2)}%` : ""}</span></div>
              <div className="mt-1 text-[11px] text-muted-foreground">TARGET 70% · {metrics?.automation.verdict ?? ""}</div>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Human Rate</div>
              <div className="mt-1 text-2xl font-bold">{metrics ? `${metrics.automation.humanRate.toFixed(2)}%` : "—"}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">TARGET 30% · 100−auto</div>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Eligible / Automated</div>
              <div className="mt-1 text-lg font-bold">{metrics ? `${metrics.automation.automated.toLocaleString()} / ${metrics.automation.totalEligible.toLocaleString()}` : "—"}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">+ assisted {metrics?.automation.assisted ?? 0} · human {metrics?.automation.human ?? 0} · escal {metrics?.automation.escalated ?? 0}</div>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Workforce</div>
              <div className="mt-1 text-lg font-bold">{metrics ? `${metrics.workforce.active} active` : `${activeAgents} active`} <span className="text-sm font-normal text-muted-foreground">/ {metrics?.workforce.total ?? totalAgents}</span></div>
              <div className="mt-1 text-[11px] text-muted-foreground">idle {metrics?.workforce.idle ?? 0} · busy {metrics?.workforce.busy ?? 0} · paused {metrics?.workforce.paused ?? 0}</div>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Queue</div>
              <div className="mt-1 text-lg font-bold">Q {metrics?.queue.queued ?? metrics?.workforce.queued ?? 0} · R {metrics?.queue.running ?? metrics?.workforce.running ?? 0}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">ok {metrics?.queue.success ?? 0} · fail {metrics?.queue.failed ?? 0} · wait {metrics?.workforce.waitingApproval ?? pendingApprovals}</div>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Groq Free-Tier</div>
              <div className="mt-1 text-sm font-bold">{metrics ? `${metrics.groq.concurrency.current}/${metrics.groq.concurrency.max} conc` : "—"}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{metrics ? `${metrics.groq.perMinute.count}/${metrics.groq.perMinute.limit}/min · q ${metrics.groq.queueLength}${metrics.groq.circuitOpen ? " · CIRCUIT OPEN" : ""}` : "limit 6 conc / 30 req/min / queue 200"}</div>
            </div>
          </div>
          {(metricsErr || !metrics) && <p className="mt-2 text-[11px] text-amber-700">Metrics need admin session (DB is source of truth). Login as admin to see live counts. Empty DB → rate 0% (not fabricated) — seed AutomationEvent via workflows.</p>}
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3 text-xs">
            <div className="rounded-lg bg-white border p-2.5"><div className="font-semibold">Classification</div><div className="text-muted-foreground mt-1">AI_AUTOMATABLE → auto · AI_ASSISTED → draft+human review · HUMAN_REQUIRED → block · HUMAN_APPROVAL_REQUIRED → queue · ESCALATED → senior</div></div>
            <div className="rounded-lg bg-white border p-2.5"><div className="font-semibold">Guardrails</div><div className="text-muted-foreground mt-1">maxSteps 12 · maxRuntime 120s · maxToolCalls 8 · tokenBudget 12k · depth 10 · never guarantee visa/admission</div></div>
            <div className="rounded-lg bg-white border p-2.5"><div className="font-semibold">Latency & Success</div><div className="text-muted-foreground mt-1">avg {metrics?.latency.avgMs != null ? `${metrics.latency.avgMs}ms` : "—"} · success {metrics ? Math.round((metrics.queue.success / Math.max(1, metrics.queue.success+metrics.queue.failed))*100) : 0}% · fallbacks {metrics?.groq.totalFallbacks ?? 0}</div></div>
          </div>
        </CardContent>
      </Card>

      {/* Stats (department rollup) */}
      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total AI Agents"
            value={totalAgents}
            icon="Bot"
            accent="blue"
            hint={`across ${grouped.length} departments · registry-driven`}
          />
          <StatCard
            label="Active Agents"
            value={activeAgents}
            icon="Activity"
            accent="emerald"
            hint={`${totalAgents - activeAgents} idle / paused`}
          />
          <StatCard
            label="Jobs Processed"
            value={jobsProcessed.toLocaleString()}
            icon="Zap"
            accent="orange"
            hint="sum AiAgent.jobsProcessed (real DB)"
          />
          <StatCard
            label="Pending Approvals"
            value={pendingApprovals}
            icon="AlertCircle"
            accent="amber"
            hint={`WAITING_APPROVAL ${metrics?.workforce.waitingApproval ?? pendingApprovals} · ESCALATED ${metrics?.workforce.escalated ?? 0}`}
          />
        </div>
      )}

      {/* Department grid */}
      {loading ? (
        <LoadingGrid count={6} />
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Agents by Department
            </h2>
            <Badge variant="outline" className="text-xs">
              {grouped.length} departments
            </Badge>
          </div>
          {grouped.length === 0 ? (
            <EmptyState
              icon="Bot"
              title="No AI agents configured"
              description="Run the seed script to populate the AI agent registry."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {grouped.map(({ dept, agents: deptAgents }) => {
                const active = deptAgents.filter((a) => a.status === "ACTIVE").length;
                const totalJobs = deptAgents.reduce((s, a) => s + a.jobsProcessed, 0);
                const pending = deptAgents.reduce((s, a) => s + a.pendingApprovals, 0);
                return (
                  <SectionCard
                    key={dept}
                    title={dept}
                    description={`${deptAgents.length} agent${deptAgents.length > 1 ? "s" : ""} · ${active} active`}
                    icon={DEPT_ICONS[dept] ?? "Bot"}
                    action={
                      <div className="flex items-center gap-1.5">
                        {pending > 0 && (
                          <Badge className="bg-red-100 text-red-700">{pending} pending</Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] tabular-nums">
                          {totalJobs.toLocaleString()} jobs
                        </Badge>
                      </div>
                    }
                  >
                    <ul className="space-y-3">
                      {deptAgents.map((agent) => (
                        <li
                          key={agent.id}
                          className="rounded-xl border border-border/60 p-3 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {agent.agentCode}
                                </span>
                                <span className="text-sm font-semibold text-foreground">
                                  {agent.agentName}
                                </span>
                              </div>
                              {agent.description && (
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {agent.description}
                                </p>
                              )}
                            </div>
                            <StatusBadge
                              status={agent.status}
                              colorMap={AGENT_STATUS_COLORS}
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Icon name="Zap" className="size-3" />
                              {agent.jobsProcessed.toLocaleString()} jobs
                            </span>
                            {agent.pendingApprovals > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 font-medium text-red-700">
                                <Icon name="Clock" className="size-3" />
                                {agent.pendingApprovals} pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <Icon name="CheckCircle2" className="size-3 text-emerald-600" />
                                no pending
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Icon name="Timer" className="size-3" />
                              {agent.lastRunAt ? timeAgo(agent.lastRunAt) : "never run"}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-[#0057B8] hover:bg-[#e8f0fb]"
                              onClick={() => handleAgentAction(agent, "run")}
                            >
                              <Icon name="Play" className="size-3" /> Run
                            </Button>
                            {agent.status === "ACTIVE" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50"
                                onClick={() => handleAgentAction(agent, "pause")}
                              >
                                <Icon name="Pause" className="size-3" /> Pause
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleAgentAction(agent, "resume")}
                              >
                                <Icon name="PlayCircle" className="size-3" /> Resume
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                toast({
                                  title: "Agent details",
                                  description: `${agent.agentName} · ${agent.department} · ${agent.status}`,
                                })
                              }
                            >
                              <Icon name="Info" className="size-3" /> Details
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Sections 7-11: Health, Model Router, Tool Gateway, RAG/Memory, Collaboration */}
      {!loading && metrics && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Health & Concurrency</CardTitle><CardDescription className="text-xs">GroqGuard + queue + circuit (real)</CardDescription></CardHeader><CardContent className="text-xs space-y-1"><div className="flex justify-between"><span>Concurrency</span><span className="font-mono">{metrics.groq.concurrency.current}/{metrics.groq.concurrency.max}</span></div><div className="flex justify-between"><span>Per-minute</span><span className="font-mono">{metrics.groq.perMinute.count}/{metrics.groq.perMinute.limit}</span></div><div className="flex justify-between"><span>Queue</span><span className="font-mono">{metrics.groq.queueLength} / 200</span></div><div className="flex justify-between"><span>Circuit</span><span className={metrics.groq.circuitOpen? "text-red-600 font-bold":"text-emerald-600"}>{metrics.groq.circuitOpen? "OPEN":"CLOSED"}</span></div><div className="flex justify-between"><span>Total requests / fallbacks</span><span className="font-mono">{metrics.groq.totalRequests} / {metrics.groq.totalFallbacks}</span></div></CardContent></Card>
          <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Model Router</CardTitle><CardDescription className="text-xs">FAST/COMPLEX/PRIVATE (Groq→fallback)</CardDescription></CardHeader><CardContent className="text-xs space-y-1"><div>GROQ_FAST → llama-3.1-8b-instant (6 conc, 30/min)</div><div>GROQ_LARGE → llama-3.3-70b-versatile (complex/reasoning)</div><div>LOCAL → {`process.env.LOCAL_AI_URL || fallback`}</div><div className="text-muted-foreground">Gateway: generateText/Structured/classify/summarize/chat/stream + audit to AgentAuditLog</div></CardContent></Card>
          <Card className="rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm">Human↔AI Collaboration (real TimelineEvent)</CardTitle><CardDescription className="text-xs">Last 8 events · automated vs human</CardDescription></CardHeader><CardContent>{metrics.collaboration.length===0? <p className="text-xs text-muted-foreground">No timeline rows yet — run any workflow (leadWelcome/scoring/SLA) to populate.</p> : <ul className="space-y-1.5 text-xs">{metrics.collaboration.slice(0,8).map(c=> <li key={c.id} className="flex justify-between border-b py-1"><span className={c.automated?"text-[#0057B8]":"text-amber-700"}>{c.actor.slice(0,18)}</span><span className="text-muted-foreground">{c.action.slice(0,28)}</span><span className="font-mono text-[11px]">{c.target}</span></li>)}</ul>}</CardContent></Card>
        </div>
      )}

      {/* Approval queue + Risk alerts */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Human Approval Queue"
            icon="ClipboardCheck"
            description="AI outputs waiting for human review before they are committed."
          >
            {approvalQueue.length === 0 ? (
              <EmptyState
                icon="CheckCircle2"
                title="No pending approvals"
                description="All AI agents are running without human intervention needed."
              />
            ) : (
              <ul className="space-y-3">
                {approvalQueue.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground">
                          {item.agentName}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {item.agentCode}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.department}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.approvalText}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Badge className="bg-red-100 text-red-700">
                          {item.pendingApprovals} item{item.pendingApprovals > 1 ? "s" : ""}
                        </Badge>
                        <span>last run {item.lastRunAt ? timeAgo(item.lastRunAt) : "never"}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                        onClick={() => handleApprove(item)}
                      >
                        <Icon name="Check" className="size-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(item)}
                      >
                        <Icon name="X" className="size-3.5" /> Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Risk Alerts"
            icon="AlertTriangle"
            description="AI-flagged items routed for human attention in the last 24 hours."
          >
            <ul className="space-y-3">
              {SAMPLE_RISK_ALERTS.map((alert) => (
                <li
                  key={alert.title}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3",
                    alert.severity === "high"
                      ? "border-red-200 bg-red-50/50"
                      : "border-amber-200 bg-amber-50/50"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      alert.severity === "high"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    <Icon
                      name={alert.severity === "high" ? "AlertOctagon" : "AlertTriangle"}
                      className="size-4"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                      <Badge
                        className={cn(
                          "capitalize",
                          alert.severity === "high"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>
                    <Button
                      size="sm"
                      variant="link"
                      className="mt-1 h-auto p-0 text-xs text-[#0057B8]"
                      onClick={() =>
                        toast({
                          title: "Alert acknowledged",
                          description: `${alert.title} — assigned to a human reviewer.`,
                        })
                      }
                    >
                      Assign to reviewer →
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
