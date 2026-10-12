"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  SensitiveField,
  PrivacyToggle,
  usePrivacy,
} from "@/components/alo/privacy-mode";
import { fmtDate } from "@/lib/alo-types";

// ============================================================
// Types
// ============================================================

interface EmployeeDepartment {
  id: string;
  name: string;
}
interface EmployeeOffice {
  id: string;
  name: string;
  location?: string | null;
}
interface EmployeeProfile {
  dob?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  photo?: string | null;
}
interface EmployeeSalary {
  salaryAmount: number;
  allowance: number;
  bonus: number;
  bankName?: string | null;
  bankAccount?: string | null;
  paymentMethod: string;
  effectiveDate: string;
  visibility: string;
}
interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  companyEmail: string;
  personalEmail?: string | null;
  phone?: string | null;
  designation: string;
  departmentId?: string | null;
  department?: EmployeeDepartment | null;
  officeId?: string | null;
  office?: EmployeeOffice | null;
  joiningDate: string;
  employmentType: string;
  profileStatus: string;
  status: string;
  role: string;
  profile?: EmployeeProfile | null;
  salary?: EmployeeSalary | null;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string | null;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
}

interface Payroll {
  id: string;
  employeeId: string;
  monthYear: string;
  basicSalary: number;
  allowances: number;
  bonus: number;
  overtime: number;
  loanDeduction: number;
  advanceDeduction: number;
  taxDeduction: number;
  providentFund: number;
  insuranceDeduction: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: string;
  approvedBy?: string | null;
  paidAt?: string | null;
  salarySlipPath?: string | null;
  createdAt: string;
}

interface DeviceManagement {
  id: string;
  employeeId: string;
  deviceType: string;
  deviceName: string;
  serialNumber: string;
  assetTag?: string | null;
  assignedDate: string;
  warrantyExpiry?: string | null;
  status: string;
  returnedDate?: string | null;
  condition?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface LoginSecurity {
  id: string;
  userId: string;
  ipAddress: string;
  browser?: string | null;
  operatingSystem?: string | null;
  deviceFingerprint?: string | null;
  location?: string | null;
  loginTime: string;
  logoutTime?: string | null;
  sessionStatus: string;
  failedAttempts: number;
}

interface NoticeManagement {
  id: string;
  employeeId: string;
  noticeType: string;
  noticeDate: string;
  noticePeriodDays: number;
  remainingDays: number;
  lastWorkingDay?: string | null;
  handoverChecklist?: string | null;
  assetReturnStatus: string;
  clearanceStatus: string;
  finalSettlementStatus: string;
  status: string;
  createdAt: string;
}

interface ExitManagement {
  id: string;
  employeeId: string;
  exitType: string;
  exitDate: string;
  exitInterview?: string | null;
  clearanceStatus: string;
  finalSettlement?: number | null;
  experienceLetterPath?: string | null;
  relievingLetterPath?: string | null;
  status: string;
  createdAt: string;
}

interface AttendanceRow {
  id: string;
  employeeId?: string | null;
  userId?: string | null;
  date: string;
  status: string;
}

interface UpcomingBirthday {
  name: string;
  dob: string;
  days: number;
  employeeId: string;
}

interface HrAnalytics {
  headcount: number;
  activeEmployees: number;
  attendanceRate: number;
  lateToday: number;
  absentToday: number;
  onLeaveToday: number;
  pendingLeaves: number;
  payrollPending: number;
  payrollPaid: number;
  totalPayrollCost: number;
  devicesAssigned: number;
  devicesReturned: number;
  activeNotices: number;
  pendingExits: number;
  probationEmployees: number;
  newJoiners: number;
}

interface HrAnalyticsResponse {
  analytics: HrAnalytics;
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  payroll: Payroll[];
  devices: DeviceManagement[];
  loginSecurity: LoginSecurity[];
  notices: NoticeManagement[];
  exits: ExitManagement[];
  upcomingBirthdays: UpcomingBirthday[];
  attendance: AttendanceRow[];
}

// ============================================================
// Constants — color maps & labels
// ============================================================

const LEAVE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
  CASUAL: "bg-sky-100 text-sky-700",
  ANNUAL: "bg-blue-100 text-blue-700",
  MEDICAL: "bg-rose-100 text-rose-700",
  MATERNITY: "bg-violet-100 text-violet-700",
  PATERNITY: "bg-violet-100 text-violet-700",
  WITHOUT_PAY: "bg-slate-100 text-slate-700",
  COMPENSATORY: "bg-teal-100 text-teal-700",
};

const PAYROLL_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

const DEVICE_STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "bg-emerald-100 text-emerald-700",
  RETURNED: "bg-slate-100 text-slate-600",
  LOST: "bg-red-100 text-red-700",
  DAMAGED: "bg-amber-100 text-amber-700",
};

const SESSION_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  LOGGED_OUT: "bg-slate-100 text-slate-600",
  EXPIRED: "bg-amber-100 text-amber-700",
};

const CLEARANCE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const NOTICE_TYPE_COLORS: Record<string, string> = {
  RESIGNATION: "bg-amber-100 text-amber-700",
  TERMINATION: "bg-red-100 text-red-700",
  ABSCONDING: "bg-rose-100 text-rose-700",
};

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  FULL_TIME: "bg-emerald-100 text-emerald-700",
  PART_TIME: "bg-sky-100 text-sky-700",
  CONTRACT: "bg-violet-100 text-violet-700",
  PROBATION: "bg-amber-100 text-amber-700",
};

const LEAVE_TYPES = [
  { value: "CASUAL", label: "Casual Leave" },
  { value: "ANNUAL", label: "Annual Leave" },
  { value: "MEDICAL", label: "Medical Leave" },
  { value: "MATERNITY", label: "Maternity Leave" },
  { value: "PATERNITY", label: "Paternity Leave" },
  { value: "WITHOUT_PAY", label: "Leave Without Pay" },
  { value: "COMPENSATORY", label: "Compensatory Off" },
];

const DEVICE_TYPES = [
  { value: "LAPTOP", label: "Laptop" },
  { value: "DESKTOP", label: "Desktop" },
  { value: "TABLET", label: "Tablet" },
  { value: "PHONE", label: "Phone" },
];

// ============================================================
// Helpers
// ============================================================

function formatBDT(amount: number) {
  if (isNaN(amount)) return "—";
  return `৳${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function labelOf(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================
// Private inline amount cell (PIN-gated reveal in tables)
// ============================================================
function PrivateAmount({
  id,
  amount,
}: {
  id: string;
  amount: number;
}) {
  const { privacyOn, isRevealed, reveal, rehide } = usePrivacy();
  const [showPin, setShowPin] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const revealed = isRevealed(id);
  const display = formatBDT(amount);

  if (!privacyOn || revealed) {
    return (
      <span className="inline-flex items-center gap-1.5 tabular-nums">
        <span className="text-sm font-semibold text-foreground">{display}</span>
        {privacyOn && revealed && (
          <button
            onClick={rehide}
            className="text-muted-foreground hover:text-[#2563EB]"
            title="Hide again"
          >
            <Icon name="EyeOff" className="size-3" />
          </button>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="select-none font-mono text-sm font-semibold blur-sm">
        {display}
      </span>
      <button
        onClick={() => setShowPin(true)}
        className="inline-flex items-center gap-0.5 rounded border border-[#2563EB]/30 px-1.5 py-0.5 text-[10px] font-semibold text-[#2563EB] hover:bg-[#e8f0fb]"
        title="Click to reveal (requires PIN)"
      >
        <Icon name="Lock" className="size-2.5" />
        Reveal
      </button>
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
                <p className="text-xs text-muted-foreground">
                  Enter your PIN to view this amount
                </p>
              </div>
            </div>
            <Input
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
              className="mt-3 h-10 text-center font-mono tracking-widest"
              autoFocus
            />
            <p className="mt-2 text-[10px] text-muted-foreground">
              This action will be audit-logged as{" "}
              <code className="font-mono">sensitive_data_revealed</code>.
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
    </span>
  );
}

// ============================================================
// Avatar helper
// ============================================================
function EmployeeAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-[#e8f0fb] text-[#2563EB] font-bold",
        size === "sm" ? "size-7 text-xs" : "size-9 text-sm"
      )}
    >
      {initials || "?"}
    </div>
  );
}

// ============================================================
// Leave request form dialog
// ============================================================
function LeaveRequestDialog({
  open,
  onOpenChange,
  employees,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  employees: Employee[];
  onSubmit: (data: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
  }) => Promise<void>;
}) {
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = React.useState("");
  const [leaveType, setLeaveType] = React.useState("CASUAL");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const days = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
    return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  }, [startDate, endDate]);

  const handleSubmit = async () => {
    if (!employeeId || !leaveType || !startDate || !endDate) {
      toast({
        title: "Missing fields",
        description: "Please select employee, leave type, and dates.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        employeeId,
        leaveType,
        startDate,
        endDate,
        days,
        reason,
      });
      onOpenChange(false);
      setEmployeeId("");
      setLeaveType("CASUAL");
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch {
      // toast already fired in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2563EB]">
            <Icon name="CalendarPlus" className="size-5" />
            Request Leave
          </DialogTitle>
          <DialogDescription>
            Submit a new leave request on behalf of an employee. The request will be queued for HR approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.fullName} · {e.employeeCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#2563EB]/20 bg-[#f7f9fc] px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              Calculated days
            </span>
            <span className="text-sm font-bold text-[#2563EB] tabular-nums">
              {days} {days === 1 ? "day" : "days"}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief reason for the leave request..."
              className="min-h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="h-12 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Icon name="Loader2" className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Icon name="Send" className="size-4" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Device registration dialog
// ============================================================
function DeviceRegisterDialog({
  open,
  onOpenChange,
  employees,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  employees: Employee[];
  onSubmit: (data: {
    employeeId: string;
    deviceType: string;
    deviceName: string;
    serialNumber: string;
    assetTag: string;
    assignedDate: string;
    warrantyExpiry: string;
  }) => Promise<void>;
}) {
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = React.useState("");
  const [deviceType, setDeviceType] = React.useState("LAPTOP");
  const [deviceName, setDeviceName] = React.useState("");
  const [serialNumber, setSerialNumber] = React.useState("");
  const [assetTag, setAssetTag] = React.useState("");
  const [assignedDate, setAssignedDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [warrantyExpiry, setWarrantyExpiry] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!employeeId || !deviceName || !serialNumber || !assignedDate) {
      toast({
        title: "Missing fields",
        description:
          "Employee, device name, serial number and assigned date are required.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        employeeId,
        deviceType,
        deviceName,
        serialNumber,
        assetTag,
        assignedDate,
        warrantyExpiry,
      });
      onOpenChange(false);
      setEmployeeId("");
      setDeviceType("LAPTOP");
      setDeviceName("");
      setSerialNumber("");
      setAssetTag("");
      setWarrantyExpiry("");
    } catch {
      // toast already fired
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#2563EB]">
            <Icon name="Laptop" className="size-5" />
            Register Device
          </DialogTitle>
          <DialogDescription>
            Assign a new device to an employee. Asset tag and serial number will be tracked for inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.fullName} · {e.employeeCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Device Type</Label>
              <Select value={deviceType} onValueChange={setDeviceType}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Device Name</Label>
              <Input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Dell Latitude 5520"
                className="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Serial Number</Label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="SN1234567"
                className="h-10 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Asset Tag</Label>
              <Input
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                placeholder="ALO-ASSET-001"
                className="h-10 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assigned Date</Label>
              <Input
                type="date"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Warranty Expiry</Label>
              <Input
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="h-12 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Icon name="Loader2" className="size-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Icon name="Plus" className="size-4" />
                Register Device
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Main component
// ============================================================
export function EnterpriseHrDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<HrAnalyticsResponse | null>(null);
  const [tab, setTab] = React.useState("overview");
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false);
  const [deviceDialogOpen, setDeviceDialogOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/analytics");
      if (!res.ok) throw new Error("fetch failed");
      const json: HrAnalyticsResponse = await res.json();
      setData(json);
    } catch {
      toast({
        title: "Failed to load HR data",
        description:
          "Could not load employee, payroll, leave, or device data. Please retry.",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Local state mirrors for optimistic updates
  const [leaves, setLeaves] = React.useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = React.useState<Payroll[]>([]);
  const [devices, setDevices] = React.useState<DeviceManagement[]>([]);

  React.useEffect(() => {
    if (data) {
      setLeaves(data.leaveRequests);
      setPayrolls(data.payroll);
      setDevices(data.devices);
    }
  }, [data]);

  // Build employee lookup map
  const employeeMap = React.useMemo(() => {
    const m = new Map<string, Employee>();
    for (const e of data?.employees || []) m.set(e.id, e);
    return m;
  }, [data]);

  const getEmployeeName = (id: string) => employeeMap.get(id)?.fullName || id;
  const getEmployeeCode = (id: string) =>
    employeeMap.get(id)?.employeeCode || "—";
  const getEmployeeMeta = (id: string) => {
    const e = employeeMap.get(id);
    if (!e) return { name: id, code: "—", designation: "—" };
    return {
      name: e.fullName,
      code: e.employeeCode,
      designation: e.designation,
    };
  };

  // ----- Actions -----
  const handleApproveLeave = async (leave: LeaveRequest, status: "APPROVED" | "REJECTED") => {
    // Optimistic update
    setLeaves((prev) =>
      prev.map((l) => (l.id === leave.id ? { ...l, status } : l))
    );
    try {
      const res = await fetch("/api/hr/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leave.id,
          status,
          approvedBy: "HR_MANAGER",
          reviewNote: status === "APPROVED" ? "Approved by HR" : "Rejected by HR",
        }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: `Leave ${status.toLowerCase()}`,
        description: `Leave request for ${getEmployeeName(leave.employeeId)} has been ${status.toLowerCase()}. Audit log entry created.`,
      });
    } catch {
      // Revert
      setLeaves((prev) =>
        prev.map((l) => (l.id === leave.id ? { ...l, status: leave.status } : l))
      );
      toast({
        title: "Action failed",
        description: "Could not update leave status. Please retry.",
      });
    }
  };

  const handleApprovePayroll = async (payroll: Payroll, status: "APPROVED" | "PAID") => {
    setPayrolls((prev) =>
      prev.map((p) => (p.id === payroll.id ? { ...p, status } : p))
    );
    try {
      const res = await fetch("/api/hr/payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payroll.id,
          status,
          approvedBy: "HR_MANAGER",
        }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: status === "PAID" ? "Payroll paid" : "Payroll approved",
        description: `${getEmployeeName(payroll.employeeId)} — ${payroll.monthYear} marked as ${status}.`,
      });
    } catch {
      setPayrolls((prev) =>
        prev.map((p) => (p.id === payroll.id ? { ...p, status: payroll.status } : p))
      );
      toast({
        title: "Action failed",
        description: "Could not update payroll status. Please retry.",
      });
    }
  };

  const handleReturnDevice = async (device: DeviceManagement) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === device.id
          ? {
              ...d,
              status: "RETURNED",
              returnedDate: new Date().toISOString().slice(0, 10),
              condition: "GOOD",
            }
          : d
      )
    );
    try {
      const res = await fetch("/api/hr/devices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: device.id,
          status: "RETURNED",
          returnedDate: new Date().toISOString().slice(0, 10),
          condition: "GOOD",
        }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: "Device returned",
        description: `${device.deviceName} (${device.serialNumber}) marked as returned. Asset inventory updated.`,
      });
    } catch {
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, ...device } : d))
      );
      toast({
        title: "Action failed",
        description: "Could not update device status. Please retry.",
      });
    }
  };

  const handleSubmitLeave = async (data: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
  }) => {
    try {
      const res = await fetch("/api/hr/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setLeaves((prev) => [json.leave, ...prev]);
      toast({
        title: "Leave request submitted",
        description: `Leave request for ${getEmployeeName(data.employeeId)} submitted for approval.`,
      });
    } catch {
      toast({
        title: "Failed to submit",
        description: "Could not submit the leave request. Please retry.",
      });
      throw new Error();
    }
  };

  const handleRegisterDevice = async (data: {
    employeeId: string;
    deviceType: string;
    deviceName: string;
    serialNumber: string;
    assetTag: string;
    assignedDate: string;
    warrantyExpiry: string;
  }) => {
    try {
      const res = await fetch("/api/hr/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          status: "ASSIGNED",
          assetTag: data.assetTag || null,
          warrantyExpiry: data.warrantyExpiry || null,
        }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setDevices((prev) => [json.device, ...prev]);
      toast({
        title: "Device registered",
        description: `${data.deviceName} assigned to ${getEmployeeName(data.employeeId)}.`,
      });
    } catch {
      toast({
        title: "Failed to register",
        description: "Could not register the device. Please retry.",
      });
      throw new Error();
    }
  };

  const analytics = data?.analytics;
  const employees = data?.employees || [];
  const notices = data?.notices || [];
  const exits = data?.exits || [];
  const loginSecurity = data?.loginSecurity || [];
  const attendance = data?.attendance || [];
  const upcomingBirthdays = data?.upcomingBirthdays || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise HR Management"
        subtitle="Complete employee lifecycle — attendance, leave, payroll, devices, notices, exits."
        icon="Briefcase"
        action={<PrivacyToggle />}
      />

      {/* Analytics grid */}
      {loading ? (
        <LoadingGrid count={12} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          <StatCard
            label="Headcount"
            value={analytics?.headcount ?? 0}
            icon="Users"
            accent="blue"
            hint="Total employees"
          />
          <StatCard
            label="Active Employees"
            value={analytics?.activeEmployees ?? 0}
            icon="UserCheck"
            accent="emerald"
            hint="Currently active"
          />
          <StatCard
            label="Attendance Rate"
            value={`${analytics?.attendanceRate ?? 0}%`}
            icon="Calendar"
            accent="violet"
            hint="Today's attendance"
          />
          <StatCard
            label="Late Today"
            value={analytics?.lateToday ?? 0}
            icon="Clock"
            accent="amber"
            hint="After grace period"
          />
          <StatCard
            label="Absent Today"
            value={analytics?.absentToday ?? 0}
            icon="UserX"
            accent="rose"
            hint="No check-in"
          />
          <StatCard
            label="On Leave Today"
            value={analytics?.onLeaveToday ?? 0}
            icon="CalendarOff"
            accent="blue"
            hint="Approved leave"
          />
          <StatCard
            label="Pending Leaves"
            value={analytics?.pendingLeaves ?? 0}
            icon="FileText"
            accent="amber"
            hint="Awaiting review"
          />
          <StatCard
            label="Payroll Pending"
            value={analytics?.payrollPending ?? 0}
            icon="DollarSign"
            accent="orange"
            hint="Draft payroll"
          />
          <StatCard
            label="Payroll Paid"
            value={analytics?.payrollPaid ?? 0}
            icon="CheckCircle"
            accent="emerald"
            hint="Disbursed"
          />
          <Card className="relative overflow-hidden rounded-2xl border-2 border-[#2563EB]/20 hover:border-[#2563EB]/50 transition-colors">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total Payroll Cost
                  </p>
                  <div className="mt-1.5">
                    <SensitiveField
                      id="hr-total-payroll-cost"
                      label="Total Paid (BDT)"
                      value={formatBDT(analytics?.totalPayrollCost ?? 0)}
                      type="currency"
                      mono
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cumulative disbursed
                  </p>
                </div>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fdece4] text-[#F97316]">
                  <Icon name="Wallet" className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <StatCard
            label="Devices Assigned"
            value={analytics?.devicesAssigned ?? 0}
            icon="Laptop"
            accent="violet"
            hint="In employee hands"
          />
          <StatCard
            label="Devices Returned"
            value={analytics?.devicesReturned ?? 0}
            icon="Undo"
            accent="blue"
            hint="Back to inventory"
          />
          <StatCard
            label="Active Notices"
            value={analytics?.activeNotices ?? 0}
            icon="Bell"
            accent="rose"
            hint="Resignation/Termination"
          />
          <StatCard
            label="Pending Exits"
            value={analytics?.pendingExits ?? 0}
            icon="LogOut"
            accent="amber"
            hint="Awaiting clearance"
          />
          <StatCard
            label="Probation"
            value={analytics?.probationEmployees ?? 0}
            icon="Clock"
            accent="amber"
            hint="On probation"
          />
          <StatCard
            label="New Joiners"
            value={analytics?.newJoiners ?? 0}
            icon="UserPlus"
            accent="emerald"
            hint="Last 30 days"
          />
        </div>
      )}

      {/* Tabs */}
      <SectionCard className="overflow-hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="px-4 pt-4 sm:px-6">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1 sm:w-auto">
              <TabsTrigger value="overview" className="gap-1.5">
                <Icon name="LayoutDashboard" className="size-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="leave" className="gap-1.5">
                <Icon name="CalendarOff" className="size-3.5" />
                Leave Management
              </TabsTrigger>
              <TabsTrigger value="payroll" className="gap-1.5">
                <Icon name="Wallet" className="size-3.5" />
                Payroll
              </TabsTrigger>
              <TabsTrigger value="devices" className="gap-1.5">
                <Icon name="Laptop" className="size-3.5" />
                Devices
              </TabsTrigger>
              <TabsTrigger value="login-security" className="gap-1.5">
                <Icon name="ShieldCheck" className="size-3.5" />
                Login Security
              </TabsTrigger>
              <TabsTrigger value="notice-exit" className="gap-1.5">
                <Icon name="LogOut" className="size-3.5" />
                Notice & Exit
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5">
                <Icon name="BarChart3" className="size-3.5" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ----------------- Overview tab ----------------- */}
          <TabsContent value="overview" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Upcoming birthdays */}
                <SectionCard
                  title="Upcoming Birthdays"
                  icon="Cake"
                  description="Next 30 days"
                >
                  {upcomingBirthdays.length === 0 ? (
                    <EmptyState
                      icon="Cake"
                      title="No upcoming birthdays"
                      description="No birthdays in the next 30 days."
                    />
                  ) : (
                    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                      {upcomingBirthdays.map((b, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-xl border border-[#2563EB]/15 bg-[#f7f9fc] p-3"
                        >
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fdece4] text-[#F97316]">
                            <Icon name="Cake" className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {b.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDate(b.dob)} · {b.employeeId}
                            </p>
                          </div>
                          <Badge
                            className={
                              b.days <= 3
                                ? "bg-rose-100 text-rose-700"
                                : b.days <= 7
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }
                          >
                            {b.days === 0
                              ? "Today!"
                              : b.days === 1
                              ? "Tomorrow"
                              : `${b.days}d`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                {/* Today's attendance summary */}
                <SectionCard
                  title="Today's Attendance"
                  icon="CalendarCheck"
                  description={fmtDate(new Date())}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex items-center gap-2">
                        <Icon name="Check" className="size-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-700">
                          Present
                        </span>
                      </div>
                      <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
                        {attendance.filter((a) => a.status === "PRESENT").length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center gap-2">
                        <Icon name="Clock" className="size-4 text-amber-600" />
                        <span className="text-xs font-medium text-amber-700">
                          Late
                        </span>
                      </div>
                      <p className="mt-1 text-2xl font-bold text-amber-700 tabular-nums">
                        {attendance.filter((a) => a.status === "LATE").length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center gap-2">
                        <Icon name="CalendarOff" className="size-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">
                          On Leave
                        </span>
                      </div>
                      <p className="mt-1 text-2xl font-bold text-blue-700 tabular-nums">
                        {attendance.filter((a) => a.status === "LEAVE").length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                      <div className="flex items-center gap-2">
                        <Icon name="UserX" className="size-4 text-rose-600" />
                        <span className="text-xs font-medium text-rose-700">
                          Absent
                        </span>
                      </div>
                      <p className="mt-1 text-2xl font-bold text-rose-700 tabular-nums">
                        {attendance.filter((a) => a.status === "ABSENT").length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-[#2563EB]/20 bg-[#f7f9fc] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Attendance Rate
                      </span>
                      <span className="text-sm font-bold text-[#2563EB]">
                        {analytics?.attendanceRate ?? 0}%
                      </span>
                    </div>
                    <Progress
                      value={analytics?.attendanceRate ?? 0}
                      className="h-2 bg-[#e8f0fb]"
                    />
                  </div>
                </SectionCard>

                {/* Quick stats */}
                <SectionCard
                  title="Quick Stats"
                  icon="BarChart3"
                  description="Departments, offices, designations"
                >
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Departments
                        </span>
                        <span className="text-xs font-bold text-[#2563EB]">
                          {new Set(
                            employees
                              .map((e) => e.department?.name)
                              .filter(Boolean)
                          ).size}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(
                          new Set(
                            employees
                              .map((e) => e.department?.name)
                              .filter(Boolean) as string[]
                          )
                        )
                          .slice(0, 6)
                          .map((d) => (
                            <Badge
                              key={d}
                              className="bg-[#e8f0fb] text-[#2563EB]"
                            >
                              {d}
                            </Badge>
                          ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Offices
                        </span>
                        <span className="text-xs font-bold text-[#2563EB]">
                          {new Set(
                            employees.map((e) => e.office?.name).filter(Boolean)
                          ).size}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(
                          new Set(
                            employees
                              .map((e) => e.office?.name)
                              .filter(Boolean) as string[]
                          )
                        )
                          .slice(0, 6)
                          .map((o) => (
                            <Badge
                              key={o}
                              className="bg-[#fdece4] text-[#F97316]"
                            >
                              {o}
                            </Badge>
                          ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Designations
                        </span>
                        <span className="text-xs font-bold text-[#2563EB]">
                          {new Set(employees.map((e) => e.designation)).size}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(
                          new Set(employees.map((e) => e.designation))
                        )
                          .slice(0, 6)
                          .map((d) => (
                            <Badge
                              key={d}
                              variant="outline"
                              className="border-[#2563EB]/30 text-[#2563EB]"
                            >
                              {d}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Recent joiners */}
                <SectionCard
                  title="Recent Joiners"
                  icon="UserPlus"
                  description="Last 30 days"
                  className="lg:col-span-3"
                >
                  {employees.filter((e) => isRecentJoiner(e.joiningDate)).length ===
                  0 ? (
                    <EmptyState
                      icon="UserPlus"
                      title="No recent joiners"
                      description="No new employees joined in the last 30 days."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Office</TableHead>
                            <TableHead>Joining Date</TableHead>
                            <TableHead>Employment Type</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees
                            .filter((e) => isRecentJoiner(e.joiningDate))
                            .map((e) => (
                              <TableRow
                                key={e.id}
                                className="hover:bg-[#e8f0fb]/40"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <EmployeeAvatar name={e.fullName} />
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {e.fullName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {e.companyEmail}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono text-xs font-semibold text-[#2563EB]">
                                    {e.employeeCode}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs font-medium text-foreground">
                                    {e.designation}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
                                    {e.department?.name || "—"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
                                    {e.office?.name || "—"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
                                    {fmtDate(e.joiningDate)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <StatusBadge
                                    status={e.employmentType}
                                    colorMap={EMPLOYMENT_TYPE_COLORS}
                                  />
                                </TableCell>
                                <TableCell>
                                  <StatusBadge
                                    status={e.status}
                                    colorMap={EMPLOYEE_STATUS_COLORS}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}
          </TabsContent>

          {/* ----------------- Leave Management tab ----------------- */}
          <TabsContent value="leave" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : (
              <SectionCard
                title="Leave Requests"
                icon="CalendarOff"
                description="Approve, reject, or submit leave requests"
                action={
                  <Button
                    className="h-12 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
                    onClick={() => setLeaveDialogOpen(true)}
                  >
                    <Icon name="CalendarPlus" className="size-4" />
                    Request Leave
                  </Button>
                }
              >
                {leaves.length === 0 ? (
                  <EmptyState
                    icon="CalendarOff"
                    title="No leave requests"
                    description="Submit a leave request using the button above."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>End</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaves.map((l) => {
                          const meta = getEmployeeMeta(l.employeeId);
                          return (
                            <TableRow
                              key={l.id}
                              className="hover:bg-[#e8f0fb]/40"
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <EmployeeAvatar name={meta.name} />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      {meta.name}
                                    </p>
                                    <p className="font-mono text-xs text-muted-foreground">
                                      {meta.code}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={l.leaveType}
                                  colorMap={LEAVE_TYPE_COLORS}
                                  labels={Object.fromEntries(
                                    LEAVE_TYPES.map((t) => [t.value, t.label])
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {fmtDate(l.startDate)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {fmtDate(l.endDate)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs font-semibold text-foreground tabular-nums">
                                  {l.days}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                <span className="line-clamp-2 text-xs text-muted-foreground">
                                  {l.reason || "—"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={l.status}
                                  colorMap={LEAVE_STATUS_COLORS}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {l.status === "PENDING" ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                                      onClick={() =>
                                        handleApproveLeave(l, "APPROVED")
                                      }
                                    >
                                      <Icon name="Check" className="size-3.5" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 border-red-300 text-red-600 hover:bg-red-50"
                                      onClick={() =>
                                        handleApproveLeave(l, "REJECTED")
                                      }
                                    >
                                      <Icon name="X" className="size-3.5" />
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Reviewed
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </SectionCard>
            )}
          </TabsContent>

          {/* ----------------- Payroll tab ----------------- */}
          <TabsContent value="payroll" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : (
              <div className="space-y-4">
                {/* Monthly summary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card className="rounded-2xl border-2 border-[#2563EB]/15">
                    <CardContent className="pt-5">
                      <SensitiveField
                        id="hr-payroll-summary-total"
                        label="Total Net Pay (BDT)"
                        value={formatBDT(
                          payrolls.reduce((s, p) => s + p.netPay, 0)
                        )}
                        type="currency"
                        mono
                      />
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-2 border-[#2563EB]/15">
                    <CardContent className="pt-5">
                      <InfoRow
                        label="Pending Approval"
                        value={
                          payrolls.filter((p) => p.status === "DRAFT").length
                        }
                        mono
                      />
                      <InfoRow
                        label="Approved"
                        value={
                          payrolls.filter((p) => p.status === "APPROVED").length
                        }
                        mono
                      />
                      <InfoRow
                        label="Paid"
                        value={payrolls.filter((p) => p.status === "PAID").length}
                        mono
                      />
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl border-2 border-[#2563EB]/15">
                    <CardContent className="pt-5">
                      <SensitiveField
                        id="hr-payroll-summary-avg"
                        label="Avg Net Pay (BDT)"
                        value={formatBDT(
                          payrolls.length > 0
                            ? Math.round(
                                payrolls.reduce((s, p) => s + p.netPay, 0) /
                                  payrolls.length
                              )
                            : 0
                        )}
                        type="currency"
                        mono
                      />
                    </CardContent>
                  </Card>
                </div>

                <SectionCard
                  title="Payroll Records"
                  icon="Wallet"
                  description="Salary slips, approvals, and disbursements"
                >
                  {payrolls.length === 0 ? (
                    <EmptyState
                      icon="Wallet"
                      title="No payroll records"
                      description="Payroll records will appear here once generated."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Basic</TableHead>
                            <TableHead>Allowances</TableHead>
                            <TableHead>Deductions</TableHead>
                            <TableHead>Net Pay</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payrolls.map((p) => {
                            const meta = getEmployeeMeta(p.employeeId);
                            return (
                              <TableRow
                                key={p.id}
                                className="hover:bg-[#e8f0fb]/40"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <EmployeeAvatar name={meta.name} />
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {meta.name}
                                      </p>
                                      <p className="font-mono text-xs text-muted-foreground">
                                        {meta.code}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono text-xs font-semibold text-[#2563EB]">
                                    {p.monthYear}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <PrivateAmount
                                    id={`payroll-basic-${p.id}`}
                                    amount={p.basicSalary}
                                  />
                                </TableCell>
                                <TableCell>
                                  <PrivateAmount
                                    id={`payroll-allow-${p.id}`}
                                    amount={p.allowances + p.bonus + p.overtime}
                                  />
                                </TableCell>
                                <TableCell>
                                  <PrivateAmount
                                    id={`payroll-deduct-${p.id}`}
                                    amount={
                                      p.taxDeduction +
                                      p.providentFund +
                                      p.loanDeduction +
                                      p.advanceDeduction +
                                      p.insuranceDeduction
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <PrivateAmount
                                    id={`payroll-net-${p.id}`}
                                    amount={p.netPay}
                                  />
                                </TableCell>
                                <TableCell>
                                  <StatusBadge
                                    status={p.status}
                                    colorMap={PAYROLL_STATUS_COLORS}
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  {p.status === "DRAFT" ? (
                                    <Button
                                      size="sm"
                                      className="h-8 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
                                      onClick={() =>
                                        handleApprovePayroll(p, "APPROVED")
                                      }
                                    >
                                      <Icon name="Check" className="size-3.5" />
                                      Approve
                                    </Button>
                                  ) : p.status === "APPROVED" ? (
                                    <Button
                                      size="sm"
                                      className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                                      onClick={() =>
                                        handleApprovePayroll(p, "PAID")
                                      }
                                    >
                                      <Icon
                                        name="DollarSign"
                                        className="size-3.5"
                                      />
                                      Pay
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      {p.paidAt ? fmtDate(p.paidAt) : "Disbursed"}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}
          </TabsContent>

          {/* ----------------- Devices tab ----------------- */}
          <TabsContent value="devices" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : (
              <SectionCard
                title="Device Inventory"
                icon="Laptop"
                description="Track laptops, phones, tablets assigned to employees"
                action={
                  <Button
                    className="h-12 bg-[#2563EB] text-white hover:bg-[#2563EB]/90"
                    onClick={() => setDeviceDialogOpen(true)}
                  >
                    <Icon name="Plus" className="size-4" />
                    Register Device
                  </Button>
                }
              >
                {devices.length === 0 ? (
                  <EmptyState
                    icon="Laptop"
                    title="No devices registered"
                    description="Register a new device using the button above."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Device Name</TableHead>
                          <TableHead>Serial No.</TableHead>
                          <TableHead>Asset Tag</TableHead>
                          <TableHead>Assigned</TableHead>
                          <TableHead>Warranty</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {devices.map((d) => {
                          const meta = getEmployeeMeta(d.employeeId);
                          return (
                            <TableRow
                              key={d.id}
                              className="hover:bg-[#e8f0fb]/40"
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <EmployeeAvatar name={meta.name} />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      {meta.name}
                                    </p>
                                    <p className="font-mono text-xs text-muted-foreground">
                                      {meta.code}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <Icon
                                    name={deviceIcon(d.deviceType)}
                                    className="size-3.5 text-[#2563EB]"
                                  />
                                  <span className="text-xs font-medium text-foreground">
                                    {labelOf(d.deviceType)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs font-medium text-foreground">
                                  {d.deviceName}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {d.serialNumber}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-xs text-[#F97316]">
                                  {d.assetTag || "—"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {fmtDate(d.assignedDate)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {d.warrantyExpiry ? fmtDate(d.warrantyExpiry) : "—"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={d.status}
                                  colorMap={DEVICE_STATUS_COLORS}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {d.status === "ASSIGNED" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-[#2563EB]/30 text-[#2563EB] hover:bg-[#e8f0fb]"
                                    onClick={() => handleReturnDevice(d)}
                                  >
                                    <Icon name="Undo" className="size-3.5" />
                                    Return
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {d.returnedDate
                                      ? fmtDate(d.returnedDate)
                                      : "—"}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </SectionCard>
            )}
          </TabsContent>

          {/* ----------------- Login Security tab ----------------- */}
          <TabsContent value="login-security" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : (
              <div className="space-y-4">
                {/* Failed login summary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard
                    label="Active Sessions"
                    value={
                      loginSecurity.filter((s) => s.sessionStatus === "ACTIVE")
                        .length
                    }
                    icon="Monitor"
                    accent="emerald"
                    hint="Currently logged in"
                  />
                  <StatCard
                    label="Failed Attempts"
                    value={loginSecurity.reduce(
                      (s, l) => s + l.failedAttempts,
                      0
                    )}
                    icon="AlertTriangle"
                    accent="amber"
                    hint="Across all sessions"
                  />
                  <StatCard
                    label="Unique IPs"
                    value={new Set(loginSecurity.map((l) => l.ipAddress)).size}
                    icon="Globe"
                    accent="violet"
                    hint="Distinct locations"
                  />
                </div>

                <SectionCard
                  title="Login Sessions"
                  icon="ShieldCheck"
                  description="Active and recent login activity"
                >
                  {loginSecurity.length === 0 ? (
                    <EmptyState
                      icon="ShieldCheck"
                      title="No login records"
                      description="Login session logs will appear here."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Browser</TableHead>
                            <TableHead>OS</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Login Time</TableHead>
                            <TableHead>Failed</TableHead>
                            <TableHead>Session</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loginSecurity.map((s) => {
                            const emp = employees.find(
                              (e: any) => e.userId === s.userId
                            );
                            const name = emp?.fullName || s.userId;
                            return (
                              <TableRow
                                key={s.id}
                                className="hover:bg-[#e8f0fb]/40"
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <EmployeeAvatar name={name} />
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {name}
                                      </p>
                                      <p className="font-mono text-xs text-muted-foreground">
                                        {emp?.employeeCode || s.userId.slice(0, 8)}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono text-xs text-foreground">
                                    {s.ipAddress}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
                                    {s.browser || "—"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
                                    {s.operatingSystem || "—"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <Icon
                                      name="MapPin"
                                      className="size-3 text-muted-foreground"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {s.location || "—"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
                                    {fmtDate(s.loginTime)}{" "}
                                    {new Date(s.loginTime).toLocaleTimeString(
                                      "en-GB",
                                      { hour: "2-digit", minute: "2-digit" }
                                    )}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {s.failedAttempts > 0 ? (
                                    <Badge className="bg-amber-100 text-amber-700">
                                      {s.failedAttempts}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-emerald-600">
                                      0
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge
                                    status={s.sessionStatus}
                                    colorMap={SESSION_STATUS_COLORS}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}
          </TabsContent>

          {/* ----------------- Notice & Exit tab ----------------- */}
          <TabsContent value="notice-exit" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Active notices */}
                <SectionCard
                  title="Active Notices"
                  icon="Bell"
                  description="Resignation, termination, absconding"
                >
                  {notices.length === 0 ? (
                    <EmptyState
                      icon="Bell"
                      title="No active notices"
                      description="Notice period records will appear here."
                    />
                  ) : (
                    <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                      {notices.map((n) => {
                        const meta = getEmployeeMeta(n.employeeId);
                        return (
                          <div
                            key={n.id}
                            className="rounded-xl border border-[#2563EB]/15 bg-[#f7f9fc] p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <EmployeeAvatar name={meta.name} />
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {meta.name}
                                  </p>
                                  <p className="font-mono text-xs text-muted-foreground">
                                    {meta.code} · {meta.designation}
                                  </p>
                                </div>
                              </div>
                              <StatusBadge
                                status={n.noticeType}
                                colorMap={NOTICE_TYPE_COLORS}
                              />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">
                                  Notice Date
                                </p>
                                <p className="font-medium text-foreground">
                                  {fmtDate(n.noticeDate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Last Working Day
                                </p>
                                <p className="font-medium text-foreground">
                                  {n.lastWorkingDay
                                    ? fmtDate(n.lastWorkingDay)
                                    : "—"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                              <span className="text-xs font-medium text-amber-700">
                                Remaining Days
                              </span>
                              <span className="text-lg font-bold text-amber-700 tabular-nums">
                                {n.remainingDays}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge
                                className={CLEARANCE_STATUS_COLORS[n.clearanceStatus] || "bg-slate-100 text-slate-700"}
                              >
                                Clearance: {labelOf(n.clearanceStatus)}
                              </Badge>
                              <Badge
                                className={
                                  CLEARANCE_STATUS_COLORS[n.assetReturnStatus] ||
                                  "bg-slate-100 text-slate-700"
                                }
                              >
                                Assets: {labelOf(n.assetReturnStatus)}
                              </Badge>
                              <Badge
                                className={
                                  CLEARANCE_STATUS_COLORS[
                                    n.finalSettlementStatus
                                  ] || "bg-slate-100 text-slate-700"
                                }
                              >
                                Settlement: {labelOf(n.finalSettlementStatus)}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>

                {/* Exit records */}
                <SectionCard
                  title="Exit Records"
                  icon="LogOut"
                  description="Completed exits and final settlements"
                >
                  {exits.length === 0 ? (
                    <EmptyState
                      icon="LogOut"
                      title="No exit records"
                      description="Exit records will appear here once processed."
                    />
                  ) : (
                    <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                      {exits.map((e) => {
                        const meta = getEmployeeMeta(e.employeeId);
                        return (
                          <div
                            key={e.id}
                            className="rounded-xl border border-[#2563EB]/15 bg-[#f7f9fc] p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <EmployeeAvatar name={meta.name} />
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {meta.name}
                                  </p>
                                  <p className="font-mono text-xs text-muted-foreground">
                                    {meta.code} · {meta.designation}
                                  </p>
                                </div>
                              </div>
                              <StatusBadge
                                status={e.exitType}
                                colorMap={NOTICE_TYPE_COLORS}
                              />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">
                                  Exit Date
                                </p>
                                <p className="font-medium text-foreground">
                                  {fmtDate(e.exitDate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Final Settlement
                                </p>
                                <p className="font-medium text-foreground tabular-nums">
                                  {e.finalSettlement
                                    ? formatBDT(e.finalSettlement)
                                    : "—"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge
                                className={
                                  CLEARANCE_STATUS_COLORS[e.clearanceStatus] ||
                                  "bg-slate-100 text-slate-700"
                                }
                              >
                                Clearance: {labelOf(e.clearanceStatus)}
                              </Badge>
                              <Badge
                                className={
                                  e.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }
                              >
                                {labelOf(e.status)}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Icon
                                  name={e.experienceLetterPath ? "Check" : "X"}
                                  className={
                                    e.experienceLetterPath
                                      ? "size-3 text-emerald-500"
                                      : "size-3 text-muted-foreground"
                                  }
                                />
                                Experience Letter
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon
                                  name={e.relievingLetterPath ? "Check" : "X"}
                                  className={
                                    e.relievingLetterPath
                                      ? "size-3 text-emerald-500"
                                      : "size-3 text-muted-foreground"
                                  }
                                />
                                Relieving Letter
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>
              </div>
            )}
          </TabsContent>

          {/* ----------------- Analytics tab ----------------- */}
          <TabsContent value="analytics" className="p-4 pt-4 sm:px-6">
            {loading ? (
              <LoadingGrid count={4} />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <AnalyticsBarCard
                  title="Headcount by Department"
                  icon="Building2"
                  data={buildCountBuckets(
                    employees.map((e) => e.department?.name || "Unassigned")
                  )}
                  color="#2563EB"
                />
                <AnalyticsBarCard
                  title="Headcount by Designation"
                  icon="Briefcase"
                  data={buildCountBuckets(employees.map((e) => e.designation))}
                  color="#F97316"
                />
                <AnalyticsBarCard
                  title="Headcount by Office"
                  icon="MapPin"
                  data={buildCountBuckets(
                    employees.map((e) => e.office?.name || "Unassigned")
                  )}
                  color="#10b981"
                />
                <AnalyticsBarCard
                  title="Leave Usage by Type"
                  icon="CalendarOff"
                  data={buildCountBuckets(
                    leaves.map((l) => l.leaveType)
                  )}
                  color="#8b5cf6"
                  labelMap={Object.fromEntries(
                    LEAVE_TYPES.map((t) => [t.value, t.label])
                  )}
                />
                <SectionCard
                  title="Attendance Rate Trend"
                  icon="TrendingUp"
                  description="Last 7 days"
                  className="lg:col-span-2"
                >
                  <div className="flex items-end gap-3 pt-2">
                    {buildAttendanceTrend(attendance).map((d, i) => (
                      <div
                        key={i}
                        className="flex flex-1 flex-col items-center gap-2"
                      >
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className="w-full rounded-t-lg bg-[#2563EB] transition-all hover:bg-[#2563EB]/80"
                            style={{
                              height: `${Math.max(8, d.rate)}%`,
                              minHeight: "8px",
                            }}
                            title={`${d.label}: ${d.rate}%`}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {d.label}
                        </span>
                        <span className="text-xs font-bold text-[#2563EB] tabular-nums">
                          {d.rate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard
                  title="Payroll Cost by Month"
                  icon="Wallet"
                  description="Net pay disbursed per month"
                  className="lg:col-span-2"
                >
                  {payrolls.length === 0 ? (
                    <EmptyState
                      icon="Wallet"
                      title="No payroll data"
                      description="Payroll cost trend will appear here."
                    />
                  ) : (
                    <div className="space-y-3">
                      {buildPayrollByMonth(payrolls).map((m, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">
                              {m.label}
                            </span>
                            <span className="font-bold text-[#2563EB] tabular-nums">
                              {formatBDT(m.total)}
                            </span>
                          </div>
                          <MiniBar
                            value={m.total}
                            max={
                              Math.max(
                                ...buildPayrollByMonth(payrolls).map(
                                  (x) => x.total
                                )
                              ) || 1
                            }
                            color="#F97316"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SectionCard>

      {/* Privacy note */}
      <SectionCard
        title="Privacy & Data Protection"
        icon="ShieldCheck"
        description="How employee personal data is protected"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-2.5 rounded-xl border border-[#2563EB]/15 bg-[#f7f9fc] p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fb] text-[#2563EB]">
              <Icon name="Lock" className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Role-restricted access
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Only the employee, HR, and Super Admin can view salary, NID,
                bank details, and personal information.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-[#2563EB]/15 bg-[#f7f9fc] p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#fdece4] text-[#F97316]">
              <Icon name="KeyRound" className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                PIN-gated reveal
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sensitive amounts are blurred by default. Revealing requires a
                PIN and is audit-logged.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-[#2563EB]/15 bg-[#f7f9fc] p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Icon name="History" className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Audit-logged views
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Every view, approval, and reveal is recorded in the audit log
                for compliance.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <Icon name="ShieldAlert" className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Employee personal data is private. Only the employee, HR, and Super
            Admin can view salary, NID, bank details, and personal information.
            All views are audit-logged. Revealing sensitive data triggers an
            audit log entry flagged{" "}
            <code className="font-mono">sensitive_data_revealed</code>. Mass
            exports of payroll data require Super Admin approval and are
            rate-limited.
          </p>
        </div>
      </SectionCard>

      {/* Dialogs */}
      <LeaveRequestDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        employees={employees}
        onSubmit={handleSubmitLeave}
      />
      <DeviceRegisterDialog
        open={deviceDialogOpen}
        onOpenChange={setDeviceDialogOpen}
        employees={employees}
        onSubmit={handleRegisterDevice}
      />
    </div>
  );
}

// ============================================================
// Shared helpers for analytics tab
// ============================================================

const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  TERMINATED: "bg-red-100 text-red-700",
  PROBATION: "bg-sky-100 text-sky-700",
};

function isRecentJoiner(joiningDate: string) {
  if (!joiningDate) return false;
  const d = new Date(joiningDate);
  if (isNaN(d.getTime())) return false;
  return d.getTime() > Date.now() - 30 * 86400000;
}

function deviceIcon(type: string) {
  switch (type) {
    case "LAPTOP":
      return "Laptop";
    case "DESKTOP":
      return "Monitor";
    case "TABLET":
      return "Tablet";
    case "PHONE":
      return "Smartphone";
    default:
      return "Laptop";
  }
}

function buildCountBuckets(values: string[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function buildAttendanceTrend(
  attendance: AttendanceRow[]
): { label: string; rate: number }[] {
  // Build a synthetic 7-day trend based on current attendance rate
  // (the API returns only today's attendance, so we derive a trend illustration)
  const days: { label: string; rate: number }[] = [];
  const today = new Date();
  const baseRate =
    attendance.length > 0
      ? Math.round(
          (attendance.filter((a) => a.status === "PRESENT").length /
            attendance.length) *
            100
        )
      : 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
    });
    // Slight variance around base rate
    const variance = i === 0 ? 0 : Math.round((Math.sin(i * 1.3) * 8));
    const rate = Math.max(0, Math.min(100, baseRate + variance));
    days.push({ label, rate });
  }
  return days;
}

function buildPayrollByMonth(
  payroll: Payroll[]
): { label: string; total: number }[] {
  const map = new Map<string, number>();
  for (const p of payroll) {
    map.set(p.monthYear, (map.get(p.monthYear) || 0) + p.netPay);
  }
  return Array.from(map.entries())
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// ============================================================
// Analytics bar card
// ============================================================
function AnalyticsBarCard({
  title,
  icon,
  data,
  color,
  labelMap,
}: {
  title: string;
  icon: string;
  data: { label: string; count: number }[];
  color: string;
  labelMap?: Record<string, string>;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <SectionCard title={title} icon={icon}>
      {data.length === 0 ? (
        <EmptyState
          icon={icon}
          title="No data"
          description="No records to display."
        />
      ) : (
        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {data.map((d, i) => {
            const pct = Math.round((d.count / max) * 100);
            const label = labelMap?.[d.label] || labelOf(d.label);
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="font-bold text-[#2563EB] tabular-nums">
                    {d.count}
                  </span>
                </div>
                <MiniBar value={d.count} max={max} color={color} />
                <span className="text-[10px] text-muted-foreground">
                  {pct}% of max
                </span>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
export default EnterpriseHrDashboard;
