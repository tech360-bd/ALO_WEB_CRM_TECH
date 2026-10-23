"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Bot, Activity, HeartPulse, Zap, Clock, AlertTriangle, Pause,
  Wrench, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Shield, Brain, TrendingUp, BarChart3,
  Layers, UserCheck, AlertOctagon, Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  department: string;
  status: "active" | "idle" | "paused" | "error" | "maintenance";
  health: "healthy" | "degraded" | "critical";
  latencyMs: number;
  successRate: number;
  tasksToday: number;
  tasksTotal: number;
  lastActive: string;
  description: string;
  version: string;
  uptimeHours: number;
  errorCount24h: number;
  avgResponseTimeMs: number;
  requiresHumanApproval: boolean;
  queueDepth: number;
}

interface DepartmentSummary {
  name: string;
  total: number;
  active: number;
  healthy: number;
  degraded: number;
}

interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  healthyAgents: number;
  errorAgents: number;
  pausedAgents: number;
  maintenanceAgents: number;
  idleAgents: number;
  totalTasksToday: number;
  avgSuccessRate: number;
  departments: number;
  approvalQueueDepth: number;
}

interface ApiResponse {
  agents: Agent[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  departments: DepartmentSummary[];
  stats: AgentStats;
}

// ─── Helpers ────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bgClass: string }> = {
  active:      { label: "Active",      color: "text-emerald-700",  bgClass: "bg-emerald-50",  icon: <Activity className="w-3.5 h-3.5" /> },
  idle:        { label: "Idle",        color: "text-[var(--alo-text-muted)]",    bgClass: "bg-[var(--alo-page)]",     icon: <Clock className="w-3.5 h-3.5" /> },
  paused:      { label: "Paused",      color: "text-amber-600",   bgClass: "bg-amber-50",    icon: <Pause className="w-3.5 h-3.5" /> },
  error:       { label: "Error",       color: "text-red-600",     bgClass: "bg-red-50",      icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  maintenance: { label: "Maintenance", color: "text-[var(--alo-brand)]",    bgClass: "bg-[var(--alo-brand-pale)]",     icon: <Wrench className="w-3.5 h-3.5" /> },
};

const healthConfig: Record<string, { label: string; dotColor: string; barColor: string }> = {
  healthy:  { label: "Healthy",  dotColor: "bg-emerald-500", barColor: "bg-emerald-500" },
  degraded: { label: "Degraded", dotColor: "bg-amber-500",   barColor: "bg-amber-500" },
  critical: { label: "Critical", dotColor: "bg-red-500",     barColor: "bg-red-500" },
};

function formatUptime(hours: number): string {
  if (hours >= 720) return `${(hours / 720).toFixed(1)} mo`;
  if (hours >= 24) return `${(hours / 24).toFixed(0)}d ${hours % 24}h`;
  return `${hours}h`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ──────────────────────────────────────────

export default function AgentRegistry() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterHealth, setFilterHealth] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterDept !== "all") params.set("department", filterDept);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterHealth !== "all") params.set("health", filterHealth);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/agentos/agents?${params.toString()}`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  }, [search, filterDept, filterStatus, filterHealth, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchData]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, filterDept, filterStatus, filterHealth]);

  const stats = data?.stats;
  const agents = data?.agents ?? [];
  const pagination = data?.pagination;
  const departments = data?.departments ?? [];

  const handleDeptClick = useCallback((deptName: string) => {
    setFilterDept(filterDept === deptName ? "all" : deptName);
  }, [filterDept]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--alo-text)] flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-600" />
              AI Command Center
            </h2>
            <p className="text-sm text-[var(--alo-text-muted)] mt-0.5">
              Real-time registry of all {stats?.totalAgents ?? "..."} AI agents across {stats?.departments ?? "..."} departments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className={autoRefresh ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto" : "Live"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchData()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <span className="text-xs text-[var(--alo-text-muted)] hidden sm:inline">
              Updated {timeAgo(lastRefresh.toISOString())}
            </span>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={<Bot className="w-4 h-4" />} label="Total Agents" value={stats.totalAgents} sub={`${stats.departments} depts`} color="text-[var(--alo-text)]" />
            <StatCard icon={<Activity className="w-4 h-4" />} label="Active" value={stats.activeAgents} sub={`${((stats.activeAgents / stats.totalAgents) * 100).toFixed(0)}%`} color="text-emerald-600" />
            <StatCard icon={<HeartPulse className="w-4 h-4" />} label="Healthy" value={stats.healthyAgents} sub={`${((stats.healthyAgents / stats.totalAgents) * 100).toFixed(0)}%`} color="text-emerald-600" />
            <StatCard icon={<AlertOctagon className="w-4 h-4" />} label="Errors" value={stats.errorAgents} sub="24h window" color={stats.errorAgents > 0 ? "text-red-600" : "text-[var(--alo-text-muted)]"} />
            <StatCard icon={<Zap className="w-4 h-4" />} label="Tasks Today" value={stats.totalTasksToday} sub={`Avg ${(stats.avgSuccessRate * 100).toFixed(1)}% success`} color="text-[var(--alo-brand)]" />
            <StatCard icon={<UserCheck className="w-4 h-4" />} label="Approval Queue" value={stats.approvalQueueDepth} sub="pending items" color="text-amber-600" />
          </div>
        )}

        {/* ── Department Summary Bar ── */}
        {departments.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[var(--alo-text-muted)]" /> Department Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ScrollArea className="max-h-28">
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <Tooltip key={dept.name}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleDeptClick(dept.name)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${filterDept === dept.name ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-[var(--alo-border)] text-[var(--alo-body)] hover:bg-[var(--alo-page)]"}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${dept.healthy === dept.total ? "bg-emerald-500" : dept.healthy > 0 ? "bg-amber-500" : "bg-red-500"}`} />
                          <span className="max-w-[140px] truncate">{dept.name}</span>
                          <span className="text-[var(--alo-text-muted)] font-normal">{dept.active}/{dept.total}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <div className="font-medium">{dept.name}</div>
                        <div className="text-[var(--alo-text-muted)] mt-1">
                          {dept.total} agents | {dept.active} active | {dept.healthy} healthy | {dept.degraded} degraded
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* ── Filters ── */}
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)]" />
                <Input
                  placeholder="Search agents by name, ID, or department..."
                  className="pl-9 h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => <SelectItem key={d.name} value={d.name}>{d.name} ({d.total})</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-36 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterHealth} onValueChange={setFilterHealth}>
                <SelectTrigger className="w-full sm:w-36 h-9 text-sm"><SelectValue placeholder="Health" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Health</SelectItem>
                  {Object.entries(healthConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {(search || filterDept !== "all" || filterStatus !== "all" || filterHealth !== "all") && (
                <Button variant="ghost" size="sm" className=" " onClick={() => { setSearch(""); setFilterDept("all"); setFilterStatus("all"); setFilterHealth("all"); }}>
                  <Filter className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Data Table ── */}
        <Card className="overflow-hidden">
          <ScrollArea className="max-h-[520px]">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-red-600 font-medium">Failed to load agents</p>
                <p className="text-xs text-[var(--alo-text-muted)] mt-1">{error}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchData()}>Retry</Button>
              </div>
            ) : agents.length === 0 ? (
              <div className="p-12 text-center">
                <Search className="w-8 h-8 text-[var(--alo-placeholder)] mx-auto mb-3" />
                <p className="text-sm text-[var(--alo-text-muted)] font-medium">No agents match your filters</p>
                <p className="text-xs text-[var(--alo-text-muted)] mt-1">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[var(--alo-page)] hover:bg-[var(--alo-page)]">
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] w-[100px]">ID</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] min-w-[160px]">Agent</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] min-w-[140px]">Department</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] w-[90px]">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] w-[90px]">Health</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] w-[80px]">Success</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] w-[90px]">Latency</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] w-[80px]">Tasks/Day</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] w-[80px]">Queue</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] w-[70px]">Approval</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] w-[80px]">Uptime</TableHead>
                    <TableHead className="text-xs font-semibold text-[var(--alo-body)] w-[100px]">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => {
                    const sc = statusConfig[agent.status];
                    const hc = healthConfig[agent.health];
                    return (
                      <TableRow key={agent.id} className="hover:bg-[var(--alo-page)]/50">
                        {/* ID */}
                        <TableCell className="py-2.5">
                          <span className="text-xs font-mono text-[var(--alo-text-muted)]">{agent.id}</span>
                        </TableCell>

                        {/* Agent Name */}
                        <TableCell className="py-2.5">
                          <div className="flex items-start gap-2">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${sc.bgClass} ${sc.color}`}>
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-[var(--alo-text)] truncate">{agent.name}</div>
                              <div className="text-xs text-[var(--alo-text-muted)] truncate max-w-[200px]" title={agent.description}>{agent.description}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Department */}
                        <TableCell className="py-2.5">
                          <button
                            onClick={() => handleDeptClick(agent.department)}
                            className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline font-medium"
                          >
                            {agent.department}
                          </button>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-2.5">
                          <Badge variant="outline" className={`text-xs gap-1 ${sc.bgClass} ${sc.color} border-0`}>
                            {sc.icon} {sc.label}
                          </Badge>
                        </TableCell>

                        {/* Health */}
                        <TableCell className="py-2.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${hc.dotColor} ${agent.health === "critical" ? "animate-pulse" : ""}`} />
                                <span className="text-xs text-[var(--alo-body)]">{hc.label}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              <div>Health: {agent.health.toUpperCase()}</div>
                              {agent.status === "error" && <div className="text-red-500 mt-0.5">{agent.errorCount24h} errors in 24h</div>}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Success Rate */}
                        <TableCell className="py-2.5">
                          {agent.status === "active" ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1.5 bg-[var(--alo-surface-muted)] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${agent.successRate >= 0.95 ? "bg-emerald-500" : agent.successRate >= 0.85 ? "bg-amber-500" : "bg-red-500"}`}
                                  style={{ width: `${agent.successRate * 100}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${agent.successRate >= 0.95 ? "text-emerald-600" : agent.successRate >= 0.85 ? "text-amber-600" : "text-red-600"}`}>
                                {(agent.successRate * 100).toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--alo-placeholder)]">--</span>
                          )}
                        </TableCell>

                        {/* Latency */}
                        <TableCell className="py-2.5">
                          {agent.status === "active" ? (
                            <span className={`text-xs font-mono ${agent.latencyMs > 500 ? "text-red-600" : agent.latencyMs > 200 ? "text-amber-600" : "text-[var(--alo-body)]"}`}>
                              {agent.latencyMs}ms
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--alo-placeholder)]">--</span>
                          )}
                        </TableCell>

                        {/* Tasks Today */}
                        <TableCell className="py-2.5">
                          {agent.status === "active" ? (
                            <span className="text-xs font-medium text-[var(--alo-body)]">{agent.tasksToday.toLocaleString()}</span>
                          ) : (
                            <span className="text-xs text-[var(--alo-placeholder)]">0</span>
                          )}
                        </TableCell>

                        {/* Queue Depth */}
                        <TableCell className="py-2.5">
                          {agent.queueDepth > 0 ? (
                            <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                              {agent.queueDepth}
                            </Badge>
                          ) : (
                            <span className="text-xs text-[var(--alo-placeholder)]">0</span>
                          )}
                        </TableCell>

                        {/* Human Approval */}
                        <TableCell className="py-2.5">
                          {agent.requiresHumanApproval ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs gap-0.5 border-amber-200 bg-amber-50 text-amber-700">
                                  <UserCheck className="w-3 h-3" /> Yes
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>This agent requires human approval for critical actions</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-[var(--alo-placeholder)]">Auto</span>
                          )}
                        </TableCell>

                        {/* Uptime */}
                        <TableCell className="py-2.5">
                          <span className="text-xs text-[var(--alo-body)]">{formatUptime(agent.uptimeHours)}</span>
                        </TableCell>

                        {/* Last Active */}
                        <TableCell className="py-2.5">
                          <span className="text-xs text-[var(--alo-text-muted)]">{timeAgo(agent.lastActive)}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-[var(--alo-page)]">
              <div className="text-xs text-[var(--alo-text-muted)]">
                Showing {(pagination.page - 1) * pagination.limit + 1}{"-"}{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} agents
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="size-12 " disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-[var(--alo-body)] px-2">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button variant="outline" size="icon" className="size-12 " disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </TooltipProvider>
  );
}

// ─── Stat Card Sub-component ────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number; sub: string; color: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3 flex items-start gap-2.5">
        <div className={`mt-0.5 ${color}`}>{icon}</div>
        <div>
          <div className="text-xl font-bold">{value.toLocaleString()}</div>
          <div className="text-xs text-[var(--alo-text-muted)]">{label}</div>
          <div className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}