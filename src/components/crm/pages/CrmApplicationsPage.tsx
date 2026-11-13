'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import KanbanPipeline from '@/components/crm/KanbanPipeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Eye, Edit, ArrowUpRight, MoreHorizontal, Loader2 } from 'lucide-react';

const stageLabels: Record<string, string> = {
  research: 'Research', shortlisted: 'Shortlisted', counseling: 'Counseling', document_ready: 'Document Ready',
  submitted: 'Submitted', under_review: 'Under Review', offer_received: 'Offer Received',
  visa_applied: 'Visa Applied', visa_approved: 'Visa Approved', enrolled: 'Enrolled',
  withdrawn: 'Withdrawn', rejected: 'Rejected', conditional: 'Conditional', unconditional: 'Unconditional',
};

const stageColors: Record<string, string> = {
  research: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]', shortlisted: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
  counseling: 'bg-[var(--alo-info-bg)] text-[var(--alo-info-text)]', document_ready: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]', under_review: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
  offer_received: 'bg-crm-success-bg text-crm-success-text', conditional: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]',
  unconditional: 'bg-crm-success-bg text-crm-success-text', enrolled: 'bg-crm-success-bg text-crm-success-text',
  rejected: 'bg-crm-danger-bg text-crm-danger-text', withdrawn: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
  visa_applied: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]', visa_approved: 'bg-crm-success-bg text-crm-success-text',
};

export default function CrmApplicationsPage() {
  const token = usePortalStore(state => state.token);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'board'>('table');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const selected = apps.find(app => app.id === selectedId);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const loadApps = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (search) params.set('search', search);
      if (stageFilter !== 'all') params.set('stage', stageFilter);
      const res = await fetch(`/api/crm/applications?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setApps(json.data || []);
      } else { throw new Error("Application records could not be loaded."); }
    } catch (error) {
      setApps([]); setLoadError(error instanceof Error ? error.message : 'Application records unavailable.');
    } finally {
      setLoading(false);
    }
  }, [token, search, stageFilter]);

  useEffect(() => { loadApps(); }, [loadApps]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Application Tracking</h1>
        <div className="flex gap-2" aria-label="Application view"><Button type="button" variant={view === 'table' ? 'default' : 'outline'} aria-pressed={view === 'table'} onClick={() => setView('table')}>Table</Button><Button type="button" variant={view === 'board' ? 'default' : 'outline'} aria-pressed={view === 'board'} onClick={() => setView('board')}>Board</Button></div>
      </div>
      {loadError && <p role="alert" className="text-sm text-crm-danger-text">{loadError}</p>}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelectedId(null); }}><DialogContent><DialogHeader><DialogTitle>Application information</DialogTitle><DialogDescription>Persisted record from the authenticated CRM API. No stage changes are made in this view.</DialogDescription></DialogHeader>{selected && <dl className="space-y-2 text-sm">{Object.entries({ Student: selected.studentProfile?.fullName || 'Not recorded', University: selected.university, Course: selected.course, Stage: selected.stage, Country: selected.country, Intake: selected.intake }).map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd>{String(value || 'Not recorded')}</dd></div>)}</dl>}</DialogContent></Dialog>
      {view === 'board' ? <><p className="text-xs text-[var(--alo-text-muted)]">Read-only board of the loaded records (up to 100). Stage editing needs an audited transition API; it is not simulated here.</p><KanbanPipeline stages={Object.keys(stageLabels)} items={apps.map(app => ({ id: app.id, title: `${app.university || 'University not recorded'} · ${app.course || 'Course not recorded'}`, subtitle: app.studentProfile?.fullName, stage: app.stage }))} onOpen={setSelectedId} /></> : <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
              <Input placeholder="Search applications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {Object.entries(stageLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="border-b border-alo-border text-left text-alo-text-muted">
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">University</th>
                  <th className="pb-3 font-medium">Course</th>
                  <th className="pb-3 font-medium">Country</th>
                  <th className="pb-3 font-medium">Intake</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">Updated</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id} className="border-b border-alo-border/50 hover:bg-[var(--alo-page)]">
                    <td className="py-3 font-medium text-alo-text">{app.studentProfile?.fullName || 'N/A'}</td>
                    <td className="py-3 text-alo-text-secondary">{app.university}</td>
                    <td className="py-3 text-alo-text-secondary max-w-[160px] truncate">{app.course}</td>
                    <td className="py-3 text-alo-text-secondary">{app.country}</td>
                    <td className="py-3 text-alo-text-secondary">{app.intake}</td>
                    <td className="py-3"><Badge className={stageColors[app.stage] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}>{stageLabels[app.stage] || app.stage}</Badge></td>
                    <td className="py-3 text-alo-text-muted">{app.updatedAt?.substring(0, 10)}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" aria-label={`View application ${app.id}`} onClick={() => setSelectedId(app.id)} variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm"><ArrowUpRight className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-alo-text-muted">No applications found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>}
    </div>
  );
}
