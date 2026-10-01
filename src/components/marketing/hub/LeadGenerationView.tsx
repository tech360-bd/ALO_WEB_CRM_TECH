'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, Users, Filter, Download, RefreshCw, Sparkles, Globe } from 'lucide-react';

export default function LeadGenerationView() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(()=>{ fetch('/api/marketing/lead-pipeline').then(r=>r.json()).then(j=>setLeads(j.leads||j.campaigns||[])).catch(()=>{}).finally(()=>setLoading(false)); },[]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2"><Target className="w-6 h-6 text-[#F97316]" />Lead Generation</h2>
          <p className="text-sm text-gray-500">Campaign attribution, source tracking (Facebook/Instagram/WhatsApp/Website), auto-creation, duplicate detection, segmentation, scoring, counselor assignment via CRM rules.</p>
        </div>
        <Badge className="bg-[#0B5ED7] text-white">Attribution • Scoring • Routing</Badge>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-[#0B5ED7]" />Generated Leads (MarketingLead)</CardTitle>
              <div className="flex gap-2">
                <Input placeholder="Filter by source/destination" value={filter} onChange={e=>setFilter(e.target.value)} className="h-8 text-xs w-48" />
                <Button variant="outline" size="sm" className="h-8 text-xs"><Filter className="w-3 h-3 mr-1" />Filter</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#F97316]" /> : leads.length===0 ? (
                <div className="text-center py-8">
                  <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No marketing leads yet — they appear here when Campaigns, Social Inbox, WhatsApp, or Website Chat create MarketingLead via attribution. Duplicate detection via phone/email.</p>
                  <p className="text-xs text-gray-400 mt-2">Source tracking: lead.source, campaignId, MarketingCampaignSource. Welcome messages & counselor assignment via existing CRM rules (no unauthorized reassignment).</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leads.slice(0,10).map((l:any)=><div key={l.id} className="p-3 border rounded-xl flex items-center justify-between">
                    <div><p className="text-sm font-semibold">{l.name||l.phone||'Lead'}</p><p className="text-xs text-gray-500">{l.source||'—'} • Destination {l.destination||'—'} • Score {l.score||0} {l.hotLead && <Badge className="bg-orange-500 text-white ml-1 text-[10px]">HOT</Badge>}</p></div>
                    <Badge variant="outline" className="text-xs">{l.status||'new'}</Badge>
                  </div>)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-[#F8FAFC] border-dashed">
            <CardContent className="p-4 text-xs text-gray-500">
              <p className="font-semibold">Generation channels:</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li>Facebook/Instagram comments → MarketingComment → convertLead → MarketingLead (consent-checked)</li>
                <li>Messenger/WhatsApp DMs → MarketingDMThread/SocialMessage → MarketingLead</li>
                <li>Website consultation form → /api/crm/leads/public → MarketingLead + Timeline + workflow</li>
                <li>Ad clicks → MarketingCampaignSource (impressions/clicks/cost) → attribution</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#F97316]" />Lead Scoring</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="text-gray-600">Scoring via MarketingLeadScore (factors: destination intent, budget, IELTS, engagement). HotLead flag auto.</p>
              <Button variant="outline" size="sm" className="h-8 text-xs"><RefreshCw className="w-3 h-3 mr-1" />Recalculate Scores</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-[#0B5ED7]" />Source Tracking</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="text-gray-600">Every lead has <code>source, sourceDetail, campaignId</code>. Attribution preserved through CRM.</p>
              <Button variant="outline" size="sm" className="h-8 text-xs"><Download className="w-3 h-3 mr-1" />Export CSV</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
