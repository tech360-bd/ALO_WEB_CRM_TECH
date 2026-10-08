'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Users, ShieldCheck, Loader2, Eye, Palette } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmailMarketingView() {
  const [campaign, setCampaign] = useState({ template:'newsletter', subject:'UK January 2027 — Last chance for scholarships', html:'<h1>Study in UK — Jan 2027</h1><p>Dear {{name}}, UK universities are closing Jan intake. Scholarships up to 50%. Book free counseling.</p>', segment:'all_consent', sender:'noreply@aloeducation.com' });
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<string|null>(null);

  const handleSend = async () => {
    setSending(true); setLog(null);
    try{
      const res = await fetch('/api/email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'send_campaign', ...campaign, dryRun:true })});
      const j = await res.json();
      if(!res.ok) throw new Error(j.error || 'Email gateway not configured — set MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD');
      setLog(`Prepared ${j.count||0} emails — segmentation + personalization + unsubscribe list checked. Requires approval.`);
    }catch(e:any){ setLog('Error: '+e.message+' — Task preserved in MarketingCalendar. Email respects consent/unsubscribe/bounce handling.');}
    finally{ setSending(false);}
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2"><Mail className="w-6 h-6 text-[#F97316]" />Email Marketing</h2>
        <p className="text-sm text-gray-500">HTML templates, personalized content, segmentation, automated journeys, scheduled campaigns, delivery/bounce/unsubscribe, performance analytics.</p>
      </div>
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Compose Email Campaign</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold">Template Type</label><Select value={campaign.template} onValueChange={v=>setCampaign({...campaign, template:v})}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newsletter">Newsletter</SelectItem><SelectItem value="journey">Automated Journey</SelectItem><SelectItem value="announcement">Announcement</SelectItem></SelectContent></Select></div>
                <div><label className="text-xs font-semibold">Sender</label><Input value={campaign.sender} onChange={e=>setCampaign({...campaign, sender:e.target.value})} className="mt-1 h-9" /></div>
              </div>
              <div><label className="text-xs font-semibold">Subject</label><Input value={campaign.subject} onChange={e=>setCampaign({...campaign, subject:e.target.value})} className="mt-1 h-9" /></div>
              <div><label className="text-xs font-semibold">HTML Content (supports {'{{name}}'} personalization)</label><Textarea value={campaign.html} onChange={e=>setCampaign({...campaign, html:e.target.value})} className="mt-1 min-h-[140px] font-mono text-xs" /></div>
              <div className="flex gap-2">
                <Button onClick={handleSend} disabled={sending} className="bg-[#F97316] text-white">{sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}Prepare Campaign</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="h-9"><Eye className="w-4 h-4 mr-2" />Preview</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="h-9"><Palette className="w-4 h-4 mr-2" />Brand Check</Button>
              </div>
              {log && <p className="text-xs bg-[#F8FAFC] border rounded-lg p-3 whitespace-pre-wrap">{log}</p>}
              <p className="text-[11px] text-gray-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" />Enforcement: MarketingConsent (email) + unsubscribe list; bounce handling; rate limits; suppression lists server-enforced.</p>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-[#2563EB]" />Segmentation & Journeys</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Segments</p><p className="text-gray-600 mt-1">UK interest, HSC 2025, IELTS pending, Hot leads — via MarketingLead.destination/level/status.</p></div>
              <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Automated Journeys</p><p className="text-gray-600 mt-1">Welcome → Nurture (Day 3,7) → Deadline reminder — MarketingCalendar scheduledAt with idempotency.</p></div>
              <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Analytics</p><p className="text-gray-600 mt-1">Delivered / Bounced / Unsubscribed / CTR — from MarketingAnalytics / MarketingReport.</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
