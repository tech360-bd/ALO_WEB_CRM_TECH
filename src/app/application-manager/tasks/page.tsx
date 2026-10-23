'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function TasksPage() {
  const token = usePortalStore(s => s.token);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications/tasks', { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setTasks(json.tasks || json.data || []);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(()=>{ fetchTasks(); },[fetchTasks]);

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[var(--alo-text)]">Tasks</h1><p className="text-sm text-[var(--alo-text-muted)]">Application tasks with audit, assignedTo, priority, dueDate</p></div><Button variant="outline" className="border-[var(--alo-border)]" onClick={fetchTasks}><Clock className="w-4 h-4 mr-1" />Refresh</Button></div>
      {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--alo-brand)]" /></div> : (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Pending Tasks ({tasks.length})</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2">
            {tasks.length===0 ? <p className="text-sm text-[var(--alo-text-muted)] py-6 text-center">No pending tasks. Nothing here yet.</p> : tasks.map((t:any)=>(
              <div key={t.id} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3 flex items-center justify-between">
                <div><p className="text-sm font-medium text-[var(--alo-text)]">{t.taskTitle}</p><p className="text-xs text-[var(--alo-text-muted)]">{t.application?.applicationCode || t.applicationId?.substring(0,8)} • {t.assignedToName || t.assignedTo} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}</p></div>
                <div className="flex items-center gap-2"><Badge className={`${t.priority==='URGENT'?'bg-red-50 text-red-700 border-red-200': t.priority==='HIGH'?'bg-amber-50 text-amber-700 border-amber-200':'bg-[var(--alo-page)] border-[var(--alo-border)]'} text-[11px]`}>{t.priority}</Badge><Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[11px]">{t.status}</Badge><Link href={`/application-manager/application/${t.applicationId}`}><Button size="sm" variant="ghost" className="h-7">View</Button></Link></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
