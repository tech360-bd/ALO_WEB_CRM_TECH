'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Search, RefreshCw, Plus, Lock, Globe, ExternalLink, Shield } from 'lucide-react';
import Link from 'next/link';

export default function B2bProvidersPage() {
  const token = usePortalStore(state => state.token);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/b2b/providers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setProviders(json.providers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-[#E8501A] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">B2B Providers & Agreements</h1>
                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">RESTRICTED</Badge>
              </div>
              <p className="text-gray-400 text-sm">Aggregators, Global Partners, Pathway Channels & Commission Agreements</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/application-manager/b2b">
            <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
              Back to B2B Queue
            </Button>
          </Link>
          <Button onClick={fetchProviders} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Registered B2B Providers ({providers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                  <th className="p-3 font-medium">Provider Code</th>
                  <th className="p-3 font-medium">Provider Name</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Contact Person</th>
                  <th className="p-3 font-medium">Commission Rule</th>
                  <th className="p-3 font-medium">Claim Stage</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {providers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No B2B providers configured.
                    </td>
                  </tr>
                ) : (
                  providers.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-rose-400">{p.providerCode}</td>
                      <td className="p-3 font-semibold text-white">{p.name}</td>
                      <td className="p-3 text-xs text-blue-400">{p.providerType}</td>
                      <td className="p-3 text-xs text-gray-300">{p.contactPerson || 'N/A'}</td>
                      <td className="p-3 text-xs text-gray-300">{p.commissionRule || 'Standard Tier'}</td>
                      <td className="p-3">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
                          {p.claimStage}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
