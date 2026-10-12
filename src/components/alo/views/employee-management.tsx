"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  InfoRow,
  PageHeader,
} from "@/components/alo/shared";
import { SensitiveField, PrivacyToggle, usePrivacy } from "@/components/alo/privacy-mode";
import { fmtDate } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types — matches /api/employees response shape
// ---------------------------------------------------------------------------

type EmployeeProfile = {
  id: string;
  dob?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  photo?: string | null;
};

type EmployeeEducation = {
  id: string;
  degree: string;
  institution: string;
  passingYear: string;
  result?: string | null;
  certificatePath?: string | null;
};

type EmployeeEmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  address?: string | null;
};

type EmployeeSalary = {
  id: string;
  salaryAmount: number;
  allowance: number;
  bonus: number;
  bankName?: string | null;
  bankAccount?: string | null;
  paymentMethod: string;
  effectiveDate: string;
  visibility: string;
} | null;

type EmployeeDocument = {
  id: string;
  documentType: string;
  filePath?: string | null;
  status: string;
  reviewerId?: string | null;
  reviewNote?: string | null;
  createdAt?: string;
};

type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  companyEmail: string;
  personalEmail?: string | null;
  phone?: string | null;
  designation: string;
  department?: { id: string; name: string; code?: string } | null;
  office?: { id: string; name: string; code?: string } | null;
  joiningDate: string;
  employmentType: string;
  profileStatus: string;
  status: string;
  role: string;
  profile?: EmployeeProfile | null;
  salary?: EmployeeSalary;
  education?: EmployeeEducation[];
  emergencyContacts?: EmployeeEmergencyContact[];
  documents?: EmployeeDocument[];
  _count?: { documents: number; education: number; emergencyContacts: number };
};

type EmployeeDetailResponse = {
  employee: Employee;
  canViewPrivate: boolean;
  privacyNote: string;
};

type EmployeeListResponse = {
  employees: Employee[];
  departments: { id: string; name: string; code?: string }[];
  offices: { id: string; name: string; code?: string }[];
  designations: string[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROFILE_STATUS_COLORS: Record<string, string> = {
  INCOMPLETE: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  UNDER_REVIEW: "bg-sky-100 text-sky-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  CORRECTION_REQUIRED: "bg-rose-100 text-rose-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  TERMINATED: "bg-slate-200 text-slate-600",
};

const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SUSPENDED: "bg-rose-100 text-rose-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  TERMINATED: "bg-slate-200 text-slate-600",
};

const PROFILE_STATUS_OPTIONS = [
  { value: "INCOMPLETE", label: "Incomplete" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "CORRECTION_REQUIRED", label: "Correction Required" },
];

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "HR_MANAGER", label: "HR Manager" },
  { value: "FINANCE", label: "Finance" },
  { value: "COUNSELOR", label: "Counselor" },
  { value: "APPLICATION_TEAM", label: "Application Team" },
  { value: "VISA_OFFICER", label: "Visa Officer" },
  { value: "MARKETING_MANAGER", label: "Marketing Manager" },
  { value: "MARKETING", label: "Marketing" },
  { value: "PARTNER", label: "Partner" },
  { value: "STAFF", label: "Staff" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "PROBATION", label: "Probation" },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  NID: "National ID",
  PASSPORT: "Passport",
  ACADEMIC_CERT: "Academic Certificate",
  EXPERIENCE_LETTER: "Experience Letter",
  APPOINTMENT_LETTER: "Appointment Letter",
  CONTRACT: "Employment Contract",
  NDA: "NDA",
  OTHER: "Other",
};

const DOC_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const SUPER_ADMIN_ID = "seed-super-admin";

// Profile workflow stages for the visual note
const PROFILE_WORKFLOW = [
  { key: "INCOMPLETE", label: "Incomplete", icon: "CircleDashed", color: "text-slate-500" },
  { key: "SUBMITTED", label: "Submitted", icon: "Send", color: "text-amber-600" },
  { key: "UNDER_REVIEW", label: "Under Review", icon: "Search", color: "text-sky-600" },
  { key: "APPROVED", label: "Approved", icon: "CheckCircle", color: "text-emerald-600" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtBDT(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return `৳${amount.toLocaleString("en-BD")}`;
}

function joinName(s?: { name?: string } | null): string {
  return s?.name || "—";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmployeeManagement() {
  const { toast } = useToast();
  const { privacyOn } = usePrivacy();

  const [data, setData] = React.useState<EmployeeListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState("");
  const [filterDesignation, setFilterDesignation] = React.useState("ALL");
  const [filterDepartment, setFilterDepartment] = React.useState("ALL");
  const [filterProfileStatus, setFilterProfileStatus] = React.useState("ALL");

  // Profile dialog
  const [profileEmp, setProfileEmp] = React.useState<Employee | null>(null);
  const [profileDetail, setProfileDetail] = React.useState<EmployeeDetailResponse | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileTab, setProfileTab] = React.useState("personal");

  // Create dialog
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createResult, setCreateResult] = React.useState<{
    activationLink: string;
    message: string;
    emailPreview: { subject: string; body: string };
    employeeCode: string;
    companyEmail: string;
  } | null>(null);

  // ----- Load ------------------------------------------------------------

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDesignation !== "ALL") params.set("designation", filterDesignation);
      if (filterDepartment !== "ALL") params.set("departmentId", filterDepartment);
      if (filterProfileStatus !== "ALL") params.set("profileStatus", filterProfileStatus);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/employees${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as EmployeeListResponse;
      setData(json);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again later.";
      toast({ title: "Couldn’t load employees", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filterDesignation, filterDepartment, filterProfileStatus, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  // ----- Derived ---------------------------------------------------------

  const employees = data?.employees ?? [];
  const departments = data?.departments ?? [];
  const offices = data?.offices ?? [];
  const designations = data?.designations ?? [];

  const filtered = React.useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.companyEmail.toLowerCase().includes(q) ||
        (e.phone || "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  const stats = React.useMemo(() => {
    const total = employees.length;
    const pending = employees.filter(
      (e) => e.profileStatus === "SUBMITTED" || e.profileStatus === "UNDER_REVIEW"
    ).length;
    const activeToday = employees.filter((e) => e.status === "ACTIVE").length;
    const suspended = employees.filter((e) => e.status === "SUSPENDED").length;
    return { total, pending, activeToday, suspended };
  }, [employees]);

  // ----- Handlers --------------------------------------------------------

  const openProfile = async (emp: Employee) => {
    setProfileEmp(emp);
    setProfileDetail(null);
    setProfileLoading(true);
    setProfileTab("personal");
    try {
      const res = await fetch(
        `/api/employees/${emp.id}?viewerId=${SUPER_ADMIN_ID}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setProfileDetail(json as EmployeeDetailResponse);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again later.";
      toast({ title: "Couldn’t load employee profile", description: msg, variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleApproveProfile = async (emp: Employee) => {
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileStatus: "APPROVED", updatedById: SUPER_ADMIN_ID }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Profile approved",
        description: `${emp.fullName}’s profile is now APPROVED. Employee notified.`,
      });
      load();
      if (profileEmp?.id === emp.id) openProfile(emp);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Approval failed", description: msg, variant: "destructive" });
    }
  };

  const handleResendActivation = async (emp: Employee) => {
    try {
      const res = await fetch(`/api/employees/activate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: emp.id, requestedById: SUPER_ADMIN_ID }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      toast({
        title: "Activation link resent",
        description: `New link sent to ${emp.companyEmail}. Expires in 7 days.`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Resend failed", description: msg, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const next = emp.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, updatedById: SUPER_ADMIN_ID }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: next === "SUSPENDED" ? "Employee suspended" : "Employee reactivated",
        description: `${emp.fullName} (${emp.employeeCode}) is now ${next.toLowerCase()}.`,
      });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Status change failed", description: msg, variant: "destructive" });
    }
  };

  const handleCreateEmployee = async (form: FormData) => {
    setCreating(true);
    try {
      const body = {
        fullName: form.get("fullName"),
        companyEmail: form.get("companyEmail"),
        designation: form.get("designation"),
        departmentId: form.get("departmentId") || undefined,
        officeId: form.get("officeId") || undefined,
        role: form.get("role") || "STAFF",
        employmentType: form.get("employmentType") || "FULL_TIME",
        joiningDate: form.get("joiningDate") || new Date().toISOString().slice(0, 10),
        createdById: SUPER_ADMIN_ID,
      };
      const res = await fetch(`/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setCreateResult({
        activationLink: json.activationLink,
        message: json.message,
        emailPreview: json.emailPreview,
        employeeCode: json.employee.employeeCode,
        companyEmail: json.employee.companyEmail,
      });
      toast({
        title: "Employee account created",
        description: `${json.employee.employeeCode} — activation email sent to ${json.employee.companyEmail}.`,
      });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Couldn’t create employee", description: msg, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const copyActivationLink = (link: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    toast({ title: "Link copied", description: "Activation link copied to clipboard." });
  };

  // ----- Render ----------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        icon="UserCog"
        subtitle="Create, manage, and review employee accounts. Private profiles are protected."
        action={<PrivacyToggle />}
      />

      {/* Stats row */}
      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Employees" value={stats.total} icon="Users" accent="blue" />
          <StatCard label="Pending Review" value={stats.pending} icon="ClipboardList" accent="amber" hint="Submitted / Under review" />
          <StatCard label="Active Today" value={stats.activeToday} icon="UserCheck" accent="emerald" />
          <StatCard label="Suspended" value={stats.suspended} icon="Ban" accent="rose" />
        </div>
      )}

      {/* Filters */}
      <SectionCard
        title="Filters"
        description="Narrow the employee list by designation, department, or profile status."
        icon="Filter"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="search" className="text-xs">Search</Label>
            <div className="relative mt-1">
              <Icon name="Search" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, code, email, phone…"
                className="h-10 pl-8"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="f-designation" className="text-xs">Designation</Label>
            <Select value={filterDesignation} onValueChange={setFilterDesignation}>
              <SelectTrigger id="f-designation" className="mt-1 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All designations</SelectItem>
                {designations.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="f-dept" className="text-xs">Department</Label>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger id="f-dept" className="mt-1 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="f-profile" className="text-xs">Profile Status</Label>
            <Select value={filterProfileStatus} onValueChange={setFilterProfileStatus}>
              <SelectTrigger id="f-profile" className="mt-1 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {PROFILE_STATUS_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Employee table */}
      {loading ? (
        <LoadingGrid count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="Users"
          title="No employees match your filters"
          description="Try adjusting the filters above, or create a new employee account."
          action={
            <Button className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-12" onClick={() => { setCreateResult(null); setCreateOpen(true); }}>
              <Icon name="Plus" className="size-4" />
              Create Employee
            </Button>
          }
        />
      ) : (
        <SectionCard
          title="Employees"
          description={`${filtered.length} of ${employees.length} employees`}
          icon="Users"
          action={
            <Button className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-12" onClick={() => { setCreateResult(null); setCreateOpen(true); }}>
              <Icon name="Plus" className="size-4" />
              Create Employee
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Designation</TableHead>
                  <TableHead className="hidden lg:table-cell">Department</TableHead>
                  <TableHead className="hidden xl:table-cell">Office</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-xs font-semibold text-[#0057B8]">
                      {emp.employeeCode}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{emp.fullName}</div>
                      <div className="text-[10px] text-muted-foreground">{emp.companyEmail}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">
                        {emp.designation}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {joinName(emp.department)}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                      {joinName(emp.office)}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {fmtDate(emp.joiningDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={emp.profileStatus} colorMap={PROFILE_STATUS_COLORS} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={emp.status} colorMap={EMPLOYEE_STATUS_COLORS} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => openProfile(emp)}>
                          <Icon name="Eye" className="size-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        {(emp.profileStatus === "SUBMITTED" || emp.profileStatus === "UNDER_REVIEW") && (
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600 text-white hover:bg-emerald-600/90"
                            onClick={() => handleApproveProfile(emp)}
                          >
                            <Icon name="Check" className="size-3.5" />
                            <span className="hidden md:inline">Approve</span>
                          </Button>
                        )}
                        <DropdownActions
                          emp={emp}
                          onEdit={() =>
                            toast({
                              title: "Edit employee",
                              description: `Inline editor for ${emp.fullName} opens here (designation, department, role).`,
                            })
                          }
                          onResend={() => handleResendActivation(emp)}
                          onToggleStatus={() => handleToggleStatus(emp)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}

      {/* Profile workflow + privacy notes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Workflow */}
        <Card className="rounded-2xl border-2 border-[#0057B8]/15">
          <CardContent className="pt-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#e8f0fb] text-[#0057B8]">
                <Icon name="GitBranch" className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0057B8]">Profile Review Workflow</p>
                <p className="text-xs text-muted-foreground">HR reviews and approves employee profiles after self-completion.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {PROFILE_WORKFLOW.map((s, i) => (
                <React.Fragment key={s.key}>
                  <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5">
                    <Icon name={s.icon} className={cn("size-3.5", s.color)} />
                    <span className="text-xs font-medium">{s.label}</span>
                  </div>
                  {i < PROFILE_WORKFLOW.length - 1 && (
                    <Icon name="ArrowRight" className="size-3.5 text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5">
              <Icon name="AlertTriangle" className="size-3.5 text-rose-600" />
              <span className="text-xs text-rose-700">If issues found → Correction Required (HR sends back)</span>
            </div>
          </CardContent>
        </Card>

        {/* Privacy note */}
        <Card className="rounded-2xl border-2 border-[#E8501A]/20 bg-[#fdece4]/30">
          <CardContent className="pt-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#E8501A] text-white">
                <Icon name="ShieldCheck" className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#E8501A]">Profile Privacy Policy</p>
                <p className="text-xs text-muted-foreground">Private data is hidden from normal users.</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-foreground/80">
              Employee personal information — salary, emergency contact, personal address, education
              documents, NID/passport, bank details, HR documents, leave records — is hidden from
              normal users.
            </p>
            <p className="mt-2 text-xs font-semibold text-[#0057B8]">Who can view private data:</p>
            <ul className="mt-1.5 space-y-1 text-xs text-foreground/80">
              <li className="flex items-center gap-1.5"><Icon name="Check" className="size-3 text-emerald-600" /> The employee themselves</li>
              <li className="flex items-center gap-1.5"><Icon name="Check" className="size-3 text-emerald-600" /> Super Admin</li>
              <li className="flex items-center gap-1.5"><Icon name="Check" className="size-3 text-emerald-600" /> Chairman</li>
              <li className="flex items-center gap-1.5"><Icon name="Check" className="size-3 text-emerald-600" /> HR Manager (with permission)</li>
            </ul>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Privacy mode is currently <strong>{privacyOn ? "ON" : "OFF"}</strong>. Toggle in the header to blur fields by default.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Employee Profile Dialog ---- */}
      <Dialog open={!!profileEmp} onOpenChange={(o) => { if (!o) { setProfileEmp(null); setProfileDetail(null); } }}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-3xl">
          {profileEmp && (
            <>
              <DialogHeader className="border-b border-border/60 px-6 py-4">
                <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
                  <Icon name="UserSquare" className="size-5" />
                  Employee Profile
                </DialogTitle>
                <DialogDescription>
                  Full employee record. Private fields are protected by PrivacyGuard.
                </DialogDescription>
              </DialogHeader>

              {profileLoading ? (
                <div className="px-6 py-10">
                  <div className="h-24 animate-pulse rounded-xl bg-muted" />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="h-16 animate-pulse rounded-lg bg-muted" />
                    <div className="h-16 animate-pulse rounded-lg bg-muted" />
                  </div>
                </div>
              ) : profileDetail ? (
                <EmployeeProfileBody
                  detail={profileDetail}
                  tab={profileTab}
                  onTabChange={setProfileTab}
                  onApprove={() => handleApproveProfile(profileDetail.employee)}
                  onResend={() => handleResendActivation(profileDetail.employee)}
                  onToggleStatus={() => handleToggleStatus(profileDetail.employee)}
                  onDownloadDoc={(doc) => {
                    if (!profileDetail.canViewPrivate) {
                      toast({
                        title: "Download blocked",
                        description: "You don’t have permission to download this document.",
                        variant: "destructive",
                      });
                      return;
                    }
                    toast({
                      title: "Download started",
                      description: `${DOC_TYPE_LABELS[doc.documentType] || doc.documentType} is being prepared.`,
                    });
                  }}
                />
              ) : (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Couldn’t load profile.
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- Create Employee Dialog ---- */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateResult(null); }}>
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border/60 px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
              <Icon name="UserPlus" className="size-5" />
              Create Employee Account
            </DialogTitle>
            <DialogDescription>
              An activation email will be sent. The employee must set a password within 7 days.
            </DialogDescription>
          </DialogHeader>

          {createResult ? (
            <CreateEmployeeSuccess
              result={createResult}
              onClose={() => { setCreateOpen(false); setCreateResult(null); }}
              onResend={() =>
                toast({
                  title: "Activation email queued",
                  description: `A new link will be sent to ${createResult.companyEmail}.`,
                })
              }
              onCopy={() => copyActivationLink(createResult.activationLink)}
            />
          ) : (
            <form action={handleCreateEmployee} className="flex max-h-[60vh] flex-col overflow-hidden">
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="ce-name">Full Name *</Label>
                    <Input id="ce-name" name="fullName" required placeholder="e.g. Sadia Rahman" className="mt-1 h-11" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="ce-email">Company Email *</Label>
                    <Input id="ce-email" name="companyEmail" type="email" required placeholder="sadia.rahman@aloeducation.com" className="mt-1 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="ce-desig">Designation *</Label>
                    <Select name="designation" required>
                      <SelectTrigger id="ce-desig" className="mt-1 h-11"><SelectValue placeholder="Select designation" /></SelectTrigger>
                      <SelectContent>
                        {designations.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ce-role">Role</Label>
                    <Select name="role" defaultValue="STAFF">
                      <SelectTrigger id="ce-role" className="mt-1 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ce-dept">Department</Label>
                    <Select name="departmentId">
                      <SelectTrigger id="ce-dept" className="mt-1 h-11"><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ce-office">Office</Label>
                    <Select name="officeId">
                      <SelectTrigger id="ce-office" className="mt-1 h-11"><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>
                        {offices.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ce-type">Employment Type</Label>
                    <Select name="employmentType" defaultValue="FULL_TIME">
                      <SelectTrigger id="ce-type" className="mt-1 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ce-join">Joining Date</Label>
                    <Input
                      id="ce-join"
                      name="joiningDate"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="mt-1 h-11"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-xs text-foreground/80">
                  <Icon name="Info" className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                  <p>
                    Employee cannot login until password is created via activation link. Link expires
                    in 7 days. After activation, profile status moves to <strong>INCOMPLETE</strong> and
                    the employee must self-complete their profile for HR review.
                  </p>
                </div>
              </ScrollArea>
              <DialogFooter className="border-t border-border/60 px-6 py-4">
                <Button type="button" variant="outline" className="h-11" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={creating}>
                  {creating ? (
                    <><Icon name="Loader2" className="size-4 animate-spin" /> Creating…</>
                  ) : (
                    <><Icon name="Send" className="size-4" /> Create &amp; Send Activation</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DropdownActions({
  emp,
  onEdit,
  onResend,
  onToggleStatus,
}: {
  emp: Employee;
  onEdit: () => void;
  onResend: () => void;
  onToggleStatus: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  // Simple inline menu (avoid DropdownMenu complexity) — toggle a small panel.
  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <Icon name="MoreHorizontal" className="size-3.5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border-2 border-[#0057B8]/20 bg-white p-1 shadow-lg">
            <button
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-[#e8f0fb]/60"
              onClick={() => { onEdit(); setOpen(false); }}
            >
              <Icon name="Pencil" className="size-3.5" /> Edit details
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-[#e8f0fb]/60"
              onClick={() => { onResend(); setOpen(false); }}
            >
              <Icon name="RefreshCw" className="size-3.5" /> Resend activation
            </button>
            <button
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-[#e8f0fb]/60",
                emp.status === "ACTIVE" ? "text-rose-600" : "text-emerald-600"
              )}
              onClick={() => { onToggleStatus(); setOpen(false); }}
              disabled={emp.role === "SUPER_ADMIN"}
            >
              <Icon name={emp.status === "ACTIVE" ? "Ban" : "CheckCircle"} className="size-3.5" />
              {emp.status === "ACTIVE" ? "Suspend" : "Reactivate"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EmployeeProfileBody({
  detail,
  tab,
  onTabChange,
  onApprove,
  onResend,
  onToggleStatus,
  onDownloadDoc,
}: {
  detail: EmployeeDetailResponse;
  tab: string;
  onTabChange: (t: string) => void;
  onApprove: () => void;
  onResend: () => void;
  onToggleStatus: () => void;
  onDownloadDoc: (doc: EmployeeDocument) => void;
}) {
  const emp = detail.employee;
  const canViewPrivate = detail.canViewPrivate;
  const profile = emp.profile;
  const salary = emp.salary;
  const education = emp.education ?? [];
  const emergencyContacts = emp.emergencyContacts ?? [];
  const documents = emp.documents ?? [];

  return (
    <div className="flex flex-col">
      {/* Employee header */}
      <div className="flex flex-col gap-4 border-b border-border/60 bg-gradient-to-br from-[#e8f0fb]/60 to-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-alo-gradient text-white alo-shadow">
            <span className="text-xl font-black">{emp.fullName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-[#0057B8]">{emp.fullName}</h3>
              <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">{emp.designation}</Badge>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <code className="font-mono font-semibold text-[#0057B8]">{emp.employeeCode}</code>
              <span className="inline-flex items-center gap-1"><Icon name="Building2" className="size-3" />{joinName(emp.department)}</span>
              <span className="inline-flex items-center gap-1"><Icon name="MapPin" className="size-3" />{joinName(emp.office)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <div className="flex items-center gap-1.5">
            <StatusBadge status={emp.status} colorMap={EMPLOYEE_STATUS_COLORS} />
            <StatusBadge status={emp.profileStatus} colorMap={PROFILE_STATUS_COLORS} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(emp.profileStatus === "SUBMITTED" || emp.profileStatus === "UNDER_REVIEW") && (
              <Button size="sm" className="h-8 bg-emerald-600 text-white hover:bg-emerald-600/90" onClick={onApprove}>
                <Icon name="Check" className="size-3.5" /> Approve Profile
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8" onClick={onResend}>
              <Icon name="RefreshCw" className="size-3.5" /> Resend
            </Button>
            <Button
              size="sm"
              variant={emp.status === "ACTIVE" ? "destructive" : "outline"}
              className="h-8"
              onClick={onToggleStatus}
              disabled={emp.role === "SUPER_ADMIN"}
            >
              <Icon name={emp.status === "ACTIVE" ? "Ban" : "CheckCircle"} className="size-3.5" />
              {emp.status === "ACTIVE" ? "Suspend" : "Activate"}
            </Button>
          </div>
        </div>
      </div>

      {/* Privacy banner */}
      {canViewPrivate ? (
        <div className="flex items-start gap-2 border-b border-emerald-200 bg-emerald-50/60 px-6 py-2.5 text-xs text-emerald-800">
          <Icon name="ShieldCheck" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
          <p>{detail.privacyNote}</p>
        </div>
      ) : (
        <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50/60 px-6 py-2.5 text-xs text-amber-800">
          <Icon name="Lock" className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <p>
            <strong>Access restricted.</strong> {detail.privacyNote}
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={onTabChange} className="flex-1 overflow-hidden">
        <div className="border-b border-border/60 px-6">
          <TabsList className="h-auto flex-wrap rounded-none bg-transparent p-0">
            <TabsTrigger value="personal" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057B8]">
              <Icon name="User" className="size-3.5" /> Personal
            </TabsTrigger>
            <TabsTrigger value="employment" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057B8]">
              <Icon name="Briefcase" className="size-3.5" /> Employment
            </TabsTrigger>
            <TabsTrigger value="education" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057B8]">
              <Icon name="GraduationCap" className="size-3.5" /> Education
            </TabsTrigger>
            <TabsTrigger value="emergency" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057B8]">
              <Icon name="PhoneCall" className="size-3.5" /> Emergency
            </TabsTrigger>
            <TabsTrigger value="salary" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057B8]">
              <Icon name="Wallet" className="size-3.5" /> Salary
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0057B8]">
              <Icon name="FolderLock" className="size-3.5" /> Documents
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="max-h-[52vh] px-6 py-4">
          {/* Personal */}
          <TabsContent value="personal" className="mt-0">
            <div className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
              <InfoRow label="Date of Birth" value={profile?.dob ? fmtDate(profile.dob) : "—"} />
              <InfoRow label="Gender" value={profile?.gender || "—"} />
              <InfoRow label="Marital Status" value={profile?.maritalStatus || "—"} />
              <InfoRow label="Nationality" value={profile?.nationality || "—"} />
              <div className="sm:col-span-2">
                <SensitiveField
                  id={`pres-addr-${emp.id}`}
                  label="Present Address"
                  value={profile?.presentAddress || "Not provided"}
                />
              </div>
              <div className="sm:col-span-2">
                <SensitiveField
                  id={`perm-addr-${emp.id}`}
                  label="Permanent Address"
                  value={profile?.permanentAddress || "Not provided"}
                />
              </div>
            </div>
          </TabsContent>

          {/* Employment */}
          <TabsContent value="employment" className="mt-0">
            <div className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
              <InfoRow label="Employee Code" value={emp.employeeCode} mono />
              <InfoRow label="Designation" value={emp.designation} />
              <InfoRow label="Department" value={joinName(emp.department)} />
              <InfoRow label="Office" value={joinName(emp.office)} />
              <InfoRow label="Employment Type" value={emp.employmentType.replace(/_/g, " ")} />
              <InfoRow label="Role" value={emp.role} />
              <InfoRow label="Joining Date" value={fmtDate(emp.joiningDate)} />
              <InfoRow label="Company Email" value={emp.companyEmail} mono />
              <InfoRow label="Personal Email" value={emp.personalEmail || "—"} mono />
              <InfoRow label="Phone" value={emp.phone || "—"} mono />
              <InfoRow label="Profile Status" value={<StatusBadge status={emp.profileStatus} colorMap={PROFILE_STATUS_COLORS} />} />
              <InfoRow label="Account Status" value={<StatusBadge status={emp.status} colorMap={EMPLOYEE_STATUS_COLORS} />} />
            </div>
          </TabsContent>

          {/* Education */}
          <TabsContent value="education" className="mt-0">
            {education.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#0057B8]/20 px-4 py-3 text-xs text-muted-foreground">
                No education records added yet.
              </p>
            ) : (
              <div className="space-y-2">
                {education.map((ed) => (
                  <div key={ed.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ed.degree}</p>
                        <p className="text-xs text-muted-foreground">{ed.institution} · {ed.passingYear}</p>
                      </div>
                      {ed.result && (
                        <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">
                          Result: {ed.result}
                        </Badge>
                      )}
                    </div>
                    {ed.certificatePath && (
                      <SensitiveField
                        id={`edu-cert-${ed.id}`}
                        label="Certificate path"
                        value={ed.certificatePath}
                        mono
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Emergency contact */}
          <TabsContent value="emergency" className="mt-0">
            {emergencyContacts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#0057B8]/20 px-4 py-3 text-xs text-muted-foreground">
                No emergency contacts on file.
              </p>
            ) : (
              <div className="space-y-2">
                {emergencyContacts.map((ec) => (
                  <div key={ec.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ec.name}</p>
                        <p className="text-xs text-muted-foreground">{ec.relation}</p>
                      </div>
                    </div>
                    <div className="mt-1">
                      <SensitiveField
                        id={`ec-phone-${ec.id}`}
                        label="Phone"
                        value={ec.phone}
                        mono
                      />
                    </div>
                    {ec.address && (
                      <div className="mt-1">
                        <SensitiveField
                          id={`ec-addr-${ec.id}`}
                          label="Address"
                          value={ec.address}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Salary */}
          <TabsContent value="salary" className="mt-0">
            {!canViewPrivate ? (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50/60 p-4 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Icon name="Lock" className="size-5" />
                </div>
                <p className="mt-2 text-sm font-semibold text-amber-800">Salary data is private</p>
                <p className="mt-1 text-xs text-amber-700">
                  Only the employee themselves, Super Admin, Chairman, and HR Manager (with permission)
                  can view salary details.
                </p>
              </div>
            ) : !salary ? (
              <p className="rounded-lg border border-dashed border-[#0057B8]/20 px-4 py-3 text-xs text-muted-foreground">
                No salary record assigned yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
                <SensitiveField id={`sal-amount-${emp.id}`} label="Salary Amount" type="currency" value={fmtBDT(salary.salaryAmount)} mono />
                <SensitiveField id={`sal-allow-${emp.id}`} label="Allowance" type="currency" value={fmtBDT(salary.allowance)} mono />
                <SensitiveField id={`sal-bonus-${emp.id}`} label="Bonus" type="currency" value={fmtBDT(salary.bonus)} mono />
                <InfoRow label="Payment Method" value={salary.paymentMethod.replace(/_/g, " ")} />
                <InfoRow label="Effective Date" value={fmtDate(salary.effectiveDate)} />
                <InfoRow label="Visibility" value={<Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">{salary.visibility}</Badge>} />
                <SensitiveField id={`sal-bank-${emp.id}`} label="Bank Name" value={salary.bankName || "—"} />
                <SensitiveField id={`sal-acct-${emp.id}`} label="Bank Account" value={salary.bankAccount || "—"} mono />
                <div className="sm:col-span-2">
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 px-3 py-2 text-xs text-foreground/80">
                    <Icon name="ShieldAlert" className="mt-0.5 size-3.5 shrink-0 text-[#0057B8]" />
                    <p>This access is audit-logged. Salary visibility changes require Chairman approval.</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-0">
            {documents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#0057B8]/20 px-4 py-3 text-xs text-muted-foreground">
                No documents uploaded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const downloadable = canViewPrivate && !!doc.filePath;
                  return (
                    <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon name="FileText" className="size-4 text-[#0057B8]" />
                          <p className="text-sm font-medium text-foreground">
                            {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                          </p>
                          <StatusBadge status={doc.status} colorMap={DOC_STATUS_COLORS} />
                        </div>
                        {doc.filePath ? (
                          <div className="mt-1">
                            <SensitiveField
                              id={`doc-path-${doc.id}`}
                              label="Storage path"
                              value={doc.filePath}
                              mono
                            />
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Path hidden — requires download permission
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {downloadable ? (
                          <Button size="sm" variant="outline" className="h-8" onClick={() => onDownloadDoc(doc)}>
                            <Icon name="Download" className="size-3.5" />
                            Download
                          </Button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button size="sm" variant="outline" className="h-8" disabled>
                                    <Icon name="Lock" className="size-3.5" />
                                    Download
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {canViewPrivate ? "File not available" : "Requires permission"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function CreateEmployeeSuccess({
  result,
  onClose,
  onResend,
  onCopy,
}: {
  result: {
    activationLink: string;
    message: string;
    emailPreview: { subject: string; body: string };
    employeeCode: string;
    companyEmail: string;
  };
  onClose: () => void;
  onResend: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="flex max-h-[70vh] flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Icon name="CheckCircle" className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700">Employee account created</p>
              <p className="text-xs text-foreground/80">
                {result.employeeCode} · {result.companyEmail}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Activation Link
          </p>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border-2 border-[#0057B8]/20 bg-[#e8f0fb]/40 p-2.5">
            <code className="flex-1 truncate font-mono text-xs text-[#0057B8]">{result.activationLink}</code>
            <Button size="sm" className="h-8 bg-[#0057B8] text-white hover:bg-[#0057B8]/90" onClick={onCopy}>
              <Icon name="Copy" className="size-3.5" />
              Copy
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Link expires in 7 days. After that, HR must resend.
          </p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email Preview
          </p>
          <div className="mt-1.5 rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground">{result.emailPreview.subject}</p>
            <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/80">
{result.emailPreview.body}
            </pre>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-xs text-foreground/80">
          <Icon name="Info" className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <p>{result.message}</p>
        </div>
      </ScrollArea>

      <DialogFooter className="border-t border-border/60 px-6 py-4">
        <Button variant="outline" className="h-11" onClick={onResend}>
          <Icon name="RefreshCw" className="size-4" />
          Resend Email
        </Button>
        <Button className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" onClick={onClose}>
          Done
        </Button>
      </DialogFooter>
    </div>
  );
}
