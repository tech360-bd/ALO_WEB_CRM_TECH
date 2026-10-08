'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Search,
  Eye,
  Edit,
  Plus,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

const empStatusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  invited: 'bg-amber-100 text-amber-700',
  suspended: 'bg-orange-100 text-orange-700',
  terminated: 'bg-red-100 text-red-700',
};

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  role: string;
  branch: string;
  status: string;
  joinedAt: string;
  email?: string;
  phone?: string;
}

export default function CrmHRMPage() {
  const token = usePortalStore((state) => state.token);
  const user = usePortalStore((state) => state.user);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Employees');
  const [deptFilter, setDeptFilter] = useState('all');

  // Payroll state
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [currentPayroll, setCurrentPayroll] = useState<any | null>(null);

  // Reassignment Modal State
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [exitingEmpId, setExitingEmpId] = useState('');
  const [targetEmpId, setTargetEmpId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/employees?adminId=hr_manager');
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.employees || []);
      }
    } catch (error) {
      console.error('Failed to load HRM data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = employees.filter((e) => {
    const matchSearch =
      !search ||
      (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.employeeId || '').toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || (e.department || '').toLowerCase() === deptFilter.toLowerCase();
    return matchSearch && matchDept;
  });

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  const handleGeneratePayroll = async () => {
    setPayrollLoading(true);
    try {
      const res = await fetch('/api/admin/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user?.id || 'hr_manager',
          monthYear: '2026-08',
          action: 'prepare_draft',
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('AI Draft Payroll calculated! Awaiting human final approval.');
        setCurrentPayroll(json.payroll);
      } else {
        toast.error(json.error || 'Failed to generate payroll draft.');
      }
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleApprovePayroll = async () => {
    if (!currentPayroll) return;
    setPayrollLoading(true);
    try {
      const res = await fetch('/api/admin/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user?.id || 'super_admin',
          payrollId: currentPayroll.id,
          makerId: currentPayroll.preparedBy,
          monthYear: '2026-08',
          action: 'approve_payroll',
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('Payroll approved. Payment must be completed separately by an authorized payer.');
        setCurrentPayroll(json.payroll);
      } else {
        toast.error(json.error || 'Separation of Duties violation: Maker cannot approve own payroll.');
      }
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleReassignWork = async () => {
    if (!exitingEmpId || !targetEmpId) {
      toast.error('Please select both exiting and target employees.');
      return;
    }
    setReassigning(true);
    try {
      const res = await fetch('/api/admin/reassignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user?.id || 'hr_manager',
          exitingEmployeeId: exitingEmpId,
          targetEmployeeId: targetEmpId,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(json.message);
        setShowReassignModal(false);
      } else {
        toast.error(json.error || 'Failed to reassign work.');
      }
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 p-6 rounded-2xl text-white shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#F97316] text-white text-[10px] uppercase font-bold">HR & WORKFORCE</Badge>
            <span className="text-xs text-blue-200 font-mono">ALO_EMPLOYEE_ACCESS_SYSTEM</span>
          </div>
          <h1 className="text-xl font-black text-white mt-1">Enterprise Human Resource & Workforce System</h1>
          <p className="text-xs text-slate-300">
            Employee Accounts, Lifecycle Status, Protected Document Vault, Attendance, Leave & Payroll Governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowReassignModal(true)}
            variant="outline"
            className="border-slate-700 bg-slate-800 text-white text-xs font-bold gap-2 hover:bg-slate-700"
          >
            <ArrowRight className="w-4 h-4 text-[#F97316]" /> Work Reassignment
          </Button>
          <a href="/admin/access-control-center">
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[#2563EB] hover:bg-[#004088] text-white text-xs font-bold gap-2">
              <ShieldCheck className="w-4 h-4" /> Control Center
            </Button>
          </a>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Employees</p>
              <p className="text-xl font-black text-slate-900">{employees.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Staff</p>
              <p className="text-xl font-black text-slate-900">{employees.filter((e) => e.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Activation</p>
              <p className="text-xl font-black text-slate-900">{employees.filter((e) => e.status === 'invited').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Payroll Status</p>
              <p className="text-sm font-bold text-slate-900">{currentPayroll ? currentPayroll.status.toUpperCase() : 'NOT RUN'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* MAIN TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="Employees" className="text-xs font-bold gap-2">
            <Users className="w-3.5 h-3.5" /> Employee Directory
          </TabsTrigger>
          <TabsTrigger value="Leave" className="text-xs font-bold gap-2">
            <Calendar className="w-3.5 h-3.5" /> Attendance & Leave
          </TabsTrigger>
          <TabsTrigger value="Payroll" className="text-xs font-bold gap-2">
            <CreditCard className="w-3.5 h-3.5" /> Payroll Governance
          </TabsTrigger>
          <TabsTrigger value="Documents" className="text-xs font-bold gap-2">
            <FileText className="w-3.5 h-3.5" /> Document Center
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: EMPLOYEES */}
        <TabsContent value="Employees" className="space-y-4 pt-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID or email..."
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-44 text-xs">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Department & Branch</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{emp.employeeId} · {emp.email}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{emp.designation || 'Counselor'}</td>
                      <td className="p-3 text-slate-600">{emp.department || 'Counseling'} · {emp.branch || 'Dhaka Main'}</td>
                      <td className="p-3">
                        <Badge className="bg-slate-100 text-slate-800 text-[10px] uppercase font-bold">{emp.role}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={`${empStatusColors[emp.status] || 'bg-slate-100 text-slate-700'} text-[10px] font-bold uppercase`}>
                          {emp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: LEAVE & ATTENDANCE */}
        <TabsContent value="Leave" className="space-y-4 pt-3">
          <Card className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Leave Requests & Attendance Approvals</h3>
            <p className="text-xs text-slate-500">Track and approve casual, annual, and medical leave requests.</p>
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No pending leave requests requiring HR approval.
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: PAYROLL GOVERNANCE */}
        <TabsContent value="Payroll" className="space-y-4 pt-3">
          <Card className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Monthly Payroll Governance (August 2026)</h3>
                <p className="text-xs text-slate-500">AI calculates draft payroll ➔ Human HR checks ➔ Authorized Finance Approver approves (Maker-Checker Enforced).</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGeneratePayroll}
                  disabled={payrollLoading}
                  className="bg-[#2563EB] hover:bg-[#004088] text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  {payrollLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '1. Prepare AI Draft Payroll'}
                </Button>
                {currentPayroll && currentPayroll.status === 'draft' && (
                  <Button
                    onClick={handleApprovePayroll}
                    disabled={payrollLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    2. Human Final Approve & Disburse
                  </Button>
                )}
              </div>
            </div>

            {currentPayroll && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Payroll Cycle: {currentPayroll.monthYear}</span>
                  <Badge className="bg-blue-100 text-[#2563EB] font-bold uppercase">{currentPayroll.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 font-mono">
                  <div>Gross Payroll: <strong className="text-slate-900">৳{currentPayroll.totalGross?.toLocaleString()}</strong></div>
                  <div>Deductions (Tax/PF): <strong className="text-red-600">৳{currentPayroll.totalDeduction?.toLocaleString()}</strong></div>
                  <div>Net Payable: <strong className="text-emerald-700">৳{currentPayroll.totalNet?.toLocaleString()}</strong></div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 4: DOCUMENTS */}
        <TabsContent value="Documents" className="space-y-4 pt-3">
          <Card className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Confidential HR Document Vault</h3>
            <p className="text-xs text-slate-500">Official HR documents are immutable with version history (V1 ➔ V2). Direct file downloads require authorization.</p>
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Select an employee to manage appointment letters, NDAs, and IT policy acceptances.
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* REASSIGNMENT MODAL */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="p-6 bg-white w-full max-w-md rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-[#F97316]" /> Work Reassignment Tool
              </h3>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Exiting / Reassigning Employee</label>
                <select value={exitingEmpId} onChange={(e) => setExitingEmpId(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs mt-1">
                  <option value="">Select Employee...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Target Replacement Employee</label>
                <select value={targetEmpId} onChange={(e) => setTargetEmpId(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs mt-1">
                  <option value="">Select Target Replacement...</option>
                  {employees.filter((e) => e.id !== exitingEmpId).map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowReassignModal(false)} className="text-xs font-bold">
                Cancel
              </Button>
              <Button onClick={handleReassignWork} disabled={reassigning} className="bg-[#F97316] text-white text-xs font-bold px-4 py-2 rounded-xl">
                {reassigning ? 'Reassigning...' : 'Execute Reassignment'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
