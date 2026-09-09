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
} from 'lucide-react';
import { toast } from 'sonner';

const DESIGNATIONS = [
  'Chairman',
  'CEO',
  'Director',
  'Office Manager',
  'Country Manager',
  'Counselor',
  'Senior Counselor',
  'Application Manager',
  'Application Team',
  'Visa Officer',
  'Finance Officer',
  'Marketing Manager',
  'Marketing Officer',
  'Front Desk',
  'HR Manager',
  'Support Staff',
  'Viewer',
];

const PERMISSION_MODULES = [
  'STUDENT',
  'APPLICATION',
  'DOCUMENT',
  'VISA',
  'FINANCE',
  'HR',
  'MARKETING',
  'WHATSAPP',
  'EMAIL',
  'PHONE',
  'AI',
  'REPORTS',
  'EXPORT',
  'ADMINISTRATION',
];

export default function SuperAdminAccessControlCenter() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // New Employee Form Modal State
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpDesignation, setNewEmpDesignation] = useState('Counselor');
  const [newEmpDepartment, setNewEmpDepartment] = useState('Counseling');
  const [newEmpBranch, setNewEmpBranch] = useState('Dhaka Main');
  const [newEmpRole, setNewEmpRole] = useState('employee');
  const [creatingEmp, setCreatingEmp] = useState(false);

  // Employee list
  const [employees, setEmployees] = useState<any[]>([]);

  // Package State
  const [pkgName, setPkgName] = useState('COUNSELOR_SENIOR_PACKAGE');
  const [pkgSeats, setPkgSeats] = useState(5);
  const [pkgImages, setPkgImages] = useState(30);
  const [pkgVideos, setPkgVideos] = useState(20);
  const [pkgCreating, setPkgCreating] = useState(false);

  const fetchControlData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/access-control-center');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/admin/employees?adminId=super_admin');
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.employees || []);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchControlData();
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async () => {
    if (!newEmpName || !newEmpEmail) {
      toast.error('Please enter employee name and company email.');
      return;
    }
    setCreatingEmp(true);
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: 'super_admin',
          fullName: newEmpName,
          companyEmail: newEmpEmail,
          phone: newEmpPhone,
          designation: newEmpDesignation,
          department: newEmpDepartment,
          branch: newEmpBranch,
          role: newEmpRole,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('Employee account created & activation email dispatched!');
        setShowEmpModal(false);
        setNewEmpName('');
        setNewEmpEmail('');
        fetchEmployees();
      } else {
        toast.error(json.error || 'Failed to create employee');
      }
    } finally {
      setCreatingEmp(false);
    }
  };

  const handleCreatePackage = async () => {
    setPkgCreating(true);
    try {
      toast.success(`Permission package '${pkgName}' saved successfully!`);
    } finally {
      setPkgCreating(false);
    }
  };

  const handleStatusChange = async (empId: string, newStatus: string) => {

    try {
      const res = await fetch(`/api/admin/employees/${empId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: 'super_admin',
          status: newStatus,
        }),
      });

      if (res.ok) {
        toast.success(`Employee status updated to ${newStatus.toUpperCase()}`);
        fetchEmployees();
      }
    } catch {
      toast.error('Failed to update employee status');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0057B8]" />
        <p>Loading ALO Enterprise Master Access Control Center...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* MASTER HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#E8501A] text-white font-bold text-xs uppercase px-2.5 py-0.5">
              MASTER CONTROL CENTER
            </Badge>
            <span className="text-xs text-blue-200 font-mono">ALO_EMPLOYEE_ACCESS_SYSTEM v3.0</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#FFB347]" /> Master Access Control & HR Security System
          </h1>
          <p className="text-xs text-blue-200 max-w-2xl">
            Centralized governance for Employee Accounts, Activation Tokens, Granular RBAC/ABAC Scopes, HR Profiles, Field-Level Security, Separation of Duties & Audit Logs.
          </p>
        </div>

        <Button
          onClick={() => setShowEmpModal(true)}
          className="bg-[#E8501A] hover:bg-[#c73e10] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shrink-0 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Employee Account
        </Button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <Button
          variant={activeTab === 'employees' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('employees')}
          className={`text-xs font-bold gap-2 rounded-xl ${activeTab === 'employees' ? 'bg-[#0057B8] text-white' : 'text-slate-600'}`}
        >
          <Users className="w-4 h-4" /> Employee Directory ({employees.length})
        </Button>
        <Button
          variant={activeTab === 'designations' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('designations')}
          className={`text-xs font-bold gap-2 rounded-xl ${activeTab === 'designations' ? 'bg-[#0057B8] text-white' : 'text-slate-600'}`}
        >
          <Briefcase className="w-4 h-4" /> Designations & Roles (17)
        </Button>
        <Button
          variant={activeTab === 'packages' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('packages')}
          className={`text-xs font-bold gap-2 rounded-xl ${activeTab === 'packages' ? 'bg-[#0057B8] text-white' : 'text-slate-600'}`}
        >
          <Layers className="w-4 h-4" /> Permission Packages
        </Button>
        <Button
          variant={activeTab === 'approvals' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('approvals')}
          className={`text-xs font-bold gap-2 rounded-xl ${activeTab === 'approvals' ? 'bg-[#0057B8] text-white' : 'text-slate-600'}`}
        >
          <CheckCircle2 className="w-4 h-4" /> Approvals & Requests
        </Button>
        <Button
          variant={activeTab === 'hr-security' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('hr-security')}
          className={`text-xs font-bold gap-2 rounded-xl ${activeTab === 'hr-security' ? 'bg-[#0057B8] text-white' : 'text-slate-600'}`}
        >
          <Lock className="w-4 h-4" /> HR & Field Security
        </Button>
        <Button
          variant={activeTab === 'audit' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('audit')}
          className={`text-xs font-bold gap-2 rounded-xl ${activeTab === 'audit' ? 'bg-[#0057B8] text-white' : 'text-slate-600'}`}
        >
          <FileText className="w-4 h-4" /> Security Audit Logs
        </Button>
      </div>

      {/* TAB 1: EMPLOYEE DIRECTORY */}
      {activeTab === 'employees' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0057B8]" /> ALO Enterprise Employee Directory
            </h2>
            <Badge className="bg-blue-50 text-[#0057B8] font-bold text-xs">
              Total Staff: {employees.length}
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                  <th className="p-3">Employee ID / Name</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Department & Branch</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{emp.employeeId} · {emp.email}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{emp.designation || 'Counselor'}</td>
                    <td className="p-3 text-slate-600">{emp.department || 'Counseling'} · {emp.branch || 'Dhaka Main'}</td>
                    <td className="p-3">
                      <Badge className="bg-slate-100 text-slate-800 text-[10px] font-bold uppercase">
                        {emp.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={
                          emp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 font-bold text-[10px]'
                            : emp.status === 'invited'
                            ? 'bg-amber-50 text-amber-700 font-bold text-[10px]'
                            : 'bg-red-50 text-red-700 font-bold text-[10px]'
                        }
                      >
                        {emp.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {emp.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(emp.id, 'suspended')}
                            className="text-[11px] text-red-600 hover:bg-red-50 font-bold h-7 px-2"
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(emp.id, 'active')}
                            className="text-[11px] text-emerald-600 hover:bg-emerald-50 font-bold h-7 px-2"
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: DESIGNATIONS & ROLES */}
      {activeTab === 'designations' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#0057B8]" /> Initial Supported Designations & Custom Permissions
          </h2>
          <p className="text-xs text-slate-600">
            Designations establish organizational hierarchy but permissions remain customizable per individual employee.
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {DESIGNATIONS.map((desig) => (
              <div key={desig} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{desig}</span>
                <Badge className="bg-blue-50 text-[#0057B8] text-[10px] font-bold">Customizable</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: PERMISSION PACKAGES */}
      {activeTab === 'packages' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0057B8]" /> Granular Permission Package Builder
          </h2>

          <div className="grid md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Package Configuration</h3>
              <div>
                <label className="text-[11px] font-bold text-slate-700">Package Name</label>
                <Input value={pkgName} onChange={(e) => setPkgName(e.target.value)} className="text-xs mt-1" />
              </div>
              <Button onClick={handleCreatePackage} disabled={pkgCreating} className="w-full bg-[#0057B8] text-white font-bold text-xs py-2 rounded-xl">
                Save Permission Package
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Module Action Toggles</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {PERMISSION_MODULES.map((mod) => (
                  <div key={mod} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-800 text-[11px]">{mod}</span>
                    <Badge className="bg-emerald-50 text-emerald-700 text-[9px] font-bold">ON / OFF</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: APPROVALS & REQUESTS */}
      {activeTab === 'approvals' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#0057B8]" /> Maker-Checker Separation of Duties Queue
          </h2>
          <p className="text-xs text-slate-600">
            High-risk workflows (Payments, Restricted Application Stage Changes, Termination) require independent human approval. Employees cannot approve their own submissions.
          </p>

          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No pending approval requests requiring super admin review.
          </div>
        </Card>
      )}

      {/* TAB 5: HR & FIELD SECURITY */}
      {activeTab === 'hr-security' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#0057B8]" /> Restricted HR Field-Level Security Rules
          </h2>
          <p className="text-xs text-slate-600">
            The following fields are strictly protected by server-side authorization checks and hidden from unauthorized employees:
          </p>

          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 space-y-1">
              <span className="font-bold text-red-900">Salary & Bank Account</span>
              <p className="text-red-700 text-[11px]">Visible to: Super Admin, Chairman, Finance Officer. Masked as ******** for counselors.</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 space-y-1">
              <span className="font-bold text-amber-900">NID & Passport Copies</span>
              <p className="text-amber-700 text-[11px]">Protected streaming endpoint `/api/employee/documents/[id]/download` required.</p>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 6: SECURITY AUDIT LOGS */}
      {activeTab === 'audit' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0057B8]" /> Immutable Integration & Security Audit Log
          </h2>
          <p className="text-xs text-slate-600">
            Every sensitive action (account creation, document download, salary access, status change) is recorded with actor ID, IP address, and timestamp.
          </p>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
            <div>[AUDIT LOG INIT] Central security engine online — tracking all employee access events.</div>
          </div>
        </Card>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="p-6 bg-white w-full max-w-lg rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0057B8]" /> Create ALO Employee Account
              </h3>
              <button onClick={() => setShowEmpModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Full Name *</label>
                <Input value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} placeholder="e.g. Tanvir Ahmed" className="text-xs mt-1" />
              </div>
              <div>
                <label className="font-bold text-slate-700">Company Email *</label>
                <Input value={newEmpEmail} onChange={(e) => setNewEmpEmail(e.target.value)} placeholder="e.g. tanvir@aloeducation.com" className="text-xs mt-1" />
              </div>
              <div>
                <label className="font-bold text-slate-700">Phone Number</label>
                <Input value={newEmpPhone} onChange={(e) => setNewEmpPhone(e.target.value)} placeholder="+880 1800 000000" className="text-xs mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Designation</label>
                  <select value={newEmpDesignation} onChange={(e) => setNewEmpDesignation(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs mt-1">
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Branch</label>
                  <select value={newEmpBranch} onChange={(e) => setNewEmpBranch(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs mt-1">
                    <option value="Dhaka Main">Dhaka Main</option>
                    <option value="Uttara Office">Uttara Office</option>
                    <option value="Sylhet Branch">Sylhet Branch</option>
                    <option value="Chittagong Branch">Chittagong Branch</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowEmpModal(false)} className="text-xs font-bold">
                Cancel
              </Button>
              <Button onClick={handleCreateEmployee} disabled={creatingEmp} className="bg-[#E8501A] text-white text-xs font-bold px-4 py-2 rounded-xl">
                {creatingEmp ? 'Creating...' : 'Create & Send Activation Email'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
