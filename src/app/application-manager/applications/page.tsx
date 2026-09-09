'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileCheck, Search, Filter, RefreshCw, Eye, Lock, ArrowRight,
  ChevronRight, Download, Plus, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function ApplicationManagerApplicationsPage() {
  const token = usePortalStore(state => state.token);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (stageFilter !== 'all') params.set('stage', stageFilter);

      const res = await fetch(`/api/applications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setApps(json.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, stageFilter, token]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">All Applications Master Pipeline</h1>
              <p className="text-gray-400 text-sm">Central application registry across Direct, Partner and B2B Inbound/Outbound sources</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={fetchApps} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search student, university, course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[#0d1526] border-white/10 text-white placeholder-gray-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="bg-[#0d1526] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#0057B8]"
          >
            <option value="all">All Application Sources</option>
            <option value="DIRECT_ALO_APPLICATION">Direct ALO</option>
            <option value="STUDENT_SELF_APPLICATION">Student Self</option>
            <option value="PARTNER_APPLICATION">Partner Channel</option>
            <option value="B2B_INBOUND_APPLICATION">B2B Inbound</option>
            <option value="B2B_OUTBOUND_APPLICATION">B2B Outbound</option>
          </select>

          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="bg-[#0d1526] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#0057B8]"
          >
            <option value="all">All Stages</option>
            <option value="counseling">Counseling</option>
            <option value="document_review">Document Review</option>
            <option value="submitted">Submitted</option>
            <option value="conditional_offer">Conditional Offer</option>
            <option value="unconditional_offer">Unconditional Offer</option>
            <option value="visa_preparation">Visa Preparation</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                  <th className="p-3 font-medium">App Code</th>
                  <th className="p-3 font-medium">Student Name</th>
                  <th className="p-3 font-medium">Destination & University</th>
                  <th className="p-3 font-medium">Course & Intake</th>
                  <th className="p-3 font-medium">Source</th>
                  <th className="p-3 font-medium">Internal Stage</th>
                  <th className="p-3 font-medium">Student Safe Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No applications found matching query.
                    </td>
                  </tr>
                ) : (
                  apps.map(app => (
                    <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-blue-400">{app.applicationCode || app.id.substring(0, 10)}</td>
                      <td className="p-3 font-medium text-white">{app.student?.name || app.studentId}</td>
                      <td className="p-3">
                        <p className="text-white font-medium">{app.universityName}</p>
                        <p className="text-xs text-gray-400">{app.country}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs text-gray-200">{app.courseName}</p>
                        <p className="text-[11px] text-gray-400">{app.intake || 'Intake N/A'}</p>
                      </td>
                      <td className="p-3">
                        {app.isB2b ? (
                          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                            <Lock className="w-2.5 h-2.5 mr-1" /> {app.b2bType || 'B2B'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-white/10 text-[10px]">
                            {app.applicationSource?.replace(/_/g, ' ') || 'DIRECT'}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-xs text-amber-400 font-semibold">{app.stage}</td>
                      <td className="p-3">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          {app.safeStatus || 'UNDER REVIEW'}
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
