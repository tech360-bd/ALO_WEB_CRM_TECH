'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Search, Plane, Loader2, Users, Clock, CheckCircle2, DollarSign, Send } from 'lucide-react';

type ReferralStatus = 'Pending' | 'Contacted' | 'Converted' | 'Enrolled';

interface Referral {
  id: string; name: string; phone: string; email: string;
  destination: string; status: ReferralStatus; date: string;
  commission: string; notes: string;
}

const mockReferrals: Referral[] = [
  { id: 'REF-001', name: 'Kamal Hossain', phone: '+880 1715-234567', email: 'kamal@mail.com', destination: 'UK', status: 'Enrolled', date: '2025-01-10', commission: 'BDT 15,000', notes: 'Enrolled at University of Birmingham' },
  { id: 'REF-002', name: 'Nasreen Akter', phone: '+880 1892-345678', email: 'nasreen@mail.com', destination: 'USA', status: 'Converted', date: '2025-01-08', commission: 'BDT 12,000', notes: 'Admitted to Arizona State University' },
  { id: 'REF-003', name: 'Rashidul Islam', phone: '+880 1533-456789', email: 'rashid@mail.com', destination: 'Canada', status: 'Contacted', date: '2025-01-12', commission: '—', notes: 'Interested in University of Toronto' },
  { id: 'REF-004', name: 'Farhana Yesmin', phone: '+880 1674-567890', email: 'farhana@mail.com', destination: 'UK', status: 'Pending', date: '2025-01-15', commission: '—', notes: 'Referred for MSc Data Science' },
  { id: 'REF-005', name: 'Tanvir Ahmed', phone: '+880 1355-678901', email: 'tanvir@mail.com', destination: 'Australia', status: 'Converted', date: '2025-01-05', commission: 'BDT 10,000', notes: 'Going to Monash University' },
  { id: 'REF-006', name: 'Shamima Begum', phone: '+880 1816-789012', email: 'shamima@mail.com', destination: 'UK', status: 'Pending', date: '2025-01-16', commission: '—', notes: 'Wants to study Nursing' },
  { id: 'REF-007', name: 'Imran Khan', phone: '+880 1527-890123', email: 'imran@mail.com', destination: 'USA', status: 'Contacted', date: '2025-01-11', commission: '—', notes: 'Looking for MBA programs' },
  { id: 'REF-008', name: 'Sumaiya Islam', phone: '+880 1738-901234', email: 'sumaiya@mail.com', destination: 'Canada', status: 'Enrolled', date: '2024-12-20', commission: 'BDT 18,000', notes: 'Enrolled at UBC Vancouver' },
  { id: 'REF-009', name: 'Mizanur Rahman', phone: '+880 1849-012345', email: 'mizan@mail.com', destination: 'UK', status: 'Pending', date: '2025-01-17', commission: '—', notes: 'Fresh BSc graduate' },
  { id: 'REF-010', name: 'Jannatul Ferdous', phone: '+880 1560-123456', email: 'jannat@mail.com', destination: 'Australia', status: 'Contacted', date: '2025-01-09', commission: '—', notes: 'Interested in Hospitality Management' },
];

const destinations = ['UK', 'USA', 'Canada', 'Australia', 'New Zealand', 'Germany', 'Ireland'];
const emptyForm = { name: '', phone: '', email: '', destination: '', notes: '' };

function statusBadge(s: ReferralStatus) {
  const m: Record<ReferralStatus, { variant: 'brand' | 'warning' | 'success' | 'secondary'; label: string }> = { Pending: { variant: 'warning', label: 'Pending' }, Contacted: { variant: 'secondary', label: 'Contacted' }, Converted: { variant: 'brand', label: 'Converted' }, Enrolled: { variant: 'success', label: 'Enrolled' } };
  const v = m[s]; return <Badge variant={v.variant} className="text-[11px]">{v.label}</Badge>;
}

function formatDate(d: string) { try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } }

export default function PartnerReferralsPage() {
  const { user } = usePortalStore();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      const res = await fetch('/api/partner/referrals?partnerId=' + (user?.id || ''), { headers });
      const data = await res.json(); if (data.success && Array.isArray(data.referrals) && data.referrals.length > 0) { setReferrals(data.referrals); } else { setReferrals(mockReferrals); } } catch { setReferrals(mockReferrals); } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.phone.trim()) { toast.error('Phone number is required'); return; }
    if (!form.destination) { toast.error('Please select a destination'); return; }
    setSubmitting(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      const res = await fetch('/api/partner/referrals', { method: 'POST', headers, body: JSON.stringify({ partnerId: user?.id, partnerName: user?.name, studentName: form.name, studentPhone: form.phone, studentEmail: form.email, destinationCountry: form.destination, notes: form.notes, status: 'Pending' }) });
      const data = await res.json();
      if (data.success) {
        setForm(emptyForm);
        setDialogOpen(false);
        toast.success('Referral submitted successfully!');
        fetchReferrals(); // Refresh from server
      } else {
        toast.error(data.error || 'Failed to submit referral');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReferrals = referrals.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) { const q = search.toLowerCase(); return r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.email.toLowerCase().includes(q); }
    return true;
  });

  const totalRevenue = referrals.reduce((s, r) => { if (r.commission === '—') return s; return s + (parseInt(r.commission.replace(/[^0-9]/g, ''), 10) || 0); }, 0);
  const statusCounts = { all: referrals.length, Pending: referrals.filter((r) => r.status === 'Pending').length, Contacted: referrals.filter((r) => r.status === 'Contacted').length, Converted: referrals.filter((r) => r.status === 'Converted').length, Enrolled: referrals.filter((r) => r.status === 'Enrolled').length };

  if (loading) { return (<div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full rounded-xl" />))}</div><Skeleton className="h-[400px] w-full rounded-xl" /></div>); }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-alo-text">Referral Tracking</h1><p className="text-sm text-alo-text-muted mt-0.5">Track and manage your referrals and earned commissions</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button variant="brand"><UserPlus className="w-4 h-4" /> Add Referral</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle className="text-alo-text">Add New Referral</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="refName">Full Name <span className="text-red-500">*</span></Label><Input id="refName" placeholder="Referral full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="refPhone">Phone <span className="text-red-500">*</span></Label><Input id="refPhone" placeholder="+880 1XXX-XXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="refEmail">Email</Label><Input id="refEmail" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="refDest">Destination <span className="text-red-500">*</span></Label><Select value={form.destination} onValueChange={(v) => setForm({ ...form, destination: v })}><SelectTrigger id="refDest"><SelectValue placeholder="Select country" /></SelectTrigger><SelectContent>{destinations.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label htmlFor="refNotes">Notes</Label><Textarea id="refNotes" placeholder="Any additional information..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
              <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => { setForm(emptyForm); setDialogOpen(false); }}>Cancel</Button><Button variant="brand" onClick={handleSubmit} disabled={submitting}>{submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Referral</>}</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-alo-brand" /><span className="text-xs text-alo-text-muted">Total Referrals</span></div><p className="text-2xl font-bold text-alo-text">{referrals.length}</p></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-amber-500" /><span className="text-xs text-alo-text-muted">Active</span></div><p className="text-2xl font-bold text-alo-text">{statusCounts.Pending + statusCounts.Contacted}</p></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-xs text-alo-text-muted">Converted</span></div><p className="text-2xl font-bold text-alo-text">{statusCounts.Converted + statusCounts.Enrolled}</p></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-alo-brand" /><span className="text-xs text-alo-text-muted">Revenue Earned</span></div><p className="text-2xl font-bold text-alo-text">BDT {totalRevenue.toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">{([['all', 'All'], ['Pending', 'Pending'], ['Contacted', 'Contacted'], ['Converted', 'Converted'], ['Enrolled', 'Enrolled']] as const).map(([key, label]) => (<button key={key} onClick={() => setStatusFilter(key)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap', statusFilter === key ? 'bg-alo-brand text-white shadow-sm' : 'text-alo-text-secondary hover:bg-secondary')}>{label} ({statusCounts[key as keyof typeof statusCounts]})</button>))}</div>

      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" /><Input placeholder="Search by name, phone, or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-0"><div className="overflow-x-auto max-h-[480px] overflow-y-auto custom-scrollbar"><Table><TableHeader className="sticky top-0 bg-white z-10"><TableRow><TableHead className="w-[80px]">ID</TableHead><TableHead>Name</TableHead><TableHead className="hidden md:table-cell">Phone</TableHead><TableHead className="hidden lg:table-cell">Email</TableHead><TableHead>Destination</TableHead><TableHead>Status</TableHead><TableHead className="hidden sm:table-cell">Commission</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead></TableRow></TableHeader><TableBody>
                {filteredReferrals.length === 0 ? (<TableRow><TableCell colSpan={8} className="h-32 text-center text-alo-text-muted">No referrals found.</TableCell></TableRow>) : (filteredReferrals.map((ref) => (<TableRow key={ref.id} className="hover:bg-alo-brand-light/20 transition-colors"><TableCell className="font-mono text-xs text-alo-text-muted">{ref.id}</TableCell><TableCell><p className="text-sm font-medium text-alo-text">{ref.name}</p><p className="text-xs text-alo-text-muted md:hidden">{ref.phone}</p></TableCell><TableCell className="hidden md:table-cell text-sm text-alo-text-secondary">{ref.phone}</TableCell><TableCell className="hidden lg:table-cell text-sm text-alo-text-secondary">{ref.email}</TableCell><TableCell><span className="inline-flex items-center gap-1 text-xs text-alo-text-secondary"><Plane className="w-3 h-3" /> {ref.destination}</span></TableCell><TableCell>{statusBadge(ref.status)}</TableCell><TableCell className="hidden sm:table-cell text-sm font-medium text-alo-text">{ref.commission}</TableCell><TableCell className="hidden sm:table-cell text-xs text-alo-text-muted">{formatDate(ref.date)}</TableCell></TableRow>)))}
              </TableBody></Table></div></CardContent></Card>
      <p className="text-xs text-alo-text-muted text-center">Showing {filteredReferrals.length} of {referrals.length} referrals</p>
    </div>
  );
}
