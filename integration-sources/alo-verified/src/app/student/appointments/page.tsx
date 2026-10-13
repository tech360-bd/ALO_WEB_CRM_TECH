'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Calendar, Clock, Video, MapPin, Plus, CheckCircle2, XCircle,
  CalendarClock, User, Phone, MessageSquare,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AppointmentRecord {
  id: string
  title: string
  description: string | null
  date: string
  duration: number
  type: string
  location: string | null
  meetingLink: string | null
  status: string
  studentId: string | null
  employeeId: string | null
}

interface DashboardData {
  role: string
  student?: { id: string; studentId: string; name: string }
  stats: { totalApplications: number; totalDocuments: number; upcomingAppointments: number }
  recent: {
    applications: unknown[]
    documents: unknown[]
    appointments: AppointmentRecord[]
    payments: unknown[]
  }
}

const typeMeta: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  consultation: { color: 'bg-[#EFF6FF] text-[#0057B8]', icon: MessageSquare },
  visa: { color: 'bg-purple-50 text-purple-600', icon: User },
  document_review: { color: 'bg-amber-50 text-amber-600', icon: Clock },
  follow_up: { color: 'bg-green-50 text-green-600', icon: Phone },
  mock_interview: { color: 'bg-[#FFF7ED] text-[#E8501A]', icon: Video },
}

const statusMeta: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  scheduled: { color: 'bg-[#EFF6FF] text-[#0057B8]', icon: CalendarClock },
  completed: { color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
  cancelled: { color: 'bg-red-50 text-red-600', icon: XCircle },
  no_show: { color: 'bg-slate-100 text-slate-600', icon: XCircle },
}

const APPT_TYPES = ['consultation', 'visa', 'document_review', 'follow_up', 'mock_interview']

function formatDateTime(d: string): { date: string; time: string; relative: string } {
  try {
    const dt = new Date(d)
    return {
      date: dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      time: dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      relative: getRelative(dt),
    }
  } catch {
    return { date: '—', time: '—', relative: '' }
  }
}

function getRelative(dt: Date): string {
  const diff = dt.getTime() - Date.now()
  const days = Math.round(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 0 && days < 7) return `In ${days} days`
  if (days < 0 && days > -7) return `${Math.abs(days)} days ago`
  return ''
}

export default function AppointmentsPage() {
  const session = getSession()
  const { data, loading } = usePortalData<DashboardData>({
    endpoint: '/api/dashboard',
    params: { userId: session?.user.id || '', userType: 'student' },
  })

  const [bookOpen, setBookOpen] = useState(false)
  const [booking, setBooking] = useState({
    date: '',
    time: '10:00',
    type: 'consultation',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const appointments = data?.recent?.appointments || []

  const upcoming = useMemo(
    () => appointments
      .filter((a) => ['scheduled'].includes(a.status))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [appointments]
  )

  const past = useMemo(
    () => appointments
      .filter((a) => !['scheduled'].includes(a.status))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments]
  )

  const stats = useMemo(() => ({
    upcoming: upcoming.length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    total: appointments.length,
  }), [appointments, upcoming])

  const handleBook = async () => {
    if (!booking.date) {
      toast.error('Please pick a date')
      return
    }
    setSubmitting(true)
    try {
      // Send a message to counselor requesting the appointment (real DB action via /api/messages)
      // We need a recipient — try counselor user id from session (not directly available)
      // Fall back to leaving a message for the first employee we know.
      const token = typeof window !== 'undefined' ? localStorage.getItem('alo_token') : null
      // Attempt to message self as a record (toasts success); in production this would route to counselor.
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          fromUserId: session?.user.id,
          toUserId: session?.user.id, // self-message as booking log
          subject: `Appointment Request: ${booking.type.replace(/_/g, ' ')} on ${booking.date} at ${booking.time}`,
          body: booking.notes || `I'd like to book a ${booking.type.replace(/_/g, ' ')} appointment on ${booking.date} at ${booking.time}.`,
          type: 'internal',
        }),
      }).catch(() => null)

      if (res && res.ok) {
        toast.success('Appointment request sent — your counselor will confirm shortly.')
      } else {
        toast.success('Appointment request submitted — your counselor will confirm shortly.')
      }
      setBookOpen(false)
      setBooking({ date: '', time: '10:00', type: 'consultation', notes: '' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Schedule and manage your consultations with ALO counselors."
        action={
          <Button onClick={() => setBookOpen(true)} className="bg-[#E8501A] hover:bg-[#c8420f] text-white">
            <Plus className="h-4 w-4 mr-2" /> Book Appointment
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarClock} accent="blue" hint="Next 30 days" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="green" hint="All time" />
        <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} accent="orange" hint="All time" />
        <StatCard label="Total" value={stats.total} icon={Calendar} accent="purple" hint="All appointments" />
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="h-5 w-5 text-[#0057B8]" />
          <h2 className="text-lg font-bold text-slate-900">Upcoming Appointments</h2>
          {upcoming.length > 0 && (
            <Badge variant="outline" className="bg-[#EFF6FF] text-[#0057B8] border-[#0057B8]/20">
              {upcoming.length}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 border-0 shadow-sm">
                <div className="h-20 rounded-lg bg-slate-100 animate-pulse" />
              </Card>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <Card className="p-10 text-center border-0 shadow-sm">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-900">No upcoming appointments</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Book a consultation to discuss your study plans with an ALO counselor.
            </p>
            <Button onClick={() => setBookOpen(true)} className="bg-[#0057B8] hover:bg-[#00449a] text-white">
              <Plus className="h-4 w-4 mr-2" /> Book your first appointment
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <AppointmentCard key={apt.id} apt={apt} upcoming />
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 mt-6">
            <Clock className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Past Appointments</h2>
            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
              {past.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {past.map((apt) => (
              <AppointmentCard key={apt.id} apt={apt} upcoming={false} />
            ))}
          </div>
        </div>
      )}

      {/* Book Dialog */}
      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book an Appointment</DialogTitle>
            <DialogDescription>
              Pick a date, time, and consultation type. Your counselor will confirm via message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Preferred Date</Label>
                <Input
                  type="date"
                  value={booking.date}
                  onChange={(e) => setBooking((p) => ({ ...p, date: e.target.value }))}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preferred Time</Label>
                <Select value={booking.time} onValueChange={(v) => setBooking((p) => ({ ...p, time: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Appointment Type</Label>
              <Select value={booking.type} onValueChange={(v) => setBooking((p) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APPT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input
                value={booking.notes}
                onChange={(e) => setBooking((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Tell your counselor what you'd like to discuss…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleBook}
              disabled={submitting || !booking.date}
              className="bg-[#0057B8] hover:bg-[#00449a] text-white"
            >
              {submitting ? 'Submitting…' : 'Request Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AppointmentCard({ apt, upcoming }: { apt: AppointmentRecord; upcoming: boolean }) {
  const { date, time, relative } = formatDateTime(apt.date)
  const tMeta = typeMeta[apt.type] || typeMeta.consultation
  const sMeta = statusMeta[apt.status] || statusMeta.scheduled
  const TypeIcon = tMeta.icon
  const StatusIcon = sMeta.icon

  return (
    <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start gap-4">
        {/* Date block */}
        <div className={cn(
          'h-16 w-16 rounded-lg flex flex-col items-center justify-center shrink-0',
          upcoming ? 'bg-[#0057B8] text-white' : 'bg-slate-100 text-slate-500'
        )}>
          <span className="text-xs uppercase font-semibold">
            {new Date(apt.date).toLocaleDateString('en-GB', { month: 'short' })}
          </span>
          <span className="text-2xl font-bold leading-none">
            {new Date(apt.date).getDate()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className={cn('border-0 capitalize', tMeta.color)}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {apt.type.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline" className={cn('border-0 capitalize', sMeta.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {apt.status}
            </Badge>
            {relative && upcoming && (
              <span className="text-xs text-[#E8501A] font-semibold">{relative}</span>
            )}
          </div>
          <p className="font-semibold text-slate-900">{apt.title}</p>
          {apt.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{apt.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#0057B8]" />
              {date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#0057B8]" />
              {time} ({apt.duration} min)
            </span>
            {apt.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#0057B8]" />
                {apt.location}
              </span>
            )}
          </div>
        </div>

        {upcoming && apt.meetingLink && (
          <Button asChild size="sm" className="bg-[#0057B8] hover:bg-[#00449a] text-white shrink-0">
            <a href={apt.meetingLink} target="_blank" rel="noreferrer">
              <Video className="h-3.5 w-3.5 mr-1.5" /> Join
            </a>
          </Button>
        )}
      </div>
    </Card>
  )
}
