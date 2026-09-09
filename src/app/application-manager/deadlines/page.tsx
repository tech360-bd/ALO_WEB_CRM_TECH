'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ApplicationDeadlinesPage() {
  const token = usePortalStore(state => state.token);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeadlines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications/deadlines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setDeadlines(json.deadlines || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-[#E8501A] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Application Deadlines & Milestones</h1>
              <p className="text-gray-400 text-sm">University Application Deadlines, Offer Conditions, Deposit Dates & CAS Cutoffs</p>
            </div>
          </div>
        </div>

        <Button onClick={fetchDeadlines} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Active Tracked Deadlines ({deadlines.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                  <th className="p-3 font-medium">Application</th>
                  <th className="p-3 font-medium">Deadline Type</th>
                  <th className="p-3 font-medium">Target Date</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deadlines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No urgent deadline alerts at this time.
                    </td>
                  </tr>
                ) : (
                  deadlines.map(d => (
                    <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-blue-400">{d.applicationId}</td>
                      <td className="p-3 font-semibold text-white">{d.deadlineType}</td>
                      <td className="p-3 text-amber-400 font-mono text-xs">{new Date(d.deadlineDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                          {d.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/application-manager/application/${d.applicationId}`}>
                          <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white">
                            <Eye className="w-4 h-4 mr-1" />
                            View
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
