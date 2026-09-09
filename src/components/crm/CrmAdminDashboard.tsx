'use client';

import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  FileText,
  DollarSign,
  Plus,
  ShieldAlert,
  Settings,
  ClipboardList,
  Activity,
  UserPlus,
  UserCog,
  ScrollText,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  GraduationCap,
  Plane,
  Briefcase,
  Building2,
  Globe,
  CheckCircle2,
  Stethoscope,
  BarChart3,
} from 'lucide-react';

// ── Mock Data ──────────────────────────────────────────────

const funnelStages = [
  { label: 'Leads', count: 2460, pct: '100%', color: 'bg-alo-brand', width: '100%' },
  { label: 'Counseling', count: 1480, pct: '60.2%', color: 'bg-[#0369a1]', width: '85%' },
  { label: 'Applications', count: 810, pct: '32.9%', color: 'bg-[#0e7490]', width: '65%' },
  { label: 'Offers', count: 523, pct: '21.3%', color: 'bg-emerald-500', width: '45%' },
  { label: 'Enrolled', count: 387, pct: '15.7%', color: 'bg-emerald-600', width: '30%' },
];

const recentActivity = [
  { event: 'New student registered — Arif Rahman', time: '5 min ago', icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' },
  { event: 'Application submitted — University of Manchester', time: '12 min ago', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { event: 'Visa approved — Mitu Sarkar (Canada)', time: '30 min ago', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  { event: 'SLA escalation — Tanvir Ahmed (6h+ wait)', time: '45 min ago', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
  { event: 'New partner registered — Stellar Education', time: '1 hour ago', icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
  { event: 'Employee attendance marked — Dhaka Branch', time: '2 hours ago', icon: UserCheck, color: 'text-sky-600 bg-sky-50' },
  { event: 'Commission payout processed — ৳4,20,000', time: '3 hours ago', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
  { event: 'Document expired — Nusrat Jahan passport', time: '4 hours ago', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
];

const departments = [
  { name: 'Counseling', employees: 14, activeTasks: 67, icon: Stethoscope },
  { name: 'Marketing', employees: 8, activeTasks: 34, icon: BarChart3 },
  { name: 'Operations', employees: 7, activeTasks: 29, icon: Settings },
  { name: 'Finance', employees: 5, activeTasks: 18, icon: DollarSign },
  { name: 'IT & Support', employees: 4, activeTasks: 22, icon: Globe },
];

const alerts = [
  { message: '3 SLA escalations pending review', severity: 'high' as const, action: 'Review Now' },
  { message: '2 student documents have expired', severity: 'medium' as const, action: 'View Details' },
  { message: '1 partner pending approval', severity: 'low' as const, action: 'Review Partner' },
];

// ── Helpers ────────────────────────────────────────────────

function alertStyle(severity: 'high' | 'medium' | 'low') {
  switch (severity) {
    case 'high':
      return { border: 'border-red-200 bg-red-50', badge: <Badge variant="danger" className="text-[10px]">High</Badge> };
    case 'medium':
      return { border: 'border-amber-200 bg-amber-50', badge: <Badge variant="warning" className="text-[10px]">Medium</Badge> };
    case 'low':
      return { border: 'border-alo-brand/20 bg-alo-brand-light/30', badge: <Badge variant="brand" className="text-[10px]">Low</Badge> };
  }
}

// ── Component ──────────────────────────────────────────────

export default function CrmAdminDashboard() {
  const { user } = usePortalStore();

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">System Overview</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="danger" className="text-[11px]">
              <ShieldAlert className="w-3 h-3 mr-1" />Super Admin
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-sm text-alo-text-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4" /> Reports
          </Button>
          <Button variant="brand" size="sm">
            <Plus className="w-4 h-4" /> Quick Add
          </Button>
        </div>
      </div>

      {/* ── KPI Row (5 cols) ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Students */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-5 h-5 text-alo-brand" />
              <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium">
                <ArrowUpRight className="w-3 h-3" />+23
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">1,247</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Total Students</p>
            <p className="text-[11px] text-alo-text-muted">+23 this month</p>
          </CardContent>
        </Card>

        {/* Active Applications */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-alo-brand" />
              <span className="text-[11px] text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded">
                12 overdue
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">483</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Active Applications</p>
            <p className="text-[11px] text-alo-text-muted">Processing this cycle</p>
          </CardContent>
        </Card>

        {/* Visa Success Rate */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Plane className="w-5 h-5 text-alo-brand" />
              <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium">
                <ArrowUpRight className="w-3 h-3" />+1.3%
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">94.2%</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Visa Success Rate</p>
            <Progress value={94.2} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        {/* Revenue Monthly */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-alo-brand" />
              <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium">
                <ArrowUpRight className="w-3 h-3" />+8%
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">৳12.5L</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Revenue (Monthly)</p>
            <p className="text-[11px] text-alo-text-muted">vs last month</p>
          </CardContent>
        </Card>

        {/* Active Employees */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-alo-brand" />
              <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                4 on leave
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">38</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Active Employees</p>
            <p className="text-[11px] text-alo-text-muted">Across all branches</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Content Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (col-span-2) ─────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversion Funnel Card */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text">Conversion Funnel</CardTitle>
                <span className="text-xs text-alo-text-muted">Last 90 days</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {funnelStages.map((stage, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-28 shrink-0 text-right">
                      <p className="text-sm font-medium text-alo-text">{stage.label}</p>
                    </div>
                    <div className="flex-1">
                      <div className="relative h-9 rounded-lg bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full ${stage.color} rounded-lg flex items-center justify-end pr-3 transition-all duration-500`}
                          style={{ width: stage.width }}
                        >
                          <span className="text-xs font-bold text-white">{stage.count.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-14 shrink-0 text-right">
                      <span className="text-xs font-semibold text-alo-text-secondary">{stage.pct}</span>
                    </div>
                  </div>
                ))}
                {/* Conversion rate summary */}
                <div className="flex items-center gap-2 pt-2 px-32">
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-alo-text-muted">
                    Overall conversion: <span className="font-semibold text-alo-text">15.7%</span> (Lead → Enrolled)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-alo-brand">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-alo-border" />
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="relative flex items-start gap-3 pl-1 py-2.5 px-3 rounded-lg hover:bg-alo-brand-light/20 transition-colors">
                      <div className={`relative z-10 mt-0.5 w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 ${item.color}`}>
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-alo-text leading-snug">{item.event}</p>
                        <p className="text-[11px] text-alo-text-muted mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column (col-span-1) ────────────────────── */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="brand" className="w-full justify-start text-sm">
                  <UserPlus className="w-4 h-4" /> Create Employee
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <UserCog className="w-4 h-4" /> Manage Roles
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <ScrollText className="w-4 h-4" /> View Audit Logs
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Settings className="w-4 h-4" /> System Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Department Summary */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text">Departments</CardTitle>
                <Badge variant="muted" className="text-[11px]">5 total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {departments.map((dept, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-alo-brand-light/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-alo-brand-light flex items-center justify-center shrink-0">
                        <dept.icon className="w-4 h-4 text-alo-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-alo-text truncate">{dept.name}</p>
                        <p className="text-[11px] text-alo-text-muted">{dept.employees} employees</p>
                      </div>
                    </div>
                    <Badge variant="muted" className="text-[11px] shrink-0">{dept.activeTasks} tasks</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts Card */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Alerts
                </CardTitle>
                <Badge variant="danger" className="text-[11px]">3</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, i) => {
                  const style = alertStyle(alert.severity);
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-lg border ${style.border}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {style.badge}
                        <p className="text-xs text-alo-text truncate">{alert.message}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[11px] text-alo-brand shrink-0 ml-2">
                        {alert.action}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}