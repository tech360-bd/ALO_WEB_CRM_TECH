'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Users, UserCheck, UserX, Clock, DollarSign, ShieldAlert,
  ArrowUpRight, ChevronRight, Calendar, Briefcase, AlertTriangle,
  Plus, Building2, Loader2
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Users, UserCheck, UserX, Clock, DollarSign, ShieldAlert, Calendar
};

export default function HrDashboard() {
  const { user, token } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/hr/dashboard', {
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

  const { employeeDirectory = [], leaveRequests = [], departments = [], salaryStatus = [], kpis = [] } = data || {};

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">HR Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><Users className="w-3 h-3 mr-1" />HR Manager</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Calendar className="w-4 h-4" /> Leave Calendar</Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Plus className="w-4 h-4" /> Add Employee</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi: any) => {
          const Icon = iconMap[kpi.icon] || Users;
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
          {/* Employee Directory */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Users className="w-4 h-4 text-alo-brand" /> Employee Directory
                </CardTitle>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-xs text-alo-brand">View All <ChevronRight className="w-3.5 h-3.5" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Name</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Role</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Department</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Branch</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeDirectory.map((e: any, idx: number) => (
                      <TableRow key={e.name + idx}>
                        <TableCell className="text-sm font-medium text-alo-text">{e.name}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary">{e.role}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary">{e.dept}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary">{e.branch}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={e.status === 'present' ? 'success' : e.status === 'leave' ? 'warning' : 'danger'} className="text-[11px]">
                            {e.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Department Breakdown */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-alo-brand" /> Department Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {departments.map((d) => (
                  <div key={d.name} className="flex items-center gap-4">
                    <div className="w-28 shrink-0 text-right">
                      <p className="text-sm font-medium text-alo-text">{d.name}</p>
                    </div>
                    <div className="flex-1">
                      <div className="relative h-7 rounded-lg bg-[var(--alo-surface-muted)] overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-l-lg" style={{ width: `${(d.present / d.headcount) * 100}%` }} />
                        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-alo-text">
                          {d.present} present / {d.onLeave} leave
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-alo-text-secondary w-16 text-right">{d.headcount} total</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Leave Requests */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-alo-brand" /> Leave Requests
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">3 pending</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {leaveRequests.map((l) => (
                  <div key={l.employee} className="p-2.5 rounded-lg border border-alo-border hover:bg-alo-brand-light/20 transition-colors">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-alo-text">{l.employee}</p>
                      <Badge variant={l.status === 'approved' ? 'success' : 'warning'} className="text-[11px]">{l.status}</Badge>
                    </div>
                    <p className="text-[11px] text-alo-text-muted">{l.type} · {l.from} to {l.to} ({l.days}d)</p>
                    {l.status === 'pending' && (
                      <div className="flex gap-1 mt-1.5">
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm" className="text-[11px] h-6 px-2">Approve</Button>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="text-[11px] h-6 px-2">Reject</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Salary Status */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-alo-brand" /> Salary Status
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { month: 'December 2024', status: 'processing', amount: '৳18.5L' },
                  { month: 'November 2024', status: 'paid', amount: '৳18.2L' },
                  { month: 'October 2024', status: 'paid', amount: '৳17.8L' },
                ].map((s) => (
                  <div key={s.month} className="flex items-center justify-between p-2.5 rounded-lg border border-alo-border">
                    <div>
                      <p className="text-sm font-medium text-alo-text">{s.month}</p>
                      <p className="text-[11px] text-alo-text-muted">{s.amount}</p>
                    </div>
                    <Badge variant={s.status === 'paid' ? 'success' : 'warning'} className="text-[11px]">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}