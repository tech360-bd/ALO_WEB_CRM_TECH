'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Plus, Eye, Edit, Trash2, Building2, Users, DollarSign, Loader2 } from 'lucide-react';

interface Partner {
  id: string;
  partnerId: string;
  companyName: string;
  contactPerson: string;
  city: string;
  businessType: string;
  totalLeads: number;
  activeStudents: number;
  commissionPending: number;
  commissionPaid: number;
  approvalStatus: string;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  approved: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-orange-100 text-orange-700',
  terminated: 'bg-red-100 text-red-700',
};

export default function CrmPartnersPage() {
  const token = usePortalStore(state => state.token);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const loadPartners = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeTab !== 'all') params.set('status', activeTab);
      params.set('limit', '100');
      const res = await fetch(`/api/crm/partners?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setPartners(json.data?.partners || json.data || []);
      }
    } catch (error) {
      console.error('Failed to load partners:', error);
    } finally {
      setLoading(false);
    }
  }, [token, search, activeTab]);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  const filtered = partners.filter((p) => {
    const status = (p.approvalStatus || 'pending').toLowerCase();
    return activeTab === 'all' || (activeTab === 'active' ? ['active', 'approved'].includes(status) : status === activeTab);
  });

  const counts = {
    all: partners.length,
    active: partners.filter(p => ['active', 'approved'].includes((p.approvalStatus || '').toLowerCase())).length,
    pending: partners.filter(p => (p.approvalStatus || '').toLowerCase() === 'pending').length,
    suspended: partners.filter(p => (p.approvalStatus || '').toLowerCase() === 'suspended').length,
    terminated: partners.filter(p => (p.approvalStatus || '').toLowerCase() === 'terminated').length,
  };

  const totalStudents = partners.reduce((s, p) => s + (p.activeStudents || 0), 0);
  const totalCommission = partners.reduce((s, p) => s + (p.commissionPaid || 0) + (p.commissionPending || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Partner Management</h1>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-alo-brand hover:bg-alo-brand-light text-white"><Plus className="mr-2 h-4 w-4" />Add Partner</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border p-4">
          <Building2 className="h-5 w-5 mb-2 text-alo-brand" />
          <div className="text-xl font-bold text-alo-text">{counts.all}</div>
          <div className="text-xs text-alo-text-muted">Total Partners</div>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border p-4">
          <Users className="h-5 w-5 mb-2 text-emerald-600" />
          <div className="text-xl font-bold text-alo-text">{totalStudents}</div>
          <div className="text-xs text-alo-text-muted">Total Students Referred</div>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border p-4">
          <DollarSign className="h-5 w-5 mb-2 text-yellow-600" />
          <div className="text-xl font-bold text-alo-text">৳{totalCommission.toLocaleString()}</div>
          <div className="text-xs text-alo-text-muted">Total Commission</div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-alo-border">
          <TabsTrigger value="all">All <Badge variant="secondary" className="ml-1">{counts.all}</Badge></TabsTrigger>
          <TabsTrigger value="active">Active <Badge variant="secondary" className="ml-1">{counts.active}</Badge></TabsTrigger>
          <TabsTrigger value="pending">Pending <Badge variant="secondary" className="ml-1">{counts.pending}</Badge></TabsTrigger>
          <TabsTrigger value="suspended">Suspended <Badge variant="secondary" className="ml-1">{counts.suspended}</Badge></TabsTrigger>
          <TabsTrigger value="terminated">Terminated <Badge variant="secondary" className="ml-1">{counts.terminated}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
                  <Input placeholder="Search partners..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-alo-border text-left text-alo-text-muted">
                      <th className="pb-3 font-medium">Partner ID</th>
                      <th className="pb-3 font-medium">Company</th>
                      <th className="pb-3 font-medium">Contact</th>
                      <th className="pb-3 font-medium">City</th>
                      <th className="pb-3 font-medium text-right">Students</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-[var(--alo-text-muted)]">No partners found</td></tr>
                    ) : filtered.map((p) => (
                      <tr key={p.id} className="border-b border-alo-border/50 hover:bg-[var(--alo-page)]">
                        <td className="py-3 font-mono text-xs text-alo-brand font-medium">{p.partnerId || p.id.substring(0, 8)}</td>
                        <td className="py-3 font-medium text-alo-text">{p.companyName}</td>
                        <td className="py-3 text-alo-text-secondary">{p.contactPerson}</td>
                        <td className="py-3 text-alo-text-secondary">{p.city}</td>
                        <td className="py-3 text-right font-medium text-alo-text">{p.activeStudents || p.totalLeads || 0}</td>
                        <td className="py-3"><Badge className={statusColors[(p.approvalStatus || '').toLowerCase()] || statusColors.pending}>{p.approvalStatus || 'Pending'}</Badge></td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
