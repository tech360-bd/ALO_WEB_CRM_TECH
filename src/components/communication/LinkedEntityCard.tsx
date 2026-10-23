'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User, Building2, Users, GraduationCap, FileCheck, Shield, Calendar } from 'lucide-react';

export default function LinkedEntityCard({ entity }: { entity: { type: string; id: string; label?: string } }) {
  const iconMap: Record<string, any> = {
    lead: Users, student: GraduationCap, partner: Building2, application: FileCheck, document: FileText, visa: Shield, campaign: Calendar, task: FileText
  };
  const Icon = iconMap[entity.type] || FileText;
  return (
    <Card className="border border-[var(--alo-border)] bg-[var(--alo-brand-pale)]/30">
      <CardContent className="p-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-white border border-[var(--alo-border)] flex items-center justify-center"><Icon className="w-4 h-4 text-[var(--alo-brand)]" /></div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[var(--alo-text)] capitalize">{entity.type} • {entity.id.substring(0, 10)}</p>
          <p className="text-[11px] text-[var(--alo-body)] truncate">{entity.label || `${entity.type} #${entity.id}`}</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[11px] bg-white">Linked</Badge>
      </CardContent>
    </Card>
  );
}
