'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  CalendarDays, Plus, Clock, CheckCircle2, XCircle, AlertTriangle,
  Plane, BriefcaseMedical, Coffee, FileText, Filter, Loader2,
} from 'lucide-react';

type LeaveBalance = { type: string; total: number; used: number; icon: typeof Plane; color: string; bg: string };
type LeaveRow = { id: string; type: string; from: string; to: string; days: number; status: string; reason: string };

function statusBadge(status: string) {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'muted'; label: string }> = {
    approved: { variant: 'success', label: 'Approved' },
    pending: { variant: 'warning', label: 'Pending' },
    rejected: { variant: 'danger', label: 'Rejected' },
    cancelled: { variant: 'muted', label: 'Cancelled' },
  };
  const s = map[status] || map.pending;
  return <Badge variant={s.variant} className="text-[11px]">{s.label}</Badge>;
}

export default function EmployeeLeavePage() {
  const { user } = usePortalStore();
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: '', from: '', to: '', reason: '' });
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRow[]>([]);

  useEffect(() => {
    const token = usePortalStore.getState().token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/employee/leave', { headers })
      .then(async r => { const data = await r.json(); if (!r.ok || !data.success) throw new Error(data.error || 'Leave could not be loaded.'); return data; })
      .then(data => {
        if (data?.balances) {
          setLeaveBalances(data.balances.map((b: any) => ({
            type: b.type,
            total: b.total,
            used: b.used,
            icon: b.type.includes('Annual') ? Plane : b.type.includes('Sick') ? BriefcaseMedical : Coffee,
            color: b.type.includes('Annual') ? 'text-[var(--alo-brand)]' : b.type.includes('Sick') ? 'text-red-600' : 'text-amber-600',
            bg: b.type.includes('Annual') ? 'bg-[var(--alo-brand-pale)]' : b.type.includes('Sick') ? 'bg-red-50' : 'bg-amber-50',
          })));
        }
        if (Array.isArray(data?.data)) {
          setLeaveHistory(data.data.map((r: any) => ({
            id: r.id || r._id,
            type: r.leaveType || r.title?.match(/^\[([^\]]+)\]/)?.[1] || 'Leave',
            from: r.from || r.startDate || r.dueDate || '',
            to: r.to || r.endDate || '',
            days: r.days || r.duration || 0,
            status: r.status || 'pending',
            reason: r.reason || r.description || r.title || '',
          })));
        }
      })
      .catch(error => setLoadError(error instanceof Error ? error.message : 'Leave could not be loaded.'))
      .finally(() => { setLoading(false); });
  }, []);

  const filtered = leaveHistory.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterType !== 'all' && l.type !== filterType) return false;
    return true;
  });

  const totalUsed = leaveBalances.reduce((s, b) => s + b.used, 0);
  const totalAvailable = leaveBalances.reduce((s, b) => s + b.total, 0);

  const handleSubmit = async () => {
    if (!form.type || !form.from || !form.to || !form.reason) { toast.error('Please fill all fields'); return; }
    setSubmitting(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/employee/leave', { method: 'POST', headers, body: JSON.stringify(form) });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.balances) {
          setLeaveBalances(data.balances.map((b: any) => ({
            type: b.type,
            total: b.total,
            used: b.used,
            icon: b.type.includes('Annual') ? Plane : b.type.includes('Sick') ? BriefcaseMedical : Coffee,
            color: b.type.includes('Annual') ? 'text-[var(--alo-brand)]' : b.type.includes('Sick') ? 'text-red-600' : 'text-amber-600',
            bg: b.type.includes('Annual') ? 'bg-[var(--alo-brand-pale)]' : b.type.includes('Sick') ? 'bg-red-50' : 'bg-amber-50',
          })));
        }
        if (data?.record) {
          setLeaveHistory(prev => [data.record, ...prev]);
        }
        toast.success('Leave application submitted');
      } else {
        throw new Error('Leave request was not saved.');
      }
      setDialogOpen(false);
      setForm({ type: '', from: '', to: '', reason: '' });
    } catch {
      toast.error('Leave request was not saved. Please retry.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  if (loadError) return <div role="alert" className="p-6 text-red-700">{loadError}<Button variant="outline" onClick={() => window.location.reload()}>Retry</Button></div>;

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {!leaveBalances.length && <p className="text-sm">No leave balances configured.</p>}
      {!leaveHistory.length && <p className="text-sm">No leave requests yet.</p>}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Leave Management</h1>
          <p className="text-sm text-alo-text-muted">Track and manage your leave balances</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Plus className="w-4 h-4" /> Apply for Leave</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Leave Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                </SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>From Date</Label><Input type="date" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} /></div>
                <div><Label>To Date</Label><Input type="date" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} /></div>
              </div>
              <div><Label>Reason</Label><Textarea placeholder="Enter reason for leave" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} /></div>
              <Button variant="brand" className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : 'Submit Application'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {leaveBalances.map(b => (
          <Card key={b.type} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${b.bg} flex items-center justify-center`}>
                <b.icon className={`w-6 h-6 ${b.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-alo-text-muted">{b.type}</p>
                <p className="text-lg font-bold text-alo-text">{b.total - b.used} <span className="text-sm font-normal text-alo-text-muted">/ {b.total} days</span></p>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-alo-brand-light flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-alo-brand" />
            </div>
            <div>
              <p className="text-xs text-alo-text-muted">Total Remaining</p>
              <p className="text-lg font-bold text-alo-text">{totalAvailable - totalUsed} <span className="text-sm font-normal text-alo-text-muted">/ {totalAvailable} days</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold text-alo-text">Leave History</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-alo-text-muted" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Annual Leave">Annual</SelectItem>
                  <SelectItem value="Sick Leave">Sick</SelectItem>
                  <SelectItem value="Casual Leave">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-alo-border">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Type</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">From</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">To</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Days</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Status</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Reason</th>
              </tr></thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b border-alo-border/50 hover:bg-alo-page/50">
                    <td className="py-2.5 px-3 text-alo-text font-medium">{l.type}</td>
                    <td className="py-2.5 px-3 text-alo-text-secondary text-xs">{l.from}</td>
                    <td className="py-2.5 px-3 text-alo-text-secondary text-xs">{l.to}</td>
                    <td className="py-2.5 px-3 text-alo-text font-medium">{l.days}</td>
                    <td className="py-2.5 px-3">{statusBadge(l.status)}</td>
                    <td className="py-2.5 px-3 text-alo-text-secondary text-xs max-w-[200px] truncate">{l.reason}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-alo-text-muted text-sm">No leave records found</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
