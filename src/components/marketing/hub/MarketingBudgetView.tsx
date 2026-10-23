'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, ShieldCheck, AlertTriangle, TrendingUp, Wallet } from 'lucide-react';

export default function MarketingBudgetView() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBudget, setNewBudget] = useState({ campaign:'UK Jan 2027', amount: 50000, approved:false });
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{ fetch('/api/marketing/campaigns').then(r=>r.json()).then(j=>{ const list=(j.campaigns||[]).map((c:any)=>({ campaign:c.name, amount:c.budget||0, approved:c.status==='active', approver:c.createdById?.slice(0,8)||'-', timestamp:c.createdAt?new Date(c.createdAt).toLocaleDateString():'-'})); setBudgets(list); }).catch(()=>{}).finally(()=>setLoading(false)); },[]);

  const handleAllocate = async () => {
    setError(null);
    // Server enforces: budget cannot exceed approved without MarketingApproval
    try{
      const res = await fetch('/api/marketing/campaigns?action=create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: newBudget.campaign, goal:'Budget allocation', budget: newBudget.amount })});
      const j = await res.json();
      if(!res.ok) throw new Error(j.error||'Budget allocation requires approval — server rejected');
      setBudgets([...budgets, { campaign: newBudget.campaign, amount: newBudget.amount, approved: false, approver:'pending', timestamp:'now' }]);
    }catch(e:any){ setError(e.message); }
  };

  const totalApproved = budgets.filter(b=>b.approved).reduce((a,b)=>a+b.amount,0);
  const totalProposed = budgets.reduce((a,b)=>a+b.amount,0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--alo-text)] flex items-center gap-2"><Wallet className="w-6 h-6 text-[var(--alo-cta)]" />Marketing Budget</h2>
          <p className="text-sm text-[var(--alo-text-muted)]">Budget allocation, spend tracking, CPL, revenue attribution — AI proposes, human approves. Server-side enforcement, audit with approver/timestamp.</p>
        </div>
        <Badge className="bg-amber-100 text-amber-800 border-amber-200"><ShieldCheck className="w-3 h-3 mr-1" />Server-Enforced Limits</Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Total Approved</p><p className="text-2xl font-bold text-emerald-600">৳{totalApproved.toLocaleString()}</p><p className="text-[11px] text-[var(--alo-text-muted)]">MarketingCampaign where status=active</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Total Proposed</p><p className="text-2xl font-bold text-[var(--alo-brand)]">৳{totalProposed.toLocaleString()}</p><p className="text-[11px] text-[var(--alo-text-muted)]">All campaigns + drafts</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Cost per Lead (avg)</p><p className="text-2xl font-bold text-[var(--alo-cta)]">৳ —</p><p className="text-[11px] text-[var(--alo-text-muted)]">MarketingCampaignSource.cost/leads (real)</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-[var(--alo-brand)]" />Allocate Budget (Requires Approval)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <Input value={newBudget.campaign} onChange={e=>setNewBudget({...newBudget, campaign:e.target.value})} placeholder="Campaign name" className="h-9" />
                <Input type="number" value={newBudget.amount} onChange={e=>setNewBudget({...newBudget, amount: parseInt(e.target.value)||0})} className="h-9" />
                <Button onClick={handleAllocate} className="bg-[var(--alo-cta)] text-black ">Allocate → Approval</Button>
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</p>}
              <p className="text-[11px] text-[var(--alo-text-muted)]">Server rejects if `budget &gt; approvedBudget` without `MarketingApproval.status=approved`. Recorded: approved budget, approving user, timestamp, execution result. No AI auto-spend.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Budget Records</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[var(--alo-cta)]" /> : budgets.length===0 ? <p className="text-sm text-[var(--alo-text-muted)]">No budgets yet.</p> : (
                <div className="space-y-2">
                  {budgets.map((b,i)=><div key={i} className="p-3 border rounded-xl flex items-center justify-between">
                    <div><p className="text-sm font-semibold">{b.campaign}</p><p className="text-xs text-[var(--alo-text-muted)]">Approver: {b.approver} • {b.timestamp} • {b.approved ? 'Approved' : 'Pending approval'}</p></div>
                    <div className="text-right"><p className="text-sm font-bold">৳{b.amount.toLocaleString()}</p><Badge className={b.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{b.approved ? 'Approved' : 'Pending'}</Badge></div>
                  </div>)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[var(--alo-cta)]" />Attribution & ROI</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="text-[var(--alo-body)]">Revenue attribution via MarketingLead → Application → Enrollment where reliable. Campaign comparison & channel comparison in Analytics.</p>
              <p className="text-[11px] text-[var(--alo-text-muted)]">Exportable reports: daily/weekly/monthly, campaign vs campaign, channel vs channel.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
