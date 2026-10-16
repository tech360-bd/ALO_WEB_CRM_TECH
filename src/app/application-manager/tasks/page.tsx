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
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[#0F172A]">Tasks — Real DB</h1><p className="text-sm text-gray-500">Application tasks with audit, assignedTo, priority, dueDate</p></div><Button variant="outline" className="border-[#E2E8F0]" onClick={fetchTasks}><Clock className="w-4 h-4 mr-1" />Refresh</Button></div>
      {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0057B8]" /></div> : (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Pending Tasks ({tasks.length})</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2">
            {tasks.length===0 ? <p className="text-sm text-gray-500 py-6 text-center">No pending tasks. Real DB empty.</p> : tasks.map((t:any)=>(
              <div key={t.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between">
                <div><p className="text-sm font-medium text-[#0F172A]">{t.taskTitle}</p><p className="text-xs text-gray-500">{t.application?.applicationCode || t.applicationId?.substring(0,8)} • {t.assignedToName || t.assignedTo} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}</p></div>
                <div className="flex items-center gap-2"><Badge className={`${t.priority==='URGENT'?'bg-red-50 text-red-700 border-red-200': t.priority==='HIGH'?'bg-amber-50 text-amber-700 border-amber-200':'bg-[#F8FAFC] border-[#E2E8F0]'} text-[10px]`}>{t.priority}</Badge><Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">{t.status}</Badge><Link href={`/application-manager/application/${t.applicationId}`}><Button size="sm" variant="ghost" className="h-7">View</Button></Link></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
