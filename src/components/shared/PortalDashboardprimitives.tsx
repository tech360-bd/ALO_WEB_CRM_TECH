'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus, Search, SlidersHorizontal, Download, FileSpreadsheet } from 'lucide-react';
import type { DashboardKpiConfig } from '@/lib/dashboard-config';

export function PageHeader({ title, subtitle, actions, dateFilter, meta }: { title: string; subtitle?: string; actions?: React.ReactNode; dateFilter?: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        {meta && <div className="mt-2">{meta}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {dateFilter}
        {actions}
      </div>
    </div>
  );
}

export function FilterBar({ filters, onExport, onSearch }: { filters?: React.ReactNode; onExport?: () => void; onSearch?: (q:string)=>void }) {
  const [q,setQ]=React.useState('');
  React.useEffect(()=>{ const t=setTimeout(()=> onSearch?.(q), 300); return ()=>clearTimeout(t); }, [q]);
  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
      <div className="flex flex-wrap gap-2 items-center">{filters}</div>
      <div className="flex gap-2 items-center">
        {onSearch && (<div className="relative"><Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400"/><Input value={q} onChange={e=> setQ(e.target.value)} placeholder="Filter..." className="pl-8 h-8"/></div>)}
        {onExport && <Button variant="outline" size="sm" onClick={onExport}><Download className="w-3.5 h-3.5 mr-1"/>Export CSV</Button>}
      </div>
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">{children}</div>;
}

export function KpiCard({ title, value, subtitle, trend, icon: Icon, drillDown, loading }: { title: string; value: string|number; subtitle?: string; trend?: 'up'|'down'|'flat'; icon?: any; drillDown?: () => void; loading?: boolean }) {
  return (
    <Card className={cn('rounded-xl', drillDown && 'cursor-pointer hover:shadow-md transition-shadow')} onClick={drillDown}>
      <CardHeader className="pb-1 pt-4 px-4"><div className="flex items-center justify-between gap-2"><CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</CardTitle>{Icon && <Icon className="w-3.5 h-3.5 text-slate-400"/>}</div></CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-xl font-black text-slate-900">{loading?'—':value}</div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {trend && <span className={cn('inline-flex items-center text-xs font-bold', trend==='up'&&'text-emerald-600', trend==='down'&&'text-red-600', trend==='flat'&&'text-slate-400')}>{trend==='up'&&<ArrowUpRight className="w-3 h-3"/>}{trend==='down'&&<ArrowDownRight className="w-3 h-3"/>}{trend==='flat'&&<Minus className="w-3 h-3"/>}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function SectionCard({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (<Card className="rounded-xl overflow-hidden"><CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0"><div><CardTitle className="text-sm font-bold">{title}</CardTitle>{description && <CardDescription className="text-xs">{description}</CardDescription>}</div>{action}</CardHeader><CardContent className="pt-0">{children}</CardContent></Card>);
}

export function DataTableFrame({ children }: { children: React.ReactNode }) {
  return <div className="border border-slate-200 rounded-xl overflow-hidden bg-white"><div className="overflow-x-auto">{children}</div></div>;
}

export function QuickActions({ items }: { items: { label: string; icon: any; onClick: () => void }[] }) {
  return (
    <SectionCard title="Quick Actions">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {items.map(a=> (<Button key={a.label} variant="outline" onClick={a.onClick} className="justify-start h-auto py-3"><a.icon className="w-4 h-4 mr-2 shrink-0"/>{a.label}</Button>))}
      </div>
    </SectionCard>
  );
}

export function ReportBlock({ title, cols, children }: { title: string; cols?: string[]; children: React.ReactNode }) {
  return (<SectionCard title={title} description={cols?.join(' • ')}>{children}</SectionCard>);
}

export function BulkToolbar({ count, onExport, onAction, disabled }: { count: number; onExport?: () => void; onAction?: () => void; disabled?: boolean }) {
  if (!count) return null;
  return (
    <div className="sticky top-14 z-20 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-center gap-3">
      <span className="text-sm font-bold text-orange-900">{count} selected</span>
      <div className="flex gap-2 ml-auto">
        {onExport && <Button size="sm" variant="outline" disabled={disabled} onClick={onExport}><FileSpreadsheet className="w-3.5 h-3.5 mr-1"/>Export</Button>}
        {onAction && <Button size="sm" className="bg-orange-600" disabled={disabled} onClick={onAction}>Bulk Action</Button>}
      </div>
    </div>
  );
}
