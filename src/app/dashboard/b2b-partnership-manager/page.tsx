'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePortalStore } from '@/lib/stores/portal-store';

type Metric = { id: string; label: string; value: number; description: string };
type Overview = { generatedAt: string; metrics: Metric[]; unavailable: string[] };

const workstreams = [
  { title: 'University discovery & officer verification', detail: 'Use official institutional evidence. Unverified contacts require manual review.' },
  { title: 'Research & personalized partnership outreach', detail: 'Human approval is required before sending external proposals or attachments.' },
  { title: 'University partnership pipeline & agreements', detail: 'Signed agreements and approval records determine official partnership status.' },
  { title: 'Agency onboarding & partner management', detail: 'Existing partner portal permissions and tenant isolation remain authoritative.' },
  { title: 'Communication hub & 30-business-minute SLA', detail: 'Reuse authorized providers and existing certified SLA jobs.' },
  { title: 'Student recruitment & document coordination', detail: 'Existing student dashboard and consent requirements remain unchanged.' },
  { title: 'Marketing, AI agents & reporting', detail: 'No unverified performance figures or unapproved autonomous outreach.' },
  { title: 'Finance, RBAC & audit history', detail: 'Sensitive financial and employee records require separate authorization.' },
];

export default function B2BPartnershipManagerPage() {
  const token = usePortalStore(s => s.token);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'forbidden'>('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    setOverview(null);
    fetch('/api/crm/b2b-partnership-manager/overview', {
      credentials: 'same-origin',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
      cache: 'no-store',
    }).then(async response => {
      if (response.status === 401 || response.status === 403) {
        setState('forbidden');
        return;
      }
      if (!response.ok) throw new Error('Overview unavailable');
      const body = await response.json();
      if (!body.success || !body.data) throw new Error('Invalid response');
      if (!controller.signal.aborted) {
        setOverview(body.data);
        setState('ready');
      }
    }).catch(() => {
      if (!controller.signal.aborted) setState('error');
    });
    return () => controller.abort();
  }, [token, retry]);

  return (
    <main className="min-h-screen bg-alo-page px-4 py-8 text-alo-text sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <Link href="/dashboard" className="text-sm text-alo-brand underline">Back to CRM dashboard</Link>
          <p className="text-sm font-semibold uppercase tracking-wide text-alo-brand">ALO Education · Your Dream – Our Commitment</p>
          <h1 className="text-3xl font-bold">B2B Partnership Manager</h1>
          <p className="max-w-3xl text-sm text-alo-text-muted">Read-only management workspace. Figures below describe source records, not verified partnership outcomes. External outreach and administrative actions are not enabled by this view.</p>
        </header>

        {state === 'loading' && <p role="status">Loading authorized CRM records…</p>}
        {state === 'forbidden' && <div role="alert" className="rounded-lg border bg-white p-5">Administrator authorization is required. Employee-specific partnership-manager permissions are not enabled for this workspace.</div>}
        {state === 'error' && <div role="alert" className="rounded-lg border bg-white p-5">CRM data could not be loaded. <button type="button" className="font-semibold text-alo-brand underline" onClick={() => setRetry(v => v + 1)}>Retry</button></div>}

        {state === 'ready' && overview && (
          <>
            <section aria-labelledby="record-heading" className="space-y-3">
              <h2 id="record-heading" className="text-xl font-semibold">Verified database record counts</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {overview.metrics.map(metric => (
                  <article key={metric.id} className="rounded-xl border border-alo-border bg-white p-5">
                    <p className="text-sm text-alo-text-muted">{metric.label}</p>
                    <p className="mt-2 text-3xl font-bold tabular-nums">{metric.value.toLocaleString()}</p>
                    <p className="mt-2 text-xs text-alo-text-muted">{metric.description}</p>
                  </article>
                ))}
              </div>
              <p className="text-xs text-alo-text-muted">Last retrieved: {new Date(overview.generatedAt).toLocaleString()}</p>
            </section>
            <section className="rounded-xl border border-alo-border bg-white p-5" aria-labelledby="unavailable-heading">
              <h2 id="unavailable-heading" className="text-lg font-semibold">Metrics awaiting verified integration</h2>
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm text-alo-text-muted sm:grid-cols-2">
                {overview.unavailable.map(item => <li key={item}>{item}</li>)}
              </ul>
            </section>
          </>
        )}

        <section aria-labelledby="workstreams-heading" className="space-y-3">
          <h2 id="workstreams-heading" className="text-xl font-semibold">Partnership workstreams</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {workstreams.map(item => (
              <article key={item.title} className="rounded-xl border border-alo-border bg-white p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-alo-text-muted">{item.detail}</p>
                <p className="mt-3 text-xs font-medium text-alo-brand">Integration pending verification</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
