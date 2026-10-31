'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Wallet, Clock, TrendingUp, Search, Filter, Download, CheckCircle2, RefreshCw } from 'lucide-react';

type PaymentStatus = 'paid' | 'pending' | 'expected' | 'processing' | 'failed';
interface CommissionSummary {
  totalExpected: number;
  totalPaid: number;
  totalPending: number;
  currency: string;
}
interface Payment {
  id: string;
  studentName: string;
  studentId: string;
  destination: string;
  studyLevel: string;
  expected: number;
  received: number;
  status: PaymentStatus;
  date: string;
  reference: string;
}

const PAGE_SIZE = 20;
const statusConfig: Record<PaymentStatus, { variant: 'success' | 'warning' | 'outline' | 'brand' | 'danger'; label: string }> = {
  paid: { variant: 'success', label: 'Paid' },
  pending: { variant: 'warning', label: 'Pending' },
  expected: { variant: 'outline', label: 'Expected' },
  processing: { variant: 'brand', label: 'Partial' },
  failed: { variant: 'danger', label: 'Failed' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function mapPaymentStatus(lead: any): PaymentStatus {
  const raw = String(lead.commissionStatus || '').toLowerCase();
  if (raw === 'paid') return 'paid';
  if (raw === 'failed') return 'failed';
  if (raw === 'partial' || raw === 'processing') return 'processing';
  if (raw === 'pending') return 'pending';
  return Number(lead.commissionExpected || 0) > 0 ? 'pending' : 'expected';
}

export default function PartnerCommissionPage() {
  const [summary, setSummary] = useState<CommissionSummary>({ totalExpected: 0, totalPaid: 0, totalPending: 0, currency: 'BDT' });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/partner/commission?page=${page}&limit=${PAGE_SIZE}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || `Failed to load commission data (HTTP ${res.status})`);
      const payload = data.data || {};
      const apiSummary = payload.summary || {};
      setSummary({
        totalExpected: Number(apiSummary.totalCommissionExpected || 0),
        totalPaid: Number(apiSummary.totalCommissionPaid || 0),
        totalPending: Number(apiSummary.totalCommissionPending || 0),
        currency: 'BDT',
      });
      const records = Array.isArray(payload.leads) ? payload.leads : [];
      setPayments(records.map((lead: any): Payment => ({
        id: String(lead.id || ''),
        studentName: String(lead.studentName || 'Student name unavailable'),
        studentId: String(lead.studentId || ''),
        destination: String(lead.destinationCountry || 'Not recorded'),
        studyLevel: String(lead.studyLevel || 'Not recorded'),
        expected: Number(lead.commissionExpected || 0),
        received: Number(lead.commissionReceived || 0),
        status: mapPaymentStatus(lead),
        date: String(lead.updatedAt || lead.createdAt || ''),
        reference: String(lead.partnerRef || lead.id || ''),
      })));
      const pagination = payload.pagination || {};
      setTotalRecords(Number(pagination.total || 0));
      setTotalPages(Math.max(1, Number(pagination.totalPages || 1)));
    } catch (caught) {
      setPayments([]);
      setTotalRecords(0);
      setTotalPages(1);
      setSummary({ totalExpected: 0, totalPaid: 0, totalPending: 0, currency: 'BDT' });
      setError(caught instanceof Error ? caught.message : 'Failed to load commission data.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const filtered = payments.filter((payment) => {
    if (statusFilter !== 'all' && payment.status !== statusFilter) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    return payment.studentName.toLowerCase().includes(query)
      || payment.reference.toLowerCase().includes(query)
      || payment.destination.toLowerCase().includes(query)
      || payment.studyLevel.toLowerCase().includes(query);
  });

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString('en-BD')}`;
  const paidPercent = summary.totalExpected > 0 ? Math.min(100, (summary.totalPaid / summary.totalExpected) * 100) : 0;
  const pendingPercent = summary.totalExpected > 0
    ? Math.min(100 - paidPercent, (summary.totalPending / summary.totalExpected) * 100)
    : 0;

  const exportCSV = () => {
    const rows = [
      ['Reference', 'Student', 'Student ID', 'Destination', 'Study level', 'Expected (BDT)', 'Received (BDT)', 'Status', 'Date'],
      ...filtered.map((payment) => [payment.reference, payment.studentName, payment.studentId, payment.destination, payment.studyLevel, String(payment.expected), String(payment.received), payment.status, payment.date]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `commission-statement-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full rounded-xl" />)}</div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Commission</h1>
          <p className="text-sm text-alo-text-muted mt-0.5">Partner-scoped commission records and payment history</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="w-4 h-4" /> Export This Page
        </Button>
      </div>

      {error && <Card className="border-crm-warning-border bg-crm-warning-bg"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-crm-warning-text">{error}</p><Button variant="outline" size="sm" onClick={() => void fetchData()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button></CardContent></Card>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-5"><div className="flex items-center justify-between mb-3"><div className="w-10 h-10 rounded-xl bg-alo-brand-light/50 flex items-center justify-center"><Wallet className="w-5 h-5 text-alo-brand" /></div><span className="text-[11px] text-alo-text-muted">All records</span></div><p className="text-2xl font-bold text-alo-text">{formatCurrency(summary.totalExpected)}</p><p className="text-xs text-alo-text-muted mt-1">Commission Expected</p></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-5"><div className="flex items-center justify-between mb-3"><div className="w-10 h-10 rounded-xl bg-crm-success-bg flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-crm-success-text" /></div><Badge variant="success" className="text-[11px]">Received</Badge></div><p className="text-2xl font-bold text-alo-text">{formatCurrency(summary.totalPaid)}</p><p className="text-xs text-alo-text-muted mt-1">Paid Out</p></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-5"><div className="flex items-center justify-between mb-3"><div className="w-10 h-10 rounded-xl bg-crm-warning-bg flex items-center justify-center"><Clock className="w-5 h-5 text-crm-warning-text" /></div><Badge variant="warning" className="text-[11px]">Outstanding</Badge></div><p className="text-2xl font-bold text-alo-text">{formatCurrency(summary.totalPending)}</p><p className="text-xs text-alo-text-muted mt-1">Pending Payout</p></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-5"><div className="flex items-center justify-between mb-3"><div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-sky-600" /></div><span className="text-[11px] text-alo-text-muted">All pages</span></div><p className="text-2xl font-bold text-alo-text">{totalRecords}</p><p className="text-xs text-alo-text-muted mt-1">Commission Records</p></CardContent></Card>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader><CardTitle className="text-base font-semibold text-alo-text">Paid and Outstanding Breakdown</CardTitle></CardHeader>
        <CardContent>
          {summary.totalExpected <= 0 ? <p className="text-sm text-alo-text-muted">No commission expectations are recorded yet.</p> : <>
            <div className="flex h-8 rounded-lg overflow-hidden bg-[var(--alo-surface-muted)]" role="progressbar" aria-valuenow={Math.round(paidPercent)} aria-valuemin={0} aria-valuemax={100} aria-label="Paid commission percentage">
              {paidPercent > 0 && <div className="bg-[var(--alo-success)] flex items-center justify-center text-white text-[11px] font-semibold" style={{ width: `${paidPercent}%` }}>{Math.round(paidPercent)}% Paid</div>}
              {pendingPercent > 0 && <div className="bg-[var(--alo-warning)] flex items-center justify-center text-white text-[11px] font-semibold" style={{ width: `${pendingPercent}%` }}>{Math.round(pendingPercent)}% Pending</div>}
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-3 text-xs text-alo-text-secondary"><span className="inline-flex items-center gap-2"><i className="w-3 h-3 rounded-full bg-[var(--alo-success)]" />Paid {formatCurrency(summary.totalPaid)}</span><span className="inline-flex items-center gap-2"><i className="w-3 h-3 rounded-full bg-[var(--alo-warning)]" />Pending {formatCurrency(summary.totalPending)}</span><span className="inline-flex items-center gap-2"><i className="w-3 h-3 rounded-full bg-[var(--alo-page)]" />Expected {formatCurrency(summary.totalExpected)}</span></div>
          </>}
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" /><Input placeholder="Search current page by student, reference, destination, or study level..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="flex items-center gap-2"><Filter className="w-4 h-4 text-alo-text-muted hidden sm:block" /><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="expected">Expected</SelectItem><SelectItem value="processing">Partial</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select></div></div></CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader><CardTitle className="text-base font-semibold text-alo-text">Commission Records</CardTitle></CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto max-h-[480px] overflow-y-auto custom-scrollbar"><table className="w-full text-sm"><thead className="sticky top-0 bg-white z-10"><tr className="border-b text-left text-xs text-alo-text-muted"><th className="p-3">Reference</th><th className="p-3">Student</th><th className="p-3">Destination</th><th className="p-3">Study level</th><th className="p-3">Expected</th><th className="p-3">Received</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead><tbody>
          {filtered.length === 0 ? <tr><td colSpan={8} className="h-32 text-center text-alo-text-muted">{error ? 'Commission data could not be loaded.' : 'No commission records match this page and filter.'}</td></tr> : filtered.map((payment) => { const config = statusConfig[payment.status]; return <tr key={payment.id} className="border-b last:border-0 hover:bg-alo-brand-light/20"><td className="p-3 font-mono text-xs text-alo-text-muted">{payment.reference}</td><td className="p-3"><p className="font-medium text-alo-text">{payment.studentName}</p>{payment.studentId && <p className="text-[11px] text-alo-text-muted">{payment.studentId}</p>}</td><td className="p-3 text-sm text-alo-text-secondary">{payment.destination}</td><td className="p-3 text-xs text-alo-text-secondary">{payment.studyLevel}</td><td className="p-3 font-medium text-alo-text">{formatCurrency(payment.expected)}</td><td className="p-3 font-medium text-alo-text">{formatCurrency(payment.received)}</td><td className="p-3"><Badge variant={config.variant} className="text-[11px]">{config.label}</Badge></td><td className="p-3 text-xs text-alo-text-muted">{formatDate(payment.date)}</td></tr>; })}
          </tbody></table></div></CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-alo-text-muted">
        <p>Showing {filtered.length} filtered records on page {page} of {totalPages} · {totalRecords} records total. CSV export covers the filtered current page.</p>
        <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</Button><span>{page} / {totalPages}</span><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</Button></div>
      </div>
    </div>
  );
}
