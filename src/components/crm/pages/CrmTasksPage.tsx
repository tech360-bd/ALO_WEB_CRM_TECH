'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Search, Plus, CheckCircle, Clock, AlertTriangle,
  ListTodo, Calendar, User, FileText, Phone, ArrowUpRight,
} from 'lucide-react';

type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
type TaskPriority = 'High' | 'Normal' | 'Low';
type TaskType = 'Follow-up' | 'Document Review' | 'Application Review' | 'Call' | 'Email' | 'General';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  relatedStudent: string;
  created: string;
}

const statusColors: Record<TaskStatus, string> = {
  'Pending': 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Completed': 'bg-emerald-100 text-emerald-700',
  'Overdue': 'bg-red-100 text-red-700',
};

const priorityColors: Record<TaskPriority, string> = {
  'High': 'bg-red-100 text-red-700',
  'Normal': 'bg-blue-100 text-blue-700',
  'Low': 'bg-green-100 text-green-700',
};

const typeIcons: Record<TaskType, typeof FileText> = {
  'Follow-up': Phone,
  'Document Review': FileText,
  'Application Review': ListTodo,
  'Call': Phone,
  'Email': FileText,
  'General': ListTodo,
};

const fallbackTasks: Task[] = [
  { id: 'TSK-001', title: 'Follow up with Arif on UK visa documents', description: 'Arif needs to submit updated bank statements before the CAS can be issued', assignedTo: 'Tasnim Akter', dueDate: '2025-06-28', priority: 'High', status: 'In Progress', type: 'Follow-up', relatedStudent: 'Arif Rahman', created: '2025-06-20' },
  { id: 'TSK-002', title: 'Review Fatima\'s application documents', description: 'Verify all academic transcripts and IELTS score for University of Melbourne', assignedTo: 'Rafiq Hasan', dueDate: '2025-06-27', priority: 'High', status: 'Pending', type: 'Document Review', relatedStudent: 'Fatima Begum', created: '2025-06-22' },
  { id: 'TSK-003', title: 'Call Sakib for interview preparation', description: 'Schedule mock interview session for Sakib\'s upcoming visa interview', assignedTo: 'Nasreen Jahan', dueDate: '2025-06-30', priority: 'Normal', status: 'Pending', type: 'Call', relatedStudent: 'Sakib Hossain', created: '2025-06-24' },
  { id: 'TSK-004', title: 'Process Tanvir\'s application to US university', description: 'Complete the online application submission for Northeastern University', assignedTo: 'Tasnim Akter', dueDate: '2025-06-25', priority: 'High', status: 'Overdue', type: 'Application Review', relatedStudent: 'Tanvir Ahmed', created: '2025-06-18' },
  { id: 'TSK-005', title: 'Send scholarship info to Mitu', description: 'Email list of available scholarships for Germany with eligibility criteria', assignedTo: 'Kamal Uddin', dueDate: '2025-06-29', priority: 'Low', status: 'Completed', type: 'Email', relatedStudent: 'Mitu Sarkar', created: '2025-06-21' },
  { id: 'TSK-006', title: 'Review Imran\'s visa application package', description: 'Check all supporting documents for Ireland student visa application', assignedTo: 'Rafiq Hasan', dueDate: '2025-07-02', priority: 'Normal', status: 'In Progress', type: 'Document Review', relatedStudent: 'Imran Khan', created: '2025-06-25' },
  { id: 'TSK-007', title: 'Follow up on Nusrat\'s refund request', description: 'Coordinate with finance department regarding the application fee refund', assignedTo: 'Nasreen Jahan', dueDate: '2025-06-26', priority: 'Normal', status: 'Completed', type: 'Follow-up', relatedStudent: 'Nusrat Jahan', created: '2025-06-19' },
  { id: 'TSK-008', title: 'Schedule counselling session for Sharmin', description: 'Book initial counselling session for new student Sharmin Akter', assignedTo: 'Tasnim Akter', dueDate: '2025-07-01', priority: 'Low', status: 'Pending', type: 'General', relatedStudent: 'Sharmin Akter', created: '2025-06-25' },
];

export default function CrmTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    fetch('/api/crm/tasks')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.data)) setTasks(d.data);
        else if (Array.isArray(d.tasks)) setTasks(d.tasks);
      })
      .catch(() => setTasks(fallbackTasks))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(search.toLowerCase()) ||
      t.relatedStudent.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const overdueCount = tasks.filter(t => t.status === 'Overdue').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  const statsCards = [
    { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'In Progress', value: inProgressCount, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue', value: overdueCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const kanbanColumns: { status: TaskStatus; dotColor: string }[] = [
    { status: 'Pending', dotColor: 'bg-slate-400' },
    { status: 'In Progress', dotColor: 'bg-amber-400' },
    { status: 'Completed', dotColor: 'bg-emerald-400' },
    { status: 'Overdue', dotColor: 'bg-red-400' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Task Management</h1>
        <div className="flex gap-2">
          <div className="flex bg-white border border-alo-border rounded-lg overflow-hidden">
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className={viewMode === 'list' ? 'bg-alo-brand text-white' : 'text-alo-text-muted'} onClick={() => setViewMode('list')}>List</Button>
            <Button variant={viewMode === 'kanban' ? 'default' : 'ghost'} size="sm" className={viewMode === 'kanban' ? 'bg-alo-brand text-white' : 'text-alo-text-muted'} onClick={() => setViewMode('kanban')}>Kanban</Button>
          </div>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-alo-brand hover:bg-alo-brand/90 text-white">
            <Plus className="mr-2 h-4 w-4" />New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(s => (
          <Card key={s.label} className="bg-white border border-alo-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-lg`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div>
                <p className="text-sm text-alo-text-muted">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white border border-alo-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold text-alo-text">Tasks</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
                <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-[200px]" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Document Review">Document Review</SelectItem>
                  <SelectItem value="Application Review">Application Review</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-alo-text-muted">Loading tasks...</div>
          ) : viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kanbanColumns.map(col => {
                const colTasks = filtered.filter(t => t.status === col.status);
                return (
                  <div key={col.status}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                      <h3 className="text-sm font-semibold text-alo-text">{col.status}</h3>
                      <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {colTasks.map(task => {
                        const TypeIcon = typeIcons[task.type];
                        return (
                          <div key={task.id} className="p-3 rounded-lg border border-alo-border hover:shadow-sm transition-shadow cursor-pointer">
                            <div className="flex items-start gap-2">
                              <TypeIcon className="h-4 w-4 text-alo-text-muted mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-alo-text leading-tight">{task.title}</p>
                                <p className="text-xs text-alo-text-muted mt-1">{task.relatedStudent}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{task.type}</Badge>
                                </div>
                                <div className="flex items-center gap-1 mt-2 text-xs text-alo-text-muted">
                                  <Calendar className="h-3 w-3" /><span>{task.dueDate}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead>
                  <tr className="border-b border-alo-border text-left text-alo-text-muted">
                    <th className="pb-3 font-medium w-8"></th>
                    <th className="pb-3 font-medium">Task</th>
                    <th className="pb-3 font-medium">Assigned To</th>
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(task => {
                    const TypeIcon = typeIcons[task.type];
                    return (
                      <tr key={task.id} className="border-b border-alo-border/50 hover:bg-gray-50 transition-colors">
                        <td className="py-3"><Checkbox /></td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-alo-text-muted shrink-0" />
                            <div>
                              <p className="font-medium text-alo-text">{task.title}</p>
                              <p className="text-xs text-alo-text-muted max-w-[250px] truncate">{task.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3"><div className="flex items-center gap-1.5 text-alo-text-secondary"><User className="h-3.5 w-3.5" />{task.assignedTo}</div></td>
                        <td className="py-3 text-alo-text-secondary">{task.relatedStudent}</td>
                        <td className="py-3"><Badge variant="outline" className="text-xs">{task.type}</Badge></td>
                        <td className="py-3"><Badge className={priorityColors[task.priority]}>{task.priority}</Badge></td>
                        <td className="py-3"><Badge className={statusColors[task.status]}>{task.status}</Badge></td>
                        <td className="py-3 text-alo-text-muted">{task.dueDate}</td>
                        <td className="py-3 text-right">
                          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-alo-brand"><ArrowUpRight className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
