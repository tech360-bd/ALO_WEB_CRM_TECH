'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SlaCountdownBadgeProps {
  slaDueAt: string | Date | null;
  slaTriggeredAt?: string | Date | null;
  size?: 'sm' | 'md' | 'lg';
}

type SlaState = 'normal' | 'warning' | 'urgent' | 'overdue' | 'none';

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  const remMins = minutes % 60;
  if (hours > 0) return `${hours}h ${remMins}m`;
  return `${String(remMins).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function SlaCountdownBadge({ slaDueAt, slaTriggeredAt, size = 'md' }: SlaCountdownBadgeProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!slaDueAt) {
    return (
      <Badge className="bg-slate-100 text-slate-500 text-[10px] font-bold gap-1">
        <Clock className="w-3 h-3" /> NO SLA
      </Badge>
    );
  }

  const dueAt = new Date(slaDueAt);
  const triggeredAt = slaTriggeredAt ? new Date(slaTriggeredAt) : null;
  const diffMs = dueAt.getTime() - now.getTime();
  const isOverdue = diffMs <= 0;

  let state: SlaState = 'normal';
  if (isOverdue) {
    state = 'overdue';
  } else if (triggeredAt) {
    const totalMs = dueAt.getTime() - triggeredAt.getTime();
    const pct = 1 - diffMs / totalMs;
    if (pct >= 0.93) state = 'urgent';
    else if (pct >= 0.67) state = 'warning';
    else state = 'normal';
  }

  const configs: Record<SlaState, { label: string; prefix: string; classes: string; icon: React.ReactNode }> = {
    normal: {
      label: formatDuration(diffMs),
      prefix: 'DUE IN',
      classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      icon: <Clock className="w-3 h-3" />,
    },
    warning: {
      label: formatDuration(diffMs),
      prefix: 'WARNING',
      classes: 'bg-amber-50 text-amber-700 border border-amber-300',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    urgent: {
      label: formatDuration(diffMs),
      prefix: 'URGENT',
      classes: 'bg-orange-50 text-orange-700 border border-orange-400 animate-pulse',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    overdue: {
      label: formatDuration(diffMs),
      prefix: 'OVERDUE BY',
      classes: 'bg-red-100 text-red-700 border border-red-400',
      icon: <AlertCircle className="w-3 h-3" />,
    },
    none: {
      label: '',
      prefix: '',
      classes: 'bg-slate-100 text-slate-500',
      icon: null,
    },
  };

  const cfg = configs[state];
  const sizeClasses = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : size === 'lg' ? 'text-xs px-3 py-1' : 'text-[10px] px-2 py-0.5';

  return (
    <Badge className={`${cfg.classes} ${sizeClasses} font-mono font-bold flex items-center gap-1 whitespace-nowrap`}>
      {cfg.icon}
      <span className="font-bold uppercase tracking-wide">{cfg.prefix}:</span>
      <span>{cfg.label}</span>
    </Badge>
  );
}
