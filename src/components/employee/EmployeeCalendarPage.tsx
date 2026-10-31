'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, Clock,
  List, LayoutGrid, MapPin, AlertTriangle, RefreshCw, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// Types — mirror GET /api/employee/appointments
// ============================================================

interface Appointment {
  id: string;
  studentId: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  meetLink: string;
  notes: string;
  createdAt: string;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  counseling: { color: 'text-[var(--alo-brand)]', bg: 'bg-[var(--alo-brand-pale)]', border: 'border-[var(--alo-border)]', dot: 'bg-[var(--alo-brand)]' },
  follow_up: { color: 'text-crm-warning-text', bg: 'bg-crm-warning-bg', border: 'border-crm-warning-border', dot: 'bg-[var(--alo-warning)]' },
  interview: { color: 'text-[var(--alo-brand)]', bg: 'bg-[var(--alo-brand-pale)]', border: 'border-[var(--alo-border)]', dot: 'bg-[var(--alo-brand)]' },
  meeting: { color: 'text-crm-success-text', bg: 'bg-crm-success-bg', border: 'border-crm-success-border', dot: 'bg-[var(--alo-success)]' },
  visa_interview: { color: 'text-[var(--alo-brand)]', bg: 'bg-[var(--alo-brand-pale)]', border: 'border-[var(--alo-border)]', dot: 'bg-[var(--alo-brand)]' },
};

const DEFAULT_STYLE = {
  color: 'text-[var(--alo-body)]',
  bg: 'bg-[var(--alo-page)]',
  border: 'border-[var(--alo-border)]',
  dot: 'bg-[var(--alo-page)]',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function styleFor(type: string) {
  return TYPE_CONFIG[(type || '').toLowerCase()] || DEFAULT_STYLE;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function dateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function EmployeeCalendarPage() {
  const { setView } = usePortalStore();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [state, setState] = useState<LoadState>({ loading: true, error: null });

  const [currentDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState({
    title: '',
    studentId: '',
    type: 'counseling',
    scheduledAt: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const response = await fetch('/api/employee/appointments');
      if (!response.ok) throw new Error(`Could not load appointments (HTTP ${response.status})`);
      const payload = await response.json();
      if (payload?.success === false) throw new Error(payload?.error || 'Appointments are unavailable');
      setAppointments(Array.isArray(payload?.appointments) ? payload.appointments : []);
      setState({ loading: false, error: null });
    } catch (error) {
      setAppointments([]);
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load appointments',
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const todayKey = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const d = currentDate.getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }, [currentDate]);

  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((appointment) => {
      const key = dateKey(appointment.scheduledAt);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(appointment);
    });
    return map;
  }, [appointments]);

  const monthAppointments = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    return appointments
      .filter((appointment) => dateKey(appointment.scheduledAt).startsWith(prefix))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [appointments, viewYear, viewMonth]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((appointment) => {
        const time = new Date(appointment.scheduledAt).getTime();
        return !Number.isNaN(time) && time >= now;
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 8);
  }, [appointments]);

  const monthLabel = useMemo(
    () => new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [viewYear, viewMonth],
  );

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

  const changeMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const createAppointment = async () => {
    if (!form.title.trim()) {
      setSaveError('Give the appointment a title.');
      return;
    }
    if (!form.studentId.trim()) {
      setSaveError('Enter an assigned student ID.');
      return;
    }
    if (!form.scheduledAt) {
      setSaveError('Choose the date and time for the appointment.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/employee/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          studentId: form.studentId.trim(),
          purpose: form.type,
          venue: form.notes.trim() || undefined,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        setSaveError(payload?.error || `Could not create the appointment (HTTP ${response.status})`);
        return;
      }
      setShowAddDialog(false);
      setForm({ title: '', studentId: '', type: 'counseling', scheduledAt: '', notes: '' });
      await load();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not create the appointment');
    } finally {
      setSaving(false);
    }
  };

  const cells: Array<{ dateStr: string; day: number; inMonth: boolean }> = [];
  for (let i = firstDay - 1; i >= 0; i -= 1) {
    const day = prevMonthDays - i;
    const prevMonth = viewMonth === 0 ? 12 : viewMonth;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({
      dateStr: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
      inMonth: false,
    });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      dateStr: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
      inMonth: true,
    });
  }

  return (
    <div className="min-h-screen space-y-6 bg-alo-page p-4 lg:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-alo-text flex items-center gap-2 text-2xl font-bold">
            <CalendarDays className="text-alo-brand h-6 w-6" />
            Calendar
          </h1>
          <p className="text-alo-text-muted mt-1 text-sm">
            Appointments on record, and the ones you schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'month' ? 'list' : 'month')}
          >
            {viewMode === 'month' ? (
              <><List className="mr-1 h-4 w-4" /> List view</>
            ) : (
              <><LayoutGrid className="mr-1 h-4 w-4" /> Month view</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className={`mr-1 h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Schedule appointment
          </Button>
        </div>
      </div>

      {state.error && (
        <Card className="border-crm-danger-border bg-crm-danger-bg">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-crm-danger-text">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{state.error}</p>
              <button
                type="button"
                className="mt-1 underline underline-offset-2"
                onClick={() => void load()}
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* ── Calendar ── */}
        <div className="space-y-4 lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">{monthLabel}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-alo-text-muted text-xs">
                {monthAppointments.length} appointment{monthAppointments.length === 1 ? '' : 's'}
              </span>
            </CardHeader>

            <CardContent>
              {state.loading ? (
                <p className="text-alo-text-muted py-12 text-center text-sm">
                  Loading appointments…
                </p>
              ) : viewMode === 'month' ? (
                <div>
                  <div className="mb-1 grid grid-cols-7 gap-1">
                    {DAYS.map((day) => (
                      <div key={day} className="text-alo-text-muted text-center text-xs font-medium">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((cell) => {
                      const dayAppointments = byDate[cell.dateStr] || [];
                      const isToday = cell.dateStr === todayKey;
                      return (
                        <button
                          key={cell.dateStr}
                          type="button"
                          onClick={() => setSelectedDate(cell.dateStr)}
                          className={cn(
                            'min-h-[76px] rounded-lg border p-1.5 text-left transition-colors',
                            cell.inMonth ? 'bg-white' : 'bg-[var(--alo-page)]/60',
                            selectedDate === cell.dateStr ? 'border-alo-brand' : 'border-alo-border',
                            isToday && 'ring-1 ring-alo-brand',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                'text-xs font-semibold',
                                cell.inMonth ? 'text-alo-text' : 'text-alo-text-muted',
                              )}
                            >
                              {cell.day}
                            </span>
                            {isToday ? (
                              <span className="text-[11px] font-medium text-alo-brand">Today</span>
                            ) : null}
                          </div>
                          <div className="mt-1 space-y-1">
                            {dayAppointments.slice(0, 2).map((appointment) => {
                              const style = styleFor(appointment.type);
                              return (
                                <div
                                  key={appointment.id}
                                  className={cn('truncate rounded px-1 py-0.5 text-[11px]', style.bg, style.color)}
                                >
                                  {formatTime(appointment.scheduledAt)} {appointment.title}
                                </div>
                              );
                            })}
                            {dayAppointments.length > 2 ? (
                              <div className="text-alo-text-muted text-[11px]">
                                +{dayAppointments.length - 2} more
                              </div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {monthAppointments.length === 0 ? (
                    <p className="text-alo-text-muted py-10 text-center text-sm">
                      No appointment is scheduled in {monthLabel}.
                    </p>
                  ) : (
                    monthAppointments.map((appointment) => {
                      const style = styleFor(appointment.type);
                      return (
                        <div
                          key={appointment.id}
                          className={cn('rounded-lg border p-3', style.border, style.bg)}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className={cn('text-sm font-medium', style.color)}>
                              {appointment.title}
                            </p>
                            <Badge variant="outline" className="text-[11px]">
                              {(appointment.status || 'unknown').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-alo-text-muted mt-1 flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(appointment.scheduledAt)}
                            {appointment.studentId ? ` · Student ${appointment.studentId}` : ''}
                          </p>
                          {appointment.notes ? (
                            <p className="text-alo-text-muted mt-1 text-xs">{appointment.notes}</p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Selected day ── */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedDate}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(byDate[selectedDate] || []).length === 0 ? (
                  <p className="text-alo-text-muted py-6 text-center text-sm">
                    No appointment on this day.
                  </p>
                ) : (
                  (byDate[selectedDate] || []).map((appointment) => {
                    const style = styleFor(appointment.type);
                    return (
                      <div
                        key={appointment.id}
                        className={cn('rounded-lg border p-3', style.border, style.bg)}
                      >
                        <p className={cn('text-sm font-medium', style.color)}>{appointment.title}</p>
                        <p className="text-alo-text-muted mt-1 text-xs">
                          {formatTime(appointment.scheduledAt)} · {(appointment.type || '').replace(/_/g, ' ')}
                          {appointment.studentId ? ` · Student ${appointment.studentId}` : ''}
                        </p>
                        {appointment.notes ? (
                          <p className="text-alo-text-muted mt-1 text-xs">{appointment.notes}</p>
                        ) : null}
                        {appointment.meetLink ? (
                          <a
                            href={appointment.meetLink}
                            className="mt-1 inline-block text-xs underline underline-offset-2"
                          >
                            Join link
                          </a>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Upcoming ── */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[520px] pr-2">
                {upcoming.length === 0 ? (
                  <p className="text-alo-text-muted py-8 text-center text-sm">
                    {state.loading ? 'Loading…' : 'No upcoming appointment is scheduled.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((appointment) => {
                      const style = styleFor(appointment.type);
                      return (
                        <div
                          key={appointment.id}
                          className={cn('rounded-lg border p-3', style.border, style.bg)}
                        >
                          <p className={cn('text-sm font-medium', style.color)}>
                            {appointment.title}
                          </p>
                          <p className="text-alo-text-muted mt-1 flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(appointment.scheduledAt)}
                          </p>
                          <p className="text-alo-text-muted mt-0.5 flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            {appointment.notes || 'Venue not recorded'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="text-alo-text-muted flex items-start gap-2 p-4 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Only appointments that exist are shown; switching month never generates entries.
            Deadlines, team meetings and mock interviews are not listed unless an appointment
            record has been created for them.
          </span>
        </CardContent>
      </Card>

      {/* ── Add dialog ── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule an appointment</DialogTitle>
            <DialogDescription>
              Creates a real appointment record visible to the student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appt-title">Title</Label>
              <Input
                id="appt-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Counselling session"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appt-student">Assigned student ID</Label>
              <Input
                id="appt-student"
                value={form.studentId}
                onChange={(event) => setForm({ ...form, studentId: event.target.value })}
                placeholder="AE-2025000123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appt-when">Date and time</Label>
              <Input
                id="appt-when"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appt-type">Purpose</Label>
              <Input
                id="appt-type"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
                placeholder="counseling"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appt-notes">Venue or notes (optional)</Label>
              <Textarea
                id="appt-notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Dhaka office, room 2"
                rows={2}
              />
            </div>

            {saveError && <p className="text-destructive text-sm">{saveError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void createAppointment()} disabled={saving}>
              {saving ? 'Scheduling…' : 'Schedule appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
