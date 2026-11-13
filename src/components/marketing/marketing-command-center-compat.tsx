'use client';

/**
 * Compatibility surfaces for the requested Marketing Command Center URLs.
 *
 * All values come from existing live APIs. A failed or unauthorized request is
 * shown as an explicit error/unavailable state; nothing is simulated, and no
 * button pretends to publish to an unconnected provider.
 */
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type View = 'studio' | 'calendar' | 'approvals';

type Row = Record<string, unknown>;

const PAGE_META: Record<View, { title: string; description: string }> = {
  studio: {
    title: 'Marketing Studio',
    description: 'Live marketing KPIs from the existing command center. Every value is a database count; an unavailable data source is reported, not guessed.',
  },
  calendar: {
    title: 'Content Calendar',
    description: 'Planning entries from the existing marketing calendar API. Approved publishing requires a connected scheduler/provider; planning is not publication.',
  },
  approvals: {
    title: 'Campaign & Content Approval',
    description: 'Pending approval items from the existing approval API. Approve/reject is enforced server-side and written to the marketing audit log.',
  },
};

const KPI_LABELS: Array<[string, string]> = [
  ['todayLeads', 'Today Leads'], ['hotLeads', 'Hot Leads'], ['newDmLeads', 'New DM Leads'],
  ['commentLeads', 'Comment Leads'], ['whatsappReplies', 'WhatsApp Replies'], ['websiteChatLeads', 'Website Chat Leads'],
  ['campaignsRunning', 'Campaigns Running'], ['pendingApproval', 'Pending Content Approval'], ['pendingComments', 'Pending Comments'],
  ['scheduledPosts', 'Scheduled Posts'], ['failedPosts', 'Failed Posts'], ['costPerLead', 'Cost Per Lead'],
  ['leadConversionRate', 'Lead Conversion Rate %'], ['counselorAssigned', 'Counselor Assigned Leads'],
  ['followUpOverdue', 'Follow-up Overdue'], ['socialAccountsConnected', 'Social Accounts Connected'], ['aiJobsRunning', 'AI Jobs Running'],
];

async function readJson(url: string, init?: RequestInit): Promise<{ ok: boolean; data: Row }> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  const data = (await response.json().catch(() => ({}))) as Row;
  return { ok: response.ok, data };
}

function str(value: unknown, fallback = '—'): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--alo-border,#e2e8f0)] bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-alo-text">{title}</h2>
      {children}
    </section>
  );
}

export function MarketingCommandCenterCompat({ view }: { view: View }) {
  const [data, setData] = useState<Row>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('FACEBOOK');
  const [scheduledAt, setScheduledAt] = useState('');

  const endpoint = view === 'studio' ? '/api/marketing/dashboard'
    : view === 'calendar' ? '/api/marketing/calendar' : '/api/marketing/approvals?status=pending';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await readJson(endpoint);
      if (!result.ok) {
        setError(`${result.data.error || 'Request refused'} (backend authorization or data source unavailable)`);
        setData({});
      } else {
        setData(result.data);
      }
    } catch {
      setError('Could not reach the live API. No sample or simulated data is shown.');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  async function act(url: string, init: RequestInit, success: string) {
    setBusy(true);
    setNotice('');
    try {
      const result = await readJson(url, init);
      setNotice(result.ok ? success : `Request refused: ${result.data.error || 'unknown reason'}`);
      if (result.ok) await load();
    } catch {
      setNotice('Request failed; the server did not accept it.');
    } finally {
      setBusy(false);
    }
  }

  const meta = PAGE_META[view];
  const kpis = (data.kpis || {}) as Row;
  const approvals = Array.isArray(data.approvals) ? data.approvals as Row[] : [];
  const items = Array.isArray(data.items) ? data.items as Row[] : [];

  return (
    <div className="min-h-screen bg-[var(--alo-page-bg,#f7f9fc)] p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-xl border border-[var(--alo-border,#e2e8f0)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-primary,#0057b8)]">ALO Marketing Command Center</p>
              <h1 className="mt-1 text-2xl font-bold text-alo-text">{meta.title}</h1>
              <p className="mt-1 max-w-3xl text-sm text-alo-text-secondary">{meta.description}</p>
            </div>
            <Link href="/crm/marketing-manager" className="rounded-md border border-alo-border-strong px-3 py-2 text-sm font-medium text-alo-body hover:bg-alo-brand-pale">
              Open full Command Center
            </Link>
          </div>
          <p className="mt-3 text-xs text-alo-text-muted">Live endpoint: <code className="rounded bg-alo-brand-pale px-1">{endpoint}</code></p>
        </header>

        {loading && <p className="rounded-lg bg-white p-4 text-sm text-alo-text-secondary">Loading live data…</p>}
        {!loading && error && (
          <div className="rounded-lg border border-alo-warning bg-alo-warning/10 p-4 text-sm text-alo-text">
            <strong>Data unavailable / not authorized.</strong> {error}
          </div>
        )}
        {notice && <p className="rounded-lg border border-alo-border bg-white p-3 text-sm text-alo-body">{notice}</p>}

        {!loading && !error && view === 'studio' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {KPI_LABELS.map(([key, label]) => (
                <div key={key} className="rounded-xl border border-alo-border bg-white p-4">
                  <p className="text-xs text-alo-text-muted">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-alo-text">{str(kpis[key], '0')}</p>
                </div>
              ))}
            </div>
            <Panel title="Connected working modules">
              <div className="flex flex-wrap gap-2 text-sm">
                {[
                  ['/crm/marketing', 'Campaigns'], ['/crm/marketing-manager', 'Command Center'],
                  ['/crm/content-calendar', 'Content Calendar'], ['/crm/campaign-approval', 'Approval Queue'],
                  ['/crm/seo-manager', 'SEO Manager'], ['/crm/social-inbox', 'Social Inbox'],
                  ['/admin/video-studio', 'Video Studio'], ['/admin/approvals', 'Admin Approvals'],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="rounded-md border border-alo-border-strong px-3 py-2 hover:bg-alo-brand-pale">{label}</Link>
                ))}
              </div>
              <p className="mt-3 text-xs text-alo-text-muted">AI generation, video, social and email publishing are not represented as connected here; open each module for its real provider/configuration state.</p>
            </Panel>
          </>
        )}

        {!loading && !error && view === 'calendar' && (
          <>
            {data.scheduler && (
              <div className="rounded-lg border border-alo-warning bg-alo-warning/10 p-3 text-sm text-alo-text">
                Publishing scheduler status: <strong>{str(data.scheduler)}</strong>. Calendar entries are plans/drafts only; no public post is created by saving them.
              </div>
            )}
            <Panel title="New planning entry (saved to the calendar API; not published)">
              <form
                className="grid gap-2 sm:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void act('/api/marketing/calendar', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, platform, contentType: 'POST', scheduledAt: new Date(scheduledAt).toISOString() }),
                  }, 'Planning entry saved. It is a draft/plan, not a published post.');
                }}
              >
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Plan title" className="rounded-md border border-alo-border-strong px-3 py-2 text-sm" />
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-md border border-alo-border-strong px-3 py-2 text-sm">
                  {['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'YOUTUBE', 'WHATSAPP', 'EMAIL'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input required type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-md border border-alo-border-strong px-3 py-2 text-sm" />
                <button disabled={busy} type="submit" className="rounded-md bg-[var(--alo-primary,#0057b8)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Save plan</button>
              </form>
            </Panel>
            <Panel title={`Calendar entries (${items.length})`}>
              {items.length === 0 ? <p className="text-sm text-alo-text-muted">No calendar entries yet.</p> : (
                <ul className="divide-y divide-alo-border text-sm">
                  {items.map((item, index) => (
                    <li key={str(item.id, String(index))} className="flex flex-wrap justify-between gap-2 py-2">
                      <span className="font-medium text-alo-text">{str(item.title)}</span>
                      <span className="text-alo-text-muted">{str(item.platform)} · {str(item.status)} · {str(item.scheduledAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </>
        )}

        {!loading && !error && view === 'approvals' && (
          <Panel title={`Pending approvals (${approvals.length})`}>
            {approvals.length === 0 ? <p className="text-sm text-alo-text-muted">No pending approval items.</p> : (
              <ul className="divide-y divide-alo-border text-sm">
                {approvals.map((item) => (
                  <li key={str(item.id)} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-alo-text">{str(item.title)}</p>
                      <p className="text-xs text-alo-text-muted">{str(item.itemType)} · risk {str(item.riskLevel, 'unspecified')} · requested {str(item.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={busy} onClick={() => void act('/api/marketing/approvals?action=approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvalId: String(item.id) }) }, 'Approval recorded by the backend.')} className="rounded-md bg-alo-success-dark px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Approve</button>
                      <button disabled={busy} onClick={() => void act('/api/marketing/approvals?action=reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvalId: String(item.id), rejectionNote: 'Rejected from approval queue' }) }, 'Rejection recorded by the backend.')} className="rounded-md border border-alo-error px-3 py-1.5 text-xs font-semibold text-alo-error disabled:opacity-50">Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-alo-text-muted">Approval writes are role-checked server-side and recorded in the marketing audit log. Approval does not itself publish to a provider.</p>
          </Panel>
        )}
      </div>
    </div>
  );
}
