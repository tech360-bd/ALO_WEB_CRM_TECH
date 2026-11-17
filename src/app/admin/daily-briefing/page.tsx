'use client';

// ============================================================
// AI DAILY MANAGEMENT BRIEFING — management briefing (spec s109)
// ============================================================
// "Yesterday / Today / At risk / Opportunities / Revenue / Applications /
// Visa / Partner performance / Marketing / System issues."
//
// Every figure rendered here is a real database count/sum computed by the
// server at request time. This page never invents, interpolates or predicts
// numbers: a section whose query failed renders an explicit ERROR with its
// reason, never a comfortable zero (s91). Highlights are deterministic
// sentences derived from the same numbers (s93).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  Newspaper,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

type Severity = 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';

interface BriefingStat {
  label: string;
  value: string;
  linkTo?: string;
}

interface BriefingSection {
  key: string;
  title: string;
  severity: Severity;
  status: 'OK' | 'ERROR';
  error?: string;
  summary: string;
  linkTo?: string;
  stats: BriefingStat[];
}

interface DailyBriefing {
  generatedAt: string;
  day: string;
  highlights: string[];
  sections: BriefingSection[];
}

const SEVERITY_STYLE: Record<Severity, string> = {
  CRITICAL: 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border',
  URGENT: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] border-[var(--alo-cta)]/25',
  WARNING: 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border',
  INFO: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
};

export default function DailyBriefingPage() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure('');
    try {
      const res = await fetch('/api/intelligence/daily-briefing', { cache: 'no-store' });
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
      setBriefing(json.briefing as DailyBriefing);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Could not reach the briefing engine.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !briefing) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-72 rounded-lg bg-[var(--alo-page)]" />
          <div className="h-28 rounded-2xl bg-[var(--alo-surface-muted)]" />
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[var(--alo-surface-muted)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (unauthorized || (!briefing && failure)) {
    return (
      <div className="p-6">
        <Card className="rounded-2xl border-2 border-crm-danger-border">
          <CardContent className="flex flex-col items-center gap-3 pt-8 pb-8 text-center">
            <ShieldAlert className="size-9 text-crm-danger-text" />
            <h2 className="text-base font-bold">
              {unauthorized ? 'Management access required' : 'Daily briefing unavailable'}
            </h2>
            <p className="max-w-md text-sm text-[var(--alo-body)]">{failure}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!briefing) return null;

  const errored = briefing.sections.filter((section) => section.status === 'ERROR');

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--alo-text)]">
            <Newspaper className="size-5 text-[var(--alo-brand)]" />
            Daily Management Briefing
          </h1>
          <p className="mt-1 text-sm text-[var(--alo-body)]">
            {briefing.day} · generated {new Date(briefing.generatedAt).toLocaleString()} · every figure is computed live from the database
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="mr-1.5 size-3.5" />
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {/* Highlights — deterministic sentences rendered from the numbers below */}
      <Card className="rounded-2xl border border-[var(--alo-border)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="size-4 text-[var(--alo-brand)]" /> Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {briefing.highlights.length === 0 ? (
            <p className="text-sm text-[var(--alo-body)]">
              No highlights could be derived from the sections that computed successfully.
            </p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm text-[var(--alo-text)]">
              {briefing.highlights.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          )}
          {errored.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-crm-danger-text">
              <AlertTriangle className="size-3.5" />
              {errored.length} section(s) failed to compute and are shown as errors, not zeros.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {briefing.sections.map((section) => (
          <Card key={section.key} className="rounded-2xl border border-[var(--alo-border)]">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-sm">{section.title}</CardTitle>
                <p className="mt-0.5 text-[11px] text-[var(--alo-body)]">{section.summary}</p>
              </div>
              <Badge className={`border text-[11px] font-bold ${SEVERITY_STYLE[section.severity]}`}>
                {section.severity}
              </Badge>
            </CardHeader>
            <CardContent>
              {section.status === 'ERROR' ? (
                <div className="rounded-xl border border-crm-danger-border bg-crm-danger-bg p-3">
                  <p className="text-xs font-bold text-crm-danger-text">Section failed to compute</p>
                  <p className="mt-1 text-xs text-crm-danger-text/90">{section.error}</p>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--alo-border)]">
                  {section.stats.map((item) => (
                    <li key={item.label} className="flex items-center justify-between gap-3 py-1.5">
                      <span className="text-xs text-[var(--alo-body)]">{item.label}</span>
                      {item.linkTo ? (
                        <Link
                          href={item.linkTo}
                          className="group flex items-center gap-1 text-xs font-semibold text-[var(--alo-brand)] hover:underline"
                        >
                          {item.value}
                          <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-[var(--alo-text)]">{item.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {section.linkTo && section.status === 'OK' && (
                <div className="mt-2 text-right">
                  <Link
                    href={section.linkTo}
                    className="text-[11px] font-medium text-[var(--alo-brand)] hover:underline"
                  >
                    Open workspace →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance note */}
      <p className="text-center text-[11px] text-[var(--alo-body)]">
        This briefing contains operational counts only. It does not predict admission, visa or
        enrolment outcomes, and it never replaces professional judgement.
      </p>
    </div>
  );
}
