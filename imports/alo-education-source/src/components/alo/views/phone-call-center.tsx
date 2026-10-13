"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Pill,
  fetchJson,
  fmtDateTime,
  fmtDuration,
  timeAgoShort,
  PRIORITY_COLORS,
} from "@/components/alo/comm-helpers";

// ─── Types ────────────────────────────────────────────────────────────────

interface OmnichannelResponse {
  stats: {
    totalPhoneCalls: number;
    missedCalls: number;
  };
  phoneCalls: PhoneCall[];
}

interface PhoneCall {
  id: string;
  callType: string;
  fromNumber: string;
  toNumber: string;
  duration: number;
  callNotes: string | null;
  disposition: string;
  createdAt: string;
}

interface UnknownContact {
  id: string;
  incomingPhone: string;
  incomingName?: string | null;
  source?: string | null;
  reason?: string | null;
  matchedToStudent: boolean;
  action?: string | null;
  createdAt: string;
}

interface CallOutcome {
  id: string;
  outcome: string;
  summary?: string | null;
  studentVisibleNote?: string | null;
  internalNote?: string | null;
  nextAction?: string | null;
  followUpAt?: string | null;
  consentRecorded?: boolean | null;
  duration?: number | null;
  counselorId?: string | null;
  studentId?: string | null;
  applicationId?: string | null;
  createdAt: string;
}

interface StudentOption {
  id: string;
  studentId: string;
  fullName: string;
  mobile?: string | null;
}

// ─── Main Component ────────────────────────────────────────────────────────

export function PhoneCallCenter() {
  const { toast } = useToast();
  const [stats, setStats] = React.useState<{ totalPhoneCalls: number; missedCalls: number } | null>(null);
  const [calls, setCalls] = React.useState<PhoneCall[]>([]);
  const [unknowns, setUnknowns] = React.useState<UnknownContact[]>([]);
  const [outcomes, setOutcomes] = React.useState<CallOutcome[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [tab, setTab] = React.useState("call-history");
  const [initiateOpen, setInitiateOpen] = React.useState(false);
  const [logOutcomeOpen, setLogOutcomeOpen] = React.useState(false);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [omniRes, unknownRes, outcomeRes] = await Promise.all([
        fetchJson<OmnichannelResponse>("/api/omnichannel/dashboard"),
        fetchJson<{ unknownContacts: UnknownContact[] }>("/api/communications/calls/unknown"),
        fetchJson<{ outcomes: CallOutcome[] }>("/api/communications/calls/outcomes"),
      ]);
      setStats(omniRes.stats);
      setCalls(omniRes.phoneCalls || []);
      setUnknowns(unknownRes.unknownContacts || []);
      setOutcomes(outcomeRes.outcomes || []);
    } catch (err) {
      console.error("[phone-call-center]", err);
      setError(true);
      toast({
        title: "Failed to load call center",
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

  const answered = calls.filter((c) => c.callType !== "MISSED").length;
  const missed = calls.filter((c) => c.callType === "MISSED").length || stats?.missedCalls || 0;
  const avgDuration =
    calls.length > 0
      ? Math.round(calls.reduce((s, c) => s + (c.duration || 0), 0) / calls.length)
      : 0;
  const unknownPending = unknowns.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Phone Call Center" subtitle="Track, log, and resolve all inbound and outbound calls." icon="Phone" />
        <LoadingGrid count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Phone Call Center" subtitle="Track, log, and resolve all inbound and outbound calls." icon="Phone" />
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-[#991B1B]">Failed to load call center</p>
          <Button onClick={() => void fetchAll()} className="mt-3" size="sm">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phone Call Center"
        subtitle="Track, log, and resolve all inbound and outbound calls."
        icon="Phone"
        action={
          <Button
            onClick={() => setInitiateOpen(true)}
            className="h-10 bg-[#0057B8] text-white hover:bg-[#003a7a]"
          >
            <Icon name="PhoneOutgoing" className="mr-2 size-4" />
            Initiate Call
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Calls" value={calls.length} icon="Phone" accent="blue" />
        <KpiCard label="Answered" value={answered} icon="PhoneCall" accent="emerald" />
        <KpiCard label="Missed" value={missed} icon="PhoneMissed" accent="rose" />
        <KpiCard label="Avg Duration" value={fmtDuration(avgDuration)} icon="Clock" accent="violet" />
        <KpiCard label="Unknown Pending" value={unknownPending} icon="UserSearch" accent="amber" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <div className="overflow-x-auto alo-scroll rounded-xl border border-[#E2E8F0] bg-white p-1.5">
          <TabsList className="h-auto w-max gap-1 bg-transparent">
            <TabsTrigger value="active-calls" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
              <Icon name="PhoneCall" className="mr-1.5 size-3.5" /> Active Calls
            </TabsTrigger>
            <TabsTrigger value="call-history" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
              <Icon name="History" className="mr-1.5 size-3.5" /> Call History
            </TabsTrigger>
            <TabsTrigger value="unknown-callers" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
              <Icon name="UserSearch" className="mr-1.5 size-3.5" /> Unknown Callers
            </TabsTrigger>
            <TabsTrigger value="call-outcomes" className="data-[state=active]:bg-[#EFF6FF] data-[state=active]:text-[#0057B8]">
              <Icon name="ClipboardCheck" className="mr-1.5 size-3.5" /> Call Outcomes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active-calls" className="space-y-4">
          <SectionCard
            title="Active Calls"
            description="Live in-progress calls (placeholder — telephony integration required)"
            icon="PhoneCall"
          >
            <EmptyState
              icon="PhoneCall"
              title="No active calls"
              description="When telephony integration is enabled, in-progress calls will appear here with live call controls (mute, hold, transfer)."
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="call-history" className="space-y-4">
          <SectionCard
            title="Call History"
            description={`${calls.length} call(s) recorded`}
            icon="History"
          >
            <CallHistoryTable calls={calls} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="unknown-callers" className="space-y-4">
          <SectionCard
            title="Unknown Callers"
            description={`${unknownPending} unmatched incoming caller(s)`}
            icon="UserSearch"
          >
            <UnknownCallersTable
              unknowns={unknowns}
              onResolve={(id, action) => void resolveUnknown(id, action)}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="call-outcomes" className="space-y-4">
          <SectionCard
            title="Call Outcomes"
            description={`${outcomes.length} logged outcome(s)`}
            icon="ClipboardCheck"
            action={
              <Button
                onClick={() => setLogOutcomeOpen(true)}
                className="h-9 bg-[#0057B8] text-white hover:bg-[#003a7a]"
              >
                <Icon name="Plus" className="mr-1.5 size-4" />
                Log Call Outcome
              </Button>
            }
          >
            <CallOutcomesTable outcomes={outcomes} />
          </SectionCard>
        </TabsContent>
      </Tabs>

      <InitiateCallDialog open={initiateOpen} onOpenChange={setInitiateOpen} onDone={() => void fetchAll()} />
      <LogOutcomeDialog open={logOutcomeOpen} onOpenChange={setLogOutcomeOpen} onDone={() => void fetchAll()} />
    </div>
  );

  async function resolveUnknown(id: string, action: "MATCH_STUDENT" | "MATCH_LEAD" | "CREATE_LEAD" | "IGNORE" | "BLOCK") {
    try {
      await fetchJson("/api/communications/calls/unknown", {
        method: "POST",
        body: JSON.stringify({ id, action }),
      });
      toast({
        title: "Unknown contact resolved",
        description: `Action: ${action.replace(/_/g, " ").toLowerCase()}`,
      });
      setUnknowns((u) => u.filter((x) => x.id !== id));
    } catch (err) {
      toast({
        title: "Failed to resolve contact",
        description: err instanceof Error ? err.message : "Unknown error.",
        variant: "destructive",
      });
    }
  }
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
          <p className="mt-1 text-xl font-bold tabular-nums text-[#0F172A] sm:text-2xl">{value}</p>
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", accentMap[accent])}>
          <Icon name={icon} className="size-4" />
        </span>
      </div>
    </div>
  );
}

const CALL_TYPE_COLORS: Record<string, string> = {
  INCOMING: "bg-blue-100 text-blue-700",
  OUTGOING: "bg-emerald-100 text-emerald-700",
  MISSED: "bg-rose-100 text-rose-700",
  VOICEMAIL: "bg-amber-100 text-amber-700",
};

function CallHistoryTable({ calls }: { calls: PhoneCall[] }) {
  const columns: DataTableColumn<PhoneCall>[] = [
    {
      key: "createdAt",
      header: "Time",
      render: (c) => <span className="text-xs">{fmtDateTime(c.createdAt)}</span>,
    },
    {
      key: "callType",
      header: "Type",
      render: (c) => (
        <Pill className={CALL_TYPE_COLORS[c.callType] || "bg-slate-100 text-slate-700"}>
          {c.callType.toLowerCase()}
        </Pill>
      ),
    },
    {
      key: "fromNumber",
      header: "From",
      render: (c) => <span className="font-mono text-xs">{c.fromNumber || "—"}</span>,
    },
    {
      key: "toNumber",
      header: "To",
      render: (c) => <span className="font-mono text-xs">{c.toNumber || "—"}</span>,
    },
    {
      key: "duration",
      header: "Duration",
      render: (c) => <span className="text-xs tabular-nums">{fmtDuration(c.duration)}</span>,
    },
    {
      key: "disposition",
      header: "Disposition",
      render: (c) => (
        <span className="text-xs text-[#475569]">{c.disposition || "—"}</span>
      ),
    },
    {
      key: "callNotes",
      header: "Notes",
      render: (c) => (
        <span className="line-clamp-1 text-xs text-[#64748B]">{c.callNotes || "—"}</span>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={calls}
      rowKey={(c) => c.id}
      emptyTitle="No calls recorded"
      emptyDescription="Inbound and outbound calls will appear here once telephony is connected."
      emptyIcon="Phone"
      maxHeight="480px"
    />
  );
}

function UnknownCallersTable({
  unknowns,
  onResolve,
}: {
  unknowns: UnknownContact[];
  onResolve: (id: string, action: "MATCH_STUDENT" | "MATCH_LEAD" | "CREATE_LEAD" | "IGNORE" | "BLOCK") => void;
}) {
  const columns: DataTableColumn<UnknownContact>[] = [
    {
      key: "createdAt",
      header: "Time",
      render: (c) => <span className="text-xs">{timeAgoShort(c.createdAt)}</span>,
    },
    {
      key: "incomingPhone",
      header: "Phone",
      render: (c) => <span className="font-mono text-xs">{c.incomingPhone}</span>,
    },
    {
      key: "incomingName",
      header: "Name",
      render: (c) => <span className="text-xs">{c.incomingName || "Unknown"}</span>,
    },
    {
      key: "source",
      header: "Source",
      render: (c) => <span className="text-xs">{c.source || "—"}</span>,
    },
    {
      key: "reason",
      header: "Reason",
      render: (c) => (
        <span className="line-clamp-1 text-xs text-[#64748B]">{c.reason || "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "Resolve",
      align: "right",
      render: (c) => (
        <div className="flex flex-wrap justify-end gap-1">
          <Button
            size="sm"
            className="h-7 bg-emerald-600 px-2 text-[10px] hover:bg-emerald-700"
            onClick={() => onResolve(c.id, "CREATE_LEAD")}
          >
            Create Lead
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-[#E2E8F0] px-2 text-[10px]"
            onClick={() => onResolve(c.id, "MATCH_STUDENT")}
          >
            Link Existing
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-[#E2E8F0] px-2 text-[10px]"
            onClick={() => onResolve(c.id, "IGNORE")}
          >
            Ignore
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-rose-200 px-2 text-[10px] text-rose-600 hover:bg-rose-50"
            onClick={() => onResolve(c.id, "BLOCK")}
          >
            Block
          </Button>
        </div>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={unknowns}
      rowKey={(c) => c.id}
      emptyTitle="No unknown callers"
      emptyDescription="Incoming calls that couldn't be auto-matched to a student or lead will appear here."
      emptyIcon="UserSearch"
      maxHeight="480px"
    />
  );
}

function CallOutcomesTable({ outcomes }: { outcomes: CallOutcome[] }) {
  const columns: DataTableColumn<CallOutcome>[] = [
    {
      key: "createdAt",
      header: "Logged",
      render: (o) => <span className="text-xs">{fmtDateTime(o.createdAt)}</span>,
    },
    {
      key: "outcome",
      header: "Outcome",
      render: (o) => (
        <Pill className={PRIORITY_COLORS[o.outcome] || "bg-slate-100 text-slate-700"}>
          {o.outcome.replace(/_/g, " ").toLowerCase()}
        </Pill>
      ),
    },
    {
      key: "summary",
      header: "Summary",
      render: (o) => (
        <span className="line-clamp-1 text-xs text-[#0F172A]">{o.summary || "—"}</span>
      ),
    },
    {
      key: "nextAction",
      header: "Next Action",
      render: (o) => (
        <span className="line-clamp-1 text-xs text-[#64748B]">{o.nextAction || "—"}</span>
      ),
    },
    {
      key: "followUpAt",
      header: "Follow Up",
      render: (o) => <span className="text-xs">{fmtDateTime(o.followUpAt)}</span>,
    },
    {
      key: "duration",
      header: "Duration",
      render: (o) => <span className="text-xs tabular-nums">{fmtDuration(o.duration || 0)}</span>,
    },
    {
      key: "consent",
      header: "Consent",
      render: (o) =>
        o.consentRecorded ? (
          <Pill className="bg-emerald-100 text-emerald-700">Yes</Pill>
        ) : (
          <Pill className="bg-slate-100 text-slate-600">No</Pill>
        ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={outcomes}
      rowKey={(o) => o.id}
      emptyTitle="No outcomes logged"
      emptyDescription="Logged call outcomes will appear here for audit and follow-up."
      emptyIcon="ClipboardCheck"
      maxHeight="480px"
    />
  );
}

function InitiateCallDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [studentQuery, setStudentQuery] = React.useState("");
  const [students, setStudents] = React.useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<StudentOption | null>(null);
  const [phone, setPhone] = React.useState("");
  const [applicationId, setApplicationId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Search students as user types
  React.useEffect(() => {
    if (!studentQuery || studentQuery.length < 2) {
      setStudents([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetchJson<{ students?: StudentOption[]; data?: StudentOption[] } | StudentOption[]>(
          `/api/students?search=${encodeURIComponent(studentQuery)}`
        );
        const list = Array.isArray(res)
          ? res
          : res.students || res.data || [];
        setStudents(list.slice(0, 10));
      } catch {
        setStudents([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [studentQuery]);

  const submit = async () => {
    if (!phone.trim()) {
      toast({ title: "Phone number is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetchJson("/api/communications/calls/outcomes", {
        method: "POST",
        body: JSON.stringify({
          outcome: "INITIATED",
          summary: `Outbound call initiated to ${phone}`,
          studentId: selectedStudent?.id,
          applicationId: applicationId || undefined,
          consentRecorded: true,
        }),
      });
      toast({ title: "Call initiated", description: `Outbound call to ${phone}` });
      setPhone("");
      setStudentQuery("");
      setSelectedStudent(null);
      setApplicationId("");
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast({
        title: "Failed to initiate call",
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
          <DialogTitle>Initiate Call</DialogTitle>
          <DialogDescription>
            Search for a student (optional) and enter the phone number to log an outbound call.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="student-search">Search Student (optional)</Label>
            <Input
              id="student-search"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Type student name or ID…"
              className="mt-1"
            />
            {students.length > 0 && (
              <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white">
                {students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStudent(s);
                      setStudentQuery(`${s.fullName} (${s.studentId})`);
                      if (s.mobile) setPhone(s.mobile);
                      setStudents([]);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-[#F1F5F9]"
                  >
                    <span className="font-semibold text-[#0F172A]">{s.fullName}</span>
                    <span className="text-[#64748B]">{s.studentId}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedStudent && (
              <p className="mt-1 text-[11px] text-emerald-700">
                ✓ Selected: {selectedStudent.fullName}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="call-phone">Phone Number</Label>
            <Input
              id="call-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801XXXXXXXXX"
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="call-app">Application ID (optional)</Label>
            <Input
              id="call-app"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="cuid"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#0057B8] text-white hover:bg-[#003a7a]"
            disabled={submitting}
            onClick={() => void submit()}
          >
            <Icon name="PhoneOutgoing" className="mr-1.5 size-4" />
            {submitting ? "Calling…" : "Call"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LogOutcomeDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [outcome, setOutcome] = React.useState("CALL_CONNECTED");
  const [summary, setSummary] = React.useState("");
  const [internalNote, setInternalNote] = React.useState("");
  const [studentVisibleNote, setStudentVisibleNote] = React.useState("");
  const [nextAction, setNextAction] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [consent, setConsent] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (!summary.trim()) {
      toast({ title: "Summary is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await fetchJson("/api/communications/calls/outcomes", {
        method: "POST",
        body: JSON.stringify({
          outcome,
          summary: summary.trim(),
          internalNote: internalNote.trim() || undefined,
          studentVisibleNote: studentVisibleNote.trim() || undefined,
          nextAction: nextAction.trim() || undefined,
          studentId: studentId.trim() || undefined,
          duration: duration ? parseInt(duration, 10) : undefined,
          consentRecorded: consent,
        }),
      });
      toast({ title: "Call outcome logged" });
      setSummary("");
      setInternalNote("");
      setStudentVisibleNote("");
      setNextAction("");
      setStudentId("");
      setDuration("");
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast({
        title: "Failed to log outcome",
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
          <DialogTitle>Log Call Outcome</DialogTitle>
          <DialogDescription>
            Record the outcome of a call for audit and follow-up tracking.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "CALL_CONNECTED",
                    "NO_ANSWER",
                    "VOICEMAIL_LEFT",
                    "CALLBACK_REQUESTED",
                    "WRONG_NUMBER",
                    "DISCONNECTED",
                    "FOLLOW_UP_SCHEDULED",
                  ].map((o) => (
                    <SelectItem key={o} value={o}>
                      {o.replace(/_/g, " ").toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="call-duration">Duration (sec)</Label>
              <Input
                id="call-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="120"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="outcome-summary">Summary *</Label>
            <Textarea
              id="outcome-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What was discussed?"
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div>
            <Label htmlFor="outcome-next">Next Action</Label>
            <Input
              id="outcome-next"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="e.g. Send visa docs checklist"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="outcome-student">Student ID (optional)</Label>
            <Input
              id="outcome-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="cuid"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="outcome-student-visible">Student-Visible Note (optional)</Label>
            <Textarea
              id="outcome-student-visible"
              value={studentVisibleNote}
              onChange={(e) => setStudentVisibleNote(e.target.value)}
              placeholder="A note the student can see in their portal"
              className="mt-1 min-h-[60px]"
            />
          </div>
          <div>
            <Label htmlFor="outcome-internal">Internal Note (optional)</Label>
            <Textarea
              id="outcome-internal"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Counselor-only note"
              className="mt-1 min-h-[60px]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="size-4 rounded border-[#E2E8F0]"
            />
            Consent recorded for this call
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#0057B8] text-white hover:bg-[#003a7a]"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Saving…" : "Log Outcome"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
