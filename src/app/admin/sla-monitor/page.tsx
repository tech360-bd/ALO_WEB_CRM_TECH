'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function SlaMonitorPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSla = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/ucc/sla');
      const json = await res.json();
      setData(json);
    } catch {}
    setLoading(false);
  };

  const triggerCheck = async () => {
    try {
      const res = await fetch('/api/cron/sla-monitor', { method: 'POST' });
      const json = await res.json();
      if (json.success) toast.success(`Escalated ${json.escalated} threads`);
      fetchSla();
    } catch (e: any) { toast.error(e.message); }
  };

  useEffect(() => { fetchSla(); }, []);

  return (
    <div className="p-6 space-y-6 bg-[var(--alo-text)] min-h-screen text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SLA Monitor — 30/20/10 Escalation</h1>
            <p className="text-[var(--alo-text-muted)] text-sm">Counselor 30m → Branch Manager 20m → CEO 10m → Global Alarm • Asia/Dhaka • Sat-Thu 09:00-18:00 • Fri Closed</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSla} variant="outline" className="border-white/10"><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button onClick={triggerCheck} className="bg-amber-600 hover:bg-amber-700"><Zap className="w-4 h-4 mr-2" />Trigger SLA Check</Button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[var(--alo-text)] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Total Overdue</p><p className="text-2xl font-bold text-rose-400">{data.summary?.totalOverdue || data.overdueThreads?.length || 0}</p></CardContent></Card>
          <Card className="bg-[var(--alo-text)] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">By Counselor</p><p className="text-sm font-mono">{JSON.stringify(data.summary?.byCounselor || {}).slice(0,60)}</p></CardContent></Card>
          <Card className="bg-[var(--alo-text)] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">SLA Events</p><p className="text-xl font-bold">{data.slaEvents?.length || 0}</p></CardContent></Card>
          <Card className="bg-[var(--alo-text)] border-white/10 text-white"><CardContent className="p-4"><p className="text-xs text-[var(--alo-text-muted)]">Incidents</p><p className="text-xl font-bold">{data.incidents?.length || 0}</p></CardContent></Card>
        </div>
      )}

      <Card className="bg-[var(--alo-text)] border-white/10 text-white">
        <CardHeader><CardTitle className="text-sm">Overdue Threads (Level 1/2/3)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(data?.overdueThreads || []).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
              <div><span className="font-mono font-bold">{t.id.slice(0,8)}</span> • {t.channel} • Assigned: {t.assignedToName || t.assignedToId || 'unassigned'}</div>
              <div className="flex items-center gap-2">
                <Badge className={t.slaStatus?.includes('level1') ? 'bg-amber-500/20 text-amber-300' : t.slaStatus?.includes('level2') ? 'bg-[var(--alo-cta)]/20 text-orange-300' : 'bg-rose-500/20 text-rose-300'}>{t.slaStatus}</Badge>
                <span className="text-[var(--alo-text-muted)]">{t.slaDueAt ? new Date(t.slaDueAt).toLocaleString() : ''}</span>
              </div>
            </div>
          ))}
          {(!data?.overdueThreads || data.overdueThreads.length===0) && <p className="text-xs text-[var(--alo-text-muted)]">No overdue threads</p>}
        </CardContent>
      </Card>

      <Card className="bg-[var(--alo-text)] border-white/10 text-white">
        <CardHeader><CardTitle className="text-sm">Escalation Levels</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"><p className="font-bold text-amber-300">LEVEL 1 — Counselor Overdue (30m)</p><p className="text-[var(--alo-placeholder)] mt-1">Notify employee + Branch Manager, create task, warning badge</p></div>
          <div className="p-3 rounded-lg bg-[var(--alo-cta)]/10 border border-[var(--alo-cta)]/20"><p className="font-bold text-orange-300">LEVEL 2 — Manager Overdue (+20m = 50m)</p><p className="text-[var(--alo-placeholder)] mt-1">Notify CEO/Super Admin, urgent task, urgent badge</p></div>
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20"><p className="font-bold text-rose-300">LEVEL 3 — CEO Overdue (+10m = 60m)</p><p className="text-[var(--alo-placeholder)] mt-1">Global alarm, notify authorized, critical badge, browser sound optional</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
