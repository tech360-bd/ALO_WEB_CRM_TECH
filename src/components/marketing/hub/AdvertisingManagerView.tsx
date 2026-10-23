'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Target, DollarSign, BarChart3, Megaphone, ShieldCheck, AlertTriangle, Pause, Play, TrendingUp } from 'lucide-react';

export default function AdvertisingManagerView() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(50000);
  const [platform, setPlatform] = useState('meta');
  const [proposal, setProposal] = useState('');
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{ fetch('/api/marketing/campaigns').then(r=>r.json()).then(j=>setCampaigns(j.campaigns||[])).catch(()=>{}).finally(()=>setLoading(false)); },[]);

  const handlePropose = async () => {
    setError(null);
    try{
      const res = await fetch('/api/marketing/campaigns?action=generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ campaignId: campaigns[0]?.id || 'demo', budget, platform })});
      const j = await res.json();
      if(!res.ok) throw new Error(j.error||'Proposal failed - budget enforcement requires approval');
      setProposal(JSON.stringify(j, null, 2).slice(0,1200));
    }catch(e:any){ setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--alo-text)] flex items-center gap-2"><Megaphone className="w-6 h-6 text-[var(--alo-cta)]" />Advertising Manager</h2>
          <p className="text-sm text-[var(--alo-text-muted)]">Meta Ads & Google Ads - planning, audience research, ad copy, creative variations, budget allocation - server-side budget enforcement. AI proposes, human approves spend.</p>
        </div>
        <Badge className="bg-amber-100 text-amber-800 border-amber-200"><ShieldCheck className="w-3 h-3 mr-1" />Budget Guard: Human Approval Required</Badge>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-[var(--alo-brand)]" />Campaign Planning</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="text-xs font-semibold">Platform</label><Select value={platform} onValueChange={setPlatform}><SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="meta">Meta Ads (Facebook/Instagram)</SelectItem><SelectItem value="google">Google Ads</SelectItem></SelectContent></Select></div>
                <div><label className="text-xs font-semibold">Budget (BDT)</label><Input type="number" value={budget} onChange={e=>setBudget(parseInt(e.target.value)||0)} className="mt-1 h-9" /></div>
                <div className="flex items-end"><Button onClick={handlePropose} className="w-full bg-[var(--alo-cta)] text-black h-9"><BarChart3 className="w-4 h-4 mr-2" />Propose Structure</Button></div>
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</p>}
              {proposal && <pre className="text-xs bg-[var(--alo-page)] border rounded-xl p-3 whitespace-pre-wrap max-h-[300px] overflow-auto">{proposal}</pre>}
              <p className="text-[11px] text-[var(--alo-text-muted)]">AI may prepare proposals & recommend budgets. AI must NOT independently spend, increase budgets, purchase subscriptions, or modify financial permissions. Server enforces <code>budget ≤ approvedBudget</code> per MarketingCampaign.budget + audit (approver, timestamp). Requires explicit human approval for financial commitments.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Active Campaigns</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[var(--alo-cta)]" /> : campaigns.length===0 ? <p className="text-sm text-[var(--alo-text-muted)]">No campaigns - create via Campaign Manager or AI Director.</p> : (
                <div className="space-y-2">
                  {campaigns.slice(0,6).map((c:any)=><div key={c.id} className="p-3 border rounded-xl flex items-center justify-between">
                    <div><p className="text-sm font-semibold">{c.name}</p><p className="text-xs text-[var(--alo-text-muted)]">{c.platform} • Budget ৳{c.budget?.toLocaleString?.() || c.budget} • Status {c.status}</p></div>
                    <div className="flex gap-2"><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-7 text-xs"><Pause className="w-3 h-3 mr-1" />Pause</Button><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-7 text-xs bg-[var(--alo-brand)] text-white"><Play className="w-3 h-3 mr-1" />Activate</Button></div>
                  </div>)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600" />Performance & Cost</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Cost per Lead</p><p className="text-lg font-bold text-emerald-600 mt-1">৳ -</p><p className="text-[11px] text-[var(--alo-text-muted)]">Real: MarketingCampaignSource.cost / leads</p></div>
                <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Conversion Rate</p><p className="text-lg font-bold text-[var(--alo-brand)] mt-1">- %</p><p className="text-[11px] text-[var(--alo-text-muted)]">Leads → Qualified → Converted</p></div>
                <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Spend vs Approved</p><p className="text-xs text-[var(--alo-body)] mt-1">Enforced server-side: createAuditLog {`budget, approver, timestamp`}. Duplicate prevention: idempotency key.</p></div>
                <div className="p-3 bg-white border rounded-xl"><p className="font-semibold">Optimization</p><p className="text-xs text-[var(--alo-body)] mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-[var(--alo-cta)]" />AI recommends pausing low-CTR creatives.</p></div>
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)]">Data source: MarketingCampaignSource + MarketingLead.attribution. Reporting period selectable. Estimates clearly labeled vs actuals.</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 text-xs">
              <p className="font-bold text-amber-800 flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Financial Authorization Rule</p>
              <p className="text-amber-700 mt-2">AI proposes; human approves. Backend rejects `POST /api/marketing/campaigns` if `budget &gt; approvedBudget` without `MarketingApproval.status=approved`. Audit: MarketingAuditLog {'{action: campaign.budget.approve}'}.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-[11px] text-[var(--alo-text-muted)]">Blocked by credentials if `META_ACCESS_TOKEN` / `GOOGLE_ADS_*` not configured - UI shows “Integration not connected - connect in Integrations”.</p>
    </div>
  );
}
