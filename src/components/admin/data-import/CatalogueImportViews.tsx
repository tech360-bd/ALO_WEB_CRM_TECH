'use client';

/**
 * Admin catalogue import screens. Every number shown here comes from a server
 * response; nothing is hard-coded or simulated. When a request fails the
 * screen says so instead of falling back to sample data.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, FileSpreadsheet, RefreshCw, Upload } from 'lucide-react';

type Action = 'SKIP' | 'NORMALIZE' | 'PENDING_CHANGE' | 'NEW_PENDING_REVIEW' | 'BLOCK_DUPLICATE' | 'INVALID';

const ACTION_LABEL: Record<Action, string> = {
  SKIP: 'Identical — skipped',
  NORMALIZE: 'Formatting only — no change',
  PENDING_CHANGE: 'Material change — needs Super Admin approval',
  NEW_PENDING_REVIEW: 'New — will be staged for review',
  BLOCK_DUPLICATE: 'Probable duplicate — blocked',
  INVALID: 'Invalid — fix and re-upload',
};

const ACTION_CLASS: Record<Action, string> = {
  SKIP: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
  NORMALIZE: 'bg-sky-50 text-sky-800',
  PENDING_CHANGE: 'bg-crm-warning-bg text-crm-warning-text',
  NEW_PENDING_REVIEW: 'bg-crm-success-bg text-crm-success-text',
  BLOCK_DUPLICATE: 'bg-crm-danger-bg text-crm-danger-text',
  INVALID: 'bg-crm-danger-bg text-crm-danger-text',
};

interface Batch {
  id: string;
  importType: string;
  fileName: string;
  uploadedBy: string;
  rowsReceived: number;
  rowsImported: number;
  rowsFailed: number;
  rowsDuplicate: number;
  rowsWarning: number;
  rowsBlocked: number;
  status: string;
  errorCount: number;
  createdAt: string;
}

interface ImportRowReport {
  rowNumber: number;
  universityId: string;
  courseId: string;
  action: Action;
  issues: Array<{ column: string; message: string }>;
  reasons: Array<{ entity: string; action: string; reason: string; duplicateOf: string | null }>;
  changes: Array<{ entity: string; column: string; oldValue: string; newValue: string; kind: 'format' | 'material' }>;
}

interface ImportResponse {
  mode: 'preview' | 'queue_changes';
  fileName: string;
  rowsReceived: number;
  counts: Record<Action, number>;
  rows: ImportRowReport[];
  newRows: Array<Record<string, string>>;
  batchId?: string;
  queued?: number;
  alreadyQueued?: number;
  error?: string;
}

async function readJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data;
}

function useBatches() {
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await readJson(await fetch('/api/crm/course-import/history', { cache: 'no-store' }));
      setBatches((data as { batches?: Batch[] }).batches ?? []);
    } catch (e) {
      setBatches(null);
      setError(e instanceof Error ? e.message : 'Could not load import history');
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { batches, error, reload: load };
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div role="alert" className="p-3 bg-crm-danger-bg border border-crm-danger-border text-crm-danger-text text-sm rounded-xl flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function ImportDashboard() {
  const { batches, error } = useBatches();
  const totals = batches
    ? batches.reduce((t, b) => ({ batches: t.batches + 1, received: t.received + b.rowsReceived, imported: t.imported + b.rowsImported, blocked: t.blocked + b.rowsBlocked }), { batches: 0, received: 0, imported: 0, blocked: 0 })
    : null;
  const stat = (label: string, value: number | null) => (
    <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl space-y-1">
      <span className="text-xs font-medium text-[var(--alo-body)]">{label}</span>
      <p className="text-2xl font-bold text-[var(--alo-text)]">{value === null ? '—' : value.toLocaleString('en-GB')}</p>
    </Card>
  );
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--alo-text)]">University &amp; course data import</h1>
          <p className="text-sm text-[var(--alo-body)] mt-1">
            Upload a CSV, review how each row compares with stored data, then queue changes for approval. Imports never verify or publish records.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/data-import/history"><Button variant="outline" className="text-sm">History</Button></Link>
          <Link href="/admin/data-import/new"><Button className="bg-[var(--alo-brand)] hover:bg-[#00469a] text-white text-sm flex items-center gap-1.5"><Upload className="w-4 h-4" aria-hidden="true" /> New import</Button></Link>
        </div>
      </div>
      {error && <ErrorNote message={`Import history unavailable: ${error}`} />}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stat('Import batches recorded', totals?.batches ?? null)}
        {stat('Rows received', totals?.received ?? null)}
        {stat('Rows written as drafts', totals?.imported ?? null)}
        {stat('Rows blocked', totals?.blocked ?? null)}
      </div>
      <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-2xl space-y-3">
        <h2 className="text-base font-bold text-[var(--alo-text)] flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-[var(--alo-brand)]" aria-hidden="true" /> Template</h2>
        <p className="text-sm text-[var(--alo-body)]">
          The catalogue template supports university-only rows (leave course_id/course_title blank), course-only discoveries, and optional intake details. Required headers: university_id, university_name, course_id, course_title. Intake year/month must be supplied together or left blank. Use course_official_url and course_source_url for course evidence; set international_eligibility only when the source supports it.
        </p>
        <a className="inline-flex text-sm font-semibold text-[var(--alo-brand)] underline" href="/api/crm/course-import/template/course">Download combined course template (CSV)</a>
        <ul className="text-sm text-[var(--alo-body)] list-disc pl-5 space-y-1">
          <li><strong>Identical</strong> rows are skipped; <strong>formatting-only</strong> differences change nothing.</li>
          <li><strong>Material</strong> changes to existing records are queued for Super Admin approval; the current public value stays live.</li>
          <li><strong>New</strong> records are staged as draft and unverified — they are hidden until verified and published.</li>
          <li><strong>Probable duplicates</strong> (same website or same normalised name in the same country) are blocked.</li>
        </ul>
      </Card>
    </div>
  );
}

export function NewCatalogueImport() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<null | 'preview' | 'queue' | 'stage'>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportResponse | null>(null);
  const [queued, setQueued] = useState<ImportResponse | null>(null);
  const [staged, setStaged] = useState<string | null>(null);

  const send = async (mode: 'preview' | 'queue_changes') => {
    if (!file) return;
    setBusy(mode === 'preview' ? 'preview' : 'queue');
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mode', mode);
      const data = (await readJson(await fetch('/api/admin/data-import', { method: 'POST', body: fd }))) as ImportResponse;
      if (mode === 'preview') { setPreview(data); setQueued(null); setStaged(null); } else { setQueued(data); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  const stageNew = async () => {
    if (!preview?.newRows.length) return;
    setBusy('stage');
    setError(null);
    try {
      const data = await readJson(await fetch('/api/crm/course-import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importType: 'course_combined', rows: preview.newRows, batchName: preview.fileName }),
      }));
      const d = data as { rowsImported?: number; rowsFailed?: number; rowsDuplicate?: number; batchId?: string };
      setStaged(`Staged ${d.rowsImported ?? 0} new row(s) as draft, unverified records${d.rowsFailed ? `; ${d.rowsFailed} failed` : ''}${d.rowsDuplicate ? `; ${d.rowsDuplicate} duplicate` : ''}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Staging failed');
    } finally {
      setBusy(null);
    }
  };

  const counts = preview?.counts;
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--alo-text)]">New catalogue CSV import</h1>
        <p className="text-sm text-[var(--alo-body)] mt-1">Step 1: preview (no changes are saved). Step 2: queue material changes and/or stage new records.</p>
      </div>

      <Card className="p-6 border-2 border-dashed border-[var(--alo-border-strong)] rounded-2xl bg-white space-y-4">
        <label htmlFor="catalogue-csv" className="block text-sm font-semibold text-[var(--alo-text)]">CSV file (UTF-8, up to 500 rows, 5 MB)</label>
        <input
          id="catalogue-csv"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setQueued(null); setStaged(null); setError(null); }}
          className="block w-full text-sm text-[var(--alo-body)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[var(--alo-brand-pale)] file:text-[var(--alo-brand)]"
        />
        {error && <ErrorNote message={error} />}
        <Button onClick={() => send('preview')} disabled={!file || busy !== null} className="bg-[var(--alo-brand)] hover:bg-[#00469a] text-white text-sm flex items-center gap-2">
          {busy === 'preview' ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />}
          {busy === 'preview' ? 'Checking…' : 'Preview import'}
        </Button>
      </Card>

      {preview && counts && (
        <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-[var(--alo-text)]">Preview: {preview.fileName} ({preview.rowsReceived} rows)</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm" aria-label="Row classification summary">
            {(Object.keys(ACTION_LABEL) as Action[]).map((a) => (
              <li key={a} className={`p-3 rounded-xl ${ACTION_CLASS[a]}`}><strong>{counts[a] ?? 0}</strong> — {ACTION_LABEL[a]}</li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => send('queue_changes')} disabled={busy !== null || !!queued} variant="outline" className="text-sm">
              {busy === 'queue' ? 'Recording…' : `Record batch and queue ${counts.PENDING_CHANGE} changed row(s) for approval`}
            </Button>
            <Button onClick={stageNew} disabled={busy !== null || !preview.newRows.length || !!staged} variant="outline" className="text-sm">
              {busy === 'stage' ? 'Staging…' : `Stage ${preview.newRows.length} new row(s) as draft`}
            </Button>
          </div>
          {queued && (
            <p role="status" className="text-sm text-crm-success-text flex items-center gap-2"><CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Batch {queued.batchId} recorded. {queued.queued ?? 0} field change(s) queued for approval{queued.alreadyQueued ? `, ${queued.alreadyQueued} already pending` : ''}. Live values are unchanged. <Link className="underline" href="/admin/change-approval">Review and apply in the approval queue</Link> (approval does not change the live record; a Super Admin applies approved changes separately, and nothing becomes verified by approval).
            </p>
          )}
          {staged && <p role="status" className="text-sm text-crm-success-text">{staged}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Row-by-row import classification</caption>
              <thead>
                <tr className="border-b border-[var(--alo-border)] text-[var(--alo-body)]">
                  <th scope="col" className="p-2">Row</th>
                  <th scope="col" className="p-2">University / course</th>
                  <th scope="col" className="p-2">Result</th>
                  <th scope="col" className="p-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.rowNumber} className="border-b border-[var(--alo-border)] align-top">
                    <td className="p-2 font-mono">{r.rowNumber}</td>
                    <td className="p-2"><span className="font-mono">{r.universityId}</span><br /><span className="font-mono text-[var(--alo-body)]">{r.courseId}</span></td>
                    <td className="p-2"><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${ACTION_CLASS[r.action]}`}>{ACTION_LABEL[r.action]}</span></td>
                    <td className="p-2 text-[var(--alo-body)]">
                      {r.issues.map((i) => <div key={i.column + i.message}>{i.message}</div>)}
                      {r.changes.filter((c) => c.kind === 'material').map((c) => (
                        <div key={c.entity + c.column}><strong>{c.entity}.{c.column}</strong>: “{c.oldValue || '—'}” → “{c.newValue}”</div>
                      ))}
                      {r.reasons.filter((x) => x.action === 'BLOCK_DUPLICATE').map((x) => <div key={x.entity}>{x.reason}</div>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export function ImportHistoryTable() {
  const { batches, error, reload } = useBatches();
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--alo-text)]">Import batch history</h1>
        <Button variant="outline" className="text-sm" onClick={() => void reload()}>Refresh</Button>
      </div>
      {error && <ErrorNote message={error} />}
      {batches && batches.length === 0 && <p className="text-sm text-[var(--alo-body)]">No import batches have been recorded yet.</p>}
      {batches && batches.length > 0 && (
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Recorded import batches</caption>
            <thead>
              <tr className="border-b border-[var(--alo-border)] text-[var(--alo-body)]">
                <th scope="col" className="p-2">Batch</th>
                <th scope="col" className="p-2">File</th>
                <th scope="col" className="p-2">Uploaded by</th>
                <th scope="col" className="p-2">Received</th>
                <th scope="col" className="p-2">Drafts written</th>
                <th scope="col" className="p-2">Blocked</th>
                <th scope="col" className="p-2">Status</th>
                <th scope="col" className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-b border-[var(--alo-border)]">
                  <td className="p-2 font-mono"><Link className="text-[var(--alo-brand)] underline" href={`/admin/data-import/${encodeURIComponent(b.id)}`}>{b.id.slice(0, 12)}</Link></td>
                  <td className="p-2">{b.fileName || '—'}</td>
                  <td className="p-2 text-[var(--alo-body)]">{b.uploadedBy || '—'}</td>
                  <td className="p-2">{b.rowsReceived}</td>
                  <td className="p-2">{b.rowsImported}</td>
                  <td className="p-2">{b.rowsBlocked + b.rowsFailed}</td>
                  <td className="p-2">{b.status}</td>
                  <td className="p-2 text-[var(--alo-body)]">{new Date(b.createdAt).toLocaleString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export function ImportBatchDetail({ batchId }: { batchId: string }) {
  const { batches, error } = useBatches();
  const [rowErrors, setRowErrors] = useState<Array<{ id: string; rowNumber: number; field: string; errorMessage: string; universityId: string; courseId: string }> | null>(null);
  const [errorsFailed, setErrorsFailed] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await readJson(await fetch(`/api/crm/course-import/errors?batchId=${encodeURIComponent(batchId)}`, { cache: 'no-store' }));
        if (active) setRowErrors((data as { errors?: typeof rowErrors }).errors ?? []);
      } catch (e) {
        if (active) setErrorsFailed(e instanceof Error ? e.message : 'Could not load row errors');
      }
    })();
    return () => { active = false; };
  }, [batchId]);
  const batch = batches?.find((b) => b.id === batchId) ?? null;
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Link href="/admin/data-import/history" className="text-sm text-[var(--alo-brand)] underline">← Import history</Link>
      <h1 className="text-2xl font-bold text-[var(--alo-text)]">Import batch <span className="font-mono">{batchId}</span></h1>
      {error && <ErrorNote message={error} />}
      {batches && !batch && <p className="text-sm text-[var(--alo-body)]">This batch was not found.</p>}
      {batch && (
        <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-2xl grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-[var(--alo-body)]">File</span><br /><strong>{batch.fileName || '—'}</strong></div>
          <div><span className="text-[var(--alo-body)]">Type</span><br /><strong>{batch.importType}</strong></div>
          <div><span className="text-[var(--alo-body)]">Status</span><br /><strong>{batch.status}</strong></div>
          <div><span className="text-[var(--alo-body)]">Rows received</span><br /><strong>{batch.rowsReceived}</strong></div>
          <div><span className="text-[var(--alo-body)]">Drafts written</span><br /><strong>{batch.rowsImported}</strong></div>
          <div><span className="text-[var(--alo-body)]">Changes queued (rows)</span><br /><strong>{batch.rowsWarning}</strong></div>
          <div><span className="text-[var(--alo-body)]">Duplicates blocked</span><br /><strong>{batch.rowsDuplicate}</strong></div>
          <div><span className="text-[var(--alo-body)]">Invalid / failed</span><br /><strong>{batch.rowsFailed}</strong></div>
          <div><span className="text-[var(--alo-body)]">Uploaded by</span><br /><strong>{batch.uploadedBy || '—'}</strong></div>
        </Card>
      )}
      <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--alo-text)]">Row errors</h2>
          <a className="text-sm text-[var(--alo-brand)] underline" href={`/api/crm/course-import/download-errors?batchId=${encodeURIComponent(batchId)}`}>Download CSV</a>
        </div>
        {errorsFailed && <ErrorNote message={errorsFailed} />}
        {rowErrors && rowErrors.length === 0 && <p className="text-sm text-[var(--alo-body)]">No row errors were recorded for this batch.</p>}
        {rowErrors && rowErrors.length > 0 && (
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Row errors for this batch</caption>
            <thead><tr className="border-b border-[var(--alo-border)] text-[var(--alo-body)]"><th scope="col" className="p-2">Row</th><th scope="col" className="p-2">IDs</th><th scope="col" className="p-2">Field</th><th scope="col" className="p-2">Message</th></tr></thead>
            <tbody>
              {rowErrors.map((e) => (
                <tr key={e.id} className="border-b border-[var(--alo-border)]"><td className="p-2 font-mono">{e.rowNumber}</td><td className="p-2 font-mono">{e.universityId} / {e.courseId}</td><td className="p-2">{e.field}</td><td className="p-2">{e.errorMessage}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
