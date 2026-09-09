'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search, Eye, DollarSign, Loader2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
  partial: 'bg-orange-100 text-orange-700',
};

export default function CrmFinancePage() {
  const token = usePortalStore(state => state.token);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const loadPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/crm/finance?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setPayments(json.data || []);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const counts = {
    all: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed' || p.status === 'refunded').length,
  };

  const filtered = payments.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return p.status === 'completed';
    if (activeTab === 'pending') return p.status === 'pending';
    if (activeTab === 'failed') return p.status === 'failed' || p.status === 'refunded';
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Finance Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-alo-border">
          <TabsTrigger value="all">All <Badge variant="secondary" className="ml-1">{counts.all}</Badge></TabsTrigger>
          <TabsTrigger value="completed">Completed <Badge variant="secondary" className="ml-1">{counts.completed}</Badge></TabsTrigger>
          <TabsTrigger value="pending">Pending <Badge variant="secondary" className="ml-1">{counts.pending}</Badge></TabsTrigger>
          <TabsTrigger value="failed">Failed <Badge variant="secondary" className="ml-1">{counts.failed}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
                  <Input placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-alo-border text-left text-alo-text-muted">
                      <th className="pb-3 font-medium">Student</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Currency</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-alo-border/50 hover:bg-gray-50">
                        <td className="py-3 font-medium text-alo-text">{p.studentName || p.studentId || 'N/A'}</td>
                        <td className="py-3 text-alo-text-secondary">{p.paymentType || p.type}</td>
                        <td className="py-3 font-semibold text-alo-text">{p.currency === 'BDT' ? '৳' : '$'}{p.amount}</td>
                        <td className="py-3 text-alo-text-secondary">{p.currency}</td>
                        <td className="py-3"><Badge className={statusColors[p.status] || 'bg-gray-100 text-gray-700'}>{p.status}</Badge></td>
                        <td className="py-3 text-alo-text-muted">{p.createdAt?.substring(0, 10)}</td>
                        <td className="py-3 text-right">
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-alo-text-muted">No payments found</td></tr>
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
