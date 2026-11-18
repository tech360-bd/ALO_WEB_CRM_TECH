'use client';

/**
 * Google Contacts Integration — admin console (spec §7, §23).
 *
 * Shows the three facts separately (configured / reachable / last sync), never
 * collapsed into one. A saved configuration is NOT proof of a working import;
 * the operator must run a dry-run and then an apply sync, and Google must
 * answer a real People API call. No credentials are stored or shown here.
 */

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCircle2, Contact, Loader2, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { toast } from 'sonner';

interface StatusResponse {
  service: string;
  account: string | null;
  configured: boolean;
  authMode: string;
  note?: string | null;
  verdict: 'NOT_CONFIGURED' | 'NOT_VERIFIED' | 'PASS' | 'FAILED';
  liveVerified: boolean;
  live: null | { status: string; reachable: boolean; reason: string | null; fetchedAt: string | null };
  syncedAt: string | null;
  incrementalReady: boolean;
  importedContacts: number;
  pendingReviews: number;
  lastBatch: null | {
    id: string;
    ranAt: string;
    status: string;
    found: number;
    created: number;
    linkedOrFilled: number;
    duplicates: number;
    errors: number;
  };
  databaseError: string | null;
  nextSteps: string[];
}

interface PlanCounters {
  found?: number;
  create?: number;
  linkExisting?: number;
  fillBlank?: number;
  conflictReview?: number;
  duplicate?: number;
  skipped?: number;
}

interface SyncSummary {
  mode: 'dry-run' | 'apply';
  wroteNothing?: boolean;
  account?: string;
  incremental?: boolean;
  truncated?: boolean;
  pages?: number;
  batchId?: string | null;
  counters?: PlanCounters;
  written?: { created: number; linkedOrFilled: number; reviewQueued: number; duplicates: number; errors: number };
  notice?: string;
  error?: string;
}

function verdictBadge(verdict: StatusResponse['verdict']) {
  switch (verdict) {
    case 'PASS':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> PASS — a real Google People API call succeeded</Badge>;
    case 'FAILED':
      return <Badge className="bg-red-100 text-red-800 border-red-200"><ShieldAlert className="mr-1 h-3.5 w-3.5" /> FAILED — Google answered but refused or errored</Badge>;
    case 'NOT_VERIFIED':
      return <Badge className="bg-amber-100 text-[var(--alo-warning-strong)] border-amber-200"><AlertTriangle className="mr-1 h-3.5 w-3.5" /> NOT VERIFIED — configured but never checked live</Badge>;
    default:
      return <Badge variant="secondary"><ShieldAlert className="mr-1 h-3.5 w-3.5" /> NOT CONFIGURED — no OAuth credential on this server</Badge>;
  }
}

export default function GoogleContactsAdminPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);
  const [lastSync, setLastSync] = useState<SyncSummary | null>(null);

  const load = useCallback(async (live = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/google/contacts/status${live ? '?live=true' : ''}`);
      const data = (await res.json()) as StatusResponse & { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        toast.error(data.error || 'The Google Contacts status could not be read.');
        return;
      }
      setStatus(data);
    } catch {
      toast.error('The Google Contacts status endpoint could not be reached.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runCheck = async () => {
    setChecking(true);
    try {
      await load(true);
      toast.message('Live probe finished — see verdict above.');
    } finally {
      setChecking(false);
    }
  };

  const runSync = async (mode: 'dry-run' | 'apply') => {
    if (mode === 'apply' && !confirmApply) {
      toast.error('Tick the confirmation box first — applying writes contacts to the registry.');
      return;
    }
    setSyncing(true);
    setLastSync({ mode });
    try {
      const res = await fetch('/api/google/contacts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = (await res.json()) as SyncSummary & { success?: boolean; error?: string };
      if (!res.ok || data.success === false) {
        setLastSync({ mode, error: data.error || `Sync failed (${res.status})` });
        toast.error(data.error || 'Sync failed — nothing was silently applied.');
        return;
      }
      setLastSync({ ...data, mode });
      toast.success(mode === 'dry-run' ? 'Dry-run complete — nothing was written.' : 'Apply sync finished — review the summary and the review queue.');
      await load(false);
    } catch {
      setLastSync({ mode, error: 'The sync endpoint could not be reached.' });
      toast.error('The sync endpoint could not be reached.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-[var(--alo-text)]">
            <Contact className="h-6 w-6 text-[var(--alo-text-muted)]" /> Google Contacts
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--alo-text-muted)]">
            One-way reconciliation from the shared ALO address book (alo.allcontacts@gmail.com) into the central Contact Registry.
            ALO remains the source of truth: Google may add a contact or fill an empty field, never overwrite a populated ALO value.
            Every uncertain match lands in the review queue — nothing is merged silently.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load(false)} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh status
        </Button>
      </div>

      {status?.databaseError && (
        <div role="alert" className="rounded-lg border border-[var(--alo-warning-strong)] bg-[var(--alo-warning-soft)] px-4 py-3 text-sm text-[var(--alo-warning-strong)]">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {status.databaseError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4 text-lg">
            <span>Connection verdict</span>
            {status ? verdictBadge(status.verdict) : <Badge variant="secondary">UNAVAILABLE</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
          <div className="rounded-lg border border-[var(--alo-border)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--alo-text-muted)]">Account</p>
            <p className="mt-1 font-medium text-[var(--alo-text)]">{status?.account ?? 'alo.allcontacts@gmail.com'}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-[var(--alo-text-muted)]">Auth mode</p>
            <p className="mt-1 text-[var(--alo-text)]">{status?.authMode ?? '—'}</p>
            {status?.note && <p className="mt-3 text-xs text-[var(--alo-text-muted)]">{status.note}</p>}
          </div>
          <div className="rounded-lg border border-[var(--alo-border)] p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--alo-text-muted)]">Last successful sync</p>
            <p className="mt-1 font-medium text-[var(--alo-text)]">{status?.syncedAt ? new Date(status.syncedAt).toLocaleString() : 'Never'}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-[var(--alo-text-muted)]">Incremental sync (syncToken)</p>
            <p className="mt-1 text-[var(--alo-text)]">{status?.incrementalReady ? 'Ready — the next run fetches only changes' : 'Not primed yet (first sync fetches the full book)'}</p>
            <div className="mt-3 flex items-center gap-2 text-[var(--alo-text)]">
              <Users className="h-4 w-4 text-[var(--alo-text-muted)]" />
              <span>{status?.importedContacts ?? 0} registry rows sourced from Google Contacts</span>
            </div>
            <p className="mt-1 text-[var(--alo-text)]">{status?.pendingReviews ?? 0} match review(s) awaiting a human decision</p>
          </div>
        </CardContent>
      </Card>

      {status?.lastBatch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most recent sync run</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-6">
            {[
              ['Ran at', new Date(status.lastBatch.ranAt).toLocaleString()],
              ['Status', status.lastBatch.status],
              ['Found', String(status.lastBatch.found)],
              ['Created', String(status.lastBatch.created)],
              ['Linked / filled', String(status.lastBatch.linkedOrFilled)],
              ['Duplicates parked', String(status.lastBatch.duplicates)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[var(--alo-border)] p-3">
                <p className="text-[11px] uppercase tracking-wide text-[var(--alo-text-muted)]">{label}</p>
                <p className="mt-1 font-semibold text-[var(--alo-text)]">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live verification and sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => void runCheck()} disabled={checking || !status?.configured}>
              {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
              Probe People API (costs one quota unit)
            </Button>
            <Button variant="outline" onClick={() => void runSync('dry-run')} disabled={syncing || !status?.configured}>
              {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run dry-run (no writes)
            </Button>
          </div>
          <p className="text-xs text-[var(--alo-text-muted)]">
            A dry-run plans the import and prints the decisions. Applying repeats the same plan and writes it.
            Neither step grants promotional consent, and no Student ID is ever allocated from a Google row.
          </p>

          <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--alo-text)]">
              <Checkbox checked={confirmApply} onCheckedChange={(value) => setConfirmApply(Boolean(value))} className="mt-0.5" />
              <span>
                I understand the apply step writes Google Contacts into the central registry: new rows may be created and empty ALO fields may be filled.
                Existing ALO values, Student IDs, counsellor assignments and relationships will not be changed, and uncertain matches go to the human review queue.
              </span>
            </label>
            <div className="mt-4">
              <Button onClick={() => void runSync('apply')} disabled={syncing || !confirmApply || !status?.configured} className="bg-emerald-700 text-white hover:bg-emerald-800">
                {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply sync (writes registry)
              </Button>
            </div>
          </div>

          {lastSync && (
            <div className="rounded-lg border border-[var(--alo-border)] p-4 text-sm">
              <p className="font-semibold text-[var(--alo-text)]">Last run — {lastSync.mode}</p>
              {lastSync.error ? (
                <p className="mt-2 text-red-700">{lastSync.error}</p>
              ) : (
                <>
                <ul className="mt-2 grid grid-cols-2 gap-2 text-[var(--alo-text)] md:grid-cols-4">
                  <li>Found: <strong>{lastSync.counters?.found ?? '—'}</strong></li>
                  <li>Create: <strong>{lastSync.counters?.create ?? lastSync.written?.created ?? '—'}</strong></li>
                  <li>Link/fill: <strong>{(lastSync.counters ? (lastSync.counters.linkExisting ?? 0) + (lastSync.counters.fillBlank ?? 0) : undefined) ?? lastSync.written?.linkedOrFilled ?? '—'}</strong></li>
                  <li>Skipped: <strong>{lastSync.counters?.skipped ?? '—'}</strong></li>
                  <li>Review queued: <strong>{lastSync.counters?.conflictReview ?? lastSync.written?.reviewQueued ?? '—'}</strong></li>
                  <li>Duplicates: <strong>{lastSync.counters?.duplicate ?? lastSync.written?.duplicates ?? '—'}</strong></li>
                  <li>Errors: <strong>{lastSync.written?.errors ?? '—'}</strong></li>
                  <li>Incremental: <strong>{lastSync.incremental ? 'yes' : 'no'}</strong></li>
                  {lastSync.batchId && <li className="col-span-2">Batch: <code className="text-xs">{lastSync.batchId}</code></li>}
                </ul>
                {lastSync.truncated && <p className="mt-2 text-[var(--alo-warning-strong)]">The run hit its page ceiling; re-run to continue (re-runs are idempotent).</p>}
                {lastSync.notice && <p className="mt-2 text-[var(--alo-text-muted)]">{lastSync.notice}</p>}
              </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {status && status.nextSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What to do next</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--alo-text)]">
              {status.nextSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
