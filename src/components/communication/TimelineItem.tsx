'use client';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Phone, PhoneMissed, MessageCircle, Share2, FileText, ShieldAlert, CheckCircle2, Clock, Lock, Sparkles, AlertTriangle, Send } from 'lucide-react';

const VIS_BADGE: Record<string, string> = {
  public_safe: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]',
  student_visible: 'bg-blue-50 text-blue-700 border-blue-200',
  partner_visible: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  b2b_confidential: 'bg-rose-100 text-rose-800 border-rose-200',
  internal_only: 'bg-amber-100 text-amber-900 border-amber-200',
  super_admin_only: 'bg-red-100 text-red-900 border-red-200',
};

export default function TimelineItem({ entry }: { entry: any }) {
  const Icon = entry.type === 'whatsapp' ? MessageCircle : entry.type === 'email' ? Mail : entry.type === 'call' ? Phone : entry.type === 'b2b_confidential_note' ? Lock : entry.type === 'ai_draft' ? Sparkles : entry.type === 'document_request' ? AlertTriangle : FileText;
  const vis = VIS_BADGE[entry.visibility] || VIS_BADGE.public_safe;
  return (
    <div className="relative pl-8 py-2">
      <div className="absolute left-0 top-2.5 w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-indigo-700" />
      </div>
      <div className="bg-white border border-[var(--alo-border)] rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--alo-text)]">{entry.senderName}</span>
            <Badge variant="outline" className={`text-[11px] ${vis} border`}>{entry.visibility}</Badge>
            {entry.aiDrafted && <Badge className="text-[11px] bg-purple-50 text-purple-700 border-purple-200"><Sparkles className="w-3 h-3 mr-1" />AI Draft</Badge>}
            {entry.b2bConfidential && <Badge className="text-[11px] bg-rose-100 text-rose-800">🔒 B2B</Badge>}
          </div>
          <span className="text-[11px] text-[var(--alo-text-muted)]">{entry.createdAt}</span>
        </div>
        <p className="text-xs text-[var(--alo-body)] mt-1.5 leading-relaxed whitespace-pre-wrap">{entry.body}</p>
        {entry.linkedEntity && (
          <div className="mt-2 text-[11px] text-[var(--alo-text-muted)] bg-[var(--alo-page)] border border-[var(--alo-border)] rounded px-2 py-1 inline-flex items-center gap-1">
            <FileText className="w-3 h-3" /> {entry.linkedEntity.type}: {entry.linkedEntity.label}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--alo-text-muted)]">
          <span>Channel: {entry.channel}</span> • <span>Status: {entry.status}</span> • <span>Type: {entry.type}</span>
        </div>
      </div>
    </div>
  );
}
