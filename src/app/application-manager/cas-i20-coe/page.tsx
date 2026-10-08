'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, RefreshCw, Eye } from 'lucide-react';
import Link from 'next/link';

export default function CasI20CoePage() {
  const token = usePortalStore(s => s.token);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications?limit=50', { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setApps((json.applications || json.data || []).filter((a:any)=> a.casI20CoeStatus && a.casI20CoeStatus!=='NOT_STARTED'));
    } finally { setLoading(false); }
  }, [token]);

  useEffect(()=>{ fetchCas(); },[fetchCas]);

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[#0F172A]">CAS / I-20 / COE — Destination Mapping</h1><p className="text-sm text-gray-500">UK CAS USA I-20 Australia COE Canada LOA/PAL Ireland/NZ/Dubai Offer/Visa letter — real DB</p></div><Button variant="outline" className="border-[#E2E8F0]" onClick={fetchCas}><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} /></Button></div>
      {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2563EB]" /></div> : (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">CAS/I-20/COE Records ({apps.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[800px]"><thead><tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs text-gray-500"><th className="p-3">App Code</th><th className="p-3">Country</th><th className="p-3">University</th><th className="p-3">Doc Type</th><th className="p-3">Status</th><th className="p-3">Stage</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{apps.length===0 ? <tr><td colSpan={7} className="p-8 text-center text-gray-500">No CAS/I-20/COE records yet. Real DB empty.</td></tr> : apps.map((a:any)=>(
              <tr key={a.id} className="border-b border-[#E2E8F0]/60 hover:bg-[#F8FAFC]"><td className="p-3 font-mono text-xs text-[#2563EB]">{a.applicationCode}</td><td className="p-3">{a.country}</td><td className="p-3">{a.universityName}</td><td className="p-3"><Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px]">{a.country==='UK'?'CAS': a.country==='USA'?'I-20': a.country==='Australia'?'COE': a.country==='Canada'?'LOA/PAL':'OFFER'}</Badge></td><td className="p-3"><Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">{a.casI20CoeStatus}</Badge></td><td className="p-3 text-xs">{a.stage}</td><td className="p-3 text-right"><Link href={`/application-manager/application/${a.id}`}><Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button></Link></td></tr>
            ))}</tbody></table></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
