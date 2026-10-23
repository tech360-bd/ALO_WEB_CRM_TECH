'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Clock, LogIn, LogOut, Calendar, CheckCircle2,
  XCircle, AlertTriangle, Timer, TrendingUp,
} from 'lucide-react';

type DayStatus = 'P' | 'A' | 'L' | 'H';

interface DayRecord { date: number; status: DayStatus; clockIn?: string; clockOut?: string; hours?: number; }

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
const todayDate = today.getDate();

const statusLabel: Record<DayStatus, string> = { P: 'Present', A: 'Absent', L: 'Late', H: 'Holiday' };
const statusColor: Record<DayStatus, string> = {
  P: 'bg-emerald-100 text-emerald-700',
  A: 'bg-red-100 text-red-700',
  L: 'bg-amber-100 text-amber-700',
  H: 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]',
};
const statusIcon: Record<DayStatus, React.ElementType> = { P: CheckCircle2, A: XCircle, L: AlertTriangle, H: Calendar };

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function EmployeeAttendancePage() {
  const { user } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState('');
  const [clockOutTime, setClockOutTime] = useState('');
  const [clocking, setClocking] = useState(false);
  const [data, setData] = useState<DayRecord[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<{ week: string; hours: number }[]>([]);
  const [apiLoaded, setApiLoaded] = useState(false);

  useEffect(() => {
    const token = usePortalStore.getState().token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/employee/attendance', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(apiData => {
        if (apiData?.records?.length) {
          const mapped = apiData.records.map((r: any) => ({
            date: new Date(r.date).getDate(),
            status: r.status === 'present' ? 'P' : r.status === 'absent' ? 'A' : r.status === 'late' ? 'L' : 'H',
            clockIn: r.clockIn,
            clockOut: r.clockOut,
            hours: r.hours,
          }));
          setData(mapped);
          setApiLoaded(true);
        }
        if (apiData?.weeklyHours) {
          setWeeklyHours(apiData.weeklyHours);
        }
        if (apiData?.today?.clockedIn !== undefined) {
          setClockedIn(apiData.today.clockedIn);
          if (apiData.today.clockIn) setClockInTime(apiData.today.clockIn);
          if (apiData.today.clockOut) setClockOutTime(apiData.today.clockOut);
        }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); });
  }, []);

  const handleClockIn = useCallback(async () => {
    setClocking(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/employee/attendance', { method: 'POST', headers, body: JSON.stringify({ action: 'clockIn' }) });
      if (res.ok) {
        const result = await res.json();
        const timeStr = result?.clockIn || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        setClockInTime(timeStr);
        setClockedIn(true);
        setData((prev) => prev.map((d) => d.date === todayDate ? { ...d, status: 'P', clockIn: timeStr } : d));
        toast.success('Clocked in at ' + timeStr);
      } else {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Clock-in failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Clock-in failed');
    }
    setClocking(false);
  }, []);

  const handleClockOut = useCallback(async () => {
    setClocking(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/employee/attendance', { method: 'POST', headers, body: JSON.stringify({ action: 'clockOut' }) });
      if (res.ok) {
        const result = await res.json();
        const timeStr = result?.clockOut || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        setClockOutTime(timeStr);
        setClockedIn(false);
        setData((prev) => prev.map((d) => d.date === todayDate ? { ...d, clockOut: timeStr, hours: 8.5 } : d));
        toast.success('Clocked out at ' + timeStr);
      } else {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Clock-out failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Clock-out failed');
    }
    setClocking(false);
  }, []);

  const summary = {
    present: data.filter((d) => d.status === 'P' && d.date <= todayDate).length,
    absent: data.filter((d) => d.status === 'A').length,
    late: data.filter((d) => d.status === 'L').length,
    leave: data.filter((d) => d.status === 'H' && d.date <= todayDate).length,
    totalHours: data.reduce((sum, d) => sum + (d.hours || 0), 0),
  };

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  if (loading) {
    return (
      <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
        <Skeleton className="h-8 w-52" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Attendance</h1>
          <p className="text-sm text-alo-text-muted mt-1">Track your daily attendance and working hours</p>
        </div>
        <Badge variant="outline" className="text-sm font-mono w-fit">{monthNames[currentMonth]} {currentYear}</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
            <div><p className="text-xl font-bold text-alo-text">{summary.present}</p><p className="text-xs text-alo-text-muted">Present Days</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-500" /></div>
            <div><p className="text-xl font-bold text-alo-text">{summary.absent}</p><p className="text-xs text-alo-text-muted">Absent Days</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-500" /></div>
            <div><p className="text-xl font-bold text-alo-text">{summary.late}</p><p className="text-xs text-alo-text-muted">Late Days</p></div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--alo-surface-muted)] flex items-center justify-center"><Calendar className="w-5 h-5 text-[var(--alo-text-muted)]" /></div>
            <div><p className="text-xl font-bold text-alo-text">{summary.leave}</p><p className="text-xs text-alo-text-muted">Leave / Holiday</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2"><Timer className="w-5 h-5 text-alo-brand" /> Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-alo-page">
              <div className="flex items-center gap-2"><LogIn className="w-4 h-4 text-emerald-500" /><span className="text-sm text-alo-text-secondary">Clock In</span></div>
              <span className="text-sm font-mono font-semibold text-alo-text">{clockInTime || '--:--'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-alo-page">
              <div className="flex items-center gap-2"><LogOut className="w-4 h-4 text-red-500" /><span className="text-sm text-alo-text-secondary">Clock Out</span></div>
              <span className="text-sm font-mono font-semibold text-alo-text">{clockOutTime || '--:--'}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-alo-page">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-alo-brand" /><span className="text-sm text-alo-text-secondary">Hours</span></div>
              <span className="text-sm font-mono font-semibold text-alo-text">{data.find((d) => d.date === todayDate)?.hours?.toFixed(1) || '0.0'} hrs</span>
            </div>
            <div className="pt-2">
              {clockedIn ? (
                <Button variant="danger" className="w-full" onClick={handleClockOut} disabled={clocking}>
                  {clocking ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogOut className="w-4 h-4" />}
                  {clocking ? 'Processing...' : 'Clock Out'}
                </Button>
              ) : (
                <Button variant="success" className="w-full" onClick={handleClockIn} disabled={clocking}>
                  {clocking ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {clocking ? 'Processing...' : 'Clock In'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-white rounded-xl border border-alo-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2"><Calendar className="w-5 h-5 text-alo-brand" /> Monthly Calendar</CardTitle>
              <div className="flex gap-3 text-[11px]">
                {(['P', 'A', 'L', 'H'] as DayStatus[]).map((s) => (
                  <span key={s} className="flex items-center gap-1"><span className={cn('w-2.5 h-2.5 rounded', s === 'P' ? 'bg-emerald-500' : s === 'A' ? 'bg-red-500' : s === 'L' ? 'bg-amber-500' : 'bg-slate-400')} />{statusLabel[s]}</span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((dn) => (
                <div key={dn} className="text-center text-[11px] font-semibold text-alo-text-muted py-2">{dn}</div>
              ))}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
              {data.map((day) => {
                const isToday = day.date === todayDate;
                const isFuture = day.date > todayDate;
                return (
                  <div key={day.date}
                    className={cn('h-10 flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors',
                      isToday ? 'ring-2 ring-alo-brand bg-alo-brand-light' : isFuture ? 'text-alo-text-muted/40' : 'hover:bg-alo-page',
                      day.date > todayDate && 'opacity-50')}>
                    <span className={cn(isToday ? 'font-bold text-alo-brand' : 'text-alo-text')}>{day.date}</span>
                    {!isFuture && day.status !== 'H' && (
                      <span className={cn('text-[11px] font-bold mt-0.5', statusColor[day.status])}>{day.status}</span>
                    )}
                    {isFuture && <span className="text-[11px] text-alo-text-muted/30 mt-0.5">--</span>}
                    {!isFuture && day.status === 'H' && <span className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">H</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2"><TrendingUp className="w-5 h-5 text-alo-brand" /> Weekly Hours Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {weeklyHours.map((w) => {
              const pct = Math.min((w.hours / 45) * 100, 100);
              const isCurrentWeek = w.week === 'Week 4';
              return (
                <div key={w.week} className="p-4 rounded-lg border border-alo-border bg-alo-page/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-alo-text">{w.week}</span>
                    {isCurrentWeek && <Badge variant="brand" className="text-[11px]">Current</Badge>}
                  </div>
                  <p className="text-2xl font-bold text-alo-text">{w.hours.toFixed(1)}<span className="text-sm font-normal text-alo-text-muted ml-1">hrs</span></p>
                  <div className="w-full h-2 bg-alo-border rounded-full mt-2 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: pct + '%' }} />
                  </div>
                  <p className="text-[11px] text-alo-text-muted mt-1">{pct.toFixed(0)}% of 45 hrs target</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-4 rounded-lg bg-alo-brand-light border border-alo-brand/10 flex items-center gap-3">
            <Clock className="w-5 h-5 text-alo-brand shrink-0" />
            <div>
              <p className="text-sm font-medium text-alo-text">Total This Month: {summary.totalHours.toFixed(1)} hours</p>
              <p className="text-xs text-alo-text-muted">Average {todayDate > 0 ? (summary.totalHours / todayDate).toFixed(1) : 0} hours per working day</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
