'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { MessageSquare, Bot, Clock, Globe, Phone, CheckCircle2, Languages, FileText, Mic } from 'lucide-react';

interface IntakeHealth {
  success: boolean;
  agent: string;
  officeHours: boolean;
  channels: string[];
  memory: string;
}

export default function StudentIntakeControlPanel() {
  const [health, setHealth] = useState<IntakeHealth | null>(null);
  const [officeCfg, setOfficeCfg] = useState<{ enabled: boolean; window: string }>({ enabled: true, window: '10:00-19:00 Asia/Dhaka' });
  const [probeId, setProbeId] = useState('');
  const [probeReply, setProbeReply] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('portal_token') || localStorage.getItem('token') || '';
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/ai/student-intake', { headers }).then(r=>r.json()).then(setHealth).catch(()=>{});
    fetch('/api/admin/ai/student-intake', { headers }).then(r=>r.json()).then(j=> j?.success && setOfficeCfg(j.data || j)).catch(()=>{});
  }, []);

  const sendProbe = async () => {
    if (!probeId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/student-intake', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ channel: 'website', senderId: 'superadmin-probe', text: `My Student ID is ${probeId}` })
      });
      const j = await res.json();
      setProbeReply(j.reply || j.error || '—');
    } finally { setLoading(false); }
  };

  return (
    <Card className="bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
      <CardHeader className="pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-[#F97316]" />Bangla Intake AI — ID-First (Website / WhatsApp / Facebook) • Super-Admin Managed</CardTitle>
          <Badge className={health?.officeHours ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}>
            {health?.officeHours ? 'Office Hours (human-like sequential)' : 'After Hours (AI queue)'}
          </Badge>
        </div>
        <CardDescription className="text-xs">One brain for all channels. First asks Student ID (AE-YYYYXXXXXX) → verifies → informs independent submission → then Bangla/English + doc/voice counseling with memory + sequential queue. Office 10-19 Asia/Dhaka.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-[11px] text-gray-500">Channels</p><p className="font-bold flex gap-1 mt-1"><Globe className="w-3 h-3"/> website <Phone className="w-3 h-3"/> WhatsApp <MessageSquare className="w-3 h-3"/> Facebook</p><p className="text-[11px] text-gray-500 mt-1">Same agent, sequential per senderId</p></div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-[11px] text-gray-500">Language</p><p className="font-bold flex gap-1 mt-1"><Languages className="w-3 h-3"/> Bangla + English + Banglish auto</p><p className="text-[11px] text-gray-500 mt-1">+ voice transcription</p></div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-[11px] text-gray-500">Multimodal</p><p className="font-bold flex gap-1 mt-1"><FileText className="w-3 h-3"/> docs/images <Mic className="w-3 h-3"/> voice notes</p></div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-[11px] text-gray-500">Office</p><p className="font-bold flex gap-1 mt-1"><Clock className="w-3 h-3"/> {officeCfg.window}</p><p className="text-[11px] text-gray-500 mt-1">{health?.memory || 'per senderId+channel memory'}</p></div>
        </div>
        <div className="bg-[#0F172A] text-white rounded-xl p-3">
          <p className="font-bold text-[12px]">Contract</p>
          <p className="text-[11px] text-gray-300 mt-1"><code className="bg-white/10 px-1 rounded">POST /api/ai/student-intake</code> {'{'} channel, senderId, text, mediaType, mediaInfo {'}'}</p>
          <p className="text-[11px] text-gray-300">Webhooks: <code className="bg-white/10 px-1 rounded">POST /api/whatsapp/webhook</code> and <code className="bg-white/10 px-1 rounded">POST /api/facebook/webhook</code> (Messenger) → same intake brain.</p>
          <p className="text-[11px] text-gray-300 mt-1">Docs auto: <code className="bg-white/10 px-1 rounded">POST /api/documents/auto-upload</code> multipart with fullApplication — creates AE-YYYYXXXXXX + portal profile + Application(APPLICATION_DRAFT).</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 items-end">
          <div className="flex-1 w-full"><label className="text-[11px] font-bold">Probe — test ID verification (super-admin only)</label><Input placeholder="AE-2025000123" value={probeId} onChange={e=>setProbeId(e.target.value)} className="h-9 text-xs mt-1" /></div>
          <Button onClick={sendProbe} disabled={loading} className="bg-[#F97316] text-white h-9 text-xs">{loading ? 'Checking...' : 'Test Verify → Independent Notice'}</Button>
          <Link href="/api/ai/student-intake" target="_blank"><Button variant="outline" className="h-9 text-xs">GET contract</Button></Link>
        </div>
        {probeReply && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[12px] whitespace-pre-wrap"><CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-600"/>{probeReply}</div>}
        <div className="flex gap-2">
          <Link href="/super-admin/dashboard"><Button variant="outline" className="h-8 text-[11px] border-[#E2E8F0]">Super-Admin Dashboard</Button></Link>
          <Link href="/admin/ai-command-center"><Button variant="outline" className="h-8 text-[11px] border-[#E2E8F0]">AI Command Center</Button></Link>
          <a href="/admin/document-security"><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="h-8 text-[11px] border-[#E2E8F0]">Auto-create Docs</Button></a>
        </div>
      </CardContent>
    </Card>
  );
}
