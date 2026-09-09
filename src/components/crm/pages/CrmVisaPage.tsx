'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, Edit, Loader2 } from 'lucide-react';

export default function CrmVisaPage() {
  const token = usePortalStore(state => state.token);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadVisaCases = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (search) params.set('search', search);
      const res = await fetch(`/api/visa/cases?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCases(json.cases || []);
      }
    } catch (error) {
      console.error('Failed to load visa cases:', error);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => { loadVisaCases(); }, [loadVisaCases]);

  const filtered = cases;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-alo-brand" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Visa Processing</h1>
      </div>
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
              <Input placeholder="Search visa cases..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead>
                <tr className="border-b border-alo-border text-left text-alo-text-muted">
                  <th className="pb-3 font-medium">Case Code</th>
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">University</th>
                  <th className="pb-3 font-medium">Country</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">Readiness</th>
                  <th className="pb-3 font-medium">Updated</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vc) => (
                  <tr key={vc.id} className="border-b border-alo-border/50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-alo-text">{vc.caseCode || 'N/A'}</td>
                    <td className="py-3 text-alo-text-secondary">{vc.studentName || 'N/A'}</td>
                    <td className="py-3 text-alo-text-secondary">{vc.university}</td>
                    <td className="py-3 text-alo-text-secondary">{vc.destinationCountry}</td>
                    <td className="py-3"><Badge className="bg-blue-100 text-blue-700">{vc.currentStage?.replace(/_/g, ' ')}</Badge></td>
                    <td className="py-3 text-alo-text-secondary">{vc.readinessScore}%</td>
                    <td className="py-3 text-alo-text-muted">{vc.updatedAt?.substring(0, 10)}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-alo-text-muted">No visa cases found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
