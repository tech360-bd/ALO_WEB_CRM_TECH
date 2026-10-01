'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search, Plus, Eye, UserCheck, ArrowRightLeft, Trash2, Loader2 } from 'lucide-react';

type LeadStatus = 'new' | 'hot' | 'converted' | 'lost';

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
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  hot: 'bg-orange-100 text-orange-700',
  converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
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

  const loadLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      const res = await fetch(`/api/crm/leads?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLeads(json.data || []);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, sourceFilter]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const filtered = leads.filter((l) => {
    const status = l.hotLead ? 'hot' : l.status;
    const matchTab = activeTab === 'all' || status === activeTab;
    return matchTab;
  });

  const counts = {
    all: leads.length,
    new: leads.filter(l => !l.hotLead && l.status === 'new').length,
    hot: leads.filter(l => l.hotLead || l.status === 'hot').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  const sources = [...new Set(leads.map(l => l.source).filter(Boolean))];

  const handleCreateLead = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setShowCreateDialog(false);
        setCreateForm({ name: '', phone: '', email: '', destination: '', source: 'manual' });
        loadLeads();
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await fetch(`/api/crm/leads?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      loadLeads();
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Lead Management</h1>
        <Button className="bg-alo-brand hover:bg-alo-brand-light text-white" onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />Create Lead
        </Button>
      </div>

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
              <Button onClick={handleCreateLead} disabled={creating} className="bg-alo-brand hover:bg-alo-brand-light text-white">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-alo-border">
          <TabsTrigger value="all">All Leads <Badge variant="secondary" className="ml-1">{counts.all}</Badge></TabsTrigger>
          <TabsTrigger value="new">New <Badge variant="secondary" className="ml-1">{counts.new}</Badge></TabsTrigger>
          <TabsTrigger value="hot">Hot <Badge variant="secondary" className="ml-1">{counts.hot}</Badge></TabsTrigger>
          <TabsTrigger value="converted">Converted <Badge variant="secondary" className="ml-1">{counts.converted}</Badge></TabsTrigger>
          <TabsTrigger value="lost">Lost <Badge variant="secondary" className="ml-1">{counts.lost}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
                  <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
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
                    {filtered.map((lead) => {
                      const status = lead.hotLead ? 'hot' : lead.status;
                      return (
                        <tr key={lead.id} className="border-b border-alo-border/50 hover:bg-gray-50">
                          <td className="py-3 font-medium text-alo-text">{lead.name}</td>
                          <td className="py-3 text-alo-text-secondary">{lead.phone}</td>
                          <td className="py-3 text-alo-text-secondary">{lead.email}</td>
                          <td className="py-3 text-alo-text-secondary">{lead.source}</td>
                          <td className="py-3 text-alo-text-secondary">{lead.destination}</td>
                          <td className="py-3"><Badge className={statusColors[status] || 'bg-gray-100 text-gray-700'}>{status}</Badge></td>
                          <td className="py-3 text-alo-text-secondary">{lead.counselorName}</td>
                          <td className="py-3 text-alo-text-muted">{lead.createdAt?.substring(0, 10)}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button disabled title="View — not yet wired (see BUTTON-INVENTORY.csv)" variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                              <Button disabled title="Assign — not yet wired (see BUTTON-INVENTORY.csv)" variant="ghost" size="sm"><UserCheck className="h-4 w-4" /></Button>
                              <Button disabled title="Convert — not yet wired (see BUTTON-INVENTORY.csv)" variant="ghost" size="sm"><ArrowRightLeft className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-red-500" title="Delete" onClick={() => handleDelete(lead.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} className="py-8 text-center text-alo-text-muted">No leads found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
