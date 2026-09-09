'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, Clock,
  List, LayoutGrid, MapPin, User, Trash2, Edit,
} from 'lucide-react';

type EventType = 'Counseling' | 'Follow-up' | 'Deadline' | 'Meeting' | 'Interview';

interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  description: string;
  studentName?: string;
  duration: string;
}

const eventTypeConfig: Record<EventType, { color: string; bg: string; border: string; dot: string }> = {
  Counseling: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  'Follow-up': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  Deadline: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  Meeting: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Interview: { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500' },
};

function getEventsForMonth(year: number, month: number): CalendarEvent[] {
  const y = year;
  const m = month;
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = (day: number) => `${y}-${pad(m)}-${pad(day)}`;
  return [
    { id: 'e1', title: 'Counseling - Rahim Uddin', type: 'Counseling', date: d(3), time: '10:00 AM', description: 'Initial counseling session for UK MSc programs', studentName: 'Rahim Uddin', duration: '1h' },
    { id: 'e2', title: 'Follow-up - Fatima Akter', type: 'Follow-up', date: d(5), time: '2:00 PM', description: 'Check bank statement submission for Melbourne', studentName: 'Fatima Akter', duration: '30m' },
    { id: 'e3', title: 'Deadline - UK Jan Intake Apps', type: 'Deadline', date: d(8), time: '11:59 PM', description: 'Last day for January 2025 intake applications', duration: '—' },
    { id: 'e4', title: 'Meeting - Visa Team', type: 'Meeting', date: d(10), time: '11:00 AM', description: 'Weekly visa processing review meeting', duration: '1h' },
    { id: 'e5', title: 'Interview Prep - Nusrat', type: 'Interview', date: d(12), time: '3:00 PM', description: 'Mock interview prep for US visa', studentName: 'Nusrat Jahan', duration: '1.5h' },
    { id: 'e6', title: 'Counseling - Mim Akhter', type: 'Counseling', date: d(14), time: '10:30 AM', description: 'Germany MS AI programs discussion', studentName: 'Mim Akhter', duration: '1h' },
    { id: 'e7', title: 'Follow-up - Sajib Rahman', type: 'Follow-up', date: d(16), time: '4:00 PM', description: 'SOP revision follow-up for MA Marketing', studentName: 'Sajib Rahman', duration: '30m' },
    { id: 'e8', title: 'Deadline - Scholarship App', type: 'Deadline', date: d(18), time: '5:00 PM', description: 'Australia Awards scholarship deadline', duration: '—' },
    { id: 'e9', title: 'Meeting - Marketing Team', type: 'Meeting', date: d(20), time: '10:00 AM', description: 'Monthly marketing campaign review', duration: '1.5h' },
    { id: 'e10', title: 'Counseling - Lina Tabassum', type: 'Counseling', date: d(22), time: '1:00 PM', description: 'Canada co-op programs discussion', studentName: 'Lina Tabassum', duration: '1h' },
    { id: 'e11', title: 'Interview Prep - Kamal', type: 'Interview', date: d(25), time: '11:00 AM', description: 'PhD interview prep for US universities', studentName: 'Kamal Hossain', duration: '2h' },
  ];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function EmployeeCalendarPage() {
  const { setView } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', type: 'Counseling' as EventType, date: '', time: '', description: '' });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setEvents(getEventsForMonth(viewYear, viewMonth));
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, [viewYear, viewMonth]);

  const today = useMemo(() => {
    const d = currentDate.getDate();
    const m = currentDate.getMonth();
    const y = currentDate.getFullYear();
    return { day: d, month: m, year: y, key: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
  }, [currentDate]);

  const monthLabel = useMemo(() => {
    return new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((e) => new Date(e.date) >= new Date(today.key))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [events, today.key]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) {
      toast.error('Please fill in the title and date');
      return;
    }
    const event: CalendarEvent = {
      id: `e-${Date.now()}`,
      title: newEvent.title,
      type: newEvent.type,
      date: newEvent.date,
      time: newEvent.time || '12:00 PM',
      description: newEvent.description,
      duration: '1h',
    };
    setEvents((prev) => [...prev, event]);
    setNewEvent({ title: '', type: 'Counseling', date: '', time: '', description: '' });
    setShowAddDialog(false);
    toast.success('Event added successfully');
  };

  const calendarCells = useMemo(() => {
    const cells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, isCurrentMonth: false, dateStr });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, isCurrentMonth: true, dateStr });
    }
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const m = viewMonth === 11 ? 1 : viewMonth + 2;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, isCurrentMonth: false, dateStr });
    }
    return cells;
  }, [viewMonth, viewYear, daysInMonth, firstDay, prevMonthDays]);

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Calendar</h1>
          <p className="text-sm text-alo-text-muted mt-1">Schedule and manage your counseling sessions & events</p>
        </div>
        <Button variant="brand" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      {/* Month nav + view toggle */}
      <Card className="rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold text-alo-text min-w-[200px] text-center">{monthLabel}</h2>
              <Button variant="outline" size="icon-sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 text-xs text-alo-brand"
                onClick={() => { setViewMonth(today.month); setViewYear(today.year); }}
              >
                Today
              </Button>
            </div>
            <div className="flex items-center gap-1 bg-alo-page rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-8 text-xs', viewMode === 'month' ? 'bg-white shadow-sm text-alo-text' : 'text-alo-text-muted')}
                onClick={() => setViewMode('month')}
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn('h-8 text-xs', viewMode === 'list' ? 'bg-white shadow-sm text-alo-text' : 'text-alo-text-muted')}
                onClick={() => setViewMode('list')}
              >
                <List className="w-3.5 h-3.5 mr-1" /> List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar grid or list */}
        <div className="lg:col-span-3">
          {viewMode === 'month' ? (
            <Card className="rounded-xl border border-alo-border overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-alo-page/50">
                {DAYS.map((d) => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-alo-text-muted border-b border-alo-border">
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarCells.map((cell, idx) => {
                  const isToday = cell.dateStr === today.key;
                  const isSelected = cell.dateStr === selectedDate;
                  const dayEvents = eventsByDate[cell.dateStr] || [];
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(cell.isCurrentMonth ? cell.dateStr : null)}
                      className={cn(
                        'min-h-[80px] border-b border-r border-alo-border p-1 cursor-pointer transition-colors',
                        !cell.isCurrentMonth && 'bg-alo-page/30',
                        cell.isCurrentMonth && !isToday && !isSelected && 'hover:bg-alo-page/50',
                        isToday && 'bg-alo-brand-light/50',
                        isSelected && 'ring-2 ring-alo-brand ring-inset'
                      )}
                    >
                      <span className={cn(
                        'text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full',
                        !cell.isCurrentMonth && 'text-alo-text-muted/50',
                        cell.isCurrentMonth && !isToday && 'text-alo-text',
                        isToday && 'bg-alo-brand text-white'
                      )}>
                        {cell.day}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => {
                          const cfg = eventTypeConfig[ev.type];
                          return (
                            <div key={ev.id} className={cn('text-[10px] px-1.5 py-0.5 rounded truncate', cfg.bg, cfg.color, cfg.border, 'border')}>
                              {ev.time.replace(/:00/g, '')} {ev.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] text-alo-text-muted px-1">+{dayEvents.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="rounded-xl border border-alo-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-alo-text flex items-center gap-2">
                  <List className="w-4 h-4 text-alo-brand" />
                  Events — {monthLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-alo-border">
                    {events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((ev) => {
                      const cfg = eventTypeConfig[ev.type];
                      return (
                        <div key={ev.id} className="flex items-start gap-3 px-4 py-3 hover:bg-alo-page/50 transition-colors">
                          <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', cfg.dot)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-alo-text">{ev.title}</span>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', cfg.bg, cfg.color, cfg.border)}>
                                {ev.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-alo-text-secondary">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {ev.time}
                              </span>
                              {ev.duration !== '—' && <span>{ev.duration}</span>}
                            </div>
                            {ev.description && (
                              <p className="text-xs text-alo-text-muted mt-1 line-clamp-1">{ev.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {events.length === 0 && (
                      <div className="py-12 text-center">
                        <CalendarDays className="w-10 h-10 text-alo-text-muted/40 mx-auto mb-2" />
                        <p className="text-sm text-alo-text-secondary">No events this month</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming events sidebar */}
        <div className="lg:col-span-1">
          <Card className="rounded-xl border border-alo-border sticky top-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-alo-text">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-alo-text-muted text-center py-4">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((ev) => {
                    const cfg = eventTypeConfig[ev.type];
                    return (
                      <div key={ev.id} className={cn('p-2.5 rounded-lg border', cfg.bg, cfg.border)}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: cfg.color.replace('text-', '').replace(/\d+/, '') }}>
                            {ev.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-alo-text line-clamp-1">{ev.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-alo-text-secondary">
                          <span>{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>{ev.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="rounded-xl border border-alo-border mt-4">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-alo-text mb-2">Event Types</p>
              <div className="space-y-1.5">
                {(Object.entries(eventTypeConfig) as [EventType, typeof eventTypeConfig[EventType]][]).map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <span className={cn('w-2.5 h-2.5 rounded-full', cfg.dot)} />
                    <span className="text-alo-text-secondary">{type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-alo-text mb-1 block">Title</label>
              <Input
                placeholder="e.g. Counseling - Student Name"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="bg-alo-page border-alo-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-alo-text mb-1 block">Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-alo-border bg-alo-page text-alo-text focus:outline-none focus:ring-2 focus:ring-alo-brand/20"
                >
                  {(['Counseling', 'Follow-up', 'Deadline', 'Meeting', 'Interview'] as EventType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-alo-text mb-1 block">Time</label>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="bg-alo-page border-alo-border"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-alo-text mb-1 block">Date</label>
              <Input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="bg-alo-page border-alo-border"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-alo-text mb-1 block">Description</label>
              <Textarea
                placeholder="Add event details..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={3}
                className="bg-alo-page border-alo-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleAddEvent}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
