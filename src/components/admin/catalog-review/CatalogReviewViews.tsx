'use client';

/**
 * Admin catalogue review screens. Every figure comes from a server API backed
 * by real tables; when an API fails, the failure is shown instead of sample
 * data. Buttons only report success after the server confirms it. All
 * authorisation is enforced server-side (these screens add none).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { PROPOSAL_STATUS_LABELS } from '@/lib/course-finder/catalog-change-status';
import {
  CATEGORY_LABELS,
  ELIGIBILITY_CATEGORIES,
  ELIGIBILITY_DISCLAIMERS,
  evaluateEligibility,
  type CourseRuleInput,
  type EligibilityEvaluation,
  type StudentProfile,
} from '@/lib/course-finder/eligibility-rules';

async function readJson<T = any>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !(data && typeof data === 'object' && 'results' in data)) {
    throw new Error((data as { error?: string; message?: string }).error || (data as { message?: string }).message || `Request failed (${res.status})`);
  }
  return data as T;
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

function OkNote({ message }: { message: string }) {
  return (
    <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm rounded-xl flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

function Loading() {
  return <p className="text-sm text-slate-500" role="status">Loading…</p>;
}

function PageHeader({ title, intro, links }: { title: string; intro: string; links?: Array<{ href: string; label: string }> }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-600 max-w-3xl">{intro}</p>
      {links && (
        <nav aria-label="Related catalogue screens" className="flex flex-wrap gap-3 text-sm">
          {links.map((l) => <Link key={l.href} href={l.href} className="text-blue-700 underline">{l.label}</Link>)}
        </nav>
      )}
    </div>
  );
}

const NAV = [
  { href: '/admin/change-approval', label: 'Approval queue' },
  { href: '/admin/change-approval/history', label: 'Apply & audit history' },
  { href: '/admin/data-review', label: 'Data review' },
  { href: '/admin/data-review/duplicates', label: 'Conflicts & duplicates' },
  { href: '/admin/eligibility-rules', label: 'Eligibility rules' },
  { href: '/admin/data-import', label: 'Import' },
];

// ---------------------------------------------------------------------------
// Approval queue
// ---------------------------------------------------------------------------

interface Proposal {
  id: string; universityId: string; courseId: string; entityType: string; entityName: string; fieldName: string;
  oldValue: string; newValue: string; evidenceUrl: string; status: string; reviewedBy: string; createdAt: string; updatedAt: string;
  /** Server-computed for approved rows: valid | missing | mismatch. */
  approvalFingerprint?: string;
}
interface WeeklyRequest { id: string; targetType: string; targetName: string; fieldName: string; oldValue: string; newValue: string; sourceUrl: string; status: string; createdAt: string }
interface ApplyItem { requestId: string; outcome: string; code?: string; message?: string; previousValue?: string; appliedValue?: string; target?: { model: string; key: string; field: string }; verificationTransition?: { from: string; to: string } }

const PROPOSAL_FILTERS = ['pending_approval', 'reviewed_unverified', 'approved', 'apply_failed', 'applied', 'rejected', 'all'] as const;

/** Approved rows are applicable only when the server reports a valid approval fingerprint. */
const applicable = (p: { status: string; approvalFingerprint?: string }) => p.status === 'reviewed_unverified' && p.approvalFingerprint === 'valid';
const needsReapproval = (p: { status: string; approvalFingerprint?: string }) => (p.status === 'reviewed_unverified' || p.status === 'approved') && p.approvalFingerprint !== 'valid';

export function ChangeApprovalView() {
  const [tab, setTab] = useState<'proposals' | 'weekly'>('proposals');
  const [filter, setFilter] = useState<(typeof PROPOSAL_FILTERS)[number]>('pending_approval');
  const [items, setItems] = useState<Proposal[] | null>(null);
  const [weekly, setWeekly] = useState<WeeklyRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applyResult, setApplyResult] = useState<{ message: string; ok: boolean; results: ApplyItem[] } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (tab === 'proposals') {
        const data = await readJson<{ updates: Proposal[] }>(await fetch(`/api/admin/university-updates?status=${filter}&limit=200`, { cache: 'no-store' }));
        setItems(data.updates ?? []);
      } else {
        const data = await readJson<{ weeklyUpdates?: WeeklyRequest[] }>(await fetch('/api/weekly-updates?status=all&limit=200', { cache: 'no-store' }));
        setWeekly(data.weeklyUpdates ?? []);
      }
    } catch (e) {
      if (tab === 'proposals') setItems(null); else setWeekly(null);
      setError(e instanceof Error ? e.message : 'Could not load the queue');
    }
  }, [tab, filter]);
  useEffect(() => { setSelected(new Set()); void load(); }, [load]);

  async function review(id: string, action: 'approve' | 'reject') {
    setBusy(true); setNotice(null); setError(null);
    try {
      const data = await readJson<{ message?: string }>(await fetch('/api/admin/university-updates', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: id, action }),
      }));
      setNotice(data.message || 'Saved.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed');
    } finally { setBusy(false); }
  }

  async function applySelected() {
    if (!selected.size) return;
    if (!confirm(`Apply ${selected.size} approved change(s) to the live catalogue in one transaction? Any verified record that changes will move to needs review and leave the public catalogue until it is re-verified.`)) return;
    setBusy(true); setApplyResult(null); setError(null); setNotice(null);
    try {
      const res = await fetch('/api/admin/catalog-changes/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestIds: [...selected] }) });
      const data = await res.json().catch(() => ({}));
      if (!Array.isArray(data.results)) throw new Error(data.error || data.message || `Apply failed (${res.status})`);
      setApplyResult({ ok: !!data.success, message: data.message || '', results: data.results });
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply failed');
    } finally { setBusy(false); }
  }

  const approvedIds = useMemo(() => (items ?? []).filter(applicable).map((p) => p.id), [items]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Catalogue change approval"
        intro="Approve or reject proposed catalogue changes, then a Super Admin applies the approved ones. Approving changes nothing live. Applying writes the approved value after re-checking it and never marks a record verified; a verified record that changes moves to needs review until it is re-verified. Approvals made before fingerprints existed must be approved again."
        links={NAV.filter((n) => n.href !== '/admin/change-approval')}
      />
      <div role="tablist" aria-label="Queues" className="flex gap-2">
        <Button role="tab" aria-selected={tab === 'proposals'} variant={tab === 'proposals' ? 'default' : 'outline'} onClick={() => setTab('proposals')}>Catalogue proposals</Button>
        <Button role="tab" aria-selected={tab === 'weekly'} variant={tab === 'weekly' ? 'default' : 'outline'} onClick={() => setTab('weekly')}>Weekly update requests</Button>
        <Button variant="outline" onClick={() => void load()} aria-label="Reload"><RefreshCw className="w-4 h-4" aria-hidden="true" /></Button>
      </div>
      {error && <ErrorNote message={error} />}
      {notice && <OkNote message={notice} />}

      {tab === 'proposals' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-700" htmlFor="proposal-filter">Status</label>
            <select id="proposal-filter" className="border border-slate-300 rounded-lg px-2 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              {PROPOSAL_FILTERS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All' : PROPOSAL_STATUS_LABELS[s]}</option>)}
            </select>
            {filter === 'reviewed_unverified' && (
              <>
                <Button variant="outline" disabled={busy || !approvedIds.length} onClick={() => setSelected(new Set(approvedIds.slice(0, 50)))}>Select all (max 50)</Button>
                <Button disabled={busy || !selected.size} onClick={() => void applySelected()}>Apply {selected.size || ''} selected</Button>
                <span className="text-xs text-slate-500">Apply requires a Super Admin; the server refuses other roles.</span>
              </>
            )}
          </div>

          {applyResult && (
            <Card className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
              {applyResult.ok ? <OkNote message={applyResult.message} /> : <ErrorNote message={applyResult.message} />}
              <table className="w-full text-xs">
                <thead><tr className="text-left text-slate-500"><th className="py-1">Proposal</th><th>Outcome</th><th>Code</th><th>Detail</th></tr></thead>
                <tbody>
                  {applyResult.results.map((r) => (
                    <tr key={r.requestId} className="border-t border-slate-100">
                      <td className="py-1 font-mono">{r.requestId}</td><td>{r.outcome}</td><td>{r.code ?? ''}</td>
                      <td>{r.message ?? ''}{r.appliedValue !== undefined ? ` ${r.previousValue ?? ''} → ${r.appliedValue}` : ''}{r.outcome === 'requeued_stale' && r.previousValue !== undefined ? ` (live value now: ${r.previousValue})` : ''}{r.verificationTransition ? ` · Verification: ${r.verificationTransition.from} → ${r.verificationTransition.to} (re-verification required)` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {items === null && !error && <Loading />}
          {items && items.length === 0 && <p className="text-sm text-slate-600">No proposals with this status.</p>}
          {items && items.length > 0 && (
            <Card className="p-0 overflow-x-auto bg-white border border-slate-200 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-600">
                  <tr><th className="p-2"><span className="sr-only">Select</span></th><th className="p-2">Record</th><th className="p-2">Field</th><th className="p-2">Current (reviewed against)</th><th className="p-2">Proposed</th><th className="p-2">Evidence</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 align-top">
                      <td className="p-2">
                        {applicable(p) && (
                          <input type="checkbox" aria-label={`Select ${p.entityName} ${p.fieldName}`} checked={selected.has(p.id)}
                            onChange={(e) => setSelected((prev) => { const next = new Set(prev); if (e.target.checked) next.add(p.id); else next.delete(p.id); return next; })} />
                        )}
                      </td>
                      <td className="p-2"><div className="font-medium text-slate-900">{p.entityName || '(unnamed)'}</div><div className="text-xs text-slate-500 font-mono">{p.entityType} · {p.universityId}{p.courseId ? ` / ${p.courseId}` : ''}</div></td>
                      <td className="p-2 font-mono text-xs">{p.fieldName}{p.fieldName.startsWith('intake_new:') && <div className="text-amber-700 font-sans">Creates a new intake (unverified)</div>}</td>
                      <td className="p-2 text-slate-700">{p.oldValue || <span className="text-slate-400">(blank)</span>}</td>
                      <td className="p-2 text-emerald-800 font-medium">{p.newValue}</td>
                      <td className="p-2 text-xs">{p.evidenceUrl ? <a className="text-blue-700 underline break-all" href={p.evidenceUrl} target="_blank" rel="noopener noreferrer">{p.evidenceUrl}</a> : <span className="text-red-700">No evidence URL</span>}</td>
                      <td className="p-2 text-xs">{PROPOSAL_STATUS_LABELS[p.status] ?? p.status}{p.reviewedBy && <div className="text-slate-500">by {p.reviewedBy}</div>}{needsReapproval(p) && <div className="text-amber-700 font-medium">Re-approval required: {p.approvalFingerprint === 'mismatch' ? 'the proposal changed after approval' : 'no valid approval fingerprint'}. It cannot be applied until approved again.</div>}</td>
                      <td className="p-2 space-x-1 whitespace-nowrap">
                        {(['pending_approval', 'pending', 'apply_failed'].includes(p.status) || needsReapproval(p)) && (
                          <>
                            <Button size="sm" disabled={busy} onClick={() => void review(p.id, 'approve')}>Approve</Button>
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => void review(p.id, 'reject')}>Reject</Button>
                          </>
                        )}
                        <Link className="text-xs text-blue-700 underline" href={`/admin/change-approval/history?requestId=${encodeURIComponent(p.id)}`}>History</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      {tab === 'weekly' && (
        <>
          <Card className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900">
            Weekly update requests are shown read-only. They have no typed mapping to catalogue fields, and their approve, edit and publish endpoints are disabled, so they cannot be applied here. Re-submit a needed change as a catalogue proposal (CSV import) with an official evidence URL.
          </Card>
          {weekly === null && !error && <Loading />}
          {weekly && weekly.length === 0 && <p className="text-sm text-slate-600">No weekly update requests.</p>}
          {weekly && weekly.length > 0 && (
            <Card className="p-0 overflow-x-auto bg-white border border-slate-200 rounded-2xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-600"><tr><th className="p-2">Target</th><th className="p-2">Field</th><th className="p-2">Old</th><th className="p-2">New</th><th className="p-2">Source</th><th className="p-2">Status</th></tr></thead>
                <tbody>
                  {weekly.map((w) => (
                    <tr key={w.id} className="border-t border-slate-100 align-top">
                      <td className="p-2">{w.targetName}<div className="text-xs text-slate-500">{w.targetType}</div></td>
                      <td className="p-2 font-mono text-xs">{w.fieldName}</td>
                      <td className="p-2">{w.oldValue}</td><td className="p-2">{w.newValue}</td>
                      <td className="p-2 text-xs break-all">{w.sourceUrl}</td><td className="p-2 text-xs">{w.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Apply results & audit history
// ---------------------------------------------------------------------------

interface AuditEntry { id: string; actorUserId: string; action: string; entityType: string; entityId: string; createdAt: string; metadata: Record<string, any> | null }
const HISTORY_ACTIONS = ['', 'CATALOG_PROPOSAL_APPROVE', 'CATALOG_PROPOSAL_REJECT', 'CATALOG_PROPOSAL_EDIT', 'CATALOG_CHANGE_APPLIED', 'CATALOG_CHANGE_APPLY_FAILED', 'CATALOG_CHANGE_STALE_REQUEUED', 'CATALOG_IMPORT_CHANGES_QUEUED'];

export function ChangeHistoryView({ requestId }: { requestId?: string }) {
  const [action, setAction] = useState('');
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    const qs = new URLSearchParams({ limit: '200' });
    if (action) qs.set('action', action);
    if (requestId) qs.set('requestId', requestId);
    try {
      const data = await readJson<{ entries: AuditEntry[] }>(await fetch(`/api/admin/catalog-changes/history?${qs}`, { cache: 'no-store' }));
      setEntries(data.entries ?? []);
    } catch (e) { setEntries(null); setError(e instanceof Error ? e.message : 'History unavailable'); }
  }, [action, requestId]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Apply results & audit history" intro="Every review, apply, stale re-queue and failure, from the audit log. Previous and approved values are recorded with the evidence URL and the approval hash." links={NAV.filter((n) => n.href !== '/admin/change-approval/history')} />
      {requestId && <p className="text-sm text-slate-700">Showing proposal <span className="font-mono">{requestId}</span>. <Link href="/admin/change-approval/history" className="text-blue-700 underline">Show all</Link></p>}
      <div className="flex items-center gap-2">
        <label htmlFor="history-action" className="text-sm text-slate-700">Action</label>
        <select id="history-action" className="border border-slate-300 rounded-lg px-2 py-1 text-sm" value={action} onChange={(e) => setAction(e.target.value)}>
          {HISTORY_ACTIONS.map((a) => <option key={a} value={a}>{a || 'All catalogue actions'}</option>)}
        </select>
        <Button variant="outline" onClick={() => void load()} aria-label="Reload"><RefreshCw className="w-4 h-4" aria-hidden="true" /></Button>
      </div>
      {error && <ErrorNote message={error} />}
      {entries === null && !error && <Loading />}
      {entries && entries.length === 0 && <p className="text-sm text-slate-600">No audit entries yet.</p>}
      {entries && entries.length > 0 && (
        <Card className="p-0 overflow-x-auto bg-white border border-slate-200 rounded-2xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-left text-slate-600"><tr><th className="p-2">When</th><th className="p-2">Action</th><th className="p-2">Actor</th><th className="p-2">Proposal / batch</th><th className="p-2">Target</th><th className="p-2">Previous → approved</th><th className="p-2">Result</th><th className="p-2">Evidence</th></tr></thead>
            <tbody>
              {entries.map((e) => {
                const m = e.metadata ?? {};
                return (
                  <tr key={e.id} className="border-t border-slate-100 align-top">
                    <td className="p-2 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="p-2 font-mono">{e.action}</td>
                    <td className="p-2 font-mono">{e.actorUserId}</td>
                    <td className="p-2 font-mono">{e.entityId}</td>
                    <td className="p-2">{m.target ? `${m.target.model} ${m.target.key ?? ''} · ${m.target.field}` : ''}</td>
                    <td className="p-2">{m.previousValue ?? m.previousOldValue ?? ''}{(m.approvedValue ?? m.newValue) !== undefined ? ` → ${m.approvedValue ?? m.newValue}` : ''}</td>
                    <td className="p-2">{m.result ?? m.status ?? ''}{m.code ? ` (${m.code})` : ''}{m.liveValue ? ` live: ${m.liveValue}` : ''}</td>
                    <td className="p-2 break-all">{m.evidenceUrl ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data review & provenance
// ---------------------------------------------------------------------------

type CountMap = Record<string, number>;
interface Summary {
  generatedAt: string;
  entities: Record<'university' | 'course' | 'intake' | 'requirement', { verification: CountMap; publication?: CountMap; publiclyVisible: number }>;
  queues: { proposals: CountMap; weekly: CountMap };
  publicRule: string;
}

function Counts({ map }: { map?: CountMap }) {
  const entries = Object.entries(map ?? {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <span className="text-slate-400">none</span>;
  return <ul className="space-y-0.5">{entries.map(([k, v]) => <li key={k} className="flex justify-between gap-4"><span className="font-mono">{k}</span><span>{v.toLocaleString()}</span></li>)}</ul>;
}

export function DataReviewView() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entity, setEntity] = useState<'university' | 'course'>('university');
  const [verification, setVerification] = useState('');
  const [q, setQ] = useState('');
  const [records, setRecords] = useState<Array<Record<string, any>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try { setSummary(await readJson<Summary>(await fetch('/api/admin/catalog-review?view=summary', { cache: 'no-store' }))); }
    catch (e) { setSummary(null); setError(e instanceof Error ? e.message : 'Summary unavailable'); }
  }, []);
  const loadRecords = useCallback(async () => {
    const qs = new URLSearchParams({ view: 'records', entity, limit: '50' });
    if (verification) qs.set('verification', verification);
    if (q) qs.set('q', q);
    try { setRecords((await readJson<{ records: Array<Record<string, any>> }>(await fetch(`/api/admin/catalog-review?${qs}`, { cache: 'no-store' }))).records ?? []); }
    catch (e) { setRecords(null); setError(e instanceof Error ? e.message : 'Records unavailable'); }
  }, [entity, verification, q]);
  useEffect(() => { void loadSummary(); }, [loadSummary]);
  useEffect(() => { void loadRecords(); }, [loadRecords]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Data review & provenance" intro="Live counts from the catalogue tables, and how many records the public filter actually shows. Records without exact VERIFIED status, publication and a source link are never public." links={NAV.filter((n) => n.href !== '/admin/data-review')} />
      {error && <ErrorNote message={error} />}
      {!summary && !error && <Loading />}
      {summary && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            {(['university', 'course', 'intake', 'requirement'] as const).map((k) => (
              <Card key={k} className="p-4 bg-white border border-slate-200 rounded-2xl text-xs space-y-2">
                <h2 className="text-sm font-semibold capitalize text-slate-900">{k === 'university' ? 'Universities' : k === 'course' ? 'Courses' : k === 'intake' ? 'Intakes & fees' : 'Requirements'}</h2>
                <p className="text-slate-700">Publicly visible: <strong>{summary.entities[k].publiclyVisible.toLocaleString()}</strong></p>
                <div><div className="text-slate-500">Verification status</div><Counts map={summary.entities[k].verification} /></div>
                {summary.entities[k].publication && <div><div className="text-slate-500">Publication status</div><Counts map={summary.entities[k].publication} /></div>}
              </Card>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 bg-white border border-slate-200 rounded-2xl text-xs"><h2 className="text-sm font-semibold mb-2">Catalogue proposals by status</h2><Counts map={summary.queues.proposals} /></Card>
            <Card className="p-4 bg-white border border-slate-200 rounded-2xl text-xs"><h2 className="text-sm font-semibold mb-2">Weekly update requests by status</h2><Counts map={summary.queues.weekly} /></Card>
          </div>
          <p className="text-xs text-slate-500">{summary.publicRule} Generated {new Date(summary.generatedAt).toLocaleString()}.</p>
        </>
      )}

      <Card className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div><label htmlFor="rv-entity" className="block text-xs text-slate-600">Records</label>
            <select id="rv-entity" className="border border-slate-300 rounded-lg px-2 py-1 text-sm" value={entity} onChange={(e) => setEntity(e.target.value as 'university' | 'course')}><option value="university">Universities</option><option value="course">Courses</option></select></div>
          <div><label htmlFor="rv-ver" className="block text-xs text-slate-600">Verification status (exact)</label>
            <input id="rv-ver" className="border border-slate-300 rounded-lg px-2 py-1 text-sm" value={verification} onChange={(e) => setVerification(e.target.value)} placeholder="e.g. NEEDS_REVIEW" /></div>
          <div><label htmlFor="rv-q" className="block text-xs text-slate-600">Name contains</label>
            <input id="rv-q" className="border border-slate-300 rounded-lg px-2 py-1 text-sm" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        {records === null && !error && <Loading />}
        {records && records.length === 0 && <p className="text-sm text-slate-600">No matching records.</p>}
        {records && records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-slate-600"><tr><th className="p-1">ID</th><th className="p-1">Name</th><th className="p-1">Verification</th><th className="p-1">Publication</th><th className="p-1">Visibility</th><th className="p-1">Source</th><th className="p-1">Last verified</th><th className="p-1">Last approved change</th></tr></thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.universityId ?? r.courseId} className="border-t border-slate-100 align-top">
                    <td className="p-1 font-mono">{r.courseId ?? r.universityId}</td>
                    <td className="p-1">{r.name ?? r.courseTitle}</td>
                    <td className="p-1 font-mono">{r.verificationStatus}</td>
                    <td className="p-1 font-mono">{r.publicationStatus}</td>
                    <td className="p-1">{r.visibility}</td>
                    <td className="p-1 break-all">{r.sourceUrl || r.officialUrl || <span className="text-red-700">none</span>}</td>
                    <td className="p-1">{r.lastVerifiedAt || <span className="text-slate-400">never</span>}</td>
                    <td className="p-1">{r.lastApprovedUpdateAt || ''}{r.updatedBy ? ` (${r.updatedBy})` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conflicts & duplicates
// ---------------------------------------------------------------------------

interface Group { reason: string; key: string; records: Array<Record<string, any>> }
interface DupResponse { universities: Group[]; courses: Group[]; intakes: Group[]; conflicts: Array<Record<string, any>>; truncated: Record<string, boolean>; scanLimit: number; mergeNote: string }

function GroupList({ title, groups, idKey, label }: { title: string; groups: Group[]; idKey: string; label: (r: Record<string, any>) => string }) {
  return (
    <Card className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
      <h2 className="text-sm font-semibold text-slate-900">{title} <span className="text-slate-500 font-normal">({groups.length} group{groups.length === 1 ? '' : 's'})</span></h2>
      {groups.length === 0 ? <p className="text-xs text-slate-600">None found.</p> : (
        <ul className="space-y-2 text-xs">
          {groups.slice(0, 200).map((g) => (
            <li key={`${g.reason}|${g.key}`} className="border border-slate-100 rounded-lg p-2">
              <div className="text-slate-500">{g.reason}</div>
              <ul>{g.records.map((r) => <li key={String(r[idKey])}><span className="font-mono">{String(r[idKey])}</span> · {label(r)} · <span className="font-mono">{r.verificationStatus ?? ''}</span></li>)}</ul>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DuplicatesView() {
  const [data, setData] = useState<DupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    try { setData(await readJson<DupResponse>(await fetch('/api/admin/catalog-review?view=duplicates', { cache: 'no-store' }))); }
    catch (e) { setData(null); setError(e instanceof Error ? e.message : 'Duplicate analysis unavailable'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <PageHeader title="Conflicts & duplicates" intro="Probable duplicates found with the same rules the importer uses, open source conflicts, and duplicate intake rows (these must be resolved before a uniqueness rule can be added)." links={NAV.filter((n) => n.href !== '/admin/data-review/duplicates')} />
      {error && <ErrorNote message={error} />}
      {!data && !error && <Loading />}
      {data && (
        <>
          <Card className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900">{data.mergeNote}</Card>
          {Object.entries(data.truncated).some(([, v]) => v) && <ErrorNote message={`Only the first ${data.scanLimit.toLocaleString()} rows per table were scanned; results are incomplete.`} />}
          <GroupList title="Universities" groups={data.universities} idKey="universityId" label={(r) => `${r.name} (${r.country ?? ''})`} />
          <GroupList title="Courses" groups={data.courses} idKey="courseId" label={(r) => `${r.courseTitle || r.name} · ${r.studyLevel ?? ''} · ${r.universityId}`} />
          <GroupList title="Intakes" groups={data.intakes} idKey="id" label={(r) => `${r.courseId} · ${r.intakeYear} ${r.intakeMonth}`} />
          <Card className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">Open source conflicts ({data.conflicts.length})</h2>
            {data.conflicts.length === 0 ? <p className="text-xs text-slate-600">None recorded.</p> : (
              <ul className="text-xs space-y-1">{data.conflicts.map((c) => <li key={String(c.id)}><span className="font-mono">{c.entityType}</span> {c.universitySlug ?? ''} {c.courseSlug ?? ''} · {c.fieldName} · {c.status}</li>)}</ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Eligibility rules & validation
// ---------------------------------------------------------------------------

/** Clearly synthetic cases used only to exercise the real rule engine in the browser. Nothing is stored. */
const SYNTHETIC_COURSE: CourseRuleInput = {
  courseId: 'SAMPLE-CRS-001', title: 'MSc Sample Studies (synthetic)', universityName: 'SAMPLE University (synthetic)', country: 'United Kingdom',
  studyLevel: 'Postgraduate', programLevel: 'Masters', internationalEligibility: 'yes', sourceUrl: 'https://sample-university.invalid/msc', lastVerifiedAt: '2026-10-01',
  requirement: { academicReq: "Bachelor's degree", minScore: '2:2', gradingSystem: 'UK class', ieltsOverall: 6.5, ieltsMinBand: 6.0, officialRequirementUrl: 'https://sample-university.invalid/msc#entry' },
  fee: { yearlyTuition: 20000, currency: 'GBP' },
};
const SYNTHETIC_PROFILES: Array<{ label: string; profile: StudentProfile }> = [
  { label: 'Meets all recorded requirements', profile: { qualifications: [{ qualificationType: "Bachelor's", classification: '2:1', completionYear: 2024 }], englishTests: [{ testType: 'IELTS', overallScore: 7, listening: 7, reading: 7, writing: 6.5, speaking: 7, testDate: '2026-03-01' }] } },
  { label: 'English band slightly below', profile: { qualifications: [{ qualificationType: "Bachelor's", classification: '2:1', completionYear: 2024 }], englishTests: [{ testType: 'IELTS', overallScore: 6.5, listening: 6.5, reading: 6.5, writing: 5.5, speaking: 6.5, testDate: '2026-03-01' }] } },
  { label: 'No English test yet', profile: { qualifications: [{ qualificationType: "Bachelor's", classification: '2:2', completionYear: 2023 }], englishTests: [] } },
  { label: 'GPA on a different scale', profile: { qualifications: [{ qualificationType: "Bachelor's", gpa: 3.1, gpaScale: 4, completionYear: 2024 }], englishTests: [{ testType: 'IELTS', overallScore: 7, testDate: '2026-03-01' }] } },
  { label: 'Higher-secondary only', profile: { qualifications: [{ qualificationType: 'HSC', percentage: 78, completionYear: 2025 }], englishTests: [{ testType: 'IELTS', overallScore: 6.5, testDate: '2026-03-01' }] } },
];

export function EligibilityRulesView() {
  const [results, setResults] = useState<Array<{ label: string; evaluation: EligibilityEvaluation | null; error?: string }> | null>(null);
  function run() {
    const now = new Date();
    setResults(SYNTHETIC_PROFILES.map(({ label, profile }) => {
      try { return { label, evaluation: evaluateEligibility(profile, SYNTHETIC_COURSE, now) }; }
      catch (e) { return { label, evaluation: null, error: e instanceof Error ? e.message : 'Engine error' }; }
    }));
  }
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <PageHeader title="Eligibility rules & validation" intro="The rule engine used by the Course Finder (src/lib/course-finder/eligibility-rules.ts). It compares a student only with requirements recorded on a verified course, never guesses a missing threshold, never converts grading systems silently, and never decides on one score." links={NAV.filter((n) => n.href !== '/admin/eligibility-rules')} />
      <Card className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Result categories (7)</h2>
        <ol className="list-decimal pl-5 text-sm text-slate-700">{ELIGIBILITY_CATEGORIES.map((c) => <li key={c}><span className="font-medium">{CATEGORY_LABELS[c]}</span> <span className="font-mono text-xs text-slate-500">{c}</span></li>)}</ol>
      </Card>
      <Card className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">Disclaimers shown with every result</h2>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">{ELIGIBILITY_DISCLAIMERS.map((d) => <li key={d}>{d}</li>)}</ul>
      </Card>
      <Card className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 text-sm text-slate-700">
        <h2 className="text-sm font-semibold text-slate-900">Rule behaviour</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Every mandatory requirement is a separate row (met, not met, missing information or condition), with its source and last-verified date.</li>
          <li>A missing university requirement is shown as “not recorded”. No default threshold is used.</li>
          <li>GPA, percentages and UK classes are never converted automatically. Such cases go to counsellor review.</li>
          <li>Budget is a preference and never makes a student “not eligible”. It is compared only when the currencies match; there is no exchange-rate conversion.</li>
          <li>A not-eligible result always has a reason and next steps. Alternatives go through the same engine.</li>
          <li>Rule changes are code changes that need review and tests. This screen cannot edit rules.</li>
        </ul>
      </Card>
      <Card className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Validation harness (synthetic)</h2>
        <p className="text-xs text-slate-600">Runs the real engine in your browser against one <strong>synthetic</strong> course (“SAMPLE University”, not a real institution) and five synthetic profiles. Nothing is saved, and these results describe no real course.</p>
        <Button onClick={run}>Run validation</Button>
        {results && (
          <table className="w-full text-xs">
            <thead className="text-left text-slate-600"><tr><th className="p-1">Synthetic profile</th><th className="p-1">Category</th><th className="p-1">Requirements met</th><th className="p-1">Reason</th><th className="p-1">Next step</th></tr></thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.label} className="border-t border-slate-100 align-top">
                  <td className="p-1">{r.label}</td>
                  <td className="p-1 font-medium">{r.evaluation ? r.evaluation.categoryLabel : <span className="text-red-700">Error: {r.error}</span>}</td>
                  <td className="p-1">{r.evaluation ? `${r.evaluation.requirementsMetPercent}%` : ''}</td>
                  <td className="p-1">{r.evaluation?.reason}</td>
                  <td className="p-1">{r.evaluation?.nextSteps[0] ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
