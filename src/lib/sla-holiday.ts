/**
 * SLA Holiday Calendar (from frappe/crm SLA engine)
 * Extends sla-engine.ts — holidays + rolling response time
 */
export const HOLIDAYS_2026_BD = ['2026-02-21','2026-03-26','2026-08-15','2026-12-16']; // sample — load from DB table HolidayCalendar

export function isHoliday(date: Date): boolean {
  const iso = date.toISOString().slice(0,10);
  return HOLIDAYS_2026_BD.includes(iso);
}

export function nextWorkingDay(date: Date): Date {
  const d = new Date(date);
  do { d.setDate(d.getDate()+1); } while (d.getDay()===5 || isHoliday(d)); // Friday=5 + holiday
  d.setHours(9,0,0,0);
  return d;
}

export function addBusinessMinutes(start: Date, minutes: number): Date {
  let cur = new Date(start);
  let remain = minutes;
  while(remain > 0){
    if(cur.getDay()===5 || isHoliday(cur) || cur.getHours()<9 || cur.getHours()>=18){
      cur = nextWorkingDay(cur);
      continue;
    }
    cur = new Date(cur.getTime() + 60_000);
    remain--;
    if(cur.getHours()>=18) cur = nextWorkingDay(cur);
  }
  return cur;
}
