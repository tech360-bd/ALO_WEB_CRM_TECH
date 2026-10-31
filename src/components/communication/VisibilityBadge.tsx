'use client';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock, Eye, Shield, Users } from 'lucide-react';

const MAP: Record<string, { label: string; className: string; icon?: any }> = {
  public_safe: { label: 'Public Safe', className: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]' },
  student_visible: { label: 'Student Visible', className: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]', icon: Eye },
  partner_visible: { label: 'Partner Visible', className: 'bg-crm-success-bg text-crm-success-text border-crm-success-border', icon: Users },
  b2b_confidential: { label: 'B2B Confidential', className: 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border', icon: Lock },
  internal_only: { label: 'Internal Only', className: 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border', icon: Shield },
  super_admin_only: { label: 'Super Admin', className: 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border', icon: Shield },
};

export default function VisibilityBadge({ visibility, size = 'xs' }: { visibility: string; size?: 'xs'|'sm' }) {
  const meta = MAP[visibility] || MAP.public_safe;
  const Icon = meta.icon || Eye;
  return <Badge variant="outline" className={`inline-flex items-center gap-1 ${meta.className} ${size==='xs'?'text-[11px] px-1.5 py-0':'text-xs'}`}><Icon className="w-3 h-3" />{meta.label}</Badge>;
}
