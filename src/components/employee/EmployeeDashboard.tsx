'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2, AlertTriangle, XCircle, Plus, MessageSquare, Upload,
  ListTodo, TrendingUp, Clock, Users, Inbox, ChevronRight, ArrowUpRight,
  MapPin, Loader2,
} from 'lucide-react';

const slaData = [
  { student: 'Rahim Uddin', channel: 'WhatsApp', waitTime: '2h 15m', status: 'ok' as const },
  { student: 'Fatima Akter', channel: 'Facebook', waitTime: '4h 30m', status: 'warning' as const },
  { student: 'Tanvir Ahmed', channel: 'WhatsApp', waitTime: '6h 10m', status: 'escalated' as const },
  { student: 'Nusrat Jahan', channel: 'Facebook', waitTime: '1h 45m', status: 'ok' as const },
  { student: 'Imran Hossain', channel: 'WhatsApp', waitTime: '5h 20m', status: 'warning' as const },
];

const mockTaskData = [
  { title: 'Follow up with Rahim on IELTS score', priority: 'high' as const, due: 'Today, 2:00 PM', status: 'In Progress' },
  { title: 'Prepare visa docs for Tanvir', priority: 'high' as const, due: 'Today, 4:00 PM', status: 'Pending' },
  { title: 'Review SOP draft \u2014 Nusrat', priority: 'high' as const, due: 'Today, 5:30 PM', status: 'Pending' },
  { title: 'Schedule counseling \u2014 new lead #241', priority: 'medium' as const, due: 'Tomorrow, 10:00 AM', status: 'Pending' },
  { title: 'Update application tracker', priority: 'medium' as const, due: 'Tomorrow, 12:00 PM', status: 'Pending' },
];

const deadlines = [
  { title: 'Tanvir Visa Deadline', date: 'Jan 20, 2025', daysLeft: 2, urgent: true },
  { title: 'Fatima SOP Submission', date: 'Jan 22, 2025', daysLeft: 4, urgent: false },
  { title: 'Rahim IELTS Retest', date: 'Jan 25, 2025', daysLeft: 7, urgent: false },
  { title: 'Monthly Report', date: 'Jan 31, 2025', daysLeft: 13, urgent: false },
];

function slaStatusBadge(status: 'ok' | 'warning' | 'escalated') {
  switch (status) {
    case 'ok': return <Badge variant="success" className="text-[11px]"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>;
    case 'warning': return <Badge variant="warning" className="text-[11px]"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
    case 'escalated': return <Badge variant="danger" className="text-[11px]"><XCircle className="w-3 h-3 mr-1" />Escalated</Badge>;
  }
}

function priorityBadge(priority: 'high' | 'medium' | 'low') {
  const styles = {
    high: 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border',
    medium: 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border',
    low: 'bg-crm-success-bg text-crm-success-text border-crm-success-border',
  };
  return (
    <Badge variant="outline" className={`text-[11px] capitalize ${styles[priority]}`}>
      {priority}
    </Badge>
  );
}

function channelIcon(channel: string) {
  return channel === 'WhatsApp' ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-alo-text-secondary">
      <MessageSquare className="w-3 h-3 text-crm-success-text" /> WhatsApp
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-alo-text-secondary">
      <MessageSquare className="w-3 h-3 text-[var(--alo-brand)]" /> Facebook
    </span>
  );
}

export default function EmployeeDashboard() {
  const { user } = usePortalStore();
  const userName = user?.name || 'Sarah Khan';
  const [loading, setLoading] = useState(true);
  const [taskData, setTaskData] = useState<any[]>([]);
  const [applicationData, setApplicationData] = useState<any[]>([]);
  const [reportSummary, setReportSummary] = useState<any>(null);

  useEffect(() => {
    const token = usePortalStore.getState().token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const fetchTasks = fetch('/api/employee/tasks?status=pending&limit=5', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.tasks?.length) {
          setTaskData(data.tasks.map((t: any) => ({
            title: t.title,
            priority: t.priority || 'medium',
            due: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : t.due || '',
            status: t.status || 'Pending',
          })));
        }
      }).catch(() => {});

    fetch('/api/employee/applications?limit=5', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.applications?.length) setApplicationData(data.applications); }).catch(() => {});
    fetch('/api/employee/students?limit=5', { headers }).catch(() => {});
    fetch('/api/employee/reports?section=summary', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.summary) setReportSummary(data.summary); }).catch(() => {});

    Promise.all([fetchTasks]).finally(() => { setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
        <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin text-alo-brand" /><span className="text-sm text-alo-text-muted">Loading dashboard...</span></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Good morning, {userName}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]">Counselor</Badge>
            <span className="inline-flex items-center gap-1 text-sm text-alo-text-muted">
              <MapPin className="w-3.5 h-3.5" /> Dhaka \u2014 Gulshan Branch
            </span>
          </div>
        </div>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Plus className="w-4 h-4" /> New Task</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ListTodo className="w-5 h-5 text-alo-brand" />
              <span className="text-[11px] text-crm-danger-text font-medium bg-crm-danger-bg px-1.5 py-0.5 rounded">{taskData.filter(t => t.priority === 'high').length} urgent</span>
            </div>
            <p className="text-2xl font-bold text-alo-text">{taskData.length}</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Today&apos;s Tasks</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-alo-brand" />
              <span className="inline-flex items-center text-[11px] text-crm-success-text font-medium"><ArrowUpRight className="w-3 h-3" />+5 today</span>
            </div>
            <p className="text-2xl font-bold text-alo-text">47</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Assigned Leads</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-alo-brand" />
              <span className="inline-flex items-center text-[11px] text-crm-success-text font-medium"><ArrowUpRight className="w-3 h-3" />+2 this week</span>
            </div>
            <p className="text-2xl font-bold text-alo-text">32</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Active Students</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Inbox className="w-5 h-5 text-alo-brand" />
              <span className="text-[11px] text-crm-warning-text font-medium bg-crm-warning-bg px-1.5 py-0.5 rounded">3 SLA warning</span>
            </div>
            <p className="text-2xl font-bold text-alo-text">14</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Unread Messages</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text">SLA Status</CardTitle>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className=" text-alo-brand">View All <ChevronRight className="w-3.5 h-3.5" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead><TableHead>Channel</TableHead><TableHead>Wait Time</TableHead><TableHead>SLA Status</TableHead><TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slaData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-alo-text">{row.student}</TableCell>
                      <TableCell>{channelIcon(row.channel)}</TableCell>
                      <TableCell className="text-alo-text-secondary text-xs">{row.waitTime}</TableCell>
                      <TableCell>{slaStatusBadge(row.status)}</TableCell>
                      <TableCell className="text-right"><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon-sm"><MessageSquare className="w-4 h-4 text-alo-brand" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text">Recent Tasks</CardTitle>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className=" text-alo-brand">View All <ChevronRight className="w-3.5 h-3.5" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {taskData.length===0 ? (
                  <div className="text-center py-8 text-sm text-[var(--alo-text-muted)]">No tasks assigned yet.</div>
                ) : taskData.map((task, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-alo-brand-light/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.priority === 'high' ? 'var(--alo-error)' : task.priority === 'medium' ? '#92400E' : '#059669' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-alo-text truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {priorityBadge(task.priority)}
                          <span className="text-[11px] text-alo-text-muted inline-flex items-center gap-1"><Clock className="w-3 h-3" />{task.due}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="muted" className="text-[11px] shrink-0">{task.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-alo-text">Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" className="w-full justify-start text-sm"><Plus className="w-4 h-4" /> New Lead</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start text-sm"><MessageSquare className="w-4 h-4" /> Message Student</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start text-sm"><Upload className="w-4 h-4" /> Upload Document</Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start text-sm"><ListTodo className="w-4 h-4" /> Create Task</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-alo-text">Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-alo-text-secondary">Conversion Rate</span>
                    <span className="text-xl font-bold text-alo-text">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-crm-success-bg border border-crm-success-border">
                  <TrendingUp className="w-4 h-4 text-crm-success-text shrink-0" />
                  <div><p className="text-sm font-medium text-crm-success-text">Weekly Trend</p><p className="text-xs text-crm-success-text">+4.2% compared to last week</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-alo-text">Upcoming Deadlines</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1">
                {deadlines.map((dl, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-alo-brand-light/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${dl.urgent ? 'bg-[var(--alo-error)] animate-pulse' : 'bg-alo-border'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-alo-text truncate">{dl.title}</p>
                        <p className="text-[11px] text-alo-text-muted">{dl.date}</p>
                      </div>
                    </div>
                    <Badge variant={dl.urgent ? 'danger' : 'muted'} className="text-[11px] shrink-0">{dl.daysLeft}d left</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
