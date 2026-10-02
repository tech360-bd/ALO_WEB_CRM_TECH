'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Mail, MessageSquare, Phone, Send, Clock, CheckCircle,
  AlertCircle, Search, Plus, Copy, Edit, Trash2, FileText,
  Calendar, Users, BarChart3, Zap, MoreVertical, Filter,
  MailCheck, MailX, MailWarning, MessageCircle, Megaphone,
  Eye, Download, ChevronDown, X, Check,
} from 'lucide-react';

type CommChannel = 'email' | 'sms' | 'whatsapp';
type CommStatus = 'Sent' | 'Delivered' | 'Failed';

interface CommHistoryItem {
  id: string;
  channel: CommChannel;
  recipient: string;
  recipientPhone?: string;
  subject?: string;
  message: string;
  template: string;
  status: CommStatus;
  sentAt: string;
  openedAt?: string;
}

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  channel: CommChannel;
  content: string;
  usageCount: number;
  lastUsed: string;
}

const commStatusColors: Record<CommStatus, string> = {
  Sent: 'bg-blue-100 text-blue-700',
  Delivered: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
};

const commStatusIcons: Record<CommStatus, React.ElementType> = {
  Sent: MailCheck,
  Delivered: CheckCircle,
  Failed: MailX,
};

const channelIcons: Record<CommChannel, React.ElementType> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageCircle,
};

const channelColors: Record<CommChannel, string> = {
  email: 'bg-blue-100 text-blue-700',
  sms: 'bg-purple-100 text-purple-700',
  whatsapp: 'bg-green-100 text-green-700',
};

const defaultEmailHistory: CommHistoryItem[] = [
  { id: 'E-001', channel: 'email', recipient: 'Arif Rahman', subject: 'Application Status Update', message: 'Your application to University of Manchester has been received and is being processed.', template: 'Application Status', status: 'Delivered', sentAt: '2025-06-28T09:30:00', openedAt: '2025-06-28T10:15:00' },
  { id: 'E-002', channel: 'email', recipient: 'Fatima Begum', subject: 'Document Submission Reminder', message: 'Please submit your remaining documents by June 30 to avoid delays.', template: 'Document Reminder', status: 'Sent', sentAt: '2025-06-28T08:00:00' },
  { id: 'E-003', channel: 'email', recipient: 'Sakib Hossain', subject: 'Scholarship Application Confirmation', message: 'Your scholarship application for University of Edinburgh has been submitted.', template: 'Scholarship Confirmation', status: 'Delivered', sentAt: '2025-06-27T14:00:00', openedAt: '2025-06-27T15:30:00' },
  { id: 'E-004', channel: 'email', recipient: 'Tanvir Ahmed', subject: 'Visa Guidance Document', message: 'Attached is the UK student visa application guide for your reference.', template: 'Visa Guide', status: 'Failed', sentAt: '2025-06-27T11:00:00' },
  { id: 'E-005', channel: 'email', recipient: 'Nusrat Jahan', subject: 'Offer Letter from University of Leeds', message: 'Congratulations! You have received an offer from University of Leeds.', template: 'Offer Notification', status: 'Delivered', sentAt: '2025-06-26T16:00:00', openedAt: '2025-06-26T16:45:00' },
  { id: 'E-006', channel: 'email', recipient: 'Imran Khan', subject: 'Payment Receipt Confirmation', message: 'Your tuition deposit payment of £2,000 has been confirmed.', template: 'Payment Confirmation', status: 'Sent', sentAt: '2025-06-26T10:30:00' },
  { id: 'E-007', channel: 'email', recipient: 'Mitu Sarkar', subject: 'Course Change Request Update', message: 'Your request to change courses has been forwarded to the university.', template: 'General Update', status: 'Delivered', sentAt: '2025-06-25T13:00:00' },
  { id: 'E-008', channel: 'email', recipient: 'Priya Das', subject: 'IELTS Test Date Reminder', message: 'Reminder: Your IELTS test is scheduled for July 5 at British Council Dhaka.', template: 'Reminder', status: 'Failed', sentAt: '2025-06-25T09:00:00' },
];

const defaultSmsHistory: CommHistoryItem[] = [
  { id: 'S-001', channel: 'sms', recipient: 'Arif Rahman', recipientPhone: '+880 1712-345678', message: 'ALO Education: Your counselling session is tomorrow at 2 PM. Bring your documents.', template: 'Appointment Reminder', status: 'Delivered', sentAt: '2025-06-28T10:00:00' },
  { id: 'S-002', channel: 'sms', recipient: 'Fatima Begum', recipientPhone: '+880 1812-987654', message: 'ALO Education: Your visa biometric appointment is confirmed for July 2 at 10 AM.', template: 'Visa Appointment', status: 'Delivered', sentAt: '2025-06-27T15:00:00' },
  { id: 'S-003', channel: 'sms', recipient: 'Sakib Hossain', recipientPhone: '+880 1612-567890', message: 'ALO Education: Documents verified successfully. Next step: submit your application.', template: 'Status Update', status: 'Sent', sentAt: '2025-06-27T11:00:00' },
  { id: 'S-004', channel: 'sms', recipient: 'Tanvir Ahmed', recipientPhone: '+880 1912-234567', message: 'ALO Education: University fair on July 15 at Pan Pacific Sonargaon. Register now!', template: 'Event Invitation', status: 'Failed', sentAt: '2025-06-26T14:00:00' },
  { id: 'S-005', channel: 'sms', recipient: 'Nusrat Jahan', recipientPhone: '+880 1512-345670', message: 'ALO Education: Scholarship deadline approaching. Submit by June 30.', template: 'Deadline Reminder', status: 'Delivered', sentAt: '2025-06-26T09:00:00' },
];

const defaultWaHistory: CommHistoryItem[] = [
  { id: 'W-001', channel: 'whatsapp', recipient: 'Arif Rahman', recipientPhone: '+880 1712-345678', message: 'Your application is being processed. We will notify you once we receive an update.', template: 'Application Processing', status: 'Delivered', sentAt: '2025-06-28T10:45:00' },
  { id: 'W-002', channel: 'whatsapp', recipient: 'Fatima Begum', recipientPhone: '+880 1812-987654', message: 'Please bring the following documents: passport, transcripts, IELTS certificate, financial documents.', template: 'Document Request', status: 'Sent', sentAt: '2025-06-28T09:00:00' },
  { id: 'W-003', channel: 'whatsapp', recipient: 'Sakib Hossain', recipientPhone: '+880 1612-567890', message: 'Your interview has been scheduled. Come to ALO Education Dhaka office on July 1 at 11 AM.', template: 'Interview Scheduled', status: 'Delivered', sentAt: '2025-06-27T16:00:00' },
  { id: 'W-004', channel: 'whatsapp', recipient: 'Tanvir Ahmed', recipientPhone: '+880 1912-234567', message: 'For your visa application, ensure you have: CAS letter, financial proof, TB test certificate.', template: 'Visa Guidance', status: 'Delivered', sentAt: '2025-06-27T12:00:00' },
  { id: 'W-005', channel: 'whatsapp', recipient: 'Nusrat Jahan', recipientPhone: '+880 1512-345670', message: 'Congratulations! You have received an offer from the university. Review the conditions.', template: 'Offer Received', status: 'Failed', sentAt: '2025-06-26T18:00:00' },
];

const defaultTemplates: TemplateItem[] = [
  { id: 'TPL-001', name: 'Application Status', category: 'Application', channel: 'email', content: 'Dear {name}, your application to {university} for the {program} has been {status}. We will keep you updated on the progress.', usageCount: 234, lastUsed: '2025-06-28' },
  { id: 'TPL-002', name: 'Document Reminder', category: 'Documents', channel: 'email', content: 'Dear {name}, this is a reminder to submit your {document_type} by {deadline}. Please visit our office or upload online.', usageCount: 156, lastUsed: '2025-06-28' },
  { id: 'TPL-003', name: 'Visa Guide', category: 'Visa', channel: 'email', content: 'Dear {name}, attached is the UK student visa application guide. Key requirements: passport, CAS letter, financial proof, TB certificate.', usageCount: 89, lastUsed: '2025-06-27' },
  { id: 'TPL-004', name: 'Offer Notification', category: 'Application', channel: 'email', content: 'Congratulations {name}! You have received an offer from {university} for {program}. Please review the conditions and respond by {deadline}.', usageCount: 198, lastUsed: '2025-06-26' },
  { id: 'TPL-005', name: 'Appointment Reminder', category: 'General', channel: 'sms', content: 'ALO Education: Your {appointment_type} is on {date} at {time}. Bring your documents.', usageCount: 312, lastUsed: '2025-06-28' },
  { id: 'TPL-006', name: 'Visa Appointment', category: 'Visa', channel: 'sms', content: 'ALO Education: Your visa biometric appointment is confirmed for {date} at {time}. Bring passport and CAS.', usageCount: 145, lastUsed: '2025-06-27' },
  { id: 'TPL-007', name: 'Application Processing', category: 'Application', channel: 'whatsapp', content: 'Your application is being processed. We will notify you once we receive an update from the university.', usageCount: 267, lastUsed: '2025-06-28' },
  { id: 'TPL-008', name: 'Document Request', category: 'Documents', channel: 'whatsapp', content: 'Please bring the following documents to our office: passport, transcripts, IELTS certificate, financial documents.', usageCount: 189, lastUsed: '2025-06-28' },
  { id: 'TPL-009', name: 'Interview Scheduled', category: 'General', channel: 'whatsapp', content: 'Your interview has been scheduled. Come to ALO Education Dhaka office on {date} at {time}. Bring all original documents.', usageCount: 134, lastUsed: '2025-06-27' },
  { id: 'TPL-010', name: 'Payment Confirmation', category: 'Finance', channel: 'email', content: 'Dear {name}, your payment of £{amount} for {description} has been confirmed. Transaction ID: {transaction_id}.', usageCount: 178, lastUsed: '2025-06-26' },
];

const channelStats: Record<CommChannel, { sent: number; delivered: number; failed: number }> = {
  email: { sent: 2, delivered: 4, failed: 2 },
  sms: { sent: 1, delivered: 3, failed: 1 },
  whatsapp: { sent: 1, delivered: 3, failed: 1 },
};

const allStudents = [
  'Arif Rahman', 'Fatima Begum', 'Sakib Hossain', 'Tanvir Ahmed',
  'Nusrat Jahan', 'Imran Khan', 'Mitu Sarkar', 'Priya Das',
  'Sharmin Akter', 'Rakib Islam',
];

function getChannelHistory(channel: CommChannel): CommHistoryItem[] {
  if (channel === 'email') return defaultEmailHistory;
  if (channel === 'sms') return defaultSmsHistory;
  return defaultWaHistory;
}

export default function CrmCommunicationsPage() {
  const [activeChannel, setActiveChannel] = useState<CommChannel>('email');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlast, setShowBlast] = useState(false);
  const [blastChannel, setBlastChannel] = useState<CommChannel>('email');
  const [blastRecipients, setBlastRecipients] = useState<string[]>([]);
  const [blastSubject, setBlastSubject] = useState('');
  const [blastMessage, setBlastMessage] = useState('');
  const [blastSchedule, setBlastSchedule] = useState(false);
  const [blastScheduleDate, setBlastScheduleDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const history = getChannelHistory(activeChannel);
  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.recipient.toLowerCase().includes(q) || (item.subject || '').toLowerCase().includes(q) || item.message.toLowerCase().includes(q);
  });

  const stats = channelStats[activeChannel];
  const totalSent = stats.sent + stats.delivered + stats.failed;

  const filteredTemplates = defaultTemplates.filter(t => {
    if (showAllTemplates) return true;
    return t.channel === activeChannel;
  });

  const handleToggleRecipient = (student: string) => {
    setBlastRecipients(prev =>
      prev.includes(student) ? prev.filter(s => s !== student) : [...prev, student]
    );
  };

  const handleSelectAll = () => {
    if (blastRecipients.length === allStudents.length) {
      setBlastRecipients([]);
    } else {
      setBlastRecipients([...allStudents]);
    }
  };

  const handleSendBlast = () => {
    if (!blastMessage.trim() || blastRecipients.length === 0) return;
    setShowBlast(false);
    setBlastRecipients([]);
    setBlastSubject('');
    setBlastMessage('');
    setBlastSchedule(false);
    setBlastScheduleDate('');
    setSelectedTemplate('');
  };

  const handleApplyTemplate = (template: TemplateItem) => {
    setSelectedTemplate(template.id);
    if (template.channel === 'email' && !blastSubject) {
      setBlastSubject(`[${template.name}]`);
    }
    setBlastMessage(template.content);
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600 rounded-lg">
            <Megaphone className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Communications</h1>
            <p className="text-sm text-gray-500">Email, SMS & WhatsApp Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAllTemplates(!showAllTemplates)}>
            <FileText className="h-4 w-4 mr-1" />
            Templates
          </Button>
          <Button size="sm" onClick={() => setShowBlast(true)} className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4 mr-1" />
            Blast Message
          </Button>
        </div>
      </div>

      {/* Channel Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${channelColors.email}`}><Mail className="h-4 w-4" /></div>
            <div>
              <p className="text-lg font-bold text-gray-900">{channelStats.email.sent + channelStats.email.delivered + channelStats.email.failed}</p>
              <p className="text-xs text-gray-500">Emails Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${channelColors.sms}`}><MessageSquare className="h-4 w-4" /></div>
            <div>
              <p className="text-lg font-bold text-gray-900">{channelStats.sms.sent + channelStats.sms.delivered + channelStats.sms.failed}</p>
              <p className="text-xs text-gray-500">SMS Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${channelColors.whatsapp}`}><MessageCircle className="h-4 w-4" /></div>
            <div>
              <p className="text-lg font-bold text-gray-900">{channelStats.whatsapp.sent + channelStats.whatsapp.delivered + channelStats.whatsapp.failed}</p>
              <p className="text-xs text-gray-500">WhatsApp Sent</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Tabs */}
      <Tabs value={activeChannel} onValueChange={v => setActiveChannel(v as CommChannel)}>
        <div className="flex items-center gap-3">
          <TabsList>
            <TabsTrigger value="email" className="text-xs gap-1"><Mail className="h-3 w-3" />Email</TabsTrigger>
            <TabsTrigger value="sms" className="text-xs gap-1"><MessageSquare className="h-3 w-3" />SMS</TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs gap-1"><MessageCircle className="h-3 w-3" />WhatsApp</TabsTrigger>
          </TabsList>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search history..." className="pl-9 h-8 text-xs" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary">{totalSent} total</Badge>
            <Badge className="bg-green-100 text-green-700">{stats.delivered} delivered</Badge>
            <Badge className="bg-red-100 text-red-700">{stats.failed} failed</Badge>
          </div>
        </div>

        {/* History Table */}
        <Card className="shadow-sm mt-3">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Recipient</th>
                    {activeChannel === 'email' && <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Subject</th>}
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Message</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Template</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Sent At</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(item => {
                    const StatusIcon = commStatusIcons[item.status];
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.recipient}</p>
                            {item.recipientPhone && <p className="text-xs text-gray-400">{item.recipientPhone}</p>}
                          </div>
                        </td>
                        {activeChannel === 'email' && (
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{item.subject}</td>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[250px] truncate">{item.message}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{item.template}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] ${commStatusColors[item.status]}`}>
                            <StatusIcon className="h-3 w-3 mr-0.5" />
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatTime(item.sentAt)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-7 w-7"><Copy className="h-3 w-3" /></Button>
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3 w-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      {/* Templates Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-sm font-semibold">
                Templates {showAllTemplates ? '(All Channels)' : `(${activeChannel})`}
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowAllTemplates(!showAllTemplates)}>
              {showAllTemplates ? 'Show Current Channel' : 'Show All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTemplates.slice(0, 6).map(tpl => (
              <div key={tpl.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${channelColors[tpl.channel]}`}>{tpl.channel}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{tpl.category}</Badge>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{tpl.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{tpl.content}</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>Used {tpl.usageCount} times</span>
                  <span>Last: {tpl.lastUsed}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blast Message Modal */}
      {showBlast && (
        <Card className="shadow-lg border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-orange-500" />
                Blast Message
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowBlast(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Channel Select */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Channel</label>
              <div className="flex gap-2">
                {(['email', 'sms', 'whatsapp'] as CommChannel[]).map(ch => {
                  const Icon = channelIcons[ch];
                  return (
                    <button
                      key={ch}
                      onClick={() => setBlastChannel(ch)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors capitalize ${blastChannel === ch ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                    >
                      <Icon className="h-4 w-4" />
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-600">Recipients ({blastRecipients.length} selected)</label>
                <Button variant="ghost" size="sm" className="text-xs" onClick={handleSelectAll}>
                  {blastRecipients.length === allStudents.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-32 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                {allStudents.map(student => (
                  <button
                    key={student}
                    onClick={() => handleToggleRecipient(student)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs border transition-colors ${blastRecipients.includes(student) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${blastRecipients.includes(student) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {blastRecipients.includes(student) && <Check className="h-2.5 w-2.5 text-white" />}
                    </span>
                    {student}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject (email only) */}
            {blastChannel === 'email' && (
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Subject</label>
                <Input value={blastSubject} onChange={e => setBlastSubject(e.target.value)} placeholder="Message subject" />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Message</label>
              <Textarea value={blastMessage} onChange={e => setBlastMessage(e.target.value)} placeholder="Write your message..." rows={4} className="resize-y" />
            </div>

            {/* Quick Template Apply */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Quick Apply Template</label>
              <div className="flex flex-wrap gap-2">
                {filteredTemplates.filter(t => t.channel === blastChannel).slice(0, 4).map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl)}
                    className={`px-2 py-1 rounded border text-xs transition-colors ${selectedTemplate === tpl.id ? 'bg-orange-50 border-orange-400 text-orange-700' : 'hover:bg-gray-50'}`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={blastSchedule} onChange={e => setBlastSchedule(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-600">Schedule for later</span>
              </label>
              {blastSchedule && (
                <Input type="datetime-local" value={blastScheduleDate} onChange={e => setBlastScheduleDate(e.target.value)} className="w-48 text-sm" />
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowBlast(false)}>Cancel</Button>
              <Button onClick={handleSendBlast} className="bg-blue-600 hover:bg-blue-700" disabled={blastRecipients.length === 0 || !blastMessage.trim()}>
                <Send className="h-4 w-4 mr-1" />
                {blastSchedule ? 'Schedule' : 'Send Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
