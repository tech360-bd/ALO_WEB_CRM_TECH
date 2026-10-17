'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Users,
  Building,
  Sparkles,
  Ticket,
  Sliders,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Lock,
  Eye,
  Settings,
  Mail,
  UserCheck,
  AlertTriangle,
  FileText,
  Clock,
  Key,
  ShieldAlert,
  Database,
  ArrowRight,
  Briefcase,
  Layers,
  MapPin,
  Home,
  ClipboardList,
  FileSignature,
  Calendar,
  Wallet,
  Smartphone,
  LogIn,
  Bug,
  ArrowLeftRight,
  Activity,
  Zap,
  Download,
  GraduationCap,
  MessageSquare,
  CreditCard,
  Mic,
  BarChart3,
  Bell,
  Workflow,
  Shield,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

const DESIGNATIONS = [
  'Chairman','CEO','Director','Office Manager','Country Manager','Counselor','Senior Counselor','Application Manager','Application Team','Visa Officer','Finance','Marketing','Front Desk','HR','Support','Viewer','Custom'
];

const TABS = [
  { id: 'employees', label: 'Employees', icon: Users, countKey: 'employees' },
  { id: 'org', label: 'Org Structure', icon: Building },
  { id: 'designations', label: 'Designations', icon: Briefcase },
  { id: 'packages', label: 'Permission Packages', icon: Layers },
  { id: 'permissions', label: 'Granular Permissions', icon: Sliders },
  { id: 'sections', label: 'Access Control Sections', icon: ShieldCheck },
  { id: 'requests', label: 'Permission Requests', icon: ClipboardList },
  { id: 'temporary', label: 'Temporary Access', icon: Clock },
  { id: 'breakglass', label: 'Break Glass', icon: ShieldAlert },
  { id: 'documents', label: 'Document Center', icon: FileText },
  { id: 'agreements', label: 'Agreement Center', icon: FileSignature },
  { id: 'attendance', label: 'Attendance', icon: Calendar },
  { id: 'leave', label: 'Leave Mgmt', icon: Calendar },
  { id: 'payroll', label: 'Payroll', icon: Wallet },
  { id: 'devices', label: 'Devices & Login', icon: Smartphone },
  { id: 'security', label: 'Security Events', icon: Bug },
  { id: 'reassignments', label: 'Reassignments', icon: ArrowLeftRight },
  { id: 'audit', label: 'Audit Logs', icon: Activity },
  { id: 'feature', label: 'Feature Access', icon: Zap },
  { id: 'quota', label: 'Quota Engine', icon: Database },
  { id: 'workflow', label: 'Workflows', icon: Workflow },
  { id: 'offer', label: 'Offer Letters', icon: GraduationCap },
  { id: 'interview', label: 'Interview Prep', icon: Mic },
  { id: 'comments', label: 'Comments (2 Systems)', icon: MessageSquare },
  { id: 'payments', label: 'Payments & Bank', icon: CreditCard },
  { id: 'analytics', label: 'HR Analytics', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications & SLA', icon: Bell },
];

export default function SuperAdminAccessControlCenter() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [permRequests, setPermRequests] = useState<any[]>([]);
  const [tempPerms, setTempPerms] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [featureRules, setFeatureRules] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Modals
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpDesignation, setNewEmpDesignation] = useState('Counselor');
  const [newEmpDepartment, setNewEmpDepartment] = useState('Counseling');
  const [newEmpBranch, setNewEmpBranch] = useState('Dhaka Main');
  const [newEmpRole, setNewEmpRole] = useState('employee');
  const [creatingEmp, setCreatingEmp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchControlData = async () => {
    try {
      setLoading(true);
      const [controlRes, empRes, deptRes, branchRes, officeRes, permReqRes, tempRes, auditRes, secRes, featRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/access-control-center').then(r => r.json().catch(() => null)),
        fetch('/api/employee-access/employee-directory').then(r => r.json().catch(() => ({ employees: [] }))),
        fetch('/api/employee-access/departments').then(r => r.json().catch(() => ({ departments: [] }))),
        fetch('/api/employee-access/branches').then(r => r.json().catch(() => ({ branches: [] }))),
        fetch('/api/employee-access/offices').then(r => r.json().catch(() => ({ offices: [] }))),
        fetch('/api/employee-access/permission-requests').then(r => r.json().catch(() => ({ requests: [] }))),
        fetch('/api/employee-access/temporary-permissions').then(r => r.json().catch(() => ({ permissions: [] }))),
        fetch('/api/employee-access/audit-logs').then(r => r.json().catch(() => ({ logs: [] }))),
        fetch('/api/employee-access/security-events').then(r => r.json().catch(() => ({ events: [] }))),
        fetch('/api/employee-access/feature-access').then(r => r.json().catch(() => ({ rules: [] }))),
        fetch('/api/employee-access/analytics').then(r => r.json().catch(() => null)),
      ]);
      setData(controlRes);
      setEmployees(empRes.employees || []);
      setDepartments(deptRes.departments || []);
      setBranches(branchRes.branches || []);
      setOffices(officeRes.offices || []);
      setPermRequests(permReqRes.requests || []);
      setTempPerms(tempRes.permissions || []);
      setAuditLogs(auditRes.logs || auditRes.portalLogs || []);
      setSecurityEvents(secRes.events || []);
      setFeatureRules(featRes.rules || []);
      setAnalytics(analyticsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchControlData(); }, []);

  const handleCreateEmployee = async () => {
    if (!newEmpName || !newEmpEmail) { toast.error('Name and company email required'); return; }
    setCreatingEmp(true);
    try {
      const res = await fetch('/api/admin/employees/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: newEmpName, companyEmail: newEmpEmail, phone: newEmpPhone, designation: newEmpDesignation, department: newEmpDepartment, office: newEmpBranch, role: newEmpRole }),
      });
      const json = await res.json();
      if (res.ok) {
        if (json.emailSent) {
          toast.success(`Employee ${json.data.employeeCode} created. Activation email accepted by SMTP; delivery to inbox is not verified.`);
        } else {
          toast.error(`Employee ${json.data.employeeCode} created, but SMTP did not accept the activation email. Use the authenticated resend workflow after correcting SMTP.`);
        }
        setShowEmpModal(false); setNewEmpName(''); setNewEmpEmail(''); fetchControlData();
      } else toast.error(json.error || 'Failed');
    } finally { setCreatingEmp(false); }
  };

  const handleStatusChange = async (empId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/employees/${empId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { toast.success(`Status → ${newStatus.toUpperCase()} — login/sessions/tokens/WhatsApp/social/email/AI/device revoked, history preserved`); fetchControlData(); }
    } catch { toast.error('Failed'); }
  };

  const filteredEmployees = employees.filter((e: any) => !searchQuery || e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || e.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0057B8]" />
        <p>Loading ALO Enterprise Master Access Control Center v3.0 — 18 new models, 40+ APIs, centralized ROLE+DESIGNATION+PERMISSION+SCOPE+OBJECT+FIELD+WORKFLOW+APPROVAL+QUOTA+TEMPORARY+AUDIT...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      {/* MASTER HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 rounded-2xl text-white shadow-xl border border-blue-900/30">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#E8501A] text-white font-black text-[10px] uppercase px-2.5 py-1">MASTER CONTROL CENTER</Badge>
            <Badge className="bg-blue-800 text-blue-100 font-mono text-[10px]">ALO_EMPLOYEE_ACCESS_SYSTEM v3.0</Badge>
            <Badge className="bg-emerald-900 text-emerald-100 text-[10px]">LEAST PRIVILEGE</Badge>
            <Badge className="bg-amber-900 text-amber-100 text-[10px]">18 MODELS • 40+ APIs</Badge>
          </div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#FFB347]" /> Master Access Control & HR Security System
          </h1>
          <p className="text-[11px] text-blue-200 max-w-4xl leading-relaxed">
            Centralized ROLE+DESIGNATION+PERMISSION+SCOPE+OBJECT+FIELD+WORKFLOW+APPROVAL+QUOTA+TEMPORARY+AUDIT — Employee INVITED→ACTIVE hashed one-time token expiry, private visibility Employee+SuperAdmin+Chairman+HR explicit, document versioning V1/V2/V3 no permanent delete, HR agreement digital signature immutable, ACCEPT vs APPROVE separation, Separation of Duties MAKER→REVIEWER→APPROVER no self-approval, temporary auto-revoke, break-glass reason/approver/expiry audit, payroll AI cannot finalize high-risk, login IP/browser/OS/fingerprint/location/time/failed/session/MFA/rate limiting/suspicious, WhatsApp phone_normalized, SLA reminder/warning/escalation, application serial ALO-UK-2026-000123, two comment systems student-visible vs internal never shown, university payment verified bank, interview research/prep/practice/scoring/recording/human final review.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button onClick={() => setShowEmpModal(true)} className="bg-[#E8501A] hover:bg-[#C93D13] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Employee — Secure Activation
          </Button>
          <Button onClick={fetchControlData} variant="outline" className="bg-white/10 border-white/20 text-white text-xs rounded-xl"><RefreshCw className="w-3 h-3 mr-1" /> Refresh</Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <Card className="p-3 bg-white border rounded-xl"><div className="text-[10px] font-bold text-slate-500 uppercase">Total Employees</div><div className="text-lg font-black text-slate-900">{analytics?.summary?.totalEmployees ?? employees.length}</div></Card>
        <Card className="p-3 bg-emerald-50 border-emerald-200 rounded-xl"><div className="text-[10px] font-bold text-emerald-700 uppercase">Active</div><div className="text-lg font-black text-emerald-900">{analytics?.summary?.activeEmployees ?? employees.filter((e:any)=>e.status==='active').length}</div></Card>
        <Card className="p-3 bg-amber-50 border-amber-200 rounded-xl"><div className="text-[10px] font-bold text-amber-700 uppercase">Pending Activation</div><div className="text-lg font-black text-amber-900">{analytics?.summary?.pendingActivation ?? 0}</div></Card>
        <Card className="p-3 bg-blue-50 border-blue-200 rounded-xl"><div className="text-[10px] font-bold text-blue-700 uppercase">Permission Requests</div><div className="text-lg font-black text-blue-900">{permRequests.length}</div></Card>
        <Card className="p-3 bg-purple-50 border-purple-200 rounded-xl"><div className="text-[10px] font-bold text-purple-700 uppercase">Temporary Access</div><div className="text-lg font-black text-purple-900">{tempPerms.length}</div></Card>
        <Card className="p-3 bg-red-50 border-red-200 rounded-xl"><div className="text-[10px] font-bold text-red-700 uppercase">Security Events</div><div className="text-lg font-black text-red-900">{securityEvents.length}</div></Card>
        <Card className="p-3 bg-slate-50 border-slate-200 rounded-xl"><div className="text-[10px] font-bold text-slate-700 uppercase">Audit Logs</div><div className="text-lg font-black text-slate-900">{auditLogs.length}</div></Card>
      </div>

      {/* TABS */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {TABS.map(tab => (
          <Button key={tab.id} variant={activeTab===tab.id ? 'default' : 'ghost'} onClick={()=>setActiveTab(tab.id)} className={`text-[11px] font-bold gap-1.5 rounded-xl whitespace-nowrap px-3 py-2 h-8 ${activeTab===tab.id ? 'bg-[#0057B8] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </Button>
        ))}
      </div>

      {/* EMPLOYEES */}
      {activeTab==='employees' && (
        <Card className="p-4 bg-white border rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-[#0057B8]" /> Employee Directory — Private Visibility: Employee+SuperAdmin+Chairman+HR explicit</h2>
            <div className="flex items-center gap-2">
              <div className="relative"><Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" /><Input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search name/email" className="pl-8 text-xs h-8 w-56" /></div>
              <Badge className="bg-blue-50 text-[#0057B8] text-xs">{filteredEmployees.length} staff</Badge>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead><tr className="bg-slate-50 text-slate-700 font-bold border-b"><th className="p-2.5">Employee ID / Name / Email</th><th className="p-2.5">Designation</th><th className="p-2.5">Department / Branch / Office</th><th className="p-2.5">Role / Package / Scope</th><th className="p-2.5">Status</th><th className="p-2.5">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp:any)=>(
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="p-2.5"><div className="font-bold text-slate-900">{emp.name}</div><div className="font-mono text-[10px] text-slate-500">{emp.employeeId || emp.employeeProfile?.employeeId} · {emp.email}</div><div className="text-[10px] text-slate-400">Code: {emp.employeeProfile?.employeeId || '—'}</div></td>
                    <td className="p-2.5 font-semibold">{emp.designation || emp.employeeProfile?.designation || 'Counselor'}</td>
                    <td className="p-2.5 text-slate-600"><div>{emp.department || emp.employeeProfile?.department} · {emp.branch || emp.employeeProfile?.branch}</div><div className="text-[10px] text-slate-400">Scope: {emp.scope || 'ASSIGNED'}</div></td>
                    <td className="p-2.5"><Badge className="bg-slate-100 text-slate-800 text-[9px] uppercase mr-1">{emp.role || emp.employeeProfile?.role || 'employee'}</Badge><Badge className="bg-purple-50 text-purple-700 text-[9px]">PKG: Standard</Badge></td>
                    <td className="p-2.5"><Badge className={emp.status==='active'?'bg-emerald-50 text-emerald-700 text-[9px] font-bold':'bg-amber-50 text-amber-700 text-[9px] font-bold'}>{emp.status?.toUpperCase()}</Badge><div className="text-[9px] text-slate-400 mt-1">INVITED→ACTIVE token hashed one-time expiry</div></td>
                    <td className="p-2.5"><div className="flex gap-1">{emp.status==='active'?<Button size="sm" variant="outline" onClick={()=>handleStatusChange(emp.id,'suspended')} className="text-[10px] h-6 px-2 text-red-600">Suspend</Button>:<Button size="sm" variant="outline" onClick={()=>handleStatusChange(emp.id,'active')} className="text-[10px] h-6 px-2 text-emerald-600">Activate</Button>}<Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="text-[10px] h-6 px-2"><Eye className="w-3 h-3" /></Button></div><div className="text-[8px] text-slate-400 mt-1">Revoke login/sessions/tokens/WhatsApp/social/email/AI/device preserve history</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab==='org' && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white border rounded-2xl space-y-3"><h3 className="font-bold text-xs flex items-center gap-2"><Building className="w-4 h-4 text-[#0057B8]" /> Departments ({departments.length})</h3><div className="space-y-2 max-h-96 overflow-y-auto">{departments.map((d:any)=><div key={d.id} className="p-2 bg-slate-50 rounded-lg border text-xs"><div className="font-bold">{d.name}</div><div className="text-[10px] text-slate-500">{d.description}</div></div>)}{departments.length===0&&<div className="text-[11px] text-slate-400 p-4 text-center border-dashed border rounded-xl">No departments — create via /api/employee-access/departments POST — GLOBAL/COUNTRY/BRANCH/OFFICE/DEPARTMENT/TEAM/ASSIGNED/OWN scopes</div>}</div></Card>
          <Card className="p-4 bg-white border rounded-2xl space-y-3"><h3 className="font-bold text-xs flex items-center gap-2"><MapPin className="w-4 h-4 text-[#0057B8]" /> Branches ({branches.length})</h3><div className="space-y-2 max-h-96 overflow-y-auto">{branches.map((b:any)=><div key={b.id} className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-xs"><div className="font-bold">{b.name} — {b.code}</div><div className="text-[10px] text-slate-500">{b.country} · {b.city}</div></div>)}{branches.length===0&&<div className="text-[11px] text-slate-400 p-4 text-center border-dashed border rounded-xl">No branches — create via /api/employee-access/branches</div>}</div></Card>
          <Card className="p-4 bg-white border rounded-2xl space-y-3"><h3 className="font-bold text-xs flex items-center gap-2"><Home className="w-4 h-4 text-[#0057B8]" /> Offices ({offices.length})</h3><div className="space-y-2 max-h-96 overflow-y-auto">{offices.map((o:any)=><div key={o.id} className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-xs"><div className="font-bold">{o.name} — {o.code}</div><div className="text-[10px] text-slate-500">{o.address}</div></div>)}{offices.length===0&&<div className="text-[11px] text-slate-400 p-4 text-center border-dashed border rounded-xl">No offices — create via /api/employee-access/offices</div>}</div></Card>
        </div>
      )}

      {activeTab==='designations' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Briefcase className="w-4 h-4 text-[#0057B8]" /> 17 Designations + Permission Matrix — Chairman/CEO/Director/Office Manager/Country Manager/Counselor/Senior Counselor/Application Manager/Application Team/Visa Officer/Finance/Marketing/Front Desk/HR/Support/Viewer/Custom + Primary/Secondary + Permission Package + Custom + Temporary</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {DESIGNATIONS.map(d=><div key={d} className="p-3 bg-slate-50 rounded-xl border flex items-center justify-between"><span className="font-bold text-[11px]">{d}</span><Badge className="bg-blue-50 text-[#0057B8] text-[9px]">Matrix + Custom</Badge></div>)}
          </div>
          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px] space-y-1"><div>PERMISSION_MATRIX: Chairman GLOBAL */*, CEO GLOBAL */*, Director GLOBAL */* cannotSelfApprove PAYROLL/FINANCE, Office Manager OFFICE STUDENT/APPLICATION/DOCUMENT/VISA/ATTENDANCE/LEAVE/DEVICE, Counselor ASSIGNED STUDENT/APPLICATION/DOCUMENT/COMMUNICATION/WHATSAPP/EMAIL VIEW/CREATE/EDIT/SUBMIT/SEND/UPLOAD, Finance DEPARTMENT FINANCE/PAYROLL/STUDENT/APPLICATION/PAYMENT cannotSelfApprove PAYROLL, Viewer OWN VIEW only</div><div>SEPARATION: MAKER→REVIEWER→APPROVER no self-approval, ACCEPT=responsibility APPROVE=authority different permissions</div></div>
        </Card>
      )}

      {activeTab==='packages' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-[#0057B8]" /> Permission Packages — STARTER / GROWTH / PREMIUM, editable by ALO Super Admin</h2>

          {/* Honesty banner: an empty table is shown as empty, never filled with
              rows that do not exist in the database. */}
          {data && data.packagesSeeded === false && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
              <span className="font-bold">No partner packages are saved yet.</span> {data.packagesNote}
            </div>
          )}

          {data && (data.packages?.length > 0 || data.packageDefaults?.length > 0) ? (
            <div className="grid md:grid-cols-3 gap-4">
              {(data.packages?.length > 0 ? data.packages : data.packageDefaults).map((pkg: any) => (
                <div key={pkg.id || pkg.slug} className="p-3 bg-slate-50 rounded-xl border space-y-2 text-xs">
                  <div className="font-bold text-[12px]">{pkg.name}</div>
                  {pkg.description && <div className="text-[10px] text-slate-600">{pkg.description}</div>}
                  <table className="w-full text-[10px]">
                    <tbody className="[&_td]:py-0.5">
                      <tr><td className="text-slate-500">User seats</td><td className="text-right font-mono font-bold">{pkg.defaultUserLimit ?? pkg.maxUsers}</td></tr>
                      <tr><td className="text-slate-500">Images / month</td><td className="text-right font-mono font-bold">{pkg.monthlyImageLimit ?? pkg.maxImages}</td></tr>
                      <tr><td className="text-slate-500">Videos / month</td><td className="text-right font-mono font-bold">{pkg.monthlyVideoLimit ?? pkg.maxVideos}</td></tr>
                      <tr><td className="text-slate-500">Video max length</td><td className="text-right font-mono font-bold">{pkg.videoDurationLimitSeconds ?? pkg.videoMaxLength}s</td></tr>
                      <tr><td className="text-slate-500">English mock vouchers</td><td className="text-right font-mono font-bold">{pkg.englishMockVoucherLimit ?? '—'}</td></tr>
                      <tr><td className="text-slate-500">Interview prep / application</td><td className="text-right font-mono font-bold">{pkg.interviewPrepLimit ?? '—'}</td></tr>
                    </tbody>
                  </table>
                  <div className="flex flex-wrap gap-1">
                    <Badge className={(pkg.autoPublishAllowed ?? false) ? 'bg-emerald-50 text-emerald-700 text-[9px]' : 'bg-slate-200 text-slate-700 text-[9px]'}>
                      auto-publish {(pkg.autoPublishAllowed ?? false) ? 'ALLOWED' : 'OFF'}
                    </Badge>
                    <Badge className={(pkg.requiresAloApproval ?? true) ? 'bg-amber-50 text-amber-800 text-[9px]' : 'bg-slate-200 text-slate-700 text-[9px]'}>
                      {(pkg.requiresAloApproval ?? true) ? 'ALO approval required' : 'no ALO review'}
                    </Badge>
                  </div>
                  {data.packagesSeeded === false && (
                    <div className="text-[10px] text-amber-800 font-semibold">DEFAULT — not saved yet</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-[11px] text-slate-400 border border-dashed rounded-xl">
              No package data available.
            </div>
          )}

          <div className="p-2 bg-white rounded border font-mono text-[10px] text-slate-600">
            Quotas are enforced by the access-check engine on every action: canAccessFeature / getQuota / checkQuotaBeforeAction / recordUsage — a frontend hide is never the control.
          </div>
        </Card>
      )}

      {activeTab==='sections' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#0057B8]" /> Access Control Sections — 12 areas owned by ALO Super Admin</h2>
          <p className="text-[11px] text-slate-500">
            Each section lists the rule it controls and the feature keys it governs. A section that is switched off changes a backend decision — it is never only a hidden button.
          </p>
          {data?.hardCeilings && (
            <div className="p-2 bg-slate-50 rounded border font-mono text-[10px] text-slate-600">
              Hard ceilings: video {data.hardCeilings.videoDurationLimitSeconds}s · partner seats {data.hardCeilings.defaultPartnerUserLimit} · images {data.hardCeilings.defaultMonthlyImageLimit}/mo · videos {data.hardCeilings.defaultMonthlyVideoLimit}/mo
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            {(data?.sections || []).map((section: any) => (
              <div key={section.key} className="p-3 bg-white border rounded-xl space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[12px]">{section.label}</span>
                  <Badge className={section.backendEnforced ? 'bg-emerald-50 text-emerald-700 text-[9px]' : 'bg-amber-50 text-amber-800 text-[9px]'}>
                    {section.backendEnforced ? 'BACKEND ENFORCED' : 'NOT ENFORCED'}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-600">{section.rule}</div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(section.featureKeys || []).map((key: string) => (
                    <span key={key} className="font-mono text-[9px] bg-slate-100 border rounded px-1 py-0.5">{key}</span>
                  ))}
                </div>
              </div>
            ))}
            {!data?.sections && (
              <div className="text-[11px] text-slate-400 p-6 text-center border border-dashed rounded-xl md:col-span-2">
                Section list unavailable — the API did not return it.
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab==='permissions' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Sliders className="w-4 h-4 text-[#0057B8]" /> Granular Permissions — VIEW/CREATE/EDIT/SUBMIT/ACCEPT/REJECT/APPROVE/VERIFY/SEND/DOWNLOAD/UPLOAD/EXPORT/ASSIGN/REASSIGN/ARCHIVE/CONFIGURE/MANAGE/ESCALATE/GENERATE/PUBLISH/DELETE soft — Object-level + Field-level Security</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-[10px]">
            {['STUDENT','APPLICATION','DOCUMENT','VISA','FINANCE','HR','MARKETING','SOCIAL','WHATSAPP','EMAIL','PHONE','AI','REPORTS','EXPORT','ADMINISTRATION','PARTNER','B2B','INTERVIEW','COMMUNICATION','PAYROLL','ATTENDANCE','LEAVE','DEVICE','AGREEMENT'].map(m=><div key={m} className="p-2 bg-white rounded-lg border flex flex-col"><span className="font-bold text-[10px]">{m}</span><div className="flex flex-wrap gap-1 mt-1">{['VIEW','CREATE','EDIT','APPROVE','SEND'].map(a=><Badge key={a} className="bg-emerald-50 text-emerald-700 text-[7px] px-1 py-0">{a}</Badge>)}</div></div>)}
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px]"><span className="font-bold">Field-level:</span> salary, personal_phone, emergency_contact, bank_info, nid, passport_number, private_notes — restricted Employee+SuperAdmin+Chairman+HR explicit — enforceFieldLevelSecurity() — <span className="font-bold">Object-level:</span> OWN vs ASSIGNED vs TEAM vs DEPARTMENT vs BRANCH vs COUNTRY vs GLOBAL where clauses — <span className="font-bold">AI:</span> READ/ANALYZE/SUMMARIZE/CLASSIFY/DRAFT/RECOMMEND/PREPARE low-risk, FINALIZE/APPROVE/SEND/PAY/DELETE/ESCALATE high-risk requires human</div>
        </Card>
      )}

      {activeTab==='requests' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><ClipboardList className="w-4 h-4 text-[#0057B8]" /> Permission Requests — REQUESTED→REVIEWING→APPROVED/REJECTED→ACTIVE — Separation of Duties no self-approval</h2>
          <div className="overflow-x-auto rounded-xl border"><table className="w-full text-[11px]"><thead><tr className="bg-slate-50 font-bold border-b"><th className="p-2">Employee</th><th className="p-2">Feature</th><th className="p-2">Action</th><th className="p-2">Scope</th><th className="p-2">Reason</th><th className="p-2">Status</th></tr></thead><tbody>{permRequests.map((r:any)=><tr key={r.id} className="border-b hover:bg-slate-50"><td className="p-2 font-mono text-[10px]">{r.employeeId}</td><td className="p-2">{r.featureKey}</td><td className="p-2">{r.action}</td><td className="p-2">{r.scopeType}</td><td className="p-2 max-w-[200px] truncate">{r.reason}</td><td className="p-2"><Badge className="text-[9px]">{r.status}</Badge></td></tr>)}{permRequests.length===0&&<tr><td colSpan={6} className="p-8 text-center text-slate-400">No pending permission requests — workflow REQUESTED→REVIEWING→APPROVED/REJECTED→ACTIVE enforced, approver cannot be requester</td></tr>}</tbody></table></div>
        </Card>
      )}

      {activeTab==='temporary' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-[#0057B8]" /> Temporary Access — Auto-revoke after expiry, every action audited</h2>
          <div className="grid md:grid-cols-2 gap-3">{tempPerms.map((t:any)=><div key={t.id} className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs"><div className="font-bold">{t.featureKey} — {t.action}</div><div className="text-[10px] text-slate-600">Scope: {t.scopeType}/{t.scopeId} — GrantedBy: {t.grantedBy}</div><div className="text-[10px]">Expires: {new Date(t.endDate).toLocaleString()} — Auto-revoke enforced</div><Badge className={t.isActive?'bg-emerald-50 text-emerald-700 text-[9px]':'bg-red-50 text-red-700 text-[9px]'}>{t.isActive?'ACTIVE':'EXPIRED'}</Badge></div>)}{tempPerms.length===0&&<div className="text-[11px] text-slate-400 p-8 text-center border-dashed border rounded-xl col-span-2">No temporary permissions — auto-revoke after expiry, audit every action, POST /api/employee-access/temporary-permissions with employeeId, featureKey, endDate</div>}</div>
        </Card>
      )}

      {activeTab==='breakglass' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-600" /> Break Glass — Reason/Approver/Expiry Audit — Every action audited, banner BREAK_GLASS_ACCESS ACTIVE</h2>
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-2"><div className="font-bold text-red-900">Emergency access requires reason + approver + expiry — all actions audited — cannot be silent</div><div className="font-mono text-[10px] bg-white p-2 rounded border">POST /api/employee-access/break-glass — body: {'{reason, scopeType, scopeId, durationHours}'} — Super Admin grants immediately with banner, others create pending request requiring approver</div></div>
        </Card>
      )}

      {activeTab==='documents' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-[#0057B8]" /> Document Center — Mandatory types, no permanent delete, versioning V1/V2/V3 current/historical, protected download signed URLs expiry audit soft-delete</h2>
          <div className="grid md:grid-cols-2 gap-3 text-xs"><div className="p-3 bg-slate-50 rounded-xl border"><div className="font-bold uppercase text-[10px]">Mandatory Types</div><div className="flex flex-wrap gap-1 mt-2">{['passport','nid','photo','cv','academic_certificate','experience_letter','appointment_letter','nda','confidentiality_agreement','device_agreement','it_policy','data_privacy_agreement','international_agreement','bangladesh_employment_agreement'].map(t=><Badge key={t} className="bg-white text-slate-700 text-[8px] border">{t}</Badge>)}</div></div><div className="p-3 bg-blue-50 rounded-xl border border-blue-100"><div className="font-bold uppercase text-[10px]">Versioning & Security</div><div className="text-[11px] mt-2 space-y-1"><div>• Only one version CURRENT, previous historical per retention policy</div><div>• No permanent delete for official HR documents — archive/soft-delete only</div><div>• Legacy generic signed-download endpoint is disabled; resource-specific authenticated download streams are required</div><div>• Employee document downloads authorize owner/HR/admin, verify private-file SHA-256, audit access, and retain versions</div></div></div></div>
        </Card>
      )}

      {activeTab==='agreements' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><FileSignature className="w-4 h-4 text-[#0057B8]" /> HR Agreement Center + Digital Signature Acceptance History Immutable</h2>
          <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-2"><div className="font-bold">Types: appointment_letter, hr_policy, company_policy, leave_policy, salary_policy, notice_policy, provident_fund_policy, gratuity_policy, security_policy, confidentiality_policy, international_employment_agreement, bangladesh_employment_agreement</div><div>Digital acceptance recorded with timestamp, IP, device, signatureType — history cannot be overwritten — immutable — not checkbox as legally valid unless configured — GET /api/employee-access/agreements, POST /api/employee-access/agreement-acceptances with agreementId, version, signatureType</div></div>
        </Card>
      )}

      {activeTab==='attendance' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-[#0057B8]" /> Attendance — Never automatically capture webcam photos — camera requires explicit permission</h2>
          <div className="p-8 text-center text-xs text-slate-500 border-dashed border rounded-xl">Attendance API: GET /api/employee-access/attendance?employeeId&month=YYYY-MM — POST checkIn/checkOut — summary present/late/absent — never webcam auto capture</div>
        </Card>
      )}

      {activeTab==='leave' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-[#0057B8]" /> Leave Types Balances — casual/annual/medical/maternity/paternity/lwp/compensatory — Separation of Duties cannot approve own</h2>
          <div className="grid md:grid-cols-2 gap-3 text-xs"><div className="p-3 bg-slate-50 rounded-xl border"><div className="font-bold">Leave Balance</div><div className="text-[11px] mt-2">casualTotal 12, annualTotal 15, medicalTotal 10 — GET /api/employee-access/leave-balance?employeeId&year — POST HR sets totals — tracks used/remaining</div></div><div className="p-3 bg-blue-50 rounded-xl border border-blue-100"><div className="font-bold">Leave Request Workflow</div><div className="text-[11px] mt-2">POST /api/employee-access/leave leaveType/startDate/endDate/reason — PATCH manager approves — cannot approve own — audit + notification to HR</div></div></div>
        </Card>
      )}

      {activeTab==='payroll' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Wallet className="w-4 h-4 text-[#0057B8]" /> Payroll draft→human check→approval — AI cannot finalize high-risk — AI PREPARES → HUMAN CHECK → HUMAN APPROVAL → FINAL</h2>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2"><div className="font-bold text-amber-900">Payroll Workflow</div><div>POST /api/employee-access/payroll — basicSalary/allowances/bonus/overtime/loanDeduction/advanceDeduction/taxDeduction/pfDeduction — gross/net calculated — items earning/deduction — isAiDraft true → status draft requires HUMAN HR/FINANCE CHECK → HUMAN APPROVAL → FINAL — AI may analyze attendance, calculate draft, detect anomalies, prepare draft, flag inconsistencies — AI CANNOT finalize high-risk salary/payment decisions</div><div className="font-mono bg-white p-2 rounded border text-[10px]">States: draft → review_pending → reviewed → approved → paid → rejected — Separation: maker cannot approve own payroll</div></div>
        </Card>
      )}

      {activeTab==='devices' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Smartphone className="w-4 h-4 text-[#0057B8]" /> Device Management + Login Security IP/browser/OS/fingerprint/location/time/failed/session/MFA/rate limiting/suspicious detection</h2>
          <div className="grid md:grid-cols-2 gap-3 text-xs"><div className="p-3 bg-slate-50 rounded-xl border"><div className="font-bold">Devices</div><div className="text-[11px] mt-2">GET/POST /api/employee-access/devices — deviceType/deviceId/ip/browser/os/fingerprint/isTrusted/status — HR/Admin registers — audit DEVICE_REGISTERED</div></div><div className="p-3 bg-red-50 rounded-xl border border-red-100"><div className="font-bold">Login Logs</div><div className="text-[11px] mt-2">GET /api/employee-access/login-logs?employeeId — logs IP/browser/OS/fingerprint/location/status/isSuccess/failureReason/sessionId — failedAttempts, uniqueIPs, suspicious if failed&gt;5 or IPs&gt;3 — rateLimit 5 attempts /15min/IP — POST logs creates security event if failed</div></div></div>
        </Card>
      )}

      {activeTab==='security' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Bug className="w-4 h-4 text-red-600" /> Security Events — failed_login, suspicious_location, multiple_ips, device_change, break_glass — severity low/medium/high/critical</h2>
          <div className="overflow-x-auto rounded-xl border"><table className="w-full text-[11px]"><thead><tr className="bg-slate-50 font-bold border-b"><th className="p-2">Employee</th><th className="p-2">Type</th><th className="p-2">Severity</th><th className="p-2">Description</th><th className="p-2">IP</th><th className="p-2">Resolved</th></tr></thead><tbody>{securityEvents.map((e:any)=><tr key={e.id} className="border-b hover:bg-slate-50"><td className="p-2 font-mono text-[10px]">{e.employeeId}</td><td className="p-2">{e.eventType}</td><td className="p-2"><Badge className={e.severity==='critical'?'bg-red-100 text-red-700 text-[9px]':e.severity==='high'?'bg-amber-100 text-amber-700 text-[9px]':'bg-slate-100 text-slate-700 text-[9px]'}>{e.severity}</Badge></td><td className="p-2 max-w-[250px] truncate">{e.description}</td><td className="p-2 font-mono text-[10px]">{e.ipAddress}</td><td className="p-2">{e.isResolved?'Yes':'No'}</td></tr>)}{securityEvents.length===0&&<tr><td colSpan={6} className="p-8 text-center text-slate-400">No security events — POST /api/employee-access/security-events to log — audit SECURITY_EVENT_LOGGED</td></tr>}</tbody></table></div>
        </Card>
      )}

      {activeTab==='reassignments' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-[#0057B8]" /> Reassignments — Nothing silent — everything tracked with reason, actor, approval, audit</h2>
          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px]">POST /api/employee-access/reassignments — body: {'{fromEmployeeId, toEmployeeId, entityType, entityId, reason}'} — reason required, no silent reassignment — logs REASSIGNMENT_CREATED + EmployeeAuditLog REASSIGNMENT with old/new assignedTo + reason + IP — GET ?employeeId</div>
        </Card>
      )}

      {activeTab==='audit' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-[#0057B8]" /> Audit Log — LOGIN/LOGOUT/ACCOUNT_CREATED/APPROVED/SUSPENDED/ROLE_CHANGED/PERMISSION_GRANTED/REVOKED/PROFILE_VIEWED/SALARY_VIEWED/CHANGED/DOCUMENT_VIEWED/DOWNLOADED/UPLOADED/REJECTED/VERIFIED/APPLICATION_VIEWED/CHANGED/SUBMITTED/PAYMENT_CREATED/VIEWED/APPROVED/WHATSAPP_SENT/EMAIL_SENT/CALL_LOGGED/AI_USED/EXPORT/REASSIGNMENT/ESCALATION — actor_id/role/action/target/old/new/reason/approval/timestamp/IP/session — No history deletion soft-delete — deactivation revoke login/sessions/tokens/WhatsApp/social/email/AI/device preserve history</h2>
          <div className="overflow-x-auto rounded-xl border max-h-96"><table className="w-full text-[10px]"><thead className="sticky top-0 bg-slate-50"><tr className="font-bold border-b"><th className="p-2">Actor</th><th className="p-2">Action</th><th className="p-2">Target</th><th className="p-2">Reason</th><th className="p-2">IP</th><th className="p-2">Time</th></tr></thead><tbody>{auditLogs.slice(0,50).map((l:any,i:number)=><tr key={l.id||i} className="border-b hover:bg-slate-50"><td className="p-2 font-mono">{l.actorUserId || l.actorId || l.userId}</td><td className="p-2"><Badge className="text-[8px]">{l.action}</Badge></td><td className="p-2 font-mono">{l.entityType || l.targetType} {l.entityId || l.targetId}</td><td className="p-2 max-w-[150px] truncate">{l.reason || (l.metadata ? JSON.stringify(l.metadata).slice(0,80) : '')}</td><td className="p-2 font-mono">{l.ipAddress}</td><td className="p-2">{new Date(l.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>
        </Card>
      )}

      {activeTab==='feature' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-[#0057B8]" /> Feature Access Engine — Helpers mandatory backend checks — canAccessFeature/getQuota/checkQuotaBeforeAction/recordUsage/canViewEmployeePrivateProfile/canViewB2BDetails/canUseStudentBenefit/canApproveAction/canAccessApplication/Document/SendCommunication — social/WhatsApp/email/phone/AI/application/student/document/finance/visa/marketing/partner/B2B/quota permission-controlled — WhatsApp contact matching phone_normalized</h2>
          <div className="grid md:grid-cols-2 gap-3 text-xs"><div className="p-3 bg-slate-50 rounded-xl border"><div className="font-bold">Feature Rules ({featureRules.length})</div><div className="space-y-1 mt-2 max-h-48 overflow-y-auto">{featureRules.map((r:any)=><div key={r.id} className="p-2 bg-white rounded border text-[10px] font-mono">{r.featureKey} — {r.displayName} — roles: {r.allowedRoles}</div>)}{featureRules.length===0&&<div className="text-slate-400">No rules — POST /api/employee-access/feature-access with featureKey/displayName/allowedRoles/requiredPermissions — GET ?featureKey&action checks canAccessFeature</div>}</div></div><div className="p-3 bg-blue-50 rounded-xl border border-blue-100"><div className="font-bold">Engine Helpers</div><div className="text-[11px] mt-2 space-y-1"><div>• canAccessFeatureEngine(userId, roles, featureKey, action) — super_admin always, portal permission, temporary, package assignment, break-glass, designation matrix</div><div>• canViewEmployeePrivateProfileEngine — self, super_admin, chairman, HR explicit temporary</div><div>• checkQuotaBeforeActionEngine — counts quotaUsage, limit from package — CHECK→ALLOW/REJECT→RECORD</div><div>• validateAiAction — low-risk READ/ANALYZE/SUMMARIZE/CLASSIFY/DRAFT/RECOMMEND/PREPARE allowed, high-risk FINALIZE/APPROVE/SEND/PAY/DELETE/ESCALATE requires human</div><div>• WhatsApp contact matching phone_normalized — permission-controlled</div></div></div></div>
        </Card>
      )}

      {activeTab==='quota' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Database className="w-4 h-4 text-[#0057B8]" /> Quota Engine — check→allow/reject→record — extra quota request workflow — student benefits eligibility voucher tracking</h2>
          <div className="p-3 bg-slate-50 rounded-xl border text-xs"><div className="font-bold">Quota Flow</div><div className="text-[11px] mt-2">POST /api/employee-access/quotas — featureKey/requestedAmount/reason — checks current usage vs limit 100 default (200 with package) — if exceeded creates extraQuotaRequest pending — else records quotaUsage — audit QUOTA_EXCEEDED/QUOTA_USED — GET ?employeeId lists usage — partnerQuota also — extra quota request workflow REQUESTED→REVIEWING→APPROVED/REJECTED</div></div>
        </Card>
      )}

      {activeTab==='workflow' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Workflow className="w-4 h-4 text-[#0057B8]" /> Application Workflow Controlled Transitions — document checklist + follow-up, offer provenance, serial ALO-UK-2026-000123, university payment verified bank, post-offer requirements, bank guidance labeled, interview research/prep/practice/scoring/recording/human final review, service charge approved template, course finder mapping, rejection with history</h2>
          <div className="grid md:grid-cols-2 gap-3 text-xs"><div className="p-3 bg-slate-50 rounded-xl border"><div className="font-bold">Application States</div><div className="font-mono text-[10px] mt-2">draft→submitted→under_review→document_check→offer_pending→offer_received→offer_accepted→payment_pending→payment_verified→visa_pending→visa_submitted→visa_approved→enrolled→rejected→withdrawn→deferred — transitions validated — approval permission required for rejected/approved/enrolled — audit APPLICATION_{'{toState}'} + EmployeeAuditLog state_change</div></div><div className="p-3 bg-blue-50 rounded-xl border border-blue-100"><div className="font-bold">Offer & Payment</div><div className="text-[11px] mt-2">Offer provenance who created/verified/sent/signed URL/expiry/audit — serial ALO-UK-2026-000123 generated sequential per country/year — university payment verified bank info must verify before payment step — bank guidance labeled — service charge declaration approved template permission-controlled — post-offer requirements tracking — rejection with history preserved</div></div></div>
        </Card>
      )}

      {activeTab==='offer' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[#0057B8]" /> Offer Letters — Provenance, Serial, Bank Verified, Service Charge Approved Template</h2>
          <div className="p-3 bg-slate-50 rounded-xl border text-xs">GET/POST /api/employee-access/offer-letters?applicationId — filePath/universityName/courseName/intake/conditions/tuitionFee/scholarship — status pending_verification → verified — createdBy logged — provenance — university payment verified bank info — service charge declaration must use approved template</div>
        </Card>
      )}

      {activeTab==='interview' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Mic className="w-4 h-4 text-[#0057B8]" /> Interview Prep — research/prep/practice/scoring/recording/human final review — AI may score draft, human final required — bank guidance labeled</h2>
          <div className="p-3 bg-slate-50 rounded-xl border text-xs">GET/POST /api/employee-access/interview?applicationId/studentId — type/scheduledAt/researchNotes/prepNotes/practiceScore/aiScore/recordingUrl — workflow research→prep→practice→scoring→recording→human_final_review — AI scoring draft only — finalReviewedBy/finalScore required human — bank guidance must be labeled clearly — interview prep/research/practice/scoring/recording/human final review</div>
        </Card>
      )}

      {activeTab==='comments' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#0057B8]" /> Two Comment Systems — Student-visible vs Internal never shown — Permission-controlled</h2>
          <div className="grid md:grid-cols-2 gap-3 text-xs"><div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl"><div className="font-bold text-emerald-900">Student Visible</div><div className="text-[11px] mt-2">visibility=student_visible / isStudentVisible true — Student can see — never include internal notes — GET filters visibility for student role — POST with visibility student_visible — audit STUDENT_VISIBLE_COMMENT_ADDED</div></div><div className="p-3 bg-red-50 border border-red-200 rounded-xl"><div className="font-bold text-red-900">Internal Only</div><div className="text-[11px] mt-2">visibility=internal — Internal only — never shown to student, permission-controlled — student role forced where visibility=student_visible — internal never leaked — audit INTERNAL_COMMENT_ADDED — two systems enforced by visibility field + role check</div></div></div>
        </Card>
      )}

      {activeTab==='payments' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#0057B8]" /> University Payment Verified Bank Info + Service Charge Declaration Approved Template + Bank Guidance Labeled + Post-offer Requirements</h2>
          <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-2"><div>GET/POST /api/employee-access/payments?applicationId/studentId — amount/currency/bankName/accountNumber/swiftCode/paymentType/proofFilePath — accountNumberEncrypted stored encrypted, masked ***1234 — status pending_verification → verified by finance — finance role verifies bank — audit PAYMENT_CREATED — verification required before approval — bank guidance labeled — service charge declaration approved template permission-controlled — post-offer requirements tracking</div><div className="font-mono bg-white p-2 rounded border text-[10px]">Sensitive encrypted: accountNumberEncrypted via vault in production — notification no sensitive leak enforced</div></div>
        </Card>
      )}

      {activeTab==='analytics' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#0057B8]" /> HR Analytics + Role Widgets — per designation dashboard widgets — reporting permission-checked audit logged</h2>
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border"><div className="font-bold">Summary</div><div className="mt-2 space-y-1"><div>Total: {analytics?.summary?.totalEmployees}</div><div>Active: {analytics?.summary?.activeEmployees}</div><div>Pending: {analytics?.summary?.pendingActivation}</div><div>Attendance Today: {analytics?.summary?.attendanceToday}</div><div>Leave Pending: {analytics?.summary?.leavePending}</div></div></div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100"><div className="font-bold">By Designation</div><div className="mt-2 space-y-1 max-h-32 overflow-y-auto">{analytics?.byDesignation?.map((d:any)=><div key={d.designation} className="flex justify-between"><span>{d.designation}</span><span className="font-bold">{d._count.designation}</span></div>)}</div></div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100"><div className="font-bold">Role Widgets</div><div className="mt-2 text-[10px] space-y-1"><div>Chairman: global_stats, financial_overview, branch_performance</div><div>CEO: global_stats, branch_performance, employee_productivity</div><div>Office Manager: office_attendance, office_tasks, office_applications</div><div>Counselor: assigned_students, tasks, followups, applications</div><div>HR: employee_directory, attendance, leave, payroll, devices, agreements</div></div></div>
          </div>
        </Card>
      )}

      {activeTab==='notifications' && (
        <Card className="p-4 bg-white border rounded-2xl space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2"><Bell className="w-4 h-4 text-[#0057B8]" /> Notification Engine — in-app/email/WhatsApp/SMS no sensitive leak — SLA reminder/warning/escalation — error control — audit</h2>
          <div className="grid md:grid-cols-2 gap-3 text-xs"><div className="p-3 bg-slate-50 rounded-xl border"><div className="font-bold">Channels</div><div className="text-[11px] mt-2">in-app always, email/WhatsApp/SMS optional permission-checked — POST /api/employee-access/notifications userId/title/message/type/channel — sensitivePatterns password/bank/account_number/nid/passport/salary blocked — no sensitive leak enforced — audit</div></div><div className="p-3 bg-amber-50 rounded-xl border border-amber-100"><div className="font-bold">SLA</div><div className="text-[11px] mt-2">reminder auto before SLA breach, warning at 80% SLA, escalation at 100% to senior — assign to senior — notification type sla_reminder/sla_warning/escalation — GET ?unreadOnly filters — reporting permission-checked</div></div></div>
        </Card>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="p-5 bg-white w-full max-w-lg rounded-2xl shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm flex items-center gap-2"><UserCheck className="w-4 h-4 text-[#0057B8]" /> Create ALO Employee Account — Secure Activation INVITED→ACTIVE</h3>
              <button onClick={()=>setShowEmpModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div><label className="font-bold">Full Name *</label><Input value={newEmpName} onChange={e=>setNewEmpName(e.target.value)} placeholder="Tanvir Ahmed" className="text-xs mt-1 h-8" /></div>
              <div><label className="font-bold">Company Email * — activation token hashed one-time expiry 48h</label><Input value={newEmpEmail} onChange={e=>setNewEmpEmail(e.target.value)} placeholder="tanvir@aloeducation.com" className="text-xs mt-1 h-8" /></div>
              <div><label className="font-bold">Phone — phone_normalized for WhatsApp matching</label><Input value={newEmpPhone} onChange={e=>setNewEmpPhone(e.target.value)} placeholder="+880 1800 000000" className="text-xs mt-1 h-8" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="font-bold">Designation</label><select value={newEmpDesignation} onChange={e=>setNewEmpDesignation(e.target.value)} className="w-full p-2 border rounded-lg text-xs mt-1 h-8">{DESIGNATIONS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                <div><label className="font-bold">Branch — scope GLOBAL/COUNTRY/BRANCH/OFFICE</label><select value={newEmpBranch} onChange={e=>setNewEmpBranch(e.target.value)} className="w-full p-2 border rounded-lg text-xs mt-1 h-8"><option>Dhaka Main</option><option>Uttara Office</option><option>Sylhet Branch</option><option>Chittagong Branch</option></select></div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border text-[10px] space-y-1"><div className="font-bold">Activation Flow:</div><div>1. Generate employeeCode ALO-EMP-YYYYNNNNN sequential</div><div>2. Generate tokenRaw randomBytes 32 hex — tokenHash sha256 — expires 48h — status active</div><div>3. Create portalUser userType EMPLOYEE status pending_activation firstLoginRequired true emailVerified false</div><div>4. Create employeeProfile + employeeActivationToken + audit employee_account_created + sendActivationEmail</div><div>5. Activation: POST /api/admin/employees/activate token+password — validate strength 8 chars uppercase number — hash token find active — check expiry — transaction set passwordHash PBKDF2 salt:hash — status active emailVerified true — token status used usedAt — invalidate other active tokens — audit employee_account_activated</div></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t"><Button variant="outline" onClick={()=>setShowEmpModal(false)} className="text-xs h-8">Cancel</Button><Button onClick={handleCreateEmployee} disabled={creatingEmp} className="bg-[#E8501A] text-white text-xs h-8 font-bold">{creatingEmp?'Creating...':'Create & Send Activation Email'}</Button></div>
          </Card>
        </div>
      )}

      {/* FOOTER */}
      <Card className="p-4 bg-[#F4F8FF] border-[#E2E8F0] rounded-2xl text-xs text-[#64748B]">
        Employee access is managed centrally by role, designation and permission scope. Every change is audit-logged; temporary and break-glass access expires automatically.
      </Card>
    </div>
  );
}
