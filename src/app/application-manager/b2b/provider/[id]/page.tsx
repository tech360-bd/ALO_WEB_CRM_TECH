'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, Building2, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

export default function B2BProviderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const token = usePortalStore(s => s.token);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<any>(null);

  const fetchProvider = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/b2b/providers/${id}`, { headers:{ Authorization:`Bearer ${token}` } });
      if (res.status===403) { setError('Forbidden: B2B provider access requires application.view_b2b permission'); setLoading(false); return; }
      if (!res.ok) throw new Error(`Failed ${res.status}`);
      const json = await res.json();
      setProvider(json.provider || json.data);
    } catch (e:any){ setError(e.message); } finally { setLoading(false); }
  }, [id, token]);

  useEffect(()=>{ fetchProvider(); },[fetchProvider]);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`/api/b2b/providers/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(provider) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setMsg({type:'success', text:'Provider updated — audit logged'});
      setProvider(json.provider || json.data);
    } catch (e:any){ setMsg({type:'error', text:e.message}); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" /></div>;
  if (error) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 text-center max-w-md"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm">{error}</p></div></div>;
  if (!provider) return <div className="p-8 bg-white min-h-screen text-center">Provider not found</div>;

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div><div><h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">{provider.name} <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]"><Lock className="w-3 h-3 mr-1" />CONFIDENTIAL</Badge></h1><p className="text-sm text-gray-500">{provider.providerCode} • {provider.providerType} • {provider.status}</p></div></div>
      {msg && <div className={`p-3 rounded-xl border text-sm ${msg.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
            <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">B2B Provider Details — Encrypted Credentials Never in Normal Response</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6"><label className="text-xs font-medium">Provider Code</label><Input value={provider.providerCode||''} onChange={e=>setProvider({...provider, providerCode:e.target.value})} className="bg-white border-[#E2E8F0]" /></div>
                <div className="col-span-12 md:col-span-6"><label className="text-xs font-medium">Name</label><Input value={provider.name||''} onChange={e=>setProvider({...provider, name:e.target.value})} className="bg-white border-[#E2E8F0]" /></div>
                <div className="col-span-6"><label className="text-xs font-medium">Type</label><select value={provider.providerType||'GLOBAL_B2B'} onChange={e=>setProvider({...provider, providerType:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"><option value="GLOBAL_B2B">GLOBAL_B2B</option><option value="COUNTRY_SPECIFIC_B2B">COUNTRY_SPECIFIC_B2B</option><option value="UNIVERSITY_REPRESENTATIVE">UNIVERSITY_REPRESENTATIVE</option><option value="PATHWAY_PROVIDER">PATHWAY_PROVIDER</option><option value="AGGREGATOR">AGGREGATOR</option><option value="SUB_AGENT_NETWORK">SUB_AGENT_NETWORK</option><option value="DIRECT_UNIVERSITY_CHANNEL">DIRECT_UNIVERSITY_CHANNEL</option></select></div>
                <div className="col-span-6"><label className="text-xs font-medium">Status</label><select value={provider.status||'ACTIVE'} onChange={e=>setProvider({...provider, status:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="SUSPENDED">SUSPENDED</option></select></div>
                <div className="col-span-6"><label className="text-xs font-medium">Contact Person</label><Input value={provider.contactPerson||''} onChange={e=>setProvider({...provider, contactPerson:e.target.value})} className="bg-white border-[#E2E8F0]" /></div>
                <div className="col-span-6"><label className="text-xs font-medium">Email (confidential)</label><Input value={provider.email||''} onChange={e=>setProvider({...provider, email:e.target.value})} className="bg-white border-[#E2E8F0]" /></div>
                <div className="col-span-6"><label className="text-xs font-medium">Phone (confidential)</label><Input value={provider.phone||''} onChange={e=>setProvider({...provider, phone:e.target.value})} className="bg-white border-[#E2E8F0]" /></div>
                <div className="col-span-6"><label className="text-xs font-medium">Portal URL (confidential)</label><Input value={provider.portalUrl||''} onChange={e=>setProvider({...provider, portalUrl:e.target.value})} className="bg-white border-[#E2E8F0]" /></div>
                <div className="col-span-12"><label className="text-xs font-medium">Login Note — Encrypted Credentials Never in Normal Response</label><textarea value={provider.loginNote||''} onChange={e=>setProvider({...provider, loginNote:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm min-h-[80px]" placeholder="Portal credentials — encrypted, only APPLICATION_MANAGER can view" /></div>
                <div className="col-span-12"><label className="text-xs font-medium">Commission Rule (confidential)</label><textarea value={provider.commissionRule||''} onChange={e=>setProvider({...provider, commissionRule:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm min-h-[60px]" /></div>
                <div className="col-span-12"><label className="text-xs font-medium">Internal Note (confidential)</label><textarea value={provider.internalNote||''} onChange={e=>setProvider({...provider, internalNote:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm min-h-[60px]" /></div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-[#2563EB] text-white min-h-[48px]">{saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Provider — Audit Logged'}</Button>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
            <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-[#2563EB]" />Security & Audit</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="font-semibold">Created By</p><p className="text-gray-600">{provider.createdBy?.substring(0,8) || 'System'}</p></div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="font-semibold">Last Reviewed</p><p className="text-gray-600">{provider.lastReviewedAt ? new Date(provider.lastReviewedAt).toLocaleString() : 'Never'}</p></div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3"><p className="font-semibold text-rose-800">Confidential Fields</p><p className="text-rose-600 mt-1">email, phone, portalUrl, loginNote, commissionRule, paymentCondition, internalNote — stripped for unauthorized roles. Backend 403 enforced.</p></div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3"><p className="font-semibold">B2B Applications</p><p className="text-2xl font-bold text-[#0F172A]">{provider.b2bApplications?.length || provider._count?.b2bApplications || 0}</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
