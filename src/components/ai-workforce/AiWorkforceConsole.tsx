'use client';

/**
 * ALO AI Workforce console (§17, §18, §19, §20, §23).
 *
 * Dashboard, Agent Builder, Agent Test Lab (simulation + production),
 * Workflows, Approvals, Health Monitor and Audit — all bound to the live
 * /api/ai-workforce endpoints. Nothing on this screen is hard-coded: when the
 * platform has no data the counters are zero and the empty states say so.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity, AlertTriangle, Bot, CheckCircle2, Cpu, Gauge, History, Play, RefreshCw, ShieldCheck, Workflow as WorkflowIcon, Wrench,
} from 'lucide-react';

type Json = Record<string, unknown>;

interface Envelope<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('portal_token') || localStorage.getItem('token') || '';
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function api<T>(path: string, init?: RequestInit): Promise<Envelope<T>> {
  const response = await fetch(path, { ...init, headers: { ...authHeaders(), ...(init?.headers || {}) }, cache: 'no-store' });
  try {
    return (await response.json()) as Envelope<T>;
  } catch {
    return { success: false, status: response.status, message: 'The server returned an unreadable response', data: null };
  }
}

const statusTone: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  HEALTHY: 'bg-emerald-100 text-emerald-800',
  DEPLOYED: 'bg-emerald-100 text-emerald-800',
  DRAFT: 'bg-slate-100 text-slate-700',
  VALIDATED: 'bg-sky-100 text-sky-800',
  TESTED: 'bg-indigo-100 text-indigo-800',
  APPROVED: 'bg-violet-100 text-violet-800',
  PAUSED: 'bg-amber-100 text-amber-800',
  AWAITING_APPROVAL: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-amber-100 text-amber-800',
  DEGRADED: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-red-100 text-red-800',
  DISABLED: 'bg-red-100 text-red-800',
  UNHEALTHY: 'bg-red-100 text-red-800',
};

function StatusBadge({ value }: { value: string }) {
  return <Badge className={statusTone[value] || 'bg-slate-100 text-slate-700'}>{value}</Badge>;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function AiWorkforceConsole() {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<Json | null>(null);
  const [agents, setAgents] = useState<Json[]>([]);
  const [tools, setTools] = useState<Json[]>([]);
  const [workflows, setWorkflows] = useState<Json[]>([]);
  const [approvals, setApprovals] = useState<Json[]>([]);
  const [health, setHealth] = useState<Json | null>(null);
  const [audit, setAudit] = useState<Json[]>([]);
  const [runs, setRuns] = useState<Json[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    const [dash, agentList, toolList, workflowList, approvalList, healthState, auditList, runList] = await Promise.all([
      api<Json>('/api/ai-workforce/dashboard'),
      api<{ agents: Json[] }>('/api/ai-workforce/agents'),
      api<{ tools: Json[] }>('/api/ai-workforce/tools'),
      api<{ workflows: Json[] }>('/api/ai-workforce/workflows'),
      api<{ approvals: Json[] }>('/api/ai-workforce/approvals?status=PENDING'),
      api<Json>('/api/ai-workforce/health'),
      api<{ entries: Json[] }>('/api/ai-workforce/audit?take=50'),
      api<{ runs: Json[] }>('/api/ai-workforce/runs?take=25'),
    ]);
    if (!dash.success) setError(dash.message);
    setDashboard(dash.data);
    setAgents(agentList.data?.agents ?? []);
    setTools(toolList.data?.tools ?? []);
    setWorkflows(workflowList.data?.workflows ?? []);
    setApprovals(approvalList.data?.approvals ?? []);
    setHealth(healthState.data);
    setAudit(auditList.data?.entries ?? []);
    setRuns(runList.data?.runs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const automation = (dashboard?.automation as Json | undefined) ?? null;
  const runCounters = ((dashboard?.runs as Json | undefined)?.production as Json | undefined) ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Bot className="h-6 w-6" /> ALO AI Workforce
          </h1>
          <p className="text-sm text-muted-foreground">
            ALO owns the agents, instructions, routing, validation, tools and audit. Models are interchangeable inference engines.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </header>

      {error ? (
        <Card className="border-red-200">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" /> {error}
          </CardContent>
        </Card>
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview"><Gauge className="mr-1 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="agents"><Bot className="mr-1 h-4 w-4" />Agents</TabsTrigger>
          <TabsTrigger value="lab"><Play className="mr-1 h-4 w-4" />Test Lab</TabsTrigger>
          <TabsTrigger value="workflows"><WorkflowIcon className="mr-1 h-4 w-4" />Workflows</TabsTrigger>
          <TabsTrigger value="tools"><Wrench className="mr-1 h-4 w-4" />Tools</TabsTrigger>
          <TabsTrigger value="approvals"><ShieldCheck className="mr-1 h-4 w-4" />Approvals</TabsTrigger>
          <TabsTrigger value="health"><Activity className="mr-1 h-4 w-4" />Health</TabsTrigger>
          <TabsTrigger value="audit"><History className="mr-1 h-4 w-4" />Audit</TabsTrigger>
        </TabsList>

        {/* ── Overview ───────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="Agents" value={String((dashboard?.agents as Json | undefined)?.total ?? 0)} hint={`${String(((dashboard?.agents as Json | undefined)?.byStatus as Json | undefined)?.ACTIVE ?? 0)} active`} />
            <Stat label="Production runs" value={String(runCounters?.total ?? 0)} hint={`${String(runCounters?.successRate ?? 0)}% success`} />
            <Stat
              label="Automation"
              value={automation?.hasData ? `${String(automation.automationRate)}%` : 'no data'}
              hint={automation?.hasData ? `${String(automation.agentCompleted)} of ${String(automation.eligibleTasks)} eligible tasks` : 'no eligible tasks measured yet'}
            />
            <Stat
              label="Human intervention"
              value={automation?.hasData ? `${String(automation.humanInterventionRate)}%` : 'no data'}
              hint={`${String(automation?.humanApproved ?? 0)} approvals recorded separately`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Automation measurement</CardTitle>
              <CardDescription>{String(automation?.formula ?? 'Computed live from the task ledger.')}</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(automation?.byWorkflow) && (automation!.byWorkflow as Json[]).length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-muted-foreground">
                      <th className="py-1">Workflow</th>
                      <th>Eligible</th>
                      <th>Agent-completed</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(automation!.byWorkflow as Json[]).map((row) => (
                      <tr key={String(row.workflow)} className="border-t">
                        <td className="py-1">{String(row.workflow)}</td>
                        <td>{String(row.eligible)}</td>
                        <td>{String(row.agentCompleted)}</td>
                        <td>{String(row.automationRate)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">No eligible tasks have been measured yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Recent runs</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {runs.length === 0 ? <p className="text-sm text-muted-foreground">No runs recorded yet.</p> : null}
              {runs.slice(0, 12).map((run) => (
                <div key={String(run.runCode)} className="flex flex-wrap items-center justify-between gap-2 border-b py-1 text-sm">
                  <span className="font-mono text-xs">{String(run.runCode)}</span>
                  <span>{String((run.agent as Json | undefined)?.slug ?? '')}</span>
                  <span className="text-xs text-muted-foreground">{String(run.mode)}</span>
                  <span className="text-xs text-muted-foreground">{String(run.durationMs)} ms</span>
                  <StatusBadge value={String(run.status)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Agents ─────────────────────────────────────────────── */}
        <TabsContent value="agents" className="space-y-4">
          <AgentRegistry agents={agents} onChanged={refresh} />
        </TabsContent>

        {/* ── Test Lab ───────────────────────────────────────────── */}
        <TabsContent value="lab">
          <TestLab agents={agents} />
        </TabsContent>

        {/* ── Workflows ──────────────────────────────────────────── */}
        <TabsContent value="workflows" className="space-y-3">
          {workflows.length === 0 ? <p className="text-sm text-muted-foreground">No workflows are registered.</p> : null}
          {workflows.map((workflow) => (
            <Card key={String(workflow.slug)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{String(workflow.name)}</CardTitle>
                  <StatusBadge value={String(workflow.status)} />
                </div>
                <CardDescription>{String(workflow.description)}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <span className="font-mono">{String(workflow.slug)}</span> · trigger {String(workflow.triggerType)}
                {workflow.triggerEvent ? ` on ${String(workflow.triggerEvent)}` : ''} · v{String(workflow.version)} ·{' '}
                {String((workflow._count as Json | undefined)?.runs ?? 0)} runs
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Tools ──────────────────────────────────────────────── */}
        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tool registry</CardTitle>
              <CardDescription>Permission, risk level, approval requirement and rate limit are enforced on every call.</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="py-1">Tool</th><th>Permission</th><th>Risk</th><th>Approval</th><th>Writes</th><th>Rate/min</th><th>Grants</th><th>Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool) => (
                    <tr key={String(tool.slug)} className="border-t">
                      <td className="py-1 font-mono text-xs">{String(tool.slug)}</td>
                      <td>{String(tool.permission)}</td>
                      <td><StatusBadge value={String(tool.riskLevel)} /></td>
                      <td>{tool.requiresApproval ? 'required' : '—'}</td>
                      <td>{tool.mutates ? 'yes' : 'no'}</td>
                      <td>{String(tool.rateLimitPerMin)}</td>
                      <td>{String((tool._count as Json | undefined)?.grants ?? 0)}</td>
                      <td>{String((tool._count as Json | undefined)?.calls ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Approvals ──────────────────────────────────────────── */}
        <TabsContent value="approvals" className="space-y-3">
          {approvals.length === 0 ? <p className="text-sm text-muted-foreground">No approvals are waiting.</p> : null}
          {approvals.map((approval) => (
            <Card key={String(approval.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{String(approval.action)}</CardTitle>
                  <StatusBadge value={String(approval.riskLevel)} />
                </div>
                <CardDescription>{String(approval.reason)}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    await api(`/api/ai-workforce/approvals/${String(approval.id)}`, { method: 'POST', body: JSON.stringify({ decision: 'APPROVED' }) });
                    await refresh();
                  }}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await api(`/api/ai-workforce/approvals/${String(approval.id)}`, { method: 'POST', body: JSON.stringify({ decision: 'REJECTED' }) });
                    await refresh();
                  }}
                >
                  Reject
                </Button>
                <span className="text-xs text-muted-foreground">agent {String(approval.agentSlug)} · requested by {String(approval.requestedById)}</span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Health ─────────────────────────────────────────────── */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Stat label="System" value={String(health?.status ?? 'unknown')} />
            <Stat label="Executable runtimes" value={String(health?.executableRuntimes ?? 0)} hint={`${String(health?.deterministicTasks ?? 0)} deterministic tasks`} />
            <Stat label="Running" value={String((health?.queues as Json | undefined)?.runningRuns ?? 0)} hint={`${String((health?.queues as Json | undefined)?.stuckRuns ?? 0)} stuck`} />
            <Stat label="Pending approvals" value={String(health?.pendingApprovals ?? 0)} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4" />Model runtimes</CardTitle>
              <CardDescription>Tier 1 is tried first; the ALO deterministic engine is the terminal fallback so no task is dropped.</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="py-1">Runtime</th><th>Tier</th><th>Kind</th><th>Status</th><th>Paid</th><th>Queue</th><th>Avg ms</th><th>Failures</th>
                  </tr>
                </thead>
                <tbody>
                  {((health?.runtimes as Json[] | undefined) ?? []).map((runtime) => (
                    <tr key={String(runtime.runtimeKey)} className="border-t">
                      <td className="py-1 font-mono text-xs">{String(runtime.runtimeKey)}</td>
                      <td>{String(runtime.tier)}</td>
                      <td>{String(runtime.kind)}</td>
                      <td><StatusBadge value={String(runtime.status)} /></td>
                      <td>{runtime.isPaidService ? 'yes' : 'no'}</td>
                      <td>{String(runtime.queueDepth)}</td>
                      <td>{String(runtime.avgLatencyMs)}</td>
                      <td>{String(runtime.failureCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {((health?.notes as string[] | undefined) ?? []).map((note) => (
                <p key={note} className="mt-2 text-xs text-amber-700">⚠ {note}</p>
              ))}
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onClick={async () => {
                  await api('/api/ai-workforce/health/recover', { method: 'POST' });
                  await refresh();
                }}
              >
                Run recovery sweep
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Audit ──────────────────────────────────────────────── */}
        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle className="text-base">Audit trail</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {audit.length === 0 ? <p className="text-sm text-muted-foreground">No audit entries yet.</p> : null}
              {audit.map((entry) => (
                <div key={String(entry.id)} className="flex flex-wrap items-center justify-between gap-2 border-b py-1 text-xs">
                  <span className="font-medium">{String(entry.action)}</span>
                  <span className="text-muted-foreground">{String(entry.objectType)} {String(entry.objectId).slice(0, 12)}</span>
                  <span>{String(entry.actorRole)}</span>
                  <StatusBadge value={String(entry.result)} />
                  <span className="text-muted-foreground">{new Date(String(entry.createdAt)).toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Agent registry with the full lifecycle control surface. */
function AgentRegistry({ agents, onChanged }: { agents: Json[]; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const act = async (slug: string, action: string, extra: Json = {}) => {
    setBusy(`${slug}:${action}`);
    const response = await api<Json>(`/api/ai-workforce/agents/${slug}/lifecycle`, { method: 'POST', body: JSON.stringify({ action, ...extra }) });
    setMessage(`${slug}: ${response.message}`);
    setBusy('');
    await onChanged();
  };

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {agents.length === 0 ? <p className="text-sm text-muted-foreground">No agents are registered yet.</p> : null}
      {agents.map((agent) => {
        const slug = String(agent.slug);
        const status = String(agent.status);
        return (
          <Card key={slug}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{String(agent.name)}</CardTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge value={status} />
                  <Badge variant="outline">v{String(agent.latestVersionNo)}</Badge>
                </div>
              </div>
              <CardDescription>{String(agent.purpose || agent.description)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{slug}</span> · {String((agent.department as Json | undefined)?.name ?? '')} ·{' '}
                {String((agent._count as Json | undefined)?.toolGrants ?? 0)} tools ·{' '}
                {String((agent._count as Json | undefined)?.skillGrants ?? 0)} skills ·{' '}
                {String((agent._count as Json | undefined)?.runs ?? 0)} runs
              </p>
              <div className="flex flex-wrap gap-2">
                {['validate', 'test', 'approve', 'deploy'].map((action) => (
                  <Button key={action} size="sm" variant="outline" disabled={busy === `${slug}:${action}`} onClick={() => void act(slug, action)}>
                    {action}
                  </Button>
                ))}
                {status === 'ACTIVE' ? (
                  <Button size="sm" variant="outline" onClick={() => void act(slug, 'pause')}>pause</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => void act(slug, 'activate')}>activate</Button>
                )}
                <Button size="sm" variant="outline" onClick={() => void act(slug, 'rollback', { versionNo: Math.max(1, Number(agent.latestVersionNo) - 1) })}>
                  rollback
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/** Agent Test Lab: run any agent in simulation (no writes) or production. */
function TestLab({ agents }: { agents: Json[] }) {
  const slugs = useMemo(() => agents.map((agent) => String(agent.slug)), [agents]);
  const [agentSlug, setAgentSlug] = useState('');
  const [input, setInput] = useState('{\n  "leadId": ""\n}');
  const [mode, setMode] = useState<'SIMULATION' | 'PRODUCTION' | 'TEST'>('SIMULATION');
  const [result, setResult] = useState<Json | null>(null);
  const [message, setMessage] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!agentSlug && slugs.length) setAgentSlug(slugs[0]);
  }, [slugs, agentSlug]);

  const run = async () => {
    setRunning(true);
    setMessage('');
    let parsed: Json = {};
    try {
      parsed = JSON.parse(input || '{}');
    } catch {
      setMessage('The input is not valid JSON.');
      setRunning(false);
      return;
    }
    const response = await api<Json>('/api/ai-workforce/runs', { method: 'POST', body: JSON.stringify({ agentSlug, input: parsed, mode }) });
    setMessage(response.message);
    setResult(response.data);
    setRunning(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agent Test Lab</CardTitle>
        <CardDescription>
          Simulation records the writes an agent would make without performing them. Production executes for real and is fully audited.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <select className="rounded border px-2 py-1 text-sm" value={agentSlug} onChange={(event) => setAgentSlug(event.target.value)}>
            {slugs.map((slug) => (
              <option key={slug} value={slug}>{slug}</option>
            ))}
          </select>
          <select className="rounded border px-2 py-1 text-sm" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
            <option value="SIMULATION">SIMULATION (dry run)</option>
            <option value="TEST">TEST</option>
            <option value="PRODUCTION">PRODUCTION</option>
          </select>
          <Button size="sm" onClick={() => void run()} disabled={running || !agentSlug}>
            <Play className="mr-1 h-4 w-4" /> Run
          </Button>
        </div>
        <Textarea rows={8} value={input} onChange={(event) => setInput(event.target.value)} className="font-mono text-xs" />
        {message ? <p className="text-sm">{message}</p> : null}
        {result ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono">{String(result.runCode ?? '')}</span>
              <StatusBadge value={String(result.status ?? '')} />
              <span>{String(result.durationMs ?? 0)} ms</span>
              <span>runtime {String((result.runtimeKeys as string[] | undefined)?.join(', ') ?? '')}</span>
              {result.humanReviewRequired ? <Badge className="bg-amber-100 text-amber-800">human review required</Badge> : null}
            </div>
            <pre className="max-h-96 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : null}
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" /> Every run is written to AwfRun with its steps, tool calls and audit entries.
        </p>
      </CardContent>
    </Card>
  );
}
