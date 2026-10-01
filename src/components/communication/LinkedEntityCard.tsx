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
    <Card className="border border-blue-100 bg-blue-50/30">
      <CardContent className="p-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-white border border-blue-200 flex items-center justify-center"><Icon className="w-4 h-4 text-[#0B5ED7]" /></div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-900 capitalize">{entity.type} • {entity.id.substring(0, 10)}</p>
          <p className="text-[11px] text-gray-600 truncate">{entity.label || `${entity.type} #${entity.id}`}</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px] bg-white">Linked</Badge>
      </CardContent>
    </Card>
  );
}
