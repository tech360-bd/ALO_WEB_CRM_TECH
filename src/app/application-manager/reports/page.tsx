'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, RefreshCw, FileSpreadsheet, Shield, ArrowUpRight } from 'lucide-react';

export default function ApplicationReportsPage() {
  const token = usePortalStore(state => state.token);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setReportData(json.reports || json.data || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Application Analytics & Reports</h1>
              <p className="text-gray-400 text-sm">Source Attribution, Conversion Ratios, University Performance & Officer Productivity</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
          <Button onClick={fetchReports} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#0d1526] border-white/10 text-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Direct Conversion Rate</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">82.4%</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0d1526] border-white/10 text-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Partner Channel Volume</p>
            <p className="text-2xl font-bold mt-1 text-blue-400">45 Cases</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0d1526] border-white/10 text-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Average Offer Turnaround</p>
            <p className="text-2xl font-bold mt-1 text-purple-400">11 Days</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0d1526] border-white/10 text-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Visa Handover Rate</p>
            <p className="text-2xl font-bold mt-1 text-cyan-400">96.8%</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Breakdown */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10">
          <CardTitle className="text-base font-semibold">Source Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-sm">
          {[
            { source: 'Direct ALO Education Website & Course Finder', count: 54, conversion: '86%' },
            { source: 'Authorized Partner Network', count: 32, conversion: '78%' },
            { source: 'B2B Outbound Aggregator Channels', count: 18, conversion: '82%' },
            { source: 'B2B Inbound Partner Referrals', count: 12, conversion: '75%' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <p className="font-semibold text-white">{item.source}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.count} Total Applications Processed</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {item.conversion} Offer Ratio
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
