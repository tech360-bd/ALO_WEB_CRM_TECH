// ALO HRMS — Attendance engine (auto clock, late calc, working hours, idle time, calendar)
export const OFFICE_START = "09:00"; // Dhaka
export const OFFICE_END = "18:00";
export const LATE_THRESHOLD_MIN = 15; // grace
export const HALF_DAY_MIN_HOURS = 4;
export const FULL_DAY_MIN_HOURS = 7;

export type AttendanceStatus = 'present'|'late'|'absent'|'half_day'|'holiday'|'leave'|'weekend';

export function parseTimeToMin(t: string): number {
  if (!t) return 0;
  const [h,m] = t.split(':').map(Number);
  return (h||0)*60 + (m||0);
}

export function calcHoursWorked(clockIn: string, clockOut: string): number {
  if (!clockIn || !clockOut) return 0;
  const diff = parseTimeToMin(clockOut) - parseTimeToMin(clockIn);
  return Math.max(0, Math.round(diff/60*100)/100);
}

export function determineStatus(clockIn: string, clockOut: string, isHoliday: boolean, isOnLeave: boolean): { status: AttendanceStatus; isLate: boolean; lateMinutes:number } {
  if (isHoliday) return { status:'holiday', isLate:false, lateMinutes:0 };
  if (isOnLeave) return { status:'leave', isLate:false, lateMinutes:0 };
  if (!clockIn) return { status:'absent', isLate:false, lateMinutes:0 };
  const startMin = parseTimeToMin(OFFICE_START);
  const inMin = parseTimeToMin(clockIn);
  const late = Math.max(0, inMin - startMin);
  const isLate = late > LATE_THRESHOLD_MIN;
  const hours = calcHoursWorked(clockIn, clockOut || OFFICE_END);
  if (!clockOut) return { status: isLate? 'late':'present', isLate, lateMinutes: late };
  if (hours < HALF_DAY_MIN_HOURS) return { status:'half_day', isLate, lateMinutes: late };
  if (isLate) return { status:'late', isLate:true, lateMinutes: late };
  return { status:'present', isLate:false, lateMinutes:0 };
}

export function attendanceCalendarDays(year:number, month:number, holidays: Set<string>): { date:string; isHoliday:boolean; isWeekend:boolean }[] {
  const days: { date:string; isHoliday:boolean; isWeekend:boolean }[] = [];
  const d = new Date(year, month-1, 1);
  while (d.getMonth() === month-1) {
    const iso = d.toISOString().slice(0,10);
    const isWeekend = d.getDay()===5; // Friday in BD
    const isHoliday = holidays.has(iso) || isWeekend;
    days.push({ date: iso, isHoliday, isWeekend });
    d.setDate(d.getDate()+1);
  }
  return days;
}

export function monthSummary(records: { status: string; hoursWorked:number; lateMinutes:number }[]): { present:number; absent:number; late:number; halfDay:number; holiday:number; leave:number; totalHours:number; avgHours:number } {
  let present=0, absent=0, late=0, half=0, holiday=0, leave=0, totalHours=0;
  for (const r of records) {
    totalHours += r.hoursWorked||0;
    switch((r.status||'').toLowerCase()){
      case 'present': present++; break;
      case 'late': late++; present++; break;
      case 'absent': absent++; break;
      case 'half_day': half++; break;
      case 'holiday': holiday++; break;
      case 'leave': leave++; break;
      default: present++; break;
    }
  }
  const avg = records.length? Math.round(totalHours/records.length*100)/100:0;
  return { present, absent, late, halfDay: half, holiday, leave, totalHours: Math.round(totalHours*100)/100, avgHours: avg };
}
