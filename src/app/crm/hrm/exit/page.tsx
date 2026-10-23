'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function HrmExitPage() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ employeeId:'', exitType:'RESIGNATION', exitDate:'', finalSettlement:0 });
  const load = () => fetch('/api/hrm/exit').then(r=>r.json()).then(j=> setList(j.data||[]));
  useEffect(()=> { load(); }, []);
  const create = async () => {
    if (!form.employeeId || !form.exitDate) return toast.error('Required missing');
    const res = await fetch('/api/hrm/exit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)});
    const j=await res.json(); if(j.success){ toast.success('Exit initiated'); load(); } else toast.error(j.error);
  };
  const act = async (id:string, action:string) => {
    const res = await fetch('/api/hrm/exit', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action })});
    const j=await res.json(); if(j.success){ toast.success(action); load(); } else toast.error(j.error);
  };
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div><h1 className="text-xl font-bold text-[var(--alo-text)]">Exit Management</h1><p className="text-xs text-[var(--alo-text-muted)]">Resignation • Termination • Absconding • Exit Interview • Clearance • Final Settlement • Experience Letter • Relieving Letter</p></div>
      <Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Initiate Exit (HR only)</CardTitle></CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Employee ID" value={form.employeeId} onChange={e=> setForm({...form, employeeId:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <select value={form.exitType} onChange={e=> setForm({...form, exitType:e.target.value})} className="h-9 text-xs border border-[var(--alo-border)] rounded px-2 bg-white"><option>RESIGNATION</option><option>TERMINATION</option><option>ABSCONDING</option></select>
          <Input type="date" value={form.exitDate} onChange={e=> setForm({...form, exitDate:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Input type="number" placeholder="Final Settlement" value={form.finalSettlement} onChange={e=> setForm({...form, finalSettlement: Number(e.target.value)})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Button onClick={create} className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black h-9 text-xs md:col-span-4">Initiate Exit</Button>
        </CardContent>
      </Card>
      <Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Exits ({list.length})</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-auto"><table className="w-full text-xs"><thead className="bg-[var(--alo-page)] text-[var(--alo-text-muted)]"><tr><th className="p-2 text-left">Employee</th><th className="p-2">Type</th><th className="p-2">Exit Date</th><th className="p-2">Clearance</th><th className="p-2">Settlement</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
        <tbody>{list.length ? list.map((e:any)=> <tr key={e.id} className="border-t"><td className="p-2 font-mono">{e.employeeId}</td><td className="p-2">{e.exitType}</td><td className="p-2 font-mono">{e.exitDate}</td><td className="p-2 text-center">{e.clearanceStatus||'PENDING'}</td><td className="p-2 text-center">৳{Number(e.finalSettlement||0).toLocaleString()}</td><td className="p-2 text-center"><Badge variant="outline" className="text-xs">{e.status}</Badge></td><td className="p-2 text-center"><Button size="sm" variant="outline" className="h-7 text-xs" onClick={()=> act(e.id,'completed')}>Complete</Button></td></tr>) : <tr><td colSpan={7} className="p-6 text-center text-[var(--alo-text-muted)]">No exits</td></tr>}</tbody></table></CardContent></Card>
    </div>
  );
}
