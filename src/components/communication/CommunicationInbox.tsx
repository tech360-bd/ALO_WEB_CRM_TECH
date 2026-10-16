'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare, Mail, Phone, MessageCircle, Send, Filter, Search, Clock,
  AlertTriangle, CheckCircle2, Reply, UserPlus, FileText, Flag, Eye, Archive, Ban, ArrowUpCircle, Calendar, Smartphone, Globe, Building2, BookOpen, Shield
} from 'lucide-react';
import SlaCountdownBadge from './SlaCountdownBadge';
import { SLA_STATES } from '@/lib/communications/sla-policy';

// Reuse visibility badges
const VISIBILITY_META: Record<string, { label: string; color: string }> = {
  public_safe: { label: 'Public Safe', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  student_visible: { label: 'Student Visible', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  partner_visible: { label: 'Partner Visible', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  counselor_visible: { label: 'Counselor Only', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  application_team_visible: { label: 'App Team', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  visa_team_visible: { label: 'Visa Team', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  finance_visible: { label: 'Finance', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  marketing_visible: { label: 'Marketing', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  b2b_confidential: { label: 'B2B 🔒', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  internal_only: { label: 'Internal Only', color: 'bg-amber-100 text-amber-900 border-amber-200' },
  super_admin_only: { label: 'Super Admin 🔐', color: 'bg-red-100 text-red-900 border-red-200' },
};

const CHANNEL_ICON: Record<string, any> = {
  whatsapp: MessageCircle, sms: Smartphone, email: Mail, website_chat: Globe,
  facebook_comment: MessageSquare, facebook_messenger: MessageSquare, instagram_comment: MessageSquare, instagram_dm: MessageSquare,
  portal_message: MessageSquare, phone_call_log: Phone, missed_call_log: Phone, system_notification: Shield, ai_draft_message: Shield
};

export default function CommunicationInbox({ canViewB2B = false }: { canViewB2B?: boolean }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    channel: 'all', source: '', office: '', counselor: '', assigned: '',
    student: '', partner: '', application: '', country: '', course: '',
    status: '', unread: '', sla: '', priority: '', b2b: '', marketing: '', visa: '', document: '', search: '', dateFrom: '', dateTo: ''
  });
  const [counts, setCounts] = useState({ total: 0, overdue: 0 });

  const fetchInbox = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.channel && filters.channel !== 'all') params.set('channel', filters.channel);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.sla) params.set('sla', filters.sla);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    // extended filters mapped to search where backend not yet extended
    const res = await fetch(`/api/crm/communications/inbox?${params.toString()}`);
    const json = await res.json();
    if (json.success || json.threads) {
      setThreads(json.threads || json.data || []);
      setCounts({ total: json.total || 0, overdue: json.overdueCount || 0 });
    }
    setLoading(false);
  };

  useEffect(() => { fetchInbox(); }, []);

  const onAction = async (action: string, threadId: string) => {
    await fetch('/api/crm/communications/inbox', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, threadId })
    });
    fetchInbox();
  };

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3 border-b bg-gray-50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0057B8]" /> Unified Inbox — All Channels (SLA-sorted)
            <Badge variant="outline" className="ml-2 bg-white">{counts.total} threads</Badge>
            {counts.overdue > 0 && <Badge className="bg-red-100 text-red-700 border-red-200">{counts.overdue} SLA overdue</Badge>}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={fetchInbox}><Clock className="w-3.5 h-3.5 mr-1" /> Refresh</Button>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            <Select value={filters.channel} onValueChange={v => setFilters(s => ({ ...s, channel: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="website_chat">Website Chat</SelectItem>
                <SelectItem value="facebook_messenger">Facebook Messenger</SelectItem>
                <SelectItem value="instagram_dm">Instagram DM</SelectItem>
                <SelectItem value="portal_message">Portal Message</SelectItem>
                <SelectItem value="phone_call_log">Phone Call</SelectItem>
                <SelectItem value="missed_call_log">Missed Call</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priority} onValueChange={v => setFilters(s => ({ ...s, priority: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="sla_overdue">SLA Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sla} onValueChange={v => setFilters(s => ({ ...s, sla: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="SLA" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All SLA</SelectItem>
                {/* Spec §148 states — the filter offers exactly the states the
                    countdown can display, no more and no fewer. */}
                {SLA_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state === 'critical' ? 'Critical (escalate)' : state.charAt(0).toUpperCase() + state.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={v => setFilters(s => ({ ...s, status: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="waiting_student">Waiting Student</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Lead/Student/App/Partner" value={filters.search} onChange={e => setFilters(s => ({ ...s, search: e.target.value }))} className="h-8 text-xs" />
            <Button size="sm" className="h-8 bg-[#0057B8] hover:bg-[#004a9e]" onClick={fetchInbox}><Search className="w-3.5 h-3.5 mr-1" /> Search</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
            <Input placeholder="Office" value={filters.office} onChange={e => setFilters(s => ({ ...s, office: e.target.value }))} className="h-7 text-xs" />
            <Input placeholder="Counselor" value={filters.counselor} onChange={e => setFilters(s => ({ ...s, counselor: e.target.value }))} className="h-7 text-xs" />
            <Input placeholder="Country" value={filters.country} onChange={e => setFilters(s => ({ ...s, country: e.target.value }))} className="h-7 text-xs" />
            <Input placeholder="Course" value={filters.course} onChange={e => setFilters(s => ({ ...s, course: e.target.value }))} className="h-7 text-xs" />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => setFilters({ channel: 'all', source: '', office: '', counselor: '', assigned: '', student: '', partner: '', application: '', country: '', course: '', status: '', unread: '', sla: '', priority: '', b2b: '', marketing: '', visa: '', document: '', search: '', dateFrom: '', dateTo: '' })}>Clear</Button>
              <Badge variant="outline" className="text-[10px] bg-amber-50 hidden sm:flex">Bangladesh TZ: Asia/Dhaka</Badge>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b text-[11px] text-gray-600">
                {/* Spec §145 column set: Priority • SLA • Channel • Student •
                    Application • Sender • Message • Assigned Counselor • Intent •
                    Status • Last Response • Deadline */}
                <tr>
                  <th className="px-2 py-2 text-left">Priority</th>
                  <th className="px-2 py-2 text-left">SLA</th>
                  <th className="px-2 py-2 text-left">Channel</th>
                  <th className="px-2 py-2 text-left">Student</th>
                  <th className="px-2 py-2 text-left">Application</th>
                  <th className="px-2 py-2 text-left">Sender / Message</th>
                  <th className="px-2 py-2 text-left">Assigned Counselor</th>
                  <th className="px-2 py-2 text-left">Intent</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Last Response</th>
                  <th className="px-2 py-2 text-left">Deadline</th>
                  <th className="px-2 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">Loading inbox…</td></tr>
                ) : threads.length === 0 ? (
                  <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">No messages. Connect WhatsApp/Facebook or create a test thread.</td></tr>
                ) : threads.map((t) => {
                  const Vis = VISIBILITY_META[t.visibility || 'public_safe'] || VISIBILITY_META.public_safe;
                  const ChanIcon = CHANNEL_ICON[t.channel] || MessageSquare;
                  const isB2B = t.visibility === 'b2b_confidential';
                  if (isB2B && !canViewB2B) return null;
                  return (
                    <tr key={t.id} className="border-b hover:bg-blue-50/30 align-top">
                      {/* Priority (§145) */}
                      <td className="px-2 py-2">
                        <Badge variant="outline" className={`text-[10px] ${t.priority === 'urgent' || t.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' : t.priority === 'low' ? 'bg-gray-50 text-gray-600' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {(t.priority || 'normal').toUpperCase()}
                        </Badge>
                        <div className="mt-1"><Badge variant="outline" className={`text-[10px] ${Vis.color} border`}>{Vis.label}</Badge></div>
                      </td>
                      {/* SLA (§148) — icon + word + countdown, never colour alone */}
                      <td className="px-2 py-2">
                        <SlaCountdownBadge
                          slaDueAt={t.slaDueAt ? new Date(t.slaDueAt) : null}
                          slaTriggeredAt={t.lastMessageAt ? new Date(t.lastMessageAt) : null}
                          channel={t.channel}
                          priority={t.priority}
                          intent={t.intent}
                          slaState={t.slaState}
                          slaDisplay={t.slaDisplay}
                          responded={t.slaResponded}
                          size="sm"
                        />
                        {t.slaPolicyLabel && <div className="text-[10px] text-gray-400 mt-1">policy: {t.slaPolicyLabel} ({t.slaMinutes}m)</div>}
                      </td>
                      {/* Channel */}
                      <td className="px-2 py-2">
                        <Badge variant="outline" className="text-[10px] flex w-fit items-center gap-1"><ChanIcon className="w-3 h-3" /> {t.channel}</Badge>
                        <div className="text-[10px] text-gray-400 font-mono mt-1">{t.threadCode?.substring(0, 10) || t.id?.substring(0, 8)}</div>
                      </td>
                      {/* Student / lead */}
                      <td className="px-2 py-2">
                        <div className="font-medium truncate max-w-[140px]">{t.contactName || t.lastSenderName || 'Unknown'}</div>
                        <div className="text-[10px] text-gray-500">
                          {t.studentId ? `Student ${t.studentId.slice(0, 6)}` : t.leadId ? `Lead ${t.leadId.slice(0, 6)}` : 'Unlinked — POSSIBLE NEW CONTACT'}
                        </div>
                        {t.contactPhone && <div className="text-[10px] text-gray-400">{t.contactPhone}</div>}
                      </td>
                      {/* Application */}
                      <td className="px-2 py-2 text-[11px]">
                        {t.applicationId ? (
                          <>
                            <div className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-gray-400" /> {t.applicationId.slice(0, 6)}</div>
                            {t.applicationLabel && <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{t.applicationLabel}</div>}
                            {t.applicationStage && <div className="text-[10px] text-gray-400">Stage: {t.applicationStage}</div>}
                          </>
                        ) : <span className="text-gray-400">—</span>}
                        {t.partnerId && <div className="text-[10px] text-gray-500">Partner {t.partnerId.slice(0, 6)}</div>}
                      </td>
                      {/* Sender + message (§146 keeps the original channel visible) */}
                      <td className="px-2 py-2 max-w-[260px]">
                        <div className="text-[10px] text-gray-500">
                          {t.lastMessageDir === 'outbound' ? 'Staff → Student' : 'Student → Staff'} · {t.lastSenderName || t.contactName || 'unknown sender'}
                        </div>
                        <div className="text-[11px] text-gray-700 line-clamp-2" title={t.lastMessage}>{t.lastMessage || t.lastMessagePreview || '—'}</div>
                        {t.unreadCount > 0 && <Badge className="mt-1 text-[9px] bg-blue-600">{t.unreadCount} unread</Badge>}
                      </td>
                      {/* Assigned counselor */}
                      <td className="px-2 py-2 text-[11px]">{t.assignedToName || (t.assignedToId ? t.assignedToId.slice(0, 6) : <span className="text-amber-600">Unassigned</span>)}</td>
                      {/* Intent */}
                      <td className="px-2 py-2">
                        <Badge variant="outline" className="text-[10px] bg-gray-50">{(t.intent || 'general').replace(/_/g, ' ')}</Badge>
                      </td>
                      {/* Status */}
                      <td className="px-2 py-2">
                        <Badge className={`text-[10px] ${t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : t.status === 'escalated' ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>{t.status}</Badge>
                      </td>
                      {/* Last response (§150) */}
                      <td className="px-2 py-2 text-[11px] text-gray-600">
                        {t.firstResponseAt ? (
                          <>
                            <div>{new Date(t.firstResponseAt).toLocaleString('en-GB')}</div>
                            <div className="text-[10px] text-gray-400">
                              FRT {t.firstResponseMinutes != null ? `${t.firstResponseMinutes} min` : '—'}
                              {t.countsAsBreach ? ' · counted breach' : t.slaBreached ? ' · late (excluded)' : ' · within SLA'}
                            </div>
                          </>
                        ) : <span className="text-amber-600">No response yet</span>}
                      </td>
                      {/* Deadline */}
                      <td className="px-2 py-2 text-[11px] text-gray-600">
                        <div>{t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleString('en-GB') : '—'}</div>
                        <div className="text-[10px] text-gray-400">
                          due: {t.slaDueAt ? new Date(t.slaDueAt).toLocaleString('en-GB') : 'none'}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {t.slaCalendarTime ? 'calendar-time clock' : 'office-hours clock'}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => onAction('reply', t.id)}><Reply className="w-3 h-3 mr-1" />Reply</Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => onAction('assign', t.id)}><UserPlus className="w-3 h-3" />Assign</Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => onAction('create_task', t.id)}><Calendar className="w-3 h-3" /></Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => onAction('view', t.id)}><Eye className="w-3 h-3" /></Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => onAction('escalate', t.id)}><ArrowUpCircle className="w-3 h-3" /></Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => onAction('mark_resolved', t.id)}><CheckCircle2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
            <Badge variant="outline" className="bg-white">Reply</Badge> <span>Use template / AI draft reply</span>
            <Badge variant="outline" className="bg-white">Assign</Badge> <span>Assign to counselor</span>
            <Badge variant="outline" className="bg-white">Escalate</Badge> <span>Escalate to manager</span>
            <Badge variant="outline" className="bg-white">Create lead</Badge> <span>Link to student / application / create task / schedule follow-up / mark read / spam / archive / add note</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
