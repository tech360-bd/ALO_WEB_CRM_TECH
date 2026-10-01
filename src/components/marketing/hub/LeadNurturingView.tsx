'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Clock, Mail, MessageSquare, Users, Loader2, Send, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LeadNurturingView() {
  const [journey, setJourney] = useState('whatsapp_7day');
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string|null>(null);

  const handleTrigger = async () => {
    setLoading(true);
    try{
      const res = await fetch('/api/marketing/lead-outreach', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'nurture', journey, dryRun:true })});
      const j = await res.json();
      if(!res.ok) throw new Error(j.error||'Nurture prep failed');
      setLog(`Prepared ${j.count||0} nurturing follow-ups for journey ${journey} — consent-checked, suppression enforced, scheduled via MarketingCalendar.`);
    }catch(e:any){ setLog('Error: '+e.message+' — Nurturing respects consent/opt-out. Requires approval for bulk.');}
    finally{ setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2"><Heart className="w-6 h-6 text-[#F97316]" />Lead Nurturing</h2>
        <p className="text-sm text-gray-500">Automated follow-ups, segmentation, scoring, counselor assignment, welcome messages, reminders, status sync, conversion & enrollment attribution.</p>
      </div>
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-[#0B5ED7]" />Nurturing Journeys</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold">Journey</label><Select value={journey} onValueChange={setJourney}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whatsapp_7day">WhatsApp 7-Day Drip</SelectItem><SelectItem value="email_5mail">Email 5-Mail Journey</SelectItem><SelectItem value="sms_reminder">SMS Deadline Reminder</SelectItem><SelectItem value="mixed">Mixed (WhatsApp+Email+SMS)</SelectItem></SelectContent></Select></div>
                <div className="flex items-end"><Button onClick={handleTrigger} disabled={loading} className="w-full bg-[#F97316] text-white h-9">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}Prepare Nurturing (Dry Run)</Button></div>
              </div>
              {log && <p className="text-xs bg-[#F8FAFC] border rounded-lg p-3">{log}</p>}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white border rounded-xl"><p className="font-semibold flex items-center gap-1"><MessageSquare className="w-3 h-3 text-emerald-600" />WhatsApp</p><p className="text-gray-600 mt-1">Day 1 Welcome → Day 3 Program match → Day 7 Deadline</p></div>
                <div className="p-3 bg-white border rounded-xl"><p className="font-semibold flex items-center gap-1"><Mail className="w-3 h-3 text-blue-600" />Email</p><p className="text-gray-600 mt-1">Welcome → Scholarship → Success story → CTA</p></div>
                <div className="p-3 bg-white border rounded-xl"><p className="font-semibold flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" />SMS</p><p className="text-gray-600 mt-1">Deadline + counselor contact + opt-out</p></div>
              </div>
              <p className="text-[11px] text-gray-500">Preserves CRM workflows — AI must not overwrite important student records or reassign counselors outside authorized rules. Uses MarketingLead.counselorId via existing assignment rules.</p>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-[#0B5ED7]" />Status Sync & Attribution</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Lead Status Sync</p><p className="text-gray-600 mt-1">new → contacted → qualified → assigned → converted / lost — syncs to CRM via lead status.</p></div>
              <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Conversion & Enrollment Attribution</p><p className="text-gray-600 mt-1">Campaign → Lead → Application → Enrollment where reliable data exists (MarketingLead.campaignId + Acr).</p></div>
              <Badge variant="outline" className="text-[11px]">Follow-up reminders — MarketingLead.followUpDueAt + MarketingAgentJob</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
