'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, RefreshCw, Ticket, Gift } from 'lucide-react';

interface Application {
  id: string;
  stage: string;
  university: string;
  course: string;
  country: string;
  studentProfile: { studentId: string; fullName: string };
}
interface Voucher {
  id: string;
  voucherCode: string;
  studentId: string;
  applicationId: string;
  testType: string;
  usageLimit: number;
  usedCount: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}
interface Entitlement { id: string; studentId: string; applicationId: string; benefitType: string; limitCount: number; usedCount: number; status: string; createdAt: string }

export default function PartnerVouchersPage() {
  const partnerRole = usePortalStore((state) => state.user?.partnerRole || 'PARTNER_VIEWER');
  const canIssue = partnerRole.toUpperCase() === 'PARTNER_SUPER_ADMIN';
  const [applications, setApplications] = useState<Application[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [applicationId, setApplicationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [voucherResponse, applicationResponse] = await Promise.all([
        fetch('/api/partner-admin/vouchers', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/partner/applications?page=1&limit=50', { credentials: 'include', cache: 'no-store' }),
      ]);
      const [voucherPayload, applicationPayload] = await Promise.all([
        voucherResponse.json().catch(() => ({})),
        applicationResponse.json().catch(() => ({})),
      ]);
      if (!voucherResponse.ok || !voucherPayload.success) throw new Error(voucherPayload.error || `Benefits could not be loaded (HTTP ${voucherResponse.status}).`);
      if (!applicationResponse.ok || !applicationPayload.success) throw new Error(applicationPayload.error || `Applications could not be loaded (HTTP ${applicationResponse.status}).`);
      setVouchers(Array.isArray(voucherPayload.vouchers) ? voucherPayload.vouchers : []);
      setEntitlements(Array.isArray(voucherPayload.entitlements) ? voucherPayload.entitlements : []);
      setApplications(Array.isArray(applicationPayload.data) ? applicationPayload.data : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Partner benefit data could not be loaded.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const eligibleApplications = useMemo(() => applications.filter((application) => !['cancelled', 'closed', 'rejected', 'rejected_before_submission', 'withdrawn'].includes(String(application.stage || '').toLowerCase())), [applications]);
  const selectedApplication = eligibleApplications.find((application) => application.id === applicationId);

  const handleIssue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedApplication) return;
    setIssuing(true);
    setMessage(null);
    try {
      const response = await fetch('/api/partner-admin/vouchers', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedApplication.studentProfile.studentId, applicationId: selectedApplication.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || `Benefits could not be issued (HTTP ${response.status}).`);
      setMessage({ kind: 'success', text: payload.message || 'Student benefits were issued and recorded.' });
      setApplicationId('');
      await load();
    } catch (caught) {
      setMessage({ kind: 'error', text: caught instanceof Error ? caught.message : 'Benefits could not be issued.' });
    } finally { setIssuing(false); }
  };

  return <div className="space-y-6 p-1">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-alo-text">Student vouchers &amp; benefits</h1><p className="mt-1 text-sm text-alo-text-muted">View issued vouchers and entitlements, or issue a benefit package to an eligible application in your tenant.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button></div>
    {error && <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
    {message && <div role="status" className={`flex gap-2 rounded-lg border p-3 text-sm ${message.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{message.kind === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}{message.text}</div>}
    {canIssue && <Card className="rounded-xl border-alo-border bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Gift className="h-4 w-4" />Issue benefits for an application</CardTitle></CardHeader><CardContent>{loading ? <p className="text-sm text-alo-text-muted">Loading applications…</p> : eligibleApplications.length === 0 ? <p className="text-sm text-alo-text-muted">No eligible partner applications are available to receive benefits.</p> : <form onSubmit={handleIssue} className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1 space-y-2"><label className="text-sm font-medium" htmlFor="voucher-application">Eligible application</label><Select value={applicationId} onValueChange={setApplicationId}><SelectTrigger id="voucher-application"><SelectValue placeholder="Select an application" /></SelectTrigger><SelectContent>{eligibleApplications.map((application) => <SelectItem key={application.id} value={application.id}>{application.studentProfile?.fullName || application.studentProfile?.studentId || 'Student'} · {application.university || application.course || application.country || 'Application'} · {application.stage}</SelectItem>)}</SelectContent></Select></div><Button type="submit" disabled={!selectedApplication || issuing}>{issuing ? 'Issuing…' : 'Issue vouchers and benefits'}</Button></form>}{!canIssue && <p className="text-sm text-alo-text-muted">Only the Partner Super Admin can issue vouchers and benefit entitlements.</p>}</CardContent></Card>}
    {loading ? <Card><CardContent className="p-10 text-center text-sm text-alo-text-muted">Loading benefits…</CardContent></Card> : <div className="grid gap-6 xl:grid-cols-2">
      <Card className="rounded-xl border-alo-border bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Ticket className="h-4 w-4" />Mock-test vouchers ({vouchers.length})</CardTitle></CardHeader><CardContent>{vouchers.length === 0 ? <p className="text-sm text-alo-text-muted">No vouchers have been issued for this partner.</p> : <div className="space-y-3">{vouchers.map((voucher) => <div key={voucher.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><code className="font-semibold text-alo-text">{voucher.voucherCode}</code><Badge variant="outline">{voucher.status}</Badge></div><p className="mt-1 text-xs text-alo-text-muted">Student {voucher.studentId} · {voucher.testType.replace(/_/g, ' ')}</p><p className="mt-1 text-xs text-alo-text-muted">{voucher.usedCount} / {voucher.usageLimit} uses · {voucher.expiresAt ? `expires ${new Date(voucher.expiresAt).toLocaleDateString()}` : 'no expiry set'}</p></div>)}</div>}</CardContent></Card>
      <Card className="rounded-xl border-alo-border bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Gift className="h-4 w-4" />Benefit entitlements ({entitlements.length})</CardTitle></CardHeader><CardContent>{entitlements.length === 0 ? <p className="text-sm text-alo-text-muted">No benefit entitlements have been issued for this partner.</p> : <div className="space-y-3">{entitlements.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><p className="text-sm font-medium text-alo-text">{item.benefitType.replace(/_/g, ' ')}</p><p className="mt-1 text-xs text-alo-text-muted">Student {item.studentId} · {item.usedCount} / {item.limitCount} used</p></div><Badge variant="outline">{item.status}</Badge></div>)}</div>}</CardContent></Card>
    </div>}
  </div>;
}
