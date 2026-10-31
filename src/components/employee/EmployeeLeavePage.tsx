'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CalendarDays, Plus, Plane, BriefcaseMedical, Coffee, RefreshCw } from 'lucide-react';

type LeaveRecord = { id: string; leaveType: string; startDate: string; endDate: string; totalDays: number; status: string; reason: string; createdAt: string };
type Balance = Record<string, number | string>;
const TYPE_LABELS: Record<string, string> = { casual: 'Casual', annual: 'Annual', medical: 'Medical', maternity: 'Maternity', paternity: 'Paternity', lwp: 'Leave without pay', compensatory: 'Compensatory' };
const BALANCE_TYPES = [
  { key: 'annual', label: 'Annual leave', icon: Plane, color: 'text-[var(--alo-brand)]', bg: 'bg-[var(--alo-brand-pale)]' },
  { key: 'casual', label: 'Casual leave', icon: Coffee, color: 'text-crm-warning-text', bg: 'bg-crm-warning-bg' },
  { key: 'medical', label: 'Medical leave', icon: BriefcaseMedical, color: 'text-crm-danger-text', bg: 'bg-crm-danger-bg' },
  { key: 'maternity', label: 'Maternity leave', icon: BriefcaseMedical, color: 'text-[var(--alo-brand)]', bg: 'bg-[var(--alo-brand-pale)]' },
  { key: 'paternity', label: 'Paternity leave', icon: BriefcaseMedical, color: 'text-[var(--alo-brand-deep)]', bg: 'bg-[var(--alo-brand-light)]' },
  { key: 'lwp', label: 'Leave without pay', icon: CalendarDays, color: 'text-[var(--alo-body)]', bg: 'bg-[var(--alo-page)]' },
  { key: 'compOff', label: 'Compensatory leave', icon: CalendarDays, color: 'text-crm-success-text', bg: 'bg-crm-success-bg' },
];
const statusBadge = (status: string) => {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'muted'> = { approved: 'success', pending: 'warning', rejected: 'danger', cancelled: 'muted' };
  return <Badge variant={variants[status] || 'muted'} className="text-[11px]">{status.replace(/_/g, ' ')}</Badge>;
};
const authHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = usePortalStore.getState().token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export default function EmployeeLeavePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leaveType: '', startDate: '', endDate: '', reason: '' });
  const [balance, setBalance] = useState<Balance | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);

  const loadLeave = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/employee-access/leave', { headers: authHeaders(), cache: 'no-store' });
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.success !== true || !Array.isArray(body.leaves)) throw new Error(body?.error || 'Leave information is unavailable.');
      setLeaveHistory(body.leaves);
      setBalance(body.balance || null);
    } catch (loadError) {
      setLeaveHistory([]);
      setBalance(null);
      setError(loadError instanceof Error ? loadError.message : 'Leave information is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void loadLeave(); }, [loadLeave]);

  const filtered = leaveHistory.filter((leave) => (filterStatus === 'all' || leave.status === filterStatus) && (filterType === 'all' || leave.leaveType === filterType));
  const balanceTotal = balance ? BALANCE_TYPES.reduce((sum, item) => sum + Number(balance[`${item.key}Total`] || 0), 0) : null;
  const balanceRemaining = balance ? BALANCE_TYPES.reduce((sum, item) => sum + Number(balance[`${item.key}Remaining`] ?? (Number(balance[`${item.key}Total`] || 0) - Number(balance[`${item.key}Used`] || 0))), 0) : null;

  const handleSubmit = async () => {
    if (!form.leaveType || !form.startDate || !form.endDate || !form.reason.trim()) { toast.error('Please complete all leave request fields.'); return; }
    setSubmitting(true);
    try {
      const response = await fetch('/api/employee-access/leave', { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) });
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.success !== true || !body?.data) throw new Error(body?.error || 'Leave request could not be submitted.');
      setLeaveHistory((current) => [body.data, ...current]);
      setDialogOpen(false);
      setForm({ leaveType: '', startDate: '', endDate: '', reason: '' });
      toast.success('Leave request submitted for review.');
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Leave request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  if (error) return <div role="alert" className="p-6 text-crm-danger-text">{error}<Button variant="outline" onClick={() => window.location.reload()}>Retry</Button></div>;

  return (
    <div className="min-h-screen space-y-6 bg-alo-page p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-alo-text">Leave Management</h1><p className="text-sm text-alo-text-muted">Your leave balance and submitted requests.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void loadLeave()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button variant="brand" size="sm" onClick={() => setDialogOpen(true)}><Plus className="mr-1 h-4 w-4" />Apply for leave</Button></div></div>
      {error && <Card role="alert" className="border-crm-danger-border"><CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-crm-danger-text"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void loadLeave()}>Retry</Button></CardContent></Card>}
      {!error && <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{BALANCE_TYPES.filter((item) => balance && (Number(balance[`${item.key}Total`] || 0) > 0 || Number(balance[`${item.key}Used`] || 0) > 0)).map((item) => { const Icon = item.icon; const total = Number(balance?.[`${item.key}Total`] || 0); const used = Number(balance?.[`${item.key}Used`] || 0); const remaining = Number(balance?.[`${item.key}Remaining`] ?? total - used); return <Card key={item.key} className="rounded-xl border border-alo-border bg-white"><CardContent className="flex items-center gap-4 p-4"><div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bg}`}><Icon className={`h-6 w-6 ${item.color}`} /></div><div><p className="text-xs text-alo-text-muted">{item.label}</p><p className="text-lg font-bold text-alo-text">{remaining}<span className="text-sm font-normal text-alo-text-muted"> / {total} days</span></p></div></CardContent></Card>; })}
          <Card className="rounded-xl border border-alo-border bg-white"><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-alo-brand-light"><CalendarDays className="h-6 w-6 text-alo-brand" /></div><div><p className="text-xs text-alo-text-muted">Total remaining</p><p className="text-lg font-bold text-alo-text">{balanceRemaining === null ? 'Unavailable' : `${balanceRemaining} / ${balanceTotal} days`}</p></div></CardContent></Card>
        </div>
        {!balance && <p className="text-sm text-alo-text-muted">No leave-balance record is available for your account. HR-managed balances are not inferred.</p>}
        <Card className="rounded-xl border border-alo-border bg-white"><CardHeader className="pb-0"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="text-base font-semibold text-alo-text">Leave history</CardTitle><div className="flex items-center gap-2"><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select><Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All leave types</SelectItem>{Object.entries(TYPE_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div></div></CardHeader><CardContent className="pt-4"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-alo-border"><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Type</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">From</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">To</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Days</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Status</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Reason</th></tr></thead><tbody>{filtered.map((leave) => <tr key={leave.id} className="border-b border-alo-border/50"><td className="px-3 py-2.5 font-medium text-alo-text">{TYPE_LABELS[leave.leaveType] || leave.leaveType}</td><td className="px-3 py-2.5 text-xs text-alo-text-secondary">{leave.startDate}</td><td className="px-3 py-2.5 text-xs text-alo-text-secondary">{leave.endDate}</td><td className="px-3 py-2.5 font-medium text-alo-text">{leave.totalDays}</td><td className="px-3 py-2.5">{statusBadge(leave.status)}</td><td className="max-w-[220px] truncate px-3 py-2.5 text-xs text-alo-text-secondary">{leave.reason}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-alo-text-muted">No leave records found.</td></tr>}</tbody></table></div></CardContent></Card>
      </>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Apply for leave</DialogTitle></DialogHeader><div className="space-y-4 pt-2"><div><Label>Leave type</Label><Select value={form.leaveType} onValueChange={(leaveType) => setForm((current) => ({ ...current, leaveType }))}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{Object.entries(TYPE_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div><Label>From date</Label><Input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></div><div><Label>To date</Label><Input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} /></div></div><div><Label>Reason</Label><Textarea placeholder="Enter reason for leave" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} rows={3} /></div><Button variant="brand" className="w-full" onClick={() => void handleSubmit()} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit request'}</Button></div></DialogContent></Dialog>
    </div>
  );
}
