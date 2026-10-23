'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function CallLogModal({ open, onOpenChange, leadId, studentId }: { open: boolean; onOpenChange: (v:boolean)=>void; leadId?: string; studentId?: string }) {
  const [form, setForm] = useState({ phone: '', callType: 'inbound', callOutcome: 'connected', durationSeconds: 0, note: '' });
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/communications/call-logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, leadId, studentId }) });
      const j = await res.json();
      if (j.success) { toast.success('Call log saved — timeline & follow-up task created if missed'); onOpenChange(false); }
      else toast.error(j.error);
    } catch { toast.error('Failed'); }
    setLoading(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader><DialogTitle className="text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-[var(--alo-brand)]" /> Log Phone Call — inbound/outbound/missed</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Phone" value={form.phone} onChange={e=>setForm(s=>({...s, phone:e.target.value}))} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.callType} onValueChange={v=>setForm(s=>({...s, callType:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="inbound">Inbound</SelectItem><SelectItem value="outbound">Outbound</SelectItem><SelectItem value="missed">Missed</SelectItem></SelectContent></Select>
            <Select value={form.callOutcome} onValueChange={v=>setForm(s=>({...s, callOutcome:v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="connected">Connected</SelectItem><SelectItem value="not_answered">Not Answered</SelectItem><SelectItem value="busy">Busy</SelectItem><SelectItem value="wrong_number">Wrong Number</SelectItem><SelectItem value="call_back_later">Call Back Later</SelectItem><SelectItem value="interested">Interested</SelectItem><SelectItem value="not_interested">Not Interested</SelectItem><SelectItem value="converted">Converted</SelectItem><SelectItem value="complaint">Complaint</SelectItem>
            </SelectContent></Select>
          </div>
          <Input type="number" placeholder="Duration seconds" value={form.durationSeconds} onChange={e=>setForm(s=>({...s, durationSeconds: parseInt(e.target.value)||0}))} />
          <Textarea placeholder="Note — outcome, next follow-up" value={form.note} onChange={e=>setForm(s=>({...s, note:e.target.value}))} />
          <Button size="sm" className="w-full bg-[var(--alo-brand)]" onClick={submit} disabled={loading}>{loading?'Saving...':'Save Call Log — Missed creates callback queue'}</Button>
          <p className="text-[11px] text-[var(--alo-text-muted)]">Front Desk can: Create lead from phone call, Log walk-in enquiry, Schedule consultation, Assign counselor, Send appointment confirmation, Add call note — recording link placeholder</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
