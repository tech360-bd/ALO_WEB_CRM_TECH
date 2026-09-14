'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, PhoneMissed, Clock } from 'lucide-react';

export default function CallLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [form, setForm] = useState({ phone: '', callType: 'inbound', callOutcome: 'connected', durationSeconds: 0, note: '' });

  const load = async () => {
    const res = await fetch('/api/crm/communications/call-logs');
    const j = await res.json();
    setLogs(j.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    await fetch('/api/crm/communications/call-logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    load();
  };

  return (
    <div className="p-4 lg:p-6 bg-[#F8FAFC] min-h-screen space-y-4">
      <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2"><Phone className="w-5 h-5 text-[#0057B8]" /> Call Log — Front Desk & Counselor</h1>
      <p className="text-xs text-gray-500">Call ID • Lead/student/partner/application • Caller • Receiver • Phone • Call type inbound/outbound/missed • Call outcome • Duration • Recording link placeholder • Next follow-up • Note • Created by/at</p>

      <Card className="border border-gray-200"><CardHeader className="pb-2"><CardTitle className="text-sm">Log Call — Front desk can create lead from phone call, log walk-in, schedule consultation, assign counselor</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input placeholder="Phone (+880...)" value={form.phone} onChange={e => setForm(s => ({ ...s, phone: e.target.value }))} />
            <Select value={form.callType} onValueChange={v => setForm(s => ({ ...s, callType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="inbound">Inbound</SelectItem><SelectItem value="outbound">Outbound</SelectItem><SelectItem value="missed">Missed</SelectItem></SelectContent></Select>
            <Select value={form.callOutcome} onValueChange={v => setForm(s => ({ ...s, callOutcome: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="connected">Connected</SelectItem><SelectItem value="not_answered">Not Answered</SelectItem><SelectItem value="busy">Busy</SelectItem><SelectItem value="wrong_number">Wrong Number</SelectItem><SelectItem value="call_back_later">Call Back Later</SelectItem><SelectItem value="interested">Interested</SelectItem><SelectItem value="not_interested">Not Interested</SelectItem><SelectItem value="converted">Converted</SelectItem><SelectItem value="complaint">Complaint</SelectItem>
            </SelectContent></Select>
            <Input type="number" placeholder="Duration (seconds)" value={form.durationSeconds} onChange={e => setForm(s => ({ ...s, durationSeconds: parseInt(e.target.value)||0 }))} />
          </div>
          <Textarea placeholder="Note — outcome details, next follow-up" value={form.note} onChange={e => setForm(s => ({ ...s, note: e.target.value }))} className="min-h-[60px]" />
          <Button size="sm" className="bg-[#0057B8]" onClick={create}><Phone className="w-4 h-4 mr-1" /> Save Call Log</Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-200"><CardHeader className="pb-2"><CardTitle className="text-sm">Call Logs ({logs.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead className="bg-gray-50 border-y text-[11px] text-gray-600"><tr><th className="px-3 py-2 text-left">Call ID</th><th className="px-3 py-2 text-left">Phone/Type</th><th className="px-3 py-2 text-left">Outcome/Duration</th><th className="px-3 py-2 text-left">Next Follow-up</th><th className="px-3 py-2 text-left">Note</th><th className="px-3 py-2 text-left">Created</th></tr></thead>
            <tbody>{logs.length===0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No call logs — missed calls auto-create callback queue with SLA</td></tr> :
            logs.map(l => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-[11px]">{l.callCode}</td>
                <td className="px-3 py-2"><div className="font-medium">{l.phone}</div><Badge variant="outline" className="text-[10px]">{l.callType}</Badge></td>
                <td className="px-3 py-2"><Badge className={`text-[10px] ${l.callOutcome==='connected'||l.callOutcome==='interested'?'bg-emerald-100 text-emerald-700':l.callOutcome==='missed'||l.callOutcome==='not_answered'?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-600'}`}>{l.callOutcome}</Badge><div className="text-[11px] text-gray-500"><Clock className="w-3 h-3 inline" /> {l.durationSeconds}s</div></td>
                <td className="px-3 py-2 text-[11px]">{l.nextFollowupAt ? new Date(l.nextFollowupAt).toLocaleString() : '—'}</td>
                <td className="px-3 py-2 text-[11px] max-w-[200px] truncate">{l.note || '—'}</td>
                <td className="px-3 py-2 text-[11px] text-gray-500">{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}</tbody></table></div>
        </CardContent>
      </Card>
    </div>
  );
}
