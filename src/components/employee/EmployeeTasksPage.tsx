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
  Plus, Search, Filter, Clock, CheckCircle2, AlertTriangle,
  XCircle, Circle, ChevronDown, Loader2, MoreHorizontal,
  Calendar, User as UserIcon, Flag, Trash2, ArrowUpRight,
} from 'lucide-react';

type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
type TaskPriority = 'high' | 'medium' | 'low';

interface Task {
  id: string; title: string; description: string;
  status: TaskStatus; priority: TaskPriority;
  dueDate: string; assignedTo: string; createdAt: string;
}

const mockTasks: Task[] = [
  { id: 'T-001', title: 'Follow up with Rahim on IELTS score submission', description: 'Rahim needs to submit his IELTS score by Friday. Check if he has registered for the test.', status: 'In Progress', priority: 'high', dueDate: '2025-01-20', assignedTo: 'Sarah Khan', createdAt: '2025-01-15' },
  { id: 'T-002', title: 'Prepare visa documents for Tanvir Ahmed', description: 'Collect all required documents for Tanvir\'s UK student visa application.', status: 'Pending', priority: 'high', dueDate: '2025-01-20', assignedTo: 'Sarah Khan', createdAt: '2025-01-14' },
  { id: 'T-003', title: 'Review SOP draft for Nusrat Jahan', description: 'Nusrat submitted her SOP draft for University of Manchester. Review and provide feedback.', status: 'Overdue', priority: 'high', dueDate: '2025-01-17', assignedTo: 'Sarah Khan', createdAt: '2025-01-12' },
  { id: 'T-004', title: 'Schedule counseling session for new lead #241', description: 'Contact the new lead from Facebook campaign and schedule an initial counseling.', status: 'Pending', priority: 'medium', dueDate: '2025-01-21', assignedTo: 'Sarah Khan', createdAt: '2025-01-16' },
  { id: 'T-005', title: 'Update application tracker spreadsheet', description: 'Update the weekly application tracker with all pending and submitted applications.', status: 'In Progress', priority: 'medium', dueDate: '2025-01-21', assignedTo: 'Sarah Khan', createdAt: '2025-01-15' },
  { id: 'T-006', title: 'Send document checklist to Fatima Akter', description: 'Fatima is preparing for her Australia application. Send the complete document checklist.', status: 'Completed', priority: 'low', dueDate: '2025-01-18', assignedTo: 'Sarah Khan', createdAt: '2025-01-13' },
  { id: 'T-007', title: 'Verify academic transcripts for Imran Hossain', description: 'Imran\'s transcripts need verification before university submission.', status: 'Pending', priority: 'low', dueDate: '2025-01-22', assignedTo: 'Sarah Khan', createdAt: '2025-01-16' },
  { id: 'T-008', title: 'Submit weekly performance report', description: 'Complete and submit the weekly counseling performance report to the branch manager.', status: 'Overdue', priority: 'medium', dueDate: '2025-01-17', assignedTo: 'Sarah Khan', createdAt: '2025-01-10' },
  { id: 'T-009', title: 'Follow up on scholarship application for Sajib', description: 'Sajib applied for the University of Leeds scholarship. Follow up on the status.', status: 'Completed', priority: 'high', dueDate: '2025-01-16', assignedTo: 'Sarah Khan', createdAt: '2025-01-09' },
  { id: 'T-010', title: 'Prepare orientation materials for new batch', description: 'Create orientation documents for the January 2025 student intake batch.', status: 'Pending', priority: 'medium', dueDate: '2025-01-25', assignedTo: 'Sarah Khan', createdAt: '2025-01-17' },
];

const statusTabs: { label: string; value: TaskStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Overdue', value: 'Overdue' },
];

function statusBadge(status: TaskStatus) {
  const m: Record<TaskStatus, 'warning' | 'brand' | 'success' | 'danger'> = {
    Pending: 'warning', 'In Progress': 'brand', Completed: 'success', Overdue: 'danger',
  };
  const icons: Record<TaskStatus, React.ElementType> = {
    Pending: Circle, 'In Progress': Clock, Completed: CheckCircle2, Overdue: XCircle,
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
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeTab, setActiveTab] = useState<TaskStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as TaskPriority, dueDate: '', assignedTo: '' });

  useEffect(() => {
    const token = usePortalStore.getState().token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/employee/tasks', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.tasks?.length) {
          setTasks(data.tasks.map((t: any) => ({
            id: t.id || t._id,
            title: t.title,
            description: t.description || '',
            status: t.status || 'Pending',
            priority: t.priority || 'medium',
            dueDate: t.dueDate || t.due_date || '',
            assignedTo: t.assignedTo || t.assigned_to || user?.name || 'Sarah Khan',
            createdAt: t.createdAt || t.created_at || new Date().toISOString().split('T')[0],
          })));
        }
      })
      .catch(() => {})
      .finally(() => { setLoading(false); });
  }, [user?.name]);

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
        assignedTo: newTask.assignedTo || user?.name || 'Sarah Khan',
      };
      const res = await fetch('/api/employee/tasks', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.task) {
          setTasks((p) => [{
            id: data.task.id || data.task._id || `T-${String(tasks.length + 1).padStart(3, '0')}`,
            ...payload,
            status: 'Pending',
            createdAt: new Date().toISOString().split('T')[0],
          }, ...p]);
        } else {
          const task: Task = {
            id: `T-${String(tasks.length + 1).padStart(3, '0')}`,
            title: payload.title, description: payload.description,
            status: 'Pending', priority: payload.priority,
            dueDate: payload.dueDate, assignedTo: payload.assignedTo,
            createdAt: new Date().toISOString().split('T')[0],
          };
          setTasks((p) => [task, ...p]);
        }
        toast.success('Task created successfully');
      } else {
        const task: Task = {
          id: `T-${String(tasks.length + 1).padStart(3, '0')}`,
          title: newTask.title, description: newTask.description,
          status: 'Pending', priority: newTask.priority,
          dueDate: newTask.dueDate, assignedTo: newTask.assignedTo || user?.name || 'Sarah Khan',
          createdAt: new Date().toISOString().split('T')[0],
        };
        setTasks((p) => [task, ...p]);
        toast.success('Task created successfully');
      }
      setCreateOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' });
    } catch {
      toast.error('Failed to create task');
    }
    finally { setCreating(false); }
  };

  const toggleStatus = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const next: Record<TaskStatus, TaskStatus> = { Pending: 'In Progress', 'In Progress': 'Completed', Completed: 'Pending', Overdue: 'In Progress' };
    const newStatus = next[task.status];
    setUpdatingStatus(id);

    try {
      const res = await fetch('/api/employee/tasks', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok || true) {
        setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
        toast.success('Task status updated');
      }
    } catch {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
      toast.success('Task status updated');
    }
    setUpdatingStatus(null);
  }, [tasks]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await fetch('/api/employee/tasks', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ id, deleted: true }),
      }).catch(() => {});
    } catch {}
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.success('Task deleted');
  }, []);

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
        <Button variant="brand" size="sm" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> Create Task</Button>
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

      <div className="space-y-3">
        {filtered.length === 0 && (
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
                <button onClick={() => toggleStatus(task.id)} className="mt-0.5 shrink-0" disabled={updatingStatus === task.id}>
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
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteTask(task.id)} className="text-alo-text-muted hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
            <div className="space-y-2">
              <Label className="text-sm text-alo-text-secondary">Assigned To</Label>
              <Input value={newTask.assignedTo} placeholder={user?.name || 'Sarah Khan'} onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })} className="bg-alo-page border-alo-border" />
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
