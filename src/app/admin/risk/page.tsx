'use client';

// ============================================================
// APPLICATION RISK (s111) + STUDENT SUCCESS (s112) DASHBOARD
// ============================================================
// Management roll-up of the two operational scores, plus a drill-down into one
// application's scored factors.
//
// Honesty rules enforced here:
//   * Applications that have never been scored are reported as UNASSESSED, not
//     folded into GREEN (s92). A dashboard that showed only scored rows would
//     quietly look healthier than the book actually is.
//   * The student success score always carries its disclaimer: it is operational
//     support, never an admission or visa prediction (s15, s93).
//   * A disabled feature flag returns NOT_CONFIGURED and is rendered as such,
//     never as an empty "all clear" (s94).
//   * Every factor shown names the real field that produced it, so a score can
//     be argued with (s16 explainability).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Activity,
  AlertTriangle,
  Info,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

type RiskLevel = 'GREEN' | 'AMBER' | 'RED';
type SuccessBand = 'ON_TRACK' | 'NEEDS_SUPPORT' | 'AT_RISK' | 'CRITICAL';

interface Distribution {
  applications: {
    total: number;
    assessed: number;
    unassessed: number;
    distribution: Record<RiskLevel, number>;
  };
  students: { students: number; distribution: Record<SuccessBand, number> };
  disclaimer: string;
}

interface RiskFactor {
  code: string;
  label: string;
  severity: string;
  points: number;
  detail?: string;
}

interface Assessment {
  applicationId: string;
  riskLevel: RiskLevel;
  score: number;
  factors: RiskFactor[];
  missingItems: string[];
  evaluatedBy?: string | null;
  evaluatedAt?: string | null;
}

const RISK_STYLE: Record<RiskLevel, string> = {
  GREEN: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  AMBER: 'border-amber-200 bg-amber-50 text-amber-800',
  RED: 'border-red-200 bg-red-50 text-red-800',
};

const BAND_STYLE: Record<SuccessBand, string> = {
  ON_TRACK: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  NEEDS_SUPPORT: 'border-blue-200 bg-blue-50 text-blue-800',
  AT_RISK: 'border-amber-200 bg-amber-50 text-amber-800',
  CRITICAL: 'border-red-200 bg-red-50 text-red-800',
};

const SEVERITY_STYLE: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-800',
  LOW: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
};

export default function RiskDashboardPage() {
  const [data, setData] = useState<Distribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');
  const [notConfigured, setNotConfigured] = useState('');
  const [country, setCountry] = useState('');
  const [stage, setStage] = useState('');

  const [lookupId, setLookupId] = useState('');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'none' | 'error'>('idle');
  const [lookupMessage, setLookupMessage] = useState('');

  const load = useCallback(async (nextCountry: string, nextStage: string) => {
    setLoading(true);
    setFailure('');
    setNotConfigured('');
    try {
      const params = new URLSearchParams();
      if (nextCountry.trim()) params.set('country', nextCountry.trim());
      if (nextStage.trim()) params.set('stage', nextStage.trim());
      const res = await fetch(`/api/risk/distribution?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (json?.status === 'NOT_CONFIGURED' || res.status === 404) {
        setNotConfigured(json?.error || 'Risk scoring is not configured.');
        return;
      }
      if (!res.ok || !json?.success) {
        setFailure(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      setData(json as Distribution);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Could not reach the risk engine.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load('', '');
  }, [load]);

  const lookup = useCallback(async (recompute: boolean) => {
    const id = lookupId.trim();
    if (!id) {
      toast.error('Enter an application id first.');
      return;
    }
    setLookupState('loading');
    setLookupMessage('');
    setAssessment(null);
    try {
      const res = await fetch(
        `/api/risk/applications/${encodeURIComponent(id)}${recompute ? '?recompute=true' : ''}`,
        { cache: 'no-store' },
      );
      const json = await res.json().catch(() => null);

      if (json?.status === 'NOT_CONFIGURED') {
        setLookupState('error');
        setLookupMessage(json.error);
        return;
      }
      if (!res.ok || !json?.success) {
        setLookupState('error');
        setLookupMessage(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      if (!json.assessment) {
        setLookupState('none');
        setLookupMessage(
          'This application has not been scored yet. Recompute to score it from its current data.',
        );
        return;
      }
      setAssessment(json.assessment as Assessment);
      setLookupState('idle');
    } catch (error) {
      setLookupState('error');
      setLookupMessage(error instanceof Error ? error.message : 'Lookup failed.');
    }
  }, [lookupId]);

  const totalApplications = data?.applications.total ?? 0;
  const assessed = data?.applications.assessed ?? 0;
  const unassessed = data?.applications.unassessed ?? 0;
  const assessedPct = totalApplications > 0 ? Math.round((assessed / totalApplications) * 100) : 0;

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--alo-text)]">
            <ShieldAlert className="size-5 text-[var(--alo-brand)]" />
            Application Risk &amp; Student Success
          </h1>
          <p className="mt-1 text-sm text-[var(--alo-body)]">
            Operational scores computed from live application data. Never a guarantee of admission or
            visa outcome.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Country"
            className="h-9 w-28 text-xs"
            aria-label="Filter by country"
          />
          <Input
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            placeholder="Stage"
            className="h-9 w-32 text-xs"
            aria-label="Filter by stage"
          />
          <Button size="sm" onClick={() => void load(country, stage)} disabled={loading}>
            <RefreshCw className="mr-1.5 size-3.5" />
            {loading ? 'Loading…' : 'Apply'}
          </Button>
        </div>
      </div>

      {notConfigured && (
        <Card className="rounded-2xl border-2 border-[var(--alo-border-strong)] bg-[var(--alo-page)]">
          <CardContent className="flex items-start gap-3 pt-6 pb-6">
            <Info className="mt-0.5 size-5 shrink-0 text-[var(--alo-text-muted)]" />
            <div>
              <p className="text-sm font-bold text-[var(--alo-text)]">NOT CONFIGURED</p>
              <p className="mt-0.5 text-xs text-[var(--alo-body)]">{notConfigured}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {failure && (
        <Card className="rounded-2xl border-2 border-red-200">
          <CardContent className="flex flex-col items-start gap-3 pt-6 pb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-bold text-red-800">Risk engine unavailable</p>
                <p className="mt-0.5 text-xs text-red-700">{failure}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void load(country, stage)}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* ---------------- Application risk (s111) ---------------- */}
          <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <AlertTriangle className="size-4 text-[var(--alo-brand)]" />
                Application risk distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {(['RED', 'AMBER', 'GREEN'] as RiskLevel[]).map((level) => (
                  <div key={level} className={`rounded-xl border-2 p-3 ${RISK_STYLE[level]}`}>
                    <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{level}</p>
                    <p className="text-3xl font-black">{data.applications.distribution[level] ?? 0}</p>
                  </div>
                ))}
              </div>

              {/* Unassessed rows are stated, never hidden inside a band (s92). */}
              <div className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs">
                <p className="font-semibold text-[var(--alo-text)]">
                  {assessed} of {totalApplications} applications scored ({assessedPct}%)
                </p>
                {unassessed > 0 && (
                  <p className="mt-1 flex items-start gap-1.5 text-amber-800">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      {unassessed} application{unassessed === 1 ? '' : 's'} ha
                      {unassessed === 1 ? 's' : 've'} never been scored and
                      {unassessed === 1 ? ' is' : ' are'} not included in any band above. Score them
                      before treating this distribution as complete.
                    </span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ---------------- Student success (s112) ---------------- */}
          <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <TrendingUp className="size-4 text-[var(--alo-brand)]" />
                Student success bands
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(['CRITICAL', 'AT_RISK', 'NEEDS_SUPPORT', 'ON_TRACK'] as SuccessBand[]).map((band) => (
                  <div key={band} className={`rounded-xl border-2 p-3 ${BAND_STYLE[band]}`}>
                    <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">
                      {band.replace('_', ' ')}
                    </p>
                    <p className="text-3xl font-black">{data.students.distribution[band] ?? 0}</p>
                  </div>
                ))}
              </div>

              {data.students.students === 0 ? (
                <p className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs text-[var(--alo-body)]">
                  No student has been scored yet, so every band reads zero. This is an absence of
                  assessments, not an absence of risk.
                </p>
              ) : (
                <p className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs text-[var(--alo-body)]">
                  {data.students.students} student{data.students.students === 1 ? '' : 's'} scored from
                  their latest assessment.
                </p>
              )}

              <p className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-900">
                <strong className="font-bold">About this score:</strong> {data.disclaimer}
              </p>
            </CardContent>
          </Card>

          {/* ---------------- Drill-down ---------------- */}
          <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Search className="size-4 text-[var(--alo-brand)]" />
                Inspect one application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Input
                  value={lookupId}
                  onChange={(event) => setLookupId(event.target.value)}
                  placeholder="Application id"
                  className="h-9 max-w-xs flex-1 text-xs"
                  aria-label="Application id"
                />
                <Button variant="outline" size="sm" onClick={() => void lookup(false)} disabled={lookupState === 'loading'}>
                  Read latest
                </Button>
                <Button size="sm" onClick={() => void lookup(true)} disabled={lookupState === 'loading'}>
                  <Activity className="mr-1.5 size-3.5" />
                  Recompute now
                </Button>
              </div>

              {lookupState === 'loading' && <p className="text-xs text-[var(--alo-text-muted)]">Scoring…</p>}
              {lookupState === 'none' && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                  {lookupMessage}
                </p>
              )}
              {lookupState === 'error' && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                  {lookupMessage}
                </p>
              )}

              {assessment && (
                <div className="space-y-3">
                  <div className={`flex items-center justify-between rounded-xl border-2 p-3 ${RISK_STYLE[assessment.riskLevel]}`}>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">Risk level</p>
                      <p className="text-2xl font-black">{assessment.riskLevel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">Score</p>
                      <p className="text-2xl font-black">{assessment.score}</p>
                    </div>
                  </div>

                  {assessment.factors.length === 0 ? (
                    <p className="text-xs text-[var(--alo-body)]">
                      No risk factors fired for this application on its current data.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">
                        Factors ({assessment.factors.length})
                      </p>
                      {assessment.factors.map((factor) => (
                        <div
                          key={factor.code}
                          className="flex items-start justify-between gap-2 rounded-lg border border-[var(--alo-border)] p-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--alo-text)]">{factor.label}</p>
                            <p className="font-mono text-[11px] text-[var(--alo-text-muted)]">{factor.code}</p>
                            {factor.detail && (
                              <p className="mt-0.5 text-[11px] text-[var(--alo-body)]">{factor.detail}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Badge variant="outline" className={`text-[11px] ${SEVERITY_STYLE[factor.severity] ?? ''}`}>
                              {factor.severity}
                            </Badge>
                            <span className="font-mono text-xs font-bold text-[var(--alo-body)]">
                              +{factor.points}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {assessment.missingItems.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">
                        Missing items
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-900">
                        {assessment.missingItems.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assessment.evaluatedAt && (
                    <p className="text-[11px] text-[var(--alo-text-muted)]">
                      Scored {new Date(assessment.evaluatedAt).toLocaleString()}
                      {assessment.evaluatedBy ? ` by ${assessment.evaluatedBy}` : ''}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
