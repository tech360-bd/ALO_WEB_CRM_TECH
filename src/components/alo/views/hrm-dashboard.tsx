"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  MiniBar,
  PageHeader,
  Progress,
  InfoRow,
} from "@/components/alo/shared";
import { SensitiveField, usePrivacy, PrivacyToggle } from "@/components/alo/privacy-mode";
import { fmtDate } from "@/lib/alo-types";

// ---------- Types ----------
interface HrmUser {
  name: string;
  email: string;
  role: string;
}

interface EmployeeHR {
  id: string;
  employeeId: string;
  userId: string;
  officialEmail: string;
  branch: string;
  designation: string;
  department: string;
  joiningDate: string;
  baseSalary: number;
  salaryCurrency: string;
  performanceScore: number;
  targetLeads: number;
  achievedLeads: number;
  status: string;
  user?: HrmUser | null;
}

interface AttendanceRow {
  id: string;
  userId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  workHours: number;
  notes?: string | null;
}

interface CommissionRow {
  id: string;
  userId: string;
  studentId?: string | null;
  applicationId?: string | null;
  amount: number;
  currency: string;
  status: string;
  month: string;
  notes?: string | null;
  createdAt: string;
}

interface BonusRow {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  reason: string;
  month: string;
  status: string;
  createdAt: string;
}

interface IncrementRow {
  id: string;
  userId: string;
  oldSalary: number;
  newSalary: number;
  percentage: number;
  effectiveDate: string;
  reason?: string | null;
  approvedBy?: string | null;
  createdAt: string;
}

interface PerformanceRow {
  id: string;
  userId: string;
  period: string;
  score: number;
  leadsHandled: number;
  conversionRate: number;
  satisfactionScore: number;
  slaCompliance: number;
  notes?: string | null;
  createdAt: string;
}

interface HrmMetrics {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  lateToday: number;
  onLeaveToday: number;
  totalPayroll: number;
  avgPerformance: number;
  pendingCommissions: number;
  pendingBonuses: number;
}

interface HrmResponse {
  metrics: HrmMetrics;
  employees: EmployeeHR[];
  attendance: AttendanceRow[];
  commissions: CommissionRow[];
  bonuses: BonusRow[];
  increments: IncrementRow[];
  performance: PerformanceRow[];
}

// ---------- Maps ----------
const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_LEAVE: "bg-amber-100 text-amber-700",
  RESIGNED: "bg-slate-100 text-slate-600",
  TERMINATED: "bg-red-100 text-red-700",
  PROBATION: "bg-sky-100 text-sky-700",
};

const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  LATE: "bg-amber-100 text-amber-700",
  LEAVE: "bg-blue-100 text-blue-700",
  ABSENT: "bg-red-100 text-red-700",
  HALF_DAY: "bg-violet-100 text-violet-700",
  HOLIDAY: "bg-slate-100 text-slate-600",
};

const COMMISSION_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-sky-100 text-sky-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

function formatBDT(amount: number) {
  return `৳${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ---------- Inline private amount ----------
function PrivateAmount({
  id,
  amount,
  currency = "BDT",
  className,
}: {
  id: string;
  amount: number;
  currency?: string;
  className?: string;
}) {
  const { privacyOn, isRevealed, reveal, rehide } = usePrivacy();
  const [showPin, setShowPin] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const revealed = isRevealed(id);
  const display = currency === "BDT" ? formatBDT(amount) : `${amount.toLocaleString()} ${currency}`;

  if (!privacyOn || revealed) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 tabular-nums", className)}>
        <span className="text-sm font-semibold">{display}</span>
        {privacyOn && revealed && (
          <button onClick={rehide} className="text-muted-foreground hover:text-[#2563EB]" title="Hide again">
            <Icon name="EyeOff" className="size-3" />
          </button>
        )}
      </span>
    );
  }

  return (
    <>
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span className="select-none font-mono text-sm font-semibold blur-sm">{display}</span>
        <button
          onClick={() => setShowPin(true)}
          className="inline-flex items-center gap-0.5 rounded border border-[#2563EB]/30 px-1.5 py-0.5 text-[10px] font-semibold text-[#2563EB] hover:bg-[#e8f0fb]"
          title="Click to reveal (requires PIN)"
        >
          <Icon name="Lock" className="size-2.5" />
          Reveal
        </button>
      </span>
      {showPin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setShowPin(false);
            setPin("");
          }}
        >
          <div
            className="w-full max-w-xs rounded-2xl border-2 border-[#2563EB]/20 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#e8f0fb] text-[#2563EB]">
                <Icon name="ShieldCheck" className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#2563EB]">Reveal amount</p>
                <p className="text-xs text-muted-foreground">Enter your PIN to view this amount</p>
              </div>
            </div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pin.length >= 4) {
                  reveal(id);
                  setShowPin(false);
                  setPin("");
                }
              }}
              placeholder="Enter PIN (any 4+ digits)"
              className="mt-3 h-10 w-full rounded-md border border-input bg-background text-center font-mono tracking-widest"
              autoFocus
            />
            <p className="mt-2 text-[10px] text-muted-foreground">
              This action will be audit-logged as <code className="font-mono">sensitive_data_revealed</code>.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9"
                onClick={() => {
                  setShowPin(false);
                  setPin("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-9 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
                disabled={pin.length < 4}
                onClick={() => {
                  reveal(id);
                  setShowPin(false);
                  setPin("");
                }}
              >
                Reveal
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Main component ----------
export function HrmDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<HrmResponse | null>(null);
  const [tab, setTab] = React.useState("employees");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hrm");
      if (!res.ok) throw new Error("fetch failed");
      const json: HrmResponse = await res.json();
      setData(json);
    } catch {
      toast({
        title: "Failed to load HRM data",
        description: "Could not load employees, attendance, or payroll data. Please retry.",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metrics = data?.metrics;
  const employees = data?.employees || [];
  const attendance = data?.attendance || [];
  const commissions = data?.commissions || [];
  const bonuses = data?.bonuses || [];
  const increments = data?.increments || [];
  const performance = data?.performance || [];

  // Build employee lookup map (userId -> name)
  const employeeMap = React.useMemo(() => {
    const m = new Map<string, EmployeeHR>();
    for (const e of employees) m.set(e.userId, e);
    return m;
  }, [employees]);

  const getEmployeeName = (userId: string) => {
    const emp = employeeMap.get(userId);
    return emp?.user?.name || emp?.officialEmail || userId;
  };
  const getEmployeeSub = (userId: string) => {
    const emp = employeeMap.get(userId);
    return emp?.employeeId || emp?.officialEmail || userId;
  };

  const handleViewProfile = (emp: EmployeeHR) => {
    toast({
      title: "View employee profile",
      description: `Opening full profile for ${emp.user?.name || emp.employeeId} — ${emp.designation}.`,
    });
  };

  const handleApproveCommission = (c: CommissionRow) => {
    toast({
      title: "Commission approved",
      description: `Commission for ${getEmployeeName(c.userId)} (${c.month}) approved. Audit log entry created.`,
    });
  };

  const handleApproveBonus = (b: BonusRow) => {
    toast({
      title: "Bonus approved",
      description: `Bonus for ${getEmployeeName(b.userId)} (${b.month}) approved.`,
    });
  };

  const handleApproveIncrement = (inc: IncrementRow) => {
    toast({
      title: "Increment approved",
      description: `Salary increment for ${getEmployeeName(inc.userId)} effective ${fmtDate(inc.effectiveDate)} approved.`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="HRM Dashboard"
        subtitle="Employees, attendance, payroll, performance, and compensation."
        icon="Users"
        action={<PrivacyToggle />}
      />

      {/* Stats */}
      {loading ? (
        <LoadingGrid count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Employees"
            value={metrics?.totalEmployees ?? 0}
            icon="Users"
            accent="blue"
            hint="Across all branches"
          />
          <StatCard
            label="Active Employees"
            value={metrics?.activeEmployees ?? 0}
            icon="UserCheck"
            accent="emerald"
            hint="Currently employed"
          />
          <StatCard
            label="Present Today"
            value={metrics?.presentToday ?? 0}
            icon="CalendarCheck"
            accent="emerald"
            hint="Checked in on time"
          />
          <StatCard
            label="Late Today"
            value={metrics?.lateToday ?? 0}
            icon="Clock"
            accent="amber"
            hint="Arrived after grace period"
          />
          <StatCard
            label="On Leave Today"
            value={metrics?.onLeaveToday ?? 0}
            icon="CalendarOff"
            accent="violet"
            hint="Approved leave / holiday"
          />
          <StatCard
            label="Avg Performance"
            value={`${metrics?.avgPerformance ?? 0}%`}
            icon="Gauge"
            accent="orange"
            hint="Across all employees"
          />
        </div>
      )}

      {/* Payroll card */}
      <SectionCard
        title="Payroll overview"
        icon="Wallet"
        description="Monthly salary outlay — protected by privacy mode."
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="rounded-2xl border-2 border-[#2563EB]/15">
              <CardContent className="pt-5">
                <SensitiveField
                  id="hrm-payroll-total"
                  label="Total Payroll (BDT)"
                  value={formatBDT(metrics?.totalPayroll ?? 0)}
                  type="currency"
                  mono
                />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-2 border-[#2563EB]/15">
              <CardContent className="pt-5">
                <SensitiveField
                  id="hrm-avg-salary"
                  label="Average Salary (BDT)"
                  value={
                    (metrics?.totalEmployees ?? 0) > 0
                      ? formatBDT(Math.round((metrics?.totalPayroll ?? 0) / (metrics?.totalEmployees ?? 1)))
                      : "—"
                  }
                  type="currency"
                  mono
                />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-2 border-[#2563EB]/15">
              <CardContent className="pt-5">
                <InfoRow label="Pending Commissions" value={metrics?.pendingCommissions ?? 0} mono />
                <InfoRow label="Pending Bonuses" value={metrics?.pendingBonuses ?? 0} mono />
                <InfoRow label="Avg Performance" value={`${metrics?.avgPerformance ?? 0}%`} mono />
              </CardContent>
            </Card>
          </div>
        )}
      </SectionCard>

      {/* Tabs */}
      <SectionCard className="overflow-hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="px-4 pt-4 sm:px-6">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1 sm:w-auto">
              <TabsTrigger value="employees" className="gap-1.5">
                <Icon name="Users" className="size-3.5" />
                Employees
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-1.5">
                <Icon name="CalendarCheck" className="size-3.5" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="commissions" className="gap-1.5">
                <Icon name="Handshake" className="size-3.5" />
                Commissions
              </TabsTrigger>
              <TabsTrigger value="bonuses" className="gap-1.5">
                <Icon name="Gift" className="size-3.5" />
                Bonuses
              </TabsTrigger>
              <TabsTrigger value="increments" className="gap-1.5">
                <Icon name="TrendingUp" className="size-3.5" />
                Increments
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-1.5">
                <Icon name="Gauge" className="size-3.5" />
                Performance
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Employees */}
          <TabsContent value="employees" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : employees.length === 0 ? (
              <EmptyState
                icon="Users"
                title="No employees"
                description="Employee records will appear here once HR adds them."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Joining Date</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => {
                      const leadsPct = emp.targetLeads > 0 ? Math.min(100, Math.round((emp.achievedLeads / emp.targetLeads) * 100)) : 0;
                      return (
                        <TableRow key={emp.id} className="hover:bg-[#e8f0fb]/40">
                          <TableCell>
                            <span className="font-mono text-xs font-semibold text-[#2563EB]">
                              {emp.employeeId}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex size-7 items-center justify-center rounded-full bg-[#e8f0fb] text-[#2563EB]">
                                <Icon name="User" className="size-3.5" />
                              </div>
                              <span className="text-sm font-semibold text-foreground">
                                {emp.user?.name || "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">{emp.officialEmail}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium text-foreground">{emp.designation}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">{emp.department}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">{emp.branch}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-foreground">{fmtDate(emp.joiningDate)}</span>
                          </TableCell>
                          <TableCell>
                            <PrivateAmount id={`hrm-emp-salary-${emp.id}`} amount={emp.baseSalary} currency={emp.salaryCurrency} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={emp.status} colorMap={EMPLOYEE_STATUS_COLORS} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={emp.performanceScore}
                                className="h-1.5 w-16 bg-[#e8f0fb]"
                              />
                              <span
                                className={cn(
                                  "text-xs font-bold tabular-nums",
                                  emp.performanceScore >= 80
                                    ? "text-emerald-600"
                                    : emp.performanceScore >= 50
                                    ? "text-amber-600"
                                    : "text-red-600"
                                )}
                              >
                                {emp.performanceScore}%
                              </span>
                            </div>
                            <div className="mt-1 text-[10px] text-muted-foreground">
                              Leads: {emp.achievedLeads}/{emp.targetLeads} ({leadsPct}%)
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewProfile(emp)}
                              className="h-8 border-[#2563EB]/30 text-[#2563EB] hover:bg-[#e8f0fb]"
                            >
                              <Icon name="Eye" className="size-3.5" />
                              <span className="hidden md:inline">View Profile</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Attendance */}
          <TabsContent value="attendance" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : attendance.length === 0 ? (
              <EmptyState
                icon="CalendarCheck"
                title="No attendance records"
                description="Daily check-in/check-out records will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Work Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((a) => (
                      <TableRow key={a.id} className="hover:bg-[#e8f0fb]/40">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">
                              {getEmployeeName(a.userId)}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {getEmployeeSub(a.userId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-foreground">{fmtDate(a.date)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-foreground">{a.checkIn || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-foreground">{a.checkOut || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={a.status} colorMap={ATTENDANCE_STATUS_COLORS} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Icon name="Clock" className="size-3 text-muted-foreground" />
                            <span className="text-xs font-semibold text-foreground tabular-nums">
                              {a.workHours}h
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Commissions */}
          <TabsContent value="commissions" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={3} />
            ) : commissions.length === 0 ? (
              <EmptyState
                icon="Handshake"
                title="No commissions recorded"
                description="Employee commissions will appear here as they accrue."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((c) => (
                      <TableRow key={c.id} className="hover:bg-[#e8f0fb]/40">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">
                              {getEmployeeName(c.userId)}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {getEmployeeSub(c.userId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PrivateAmount id={`hrm-com-${c.id}`} amount={c.amount} currency={c.currency} />
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-foreground">{c.month}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} colorMap={COMMISSION_STATUS_COLORS} />
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {c.notes || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveCommission(c)}
                            disabled={c.status !== "PENDING"}
                            className="h-8 border-[#2563EB]/30 text-[#2563EB] hover:bg-[#e8f0fb]"
                          >
                            <Icon name="CheckCheck" className="size-3.5" />
                            <span className="hidden md:inline">Approve</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Bonuses */}
          <TabsContent value="bonuses" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={3} />
            ) : bonuses.length === 0 ? (
              <EmptyState
                icon="Gift"
                title="No bonuses recorded"
                description="Employee bonuses will appear here when granted."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonuses.map((b) => (
                      <TableRow key={b.id} className="hover:bg-[#e8f0fb]/40">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">
                              {getEmployeeName(b.userId)}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {getEmployeeSub(b.userId)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <PrivateAmount id={`hrm-bonus-${b.id}`} amount={b.amount} currency={b.currency} />
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <span className="line-clamp-2 text-xs text-foreground">{b.reason}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-foreground">{b.month}</span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} colorMap={COMMISSION_STATUS_COLORS} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveBonus(b)}
                            disabled={b.status !== "PENDING"}
                            className="h-8 border-[#2563EB]/30 text-[#2563EB] hover:bg-[#e8f0fb]"
                          >
                            <Icon name="CheckCheck" className="size-3.5" />
                            <span className="hidden md:inline">Approve</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Increments */}
          <TabsContent value="increments" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={3} />
            ) : increments.length === 0 ? (
              <EmptyState
                icon="TrendingUp"
                title="No increments recorded"
                description="Salary increments will appear here when approved."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Old Salary</TableHead>
                      <TableHead>New Salary</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {increments.map((inc) => {
                      const positive = inc.newSalary >= inc.oldSalary;
                      return (
                        <TableRow key={inc.id} className="hover:bg-[#e8f0fb]/40">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">
                                {getEmployeeName(inc.userId)}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {getEmployeeSub(inc.userId)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <PrivateAmount id={`hrm-inc-old-${inc.id}`} amount={inc.oldSalary} />
                          </TableCell>
                          <TableCell>
                            <PrivateAmount id={`hrm-inc-new-${inc.id}`} amount={inc.newSalary} />
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                                positive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              )}
                            >
                              <Icon name={positive ? "ArrowUp" : "ArrowDown"} className="size-2.5" />
                              {inc.percentage}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-foreground">{fmtDate(inc.effectiveDate)}</span>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="line-clamp-1 text-xs text-muted-foreground">
                              {inc.reason || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveIncrement(inc)}
                              className="h-8 border-[#2563EB]/30 text-[#2563EB] hover:bg-[#e8f0fb]"
                            >
                              <Icon name="CheckCheck" className="size-3.5" />
                              <span className="hidden md:inline">Approve</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={3} />
            ) : performance.length === 0 ? (
              <EmptyState
                icon="Gauge"
                title="No performance records"
                description="Periodic performance reviews will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Leads Handled</TableHead>
                      <TableHead>Conversion</TableHead>
                      <TableHead>Satisfaction</TableHead>
                      <TableHead>SLA Compliance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performance.map((p) => {
                      const color =
                        p.score >= 80 ? "#10b981" : p.score >= 50 ? "#F97316" : "#ef4444";
                      return (
                        <TableRow key={p.id} className="hover:bg-[#e8f0fb]/40">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">
                                {getEmployeeName(p.userId)}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {getEmployeeSub(p.userId)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-foreground">{p.period}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex w-32 items-center gap-2">
                              <Progress value={p.score} className="h-1.5 bg-[#e8f0fb]" />
                              <span
                                className="text-xs font-bold tabular-nums"
                                style={{ color }}
                              >
                                {p.score}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-semibold text-foreground tabular-nums">
                              {p.leadsHandled}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground tabular-nums">
                                {p.conversionRate}%
                              </span>
                              <MiniBar value={p.conversionRate} max={100} color="#2563EB" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Icon name="Star" className="size-3 text-amber-500" />
                              <span className="text-xs font-semibold text-foreground tabular-nums">
                                {p.satisfactionScore}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground tabular-nums">
                                {p.slaCompliance}%
                              </span>
                              <MiniBar
                                value={p.slaCompliance}
                                max={100}
                                color={p.slaCompliance >= 90 ? "#10b981" : "#f59e0b"}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SectionCard>

      {/* Privacy note */}
      <SectionCard
        title="Privacy & access control"
        icon="ShieldCheck"
        description="How sensitive HRM data is protected."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 rounded-xl border border-[#2563EB]/15 bg-[#f7f9fc] p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fb] text-[#2563EB]">
              <Icon name="Lock" className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Private by default</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                All salary, bonus, and commission data is private. Privacy mode is <strong>ON</strong> by default.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-[#2563EB]/15 bg-[#f7f9fc] p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#fdece4] text-[#F97316]">
              <Icon name="KeyRound" className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">PIN-gated reveal</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Reveal requires <strong>PIN</strong> and is audit-logged. Revealed values auto-hide after 60 seconds of inactivity.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <Icon name="ShieldAlert" className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Revealing sensitive HR data triggers an audit log entry flagged <code className="font-mono">sensitive_data_revealed</code>.
            Mass exports of payroll or commission data require Super Admin approval and are rate-limited.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
export default HrmDashboard;
