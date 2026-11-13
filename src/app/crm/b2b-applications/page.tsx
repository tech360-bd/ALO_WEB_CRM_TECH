'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Eye } from 'lucide-react';
import Link from 'next/link';

export default function CrmB2BApplications() {
  const token = usePortalStore(s => s.token);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const fetchB2B = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications/b2b', { headers:{ Authorization:`Bearer ${token}` } });
      if (res.status===403) { setError('Forbidden: B2B access requires permission — backend 403 enforced'); setLoading(false); return; }
      const json = await res.json();
      setApps(json.applications || json.data || []);
    } catch (e:any){ setError(e.message); } finally { setLoading(false); }
  }, [token]);

  useEffect(()=>{ fetchB2B(); },[fetchB2B]);

  if (loading) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--alo-brand)]" /></div>;
  if (error) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><div className="bg-crm-warning-bg border border-crm-warning-border rounded-2xl p-6 text-center max-w-md"><Lock className="w-8 h-8 text-crm-warning-text mx-auto mb-2" /><p className="text-sm text-crm-warning-text">{error}</p></div></div>;

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <h1 className="text-xl font-bold text-[var(--alo-text)]">CRM — B2B Applications (Alias)</h1>
      <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">B2B Applications ({apps.length}), 403 for unauthorized</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--alo-border)] bg-[var(--alo-page)] text-xs text-[var(--alo-text-muted)]"><th className="p-3">App</th><th className="p-3">Type</th><th className="p-3">Provider</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{apps.length===0 ? <tr><td colSpan={5} className="p-8 text-center text-[var(--alo-text-muted)]">No B2B applications</td></tr> : apps.map((a:any)=><tr key={a.id} className="border-b border-[var(--alo-border)]/60"><td className="p-3 font-mono text-xs">{a.application?.applicationCode || a.applicationId?.substring(0,8)}</td><td className="p-3"><Badge className="bg-crm-warning-bg text-crm-warning-text border-crm-warning-border text-[11px]">{a.b2bType}</Badge></td><td className="p-3">{a.b2bProvider?.name || a.b2bProviderId?.substring(0,8)}</td><td className="p-3"><Badge className="bg-crm-success-bg text-crm-success-text border-crm-success-border text-[11px]">{a.b2bStatus}</Badge></td><td className="p-3 text-right"><Link href={`/application-manager/application/${a.applicationId}`}><Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button></Link></td></tr>)}</tbody></table></div></CardContent></Card>
    </div>
  );
}
