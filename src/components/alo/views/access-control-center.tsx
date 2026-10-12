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
  MiniBar,
  PageHeader,
} from "@/components/alo/shared";
import { PrivacyToggle } from "@/components/alo/privacy-mode";
import { fmtDate, timeAgo } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
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

// ---------------------------------------------------------------------------
// Types — matches /api/access-control response shape
// ---------------------------------------------------------------------------

type OwnerEmployee = {
  id: string;
  employeeCode: string;
  fullName: string;
  designation: string;
  department?: { name: string } | null;
  office?: { name: string } | null;
  status: string;
  profileStatus: string;
  role?: string;
  companyEmail?: string;
};

type Partner = {
  id: string;
  employeeCode: string;
  fullName: string;
  designation: string;
};

type PartnerPackage = {
  id: string;
  name: string;
  description?: string | null;
  defaultUserLimit: number;
  monthlyImageLimit: number;
  monthlyVideoLimit: number;
  videoDurationLimitSeconds: number;
  englishMockVoucherLimit: number;
  interviewPrepLimit: number;
  autoPublishAllowed: boolean;
  requiresAloApproval: boolean;
  status: string;
  _count?: { assignments: number };
  assignments?: {
    employee: { fullName: string; employeeCode: string; companyEmail: string };
  }[];
};

type FeatureAccessRule = {
  id?: string;
  ownerType: "EMPLOYEE" | "PARTNER" | "PARTNER_USER";
  ownerId: string;
  featureKey: string;
  isEnabled: boolean;
  limitValue: number | null;
  requiresApproval: boolean;
};

type FeatureDefinition = {
  key: string;
  description: string;
  module: string;
  requiresApproval: boolean;
};

type QuotaRequest = {
  id: string;
  partnerId: string;
  requestType: string;
  currentLimit: number;
  requestedLimit: number;
  reason?: string | null;
  status: string;
  reviewNote?: string | null;
  createdAt?: string;
  employee?: { fullName: string; employeeCode: string; companyEmail?: string } | null;
};

type UsageLog = {
  id: string;
  ownerType: string;
  ownerId: string;
  featureKey: string;
  action: string;
  metadata?: string | null;
  createdAt: string;
};

type AccessControlData = {
  employees: OwnerEmployee[];
  partners: Partner[];
  packages: PartnerPackage[];
  featureRules: FeatureAccessRule[];
  featureDefinitions: FeatureDefinition[];
  quotaRequests: QuotaRequest[];
  usageLogs: UsageLog[];
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    pendingProfiles: number;
    totalPartners: number;
    totalPackages: number;
    pendingQuotaRequests: number;
  };
};

// ---------------------------------------------------------------------------
// Constants — color maps & option lists
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

const QUOTA_REQUEST_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const QUOTA_TYPE_LABELS: Record<string, string> = {
  EXTRA_SEAT: "Extra Seat",
  EXTRA_IMAGE_QUOTA: "Extra Image Quota",
  EXTRA_VIDEO_QUOTA: "Extra Video Quota",
  EXTRA_MOCK_VOUCHER: "Extra Mock Voucher",
};

const MODULE_COLORS: Record<string, string> = {
  Employee: "bg-sky-100 text-sky-700 border-sky-200",
  Partner: "bg-violet-100 text-violet-700 border-violet-200",
  Marketing: "bg-[#fdece4] text-[#E8501A] border-[#E8501A]/30",
  Communication: "bg-emerald-100 text-emerald-700 border-emerald-200",
  System: "bg-[#e8f0fb] text-[#0057B8] border-[#0057B8]/30",
};

const MODULE_ORDER = ["Employee", "Partner", "Marketing", "Communication", "System"];

const DESIGNATION_OPTIONS = [
  "Chairman", "CEO", "Director", "Office Manager", "Country Manager",
  "Counselor", "Senior Counselor", "Application Manager", "Application Team",
  "Visa Officer", "Finance Officer", "Marketing Manager", "Marketing Officer",
  "Front Desk", "HR Manager", "Support Staff", "Viewer",
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

// Demo Super Admin id (first SUPER_ADMIN in seed)
const SUPER_ADMIN_ID = "seed-super-admin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prettyKey(key: string) {
  return key
    .split(".")
    .map((p) => p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" · ");
}

function tryParseMetadata(raw?: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AccessControlCenter() {
  const { toast } = useToast();
  const [data, setData] = React.useState<AccessControlData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("employees");

  // Create-employee dialog
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createResult, setCreateResult] = React.useState<{
    activationLink: string;
    message: string;
    emailPreview: { subject: string; body: string };
    employeeCode: string;
    companyEmail: string;
  } | null>(null);

  // Edit-package dialog
  const [editPkg, setEditPkg] = React.useState<PartnerPackage | null>(null);
  const [pkgSaving, setPkgSaving] = React.useState(false);

  // Create-package dialog
  const [newPkgOpen, setNewPkgOpen] = React.useState(false);
  const [newPkgSaving, setNewPkgSaving] = React.useState(false);

  // Quota request review dialog
  const [reviewReq, setReviewReq] = React.useState<QuotaRequest | null>(null);
  const [reviewNote, setReviewNote] = React.useState("");
  const [reviewDecision, setReviewDecision] = React.useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewSaving, setReviewSaving] = React.useState(false);

  // New quota request dialog (for partners)
  const [newReqOpen, setNewReqOpen] = React.useState(false);
  const [newReqSaving, setNewReqSaving] = React.useState(false);

  // Feature access tab state
  const [selectedOwner, setSelectedOwner] = React.useState<string>("");
  const [pendingLimits, setPendingLimits] = React.useState<Record<string, string>>({});
  const [ruleSavingKey, setRuleSavingKey] = React.useState<string>("");

  // Usage tab: quota usage for selected partner
  const [usagePartnerId, setUsagePartnerId] = React.useState<string>("");
  const [usageRows, setUsageRows] = React.useState<
    { featureKey: string; limit: number; used: number; remaining: number; percentage: number }[]
  >([]);
  const [usageLoading, setUsageLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/access-control`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AccessControlData;
      setData(json);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again later.";
      toast({
        title: "Couldn’t load access control data",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  // ----- Derive helpers --------------------------------------------------

  const employees = data?.employees ?? [];
  const partners = data?.partners ?? [];
  const packages = data?.packages ?? [];
  const featureDefinitions = data?.featureDefinitions ?? [];
  const featureRules = data?.featureRules ?? [];
  const quotaRequests = data?.quotaRequests ?? [];
  const usageLogs = data?.usageLogs ?? [];
  const summary = data?.summary;

  // Build owner picker options: employees + partners
  const ownerOptions = React.useMemo(() => {
    const opts: { value: string; label: string; group: string }[] = [];
    employees.forEach((e) =>
      opts.push({
        value: `EMPLOYEE:${e.id}`,
        label: `${e.fullName} — ${e.employeeCode}`,
        group: "Employees",
      })
    );
    partners.forEach((p) =>
      opts.push({
        value: `PARTNER:${p.id}`,
        label: `${p.fullName} — ${p.employeeCode}`,
        group: "Partners",
      })
    );
    return opts;
  }, [employees, partners]);

  // Feature rules for the currently selected owner
  const selectedOwnerRules = React.useMemo<Record<string, FeatureAccessRule>>(() => {
    const map: Record<string, FeatureAccessRule> = {};
    if (!selectedOwner) return map;
    const [ownerType, ownerId] = selectedOwner.split(":");
    featureRules
      .filter((r) => r.ownerType === ownerType && r.ownerId === ownerId)
      .forEach((r) => {
        map[r.featureKey] = r;
      });
    return map;
  }, [selectedOwner, featureRules]);

  const featureDefinitionsByModule = React.useMemo(() => {
    const groups: Record<string, FeatureDefinition[]> = {};
    featureDefinitions.forEach((fd) => {
      if (!groups[fd.module]) groups[fd.module] = [];
      groups[fd.module].push(fd);
    });
    return groups;
  }, [featureDefinitions]);

  // ----- Handlers -------------------------------------------------------

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
        description: `${json.employee.employeeCode} — activation email sent.`,
      });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Couldn’t create employee", description: msg, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleEmployeeStatus = async (emp: OwnerEmployee) => {
    const next = emp.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, updatedById: SUPER_ADMIN_ID }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: next === "SUSPENDED" ? "Employee suspended" : "Employee activated",
        description: `${emp.fullName} (${emp.employeeCode}) is now ${next.toLowerCase()}.`,
      });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Status change failed", description: msg, variant: "destructive" });
    }
  };

  const handleSavePackage = async (pkg: PartnerPackage, fields: Partial<PartnerPackage>) => {
    setPkgSaving(true);
    try {
      const res = await fetch(`/api/partner-packages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pkg.id, ...fields }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Package updated",
        description: `${pkg.name} limits saved. Partners on this package will see new quotas immediately.`,
      });
      setEditPkg(null);
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Package update failed", description: msg, variant: "destructive" });
    } finally {
      setPkgSaving(false);
    }
  };

  const handleCreatePackage = async (fields: Record<string, unknown>) => {
    setNewPkgSaving(true);
    try {
      const res = await fetch(`/api/partner-packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Package created",
        description: `New partner package is now available for assignment.`,
      });
      setNewPkgOpen(false);
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Couldn’t create package", description: msg, variant: "destructive" });
    } finally {
      setNewPkgSaving(false);
    }
  };

  const handleToggleFeature = async (
    fd: FeatureDefinition,
    isEnabled: boolean,
    currentLimit: number | null
  ) => {
    if (!selectedOwner) return;
    const [ownerType, ownerId] = selectedOwner.split(":");
    setRuleSavingKey(fd.key);
    try {
      const res = await fetch(`/api/access-control`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerType,
          ownerId,
          featureKey: fd.key,
          isEnabled,
          limitValue: currentLimit,
          requiresApproval: fd.requiresApproval,
          updatedBy: SUPER_ADMIN_ID,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: isEnabled ? "Feature enabled" : "Feature disabled",
        description: `${prettyKey(fd.key)} for ${ownerType.toLowerCase()} is now ${isEnabled ? "ON" : "OFF"}.`,
      });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Toggle failed", description: msg, variant: "destructive" });
    } finally {
      setRuleSavingKey("");
    }
  };

  const handleSaveLimit = async (fd: FeatureDefinition, raw: string) => {
    if (!selectedOwner || raw === "") return;
    const [ownerType, ownerId] = selectedOwner.split(":");
    const limitValue = Number(raw);
    if (!Number.isFinite(limitValue)) {
      toast({ title: "Invalid limit", description: "Enter a valid number.", variant: "destructive" });
      return;
    }
    setRuleSavingKey(fd.key);
    try {
      const existing = selectedOwnerRules[fd.key];
      const res = await fetch(`/api/access-control`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerType,
          ownerId,
          featureKey: fd.key,
          isEnabled: existing?.isEnabled ?? true,
          limitValue,
          requiresApproval: fd.requiresApproval,
          updatedBy: SUPER_ADMIN_ID,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Limit saved",
        description: `${prettyKey(fd.key)} monthly limit set to ${limitValue}.`,
      });
      setPendingLimits((p) => {
        const next = { ...p };
        delete next[fd.key];
        return next;
      });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setRuleSavingKey("");
    }
  };

  const handleReviewQuota = async () => {
    if (!reviewReq) return;
    setReviewSaving(true);
    try {
      const res = await fetch(`/api/quota/extra-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reviewReq.id,
          status: reviewDecision,
          reviewedBy: SUPER_ADMIN_ID,
          reviewNote,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      toast({
        title: reviewDecision === "APPROVED" ? "Quota request approved" : "Quota request rejected",
        description:
          reviewDecision === "APPROVED"
            ? `Limit updated to ${reviewReq.requestedLimit}. Partner notified.`
            : `Request rejected. Partner notified.`,
      });
      setReviewReq(null);
      setReviewNote("");
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Review failed", description: msg, variant: "destructive" });
    } finally {
      setReviewSaving(false);
    }
  };

  const handleCreateQuotaRequest = async (fields: {
    partnerId: string;
    requestType: string;
    currentLimit: number;
    requestedLimit: number;
    reason: string;
  }) => {
    setNewReqSaving(true);
    try {
      const res = await fetch(`/api/quota/extra-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Quota request submitted",
        description: `Super Admin will review the request shortly.`,
      });
      setNewReqOpen(false);
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Submission failed", description: msg, variant: "destructive" });
    } finally {
      setNewReqSaving(false);
    }
  };

  const loadUsage = React.useCallback(async (partnerId: string) => {
    if (!partnerId) return;
    setUsageLoading(true);
    try {
      const res = await fetch(
        `/api/quota/usage?ownerType=PARTNER&ownerId=${encodeURIComponent(partnerId)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setUsageRows(json.usage || []);
    } catch {
      setUsageRows([]);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (tab === "logs" && partners.length > 0 && !usagePartnerId) {
      setUsagePartnerId(partners[0].id);
    }
  }, [tab, partners, usagePartnerId]);

  React.useEffect(() => {
    if (usagePartnerId) loadUsage(usagePartnerId);
  }, [usagePartnerId, loadUsage]);

  // ----- Render ---------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Control Center"
        icon="Shield"
        subtitle="Master control for ALO employees, B2B partner packages, feature access, and quotas."
        action={<PrivacyToggle />}
      />

      {/* Stats row */}
      {loading ? (
        <LoadingGrid count={6} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Employees" value={summary?.totalEmployees ?? 0} icon="Users" accent="blue" />
          <StatCard label="Active" value={summary?.activeEmployees ?? 0} icon="UserCheck" accent="emerald" />
          <StatCard label="Pending Profiles" value={summary?.pendingProfiles ?? 0} icon="ClipboardList" accent="amber" />
          <StatCard label="Partners" value={summary?.totalPartners ?? 0} icon="Handshake" accent="violet" />
          <StatCard label="Packages" value={summary?.totalPackages ?? 0} icon="Package" accent="orange" />
          <StatCard
            label="Quota Requests"
            value={summary?.pendingQuotaRequests ?? 0}
            icon="Inbox"
            accent="rose"
            hint="Pending review"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="employees" className="gap-1.5">
            <Icon name="Users" className="size-4" />
            Employee Roles
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{employees.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-1.5">
            <Icon name="Package" className="size-4" />
            Partner Packages
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">{packages.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5">
            <Icon name="ToggleLeft" className="size-4" />
            Feature Access
          </TabsTrigger>
          <TabsTrigger value="quota" className="gap-1.5">
            <Icon name="Inbox" className="size-4" />
            Quota Requests
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
              {summary?.pendingQuotaRequests ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <Icon name="History" className="size-4" />
            Usage Logs
          </TabsTrigger>
        </TabsList>

        {/* ---- Employee Roles tab ---- */}
        <TabsContent value="employees" className="mt-4 space-y-4">
          {loading ? (
            <LoadingGrid count={4} />
          ) : employees.length === 0 ? (
            <EmptyState
              icon="Users"
              title="No employees yet"
              description="Create your first employee account to assign roles and packages."
              action={
                <Button className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-12" onClick={() => setCreateOpen(true)}>
                  <Icon name="Plus" className="size-4" />
                  Create Employee
                </Button>
              }
            />
          ) : (
            <SectionCard
              title="Employee Roles"
              description="All ALO employees — designations, profile status, and account state."
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
                      <TableHead>Profile</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono text-xs font-semibold text-[#0057B8]">
                          {emp.employeeCode}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{emp.fullName}</div>
                          {emp.role && (
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{emp.role}</div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">
                            {emp.designation}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          {emp.department?.name || "—"}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                          {emp.office?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={emp.profileStatus} colorMap={PROFILE_STATUS_COLORS} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={emp.status} colorMap={EMPLOYEE_STATUS_COLORS} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toast({
                                  title: "Opening employee profile",
                                  description: `${emp.fullName} (${emp.employeeCode}) will open in Employee Management.`,
                                })
                              }
                            >
                              <Icon name="Eye" className="size-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button
                              variant={emp.status === "ACTIVE" ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleToggleEmployeeStatus(emp)}
                              disabled={emp.role === "SUPER_ADMIN"}
                              title={emp.role === "SUPER_ADMIN" ? "Super Admin cannot be suspended" : undefined}
                            >
                              <Icon name={emp.status === "ACTIVE" ? "Ban" : "CheckCircle"} className="size-3.5" />
                              <span className="hidden sm:inline">{emp.status === "ACTIVE" ? "Suspend" : "Activate"}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          )}
        </TabsContent>

        {/* ---- Partner Packages tab ---- */}
        <TabsContent value="packages" className="mt-4 space-y-4">
          {loading ? (
            <LoadingGrid count={3} />
          ) : packages.length === 0 ? (
            <EmptyState
              icon="Package"
              title="No partner packages defined"
              description="Create Starter, Growth, and Premium packages to assign to B2B partners."
              action={
                <Button className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-12" onClick={() => setNewPkgOpen(true)}>
                  <Icon name="Plus" className="size-4" />
                  Create New Package
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex items-center justify-end">
                <Button className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-12" onClick={() => setNewPkgOpen(true)}>
                  <Icon name="Plus" className="size-4" />
                  Create New Package
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onEdit={() => setEditPkg(pkg)}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ---- Feature Access tab ---- */}
        <TabsContent value="features" className="mt-4 space-y-4">
          <SectionCard
            title="Feature Access Control"
            description="Toggle any feature for any employee or partner. Backend re-checks on every action."
            icon="ToggleLeft"
            action={
              <div className="w-full sm:w-72">
                <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select employee or partner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ownerOptions.length === 0 ? (
                      <SelectItem value="_none" disabled>No employees or partners</SelectItem>
                    ) : (
                      <>
                        <SelectLabel className="text-xs font-semibold text-muted-foreground">Employees</SelectLabel>
                        {ownerOptions
                          .filter((o) => o.group === "Employees")
                          .map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        <SelectSeparator />
                        <SelectLabel className="text-xs font-semibold text-muted-foreground">Partners</SelectLabel>
                        {ownerOptions
                          .filter((o) => o.group === "Partners")
                          .map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            }
          >
            {!selectedOwner ? (
              <EmptyState
                icon="MousePointerClick"
                title="Pick an employee or partner"
                description="Select a user above to view and toggle their feature access. Every change is audit-logged."
              />
            ) : (
              <div className="space-y-6">
                {MODULE_ORDER.filter((m) => featureDefinitionsByModule[m]?.length).map((module) => (
                  <div key={module} className="rounded-xl border-2 border-[#0057B8]/15">
                    <div className="flex items-center gap-2 border-b border-border/60 bg-[#e8f0fb]/40 px-4 py-2.5">
                      <Badge variant="outline" className={cn("border", MODULE_COLORS[module])}>
                        {module}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {featureDefinitionsByModule[module].length} feature{featureDefinitionsByModule[module].length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {featureDefinitionsByModule[module].map((fd) => {
                        const rule = selectedOwnerRules[fd.key];
                        const enabled = rule?.isEnabled ?? false;
                        const limit = rule?.limitValue ?? null;
                        const pending = pendingLimits[fd.key];
                        return (
                          <div
                            key={fd.key}
                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                                  {fd.key}
                                </code>
                                {fd.requiresApproval && (
                                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                                    <Icon name="ShieldAlert" className="mr-1 size-3" />
                                    Approval req.
                                  </Badge>
                                )}
                                {enabled && (
                                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                                    <span className="mr-1 inline-block size-1.5 rounded-full bg-emerald-500" />
                                    Enabled
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{fd.description}</p>
                            </div>
                            <div className="flex items-center gap-3 sm:shrink-0">
                              {limit !== null && (
                                <div className="flex items-center gap-1.5">
                                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Limit</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    className="h-8 w-20 font-mono text-xs"
                                    defaultValue={limit}
                                    value={pending ?? ""}
                                    onChange={(e) =>
                                      setPendingLimits((p) => ({ ...p, [fd.key]: e.target.value }))
                                    }
                                    placeholder={String(limit)}
                                  />
                                  {pending !== undefined && pending !== String(limit) && (
                                    <Button
                                      size="sm"
                                      className="h-8 bg-[#0057B8] px-2 text-xs text-white hover:bg-[#0057B8]/90"
                                      disabled={ruleSavingKey === fd.key}
                                      onClick={() => handleSaveLimit(fd, pending)}
                                    >
                                      <Icon name="Save" className="size-3" />
                                      Save
                                    </Button>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={enabled}
                                  disabled={ruleSavingKey === fd.key}
                                  onCheckedChange={(v) => handleToggleFeature(fd, v, limit)}
                                />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {ruleSavingKey === fd.key ? "Saving…" : enabled ? "On" : "Off"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-2 rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 px-3 py-2.5 text-xs text-foreground/80">
                  <Icon name="ShieldCheck" className="mt-0.5 size-3.5 shrink-0 text-[#0057B8]" />
                  <p>
                    Changes apply immediately. Backend re-validates permissions on every action —
                    frontend toggles only hide buttons, they don’t grant access.
                  </p>
                </div>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* ---- Quota Requests tab ---- */}
        <TabsContent value="quota" className="mt-4 space-y-4">
          {loading ? (
            <LoadingGrid count={3} />
          ) : (
            <SectionCard
              title="Extra Quota Requests"
              description="Partners request additional seats, image/video quota, or mock vouchers. Approve or reject here."
              icon="Inbox"
              action={
                <Button
                  className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-12"
                  onClick={() => setNewReqOpen(true)}
                  disabled={partners.length === 0}
                >
                  <Icon name="Plus" className="size-4" />
                  Request Extra Quota
                </Button>
              }
            >
              {quotaRequests.length === 0 ? (
                <EmptyState
                  icon="Inbox"
                  title="No quota requests"
                  description="When partners need more seats, image/video quota, or mock vouchers, their requests will appear here."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Request Type</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-right">Requested</TableHead>
                        <TableHead className="hidden md:table-cell">Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotaRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div className="font-medium">{req.employee?.fullName || "—"}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {req.employee?.employeeCode || req.partnerId.slice(-6)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">
                              {QUOTA_TYPE_LABELS[req.requestType] || req.requestType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">{req.currentLimit}</TableCell>
                          <TableCell className="text-right font-mono font-semibold tabular-nums text-[#E8501A]">
                            {req.requestedLimit}
                          </TableCell>
                          <TableCell className="hidden max-w-[280px] truncate text-xs text-muted-foreground md:table-cell">
                            {req.reason || "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={req.status} colorMap={QUOTA_REQUEST_COLORS} />
                          </TableCell>
                          <TableCell className="text-right">
                            {req.status === "PENDING" ? (
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  className="h-8 bg-emerald-600 text-white hover:bg-emerald-600/90"
                                  onClick={() => {
                                    setReviewReq(req);
                                    setReviewDecision("APPROVED");
                                    setReviewNote("");
                                  }}
                                >
                                  <Icon name="Check" className="size-3.5" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8"
                                  onClick={() => {
                                    setReviewReq(req);
                                    setReviewDecision("REJECTED");
                                    setReviewNote("");
                                  }}
                                >
                                  <Icon name="X" className="size-3.5" />
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Reviewed{req.reviewNote ? `: ${req.reviewNote}` : ""}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </SectionCard>
          )}
        </TabsContent>

        {/* ---- Usage Logs tab ---- */}
        <TabsContent value="logs" className="mt-4 space-y-4">
          <SectionCard
            title="Feature Usage Logs"
            description="Recent feature calls + monthly quota consumption per partner."
            icon="History"
            action={
              <div className="w-full sm:w-64">
                <Select value={usagePartnerId} onValueChange={setUsagePartnerId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select partner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName} — {p.employeeCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          >
            {/* Quota usage bars */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Monthly Quota Usage
              </p>
              {usageLoading ? (
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
              ) : usageRows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[#0057B8]/20 px-4 py-3 text-xs text-muted-foreground">
                  No quota-bearing features enabled for this partner yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {usageRows.map((u) => {
                    const color =
                      u.percentage >= 90 ? "#E8501A" : u.percentage >= 70 ? "#f59e0b" : "#0057B8";
                    return (
                      <div key={u.featureKey} className="rounded-xl border-2 border-[#0057B8]/15 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <code className="font-mono text-[11px] text-foreground">{u.featureKey}</code>
                          <Badge variant="outline" className="text-[10px]">
                            {u.percentage}%
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <MiniBar value={u.used} max={u.limit} color={color} />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-mono">{u.used} / {u.limit} used</span>
                          <span className="font-semibold text-emerald-600">{u.remaining} left</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Logs table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="hidden md:table-cell">Metadata</TableHead>
                    <TableHead className="text-right">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No usage recorded yet. Toggle a feature on for a partner to start logging.
                      </TableCell>
                    </TableRow>
                  ) : (
                    usageLogs.map((log) => {
                      const meta = tryParseMetadata(log.metadata);
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">
                                {log.ownerType}
                              </Badge>
                              <code className="font-mono text-[10px] text-muted-foreground">{log.ownerId.slice(-8)}</code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="font-mono text-[11px] text-foreground">{log.featureKey}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-[10px]">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {meta ? (
                              <code className="font-mono text-[10px] text-muted-foreground">
                                {JSON.stringify(meta).slice(0, 80)}
                              </code>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            <span title={fmtDate(log.createdAt)}>{timeAgo(log.createdAt)}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Security note */}
      <Card className="rounded-2xl border-2 border-[#0057B8]/20 bg-[#e8f0fb]/40">
        <CardContent className="flex items-start gap-3 pt-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0057B8] text-white">
            <Icon name="ShieldCheck" className="size-5" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-[#0057B8]">Security &amp; audit policy</p>
            <p className="mt-1 text-foreground/80">
              All access checks are enforced in the backend. The frontend PermissionGate only hides
              buttons — the backend is the final authority. Every permission change, salary view,
              and document download is audit-logged with actor, resource, and timestamp.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ---- Create Employee Dialog ---- */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateResult(null); }}>
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border/60 px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
              <Icon name="UserPlus" className="size-5" />
              Create Employee Account
            </DialogTitle>
            <DialogDescription>
              An activation email will be sent to the employee. They must set a password within 7 days.
            </DialogDescription>
          </DialogHeader>

          {createResult ? (
            <CreateEmployeeSuccess
              result={createResult}
              onClose={() => { setCreateOpen(false); setCreateResult(null); }}
              onResend={() => {
                toast({
                  title: "Activation email resent",
                  description: `A new link has been emailed to ${createResult.companyEmail}.`,
                });
              }}
              onCopy={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(createResult.activationLink).catch(() => {});
                }
                toast({ title: "Link copied", description: "Activation link copied to clipboard." });
              }}
            />
          ) : (
            <form
              action={handleCreateEmployee}
              className="flex max-h-[60vh] flex-col overflow-hidden"
            >
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" name="fullName" required placeholder="e.g. Tanvir Ahmed" className="mt-1 h-11" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="companyEmail">Company Email *</Label>
                    <Input id="companyEmail" name="companyEmail" type="email" required placeholder="tanvir.ahmed@aloeducation.com" className="mt-1 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation *</Label>
                    <Select name="designation" required>
                      <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Select designation" /></SelectTrigger>
                      <SelectContent>
                        {DESIGNATION_OPTIONS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue="STAFF">
                      <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select name="employmentType" defaultValue="FULL_TIME">
                      <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input
                      id="joiningDate"
                      name="joiningDate"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="mt-1 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="departmentId">Department</Label>
                    <Input id="departmentId" name="departmentId" placeholder="Optional dept id" className="mt-1 h-11" />
                  </div>
                  <div>
                    <Label htmlFor="officeId">Office</Label>
                    <Input id="officeId" name="officeId" placeholder="Optional office id" className="mt-1 h-11" />
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
                <Button type="button" variant="outline" className="h-11" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={creating}>
                  {creating ? (
                    <>
                      <Icon name="Loader2" className="size-4 animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      <Icon name="Send" className="size-4" /> Create &amp; Send Activation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- Edit Package Dialog ---- */}
      {editPkg && (
        <EditPackageDialog
          pkg={editPkg}
          saving={pkgSaving}
          onClose={() => setEditPkg(null)}
          onSave={handleSavePackage}
        />
      )}

      {/* ---- New Package Dialog ---- */}
      <NewPackageDialog
        open={newPkgOpen}
        saving={newPkgSaving}
        onOpenChange={setNewPkgOpen}
        onCreate={handleCreatePackage}
      />

      {/* ---- Quota Review Dialog ---- */}
      <Dialog open={!!reviewReq} onOpenChange={(o) => { if (!o) setReviewReq(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
              <Icon name="ClipboardCheck" className="size-5" />
              {reviewDecision === "APPROVED" ? "Approve Quota Request" : "Reject Quota Request"}
            </DialogTitle>
            <DialogDescription>
              {reviewReq && (
                <>
                  <strong>{reviewReq.employee?.fullName || "Partner"}</strong> requested{" "}
                  {QUOTA_TYPE_LABELS[reviewReq.requestType] || reviewReq.requestType} increase from{" "}
                  <span className="font-mono">{reviewReq.currentLimit}</span> to{" "}
                  <span className="font-mono font-semibold text-[#E8501A]">{reviewReq.requestedLimit}</span>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="reviewNote">Review Note (optional)</Label>
              <Textarea
                id="reviewNote"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Approved for Eid campaign period. Revisit next month."
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#0057B8]/15 bg-[#e8f0fb]/40 px-3 py-2 text-xs text-foreground/80">
              <Icon name="ShieldCheck" className="size-3.5 shrink-0 text-[#0057B8]" />
              <span>This review action will be audit-logged and the partner notified by email.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-11" onClick={() => setReviewReq(null)}>Cancel</Button>
            <Button
              className={cn(
                "h-11 text-white",
                reviewDecision === "APPROVED"
                  ? "bg-emerald-600 hover:bg-emerald-600/90"
                  : "bg-rose-600 hover:bg-rose-600/90"
              )}
              disabled={reviewSaving}
              onClick={handleReviewQuota}
            >
              {reviewSaving ? (
                <><Icon name="Loader2" className="size-4 animate-spin" /> Saving…</>
              ) : (
                <>{reviewDecision === "APPROVED" ? "Approve Request" : "Reject Request"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- New Quota Request Dialog ---- */}
      <NewQuotaRequestDialog
        open={newReqOpen}
        saving={newReqSaving}
        onOpenChange={setNewReqOpen}
        partners={partners}
        onSubmit={handleCreateQuotaRequest}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PackageCard({ pkg, onEdit }: { pkg: PartnerPackage; onEdit: () => void }) {
  const assignments = pkg.assignments ?? [];
  return (
    <Card className="flex flex-col rounded-2xl border-2 border-[#0057B8]/20">
      <CardContent className="flex flex-1 flex-col pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0057B8]">{pkg.name}</h3>
            {pkg.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{pkg.description}</p>
            )}
          </div>
          <Badge variant="outline" className="border-[#0057B8]/20 text-[#0057B8]">
            {pkg._count?.assignments ?? assignments.length} assigned
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <InfoRow label="User seats" value={pkg.defaultUserLimit} />
          <InfoRow label="Images / mo" value={pkg.monthlyImageLimit} />
          <InfoRow label="Videos / mo" value={pkg.monthlyVideoLimit} />
          <InfoRow label="Video length" value={`${pkg.videoDurationLimitSeconds}s`} />
          <InfoRow label="Mock vouchers" value={pkg.englishMockVoucherLimit} />
          <InfoRow label="Interview prep" value={pkg.interviewPrepLimit} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              pkg.autoPublishAllowed
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            )}
          >
            <Icon name={pkg.autoPublishAllowed ? "Globe" : "Lock"} className="mr-1 size-3" />
            Auto-publish: {pkg.autoPublishAllowed ? "Yes" : "No"}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              pkg.requiresAloApproval
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-emerald-300 bg-emerald-50 text-emerald-700"
            )}
          >
            <Icon name="ShieldAlert" className="mr-1 size-3" />
            ALO approval: {pkg.requiresAloApproval ? "Required" : "Not required"}
          </Badge>
        </div>

        {assignments.length > 0 && (
          <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Assigned partners
            </p>
            <div className="max-h-24 overflow-y-auto pr-1">
              <ul className="space-y-1">
                {assignments.slice(0, 5).map((a, i) => (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{a.employee.fullName}</span>
                    <code className="font-mono text-[10px] text-muted-foreground">{a.employee.employeeCode}</code>
                  </li>
                ))}
                {assignments.length > 5 && (
                  <li className="text-[10px] text-muted-foreground">+{assignments.length - 5} more…</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4">
          <Button variant="outline" className="h-10 w-full" onClick={onEdit}>
            <Icon name="Pencil" className="size-4" />
            Edit Package
          </Button>
        </div>
      </CardContent>
    </Card>
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

function EditPackageDialog({
  pkg,
  saving,
  onClose,
  onSave,
}: {
  pkg: PartnerPackage;
  saving: boolean;
  onClose: () => void;
  onSave: (pkg: PartnerPackage, fields: Partial<PartnerPackage>) => void;
}) {
  const [form, setForm] = React.useState({
    name: pkg.name,
    description: pkg.description || "",
    defaultUserLimit: pkg.defaultUserLimit,
    monthlyImageLimit: pkg.monthlyImageLimit,
    monthlyVideoLimit: pkg.monthlyVideoLimit,
    videoDurationLimitSeconds: pkg.videoDurationLimitSeconds,
    englishMockVoucherLimit: pkg.englishMockVoucherLimit,
    interviewPrepLimit: pkg.interviewPrepLimit,
    autoPublishAllowed: pkg.autoPublishAllowed,
    requiresAloApproval: pkg.requiresAloApproval,
    status: pkg.status,
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
            <Icon name="Pencil" className="size-5" />
            Edit Package — {pkg.name}
          </DialogTitle>
          <DialogDescription>
            Changes apply to all partners currently assigned to this package.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="pkg-name">Package Name</Label>
              <Input id="pkg-name" value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-1 h-11" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="pkg-desc">Description</Label>
              <Textarea id="pkg-desc" value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1 min-h-[60px]" />
            </div>
            <div>
              <Label htmlFor="pkg-users">Default User Limit</Label>
              <Input id="pkg-users" type="number" min={1} value={form.defaultUserLimit} onChange={(e) => update("defaultUserLimit", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="pkg-img">Monthly Image Limit</Label>
              <Input id="pkg-img" type="number" min={0} value={form.monthlyImageLimit} onChange={(e) => update("monthlyImageLimit", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="pkg-vid">Monthly Video Limit</Label>
              <Input id="pkg-vid" type="number" min={0} value={form.monthlyVideoLimit} onChange={(e) => update("monthlyVideoLimit", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="pkg-vlen">Video Duration (seconds)</Label>
              <Input id="pkg-vlen" type="number" min={1} value={form.videoDurationLimitSeconds} onChange={(e) => update("videoDurationLimitSeconds", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="pkg-mock">English Mock Vouchers</Label>
              <Input id="pkg-mock" type="number" min={0} value={form.englishMockVoucherLimit} onChange={(e) => update("englishMockVoucherLimit", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="pkg-prep">Interview Prep Limit</Label>
              <Input id="pkg-prep" type="number" min={0} value={form.interviewPrepLimit} onChange={(e) => update("interviewPrepLimit", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Auto-publish allowed</p>
                <p className="text-xs text-muted-foreground">Skip ALO review for partner content</p>
              </div>
              <Switch checked={form.autoPublishAllowed} onCheckedChange={(v) => update("autoPublishAllowed", v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Requires ALO approval</p>
                <p className="text-xs text-muted-foreground">Each published item needs review</p>
              </div>
              <Switch checked={form.requiresAloApproval} onCheckedChange={(v) => update("requiresAloApproval", v)} />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button variant="outline" className="h-11" onClick={onClose}>Cancel</Button>
          <Button
            className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90"
            disabled={saving}
            onClick={() => onSave(pkg, form)}
          >
            {saving ? (
              <><Icon name="Loader2" className="size-4 animate-spin" /> Saving…</>
            ) : (
              <><Icon name="Save" className="size-4" /> Save Changes</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewPackageDialog({
  open,
  saving,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  saving: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (fields: Record<string, unknown>) => void;
}) {
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    defaultUserLimit: 3,
    monthlyImageLimit: 15,
    monthlyVideoLimit: 10,
    videoDurationLimitSeconds: 30,
    englishMockVoucherLimit: 3,
    interviewPrepLimit: 1,
    autoPublishAllowed: false,
    requiresAloApproval: true,
    status: "ACTIVE",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return;
    onCreate(form);
    setForm({
      name: "",
      description: "",
      defaultUserLimit: 3,
      monthlyImageLimit: 15,
      monthlyVideoLimit: 10,
      videoDurationLimitSeconds: 30,
      englishMockVoucherLimit: 3,
      interviewPrepLimit: 1,
      autoPublishAllowed: false,
      requiresAloApproval: true,
      status: "ACTIVE",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
            <Icon name="PackagePlus" className="size-5" />
            Create Partner Package
          </DialogTitle>
          <DialogDescription>Define quota limits and approval flow for a new tier.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="np-name">Package Name *</Label>
              <Input id="np-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Enterprise Partner" className="mt-1 h-11" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="np-desc">Description</Label>
              <Textarea id="np-desc" value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1 min-h-[60px]" />
            </div>
            <div>
              <Label htmlFor="np-users">Default User Limit</Label>
              <Input id="np-users" type="number" min={1} value={form.defaultUserLimit} onChange={(e) => update("defaultUserLimit", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="np-img">Monthly Image Limit</Label>
              <Input id="np-img" type="number" min={0} value={form.monthlyImageLimit} onChange={(e) => update("monthlyImageLimit", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="np-vid">Monthly Video Limit</Label>
              <Input id="np-vid" type="number" min={0} value={form.monthlyVideoLimit} onChange={(e) => update("monthlyVideoLimit", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="np-vlen">Video Duration (seconds)</Label>
              <Input id="np-vlen" type="number" min={1} value={form.videoDurationLimitSeconds} onChange={(e) => update("videoDurationLimitSeconds", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="np-mock">English Mock Vouchers</Label>
              <Input id="np-mock" type="number" min={0} value={form.englishMockVoucherLimit} onChange={(e) => update("englishMockVoucherLimit", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="np-prep">Interview Prep Limit</Label>
              <Input id="np-prep" type="number" min={0} value={form.interviewPrepLimit} onChange={(e) => update("interviewPrepLimit", Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Auto-publish allowed</p>
                <p className="text-xs text-muted-foreground">Skip ALO review</p>
              </div>
              <Switch checked={form.autoPublishAllowed} onCheckedChange={(v) => update("autoPublishAllowed", v)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Requires ALO approval</p>
                <p className="text-xs text-muted-foreground">Each item reviewed</p>
              </div>
              <Switch checked={form.requiresAloApproval} onCheckedChange={(v) => update("requiresAloApproval", v)} />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={saving || !form.name.trim()} onClick={submit}>
            {saving ? (
              <><Icon name="Loader2" className="size-4 animate-spin" /> Creating…</>
            ) : (
              <><Icon name="Plus" className="size-4" /> Create Package</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewQuotaRequestDialog({
  open,
  saving,
  onOpenChange,
  partners,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  onOpenChange: (o: boolean) => void;
  partners: Partner[];
  onSubmit: (fields: {
    partnerId: string;
    requestType: string;
    currentLimit: number;
    requestedLimit: number;
    reason: string;
  }) => void;
}) {
  const [partnerId, setPartnerId] = React.useState("");
  const [requestType, setRequestType] = React.useState("EXTRA_IMAGE_QUOTA");
  const [currentLimit, setCurrentLimit] = React.useState(15);
  const [requestedLimit, setRequestedLimit] = React.useState(50);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open && partners.length > 0 && !partnerId) setPartnerId(partners[0].id);
  }, [open, partners, partnerId]);

  const submit = () => {
    if (!partnerId) return;
    onSubmit({ partnerId, requestType, currentLimit, requestedLimit, reason });
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0057B8]">
            <Icon name="Inbox" className="size-5" />
            Request Extra Quota
          </DialogTitle>
          <DialogDescription>Submit a quota increase request on behalf of a partner.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="qr-partner">Partner</Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger id="qr-partner" className="mt-1 h-11"><SelectValue placeholder="Select partner" /></SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.fullName} — {p.employeeCode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="qr-type">Request Type</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger id="qr-type" className="mt-1 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EXTRA_SEAT">Extra Seat</SelectItem>
                <SelectItem value="EXTRA_IMAGE_QUOTA">Extra Image Quota</SelectItem>
                <SelectItem value="EXTRA_VIDEO_QUOTA">Extra Video Quota</SelectItem>
                <SelectItem value="EXTRA_MOCK_VOUCHER">Extra Mock Voucher</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="qr-cur">Current Limit</Label>
              <Input id="qr-cur" type="number" min={0} value={currentLimit} onChange={(e) => setCurrentLimit(Number(e.target.value))} className="mt-1 h-11" />
            </div>
            <div>
              <Label htmlFor="qr-req">Requested Limit</Label>
              <Input id="qr-req" type="number" min={0} value={requestedLimit} onChange={(e) => setRequestedLimit(Number(e.target.value))} className="mt-1 h-11" />
            </div>
          </div>
          <div>
            <Label htmlFor="qr-reason">Reason</Label>
            <Textarea id="qr-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Running Eid campaign — need 50 extra images" className="mt-1 min-h-[70px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="h-11 bg-[#E8501A] text-white hover:bg-[#E8501A]/90" disabled={saving || !partnerId} onClick={submit}>
            {saving ? (
              <><Icon name="Loader2" className="size-4 animate-spin" /> Submitting…</>
            ) : (
              <><Icon name="Send" className="size-4" /> Submit Request</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
