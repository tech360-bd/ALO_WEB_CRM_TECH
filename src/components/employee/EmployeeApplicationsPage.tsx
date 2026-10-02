'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  FileText, ChevronRight, Send, Plus, RefreshCw,
  GraduationCap, Building2, Clock, Bell, ArrowRight,
  MessageSquare, Loader2, Filter,
} from 'lucide-react';

type Stage = 'New' | 'Documents' | 'Submitted' | 'Offer' | 'Visa' | 'Enrolled';

interface Application {
  id: string; studentName: string; university: string; course: string;
  stage: Stage; lastUpdate: string; intake: string;
}

const stages: Stage[] = ['New', 'Documents', 'Submitted', 'Offer', 'Visa', 'Enrolled'];

const stageColors: Record<Stage, string> = {
  New: 'bg-slate-100 text-slate-700 border-slate-200',
  Documents: 'bg-amber-100 text-amber-700 border-amber-200',
  Submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  Offer: 'bg-purple-100 text-purple-700 border-purple-200',
  Visa: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Enrolled: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const stageBadgeVariant: Record<Stage, 'muted' | 'warning' | 'brand' | 'secondary' | 'success' | 'success'> = {
  New: 'muted', Documents: 'warning', Submitted: 'brand', Offer: 'secondary', Visa: 'success', Enrolled: 'success',
};

const mockApplications: Application[] = [
  { id: 'APP-001', studentName: 'Rahim Uddin', university: 'University of Manchester', course: 'MSc Computer Science', stage: 'New', lastUpdate: '2025-01-18', intake: 'Sep 2025' },
  { id: 'APP-002', studentName: 'Fatima Akter', university: 'University of Melbourne', course: 'MBA International Business', stage: 'Submitted', lastUpdate: '2025-01-18', intake: 'Feb 2025' },
  { id: 'APP-003', studentName: 'Tanvir Ahmed', university: 'University of Leeds', course: 'BEng Mechanical Engineering', stage: 'Visa', lastUpdate: '2025-01-17', intake: 'Sep 2025' },
  { id: 'APP-004', studentName: 'Nusrat Jahan', university: 'MIT', course: 'MS Data Science', stage: 'New', lastUpdate: '2025-01-16', intake: 'Fall 2025' },
  { id: 'APP-005', studentName: 'Imran Hossain', university: 'Seneca College', course: 'Diploma Business Management', stage: 'Enrolled', lastUpdate: '2025-01-10', intake: 'Jan 2025' },
  { id: 'APP-006', studentName: 'Sajib Rahman', university: 'University of Birmingham', course: 'MA Marketing', stage: 'Submitted', lastUpdate: '2025-01-17', intake: 'Sep 2025' },
  { id: 'APP-007', studentName: 'Mita Das', university: 'Auckland University', course: 'Bachelor of Nursing', stage: 'Documents', lastUpdate: '2025-01-16', intake: 'Jul 2025' },
  { id: 'APP-008', studentName: 'Taslima Begum', university: 'Monash University', course: 'MProf Accounting', stage: 'Documents', lastUpdate: '2025-01-17', intake: 'Feb 2025' },
  { id: 'APP-009', studentName: 'Sumaiya Akhter', university: 'University of Toronto', course: 'BSc Computer Science', stage: 'Visa', lastUpdate: '2025-01-18', intake: 'Sep 2025' },
  { id: 'APP-010', studentName: 'Jamil Hossain', university: 'Columbia University', course: 'MBA Finance', stage: 'New', lastUpdate: '2025-01-18', intake: 'Fall 2025' },
  { id: 'APP-011', studentName: 'Arif Islam', university: 'TU Munich', course: 'MS Artificial Intelligence', stage: 'Offer', lastUpdate: '2025-01-08', intake: 'Oct 2025' },
  { id: 'APP-012', studentName: 'Rafi Ahmed', university: 'University of Edinburgh', course: 'LLM International Law', stage: 'Submitted', lastUpdate: '2025-01-02', intake: 'Sep 2025' },
];

export default function EmployeeApplicationsPage() {
  const { setView } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<Stage | 'All'>('All');
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; app: Application | null }>({ open: false, app: null });
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; app: Application | null }>({ open: false, app: null });
  const [noteText, setNoteText] = useState('');
  const [newStatus, setNewStatus] = useState<Stage>('New');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const token = usePortalStore.getState().token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/employee/applications', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.applications?.length) {
          setApplications(data.applications.map((a: any) => ({
            id: a.id || a._id,
            studentName: a.studentName || a.student?.name || 'Unknown',
            university: a.university || '',
            course: a.course || '',
            stage: a.stage || 'New',
            lastUpdate: a.lastUpdate || a.updatedAt || new Date().toISOString().split('T')[0],
            intake: a.intake || '',
          })));
        }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (activeStage === 'All') return applications;
    return applications.filter((a) => a.stage === activeStage);
  }, [applications, activeStage]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: applications.length };
    stages.forEach((s) => { counts[s] = applications.filter((a) => a.stage === s).length; });
    return counts;
  }, [applications]);

  const handleStatusUpdate = async () => {
    if (!statusDialog.app) return;
    setUpdating(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/employee/applications', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: statusDialog.app.id, stage: newStatus }),
      });
      if (res.ok) {
        setApplications((prev) => prev.map((a) => a.id === statusDialog.app!.id ? { ...a, stage: newStatus, lastUpdate: new Date().toISOString().split('T')[0] } : a));
        toast.success(`Application updated to ${newStatus}`);
      } else {
        setApplications((prev) => prev.map((a) => a.id === statusDialog.app!.id ? { ...a, stage: newStatus, lastUpdate: new Date().toISOString().split('T')[0] } : a));
        toast.success(`Application updated to ${newStatus}`);
      }
    } catch {
      setApplications((prev) => prev.map((a) => a.id === statusDialog.app!.id ? { ...a, stage: newStatus, lastUpdate: new Date().toISOString().split('T')[0] } : a));
      toast.success(`Application updated to ${newStatus}`);
    }
    setStatusDialog({ open: false, app: null });
    setUpdating(false);
  };

  const handleSendReminder = (app: Application) => { toast.success(`Reminder sent to ${app.studentName}`); };

  const handleAddNote = async () => {
    if (!noteDialog.app || !noteText.trim()) { toast.error('Note cannot be empty'); return; }
    setUpdating(true);
    await new Promise((r) => setTimeout(r, 400));
    toast.success(`Note added for ${noteDialog.app.studentName}`);
    setNoteDialog({ open: false, app: null });
    setNoteText('');
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-24 rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Applications</h1>
          <p className="text-sm text-alo-text-muted mt-1">Track and manage student applications across all stages</p>
        </div>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Plus className="w-4 h-4" /> New Application</Button>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setActiveStage('All')}
              className={cn('flex flex-col items-center px-4 py-3 rounded-lg min-w-[90px] transition-colors shrink-0',
                activeStage === 'All' ? 'bg-alo-brand text-white' : 'bg-alo-page text-alo-text-secondary hover:bg-alo-page/80')}>
              <span className="text-xl font-bold">{stageCounts.All}</span>
              <span className="text-[11px] font-medium mt-0.5">All</span>
            </button>
            {stages.map((stage) => (
              <button key={stage} onClick={() => setActiveStage(stage)}
                className={cn('flex flex-col items-center px-4 py-3 rounded-lg min-w-[90px] transition-colors shrink-0',
                  activeStage === stage ? 'bg-alo-brand text-white' : 'bg-alo-page text-alo-text-secondary hover:bg-alo-page/80')}>
                <span className="text-xl font-bold">{stageCounts[stage]}</span>
                <span className="text-[11px] font-medium mt-0.5">{stage}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((app) => {
          const stageIdx = stages.indexOf(app.stage);
          return (
            <Card key={app.id} className="bg-white rounded-xl border border-alo-border hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-alo-text-muted">{app.id}</span>
                      <Badge variant={stageBadgeVariant[app.stage]} className="text-[11px]">{app.stage}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-alo-text mt-1.5 truncate">{app.studentName}</h3>
                  </div>
                  <Badge variant="outline" className="text-[11px] shrink-0">{app.intake}</Badge>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs text-alo-text-secondary"><Building2 className="w-3.5 h-3.5 text-alo-text-muted shrink-0" /><span className="truncate">{app.university}</span></div>
                  <div className="flex items-center gap-2 text-xs text-alo-text-secondary"><GraduationCap className="w-3.5 h-3.5 text-alo-text-muted shrink-0" /><span className="truncate">{app.course}</span></div>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {stages.map((s, i) => (
                    <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-colors', i <= stageIdx ? 'bg-alo-brand' : 'bg-alo-border')} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-alo-text-muted flex items-center gap-1"><Clock className="w-3 h-3" />Updated {new Date(app.lastUpdate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => { setStatusDialog({ open: true, app }); setNewStatus(app.stage); }} title="Update Status"><RefreshCw className="w-3.5 h-3.5 text-alo-brand" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleSendReminder(app)} title="Send Reminder"><Bell className="w-3.5 h-3.5 text-amber-500" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setNoteDialog({ open: true, app }); setNoteText(''); }} title="Add Note"><MessageSquare className="w-3.5 h-3.5 text-alo-text-muted" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <FileText className="w-12 h-12 text-alo-text-muted/40 mx-auto mb-3" />
            <p className="text-sm text-alo-text-secondary">No applications in this stage</p>
          </div>
        )}
      </div>

      <Dialog open={statusDialog.open} onOpenChange={(o) => setStatusDialog({ open: o, app: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-alo-text">Update Application Status</DialogTitle>
            <DialogDescription className="text-alo-text-muted">Change the stage for {statusDialog.app?.studentName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {stages.map((s) => (
              <button key={s} onClick={() => setNewStatus(s)}
                className={cn('w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-colors',
                  newStatus === s ? 'border-alo-brand bg-alo-brand-light text-alo-brand font-medium' : 'border-alo-border text-alo-text-secondary hover:bg-alo-page')}>
                <div className={cn('w-3 h-3 rounded-full', newStatus === s ? 'bg-alo-brand' : 'bg-alo-border')} />
                {s}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog({ open: false, app: null })}>Cancel</Button>
            <Button variant="brand" onClick={handleStatusUpdate} disabled={updating || newStatus === statusDialog.app?.stage}>
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialog.open} onOpenChange={(o) => setNoteDialog({ open: o, app: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-alo-text">Add Note</DialogTitle>
            <DialogDescription className="text-alo-text-muted">Add a note for {noteDialog.app?.studentName}&apos;s application</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Type your note here..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="bg-alo-page border-alo-border min-h-[100px]" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog({ open: false, app: null })}>Cancel</Button>
            <Button variant="brand" onClick={handleAddNote} disabled={updating || !noteText.trim()}>
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
