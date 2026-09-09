'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileBarChart, Users, FileText, DollarSign, TrendingUp, Activity, CalendarDays } from 'lucide-react';

const quickStats = [
  { label: 'Activities This Week', value: '47', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Students Managed', value: '24', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Applications Processed', value: '8', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Revenue Generated', value: '৳2.4L', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const reportCategories = [
  { name: 'Daily Activity Report', icon: Activity, description: 'Tasks, calls, emails, follow-ups per day', format: 'PDF', lastGenerated: 'Today' },
  { name: 'Student Pipeline Report', icon: Users, description: 'All students by stage: enquiry to enrolled', format: 'Excel', lastGenerated: 'Yesterday' },
  { name: 'Application Summary', icon: FileText, description: 'Application status, pending items, deadlines', format: 'PDF', lastGenerated: '2 days ago' },
  { name: 'Financial Report', icon: DollarSign, description: 'Commission earned, payments processed', format: 'Excel', lastGenerated: '3 days ago' },
  { name: 'Performance Summary', icon: TrendingUp, description: 'KPIs, targets, achievements, ratings', format: 'PDF', lastGenerated: 'Last week' },
  { name: 'Attendance Report', icon: CalendarDays, description: 'Monthly attendance, working hours, leaves', format: 'PDF', lastGenerated: 'Last week' },
];

const weeklyActivity = [
  { date: '2025-01-20', activity: 'Student follow-ups', count: 12, time: '2.5 hrs' },
  { date: '2025-01-20', activity: 'Application submissions', count: 3, time: '1.5 hrs' },
  { date: '2025-01-19', activity: 'Counseling sessions', count: 5, time: '3.0 hrs' },
  { date: '2025-01-19', activity: 'Document reviews', count: 8, time: '2.0 hrs' },
  { date: '2025-01-18', activity: 'Lead follow-ups', count: 10, time: '2.0 hrs' },
  { date: '2025-01-18', activity: 'Email responses', count: 15, time: '1.5 hrs' },
  { date: '2025-01-17', activity: 'Visa processing', count: 4, time: '3.0 hrs' },
  { date: '2025-01-17', activity: 'Team meetings', count: 2, time: '1.0 hrs' },
  { date: '2025-01-16', activity: 'University Liaison', count: 6, time: '2.0 hrs' },
  { date: '2025-01-16', activity: 'Offer follow-ups', count: 3, time: '1.0 hrs' },
];

export default function EmployeeReportsPage() {
  const { user } = usePortalStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-alo-text">Reports &amp; Analytics</h1>
        <p className="text-sm text-alo-text-muted">Access your activity reports and performance data</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map(s => (
          <Card key={s.label} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-alo-text">{s.value}</p>
              <p className="text-xs text-alo-text-muted mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Categories */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-alo-brand" />
            <CardTitle className="text-base font-semibold text-alo-text">Available Reports</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportCategories.map(r => (
              <div key={r.name} className="flex items-center gap-4 p-3 rounded-xl border border-alo-border hover:border-alo-brand/30 hover:bg-alo-page/50 transition-all">
                <div className="w-10 h-10 rounded-lg bg-alo-brand-light flex items-center justify-center shrink-0">
                  <r.icon className="w-5 h-5 text-alo-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-alo-text">{r.name}</p>
                  <p className="text-[11px] text-alo-text-muted mt-0.5">{r.description}</p>
                  <p className="text-[10px] text-alo-text-muted mt-0.5">Last: {r.lastGenerated} · {r.format}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-alo-brand shrink-0">
                  <Download className="w-3 h-3 mr-1" /> {r.format}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activity Log */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold text-alo-text">This Week&apos;s Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-alo-border">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Date</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Activity</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Count</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Time Spent</th>
              </tr></thead>
              <tbody>
                {weeklyActivity.map((a, i) => (
                  <tr key={i} className="border-b border-alo-border/50 hover:bg-alo-page/50">
                    <td className="py-2.5 px-3 text-alo-text-secondary text-xs">{a.date}</td>
                    <td className="py-2.5 px-3 text-alo-text font-medium">{a.activity}</td>
                    <td className="py-2.5 px-3 text-alo-text">{a.count}</td>
                    <td className="py-2.5 px-3 text-alo-text-secondary">{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
