'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  DollarSign, Wallet, Clock, TrendingUp, ArrowUpRight,
  Search, Filter, Download, Building2, GraduationCap,
  CheckCircle2, Eye, CreditCard, ArrowDownUp,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────── */

type PaymentStatus = 'paid' | 'pending' | 'expected' | 'processing' | 'failed';

interface CommissionSummary {
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
  totalExpected: number;
  currency: string;
}

interface Payment {
  id: string;
  studentName: string;
  studentId: string;
  university: string;
  program: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  date: string;
  reference: string;
}

const statusConfig: Record<PaymentStatus, { variant: 'success' | 'warning' | 'outline' | 'brand' | 'danger'; label: string }> = {
  paid: { variant: 'success', label: 'Paid' },
  pending: { variant: 'warning', label: 'Pending' },
  expected: { variant: 'outline', label: 'Expected' },
  processing: { variant: 'brand', label: 'Processing' },
  failed: { variant: 'danger', label: 'Failed' },
};

/* ── Component ─────────────────────────────────────── */

export default function PartnerCommissionPage() {
  const { user } = usePortalStore();
  const [summary, setSummary] = useState<CommissionSummary>({ totalEarned: 0, totalPaid: 0, totalPending: 0, totalExpected: 0, currency: "BDT" });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const exportCSV = useCallback(() => {
    const rows = [['Reference', 'Student', 'Student ID', 'University', 'Program', 'Amount', 'Currency', 'Status', 'Date']];
    payments.forEach((p) => {
      rows.push([p.reference, p.studentName, p.studentId, p.university, p.program, String(p.amount), p.currency, p.status, p.date || '']);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-statement-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [payments]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      const res = await fetch(`/api/partner/commission?partnerId=${user?.id || ''}`, { headers });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load commission data');
      const payload = data.data || {};
      const apiSummary = payload.summary || {};
      setSummary({
        totalEarned: Number(apiSummary.leadLevelReceived || 0),
        totalPaid: Number(apiSummary.totalCommissionPaid || 0),
        totalPending: Number(apiSummary.leadLevelPending || 0),
        totalExpected: Number(apiSummary.totalCommissionExpected || 0),
        currency: 'BDT',
      });
      setPayments((payload.leads || []).map((lead: any) => ({
        id: lead.id,
        studentName: lead.studentName || lead.studentId || 'Unassigned student',
        studentId: lead.studentId || '',
        university: lead.destinationCountry || 'Not specified',
        program: lead.studyLevel || 'Not specified',
        amount: Number(lead.commissionReceived || lead.commissionExpected || 0),
        currency: 'BDT',
        status: lead.commissionStatus === 'paid' ? 'paid' : lead.commissionStatus === 'failed' ? 'failed' : lead.commissionStatus === 'processing' ? 'processing' : lead.commissionExpected ? 'pending' : 'expected',
        date: lead.updatedAt || lead.createdAt || '',
        reference: lead.partnerRef || lead.id,
      })));
    } catch (error) {
      setPayments([]);
      setSummary({ totalEarned: 0, totalPaid: 0, totalPending: 0, totalExpected: 0, currency: 'BDT' });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.studentName.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q) || p.university.toLowerCase().includes(q);
    }
    return true;
  });

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Commission</h1>
          <p className="text-sm text-alo-text-muted mt-0.5">Track earnings and payment history</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4" /> Export Statement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-alo-brand-light/50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-alo-brand" />
              </div>
              <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />Total
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">{formatCurrency(summary.totalEarned)}</p>
            <p className="text-xs text-alo-text-muted mt-1">Total Earned</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <Badge variant="success" className="text-[10px]">Received</Badge>
            </div>
            <p className="text-2xl font-bold text-alo-text">{formatCurrency(summary.totalPaid)}</p>
            <p className="text-xs text-alo-text-muted mt-1">Paid Out</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <Badge variant="warning" className="text-[10px]">Awaiting</Badge>
            </div>
            <p className="text-2xl font-bold text-alo-text">{formatCurrency(summary.totalPending)}</p>
            <p className="text-xs text-alo-text-muted mt-1">Pending Payout</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-sky-600" />
              </div>
              <Badge variant="outline" className="text-[10px]">Projected</Badge>
            </div>
            <p className="text-2xl font-bold text-alo-text">{formatCurrency(summary.totalExpected)}</p>
            <p className="text-xs text-alo-text-muted mt-1">Expected</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown Visual */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-alo-text">Commission Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Visual bar */}
            <div className="flex-1">
              <div className="flex h-8 rounded-lg overflow-hidden bg-muted">
                {summary.totalEarned > 0 && (
                  <>
                    <div className="bg-emerald-500 flex items-center justify-center text-white text-[11px] font-semibold transition-all"
                      style={{ width: `${(summary.totalPaid / summary.totalEarned) * 100}%` }}>
                      {Math.round((summary.totalPaid / summary.totalEarned) * 100)}% Paid
                    </div>
                    <div className="bg-amber-400 flex items-center justify-center text-white text-[11px] font-semibold transition-all"
                      style={{ width: `${(summary.totalPending / summary.totalEarned) * 100}%` }}>
                      {summary.totalPending > 0 ? `${Math.round((summary.totalPending / summary.totalEarned) * 100)}%` : ''}
                    </div>
                    <div className="bg-sky-400 flex items-center justify-center text-white text-[11px] font-semibold transition-all"
                      style={{ width: `${(summary.totalExpected / summary.totalEarned) * 100}%` }}>
                      {summary.totalExpected > 0 ? `${Math.round((summary.totalExpected / summary.totalEarned) * 100)}%` : ''}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-alo-text-secondary">Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="text-xs text-alo-text-secondary">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-400" />
                  <span className="text-xs text-alo-text-secondary">Expected</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input placeholder="Search by student, reference, or university..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-alo-text-muted hidden sm:block" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expected">Expected</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-alo-text">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden md:table-cell">University</TableHead>
                  <TableHead className="hidden lg:table-cell">Program</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-alo-text-muted">
                      No payment records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((payment) => {
                    const cfg = statusConfig[payment.status];
                    return (
                      <TableRow key={payment.id} className="hover:bg-alo-brand-light/20 transition-colors">
                        <TableCell className="font-mono text-xs text-alo-text-muted">{payment.reference}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-alo-text">{payment.studentName}</p>
                            <p className="text-[11px] text-alo-text-muted">{payment.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-alo-text-secondary">{payment.university}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-alo-text-secondary">{payment.program}</TableCell>
                        <TableCell className="font-semibold text-alo-text">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="text-[11px]">{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-alo-text-muted">
                          {payment.date ? formatDate(payment.date) : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon-sm" title="View Details">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-alo-text-muted text-center">
        Showing {filtered.length} of {payments.length} payments
      </p>
    </div>
  );
}

/* ── Helper ────────────────────────────────────────── */

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
