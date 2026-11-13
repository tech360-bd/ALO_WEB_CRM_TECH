'use client';

/**
 * Student appointments — /student/appointments
 *
 * Reads GET /api/student-portal/appointments and creates bookings through the
 * matching POST. Slots are only shown as available when the API says so; the
 * page never fabricates counselor availability.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock3, Plus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  PortalCard, PortalEmpty, PortalError, PortalLoading, PortalPageHeader,
  StatusBadge, useStudentResource,
} from '@/components/student/portal-section';

interface Appointment {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  status: string;
  counselor: string;
  notes: string;
  createdAt: string;
}

interface AppointmentsResponse {
  success: boolean;
  data: Appointment[];
  total: number;
  page: number;
  totalPages: number;
}

const TYPE_LABELS: Record<string, string> = {
  counseling: 'Counseling session',
  consultation: 'Consultation',
  visa: 'Visa advice',
  documents: 'Document review',
  follow_up: 'Follow-up call',
};

const TYPE_OPTIONS = ['counseling', 'visa', 'documents', 'follow_up'] as const;

export default function StudentAppointmentsPage() {
  const { data, state, error, reload } = useStudentResource<AppointmentsResponse>(
    '/api/student-portal/appointments?limit=100',
  );
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'counseling', date: '', time: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const appointments = data?.data ?? [];
  const upcoming = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'upcoming' || appointment.status === 'scheduled'),
    [appointments],
  );
  const past = useMemo(
    () => appointments.filter((appointment) => appointment.status !== 'upcoming' && appointment.status !== 'scheduled'),
    [appointments],
  );

  async function book(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (!form.date) {
      setSubmitError('Choose a preferred date.');
      return;
    }
    if (!form.time) {
      setSubmitError('Choose a preferred time.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/student-portal/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim() || TYPE_LABELS[form.type] || 'Consultation',
          type: form.type,
          date: form.date,
          time: form.time,
          notes: form.notes,
          status: 'pending',
        }),
      });
      if (!response.ok) throw new Error('Could not send that request');
      setBooking(false);
      setForm({ title: '', type: 'counseling', date: '', time: '', notes: '' });
      await reload();
    } catch (bookError) {
      setSubmitError(bookError instanceof Error ? bookError.message : 'Something went wrong sending that request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <PortalPageHeader
          title="Appointments"
          description="Your consultations and follow-up sessions with your counselor."
          action={
            <Button
 type="button"
 className=" rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-white hover:bg-[var(--alo-cta)]"
 onClick={() => setBooking((value) => !value)}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              {booking ? 'Cancel' : 'Request Appointment'}
            </Button>
          }
        />

        {booking && (
          <PortalCard className="mb-6" title="Request an appointment" description="We confirm the slot before it is booked">
            <form className="space-y-3 px-5 py-4" onSubmit={book}>
              <div className="space-y-1.5">
                <Label htmlFor="apt-type" className="text-[12px] font-semibold text-[var(--alo-body)]">What do you need?</Label>
                <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}>
                  <SelectTrigger id="apt-type" className="h-9 rounded-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{TYPE_LABELS[option]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="apt-title" className="text-[12px] font-semibold text-[var(--alo-body)]">
                  Topic (optional)
                </Label>
                <Input
                  id="apt-title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. Choosing between two offers"
                  className="h-9 rounded-input"
                  maxLength={191}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="apt-date" className="text-[12px] font-semibold text-[var(--alo-body)]">Preferred date</Label>
                  <Input
                    id="apt-date"
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                    className="h-9 rounded-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apt-time" className="text-[12px] font-semibold text-[var(--alo-body)]">Preferred time</Label>
                  <Input
                    id="apt-time"
                    type="time"
                    value={form.time}
                    onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
                    className="h-9 rounded-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="apt-notes" className="text-[12px] font-semibold text-[var(--alo-body)]">
                  Anything we should prepare? (optional)
                </Label>
                <Textarea
                  id="apt-notes"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Questions you want to cover"
                  className="min-h-20 rounded-input text-[13px]"
                />
              </div>

              {submitError && (
                <p className="rounded-input border border-crm-danger-border bg-crm-danger-bg px-3 py-2 text-[12px] text-crm-danger-text" role="alert">
                  {submitError}
                </p>
              )}

              <div className="flex gap-2">
                <Button
 type="submit"
 disabled={submitting}
 className=" rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-white hover:bg-[var(--alo-cta)]"
 >
                  {submitting ? 'Sending…' : 'Send Request'}
                </Button>
                <Button
 type="button"
 variant="outline"
 className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold"
 onClick={() => setBooking(false)}
                >
                  Cancel
                </Button>
              </div>

              <p className="text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
                This sends a request. Your counselor confirms the date and time, and the confirmed slot then appears
                below.
              </p>
            </form>
          </PortalCard>
        )}

        {state === 'loading' && <PortalLoading label="Loading your appointments…" />}

        {state === 'error' && <PortalError message={error ?? 'Your appointments could not be loaded.'} onRetry={reload} />}

        {state === 'ready' && appointments.length === 0 && !booking && (
          <PortalCard>
            <PortalEmpty
              title="No appointments yet"
              description="Request a consultation and your counselor will confirm a time."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
 type="button"
 className=" rounded-button bg-alo-cta px-4 text-[13px] font-semibold text-white hover:bg-[var(--alo-cta)]"
 onClick={() => setBooking(true)}
                  >
                    Request Appointment
                  </Button>
                  <Button asChild variant="outline" className=" rounded-button border-[var(--alo-border)] px-4 text-[13px] font-semibold">
                    <Link href="/student/messages">Message Instead</Link>
                  </Button>
                </div>
              }
            />
          </PortalCard>
        )}

        {state === 'ready' && appointments.length > 0 && (
          <div className="space-y-5">
            {upcoming.length > 0 && (
              <PortalCard title="Upcoming" description={`${upcoming.length} scheduled`}>
                <ul className="divide-y divide-[var(--alo-border)]">
                  {upcoming.map((appointment) => (
                    <li key={appointment.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-alo-brand/10 text-alo-brand">
                        <CalendarDays className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[var(--alo-text)]">
                          {appointment.title || TYPE_LABELS[appointment.type] || 'Appointment'}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--alo-text-muted)]">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                            {appointment.date || 'Date to confirm'}{appointment.time ? ` at ${appointment.time}` : ''}
                          </span>
                          {appointment.duration && <span>{appointment.duration}</span>}
                          {appointment.counselor && (
                            <span className="inline-flex items-center gap-1">
                              <Video className="h-3.5 w-3.5" aria-hidden="true" />
                              {appointment.counselor}
                            </span>
                          )}
                        </p>
                        {appointment.notes && (
                          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--alo-body)]">{appointment.notes}</p>
                        )}
                      </div>
                      <StatusBadge value={appointment.status} />
                    </li>
                  ))}
                </ul>
              </PortalCard>
            )}

            {past.length > 0 && (
              <PortalCard title="Past appointments" description={`${past.length} completed or cancelled`}>
                <ul className="divide-y divide-[var(--alo-border)]">
                  {past.map((appointment) => (
                    <li key={appointment.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[var(--alo-body)]">
                          {appointment.title || TYPE_LABELS[appointment.type] || 'Appointment'}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[var(--alo-text-muted)]">
                          {appointment.date || 'No date recorded'}{appointment.time ? ` at ${appointment.time}` : ''}
                          {appointment.counselor ? ` · ${appointment.counselor}` : ''}
                        </p>
                      </div>
                      <StatusBadge value={appointment.status} />
                    </li>
                  ))}
                </ul>
              </PortalCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
