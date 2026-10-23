"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  InfoRow,
  MiniBar,
  PageHeader,
} from "@/components/alo/shared";
import {
  type ViewKey,
  LEAD_SOURCES,
  SOURCE_LABELS,
  STAGE_LABELS,
  STAGE_COLORS,
  DOC_STATUS_COLORS,
  fmtDate,
  timeAgo,
} from "@/lib/alo-types";

// ---------- Types ----------
interface Counselor {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface Lead {
  id: string;
  leadId: string;
  fullName: string;
  email?: string;
  phone: string;
  altPhone?: string;
  source: string;
  sourceDetail?: string;
  preferredCountry?: string;
  preferredCourse?: string;
  status: string;
  welcomeSent: boolean;
  counselorId?: string;
  counselor?: Counselor | null;
  createdAt: string;
}

interface StudentListItem {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  mobile: string;
  profileCompletion: number;
  status: string;
  counselor?: Counselor | null;
  studyDestination?: string;
  programTitle?: string;
  createdAt: string;
}

interface Stats {
  counts: Record<string, number>;
  leadsBySource: Record<string, number>;
  leadsByStatus: Record<string, number>;
  appsByStage: Record<string, number>;
  docsByStatus: Record<string, number>;
  visaByStage: Record<string, number>;
  agentsByDept: Record<string, number>;
  marketing: {
    totalBudget: number;
    totalSpent: number;
    totalLeadsFromCampaigns: number;
    totalConversions: number;
    costPerLead: number;
    conversionRate: number;
  };
  finance: {
    revenue: number;
    pendingPayments: number;
    commissionPending: number;
  };
  recentAudit: any[];
  avgProfileCompletion: number;
}

// ---------- Color maps ----------
const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "bg-amber-100 text-amber-700",
  CONTACTED: "bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]",
  QUALIFIED: "bg-violet-100 text-violet-700",
  CONVERTED: "bg-emerald-100 text-emerald-700",
  LOST: "bg-rose-100 text-rose-700",
  DUPLICATE: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
  LOST: "Lost",
  DUPLICATE: "Duplicate",
};

const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", "DUPLICATE"];

const STUDENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
  GRADUATED: "bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
  NORMAL: "bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-rose-100 text-rose-700",
};

const DOC_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  UPLOADED: "Uploaded",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// ---------- Helpers ----------
function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== "string") return val as T;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function CrmDashboard({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const { toast } = useToast();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [students, setStudents] = React.useState<StudentListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("leads");

  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = React.useState<string>("ALL");
  const [studentSearch, setStudentSearch] = React.useState("");

  // Sheet state
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetStudentId, setSheetStudentId] = React.useState<string | null>(null);

  // Fetch all data on mount
  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [statsRes, leadsRes, studentsRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/leads"),
          fetch("/api/students"),
        ]);
        const statsJson = await statsRes.json();
        const leadsJson = await leadsRes.json();
        const studentsJson = await studentsRes.json();
        if (!alive) return;
        setStats(statsJson);
        setLeads(leadsJson.leads ?? []);
        setStudents(studentsJson.students ?? []);
      } catch (err) {
        toast({
          title: "Failed to load dashboard",
          description: "Could not fetch CRM data. Please retry.",
          variant: "destructive",
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [toast]);

  // Refetch leads when filters change
  React.useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (sourceFilter !== "ALL") params.set("source", sourceFilter);
    fetch(`/api/leads${params.size ? `?${params.toString()}` : ""}`)
      .then((r) => r.json())
      .then((data) => setLeads(data.leads ?? []))
      .catch(() => {
        /* keep existing */
      });
  }, [statusFilter, sourceFilter, loading]);

  // Derived data
  const leadsBySource = stats?.leadsBySource ?? {};
  const leadsByStatus = stats?.leadsByStatus ?? {};
  const appsByStage = stats?.appsByStage ?? {};
  const docsByStatus = stats?.docsByStatus ?? {};

  const filteredStudents = React.useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [students, studentSearch]);

  const maxSourceCount = Math.max(1, ...LEAD_SOURCES.map((s) => leadsBySource[s.value] ?? 0));

  // Conversion funnel numbers
  const funnel = {
    leads: stats?.counts?.leads ?? 0,
    contacted: leadsByStatus.CONTACTED ?? 0,
    qualified: leadsByStatus.QUALIFIED ?? 0,
    converted: leadsByStatus.CONVERTED ?? 0,
  };
  const rate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="CRM Dashboard"
          subtitle="Leads, students, and the full pipeline at a glance."
          icon="Users"
          action={
            <Button
              onClick={() => onNavigate("landing")}
              className="h-12 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
            >
              <Icon name="Plus" className="mr-2 size-4" />
              New Lead
            </Button>
          }
        />
        <LoadingGrid count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Dashboard"
        subtitle="Leads, students, and the full pipeline at a glance."
        icon="Users"
        action={
          <Button
            onClick={() => onNavigate("landing")}
            className="h-12 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
          >
            <Icon name="Plus" className="mr-2 size-4" />
            New Lead
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Leads"
          value={stats?.counts?.leads ?? 0}
          icon="UserPlus"
          accent="blue"
          hint={`${leadsByStatus.NEW ?? 0} new · ${leadsByStatus.CONVERTED ?? 0} converted`}
        />
        <StatCard
          label="Total Students"
          value={stats?.counts?.students ?? 0}
          icon="Users"
          accent="orange"
          hint="Active in pipeline"
        />
        <StatCard
          label="Active Applications"
          value={stats?.counts?.applications ?? 0}
          icon="ClipboardList"
          accent="violet"
          hint="Across all stages"
        />
        <StatCard
          label="Avg Profile Completion"
          value={`${stats?.avgProfileCompletion ?? 0}%`}
          icon="UserCheck"
          accent="emerald"
          hint="Across all students"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-white p-1.5 sm:w-auto">
          <TabsTrigger
            value="leads"
            className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white"
          >
            <Icon name="UserPlus" className="mr-1.5 size-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white"
          >
            <Icon name="Users" className="mr-1.5 size-4" />
            Students
          </TabsTrigger>
          <TabsTrigger
            value="pipeline"
            className="rounded-xl data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white"
          >
            <Icon name="GitBranch" className="mr-1.5 size-4" />
            Pipeline Overview
          </TabsTrigger>
        </TabsList>

        {/* ============ LEADS TAB ============ */}
        <TabsContent value="leads" className="mt-4 space-y-4">
          {/* Sub-stats: leads by source pills */}
          <SectionCard
            title="Leads by Source"
            icon="Filter"
            description="Where new leads are coming from"
          >
            <div className="flex flex-wrap gap-2">
              {LEAD_SOURCES.map((src) => {
                const count = leadsBySource[src.value] ?? 0;
                const isActive = sourceFilter === src.value;
                return (
                  <button
                    key={src.value}
                    onClick={() => setSourceFilter(isActive ? "ALL" : src.value)}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all " +
                      (isActive
                        ? "border-[var(--alo-brand)] bg-[var(--alo-brand)] text-white"
                        : "border-[var(--alo-brand)]/15 bg-[var(--alo-brand-light)]/50 text-[var(--alo-brand)] hover:border-[var(--alo-brand)]/40")
                    }
                  >
                    {src.label}
                    <span
                      className={
                        "rounded-full px-1.5 py-0.5 text-[11px] " +
                        (isActive ? "bg-white/20 text-white" : "bg-white text-[var(--alo-brand)]")
                      }
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Filters */}
          <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/15">
            <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon name="SlidersHorizontal" className="size-4" />
                Filter:
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 rounded-xl border-[var(--alo-brand)]/15">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {LEAD_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="h-10 rounded-xl border-[var(--alo-brand)]/15">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All sources</SelectItem>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(statusFilter !== "ALL" || sourceFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setSourceFilter("ALL");
                  }}
                  className="h-10 text-xs text-muted-foreground"
                >
                  <Icon name="X" className="mr-1 size-3.5" />
                  Clear
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Leads Table */}
          {leads.length === 0 ? (
            <EmptyState
              icon="UserX"
              title="No leads match these filters"
              description="Try adjusting the status or source filter to see more leads."
            />
          ) : (
            <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/15">
              <CardContent className="p-0">
                <div className="max-h-[34rem] overflow-y-auto alo-scroll">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                      <TableRow>
                        <TableHead className="pl-4">Lead ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Counselor</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="pr-4 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id} className="hover:bg-[var(--alo-brand-light)]/30">
                          <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                            {lead.leadId}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{lead.fullName}</span>
                              {lead.email && (
                                <span className="text-xs text-muted-foreground">{lead.email}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{lead.phone}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-[var(--alo-brand)]/20 bg-[var(--alo-brand-light)]/60 font-normal text-[var(--alo-brand)]"
                            >
                              {SOURCE_LABELS[lead.source] ?? lead.source}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{lead.preferredCountry ?? "—"}</TableCell>
                          <TableCell>
                            <StatusBadge
                              status={lead.status}
                              colorMap={LEAD_STATUS_COLORS}
                              labels={LEAD_STATUS_LABELS}
                            />
                          </TableCell>
                          <TableCell className="text-sm">
                            {lead.counselor?.name ?? (
                              <span className="italic text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {timeAgo(lead.createdAt)}
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
 size="sm"
 variant="ghost"
 className=" px-2 text-[var(--alo-brand)]"
 onClick={() =>
                                  toast({
                                    title: "Lead detail",
                                    description: `Opening detail for ${lead.fullName} (${lead.leadId}).`,
                                  })
                                }
                              >
                                <Icon name="Eye" className="mr-1 size-3.5" />
                                View
                              </Button>
                              <Button
 size="sm"
 variant="ghost"
 className=" px-2 text-[var(--alo-cta)]"
 disabled={lead.status === "CONVERTED" || lead.status === "DUPLICATE"}
 onClick={() =>
                                  toast({
                                    title: "Convert lead",
                                    description: `Starting conversion flow for ${lead.fullName}. A new student record will be created.`,
                                  })
                                }
                              >
                                <Icon name="UserCheck" className="mr-1 size-3.5" />
                                Convert
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============ STUDENTS TAB ============ */}
        <TabsContent value="students" className="mt-4 space-y-4">
          <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/15">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Icon
                    name="Search"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Search by name, student ID, or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="h-10 rounded-xl border-[var(--alo-brand)]/15 pl-9"
                  />
                </div>
                <Badge variant="outline" className="h-10 border-[var(--alo-brand)]/20 px-3 text-sm">
                  {filteredStudents.length} / {students.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {filteredStudents.length === 0 ? (
            <EmptyState
              icon="Users"
              title="No students found"
              description="Try a different search term, or add a new student."
            />
          ) : (
            <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/15">
              <CardContent className="p-0">
                <div className="max-h-[34rem] overflow-y-auto alo-scroll">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                      <TableRow>
                        <TableHead className="pl-4">Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Mobile</TableHead>
                        <TableHead className="hidden lg:table-cell">Counselor</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead className="min-w-[120px]">Profile</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="pr-4 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((s) => (
                        <TableRow key={s.id} className="hover:bg-[var(--alo-brand-light)]/30">
                          <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                            {s.studentId}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{s.fullName}</span>
                              <span className="text-xs text-muted-foreground">{s.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden font-mono text-xs md:table-cell">
                            {s.mobile}
                          </TableCell>
                          <TableCell className="hidden text-sm lg:table-cell">
                            {s.counselor?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">{s.studyDestination ?? "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={s.profileCompletion} className="h-2 w-16" />
                              <span className="text-xs font-semibold tabular-nums">
                                {s.profileCompletion}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={s.status} colorMap={STUDENT_STATUS_COLORS} />
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <Button
 size="sm"
 className=" bg-[var(--alo-brand)] px-3 hover:bg-[var(--alo-brand)]/90"
 onClick={() => {
                                setSheetStudentId(s.id);
                                setSheetOpen(true);
                              }}
                            >
                              <Icon name="Orbit" className="mr-1.5 size-3.5" />
                              View 360
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============ PIPELINE OVERVIEW TAB ============ */}
        <TabsContent value="pipeline" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Leads by source bars */}
            <SectionCard
              title="Leads by Source"
              icon="Filter"
              description="Volume per acquisition channel"
            >
              <div className="space-y-3 pt-1">
                {LEAD_SOURCES.map((src) => {
                  const count = leadsBySource[src.value] ?? 0;
                  return (
                    <div key={src.value} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{src.label}</span>
                        <span className="font-semibold tabular-nums text-[var(--alo-brand)]">{count}</span>
                      </div>
                      <MiniBar value={count} max={maxSourceCount} color="#0057B8" />
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Conversion funnel */}
            <SectionCard
              title="Conversion Funnel"
              icon="Filter"
              description="Leads → Contacted → Qualified → Converted"
            >
              <div className="space-y-4 pt-2">
                {[
                  {
                    label: "Total Leads",
                    value: funnel.leads,
                    color: "#0057B8",
                    pct: 100,
                  },
                  {
                    label: "Contacted",
                    value: funnel.contacted,
                    color: "#0284C7",
                    pct: rate(funnel.contacted, funnel.leads),
                  },
                  {
                    label: "Qualified",
                    value: funnel.qualified,
                    color: "#8b5cf6",
                    pct: rate(funnel.qualified, funnel.leads),
                  },
                  {
                    label: "Converted",
                    value: funnel.converted,
                    color: "#10b981",
                    pct: rate(funnel.converted, funnel.leads),
                  },
                ].map((step, idx) => (
                  <div key={step.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <span className="flex size-5 items-center justify-center rounded-full bg-[var(--alo-brand-light)] text-[11px] font-bold text-[var(--alo-brand)]">
                          {idx + 1}
                        </span>
                        {step.label}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {step.value} <span className="text-xs text-muted-foreground">· {step.pct}%</span>
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(2, step.pct)}%`, backgroundColor: step.color }}
                      />
                    </div>
                    {idx < 3 && (
                      <div className="flex items-center gap-1 pl-7 text-[11px] text-muted-foreground">
                        <Icon name="ArrowDown" className="size-3" />
                        {idx === 0 && `Contact rate: ${rate(funnel.contacted, funnel.leads)}%`}
                        {idx === 1 && `Qualification rate: ${rate(funnel.qualified, funnel.contacted)}%`}
                        {idx === 2 && `Close rate: ${rate(funnel.converted, funnel.qualified)}%`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Applications by stage */}
            <SectionCard
              title="Applications by Stage"
              icon="ClipboardList"
              description="Distribution across pipeline stages"
            >
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(appsByStage).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No applications yet.</p>
                ) : (
                  Object.entries(appsByStage).map(([stage, count]) => (
                    <div
                      key={stage}
                      className={
                        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold " +
                        (STAGE_COLORS[stage] ?? "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]")
                      }
                    >
                      <span>{STAGE_LABELS[stage] ?? stage}</span>
                      <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[11px]">
                        {count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            {/* Documents by status */}
            <SectionCard
              title="Documents by Status"
              icon="FileText"
              description="Review pipeline for student documents"
            >
              <div className="space-y-3 pt-1">
                {Object.entries(DOC_STATUS_COLORS).map(([status, color]) => {
                  const count = docsByStatus[status] ?? 0;
                  const total = Object.values(docsByStatus).reduce((s, n) => s + n, 0) || 1;
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2">
                          <span className={"rounded-md px-2 py-0.5 text-xs font-semibold " + color}>
                            {DOC_STATUS_LABELS[status] ?? status}
                          </span>
                        </span>
                        <span className="font-semibold tabular-nums">
                          {count}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({Math.round((count / total) * 100)}%)
                          </span>
                        </span>
                      </div>
                      <MiniBar value={count} max={total} color="#E8501A" />
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============ INLINE STUDENT 360 SHEET ============ */}
      <Student360Sheet
        studentId={sheetStudentId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

// ============================================================
// INLINE STUDENT 360 SHEET
// ============================================================
interface StudentDetail {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  mobile: string;
  altMobile?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  studyDestination?: string;
  programTitle?: string;
  profileCompletion: number;
  status: string;
  counselor?: Counselor | null;
  documents?: any[];
  applications?: any[];
  interviews?: any[];
  payments?: any[];
  timelineEvents?: any[];
  createdAt: string;
}

function Student360Sheet({
  studentId,
  open,
  onOpenChange,
}: {
  studentId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { toast } = useToast();
  const [student, setStudent] = React.useState<StudentDetail | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!studentId || !open) return;
    let alive = true;
    setLoading(true);
    setStudent(null);
    fetch(`/api/students?id=${encodeURIComponent(studentId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.student) {
          setStudent(data.student);
        } else {
          toast({
            title: "Could not load student",
            description: data.error ?? "Please try again.",
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        if (alive) {
          toast({
            title: "Network error",
            description: "Failed to fetch student detail.",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [studentId, open, toast]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto alo-scroll sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-[var(--alo-brand)]">
            <Icon name="Orbit" className="size-5" />
            Student 360
          </SheetTitle>
        </SheetHeader>

        {loading || !student ? (
          <div className="space-y-4 p-4">
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : (
          <div className="space-y-4 px-4 pb-8">
            {/* Header */}
            <div className="rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-[var(--alo-brand-light)]/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-[var(--alo-brand)]">{student.fullName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-white px-2 py-0.5 font-mono">
                      {student.studentId}
                    </span>
                    <StatusBadge
                      status={student.status}
                      colorMap={{
                        ACTIVE: "bg-emerald-100 text-emerald-700",
                        INACTIVE: "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
                        GRADUATED: "bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]",
                      }}
                    />
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-muted-foreground">Counselor</p>
                  <p className="font-semibold text-foreground">
                    {student.counselor?.name ?? "Unassigned"}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Profile Completion</span>
                  <span className="font-bold text-[var(--alo-brand)]">{student.profileCompletion}%</span>
                </div>
                <Progress value={student.profileCompletion} className="h-2" />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Documents", value: student.documents?.length ?? 0, icon: "FileText" },
                { label: "Applications", value: student.applications?.length ?? 0, icon: "ClipboardList" },
                { label: "Interviews", value: student.interviews?.length ?? 0, icon: "Mic" },
                { label: "Payments", value: student.payments?.length ?? 0, icon: "CreditCard" },
              ].map((q) => (
                <div
                  key={q.label}
                  className="rounded-xl border-2 border-[var(--alo-brand)]/10 bg-white p-3 text-center"
                >
                  <div className="mx-auto flex size-8 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                    <Icon name={q.icon} className="size-4" />
                  </div>
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-foreground">{q.value}</p>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {q.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Latest timeline */}
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--alo-brand)]">
                <Icon name="Activity" className="size-4" />
                Recent Timeline
              </p>
              {student.timelineEvents && student.timelineEvents.length > 0 ? (
                <div className="space-y-2">
                  {student.timelineEvents.slice(0, 5).map((ev: any) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-3 rounded-xl border border-[var(--alo-brand)]/10 bg-white p-3"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                        <Icon name="Clock" className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{ev.title}</p>
                        {ev.description && (
                          <p className="truncate text-xs text-muted-foreground">{ev.description}</p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {ev.user?.name ? `${ev.user.name} · ` : ""}
                          {timeAgo(ev.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border-2 border-dashed border-[var(--alo-brand)]/20 px-4 py-6 text-center text-xs text-muted-foreground">
                  No timeline events yet.
                </p>
              )}
            </div>

            {/* Contact summary */}
            <div className="rounded-xl border-2 border-[var(--alo-brand)]/10 bg-white p-4">
              <p className="mb-1 text-sm font-semibold text-[var(--alo-brand)]">Contact</p>
              <InfoRow label="Email" value={student.email} mono />
              <InfoRow label="Mobile" value={student.mobile} mono />
              <InfoRow label="Destination" value={student.studyDestination} />
              <InfoRow label="Program" value={student.programTitle} />
              <InfoRow label="Enrolled Since" value={fmtDate(student.createdAt)} />
            </div>

            <Button
              className="h-12 w-full bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90"
              onClick={() =>
                toast({
                  title: "Open full Student 360",
                  description: `Use the "Student 360" page in the sidebar for the complete view of ${student.fullName}.`,
                })
              }
            >
              <Icon name="ExternalLink" className="mr-2 size-4" />
              Open Full 360 Page
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
export default CrmDashboard;
