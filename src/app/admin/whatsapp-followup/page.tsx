'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, RefreshCw, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppFollowUpPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resT, resS] = await Promise.all([
        fetch('/api/whatsapp/followup/templates'),
        fetch('/api/whatsapp/followup/schedules'),
      ]);
      const dataT = await resT.json();
      const dataS = await resS.json();
      if (dataT.success) setTemplates(dataT.templates || []);
      if (dataS.success) setSchedules(dataS.schedules || []);
    } catch {}
    setLoading(false);
  };

  const triggerProcess = async () => {
    try {
      const res = await fetch('/api/whatsapp/followup/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_due' }),
      });
      const data = await res.json();
      if (data.success) toast.success(`Processed ${data.results?.length || 0} follow-ups`);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-6 space-y-6 bg-[var(--alo-text)] min-h-screen text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Follow-Up Automation — Day 3/7/14/21/25/30</h1>
            <p className="text-[var(--alo-text-muted)] text-sm">Sender: 01805020100 • Respects STOP/START, consent, opt-out, application active pause, partner-only mode</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" className="border-white/10"><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button onClick={triggerProcess} className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)]"><Play className="w-4 h-4 mr-2" />Process Due</Button>
        </div>
      </div>

      <Card className="bg-[var(--alo-text)] border-white/10 text-white">
        <CardHeader><CardTitle className="text-sm">Templates (Variables: name, student_code, portal_link, counselor_name, branch_name, country, intake)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold">{t.templateName} • Day {t.day} • {t.language}</span>
                <div className="flex gap-2"><Badge className="bg-emerald-500/20 text-emerald-300">{t.approvalStatus}</Badge><Badge className="bg-blue-500/20 text-blue-300">{t.activeStatus}</Badge></div>
              </div>
              <p className="text-[var(--alo-placeholder)] mt-1">{t.messageBody}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-1">Meta: {t.metaTemplateName} • Vars: {t.variables}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-[var(--alo-text)] border-white/10 text-white">
        <CardHeader><CardTitle className="text-sm">Schedules (Idempotent, No Duplicate on Double Cron)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {schedules.slice(0,50).map((s) => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs">
              <div><span className="font-mono">{s.studentId.slice(0,8)}</span> • Day {s.scheduledDay} • {s.contactPhone} • {new Date(s.scheduledAt).toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <Badge className={s.status==='sent' ? 'bg-emerald-500/20 text-emerald-300' : s.status==='scheduled' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'}>{s.status}</Badge>
                <span className="text-[var(--alo-text-muted)]">Attempts: {s.attemptCount}/{s.maxAttempts}</span>
              </div>
            </div>
          ))}
          {schedules.length===0 && <p className="text-xs text-[var(--alo-text-muted)]">No schedules</p>}
        </CardContent>
      </Card>

      <Card className="bg-[var(--alo-text)] border-white/10 text-white">
        <CardContent className="p-4 text-xs text-[var(--alo-placeholder)]">
          <p className="font-bold">STOP/START Handling</p>
          <p>If student says STOP → follow-up paused/cancelled, opt-out recorded, consent false. If START → reactivation per policy (if no active application).</p>
          <p className="mt-2 font-bold">Idempotency</p>
          <p>Repeated cron execution must not create duplicate messages — checked via existing scheduled/sent same day + unique studentId+day.</p>
        </CardContent>
      </Card>
    </div>
  );
}
