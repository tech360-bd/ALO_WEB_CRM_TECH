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
  active: 'bg-crm-success-bg text-crm-success-text',
  invited: 'bg-crm-warning-bg text-crm-warning-text',
  suspended: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]',
  terminated: 'bg-crm-danger-bg text-crm-danger-text',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--alo-blue-soft)] p-6 rounded-[16px] text-[var(--alo-text)] border border-[var(--alo-brand-border)] shadow-[var(--alo-shadow-xs)]">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[var(--alo-cta)] text-white text-[11px] uppercase font-bold">HR & WORKFORCE</Badge>
            <span className="text-xs text-[var(--alo-brand-pale)] font-mono">ALO_EMPLOYEE_ACCESS_SYSTEM</span>
          </div>
          <h1 className="text-xl font-black text-white mt-1">Enterprise Human Resource & Workforce System</h1>
          <p className="text-xs text-[var(--alo-placeholder)]">
            Employee Accounts, Lifecycle Status, Protected Document Vault, Attendance, Leave & Payroll Governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowReassignModal(true)}
            variant="outline"
            className="border-[var(--alo-border)] bg-[var(--alo-page)] text-white text-xs font-bold gap-2 hover:bg-[var(--alo-page)]"
          >
            <ArrowRight className="w-4 h-4 text-[var(--alo-cta)]" /> Work Reassignment
          </Button>
          <Button asChild className="bg-[var(--alo-brand)] hover:bg-[#004088] text-white font-bold gap-2"><a href="/admin/access-control-center">
              <ShieldCheck className="w-4 h-4" /> Control Center
            </a></Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--alo-text-muted)] font-medium">Total Employees</p>
              <p className="text-xl font-black text-[var(--alo-text)]">{employees.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-crm-success-bg text-crm-success-text flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--alo-text-muted)] font-medium">Active Staff</p>
              <p className="text-xl font-black text-[var(--alo-text)]">{employees.filter((e) => e.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-crm-warning-bg text-crm-warning-text flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--alo-text-muted)] font-medium">Pending Activation</p>
              <p className="text-xl font-black text-[var(--alo-text)]">{employees.filter((e) => e.status === 'invited').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--alo-text-muted)] font-medium">Payroll Status</p>
              <p className="text-sm font-bold text-[var(--alo-text)]">{currentPayroll ? currentPayroll.status.toUpperCase() : 'NOT RUN'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* MAIN TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--alo-surface-muted)] p-1 rounded-xl">
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[var(--alo-border)]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--alo-text-muted)]" />
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

          <Card className="bg-white border border-[var(--alo-border)] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--alo-page)] border-b border-[var(--alo-border)] text-[var(--alo-body)] font-bold">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Department & Branch</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--alo-border)]">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[var(--alo-page)]">
                      <td className="p-3">
                        <div className="font-bold text-[var(--alo-text)]">{emp.name}</div>
                        <div className="text-[11px] text-[var(--alo-text-muted)] font-mono">{emp.employeeId} · {emp.email}</div>
                      </td>
                      <td className="p-3 font-medium text-[var(--alo-text)]">{emp.designation || 'Counselor'}</td>
                      <td className="p-3 text-[var(--alo-body)]">{emp.department || 'Counseling'} · {emp.branch || 'Dhaka Main'}</td>
                      <td className="p-3">
                        <Badge className="bg-[var(--alo-surface-muted)] text-[var(--alo-text)] text-[11px] uppercase font-bold">{emp.role}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={`${empStatusColors[emp.status] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'} text-[11px] font-bold uppercase`}>
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
          <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-xl space-y-3">
            <h3 className="font-bold text-sm text-[var(--alo-text)]">Leave Requests & Attendance Approvals</h3>
            <p className="text-xs text-[var(--alo-text-muted)]">Track and approve casual, annual, and medical leave requests.</p>
            <div className="p-8 text-center text-xs text-[var(--alo-text-muted)] bg-[var(--alo-page)] rounded-xl border border-dashed border-[var(--alo-border)]">
              No pending leave requests requiring HR approval.
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: PAYROLL GOVERNANCE */}
        <TabsContent value="Payroll" className="space-y-4 pt-3">
          <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[var(--alo-text)]">Monthly Payroll Governance (August 2026)</h3>
                <p className="text-xs text-[var(--alo-text-muted)]">AI calculates draft payroll ➔ Human HR checks ➔ Authorized Finance Approver approves (Maker-Checker Enforced).</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
 onClick={handleGeneratePayroll}
 disabled={payrollLoading}
 className="bg-[var(--alo-brand)] hover:bg-[#004088] text-white font-bold px-4 py-2 rounded-xl"
 >
                  {payrollLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '1. Prepare AI Draft Payroll'}
                </Button>
                {currentPayroll && currentPayroll.status === 'draft' && (
                  <Button
 onClick={handleApprovePayroll}
 disabled={payrollLoading}
 className="bg-[var(--alo-success-dark)] hover:bg-[var(--alo-success-dark)] text-white font-bold px-4 py-2 rounded-xl"
 >
                    2. Human Final Approve & Disburse
                  </Button>
                )}
              </div>
            </div>

            {currentPayroll && (
              <div className="p-4 bg-[var(--alo-page)] rounded-xl border border-[var(--alo-border)] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--alo-text)]">Payroll Cycle: {currentPayroll.monthYear}</span>
                  <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] font-bold uppercase">{currentPayroll.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 font-mono">
                  <div>Gross Payroll: <strong className="text-[var(--alo-text)]">৳{currentPayroll.totalGross?.toLocaleString()}</strong></div>
                  <div>Deductions (Tax/PF): <strong className="text-crm-danger-text">৳{currentPayroll.totalDeduction?.toLocaleString()}</strong></div>
                  <div>Net Payable: <strong className="text-crm-success-text">৳{currentPayroll.totalNet?.toLocaleString()}</strong></div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 4: DOCUMENTS */}
        <TabsContent value="Documents" className="space-y-4 pt-3">
          <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-xl space-y-3">
            <h3 className="font-bold text-sm text-[var(--alo-text)]">Confidential HR Document Vault</h3>
            <p className="text-xs text-[var(--alo-text-muted)]">Official HR documents are immutable with version history (V1 ➔ V2). Direct file downloads require authorization.</p>
            <div className="p-8 text-center text-xs text-[var(--alo-text-muted)] bg-[var(--alo-page)] rounded-xl border border-dashed border-[var(--alo-border)]">
              Select an employee to manage appointment letters, NDAs, and IT policy acceptances.
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* REASSIGNMENT MODAL */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-[var(--alo-page)]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="p-6 bg-white w-full max-w-md rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--alo-border)] pb-3">
              <h3 className="font-bold text-sm text-[var(--alo-text)] flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-[var(--alo-cta)]" /> Work Reassignment Tool
              </h3>
              <button onClick={() => setShowReassignModal(false)} className="text-[var(--alo-text-muted)] hover:text-[var(--alo-body)] font-bold text-base">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[var(--alo-body)]">Exiting / Reassigning Employee</label>
                <select value={exitingEmpId} onChange={(e) => setExitingEmpId(e.target.value)} className="w-full p-2 border border-[var(--alo-border)] rounded-lg text-xs mt-1">
                  <option value="">Select Employee...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[var(--alo-body)]">Target Replacement Employee</label>
                <select value={targetEmpId} onChange={(e) => setTargetEmpId(e.target.value)} className="w-full p-2 border border-[var(--alo-border)] rounded-lg text-xs mt-1">
                  <option value="">Select Target Replacement...</option>
                  {employees.filter((e) => e.id !== exitingEmpId).map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--alo-border)]">
              <Button variant="outline" onClick={() => setShowReassignModal(false)} className="text-xs font-bold">
                Cancel
              </Button>
              <Button onClick={handleReassignWork} disabled={reassigning} className="bg-[var(--alo-cta)] text-white font-bold px-4 py-2 rounded-xl">
                {reassigning ? 'Reassigning...' : 'Execute Reassignment'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
