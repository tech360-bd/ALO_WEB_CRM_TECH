'use client';
import RegistrationEnquiries from '@/components/crm/RegistrationEnquiries';

/**
 * Counselor lead queue — /counselor/leads
 *
 * Backed by GET /api/employee/leads, which scopes the list to the signed-in
 * User account's own created leads on the server. Scope, status and search are sent
 * as query parameters; nothing is filtered client-side only.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, Flame, Loader2, Phone, RefreshCw, Search, UserPlus, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';

interface CounselorLead {
  id: string;
  fullName?: string;
  name?: string;
  phone: string;
  email: string;
  destination: string;
  level: string;
  intake: string;
  ieltsScore: number;
  pteScore: number;
  budget: string;
  source: string;
  status: string;
  hotLead: boolean;
  score: number;
  counselorName: string;
  followUpDueAt: string | null;
  followUpDone: boolean;
  createdAt: string;
}

interface LeadsResponse {
  success: boolean;
  total: number;
  leads: CounselorLead[];
  error?: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'applied', label: 'Applied' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

const STATUS_TONE: Record<string, string> = {
  new: 'border-blue-200 bg-blue-50 text-blue-800',
  contacted: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  qualified: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  applied: 'border-teal-200 bg-teal-50 text-teal-800',
  converted: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  lost: 'border-slate-200 bg-slate-100 text-slate-600',
};

function statusLabel(value: string): string {
  return (value || 'new').replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function relativeDue(value: string | null): { label: string; overdue: boolean } | null {
  if (!value) return null;
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return null;
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: `Follow-up overdue by ${Math.abs(days)}d`, overdue: true };
  if (days === 0) return { label: 'Follow-up due today', overdue: false };
  return { label: `Follow-up in ${days}d`, overdue: false };
}

export default function CounselorLeadsPage() {
  const token = usePortalStore((state) => state.token);
  const [leads, setLeads] = useState<CounselorLead[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', destination: '', level: '', intake: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const path = useMemo(() => {
    const params = new URLSearchParams({ scope: 'created', limit: '100' });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    return `/api/employee/leads?${params.toString()}`;
  }, [status, search]);

  const load = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const response = await fetch(path, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const payload = (await response.json().catch(() => null)) as LeadsResponse | null;
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `The lead queue could not be loaded (status ${response.status}).`);
      }
      setLeads(payload.leads ?? []);
      setTotal(payload.total ?? 0);
      setState('ready');
    } catch (caught) {
      setError((caught as Error).message || 'The lead queue could not be loaded.');
      setState('error');
    }
  }, [path, token]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounce free-text search so a keystroke does not fire a request each time.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const submitLead = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdding(true);
    setFormError(null);
    try {
      const response = await fetch('/api/employee/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || `The lead could not be created (status ${response.status}).`);
      }
      setForm({ fullName: '', phone: '', email: '', destination: '', level: '', intake: '' });
      await load();
    } catch (caught) {
      setFormError((caught as Error).message || 'The lead could not be created.');
    } finally {
      setAdding(false);
    }
  };

  const hotCount = leads.filter((lead) => lead.hotLead).length;
  const awaitingFollowUp = leads.filter((lead) => !lead.followUpDone && lead.followUpDueAt).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold leading-tight tracking-[-0.01em] text-slate-900">My Leads</h1>
            <p className="mt-1 text-[13px] text-slate-500">
              Leads you created. Assignment and team views remain unavailable until identity mapping is verified.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" className="h-9 rounded-button border-slate-200 bg-white px-4 text-[13px] font-semibold" onClick={load}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </header>
        <RegistrationEnquiries/>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total created" value={total} />
          <Metric label="Loaded" value={leads.length} />
          <Metric label="Hot leads" value={hotCount} tone={hotCount > 0 ? 'warning' : 'neutral'} />
          <Metric label="Follow-ups due" value={awaitingFollowUp} tone={awaitingFollowUp > 0 ? 'info' : 'neutral'} />
        </div>

        {/* Filters + add */}
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, phone or email"
              aria-label="Search leads"
              className="h-9 rounded-input border-slate-200 pl-9 text-sm"
            />
          </div>
          <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
            <SelectTrigger className="h-9 w-full rounded-input border-slate-200 lg:w-44" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value || 'all'}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/counselor/students">
            <Button variant="outline" className="h-9 rounded-button border-slate-200 px-4 text-[13px] font-semibold">
              <Users className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              My Students
            </Button>
          </Link>
        </div>

        {state === 'error' && (
          <div className="mb-4 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-5 sm:flex-row sm:items-center">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-900">Lead queue unavailable</p>
              <p className="mt-0.5 text-sm text-red-800">{error}</p>
            </div>
            <Button variant="outline" className="shrink-0 border-red-300 bg-white text-red-700" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Try Again
            </Button>
          </div>
        )}

        {state === 'loading' && (
          <div className="space-y-2" aria-busy="true" aria-live="polite">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full rounded-lg" />)}
          </div>
        )}

        {state === 'ready' && leads.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
            <h2 className="text-[15px] font-semibold text-slate-900">
              {status || search ? 'No leads match those filters' : 'No leads created by you yet'}
            </h2>
            <p className="mx-auto mt-1 max-w-[460px] text-[13px] leading-relaxed text-slate-500">
              {status || search
                ? 'Clear the search or status filter to see your full queue.'
                : 'When a branch manager assigns you a lead it will appear here. You can also add a lead you have spoken to directly.'}
            </p>
          </div>
        )}

        {state === 'ready' && leads.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Lead</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Destination</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Contact</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Source</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const due = relativeDue(lead.followUpDueAt);
                  const name = lead.fullName || lead.name || 'Name not recorded';
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
                              {name}
                              {lead.hotLead && (
                                <span className="inline-flex items-center gap-1 rounded border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orange-800">
                                  <Flame className="h-3 w-3" aria-hidden="true" />
                                  Hot
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-[12px] text-slate-500">
                              {[lead.level, lead.intake].filter(Boolean).join(' · ') || 'Level and intake not recorded'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-700">
                        {lead.destination || '—'}
                        {lead.ieltsScore > 0 && <p className="mt-0.5 text-[11px] text-slate-400">IELTS {lead.ieltsScore}</p>}
                        {lead.pteScore > 0 && <p className="mt-0.5 text-[11px] text-slate-400">PTE {lead.pteScore}</p>}
                      </TableCell>
                      <TableCell>
                        <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 text-[13px] text-slate-700 hover:text-blue-600 hover:underline">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                          {lead.phone || '—'}
                        </a>
                        {lead.email && <p className="mt-0.5 text-[12px] text-slate-500">{lead.email}</p>}
                      </TableCell>
                      <TableCell className="text-[13px] text-slate-600">{lead.source || '—'}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold',
                          STATUS_TONE[lead.status?.toLowerCase()] ?? 'border-slate-200 bg-slate-100 text-slate-600',
                        )}>
                          {statusLabel(lead.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lead.followUpDone ? (
                          <span className="text-[12px] text-emerald-700">Completed</span>
                        ) : due ? (
                          <span className={cn('text-[12px] font-medium', due.overdue ? 'text-red-600' : 'text-slate-600')}>
                            {due.label}
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-400">Not scheduled</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add lead */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-[14px] font-semibold text-slate-900">Add a lead</h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Record a prospect you have already spoken to. Only enter details the person gave you.
            </p>
          </div>
          <form onSubmit={submitLead} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" aria-label="Full name" className="h-9 rounded-input border-slate-200 text-sm" />
            <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (+880…)" aria-label="Phone" className="h-9 rounded-input border-slate-200 text-sm" />
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" aria-label="Email" className="h-9 rounded-input border-slate-200 text-sm" />
            <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Destination country" aria-label="Destination" className="h-9 rounded-input border-slate-200 text-sm" />
            <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="Study level" aria-label="Study level" className="h-9 rounded-input border-slate-200 text-sm" />
            <Input value={form.intake} onChange={(e) => setForm({ ...form, intake: e.target.value })} placeholder="Target intake" aria-label="Target intake" className="h-9 rounded-input border-slate-200 text-sm" />

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:col-span-2 lg:col-span-3" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={adding} className="h-9 rounded-button bg-blue-600 px-4 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {adding ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <UserPlus className="mr-2 h-3.5 w-3.5" aria-hidden="true" />}
                {adding ? 'Saving Lead…' : 'Add Lead'}
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-slate-500">
          Lead records contain personal data. Only contact a lead who has consented to being contacted, and never
          export this list outside the ALO CRM.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'info' | 'warning' }) {
  const toneClass = tone === 'warning' ? 'text-orange-600' : tone === 'info' ? 'text-blue-600' : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className={cn('text-[24px] font-bold leading-none tracking-[-0.02em]', toneClass)}>{value}</p>
      <p className="mt-1.5 text-[12px] font-medium text-slate-500">{label}</p>
    </div>
  );
}
