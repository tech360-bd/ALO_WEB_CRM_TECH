'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Send, Clock, AlertTriangle, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function SubmissionQueuePage() {
  const token = usePortalStore(s => s.token);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications?status=SUBMITTED&limit=50', { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setApps(json.applications || json.data || []);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(()=>{ fetchQueue(); },[fetchQueue]);

  const queues = [
    { label:'Ready to Submit', filter: (a:any)=> a.stage==='READY_TO_SUBMIT' },
    { label:'Missing Document', filter: (a:any)=> a.documentStatus==='PENDING' || a.documentStatus==='INCOMPLETE' },
    { label:'Fee Pending', filter: (a:any)=> a.paymentStatus==='PENDING' || a.applicationFeeStatus==='PENDING' },
    { label:'Waiting Counselor', filter: (a:any)=> a.reviewStatus==='PENDING' },
    { label:'B2B Follow-up', filter: (a:any)=> a.isB2b },
    { label:'University Follow-up', filter: (a:any)=> a.stage==='SUBMITTED_TO_UNIVERSITY' },
    { label:'Deadline Urgent', filter: (a:any)=> a.slaStatus==='OVERDUE' || a.slaStatus==='DUE_TODAY' },
  ];

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div><h1 className="text-xl font-bold text-[var(--alo-text)]">Submission Queue Status</h1><p className="text-sm text-[var(--alo-text-muted)]">Ready/Missing Doc/Fee Pending/Waiting Counselor/Partner/B2B follow-up/University follow-up/Deadline urgent</p></div>
      {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--alo-brand)]" /></div> : (
        <div className="grid grid-cols-12 gap-4">
          {queues.map((q, idx)=>(
            <div key={idx} className="col-span-12 md:col-span-6 lg:col-span-4">
              <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
                <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm flex items-center justify-between">{q.label}<Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)] text-[11px]">{apps.filter(q.filter).length}</Badge></CardTitle></CardHeader>
                <CardContent className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                  {apps.filter(q.filter).slice(0,5).map((app:any)=>(
                    <div key={app.id} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2.5 flex items-center justify-between"><div><p className="text-xs font-medium truncate">{app.applicationCode} — {app.universityName}</p><p className="text-[11px] text-[var(--alo-text-muted)]">{app.stage}</p></div><Link href={`/application-manager/application/${app.id}`}><Button size="sm" variant="ghost" className="h-7"><Eye className="w-3 h-3" /></Button></Link></div>
                  ))}
                  {apps.filter(q.filter).length===0 && <p className="text-xs text-[var(--alo-text-muted)] py-4 text-center">No applications in this queue.</p>}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
