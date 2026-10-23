'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HrmSecurityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=> { fetch('/api/hrm/security').then(r=>r.json()).then(j=> setData(j.data)).finally(()=> setLoading(false)); }, []);
  if (loading) return <div className="min-h-screen bg-white p-6 text-xs text-[var(--alo-text-muted)]">Loading login security...</div>;
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div><h1 className="text-xl font-bold text-[var(--alo-text)]">Login Security</h1><p className="text-xs text-[var(--alo-text-muted)]">IP Address • Browser • OS • Device Fingerprint • Location • Login/Logout • Failed Login • Session History — Webcam capture disabled by design (browser permission required)</p></div>
      <Card className="bg-amber-50 border-amber-200"><CardContent className="p-3 text-xs text-amber-800">Note: Never automatically capture webcam photos without explicit user permission. Modern browsers require permission for camera access. Photo verification is optional permission-based or desktop agent integration.</CardContent></Card>
      <Card className="bg-white border-[var(--alo-border)]"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Session History ({data?.logs?.length||0})</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-auto"><table className="w-full text-xs"><thead className="bg-[var(--alo-page)] text-[var(--alo-text-muted)]"><tr><th className="p-2 text-left">Time</th><th className="p-2">IP</th><th className="p-2">Browser</th><th className="p-2">OS</th><th className="p-2">Device</th><th className="p-2">Location</th><th className="p-2">Status</th></tr></thead>
        <tbody>{(data?.logs||[]).length ? data.logs.map((l:any)=> <tr key={l.id} className="border-t"><td className="p-2 font-mono">{new Date(l.loginAt).toLocaleString()}</td><td className="p-2 font-mono">{l.ipAddress}</td><td className="p-2">{l.browser||'-'}</td><td className="p-2">{l.os||'-'}</td><td className="p-2 truncate max-w-[150px]">{l.device||l.fingerprint||'-'}</td><td className="p-2">{l.location||'-'}</td><td className="p-2 text-center">{l.success ? <Badge className="bg-emerald-600 text-white text-xs">success</Badge> : <Badge className="bg-red-600 text-white text-xs">failed</Badge>}</td></tr>) : <tr><td colSpan={7} className="p-6 text-center text-[var(--alo-text-muted)]">No login history</td></tr>}</tbody></table></CardContent></Card>
    </div>
  );
}
