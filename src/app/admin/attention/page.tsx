'use client';

// ============================================================
// WHAT NEEDS ATTENTION? — management attention engine (spec s108)
// ============================================================
// On login, management must see the operational pressure across the whole
// platform, and every number must link to the underlying records (s108).
//
// Honesty rules enforced in this UI:
//   * A bucket whose query FAILED renders as an error with its reason, never as
//     a comfortable "0" (s91). The report totals errored buckets separately.
//   * Counts link to a real filtered route, and the sample ids shown are real
//     record ids returned by the engine, not placeholders (s92).
//   * Severity uses the platform vocabulary INFO/WARNING/URGENT/CRITICAL (s85).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  Activity,
  Info,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

type Severity = 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';

interface AttentionBucket {
  key: string;
  label: string;
  count: number;
  severity: Severity;
  linkTo: string;
  sample: string[];
  status: 'OK' | 'ERROR';
  error?: string;
  description: string;
}

interface AttentionReport {
  generatedAt: string;
  scope: 'GLOBAL' | 'BRANCH' | 'USER';
  scopeId: string;
  generatedFor: string;
  totals: { critical: number; urgent: number; warning: number; info: number; total: number; errored: number };
  buckets: AttentionBucket[];
}

const SEVERITY_STYLE: Record<Severity, { className: string; icon: typeof Info }> = {
  CRITICAL: { className: 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border', icon: ShieldAlert },
  URGENT: { className: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] border-[var(--alo-cta)]/25', icon: AlertTriangle },
  WARNING: { className: 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border', icon: AlertTriangle },
  INFO: { className: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]', icon: Info },
};

const SCOPES = [
  { id: 'GLOBAL', label: 'Whole platform' },
  { id: 'BRANCH', label: 'My branch' },
  { id: 'USER', label: 'My queue' },
];

export default function AttentionPage() {
  const [report, setReport] = useState<AttentionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<string>('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [scope, setScope] = useState('GLOBAL');

  const load = useCallback(async (nextScope: string, persist = false) => {
    setLoading(true);
    setFailure('');
    try {
      const params = new URLSearchParams({ scope: nextScope, sampleSize: '5' });
      if (persist) params.set('persist', 'true');
      const res = await fetch(`/api/intelligence/attention?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        setFailure(json?.error || 'Management access is required.');
        return;
      }
      if (!res.ok || !json?.success) {
        setFailure(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      setUnauthorized(false);
      setReport(json.report as AttentionReport);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Could not reach the attention engine.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(scope);
  }, [load, scope]);

  if (loading && !report) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded-lg bg-[var(--alo-page)]" />
          <div className="grid gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-[var(--alo-surface-muted)]" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-[var(--alo-surface-muted)]" />
        </div>
      </div>
    );
  }

  if (unauthorized || (!report && failure)) {
    return (
      <div className="p-6">
        <Card className="rounded-2xl border-2 border-crm-danger-border">
          <CardContent className="flex flex-col items-center gap-3 pt-8 pb-8 text-center">
            <ShieldAlert className="size-9 text-crm-danger-text" />
            <h2 className="text-base font-bold">
              {unauthorized ? 'Management access required' : 'Attention engine unavailable'}
            </h2>
            <p className="max-w-md text-sm text-[var(--alo-body)]">{failure}</p>
            <Button variant="outline" size="sm" onClick={() => void load(scope)}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) return null;

  const erroredBuckets = report.buckets.filter((bucket) => bucket.status === 'ERROR');
  const actionable = report.buckets.filter((bucket) => bucket.status === 'OK' && bucket.count > 0);
  const clear = report.buckets.filter((bucket) => bucket.status === 'OK' && bucket.count === 0);

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--alo-text)]">
            <Activity className="size-5 text-[var(--alo-brand)]" />
            What needs attention?
          </h1>
          <p className="mt-1 text-sm text-[var(--alo-body)]">
            Generated {new Date(report.generatedAt).toLocaleString()} · scope {report.scope}
            {report.scopeId ? ` ${report.scopeId}` : ''} · every figure links to the underlying records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className="h-9 rounded-lg border border-[var(--alo-border)] bg-white px-2 text-xs font-medium"
            aria-label="Attention scope"
          >
            {SCOPES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => void load(scope)} disabled={loading}>
            <RefreshCw className="mr-1.5 size-3.5" />
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Severity totals */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(['CRITICAL', 'URGENT', 'WARNING', 'INFO'] as Severity[]).map((severity) => {
          const value =
            severity === 'CRITICAL'
              ? report.totals.critical
              : severity === 'URGENT'
                ? report.totals.urgent
                : severity === 'WARNING'
                  ? report.totals.warning
                  : report.totals.info;
          const style = SEVERITY_STYLE[severity];
          const IconCmp = style.icon;
          return (
            <Card key={severity} className={`rounded-2xl border-2 ${style.className}`}>
              <CardContent className="flex items-center justify-between pt-5 pb-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{severity}</p>
                  <p className="text-2xl font-black">{value}</p>
                </div>
                <IconCmp className="size-6 opacity-70" />
              </CardContent>
            </Card>
          );
        })}
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardContent className="flex items-center justify-between pt-5 pb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">Total items</p>
              <p className="text-2xl font-black text-[var(--alo-text)]">{report.totals.total}</p>
            </div>
            <ArrowRight className="size-6 text-[var(--alo-text-muted)]" />
          </CardContent>
        </Card>
      </div>

      {/* A failed bucket must never be mistaken for a clear one (s91) */}
      {erroredBuckets.length > 0 && (
        <Card className="rounded-2xl border-2 border-crm-danger-border bg-crm-danger-bg/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-crm-danger-text">
              <ShieldAlert className="size-4" />
              {erroredBuckets.length} check{erroredBuckets.length === 1 ? '' : 's'} could not be evaluated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-crm-danger-text">
              These figures are UNKNOWN, not zero. The totals above exclude them.
            </p>
            {erroredBuckets.map((bucket) => (
              <div key={bucket.key} className="rounded-lg border border-crm-danger-border bg-white p-2.5">
                <p className="text-xs font-bold text-[var(--alo-text)]">{bucket.label}</p>
                <p className="mt-0.5 font-mono text-[11px] text-crm-danger-text">{bucket.error || 'Unknown error'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actionable buckets, most severe first */}
      <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
        <CardHeader>
          <CardTitle className="text-sm font-bold">
            Needs action ({actionable.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actionable.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--alo-text-muted)]">
              Nothing is currently flagged across the evaluated checks.
            </p>
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2">
              {actionable.map((bucket) => {
                const style = SEVERITY_STYLE[bucket.severity];
                return (
                  <div key={bucket.key} className="rounded-xl border-2 border-[var(--alo-border)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--alo-text)]">{bucket.label}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--alo-body)]">{bucket.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-black leading-none text-[var(--alo-text)]">{bucket.count}</p>
                        <Badge variant="outline" className={`mt-1 text-[11px] ${style.className}`}>
                          {bucket.severity}
                        </Badge>
                      </div>
                    </div>

                    {bucket.sample.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {bucket.sample.map((id) => (
                          <span
                            key={id}
                            className="rounded bg-[var(--alo-surface-muted)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--alo-body)]"
                            title={id}
                          >
                            {id.length > 14 ? `${id.slice(0, 14)}…` : id}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link
                      href={bucket.linkTo}
                      className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--alo-brand)] hover:underline"
                    >
                      Open these records
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear checks are shown so "nothing to do" is evidenced, not assumed */}
      {clear.length > 0 && (
        <Card className="rounded-2xl border-2 border-crm-success-border bg-crm-success-bg/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-crm-success-text">Clear ({clear.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {clear.map((bucket) => (
              <Badge key={bucket.key} variant="outline" className="border-crm-success-border bg-white text-[11px] text-crm-success-text">
                {bucket.label}: 0
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-[11px] text-[var(--alo-text-muted)]">
        Counts are computed from live database rows at request time. A check that could not run is
        reported above as unknown rather than being counted as clear.
      </p>
    </div>
  );
}
