'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare, Mail, Phone, PhoneMissed, MessageCircle, Share2,
  FileText, ShieldAlert, CheckCircle2, Clock, Lock, Sparkles, AlertTriangle, Send, User, ChevronDown
} from 'lucide-react';

export type VisibilityLevel =
  | 'public_safe'
  | 'student_visible'
  | 'partner_visible'
  | 'counselor_visible'
  | 'application_team_visible'
  | 'visa_team_visible'
  | 'finance_visible'
  | 'marketing_visible'
  | 'b2b_confidential'
  | 'internal_only'
  | 'super_admin_only';

export type TimelineItemType =
  | 'whatsapp'
  | 'sms'
  | 'email'
  | 'call'
  | 'missed_call'
  | 'portal_message'
  | 'facebook_comment'
  | 'instagram_comment'
  | 'dm'
  | 'internal_note'
  | 'student_visible_note'
  | 'partner_visible_note'
  | 'document_request'
  | 'application_update'
  | 'visa_update'
  | 'payment_update'
  | 'commission_update'
  | 'task'
  | 'reminder'
  | 'appointment'
  | 'ai_draft'
  | 'system_notification'
  | 'b2b_confidential_note';

export interface TimelineEntry {
  id: string;
  type: TimelineItemType;
  channel: string;
  senderName: string;
  senderRole: string;
  recipientName?: string;
  body: string;
  visibility: VisibilityLevel;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  createdAt: string;
  linkedEntity?: {
    type: string;
    id: string;
    label: string;
  };
  aiDrafted?: boolean;
  b2bConfidential?: boolean;
}

const VISIBILITY_BADGES: Record<VisibilityLevel, { label: string; bg: string; text: string }> = {
  public_safe: { label: 'Public Safe', bg: 'bg-[var(--alo-surface-muted)]', text: 'text-[var(--alo-body)]' },
  student_visible: { label: 'Student Visible', bg: 'bg-blue-50', text: 'text-blue-700' },
  partner_visible: { label: 'Partner Visible', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  counselor_visible: { label: 'Counselor Only', bg: 'bg-purple-50', text: 'text-purple-700' },
  application_team_visible: { label: 'App Team', bg: 'bg-amber-50', text: 'text-amber-700' },
  visa_team_visible: { label: 'Visa Team', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  finance_visible: { label: 'Finance Team', bg: 'bg-teal-50', text: 'text-teal-700' },
  marketing_visible: { label: 'Marketing', bg: 'bg-pink-50', text: 'text-pink-700' },
  b2b_confidential: { label: 'B2B Confidential 🔒', bg: 'bg-rose-100', text: 'text-rose-800' },
  internal_only: { label: 'Internal Only', bg: 'bg-amber-100', text: 'text-amber-900' },
  super_admin_only: { label: 'Super Admin 🔐', bg: 'bg-red-100', text: 'text-red-900' },
};

const TYPE_ICONS: Record<TimelineItemType, React.ElementType> = {
  whatsapp: MessageCircle,
  sms: MessageSquare,
  email: Mail,
  call: Phone,
  missed_call: PhoneMissed,
  portal_message: MessageSquare,
  facebook_comment: Share2,
  instagram_comment: Share2,
  dm: MessageCircle,
  internal_note: FileText,
  student_visible_note: FileText,
  partner_visible_note: FileText,
  document_request: AlertTriangle,
  application_update: CheckCircle2,
  visa_update: ShieldAlert,
  payment_update: CheckCircle2,
  commission_update: CheckCircle2,
  task: Clock,
  reminder: Clock,
  appointment: Clock,
  ai_draft: Sparkles,
  system_notification: ShieldAlert,
  b2b_confidential_note: Lock,
};

interface UnifiedCommunicationTimelineProps {
  entityType: 'lead' | 'student' | 'application' | 'document' | 'visa' | 'partner' | 'b2b' | 'campaign';
  entityId: string;
  userRole?: string; // e.g. 'STUDENT', 'PARTNER', 'COUNSELOR', 'APPLICATION_TEAM', 'SUPER_ADMIN'
  entries?: TimelineEntry[];
  onSendMessage?: (message: string, channel: string, visibility: VisibilityLevel) => void;
}

const DEFAULT_TIMELINE_MOCK: TimelineEntry[] = [
  {
    id: 't-101',
    type: 'whatsapp',
    channel: 'WhatsApp',
    senderName: 'Rahim Uddin (Counselor)',
    senderRole: 'Counselor',
    recipientName: 'Test Student',
    body: 'Hello! Thank you for contacting ALO Education. Here is your preliminary course evaluation for UK Fall 2025.',
    visibility: 'student_visible',
    status: 'read',
    createdAt: '2026-07-30 10:15 AM',
    linkedEntity: { type: 'lead', id: 'L-101', label: 'Lead #L-101' },
  },
  {
    id: 't-102',
    type: 'b2b_confidential_note',
    channel: 'Internal Note',
    senderName: 'System / B2B Route Engine',
    senderRole: 'Application Team',
    body: 'B2B Route Info: University of Manchester direct agent commission tier 12.5%. Confidential handling required.',
    visibility: 'b2b_confidential',
    status: 'delivered',
    createdAt: '2026-07-30 11:00 AM',
    b2bConfidential: true,
    linkedEntity: { type: 'application', id: 'APP-502', label: 'App #APP-502' },
  },
  {
    id: 't-103',
    type: 'document_request',
    channel: 'Student Portal',
    senderName: 'Application Team',
    senderRole: 'Application Officer',
    body: 'Please upload your updated IELTS Test Report Form (TRF) showing overall band 6.5 minimum.',
    visibility: 'student_visible',
    status: 'sent',
    createdAt: '2026-07-30 02:30 PM',
    linkedEntity: { type: 'document', id: 'DOC-88', label: 'IELTS Certificate' },
  },
  {
    id: 't-104',
    type: 'ai_draft',
    channel: 'AI Assistant',
    senderName: 'ALO AI Advisor',
    senderRole: 'AI Assistant',
    body: 'Suggested Draft: "Your visa document bundle has passed 90% compliance checks. Please schedule your biometrics appointment."',
    visibility: 'counselor_visible',
    status: 'pending',
    createdAt: '2026-07-30 03:00 PM',
    aiDrafted: true,
  },
];

export default function UnifiedCommunicationTimeline({
  entityType,
  entityId,
  userRole = 'SUPER_ADMIN',
  entries = DEFAULT_TIMELINE_MOCK,
  onSendMessage,
}: UnifiedCommunicationTimelineProps) {
  const [newMsg, setNewMsg] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('whatsapp');
  const [selectedVisibility, setSelectedVisibility] = useState<VisibilityLevel>('student_visible');

  // Filter entries based on Role Visibility Rules
  const visibleEntries = entries.filter((entry) => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;

    if (userRole === 'STUDENT') {
      return entry.visibility === 'public_safe' || entry.visibility === 'student_visible';
    }
    if (userRole === 'PARTNER') {
      return entry.visibility === 'public_safe' || entry.visibility === 'partner_visible';
    }
    if (userRole === 'COUNSELOR') {
      return entry.visibility !== 'b2b_confidential' && entry.visibility !== 'super_admin_only';
    }
    if (userRole === 'MARKETING') {
      return (
        entry.visibility === 'public_safe' ||
        entry.visibility === 'marketing_visible' ||
        entry.visibility === 'student_visible'
      );
    }
    if (userRole === 'APPLICATION_TEAM') {
      return entry.visibility !== 'super_admin_only';
    }

    return entry.visibility === 'public_safe';
  });

  const handleSend = () => {
    if (!newMsg.trim()) return;
    if (onSendMessage) {
      onSendMessage(newMsg, selectedChannel, selectedVisibility);
    }
    setNewMsg('');
  };

  return (
    <Card className="border border-[var(--alo-border)] shadow-sm bg-white rounded-xl">
      <CardHeader className="pb-3 border-b border-[var(--alo-border)] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <CardTitle className="text-sm font-bold text-[var(--alo-text)]">
            Unified Communication Timeline ({entityType.toUpperCase()} #{entityId})
          </CardTitle>
        </div>
        <Badge variant="outline" className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-200">
          {visibleEntries.length} Records
        </Badge>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Reply Box */}
        {userRole !== 'STUDENT' || (entityType === 'student' && userRole === 'STUDENT') ? (
          <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-lg p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--alo-body)]">Channel:</span>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="h-7 text-xs border border-[var(--alo-border-strong)] rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="portal_message">Portal Message</option>
                  <option value="internal_note">Internal Note</option>
                  {userRole === 'APPLICATION_TEAM' || userRole === 'SUPER_ADMIN' ? (
                    <option value="b2b_confidential">B2B Confidential Note</option>
                  ) : null}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--alo-body)]">Visibility:</span>
                <select
                  value={selectedVisibility}
                  onChange={(e) => setSelectedVisibility(e.target.value as VisibilityLevel)}
                  className="h-7 text-xs border border-[var(--alo-border-strong)] rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="student_visible">Student Visible</option>
                  <option value="partner_visible">Partner Visible</option>
                  <option value="counselor_visible">Counselor Only</option>
                  <option value="application_team_visible">App Team Only</option>
                  <option value="internal_only">Internal Staff Only</option>
                  {userRole === 'APPLICATION_TEAM' || userRole === 'SUPER_ADMIN' ? (
                    <option value="b2b_confidential">B2B Confidential 🔒</option>
                  ) : null}
                </select>
              </div>
            </div>

            <Textarea
              placeholder={`Write message / note linked to ${entityType}...`}
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              className="min-h-[60px] text-xs bg-white"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--alo-text-muted)]">
                🔒 All communication is logged to database &amp; audit trail
              </span>
              <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSend}>
                <Send className="w-3.5 h-3.5 mr-1" />
                Send &amp; Log
              </Button>
            </div>
          </div>
        ) : null}

        {/* Timeline Entries List */}
        <div className="relative border-l-2 border-indigo-100 pl-4 space-y-4">
          {visibleEntries.map((item) => {
            const Icon = TYPE_ICONS[item.type] || MessageSquare;
            const visMeta = VISIBILITY_BADGES[item.visibility] || VISIBILITY_BADGES.public_safe;

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-[25px] top-1.5 w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <Icon className="w-3 h-3 text-indigo-600" />
                </div>

                <div className="bg-white border border-[var(--alo-border)] rounded-lg p-3 shadow-xs space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--alo-text)]">{item.senderName}</span>
                      <span className="text-[11px] text-[var(--alo-text-muted)]">({item.senderRole})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`text-[11px] px-2 py-0.5 border ${visMeta.bg} ${visMeta.text}`}>
                        {visMeta.label}
                      </Badge>
                      <span className="text-[11px] text-[var(--alo-text-muted)]">{item.createdAt}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--alo-body)] whitespace-pre-wrap leading-relaxed">
                    {item.body}
                  </p>

                  {item.linkedEntity && (
                    <div className="text-[11px] text-[var(--alo-text-muted)] flex items-center gap-1">
                      <span>Linked to:</span>
                      <span className="font-semibold text-[var(--alo-body)]">{item.linkedEntity.label}</span>
                    </div>
                  )}

                  {item.aiDrafted && (
                    <div className="text-[11px] text-purple-600 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Generated by AI Assistant (Pending Manager Approval)
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {visibleEntries.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--alo-text-muted)]">
              No communication logs visible for your role.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
