'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const TYPES = ['casual','annual','medical','maternity','paternity','without_pay','compensatory'];

export default function HrmLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [form, setForm] = useState({ leaveType:'casual', startDate:'', endDate:'', reason:'' });
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/hrm/leave').then(r=>r.json()).then(j=> setLeaves(j.data||[])),
      fetch('/api/hrm/leave?view=balance').then(r=>r.json()).then(j=> setBalance(j.data?.balance||null)),
    ]).finally(()=> setLoading(false));
  };
  useEffect(()=> { load(); }, []);
  const apply = async () => {
    if (!form.startDate || !form.endDate) return toast.error('Dates required');
    const res = await fetch('/api/hrm/leave', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)});
    const j=await res.json(); if(j.success){ toast.success('Leave applied — pending approval workflow'); load(); } else toast.error(j.error);
  };
  const act = async (id:string, action:string) => {
    const res = await fetch('/api/hrm/leave', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action })});
    const j=await res.json(); if(j.success){ toast.success(action); load(); } else toast.error(j.error);
  };
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[var(--alo-text)]">Leave Management</h1><p className="text-xs text-[var(--alo-text-muted)]">Casual • Annual • Medical • Maternity • Paternity • Without Pay • Compensatory • Balance • History • Approval Workflow</p></div><Badge className="bg-white border-[var(--alo-border)] text-[var(--alo-body)] text-xs">{leaves.length} requests</Badge></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-white border-[var(--alo-border)] lg:col-span-1">
          <CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Apply Leave</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-3">
            <div><Label className="text-xs">Leave Type</Label><select value={form.leaveType} onChange={e=> setForm({...form, leaveType:e.target.value})} className="w-full h-9 text-xs border border-[var(--alo-border)] rounded px-2 bg-white">{TYPES.map(t=> <option key={t} value={t}>{t}</option>)}</select></div>
            <div><Label className="text-xs">Start Date</Label><Input type="date" value={form.startDate} onChange={e=> setForm({...form, startDate:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" /></div>
            <div><Label className="text-xs">End Date</Label><Input type="date" value={form.endDate} onChange={e=> setForm({...form, endDate:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" /></div>
            <div><Label className="text-xs">Reason</Label><Input value={form.reason} onChange={e=> setForm({...form, reason:e.target.value})} placeholder="Reason" className="h-9 text-xs bg-white border-[var(--alo-border)]" /></div>
            <Button onClick={apply} className="w-full bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black ">Submit Application</Button>
            {balance && <div className="p-2 bg-[var(--alo-page)] border rounded text-xs space-y-1"><p className="font-bold">Balance</p><p>Casual: {balance.casualRemaining}/{balance.casualTotal} • Annual: {balance.annualRemaining}/{balance.annualTotal} • Medical: {balance.medicalRemaining}/{balance.medicalTotal}</p><p>Maternity: {balance.maternityRemaining} • Paternity: {balance.paternityRemaining} • LWP: {balance.lwpUsed} • CompOff: {balance.compOffRemaining}</p></div>}
          </CardContent>
        </Card>

        <Card className="bg-white border-[var(--alo-border)] lg:col-span-2">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between"><CardTitle className="text-sm font-bold">Leave History & Approval Workflow</CardTitle><Button variant="outline" size="sm" onClick={load} className="h-7 ">Refresh</Button></CardHeader>
          <CardContent className="p-0 overflow-auto">
            <table className="w-full text-xs"><thead className="bg-[var(--alo-page)] text-[var(--alo-text-muted)]"><tr><th className="p-2 text-left">Type</th><th className="p-2">Dates</th><th className="p-2">Days</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={5} className="p-6 text-center text-[var(--alo-text-muted)]">Loading...</td></tr> : leaves.length ? leaves.map((l:any)=> <tr key={l.id} className="border-t"><td className="p-2 capitalize">{l.leaveType}</td><td className="p-2 text-center font-mono">{l.startDate} → {l.endDate}</td><td className="p-2 text-center">{l.days||l.totalDays}</td><td className="p-2 text-center"><Badge variant="outline" className="text-xs capitalize">{l.status}</Badge></td><td className="p-2 text-center flex gap-1 justify-center"><Button size="sm" className="h-7 bg-emerald-600 text-white" onClick={()=> act(l.id,'approve')}>Approve</Button><Button size="sm" variant="outline" className="h-7 " onClick={()=> act(l.id,'reject')}>Reject</Button></td></tr>) : <tr><td colSpan={5} className="p-6 text-center text-[var(--alo-text-muted)]">No leaves</td></tr>}</tbody></table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
