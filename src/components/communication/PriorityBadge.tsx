'use client';
import React from 'react';
import { Badge } from '@/components/ui/badge';

const MAP: Record<string, string> = {
  low: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]',
  normal: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]',
  high: 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border',
  urgent: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] border-[var(--alo-cta)]/25',
  sla_overdue: 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border animate-pulse',
};

export default function PriorityBadge({ priority }: { priority: string }) {
  const cls = MAP[priority || 'normal'] || MAP.normal;
  return <Badge variant="outline" className={`text-[11px] ${cls} border`}>{(priority||'normal').toUpperCase().replace('_',' ')}</Badge>;
}
