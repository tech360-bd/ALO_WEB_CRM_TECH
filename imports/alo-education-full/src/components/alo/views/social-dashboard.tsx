"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  SectionCard,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";
import {
  DataTable,
  type DataTableColumn,
  Notification,
  Pill,
  fetchJson,
  platformMeta,
  fmtDateTime,
  timeAgoShort,
} from "@/components/alo/comm-helpers";

// ─── Types ────────────────────────────────────────────────────────────────

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountId?: string | null;
  accountType?: string | null;
  ownerEmployeeId?: string | null;
  organization?: string | null;
  connectionStatus: string;
  permissions?: string | null;
  tokenStatus?: string | null;
  webhookStatus?: string | null;
  requiresConfig?: boolean | null;
  lastSync?: string | null;
  createdAt?: string;
}

interface WebhookEvent {
  id: string;
  provider: string;
  eventType?: string | null;
  payload?: string | null;
  processed: boolean;
  error?: string | null;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────

const CONNECTION_COLORS: Record<string, string> = {
  CONNECTED: "bg-emerald-100 text-emerald-700",
  DISCONNECTED: "bg-slate-100 text-slate-700",
  EXPIRED: "bg-amber-100 text-amber-700",
  PERMISSION_ERROR: "bg-rose-100 text-rose-700",
  RECONNECT_REQUIRED: "bg-orange-100 text-orange-700",
};

const TOKEN_COLORS: Record<string, string> = {
  VALID: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-amber-100 text-amber-700",
  REVOKED: "bg-rose-100 text-rose-700",
  NONE: "bg-slate-100 text-slate-600",
};

const WEBHOOK_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700",
  FAILED: "bg-rose-100 text-rose-700",
};

// ─── Main Component ────────────────────────────────────────────────────────

export function SocialDashboard() {
  const { toast } = useToast();
  const [accounts, setAccounts] = React.useState<SocialAccount[]>([]);
  const [webhookEvents, setWebhookEvents] = React.useState<WebhookEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [accRes, eventRes] = await Promise.all([
        fetchJson<{ socialAccounts: SocialAccount[] }>("/api/communications/social-accounts"),
        fetchJson<{ events: WebhookEvent[] }>("/api/communications/webhooks/events"),
      ]);
      setAccounts(accRes.socialAccounts || []);
      setWebhookEvents(eventRes.events || []);
    } catch (err) {
      console.error("[social-dashboard]", err);
      setError(true);
      toast({
        title: "Failed to load social accounts",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const connected = accounts.filter((a) => a.connectionStatus === "CONNECTED").length;
  const active = accounts.filter((a) => a.connectionStatus === "CONNECTED" && !a.requiresConfig).length;
  const expired = accounts.filter((a) => a.connectionStatus === "EXPIRED" || a.tokenStatus === "EXPIRED").length;
  const pendingWebhook = accounts.filter(
    (a) => a.webhookStatus === "PENDING_VERIFICATION" || a.webhookStatus === "INACTIVE"
  ).length;
  const official = accounts.filter((a) => (a.accountType || "OFFICIAL") === "OFFICIAL").length;
  const employee = accounts.filter((a) => a.accountType === "EMPLOYEE_PERSONAL").length;

  const handleAccountAction = async (
    acc: SocialAccount,
    action: "configure" | "sync" | "disconnect"
  ) => {
    if (action === "configure") {
      toast({
        title: "Configuration required",
        description: `Open the platform setup wizard for ${acc.platform} (${acc.accountName}).`,
      });
      return;
    }
    try {
      const body =
        action === "sync"
          ? {
              connectionStatus: "CONNECTED",
              tokenStatus: "VALID",
              webhookStatus: "ACTIVE",
              requiresConfig: false,
              lastSync: new Date().toISOString(),
            }
          : {
              connectionStatus: "DISCONNECTED",
              tokenStatus: "NONE",
              webhookStatus: "INACTIVE",
              requiresConfig: true,
            };
      await fetchJson(`/api/communications/social-accounts/${acc.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast({
        title: action === "sync" ? "Sync complete" : "Disconnected",
        description: `${acc.platform} account ${action === "sync" ? "synced" : "disconnected"}.`,
      });
      void fetchAll();
    } catch (err) {
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Social & Communication Accounts" subtitle="Connect and manage all official and employee social accounts with consent." icon="Share2" />
        <LoadingGrid count={6} />
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Social & Communication Accounts" subtitle="Connect and manage all official and employee social accounts with consent." icon="Share2" />
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-[#991B1B]">Failed to load accounts</p>
          <Button onClick={() => void fetchAll()} className="mt-3" size="sm">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social & Communication Accounts"
        subtitle="Connect and manage all official and employee social accounts with consent."
        icon="Share2"
        action={
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-10 bg-[#0057B8] text-white hover:bg-[#003a7a]"
          >
            <Icon name="Plus" className="mr-2 size-4" />
            Connect New Account
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Connected Accounts" value={connected} icon="Link" accent="blue" />
        <KpiCard label="Active" value={active} icon="CheckCircle2" accent="emerald" />
        <KpiCard label="Expired" value={expired} icon="AlertTriangle" accent="amber" />
        <KpiCard label="Pending Webhook" value={pendingWebhook} icon="Webhook" accent="orange" />
        <KpiCard label="Official Accounts" value={official} icon="Building" accent="violet" />
        <KpiCard label="Employee Personal" value={employee} icon="UserCog" accent="rose" />
      </div>

      {/* Social accounts grid */}
      <SectionCard
        title="Connected Social Accounts"
        description={`${accounts.length} account(s) registered`}
        icon="Share2"
      >
        {accounts.length === 0 ? (
          <EmptyState
            icon="Share2"
            title="No accounts connected"
            description="Connect your first social or communication account to start receiving messages."
            action={
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-[#0057B8] text-white hover:bg-[#003a7a]"
              >
                <Icon name="Plus" className="mr-1.5 size-4" />
                Connect Account
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                onAction={(action) => void handleAccountAction(acc, action)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Webhook events log */}
      <SectionCard
        title="Webhook Events Log"
        description={`${webhookEvents.length} recent webhook event(s)`}
        icon="Webhook"
      >
        <WebhookEventsTable events={webhookEvents} />
      </SectionCard>

      <CreateAccountDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void fetchAll()}
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  accent: "blue" | "orange" | "emerald" | "amber" | "violet" | "rose";
}) {
  const accentMap: Record<string, string> = {
    blue: "bg-[#EFF6FF] text-[#0057B8]",
    orange: "bg-[#FFF7ED] text-[#C2410C]",
    emerald: "bg-[#DCFCE7] text-[#15803D]",
    amber: "bg-[#FEF3C7] text-[#92400E]",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-[#FEE2E2] text-[#991B1B]",
  };
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 alo-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">{label}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[#0F172A] sm:text-xl">{value}</p>
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", accentMap[accent])}>
          <Icon name={icon} className="size-4" />
        </span>
      </div>
    </div>
  );
}

function AccountCard({
  account,
  onAction,
}: {
  account: SocialAccount;
  onAction: (action: "configure" | "sync" | "disconnect") => void;
}) {
  const meta = platformMeta(account.platform);
  const needsConfig = account.requiresConfig || account.connectionStatus !== "CONNECTED";
  return (
    <div className="flex flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${meta.brandColor}15`, color: meta.brandColor }}
          >
            <Icon name={meta.icon} className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0F172A]">{account.accountName}</p>
            <p className="text-[11px] text-[#64748B]">{meta.label}</p>
          </div>
        </div>
        <Pill
          className={cn(
            "uppercase",
            account.accountType === "EMPLOYEE_PERSONAL"
              ? "bg-amber-100 text-amber-700"
              : "bg-[#EFF6FF] text-[#0057B8]"
          )}
        >
          {account.accountType || "OFFICIAL"}
        </Pill>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        <div>
          <p className="font-bold uppercase tracking-wider text-[#94A3B8]">Connection</p>
          <Pill className={cn("mt-0.5", CONNECTION_COLORS[account.connectionStatus] || "bg-slate-100")}>
            {account.connectionStatus}
          </Pill>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-[#94A3B8]">Token</p>
          <Pill className={cn("mt-0.5", TOKEN_COLORS[account.tokenStatus || "NONE"] || "bg-slate-100")}>
            {account.tokenStatus || "NONE"}
          </Pill>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-[#94A3B8]">Webhook</p>
          <Pill className={cn("mt-0.5", WEBHOOK_COLORS[account.webhookStatus || "INACTIVE"] || "bg-slate-100")}>
            {account.webhookStatus || "INACTIVE"}
          </Pill>
        </div>
      </div>

      {needsConfig && (
        <div className="mt-3">
          <Notification
            type="warning"
            title="Configuration Required"
            description="This account is not yet fully configured. Run the setup wizard to enable message sync."
            icon="Settings2"
          />
        </div>
      )}

      {account.lastSync && (
        <p className="mt-3 text-[10px] text-[#94A3B8]">
          Last sync: {timeAgoShort(account.lastSync)}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 flex-1 border-[#E2E8F0] text-[11px]"
          onClick={() => onAction("configure")}
        >
          <Icon name="Settings2" className="mr-1.5 size-3.5" />
          Configure
        </Button>
        <Button
          size="sm"
          className="h-8 flex-1 bg-[#0057B8] text-[11px] hover:bg-[#003a7a]"
          onClick={() => onAction("sync")}
          disabled={needsConfig}
        >
          <Icon name="RefreshCw" className="mr-1.5 size-3.5" />
          Sync
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-rose-200 px-2 text-[11px] text-rose-600 hover:bg-rose-50"
          onClick={() => onAction("disconnect")}
        >
          <Icon name="PowerOff" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function WebhookEventsTable({ events }: { events: WebhookEvent[] }) {
  const columns: DataTableColumn<WebhookEvent>[] = [
    {
      key: "createdAt",
      header: "Time",
      render: (e) => <span className="text-xs">{fmtDateTime(e.createdAt)}</span>,
    },
    {
      key: "provider",
      header: "Provider",
      render: (e) => <span className="text-xs font-semibold">{e.provider}</span>,
    },
    {
      key: "eventType",
      header: "Event",
      render: (e) => (
        <span className="text-xs text-[#475569]">{e.eventType || "—"}</span>
      ),
    },
    {
      key: "processed",
      header: "Processed",
      render: (e) =>
        e.processed ? (
          <Pill className="bg-emerald-100 text-emerald-700">Yes</Pill>
        ) : (
          <Pill className="bg-rose-100 text-rose-700">No</Pill>
        ),
    },
    {
      key: "error",
      header: "Error",
      render: (e) => (
        <span className="line-clamp-1 text-xs text-[#64748B]">{e.error || "—"}</span>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={events}
      rowKey={(e) => e.id}
      emptyTitle="No webhook events"
      emptyDescription="Inbound webhook events from connected platforms will appear here."
      emptyIcon="Webhook"
      maxHeight="420px"
    />
  );
}

function CreateAccountDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [platform, setPlatform] = React.useState("WHATSAPP");
  const [accountName, setAccountName] = React.useState("");
  const [accountType, setAccountType] = React.useState("OFFICIAL");
  const [ownerEmployeeId, setOwnerEmployeeId] = React.useState("");
  const [organization, setOrganization] = React.useState("ALO Education");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!platform || !accountName.trim()) {
      toast({ title: "Platform and account name are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetchJson("/api/communications/social-accounts", {
        method: "POST",
        body: JSON.stringify({
          platform,
          accountName: accountName.trim(),
          accountType,
          ownerEmployeeId: ownerEmployeeId.trim() || undefined,
          organization: organization.trim() || undefined,
          connectionStatus: "DISCONNECTED",
          tokenStatus: "NONE",
          webhookStatus: "INACTIVE",
          requiresConfig: true,
        }),
      });
      toast({
        title: "Account registered",
        description: `${platform} account added. Configure credentials to enable sync.`,
      });
      setAccountName("");
      setOwnerEmployeeId("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast({
        title: "Failed to register account",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect New Account</DialogTitle>
          <DialogDescription>
            Register a social or communication account. You will need to configure credentials before it can sync.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[
                  "WHATSAPP",
                  "FACEBOOK",
                  "INSTAGRAM",
                  "GMAIL",
                  "OUTLOOK",
                  "SMS_GATEWAY",
                  "CALL_CENTER",
                  "TELEGRAM",
                  "LINKEDIN",
                  "TWITTER",
                ].map((p) => (
                  <SelectItem key={p} value={p}>
                    {platformMeta(p).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="acc-name">Account Name</Label>
            <Input
              id="acc-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. ALO Official WhatsApp"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFICIAL">Official</SelectItem>
                  <SelectItem value="EMPLOYEE_PERSONAL">Employee Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="acc-org">Organization</Label>
              <Input
                id="acc-org"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          {accountType === "EMPLOYEE_PERSONAL" && (
            <div>
              <Label htmlFor="acc-owner">Owner Employee ID</Label>
              <Input
                id="acc-owner"
                value={ownerEmployeeId}
                onChange={(e) => setOwnerEmployeeId(e.target.value)}
                placeholder="cuid"
                className="mt-1 font-mono"
              />
              <p className="mt-1 text-[11px] text-amber-700">
                Employee personal accounts require explicit written consent before being linked to the CRM.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-[#0057B8] text-white hover:bg-[#003a7a]"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Registering…" : "Register Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
