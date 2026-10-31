'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Sparkles, FileText, Paperclip } from 'lucide-react';
import TemplateSelector from './TemplateSelector';

export default function ReplyBox({
  onSend, entityType, entityId, canUseB2B = false
}: {
  onSend: (body: string, channel: string, visibility: string, useTemplate?: string) => Promise<void>;
  entityType: string; entityId: string; canUseB2B?: boolean;
}) {
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [visibility, setVisibility] = useState('student_visible');
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) return;
    setLoading(true);
    await onSend(body, channel, visibility);
    setBody('');
    setLoading(false);
  };

  const handleAiDraft = async () => {
    const res = await fetch('/api/communications/drafts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId, channel, prompt: body || 'Draft a helpful reply' })
    }).catch(()=>null);
    const json = await res?.json().catch(()=>null);
    if (json?.draft) setBody(json.draft);
  };

  return (
    <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="h-7 text-xs bg-white w-[160px]"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="portal_message">Portal Message</SelectItem>
            <SelectItem value="phone_call_log">Phone Call Log</SelectItem>
            <SelectItem value="internal_note">Internal Note</SelectItem>
            {canUseB2B && <SelectItem value="b2b_confidential">B2B Confidential</SelectItem>}
          </SelectContent>
        </Select>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger className="h-7 text-xs bg-white w-[180px]"><SelectValue placeholder="Visibility" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="student_visible">Student Visible</SelectItem>
            <SelectItem value="partner_visible">Partner Visible</SelectItem>
            <SelectItem value="counselor_visible">Counselor Only</SelectItem>
            <SelectItem value="application_team_visible">App Team Only</SelectItem>
            <SelectItem value="visa_team_visible">Visa Team Only</SelectItem>
            <SelectItem value="finance_visible">Finance Only</SelectItem>
            <SelectItem value="internal_only">Internal Only</SelectItem>
            {canUseB2B && <SelectItem value="b2b_confidential">B2B Confidential</SelectItem>}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-7 " onClick={() => setShowTemplates(!showTemplates)}><FileText className="w-3.5 h-3.5 mr-1" /> Templates</Button>
        <Button size="sm" variant="outline" className="h-7 bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]" onClick={handleAiDraft}><Sparkles className="w-3.5 h-3.5 mr-1" /> AI Draft</Button>
      </div>
      {showTemplates && <TemplateSelector onSelect={(t, rendered) => setBody(rendered)} />}
      <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder={`Write message linked to ${entityType} #${entityId} — will be saved to timeline with visibility ${visibility}...`} className="min-h-[80px] text-xs bg-white" />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--alo-text-muted)] flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attachment placeholder (stored as path) • Every message saved to timeline + audit</span>
        <Button size="sm" className=" bg-[var(--alo-brand)] hover:bg-[#004a9e] " onClick={handleSend} disabled={loading || !body.trim()}><Send className="w-3.5 h-3.5 mr-1" /> Send & Log</Button>
      </div>
    </div>
  );
}
