'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, Loader2 } from 'lucide-react';

export default function CrmCommissionsPage() {
  const token = usePortalStore(state => state.token);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (search) params.set('search', search);
      const res = await fetch(`/api/crm/finance?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setPayments(json.data || []);
      }
    } catch (error) {
      console.error('Failed to load commission data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Commission Management</h1>
      </div>
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
              <Input placeholder="Search commissions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
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
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-alo-border/50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-alo-text">{p.studentName || p.studentId || 'N/A'}</td>
                    <td className="py-3 text-alo-text-secondary">{p.paymentType || p.type}</td>
                    <td className="py-3 font-semibold text-alo-text">{p.currency === 'BDT' ? '৳' : '$'}{p.amount}</td>
                    <td className="py-3 text-alo-text-secondary">{p.currency}</td>
                    <td className="py-3"><Badge className={p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}>{p.status}</Badge></td>
                    <td className="py-3 text-alo-text-muted">{p.createdAt?.substring(0, 10)}</td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-alo-text-muted">No commission records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
