'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Search,
  Plus,
  Filter,
  Clock,
  Calendar,
  AlertTriangle,
  PhoneCall,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePortalData } from '@/hooks/use-portal-data';
import { PageHeader } from '@/components/alo/portal/PortalPage';
import { StatCard } from '@/components/alo/portal/StatCard';
import { getSession, hasRole } from '@/lib/session';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CallLog {
  id: string;
  callCode: string;
  leadId: string | null;
  studentId: string | null;
  partnerId: string | null;
  applicationId: string | null;
  phone: string;
  callType: string;
  callOutcome: string | null;
  durationSeconds: number;
  recordingUrl: string | null;
  note: string | null;
  studentVisibleNote: string | null;
  internalNote: string | null;
  nextFollowUpAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CallLogsResponse {
  callLogs: CallLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const callTypeMeta: Record<
  string,
  { label: string; Icon: typeof PhoneOutgoing; color: string }
> = {
  outbound: {
    label: 'Outbound',
    Icon: PhoneOutgoing,
    color: 'bg-blue-50 text-[#0057B8] border-blue-100',
  },
  inbound: {
    label: 'Inbound',
    Icon: PhoneIncoming,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  missed: {
    label: 'Missed',
    Icon: PhoneMissed,
    color: 'bg-red-50 text-red-700 border-red-100',
  },
};

const callOutcomeMeta: Record<string, { label: string; color: string }> = {
  answered: {
    label: 'Answered',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  no_answer: {
    label: 'No Answer',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  busy: { label: 'Busy', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  callback_requested: {
    label: 'Callback Requested',
    color: 'bg-blue-50 text-[#0057B8] border-blue-100',
  },
  wrong_number: {
    label: 'Wrong Number',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  escalated: {
    label: 'Escalated',
    color: 'bg-red-50 text-red-700 border-red-100',
  },
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CallCenterPage() {
  const session = getSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCallType, setFilterCallType] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Form state
  const [formPhone, setFormPhone] = useState('');
  const [formCallType, setFormCallType] = useState('outbound');
  const [formOutcome, setFormOutcome] = useState('');
  const [formDuration, setFormDuration] = useState(0);
  const [formNote, setFormNote] = useState('');
  const [formStudentVisibleNote, setFormStudentVisibleNote] = useState('');
  const [formInternalNote, setFormInternalNote] = useState('');
  const [formLeadId, setFormLeadId] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formPartnerId, setFormPartnerId] = useState('');
  const [formApplicationId, setFormApplicationId] = useState('');
  const [formNextFollowUp, setFormNextFollowUp] = useState('');

  // Role gate: counselor, super_admin, admin, employee
  const roleOk =
    !!session &&
    hasRole(
      session,
      'super_admin',
      'admin',
      'counselor',
      'junior_counselor',
      'employee',
      'front_desk',
      'branch_manager',
      'ceo_director',
      'country_manager',
      'office_manager',
      'support_agent',
      'partner_manager'
    );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page, limit: 25 };
    if (debouncedSearch) p.phone = debouncedSearch;
    if (filterCallType !== 'all') p.callType = filterCallType;
    if (filterOutcome !== 'all') p.callOutcome = filterOutcome;
    if (fromDate) p.fromDate = new Date(fromDate).toISOString();
    if (toDate) p.toDate = new Date(`${toDate}T23:59:59`).toISOString();
    // refreshNonce is appended to force refetch after a successful POST.
    p._refresh = refreshNonce;
    return p;
  }, [page, debouncedSearch, filterCallType, filterOutcome, fromDate, toDate, refreshNonce]);

  const { data, loading, error } = usePortalData<CallLogsResponse>({
    endpoint: '/api/call-logs',
    params,
    enabled: roleOk,
  });

  const callLogs = data?.callLogs ?? [];
  const pagination = data?.pagination;

  const stats = useMemo(() => {
    const total = callLogs.length;
    const inbound = callLogs.filter((c) => c.callType === 'inbound').length;
    const outbound = callLogs.filter((c) => c.callType === 'outbound').length;
    const missed = callLogs.filter((c) => c.callType === 'missed').length;
    return { total, inbound, outbound, missed };
  }, [callLogs]);

  const handleReset = useCallback(() => {
    setFormPhone('');
    setFormCallType('outbound');
    setFormOutcome('');
    setFormDuration(0);
    setFormNote('');
    setFormStudentVisibleNote('');
    setFormInternalNote('');
    setFormLeadId('');
    setFormStudentId('');
    setFormPartnerId('');
    setFormApplicationId('');
    setFormNextFollowUp('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!session?.token) return;
    if (formPhone.trim().length < 4) {
      toast.error('Phone number is required (min 4 chars)');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        phone: formPhone.trim(),
        callType: formCallType,
        durationSeconds: Number(formDuration) || 0,
      };
      if (formOutcome && formOutcome !== '__none__')
        body.callOutcome = formOutcome;
      if (formNote.trim()) body.note = formNote.trim();
      if (formStudentVisibleNote.trim())
        body.studentVisibleNote = formStudentVisibleNote.trim();
      if (formInternalNote.trim())
        body.internalNote = formInternalNote.trim();
      if (formLeadId.trim()) body.leadId = formLeadId.trim();
      if (formStudentId.trim()) body.studentId = formStudentId.trim();
      if (formPartnerId.trim()) body.partnerId = formPartnerId.trim();
      if (formApplicationId.trim())
        body.applicationId = formApplicationId.trim();
      if (formNextFollowUp) body.nextFollowUpAt = new Date(formNextFollowUp).toISOString();

      const res = await fetch('/api/call-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || `Failed to log call (${res.status})`);
      }
      toast.success(`Call logged — ${payload.callLog?.callCode ?? 'CALL'}`);
      handleReset();
      setShowForm(false);
      // Force refetch of the call log list.
      setRefreshNonce((n) => n + 1);
      setPage(1);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to log call');
    } finally {
      setSubmitting(false);
    }
  }, [
    session?.token,
    formPhone,
    formCallType,
    formDuration,
    formOutcome,
    formNote,
    formStudentVisibleNote,
    formInternalNote,
    formLeadId,
    formStudentId,
    formPartnerId,
    formApplicationId,
    formNextFollowUp,
    handleReset,
  ]);

  if (!session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <p className="text-sm">Please sign in to access the Call Center.</p>
      </div>
    );
  }

  if (!roleOk) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Access Restricted
          </h2>
          <p className="text-sm">
            Your role is not authorized to access the Phone Call Center.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader
        title="Phone Call Center"
        description="Log inbound, outbound, and missed calls — track outcomes, follow-ups, and per-student call history."
        action={
          <Button
            className="bg-[#0057B8] hover:bg-[#00449a] text-white"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Close' : 'Log Call'}
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Calls" value={stats.total} icon={PhoneCall} accent="blue" />
        <StatCard label="Outbound" value={stats.outbound} icon={PhoneOutgoing} accent="green" />
        <StatCard label="Inbound" value={stats.inbound} icon={PhoneIncoming} accent="purple" />
        <StatCard label="Missed" value={stats.missed} icon={PhoneMissed} accent="orange" />
      </div>

      {showForm && (
        <Card className="p-4 border-0 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PhoneCall className="h-5 w-5 text-[#0057B8]" />
            <h2 className="text-base font-bold text-slate-900">Log a Call</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cf-phone" className="text-xs font-semibold text-slate-700">
                Phone number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cf-phone"
                placeholder="+8801XXXXXXXXX"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Call type</Label>
              <Select value={formCallType} onValueChange={setFormCallType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Outcome</Label>
              <Select value={formOutcome} onValueChange={setFormOutcome}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— No outcome —</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="callback_requested">Callback Requested</SelectItem>
                  <SelectItem value="wrong_number">Wrong Number</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-duration" className="text-xs font-semibold text-slate-700">
                Duration (seconds)
              </Label>
              <Input
                id="cf-duration"
                type="number"
                min={0}
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-next-followup" className="text-xs font-semibold text-slate-700">
                Next follow-up
              </Label>
              <Input
                id="cf-next-followup"
                type="datetime-local"
                value={formNextFollowUp}
                onChange={(e) => setFormNextFollowUp(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-student" className="text-xs font-semibold text-slate-700">
                Student ID (optional)
              </Label>
              <Input
                id="cf-student"
                placeholder="Student UUID"
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-lead" className="text-xs font-semibold text-slate-700">
                Lead ID (optional)
              </Label>
              <Input
                id="cf-lead"
                placeholder="Lead UUID or LEAD-XXXX"
                value={formLeadId}
                onChange={(e) => setFormLeadId(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-partner" className="text-xs font-semibold text-slate-700">
                Partner ID (optional)
              </Label>
              <Input
                id="cf-partner"
                placeholder="Partner UUID"
                value={formPartnerId}
                onChange={(e) => setFormPartnerId(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-app" className="text-xs font-semibold text-slate-700">
                Application ID (optional)
              </Label>
              <Input
                id="cf-app"
                placeholder="Application UUID"
                value={formApplicationId}
                onChange={(e) => setFormApplicationId(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cf-note" className="text-xs font-semibold text-slate-700">
              Note (shared)
            </Label>
            <Textarea
              id="cf-note"
              placeholder="General note about the call..."
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cf-student-visible" className="text-xs font-semibold text-slate-700">
                Student-visible note
              </Label>
              <Textarea
                id="cf-student-visible"
                placeholder="Shown to the student..."
                value={formStudentVisibleNote}
                onChange={(e) => setFormStudentVisibleNote(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-internal" className="text-xs font-semibold text-slate-700">
                Internal note (private)
              </Label>
              <Textarea
                id="cf-internal"
                placeholder="Internal team note..."
                value={formInternalNote}
                onChange={(e) => setFormInternalNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Button
              className="bg-[#0057B8] hover:bg-[#00449a] text-white"
              onClick={handleSubmit}
              disabled={submitting || formPhone.trim().length < 4}
            >
              <PhoneCall className="h-4 w-4 mr-2" />
              {submitting ? 'Logging…' : 'Log Call'}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={submitting}>
              Reset
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by phone number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10"
            />
          </div>
          <Select
            value={filterCallType}
            onValueChange={(v) => {
              setFilterCallType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] h-10">
              <Filter className="h-3.5 w-3.5 mr-1 text-slate-400" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterOutcome}
            onValueChange={(v) => {
              setFilterOutcome(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] h-10">
              <SelectValue placeholder="Outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All outcomes</SelectItem>
              {Object.entries(callOutcomeMeta).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="h-10 w-[140px]"
              aria-label="From date"
            />
            <span className="text-slate-400 text-xs">→</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="h-10 w-[140px]"
              aria-label="To date"
            />
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-3 border-0 shadow-sm bg-red-50 text-red-700 text-sm">
          Error: {error}
        </Card>
      )}

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : callLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Phone className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No calls logged yet</h3>
            <p className="text-sm text-slate-500">
              Click <span className="font-semibold text-[#0057B8]">Log Call</span> to record your first call.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="whitespace-nowrap">Call Code</TableHead>
                  <TableHead className="whitespace-nowrap">Phone</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Outcome</TableHead>
                  <TableHead className="whitespace-nowrap">Duration</TableHead>
                  <TableHead className="whitespace-nowrap">Note</TableHead>
                  <TableHead className="whitespace-nowrap">Next Follow-up</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callLogs.map((c) => {
                  const typeMeta = callTypeMeta[c.callType] || callTypeMeta.outbound;
                  const outcomeMeta = c.callOutcome
                    ? callOutcomeMeta[c.callOutcome]
                    : null;
                  const TypeIcon = typeMeta.Icon;
                  return (
                    <TableRow key={c.id} className="hover:bg-slate-50/60">
                      <TableCell>
                        <span className="text-xs font-mono text-slate-700">
                          {c.callCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-900">
                            {c.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn('border text-xs gap-1', typeMeta.color)}
                        >
                          <TypeIcon className="h-3 w-3" />
                          {typeMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {outcomeMeta ? (
                          <Badge className={cn('border text-xs', outcomeMeta.color)}>
                            {outcomeMeta.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600">
                          {c.durationSeconds > 0
                            ? formatDuration(c.durationSeconds)
                            : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {c.note || c.studentVisibleNote || c.internalNote ? (
                          <span
                            className="text-xs text-slate-600 truncate block"
                            title={c.note || c.internalNote || c.studentVisibleNote || ''}
                          >
                            {c.note || c.internalNote || c.studentVisibleNote}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {formatDateTime(c.nextFollowUpAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-600">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <footer className="mt-auto py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        ALO Education CRM · Phone Call Center ·{' '}
        <span className="text-[#0057B8] font-semibold">Counselor Workspace</span>
      </footer>
    </div>
  );
}
