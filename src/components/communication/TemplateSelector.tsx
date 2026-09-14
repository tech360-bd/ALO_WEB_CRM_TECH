'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search } from 'lucide-react';

export default function TemplateSelector({ onSelect }: { onSelect: (tpl: any, rendered: string) => void }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [channel, setChannel] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams();
    if (channel !== 'all') params.set('channel', channel);
    fetch(`/api/communications/templates?${params.toString()}`).then(r => r.json()).then(j => setTemplates(j.templates || j.data || [])).catch(()=>{});
  }, [channel]);

  const filtered = templates.filter(t => !q || t.templateName.toLowerCase().includes(q.toLowerCase()) || t.category.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-3 space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-400" />
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search template (e.g., conditional offer)" className="h-7 text-xs pl-7" />
        </div>
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="portal">Portal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="max-h-[220px] overflow-y-auto space-y-1.5">
        {filtered.length === 0 ? <div className="text-xs text-gray-400 py-4 text-center">No templates. Defaults: new_lead_welcome, document_missing, conditional_offer, visa_approved etc.</div> :
        filtered.slice(0, 20).map(t => (
          <div key={t.id} className="border border-gray-100 rounded p-2 hover:bg-blue-50/50 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-900 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-gray-400" /> {t.templateName} <Badge variant="outline" className="text-[10px]">{t.category}</Badge></div>
              <div className="text-[11px] text-gray-600 line-clamp-2 mt-1">{t.body?.substring(0, 140)}…</div>
              <div className="text-[10px] text-gray-400 mt-1">Channel: {t.channel} • Vars: {(() => { try { return JSON.parse(t.variables||'[]').join(', ') } catch { return t.variables } })()} • {t.language}</div>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => {
              let rendered = t.body;
              try { const vars = JSON.parse(t.variables||'[]'); vars.forEach((v:string)=> { rendered = rendered.split(`{{${v}}}`).join(`[${v}]`); }); } catch {}
              onSelect(t, rendered);
            }}>Use</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
