'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Search, RefreshCw, Eye, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CasI20CoePage() {
  const token = usePortalStore(state => state.token);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setItems(json.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-[#0057B8] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CAS / I-20 / COE & Visa Handover Center</h1>
              <p className="text-gray-400 text-sm">Destination Documentation Clearance: UK (CAS), USA (I-20), Australia (COE), Canada (LOA/PAL)</p>
            </div>
          </div>
        </div>

        <Button onClick={fetchItems} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Post-Offer Visa Document Clearance ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                  <th className="p-3 font-medium">App Code</th>
                  <th className="p-3 font-medium">Student</th>
                  <th className="p-3 font-medium">Country</th>
                  <th className="p-3 font-medium">Document Required</th>
                  <th className="p-3 font-medium">Clearance Status</th>
                  <th className="p-3 font-medium">Visa Handover</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No applications currently in CAS / I-20 / COE stage.
                    </td>
                  </tr>
                ) : (
                  items.map(app => {
                    const docType = app.country === 'USA' ? 'I-20' : app.country === 'Australia' ? 'COE' : app.country === 'Canada' ? 'LOA / PAL' : 'CAS';
                    return (
                      <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono text-xs text-blue-400">{app.applicationCode || app.id.substring(0, 10)}</td>
                        <td className="p-3 font-semibold text-white">{app.student?.name || app.studentId}</td>
                        <td className="p-3 text-gray-300">{app.country}</td>
                        <td className="p-3 font-semibold text-cyan-400 text-xs">{docType}</td>
                        <td className="p-3">
                          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]">
                            {app.casI20CoeStatus || 'REQUESTED'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={
                            app.visaHandoverStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]' :
                            'bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]'
                          }>
                            {app.visaHandoverStatus || 'PENDING'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Link href={`/application-manager/application/${app.id}`}>
                            <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white">
                              <Eye className="w-4 h-4 mr-1" />
                              Manage
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
