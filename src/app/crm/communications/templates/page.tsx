'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Lock, CheckCircle2, Archive } from 'lucide-react';
import { TEMPLATE_CATEGORIES } from '@/lib/communication/template-engine';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', channel: 'whatsapp', category: 'new_lead_welcome', language: 'english', body: '', variables: '' });

  const load = async () => {
    const res = await fetch('/api/communications/templates');
    const j = await res.json();
    setTemplates(j.templates || j.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    await fetch('/api/communications/templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: `TPL-${Date.now()}`, name: form.name, channel: form.channel, category: form.category,
        language: form.language, body: form.body, variables: form.variables.split(',').map(s=>s.trim()).filter(Boolean)
      })
    });
    setShowCreate(false); load();
  };

  return (
    <div className="p-4 lg:p-6 bg-[#F8FAFC] min-h-screen space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Communication Templates — Manager</h1>
          <p className="text-xs text-gray-500">template_id • template_name • channel • category • language • body • variables • visibility • requires_approval • status • created_by • approved_by</p>
        </div>
        <Button size="sm" className="bg-[#0057B8]" onClick={() => setShowCreate(!showCreate)}><Plus className="w-4 h-4 mr-1" /> Create Template</Button>
      </div>

      {showCreate && (
        <Card className="border border-gray-200"><CardContent className="p-4 space-y-3">
          <Input placeholder="Template name (e.g., Conditional offer WhatsApp)" value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2">
            <Select value={form.channel} onValueChange={v => setForm(s => ({ ...s, channel: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="portal">Portal</SelectItem><SelectItem value="social_dm">Social DM</SelectItem></SelectContent></Select>
            <Select value={form.category} onValueChange={v => setForm(s => ({ ...s, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TEMPLATE_CATEGORIES.map(c=> <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Input placeholder="Language (english/bangla)" value={form.language} onChange={e => setForm(s => ({ ...s, language: e.target.value }))} />
          </div>
          <Textarea placeholder="Body — use {{variables}} e.g., Hi {{name}}, your CAS for {{university}} is {{status}}" value={form.body} onChange={e => setForm(s => ({ ...s, body: e.target.value }))} className="min-h-[100px]" />
          <Input placeholder="Variables comma separated: name, university, status" value={form.variables} onChange={e => setForm(s => ({ ...s, variables: e.target.value }))} />
          <Button size="sm" className="bg-[#E8501A]" onClick={create}>Create (requires_approval respected)</Button>
        </CardContent></Card>
      )}

      <Card className="border border-gray-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-[#0057B8]" /> {templates.length} Templates — Channels: WhatsApp, SMS, Email, Portal, Social DM — Categories: {TEMPLATE_CATEGORIES.slice(0,6).join(', ')}… ({TEMPLATE_CATEGORIES.length} total)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-y text-[11px] text-gray-600"><tr><th className="px-3 py-2 text-left">Template</th><th className="px-3 py-2 text-left">Channel/Category</th><th className="px-3 py-2 text-left">Variables</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Action</th></tr></thead>
              <tbody>
                {templates.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No templates yet — defaults will be seeded automatically (25 defaults + custom)</td></tr> :
                templates.map(t => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2"><div className="font-medium text-gray-900">{t.templateName}</div><div className="text-[11px] font-mono text-gray-500">{t.templateCode}</div></td>
                    <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{t.channel}</Badge><div className="text-[11px] text-gray-600">{t.category} • {t.language}</div></td>
                    <td className="px-3 py-2 text-[11px] text-gray-600 max-w-[200px] truncate">{(() => { try { return JSON.parse(t.variables||'[]').join(', ')} catch { return t.variables }})()}</td>
                    <td className="px-3 py-2"><Badge className={`text-[10px] ${t.status === 'active' || t.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : t.status === 'LOCKED' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{t.status}</Badge>{t.isLocked && <Lock className="w-3 h-3 inline ml-1 text-amber-600" />}</td>
                    <td className="px-3 py-2"><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-6 text-[11px]">View/Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <div className="text-[11px] text-gray-400">Default templates: New lead welcome, Student profile incomplete, Document missing/approved/rejected, Course recommendation, Application submitted, Conditional/Unconditional offer, Deposit/CAS/I-20/COE pending/received, Visa file started, Financial proof, Interview practice, Visa submitted/approved/rejected, Pre-departure, Partner support, Commission update, Appointment confirmation, Missed call follow-up, After-hours reply, Complaint acknowledgement — all with variables and approval workflow.</div>
    </div>
  );
}
