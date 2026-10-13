'use client';

import React, { useState } from 'react';
import { KanbanPipeline } from '@/components/alo/new/crm/kanban-pipeline';
import { AutomationEngine } from '@/components/alo/new/crm/automation-engine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LayoutDashboard, Zap, ArrowLeft, BarChart3, Users, TrendingUp,
  Target, Award, Clock, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface CrmKanbanPageProps {
  onBack?: () => void;
}

/* ─── Brand Colors ─── */
const ALO_BLUE = '#0052B8';
const ALO_ORANGE = '#E8501A';

/* ─── Pipeline Analytics Data (CRMEB + OroCRM pattern) ─── */
const STAGE_ANALYTICS = [
  { stage: 'New', count: 3, color: '#6b7280' },
  { stage: 'Contacted', count: 3, color: '#3b82f6' },
  { stage: 'Qualified', count: 2, color: '#f59e0b' },
  { stage: 'Application', count: 2, color: '#8b5cf6' },
  { stage: 'Offered', count: 2, color: '#14b8a6' },
  { stage: 'Enrolled', count: 1, color: '#22c55e' },
  { stage: 'Lost', count: 1, color: '#ef4444' },
];

const CONVERSION_FUNNEL = [
  { stage: 'New → Contacted', rate: 72 },
  { stage: 'Contacted → Qualified', rate: 58 },
  { stage: 'Qualified → Application', rate: 65 },
  { stage: 'Application → Offered', rate: 80 },
  { stage: 'Offered → Enrolled', rate: 85 },
];

const LEAD_SCORE_DIST = [
  { name: 'HOT (70+)', value: 5, color: '#ef4444' },
  { name: 'WARM (40-69)', value: 6, color: '#f59e0b' },
  { name: 'COLD (<40)', value: 3, color: '#3b82f6' },
];

/* ─── Enhanced Analytics Tab ─── */
function CrmAnalyticsPanel() {
  const metrics = [
    { label: 'Total Leads', value: '14', change: '+12%', icon: Users, color: ALO_BLUE },
    { label: 'Conversion Rate', value: '34%', change: '+5%', icon: TrendingUp, color: '#22c55e' },
    { label: 'Avg. Days to Enroll', value: '28', change: '-3', icon: Clock, color: '#f59e0b' },
    { label: 'Pipeline Value', value: '$344K', change: '+18%', icon: Target, color: ALO_ORANGE },
    { label: 'HOT Leads', value: '5', change: '+2', icon: Activity, color: '#ef4444' },
    { label: 'Enrolled', value: '1', change: '+1', icon: Award, color: '#22c55e' },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {metrics.map(m => (
          <Card key={m.label} className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <m.icon className="h-4 w-4" style={{ color: m.color }} />
                <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 h-4 px-1">
                  {m.change}
                </Badge>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">{m.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{m.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution (Frappe CRM pattern) */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Leads by Stage</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={STAGE_ANALYTICS} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {STAGE_ANALYTICS.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Score Distribution (Comp CRM pattern) */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Lead Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={LEAD_SCORE_DIST}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {LEAD_SCORE_DIST.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {LEAD_SCORE_DIST.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px] text-slate-500">{d.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel (CRMEB pattern) */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Stage-to-Stage Conversion Rates</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CONVERSION_FUNNEL} layout="vertical" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={160} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Bar dataKey="rate" radius={[0, 6, 6, 0]} name="Conversion %">
                {CONVERSION_FUNNEL.map((entry, idx) => (
                  <Cell key={idx} fill={entry.rate >= 70 ? '#22c55e' : entry.rate >= 50 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Main Page ─── */
export function CrmKanbanPage({ onBack }: CrmKanbanPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold">CRM Pipeline</h1>
              <p className="text-xs text-white/50">Lead management & automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs text-white" style={{ backgroundColor: ALO_ORANGE }}>
              14 Active Leads
            </Badge>
            <Badge variant="secondary" className="text-xs bg-white/10 text-white/70">
              4 Automation Rules
            </Badge>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
        <div className="bg-white border-b border-slate-200 px-4">
          <div className="max-w-[1400px] mx-auto">
            <TabsList className="bg-transparent h-10 gap-1 p-0">
              <TabsTrigger
                value="kanban"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#E8501A] data-[state=active]:text-slate-900 data-[state=active]:font-semibold text-slate-500 h-10 rounded-none px-4 text-sm"
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Kanban Board
              </TabsTrigger>
              <TabsTrigger
                value="automation"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#E8501A] data-[state=active]:text-slate-900 data-[state=active]:font-semibold text-slate-500 h-10 rounded-none px-4 text-sm"
              >
                <Zap className="h-4 w-4 mr-1.5" />
                Automation
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#E8501A] data-[state=active]:text-slate-900 data-[state=active]:font-semibold text-slate-500 h-10 rounded-none px-4 text-sm"
              >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="kanban" className="flex-1 m-0">
          <KanbanPipeline />
        </TabsContent>

        <TabsContent value="automation" className="flex-1 m-0">
          <AutomationEngine />
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 m-0">
          <CrmAnalyticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
