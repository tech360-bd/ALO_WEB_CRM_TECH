'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  UserPlus, Search, Phone, Mail, Globe, GraduationCap, Plane,
  CalendarDays, MessageSquare, Send, Loader2, Users, Filter,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────── */

type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  destination: string;
  studyLevel: string;
  intake: string;
  message: string;
  status: LeadStatus;
  createdAt: string;
}

/* ── Mock Data ─────────────────────────────────────── */

const mockLeads: Lead[] = [
  { id: 'L-001', name: 'Arif Rahman', phone: '+880 1712-345678', email: 'arif@mail.com', destination: 'UK', studyLevel: 'Masters', intake: 'Sep 2025', message: 'Interested in MSc Data Science', status: 'new', createdAt: '2025-01-17' },
  { id: 'L-002', name: 'Mitu Sarkar', phone: '+880 1898-123456', email: 'mitu@mail.com', destination: 'USA', studyLevel: 'Bachelors', intake: 'Fall 2025', message: 'Looking for CS programs', status: 'contacted', createdAt: '2025-01-16' },
  { id: 'L-003', name: 'Shakib Hasan', phone: '+880 1534-987654', email: 'shakib@mail.com', destination: 'Canada', studyLevel: 'Masters', intake: 'Jan 2026', message: 'MBA programs', status: 'converted', createdAt: '2025-01-15' },
  { id: 'L-004', name: 'Priya Das', phone: '+880 1678-456789', email: 'priya@mail.com', destination: 'UK', studyLevel: 'Masters', intake: 'Sep 2025', message: 'Finance programs', status: 'contacted', createdAt: '2025-01-14' },
  { id: 'L-005', name: 'Nayeem Islam', phone: '+880 1345-789012', email: 'nayeem@mail.com', destination: 'Australia', studyLevel: 'Diploma', intake: 'Feb 2025', message: 'Hospitality management', status: 'new', createdAt: '2025-01-13' },
  { id: 'L-006', name: 'Taslima Akter', phone: '+880 1567-234567', email: 'taslima@mail.com', destination: 'USA', studyLevel: 'Masters', intake: 'Fall 2025', message: 'Interested in MIS', status: 'new', createdAt: '2025-01-12' },
  { id: 'L-007', name: 'Rafiq Ahmed', phone: '+880 1890-345678', email: 'rafiq@mail.com', destination: 'Canada', studyLevel: 'Bachelors', intake: 'Sep 2025', message: 'Engineering programs', status: 'lost', createdAt: '2025-01-10' },
  { id: 'L-008', name: 'Sumaiya Begum', phone: '+880 1711-567890', email: 'sumaiya@mail.com', destination: 'UK', studyLevel: 'PhD', intake: 'Oct 2025', message: 'Research in Biotech', status: 'contacted', createdAt: '2025-01-09' },
  { id: 'L-009', name: 'Jamil Hossain', phone: '+880 1522-678901', email: 'jamil@mail.com', destination: 'Australia', studyLevel: 'Masters', intake: 'Mar 2025', message: 'IT management', status: 'converted', createdAt: '2025-01-08' },
  { id: 'L-010', name: 'Farzana Mimi', phone: '+880 1833-789012', email: 'farzana@mail.com', destination: 'UK', studyLevel: 'Masters', intake: 'Sep 2025', message: 'Public Health', status: 'new', createdAt: '2025-01-07' },
];

const destinations = ['All', 'UK', 'USA', 'Canada', 'Australia', 'New Zealand', 'Germany', 'Ireland'];

const emptyForm = {
  name: '', phone: '', email: '', destination: '', studyLevel: '', intake: '', message: '',
};

/* ── Helpers ───────────────────────────────────────── */

function statusBadge(status: LeadStatus) {
  const map: Record<LeadStatus, { variant: 'brand' | 'warning' | 'success' | 'muted'; label: string }> = {
    new: { variant: 'brand', label: 'New' },
    contacted: { variant: 'warning', label: 'Contacted' },
    converted: { variant: 'success', label: 'Converted' },
    lost: { variant: 'muted', label: 'Lost' },
  };
  const s = map[status] || map.new;
  return <Badge variant={s.variant} className="text-[11px]">{s.label}</Badge>;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/* ── Component ─────────────────────────────────────── */

export default function PartnerLeadsPage() {
  const { user } = usePortalStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [destFilter, setDestFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      const res = await fetch(`/api/partner/leads?partnerId=${user?.id || ''}`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.leads) && data.leads.length > 0) {
        setLeads(data.leads);
      } else {
        setLeads(mockLeads);
      }
    } catch {
      setLeads(mockLeads);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Student name is required'); return; }
    if (!form.phone.trim()) { toast.error('Phone number is required'); return; }
    if (!form.destination) { toast.error('Please select a destination'); return; }

    setSubmitting(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      const res = await fetch('/api/partner/leads', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          partnerId: user?.id,
          partnerName: user?.name,
          studentName: form.name,
          studentEmail: form.email,
          studentPhone: form.phone,
          destinationCountry: form.destination,
          studyLevel: form.studyLevel,
          intake: form.intake,
          notes: form.message,
          status: 'new',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForm(emptyForm);
        setDialogOpen(false);
        toast.success('Lead submitted successfully!');
        fetchLeads(); // Refresh data from server
      } else {
        toast.error(data.error || 'Failed to submit lead');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredLeads = leads.filter((lead) => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (destFilter !== 'All' && lead.destination !== destFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return lead.name.toLowerCase().includes(q) || lead.email.toLowerCase().includes(q) || lead.phone.includes(q);
    }
    return true;
  });

  const statusCounts = {
    all: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    converted: leads.filter((l) => l.status === 'converted').length,
    lost: leads.filter((l) => l.status === 'lost').length,
  };

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Leads Management</h1>
          <p className="text-sm text-alo-text-muted mt-0.5">Submit and track your student leads</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="brand">
              <UserPlus className="w-4 h-4" /> Submit New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-alo-text">Submit New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leadName">Full Name <span className="text-red-500">*</span></Label>
                  <Input id="leadName" placeholder="Student full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadPhone">Phone <span className="text-red-500">*</span></Label>
                  <Input id="leadPhone" placeholder="+880 1XXX-XXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadEmail">Email</Label>
                  <Input id="leadEmail" type="email" placeholder="student@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadDest">Destination <span className="text-red-500">*</span></Label>
                  <Select value={form.destination} onValueChange={(v) => setForm({ ...form, destination: v })}>
                    <SelectTrigger id="leadDest"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {destinations.filter((d) => d !== 'All').map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadLevel">Study Level</Label>
                  <Select value={form.studyLevel} onValueChange={(v) => setForm({ ...form, studyLevel: v })}>
                    <SelectTrigger id="leadLevel"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Foundation">Foundation</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="Bachelors">Bachelors</SelectItem>
                      <SelectItem value="Masters">Masters</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadIntake">Intake</Label>
                  <Select value={form.intake} onValueChange={(v) => setForm({ ...form, intake: v })}>
                    <SelectTrigger id="leadIntake"><SelectValue placeholder="Select intake" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feb 2025">Feb 2025</SelectItem>
                      <SelectItem value="Mar 2025">Mar 2025</SelectItem>
                      <SelectItem value="May 2025">May 2025</SelectItem>
                      <SelectItem value="Jun 2025">Jun 2025</SelectItem>
                      <SelectItem value="Sep 2025">Sep 2025</SelectItem>
                      <SelectItem value="Jan 2026">Jan 2026</SelectItem>
                      <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                      <SelectItem value="Spring 2026">Spring 2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadMsg">Message / Notes</Label>
                <Textarea id="leadMsg" placeholder="Any additional information about the student..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setForm(emptyForm); setDialogOpen(false); }}>Cancel</Button>
                <Button variant="brand" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Lead</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-alo-brand" /><span className="text-xs text-alo-text-muted">Total Leads</span></div>
            <p className="text-2xl font-bold text-alo-text">{statusCounts.all}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><UserPlus className="w-4 h-4 text-blue-500" /><span className="text-xs text-alo-text-muted">New</span></div>
            <p className="text-2xl font-bold text-alo-text">{statusCounts.new}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><MessageSquare className="w-4 h-4 text-amber-500" /><span className="text-xs text-alo-text-muted">Contacted</span></div>
            <p className="text-2xl font-bold text-alo-text">{statusCounts.contacted}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><GraduationCap className="w-4 h-4 text-emerald-500" /><span className="text-xs text-alo-text-muted">Converted</span></div>
            <p className="text-2xl font-bold text-alo-text">{statusCounts.converted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input placeholder="Search by name, email, or phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-alo-text-muted hidden sm:block" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={destFilter} onValueChange={setDestFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {([
          { key: 'all', label: 'All' },
          { key: 'new', label: 'New' },
          { key: 'contacted', label: 'Contacted' },
          { key: 'converted', label: 'Converted' },
          { key: 'lost', label: 'Lost' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              statusFilter === tab.key
                ? 'bg-alo-brand text-white shadow-sm'
                : 'text-alo-text-secondary hover:bg-secondary'
            )}
          >
            {tab.label} ({statusCounts[tab.key as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      {/* Leads Table */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[70px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="hidden sm:table-cell">Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-alo-text-muted">
                      No leads found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-alo-brand-light/20 transition-colors">
                      <TableCell className="font-mono text-xs text-alo-text-muted">{lead.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-alo-text">{lead.name}</p>
                          <p className="text-xs text-alo-text-muted md:hidden">{lead.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-alo-text-secondary">{lead.phone}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-alo-text-secondary">{lead.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs text-alo-text-secondary">
                          <Plane className="w-3 h-3" /> {lead.destination}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-alo-text-secondary">{lead.studyLevel}</TableCell>
                      <TableCell>{statusBadge(lead.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-alo-text-muted">{formatDate(lead.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-alo-text-muted text-center">Showing {filteredLeads.length} of {leads.length} leads</p>
    </div>
  );
}
