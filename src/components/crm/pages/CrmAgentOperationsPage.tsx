'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Bot, Activity, RefreshCw, AlertTriangle, ScrollText, Info,
  Pause, Shield, Users,
} from 'lucide-react';

// ============================================================
// Types — mirror the real contracts
// ============================================================

// GET /api/ai-command/agents → AiEmployee + lineage
interface AiAgent {
  id: string;
  employeeCode: string;
  name: string;
  departmentId: string;
  role: string;
  status: string;
  generation: number;
  isTwoLoopModel: boolean;
  hasActiveCycle: boolean;
  cyclesCompleted: number;
  lineage: unknown;
}

// GET /api/ai-command/actions → AiCommandAction
interface AiAction {
  id: string;
  actionType: string;
  targetType: string;
  targetId?: string | null;
  requestedBy: string;
  actor?: string | null;
  trigger?: string | null;
  result?: string | null;
  lastError?: string | null;
  retryCount: number;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  executedAt?: string | null;
  rollbackReason?: string | null;
  riskLevel: string;
  createdAt: string;
}

// GET /api/ai-command/stats
interface AiStats {
  total: number;
  since?: string;
  byStatus: Array<{ status: string; count: number }>;
  byRiskLevel: Array<{ riskLevel: string; count: number }>;
  summary?: {
    pending?: number;
    approved?: number;
    executing?: number;
    rejected?: number;
    executed?: number;
    failed?: number;
    rolledBack?: number;
  };
  recentFailures?: Array<{
    id: string;
    actionType: string;
    targetType: string;
    targetId?: string | null;
    lastError?: string | null;
    retryCount: number;
    createdAt: string;
  }>;
  recentExecuted?: number;
  totalRetries?: number;
  globalAiPaused?: boolean;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

const STATUS_CLS: Record<string, string> = {
  EXECUTED: 'bg-green-100 text-green-700 border-green-200',
  APPROVED: 'bg-sky-100 text-sky-700 border-sky-200',
  EXECUTING: 'bg-blue-100 text-blue-700 border-blue-200',
  REJECTED: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  ROLLED_BACK: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]',
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
};

const RISK_CLS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]',
};

function statusBadge(status: string) {
  return (
    <Badge variant="outline" className={`text-[11px] ${STATUS_CLS[status] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}`}>
      {status || 'UNKNOWN'}
    </Badge>
  );
}

function riskBadge(riskLevel: string) {
  return (
    <Badge variant="outline" className={`text-[11px] ${RISK_CLS[riskLevel] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}`}>
      {riskLevel || 'UNRATED'}
    </Badge>
  );
}

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function countOf(list: Array<{ status: string; count: number }>, status: string): number {
  return list.find((entry) => entry.status === status)?.count || 0;
}

export default function CrmAgentOperationsPage() {
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [agentState, setAgentState] = useState<LoadState>({ loading: true, error: null });
  const [agentCount, setAgentCount] = useState(0);
  const [twoLoopModels, setTwoLoopModels] = useState(0);

  const [actions, setActions] = useState<AiAction[]>([]);
  const [actionState, setActionState] = useState<LoadState>({ loading: true, error: null });
  const [actionStats, setActionStats] = useState<Record<string, number>>({});

  const [stats, setStats] = useState<AiStats | null>(null);
  const [statsState, setStatsState] = useState<LoadState>({ loading: true, error: null });

  const loadAgents = useCallback(async () => {
    setAgentState({ loading: true, error: null });
    try {
      const response = await fetch('/api/ai-command/agents?limit=200');
      if (!response.ok) throw new Error(`Could not load AI agents (HTTP ${response.status})`);
      const payload = await response.json();
      setAgents(Array.isArray(payload?.agents) ? payload.agents : []);
      setAgentCount(Number(payload?.count) || 0);
      setTwoLoopModels(Number(payload?.twoLoopModels) || 0);
      setAgentState({ loading: false, error: null });
    } catch (error) {
      setAgents([]);
      setAgentState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load AI agents',
      });
    }
  }, []);

  const loadActions = useCallback(async () => {
    setActionState({ loading: true, error: null });
    try {
      const response = await fetch('/api/ai-command/actions?status=ALL&limit=100');
      if (!response.ok) throw new Error(`Could not load AI actions (HTTP ${response.status})`);
      const payload = await response.json();
      setActions(Array.isArray(payload?.actions) ? payload.actions : []);
      setActionStats(payload?.stats || {});
      setActionState({ loading: false, error: null });
    } catch (error) {
      setActions([]);
      setActionState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load AI actions',
      });
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsState({ loading: true, error: null });
    try {
      const response = await fetch('/api/ai-command/stats');
      if (!response.ok) throw new Error(`Could not load AI statistics (HTTP ${response.status})`);
      setStats(await response.json());
      setStatsState({ loading: false, error: null });
    } catch (error) {
      setStats(null);
      setStatsState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load AI statistics',
      });
    }
  }, []);

  useEffect(() => {
    void loadAgents();
    void loadActions();
    void loadStats();
  }, [loadAgents, loadActions, loadStats]);

  const refreshAll = async () => {
    await Promise.all([loadAgents(), loadActions(), loadStats()]);
  };

  const failedCount = useMemo(
    () => stats?.summary?.failed ?? countOf(stats?.byStatus || [], 'FAILED'),
    [stats],
  );
  const executedCount = useMemo(
    () => stats?.summary?.executed ?? countOf(stats?.byStatus || [], 'EXECUTED'),
    [stats],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bot className="h-6 w-6 text-primary" />
            AI Agent Operations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Registered AI agents, the actions they have requested, and execution outcomes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refreshAll()}>
          <RefreshCw
            className={`mr-1 h-4 w-4 ${agentState.loading || actionState.loading || statsState.loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {stats?.globalAiPaused && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-amber-800">
            <Pause className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium">
              Global AI execution is paused. Requested actions will queue but not run.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Agents</p>
              <p className="text-2xl font-bold">{agentCount}</p>
            </div>
            <Users className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Actions recorded</p>
              <p className="text-2xl font-bold">{stats?.total ?? actionStats.total ?? 0}</p>
            </div>
            <Activity className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Executed</p>
              <p className="text-2xl font-bold">{executedCount}</p>
            </div>
            <Shield className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Failed</p>
              <p className="text-2xl font-bold">{failedCount}</p>
            </div>
            <AlertTriangle className={`h-5 w-5 ${failedCount > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
          </CardContent>
        </Card>
      </div>

      {statsState.error && (
        <Card>
          <CardContent className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{statsState.error}</p>
              <button
                type="button"
                className="mt-1 underline underline-offset-2"
                onClick={() => void loadStats()}
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="agents">
        <TabsList className="h-9">
          <TabsTrigger value="agents" className="h-8 px-3 text-xs font-medium">
            Agents ({agents.length})
          </TabsTrigger>
          <TabsTrigger value="actions" className="h-8 px-3 text-xs font-medium">
            Actions ({actions.length})
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="h-8 px-3 text-xs font-medium">
            Status breakdown
          </TabsTrigger>
        </TabsList>

        {/* ── AGENTS ── */}
        <TabsContent value="agents" className="mt-4 space-y-4">
          {agentState.error && (
            <Card>
              <CardContent className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">{agentState.error}</p>
                  <button
                    type="button"
                    className="mt-1 underline underline-offset-2"
                    onClick={() => void loadAgents()}
                  >
                    Try again
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {agentState.loading ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center text-sm">
                Loading agents…
              </CardContent>
            </Card>
          ) : agents.length === 0 && !agentState.error ? (
            <Card>
              <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
                <Bot className="h-8 w-8 opacity-30" />
                <p className="text-sm">No active AI agent has been registered yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Active agents ({agents.length})
                  {twoLoopModels > 0 ? ` · ${twoLoopModels} two-loop` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead className="w-[170px]">Role</TableHead>
                        <TableHead className="w-[150px]">Department</TableHead>
                        <TableHead className="w-[110px]">Status</TableHead>
                        <TableHead className="w-[130px]">Generation</TableHead>
                        <TableHead className="w-[130px]">Cycles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-muted-foreground text-xs">{agent.employeeCode}</p>
                          </TableCell>
                          <TableCell className="text-xs">{agent.role || 'Unspecified'}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {agent.departmentId || 'Unassigned'}
                          </TableCell>
                          <TableCell>{statusBadge(agent.status)}</TableCell>
                          <TableCell className="text-xs">
                            {agent.generation}
                            {agent.isTwoLoopModel ? (
                              <Badge variant="outline" className="ml-1 text-[11px]">Two-loop</Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-xs">
                            {agent.cyclesCompleted} completed
                            {agent.hasActiveCycle ? (
                              <Badge variant="outline" className="ml-1 bg-sky-100 text-sky-700 text-[11px]">
                                Active
                              </Badge>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── ACTIONS ── */}
        <TabsContent value="actions" className="mt-4 space-y-4">
          {actionState.error && (
            <Card>
              <CardContent className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">{actionState.error}</p>
                  <button
                    type="button"
                    className="mt-1 underline underline-offset-2"
                    onClick={() => void loadActions()}
                  >
                    Try again
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {actionState.loading ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center text-sm">
                Loading actions…
              </CardContent>
            </Card>
          ) : actions.length === 0 && !actionState.error ? (
            <Card>
              <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
                <ScrollText className="h-8 w-8 opacity-30" />
                <p className="text-sm">No AI action has been recorded yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead className="w-[120px]">Risk</TableHead>
                        <TableHead className="w-[130px]">Status</TableHead>
                        <TableHead className="w-[160px]">Requested by</TableHead>
                        <TableHead className="w-[90px]">Retries</TableHead>
                        <TableHead className="w-[170px]">Recorded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actions.map((action) => (
                        <TableRow key={action.id}>
                          <TableCell>
                            <p className="font-medium">
                              {(action.actionType || '').replace(/_/g, ' ')}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {action.targetType || 'unspecified target'}
                              {action.targetId ? ` · ${action.targetId}` : ''}
                            </p>
                            {action.lastError ? (
                              <p className="mt-1 text-[11px] text-red-600">{action.lastError}</p>
                            ) : null}
                          </TableCell>
                          <TableCell>{riskBadge(action.riskLevel)}</TableCell>
                          <TableCell>{statusBadge(action.status)}</TableCell>
                          <TableCell className="text-xs">
                            {action.actor || action.requestedBy || 'Not attributed'}
                            {action.trigger ? (
                              <span className="text-muted-foreground block">
                                via {action.trigger}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-xs">{action.retryCount || 0}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatTimestamp(action.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── BREAKDOWN ── */}
        <TabsContent value="breakdown" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!stats || stats.byStatus.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    {statsState.loading ? 'Loading…' : 'No status data is available.'}
                  </p>
                ) : (
                  stats.byStatus.map((entry) => (
                    <div key={entry.status} className="flex items-center justify-between gap-2">
                      {statusBadge(entry.status)}
                      <span className="text-sm font-medium">{entry.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">By risk level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!stats || stats.byRiskLevel.length === 0 ? (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    {statsState.loading ? 'Loading…' : 'No risk data is available.'}
                  </p>
                ) : (
                  stats.byRiskLevel.map((entry) => (
                    <div key={entry.riskLevel} className="flex items-center justify-between gap-2">
                      {riskBadge(entry.riskLevel)}
                      <span className="text-sm font-medium">{entry.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent failures</CardTitle>
            </CardHeader>
            <CardContent>
              {!stats?.recentFailures || stats.recentFailures.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No recent failure has been recorded.
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.recentFailures.map((failure) => (
                    <li
                      key={failure.id}
                      className="border-alo-border flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {(failure.actionType || '').replace(/_/g, ' ')}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {failure.targetType}
                          {failure.targetId ? ` · ${failure.targetId}` : ''}
                          {failure.retryCount ? ` · ${failure.retryCount} retries` : ''}
                        </p>
                        {failure.lastError ? (
                          <p className="mt-0.5 text-[11px] text-red-600">{failure.lastError}</p>
                        ) : null}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {formatTimestamp(failure.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="text-muted-foreground flex items-start gap-2 pt-6 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Counts come from the AI command action table. Success rates and tasks-per-day figures
            are not shown: the agent record carries a default success-rate value that is not a
            measurement, so reporting it would misrepresent agent performance. Statistics are
            restricted to administrator roles by the API.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
