'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Users, Clock, AlertTriangle, ArrowRight, CheckCircle, MessageCircle,
  Phone, Mail, UserPlus, Plus, RotateCcw, Zap, TrendingUp, Target, Bell,
  Eye, ChevronRight, Filter, Search, XCircle, Bot, Send, Shield, Smartphone,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type Channel = 'whatsapp' | 'facebook' | 'instagram' | 'messenger' | 'email' | 'phone' | 'live_chat' | 'sms';
type Priority = 'high' | 'medium' | 'low';
type TransferReason = 'complex' | 'angry' | 'payment' | 'visa_refusal' | 'complaint' | 'emergency' | 'visa_complexity' | 'document_issue' | 'general';
type EscalationLevel = 'L1_employee' | 'L2_manager' | 'L3_ceo';

interface HandoffRequest {
  id: string;
  conversationId: string;
  channel: Channel;
  contactName: string;
  contactPhone: string;
  reason: TransferReason;
  transferredFrom: 'ai' | 'human';
  originalHandler: string;
  waitingTime: string;
  waitingMinutes: number;
  assignedTo: string;
  assignedRole: string;
  status: 'waiting' | 'accepted' | 'escalated' | 'resolved';
  priority: Priority;
  summary: string;
}

interface SlaEscalation {
  id: string;
  conversationId: string;
  contactName: string;
  channel: Channel;
  originalAssignee: string;
  escalationLevel: EscalationLevel;
  triggerTime: string;
  triggerMinutes: number;
  currentHandler: string;
  status: 'active' | 'resolved' | 'expired';
}

interface FollowUpSequence {
  id: string;
  name: string;
  trigger: string;
  steps: { type: Channel; action: string; delay: string; template: string }[];
  assignedTo: string;
  status: 'active' | 'paused' | 'draft';
  totalSent: number;
  responseRate: number;
  nextExecution: string;
  lastRun: string;
}

// ============================================================
// Mock Data
// ============================================================

const handoffRequests: HandoffRequest[] = [
  { id: 'HO-001', conversationId: 'CONV-WA-0891', channel: 'whatsapp', contactName: 'Rakibul Islam', contactPhone: '+880 1712-345678', reason: 'complex', transferredFrom: 'ai', originalHandler: 'WhatsApp AI Agent', waitingTime: '12 min', waitingMinutes: 12, assignedTo: 'Unassigned', assignedRole: '', status: 'waiting', priority: 'high', summary: 'Student asking about complex visa situation with previous refusal. Multiple questions about CAS validity and financial proof requirements.' },
  { id: 'HO-002', conversationId: 'CONV-FB-0234', channel: 'facebook', contactName: 'Fatima Begum', contactPhone: '+880 1812-987654', reason: 'payment', transferredFrom: 'ai', originalHandler: 'Comment AI Agent', waitingTime: '25 min', waitingMinutes: 25, assignedTo: 'Karim Uddin', assignedRole: 'Finance Team', status: 'waiting', priority: 'high', summary: 'Student asking about tuition fee payment methods and bKash/Nagad integration for deposit payment.' },
  { id: 'HO-003', conversationId: 'CONV-IG-0567', channel: 'instagram', contactName: 'Tasnim Akter', contactPhone: '+880 1612-567890', reason: 'angry', transferredFrom: 'human', originalHandler: 'Junior Counselor', waitingTime: '8 min', waitingMinutes: 8, assignedTo: 'Unassigned', assignedRole: '', status: 'waiting', priority: 'high', summary: 'Student is frustrated about delayed application processing. Third follow-up without response from assigned counselor.' },
  { id: 'HO-004', conversationId: 'CONV-WA-0892', channel: 'whatsapp', contactName: 'Md. Arifuzzaman', contactPhone: '+880 1912-234567', reason: 'visa_refusal', transferredFrom: 'ai', originalHandler: 'WhatsApp AI Agent', waitingTime: '5 min', waitingMinutes: 5, assignedTo: 'Unassigned', assignedRole: '', status: 'waiting', priority: 'medium', summary: 'Previous UK student visa refused. Student wants to understand refusal reasons and reapply strategy.' },
  { id: 'HO-005', conversationId: 'CONV-MS-0123', channel: 'messenger', contactName: 'Shahriar Hossain', contactPhone: '+880 1512-345670', reason: 'emergency', transferredFrom: 'ai', originalHandler: 'Messenger AI Agent', waitingTime: '2 min', waitingMinutes: 2, assignedTo: 'Unassigned', assignedRole: '', status: 'waiting', priority: 'high', summary: 'Student has visa interview tomorrow and needs emergency document preparation guidance.' },
  { id: 'HO-006', conversationId: 'CONV-WA-0893', channel: 'whatsapp', contactName: 'Nusrat Jahan', contactPhone: '+880 1712-876543', reason: 'complaint', transferredFrom: 'human', originalHandler: 'Front Desk', waitingTime: '35 min', waitingMinutes: 35, assignedTo: 'Rahim Ahmed', assignedRole: 'Branch Manager', status: 'escalated', priority: 'medium', summary: 'Complaining about poor communication and lack of updates on application status for 3 weeks.' },
  { id: 'HO-007', conversationId: 'CONV-IG-0568', channel: 'instagram', contactName: 'Imran Khan', contactPhone: '+880 1612-678901', reason: 'document_issue', transferredFrom: 'ai', originalHandler: 'Comment AI Agent', waitingTime: '18 min', waitingMinutes: 18, assignedTo: 'Unassigned', assignedRole: '', status: 'waiting', priority: 'medium', summary: 'Uploaded document through WhatsApp but type unclear. Needs manual verification and correct categorization.' },
];

const slaEscalations: SlaEscalation[] = [
  { id: 'SLA-001', conversationId: 'CONV-WA-0880', contactName: 'Tanvir Ahmed', channel: 'whatsapp', originalAssignee: 'Counselor: Rafiq', escalationLevel: 'L1_employee', triggerTime: '10 min ago', triggerMinutes: 10, currentHandler: 'Counselor: Rafiq', status: 'active' },
  { id: 'SLA-002', conversationId: 'CONV-FB-0220', contactName: 'Mitu Akter', channel: 'facebook', originalAssignee: 'Counselor: Sara', escalationLevel: 'L2_manager', triggerTime: '25 min ago', triggerMinutes: 25, currentHandler: 'Marketing Manager', status: 'active' },
  { id: 'SLA-003', conversationId: 'CONV-MS-0110', contactName: 'Sakib Hossain', channel: 'messenger', originalAssignee: 'Counselor: Karim', escalationLevel: 'L3_ceo', triggerTime: '55 min ago', triggerMinutes: 55, currentHandler: 'Super Admin / CEO', status: 'active' },
  { id: 'SLA-004', conversationId: 'CONV-WA-0875', contactName: 'Amira Rahman', channel: 'whatsapp', originalAssignee: 'Counselor: Nadia', escalationLevel: 'L1_employee', triggerTime: '5 min ago', triggerMinutes: 5, currentHandler: 'Counselor: Nadia', status: 'resolved' },
  { id: 'SLA-005', conversationId: 'CONV-IG-0550', contactName: 'Omar Faruk', channel: 'instagram', originalAssignee: 'Counselor: Tina', escalationLevel: 'L2_manager', triggerTime: '40 min ago', triggerMinutes: 40, currentHandler: 'Branch Manager', status: 'active' },
];

const followUpSequences: FollowUpSequence[] = [
  { id: 'SEQ-001', name: 'New Lead Welcome', trigger: 'New lead created from any channel', steps: [{ type: 'whatsapp', action: 'Send welcome message', delay: 'Instant', template: 'Welcome to ALO Education!' }, { type: 'email', action: 'Send info pack', delay: '1 hour', template: 'ALO Education Study Guide' }, { type: 'whatsapp', action: 'Schedule consultation', delay: '24 hours', template: 'Free Consultation Reminder' }], assignedTo: 'Auto', status: 'active', totalSent: 1245, responseRate: 42, nextExecution: 'Next new lead', lastRun: '15 min ago' },
  { id: 'SEQ-002', name: 'No Response Follow-up', trigger: 'No response in 48 hours', steps: [{ type: 'whatsapp', action: 'Follow-up message', delay: '48 hours', template: 'Still interested in studying abroad?' }, { type: 'email', action: 'Email follow-up', delay: '72 hours', template: 'Check our latest opportunities' }], assignedTo: 'Counselor', status: 'active', totalSent: 567, responseRate: 28, nextExecution: '3 pending triggers', lastRun: '2 hr ago' },
  { id: 'SEQ-003', name: 'Document Pending Reminder', trigger: 'Document pending for 3+ days', steps: [{ type: 'whatsapp', action: 'Document reminder', delay: '3 days', template: 'Documents needed for application' }, { type: 'sms', action: 'SMS reminder', delay: '5 days', template: 'Urgent: Documents required' }], assignedTo: 'Application Team', status: 'active', totalSent: 345, responseRate: 56, nextExecution: '8 pending triggers', lastRun: '1 hr ago' },
  { id: 'SEQ-004', name: 'Application Update Notification', trigger: 'Application stage changes', steps: [{ type: 'whatsapp', action: 'Stage update', delay: 'Instant', template: 'Your application status has been updated!' }, { type: 'email', action: 'Detailed update email', delay: '1 hour', template: 'Application Update Details' }], assignedTo: 'Auto', status: 'active', totalSent: 890, responseRate: 68, nextExecution: 'Next stage change', lastRun: '30 min ago' },
  { id: 'SEQ-005', name: 'Visa Interview Prep', trigger: '14 days before visa interview', steps: [{ type: 'whatsapp', action: 'Interview prep guide', delay: '14 days', template: 'Visa Interview Preparation' }, { type: 'email', action: 'Full prep checklist', delay: '7 days', template: 'Interview Checklist' }, { type: 'whatsapp', action: 'Day-before reminder', delay: '1 day', template: 'Interview Tomorrow!' }], assignedTo: 'Visa Officer', status: 'active', totalSent: 234, responseRate: 72, nextExecution: '2 pending', lastRun: '1 day ago' },
  { id: 'SEQ-006', name: 'Scholarship Deadline Alert', trigger: '7 days before scholarship deadline', steps: [{ type: 'email', action: 'Deadline alert', delay: '7 days', template: 'Scholarship Deadline Approaching' }, { type: 'whatsapp', action: 'Final reminder', delay: '2 days', template: 'Last Chance to Apply!' }], assignedTo: 'Auto', status: 'paused', totalSent: 156, responseRate: 45, nextExecution: 'Paused', lastRun: '3 days ago' },
];

const channelConfig: Record<Channel, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  whatsapp: { label: 'WhatsApp', color: 'text-green-600', bg: 'bg-green-600', icon: MessageCircle },
  facebook: { label: 'Facebook', color: 'text-blue-600', bg: 'bg-blue-600', icon: MessageCircle },
  instagram: { label: 'Instagram', color: 'text-pink-500', bg: 'bg-pink-500', icon: MessageCircle },
  messenger: { label: 'Messenger', color: 'text-purple-600', bg: 'bg-purple-600', icon: MessageCircle },
  email: { label: 'Email', color: 'text-gray-600', bg: 'bg-gray-600', icon: Mail },
  phone: { label: 'Phone', color: 'text-indigo-600', bg: 'bg-indigo-600', icon: Phone },
  live_chat: { label: 'Live Chat', color: 'text-teal-600', bg: 'bg-teal-600', icon: MessageCircle },
  sms: { label: 'SMS', color: 'text-amber-600', bg: 'bg-amber-600', icon: Smartphone },
};

const reasonLabels: Record<TransferReason, string> = {
  complex: 'Complex Query', angry: 'Angry/Upset', payment: 'Payment Issue',
  visa_refusal: 'Visa Refusal', complaint: 'Complaint', emergency: 'Emergency',
  visa_complexity: 'Visa Complexity', document_issue: 'Document Issue', general: 'General',
};

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: 'text-red-600', bg: 'bg-red-100' },
  medium: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  low: { label: 'Low', color: 'text-blue-600', bg: 'bg-blue-100' },
};

// ============================================================
// Component
// ============================================================

export default function HumanHandoffView() {
  const [activeTab, setActiveTab] = useState('handoff');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const waitingHandoffs = handoffRequests.filter(h => h.status === 'waiting' || h.status === 'escalated');
  const filteredHandoffs = handoffRequests.filter(h => filterStatus === 'all' || h.status === filterStatus);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Human Handoff & Follow-up</h1>
          <p className="text-sm text-gray-500">Manage AI-to-human transfers, follow-up automation, and SLA escalations</p>
        </div>
        <div className="flex items-center gap-2">
          {waitingHandoffs.length > 0 && (
            <Badge className="text-[11px] bg-red-100 text-red-700 border-red-200 animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />{waitingHandoffs.length} Waiting
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
              <span className="text-[10px] text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded">Urgent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{handoffRequests.filter(h => h.status === 'waiting' && h.priority === 'high').length}</p>
            <p className="text-xs text-gray-500">Waiting High Priority</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-4">
            <div className="p-2 bg-orange-100 rounded-lg"><Users className="w-4 h-4 text-orange-600" /></div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{handoffRequests.length}</p>
            <p className="text-xs text-gray-500">Total Handoffs Today</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-4">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-4 h-4 text-green-600" /></div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{slaEscalations.filter(s => s.status === 'resolved').length}</p>
            <p className="text-xs text-gray-500">Resolved Escalations</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-4">
            <div className="p-2 bg-blue-100 rounded-lg"><Zap className="w-4 h-4 text-blue-600" /></div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{followUpSequences.filter(s => s.status === 'active').length}</p>
            <p className="text-xs text-gray-500">Active Sequences</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-100">
          <TabsTrigger value="handoff"><Users className="w-4 h-4 mr-1" />Handoff Queue</TabsTrigger>
          <TabsTrigger value="followup"><Zap className="w-4 h-4 mr-1" />Follow-up Automation</TabsTrigger>
          <TabsTrigger value="sla"><Clock className="w-4 h-4 mr-1" />SLA Escalations</TabsTrigger>
        </TabsList>

        {/* Handoff Queue */}
        <TabsContent value="handoff">
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-400">{filteredHandoffs.length} requests</span>
            </div>

            <div className="space-y-3">
              {filteredHandoffs.map(h => {
                const chConfig = channelConfig[h.channel];
                const ChIcon = chConfig.icon;
                const pri = priorityConfig[h.priority];
                return (
                  <Card key={h.id} className={`bg-white border ${h.status === 'waiting' && h.priority === 'high' ? 'border-red-200' : h.status === 'escalated' ? 'border-orange-200' : 'border-gray-100'}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        {/* Left: Channel + Priority */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`w-8 h-8 rounded-lg ${chConfig.bg} flex items-center justify-center`}>
                            <ChIcon className="w-4 h-4 text-white" />
                          </div>
                          <Badge className={`text-[10px] ${pri.bg} ${pri.color} border-0`}>{pri.label}</Badge>
                        </div>

                        {/* Center: Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">{h.contactName}</span>
                            <span className="text-[10px] text-gray-400">{h.contactPhone}</span>
                            <Badge variant="outline" className="text-[9px]">{reasonLabels[h.reason]}</Badge>
                            <Badge className={`text-[9px] ${h.transferredFrom === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              <Bot className="w-2.5 h-2.5 mr-0.5" />{h.transferredFrom === 'ai' ? 'AI Transfer' : 'Human Transfer'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{h.summary}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-gray-400">Conversation: {h.conversationId}</span>
                            <span className="text-[10px] text-gray-400">From: {h.originalHandler}</span>
                            <span className={`text-[10px] font-medium ${h.waitingMinutes > 30 ? 'text-red-500' : h.waitingMinutes > 15 ? 'text-orange-500' : 'text-gray-500'}`}>
                              <Clock className="w-3 h-3 inline mr-0.5" />Waiting {h.waitingTime}
                            </span>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {h.status === 'waiting' && (
                            <>
                              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />Accept
                              </Button>
                              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-7 text-xs">
                                <Eye className="w-3 h-3 mr-1" />View
                              </Button>
                              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="h-7 text-xs text-orange-600">
                                <ArrowRight className="w-3 h-3 mr-1" />Escalate
                              </Button>
                            </>
                          )}
                          {h.status === 'escalated' && (
                            <Badge className="text-[10px] bg-orange-100 text-orange-700">Escalated to {h.assignedTo}</Badge>
                          )}
                          {h.status === 'resolved' && (
                            <Badge className="text-[10px] bg-green-100 text-green-700">Resolved</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Follow-up Automation */}
        <TabsContent value="followup">
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{followUpSequences.length} sequences configured</p>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="bg-orange-500 hover:bg-orange-600"><Plus className="w-3.5 h-3.5 mr-1" />New Sequence</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {followUpSequences.map(seq => (
                <Card key={seq.id} className="bg-white border border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{seq.name}</p>
                        <p className="text-[11px] text-gray-500">Trigger: {seq.trigger}</p>
                      </div>
                      <Badge className={`text-[10px] ${seq.status === 'active' ? 'bg-green-100 text-green-700' : seq.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {seq.status}
                      </Badge>
                    </div>

                    {/* Steps */}
                    <div className="flex items-center gap-2 mb-3">
                      {seq.steps.map((step, i) => {
                        const chConfig = channelConfig[step.type] || channelConfig.whatsapp;
                        return (
                          <div key={i} className="flex items-center gap-1">
                            <div className="px-2 py-1.5 rounded bg-gray-50 border border-gray-100">
                              <div className="flex items-center gap-1">
                                <span className={`w-3 h-3 rounded-sm ${chConfig.bg}`} />
                                <span className="text-[10px] font-medium text-gray-600">{step.action}</span>
                              </div>
                              <p className="text-[9px] text-gray-400 mt-0.5">{step.delay}</p>
                            </div>
                            {i < seq.steps.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500">Assigned: <strong>{seq.assignedTo}</strong></span>
                        <span className="text-[10px] text-gray-500">{seq.totalSent} sent</span>
                        <span className="text-[10px] text-green-600 font-medium">{seq.responseRate}% response</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">Next: {seq.nextExecution}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* SLA Escalations */}
        <TabsContent value="sla">
          <div className="mt-4 space-y-4">
            {/* SLA Rules Display */}
            <Card className="bg-gradient-to-r from-blue-50 to-orange-50 border border-blue-100">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">SLA Escalation Chain</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Level 1</p>
                    <p className="text-xs font-semibold text-gray-900">Employee / Counselor</p>
                    <p className="text-[10px] text-gray-500">Respond within <strong className="text-orange-600">40 minutes</strong></p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="px-3 py-2 rounded-lg bg-white border border-orange-200 shadow-sm">
                    <p className="text-[10px] font-bold text-orange-500 uppercase">Level 2</p>
                    <p className="text-xs font-semibold text-gray-900">Marketing / Branch Manager</p>
                    <p className="text-[10px] text-gray-500">Escalate after <strong className="text-orange-600">20 minutes</strong></p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="px-3 py-2 rounded-lg bg-white border border-red-200 shadow-sm">
                    <p className="text-[10px] font-bold text-red-500 uppercase">Level 3</p>
                    <p className="text-xs font-semibold text-gray-900">Super Admin / CEO</p>
                    <p className="text-[10px] text-gray-500">Escalate after <strong className="text-red-600">10 minutes</strong></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Escalations */}
            <Card className="bg-white border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Active & Recent Escalations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Conversation</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Contact</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Channel</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Original Assignee</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Level</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Current Handler</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Trigger</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slaEscalations.map(sla => {
                        const chConfig = channelConfig[sla.channel];
                        const levelColor = sla.escalationLevel === 'L1_employee' ? 'bg-blue-100 text-blue-700' : sla.escalationLevel === 'L2_manager' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
                        return (
                          <tr key={sla.id} className={`border-b border-gray-50 ${sla.status === 'active' && sla.escalationLevel === 'L3_ceo' ? 'bg-red-50' : ''}`}>
                            <td className="py-2.5 text-xs font-mono text-gray-700">{sla.conversationId}</td>
                            <td className="py-2.5 text-xs font-medium text-gray-900">{sla.contactName}</td>
                            <td className="py-2.5">
                              <Badge variant="outline" className="text-[9px]">{chConfig.label}</Badge>
                            </td>
                            <td className="py-2.5 text-xs text-gray-600">{sla.originalAssignee}</td>
                            <td className="py-2.5">
                              <Badge className={`text-[9px] ${levelColor}`}>{sla.escalationLevel.replace('L1_', 'L1 ').replace('L2_', 'L2 ').replace('L3_', 'L3 ')}</Badge>
                            </td>
                            <td className="py-2.5 text-xs text-gray-700">{sla.currentHandler}</td>
                            <td className="py-2.5 text-[10px] text-gray-500">{sla.triggerTime}</td>
                            <td className="py-2.5">
                              <Badge className={`text-[9px] ${sla.status === 'active' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {sla.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* SLA Compliance */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="bg-white border border-gray-100">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">94.2%</p>
                  <p className="text-xs text-gray-500">First Response SLA</p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-100">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">87.3%</p>
                  <p className="text-xs text-gray-500">Resolution SLA</p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-100">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">6.8%</p>
                  <p className="text-xs text-gray-500">Escalation Rate</p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-100">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">4.6/5</p>
                  <p className="text-xs text-gray-500">Satisfaction Score</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
