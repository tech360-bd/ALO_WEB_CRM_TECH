'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Lock, Building2, Search, RefreshCw, Eye, Plus, CheckCircle2,
  AlertTriangle, Shield, ExternalLink, Filter
} from 'lucide-react';
import Link from 'next/link';

export default function B2bApplicationsPage() {
  const token = usePortalStore(state => state.token);
  const [b2bApps, setB2bApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchB2bApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications/b2b', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setB2bApps(json.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchB2bApps();
  }, [fetchB2bApps]);

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-[#E8501A] flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">B2B Application Management</h1>
                <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">RESTRICTED</Badge>
              </div>
              <p className="text-gray-400 text-sm">Confidential Inbound & Outbound Submissions via Aggregators and Partner Channels</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/application-manager/b2b/providers">
            <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>B2B Providers</span>
            </Button>
          </Link>
          <Button onClick={fetchB2bApps} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Confidentiality Warning */}
      <div className="p-4 bg-gradient-to-r from-rose-950/40 to-[#0d1526] border border-rose-500/30 rounded-2xl flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-rose-400" />
        </div>
        <div className="text-xs text-rose-200">
          <p className="font-semibold text-white text-sm">Strict Security Enforcement Active</p>
          <p className="mt-0.5">B2B provider credentials, submission routes, and commission margins are stripped from all Student, Partner, and Counselor API responses.</p>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Active B2B Submissions ({b2bApps.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                  <th className="p-3 font-medium">App Code</th>
                  <th className="p-3 font-medium">Student</th>
                  <th className="p-3 font-medium">B2B Type</th>
                  <th className="p-3 font-medium">B2B Provider</th>
                  <th className="p-3 font-medium">Reference ID</th>
                  <th className="p-3 font-medium">University & Course</th>
                  <th className="p-3 font-medium">B2B Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {b2bApps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No active B2B applications in queue.
                    </td>
                  </tr>
                ) : (
                  b2bApps.map(app => (
                    <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-blue-400">{app.applicationCode || app.id.substring(0, 10)}</td>
                      <td className="p-3 font-semibold text-white">{app.student?.name || app.studentId}</td>
                      <td className="p-3">
                        <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                          {app.b2bType || 'OUTBOUND'}
                        </Badge>
                      </td>
                      <td className="p-3 text-rose-300 font-medium">{app.b2bProvider?.name || 'Partner Aggregator'}</td>
                      <td className="p-3 font-mono text-xs text-gray-300">{app.b2bApplication?.b2bReference || 'REF-PENDING'}</td>
                      <td className="p-3 text-xs text-gray-300">{app.universityName} - {app.courseName}</td>
                      <td className="p-3">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          {app.b2bApplication?.b2bStatus || 'SUBMITTED'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/application-manager/application/${app.id}`}>
                          <Button size="sm" variant="ghost" className="text-gray-300 hover:text-white">
                            <Eye className="w-4 h-4 mr-1" />
                            Inspect
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
