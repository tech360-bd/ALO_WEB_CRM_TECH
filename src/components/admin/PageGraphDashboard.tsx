'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen,
  CheckCircle2, CircleAlert, FileSearch, Image as ImageIcon, Link2,
  LoaderCircle, RefreshCw, Search, ShieldCheck, Unlink2,
} from 'lucide-react';

type GraphView = 'graph' | 'links';
type GraphPayload = {
  success: boolean;
  error?: string;
  generatedAt: string;
  view: GraphView;
  scope: string;
  crawlStatus: string;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: Record<string, number | string | boolean>;
  items: any[];
};

const ISSUE_LABELS: Record<string, string> = {
  'zero-incoming': 'Zero incoming links',
  'zero-outgoing': 'Zero outgoing links',
  'missing-parent': 'Missing parent / breadcrumb link',
  'missing-related': 'No related page links',
  'seo-gap': 'Missing SEO metadata',
  'missing-image': 'No important image recorded',
};

export default function PageGraphDashboard({ view: initialView = 'graph' }: { view?: GraphView }) {
  const [view, setView] = useState<GraphView>(initialView);
  const [payload, setPayload] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [issue, setIssue] = useState(initialView === 'graph' ? 'zero-incoming' : 'all');

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ view, page: String(page), limit: '25', q: query, kind, issue });
      const response = await fetch(`/api/admin/seo/page-graph?${params.toString()}`, { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || 'Page graph could not be loaded.');
      setPayload(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Page graph could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [view, page, query, kind, issue]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setView(initialView); setIssue(initialView === 'graph' ? 'zero-incoming' : 'all'); setPage(1); }, [initialView]);

  const summary = payload?.summary || {};
  const items = payload?.items || [];
  const setViewTab = (next: GraphView) => {
    setView(next); setPage(1); setIssue(next === 'graph' ? 'zero-incoming' : 'all');
  };
  const currentPage = payload?.pagination.page || page;
  const totalPages = payload?.pagination.totalPages || 1;

  return (
    <main className="min-h-screen bg-[var(--alo-page)] p-4 text-[var(--alo-text)] sm:p-6">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--alo-brand)]"><Activity className="h-3.5 w-3.5" />SEO & internal-link health</div><h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--alo-text)]">Page graph health</h1><p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--alo-text-muted)]">A paginated graph audit of published, verified records. Finds orphan candidates, missing parent/related links, metadata gaps, image gaps and unresolved internal targets.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/admin/builder" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--alo-border)] px-3 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]"><ArrowLeft className="h-3.5 w-3.5" />Content builder</Link><Link href="/admin/research" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--alo-border)] px-3 text-[11px] font-bold text-[var(--alo-body)] hover:bg-[var(--alo-page)]"><FileSearch className="h-3.5 w-3.5" />Research center</Link><button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--alo-brand)] px-3 text-[11px] font-bold text-white hover:bg-[var(--alo-brand-hover)] disabled:opacity-50">{refreshing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Refresh audit</button></div>
        </header>

        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-crm-danger-border bg-crm-danger-bg p-4 text-xs text-crm-danger-text"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}

        <div role="note" className="flex flex-col gap-2 rounded-xl border border-crm-warning-border bg-crm-warning-bg p-4 sm:flex-row sm:items-start"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-crm-warning-text" /><div className="text-[11px] leading-4 text-crm-warning-text"><b>Release gate status: PUBLIC ROUTE CRAWL NOT RUN.</b> This model-level audit does not confirm HTTP status, rendered breadcrumbs, image loading, redirect chains, or external-link reachability. A public crawl remains a separate required release check.</div><Link href="/admin/seo/link-health" className="shrink-0 text-[11px] font-bold text-crm-warning-text underline">Internal-link results</Link></div>

        {payload && <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Published route nodes" value={summary.publishedRouteNodes} helper={`${summary.corePages || 0} core university/course/destination pages`} icon={BookOpen} tone="blue" /><Metric label="Zero incoming links" value={summary.zeroIncomingLinks} helper="Orphan candidates in the indexed graph" icon={Unlink2} tone={Number(summary.zeroIncomingLinks) ? 'red' : 'green'} /><Metric label="Missing parent / crumb" value={summary.missingParentOrBreadcrumb} helper="No parent edge in the database graph" icon={ArrowRight} tone={Number(summary.missingParentOrBreadcrumb) ? 'amber' : 'green'} /><Metric label="SEO metadata gaps" value={summary.seoGaps} helper={`${summary.missingImportantImages || 0} missing important images`} icon={ImageIcon} tone={Number(summary.seoGaps) || Number(summary.missingImportantImages) ? 'amber' : 'green'} /><Metric label="Unresolved internal targets" value={summary.brokenInternalTargets} helper={`${summary.selfLinkCandidates || 0} self-link candidates`} icon={Link2} tone={Number(summary.brokenInternalTargets) ? 'red' : 'green'} /></section>

          <section className="rounded-2xl border border-[var(--alo-border)] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--alo-border)] p-5"><div><div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--alo-brand)]">Graph diagnostics</div><h2 className="mt-1 text-lg font-black text-[var(--alo-text)]">Published page audit</h2><p className="mt-1 max-w-2xl text-[11px] leading-4 text-[var(--alo-text-muted)]">{payload.scope}</p></div><div className="flex flex-wrap gap-2"><label className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--alo-text-muted)]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search page or target" className="h-9 w-full rounded-lg border border-[var(--alo-border)] pl-9 pr-3 text-[11px] outline-none focus:border-[var(--alo-brand-border)] sm:w-52" /></label>{view === 'graph' && <select value={issue} onChange={(event) => { setIssue(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-[var(--alo-border)] px-2 text-[11px] font-semibold text-[var(--alo-body)]"><option value="all">All graph results</option><option value="zero-incoming">Zero incoming</option><option value="zero-outgoing">Zero outgoing</option><option value="missing-parent">Missing parent</option><option value="missing-related">Missing related</option><option value="seo-gap">SEO gaps</option><option value="missing-image">Missing image</option></select>}<select value={kind} onChange={(event) => { setKind(event.target.value); setPage(1); }} className="h-9 rounded-lg border border-[var(--alo-border)] px-2 text-[11px] font-semibold text-[var(--alo-body)]"><option value="all">All page types</option><option value="UNIVERSITY">Universities</option><option value="COURSE">Courses</option><option value="COUNTRY">Destinations</option><option value="GUIDE">Guides</option><option value="BLOG">Blog</option><option value="SCHOLARSHIP">Scholarships</option></select></div></div>

            <div className="flex gap-1 overflow-x-auto border-b border-[var(--alo-border)] px-4 pt-2"><button type="button" onClick={() => setViewTab('graph')} className={`shrink-0 rounded-t-lg px-3 py-2.5 text-[11px] font-bold ${view === 'graph' ? 'border-b-2 border-[var(--alo-brand)] bg-[var(--alo-brand-pale)]/50 text-[var(--alo-brand)]' : 'text-[var(--alo-text-muted)] hover:bg-[var(--alo-page)]'}`}>Page graph & orphan audit</button><button type="button" onClick={() => setViewTab('links')} className={`shrink-0 rounded-t-lg px-3 py-2.5 text-[11px] font-bold ${view === 'links' ? 'border-b-2 border-[var(--alo-brand)] bg-[var(--alo-brand-pale)]/50 text-[var(--alo-brand)]' : 'text-[var(--alo-text-muted)] hover:bg-[var(--alo-page)]'}`}>Internal-link target audit ({summary.brokenInternalTargets || 0})</button></div>

            {loading ? <div className="flex items-center justify-center gap-2 p-14 text-xs text-[var(--alo-text-muted)]"><LoaderCircle className="h-4 w-4 animate-spin" />Loading page graph…</div> : view === 'graph' ? <div className="overflow-x-auto"><table className="min-w-[1040px] w-full text-left"><thead className="bg-[var(--alo-page)] text-[11px] font-bold uppercase tracking-wider text-[var(--alo-text-muted)]"><tr><th className="px-5 py-3">Page</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Links in / out</th><th className="px-3 py-3">Parent / related</th><th className="px-3 py-3">SEO / media</th><th className="px-3 py-3">Health</th><th className="px-5 py-3">Issues</th></tr></thead><tbody className="divide-y divide-[var(--alo-border)]">{items.map((item) => <tr key={item.path} className="align-top hover:bg-[var(--alo-page)]/60"><td className="max-w-[280px] px-5 py-3"><div className="truncate text-[11px] font-bold text-[var(--alo-text)]" title={item.title}>{item.title}</div><Link href={item.path} target="_blank" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-[var(--alo-brand)] hover:underline">{item.path}<ArrowUpRight className="h-2.5 w-2.5 shrink-0" /></Link></td><td className="px-3 py-3"><Tag tone="blue">{item.kind}</Tag></td><td className="px-3 py-3 text-[11px] text-[var(--alo-body)]">{item.incoming} in<br />{item.outgoing} out</td><td className="px-3 py-3 text-[11px] text-[var(--alo-body)]">{item.parentLinked ? <span className="text-crm-success-text">Parent linked</span> : <span className="text-crm-warning-text">No parent</span>}<br />{item.related} related</td><td className="px-3 py-3 text-[11px] text-[var(--alo-body)]"><div className="flex flex-wrap gap-1"><Tag tone={item.seoTitle && item.metaDescription && item.canonical ? 'green' : 'amber'}>{item.seoTitle && item.metaDescription && item.canonical ? 'SEO OK' : 'SEO gap'}</Tag><Tag tone={item.image && item.imageAlt ? 'green' : 'amber'}>{item.image ? (item.imageAlt ? 'Media + alt' : 'Media: alt gap') : 'No image'}</Tag></div></td><td className="px-3 py-3"><div className={`text-sm font-black ${item.health >= 80 ? 'text-crm-success-text' : item.health >= 55 ? 'text-crm-warning-text' : 'text-crm-warning-text'}`}>{item.health}<span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">/100</span></div></td><td className="max-w-[290px] px-5 py-3"><div className="flex flex-wrap gap-1">{item.issues.length ? item.issues.map((flag: string) => <Tag key={flag} tone={flag === 'zero-incoming' ? 'red' : 'amber'}>{ISSUE_LABELS[flag] || flag}</Tag>) : <Tag tone="green">No graph issue</Tag>}</div></td></tr>)}{items.length === 0 && <EmptyRow colSpan={7} label="No pages match this filter." />}</tbody></table></div> : <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left"><thead className="bg-[var(--alo-page)] text-[11px] font-bold uppercase tracking-wider text-[var(--alo-text-muted)]"><tr><th className="px-5 py-3">Source page</th><th className="px-4 py-3">Unresolved target</th><th className="px-4 py-3">Reference type</th><th className="px-4 py-3">Finding</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-[var(--alo-border)]">{items.map((item) => <tr key={item.id}><td className="px-5 py-3"><div className="text-[11px] font-bold text-[var(--alo-text)]">{item.sourcePath}</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{item.sourceType} · {item.sourceId}</div></td><td className="max-w-[420px] break-all px-4 py-3 text-[11px] text-crm-warning-text">{item.targetPath}</td><td className="px-4 py-3 text-[11px] text-[var(--alo-body)]">{item.relationshipType || item.type || 'internal link'}<br /><span className="text-[11px] text-[var(--alo-text-muted)]">{item.origin || 'content relationship'}</span></td><td className="px-4 py-3"><Tag tone="red">{item.issue}</Tag></td><td className="px-5 py-3"><Link href={item.sourcePath && item.sourcePath.startsWith('/') ? item.sourcePath : '/admin/university-data'} target="_blank" className="text-[11px] font-bold text-[var(--alo-brand)] hover:underline">Inspect source <ArrowUpRight className="inline h-3 w-3" /></Link></td></tr>)}{items.length === 0 && <EmptyRow colSpan={5} label="No unresolved internal targets in the current indexed records." />}</tbody></table></div>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--alo-border)] px-5 py-3 text-[11px] text-[var(--alo-text-muted)]"><span>Page {currentPage} of {Math.max(1, totalPages)} · {payload.pagination.total.toLocaleString()} matching records · 25 rows per page</span><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1 || loading} className="rounded-lg border border-[var(--alo-border)] px-3 py-1.5 font-bold disabled:opacity-40">Previous</button><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages || loading} className="rounded-lg border border-[var(--alo-border)] px-3 py-1.5 font-bold disabled:opacity-40">Next</button></div></div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-crm-success-text" /><h2 className="text-sm font-bold text-[var(--alo-text)]">Graph scope & method</h2></div><ul className="mt-3 space-y-2 text-[11px] leading-4 text-[var(--alo-body)]"><li>• Uses currently published and verified ALO rows plus available content relationship records.</li><li>• Adds route-parent edges for collection pages, country → university and university → course records.</li><li>• Internal references are checked against this published route index; an unresolved target is a candidate, not a live HTTP failure.</li><li>• Important images are reported as missing unless a recorded image and descriptive alt text are present.</li></ul></div><div className="rounded-2xl border border-[var(--alo-border)] bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-crm-warning-text" /><h2 className="text-sm font-bold text-[var(--alo-text)]">Release checklist remains separate</h2></div><div className="mt-3 space-y-2 text-[11px] leading-4 text-[var(--alo-body)]"><div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-crm-success-text" />Database graph analysis completed for this request</div><div className="flex items-center gap-2"><CircleAlert className="h-3.5 w-3.5 text-crm-warning-text" />Public route crawl: {String(summary.crawlReleaseGate || 'NOT_RUN')}</div><div className="flex items-center gap-2"><CircleAlert className="h-3.5 w-3.5 text-crm-warning-text" />Build, security and migration gates must still pass</div><div className="flex items-center gap-2"><CircleAlert className="h-3.5 w-3.5 text-crm-warning-text" />Database scan truncated: {summary.scanLimited ? 'Yes — review scope before release' : 'No'}</div></div><Link href="/admin/research" className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--alo-brand)] hover:underline">Review coverage & conflicts <ArrowRight className="h-3 w-3" /></Link></div></section>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--alo-border)] bg-white px-4 py-3 text-[11px] text-[var(--alo-text-muted)]"><span>Audit snapshot generated {new Date(payload.generatedAt).toLocaleString()}</span><Link href="/admin/data-coverage" className="font-bold text-[var(--alo-brand)] hover:underline">Open data coverage →</Link></div>
        </>}
      </div>
    </main>
  );
}

function Metric({ label, value, helper, icon: Icon, tone }: { label: string; value: string | number | boolean | undefined; helper: string; icon: typeof Activity; tone: 'red' | 'amber' | 'green' | 'blue' }) {
  const styles = { red: 'bg-crm-warning-bg text-crm-warning-text', amber: 'bg-crm-warning-bg text-crm-warning-text', green: 'bg-crm-success-bg text-crm-success-text', blue: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]' };
  return <div className="rounded-2xl border border-[var(--alo-border)] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--alo-text-muted)]">{label}</div><div className="mt-2 text-xl font-black text-[var(--alo-text)]">{value ?? '—'}</div><div className="mt-1 text-[11px] text-[var(--alo-text-muted)]">{helper}</div></div><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="h-4 w-4" /></div></div></div>;
}

function Tag({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue' }) {
  const styles = { slate: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]', green: 'bg-crm-success-bg text-crm-success-text', amber: 'bg-crm-warning-bg text-crm-warning-text', red: 'bg-crm-warning-bg text-crm-warning-text', blue: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]' };
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold ${styles[tone]}`}>{children}</span>;
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return <tr><td colSpan={colSpan} className="p-8 text-center text-[11px] text-[var(--alo-text-muted)]">{label}</td></tr>;
}
