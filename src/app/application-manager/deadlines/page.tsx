'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

export default function DeadlinesPage() {
  const token = usePortalStore(s => s.token);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchDeadlines = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter!=='all') params.set('due', filter);
      const res = await fetch(`/api/applications/deadlines?${params.toString()}`, { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setDeadlines(json.deadlines || json.data || []);
    } finally { setLoading(false); }
  }, [filter, token]);

  useEffect(()=>{ fetchDeadlines(); },[fetchDeadlines]);

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[var(--alo-text)]">Deadline Engine</h1><p className="text-sm text-[var(--alo-text-muted)]">Application/Document/Offer Condition/Deposit/CAS/I20/COE/B2B follow-up/University follow-up — DUE_TODAY/3_DAYS/7_DAYS/OVERDUE alerts tasks/notifications</p></div><Button variant="outline" className="border-[var(--alo-border)]" onClick={fetchDeadlines}><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} /></Button></div>
      <div className="flex gap-2"><select value={filter} onChange={e=>setFilter(e.target.value)} className="bg-white border border-[var(--alo-border)] rounded-xl px-3 py-2 text-sm"><option value="all">All Deadlines</option><option value="OVERDUE">OVERDUE</option><option value="DUE_TODAY">DUE_TODAY</option><option value="3_DAYS">3_DAYS</option><option value="7_DAYS">7_DAYS</option></select><Button className="bg-[var(--alo-brand)] text-white" onClick={fetchDeadlines}>Filter</Button></div>
      {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--alo-brand)]" /></div> : (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Deadlines ({deadlines.length})</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2">
            {deadlines.length===0 ? <p className="text-sm text-[var(--alo-text-muted)] py-6 text-center">No deadlines yet — upcoming deadlines will appear here automatically.</p> : deadlines.map((d:any)=>(
              <div key={d.id} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3 flex items-center justify-between"><div><p className="text-sm font-medium">{d.deadlineType?.replace(/_/g,' ')} — {d.application?.applicationCode || d.applicationId?.substring(0,8)}</p><p className="text-xs text-[var(--alo-text-muted)]">{new Date(d.deadlineDate).toLocaleString()} • {d.application?.universityName}</p></div><Badge className={`${d.status==='OVERDUE'?'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border': d.status==='DUE_TODAY'?'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border':'bg-[var(--alo-page)] border-[var(--alo-border)]'} text-[11px]`}>{d.slaStatus || d.status}</Badge></div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
