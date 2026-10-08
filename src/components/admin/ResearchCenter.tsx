'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, BookOpen, Bot, Check, CheckCircle2,
  Clock3, ExternalLink, FileSearch, Globe2, LoaderCircle, Play, RefreshCw,
  Search, ShieldAlert, ShieldCheck, Sparkles, XCircle,
} from 'lucide-react';

type ResearchData = {
  dashboard?: any;
  changes: any[];
  conflicts: any[];
  logs: any[];
};

function fmt(value: number | undefined) { return (value || 0).toLocaleString(); }

function StatusTag({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue' }) {
  const styles = { slate: 'bg-slate-100 text-slate-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-rose-50 text-rose-700', blue: 'bg-blue-50 text-blue-700' };
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold ${styles[tone]}`}>{children}</span>;
}

export default function ResearchCenter() {
  const [data, setData] = useState<ResearchData | null>(null);
  const [active, setActive] = useState<'queue' | 'running' | 'completed' | 'failed' | 'conflicts' | 'published'>('queue');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const [dashboardResponse, changeResponse, conflictResponse, logsResponse] = await Promise.all([
        fetch('/api/university-monitoring/dashboard?period=30d', { cache: 'no-store' }),
        fetch('/api/university-monitoring/changes?status=PENDING&limit=25', { cache: 'no-store' }),
        fetch('/api/university-monitoring/conflicts?status=PENDING&limit=25', { cache: 'no-store' }),
        fetch('/api/university-monitoring/logs?limit=30', { cache: 'no-store' }),
      ]);
      const [dashboard, changePayload, conflictPayload, logPayload] = await Promise.all([
        dashboardResponse.json().catch(() => ({})), changeResponse.json().catch(() => ({})), conflictResponse.json().catch(() => ({})), logsResponse.json().catch(() => ({})),
      ]);
      const failed = [dashboardResponse, changeResponse, conflictResponse, logsResponse].find((response) => !response.ok);
      if (failed) throw new Error(dashboard.error || changePayload.error || conflictPayload.error || 'Research data could not be loaded.');
      setData({ dashboard, changes: changePayload.changes || [], conflicts: conflictPayload.conflicts || [], logs: logPayload.logs || [] });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Research data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const trigger = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/university-monitoring/trigger', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope: 'verified-only', limit: 25 }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Research run could not be started.');
      setNotice(`Research run ${payload.runId || ''} started with ${payload.sourcesChecked ?? 'queued'} source checks. Findings remain pending human review.`);
      await load(true);
    } catch (triggerError) {
      setError(triggerError instanceof Error ? triggerError.message : 'Research run could not be started.');
    } finally {
      setBusy(false);
    }
  };

  const dashboard = data?.dashboard;
  const pendingChanges = data?.changes || [];
  const pendingConflicts = data?.conflicts || [];
  const runs = dashboard?.recentRuns || [];
  const filteredChanges = pendingChanges.filter((change) => `${change.fieldName} ${change.changeType} ${change.universitySlug} ${change.courseSlug} ${change.source?.sourceName}`.toLowerCase().includes(search.toLowerCase()));
  const filteredConflicts = pendingConflicts.filter((conflict) => `${conflict.entityType} ${conflict.fieldName} ${conflict.universitySlug} ${conflict.courseSlug} ${conflict.countrySlug}`.toLowerCase().includes(search.toLowerCase()));
  const completeRuns = runs.filter((run: any) => ['COMPLETED', 'PARTIAL'].includes(run.status));
  const failedRuns = runs.filter((run: any) => run.status === 'FAILED');
  const runningRuns = runs.filter((run: any) => run.status === 'RUNNING');

  if (loading) return <div className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-[1440px] animate-pulse space-y-4"><div className="h-28 rounded-2xl bg-white" /><div className="grid gap-4 md:grid-cols-4"><div className="h-28 rounded-2xl bg-white" /><div className="h-28 rounded-2xl bg-white" /><div className="h-28 rounded-2xl bg-white" /><div className="h-28 rounded-2xl bg-white" /></div></div></div>;

  return (
    <div className="min-h-screen bg-[#f4f6fb] p-4 text-slate-900 sm:p-6">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-purple-700"><Sparkles className="h-3.5 w-3.5" />ALO research pipeline</div><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Research center</h1><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Discover → extract → normalize → compare → flag → human review → publish. Source disagreements stay visible; no lower-authority source silently overwrites a verified value.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/data-coverage" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50"><Activity className="h-3.5 w-3.5" />Data coverage</Link><Link href="/admin/data-sources" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50"><Globe2 className="h-3.5 w-3.5" />Official sources</Link><button type="button" onClick={() => void trigger()} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-purple-600 px-4 text-[10px] font-bold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Run research now</button><button type="button" onClick={() => void load(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" />Refresh</button></div></header>

        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
        {notice && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}

        {dashboard && <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Stat label="Research health" value={dashboard.health || '—'} helper={dashboard.job?.lastRunStatus ? `Last run: ${dashboard.job.lastRunStatus}` : 'No monitoring run yet'} icon={ShieldCheck} tone={dashboard.health === 'HEALTHY' ? 'green' : dashboard.health === 'ERROR' ? 'red' : 'amber'} />
            <Stat label="Official sources" value={fmt(dashboard.sources?.active)} helper={`${fmt(dashboard.sources?.broken)} broken · ${fmt(dashboard.sources?.failed)} failing`} icon={Globe2} tone="blue" />
            <Stat label="Courses monitored" value={fmt(dashboard.entities?.courses)} helper={`${fmt(dashboard.entities?.verifiedCourses)} verified`} icon={BookOpen} tone="violet" />
            <Stat label="Review queue" value={fmt(dashboard.queue?.pending + dashboard.queue?.needsReview)} helper={`${fmt(dashboard.queue?.critical)} critical · ${fmt(dashboard.queue?.conflicts)} conflicts`} icon={FileSearch} tone="amber" />
            <Stat label="Monitoring runs" value={fmt(dashboard.job?.totalRuns)} helper={`${fmt(dashboard.job?.successfulRuns)} successful · ${fmt(dashboard.job?.failedRuns)} failed`} icon={Activity} tone="slate" />
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-700">Monitoring workflow</div><h2 className="mt-1 text-lg font-black text-slate-900">Source-to-review operating lane</h2><p className="mt-1 text-[10px] text-slate-500">Official university sources are preferred; detected changes wait for a human decision.</p></div><StatusTag tone={dashboard.health === 'HEALTHY' ? 'green' : 'amber'}>{dashboard.health || 'UNKNOWN'}</StatusTag></div><div className="mt-5 grid gap-2 sm:grid-cols-7">{[
              ['DISCOVER', 'Official URLs'], ['EXTRACT', 'Evidence'], ['NORMALIZE', 'Records'], ['COMPARE', 'Value changes'], ['FLAG', 'Conflict check'], ['HUMAN REVIEW', 'Decision'], ['PUBLISH', 'Approved only'],
            ].map(([label, caption], index) => <div key={label} className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-3"><div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${index < 5 ? 'bg-purple-50 text-purple-700' : 'bg-white text-slate-500'}`}>{index < 5 ? <Check className="h-3.5 w-3.5" /> : <span className="text-[9px] font-black">{index + 1}</span>}</div><div className="text-[8px] font-black tracking-wide text-slate-800">{label}</div><div className="mt-1 text-[8px] leading-3 text-slate-500">{caption}</div>{index < 6 && <ArrowRight className="absolute -right-2 top-5 z-10 hidden h-3.5 w-3.5 bg-white text-slate-300 sm:block" />}</div>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Next scheduled run</div><div className="mt-1 text-xs font-semibold text-slate-800">{dashboard.job?.nextRunAt ? new Date(dashboard.job.nextRunAt).toLocaleString() : 'Not scheduled'}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Last completed</div><div className="mt-1 text-xs font-semibold text-slate-800">{dashboard.job?.lastRunCompletedAt ? new Date(dashboard.job.lastRunCompletedAt).toLocaleString() : 'No completed run recorded'}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Detected conflicts</div><div className="mt-1 text-xs font-semibold text-slate-800">{fmt(dashboard.queue?.conflicts)} awaiting reviewer</div></div></div></section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Recent runs</div><h2 className="mt-1 text-lg font-black text-slate-900">Activity and outcomes</h2></div><Clock3 className="h-5 w-5 text-slate-400" /></div><div className="mt-4 space-y-2">{runs.slice(0, 5).map((run: any) => <div key={run.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className={`flex h-8 w-8 items-center justify-center rounded-lg ${run.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : run.status === 'FAILED' ? 'bg-rose-50 text-rose-700' : run.status === 'RUNNING' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{run.status === 'FAILED' ? <XCircle className="h-4 w-4" /> : run.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4" /> : <Activity className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><div className="truncate text-[10px] font-bold text-slate-800">{run.runId}</div><div className="mt-1 text-[8px] text-slate-500">{new Date(run.startedAt).toLocaleString()} · {run.sourcesChecked} sources · {run.changesDetected} changes</div></div><StatusTag tone={run.status === 'COMPLETED' ? 'green' : run.status === 'FAILED' ? 'red' : 'amber'}>{run.status}</StatusTag></div>)}{runs.length === 0 && <EmptyMessage title="No research runs recorded" text="Run a source monitoring pass to create an auditable activity record." />}</div></section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">Research operations</div><h2 className="mt-1 text-lg font-black text-slate-900">Evidence work queues</h2><p className="mt-1 text-[10px] text-slate-500">Every proposed change retains source, time, confidence and reviewer outcome.</p></div><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search source or entity" className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-[10px] outline-none focus:border-blue-400" /></div></div>
            <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-2">{[
              ['queue', `Review queue (${dashboard.queue?.pending || 0})`], ['running', `Running (${runningRuns.length})`], ['completed', `Completed (${completeRuns.length})`], ['failed', `Failed (${failedRuns.length})`], ['conflicts', `Conflicts (${pendingConflicts.length})`], ['published', `Published updates (${dashboard.queue?.approved || 0})`],
            ].map(([key, label]) => <button key={key} type="button" onClick={() => setActive(key as typeof active)} className={`shrink-0 rounded-t-lg px-3 py-2.5 text-[9px] font-bold ${active === key ? 'border-b-2 border-blue-600 bg-blue-50/50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>{label}</button>)}</div>
            {active === 'queue' && <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-left"><thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Change detected</th><th className="px-4 py-3">Entity</th><th className="px-4 py-3">Evidence source</th><th className="px-4 py-3">Confidence / impact</th><th className="px-4 py-3">Detected</th><th className="px-5 py-3">Review</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredChanges.map((change) => <tr key={change.id} className="hover:bg-slate-50/60"><td className="px-5 py-3"><div className="text-[10px] font-bold text-slate-900">{change.changeType.replaceAll('_', ' ')}</div><div className="mt-1 text-[9px] text-slate-500">{change.fieldName}: {change.oldValue || '—'} → {change.newValue || '—'}</div></td><td className="px-4 py-3"><div className="text-[9px] font-bold text-slate-700">{change.entityType}</div><div className="mt-1 text-[8px] text-slate-400">{change.universitySlug || change.courseSlug || change.countrySlug || 'Unlinked entity'}</div></td><td className="px-4 py-3"><div className="text-[9px] font-semibold text-slate-700">{change.source?.sourceName || change.source?.sourceType || 'Source record'}</div><a href={change.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-[220px] items-center gap-1 truncate text-[8px] text-blue-700 hover:underline">Official source <ExternalLink className="h-2.5 w-2.5 shrink-0" /></a></td><td className="px-4 py-3"><div className="text-[9px] font-bold text-slate-700">{Math.round((change.confidence || 0) * 100)}% confidence</div><div className="mt-1"><StatusTag tone={change.impactLevel === 'CRITICAL' || change.impactLevel === 'HIGH' ? 'red' : change.impactLevel === 'MEDIUM' ? 'amber' : 'slate'}>{change.impactLevel}</StatusTag></div></td><td className="px-4 py-3 text-[9px] text-slate-500">{new Date(change.detectedAt).toLocaleString()}</td><td className="px-5 py-3"><Link href={`/admin/university-data/updates`} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[8px] font-bold text-blue-700 hover:bg-blue-100">Review evidence <ArrowRight className="h-3 w-3" /></Link></td></tr>)}{filteredChanges.length === 0 && <TableEmpty label="No pending change records match this view." />}</tbody></table></div>}
            {active === 'running' && <div className="space-y-3 p-4">{runningRuns.length ? runningRuns.map((run: any) => <RunRow key={run.id} run={run} />) : <EmptyMessage title="No active research run" text="A manual or scheduled monitoring cycle will appear here while it is running." />}</div>}
            {active === 'completed' && <div className="space-y-3 p-4">{completeRuns.length ? completeRuns.map((run: any) => <RunRow key={run.id} run={run} />) : <EmptyMessage title="No completed runs yet" text="Completed and partial monitoring runs remain in the run history." />}</div>}
            {active === 'failed' && <div className="space-y-3 p-4">{failedRuns.length ? failedRuns.map((run: any) => <RunRow key={run.id} run={run} />) : <EmptyMessage title="No failed runs in this window" text="The dashboard lists the ten latest source monitoring runs." />}</div>}
            {active === 'conflicts' && <div className="divide-y divide-slate-100">{filteredConflicts.length ? filteredConflicts.map((conflict) => <div key={conflict.id} className="flex flex-wrap items-start justify-between gap-3 p-4"><div className="flex gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700"><ShieldAlert className="h-4 w-4" /></div><div><div className="text-[10px] font-bold text-slate-800">{conflict.entityType} · {conflict.fieldName}</div><div className="mt-1 text-[9px] text-slate-500">{conflict.universitySlug || conflict.courseSlug || conflict.countrySlug} · {new Date(conflict.detectedAt).toLocaleString()}</div><ConflictSummary value={conflict.conflictingValues} /></div></div><Link href="/admin/data-conflicts" className="rounded-lg bg-rose-50 px-3 py-2 text-[9px] font-bold text-rose-700 hover:bg-rose-100">Resolve conflict</Link></div>) : <div className="p-8"><EmptyMessage title="No conflicts pending" text="Conflicting source values are held for a human decision; they are never auto-selected." /></div>}</div>}
            {active === 'published' && <div className="p-4"><div className="mb-3 rounded-xl bg-emerald-50 p-3 text-[10px] leading-4 text-emerald-800">Approved changes can be audited through the data-change history. Only a human-approved source update is applied to a production record.</div><div className="space-y-2">{data.logs.filter((log) => /published|approved|applied/i.test(log.message || '')).slice(0, 12).map((log) => <div key={log.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /><div><div className="text-[10px] font-semibold text-slate-800">{log.message}</div><div className="mt-1 text-[8px] text-slate-400">{new Date(log.createdAt).toLocaleString()} · {log.level}</div></div></div>)}{!data.logs.some((log) => /published|approved|applied/i.test(log.message || '')) && <EmptyMessage title="No published updates in recent activity" text="Approved update events will appear here when present in the monitoring logs." />}</div></div>}
          </section>

          <section className="grid gap-4 xl:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-purple-700" /><h2 className="text-sm font-bold text-slate-900">Research task audit trail</h2></div><p className="mt-1 text-[10px] text-slate-500">Run logs record the agent action, source, timestamp, result and errors.</p><div className="mt-4 space-y-2">{data.logs.slice(0, 5).map((log) => <div key={log.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-start justify-between gap-2"><div className="text-[10px] font-semibold text-slate-800">{log.message}</div><StatusTag tone={log.level === 'ERROR' ? 'red' : log.level === 'WARN' ? 'amber' : 'slate'}>{log.level}</StatusTag></div><div className="mt-1 text-[8px] text-slate-400">{new Date(log.createdAt).toLocaleString()} · {log.runId}</div></div>)}{!data.logs.length && <EmptyMessage title="No task log yet" text="Research events will appear when source monitoring is run." />}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-600" /><h2 className="text-sm font-bold text-slate-900">Authority and conflict policy</h2></div><div className="mt-4 space-y-2">{[
            ['01', 'Official university source', 'Preferred authority for courses, fees, deadlines and entry criteria.'],
            ['02', 'Government source', 'Preferred authority for visa and regulatory policy.'],
            ['03', 'Official application portal', 'Operational application dates and submission information.'],
            ['04', 'Recognized providers / trusted secondary sources', 'Discovery and corroboration; never silently overwrite higher-authority verified data.'],
          ].map(([number, title, detail]) => <div key={number} className="flex gap-3 rounded-xl bg-slate-50 p-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[9px] font-black text-slate-500">{number}</div><div><div className="text-[10px] font-bold text-slate-800">{title}</div><div className="mt-1 text-[9px] leading-4 text-slate-500">{detail}</div></div></div>)}</div></div></section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[9px] text-slate-500"><span>Research output stays in a review queue until evidence is checked and an authorized human decides.</span><Link href="/admin/university-data/updates" className="flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900">Open detailed verification queue <ArrowRight className="h-3 w-3" /></Link></div>
        </>}
      </div>
    </div>
  );
}

function Stat({ label, value, helper, icon: Icon, tone }: { label: string; value: string | number; helper: string; icon: typeof Activity; tone: 'green' | 'blue' | 'violet' | 'amber' | 'red' | 'slate' }) {
  const styles = { green: 'bg-emerald-50 text-emerald-700', blue: 'bg-blue-50 text-blue-700', violet: 'bg-purple-50 text-purple-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-rose-50 text-rose-700', slate: 'bg-slate-100 text-slate-700' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div><div className="mt-2 text-xl font-black text-slate-900">{value}</div><div className="mt-1 text-[9px] text-slate-500">{helper}</div></div><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="h-4 w-4" /></div></div></div>;
}

function RunRow({ run }: { run: any }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Activity className="h-4 w-4" /></div><div><div className="text-[10px] font-bold text-slate-800">{run.runId} · {run.status}</div><div className="mt-1 text-[8px] text-slate-500">Started {new Date(run.startedAt).toLocaleString()} · {run.sourcesChecked} sources · {run.changesDetected} changes</div></div></div><div className="flex items-center gap-2"><StatusTag tone={run.conflicts > 0 ? 'red' : run.status === 'COMPLETED' ? 'green' : 'amber'}>{run.conflicts || 0} conflict(s)</StatusTag><StatusTag>{run.coursesChecked || 0} course(s)</StatusTag></div>{run.errorMessage && <div className="basis-full rounded-lg bg-rose-50 p-2 text-[9px] text-rose-700">{run.errorMessage}</div>}</div>;
}

function ConflictSummary({ value }: { value: string }) {
  let entries: any[] = [];
  try { const parsed = JSON.parse(value || '[]'); entries = Array.isArray(parsed) ? parsed : []; } catch { entries = []; }
  return <div className="mt-2 flex flex-wrap gap-1.5">{entries.slice(0, 4).map((entry, index) => <span key={index} className="rounded-md bg-rose-50 px-2 py-1 text-[8px] text-rose-700">{entry.sourceName || 'Source'} · {entry.value || 'value unavailable'}</span>)}</div>;
}

function EmptyMessage({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center"><div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><FileSearch className="h-4 w-4" /></div><div className="mt-2 text-[10px] font-bold text-slate-700">{title}</div><p className="mt-1 text-[9px] leading-4 text-slate-500">{text}</p></div>;
}

function TableEmpty({ label }: { label: string }) {
  return <tr><td colSpan={6} className="p-8 text-center text-[10px] text-slate-500">{label}</td></tr>;
}
