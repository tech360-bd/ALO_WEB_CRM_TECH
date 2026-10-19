"use client";

// ============================================================
// FEATURE FLAGS CONTROL PANEL (spec s117, s92, s94, s116)
// ============================================================
// Replaces the hard-coded `FEATURE_FLAGS` array that used to render in the
// super-admin dashboard. That array was mock data (s92): the `enabled` values
// were literals and toggling one only showed a toast pointing elsewhere.
//
// This panel reads the persisted FeatureFlag table through
// GET /api/feature-flags and writes through PATCH /api/feature-flags/[key].
// Every mutation is confirmed with a reason and lands in FeatureFlagAudit, so
// a regulatory or rollout change is attributable (s116 human-in-the-loop).
//
// Failure is reported honestly (s91/s94): a disabled module, an unauthorized
// caller and a network error each render their own state — never a silent
// empty grid that looks like "no features exist".
// ============================================================

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Icon, SectionCard, EmptyState, LoadingGrid } from "@/components/alo/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

/** A row from GET /api/feature-flags. Allowlists arrive as JSON strings. */
interface FlagRow {
  key: string;
  module: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
  allowRoles: string;
  allowUserIds: string;
  denyUserIds: string;
  environment: string;
  config: string;
  status: string;
  updatedBy?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}

interface CatalogueEntry {
  key: string;
  module: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
}

interface AuditEntry {
  id: string;
  flagKey: string;
  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  reason?: string | null;
  before?: string | null;
  after?: string | null;
  createdAt: string;
}

type PanelStatus = "loading" | "ready" | "empty" | "unauthorized" | "error";

const MODULE_ICON: Record<string, string> = {
  AI: "Sparkles",
  COMMUNICATION: "MessageSquare",
  B2B: "Handshake",
  STUDENT: "GraduationCap",
  VISA: "Plane",
  FINANCE: "Wallet",
  RISK: "ShieldAlert",
  PLATFORM: "Server",
  MARKETING: "Megaphone",
  PORTAL: "LayoutDashboard",
};

function parseList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function iconForModule(moduleName: string): string {
  return MODULE_ICON[String(moduleName || "").toUpperCase()] ?? "ToggleLeft";
}

export function FeatureFlagsPanel() {
  const { toast } = useToast();
  const [flags, setFlags] = React.useState<FlagRow[]>([]);
  const [catalogue, setCatalogue] = React.useState<CatalogueEntry[]>([]);
  const [status, setStatus] = React.useState<PanelStatus>("loading");
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [moduleFilter, setModuleFilter] = React.useState<string>("ALL");
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  // Confirmation dialog state — a mutation is never applied on click alone.
  const [pending, setPending] = React.useState<FlagRow | null>(null);
  const [pendingEnabled, setPendingEnabled] = React.useState<boolean>(false);
  const [pendingRollout, setPendingRollout] = React.useState<number>(0);
  const [pendingReason, setPendingReason] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // Audit drawer state.
  const [auditKey, setAuditKey] = React.useState<string | null>(null);
  const [auditRows, setAuditRows] = React.useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = React.useState<boolean>(false);

  const load = React.useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const response = await fetch("/api/feature-flags", { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (response.status === 401 || response.status === 403) {
        setStatus("unauthorized");
        setErrorMessage(payload?.error || "Administrator access is required to manage feature flags.");
        return;
      }
      if (!response.ok || !payload?.success) {
        setStatus("error");
        setErrorMessage(payload?.error || `Request failed with status ${response.status}.`);
        return;
      }

      const rows: FlagRow[] = Array.isArray(payload.flags) ? payload.flags : [];
      setFlags(rows);
      setCatalogue(Array.isArray(payload.catalogue) ? payload.catalogue : []);
      setStatus(rows.length === 0 ? "empty" : "ready");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not reach the feature flag service.");
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const modules = React.useMemo(() => {
    const set = new Set(flags.map((flag) => flag.module).filter(Boolean));
    return Array.from(set).sort();
  }, [flags]);

  const visible = React.useMemo(
    () => (moduleFilter === "ALL" ? flags : flags.filter((flag) => flag.module === moduleFilter)),
    [flags, moduleFilter],
  );

  const enabledCount = flags.filter((flag) => flag.enabled).length;

  async function bootstrap() {
    setBusyKey("__bootstrap");
    try {
      const response = await fetch("/api/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bootstrap" }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        toast({
          variant: "destructive",
          title: "Bootstrap failed",
          description: payload?.error || `Request failed with status ${response.status}.`,
        });
        return;
      }
      toast({
        title: "Flag catalogue created",
        description: `${payload.created?.length ?? 0} flags created, ${payload.skipped?.length ?? 0} already present. All new flags start DISABLED at 0% rollout.`,
      });
      await load();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Bootstrap failed",
        description: error instanceof Error ? error.message : "Network error.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  function openConfirm(flag: FlagRow, nextEnabled: boolean) {
    setPending(flag);
    setPendingEnabled(nextEnabled);
    setPendingRollout(flag.rolloutPercent ?? 0);
    setPendingReason("");
  }

  async function applyChange() {
    if (!pending) return;
    if (!pendingReason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Every flag change is audited. Record why this is changing before applying it.",
      });
      return;
    }
    setSubmitting(true);
    const key = pending.key;
    try {
      const response = await fetch(`/api/feature-flags/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: pendingEnabled,
          rolloutPercent: pendingRollout,
          reason: pendingReason.trim(),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        toast({
          variant: "destructive",
          title: `Could not update ${key}`,
          description: payload?.error || `Request failed with status ${response.status}.`,
        });
        return;
      }
      toast({
        title: `${key} ${payload.action || "UPDATED"}`,
        description: `Now ${payload.flag?.enabled ? "ENABLED" : "DISABLED"} at ${payload.flag?.rolloutPercent ?? 0}% rollout. Recorded in the audit trail.`,
      });
      setPending(null);
      await load();
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Could not update ${key}`,
        description: error instanceof Error ? error.message : "Network error.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function openAudit(key: string) {
    setAuditKey(key);
    setAuditRows([]);
    setAuditLoading(true);
    try {
      const response = await fetch(`/api/feature-flags/${encodeURIComponent(key)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        toast({
          variant: "destructive",
          title: "Could not load audit trail",
          description: payload?.error || `Request failed with status ${response.status}.`,
        });
        setAuditKey(null);
        return;
      }
      setAuditRows(Array.isArray(payload.audit) ? payload.audit : []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not load audit trail",
        description: error instanceof Error ? error.message : "Network error.",
      });
      setAuditKey(null);
    } finally {
      setAuditLoading(false);
    }
  }

  // ---- non-ready states are explicit, never a blank grid ----
  if (status === "loading") {
    return (
      <SectionCard title="Feature Flags" description="Loading persisted flag state" icon="ToggleLeft">
        <LoadingGrid count={6} />
      </SectionCard>
    );
  }

  if (status === "unauthorized") {
    return (
      <SectionCard title="Feature Flags" icon="ToggleLeft">
        <EmptyState
          icon="ShieldOff"
          title="Administrator access required"
          description={errorMessage}
          action={
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <Icon name="RefreshCw" className="mr-1.5 size-3.5" />
              Retry
            </Button>
          }
        />
      </SectionCard>
    );
  }

  if (status === "error") {
    return (
      <SectionCard title="Feature Flags" icon="ToggleLeft">
        <EmptyState
          icon="AlertTriangle"
          title="Feature flag service unavailable"
          description={errorMessage}
          action={
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <Icon name="RefreshCw" className="mr-1.5 size-3.5" />
              Retry
            </Button>
          }
        />
      </SectionCard>
    );
  }

  if (status === "empty") {
    return (
      <SectionCard title="Feature Flags" icon="ToggleLeft">
        <EmptyState
          icon="Database"
          title="No flags persisted yet"
          description={`The catalogue defines ${catalogue.length} flags. Bootstrap writes them to the database, all DISABLED at 0% rollout — nothing turns on until an administrator enables it.`}
          action={
            <Button size="sm" onClick={() => void bootstrap()} disabled={busyKey === "__bootstrap"}>
              <Icon name="Play" className="mr-1.5 size-3.5" />
              {busyKey === "__bootstrap" ? "Creating…" : "Bootstrap flag catalogue"}
            </Button>
          }
        />
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard
        title="Feature Flags"
        description={`${enabledCount} of ${flags.length} enabled · changes are audited and require a reason`}
        icon="ToggleLeft"
        action={
          <div className="flex items-center gap-2">
            <select
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A]"
              aria-label="Filter flags by module"
            >
              <option value="ALL">All modules</option>
              {modules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <Icon name="RefreshCw" className="mr-1.5 size-3.5" />
              Refresh
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((flag) => {
            const roles = parseList(flag.allowRoles);
            return (
              <div
                key={flag.key}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border-2 p-3 transition-colors",
                  flag.enabled ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        flag.enabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500",
                      )}
                    >
                      <Icon name={iconForModule(flag.module)} className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-semibold text-[#0F172A]" title={flag.key}>
                        {flag.key}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{flag.module}</p>
                    </div>
                  </div>
                  <Switch
                    checked={flag.enabled}
                    disabled={busyKey === flag.key}
                    onCheckedChange={(next) => openConfirm(flag, next)}
                    aria-label={`Toggle ${flag.key}`}
                  />
                </div>

                <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground" title={flag.description}>
                  {flag.description}
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={flag.enabled ? "default" : "secondary"} className="text-[10px]">
                    {flag.rolloutPercent}% rollout
                  </Badge>
                  {flag.environment && flag.environment !== "all" && (
                    <Badge variant="outline" className="text-[10px]">
                      {flag.environment}
                    </Badge>
                  )}
                  {roles.length > 0 && (
                    <Badge variant="outline" className="text-[10px]" title={roles.join(", ")}>
                      {roles.length} role{roles.length === 1 ? "" : "s"}
                    </Badge>
                  )}
                  {flag.status && flag.status !== "ACTIVE" && (
                    <Badge variant="outline" className="text-[10px]">
                      {flag.status}
                    </Badge>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void openAudit(flag.key)}
                  className="mt-auto self-start text-[11px] font-medium text-[#0057B8] underline-offset-2 hover:underline"
                >
                  View audit trail
                </button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ---- Confirmation: human-in-the-loop, reason mandatory (s116) ---- */}
      <Dialog open={pending !== null} onOpenChange={(open) => !open && !submitting && setPending(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingEnabled ? "Enable" : "Disable"} {pending?.key}
            </DialogTitle>
            <DialogDescription>
              {pending?.description} This change is written to the audit trail with your identity and
              takes effect for matching users immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rollout">Rollout percentage — {pendingRollout}%</Label>
              <Slider
                id="rollout"
                min={0}
                max={100}
                step={5}
                value={[pendingRollout]}
                onValueChange={(value) => setPendingRollout(value[0] ?? 0)}
              />
              <p className="text-[11px] text-muted-foreground">
                {pendingEnabled
                  ? "Users are bucketed by a stable hash of their id, so the same user never flips between requests."
                  : "A disabled flag is off for everyone regardless of rollout percentage."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for this change</Label>
              <Textarea
                id="reason"
                value={pendingReason}
                onChange={(event) => setPendingReason(event.target.value)}
                placeholder="e.g. Enabling for the Dhaka branch pilot after counselor sign-off."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPending(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void applyChange()} disabled={submitting || !pendingReason.trim()}>
              {submitting ? "Applying…" : `Confirm ${pendingEnabled ? "enable" : "disable"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Audit trail ---- */}
      <Dialog open={auditKey !== null} onOpenChange={(open) => !open && setAuditKey(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit trail — {auditKey}</DialogTitle>
            <DialogDescription>
              Most recent changes first. Rows are append-only and cannot be edited or deleted.
            </DialogDescription>
          </DialogHeader>
          {auditLoading ? (
            <LoadingGrid count={3} />
          ) : auditRows.length === 0 ? (
            <EmptyState
              icon="History"
              title="No changes recorded yet"
              description="This flag has not been modified since it was created."
            />
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditRows.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(entry.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{entry.actorEmail || entry.actorId || "system"}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs" title={entry.reason || ""}>
                        {entry.reason || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default FeatureFlagsPanel;
