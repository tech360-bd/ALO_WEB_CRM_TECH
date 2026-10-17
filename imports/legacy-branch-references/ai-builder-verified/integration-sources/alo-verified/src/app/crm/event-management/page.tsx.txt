'use client'

import { useState } from 'react'
import {
  Plus,
  Calendar,
  Video,
  MapPin,
  Users,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  LayoutGrid,
  List,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EventItem {
  id: string
  title: string
  slug: string
  description: string | null
  date: string
  endTime: string | null
  location: string | null
  meetingLink: string | null
  type: string
  bannerUrl: string | null
  status: string
  createdAt: string
  registered: number
}

const typeColors: Record<string, string> = {
  webinar: 'bg-blue-50 text-[#0057B8] border-blue-100',
  seminar: 'bg-purple-50 text-purple-600 border-purple-100',
  workshop: 'bg-amber-50 text-amber-600 border-amber-100',
  fair: 'bg-green-50 text-green-600 border-green-100',
  info_session: 'bg-orange-50 text-[#E8501A] border-orange-100',
}

const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-50 text-[#0057B8] border-blue-100',
  ongoing: 'bg-green-50 text-green-600 border-green-100',
  completed: 'bg-slate-100 text-slate-500 border-slate-200',
  cancelled: 'bg-red-50 text-red-600 border-red-100',
}

export default function EventManagementPage() {
  // Note: No /api/events route exists yet — events created in this session are local-only.
  // On the next API/backend wiring, swap to usePortalData<EventsResponse>({ endpoint: '/api/events' })
  const [events, setEvents] = useState<EventItem[]>([])
  const [view, setView] = useState<'grid' | 'calendar'>('grid')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'webinar', date: '', location: '', meetingLink: '', description: '' })

  const upcoming = events.filter((e) => e.status === 'upcoming').length
  const completed = events.filter((e) => e.status === 'completed').length
  const total = events.length
  const webinars = events.filter((e) => e.type === 'webinar').length

  const handleCreate = () => {
    if (!form.title || !form.date) {
      toast.error('Title and date are required')
      return
    }
    const newEvent: EventItem = {
      id: `evt-${Date.now()}`,
      title: form.title,
      slug: form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: form.description || null,
      date: new Date(form.date).toISOString(),
      endTime: null,
      location: form.location || null,
      meetingLink: form.meetingLink || null,
      type: form.type,
      bannerUrl: null,
      status: new Date(form.date) > new Date() ? 'upcoming' : 'completed',
      createdAt: new Date().toISOString(),
      registered: 0,
    }
    setEvents([newEvent, ...events])
    setAddOpen(false)
    setForm({ title: '', type: 'webinar', date: '', location: '', meetingLink: '', description: '' })
    toast.success('Event created (local session — wire up /api/events to persist)')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Management"
        description="Webinars, education fairs, workshops, and info sessions — schedule and track registrations."
        action={
          <div className="flex gap-2">
            <div className="flex border border-slate-200 rounded-md p-0.5 bg-white">
              <Button size="sm" variant={view === 'grid' ? 'default' : 'ghost'} className={cn('h-8', view === 'grid' && 'bg-[#0057B8] hover:bg-[#00449a] text-white')} onClick={() => setView('grid')}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant={view === 'calendar' ? 'default' : 'ghost'} className={cn('h-8', view === 'calendar' && 'bg-[#0057B8] hover:bg-[#00449a] text-white')} onClick={() => setView('calendar')}>
                <Calendar className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white">
                  <Plus className="h-4 w-4 mr-2" /> Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Event Title *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webinar">Webinar</SelectItem>
                        <SelectItem value="seminar">Seminar</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="fair">Education Fair</SelectItem>
                        <SelectItem value="info_session">Info Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date & Time *</Label>
                    <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Location</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Physical venue" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Meeting Link</Label>
                    <Input value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet..." />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Description</Label>
                    <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={handleCreate}>Create Event</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Events" value={total} icon={Calendar} accent="blue" />
        <StatCard label="Upcoming" value={upcoming} icon={Clock} accent="amber" />
        <StatCard label="Webinars" value={webinars} icon={Video} accent="purple" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} accent="green" />
      </div>

      {events.length === 0 ? (
        <Card className="p-12 border-0 shadow-sm text-center">
          <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-7 w-7 text-[#0057B8]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No events scheduled</h3>
          <p className="text-sm text-slate-500 mb-5">Plan your next webinar, fair, or workshop. Events created in this session are local — wire up the /api/events endpoint to persist them.</p>
          <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Event
          </Button>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e) => (
            <Card key={e.id} className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-24 bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center">
                <Calendar className="h-10 w-10 text-white/80" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={cn('border text-xs capitalize', typeColors[e.type] || 'bg-slate-100 text-slate-600 border-slate-200')}>{e.type.replace(/_/g, ' ')}</Badge>
                  <Badge className={cn('border text-xs capitalize', statusColors[e.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>{e.status}</Badge>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">{e.title}</h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{e.description || 'No description provided.'}</p>
                <div className="space-y-1 text-xs text-slate-600">
                  <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(e.date).toLocaleString()}</p>
                  {e.location && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</p>}
                  {e.meetingLink && <p className="flex items-center gap-1"><Video className="h-3 w-3" /> Virtual event</p>}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500 flex items-center gap-1"><Users className="h-3 w-3" /> {e.registered} registered</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => toast.info(`View ${e.title}`)}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info('Edit event')}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => setEvents(events.filter((x) => x.id !== e.id))}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-[#0057B8]" />
            <h3 className="font-bold text-slate-900">Calendar View</h3>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs text-slate-500 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center font-semibold py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 2
              const date = new Date()
              date.setDate(date.getDate() + day)
              const dayEvents = events.filter((e) => new Date(e.date).toDateString() === date.toDateString())
              return (
                <div key={i} className={cn('min-h-[80px] rounded-md border p-1.5 text-[10px]', day < 0 ? 'border-slate-100 bg-slate-50/50 text-slate-300' : 'border-slate-200')}>
                  <p className={cn('font-semibold', day < 0 ? 'text-slate-300' : 'text-slate-700')}>{date.getDate()}</p>
                  {dayEvents.map((e) => (
                    <div key={e.id} className="mt-1 p-1 rounded bg-[#0057B8] text-white truncate" title={e.title}>{e.title}</div>
                  ))}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
