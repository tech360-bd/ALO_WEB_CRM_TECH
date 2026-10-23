'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function CrmOfferLetterManagement() {
  const token = usePortalStore(s => s.token);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications?limit=50', { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setApps((json.applications || json.data || []).filter((a:any)=> a.offerStatus && a.offerStatus!=='PENDING'));
    } finally { setLoading(false); }
  }, [token]);
  useEffect(()=>{ fetchOffers(); },[fetchOffers]);
  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <h1 className="text-xl font-bold text-[var(--alo-text)]">CRM — Offer Letter Management (Alias)</h1>
      {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--alo-brand)]" /></div> : (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Offers ({apps.length})</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--alo-border)] bg-[var(--alo-page)] text-xs text-[var(--alo-text-muted)]"><th className="p-3">App</th><th className="p-3">University</th><th className="p-3">Offer Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{apps.length===0 ? <tr><td colSpan={4} className="p-8 text-center text-[var(--alo-text-muted)]">No offers</td></tr> : apps.map((a:any)=><tr key={a.id} className="border-b border-[var(--alo-border)]/60"><td className="p-3 font-mono text-xs">{a.applicationCode}</td><td className="p-3">{a.universityName}</td><td className="p-3"><Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px]">{a.offerStatus}</Badge></td><td className="p-3 text-right"><Link href={`/application-manager/application/${a.id}`}><Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button></Link></td></tr>)}</tbody></table></div></CardContent></Card>
      )}
    </div>
  );
}
