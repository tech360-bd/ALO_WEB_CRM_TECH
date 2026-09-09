'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  GraduationCap, BookOpen, Award, Calendar, Clock,
  ArrowUpRight, Upload, Database, ChevronRight, CheckCircle2,
  XCircle, Eye, FileSpreadsheet, Plus, Loader2
} from 'lucide-react';

const iconMap: Record<string, any> = {
  GraduationCap, BookOpen, Award, Calendar, Clock, FileSpreadsheet
};

export default function DataManagerDashboard() {
  const { user, token } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/data/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-alo-brand" /></div>;
  }

  const { approvalQueue = [], importHistory = [], topCountries = [], kpis = [] } = data || {};

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Data Manager Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><Database className="w-3 h-3 mr-1" />Data Manager</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Upload className="w-4 h-4" /> Import CSV</Button>
          <Button variant="brand" size="sm"><Plus className="w-4 h-4" /> Add Entry</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi: any) => {
          const Icon = iconMap[kpi.icon] || Database;
          return (
            <Card key={kpi.label} className="bg-white rounded-xl border border-alo-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-alo-brand" />
                  <span className={`inline-flex items-center text-[11px] font-medium ${kpi.up ? 'text-emerald-600' : 'text-red-600'}`}>
                    {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-90 text-red-600" />}{kpi.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-alo-text">{kpi.value}</p>
                <p className="text-xs text-alo-text-muted mt-0.5">{kpi.label}</p>
                <p className="text-[11px] text-alo-text-muted">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Data Approval Queue */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Clock className="w-4 h-4 text-alo-brand" /> Data Approval Queue
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">{approvalQueue.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Type</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Name</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Submitted By</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Date</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvalQueue.map((a: any, idx: number) => (
                      <TableRow key={a.name + idx}>
                        <TableCell><Badge variant="muted" className="text-[10px]">{a.type}</Badge></TableCell>
                        <TableCell className="text-sm font-medium text-alo-text">{a.name}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary">{a.submittedBy}</TableCell>
                        <TableCell className="text-sm text-alo-text-muted text-right">{a.date}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="brand" size="sm" className="text-[10px] h-6 px-2">Approve</Button>
                            <Button variant="outline" size="sm" className="text-[10px] h-6 px-2">Review</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Country/University Stats */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-alo-brand" /> University &amp; Course Stats by Country
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Country</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Universities</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Courses</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Intakes</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Scholarships</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCountries.map((c) => (
                      <TableRow key={c.country}>
                        <TableCell className="text-sm font-medium text-alo-text">{c.country}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{c.universities}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{c.courses}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{c.intakes}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{c.scholarships}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Import Queue / History */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-alo-brand" /> Import History
                </CardTitle>
                <Badge variant="muted" className="text-[11px]">{importHistory.length} files</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {importHistory.map((f) => (
                  <div key={f.file} className="flex items-center justify-between p-2.5 rounded-lg border border-alo-border hover:bg-alo-brand-light/20 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-alo-text truncate">{f.file}</p>
                      <p className="text-[11px] text-alo-text-muted">{f.records} records · {f.by} · {f.date}</p>
                    </div>
                    {f.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 ml-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="w-full justify-start text-sm"><GraduationCap className="w-4 h-4" /> Add University</Button>
                <Button variant="outline" className="w-full justify-start text-sm"><BookOpen className="w-4 h-4" /> Add Course</Button>
                <Button variant="outline" className="w-full justify-start text-sm"><Award className="w-4 h-4" /> Add Scholarship</Button>
                <Button variant="brand" className="w-full justify-start text-sm"><Upload className="w-4 h-4" /> Bulk Import CSV</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}