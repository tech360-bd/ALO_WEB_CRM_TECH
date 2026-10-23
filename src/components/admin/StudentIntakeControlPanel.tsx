'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquare, Bot, Clock, Globe, Phone, Languages, FileText, Mic } from 'lucide-react';

interface IntakeHealth {
  success: boolean;
  agent: string;
  officeHours: boolean;
  channels: string[];
  memory: string;
}

export default function StudentIntakeControlPanel() {
  const [health, setHealth] = useState<IntakeHealth | null>(null);
  const [officeCfg, setOfficeCfg] = useState<{ enabled: boolean; window: string }>({ enabled: true, window: 'Sat–Thu 09:00–18:00 · Asia/Dhaka · Friday closed' });

  useEffect(() => {
    const token = localStorage.getItem('portal_token') || localStorage.getItem('token') || '';
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/ai/student-intake', { headers }).then(r=>r.json()).then(setHealth).catch(()=>{});
    fetch('/api/admin/ai/student-intake', { headers }).then(r=>r.json()).then(j => {
      const data = j?.data || j;
      if (j?.success && data) setOfficeCfg({ enabled: data.enabled === true, window: typeof data.officeWindow === 'string' ? data.officeWindow : 'Sat–Thu 09:00–18:00 · Asia/Dhaka · Friday closed' });
    }).catch(()=>{});
  }, []);



  return (
    <Card className="bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
      <CardHeader className="pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-[#E8501A]" />Secure General Intake — Website / WhatsApp / Facebook</CardTitle>
          <Badge className={health?.officeHours ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}>
            {health?.officeHours ? 'During office hours' : 'Outside office hours'}
          </Badge>
        </div>
        <CardDescription className="text-xs">Public chat provides general guidance only and does not verify current admission/visa requirements. A Student ID alone never verifies identity; do not share IDs, passwords, OTPs, bank details, passports, or private documents here. Account-specific support requires the secure Student Portal. Office status uses the persisted Asia/Dhaka schedule when available and a safe default otherwise.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-[11px] text-gray-500">Channels</p><p className="font-bold flex gap-1 mt-1"><Globe className="w-3 h-3"/> website <Phone className="w-3 h-3"/> WhatsApp <MessageSquare className="w-3 h-3"/> Facebook</p><p className="text-[11px] text-gray-500 mt-1">Shared safety policy; sender IDs are pseudonymized</p></div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-[11px] text-gray-500">Language</p><p className="font-bold flex gap-1 mt-1"><Languages className="w-3 h-3"/> Bangla + English + Banglish auto</p><p className="text-[11px] text-gray-500 mt-1">+ no public voice transcription</p></div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-[11px] text-gray-500">Public inputs</p><p className="font-bold flex gap-1 mt-1"><FileText className="w-3 h-3"/> public uploads disabled <Mic className="w-3 h-3"/> voice disabled</p></div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-[11px] text-gray-500">Office</p><p className="font-bold flex gap-1 mt-1"><Clock className="w-3 h-3"/> {officeCfg.window}</p><p className="text-[11px] text-gray-500 mt-1">{health?.memory || 'pseudonymized, time-limited memory when configured'}</p></div>
        </div>
        <div className="bg-[#0F172A] text-white rounded-xl p-3">
          <p className="font-bold text-[12px]">Contract</p>
          <p className="text-[11px] text-gray-300 mt-1"><code className="bg-white/10 px-1 rounded">POST /api/ai/student-intake</code> {'{'} channel, senderId, text, mediaType, mediaInfo {'}'}</p>
          <p className="text-[11px] text-gray-300">Webhooks: <code className="bg-white/10 px-1 rounded">POST /api/whatsapp/webhook</code> and <code className="bg-white/10 px-1 rounded">POST /api/facebook/webhook</code> (Messenger) → shared safe general-intake handler.</p>
          <p className="text-[11px] text-gray-300 mt-1">This public chat does not accept files or verify voice transcripts. Use the authenticated Student Portal Documents area or an authorized staff workflow; never send private documents here.</p>
        </div>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
          Public intake replies are rule-based and are not a substitute for current university or government requirements. AI-generated staff replies remain drafts for human review; this panel does not send test or customer messages.
        </p>
        <div className="flex gap-2">
          <Link href="/super-admin/dashboard"><Button variant="outline" className="h-8 text-[11px] border-[#E2E8F0]">Super-Admin Dashboard</Button></Link>
          <Link href="/admin/ai-command-center"><Button variant="outline" className="h-8 text-[11px] border-[#E2E8F0]">AI Command Center</Button></Link>
          <Button asChild variant="outline" className="h-8 text-[11px] border-[#E2E8F0]"><a href="/admin/document-security">Document Security</a></Button>
        </div>
      </CardContent>
    </Card>
  );
}
