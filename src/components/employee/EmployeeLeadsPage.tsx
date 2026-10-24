'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Users, UserPlus, TrendingUp, Phone, Mail, MapPin, BookOpen, Plus, Globe, RefreshCw } from 'lucide-react';

type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost' | 'Other';
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  destination: string;
  studyLevel: string;
  source: string;
  status: LeadStatus;
  createdAt: string;
}
const STATUS_STYLE: Record<LeadStatus, string> = {
  New: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
  Contacted: 'bg-amber-100 text-amber-700 border-amber-200',
  Qualified: 'bg-purple-100 text-purple-700 border-purple-200',
  Converted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Lost: 'bg-red-100 text-red-600 border-red-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
};
const statusLabel = (value: unknown): LeadStatus => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase().replace(/[_-]+/g, ' ') : '';
  if (normalized === 'new') return 'New';
  if (normalized === 'contacted') return 'Contacted';
  if (normalized === 'qualified') return 'Qualified';
  if (normalized === 'converted') return 'Converted';
  if (normalized === 'lost') return 'Lost';
  return 'Other';
};
const initialForm = { fullName: '', phone: '', email: '', destination: '', level: '', intake: '' };

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = usePortalStore.getState().token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
function toLead(value: Record<string, unknown>): Lead {
  return {
    id: String(value.id || ''), name: String(value.fullName || value.name || ''), email: String(value.email || ''),
    phone: String(value.phone || ''), destination: String(value.destination || ''), studyLevel: String(value.level || ''),
    source: String(value.source || ''), status: statusLabel(value.status), createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
  };
}

export default function EmployeeLeadsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('All');
  const [destinationFilter, setDestinationFilter] = useState('All');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/employee/leads?scope=created&limit=100', { headers: authHeaders(), cache: 'no-store' });
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.success !== true || !Array.isArray(body.leads)) throw new Error(body?.error || 'Employee leads are unavailable.');
      setLeads(body.leads.map((lead: Record<string, unknown>) => toLead(lead)));
    } catch (loadError) {
      setLeads([]);
      setError(loadError instanceof Error ? loadError.message : 'Employee leads are unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadLeads(); }, [loadLeads]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesQuery = !query || [lead.name, lead.email, lead.phone, lead.destination, lead.studyLevel].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusTab === 'All' || lead.status === statusTab;
      const matchesDestination = destinationFilter === 'All' || lead.destination === destinationFilter;
      return matchesQuery && matchesStatus && matchesDestination;
    });
  }, [leads, search, statusTab, destinationFilter]);

  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = leads.filter((lead) => lead.createdAt && new Date(lead.createdAt).getTime() >= weekStart).length;
  const convertedCount = leads.filter((lead) => lead.status === 'Converted').length;
  const conversionRate = leads.length ? Math.round((convertedCount / leads.length) * 100) : 0;

  const createLead = async () => {
    if (!form.fullName.trim() || !form.phone.trim()) { toast.error('Name and phone are required.'); return; }
    setSaving(true);
    try {
      const response = await fetch('/api/employee/leads', { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) });
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.success !== true || !body.lead) throw new Error(body?.error || 'Lead could not be created.');
      setLeads((current) => [toLead(body.lead), ...current]);
      setForm(initialForm);
      setShowCreate(false);
      toast.success('Lead created.');
    } catch (createError) {
      toast.error(createError instanceof Error ? createError.message : 'Lead could not be created.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-6 p-4 lg:p-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}</div><Skeleton className="h-10 w-full" />{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-alo-text">My Created Leads</h1><p className="mt-1 text-sm text-alo-text-muted">Leads created by your authenticated account. Assignment/team access is not shown until its identity mapping is verified.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => void loadLeads()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button variant="brand" onClick={() => setShowCreate(true)}><Plus className="mr-1 h-4 w-4" />Add lead</Button></div>
      </div>
      {error && <Card role="alert" className="border-red-200"><CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-red-700"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void loadLeads()}>Retry</Button></CardContent></Card>}
      {!error && <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Kpi icon={<Users className="h-5 w-5 text-[var(--alo-brand)]" />} label="Created leads" value={leads.length} />
          <Kpi icon={<UserPlus className="h-5 w-5 text-amber-600" />} label="Created in last 7 days" value={newThisWeek} />
          <Kpi icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} label="Converted share" value={`${conversionRate}%`} />
        </div>
        <Card className="rounded-xl border border-alo-border"><CardContent className="p-4"><Tabs value={statusTab} onValueChange={setStatusTab}><div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center"><TabsList className="max-w-full overflow-x-auto bg-alo-page">{['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map((status) => <TabsTrigger key={status} value={status} className="text-xs">{status}</TabsTrigger>)}</TabsList><div className="flex w-full gap-2 lg:w-auto"><div className="relative flex-1 lg:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-alo-text-muted" /><Input aria-label="Search created leads" placeholder="Search created leads" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div><select aria-label="Filter destination" value={destinationFilter} onChange={(event) => setDestinationFilter(event.target.value)} className="h-9 rounded-lg border border-alo-border bg-white px-3 text-sm"><option value="All">All destinations</option>{[...new Set(leads.map((lead) => lead.destination).filter(Boolean))].sort().map((destination) => <option key={destination} value={destination}>{destination}</option>)}</select></div></div></Tabs></CardContent></Card>
        <div className="space-y-3">{filtered.map((lead) => <Card key={lead.id} className="rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-alo-brand-light text-sm font-semibold text-alo-brand">{lead.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-alo-text">{lead.name}</span><Badge variant="outline" className={cn('border text-[11px]', STATUS_STYLE[lead.status])}>{lead.status}</Badge></div><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-alo-text-secondary">{lead.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}{lead.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}{lead.destination && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.destination}</span>}{lead.studyLevel && <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" />{lead.studyLevel}</span>}{lead.source && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{lead.source}</span>}</div></div></div><span className="text-xs text-alo-text-muted">{lead.createdAt ? `Created ${new Date(lead.createdAt).toLocaleDateString()}` : 'Creation date unavailable'}</span></div></CardContent></Card>)}
          {filtered.length === 0 && <Card><CardContent className="py-12 text-center"><Users className="mx-auto mb-2 h-10 w-10 text-alo-text-muted/40" /><p className="text-sm text-alo-text-secondary">No created leads match the selected filters.</p></CardContent></Card>}
        </div>
      </>}
      <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Create a lead</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><Field label="Full name *" value={form.fullName} onChange={(fullName) => setForm((current) => ({ ...current, fullName }))} /><Field label="Phone *" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} /><Field label="Email" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} /><Field label="Destination" value={form.destination} onChange={(destination) => setForm((current) => ({ ...current, destination }))} /><Field label="Study level" value={form.level} onChange={(level) => setForm((current) => ({ ...current, level }))} /><Field label="Intake" value={form.intake} onChange={(intake) => setForm((current) => ({ ...current, intake }))} /></div><DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</Button><Button variant="brand" onClick={() => void createLead()} disabled={saving}>{saving ? 'Saving…' : 'Create lead'}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) { return <Card className="rounded-xl border border-alo-border"><CardContent className="flex items-center gap-3 p-4"><div>{icon}</div><div><p className="text-2xl font-bold text-alo-text">{value}</p><p className="text-xs text-alo-text-muted">{label}</p></div></CardContent></Card>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div className="space-y-1"><Label>{label}</Label><Input value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
