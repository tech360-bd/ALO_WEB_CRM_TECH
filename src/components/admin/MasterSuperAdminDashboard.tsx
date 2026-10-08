'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ShieldCheck, Lock, Users, Package, Award, Sparkles, AlertCircle, CheckCircle2,
  Sliders, Database, Key, Search, Globe, Building2, UserCheck, Eye, LogOut,
  RefreshCw, FileText, AlertTriangle, ShieldAlert, Cpu, Bot, CheckSquare, XCircle, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import AgentRegistry from '@/components/crm/agentos/AgentRegistry';
import AICommandingCenter from './AICommandingCenter';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

export default function MasterSuperAdminDashboard() {
  const router = useRouter();
  const { user, token, setView } = usePortalStore();

  // Acting-As State
  const [actingAsRole, setActingAsRole] = useState<string | null>(null);
  const [actingAsName, setActingAsName] = useState<string | null>(null);

  // Active Tab View State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'employees' | 'permissions' | 'branches' | 'countries' | 'ai-command' | 'approval' | 'security' | 'reports' | 'audit' | 'settings'
  >('overview');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [lockdownActive, setLockdownActive] = useState(false);

  // Data States
  const [metrics, setMetrics] = useState({
    totalStudents: 1420,
    newStudentsToday: 18,
    englishOnlyStudents: 310,
    totalLeadsToday: 64,
    unassignedLeads: 9,
    activeApps: 480,
    submittedApps: 210,
    offerStageApps: 140,
    visaStageApps: 95,
    activePartners: 38,
    pendingPartners: 4,
    totalEmployees: 42,
    activeEmployeesToday: 35,
    suspendedEmployees: 2,
    counselorFollowupsDue: 28,
    marketingLeadsToday: 42,
    pendingSocialReplies: 14,
    visaCases: 95,
    highRiskVisaCases: 6,
    mockTestsToday: 24,
    financePendingInvoices: 12,
    hrLeaveRequests: 3,
    aiJobsRunning: 8,
    aiPendingApprovals: 5,
  });

  // Mock Employee List
  const [employees, setEmployees] = useState([
    { id: 'emp-1', code: 'ALO-EMP-20250001', name: 'Al Aminn', role: 'Senior Counselor', dept: 'Counseling', branch: 'Dhaka Main', status: 'active', activity: 'Active (2m ago)' },
    { id: 'emp-2', code: 'ALO-EMP-20250002', name: 'Rafiqul Islam', role: 'Marketing Manager', dept: 'Marketing', branch: 'Dhaka Main', status: 'active', activity: 'Active (5m ago)' },
    { id: 'emp-3', code: 'ALO-EMP-20250003', name: 'Nusrat Jahan', role: 'Visa Officer', dept: 'Visa & Compliance', branch: 'Dhaka Main', status: 'active', activity: 'Active (12m ago)' },
    { id: 'emp-4', code: 'ALO-EMP-20250004', name: 'Siddiqur Rahman', role: 'Application Manager', dept: 'Applications', branch: 'Sylhet Branch', status: 'active', activity: 'Active (1h ago)' },
    { id: 'emp-5', code: 'ALO-EMP-20250005', name: 'Tanjila Ahmed', role: 'Finance Officer', dept: 'Finance', branch: 'Dhaka Main', status: 'active', activity: 'Active (30m ago)' },
  ]);

  // Start Acting-As Mode
  const handleStartActingAs = (role: string, name: string, targetView: any) => {
    setActingAsRole(role);
    setActingAsName(name);
    toast.info(`SUPER_ADMIN now acting as ${role} (${name}). All actions audited.`);
    setView(targetView);
  };

  // Exit Acting-As Mode
  const handleExitActingAs = () => {
    setActingAsRole(null);
    setActingAsName(null);
    toast.success('Exited Acting-As mode. Returned to Super Admin Control.');
    setView('crm-dashboard');
  };

  // Toggle Emergency Lockdown
  const handleToggleLockdown = () => {
    const nextState = !lockdownActive;
    setLockdownActive(nextState);
    if (nextState) {
      toast.error('EMERGENCY LOCKDOWN ACTIVATED! Non-admin access restricted.', { duration: 5000 });
    } else {
      toast.success('Emergency lockdown disengaged. System operating normally.');
    }
  };

  return (
    <div className="space-y-6 bg-slate-50/50 min-h-screen p-4 lg:p-6 text-slate-900 font-sans">
      <DashboardCommunicationWidget role="SUPER_ADMIN" unreadCount={null} slaOverdueCount={null} onNavigateToInbox={() => router.push('/crm/communications/inbox')} />
      {/* ACTING-AS BANNER */}
      {actingAsRole && (
        <div className="bg-amber-500 text-slate-950 p-3.5 rounded-xl shadow-md flex items-center justify-between font-bold text-xs border border-amber-600">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>Super Admin Acting As: <strong>{actingAsRole}</strong> ({actingAsName}) — Audit Logging Enabled</span>
          </div>
          <Button size="sm" className="h-7 text-xs bg-slate-950 hover:bg-slate-900 text-amber-400 font-semibold" onClick={handleExitActingAs}>
            Exit Acting-As Mode
          </Button>
        </div>
      )}

      {/* SUPER ADMIN HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
            <h1 className="text-xl font-extrabold tracking-tight text-white">Welcome back, Super Admin</h1>
            <Badge className="bg-orange-500 text-white font-mono text-[10px]">SUPER_ADMIN</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central Operating Brain • {metrics.totalStudents} Active Students • {metrics.activeApps} Applications • {metrics.activeEmployeesToday}/{metrics.totalEmployees} Employees Active
          </p>
        </div>

        {/* Global Search & Lockdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Global Search (Student, ID, App...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 bg-slate-800 text-xs text-white placeholder-slate-400 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500 w-48 sm:w-64"
            />
          </div>

          <Button
            size="sm"
            className={`h-8 text-xs font-bold ${lockdownActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700'}`}
            onClick={handleToggleLockdown}
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            {lockdownActive ? 'Lockdown ACTIVE' : 'Emergency Lockdown'}
          </Button>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200" onClick={() => setActiveTab('employees')}>
          <Users className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Employee Control
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200" onClick={() => setActiveTab('permissions')}>
          <Key className="w-3.5 h-3.5 mr-1 text-purple-600" /> Permission Matrix
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200" onClick={() => setActiveTab('ai-command')}>
          <Bot className="w-3.5 h-3.5 mr-1 text-orange-600" /> AI Command Center (2000 Agents)
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200" onClick={() => setActiveTab('branches')}>
          <Building2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Branch Control
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200" onClick={() => setActiveTab('countries')}>
          <Globe className="w-3.5 h-3.5 mr-1 text-blue-600" /> Country Operations
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200" onClick={() => setActiveTab('approval')}>
          <CheckSquare className="w-3.5 h-3.5 mr-1 text-amber-600" /> Approval Center ({metrics.aiPendingApprovals})
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-200" onClick={() => setActiveTab('reports')}>
          <FileText className="w-3.5 h-3.5 mr-1 text-teal-600" /> Global Reports
        </Button>
      </div>

      {/* 12 TOP KPI CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Card className="bg-white border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">1. Total Students</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.totalStudents}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">+{metrics.newStudentsToday} today • {metrics.englishOnlyStudents} English-only</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">2. Total Leads</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{metrics.totalLeadsToday}</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">{metrics.unassignedLeads} unassigned</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">3. Active Applications</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.activeApps}</p>
            <p className="text-[10px] text-slate-500 mt-1">{metrics.submittedApps} submitted • {metrics.visaStageApps} visa stage</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">4. Partner Network</p>
            <p className="text-xl font-bold text-purple-600 mt-0.5">{metrics.activePartners}</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">{metrics.pendingPartners} pending approvals</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">5. Employees</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.totalEmployees}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">{metrics.activeEmployeesToday} active today</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">6. Counselor Performance</p>
            <p className="text-xl font-bold text-teal-600 mt-0.5">84.2%</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">{metrics.counselorFollowupsDue} follow-ups due</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">7. Marketing Performance</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">3.4x ROI</p>
            <p className="text-[10px] text-slate-500 mt-1">{metrics.marketingLeadsToday} leads today</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">8. Visa Operations</p>
            <p className="text-xl font-bold text-blue-600 mt-0.5">{metrics.visaCases}</p>
            <p className="text-[10px] text-red-600 font-semibold mt-1">{metrics.highRiskVisaCases} high-risk reviews</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">9. English Test System</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.mockTestsToday}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">Mocks taken today</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">10. Finance</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">৳12.4M</p>
            <p className="text-[10px] text-slate-500 mt-1">{metrics.financePendingInvoices} invoices pending</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">11. HR &amp; Attendance</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">94% Present</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">{metrics.hrLeaveRequests} leave requests</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3.5">
            <p className="text-[11px] font-medium text-slate-500">12. AI Command Center</p>
            <p className="text-xl font-bold text-orange-600 mt-0.5">{metrics.aiJobsRunning} Jobs</p>
            <p className="text-[10px] text-purple-600 font-semibold mt-1">2000 Agents Ready</p>
          </CardContent>
        </Card>
      </div>

      {/* DASHBOARD LAUNCHER GRID (Access Every Role Dashboard) */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Role Dashboard Launcher (Super Admin Passwordless Access)</span>
            <Badge className="bg-slate-100 text-slate-700 text-[10px]">14 Dashboards Available</Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Open any employee role dashboard directly. Actions are logged as <code className="text-indigo-600 font-mono">SUPER_ADMIN acting_as ROLE</code> without revealing passwords.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            <Button variant="outline" className="h-16 flex-col items-center justify-center p-2 text-xs bg-slate-50 hover:bg-slate-100 border-slate-200" onClick={() => handleStartActingAs('Counselor', 'Al Aminn', 'crm-dashboard')}>
              <span className="font-bold text-slate-800">Counselor</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Leads &amp; Students</span>
            </Button>

            <Button variant="outline" className="h-16 flex-col items-center justify-center p-2 text-xs bg-indigo-50/50 hover:bg-indigo-100/50 border-indigo-200" onClick={() => handleStartActingAs('Marketing Manager', 'Rafiqul Islam', 'crm-marketing')}>
              <span className="font-bold text-indigo-900">Marketing Manager</span>
              <span className="text-[9px] text-indigo-600 mt-0.5">Social &amp; Campaigns</span>
            </Button>

            <Button variant="outline" className="h-16 flex-col items-center justify-center p-2 text-xs bg-blue-50/50 hover:bg-blue-100/50 border-blue-200" onClick={() => handleStartActingAs('Visa Officer', 'Nusrat Jahan', 'crm-visa-dashboard')}>
              <span className="font-bold text-blue-900">Visa Officer</span>
              <span className="text-[9px] text-blue-600 mt-0.5">Cases &amp; Mock Studio</span>
            </Button>

            <Button variant="outline" className="h-16 flex-col items-center justify-center p-2 text-xs bg-emerald-50/50 hover:bg-emerald-100/50 border-emerald-200" onClick={() => handleStartActingAs('Application Team', 'Siddiqur Rahman', 'crm-applications')}>
              <span className="font-bold text-emerald-900">Application Team</span>
              <span className="text-[9px] text-emerald-600 mt-0.5">Uni Applications</span>
            </Button>

            <Button variant="outline" className="h-16 flex-col items-center justify-center p-2 text-xs bg-purple-50/50 hover:bg-purple-100/50 border-purple-200" onClick={() => handleStartActingAs('Finance Officer', 'Tanjila Ahmed', 'crm-finance')}>
              <span className="font-bold text-purple-900">Finance Officer</span>
              <span className="text-[9px] text-purple-600 mt-0.5">Invoices &amp; Comms</span>
            </Button>

            <Button variant="outline" className="h-16 flex-col items-center justify-center p-2 text-xs bg-amber-50/50 hover:bg-amber-100/50 border-amber-200" onClick={() => handleStartActingAs('HR Manager', 'HR Lead', 'crm-hrm')}>
              <span className="font-bold text-amber-900">HR Manager</span>
              <span className="text-[9px] text-amber-600 mt-0.5">Staff &amp; Payroll</span>
            </Button>

            <Button variant="outline" className="h-16 flex-col items-center justify-center p-2 text-xs bg-orange-50/50 hover:bg-orange-100/50 border-orange-200" onClick={() => handleStartActingAs('Branch Manager', 'Dhaka Lead', 'crm-dashboard')}>
              <span className="font-bold text-orange-900">Branch Manager</span>
              <span className="text-[9px] text-orange-600 mt-0.5">Branch Ops</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SECTION TABS: EMPLOYEE CONTROL / PERMISSIONS / AI COMMAND */}
      {activeTab === 'employees' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Employee Control Center</CardTitle>
              <CardDescription className="text-xs text-slate-500">View and manage all ALO employees, switch acting-as role, or grant cross-department permissions.</CardDescription>
            </div>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
              + Add New Employee
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Employee ID / Name</TableHead>
                  <TableHead className="text-xs font-semibold">Designation</TableHead>
                  <TableHead className="text-xs font-semibold">Department</TableHead>
                  <TableHead className="text-xs font-semibold">Branch</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="font-bold text-xs text-slate-900">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{emp.code}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] bg-slate-50">{emp.role}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-600">{emp.dept}</TableCell>
                    <TableCell className="text-xs text-slate-600">{emp.branch}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">{emp.status.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-600 hover:bg-indigo-50" onClick={() => handleStartActingAs(emp.role, emp.name, 'crm-dashboard')}>
                        Act As Role
                      </Button>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-7 text-xs border-slate-200">
                        Permissions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* AI COMMAND CENTER (2000 PROTECTED AGENT NETWORK INTEGRATION) */}
      {activeTab === 'ai-command' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs bg-white border-slate-200"
              onClick={() => {
                const showReg = document.getElementById('agent-registry-container');
                const showCmd = document.getElementById('ai-command-container');
                if (showReg && showCmd) {
                  if (showReg.classList.contains('hidden')) {
                    showReg.classList.remove('hidden');
                    showCmd.classList.add('hidden');
                  } else {
                    showReg.classList.add('hidden');
                    showCmd.classList.remove('hidden');
                  }
                }
              }}
            >
              Toggle Agent Registry / Chat Console
            </Button>
          </div>
          <div id="ai-command-container">
            <AICommandingCenter />
          </div>
          <div id="agent-registry-container" className="hidden">
            <AgentRegistry />
          </div>
        </div>
      )}
    </div>
  );
}
