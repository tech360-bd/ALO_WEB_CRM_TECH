'use client';
import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateB2BApplicationPage() {
  const token = usePortalStore(s => s.token);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [form, setForm] = useState({ applicationId:'', b2bProviderId:'', b2bType:'B2B_OUTBOUND', b2bReference:'', submissionRoute:'B2B_OUTBOUND', b2bCommissionType:'', b2bCommissionAmount:0, b2bPaymentCondition:'', b2bClaimStage:'NOT_CLAIMED', b2bInternalNote:'' });

  useEffect(()=>{
    fetch('/api/b2b/providers', { headers:{ Authorization:`Bearer ${token}` } }).then(r=>r.json()).then(j=>setProviders(j.providers || j.data || [])).catch(()=>{});
  },[token]);

  const handleSubmit = async (e:any) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    try {
      const res = await fetch('/api/applications/b2b', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setMsg({type:'success', text:`B2B Application created — confidential timeline, student will NOT see provider details`});
      setTimeout(()=> router.push(`/application-manager/application/${form.applicationId}`), 1200);
    } catch (err:any){ setMsg({type:'error', text: err.message}); } finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center"><Lock className="w-5 h-5 text-white" /></div><div><h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">Create B2B Application <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">CONFIDENTIAL</Badge></h1><p className="text-sm text-gray-500">B2B provider details encrypted, never in normal response, 403 for unauthorized</p></div></div>
        {msg && <div className={`p-3 rounded-xl border text-sm ${msg.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">B2B Application — Confidential Fields Backend Secured</CardTitle></CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12"><label className="text-xs font-medium">Application ID * (existing application)</label><Input required value={form.applicationId} onChange={e=>setForm({...form, applicationId:e.target.value})} className="bg-white border-[#E2E8F0]" placeholder="Application.id from /applications" /></div>
                <div className="col-span-12"><label className="text-xs font-medium">B2B Provider *</label><select required value={form.b2bProviderId} onChange={e=>setForm({...form, b2bProviderId:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"><option value="">Select B2B Provider</option>{providers.map(p=><option key={p.id} value={p.id}>{p.name} — {p.providerCode} — {p.providerType}</option>)}</select><p className="text-[11px] text-gray-500 mt-1">Provider name/ID/contact/email/phone/portal URL/credentials — only APPLICATION_MANAGER/TEAM/SUPER_ADMIN</p></div>
                <div className="col-span-6"><label className="text-xs font-medium">B2B Type</label><select value={form.b2bType} onChange={e=>setForm({...form, b2bType:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"><option value="B2B_INBOUND">B2B_INBOUND</option><option value="B2B_OUTBOUND">B2B_OUTBOUND</option></select></div>
                <div className="col-span-6"><label className="text-xs font-medium">Submission Route</label><select value={form.submissionRoute} onChange={e=>setForm({...form, submissionRoute:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"><option value="B2B_INBOUND">B2B_INBOUND</option><option value="B2B_OUTBOUND">B2B_OUTBOUND</option><option value="DIRECT_UNIVERSITY_PORTAL">DIRECT_UNIVERSITY_PORTAL</option><option value="EMAIL">EMAIL</option><option value="UNIVERSITY_REPRESENTATIVE">UNIVERSITY_REPRESENTATIVE</option></select></div>
                <div className="col-span-6"><label className="text-xs font-medium">B2B Reference</label><Input value={form.b2bReference} onChange={e=>setForm({...form, b2bReference:e.target.value})} className="bg-white border-[#E2E8F0]" /></div>
                <div className="col-span-6"><label className="text-xs font-medium">Commission Amount</label><Input type="number" value={form.b2bCommissionAmount} onChange={e=>setForm({...form, b2bCommissionAmount: parseFloat(e.target.value)||0})} className="bg-white border-[#E2E8F0]" /></div>
                <div className="col-span-12"><label className="text-xs font-medium">Internal Note — Confidential (never to student)</label><textarea value={form.b2bInternalNote} onChange={e=>setForm({...form, b2bInternalNote:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm min-h-[80px]" placeholder="Internal B2B notes, payment conditions, claim stage — backend filtered" /></div>
              </div>
              <Button type="submit" disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white w-full md:w-auto min-h-[48px]">{loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : 'Create B2B Application — Confidential'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
