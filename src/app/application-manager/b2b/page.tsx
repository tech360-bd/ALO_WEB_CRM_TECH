'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Building2, Shield, Eye, RefreshCw, Loader2, AlertTriangle, Plus } from 'lucide-react';
import Link from 'next/link';

export default function B2bApplicationsPage() {
  const token = usePortalStore(s => s.token);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchB2b = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/applications/b2b', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) { setError('Forbidden: B2B access requires application.view_b2b permission'); setLoading(false); return; }
      if (!res.ok) throw new Error(`Failed ${res.status}`);
      const json = await res.json();
      setApps(json.applications || json.data || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchB2b(); }, [fetchB2b]);

  if (loading) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--alo-brand)]" /></div>;
  if (error) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-2xl p-6 text-center max-w-md"><AlertTriangle className="w-8 h-8 text-crm-warning-text mx-auto mb-2" /><p className="text-sm">{error}</p><Button onClick={fetchB2b} className="mt-3 bg-[var(--alo-brand)] text-white">Retry</Button></div></div>;

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--alo-error)] flex items-center justify-center"><Lock className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-[var(--alo-text)] flex items-center gap-2">B2B Application Management <Badge className="bg-crm-warning-bg text-crm-warning-text border-crm-warning-border text-[11px]">RESTRICTED</Badge></h1><p className="text-sm text-[var(--alo-text-muted)]">Confidential Inbound & Outbound — backend 403 enforced, fields stripped for unauthorized</p></div>
        </div>
        <div className="flex gap-2"><Link href="/application-manager/b2b/providers"><Button variant="outline" className="border-[var(--alo-border)]"><Building2 className="w-4 h-4 mr-1" />Providers</Button></Link><Link href="/application-manager/b2b/create"><Button className="bg-[var(--alo-brand)] text-white"><Plus className="w-4 h-4 mr-1" />Create B2B App</Button></Link><Button variant="outline" className="border-[var(--alo-border)]" onClick={fetchB2b}><RefreshCw className="w-4 h-4" /></Button></div>
      </div>

      <div className="bg-crm-warning-bg border border-crm-warning-border rounded-2xl p-4 flex gap-3"><Shield className="w-5 h-5 text-crm-warning-text flex-shrink-0 mt-0.5" /><div className="text-xs text-crm-warning-text"><p className="font-semibold">Strict Security Enforcement Active</p><p>B2B provider credentials, portal URLs, commission margins stripped from Student, Partner, Counselor API responses. Unauthorized B2B API returns 403.</p></div></div>

      <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
        <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Active B2B Submissions ({apps.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead><tr className="border-b border-[var(--alo-border)] bg-[var(--alo-page)] text-xs text-[var(--alo-text-muted)]"><th className="p-3">App Code</th><th className="p-3">Student</th><th className="p-3">B2B Type</th><th className="p-3">Provider</th><th className="p-3">Reference</th><th className="p-3">University & Course</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
              <tbody>
                {apps.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-[var(--alo-text-muted)]">No active B2B applications. Nothing here yet — create a B2B application to get started.</td></tr> : apps.map((app: any) => (
                  <tr key={app.id} className="border-b border-[var(--alo-border)]/60 hover:bg-[var(--alo-page)]">
                    <td className="p-3 font-mono text-xs text-[var(--alo-brand)]">{app.application?.applicationCode || app.applicationId?.substring(0, 8)}</td>
                    <td className="p-3 font-medium">{app.application?.studentId?.substring(0, 8) || app.applicationId?.substring(0, 8)}</td>
                    <td className="p-3"><Badge className="bg-crm-warning-bg text-crm-warning-text border-crm-warning-border text-[11px]">{app.b2bType}</Badge></td>
                    <td className="p-3 text-crm-warning-text font-medium">{app.b2bProvider?.name || app.b2bProviderId?.substring(0, 8)}</td>
                    <td className="p-3 font-mono text-xs">{app.b2bReference || 'REF-PENDING'}</td>
                    <td className="p-3 text-xs">{app.application?.universityName} — {app.application?.courseName}</td>
                    <td className="p-3"><Badge className="bg-crm-success-bg text-crm-success-text border-crm-success-border text-[11px]">{app.b2bStatus}</Badge></td>
                    <td className="p-3 text-right"><Link href={`/application-manager/application/${app.applicationId}`}><Button size="sm" variant="ghost" className="text-[var(--alo-brand)]"><Eye className="w-4 h-4 mr-1" />Inspect</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
