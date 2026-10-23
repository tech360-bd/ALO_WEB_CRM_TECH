'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CheckCircle2, Users, Clock, Star, TrendingUp, Award, BarChart3, MessageSquare } from 'lucide-react';

const mockKpis = [
  { label: 'Tasks Completed', value: '47/50', change: '+5 this month', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', pct: 94 },
  { label: 'Student Conversions', value: '12', change: '+3 this month', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', pct: 80 },
  { label: 'Avg Response Time', value: '2.4 hrs', change: '-0.3 hrs improved', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', pct: 85 },
  { label: 'Client Satisfaction', value: '4.6/5', change: '+0.2 this quarter', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50', pct: 92 },
];

const mockMonthlyTrend = [
  { month: 'Aug', tasks: 38, conversions: 6, response: 3.2, satisfaction: 4.2 },
  { month: 'Sep', tasks: 40, conversions: 7, response: 3.0, satisfaction: 4.3 },
  { month: 'Oct', tasks: 42, conversions: 8, response: 2.8, satisfaction: 4.4 },
  { month: 'Nov', tasks: 44, conversions: 9, response: 2.6, satisfaction: 4.5 },
  { month: 'Dec', tasks: 45, conversions: 10, response: 2.5, satisfaction: 4.5 },
  { month: 'Jan', tasks: 47, conversions: 12, response: 2.4, satisfaction: 4.6 },
];

const mockFeedback = [
  { manager: 'Sarah Khan', rating: 4.5, comment: 'Excellent student engagement and follow-up consistency. Strong application quality.', date: '2025-01-15' },
  { manager: 'Karim Uddin', rating: 4.0, comment: 'Good counseling skills. Needs improvement in visa documentation turnaround time.', date: '2024-12-20' },
  { manager: 'Sarah Khan', rating: 4.2, comment: 'Professional conduct with students. Could take more initiative in lead follow-up.', date: '2024-11-10' },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-[var(--alo-placeholder)]'}`} />
      ))}
      <span className="ml-1.5 text-xs text-alo-text-muted">{rating}/5</span>
    </div>
  );
}

export default function EmployeePerformancePage() {
  const { user } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(mockKpis);
  const [monthlyTrend, setMonthlyTrend] = useState(mockMonthlyTrend);
  const [feedback, setFeedback] = useState(mockFeedback);

  useEffect(() => {
    const token = usePortalStore.getState().token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/employee/performance', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.kpis) setKpis(data.kpis);
        if (data?.monthlyTrend) setMonthlyTrend(data.monthlyTrend);
        if (data?.feedback) setFeedback(data.feedback);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); });
  }, []);

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-alo-text">Performance Dashboard</h1>
        <p className="text-sm text-alo-text-muted">Track your key performance indicators and feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
                <Badge variant="success" className="text-[11px]">{k.change}</Badge>
              </div>
              <p className="text-2xl font-bold text-alo-text">{k.value}</p>
              <p className="text-xs text-alo-text-muted mt-0.5">{k.label}</p>
              <div className="mt-2 h-1.5 bg-[var(--alo-surface-muted)] rounded-full overflow-hidden">
                <div className="h-full bg-alo-brand rounded-full transition-all" style={{ width: `${k.pct}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-alo-brand" />
            <CardTitle className="text-base font-semibold text-alo-text">Monthly Performance Trend</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-alo-border">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Month</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Tasks</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Conversions</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Avg Response</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Satisfaction</th>
              </tr></thead>
              <tbody>
                {monthlyTrend.map(m => (
                  <tr key={m.month} className="border-b border-alo-border/50 hover:bg-alo-page/50">
                    <td className="py-2.5 px-3 text-alo-text font-medium">{m.month} 2024/25</td>
                    <td className="py-2.5 px-3 text-alo-text">{m.tasks}</td>
                    <td className="py-2.5 px-3 text-alo-text">{m.conversions}</td>
                    <td className="py-2.5 px-3 text-alo-text">{m.response} hrs</td>
                    <td className="py-2.5 px-3"><RatingStars rating={m.satisfaction} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-alo-brand" />
            <CardTitle className="text-base font-semibold text-alo-text">Manager Feedback</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {feedback.map((f, i) => (
              <div key={i} className="p-4 rounded-xl border border-alo-border hover:border-alo-brand/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-alo-brand-light flex items-center justify-center text-alo-brand text-xs font-bold">
                      {f.manager.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-alo-text">{f.manager}</p>
                      <p className="text-[11px] text-alo-text-muted">{f.date}</p>
                    </div>
                  </div>
                  <RatingStars rating={f.rating} />
                </div>
                <p className="text-sm text-alo-text-secondary leading-relaxed">{f.comment}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
