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
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[#0F172A]">Deadline Engine — Real DB</h1><p className="text-sm text-gray-500">Application/Document/Offer Condition/Deposit/CAS/I20/COE/B2B follow-up/University follow-up — DUE_TODAY/3_DAYS/7_DAYS/OVERDUE alerts tasks/notifications</p></div><Button variant="outline" className="border-[#E2E8F0]" onClick={fetchDeadlines}><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} /></Button></div>
      <div className="flex gap-2"><select value={filter} onChange={e=>setFilter(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"><option value="all">All Deadlines</option><option value="OVERDUE">OVERDUE</option><option value="DUE_TODAY">DUE_TODAY</option><option value="3_DAYS">3_DAYS</option><option value="7_DAYS">7_DAYS</option></select><Button className="bg-[#2563EB] text-white" onClick={fetchDeadlines}>Filter</Button></div>
      {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2563EB]" /></div> : (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Deadlines ({deadlines.length})</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2">
            {deadlines.length===0 ? <p className="text-sm text-gray-500 py-6 text-center">No deadlines. Real DB empty — deadline engine will populate DUE_TODAY/3_DAYS/7_DAYS/OVERDUE.</p> : deadlines.map((d:any)=>(
              <div key={d.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between"><div><p className="text-sm font-medium">{d.deadlineType?.replace(/_/g,' ')} — {d.application?.applicationCode || d.applicationId?.substring(0,8)}</p><p className="text-xs text-gray-500">{new Date(d.deadlineDate).toLocaleString()} • {d.application?.universityName}</p></div><Badge className={`${d.status==='OVERDUE'?'bg-red-50 text-red-700 border-red-200': d.status==='DUE_TODAY'?'bg-amber-50 text-amber-700 border-amber-200':'bg-[#F8FAFC] border-[#E2E8F0]'} text-[10px]`}>{d.slaStatus || d.status}</Badge></div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
