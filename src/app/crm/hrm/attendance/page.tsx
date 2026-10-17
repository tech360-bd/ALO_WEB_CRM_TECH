'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function HrmAttendancePage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/hrm/attendance?month=${month}`).then(r=>r.json()).then(j=> setData(j.data)).catch(()=> toast.error('Load failed')).finally(()=> setLoading(false));
  };
  useEffect(()=> { load(); }, [month]);

  const clock = async (action:'clock_in'|'clock_out') => {
    const res = await fetch('/api/hrm/attendance', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action })});
    const j = await res.json();
    if (j.success) { toast.success(action==='clock_in'?'Clocked In':'Clocked Out'); load(); } else toast.error(j.error);
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance System</h1>
          <p className="text-xs text-slate-500">Automatic Attendance • Clock In/Out • Late/Present/Absent/Half-Day/Holiday/Leave • Working Hours • Idle Time</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={()=> clock('clock_in')} className="bg-[#E8501A] hover:bg-[#D04010] text-white h-9 text-xs">Clock In</Button>
          <Button onClick={()=> clock('clock_out')} variant="outline" className="h-9 text-xs border-slate-200">Clock Out</Button>
        </div>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold">Monthly Attendance — {month}</CardTitle>
          <input type="month" value={month} onChange={e=> setMonth(e.target.value)} className="h-8 text-xs border border-slate-200 rounded px-2 bg-white" />
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {loading ? <p className="text-xs text-slate-400">Loading...</p> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-7 gap-2">
                {[
                  ['Present', data?.summary?.present ?? 0, 'bg-emerald-50 text-emerald-700'],
                  ['Late', data?.summary?.late ?? 0, 'bg-amber-50 text-amber-700'],
                  ['Absent', data?.summary?.absent ?? 0, 'bg-red-50 text-red-700'],
                  ['Half Day', data?.summary?.halfDay ?? 0, 'bg-orange-50 text-orange-700'],
                  ['Holiday', data?.summary?.holiday ?? 0, 'bg-blue-50 text-blue-700'],
                  ['Leave', data?.summary?.leave ?? 0, 'bg-purple-50 text-purple-700'],
                  ['Hours', data?.summary?.totalHours ?? 0, 'bg-slate-50 text-slate-700'],
                ].map(([label,val,cls])=> (
                  <div key={String(label)} className={`p-3 rounded-xl border text-center ${cls as string} border-slate-200`}>
                    <p className="text-xs">{label as string}</p>
                    <p className="text-lg font-bold">{String(val)}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50"><tr className="text-slate-500"><th className="p-2 text-left">Date</th><th className="p-2">Clock In</th><th className="p-2">Clock Out</th><th className="p-2">Status</th><th className="p-2">Hours</th><th className="p-2">Late</th><th className="p-2">Idle</th></tr></thead>
                  <tbody>
                    {(data?.records||[]).length ? data.records.map((r:any)=> (
                      <tr key={r.id||r.date} className="border-t border-slate-100">
                        <td className="p-2 font-mono">{r.date}</td>
                        <td className="p-2 text-center">{r.clockIn||r.checkIn||'-'}</td>
                        <td className="p-2 text-center">{r.clockOut||r.checkOut||'-'}</td>
                        <td className="p-2 text-center"><Badge variant="outline" className="text-xs capitalize">{r.status}</Badge></td>
                        <td className="p-2 text-center">{r.hoursWorked}</td>
                        <td className="p-2 text-center">{r.lateMinutes||0}m</td>
                        <td className="p-2 text-center">{r.idleTime||0}</td>
                      </tr>
                    )) : <tr><td colSpan={7} className="p-6 text-center text-slate-400">No attendance records for {month} — clock in to generate</td></tr>}
                  </tbody>
                </table>
              </div>

              <Card className="bg-orange-50 border-orange-100">
                <CardContent className="p-3 text-xs text-slate-700">
                  <p className="font-bold text-[#E8501A]">Attendance Calendar</p>
                  <p className="mt-1">Calendar view via <code className="bg-white px-1 rounded">?view=calendar&month=YYYY-MM</code> — includes holidays & weekends (Friday). Working hours: 9:00–18:00 Asia/Dhaka, late threshold 15 min, half-day &lt;4h.</p>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
