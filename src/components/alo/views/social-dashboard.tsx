"use client";

/**
 * Social & Communication Accounts Hub — Marketing / Admin surface.
 *
 * Capabilities:
 *  • KPI row: connected, active, expired, pending verification, official, employee personal
 *  • Social Accounts grid (platform-branded cards with status badges + permissions)
 *  • "CONFIGURATION REQUIRED" banner on unconnected accounts (no fake integrations)
 *  • Connect New Account dialog (platform / type / owner — sets requiresConfig=true)
 *  • Configure dialog — permissions (canSend, canManage, canView)
 *  • Webhook Events log table (verified / processed / errors — security monitoring)
 *  • Audit notice — every outgoing official communication is logged
 *
 * APIs:
 *  GET   /api/communications/social-accounts
 *  POST  /api/communications/social-accounts
 *  PATCH /api/communications/social-accounts/[id]
 *  GET   /api/communications/webhooks/events
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Icon,
  PageHeader,
  KpiCard,
  SectionCard,
  EmptyState,
  ErrorState,
  LoadingGrid,
  Notification,
  StatusBadge,
  DataTable,
  type Column,
  type AccentColor,
} from "@/components/alo/ui";
import { timeAgo } from "@/lib/alo-types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SocialAccount {
  id: string;
  connectedAccountId?: string | null;
  platform: string; // FACEBOOK, INSTAGRAM, WHATSAPP, LINKEDIN, GMAIL, OUTLOOK
  accountId?: string | null;
  accountName: string;
  accountType: string; // OFFICIAL | EMPLOYEE_PERSONAL
  ownerEmployeeId?: string | null;
  organization: string;
  connectionStatus: string; // CONNECTED | DISCONNECTED | EXPIRED | PERMISSION_ERROR
  permissions: string; // JSON array of canSend/canManage/canView
  tokenStatus: string; // NONE | VALID | EXPIRED | REVOKED
  webhookStatus: string; // ACTIVE | INACTIVE | PENDING_VERIFICATION
  lastSync?: string | null;
  requiresConfig: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; role: string; email: string } | null;
}

interface WebhookEvent {
  id: string;
  provider: string;
  eventId?: string | null;
  eventType: string;
  verified: boolean;
  processed: boolean;
  processedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<
  string,
  { label: string; icon: string; brand: string; bg: string; text: string }
> = {
  FACEBOOK: {
    label: "Facebook",
    icon: "Facebook",
    brand: "#1877F2",
    bg: "bg-[#1877F2]",
    text: "text-white",
  },
  INSTAGRAM: {
    label: "Instagram",
    icon: "Instagram",
    brand: "#E1306C",
    bg: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045]",
    text: "text-white",
  },
  WHATSAPP: {
    label: "WhatsApp",
    icon: "MessageCircle",
    brand: "#25D366",
    bg: "bg-[var(--alo-whatsapp)]",
    text: "text-white",
  },
  LINKEDIN: {
    label: "LinkedIn",
    icon: "Linkedin",
    brand: "#0A66C2",
    bg: "bg-[#0A66C2]",
    text: "text-white",
  },
  GMAIL: {
    label: "Gmail",
    icon: "Mail",
    brand: "#EA4335",
    bg: "bg-[#EA4335]",
    text: "text-white",
  },
  OUTLOOK: {
    label: "Outlook",
    icon: "Mail",
    brand: "#0078D4",
    bg: "bg-[#0078D4]",
    text: "text-white",
  },
};

const PLATFORM_OPTIONS = Object.keys(PLATFORM_META);

const PROVIDER_META: Record<string, { accent: AccentColor; label: string }> = {
  WHATSAPP: { accent: "emerald", label: "WhatsApp" },
  FACEBOOK: { accent: "blue", label: "Facebook" },
  INSTAGRAM: { accent: "rose", label: "Instagram" },
  TWILIO: { accent: "orange", label: "Twilio" },
  SENDGRID: { accent: "sky", label: "SendGrid" },
};

function parsePermissions(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function SocialDashboard() {
  const { toast } = useToast();
  const [accounts, setAccounts] = React.useState<SocialAccount[]>([]);
  const [events, setEvents] = React.useState<WebhookEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialogs
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [configureAccount, setConfigureAccount] = React.useState<SocialAccount | null>(null);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accRes, evRes] = await Promise.all([
        fetch("/api/communications/social-accounts"),
        fetch("/api/communications/webhooks/events?limit=50"),
      ]);
      if (!accRes.ok) throw new Error("Failed to fetch social accounts");
      const accJson = await accRes.json();
      const evJson = evRes.ok ? await evRes.json() : { events: [] };
      setAccounts(accJson.socialAccounts || []);
      setEvents(evJson.events || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load Social Accounts Hub");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Derived KPIs
  const connected = accounts.filter((a) => a.connectionStatus === "CONNECTED").length;
  const expired = accounts.filter(
    (a) => a.connectionStatus === "EXPIRED" || a.connectionStatus === "PERMISSION_ERROR",
  ).length;
  const pendingVerification = accounts.filter(
    (a) => a.webhookStatus === "PENDING_VERIFICATION",
  ).length;
  const official = accounts.filter((a) => a.accountType === "OFFICIAL").length;
  const employeePersonal = accounts.filter(
    (a) => a.accountType === "EMPLOYEE_PERSONAL",
  ).length;

  // Sync / Disconnect actions
  const handleSync = async (acc: SocialAccount) => {
    try {
      const res = await fetch(`/api/communications/social-accounts/${acc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastSync: new Date().toISOString() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      toast({
        title: "Sync requested",
        description: `${PLATFORM_META[acc.platform]?.label || acc.platform} · ${acc.accountName}`,
      });
      void fetchAll();
    } catch (e: any) {
      toast({
        title: "Sync failed",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (acc: SocialAccount) => {
    try {
      const res = await fetch(`/api/communications/social-accounts/${acc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionStatus: "DISCONNECTED",
          tokenStatus: "REVOKED",
          webhookStatus: "INACTIVE",
          requiresConfig: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Disconnect failed");
      toast({
        title: "Local access disabled",
        description: `Local permissions were cleared for ${acc.accountName}. Provider-side token revocation was not performed or verified.`,
      });
      void fetchAll();
    } catch (e: any) {
      toast({
        title: "Disconnect failed",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Social & Communication Accounts"
        subtitle="Manage official ALO social accounts & employee permissions"
        icon="Share2"
        action={
          <Button variant="cta" onClick={() => setConnectOpen(true)}>
            <Icon name="Plus" className="size-4" /> Connect New Account
          </Button>
        }
      />

      {/* Audit notice */}
      <Notification
        type="info"
        title="Audit & Compliance"
        message={
          <p>
            Every outgoing official communication is logged with{" "}
            <strong>employee</strong>, <strong>platform</strong>, <strong>account</strong>,
            <strong> student</strong>, <strong>message</strong>, <strong>timestamp</strong>,
            <strong> approval</strong>, and <strong>delivery status</strong>.
          </p>
        }
      />

      {loading ? (
        <LoadingGrid count={6} />
      ) : error ? (
        <ErrorState
          title="Could not load Social Accounts Hub"
          description={error}
          onRetry={() => void fetchAll()}
        />
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard label="Connected" value={connected} icon="Link" accent="emerald" />
            <KpiCard label="Active" value={connected} icon="CircleCheck" accent="blue" hint="live integrations" />
            <KpiCard label="Expired" value={expired} icon="CircleX" accent="rose" />
            <KpiCard label="Pending Webhook" value={pendingVerification} icon="Webhook" accent="amber" />
            <KpiCard label="Official" value={official} icon="BadgeCheck" accent="orange" />
            <KpiCard label="Employee Personal" value={employeePersonal} icon="User" accent="violet" />
          </div>

          {/* Social Accounts grid */}
          <SocialAccountsGrid
            accounts={accounts}
            onConfigure={(a) => setConfigureAccount(a)}
            onSync={handleSync}
            onDisconnect={handleDisconnect}
            onConnectClick={() => setConnectOpen(true)}
          />

          {/* Webhook Events log */}
          <WebhookEventsTable events={events} />

          {/* Connect New Account Dialog */}
          <ConnectAccountDialog
            open={connectOpen}
            onOpenChange={setConnectOpen}
            onCreated={(acc) => {
              toast({
                title: "Account created — Configuration Required",
                description: `${PLATFORM_META[acc.platform]?.label || acc.platform} account "${acc.accountName}" added. OAuth flow must be completed by admin.`,
                variant: "default",
              });
              void fetchAll();
            }}
          />

          {/* Configure Permissions Dialog */}
          <ConfigurePermissionsDialog
            account={configureAccount}
            onOpenChange={(o) => !o && setConfigureAccount(null)}
            onSaved={() => {
              toast({
                title: "Permissions updated",
                description: "Account configuration saved.",
              });
              void fetchAll();
            }}
          />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Social Accounts Grid
// ─────────────────────────────────────────────────────────────────────────────

function SocialAccountsGrid({
  accounts,
  onConfigure,
  onSync,
  onDisconnect,
  onConnectClick,
}: {
  accounts: SocialAccount[];
  onConfigure: (a: SocialAccount) => void;
  onSync: (a: SocialAccount) => void;
  onDisconnect: (a: SocialAccount) => void;
  onConnectClick: () => void;
}) {
  if (accounts.length === 0) {
    return (
      <SectionCard
        title="Social Accounts"
        description="Official & employee personal accounts across all supported platforms"
        icon="Share2"
        accent="blue"
      >
        <EmptyState
          icon="Share2"
          title="No social accounts connected"
          description="Connect official ALO accounts (Facebook, Instagram, WhatsApp, LinkedIn, Gmail, Outlook) and manage per-employee permissions."
          accent="blue"
          action={
            <Button variant="alo" onClick={onConnectClick}>
              <Icon name="Plus" className="size-3.5" /> Connect New Account
            </Button>
          }
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Social Accounts"
      description={`${accounts.length} accounts — official ALO channels and employee personal accounts`}
      icon="Share2"
      accent="blue"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((acc) => (
          <SocialAccountCard
            key={acc.id}
            account={acc}
            onConfigure={() => onConfigure(acc)}
            onSync={() => onSync(acc)}
            onDisconnect={() => onDisconnect(acc)}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function SocialAccountCard({
  account,
  onConfigure,
  onSync,
  onDisconnect,
}: {
  account: SocialAccount;
  onConfigure: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  const platform = PLATFORM_META[account.platform] || {
    label: account.platform,
    icon: "Globe",
    brand: "#64748B",
    bg: "bg-[var(--alo-page)]0",
    text: "text-white",
  };
  const perms = parsePermissions(account.permissions);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--alo-border)] bg-[var(--alo-surface)] shadow-[var(--alo-shadow-sm)] transition-all hover:shadow-[var(--alo-shadow-md)]">
      {/* Header (platform brand) */}
      <div className={cn("relative flex items-center gap-3 p-4", platform.bg)}>
        <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
          <Icon name={platform.icon} className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{platform.label}</p>
          <p className="truncate text-xs text-white/80">{account.organization}</p>
        </div>
        <StatusBadge
          status={account.accountType}
          colorMap={{ OFFICIAL: "emerald", EMPLOYEE_PERSONAL: "amber" }}
          labels={{ OFFICIAL: "Official", EMPLOYEE_PERSONAL: "Personal" }}
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="caption-text">Account name</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-[var(--alo-text)]" title={account.accountName}>
            {account.accountName}
          </p>
          {account.accountId && (
            <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--alo-muted)]">
              {account.accountId}
            </p>
          )}
        </div>

        {/* Owner */}
        {account.owner && (
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-[var(--alo-blue-soft)] text-[11px] font-bold text-[var(--alo-blue-strong)]">
              {account.owner.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[var(--alo-text)]">
                {account.owner.name}
              </p>
              <p className="text-[11px] text-[var(--alo-muted)]">{account.owner.role}</p>
            </div>
          </div>
        )}

        {/* Status grid */}
        <div className="grid grid-cols-1 gap-1.5 rounded-lg bg-[var(--alo-surface-muted)] p-2.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-[var(--alo-muted)]">Connection</span>
            <StatusBadge
              status={account.connectionStatus}
              colorMap={{
                CONNECTED: "emerald",
                DISCONNECTED: "slate",
                EXPIRED: "rose",
                PERMISSION_ERROR: "rose",
              }}
              labels={{
                CONNECTED: "Connected",
                DISCONNECTED: "Disconnected",
                EXPIRED: "Expired",
                PERMISSION_ERROR: "Permission Error",
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--alo-muted)]">Token</span>
            <StatusBadge
              status={account.tokenStatus}
              colorMap={{
                VALID: "emerald",
                EXPIRED: "rose",
                REVOKED: "slate",
                NONE: "slate",
              }}
              labels={{
                VALID: "Valid",
                EXPIRED: "Expired",
                REVOKED: "Revoked",
                NONE: "None",
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--alo-muted)]">Webhook</span>
            <StatusBadge
              status={account.webhookStatus}
              colorMap={{
                ACTIVE: "emerald",
                INACTIVE: "slate",
                PENDING_VERIFICATION: "amber",
              }}
              labels={{
                ACTIVE: "Active",
                INACTIVE: "Inactive",
                PENDING_VERIFICATION: "Pending",
              }}
            />
          </div>
          <div className="flex items-center justify-between border-t border-[var(--alo-border)] pt-1.5">
            <span className="text-[var(--alo-muted)]">Last sync</span>
            <span className="text-xs font-medium text-[var(--alo-text)]">
              {account.lastSync ? timeAgo(account.lastSync) : "never"}
            </span>
          </div>
        </div>

        {/* Permissions */}
        {perms.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="caption-text mr-1">Perms:</span>
            {perms.map((p) => (
              <Badge
                key={p}
                variant={p === "canSend" ? "blue" : p === "canManage" ? "orange" : "neutral"}
                className="text-[11px]"
              >
                {p.replace(/^can/, "").toLowerCase()}
              </Badge>
            ))}
          </div>
        )}

        {/* CONFIGURATION REQUIRED banner */}
        {account.requiresConfig && (
          <div className="flex items-start gap-2 rounded-md border border-[var(--alo-orange)] bg-[var(--alo-orange-soft)] p-2.5">
            <Icon name="AlertTriangle" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-orange-strong)]" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-orange-strong)]">
                Configuration Required
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--alo-orange-strong)] opacity-90">
                OAuth flow not yet connected. Contact admin to complete authorization.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex flex-wrap gap-1.5 border-t border-[var(--alo-border)] pt-3">
          <Button size="sm" variant="outline" onClick={onConfigure} className="h-7 px-2 ">
            <Icon name="Settings2" className="size-3" />
            Configure
          </Button>
          <Button
 size="sm"
 variant="ghost"
 onClick={onSync}
 className="h-7 px-2 text-[var(--alo-blue-strong)] hover:bg-[var(--alo-blue-soft)]"
 >
            <Icon name="RefreshCw" className="size-3" />
            Sync
          </Button>
          <Button
 size="sm"
 variant="ghost"
 onClick={onDisconnect}
 className="ml-auto h-7 px-2 text-[var(--alo-danger-strong)] hover:bg-[var(--alo-danger-soft)]"
 >
            <Icon name="Unplug" className="size-3" />
            Disconnect
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Webhook Events Table
// ─────────────────────────────────────────────────────────────────────────────

function WebhookEventsTable({ events }: { events: WebhookEvent[] }) {
  if (events.length === 0) {
    return (
      <SectionCard
        title="Webhook Events Log"
        description="Recent webhook payloads for security & integration monitoring"
        icon="Webhook"
        accent="violet"
      >
        <EmptyState
          icon="Webhook"
          title="No webhook events"
          description="Incoming webhook payloads (WhatsApp, Facebook, Twilio, SendGrid) will appear here once received."
          accent="violet"
        />
      </SectionCard>
    );
  }

  const columns: Column<WebhookEvent>[] = [
    {
      key: "provider",
      header: "Provider",
      cell: (r) => {
        const meta = PROVIDER_META[r.provider] || { accent: "slate" as AccentColor, label: r.provider };
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <span
              className={cn(
                "size-2 rounded-full",
                `bg-[var(--alo-${meta.accent === "emerald" ? "success" : meta.accent === "blue" ? "blue" : meta.accent === "rose" ? "danger" : meta.accent === "sky" ? "info" : meta.accent === "orange" ? "orange" : "muted"})]`,
              )}
            />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "eventId",
      header: "Event ID",
      cell: (r) =>
        r.eventId ? (
          <span className="font-mono text-[11px] text-[var(--alo-muted)]">{r.eventId}</span>
        ) : (
          <span className="text-[11px] text-[var(--alo-muted)]">—</span>
        ),
    },
    {
      key: "eventType",
      header: "Event Type",
      cell: (r) => (
        <Badge variant="neutral" className="font-mono text-[11px]">
          {r.eventType}
        </Badge>
      ),
    },
    {
      key: "verified",
      header: "Verified",
      cell: (r) =>
        r.verified ? (
          <Badge variant="success" className="gap-1 text-[11px]">
            <Icon name="ShieldCheck" className="size-3" /> Verified
          </Badge>
        ) : (
          <Badge variant="danger" className="gap-1 text-[11px]">
            <Icon name="ShieldAlert" className="size-3" /> Unverified
          </Badge>
        ),
    },
    {
      key: "processed",
      header: "Processed",
      cell: (r) =>
        r.processed ? (
          <Badge variant="success" className="gap-1 text-[11px]">
            <Icon name="CheckCircle2" className="size-3" /> Yes
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1 text-[11px]">
            <Icon name="Clock" className="size-3" /> Pending
          </Badge>
        ),
    },
    {
      key: "createdAt",
      header: "Timestamp",
      sortable: true,
      sortAccessor: (r) => new Date(r.createdAt).getTime(),
      cell: (r) => <span className="text-xs">{timeAgo(r.createdAt)}</span>,
    },
    {
      key: "errorMessage",
      header: "Error",
      cell: (r) =>
        r.errorMessage ? (
          <span
            className="line-clamp-1 max-w-[200px] text-xs text-[var(--alo-danger-strong)]"
            title={r.errorMessage}
          >
            {r.errorMessage}
          </span>
        ) : (
          <span className="text-xs text-[var(--alo-muted)]">—</span>
        ),
    },
  ];

  return (
    <SectionCard
      title="Webhook Events Log"
      description="Recent webhook payloads — verified, processed, errors for security monitoring"
      icon="Webhook"
      accent="violet"
    >
      <DataTable
        columns={columns}
        data={events}
        pageSize={10}
        emptyMessage="No webhook events"
      />
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Connect New Account Dialog
// ─────────────────────────────────────────────────────────────────────────────

function ConnectAccountDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (acc: SocialAccount) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    platform: "FACEBOOK",
    accountName: "",
    accountType: "OFFICIAL",
    ownerEmployeeId: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [createdAccount, setCreatedAccount] = React.useState<SocialAccount | null>(null);

  const reset = () => {
    setForm({ platform: "FACEBOOK", accountName: "", accountType: "OFFICIAL", ownerEmployeeId: "" });
    setCreatedAccount(null);
  };

  const handleSave = async () => {
    if (!form.accountName.trim()) {
      toast({
        title: "Account name required",
        description: "Give this account a recognizable name.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/communications/social-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.platform,
          accountName: form.accountName,
          accountType: form.accountType,
          ownerEmployeeId: form.ownerEmployeeId || undefined,
          requiresConfig: true, // ← ALWAYS — no fake integrations
          connectionStatus: "DISCONNECTED",
          tokenStatus: "NONE",
          webhookStatus: "INACTIVE",
          permissions: [],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create account");
      setCreatedAccount(json.socialAccount);
    } catch (e: any) {
      toast({
        title: "Could not create account",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const platform = PLATFORM_META[form.platform] || PLATFORM_META.FACEBOOK;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!saving) {
          if (!o) reset();
          onOpenChange(o);
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Share2" className="size-5 text-[var(--alo-blue)]" />
            Connect New Account
          </DialogTitle>
          <DialogDescription>
            Register an official ALO or employee personal account on a supported platform.
          </DialogDescription>
        </DialogHeader>

        {createdAccount ? (
          // Post-creation confirmation panel
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-[var(--alo-orange)] bg-[var(--alo-orange-soft)] p-4">
              <Icon name="AlertTriangle" className="mt-0.5 size-5 shrink-0 text-[var(--alo-orange-strong)]" />
              <div>
                <p className="text-sm font-bold text-[var(--alo-orange-strong)]">
                  CONFIGURATION REQUIRED
                </p>
                <p className="mt-1 text-xs text-[var(--alo-orange-strong)] opacity-90">
                  OAuth flow not yet connected. Contact admin to complete authorization
                  for {platform.label}.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="caption-text">Platform</p>
                  <p className="mt-0.5 font-medium text-[var(--alo-text)]">{platform.label}</p>
                </div>
                <div>
                  <p className="caption-text">Account name</p>
                  <p className="mt-0.5 font-medium text-[var(--alo-text)]">{createdAccount.accountName}</p>
                </div>
                <div>
                  <p className="caption-text">Type</p>
                  <p className="mt-0.5 font-medium text-[var(--alo-text)]">
                    {createdAccount.accountType === "OFFICIAL" ? "Official" : "Employee Personal"}
                  </p>
                </div>
                <div>
                  <p className="caption-text">Connection</p>
                  <p className="mt-0.5 font-medium text-[var(--alo-muted)]">Disconnected (pending OAuth)</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--alo-muted)]">
              The account has been registered. Until the OAuth flow is completed by an
              administrator, this account cannot send or receive messages and will display the
              <span className="font-semibold text-[var(--alo-orange-strong)]"> CONFIGURATION REQUIRED </span>
              banner.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Platform selector */}
            <div className="space-y-2">
              <Label className="text-xs">Platform *</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => setForm({ ...form, platform: v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((p) => {
                    const meta = PLATFORM_META[p];
                    return (
                      <SelectItem key={p} value={p}>
                        <span className="flex items-center gap-2">
                          <span style={{ color: meta.brand }} className="flex size-3.5 items-center justify-center">
                            <Icon name={meta.icon} className="size-3.5" />
                          </span>
                          {meta.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Account name */}
            <div className="space-y-2">
              <Label className="text-xs">Account name *</Label>
              <Input
                placeholder="e.g. ALO Education — Official Facebook Page"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                className="h-10"
              />
            </div>

            {/* Account type */}
            <div className="space-y-2">
              <Label className="text-xs">Account type</Label>
              <Select
                value={form.accountType}
                onValueChange={(v) => setForm({ ...form, accountType: v })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFICIAL">Official ALO Account</SelectItem>
                  <SelectItem value="EMPLOYEE_PERSONAL">Employee Personal Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Owner employee ID */}
            <div className="space-y-2">
              <Label className="text-xs">
                Owner employee ID
                <span className="ml-1 text-[var(--alo-muted)]">(optional)</span>
              </Label>
              <Input
                placeholder="cuid… (required for EMPLOYEE_PERSONAL)"
                value={form.ownerEmployeeId}
                onChange={(e) => setForm({ ...form, ownerEmployeeId: e.target.value })}
                className="h-10 font-mono text-xs"
              />
            </div>

            <div className="rounded-lg bg-[var(--alo-info-soft)] p-2.5 text-[11px] text-[var(--alo-info-strong)]">
              <Icon name="Info" className="mr-1 inline size-3" />
              After creation the account will be in <strong>DISCONNECTED</strong> state with{" "}
              <strong>requiresConfig=true</strong>. The OAuth flow must be completed by an
              administrator before the account can be used.
            </div>
          </div>
        )}

        <DialogFooter>
          {createdAccount ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Close
              </Button>
              <Button
                variant="alo"
                onClick={() => {
                  const acc = createdAccount;
                  reset();
                  onOpenChange(false);
                  onCreated(acc);
                }}
              >
                <Icon name="Check" className="size-3.5" />
                Done
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (!saving) {
                    reset();
                    onOpenChange(false);
                  }
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button variant="alo" onClick={handleSave} disabled={saving}>
                <Icon name="Plus" className="size-3.5" />
                {saving ? "Creating…" : "Register Account"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Configure Permissions Dialog
// ─────────────────────────────────────────────────────────────────────────────

function ConfigurePermissionsDialog({
  account,
  onOpenChange,
  onSaved,
}: {
  account: SocialAccount | null;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [perms, setPerms] = React.useState<{ canSend: boolean; canManage: boolean; canView: boolean }>({
    canSend: false,
    canManage: false,
    canView: true,
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (account) {
      const list = parsePermissions(account.permissions);
      setPerms({
        canSend: list.includes("canSend"),
        canManage: list.includes("canManage"),
        canView: list.includes("canView"),
      });
    }
  }, [account]);

  if (!account) return null;

  const platform = PLATFORM_META[account.platform] || {
    label: account.platform,
    icon: "Globe",
    brand: "#64748B",
    bg: "bg-[var(--alo-page)]0",
    text: "text-white",
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const permList = Object.entries(perms)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const res = await fetch(`/api/communications/social-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permList }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update permissions");
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast({
        title: "Could not save permissions",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!account} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("flex size-7 items-center justify-center rounded-md", platform.bg)}>
              <Icon name={platform.icon} className="size-4 text-white" />
            </div>
            Configure Account
          </DialogTitle>
          <DialogDescription>
            Manage permissions for <strong>{account.accountName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="caption-text">Platform</p>
                <p className="mt-0.5 font-medium text-[var(--alo-text)]">{platform.label}</p>
              </div>
              <div>
                <p className="caption-text">Type</p>
                <p className="mt-0.5 font-medium text-[var(--alo-text)]">
                  {account.accountType === "OFFICIAL" ? "Official" : "Employee Personal"}
                </p>
              </div>
              <div>
                <p className="caption-text">Connection</p>
                <p className="mt-0.5 font-medium text-[var(--alo-text)]">
                  {account.connectionStatus}
                </p>
              </div>
              <div>
                <p className="caption-text">Token</p>
                <p className="mt-0.5 font-medium text-[var(--alo-text)]">{account.tokenStatus}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Permissions</Label>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface)] p-3 hover:bg-[var(--alo-surface-muted)]">
                <Checkbox
                  checked={perms.canView}
                  onCheckedChange={(v) => setPerms({ ...perms, canView: v === true })}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--alo-text)]">Can View</p>
                  <p className="text-[11px] text-[var(--alo-muted)]">
                    Read-only access — see inbox, analytics, and historical messages.
                  </p>
                </div>
                <Badge variant="neutral" className="text-[11px]">read</Badge>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface)] p-3 hover:bg-[var(--alo-surface-muted)]">
                <Checkbox
                  checked={perms.canSend}
                  onCheckedChange={(v) => setPerms({ ...perms, canSend: v === true })}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--alo-text)]">Can Send</p>
                  <p className="text-[11px] text-[var(--alo-muted)]">
                    Send messages on behalf of the account (subject to draft approval workflow).
                  </p>
                </div>
                <Badge variant="blue" className="text-[11px]">send</Badge>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface)] p-3 hover:bg-[var(--alo-surface-muted)]">
                <Checkbox
                  checked={perms.canManage}
                  onCheckedChange={(v) => setPerms({ ...perms, canManage: v === true })}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--alo-text)]">Can Manage</p>
                  <p className="text-[11px] text-[var(--alo-muted)]">
                    Manage settings, webhooks, and other employees' permissions.
                  </p>
                </div>
                <Badge variant="orange" className="text-[11px]">manage</Badge>
              </label>
            </div>
          </div>

          {account.requiresConfig && (
            <div className="flex items-start gap-2 rounded-md border border-[var(--alo-orange)] bg-[var(--alo-orange-soft)] p-3">
              <Icon name="AlertTriangle" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-orange-strong)]" />
              <p className="text-[11px] text-[var(--alo-orange-strong)]">
                OAuth flow is not yet connected. Permission changes will take effect once
                the account is fully authorized by an administrator.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="alo" onClick={handleSave} disabled={saving}>
            <Icon name="Save" className="size-3.5" />
            {saving ? "Saving…" : "Save Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default SocialDashboard;
