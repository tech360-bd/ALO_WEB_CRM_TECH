'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus, Search, Download, FileSpreadsheet } from 'lucide-react';

/**
 * Shared dashboard primitives (portal + CRM dashboards).
 *
 * Master spec compliance (2026-10-24):
 *   • Every colour resolves to a design token — no raw `slate-*`/`orange-*`
 *     utility classes, so the same component is correct in light and dark.
 *   • Type scale follows §04: page title 26–30px, metric value 28px,
 *     metric label 11px uppercase tracking, supporting copy 13px.
 *   • Cards use the token radius/shadow scale (§06), never a one-off.
 *   • Inputs keep a 48px control height (§14) instead of h-8.
 *   • Trend arrows pair colour with a direction icon — status is never
 *     communicated by colour alone (§13).
 */

export function PageHeader({ title, subtitle, actions, dateFilter, meta }: { title: string; subtitle?: string; actions?: React.ReactNode; dateFilter?: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="crm-page-title truncate">{title}</h1>
        {subtitle && <p className="body-text mt-1 text-[var(--alo-text-muted)]">{subtitle}</p>}
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
    <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between bg-card border border-[var(--alo-border)] rounded-[14px] p-3">
      <div className="flex flex-wrap gap-2 items-center">{filters}</div>
      <div className="flex gap-2 items-center">
        {onSearch && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--alo-text-muted)]" aria-hidden="true" />
            <Input
              value={q}
              onChange={e=> setQ(e.target.value)}
              placeholder="Filter…"
              aria-label="Filter records"
              className="pl-9 h-12 w-[220px]"
            />
          </div>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-1.5"/>Export CSV
          </Button>
        )}
      </div>
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>;
}

export function KpiCard({ title, value, subtitle, trend, icon: Icon, drillDown, loading }: { title: string; value: string|number; subtitle?: string; trend?: 'up'|'down'|'flat'; icon?: any; drillDown?: () => void; loading?: boolean }) {
  return (
    <Card
      className={cn(
        'rounded-[16px] border-[var(--alo-border)] bg-card alo-shadow-xs transition-shadow duration-200',
        drillDown && 'cursor-pointer hover:shadow-[var(--alo-shadow-lg)] hover:border-[var(--alo-brand-border)]'
      )}
      onClick={drillDown}
    >
      <CardHeader className="pb-1 pt-5 px-5">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="caption-text">{title}</CardTitle>
          {Icon && (
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-[var(--alo-blue-soft)] text-[var(--alo-blue)]">
              <Icon className="w-4 h-4" aria-hidden="true" />
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[28px] leading-9 font-bold tracking-[-0.02em] text-[var(--alo-text)] tabular-nums">
              {loading ? '—' : value}
            </div>
            {subtitle && <p className="text-[13px] leading-5 text-[var(--alo-text-muted)] mt-1">{subtitle}</p>}
          </div>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[12px] font-semibold',
                trend==='up' && 'bg-crm-success-bg text-crm-success-text border-crm-success-border',
                trend==='down' && 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border',
                trend==='flat' && 'bg-crm-neutral-bg text-crm-neutral-text border-crm-neutral-border'
              )}
            >
              {trend==='up' && <ArrowUpRight className="w-3 h-3" aria-hidden="true" />}
              {trend==='down' && <ArrowDownRight className="w-3 h-3" aria-hidden="true" />}
              {trend==='flat' && <Minus className="w-3 h-3" aria-hidden="true" />}
              <span className="sr-only">{trend==='up' ? 'Trending up' : trend==='down' ? 'Trending down' : 'No change'}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SectionCard({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="rounded-[16px] border-[var(--alo-border)] bg-card overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="crm-section-title">{title}</CardTitle>
          {description && <CardDescription className="text-[13px] leading-5 mt-0.5">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}

export function DataTableFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-[var(--alo-border)] rounded-[14px] overflow-hidden bg-card">
      <div className="overflow-x-auto alo-scrollbar">{children}</div>
    </div>
  );
}

export function QuickActions({ items }: { items: { label: string; icon: any; onClick: () => void }[] }) {
  return (
    <SectionCard title="Quick Actions">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {items.map(a=> (
          <Button key={a.label} variant="outline" onClick={a.onClick} className="justify-start h-auto py-3 text-[14px]">
            <a.icon className="w-4 h-4 mr-2 shrink-0" aria-hidden="true"/>{a.label}
          </Button>
        ))}
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
    <div className="sticky top-16 z-20 flex items-center gap-3 rounded-[14px] border border-[var(--alo-brand-border)] bg-[var(--alo-orange-soft)] px-4 py-2.5">
      <span className="text-[14px] font-semibold text-[var(--alo-text)]">
        {count} selected
      </span>
      <div className="flex gap-2 ml-auto">
        {onExport && (
          <Button size="sm" variant="outline" disabled={disabled} onClick={onExport}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5" aria-hidden="true"/>Export
          </Button>
        )}
        {onAction && (
          <Button size="sm" variant="default" disabled={disabled} onClick={onAction}>Bulk Action</Button>
        )}
      </div>
    </div>
  );
}
