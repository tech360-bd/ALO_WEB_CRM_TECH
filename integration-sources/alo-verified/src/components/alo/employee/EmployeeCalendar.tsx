'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock,
  MapPin, User, Video, Phone, CheckCircle2
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  type: string
  description?: string
  location?: string
  attendeeName?: string
  status?: string
}

const eventTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  appointment: { bg: 'bg-[#0066CC]/10', border: 'border-[#0066CC]/30', text: 'text-[#0066CC]' },
  task: { bg: 'bg-[#F37021]/10', border: 'border-[#F37021]/30', text: 'text-[#F37021]' },
  follow_up: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
  meeting: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
  deadline: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
}

const mockEvents: CalendarEvent[] = [
  { id: '1', title: 'Counseling - Ahmed Rahman', date: getDateString(0), startTime: '09:00', endTime: '10:00', type: 'appointment', description: 'Initial counseling session for UK university applications.', location: 'Office - Room 201', attendeeName: 'Ahmed Rahman', status: 'confirmed' },
  { id: '2', title: 'Follow up - Sarah Khan', date: getDateString(0), startTime: '11:00', endTime: '11:30', type: 'follow_up', description: 'Follow up on IELTS score submission.', attendeeName: 'Sarah Khan', status: 'pending' },
  { id: '3', title: 'Team Meeting', date: getDateString(0), startTime: '14:00', endTime: '15:00', type: 'meeting', description: 'Weekly team sync - application updates.', location: 'Conference Room A', status: 'confirmed' },
  { id: '4', title: 'Visa docs review - Nusrat', date: getDateString(1), startTime: '10:00', endTime: '11:00', type: 'task', description: 'Review visa application documents for Nusrat Jahan.', attendeeName: 'Nusrat Jahan', status: 'confirmed' },
  { id: '5', title: 'Application deadline - Leeds', date: getDateString(1), startTime: '23:59', endTime: '23:59', type: 'deadline', description: 'University of Leeds application deadline for Rahim Uddin.', status: 'urgent' },
  { id: '6', title: 'Video call - Sakib Hasan', date: getDateString(2), startTime: '15:00', endTime: '16:00', type: 'appointment', description: 'Online counseling session via Zoom.', location: 'Zoom', attendeeName: 'Sakib Hasan', status: 'confirmed' },
  { id: '7', title: 'Follow up - Amina Begum', date: getDateString(3), startTime: '09:30', endTime: '10:00', type: 'follow_up', attendeeName: 'Amina Begum', status: 'pending' },
  { id: '8', title: 'Partner meeting - EduBridge', date: getDateString(5), startTime: '14:00', endTime: '15:30', type: 'meeting', description: 'Quarterly review with EduBridge partner.', location: 'Office - Board Room', status: 'confirmed' },
  { id: '9', title: 'Counseling - New Lead', date: getDateString(-1), startTime: '10:00', endTime: '11:00', type: 'appointment', attendeeName: 'New Lead', status: 'completed' },
  { id: '10', title: 'Document collection task', date: getDateString(-2), startTime: '09:00', endTime: '17:00', type: 'task', description: 'Collect outstanding documents from 5 students.', status: 'completed' },
]

function getDateString(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function EmployeeCalendar() {
  const { currentUser } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(getDateString(0))
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', date: getDateString(0), startTime: '09:00', endTime: '10:00', type: 'appointment', description: '', location: '' })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: Array<{ date: number; month: number; year: number; isCurrentMonth: boolean; dateString: string }> = []

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const m = month === 0 ? 11 : month - 1
      const y = month === 0 ? year - 1 : year
      days.push({ date: d, month: m, year: y, isCurrentMonth: false, dateString: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: d, month, year, isCurrentMonth: true, dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    // Next month days
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1
      const y = month === 11 ? year + 1 : year
      days.push({ date: d, month: m, year: y, isCurrentMonth: false, dateString: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
    }

    return days
  }, [year, month])

  const getEventsForDate = (dateString: string) => {
    return mockEvents.filter(e => e.date === dateString)
  }

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const todayString = getDateString(0)

  const navigateMonth = (dir: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  const handleCreateEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error('Please enter event title')
      return
    }
    toast.success('Appointment created!')
    setShowCreateDialog(false)
    setNewEvent({ title: '', date: getDateString(0), startTime: '09:00', endTime: '10:00', type: 'appointment', description: '', location: '' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Manage appointments, tasks, and follow-ups</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(v) => setView(v as 'month' | 'week' | 'day')}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardContent className="p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-[#1A2332]">
                {MONTHS[month]} {year}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border border-gray-100 rounded-lg overflow-hidden">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDate(day.dateString)
                const isToday = day.dateString === todayString
                const isSelected = day.dateString === selectedDate
                return (
                  <button
                    key={idx}
                    className={`min-h-[80px] p-1 border border-gray-50 text-left transition-colors hover:bg-gray-50 ${
                      !day.isCurrentMonth ? 'opacity-40' : ''
                    } ${isSelected ? 'bg-[#F37021]/5 ring-1 ring-[#F37021]/30' : ''}`}
                    onClick={() => setSelectedDate(day.dateString)}
                  >
                    <span className={`text-xs inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday ? 'bg-[#F37021] text-white font-bold' : 'text-gray-700'
                    }`}>
                      {day.date}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 3).map(event => {
                        const ec = eventTypeColors[event.type] || eventTypeColors.task
                        return (
                          <div key={event.id} className={`text-[9px] px-1 py-0.5 rounded truncate ${ec.bg} ${ec.text}`}>
                            {event.startTime} {event.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-[9px] text-gray-400 px-1">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Events */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1A2332]">
              {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {selectedEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-10 w-10 mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No events for this day</p>
                <Button size="sm" className="mt-3 bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Event
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map(event => {
                  const ec = eventTypeColors[event.type] || eventTypeColors.task
                  return (
                    <button
                      key={event.id}
                      className={`w-full text-left p-3 rounded-lg border ${ec.border} ${ec.bg} hover:shadow-sm transition-shadow`}
                      onClick={() => { setSelectedEvent(event); setShowEventDialog(true) }}
                    >
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-semibold ${ec.text}`}>{event.title}</p>
                        <Badge className={`text-[9px] ${ec.bg} ${ec.text} border ${ec.border}`}>
                          {event.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {event.startTime} - {event.endTime}
                        </span>
                        {event.location && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.location}
                          </span>
                        )}
                      </div>
                      {event.attendeeName && (
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" /> {event.attendeeName}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Appointment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500">Title</Label>
              <Input className="mt-1" placeholder="Appointment title" value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Date</Label>
                <Input type="date" className="mt-1" value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Type</Label>
                <Select value={newEvent.type} onValueChange={(v) => setNewEvent(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Start Time</Label>
                <Input type="time" className="mt-1" value={newEvent.startTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">End Time</Label>
                <Input type="time" className="mt-1" value={newEvent.endTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Location</Label>
              <Input className="mt-1" placeholder="Office, Zoom, etc." value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Description</Label>
              <Input className="mt-1" placeholder="Optional notes..." value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateEvent} className="bg-[#F37021] hover:bg-[#F37021]/90 text-white">
                Create Appointment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#1A2332]">{selectedEvent.title}</h3>
                <Badge className={`text-xs mt-1 ${eventTypeColors[selectedEvent.type]?.bg || ''} ${eventTypeColors[selectedEvent.type]?.text || ''}`}>
                  {selectedEvent.type.replace('_', ' ')}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                  {' · '}
                  {selectedEvent.startTime} - {selectedEvent.endTime}
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {selectedEvent.location}
                  </div>
                )}
                {selectedEvent.attendeeName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    {selectedEvent.attendeeName}
                  </div>
                )}
              </div>
              {selectedEvent.description && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.status && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Status:</span>
                  <Badge className={`text-xs ${selectedEvent.status === 'confirmed' ? 'bg-green-50 text-green-700' : selectedEvent.status === 'completed' ? 'bg-blue-50 text-blue-700' : selectedEvent.status === 'urgent' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    {selectedEvent.status}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
