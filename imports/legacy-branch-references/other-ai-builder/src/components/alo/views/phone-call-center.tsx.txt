"use client";

/**
 * Phone Call Center — Unified Communication surface.
 *
 * Capabilities:
 *  • KPI dashboard (calls, answered, missed, avg duration, unknown callers pending)
 *  • Tabs: Active Calls / Call History / Unknown Callers / Call Outcomes
 *  • Initiate Call dialog (student search → application → outbound call log)
 *  • Unknown-contact triage (CREATE_LEAD / LINK_EXISTING / CREATE_PARTNER_CONTACT / MARK_SPAM)
 *  • Call Outcome logging with consent, follow-up, student-visible & internal notes
 *  • Simulated Incoming Call banner (only when ?incomingCall=phone is present)
 *
 * APIs:
 *  GET  /api/omnichannel/dashboard
 *  GET  /api/communications/calls/unknown
 *  GET  /api/communications/calls/outcomes
 *  POST /api/communications/calls/outcomes
 *  POST /api/communications/calls/unknown
 *  GET  /api/students
 *  GET  /api/applications
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  DatePicker,
  type Column,
  type AccentColor,
} from "@/components/alo/ui";
import { timeAgo, fmtDate } from "@/lib/alo-types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PhoneCall {
  id: string;
  callType: string; // INCOMING | OUTGOING | MISSED
  fromNumber: string;
  toNumber: string;
  duration: number;
  recordingPath?: string | null;
  callNotes?: string | null;
  disposition?: string | null;
  studentId?: string | null;
  leadId?: string | null;
  partnerId?: string | null;
  employeeId?: string | null;
  createdAt: string;
}

interface UnknownContact {
  id: string;
  phone: string;
  email?: string | null;
  name?: string | null;
  source: string;
  callLogId?: string | null;
  matchedToStudent: boolean;
  matchedStudentId?: string | null;
  matchedLeadId?: string | null;
  matchedPartnerId?: string | null;
  action?: string | null;
  actionById?: string | null;
  actionAt?: string | null;
  createdAt: string;
}

interface CallOutcome {
  id: string;
  callLogId?: string | null;
  outcome: string;
  summary?: string | null;
  studentVisibleNote?: string | null;
  internalNote?: string | null;
  nextAction?: string | null;
  followUpAt?: string | null;
  consentRecorded: boolean;
  recordingPath?: string | null;
  counselorId?: string | null;
  studentId?: string | null;
  applicationId?: string | null;
  duration: number;
  createdAt: string;
}

interface StudentLite {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  altMobile?: string | null;
}

interface ApplicationLite {
  id: string;
  applicationId: string;
  studentId: string;
  university: string;
  course: string;
  stage: string;
}

interface DashboardData {
  stats: {
    totalPhoneCalls: number;
    missedCalls: number;
    totalEmails: number;
    totalSms: number;
  };
  phoneCalls: PhoneCall[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const CALL_TYPE_META: Record<string, { accent: AccentColor; icon: string }> = {
  INCOMING: { accent: "blue", icon: "PhoneIncoming" },
  OUTGOING: { accent: "emerald", icon: "PhoneOutgoing" },
  MISSED: { accent: "rose", icon: "PhoneMissed" },
};

const OUTCOME_META: Record<string, { accent: AccentColor; icon: string }> = {
  ANSWERED: { accent: "emerald", icon: "PhoneCall" },
  NO_ANSWER: { accent: "amber", icon: "PhoneOff" },
  BUSY: { accent: "amber", icon: "PhoneOff" },
  CALLBACK_REQUESTED: { accent: "sky", icon: "PhoneForwarded" },
  WRONG_NUMBER: { accent: "rose", icon: "X" },
  RESOLVED: { accent: "emerald", icon: "CheckCircle2" },
  ESCALATED: { accent: "rose", icon: "AlertTriangle" },
};

const UNKNOWN_ACTION_META: Record<string, { accent: AccentColor; icon: string; label: string }> = {
  CREATE_LEAD: { accent: "blue", icon: "UserPlus", label: "Create Lead" },
  LINK_EXISTING: { accent: "emerald", icon: "Link2", label: "Link Existing" },
  CREATE_PARTNER_CONTACT: { accent: "violet", icon: "Handshake", label: "Create Partner Contact" },
  MARK_SPAM: { accent: "rose", icon: "Ban", label: "Mark Spam" },
};

const SOURCE_META: Record<string, { accent: AccentColor; label: string }> = {
  PHONE_CALL: { accent: "blue", label: "Phone Call" },
  WHATSAPP: { accent: "emerald", label: "WhatsApp" },
  WEBSITE_CHAT: { accent: "sky", label: "Website Chat" },
};

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDateTime(d: string): string {
  try {
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function PhoneCallCenter() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState("active-calls");
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null);
  const [unknownContacts, setUnknownContacts] = React.useState<UnknownContact[]>([]);
  const [callOutcomes, setCallOutcomes] = React.useState<CallOutcome[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Initiate Call dialog
  const [initiateOpen, setInitiateOpen] = React.useState(false);

  // Call detail drawer
  const [selectedCall, setSelectedCall] = React.useState<PhoneCall | null>(null);

  // Log call outcome dialog
  const [logOutcomeOpen, setLogOutcomeOpen] = React.useState(false);

  // Incoming Call banner (simulated) — only show if ?incomingCall=phone is present
  const [showIncomingBanner, setShowIncomingBanner] = React.useState(false);
  const [incomingPhone, setIncomingPhone] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const inc = url.searchParams.get("incomingCall");
    if (inc) {
      setIncomingPhone(inc);
      setShowIncomingBanner(true);
    }
  }, []);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, unkRes, outRes] = await Promise.all([
        fetch("/api/omnichannel/dashboard"),
        fetch("/api/communications/calls/unknown"),
        fetch("/api/communications/calls/outcomes"),
      ]);
      if (!dashRes.ok) throw new Error("Failed to fetch dashboard");
      const dashJson = await dashRes.json();
      const unkJson = unkRes.ok ? await unkRes.json() : { contacts: [] };
      const outJson = outRes.ok ? await outRes.json() : { outcomes: [] };
      setDashboard(dashJson);
      setUnknownContacts(unkJson.contacts || []);
      setCallOutcomes(outJson.outcomes || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load phone call center");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // ── Derived KPIs ──
  const totalCalls = dashboard?.stats.totalPhoneCalls ?? 0;
  const missedCalls = dashboard?.stats.missedCalls ?? 0;
  const answered = totalCalls - missedCalls;
  const avgDuration = React.useMemo(() => {
    const calls = dashboard?.phoneCalls ?? [];
    if (calls.length === 0) return 0;
    return Math.round(calls.reduce((s, c) => s + (c.duration || 0), 0) / calls.length);
  }, [dashboard?.phoneCalls]);
  const unknownPending = unknownContacts.filter((c) => !c.matchedToStudent && !c.action).length;

  // ── Resolve unknown contact action ──
  const handleUnknownAction = async (contact: UnknownContact, action: string) => {
    const meta = UNKNOWN_ACTION_META[action];
    if (!meta) return;
    try {
      const res = await fetch("/api/communications/calls/unknown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contact.id,
          action,
          actionById: "counselor-demo",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      toast({
        title: `${meta.label} — done`,
        description: `${contact.phone} → ${action.replace(/_/g, " ").toLowerCase()}`,
      });
      void fetchAll();
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.message || "Could not resolve contact",
        variant: "destructive",
      });
    }
  };

  // ── Incoming-call banner actions ──
  const dismissIncoming = () => setShowIncomingBanner(false);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Phone Call Center"
        subtitle="Initiate calls, match callers, record outcomes"
        icon="PhoneCall"
        action={
          <Button variant="cta" onClick={() => setInitiateOpen(true)}>
            <Icon name="Phone" className="size-4" /> Initiate Call
          </Button>
        }
      />

      {/* Incoming-call simulated banner */}
      {showIncomingBanner && (
        <Notification
          type="warning"
          title={`Incoming call from ${incomingPhone}`}
          message={
            <div className="space-y-1">
              <p>
                A live incoming call is ringing. Caller ID is{" "}
                <span className="font-mono font-semibold">{incomingPhone}</span>.
              </p>
              <p className="text-xs opacity-80">
                If matched to a student, their name & student ID will appear here.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="default">
                  <Icon name="UserCircle" className="size-3.5" /> Open Contact
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Trigger the unknown-contact flow by creating a ContactMatchReview
                    // (here we just simulate by opening the create-lead dialog path)
                    toast({
                      title: "Create Lead",
                      description: `Lead capture for ${incomingPhone} — redirecting to CRM Lead form.`,
                    });
                  }}
                >
                  <Icon name="UserPlus" className="size-3.5" /> Create Lead
                </Button>
              </div>
            </div>
          }
          onDismiss={dismissIncoming}
        />
      )}

      {/* KPI row */}
      {loading ? (
        <LoadingGrid count={5} />
      ) : error ? (
        <ErrorState
          title="Could not load Phone Call Center"
          description={error}
          onRetry={() => void fetchAll()}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              label="Total Calls"
              value={totalCalls}
              icon="PhoneCall"
              accent="blue"
              hint="all channels"
            />
            <KpiCard
              label="Answered"
              value={answered}
              icon="PhoneCall"
              accent="emerald"
              hint={`${totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 0}% pick-up`}
            />
            <KpiCard
              label="Missed"
              value={missedCalls}
              icon="PhoneMissed"
              accent="rose"
            />
            <KpiCard
              label="Avg Duration"
              value={formatDuration(avgDuration)}
              icon="Timer"
              accent="amber"
            />
            <KpiCard
              label="Unknown Callers"
              value={unknownPending}
              icon="UserX"
              accent="violet"
              hint="pending triage"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            <div className="overflow-x-auto rounded-xl border border-[var(--alo-border)] bg-[var(--alo-surface)] p-1.5">
              <TabsList className="h-auto w-max gap-1 bg-transparent">
                <TabsTrigger value="active-calls" className="data-[state=active]:bg-[var(--alo-blue-soft)] data-[state=active]:text-[var(--alo-blue-strong)]">
                  <Icon name="Radio" className="mr-1.5 size-3.5" /> Active Calls
                </TabsTrigger>
                <TabsTrigger value="call-history" className="data-[state=active]:bg-[var(--alo-blue-soft)] data-[state=active]:text-[var(--alo-blue-strong)]">
                  <Icon name="History" className="mr-1.5 size-3.5" /> Call History
                </TabsTrigger>
                <TabsTrigger value="unknown-callers" className="data-[state=active]:bg-[var(--alo-blue-soft)] data-[state=active]:text-[var(--alo-blue-strong)]">
                  <Icon name="UserX" className="mr-1.5 size-3.5" /> Unknown Callers
                  {unknownPending > 0 && (
                    <Badge variant="warning" className="ml-1.5 px-1.5 py-0 text-[10px]">
                      {unknownPending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="call-outcomes" className="data-[state=active]:bg-[var(--alo-blue-soft)] data-[state=active]:text-[var(--alo-blue-strong)]">
                  <Icon name="ClipboardCheck" className="mr-1.5 size-3.5" /> Call Outcomes
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Active Calls — UI demo of the live-call surface */}
            <TabsContent value="active-calls" className="space-y-4">
              <SectionCard
                title="Active Calls"
                description="Live in-progress calls — simulated surface for the operator"
                icon="Radio"
                accent="blue"
              >
                <EmptyState
                  icon="PhoneCall"
                  title="No active calls right now"
                  description="When a call connects, the live operator console appears here with real-time controls (mute, hold, transfer, take notes)."
                  accent="blue"
                  action={
                    <Button variant="alo" size="sm" onClick={() => setInitiateOpen(true)}>
                      <Icon name="Phone" className="size-3.5" /> Initiate Call
                    </Button>
                  }
                />
              </SectionCard>
            </TabsContent>

            {/* Call History */}
            <TabsContent value="call-history" className="space-y-4">
              <CallHistoryTable
                calls={dashboard?.phoneCalls ?? []}
                onRowClick={(c) => setSelectedCall(c)}
              />
            </TabsContent>

            {/* Unknown Callers */}
            <TabsContent value="unknown-callers" className="space-y-4">
              <UnknownCallersTable
                contacts={unknownContacts}
                onAction={handleUnknownAction}
              />
            </TabsContent>

            {/* Call Outcomes */}
            <TabsContent value="call-outcomes" className="space-y-4">
              <CallOutcomesTable
                outcomes={callOutcomes}
                onLogOutcome={() => setLogOutcomeOpen(true)}
                onCreated={() => void fetchAll()}
              />
            </TabsContent>
          </Tabs>

          {/* Initiate Call Dialog */}
          <InitiateCallDialog
            open={initiateOpen}
            onOpenChange={setInitiateOpen}
            onInitiated={() => {
              toast({
                title: "Call initiated",
                description: "Outgoing call logged. Outcome recorded as CALLBACK_REQUESTED.",
              });
              void fetchAll();
            }}
          />

          {/* Log Call Outcome Dialog */}
          <LogCallOutcomeDialog
            open={logOutcomeOpen}
            onOpenChange={setLogOutcomeOpen}
            onSaved={() => {
              toast({
                title: "Call outcome logged",
                description: "The outcome has been recorded against the student.",
              });
              void fetchAll();
            }}
          />

          {/* Call Detail Sheet */}
          <CallDetailSheet
            call={selectedCall}
            onOpenChange={(o) => !o && setSelectedCall(null)}
          />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Call History Table
// ─────────────────────────────────────────────────────────────────────────────

function CallHistoryTable({
  calls,
  onRowClick,
}: {
  calls: PhoneCall[];
  onRowClick: (call: PhoneCall) => void;
}) {
  if (calls.length === 0) {
    return (
      <SectionCard title="Call History" icon="History" accent="blue">
        <EmptyState
          icon="PhoneCall"
          title="No call logs yet"
          description="Inbound and outbound calls will appear here once the telephony integration syncs logs."
        />
      </SectionCard>
    );
  }

  const columns: Column<PhoneCall>[] = [
    {
      key: "createdAt",
      header: "Time",
      sortable: true,
      sortAccessor: (r) => new Date(r.createdAt).getTime(),
      cell: (r) => <span className="text-xs">{formatDateTime(r.createdAt)}</span>,
    },
    {
      key: "callType",
      header: "Type",
      cell: (r) => {
        const meta = CALL_TYPE_META[r.callType] || CALL_TYPE_META.INCOMING;
        return (
          <StatusBadge
            status={r.callType}
            colorMap={{
              INCOMING: "blue",
              OUTGOING: "emerald",
              MISSED: "rose",
            }}
            labels={{
              INCOMING: "Incoming",
              OUTGOING: "Outgoing",
              MISSED: "Missed",
            }}
          />
        );
      },
    },
    {
      key: "from",
      header: "From / To",
      cell: (r) => (
        <div className="text-xs leading-tight">
          <div className="font-medium">
            <Icon name="ArrowDownLeft" className="mr-1 inline size-3 text-[var(--alo-muted)]" />
            {r.fromNumber || "—"}
          </div>
          <div className="text-[var(--alo-muted)]">
            <Icon name="ArrowUpRight" className="mr-1 inline size-3" />
            {r.toNumber || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      sortable: true,
      sortAccessor: (r) => r.duration,
      cell: (r) => (
        <span className="font-mono text-xs">{formatDuration(r.duration)}</span>
      ),
    },
    {
      key: "studentId",
      header: "Student",
      cell: (r) =>
        r.studentId ? (
          <Badge variant="blue" className="font-mono text-[10px]">
            {r.studentId.slice(-6)}
          </Badge>
        ) : (
          <span className="text-xs text-[var(--alo-muted)]">—</span>
        ),
    },
    {
      key: "disposition",
      header: "Outcome",
      cell: (r) =>
        r.disposition ? (
          <Badge variant="neutral" className="text-[10px]">
            {r.disposition}
          </Badge>
        ) : (
          <span className="text-xs text-[var(--alo-muted)]">—</span>
        ),
    },
    {
      key: "callNotes",
      header: "Notes",
      cell: (r) =>
        r.callNotes ? (
          <span className="line-clamp-1 max-w-[200px] text-xs text-[var(--alo-text-secondary)]">
            {r.callNotes}
          </span>
        ) : (
          <span className="text-xs text-[var(--alo-muted)]">—</span>
        ),
    },
  ];

  return (
    <SectionCard
      title="Call History"
      description="Inbound, outbound & missed calls — click any row for full details"
      icon="History"
      accent="blue"
    >
      <DataTable
        columns={columns}
        data={calls}
        pageSize={10}
        onRowClick={onRowClick}
        emptyMessage="No calls recorded"
      />
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Unknown Callers Table
// ─────────────────────────────────────────────────────────────────────────────

function UnknownCallersTable({
  contacts,
  onAction,
}: {
  contacts: UnknownContact[];
  onAction: (contact: UnknownContact, action: string) => void;
}) {
  if (contacts.length === 0) {
    return (
      <SectionCard title="Unknown Callers" icon="UserX" accent="violet">
        <EmptyState
          icon="UserX"
          title="No unknown callers pending"
          description="When a call comes in from a number not matched to any Student, Lead, or Partner, it will appear here for triage."
          accent="violet"
        />
      </SectionCard>
    );
  }

  const columns: Column<UnknownContact>[] = [
    {
      key: "phone",
      header: "Phone",
      cell: (r) => <span className="font-mono text-xs font-semibold">{r.phone}</span>,
    },
    {
      key: "name",
      header: "Caller",
      cell: (r) =>
        r.name ? (
          <span className="text-xs font-medium">{r.name}</span>
        ) : (
          <span className="text-xs text-[var(--alo-muted)]">unknown</span>
        ),
    },
    {
      key: "source",
      header: "Source",
      cell: (r) => {
        const meta = SOURCE_META[r.source] || { accent: "slate" as AccentColor, label: r.source };
        return (
          <StatusBadge
            status={r.source}
            colorMap={{ PHONE_CALL: "blue", WHATSAPP: "emerald", WEBSITE_CHAT: "sky" }}
            labels={{ PHONE_CALL: "Phone Call", WHATSAPP: "WhatsApp", WEBSITE_CHAT: "Website Chat" }}
          />
        );
      },
    },
    {
      key: "createdAt",
      header: "Received At",
      sortable: true,
      sortAccessor: (r) => new Date(r.createdAt).getTime(),
      cell: (r) => <span className="text-xs">{timeAgo(r.createdAt)}</span>,
    },
    {
      key: "action",
      header: "Actions",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {Object.entries(UNKNOWN_ACTION_META).map(([action, meta]) => (
            <Button
              key={action}
              size="xs"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAction(r, action);
              }}
              className={cn(
                "h-7 border-[var(--alo-border)] px-2 text-[11px]",
                meta.accent === "blue" && "hover:border-[var(--alo-blue)] hover:bg-[var(--alo-blue-soft)] hover:text-[var(--alo-blue-strong)]",
                meta.accent === "emerald" && "hover:border-[var(--alo-success)] hover:bg-[var(--alo-success-soft)] hover:text-[var(--alo-success-strong)]",
                meta.accent === "violet" && "hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700",
                meta.accent === "rose" && "hover:border-[var(--alo-danger)] hover:bg-[var(--alo-danger-soft)] hover:text-[var(--alo-danger-strong)]",
              )}
            >
              <Icon name={meta.icon} className="size-3" />
              {meta.label}
            </Button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <SectionCard
      title="Unknown Callers"
      description="Triage calls from numbers not yet matched to a Student, Lead, or Partner"
      icon="UserX"
      accent="violet"
    >
      <DataTable
        columns={columns}
        data={contacts}
        pageSize={10}
        emptyMessage="No unknown callers pending"
      />
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Call Outcomes Table
// ─────────────────────────────────────────────────────────────────────────────

function CallOutcomesTable({
  outcomes,
  onLogOutcome,
  onCreated,
}: {
  outcomes: CallOutcome[];
  onLogOutcome: () => void;
  onCreated: () => void;
}) {
  // unused onCreated prop reserved for future refetch hooks (kept in signature for parity)
  void onCreated;

  if (outcomes.length === 0) {
    return (
      <SectionCard
        title="Call Outcomes"
        description="Logged outcomes for every call — answered, missed, escalated, callback requested"
        icon="ClipboardCheck"
        accent="emerald"
        action={
          <Button size="sm" variant="alo" onClick={onLogOutcome}>
            <Icon name="Plus" className="size-3.5" /> Log Call Outcome
          </Button>
        }
      >
        <EmptyState
          icon="ClipboardCheck"
          title="No call outcomes logged yet"
          description="Log the outcome of every call — summary, next action, follow-up date and student-visible note."
          accent="emerald"
          action={
            <Button size="sm" variant="alo" onClick={onLogOutcome}>
              <Icon name="Plus" className="size-3.5" /> Log Call Outcome
            </Button>
          }
        />
      </SectionCard>
    );
  }

  const columns: Column<CallOutcome>[] = [
    {
      key: "createdAt",
      header: "Time",
      sortable: true,
      sortAccessor: (r) => new Date(r.createdAt).getTime(),
      cell: (r) => <span className="text-xs">{formatDateTime(r.createdAt)}</span>,
    },
    {
      key: "counselorId",
      header: "Counselor",
      cell: (r) =>
        r.counselorId ? (
          <Badge variant="neutral" className="font-mono text-[10px]">
            {r.counselorId.slice(-6)}
          </Badge>
        ) : (
          <span className="text-xs text-[var(--alo-muted)]">—</span>
        ),
    },
    {
      key: "studentId",
      header: "Student",
      cell: (r) =>
        r.studentId ? (
          <Badge variant="blue" className="font-mono text-[10px]">
            {r.studentId.slice(-6)}
          </Badge>
        ) : (
          <span className="text-xs text-[var(--alo-muted)]">—</span>
        ),
    },
    {
      key: "outcome",
      header: "Outcome",
      cell: (r) => {
        const meta = OUTCOME_META[r.outcome] || { accent: "slate" as AccentColor, icon: "Circle" };
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            <Icon name={meta.icon} className="size-3.5" />
            <StatusBadge
              status={r.outcome}
              colorMap={{
                ANSWERED: "emerald",
                NO_ANSWER: "amber",
                BUSY: "amber",
                CALLBACK_REQUESTED: "sky",
                WRONG_NUMBER: "rose",
                RESOLVED: "emerald",
                ESCALATED: "rose",
              }}
              labels={{
                ANSWERED: "Answered",
                NO_ANSWER: "No Answer",
                BUSY: "Busy",
                CALLBACK_REQUESTED: "Callback Requested",
                WRONG_NUMBER: "Wrong Number",
                RESOLVED: "Resolved",
                ESCALATED: "Escalated",
              }}
            />
          </span>
        );
      },
    },
    {
      key: "duration",
      header: "Duration",
      cell: (r) => <span className="font-mono text-xs">{formatDuration(r.duration)}</span>,
    },
    {
      key: "summary",
      header: "Summary",
      cell: (r) =>
        r.summary ? (
          <span className="line-clamp-1 max-w-[260px] text-xs text-[var(--alo-text-secondary)]">
            {r.summary}
          </span>
        ) : (
          <span className="text-xs text-[var(--alo-muted)]">—</span>
        ),
    },
    {
      key: "followUpAt",
      header: "Follow-up",
      cell: (r) =>
        r.followUpAt ? (
          <span className="text-xs font-medium text-[var(--alo-warning-strong)]">
            {fmtDate(r.followUpAt)}
          </span>
        ) : (
          <span className="text-xs text-[var(--alo-muted)]">—</span>
        ),
    },
  ];

  return (
    <SectionCard
      title="Call Outcomes"
      description="Logged outcomes for every call — answered, missed, escalated, callback requested"
      icon="ClipboardCheck"
      accent="emerald"
      action={
        <Button size="sm" variant="alo" onClick={onLogOutcome}>
          <Icon name="Plus" className="size-3.5" /> Log Call Outcome
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={outcomes}
        pageSize={10}
        emptyMessage="No outcomes recorded"
      />
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Initiate Call Dialog (with student search + application picker)
// ─────────────────────────────────────────────────────────────────────────────

function InitiateCallDialog({
  open,
  onOpenChange,
  onInitiated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onInitiated: () => void;
}) {
  const { toast } = useToast();
  const [students, setStudents] = React.useState<StudentLite[]>([]);
  const [applications, setApplications] = React.useState<ApplicationLite[]>([]);
  const [query, setQuery] = React.useState("");
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = React.useState<string | null>(null);
  const [calling, setCalling] = React.useState(false);
  const [callStage, setCallStage] = React.useState<"idle" | "connecting" | "connected">("idle");

  // Load students & applications on mount
  React.useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/applications"),
        ]);
        if (sRes.ok) {
          const sJson = await sRes.json();
          setStudents(sJson.students || []);
        }
        if (aRes.ok) {
          const aJson = await aRes.json();
          setApplications(aJson.applications || []);
        }
      } catch {
        // ignore — inputs remain free-text fallback
      }
    })();
  }, [open]);

  const filteredStudents = React.useMemo(() => {
    if (!query.trim()) return students.slice(0, 20);
    const q = query.toLowerCase();
    return students
      .filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.mobile?.toLowerCase().includes(q) ||
          s.altMobile?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [students, query]);

  const selectedStudent = React.useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId],
  );

  const studentApplications = React.useMemo(
    () =>
      selectedStudentId
        ? applications.filter((a) => a.studentId === selectedStudentId)
        : [],
    [applications, selectedStudentId],
  );

  const phoneDisplay = selectedStudent?.mobile || selectedStudent?.altMobile || "";

  const reset = () => {
    setQuery("");
    setSelectedStudentId(null);
    setSelectedApplicationId(null);
    setCallStage("idle");
  };

  const handleCall = async () => {
    if (!selectedStudentId) {
      toast({
        title: "Select a student",
        description: "Pick a student from the search results to call.",
        variant: "destructive",
      });
      return;
    }
    setCalling(true);
    setCallStage("connecting");
    try {
      // Simulate a brief connecting state, then POST the outcome
      await new Promise((r) => setTimeout(r, 1200));
      const res = await fetch("/api/communications/calls/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callType: "OUTGOING", // extra field — recorded for audit/UX (backend stores it as outcome=CALLBACK_REQUESTED)
          outcome: "CALLBACK_REQUESTED",
          summary: `Outgoing call initiated to ${selectedStudent?.fullName || "student"} (${phoneDisplay}). Call connecting…`,
          counselorId: "counselor-demo",
          studentId: selectedStudentId,
          applicationId: selectedApplicationId || undefined,
          duration: 0,
          consentRecorded: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to initiate call");
      setCallStage("connected");
      setTimeout(() => {
        setCalling(false);
        reset();
        onOpenChange(false);
        onInitiated();
      }, 600);
    } catch (e: any) {
      setCalling(false);
      setCallStage("idle");
      toast({
        title: "Could not initiate call",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!calling) {
          if (!o) reset();
          onOpenChange(o);
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Phone" className="size-5 text-[var(--alo-blue)]" />
            Initiate Call
          </DialogTitle>
          <DialogDescription>
            Search for a student by name or phone, optionally attach an application, then place the call.
          </DialogDescription>
        </DialogHeader>

        {callStage === "connecting" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="relative flex size-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-[var(--alo-blue)]/30" />
              <div className="relative flex size-16 items-center justify-center rounded-full bg-[var(--alo-blue-soft)] text-[var(--alo-blue)]">
                <Icon name="Phone" className="size-7 animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-semibold text-[var(--alo-text)]">
              Call connecting…
            </p>
            <p className="text-xs text-[var(--alo-muted)]">
              Dialling <span className="font-mono">{phoneDisplay}</span>
            </p>
          </div>
        ) : callStage === "connected" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--alo-success-soft)] text-[var(--alo-success)]">
              <Icon name="CheckCircle2" className="size-7" />
            </div>
            <p className="text-sm font-semibold text-[var(--alo-text)]">Call connected</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Student search */}
            <div className="space-y-2">
              <Label className="text-xs">Search student (name or phone) *</Label>
              <Input
                placeholder="e.g. Rahim Uddin or 01XXXXXXXXX"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10"
              />
              {filteredStudents.length > 0 && (
                <div className="max-h-48 overflow-y-auto alo-scroll rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface)]">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setQuery(s.fullName);
                        setSelectedApplicationId(null);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--alo-surface-muted)]",
                        selectedStudentId === s.id && "bg-[var(--alo-blue-soft)]",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--alo-text)]">{s.fullName}</p>
                        <p className="text-[var(--alo-muted)]">{s.email}</p>
                      </div>
                      <span className="font-mono text-[var(--alo-blue-strong)]">{s.mobile}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone number display */}
            <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3">
              <p className="caption-text">Phone number to dial</p>
              <p className="mt-0.5 font-mono text-lg font-bold text-[var(--alo-text)]">
                {phoneDisplay || "—"}
              </p>
            </div>

            {/* Application selector (optional) */}
            <div className="space-y-2">
              <Label className="text-xs">Attach application (optional)</Label>
              <Select
                value={selectedApplicationId || undefined}
                onValueChange={setSelectedApplicationId}
                disabled={studentApplications.length === 0}
              >
                <SelectTrigger className="h-10">
                  <SelectValue
                    placeholder={
                      studentApplications.length === 0
                        ? selectedStudentId
                          ? "No applications for this student"
                          : "Select a student first"
                        : "Choose application…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {studentApplications.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.applicationId} · {a.university} — {a.course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-[var(--alo-info-soft)] p-2.5 text-[11px] text-[var(--alo-info-strong)]">
              <Icon name="Info" className="mr-1 inline size-3" />
              A CallOutcome record will be created with outcome=CALLBACK_REQUESTED and
              consentRecorded=true. Update it once the call completes.
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (!calling) {
                reset();
                onOpenChange(false);
              }
            }}
            disabled={calling}
          >
            Cancel
          </Button>
          <Button
            variant="cta"
            onClick={handleCall}
            disabled={calling || !selectedStudentId || !phoneDisplay}
          >
            <Icon name="Phone" className="size-3.5" />
            {calling ? "Calling…" : "Call"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Log Call Outcome Dialog
// ─────────────────────────────────────────────────────────────────────────────

function LogCallOutcomeDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    outcome: "ANSWERED",
    summary: "",
    studentVisibleNote: "",
    internalNote: "",
    nextAction: "",
    counselorId: "counselor-demo",
    studentId: "",
    applicationId: "",
    duration: 0,
    consentRecorded: false,
  });
  const [followUpAt, setFollowUpAt] = React.useState<Date | undefined>(undefined);
  const [saving, setSaving] = React.useState(false);

  const reset = () => {
    setForm({
      outcome: "ANSWERED",
      summary: "",
      studentVisibleNote: "",
      internalNote: "",
      nextAction: "",
      counselorId: "counselor-demo",
      studentId: "",
      applicationId: "",
      duration: 0,
      consentRecorded: false,
    });
    setFollowUpAt(undefined);
  };

  const handleSave = async () => {
    if (!form.summary.trim()) {
      toast({
        title: "Summary required",
        description: "Please add a brief summary of the call.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/communications/calls/outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: form.outcome,
          summary: form.summary,
          studentVisibleNote: form.studentVisibleNote || undefined,
          internalNote: form.internalNote || undefined,
          nextAction: form.nextAction || undefined,
          followUpAt: followUpAt ? followUpAt.toISOString() : undefined,
          consentRecorded: form.consentRecorded,
          counselorId: form.counselorId || undefined,
          studentId: form.studentId || undefined,
          applicationId: form.applicationId || undefined,
          duration: Number(form.duration) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save call outcome");
      reset();
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast({
        title: "Could not save outcome",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="ClipboardCheck" className="size-5 text-[var(--alo-emerald)]" />
            Log Call Outcome
          </DialogTitle>
          <DialogDescription>
            Record the outcome of a call — summary, next action, follow-up date & student-visible note.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Outcome */}
          <div className="space-y-2">
            <Label className="text-xs">Outcome *</Label>
            <Select
              value={form.outcome}
              onValueChange={(v) => setForm({ ...form, outcome: v })}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANSWERED">Answered</SelectItem>
                <SelectItem value="NO_ANSWER">No Answer</SelectItem>
                <SelectItem value="BUSY">Busy</SelectItem>
                <SelectItem value="CALLBACK_REQUESTED">Callback Requested</SelectItem>
                <SelectItem value="WRONG_NUMBER">Wrong Number</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="ESCALATED">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label className="text-xs">Summary *</Label>
            <Textarea
              rows={2}
              placeholder="Brief summary of the call…"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Student ID */}
            <div className="space-y-2">
              <Label className="text-xs">Student ID</Label>
              <Input
                placeholder="cuid…"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                className="h-10 font-mono text-xs"
              />
            </div>
            {/* Application ID */}
            <div className="space-y-2">
              <Label className="text-xs">Application ID</Label>
              <Input
                placeholder="cuid… (optional)"
                value={form.applicationId}
                onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                className="h-10 font-mono text-xs"
              />
            </div>
            {/* Counselor ID */}
            <div className="space-y-2">
              <Label className="text-xs">Counselor ID</Label>
              <Input
                placeholder="cuid…"
                value={form.counselorId}
                onChange={(e) => setForm({ ...form, counselorId: e.target.value })}
                className="h-10 font-mono text-xs"
              />
            </div>
            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-xs">Duration (seconds)</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                className="h-10"
              />
            </div>
          </div>

          {/* Student-visible note */}
          <div className="space-y-2">
            <Label className="text-xs">
              Student-visible note
              <span className="ml-1 text-[var(--alo-muted)]">(shown on portal)</span>
            </Label>
            <Textarea
              rows={2}
              placeholder="A note the student can see in their portal…"
              value={form.studentVisibleNote}
              onChange={(e) => setForm({ ...form, studentVisibleNote: e.target.value })}
            />
          </div>

          {/* Internal note */}
          <div className="space-y-2">
            <Label className="text-xs">
              Internal note
              <span className="ml-1 text-[var(--alo-muted)]">(restricted — not student-visible)</span>
            </Label>
            <Textarea
              rows={2}
              placeholder="Restricted internal context…"
              value={form.internalNote}
              onChange={(e) => setForm({ ...form, internalNote: e.target.value })}
            />
          </div>

          {/* Next action */}
          <div className="space-y-2">
            <Label className="text-xs">Next action</Label>
            <Input
              placeholder="e.g. Send documents email tomorrow"
              value={form.nextAction}
              onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
              className="h-10"
            />
          </div>

          {/* Follow-up date */}
          <div className="space-y-2">
            <Label className="text-xs">Follow-up date</Label>
            <DatePicker
              value={followUpAt}
              onChange={setFollowUpAt}
              placeholder="Pick a follow-up date"
            />
          </div>

          {/* Consent checkbox */}
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3">
            <Checkbox
              checked={form.consentRecorded}
              onCheckedChange={(v) =>
                setForm({ ...form, consentRecorded: v === true })
              }
            />
            <span className="text-xs font-medium text-[var(--alo-text-secondary)]">
              Consent recorded — the student has consented to this call being logged and reviewed.
            </span>
          </label>
        </div>

        <DialogFooter>
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
            <Icon name="Save" className="size-3.5" />
            {saving ? "Saving…" : "Save Outcome"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Call Detail Sheet (drawer)
// ─────────────────────────────────────────────────────────────────────────────

function CallDetailSheet({
  call,
  onOpenChange,
}: {
  call: PhoneCall | null;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Sheet open={!!call} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {call && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Icon
                  name={CALL_TYPE_META[call.callType]?.icon || "PhoneCall"}
                  className="size-5"
                />
                Call Details
              </SheetTitle>
              <SheetDescription>
                Full call record, recording & metadata
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-4 pb-6">
              <div className="flex items-center justify-between">
                <StatusBadge
                  status={call.callType}
                  colorMap={{
                    INCOMING: "blue",
                    OUTGOING: "emerald",
                    MISSED: "rose",
                  }}
                  labels={{
                    INCOMING: "Incoming",
                    OUTGOING: "Outgoing",
                    MISSED: "Missed",
                  }}
                />
                <span className="text-xs text-[var(--alo-muted)]">
                  {timeAgo(call.createdAt)}
                </span>
              </div>

              <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="caption-text">From</p>
                    <p className="mt-0.5 font-mono font-semibold text-[var(--alo-text)]">
                      {call.fromNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="caption-text">To</p>
                    <p className="mt-0.5 font-mono font-semibold text-[var(--alo-text)]">
                      {call.toNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="caption-text">Duration</p>
                    <p className="mt-0.5 font-mono font-semibold text-[var(--alo-text)]">
                      {formatDuration(call.duration)}
                    </p>
                  </div>
                  <div>
                    <p className="caption-text">Disposition</p>
                    <p className="mt-0.5 text-[var(--alo-text)]">
                      {call.disposition || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="caption-text">Notes</p>
                <p className="mt-1 body-text text-[var(--alo-text-secondary)]">
                  {call.callNotes || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-md border border-[var(--alo-border)] p-2.5">
                  <p className="caption-text">Student</p>
                  <p className="mt-0.5 font-mono text-[var(--alo-blue-strong)]">
                    {call.studentId || "—"}
                  </p>
                </div>
                <div className="rounded-md border border-[var(--alo-border)] p-2.5">
                  <p className="caption-text">Lead / Partner</p>
                  <p className="mt-0.5 font-mono text-[var(--alo-text)]">
                    {call.leadId || call.partnerId || "—"}
                  </p>
                </div>
              </div>

              {call.recordingPath && (
                <div className="rounded-md border border-[var(--alo-border)] bg-[var(--alo-surface-muted)] p-3">
                  <p className="caption-text mb-1.5">Recording</p>
                  <audio controls className="w-full">
                    <source src={call.recordingPath} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Icon name="Phone" className="size-3.5" /> Call Back
                </Button>
                <Button variant="alo" size="sm" className="flex-1">
                  <Icon name="ClipboardCheck" className="size-3.5" /> Log Outcome
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
