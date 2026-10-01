"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  PageHeader,
  SectionCard,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface RoleScope {
  role: string;
  scope: string;
}

interface Permission {
  id: string;
  feature: string;
  action: string;
  description: string;
  defaultRoles: string[];
  roles: RoleScope[];
}

interface PermissionsResponse {
  permissions: Record<string, Permission[]>;
  roles: string[];
}

// -----------------------------------------------------------------------------
// Constants — module color map, action styles, scope definitions
// -----------------------------------------------------------------------------

const MODULE_COLORS: Record<string, { badge: string; chip: string; dot: string }> = {
  Student: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    chip: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  Documents: {
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    chip: "bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  Communication: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    chip: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  Application: {
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    chip: "bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  Visa: {
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    chip: "bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  Marketing: {
    badge: "bg-pink-100 text-pink-700 border-pink-200",
    chip: "bg-pink-50 text-pink-700",
    dot: "bg-pink-500",
  },
  "HR Self": {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    chip: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  "Private HR": {
    badge: "bg-red-100 text-red-700 border-red-200",
    chip: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

const ACTION_STYLES: Record<string, string> = {
  view: "bg-sky-100 text-sky-700",
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-amber-100 text-amber-700",
  approve: "bg-violet-100 text-violet-700",
  export: "bg-slate-200 text-slate-700",
  download: "bg-slate-200 text-slate-700",
};

const SCOPE_LABELS: Record<string, string> = {
  ASSIGNED_ONLY: "Assigned only",
  ALL: "All company",
  OWN_ONLY: "Own only",
};

const SCOPE_INFO: { value: string; label: string; description: string; icon: string }[] = [
  {
    value: "ASSIGNED_ONLY",
    label: "ASSIGNED_ONLY",
    description: "Only own / assigned data. A counselor sees only their assigned students.",
    icon: "UserCheck",
  },
  {
    value: "ALL",
    label: "ALL",
    description: "All company data. Reserved for admins and super admins.",
    icon: "Globe",
  },
  {
    value: "OWN_ONLY",
    label: "OWN_ONLY",
    description: "Only own records — e.g. an employee viewing their own HR profile.",
    icon: "Lock",
  },
];

// Roles shown as chips (the task lists exactly these — SUPER_ADMIN down to ENGLISH_TRAINER)
const ROLE_ORDER = [
  "SUPER_ADMIN",
  "ADMIN",
  "HR_MANAGER",
  "BRANCH_MANAGER",
  "COUNSELOR",
  "APPLICATION_TEAM",
  "VISA_OFFICER",
  "VISA_INTERVIEW_OFFICER",
  "FINANCE",
  "MARKETING_MANAGER",
  "MARKETING",
  "FRONT_DESK",
  "ENGLISH_TRAINER",
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  HR_MANAGER: "HR Manager",
  BRANCH_MANAGER: "Branch Manager",
  COUNSELOR: "Counselor",
  APPLICATION_TEAM: "Application Team",
  VISA_OFFICER: "Visa Officer",
  VISA_INTERVIEW_OFFICER: "Visa Interview Officer",
  FINANCE: "Finance",
  MARKETING_MANAGER: "Marketing Manager",
  MARKETING: "Marketing",
  FRONT_DESK: "Front Desk",
  ENGLISH_TRAINER: "English Trainer",
};

const DEFAULT_SCOPE = "ASSIGNED_ONLY";

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function PermissionMatrix() {
  const { toast } = useToast();
  const [data, setData] = React.useState<PermissionsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedRole, setSelectedRole] = React.useState<string>("COUNSELOR");
  const [toggling, setToggling] = React.useState<Record<string, boolean>>({});

  // ---------------------------------------------------------------- fetch ----
  const fetchPermissions = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/permissions", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load permissions");
      const json = (await res.json()) as PermissionsResponse;
      setData(json);
    } catch (err) {
      toast({
        title: "Failed to load permissions",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // ---------------------------------------------------------- derived data --
  const modules = React.useMemo(() => {
    if (!data?.permissions) return [] as string[];
    return Object.keys(data.permissions).sort((a, b) => {
      // Order modules by the canonical list above; fall back to alphabetical
      const ORDER = [
        "Student",
        "Documents",
        "Communication",
        "Application",
        "Visa",
        "Marketing",
        "HR Self",
        "Private HR",
      ];
      const ia = ORDER.indexOf(a);
      const ib = ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [data]);

  const roleList = React.useMemo(() => {
    if (data?.roles && data.roles.length > 0) return data.roles;
    return ROLE_ORDER;
  }, [data]);

  // Filter role chips to the canonical list shown in the spec — others (STUDENT, PARTNER,
  // SUPPORT_STAFF, MOCK_TEST_ADMIN) are valid in the DB but hidden from this admin UI for clarity.
  const visibleRoles = React.useMemo(
    () => ROLE_ORDER.filter((r) => roleList.includes(r)),
    [roleList]
  );

  // ----------------------------------------------------- permission toggle --
  const isGranted = (perm: Permission, role: string): RoleScope | undefined => {
    return perm.roles.find((r) => r.role === role);
  };

  const handleToggle = async (
    perm: Permission,
    role: string,
    currentlyGranted: boolean
  ) => {
    const key = `${perm.id}:${role}`;
    setToggling((s) => ({ ...s, [key]: true }));

    // Optimistic update — flip local state immediately for snappy UX
    setData((prev) => {
      if (!prev) return prev;
      const next: PermissionsResponse = {
        ...prev,
        permissions: { ...prev.permissions },
      };
      for (const mod of Object.keys(next.permissions)) {
        next.permissions[mod] = next.permissions[mod].map((p) => {
          if (p.id !== perm.id) return p;
          const roles = currentlyGranted
            ? p.roles.filter((r) => r.role !== role)
            : [...p.roles, { role, scope: DEFAULT_SCOPE }];
          return { ...p, roles };
        });
      }
      return next;
    });

    try {
      const res = await fetch("/api/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissionId: perm.id,
          role,
          scope: DEFAULT_SCOPE,
          grantedBy: "superadmin",
          action: currentlyGranted ? "revoke" : "grant",
        }),
      });
      if (!res.ok) throw new Error("Permission update failed");
      toast({
        title: currentlyGranted ? "Permission revoked" : "Permission granted",
        description: `${ROLE_LABELS[role] || role} can ${
          currentlyGranted ? "no longer" : "now"
        } "${perm.feature}".`,
      });
    } catch (err) {
      // Revert optimistic update on error
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Reverting change.",
        variant: "destructive",
      });
      fetchPermissions();
    } finally {
      setToggling((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    }
  };

  // ----------------------------------------------------------------- render --
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Permission Matrix"
          icon="Lock"
          subtitle="Granular role-based access control. Super Admin can grant or revoke any permission per role."
          action={
            <Button variant="outline" className="h-12 border-[#0B5ED7]/30 text-[#0B5ED7]" disabled>
              <Icon name="RefreshCw" className="size-4" /> Refresh
            </Button>
          }
        />
        <LoadingGrid count={6} />
      </div>
    );
  }

  if (!data || modules.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Permission Matrix"
          icon="Lock"
          subtitle="Granular role-based access control. Super Admin can grant or revoke any permission per role."
        />
        <EmptyState
          icon="Lock"
          title="No permissions found"
          description="The permission matrix could not be loaded. Try refreshing."
          action={
            <Button
              onClick={fetchPermissions}
              className="h-12 bg-[#F97316] hover:bg-[#F97316]/90 text-white"
            >
              <Icon name="RefreshCw" className="size-4" /> Reload
            </Button>
          }
        />
      </div>
    );
  }

  // For each module, count granted for the selected role (small dataset, no memo needed)
  let total = 0;
  let granted = 0;
  for (const mod of modules) {
    for (const p of data.permissions[mod] || []) {
      total++;
      if (selectedRole === "__ALL__" || isGranted(p, selectedRole)) granted++;
    }
  }
  const stats = { total, granted };

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------- header */}
      <PageHeader
        title="Permission Matrix"
        icon="Lock"
        subtitle="Granular role-based access control. Super Admin can grant or revoke any permission per role."
        action={
          <Button
            variant="outline"
            onClick={fetchPermissions}
            className="h-12 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
          >
            <Icon name="RefreshCw" className="size-4" /> Refresh
          </Button>
        }
      />

      {/* ------------------------------------------------- security notice */}
      <Card className="rounded-2xl border-2 border-[#F97316]/40 bg-orange-50/40">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F97316] text-white">
              <Icon name="ShieldAlert" className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base text-[#F97316]">
                Security Notice — Frontend vs Backend Authority
              </CardTitle>
              <CardDescription className="text-xs">
                Permission changes here are audit-logged and enforced server-side.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-start gap-2.5 rounded-xl bg-white/70 p-3">
              <Icon name="Eye" className="mt-0.5 size-4 shrink-0 text-[#0B5ED7]" />
              <p className="text-xs text-foreground">
                <span className="font-semibold text-[#0B5ED7]">Frontend PermissionGate</span>{" "}
                only hides buttons & routes — it&apos;s never the source of truth.
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-white/70 p-3">
              <Icon name="Server" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <p className="text-xs text-foreground">
                <span className="font-semibold text-emerald-700">Backend permission check</span>{" "}
                is the final authority on every API call.
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl bg-white/70 p-3">
              <Icon name="ScrollText" className="mt-0.5 size-4 shrink-0 text-[#F97316]" />
              <p className="text-xs text-foreground">
                <span className="font-semibold text-[#F97316]">All permission changes</span>{" "}
                are written to the audit log with actor, role, scope, and action.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------- scope info banner */}
      <SectionCard
        title="Permission scopes"
        icon="Layers"
        description="Each permission is granted with a scope that limits the data the role can see or act on."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {SCOPE_INFO.map((s) => (
            <div
              key={s.value}
              className="flex items-start gap-3 rounded-xl border border-[#0B5ED7]/15 bg-[#e8f0fb]/40 p-3"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0B5ED7] text-white">
                <Icon name={s.icon} className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-[#0B5ED7]">{s.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* --------------------------------------------- role selector chips */}
      <Card className="rounded-2xl border-2 border-[#0B5ED7]/15">
        <CardContent className="pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon name="Users" className="size-4 text-[#0B5ED7]" />
              <span className="text-sm font-semibold text-[#0B5ED7]">Select role to configure</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="border-[#0B5ED7]/30 text-[#0B5ED7]">
                {selectedRole === "__ALL__"
                  ? "Viewing all roles"
                  : `${stats.granted} of ${stats.total} granted`}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole("__ALL__")}
              className={cn(
                "rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition-colors",
                selectedRole === "__ALL__"
                  ? "border-[#0B5ED7] bg-[#0B5ED7] text-white"
                  : "border-[#0B5ED7]/20 bg-white text-[#0B5ED7] hover:bg-[#e8f0fb]"
              )}
            >
              All roles
            </button>
            {visibleRoles.map((role) => {
              const active = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "border-[#0B5ED7] bg-[#0B5ED7] text-white"
                      : "border-[#0B5ED7]/20 bg-white text-[#0B5ED7] hover:bg-[#e8f0fb]"
                  )}
                >
                  {ROLE_LABELS[role] || role}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------- per-module tables */}
      {selectedRole !== "__ALL__" ? (
        <div className="space-y-5">
          {modules.map((mod) => {
            const perms = data.permissions[mod] || [];
            if (perms.length === 0) return null;
            const color = MODULE_COLORS[mod] || MODULE_COLORS.Student;
            const grantedCount = perms.filter((p) => isGranted(p, selectedRole)).length;

            return (
              <SectionCard
                key={mod}
                title={`${mod} module`}
                icon="Boxes"
                description={`${perms.length} permissions · ${grantedCount} granted to ${ROLE_LABELS[selectedRole] || selectedRole}`}
                action={
                  <Badge className={cn("border", color.badge)}>
                    {mod}
                  </Badge>
                }
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[120px]">Module</TableHead>
                        <TableHead className="min-w-[200px]">Feature</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                        <TableHead className="min-w-[260px]">Description</TableHead>
                        <TableHead className="w-[140px]">Scope</TableHead>
                        <TableHead className="w-[90px] text-right">Granted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {perms.map((p) => {
                        const granted = isGranted(p, selectedRole);
                        const toggleKey = `${p.id}:${selectedRole}`;
                        const isToggling = !!toggling[toggleKey];
                        const isDefault = p.defaultRoles.includes(selectedRole);
                        const actionColor =
                          ACTION_STYLES[p.action] || "bg-slate-100 text-slate-700";

                        return (
                          <TableRow key={p.id} className="hover:bg-[#e8f0fb]/40">
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                                  color.chip
                                )}
                              >
                                <span className={cn("size-1.5 rounded-full", color.dot)} />
                                {mod}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="font-mono text-xs font-semibold text-foreground">
                                  {p.feature}
                                </code>
                                {isDefault && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fb] px-1.5 py-0.5 text-[10px] font-semibold text-[#0B5ED7]">
                                          <Icon name="Star" className="size-2.5" /> default
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Default role for this permission
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize",
                                  actionColor
                                )}
                              >
                                {p.action}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {p.description}
                              </span>
                            </TableCell>
                            <TableCell>
                              {granted ? (
                                <code className="font-mono text-[11px] text-[#0B5ED7]">
                                  {SCOPE_LABELS[granted.scope] || granted.scope}
                                </code>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <Checkbox
                                  checked={!!granted}
                                  disabled={isToggling}
                                  onCheckedChange={() =>
                                    handleToggle(p, selectedRole, !!granted)
                                  }
                                  className={cn(
                                    "size-5 rounded-md border-2 transition-colors",
                                    granted
                                      ? "border-emerald-600 bg-emerald-600 text-white"
                                      : "border-slate-300"
                                  )}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </SectionCard>
            );
          })}
        </div>
      ) : (
        // ------------------------------------------------ all-roles matrix view
        <SectionCard
          title="All roles — permissions overview"
          icon="Grid3x3"
          description="Each cell shows ✓ when the role has the permission (any scope). Click a cell to toggle."
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[200px]">Feature</TableHead>
                  <TableHead className="min-w-[180px]">Module</TableHead>
                  {visibleRoles.map((r) => (
                    <TableHead key={r} className="w-[60px] text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-semibold leading-tight">
                          {ROLE_LABELS[r] || r}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.flatMap((mod) => {
                  const perms = data.permissions[mod] || [];
                  const color = MODULE_COLORS[mod] || MODULE_COLORS.Student;
                  return perms.map((p) => (
                    <TableRow key={p.id} className="hover:bg-[#e8f0fb]/40">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <code className="font-mono text-xs font-semibold text-foreground">
                            {p.feature}
                          </code>
                          <span className="text-[11px] text-muted-foreground">
                            {p.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                            color.chip
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", color.dot)} />
                          {mod}
                        </span>
                      </TableCell>
                      {visibleRoles.map((r) => {
                        const granted = isGranted(p, r);
                        const toggleKey = `${p.id}:${r}`;
                        const isToggling = !!toggling[toggleKey];
                        return (
                          <TableCell key={r} className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={!!granted}
                                disabled={isToggling}
                                onCheckedChange={() => handleToggle(p, r, !!granted)}
                                className={cn(
                                  "size-5 rounded-md border-2 transition-colors",
                                  granted
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-slate-300"
                                )}
                              />
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
export default PermissionMatrix;
