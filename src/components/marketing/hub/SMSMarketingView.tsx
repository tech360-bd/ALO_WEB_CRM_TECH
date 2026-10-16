'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SMSMarketingView() {
  const [campaign, setCampaign] = useState({ segment:'hot_leads', message:'ALO Education: UK Jan 2027 intake open. Scholarships available. Reply YES for free counseling. Opt-out: STOP', senderId:'ALOEDU' });
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<string|null>(null);
  const [consentInfo, setConsentInfo] = useState<any>(null);

  useEffect(()=>{ fetch('/api/marketing/consent').then(r=>r.json()).then(j=>setConsentInfo(j)).catch(()=>{}); },[]);

  const handleSend = async () => {
    setSending(true); setLog(null);
    try {
      const res = await fetch('/api/integrations/3cx/sms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'send_bulk', ...campaign, dryRun: true })});
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'SMS provider not configured — set SMS_PROVIDER / THREECX_API_* in .env');
      setLog(`Prepared ${j.count||0} SMS — consent-checked, suppression list applied, sender ID ${campaign.senderId}. Cost tracking: ${j.cost||'—'}. Requires approval before live send.`);
    } catch(e:any){ setLog('Error: '+e.message+' — SMS requires provider credentials. Task preserved in MarketingCalendar status=pending_approval.'); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2"><MessageSquare className="w-6 h-6 text-[#E8501A]" />SMS Marketing</h2>
        <p className="text-sm text-gray-500">Bulk campaigns, segmentation, personalized SMS, scheduled delivery, Sender ID, delivery & cost tracking, opt-out + suppression lists (server-enforced).</p>
      </div>
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Compose SMS Campaign</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold">Segment</label><Select value={campaign.segment} onValueChange={v=>setCampaign({...campaign, segment:v})}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hot_leads">Hot Leads</SelectItem><SelectItem value="new_leads">New Leads</SelectItem><SelectItem value="uk_interest">UK Interest</SelectItem><SelectItem value="all_consent">All Consent</SelectItem></SelectContent></Select></div>
                <div><label className="text-xs font-semibold">Sender ID</label><Input value={campaign.senderId} onChange={e=>setCampaign({...campaign, senderId:e.target.value})} className="mt-1 h-9" placeholder="ALOEDU" /></div>
              </div>
              <div><label className="text-xs font-semibold">Message (160 chars, consent & opt-out required)</label><Textarea value={campaign.message} onChange={e=>setCampaign({...campaign, message:e.target.value})} className="mt-1 min-h-[90px]" maxLength={320} /><p className="text-[11px] text-gray-400 mt-1">{campaign.message.length} chars • Must include opt-out (e.g., “Reply STOP”)</p></div>
              <Button onClick={handleSend} disabled={sending} className="bg-[#E8501A] text-white"><>{sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}Prepare Bulk (Dry Run)</></Button>
              {log && <p className="text-xs bg-[#F8FAFC] border rounded-lg p-3 whitespace-pre-wrap">{log}</p>}
              <p className="text-[11px] text-gray-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" />Enforcement: server checks MarketingConsent + suppression list; respects consent, applicable law, provider restrictions; campaign limits & suppression lists enforced; no SMS without consent=true.</p>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-[#0057B8]" />Consent & Suppression</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Consent Summary</p><p className="text-gray-600 mt-1">Source: MarketingConsent (leadId, channel=sms, consent, optOut). {consentInfo ? `Loaded ${consentInfo.count||0} records` : 'Loading...'}</p></div>
              <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Delivery & Cost Tracking</p><p className="text-gray-600 mt-1">Delivery: /api/integrations/3cx/sms/journal • Cost: provider reports • Rate limit: provider limit enforced.</p></div>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">Blocked if SMS_PROVIDER_API_KEY missing — shows Integration not connected</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
