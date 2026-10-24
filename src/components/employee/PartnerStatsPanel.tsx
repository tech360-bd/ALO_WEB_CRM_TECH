'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
const metrics = [ ['totalPartners', 'Assigned partner companies'], ['activePartners', 'Active partners'], ['pendingPartners', 'Pending partners'], ['partnerLeads', 'Partner leads'], ['pendingSeatRequests', 'Pending seat requests'], ['pendingQuotaRequests', 'Pending quota requests'] ] as const;
type Stats = Record<typeof metrics[number][0], number>;
export default function PartnerStatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError(''); setStats(null);
    try {
      const response = await fetch('/api/employee/partner-stats', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Partner statistics unavailable.');
      if (!data.success || !data.stats || metrics.some(([key]) => !Number.isSafeInteger(data.stats[key]) || data.stats[key] < 0)) throw new Error('Partner statistics could not be verified.');
      setStats(data.stats);
    } catch (e) { setError(e instanceof Error ? e.message : 'Partner statistics unavailable.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <section aria-label="Authorized partner statistics" aria-busy={busy} className="sm:col-span-2 lg:col-span-4 space-y-3 rounded-xl border bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Partner overview</h2><Button variant="outline" disabled={busy} onClick={() => void load()}>Refresh partner statistics</Button></div>
    {busy && <p role="status">Loading partner statistics…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {stats && <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([key, label]) => <div key={key} className="rounded-xl border bg-[var(--alo-page)] p-3"><p className="text-xs text-[var(--alo-body)]">{label}</p><p className="mt-1 text-2xl font-bold text-[var(--alo-text)]">{stats[key].toLocaleString()}</p></div>)}</div>{stats.totalPartners === 0 && <p className="text-sm">No assigned partner companies yet.</p>}<p className="text-xs text-[var(--alo-text-muted)]">Only companies within your authorized scope are included. Employee seats are counted within their company.</p></>}
  </section>;
}
