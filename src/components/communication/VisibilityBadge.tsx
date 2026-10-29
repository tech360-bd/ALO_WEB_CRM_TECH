'use client';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock, Eye, Shield, Users } from 'lucide-react';

const MAP: Record<string, { label: string; className: string; icon?: any }> = {
  public_safe: { label: 'Public Safe', className: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]' },
  student_visible: { label: 'Student Visible', className: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)]', icon: Eye },
  partner_visible: { label: 'Partner Visible', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Users },
  b2b_confidential: { label: 'B2B Confidential', className: 'bg-rose-100 text-rose-800 border-rose-200', icon: Lock },
  internal_only: { label: 'Internal Only', className: 'bg-amber-100 text-amber-900 border-amber-200', icon: Shield },
  super_admin_only: { label: 'Super Admin', className: 'bg-red-100 text-red-900 border-red-200', icon: Shield },
};

export default function VisibilityBadge({ visibility, size = 'xs' }: { visibility: string; size?: 'xs'|'sm' }) {
  const meta = MAP[visibility] || MAP.public_safe;
  const Icon = meta.icon || Eye;
  return <Badge variant="outline" className={`inline-flex items-center gap-1 ${meta.className} ${size==='xs'?'text-[11px] px-1.5 py-0':'text-xs'}`}><Icon className="w-3 h-3" />{meta.label}</Badge>;
}
