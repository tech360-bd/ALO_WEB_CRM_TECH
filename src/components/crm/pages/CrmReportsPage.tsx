'use client';

import { useState } from 'react';
import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Target, FileText, TrendingUp, DollarSign, Plane, Users, Building2, Handshake,
  Download, Calendar, BarChart3, PieChart, LineChart, Activity,
} from 'lucide-react';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  lastGenerated: string;
  category: string;
}

const reports: ReportCard[] = [
  { id: '1', title: 'Lead Report', description: 'Lead source analysis, conversion rates, counselor performance, and pipeline trends.', icon: Target, color: 'text-blue-600 bg-blue-50', lastGenerated: '2025-06-25 14:30', category: 'Sales' },
  { id: '2', title: 'Application Report', description: 'Application status breakdown, university-wise stats, and stage conversion funnel.', icon: FileText, color: 'text-purple-600 bg-purple-50', lastGenerated: '2025-06-25 12:00', category: 'Operations' },
  { id: '3', title: 'Conversion Report', description: 'Lead-to-enrollment conversion rates, bottleneck analysis, and drop-off points.', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', lastGenerated: '2025-06-24 18:45', category: 'Sales' },
  { id: '4', title: 'Revenue Report', description: 'Revenue breakdown, payment collection status, and financial projections.', icon: DollarSign, color: 'text-yellow-600 bg-yellow-50', lastGenerated: '2025-06-25 09:15', category: 'Finance' },
  { id: '5', title: 'Visa Report', description: 'Visa success rates, country-wise breakdown, risk analysis, and processing times.', icon: Plane, color: 'text-cyan-600 bg-cyan-50', lastGenerated: '2025-06-25 11:00', category: 'Operations' },
  { id: '6', title: 'Counselor Performance', description: 'Individual counselor KPIs, student handling capacity, and success metrics.', icon: Users, color: 'text-orange-600 bg-orange-50', lastGenerated: '2025-06-25 08:00', category: 'HR' },
  { id: '7', title: 'Branch Report', description: 'Branch-wise comparison, student volume, and revenue contribution.', icon: Building2, color: 'text-rose-600 bg-rose-50', lastGenerated: '2025-06-24 16:30', category: 'Operations' },
  { id: '8', title: 'Partner Report', description: 'Partner performance, referral volumes, commission summaries, and partner health.', icon: Handshake, color: 'text-indigo-600 bg-indigo-50', lastGenerated: '2025-06-24 14:00', category: 'Partnerships' },
];

export default function CrmReportsPage() {
  const { setView } = usePortalStore();
  const [category, setCategory] = useState('all');

  const filtered = category === 'all' ? reports : reports.filter((r) => r.category === category);
  const categories = [...new Set(reports.map((r) => r.category))];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-alo-text">Reports &amp; Analytics</h1>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button key={cat} variant={category === cat ? 'default' : 'outline'} size="sm"
              className={category === cat ? 'bg-alo-brand text-white' : ''}
              onClick={() => setCategory(category === cat ? 'all' : cat)}>
              {cat}
            </Button>
          ))}
          {category !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setCategory('all')}>Clear</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filtered.map((report) => (
          <Card key={report.id} className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${report.color}`}>
                  <report.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-xs">{report.category}</Badge>
              </div>
              <CardTitle className="text-base font-semibold text-alo-text mt-3">{report.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-alo-text-muted mb-4 line-clamp-2">{report.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-alo-text-muted">
                  <Calendar className="h-3 w-3" />
                  {report.lastGenerated}
                </div>
                <Button size="sm" className="bg-alo-brand hover:bg-alo-brand-light text-white text-xs h-7">
                  <Download className="mr-1 h-3 w-3" />Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}