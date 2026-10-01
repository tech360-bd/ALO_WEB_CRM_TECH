"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/alo/shared";
import { fmtDate } from "@/lib/alo-types";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface AuditUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: AuditUser | null;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const AUDIT_ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-emerald-100 text-emerald-700",
  FAILED_LOGIN: "bg-red-100 text-red-700",
  LOGOUT: "bg-slate-100 text-slate-700",
  DOC_UPLOAD: "bg-blue-100 text-blue-700",
  DOC_APPROVE: "bg-emerald-100 text-emerald-700",
  DOC_REJECT: "bg-red-100 text-red-700",
  APP_STATUS_CHANGE: "bg-orange-100 text-orange-700",
  VISA_STATUS_CHANGE: "bg-orange-100 text-orange-700",
  AI_ACTION: "bg-violet-100 text-violet-700",
  PROFILE_UPDATE: "bg-blue-100 text-blue-700",
  MESSAGE_ACTION: "bg-slate-100 text-slate-700",
  DATA_IMPORT: "bg-amber-100 text-amber-700",
  ROLE_CHANGE: "bg-violet-100 text-violet-700",
  PERMISSION_CHANGE: "bg-violet-100 text-violet-700",
  SALARY_ACCESS: "bg-amber-100 text-amber-700",
  COMMISSION_APPROVE: "bg-emerald-100 text-emerald-700",
  MOCK_CREDIT_CHANGE: "bg-orange-100 text-orange-700",
};

const ACTION_FILTERS = [
  { value: "ALL", label: "All Actions" },
  { value: "LOGIN", label: "Login" },
  { value: "FAILED_LOGIN", label: "Failed Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "DOC_UPLOAD", label: "Doc Upload" },
  { value: "DOC_APPROVE", label: "Doc Approve" },
  { value: "DOC_REJECT", label: "Doc Reject" },
  { value: "APP_STATUS_CHANGE", label: "App Status Change" },
  { value: "VISA_STATUS_CHANGE", label: "Visa Status Change" },
  { value: "AI_ACTION", label: "AI Action" },
  { value: "PROFILE_UPDATE", label: "Profile Update" },
  { value: "MESSAGE_ACTION", label: "Message" },
  { value: "ROLE_CHANGE", label: "Role Change" },
];

const RESOURCE_FILTERS = [
  { value: "ALL", label: "All Resources" },
  { value: "Student", label: "Student" },
  { value: "Document", label: "Document" },
  { value: "Application", label: "Application" },
  { value: "VisaCase", label: "Visa Case" },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  BRANCH_MANAGER: "Branch Manager",
  COUNSELOR: "Counselor",
  APPLICATION_TEAM: "App Team",
  VISA_OFFICER: "Visa Officer",
  VISA_INTERVIEW_OFFICER: "Visa Interview Officer",
  FINANCE: "Finance",
  MARKETING_MANAGER: "Marketing Mgr",
  MARKETING: "Marketing",
  FRONT_DESK: "Front Desk",
  SUPPORT_STAFF: "Support",
  PARTNER: "Partner",
  STUDENT: "Student",
  ENGLISH_TRAINER: "English Trainer",
  MOCK_TEST_ADMIN: "Mock Test Admin",
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-100 text-violet-700",
  ADMIN: "bg-[#e8f0fb] text-[#0B5ED7]",
  STUDENT: "bg-slate-100 text-slate-700",
  COUNSELOR: "bg-emerald-100 text-emerald-700",
};

const SECURITY_POINTS = [
  {
    icon: "FileLock2",
    title: "Permission-checked downloads",
    description: "All document downloads are verified against RBAC permissions per route.",
  },
  {
    icon: "Lock",
    title: "Private routes only",
    description: "No public URLs expose student data. Every endpoint requires authentication.",
  },
  {
    icon: "EyeOff",
    title: "No public file URLs",
    description: "Files are stored as private paths, never exposed via CDN or direct links.",
  },
  {
    icon: "UserX",
    title: "Suspended users blocked",
    description: "Suspended, resigned, or terminated users cannot log in to any ALO system.",
  },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function safeParseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function fmtTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function summarizeDetails(raw: string | null | undefined): string {
  if (!raw) return "—";
  const parsed = safeParseJSON<Record<string, unknown> | null>(raw, null);
  if (!parsed || typeof parsed !== "object") {
    return raw.length > 80 ? raw.slice(0, 80) + "…" : raw;
  }
  const entries = Object.entries(parsed);
  if (entries.length === 0) return "—";
  const preferredKey = entries.find(([k]) =>
    ["note", "summary", "description", "message", "reason", "action"].includes(k)
  );
  if (preferredKey) {
    const val = String(preferredKey[1]);
    return val.length > 80 ? val.slice(0, 80) + "…" : val;
  }
  return entries
    .slice(0, 2)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? "…" : String(v)}`)
    .join(" · ");
}

function prettyJSON(raw: string | null | undefined): string {
  if (!raw) return "{}";
  const parsed = safeParseJSON<unknown>(raw, null);
  if (parsed === null) return raw;
  try {
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function roleBadgeClass(role: string): string {
  return ROLE_BADGE_COLORS[role] ?? "bg-slate-100 text-slate-700";
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function AuditLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [actionFilter, setActionFilter] = React.useState("ALL");
  const [resourceFilter, setResourceFilter] = React.useState("ALL");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<AuditLog | null>(null);

  const fetchLogs = React.useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetch("/api/audit?take=100", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load audit logs");
        const data = (await res.json()) as { logs: AuditLog[] };
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
      } catch (err) {
        toast({
          title: "Failed to load audit logs",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
        setLogs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast]
  );

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // --- Stats ----------------------------------------------------------------
  const stats = React.useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let loginsToday = 0;
    let failed = 0;
    let aiActions = 0;
    for (const l of logs) {
      if (l.action === "LOGIN" && new Date(l.createdAt) >= startOfToday) loginsToday++;
      if (l.action === "FAILED_LOGIN") failed++;
      if (l.action === "AI_ACTION") aiActions++;
    }
    return { total: logs.length, loginsToday, failed, aiActions };
  }, [logs]);

  // --- Filtering ------------------------------------------------------------
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (actionFilter !== "ALL" && l.action !== actionFilter) return false;
      if (resourceFilter !== "ALL" && l.resource !== resourceFilter) return false;
      if (!q) return true;
      const hay = [
        l.action,
        l.resource ?? "",
        l.resourceId ?? "",
        l.ipAddress ?? "",
        l.user?.name ?? "",
        l.user?.email ?? "",
        l.user?.role ?? "",
        summarizeDetails(l.details),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [logs, actionFilter, resourceFilter, search]);

  const hasActiveFilters = actionFilter !== "ALL" || resourceFilter !== "ALL" || search.trim().length > 0;

  const resetFilters = () => {
    setActionFilter("ALL");
    setResourceFilter("ALL");
    setSearch("");
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        icon="ShieldCheck"
        subtitle="Every action is logged — logins, document changes, status updates, AI actions."
        action={
          <Button
            variant="outline"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="h-12 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
          >
            <Icon name={refreshing ? "Loader2" : "RefreshCw"} className={cn("size-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Events" value={stats.total} icon="ScrollText" accent="blue" hint="last 100 entries" />
          <StatCard label="Logins Today" value={stats.loginsToday} icon="LogIn" accent="emerald" hint="since 00:00 today" />
          <StatCard label="Failed Actions" value={stats.failed} icon="AlertTriangle" accent="rose" hint="failed logins & rejections" />
          <StatCard label="AI Actions" value={stats.aiActions} icon="Bot" accent="violet" hint="AI agent activity" />
        </div>
      )}

      {/* Security summary */}
      <Card className="rounded-2xl border-2 border-[#0B5ED7]/20 bg-[#e8f0fb]/40">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#0B5ED7] text-white">
              <Icon name="ShieldCheck" className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base text-[#0B5ED7]">Security &amp; Compliance Posture</CardTitle>
              <CardDescription className="text-xs">
                Every access to ALO Education data is enforced by these non-negotiable policies.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY_POINTS.map((p) => (
              <div key={p.title} className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0B5ED7] shadow-sm">
                  <Icon name={p.icon} className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters + Table */}
      {loading ? (
        <LoadingGrid count={6} />
      ) : (
        <SectionCard
          title="Audit Trail"
          icon="ListTree"
          description={`${filtered.length} of ${logs.length} events${hasActiveFilters ? " (filtered)" : ""}`}
          action={
            hasActiveFilters ? (
              <Button size="sm" variant="ghost" onClick={resetFilters} className="h-8 text-xs">
                <Icon name="X" className="size-3.5" /> Clear filters
              </Button>
            ) : undefined
          }
        >
          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Action type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Resource</label>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Icon
                  name="Search"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by user, IP, action, resource ID…"
                  className="h-10 pl-9"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <EmptyState
              icon="ScrollText"
              title={logs.length === 0 ? "No audit events yet" : "No matching events"}
              description={
                logs.length === 0
                  ? "Audit events will appear here as users interact with the system."
                  : "Try adjusting your filters to see more events."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={resetFilters} className="h-10">
                    <Icon name="RotateCcw" className="size-4" /> Reset filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="max-h-[40rem] overflow-y-auto alo-scroll rounded-xl border border-border/60">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                  <TableRow className="border-b border-border/60 hover:bg-transparent">
                    <TableHead className="w-[140px]">Timestamp</TableHead>
                    <TableHead className="w-[150px]">Action</TableHead>
                    <TableHead className="w-[180px]">Resource</TableHead>
                    <TableHead className="min-w-[160px]">User</TableHead>
                    <TableHead className="min-w-[200px]">Details</TableHead>
                    <TableHead className="w-[130px]">IP Address</TableHead>
                    <TableHead className="w-[80px] text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => {
                    const summary = summarizeDetails(log.details);
                    return (
                      <TableRow key={log.id} className="text-sm">
                        <TableCell className="align-top">
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {fmtDate(log.createdAt)}
                          </div>
                          <div className="font-mono text-[11px] font-medium text-foreground">
                            {fmtTime(log.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <StatusBadge
                            status={log.action}
                            colorMap={AUDIT_ACTION_COLORS}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          {log.resource ? (
                            <div>
                              <div className="text-xs font-medium text-foreground">{log.resource}</div>
                              {log.resourceId && (
                                <div className="font-mono text-[10px] text-muted-foreground">
                                  {log.resourceId}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {log.user ? (
                            <div>
                              <div className="text-xs font-medium text-foreground">{log.user.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge
                                  variant="outline"
                                  className={cn("h-4 px-1.5 text-[10px] font-medium", roleBadgeClass(log.user.role))}
                                >
                                  {roleLabel(log.user.role)}
                                </Badge>
                              </div>
                              <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                {log.user.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="line-clamp-2 max-w-[280px] cursor-help text-xs text-muted-foreground">
                                  {summary}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm">
                                <p className="text-xs">{summary}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="align-top">
                          {log.ipAddress ? (
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {log.ipAddress}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-[#0B5ED7] hover:bg-[#e8f0fb]"
                            onClick={() => setSelected(log)}
                          >
                            <Icon name="Eye" className="size-3.5" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {filtered.length > 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Showing {filtered.length} of {logs.length} log entries · use the filters above to narrow results
            </p>
          )}
        </SectionCard>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0B5ED7]">
              <Icon name="FileSearch" className="size-5" />
              Audit Event Detail
            </DialogTitle>
            <DialogDescription>
              Full record of this security event. This entry is immutable and time-stamped.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Action
                  </p>
                  <div className="mt-1.5">
                    <StatusBadge
                      status={selected.action}
                      colorMap={AUDIT_ACTION_COLORS}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Timestamp
                  </p>
                  <p className="mt-1.5 font-mono text-xs text-foreground">
                    {fmtDate(selected.createdAt)} · {fmtTime(selected.createdAt)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Resource
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-foreground">
                    {selected.resource ?? "—"}
                  </p>
                  {selected.resourceId && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {selected.resourceId}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    IP Address
                  </p>
                  <p className="mt-1.5 font-mono text-xs text-foreground">
                    {selected.ipAddress ?? "—"}
                  </p>
                </div>
                {selected.user && (
                  <div className="rounded-lg border border-border/60 p-3 sm:col-span-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Performed by
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{selected.user.name}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", roleBadgeClass(selected.user.role))}
                      >
                        {roleLabel(selected.user.role)}
                      </Badge>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {selected.user.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Icon name="Braces" className="size-3.5" /> Details (raw JSON)
                </p>
                <pre className="max-h-64 overflow-y-auto alo-scroll rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground">
                  {prettyJSON(selected.details)}
                </pre>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    navigator.clipboard?.writeText(prettyJSON(selected.details));
                    toast({ title: "Copied", description: "Audit details copied to clipboard." });
                  }}
                >
                  <Icon name="Copy" className="size-4" /> Copy JSON
                </Button>
                <Button
                  className="h-12 bg-[#F97316] text-white hover:bg-[#F97316]/90"
                  onClick={() => {
                    toast({
                      title: "Event flagged for review",
                      description: `Audit event ${selected.id} has been flagged for security review.`,
                    });
                    setSelected(null);
                  }}
                >
                  <Icon name="Flag" className="size-4" /> Flag for review
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default AuditLogs;
