'use client';
import RegistrationEnquiries from '@/components/crm/RegistrationEnquiries';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import KanbanPipeline from '@/components/crm/KanbanPipeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Eye, UserCheck, ArrowRightLeft, Loader2 } from 'lucide-react';

const SOURCES = ['manual', 'facebook', 'website', 'referral', 'google_ads'];
const STAGES = ['new', 'contacted', 'qualified', 'assigned', 'converted', 'lost'];
const INITIAL_COUNTS: Record<string, number> = Object.fromEntries(['all', 'hot', ...STAGES].map(s => [s, 0]));

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  destination: string;
  status: string;
  counselorName: string;
  createdAt: string;
  hotLead?: boolean;
  updatedAt: string;
  followUpDueAt?: string | null;
  followUpDone?: boolean;
}

const statusColors: Record<string, string> = {
  new: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
  hot: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]',
  converted: 'bg-crm-success-bg text-crm-success-text',
  lost: 'bg-crm-danger-bg text-crm-danger-text',
};

export default function CrmLeadsPage() {
  const token = usePortalStore(state => state.token);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', destination: '', source: 'manual' });
  const [creating, setCreating] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [counts, setCounts] = useState(INITIAL_COUNTS);
  const [sources, setSources] = useState(SOURCES);
  const [error, setError] = useState('');
  const [capabilities, setCapabilities] = useState({ create: false, update: false });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [updating, setUpdating] = useState(false);
  const [board, setBoard] = useState(false);
  const sequence = useRef(0);
  const authorization = useCallback((): Record<string, string> => token && !['null', 'undefined'].includes(token) ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const loadLeads = useCallback(async () => {
    const seq = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (activeTab !== 'all') params.set('tab', activeTab);
      const res = await fetch(`/api/crm/leads?${params}`, { headers: authorization(), credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok || !json.success || !Array.isArray(json.data)) throw new Error(json.error || 'Failed to load leads');
      if (seq !== sequence.current) return;
      setLeads(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
      setCounts(json.counts || INITIAL_COUNTS);
      setSources([...new Set([...SOURCES, ...(json.sources || [])])]);
      setCapabilities(json.capabilities || { create: false, update: false });
      setSelectedLead(prev => prev ? json.data.find((lead: Lead) => lead.id === prev.id) || null : null);
      return true;
    } catch (error) {
      if (seq !== sequence.current) return;
      setError(error instanceof Error ? error.message : 'Failed to load leads');
      setLeads([]); setCounts(INITIAL_COUNTS); setTotal(0); setTotalPages(0);
      setCapabilities({ create: false, update: false }); setSelectedLead(null);
      return false;
    } finally { if (seq === sequence.current) setLoading(false); }
  }, [authorization, search, statusFilter, sourceFilter, activeTab, page]);

  useEffect(() => {
    void loadLeads();
    return () => { sequence.current++; };
  }, [loadLeads]);

  const handleCreateLead = async () => {
    setCreating(true); setError('');
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST', headers: { ...authorization(), 'Content-Type': 'application/json' },
        credentials: 'same-origin', body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create lead');
      setShowCreateDialog(false);
      setCreateForm({ name: '', phone: '', email: '', destination: '', source: 'manual' });
      await loadLeads();
    } catch (error) { setError(error instanceof Error ? error.message : 'Failed to create lead'); }
    finally { setCreating(false); }
  };

  const updateLead = async (id: string, change: Record<string, unknown>) => {
    const lead = leads.find(item => item.id === id);
    if (!lead || !capabilities.update) throw new Error('Lead update unavailable');
    setUpdating(true); setError('');
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'PATCH', credentials: 'same-origin', headers: { ...authorization(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, expectedUpdatedAt: lead.updatedAt, ...change }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update lead');
      if (!await loadLeads()) throw new Error('Update accepted, but refresh failed. Reload before making further changes.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update lead');
      throw error;
    } finally { setUpdating(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <RegistrationEnquiries/>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Lead Management</h1>
        <Button className="bg-alo-brand hover:bg-alo-brand-light text-white" disabled={!capabilities.create} title={!capabilities.create ? "Verified User mapping and create access required" : "Create lead"} onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />Create Lead
        </Button>
      </div>

      <p className="text-sm text-alo-text-muted">Persisted records only. Consent is not assumed. Assignment and student conversion require separate verified services; hard deletion is unavailable until retention rules are approved.</p>
      {error && <div role="alert" className="rounded border border-crm-danger-border p-3 text-crm-danger-text">{error} <Button variant="outline" onClick={() => void loadLeads()}>Retry</Button></div>}
      {loading && <p role="status">Loading leads…</p>}
      {showCreateDialog && (
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Create New Lead</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Name" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
              <Input placeholder="Phone" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} />
              <Input placeholder="Email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
              <Input placeholder="Destination Country" value={createForm.destination} onChange={e => setCreateForm({ ...createForm, destination: e.target.value })} />
              <Select value={createForm.source} onValueChange={v => setCreateForm({ ...createForm, source: v })}>
                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="google_ads">Google Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateLead} disabled={creating || !capabilities.create} className="bg-alo-brand hover:bg-alo-brand-light text-white">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setPage(1); }}>
        <TabsList className="bg-white border border-alo-border flex-wrap h-auto">
          {['all', 'hot', ...STAGES].map(view => <TabsTrigger key={view} value={view}>{view === 'all' ? 'All Leads' : view} <Badge variant="secondary" className="ml-1">{counts[view] || 0}</Badge></TabsTrigger>)}
        </TabsList>
        <TabsContent value={activeTab}>
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
                  <Input placeholder="Search leads..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {['hot', ...STAGES].map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={v => { setSourceFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-3 flex items-center gap-3">
                <Button variant="outline" onClick={() => setBoard(v => !v)}>{board ? 'Table view' : 'Board view'}</Button>
                <span className="text-sm">{total} matching records · page {page} of {Math.max(1, totalPages)}</span>
              </div>
              {board ? <><p className="mb-2 text-sm text-alo-text-muted">Board shows this page only. Move new/contacted/qualified leads to supported stages; assignment and conversion need dedicated services.</p><KanbanPipeline items={leads.map(l => ({ id: l.id, title: l.name || l.email || l.phone, subtitle: l.destination, stage: l.status, meta: { Source: l.source } }))} stages={[...new Set([...STAGES, ...leads.map(l => l.status)])]} moveTargets={item => ['new','contacted','qualified'].includes(item.stage) ? ['new','contacted','qualified','lost'] : []} onStageChange={capabilities.update && !loading && !updating ? (id, status) => updateLead(id, { status }) : undefined} onOpen={id => setSelectedLead(leads.find(l => l.id === id) || null)} /></> : <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-alo-border text-left text-alo-text-muted">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Source</th>
                      <th className="pb-3 font-medium">Country</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Counselor</th>
                      <th className="pb-3 font-medium">Created</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => {
                      const status = lead.hotLead && !['converted', 'lost'].includes(lead.status) ? 'hot' : lead.status;
                      return (
                        <tr key={lead.id} className="border-b border-alo-border/50 hover:bg-[var(--alo-page)]">
                          <td className="py-3 font-medium text-alo-text">{lead.name}</td>
                          <td className="py-3 text-alo-text-secondary">{lead.phone}</td>
                          <td className="py-3 text-alo-text-secondary">{lead.email}</td>
                          <td className="py-3 text-alo-text-secondary">{lead.source}</td>
                          <td className="py-3 text-alo-text-secondary">{lead.destination}</td>
                          <td className="py-3"><Badge className={statusColors[status] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}>{status}</Badge></td>
                          <td className="py-3 text-alo-text-secondary">{lead.counselorName}</td>
                          <td className="py-3 text-alo-text-muted">{lead.createdAt?.substring(0, 10)}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button title="View lead" aria-label={`View ${lead.name || lead.id}`} onClick={() => setSelectedLead(lead)} variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                              <Button disabled aria-label="Assign unavailable" title="Assignment requires a verified counselor identity mapping" variant="ghost" size="sm"><UserCheck className="h-4 w-4" /></Button>
                              <Button disabled aria-label="Convert unavailable" title="Student creation/conversion transaction is not available here" variant="ghost" size="sm"><ArrowRightLeft className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {leads.length === 0 && (
                      <tr><td colSpan={9} className="py-8 text-center text-alo-text-muted">{error ? 'Records unavailable — see error above' : 'No leads found'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" disabled={loading || page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={Boolean(selectedLead)} onOpenChange={open => { if (!open) setSelectedLead(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedLead?.name || 'Lead details'}</DialogTitle><DialogDescription>Saved contact information and supported follow-up controls.</DialogDescription></DialogHeader>
          {selectedLead && <div className="space-y-3">
            <dl className="text-sm"><dt>Email</dt><dd>{selectedLead.email || 'Not supplied'}</dd><dt>Phone</dt><dd>{selectedLead.phone || 'Not supplied'}</dd><dt>Destination</dt><dd>{selectedLead.destination || 'Not supplied'}</dd><dt>Source</dt><dd>{selectedLead.source}</dd><dt>Follow-up due</dt><dd>{selectedLead.followUpDueAt || 'Not scheduled'}</dd></dl>
            <label className="block text-sm">Stage
              <select aria-label="Lead stage" className="ml-2 rounded border p-2" value={selectedLead.status} disabled={updating || loading || !capabilities.update || !['new', 'contacted', 'qualified'].includes(selectedLead.status)} onChange={e => void updateLead(selectedLead.id, { status: e.target.value }).catch(() => {})}>
                {[...new Set(['new', 'contacted', 'qualified', 'lost', selectedLead.status])].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <Button variant="outline" disabled={updating || loading || !capabilities.update || !['new', 'contacted', 'qualified'].includes(selectedLead.status)} onClick={() => void updateLead(selectedLead.id, { hotLead: !selectedLead.hotLead }).catch(() => {})}>{selectedLead.hotLead ? 'Remove hot flag' : 'Mark hot'}</Button>
            {selectedLead.followUpDueAt && <Button variant="outline" disabled={updating || loading || !capabilities.update || !['new', 'contacted', 'qualified'].includes(selectedLead.status)} onClick={() => void updateLead(selectedLead.id, { followUpDone: !selectedLead.followUpDone }).catch(() => {})}>{selectedLead.followUpDone ? 'Reopen follow-up' : 'Complete follow-up'}</Button>}
            {error && <p role="alert" className="text-crm-danger-text">{error}</p>}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
