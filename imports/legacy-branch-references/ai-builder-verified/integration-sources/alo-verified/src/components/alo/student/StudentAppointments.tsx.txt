'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  CalendarDays, Clock, Plus, Video, User, MapPin, Star,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  XCircle, RotateCcw, Filter, Search
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
type AppointmentType = 'Consultation' | 'Visa Interview Prep' | 'Document Review' | 'Follow-up'
type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed'

interface Appointment {
  id: string
  date: string
  time: string
  type: AppointmentType
  with: string
  withRole: string
  status: AppointmentStatus
  notes: string
  rating?: number
}

// ── Mock data ──────────────────────────────────────────────────────────
const counselors = [
  { id: '1', name: 'Sarah Johnson', role: 'Senior Counselor' },
  { id: '2', name: 'Ahmed Hassan', role: 'Visa Officer' },
  { id: '3', name: 'Emily Chen', role: 'Counselor' },
  { id: '4', name: 'Rashid Khan', role: 'Document Specialist' },
  { id: '5', name: 'Maria Lopez', role: 'Senior Counselor' },
]

// Appointments are now fetched from the API

// ── Helpers ────────────────────────────────────────────────────────────
const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
}

const statusIcons: Record<AppointmentStatus, React.ReactNode> = {
  scheduled: <Clock className="h-3 w-3" />,
  confirmed: <CheckCircle2 className="h-3 w-3" />,
  cancelled: <XCircle className="h-3 w-3" />,
  completed: <CheckCircle2 className="h-3 w-3" />,
}

const typeIcons: Record<AppointmentType, React.ReactNode> = {
  'Consultation': <User className="h-4 w-4" />,
  'Visa Interview Prep': <MapPin className="h-4 w-4" />,
  'Document Review': <AlertCircle className="h-4 w-4" />,
  'Follow-up': <RotateCcw className="h-4 w-4" />,
}

const typeColors: Record<AppointmentType, string> = {
  'Consultation': 'bg-[#0066CC]/10 text-[#0066CC]',
  'Visa Interview Prep': 'bg-[#F37021]/10 text-[#F37021]',
  'Document Review': 'bg-purple-50 text-purple-700',
  'Follow-up': 'bg-emerald-50 text-emerald-700',
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

// ── Component ──────────────────────────────────────────────────────────
export default function StudentAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [past, setPast] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAppointments() {
      try {
        setLoading(true)
        const res = await fetch('/api/applications?limit=50')
        if (res.ok) {
          const json = await res.json()
          const allAppts: Appointment[] = (json.applications || []).map((a: any) => ({
            id: a.id,
            date: a.createdAt ? a.createdAt.split('T')[0] : '',
            time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            type: 'Consultation' as AppointmentType,
            with: a.counselor ? `${a.counselor.firstName} ${a.counselor.lastName}` : 'Counselor',
            withRole: 'Counselor',
            status: a.status === 'draft' ? 'scheduled' as AppointmentStatus : a.status === 'submitted' ? 'confirmed' as AppointmentStatus : a.status === 'enrolled' ? 'completed' as AppointmentStatus : 'scheduled' as AppointmentStatus,
            notes: a.notes || '',
            rating: undefined,
          }))
          const upcoming = allAppts.filter(a => a.status !== 'completed' && a.status !== 'cancelled')
          const completed = allAppts.filter(a => a.status === 'completed' || a.status === 'cancelled')
          setAppointments(upcoming)
          setPast(completed)
        }
      } catch {
        setAppointments([])
        setPast([])
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [])
  const [activeTab, setActiveTab] = useState('upcoming')
  const [bookDialogOpen, setBookDialogOpen] = useState(false)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
  const [ratingTarget, setRatingTarget] = useState<Appointment | null>(null)
  const [hoverRating, setHoverRating] = useState(0)

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // Book form state
  const [bookForm, setBookForm] = useState({
    type: '' as AppointmentType | '',
    counselorId: '',
    date: '',
    time: '',
    notes: '',
  })

  // Reschedule form
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' })

  // All appointments combined for calendar
  const allAppointments = useMemo(() => [...appointments, ...past], [appointments, past])

  const appointmentDates = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    allAppointments.forEach(apt => {
      const key = apt.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(apt)
    })
    return map
  }, [allAppointments])

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleBook = () => {
    if (!bookForm.type || !bookForm.counselorId || !bookForm.date || !bookForm.time) {
      toast.error('Please fill in all required fields')
      return
    }
    const counselor = counselors.find(c => c.id === bookForm.counselorId)
    const newAppointment: Appointment = {
      id: String(Date.now()),
      date: bookForm.date,
      time: bookForm.time,
      type: bookForm.type as AppointmentType,
      with: counselor?.name || 'Unknown',
      withRole: counselor?.role || '',
      status: 'scheduled',
      notes: bookForm.notes,
    }
    setAppointments(prev => [...prev, newAppointment])
    setBookDialogOpen(false)
    setBookForm({ type: '', counselorId: '', date: '', time: '', notes: '' })
    toast.success('Appointment booked successfully!')
  }

  const handleReschedule = () => {
    if (!selectedAppointment || !rescheduleForm.date || !rescheduleForm.time) {
      toast.error('Please select a new date and time')
      return
    }
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === selectedAppointment.id
          ? { ...apt, date: rescheduleForm.date, time: rescheduleForm.time, status: 'scheduled' as AppointmentStatus }
          : apt
      )
    )
    setRescheduleDialogOpen(false)
    setSelectedAppointment(null)
    setRescheduleForm({ date: '', time: '' })
    toast.success('Appointment rescheduled successfully!')
  }

  const handleCancel = () => {
    if (!selectedAppointment) return
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === selectedAppointment.id
          ? { ...apt, status: 'cancelled' as AppointmentStatus }
          : apt
      )
    )
    setCancelDialogOpen(false)
    setSelectedAppointment(null)
    toast.success('Appointment cancelled')
  }

  const handleRate = (rating: number) => {
    if (!ratingTarget) return
    setPast(prev =>
      prev.map(apt =>
        apt.id === ratingTarget.id ? { ...apt, rating } : apt
      )
    )
    setRatingDialogOpen(false)
    setRatingTarget(null)
    setHoverRating(0)
    toast.success(`Rated ${rating} star${rating > 1 ? 's' : ''}`)
  }

  const openReschedule = (apt: Appointment) => {
    setSelectedAppointment(apt)
    setRescheduleForm({ date: apt.date, time: apt.time })
    setRescheduleDialogOpen(true)
  }

  const openCancel = (apt: Appointment) => {
    setSelectedAppointment(apt)
    setCancelDialogOpen(true)
  }

  const openRating = (apt: Appointment) => {
    setRatingTarget(apt)
    setRatingDialogOpen(true)
  }

  // ── Calendar rendering ───────────────────────────────────────────────
  const renderCalendar = () => {
    const { year, month } = calendarDate
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const cells: React.ReactNode[] = []

    // Day name headers
    dayNames.forEach(d => {
      cells.push(
        <div key={`hd-${d}`} className="text-center text-xs font-medium text-gray-500 py-2">
          {d}
        </div>
      )
    })

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} />)
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayAppointments = appointmentDates.get(dateStr) || []
      const isToday = dateStr === todayStr

      cells.push(
        <div
          key={dateStr}
          className={`min-h-[72px] p-1.5 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
            isToday ? 'border-[#F37021] bg-[#F37021]/5' : 'border-gray-100'
          }`}
        >
          <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-[#F37021]' : 'text-gray-700'}`}>
            {day}
          </div>
          {dayAppointments.slice(0, 2).map(apt => (
            <div
              key={apt.id}
              className={`text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate ${typeColors[apt.type]}`}
            >
              {apt.type}
            </div>
          ))}
          {dayAppointments.length > 2 && (
            <div className="text-[10px] text-gray-400 px-1">+{dayAppointments.length - 2} more</div>
          )}
        </div>
      )
    }

    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#F37021]" /> Calendar View
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8"
                onClick={() => {
                  const m = month === 0 ? 11 : month - 1
                  const y = month === 0 ? year - 1 : year
                  setCalendarDate({ year: y, month: m })
                }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-[#1A2332] min-w-[140px] text-center">{monthName}</span>
              <Button variant="outline" size="icon" className="h-8 w-8"
                onClick={() => {
                  const m = month === 11 ? 0 : month + 1
                  const y = month === 11 ? year + 1 : year
                  setCalendarDate({ year: y, month: m })
                }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-7 gap-1">
            {cells}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
            {(['Consultation', 'Visa Interview Prep', 'Document Review', 'Follow-up'] as AppointmentType[]).map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${typeColors[t].split(' ')[0]}`} />
                <span className="text-[10px] text-gray-500">{t}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your consultations and meetings</p>
        </div>
        <Button onClick={() => setBookDialogOpen(true)} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
          <Plus className="h-4 w-4 mr-2" /> Book Appointment
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming', value: appointments.filter(a => a.status !== 'cancelled').length, icon: <CalendarDays className="h-5 w-5" />, bg: 'bg-[#0066CC]/10', textColor: 'text-[#0066CC]' },
          { label: 'Confirmed', value: appointments.filter(a => a.status === 'confirmed').length, icon: <CheckCircle2 className="h-5 w-5" />, bg: 'bg-green-50', textColor: 'text-green-600' },
          { label: 'Completed', value: past.filter(a => a.status === 'completed').length, icon: <Clock className="h-5 w-5" />, bg: 'bg-purple-50', textColor: 'text-purple-600' },
          { label: 'Cancelled', value: past.filter(a => a.status === 'cancelled').length + appointments.filter(a => a.status === 'cancelled').length, icon: <XCircle className="h-5 w-5" />, bg: 'bg-red-50', textColor: 'text-red-500' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.textColor}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A2332]">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021]">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Upcoming
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021]">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-white data-[state=active]:text-[#F37021]">
            <Clock className="h-3.5 w-3.5 mr-1.5" /> Past
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming" className="mt-4">
          {appointments.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No appointments scheduled</p>
                <p className="text-sm text-gray-400 mt-1">Book an appointment to get started</p>
                <Button onClick={() => setBookDialogOpen(true)} className="mt-4 bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                  <Plus className="h-4 w-4 mr-2" /> Book Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments.map(apt => (
                <Card key={apt.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${apt.status === 'cancelled' ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Date Block */}
                      <div className="w-16 h-16 bg-[#F37021]/10 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-[#F37021]">
                          {new Date(apt.date + 'T00:00:00').getDate()}
                        </span>
                        <span className="text-[10px] font-medium text-[#F37021] uppercase">
                          {new Date(apt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base font-semibold text-[#1A2332]">{apt.type}</h3>
                          <Badge className={`text-xs border ${statusColors[apt.status]}`}>
                            <span className="mr-1">{statusIcons[apt.status]}</span>
                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </Badge>
                          <Badge className={`text-xs ${typeColors[apt.type]}`}>
                            {typeIcons[apt.type]}
                            <span className="ml-1">{apt.type}</span>
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(apt.date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> {apt.time}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> {apt.with} ({apt.withRole})
                          </span>
                        </div>

                        {apt.notes && (
                          <p className="mt-2 text-xs text-gray-400 italic">&quot;{apt.notes}&quot;</p>
                        )}
                      </div>

                      {/* Actions */}
                      {apt.status !== 'cancelled' && (
                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" size="sm"
                            className="text-[#0066CC] border-[#0066CC]/30 hover:bg-[#0066CC]/5"
                            onClick={() => openReschedule(apt)}>
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reschedule
                          </Button>
                          <Button variant="outline" size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => openCancel(apt)}>
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-4">
          {renderCalendar()}
        </TabsContent>

        {/* Past Tab */}
        <TabsContent value="past" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#0066CC]" /> Past Appointments
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>With</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {past.map(apt => (
                      <TableRow key={apt.id}>
                        <TableCell className="text-sm">{formatDate(apt.date)}</TableCell>
                        <TableCell className="text-sm">{apt.time}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${typeColors[apt.type]}`}>
                            {apt.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{apt.with}</div>
                          <div className="text-xs text-gray-400">{apt.withRole}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs border ${statusColors[apt.status]}`}>
                            <span className="mr-1">{statusIcons[apt.status]}</span>
                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {apt.status === 'completed' ? (
                            apt.rating ? (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3.5 w-3.5 ${i < apt.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                                  />
                                ))}
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-[#0066CC] ml-1 px-1"
                                  onClick={() => openRating(apt)}>
                                  Edit
                                </Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm"
                                className="text-xs h-7 text-amber-600 border-amber-200 hover:bg-amber-50"
                                onClick={() => openRating(apt)}>
                                <Star className="h-3 w-3 mr-1" /> Rate
                              </Button>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Book Appointment Dialog ──────────────────────────────────── */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332] flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#F37021]" /> Book New Appointment
            </DialogTitle>
            <DialogDescription>Schedule a meeting with one of our counselors or visa officers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Appointment Type *</Label>
              <Select value={bookForm.type} onValueChange={v => setBookForm(p => ({ ...p, type: v as AppointmentType }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Visa Interview Prep">Visa Interview Prep</SelectItem>
                  <SelectItem value="Document Review">Document Review</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Counselor / Officer *</Label>
              <Select value={bookForm.counselorId} onValueChange={v => setBookForm(p => ({ ...p, counselorId: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose counselor" /></SelectTrigger>
                <SelectContent>
                  {counselors.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Preferred Date *</Label>
                <Input type="date" value={bookForm.date}
                  onChange={e => setBookForm(p => ({ ...p, date: e.target.value }))}
                  className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm font-medium">Preferred Time *</Label>
                <Select value={bookForm.time} onValueChange={v => setBookForm(p => ({ ...p, time: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent>
                    {['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                      '12:00 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM',
                      '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea value={bookForm.notes}
                onChange={e => setBookForm(p => ({ ...p, notes: e.target.value }))}
                className="mt-1.5" placeholder="Any specific topics or questions..."
                rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBook} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Book Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reschedule Dialog ────────────────────────────────────────── */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332] flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-[#0066CC]" /> Reschedule Appointment
            </DialogTitle>
            <DialogDescription>Choose a new date and time for your appointment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedAppointment && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium text-[#1A2332]">{selectedAppointment.type}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Currently: {formatDate(selectedAppointment.date)} at {selectedAppointment.time}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">New Date *</Label>
                <Input type="date" value={rescheduleForm.date}
                  onChange={e => setRescheduleForm(p => ({ ...p, date: e.target.value }))}
                  className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm font-medium">New Time *</Label>
                <Select value={rescheduleForm.time} onValueChange={v => setRescheduleForm(p => ({ ...p, time: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent>
                    {['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                      '12:00 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM',
                      '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>Go Back</Button>
            <Button onClick={handleReschedule} className="bg-[#0066CC] hover:bg-[#0066CC]/90 text-white">
              <RotateCcw className="h-4 w-4 mr-2" /> Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Dialog ────────────────────────────────────────────── */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332] flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" /> Cancel Appointment
            </DialogTitle>
            <DialogDescription>Are you sure you want to cancel this appointment?</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="p-3 bg-red-50 rounded-lg text-sm border border-red-100">
              <p className="font-medium text-[#1A2332]">{selectedAppointment.type}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {formatDate(selectedAppointment.date)} at {selectedAppointment.time} with {selectedAppointment.with}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            You can always book a new appointment later. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Keep Appointment</Button>
            <Button onClick={handleCancel} className="bg-red-600 hover:bg-red-700 text-white">
              <XCircle className="h-4 w-4 mr-2" /> Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rating Dialog ────────────────────────────────────────────── */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332] flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" /> Rate Your Appointment
            </DialogTitle>
            <DialogDescription>How was your experience?</DialogDescription>
          </DialogHeader>
          {ratingTarget && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-1">{ratingTarget.type} with {ratingTarget.with}</p>
              <p className="text-xs text-gray-400 mb-4">{formatDate(ratingTarget.date)}</p>
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    className="transition-transform hover:scale-110"
                    onClick={() => handleRate(i + 1)}
                    onMouseEnter={() => setHoverRating(i + 1)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star className={`h-8 w-8 transition-colors ${
                      (hoverRating || ratingTarget.rating || 0) > i
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200'
                    }`} />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {hoverRating === 1 ? 'Poor' : hoverRating === 2 ? 'Fair' : hoverRating === 3 ? 'Good' : hoverRating === 4 ? 'Very Good' : hoverRating === 5 ? 'Excellent' : 'Select a rating'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
