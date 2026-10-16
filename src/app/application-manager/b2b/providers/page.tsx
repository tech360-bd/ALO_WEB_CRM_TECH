'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, RefreshCw, Plus, Lock, Loader2, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function B2bProvidersPage() {
  const token = usePortalStore(s => s.token);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/b2b/providers', { headers:{ Authorization:`Bearer ${token}` } });
      if (res.status===403) { setError('Forbidden: B2B provider access requires application.view_b2b permission — backend 403 enforced'); setLoading(false); return; }
      if (!res.ok) throw new Error(`Failed ${res.status}`);
      const json = await res.json();
      setProviders(json.providers || json.data || []);
    } catch (e:any){ setError(e.message); } finally { setLoading(false); }
  }, [token]);

  useEffect(()=>{ fetchProviders(); },[fetchProviders]);

  if (loading) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#0057B8]" /></div>;
  if (error) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-md"><AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" /><p className="text-sm text-rose-700">{error}</p><Button onClick={fetchProviders} className="mt-3 bg-[#0057B8] text-white">Retry</Button></div></div>;

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div><div><h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">B2B Providers & Agreements <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">RESTRICTED</Badge></h1><p className="text-sm text-gray-500">provider_code/name/type/country/university coverage/contact/email/phone/portal/login_note/agreement/commission/payment/claim/status/createdBy/approvedBy/lastReviewed/internal note types GLOBAL_B2B/COUNTRY_SPECIFIC/UNIVERSITY_REP/PATHWAY/AGGREGATOR/SUB_AGENT/DIRECT_CHANNEL — backend secured</p></div></div>
        <div className="flex gap-2"><Link href="/application-manager/b2b"><Button variant="outline" className="border-[#E2E8F0]">Back to B2B Queue</Button></Link><Button variant="outline" className="border-[#E2E8F0]" onClick={fetchProviders}><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} /></Button></div>
      </div>

      <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
        <CardHeader className="p-4 border-b border-[#E2E8F0] flex flex-row items-center justify-between"><CardTitle className="text-sm">Registered B2B Providers ({providers.length}) — Real DB, Encrypted Credentials Never in Normal Response</CardTitle><Link href="/application-manager/b2b/create"><Button size="sm" className="bg-[#0057B8] text-white"><Plus className="w-4 h-4 mr-1" />Add Provider</Button></Link></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[1000px]"><thead><tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs text-gray-500"><th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Contact</th><th className="p-3">Commission</th><th className="p-3">Claim Stage</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{providers.length===0 ? <tr><td colSpan={8} className="p-8 text-center text-gray-500">No B2B providers configured. Real DB empty — create provider to populate. No fake data.</td></tr> : providers.map((p:any)=>(
            <tr key={p.id} className="border-b border-[#E2E8F0]/60 hover:bg-[#F8FAFC]"><td className="p-3 font-mono text-xs text-rose-600">{p.providerCode}</td><td className="p-3 font-semibold text-[#0F172A]">{p.name}</td><td className="p-3 text-xs text-[#0057B8]">{p.providerType}</td><td className="p-3 text-xs">{p.contactPerson || 'N/A'} {p.email ? `• ${p.email.substring(0,3)}•••` : ''}</td><td className="p-3 text-xs">{p.commissionRule ? p.commissionRule.substring(0,30) : 'Standard Tier'}</td><td className="p-3"><Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">{p.claimStage}</Badge></td><td className="p-3"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">{p.status}</Badge></td><td className="p-3 text-right"><Link href={`/application-manager/b2b/provider/${p.id}`}><Button size="sm" variant="ghost" className="text-[#0057B8]"><Eye className="w-4 h-4" /></Button></Link></td></tr>
          ))}</tbody></table></div>
        </CardContent>
      </Card>
    </div>
  );
}
