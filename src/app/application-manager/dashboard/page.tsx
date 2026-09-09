'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileCheck, Send, Clock, Award, Shield, AlertTriangle, CheckCircle2,
  Users, Building2, BookOpen, Filter, ArrowUpRight, Plus, Eye,
  RefreshCw, FileText, Calendar, Lock, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function ApplicationManagerDashboard() {
  const token = usePortalStore(state => state.token);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [resMetrics, resApps] = await Promise.all([
        fetch('/api/applications/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/applications?limit=10', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (resMetrics.ok) {
        const json = await resMetrics.json();
        setMetrics(json.metrics || {});
      }
      if (resApps.ok) {
        const json = await resApps.json();
        setRecentApps(json.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const kpis = [
    { label: 'Total Applications', value: metrics?.total || 0, icon: FileCheck, color: 'text-blue-400' },
    { label: 'Submitted to University', value: metrics?.submitted || 0, icon: Send, color: 'text-emerald-400' },
    { label: 'Decision Pending', value: metrics?.decisionPending || 0, icon: Clock, color: 'text-amber-400' },
    { label: 'Offers Received', value: (metrics?.conditionalOffers || 0) + (metrics?.unconditionalOffers || 0), icon: Award, color: 'text-purple-400' },
    { label: 'B2B Confidential Cases', value: metrics?.confidentialB2bCases || 0, icon: Lock, color: 'text-rose-400' },
    { label: 'CAS / I-20 / COE Pending', value: metrics?.casPending || 0, icon: Shield, color: 'text-cyan-400' },
  ];

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
              <h1 className="text-2xl font-bold">Application Command Center</h1>
              <p className="text-gray-400 text-sm">Direct, Partner & B2B Inbound/Outbound Application Lifecycle</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/application-manager/applications">
            <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
              All Applications
            </Button>
          </Link>
          <Link href="/application-manager/b2b">
            <Button variant="outline" className="border-rose-500/30 text-rose-300 hover:text-rose-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>B2B Queue</span>
            </Button>
          </Link>
          <Button onClick={fetchDashboardData} variant="outline" className="border-white/10 text-gray-300 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="bg-[#0d1526] border-white/10 text-white">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                  <span className="text-[10px] text-gray-500 font-mono">LIVE</span>
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-gray-400 leading-tight">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation Quick Links Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { href: '/application-manager/document-review', label: 'Document Review Queue', count: metrics?.docsPending || 0 },
          { href: '/application-manager/offer-management', label: 'Offer Letter Center', count: (metrics?.conditionalOffers || 0) + (metrics?.unconditionalOffers || 0) },
          { href: '/application-manager/cas-i20-coe', label: 'CAS / I-20 / COE Handover', count: metrics?.casPending || 0 },
          { href: '/application-manager/deadlines', label: 'Urgent Deadlines', count: metrics?.urgentDeadlines || 0 },
          { href: '/application-manager/b2b/providers', label: 'B2B Providers & Agreements', count: metrics?.b2bProvidersCount || 0 },
        ].map((item, idx) => (
          <Link key={idx} href={item.href}>
            <div className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">{item.label}</span>
              <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-xs">
                {item.count}
              </Badge>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Applications Pipeline */}
      <Card className="bg-[#0d1526] border-white/10 text-white">
        <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Live Application Stream</CardTitle>
          <Link href="/application-manager/applications" className="text-xs text-blue-400 hover:underline">
            View full pipeline →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 bg-white/5">
                  <th className="p-3 font-medium">App Code</th>
                  <th className="p-3 font-medium">Student</th>
                  <th className="p-3 font-medium">University</th>
                  <th className="p-3 font-medium">Course</th>
                  <th className="p-3 font-medium">Source</th>
                  <th className="p-3 font-medium">Stage</th>
                  <th className="p-3 font-medium">Safe Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No applications recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentApps.map(app => (
                    <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-blue-400">{app.applicationCode || app.id.substring(0, 10)}</td>
                      <td className="p-3 font-medium text-white">{app.student?.name || app.studentId}</td>
                      <td className="p-3 text-gray-300">{app.universityName}</td>
                      <td className="p-3 text-xs text-gray-300">{app.courseName}</td>
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
