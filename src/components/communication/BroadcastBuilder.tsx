'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function BroadcastBuilder({ onCreated }: { onCreated?: ()=>void }) {
  const [form, setForm] = useState({ title: '', channel: 'whatsapp', audienceType: 'all_leads', messageBody: '' });
  const create = async () => {
    const res = await fetch('/api/crm/communications/broadcasts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...form }) });
    const j = await res.json();
    if (j.success) { toast.success(`Broadcast created — requires ${j.requiresSuperAdmin ? 'Super Admin' : 'Marketing Manager'} approval`); onCreated?.(); }
    else toast.error(j.error);
  };
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="w-4 h-4 text-[#2563EB]" /> Broadcast Builder</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Title" value={form.title} onChange={e=>setForm(s=>({...s, title:e.target.value}))} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={form.channel} onValueChange={v=>setForm(s=>({...s, channel:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="portal">Portal</SelectItem></SelectContent></Select>
          <Select value={form.audienceType} onValueChange={v=>setForm(s=>({...s, audienceType:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="all_leads">All leads</SelectItem><SelectItem value="hot_leads">Hot leads</SelectItem><SelectItem value="students">Students</SelectItem><SelectItem value="partner_students">Partner students</SelectItem><SelectItem value="visa_pending_students">Visa pending</SelectItem><SelectItem value="documents_missing_students">Docs missing</SelectItem><SelectItem value="offer_received_students">Offer received</SelectItem>
          </SelectContent></Select>
        </div>
        <Textarea placeholder="Message — opt-out respected, send log per recipient" value={form.messageBody} onChange={e=>setForm(s=>({...s, messageBody:e.target.value}))} />
        <Button size="sm" className="bg-[#F97316]" onClick={create}><Send className="w-4 h-4 mr-1" /> Create Broadcast — Approval Required</Button>
        <p className="text-[11px] text-gray-500">Rules: Mass {'>'}100 requires Super Admin • Marketing Manager can approve small • Opt-out via communication_preferences • Transactional allowed, marketing requires consent</p>
      </CardContent>
    </Card>
  );
}
