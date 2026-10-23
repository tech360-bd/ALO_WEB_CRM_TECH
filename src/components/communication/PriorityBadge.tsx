'use client';
import React from 'react';
import { Badge } from '@/components/ui/badge';

const MAP: Record<string, string> = {
  low: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-amber-100 text-amber-700 border-amber-200',
  urgent: 'bg-orange-100 text-orange-700 border-orange-200',
  sla_overdue: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
};

export default function PriorityBadge({ priority }: { priority: string }) {
  const cls = MAP[priority || 'normal'] || MAP.normal;
  return <Badge variant="outline" className={`text-[11px] ${cls} border`}>{(priority||'normal').toUpperCase().replace('_',' ')}</Badge>;
}
