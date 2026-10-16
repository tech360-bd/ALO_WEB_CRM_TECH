'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CountUp } from '@/components/ui/count-up';
import {
  Users,
  FileText,
  ShieldAlert,
  Activity,
  ScrollText,
  AlertTriangle,
  GraduationCap,
  BarChart3,
  RefreshCw,
  Info,
  Handshake,
  UserCheck,
  BookOpen,
  Award,
  Target,
  CheckCircle,
  Clock,
  FileCheck,
  MessageSquare,
} from 'lucide-react';

// ============================================================
// Types — mirror GET /api/crm/dashboard
// ============================================================

interface Kpi {
  label: string;
  value: string;
  change: string | null;
  changeMeasured: boolean;
  icon: string;
}

interface DashboardTable {
  title: string;
  columns: string[];
  rows: string[][];
}

interface DashboardAlert {
  message: string;
  severity: 'warning' | 'error' | 'success';
  action: string;
}

interface ChartPoint {
  label: string;
  value: number;
}

interface DashboardChart {
  title: string;
  data: ChartPoint[];
}

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

interface DashboardPayload {
  kpis: Kpi[];
  tables: DashboardTable[];
  alerts: DashboardAlert[];
  charts: DashboardChart[];
  recentLogs: AuditEntry[];
  meta: { generatedAt: string; role: string; user: string | null };
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

const KPI_ICONS: Record<string, React.ElementType> = {
  Users,
  FileText,
  Handshake,
  UserCheck,
  GraduationCap,
  BookOpen,
  Award,
  Target,
  CheckCircle,
  Clock,
  FileCheck,
  MessageSquare,
};

const ALERT_STYLES: Record<DashboardAlert['severity'], { border: string; label: string }> = {
  error: { border: 'border-red-200 bg-red-50', label: 'High' },
  warning: { border: 'border-amber-200 bg-amber-50', label: 'Medium' },
  success: { border: 'border-emerald-200 bg-emerald-50', label: 'OK' },
};

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function CrmAdminDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [state, setState] = useState<LoadState>({ loading: true, error: null });

  const load = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const response = await fetch('/api/crm/dashboard');
      if (!response.ok) throw new Error(`Could not load the dashboard (HTTP ${response.status})`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error || 'The dashboard returned no data');
      setData(payload.data);
      setState({ loading: false, error: null });
    } catch (error) {
      setData(null);
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load the dashboard',
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stageChart = data?.charts.find((chart) => /stage/i.test(chart.title)) || null;
  const stageMax = stageChart
    ? Math.max(1, ...stageChart.data.map((point) => point.value))
    : 1;

  return (
    <div className="bg-alo-page min-h-screen space-y-6 p-4 lg:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-alo-text text-2xl font-bold">System Overview</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge variant="danger" className="text-[11px]">
              <ShieldAlert className="mr-1 h-3 w-3" />
              Super Admin
            </Badge>
            {data?.meta.user ? (
              <span className="text-alo-text-muted text-sm">Signed in as {data.meta.user}</span>
            ) : null}
            {data?.meta.generatedAt ? (
              <span className="text-alo-text-muted text-xs">
                Generated {formatTimestamp(data.meta.generatedAt)}
              </span>
            ) : null}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {state.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{state.error}</p>
              <button
                type="button"
                className="mt-1 underline underline-offset-2"
                onClick={() => void load()}
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {state.loading && !data && (
        <Card>
          <CardContent className="text-alo-text-muted py-12 text-center text-sm">
            Loading dashboard…
          </CardContent>
        </Card>
      )}

      {!state.loading && !data && !state.error && (
        <Card>
          <CardContent className="text-alo-text-muted py-12 text-center text-sm">
            No dashboard data is available.
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* ── KPI row ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {data.kpis.map((kpi) => {
              const Icon = KPI_ICONS[kpi.icon] || Activity;
              return (
                <Card key={kpi.label} className="rounded-2xl border border-alo-border bg-white shadow-card transition-shadow duration-200 hover:shadow-hover">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-alo-brand-light">
                        <Icon className="text-alo-brand h-5 w-5" aria-hidden="true" />
                      </span>
                      {kpi.changeMeasured && kpi.change && (
                        <Badge variant={kpi.change.trim().startsWith('-') ? 'warning' : 'success'} className="text-[11px]">
                          {kpi.change}
                        </Badge>
                      )}
                    </div>
                    <p className="text-alo-text font-heading text-[28px] font-bold leading-none">
                      <CountUp value={kpi.value} />
                    </p>
                    <p className="text-alo-text-muted mt-1.5 text-xs font-medium">{kpi.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* ── Application stages ── */}
            <Card className="border-alo-border bg-white lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-alo-text flex items-center gap-2 text-base">
                  <BarChart3 className="text-alo-brand h-4 w-4" />
                  {stageChart?.title || 'Applications by Stage'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!stageChart || stageChart.data.length === 0 ? (
                  <p className="text-alo-text-muted py-8 text-center text-sm">
                    No application stage data is available.
                  </p>
                ) : (
                  stageChart.data.map((point) => (
                    <div key={point.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-alo-text capitalize">{point.label}</span>
                        <span className="text-alo-text-muted">{point.value}</span>
                      </div>
                      <Progress value={(point.value / stageMax) * 100} className="h-2" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* ── Alerts ── */}
            <Card className="border-alo-border bg-white">
              <CardHeader>
                <CardTitle className="text-alo-text flex items-center gap-2 text-base">
                  <AlertTriangle className="text-amber-600 h-4 w-4" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.alerts.length === 0 ? (
                  <p className="text-alo-text-muted py-8 text-center text-sm">No alerts.</p>
                ) : (
                  data.alerts.map((alert, index) => {
                    const style = ALERT_STYLES[alert.severity] || ALERT_STYLES.success;
                    return (
                      <div
                        key={`${alert.message}-${index}`}
                        className={`flex items-center justify-between rounded-lg border p-3 ${style.border}`}
                      >
                        <p className="text-alo-text truncate text-xs">{alert.message}</p>
                        <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">
                          {style.label}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Tables ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {data.tables.map((table) => (
              <Card key={table.title} className="border-alo-border bg-white">
                <CardHeader>
                  <CardTitle className="text-alo-text text-base">{table.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {table.rows.length === 0 ? (
                    <p className="text-alo-text-muted py-8 text-center text-sm">
                      Nothing recorded yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-alo-border text-alo-text-muted border-b">
                            {table.columns.map((column) => (
                              <th key={column} className="py-2 pr-3 font-medium">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, rowIndex) => (
                            <tr
                              key={`${table.title}-${rowIndex}`}
                              className="border-alo-border border-b last:border-0"
                            >
                              {row.map((cell, cellIndex) => (
                                <td key={`${table.title}-${rowIndex}-${cellIndex}`} className="text-alo-text py-2 pr-3">
                                  {cell || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Recent audit activity ── */}
          <Card className="border-alo-border bg-white">
            <CardHeader>
              <CardTitle className="text-alo-text flex items-center gap-2 text-base">
                <ScrollText className="text-alo-brand h-4 w-4" />
                Recent platform activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentLogs.length === 0 ? (
                <p className="text-alo-text-muted py-8 text-center text-sm">
                  No audit activity has been recorded yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.recentLogs.map((entry) => (
                    <li
                      key={entry.id}
                      className="border-alo-border flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {entry.action.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-alo-text-muted text-xs">
                          {entry.entityType || 'unspecified entity'}
                          {entry.entityId ? ` · ${entry.entityId}` : ''}
                        </span>
                      </div>
                      <span className="text-alo-text-muted text-xs">
                        {formatTimestamp(entry.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-alo-border bg-white">
            <CardContent className="text-alo-text-muted flex items-start gap-2 p-4 text-xs">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Every figure above is a live count from the database. Period-over-period change is
                not shown because no historical baseline is stored. Departmental headcounts and a
                lead-to-enrolment funnel are not listed because nothing on this platform measures
                them.
              </span>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
