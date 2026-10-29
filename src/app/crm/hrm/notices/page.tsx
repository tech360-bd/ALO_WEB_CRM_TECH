'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function HrmNoticesPage() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ employeeId:'', noticeType:'RESIGNATION', noticeDate:'', noticePeriodDays:90, reason:'' });
  const load = () => fetch('/api/hrm/notices').then(r=>r.json()).then(j=> setList(j.data||[]));
  useEffect(()=> { load(); }, []);
  const create = async () => {
    if (!form.employeeId || !form.noticeDate) return toast.error('employeeId and noticeDate required');
    const res = await fetch('/api/hrm/notices', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)});
    const j=await res.json(); if(j.success){ toast.success('Notice created — 90 days countdown started'); load(); } else toast.error(j.error);
  };
  const act = async (id:string, action:string) => {
    const res = await fetch('/api/hrm/notices', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action })});
    const j=await res.json(); if(j.success){ toast.success(action); load(); } else toast.error(j.error);
  };
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div><h1 className="text-xl font-bold text-[var(--alo-text)]">Notice Management</h1><p className="text-xs text-[var(--alo-text-muted)]">Notice Date • 90 Days Countdown • Remaining Days • Handover Checklist • Asset Return • Clearance • Final Settlement</p></div>
      <Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Issue Notice (HR only)</CardTitle></CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Employee ID" value={form.employeeId} onChange={e=> setForm({...form, employeeId:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <select value={form.noticeType} onChange={e=> setForm({...form, noticeType:e.target.value})} className="h-9 text-xs border border-[var(--alo-border)] rounded px-2 bg-white"><option>RESIGNATION</option><option>TERMINATION</option><option>ABSCONDING</option></select>
          <Input type="date" value={form.noticeDate} onChange={e=> setForm({...form, noticeDate:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Input type="number" placeholder="Period days" value={form.noticePeriodDays} onChange={e=> setForm({...form, noticePeriodDays: Number(e.target.value)})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Input placeholder="Reason" value={form.reason} onChange={e=> setForm({...form, reason:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)] md:col-span-2" />
          <Button onClick={create} className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white md:col-span-3">Create Notice</Button>
        </CardContent>
      </Card>
      <Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Notices ({list.length})</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-auto"><table className="w-full text-xs"><thead className="bg-[var(--alo-page)] text-[var(--alo-text-muted)]"><tr><th className="p-2 text-left">Employee</th><th className="p-2">Type</th><th className="p-2">Notice Date</th><th className="p-2">Last Working</th><th className="p-2">Remaining</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
        <tbody>{list.length ? list.map((n:any)=> <tr key={n.id} className="border-t"><td className="p-2 font-mono">{n.employeeId}</td><td className="p-2">{n.noticeType}</td><td className="p-2 font-mono">{n.noticeDate}</td><td className="p-2 font-mono">{n.lastWorkingDay}</td><td className="p-2 text-center"><Badge className={`${n.remainingDays<=10?'bg-red-600':n.remainingDays<=30?'bg-amber-600':'bg-emerald-600'} text-white text-xs`}>{n.remainingDays}d</Badge></td><td className="p-2 text-center"><Badge variant="outline" className="text-xs">{n.status}</Badge></td><td className="p-2 text-center flex gap-1 justify-center"><Button size="sm" variant="outline" className="h-7 " onClick={()=> act(n.id,'complete')}>Complete</Button></td></tr>) : <tr><td colSpan={7} className="p-6 text-center text-[var(--alo-text-muted)]">No notices</td></tr>}</tbody></table></CardContent></Card>
    </div>
  );
}
