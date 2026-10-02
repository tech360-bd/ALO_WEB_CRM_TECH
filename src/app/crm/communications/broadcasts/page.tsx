'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Send, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function BroadcastsPage() {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', channel: 'whatsapp', audienceType: 'all_leads', messageBody: '' });

  const load = async () => {
    const res = await fetch('/api/crm/communications/broadcasts');
    const j = await res.json();
    setList(j.data || j.broadcasts || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    await fetch('/api/crm/communications/broadcasts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...form })
    });
    load();
  };
  const act = async (id: string, action: string) => {
    await fetch('/api/crm/communications/broadcasts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, broadcastId: id }) });
    load();
  };

  return (
    <div className="p-4 lg:p-6 bg-[#F8FAFC] min-h-screen space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2"><Megaphone className="w-5 h-5 text-[#0B5ED7]" /> Broadcast System</h1>
        <p className="text-xs text-gray-500">WhatsApp/SMS/Email/Portal announcement — Student/Partner/Marketing campaign — Requires approval by Marketing Manager or Super Admin — Mass {'>'}100 requires Super Admin — Opt-out respected — No SMTP password visible</p>
      </div>

      <Card className="border border-gray-200"><CardHeader className="pb-2"><CardTitle className="text-sm">Create Broadcast</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title (e.g., UK Jan Intake — Last Call)" value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.channel} onValueChange={v => setForm(s => ({ ...s, channel: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whatsapp">WhatsApp Broadcast</SelectItem><SelectItem value="sms">SMS Broadcast</SelectItem><SelectItem value="email">Email Broadcast</SelectItem><SelectItem value="portal">Portal Announcement</SelectItem></SelectContent></Select>
            <Select value={form.audienceType} onValueChange={v => setForm(s => ({ ...s, audienceType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="all_leads">All leads</SelectItem><SelectItem value="hot_leads">Hot leads</SelectItem><SelectItem value="students">Students</SelectItem><SelectItem value="partner_students">Partner students</SelectItem><SelectItem value="b2b_partners">B2B partners</SelectItem><SelectItem value="partners">Partners</SelectItem><SelectItem value="visa_pending_students">Visa pending students</SelectItem><SelectItem value="documents_missing_students">Documents missing students</SelectItem><SelectItem value="offer_received_students">Offer received students</SelectItem><SelectItem value="deposit_pending_students">Deposit pending students</SelectItem><SelectItem value="country_interested_leads">Country interested leads</SelectItem><SelectItem value="intake_based_leads">Intake-based leads</SelectItem><SelectItem value="campaign_leads">Campaign leads</SelectItem>
            </SelectContent></Select>
          </div>
          <Textarea placeholder="Message body — will respect opt-out, log send/failure per recipient" value={form.messageBody} onChange={e => setForm(s => ({ ...s, messageBody: e.target.value }))} className="min-h-[80px]" />
          <Button size="sm" className="bg-[#F97316]" onClick={create}><Send className="w-4 h-4 mr-1" /> Create & Request Approval</Button>
          <div className="text-[11px] text-gray-500">Audience: All leads, Hot leads, Students, Partner students, B2B partners, Partners, Visa pending, Documents missing, Offer received, Deposit pending, Country/Campaign/Intake-based — Opt-out: WhatsApp/SMS/Email/Phone/Marketing/Transactional preferences respected — Transactional allowed where legal, marketing requires consent</div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200"><CardHeader className="pb-2"><CardTitle className="text-sm">Broadcasts ({list.length})</CardTitle></CardHeader><CardContent className="p-0">
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead className="bg-gray-50 border-y text-[11px] text-gray-600"><tr><th className="px-3 py-2 text-left">Code/Title</th><th className="px-3 py-2 text-left">Channel/Audience</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Scheduled/Sent</th><th className="px-3 py-2 text-left">Action</th></tr></thead>
          <tbody>{list.length===0 ? <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No broadcasts — create one above. Mass sends show approval gate.</td></tr> :
          list.map(b => (
            <tr key={b.id} className="border-b hover:bg-gray-50">
              <td className="px-3 py-2"><div className="font-mono text-[11px] text-gray-500">{b.broadcastCode}</div><div className="font-medium text-gray-900">{b.title}</div></td>
              <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{b.channel}</Badge><div className="text-[11px] text-gray-600">{b.audienceType}</div></td>
              <td className="px-3 py-2"><Badge className={`text-[10px] ${b.approvalStatus==='approved'?'bg-emerald-100 text-emerald-700':b.approvalStatus==='pending'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}`}>{b.approvalStatus}</Badge>{b.approvalStatus==='pending' && <AlertTriangle className="w-3 h-3 inline ml-1 text-amber-600" />}</td>
              <td className="px-3 py-2 text-[11px] text-gray-600"><div>Scheduled: {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : '—'}</div><div>Sent: {b.sentAt ? new Date(b.sentAt).toLocaleString() : '—'}</div></td>
              <td className="px-3 py-2 flex gap-1">{b.approvalStatus==='pending' && <Button size="sm" variant="outline" className="h-6 text-[11px] bg-emerald-50 text-emerald-700" onClick={()=>act(b.id,'approve')}><CheckCircle2 className="w-3 h-3 mr-1"/>Approve</Button>}<Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={()=>act(b.id,'send')}><Send className="w-3 h-3 mr-1"/>Send</Button></td>
            </tr>
          ))}</tbody></table></div>
      </CardContent></Card>
    </div>
  );
}
