'use client';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function CrmApplicationDetail() {
  const params = useParams();
  const id = params?.id as string;
  const token = usePortalStore(s => s.token);
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  const fetchApp = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/applications/${id}`, { headers:{ Authorization:`Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed ${res.status}`);
      const json = await res.json();
      setApp(json.application || json.data);
    } catch (e:any){ setError(e.message); } finally { setLoading(false); }
  }, [id, token]);

  useEffect(()=>{ fetchApp(); },[fetchApp]);

  if (loading) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--alo-brand)]" /></div>;
  if (error) return <div className="p-8 bg-white min-h-screen text-center"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm">{error}</p></div>;
  if (!app) return <div className="p-8 bg-white min-h-screen text-center">Application not found</div>;

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold text-[var(--alo-text)]">CRM — Application {app.applicationCode}</h1><Link href={`/application-manager/application/${id}`}><Button className="bg-[var(--alo-brand)] text-white">Open in Application Manager</Button></Link></div>
      <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Overview — CRM Alias with Same Security</CardTitle></CardHeader><CardContent className="p-4 space-y-2 text-sm"><p><strong>University:</strong> {app.universityName}</p><p><strong>Course:</strong> {app.courseName}</p><p><strong>Country:</strong> {app.country}</p><p><strong>Stage:</strong> {app.stage} — Safe: {app.safeStatus}</p><p><strong>Source:</strong> {app.applicationSource}</p>{app.isB2b ? <Badge className="bg-rose-50 text-rose-700 border-rose-200">B2B Confidential — backend stripped for unauthorized</Badge> : <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)]">Direct/Partner</Badge>}</CardContent></Card>
    </div>
  );
}
