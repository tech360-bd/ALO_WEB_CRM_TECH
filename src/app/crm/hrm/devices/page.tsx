'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function HrmDevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [form, setForm] = useState({ employeeId:'', deviceName:'', deviceType:'laptop', serialNumber:'', assetTag:'', warranty:'' });
  const load = () => fetch('/api/hrm/devices').then(r=>r.json()).then(j=> setDevices(j.data?.devices||[]));
  useEffect(()=> { load(); }, []);
  const create = async () => {
    if (!form.employeeId || !form.deviceName || !form.serialNumber) return toast.error('employeeId, deviceName, serialNumber required');
    const res = await fetch('/api/hrm/devices', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)});
    const j= await res.json(); if(j.success){ toast.success('Device registered'); load(); } else toast.error(j.error);
  };
  const act = async (id:string, action:string) => {
    const res = await fetch('/api/hrm/devices', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action })});
    const j=await res.json(); if(j.success){ toast.success(action); load(); } else toast.error(j.error);
  };
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div><h1 className="text-xl font-bold text-[var(--alo-text)]">Device Management</h1><p className="text-xs text-[var(--alo-text-muted)]">Laptop • Desktop • Tablet • Phone — Name • Serial • Asset Tag • Assigned Date • Warranty • Status • Returned Date • Condition</p></div>
      <Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Register Company Device (HR/IT only)</CardTitle></CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Employee ID (AE-EMP-...)" value={form.employeeId} onChange={e=> setForm({...form, employeeId:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Input placeholder="Device Name" value={form.deviceName} onChange={e=> setForm({...form, deviceName:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <select value={form.deviceType} onChange={e=> setForm({...form, deviceType:e.target.value})} className="h-9 text-xs border border-[var(--alo-border)] rounded px-2 bg-white"><option>laptop</option><option>desktop</option><option>tablet</option><option>phone</option></select>
          <Input placeholder="Serial Number" value={form.serialNumber} onChange={e=> setForm({...form, serialNumber:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Input placeholder="Asset Tag" value={form.assetTag} onChange={e=> setForm({...form, assetTag:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Input placeholder="Warranty (e.g., 2027-12-31)" value={form.warranty} onChange={e=> setForm({...form, warranty:e.target.value})} className="h-9 text-xs bg-white border-[var(--alo-border)]" />
          <Button onClick={create} className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black h-9 text-xs md:col-span-3">Register Device</Button>
        </CardContent>
      </Card>
      <Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Devices ({devices.length})</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-auto"><table className="w-full text-xs"><thead className="bg-[var(--alo-page)] text-[var(--alo-text-muted)]"><tr><th className="p-2 text-left">Device</th><th className="p-2">Employee</th><th className="p-2">Serial</th><th className="p-2">Asset Tag</th><th className="p-2">Warranty</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
        <tbody>{devices.length ? devices.map((d:any)=> <tr key={d.id} className="border-t"><td className="p-2">{d.deviceName} <Badge variant="outline" className="ml-1 text-xs">{d.deviceType}</Badge></td><td className="p-2 font-mono">{d.employeeId}</td><td className="p-2 font-mono">{d.serialNumber}</td><td className="p-2">{d.assetTag}</td><td className="p-2">{d.warranty}</td><td className="p-2 text-center"><Badge variant="outline" className="text-xs capitalize">{d.status}</Badge></td><td className="p-2 text-center flex gap-1 justify-center"><Button size="sm" variant="outline" className="h-7 text-xs" onClick={()=> act(d.id,'return')}>Return</Button><Button size="sm" variant="outline" className="h-7 text-xs" onClick={()=> act(d.id,'lost')}>Lost</Button></td></tr>) : <tr><td colSpan={7} className="p-6 text-center text-[var(--alo-text-muted)]">No devices</td></tr>}</tbody></table></CardContent></Card>
    </div>
  );
}
