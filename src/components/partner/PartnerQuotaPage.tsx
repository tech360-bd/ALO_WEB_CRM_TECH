'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, RefreshCw, Image as ImageIcon, Video, Users, ShieldCheck } from 'lucide-react';

interface QuotaData {
  period: string;
  imageQuota: { limit: number; used: number; remaining: number; percentage: number };
  videoQuota: { limit: number; used: number; remaining: number; percentage: number };
  videoDurationLimit: number;
  autoPublishAllowed: boolean;
  requiresAloApproval: boolean;
}
interface SeatRequest { id: string; requestedExtraSeats: number; status: string; reason: string; createdAt: string }

export default function PartnerQuotaPage() {
  const setView = usePortalStore((state) => state.setView);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [seatUsage, setSeatUsage] = useState<{ limit: number; used: number; available: number } | null>(null);
  const [requests, setRequests] = useState<SeatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [quotaResponse, dashboardResponse, requestResponse] = await Promise.all([
        fetch('/api/partner-admin/quota', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/partner-admin/dashboard', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/partner-admin/seat-requests', { credentials: 'include', cache: 'no-store' }),
      ]);
      const [quotaPayload, dashboardPayload, requestPayload] = await Promise.all([
        quotaResponse.json().catch(() => ({})), dashboardResponse.json().catch(() => ({})), requestResponse.json().catch(() => ({})),
      ]);
      if (!quotaResponse.ok || !quotaPayload.success) throw new Error(quotaPayload.error || `Marketing quota could not be loaded (HTTP ${quotaResponse.status}).`);
      if (!dashboardResponse.ok || !dashboardPayload.success) throw new Error(dashboardPayload.error || `Partner seat usage could not be loaded (HTTP ${dashboardResponse.status}).`);
      if (!requestResponse.ok || !requestPayload.success) throw new Error(requestPayload.error || `Seat request history could not be loaded (HTTP ${requestResponse.status}).`);
      setQuota(quotaPayload);
      setSeatUsage(dashboardPayload.kpis?.userSeats || null);
      setRequests(Array.isArray(requestPayload.requests) ? requestPayload.requests : []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Partner quota data could not be loaded.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <div className="space-y-6 p-1">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-alo-text">Usage &amp; quotas</h1><p className="mt-1 text-sm text-alo-text-muted">Current partner package limits, recorded usage, and approved publishing controls.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button></div>
    {error && <div role="alert" className="flex gap-2 rounded-lg border border-crm-danger-border bg-crm-danger-bg p-3 text-sm text-crm-danger-text"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
    {loading ? <Card><CardContent className="p-10 text-center text-sm text-alo-text-muted">Loading usage records…</CardContent></Card> : quota && <>
      <div className="grid gap-4 md:grid-cols-3">
        <QuotaCard title="Images this month" icon={ImageIcon} used={quota.imageQuota.used} limit={quota.imageQuota.limit} remaining={quota.imageQuota.remaining} />
        <QuotaCard title="Videos this month" icon={Video} used={quota.videoQuota.used} limit={quota.videoQuota.limit} remaining={quota.videoQuota.remaining} />
        <Card className="rounded-xl border-alo-border bg-white"><CardContent className="p-5"><div className="flex items-center gap-2 text-sm text-alo-text-muted"><Users className="h-4 w-4" />User seats</div><p className="mt-2 text-2xl font-semibold text-alo-text">{seatUsage ? `${seatUsage.used} / ${seatUsage.limit}` : 'Not recorded'}</p><p className="mt-1 text-xs text-alo-text-muted">{seatUsage ? `${seatUsage.available} available` : 'Seat limit unavailable'}</p><Button variant="link" className="mt-2 h-auto p-0" onClick={() => setView('partner-admin-users')}>Manage team and seat requests</Button></CardContent></Card>
      </div>
      <Card className="rounded-xl border-alo-border bg-white"><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">Publishing controls</CardTitle><Badge variant="outline">Period {quota.period}</Badge></div></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2"><div className="flex items-center gap-3 rounded-lg border p-3"><ShieldCheck className="h-5 w-5 text-alo-brand" /><div><p className="text-sm font-medium">ALO approval</p><p className="text-xs text-alo-text-muted">{quota.requiresAloApproval ? 'Required before publish' : 'Not required by current quota'}</p></div></div><div className="flex items-center gap-3 rounded-lg border p-3"><ShieldCheck className="h-5 w-5 text-alo-brand" /><div><p className="text-sm font-medium">Auto-publish</p><p className="text-xs text-alo-text-muted">{quota.autoPublishAllowed ? 'Enabled by current quota' : 'Disabled by current quota'}</p></div></div><div className="rounded-lg border p-3 sm:col-span-2"><p className="text-sm font-medium">Maximum video length</p><p className="text-xs text-alo-text-muted">{quota.videoDurationLimit} seconds</p></div></div></CardContent></Card>
      <Card className="rounded-xl border-alo-border bg-white"><CardHeader><CardTitle className="text-base">Extra-seat request history</CardTitle></CardHeader><CardContent>{requests.length === 0 ? <p className="text-sm text-alo-text-muted">No seat requests are recorded.</p> : <div className="space-y-3">{requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><p className="text-sm font-medium">+{request.requestedExtraSeats} seat{request.requestedExtraSeats === 1 ? '' : 's'}</p><p className="text-xs text-alo-text-muted">{request.reason || 'No reason recorded'} · {new Date(request.createdAt).toLocaleDateString()}</p></div><Badge variant="outline">{request.status}</Badge></div>)}</div>}</CardContent></Card>
    </>}
  </div>;
}

function QuotaCard({ title, icon: Icon, used, limit, remaining }: { title: string; icon: typeof ImageIcon; used: number; limit: number; remaining: number }) {
  const percentage = limit > 0 ? Math.min(100, Math.round(used / limit * 100)) : 0;
  return <Card className="rounded-xl border-alo-border bg-white"><CardContent className="space-y-3 p-5"><div className="flex items-center gap-2 text-sm text-alo-text-muted"><Icon className="h-4 w-4 text-alo-brand" />{title}</div><div className="flex items-baseline justify-between gap-2"><p className="text-2xl font-semibold text-alo-text">{used} / {limit}</p><p className="text-xs text-alo-text-muted">{remaining} remaining</p></div><Progress value={percentage} aria-label={`${title}: ${used} of ${limit} used`} /></CardContent></Card>;
}
