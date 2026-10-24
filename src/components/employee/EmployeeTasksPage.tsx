'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus, Search, Clock, CheckCircle2, XCircle, Circle, Loader2,
  Calendar, User as UserIcon, Flag, RefreshCw,
} from 'lucide-react';

type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Overdue';
type TaskPriority = 'high' | 'medium' | 'low';

interface Task {
  id: string; title: string; description: string;
  status: TaskStatus; priority: TaskPriority;
  dueDate: string; assignedTo: string; createdAt: string;
}

const statusTabs: { label: string; value: TaskStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'Overdue', value: 'Overdue' },
];

function statusBadge(status: TaskStatus) {
  const m: Record<TaskStatus, 'warning' | 'brand' | 'success' | 'danger'> = {
    Pending: 'warning', 'In Progress': 'brand', Completed: 'success', Cancelled: 'danger', Overdue: 'danger',
  };
  const icons: Record<TaskStatus, React.ElementType> = {
    Pending: Circle, 'In Progress': Clock, Completed: CheckCircle2, Cancelled: XCircle, Overdue: XCircle,
  };
  const Icon = icons[status];
  return <Badge variant={m[status]} className="text-[11px]"><Icon className="w-3 h-3 mr-0.5" />{status}</Badge>;
}

function priorityBadge(priority: TaskPriority) {
  const styles: Record<TaskPriority, string> = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  const icons: Record<TaskPriority, React.ElementType> = { high: Flag, medium: Flag, low: Flag };
  const Icon = icons[priority];
  return (
    <Badge variant="outline" className={cn('text-[11px] capitalize gap-1', styles[priority])}>
      <Icon className="w-3 h-3" />{priority}
    </Badge>
  );
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = usePortalStore.getState().token;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export default function EmployeeTasksPage() {
  const { setView, user } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<TaskStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as TaskPriority, dueDate: '' });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/employee/tasks?limit=100', { headers: authHeaders(), cache: 'no-store' });
      const body = await res.json().catch(() => null);
      if (!res.ok || body?.success !== true || !Array.isArray(body.tasks)) throw new Error(body?.error || 'Unable to load employee tasks.');
      setTasks(body.tasks.map((task: any) => {
        const rawStatus = String(task.status || '').toLowerCase();
        const dueDate = typeof task.dueDate === 'string' ? task.dueDate : '';
        const overdue = ['pending', 'in_progress'].includes(rawStatus) && dueDate && dueDate < new Date().toISOString().slice(0, 10);
        const status: TaskStatus = overdue ? 'Overdue' : rawStatus === 'in_progress' ? 'In Progress' : rawStatus === 'completed' ? 'Completed' : rawStatus === 'cancelled' ? 'Cancelled' : 'Pending';
        return { id: task.id, title: task.title, description: task.description || '', status, priority: task.priority || 'medium', dueDate, assignedTo: user?.name || 'Me', createdAt: typeof task.createdAt === 'string' ? task.createdAt.slice(0, 10) : '' };
      }));
    } catch (error) {
      setTasks([]);
      setLoadError(error instanceof Error ? error.message : 'Unable to load employee tasks.');
    } finally {
      setLoading(false);
    }
  }, [user?.name]);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (activeTab !== 'All') list = list.filter((t) => t.status === activeTab);
    if (search) { const q = search.toLowerCase(); list = list.filter((t) => t.title.toLowerCase().includes(q) || t.assignedTo.toLowerCase().includes(q)); }
    return list;
  }, [tasks, activeTab, search]);

  const handleCreate = async () => {
    if (!newTask.title.trim()) { toast.error('Task title is required'); return; }
    if (!newTask.dueDate) { toast.error('Due date is required'); return; }
    setCreating(true);
    try {
      const payload = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
      };
      const res = await fetch('/api/employee/tasks', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success !== true || !data.task) throw new Error(data?.error || 'Task could not be created.');
      const task = data.task;
      const dueDate = typeof task.dueDate === 'string' ? task.dueDate : payload.dueDate;
      const overdue = dueDate < new Date().toISOString().slice(0, 10);
      setTasks((current) => [{
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: overdue ? 'Overdue' : 'Pending',
        priority: task.priority || payload.priority,
        dueDate,
        assignedTo: user?.name || 'Me',
        createdAt: typeof task.createdAt === 'string' ? task.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      }, ...current]);
      toast.success('Task created successfully');
      setCreateOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    } finally { setCreating(false); }
  };

  const toggleStatus = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const next: Record<TaskStatus, TaskStatus> = { Pending: 'In Progress', 'In Progress': 'Completed', Completed: 'Completed', Cancelled: 'Cancelled', Overdue: 'In Progress' };
    const newStatus = next[task.status];
    setUpdatingStatus(id);

    try {
      const res = await fetch('/api/employee/tasks', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ id, status: newStatus }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || body?.success !== true) throw new Error(body?.error || 'Task status could not be updated.');
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
      toast.success('Task status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Task status could not be updated.');
    } finally {
      setUpdatingStatus(null);
    }
  }, [tasks]);

  if (loading) {
    return (
      <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Tasks</h1>
          <p className="text-sm text-alo-text-muted mt-1">Manage and track your daily tasks</p>
        </div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void loadTasks()} disabled={loading}><RefreshCw className="mr-1 h-4 w-4" />Refresh</Button><Button variant="brand" size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> Create Task</Button></div>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 p-4 pb-0 overflow-x-auto">
            {statusTabs.map((tab) => {
              const count = tab.value === 'All' ? tasks.length : tasks.filter((t) => t.status === tab.value).length;
              return (
                <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                  className={cn('flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors',
                    activeTab === tab.value ? 'bg-alo-brand text-white' : 'text-alo-text-secondary hover:bg-alo-page')}>
                  {tab.label}
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full', activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-alo-page text-alo-text-muted')}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="p-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input placeholder="Search tasks by title or assignee..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-alo-page border-alo-border" />
            </div>
          </div>
        </CardContent>
      </Card>

      {loadError && <Card role="alert" className="border-red-200"><CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-red-700"><span>{loadError}</span><Button variant="outline" size="sm" onClick={() => void loadTasks()}>Retry</Button></CardContent></Card>}
      <div className="space-y-3">
        {!loadError && filtered.length === 0 && (
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-alo-text-muted/40 mx-auto mb-3" />
              <p className="text-alo-text-secondary font-medium">No tasks found</p>
              <p className="text-sm text-alo-text-muted mt-1">Try adjusting your search or filter</p>
            </CardContent>
          </Card>
        )}
        {filtered.map((task) => (
          <Card key={task.id} className="bg-white rounded-xl border border-alo-border hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <button aria-label={`Update task ${task.title} status`} onClick={() => toggleStatus(task.id)} className="mt-0.5 shrink-0" disabled={updatingStatus === task.id || task.status === 'Completed' || task.status === 'Cancelled'}>
                  {updatingStatus === task.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-alo-brand" />
                  ) : task.status === 'Completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : task.status === 'Overdue' ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : task.status === 'In Progress' ? (
                    <Clock className="w-5 h-5 text-alo-brand" />
                  ) : (
                    <Circle className="w-5 h-5 text-alo-text-muted/50" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn('text-sm font-medium text-alo-text', task.status === 'Completed' && 'line-through text-alo-text-muted')}>{task.title}</p>
                      <p className="text-xs text-alo-text-muted mt-1 line-clamp-1">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {priorityBadge(task.priority)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2.5">
                    {statusBadge(task.status)}
                    <span className="text-[11px] text-alo-text-muted inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="text-[11px] text-alo-text-muted inline-flex items-center gap-1"><UserIcon className="w-3 h-3" />{task.assignedTo}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-alo-text">Create New Task</DialogTitle>
            <DialogDescription className="text-alo-text-muted">Add a new task to your work queue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-alo-text-secondary">Title *</Label>
              <Input placeholder="Enter task title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="bg-alo-page border-alo-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-alo-text-secondary">Description</Label>
              <Textarea placeholder="Describe the task..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="bg-alo-page border-alo-border min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-alo-text-secondary">Priority *</Label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                    <button key={p} onClick={() => setNewTask({ ...newTask, priority: p })}
                      className={cn('flex-1 py-2 text-xs font-medium rounded-lg border capitalize transition-colors',
                        newTask.priority === p
                          ? p === 'high' ? 'bg-red-100 text-red-700 border-red-300' : p === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : 'bg-alo-page text-alo-text-muted border-alo-border hover:bg-alo-page/80')}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-alo-text-secondary">Due Date *</Label>
                <Input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="bg-alo-page border-alo-border" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="brand" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
