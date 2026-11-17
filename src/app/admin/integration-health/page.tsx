'use client';

/**
 * Integration Health — spec §23 "Integration Health".
 *
 * Every number on this page comes from a live API call made by this browser
 * session. Nothing here is a configured constant pretending to be a result:
 * a section that cannot be read shows UNAVAILABLE with the failure, and a
 * section that needs a human credential shows exactly what is missing.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, HeartPulse, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';

interface GoogleStatus {
  success?: boolean;
  configured?: boolean;
  verdict?: 'NOT_CONFIGURED' | 'NOT_VERIFIED' | 'PASS' | 'FAILED';
  syncedAt?: string | null;
  importedContacts?: number;
  pendingReviews?: number;
  databaseError?: string | null;
  error?: string;
  lastBatch?: { ranAt: string; status: string; found: number; created: number; errors: number } | null;
}

interface NumbersStatus {
  success?: boolean;
  error?: string;
  stats?: {
    total: number;
    expected: number;
    connected: number;
    configured: number;
    disconnected: number;
    employeePool: number;
  };
  integrationState?: string;
}

interface DashboardMetric {
  key: string;
  label?: string;
  value: number | null;
  status: 'OK' | 'UNAVAILABLE';
}
interface ContactsDashboard {
  success?: boolean;
  error?: string;
  scope?: string;
  metrics?: DashboardMetric[];
}

type RowState =
  | { kind: 'loading' }
  | { kind: 'ok'; summary: string; detail?: string[] }
  | { kind: 'warn'; summary: string; detail?: string[] }
  | { kind: 'fail'; summary: string; detail?: string[] };

function Row({ label, href, state }: { label: string; href?: string; state: RowState }) {
  const pill =
    state.kind === 'ok' ? (
      <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> HEALTHY</Badge>
    ) : state.kind === 'warn' ? (
      <Badge className="border-amber-200 bg-amber-100 text-[var(--alo-warning-strong)]"><AlertTriangle className="mr-1 h-3.5 w-3.5" /> NEEDS SETUP</Badge>
    ) : state.kind === 'fail' ? (
      <Badge className="border-red-200 bg-red-100 text-red-800"><XCircle className="mr-1 h-3.5 w-3.5" /> UNAVAILABLE</Badge>
    ) : (
      <Badge variant="secondary">CHECKING…</Badge>
    );

  const body = (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-[var(--alo-border)] p-4">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-[var(--alo-text)]">{label}</p>
        {state.kind !== 'loading' && <p className="mt-1 text-sm text-[var(--alo-text)]">{state.summary}</p>}
        {state.kind !== 'loading' && state.detail && state.detail.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-[var(--alo-text-muted)]">
            {state.detail.map((line) => <li key={line}>{line}</li>)}
          </ul>
        )}
      </div>
      {pill}
    </div>
  );
  return href ? <Link href={href} className="block transition-shadow hover:shadow-md">{body}</Link> : body;
}

export default function IntegrationHealthPage() {
  const [google, setGoogle] = useState<RowState>({ kind: 'loading' });
  const [numbers, setNumbers] = useState<RowState>({ kind: 'loading' });
  const [registry, setRegistry] = useState<RowState>({ kind: 'loading' });
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setGoogle({ kind: 'loading' });
    setNumbers({ kind: 'loading' });
    setRegistry({ kind: 'loading' });

    const googlePromise = (async (): Promise<RowState> => {
      try {
        const res = await fetch('/api/google/contacts/status');
        const data = (await res.json()) as GoogleStatus;
        if (!res.ok || !data.success) {
          return { kind: 'fail', summary: data.error || `Google Contacts status failed (${res.status}).` };
        }
        const detail = [
          `Configured: ${data.configured ? 'yes (OAuth credential present)' : 'NO — no Google OAuth credential on this server'}`,
          `Verdict: ${data.verdict ?? 'unknown'}`,
          `Last sync: ${data.syncedAt ? new Date(data.syncedAt).toLocaleString() : 'never'}`,
          `Imported registry rows: ${data.importedContacts ?? 0} · pending human reviews: ${data.pendingReviews ?? 0}`,
          ...(data.lastBatch ? [`Last run: ${data.lastBatch.status} — found ${data.lastBatch.found}, created ${data.lastBatch.created}, errors ${data.lastBatch.errors}`] : []),
          ...(data.databaseError ? [data.databaseError] : []),
        ];
        if (data.verdict === 'PASS') return { kind: 'ok', summary: 'A live People API probe succeeded.', detail };
        if (data.verdict === 'FAILED') return { kind: 'fail', summary: 'Google answered but the probe failed — see the Google Contacts screen.', detail };
        return { kind: 'warn', summary: 'Not verified end-to-end. Configuration alone is never treated as working.', detail };
      } catch {
        return { kind: 'fail', summary: 'The status endpoint could not be reached from this session.' };
      }
    })();

    const numbersPromise = (async (): Promise<RowState> => {
      try {
        const res = await fetch('/api/whatsapp/numbers');
        const data = (await res.json()) as NumbersStatus;
        if (!res.ok || !data.success) {
          return { kind: 'fail', summary: data.error || `WhatsApp number registry failed (${res.status}).` };
        }
        const stats = data.stats;
        const detail = stats
          ? [
              `Registry rows: ${stats.total} of ${stats.expected} expected`,
              `Meta-verified recently: ${stats.connected} · with provider ids: ${stats.configured} · unverified: ${stats.disconnected}`,
              `Employee pool rows: ${stats.employeePool}`,
              `Integration state: ${data.integrationState ?? 'unknown'}`,
            ]
          : ['The registry answered but returned no statistics.'];
        const verified = (stats?.connected ?? 0) > 0;
        return {
          kind: verified ? 'ok' : 'warn',
          summary: verified
            ? 'At least one number passed a provider verification in the last 24h.'
            : 'Numbers are configured records only — none is Meta-verified from this server yet.',
          detail,
        };
      } catch {
        return { kind: 'fail', summary: 'The WhatsApp number registry could not be reached from this session.' };
      }
    })();

    const registryPromise = (async (): Promise<RowState> => {
      try {
        const res = await fetch('/api/crm/contacts/dashboard');
        const data = (await res.json()) as ContactsDashboard;
        if (!res.ok || data.success === false) {
          return { kind: 'fail', summary: data.error || `Contact dashboard failed (${res.status}).` };
        }
        const metrics = data.metrics ?? [];
        const find = (key: string) => metrics.find((metric) => metric.key === key);
        const totalMetric = find('contacts_total');
        const duplicates = find('duplicate_groups');
        const reviews = find('match_reviews_pending');
        const overdue = find('follow_ups_overdue');
        const coverage = find('student_link_coverage');
        const value = (metric?: DashboardMetric) => (metric && metric.status === 'OK' && metric.value !== null ? String(metric.value) : 'unavailable');
        return {
          kind: 'ok',
          summary: `The central Contact Registry answered live (scope: ${data.scope ?? 'unknown'}).`,
          detail: [
            `Total contacts: ${value(totalMetric)}`,
            `Duplicate groups: ${value(duplicates)}`,
            `Match reviews pending: ${value(reviews)}`,
            `Follow-ups overdue: ${value(overdue)}`,
            `Student-link coverage: ${value(coverage)}`,
          ],
        };
      } catch {
        return { kind: 'fail', summary: 'The contact dashboard could not be reached from this session.' };
      }
    })();

    const [googleState, numbersState, registryState] = await Promise.all([googlePromise, numbersPromise, registryPromise]);
    setGoogle(googleState);
    setNumbers(numbersState);
    setRegistry(registryState);
    setCheckedAt(new Date());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-[var(--alo-text)]">
            <HeartPulse className="h-6 w-6 text-[var(--alo-brand)]" /> Integration Health
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--alo-text-muted)]">
            Live, per-integration verdicts for the contact and communication stack. Clicking a section opens its console.
            A verdict flips to HEALTHY only after a real check — never because a credential file exists or a number is listed.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Re-check everything
          </Button>
          {checkedAt && <p className="text-xs text-[var(--alo-text-muted)]">Checked at {checkedAt.toLocaleTimeString()}</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact &amp; messaging stack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Central Contact Registry (ALO's source of truth)" href="/crm/contacts/dashboard" state={registry} />
          <Row label="Google Contacts (alo.allcontacts@gmail.com — People API pull)" href="/admin/google-contacts" state={google} />
          <Row label="WhatsApp number registry (ALO main / COO / employee pool)" href="/admin/whatsapp-numbers" state={numbers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><ShieldAlert className="h-5 w-5 text-amber-500" /> What this page deliberately does not do</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--alo-text)]">
          <ul className="list-disc space-y-1 pl-5">
            <li>It never sends a message, syncs a contact or seeds a number — those are explicit, permissioned, human actions elsewhere.</li>
            <li>It never claims Meta or Google connectivity from environment variables alone.</li>
            <li>It does not create accounts, allocate Student IDs or grant consents.</li>
            <li>If the database is unreachable, the sections that need it say so instead of showing zeros.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
