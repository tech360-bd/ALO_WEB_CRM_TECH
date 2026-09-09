'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Search, RefreshCw, Eye, Check, X, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OfferManagementPage() {
  const token = usePortalStore(state => state.token);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications?stage=offer_received', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setOffers(json.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-[#0057B8] flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Offer Letter & Decision Management</h1>
              <p className="text-gray-400 text-sm">Conditional Offers, Unconditional Offers, Scholarships & Tuition Deposit Clearances</p>
            </div>
          </div>
        </div>

        <Button onClick={fetchOffers} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Active University Offers ({offers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                  <th className="p-3 font-medium">App Code</th>
                  <th className="p-3 font-medium">Student Name</th>
                  <th className="p-3 font-medium">University & Country</th>
                  <th className="p-3 font-medium">Offer Type</th>
                  <th className="p-3 font-medium">Deposit Requirement</th>
                  <th className="p-3 font-medium">Safe Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No active offers pending deposit or condition resolution.
                    </td>
                  </tr>
                ) : (
                  offers.map(app => (
                    <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-blue-400">{app.applicationCode || app.id.substring(0, 10)}</td>
                      <td className="p-3 font-semibold text-white">{app.student?.name || app.studentId}</td>
                      <td className="p-3 text-gray-300">{app.universityName} ({app.country})</td>
                      <td className="p-3">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                          {app.offerStatus || 'CONDITIONAL OFFER'}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-emerald-400 font-mono">£3,000 Deposit</td>
                      <td className="p-3">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          OFFER RECEIVED
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
