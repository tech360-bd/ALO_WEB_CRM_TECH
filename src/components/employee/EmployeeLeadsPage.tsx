'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Search, Users, UserPlus, TrendingUp, Clock, Phone, Mail,
  MapPin, GraduationCap, Filter, MessageSquare, Plus,
  Globe, BookOpen, StickyNote, RefreshCw,
} from 'lucide-react';

type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
type LeadSource = 'Website' | 'Facebook' | 'WhatsApp' | 'Referral' | 'Walk-in' | 'Phone Call';
type Destination = 'UK' | 'Australia' | 'USA' | 'Canada' | 'New Zealand' | 'Germany';
type StudyLevel = 'Foundation' | 'Bachelor' | 'Master' | 'PhD' | 'Diploma';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  destination: Destination;
  studyLevel: StudyLevel;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
  lastContacted: string;
  notes: string;
}

const mockLeads: Lead[] = [
  { id: '1', name: 'Ahsan Rahman', email: 'ahsan@email.com', phone: '+880 1612-111111', destination: 'UK', studyLevel: 'Master', source: 'Website', status: 'New', createdAt: '2025-01-18', lastContacted: '—', notes: '' },
  { id: '2', name: 'Nadia Islam', email: 'nadia@email.com', phone: '+880 1812-222222', destination: 'Australia', studyLevel: 'Bachelor', source: 'Facebook', status: 'Contacted', createdAt: '2025-01-15', lastContacted: '2025-01-17', notes: 'Interested in nursing programs' },
  { id: '3', name: 'Kamal Hossain', email: 'kamal@email.com', phone: '+880 1712-333333', destination: 'USA', studyLevel: 'PhD', source: 'Referral', status: 'Qualified', createdAt: '2025-01-10', lastContacted: '2025-01-16', notes: 'Strong academic profile, GRE 325' },
  { id: '4', name: 'Tasnia Akter', email: 'tasnia@email.com', phone: '+880 1912-444444', destination: 'Canada', studyLevel: 'Diploma', source: 'WhatsApp', status: 'Converted', createdAt: '2025-01-05', lastContacted: '2025-01-14', notes: 'Enrolled at Seneca College' },
  { id: '5', name: 'Sakib Hasan', email: 'sakib@email.com', phone: '+880 1512-555555', destination: 'UK', studyLevel: 'Master', source: 'Walk-in', status: 'Lost', createdAt: '2024-12-20', lastContacted: '2025-01-02', notes: 'Chose competitor agency' },
  { id: '6', name: 'Mim Akhter', email: 'mim@email.com', phone: '+880 1612-666666', destination: 'Germany', studyLevel: 'Master', source: 'Website', status: 'New', createdAt: '2025-01-19', lastContacted: '—', notes: '' },
  { id: '7', name: 'Rakib Uddin', email: 'rakib@email.com', phone: '+880 1812-777777', destination: 'New Zealand', studyLevel: 'Bachelor', source: 'Phone Call', status: 'Contacted', createdAt: '2025-01-14', lastContacted: '2025-01-16', notes: 'Asking about scholarships' },
  { id: '8', name: 'Farzana Begum', email: 'farzana@email.com', phone: '+880 1712-888888', destination: 'Australia', studyLevel: 'Master', source: 'Facebook', status: 'Qualified', createdAt: '2025-01-08', lastContacted: '2025-01-17', notes: 'IELTS 7.5, wants Feb 2025 intake' },
  { id: '9', name: 'Shuvo Ahmed', email: 'shuvo@email.com', phone: '+880 1912-999999', destination: 'UK', studyLevel: 'Foundation', source: 'Referral', status: 'New', createdAt: '2025-01-20', lastContacted: '—', notes: '' },
  { id: '10', name: 'Lina Tabassum', email: 'lina@email.com', phone: '+880 1512-000001', destination: 'Canada', studyLevel: 'Bachelor', source: 'WhatsApp', status: 'Contacted', createdAt: '2025-01-12', lastContacted: '2025-01-18', notes: 'Interested in co-op programs' },
];

const statusColors: Record<LeadStatus, string> = {
  New: 'bg-blue-100 text-blue-700 border-blue-200',
  Contacted: 'bg-amber-100 text-amber-700 border-amber-200',
  Qualified: 'bg-purple-100 text-purple-700 border-purple-200',
  Converted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Lost: 'bg-red-100 text-red-600 border-red-200',
};

export default function EmployeeLeadsPage() {
  const { setView } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<string>('All');
  const [destFilter, setDestFilter] = useState<string>('All');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus>('New');

  useEffect(() => {
    const t = setTimeout(() => {
      setLeads(mockLeads);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let list = leads;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.phone.includes(q)
      );
    }
    if (statusTab !== 'All') list = list.filter((l) => l.status === statusTab);
    if (destFilter !== 'All') list = list.filter((l) => l.destination === destFilter);
    return list;
  }, [leads, search, statusTab, destFilter]);

  const kpis = useMemo(
    () => ({
      total: leads.length,
      newWeek: leads.filter((l) => l.status === 'New' && new Date(l.createdAt) > new Date(Date.now() - 7 * 86400000)).length,
      convRate: leads.length ? Math.round((leads.filter((l) => l.status === 'Converted').length / leads.length) * 100) : 0,
      avgResp: '2.4h',
    }),
    [leads]
  );

  const handleAddNote = () => {
    if (!selectedLead || !noteText.trim()) return;
    setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: l.notes + (l.notes ? '\n' : '') + noteText } : l)));
    setNoteText('');
    setShowNoteDialog(false);
    toast.success('Note added successfully');
  };

  const handleUpdateStatus = () => {
    if (!selectedLead) return;
    setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, status: newStatus } : l)));
    setShowStatusDialog(false);
    toast.success('Status updated to ' + newStatus);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Leads Pipeline</h1>
          <p className="text-sm text-alo-text-muted mt-1">Track and manage your student leads</p>
        </div>
        <Button variant="brand" onClick={() => toast.info('Add Lead form coming soon')}>
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: kpis.total, icon: Users, color: 'text-alo-brand bg-alo-brand-light' },
          { label: 'New This Week', value: kpis.newWeek, icon: UserPlus, color: 'text-blue-600 bg-blue-100' },
          { label: 'Conversion Rate', value: kpis.convRate + '%', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-100' },
          { label: 'Avg Response', value: kpis.avgResp, icon: Clock, color: 'text-amber-600 bg-amber-100' },
        ].map((kpi) => (
          <Card key={kpi.label} className="rounded-xl border border-alo-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', kpi.color)}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-alo-text">{kpi.value}</p>
                <p className="text-xs text-alo-text-muted">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <Tabs value={statusTab} onValueChange={setStatusTab}>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <TabsList className="bg-alo-page">
                {['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map((s) => (
                  <TabsTrigger key={s} value={s} className="text-xs data-[state=active]:bg-white data-[state=active]:text-alo-brand data-[state=active]:shadow-sm">
                    {s}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
                  <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-full sm:w-56 bg-alo-page border-alo-border text-sm" />
                </div>
                <select value={destFilter} onChange={(e) => setDestFilter(e.target.value)} className="h-9 px-3 text-sm rounded-lg border border-alo-border bg-alo-page text-alo-text focus:outline-none focus:ring-2 focus:ring-alo-brand/20">
                  <option value="All">All Destinations</option>
                  {['UK', 'Australia', 'USA', 'Canada', 'New Zealand', 'Germany'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filtered.map((lead) => (
          <Card key={lead.id} className="rounded-xl border border-alo-border hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-alo-brand-light text-alo-brand flex items-center justify-center text-sm font-semibold shrink-0">
                    {lead.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-alo-text">{lead.name}</span>
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium', statusColors[lead.status])}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-alo-text-secondary flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
                      <span className="flex items-center gap-1 hidden sm:flex"><Phone className="w-3 h-3" />{lead.phone}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.destination}</span>
                      <span className="flex items-center gap-1 hidden md:flex"><BookOpen className="w-3 h-3" />{lead.studyLevel}</span>
                      <span className="flex items-center gap-1 hidden lg:flex"><Globe className="w-3 h-3" />{lead.source}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 lg:gap-3 shrink-0">
                  <span className="text-[11px] text-alo-text-muted hidden md:block">Added {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setNoteText(''); setShowNoteDialog(true); }}>
                    <StickyNote className="w-3.5 h-3.5" /> Note
                  </Button>
                  <Button variant="brand-outline" size="sm" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setNewStatus(lead.status); setShowStatusDialog(true); }}>
                    <RefreshCw className="w-3.5 h-3.5" /> Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-alo-text-muted/40 mx-auto mb-2" />
            <p className="text-sm text-alo-text-secondary">No leads found</p>
            <p className="text-xs text-alo-text-muted mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note — {selectedLead?.name}</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Write your note here..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} className="bg-alo-page border-alo-border" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleAddNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Status — {selectedLead?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {(['New', 'Contacted', 'Qualified', 'Converted', 'Lost'] as LeadStatus[]).map((s) => (
              <button key={s} onClick={() => setNewStatus(s)} className={cn('px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all', newStatus === s ? 'border-alo-brand bg-alo-brand-light text-alo-brand' : 'border-alo-border hover:border-alo-brand/40 text-alo-text-secondary')}>
                {s}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleUpdateStatus}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
