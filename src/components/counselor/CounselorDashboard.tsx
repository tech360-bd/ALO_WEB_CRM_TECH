'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, FileText, Target, CalendarDays, MessageSquare, TrendingUp, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';

const stats = [
  { label: 'Active Students', value: '24', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { label: 'Pending Applications', value: '8', icon: FileText, color: 'bg-orange-50 text-orange-600' },
  { label: 'New Leads', value: '12', icon: Target, color: 'bg-green-50 text-green-600' },
  { label: 'Upcoming Appointments', value: '5', icon: CalendarDays, color: 'bg-purple-50 text-purple-600' },
];

const recentActivities = [
  { text: 'Application submitted for University of Manchester', time: '2 hours ago', type: 'success' },
  { text: 'New lead assigned: Rahman M.', time: '3 hours ago', type: 'info' },
  { text: 'Visa document review needed for Ahmed K.', time: '5 hours ago', type: 'warning' },
  { text: 'Student meeting completed: Fatima B.', time: 'Yesterday', type: 'success' },
  { text: 'Follow-up reminder: 3 students awaiting response', time: 'Yesterday', type: 'info' },];

const upcomingTasks = [
  { task: 'Review SOP for Cambridge application', due: 'Today', priority: 'high' },
  { task: 'Follow up with scholarship candidates', due: 'Tomorrow', priority: 'medium' },
  { task: 'Prepare visa documents batch', due: 'In 2 days', priority: 'high' },
  { task: 'Weekly progress report', due: 'Friday', priority: 'low' },
];

export default function CounselorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-alo-text">Counselor Dashboard</h1>
        <p className="text-sm text-alo-text-secondary mt-1">Welcome back! Here is your overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-alo-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-alo-text">{stat.value}</p>
                    <p className="text-xs text-alo-text-secondary">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-alo-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-alo-brand" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-alo-border last:border-0 last:pb-0">
                <div className="mt-0.5">
                  {activity.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : activity.type === 'warning' ? (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-alo-text">{activity.text}</p>
                  <p className="text-xs text-alo-text-muted mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="border-alo-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-alo-brand" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTasks.map((item, i) => (
              <div key={i} className="flex items-center justify-between pb-3 border-b border-alo-border last:border-0 last:pb-0">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm text-alo-text">{item.task}</p>
                  <p className="text-xs text-alo-text-muted mt-0.5">Due: {item.due}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[11px] shrink-0',
                    item.priority === 'high' && 'bg-red-50 text-red-600 border-red-200',
                    item.priority === 'medium' && 'bg-amber-50 text-amber-600 border-amber-200',
                    item.priority === 'low' && 'bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]'
                  )}
                >
                  {item.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
