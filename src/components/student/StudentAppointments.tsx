'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plus,
  Calendar,
  Clock,
  Video,
  MapPin,
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Bell,
  FileText,
  MessageSquare,
  BookOpen,
  GraduationCap,
  Languages,
  Wallet,
  ClipboardCheck,
  Plane,
  Sparkles,
  Loader2,
} from 'lucide-react';

/* ================================================================== */
/*  TYPES                                                               */
/* ================================================================== */
type AppointmentType =
  | 'Free Consultation'
  | 'Document Review'
  | 'SOP/CV Review'
  | 'Visa Interview Practice'
  | 'Application Review'
  | 'English Test Discussion'
  | 'Financial Guidance';

type AppointmentMode = 'In-Person' | 'Online';

interface Appointment {
  id: string;
  type: string;
  date: string;
  time: string;
  mode: string;
  counselor: string;
  status: string;
  notes: string;
  meetingLink?: string;
  duration?: string;
}

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */
const APPOINTMENT_TYPES: AppointmentType[] = [
  'Free Consultation',
  'Document Review',
  'SOP/CV Review',
  'Visa Interview Practice',
  'Application Review',
  'English Test Discussion',
  'Financial Guidance',
];

const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */
function getTypeIcon(type: string) {
  switch (type) {
    case 'Free Consultation': return <MessageSquare className="size-4" />;
    case 'Document Review': return <FileText className="size-4" />;
    case 'SOP/CV Review': case 'sop_cv_review': return <ClipboardCheck className="size-4" />;
    case 'Visa Interview Practice': case 'visa_interview': return <Plane className="size-4" />;
    case 'Application Review': case 'application_review': return <GraduationCap className="size-4" />;
    case 'English Test Discussion': case 'english_test': return <Languages className="size-4" />;
    case 'Financial Guidance': return <Wallet className="size-4" />;
    default: return <BookOpen className="size-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'Free Consultation': return 'bg-alo-brand/10 text-alo-brand border-alo-brand/20';
    case 'Document Review': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30';
    case 'SOP/CV Review': case 'sop_cv_review': return 'bg-alo-cta/10 text-alo-cta border-alo-cta/20';
    case 'Visa Interview Practice': case 'visa_interview': return 'bg-crm-success-bg text-crm-success-text border-crm-success/20';
    case 'Application Review': case 'application_review': return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/30';
    case 'English Test Discussion': case 'english_test': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30';
    case 'Financial Guidance': return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800/30';
    default: return 'bg-muted text-alo-text-muted border-alo-border/50';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Confirmed': case 'confirmed': case 'upcoming': return 'bg-crm-success-bg text-crm-success-text border-crm-success/20';
    case 'Pending': case 'pending': return 'bg-crm-warning-bg text-crm-warning-text border-crm-warning/30';
    case 'Rescheduled': case 'rescheduled': return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/30';
    case 'Completed': case 'completed': case 'done': return 'bg-muted text-alo-text-muted border-alo-border/50';
    case 'Cancelled': case 'cancelled': case 'No-show': case 'no-show': return 'bg-crm-danger-bg text-crm-danger-text border-crm-danger/20';
    default: return 'bg-muted text-alo-text-muted border-alo-border/50';
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function toTitleCase(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
export default function StudentAppointments() {
  const token = usePortalStore(state => state.token);

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pastExpanded, setPastExpanded] = useState(false);

  const [formType, setFormType] = useState<AppointmentType | ''>('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formMode, setFormMode] = useState<AppointmentMode | ''>('');
  const [formNotes, setFormNotes] = useState('');

  const loadAppointments = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/student-portal/appointments?limit=50', { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAppointments(json.data.map((a: Record<string, unknown>) => ({
          id: a.id, type: a.type || a.title || '', date: a.date || '', time: a.time || '',
          mode: a.mode || 'Online', counselor: a.counselor || '', status: a.status || 'upcoming',
          notes: a.notes || '', duration: a.duration || '30 minutes', meetingLink: '',
        })));
      }
    } catch (error) { console.error('Failed to load appointments:', error); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  const resetForm = () => { setFormType(''); setFormDate(''); setFormTime(''); setFormMode(''); setFormNotes(''); };

  const handleBook = async () => {
    if (!formType || !formDate || !formTime || !formMode || !token) return;
    setSubmitting(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch('/api/student-portal/appointments', {
        method: 'POST', headers,
        body: JSON.stringify({ title: formType, type: formType.toLowerCase().replace(/\s+\//g, '_').replace(/\s+/g, '_'), date: formDate, time: formTime, duration: '30 minutes', mode: formMode, notes: formNotes }),
      });
      const json = await res.json();
      if (json.success) { setDialogOpen(false); resetForm(); loadAppointments(); }
      else { console.error('Failed to book:', json.error); }
    } catch (error) { console.error('Failed to book:', error); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (id: string) => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const res = await fetch('/api/student-portal/appointments', {
        method: 'PUT', headers, body: JSON.stringify({ id, status: 'cancelled' }),
      });
      const json = await res.json();
      if (json.success) loadAppointments(); else console.error('Cancel failed:', json.error);
    } catch (error) { console.error('Cancel failed:', error); }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a => a.date >= today && a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'done');
  const past = appointments.filter(a => a.date < today || a.status === 'completed' || a.status === 'done' || a.status === 'cancelled');

  if (loading) {
    return (<div className="space-y-6"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div><Skeleton className="h-48 rounded-xl" /></div>);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-alo-text sm:text-3xl">Appointments</h1>
          <p className="mt-1 text-sm text-alo-text-muted">{upcoming.length} upcoming appointment{upcoming.length !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button variant="cta" size="lg" className="gap-2"><Plus className="size-4" />Book New Appointment</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-alo-text">Book New Appointment</DialogTitle>
              <DialogDescription>Select your preferred appointment type, date, time, and mode.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-alo-text">Appointment Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as AppointmentType)}>
                  <SelectTrigger><SelectValue placeholder="Select appointment type" /></SelectTrigger>
                  <SelectContent>{APPOINTMENT_TYPES.map((type) => (<SelectItem key={type} value={type}><span className="flex items-center gap-2">{getTypeIcon(type)}{type}</span></SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label className="text-sm font-medium text-alo-text">Preferred Date</Label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} min={new Date().toISOString().split('T')[0]} /></div>
                <div className="space-y-2"><Label className="text-sm font-medium text-alo-text">Preferred Time</Label><Select value={formTime} onValueChange={setFormTime}><SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger><SelectContent>{TIME_SLOTS.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-alo-text">Mode</Label>
                <Select value={formMode} onValueChange={(v) => setFormMode(v as AppointmentMode)}>
                  <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-Person"><span className="flex items-center gap-2"><MapPin className="size-3.5" />In-Person</span></SelectItem>
                    <SelectItem value="Online"><span className="flex items-center gap-2"><Video className="size-3.5" />Online (Video Call)</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-sm font-medium text-alo-text">Notes</Label><Textarea placeholder="Briefly describe what you'd like to discuss" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} className="resize-none" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button variant="cta" onClick={handleBook} disabled={!formType || !formDate || !formTime || !formMode || submitting} className="gap-2">{submitting ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}Book Appointment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <section>
        <div className="mb-4 flex items-center gap-2"><div className="flex size-2 rounded-full bg-crm-success" /><h2 className="text-lg font-semibold text-alo-text">Upcoming Appointments</h2></div>
        {upcoming.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12"><Calendar className="mb-3 size-10 text-alo-text-muted/40" /><p className="text-sm font-medium text-alo-text-muted">No upcoming appointments</p><p className="mt-1 text-xs text-alo-text-muted">Book a new appointment to get started</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{upcoming.map((apt) => (<UpcomingAppointmentCard key={apt.id} appointment={apt} onCancel={() => handleCancel(apt.id)} />))}</div>
        )}
      </section>
      <section>
        <Collapsible open={pastExpanded} onOpenChange={setPastExpanded}>
          <CollapsibleTrigger asChild>
            <button className="mb-4 flex w-full items-center justify-between rounded-lg border border-alo-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-2">
                {pastExpanded ? <ChevronUp className="size-4 text-alo-text-muted" /> : <ChevronDown className="size-4 text-alo-text-muted" />}
                <h2 className="text-lg font-semibold text-alo-text">Past Appointments</h2>
                <Badge variant="muted" className="text-[10px]">{past.length}</Badge>
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card><CardContent className="p-0">
              <div className="hidden md:block">
                <Table><TableHeader><TableRow className="border-b-alo-border/60 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-alo-text-muted">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-alo-text-muted">Type</TableHead>
                  <TableHead className="text-xs font-semibold text-alo-text-muted">With</TableHead>
                  <TableHead className="text-xs font-semibold text-alo-text-muted">Duration</TableHead>
                  <TableHead className="text-xs font-semibold text-alo-text-muted">Notes</TableHead>
                  <TableHead className="text-xs font-semibold text-alo-text-muted">Status</TableHead>
                </TableRow></TableHeader><TableBody>
                  {past.map((apt) => (<TableRow key={apt.id} className="border-b-alo-border/40">
                    <TableCell className="whitespace-nowrap text-sm text-alo-text-secondary">{formatDate(apt.date)}</TableCell>
                    <TableCell><Badge className={cn('text-[10px]', getTypeColor(apt.type))}><span className="flex items-center gap-1">{getTypeIcon(apt.type)}{toTitleCase(apt.type)}</span></Badge></TableCell>
                    <TableCell className="text-sm text-alo-text">{apt.counselor || 'TBD'}</TableCell>
                    <TableCell className="text-sm text-alo-text-muted">{apt.duration}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-alo-text-muted">{apt.notes}</TableCell>
                    <TableCell><Badge className={cn('text-[10px]', getStatusColor(apt.status))}>{toTitleCase(apt.status)}</Badge></TableCell>
                  </TableRow>))}
                </TableBody></Table>
              </div>
              <div className="space-y-3 p-4 md:hidden">
                {past.map((apt) => (<div key={apt.id} className="rounded-lg border border-alo-border/50 p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div><Badge className={cn('text-[10px]', getTypeColor(apt.type))}><span className="flex items-center gap-1">{getTypeIcon(apt.type)}{toTitleCase(apt.type)}</span></Badge><p className="mt-1.5 text-sm font-medium text-alo-text">{formatDate(apt.date)}</p></div>
                    <Badge className={cn('text-[10px]', getStatusColor(apt.status))}>{toTitleCase(apt.status)}</Badge>
                  </div>
                  <p className="text-xs text-alo-text-muted line-clamp-2">{apt.notes}</p>
                  <div className="flex items-center gap-4 text-xs text-alo-text-muted">
                    <span className="flex items-center gap-1"><User className="size-3" />{apt.counselor || 'TBD'}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" />{apt.duration}</span>
                  </div>
                </div>))}
              </div>
            </CardContent></Card>
          </CollapsibleContent>
        </Collapsible>
      </section>
      <Card className="bg-gradient-to-r from-alo-brand-light to-white border-alo-brand/20">
        <CardContent className="flex flex-col items-start gap-3 py-5 sm:flex-row sm:items-center">
          <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-alo-brand/10"><Sparkles className="size-5 text-alo-brand" /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-alo-text">Pro Tip</p>
            <p className="text-xs text-alo-text-muted">Prepare your documents and questions before your appointment to make the most of your time with your counselor.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UpcomingAppointmentCard({ appointment, onCancel }: { appointment: Appointment; onCancel: () => void }) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <div className="h-1 w-full bg-gradient-to-r from-alo-brand to-alo-brand/40" />
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between">
          <Badge className={cn('text-xs', getTypeColor(appointment.type))}><span className="flex items-center gap-1.5">{getTypeIcon(appointment.type)}{toTitleCase(appointment.type)}</span></Badge>
          <Badge className={cn('text-[10px]', getStatusColor(appointment.status))}>{(appointment.status === 'Confirmed' || appointment.status === 'upcoming') && <CheckCircle2 className="size-3" />}{toTitleCase(appointment.status)}</Badge>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-2xl font-bold text-alo-text"><Calendar className="size-5 text-alo-brand" />{formatDate(appointment.date)}</div>
          <div className="flex items-center gap-2 text-sm text-alo-text-secondary"><Clock className="size-4 text-alo-text-muted" />{appointment.time}{appointment.duration && <span className="text-alo-text-muted">&middot; {appointment.duration}</span>}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-alo-text-secondary">
            {appointment.mode === 'Online' ? <Video className="size-3.5 text-alo-brand" /> : <MapPin className="size-3.5 text-alo-cta" />}
            <Badge variant={appointment.mode === 'Online' ? 'brand' : 'cta'} className="text-[10px]">{appointment.mode}</Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-alo-text-secondary"><User className="size-3.5 text-alo-text-muted" /><span>with <span className="font-medium text-alo-text">{appointment.counselor || 'TBD'}</span></span></div>
        </div>
        {appointment.notes && <p className="text-xs leading-relaxed text-alo-text-muted">{appointment.notes}</p>}
        <Separator />
        <div className="flex items-center gap-2">
          {appointment.mode === 'Online' && appointment.meetingLink && (
            <Button variant="cta" size="sm" className="flex-1 gap-1.5" asChild><a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer"><Video className="size-3.5" />Join Meeting</a></Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5"><RefreshCw className="size-3.5" />Reschedule</Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-crm-danger hover:text-crm-danger hover:bg-crm-danger-bg" onClick={onCancel}><XCircle className="size-3.5" />Cancel</Button>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-alo-brand-light px-3 py-2"><Bell className="size-3.5 text-alo-brand" /><p className="text-[11px] text-alo-brand">You&apos;ll receive a reminder 1 hour before</p></div>
      </CardContent>
    </Card>
  );
}
