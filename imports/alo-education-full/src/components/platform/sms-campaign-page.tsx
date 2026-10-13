'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, MessageSquare, Users, CheckCircle2, Clock,
  XCircle, AlertCircle, Plus, Search, BarChart3, TrendingUp,
  Eye, Trash2, Edit3, Copy, Filter, Phone, Calendar,
  ChevronDown, FileText, Zap, RefreshCw, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell,
} from 'recharts';

/* ─── Brand Colors ─── */
const ALO_BLUE = '#0052B8';
const ALO_ORANGE = '#E8501A';

/* ─── Types ─── */
interface SmsCampaignPageProps {
  onBack: () => void;
}

interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
  variables?: string | null;
  usageCount: number;
}

interface SmsCampaign {
  id: string;
  name: string;
  templateName: string;
  recipientCount: number;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'COMPLETED' | 'FAILED';
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  scheduledAt?: string;
  createdAt: string;
}

interface SmsMessage {
  id: string;
  to: string;
  body: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
  category: string;
  createdAt: string;
  recipientName?: string;
}

interface OptOutEntry {
  id: string;
  phone: string;
  reason: string;
  optedOutAt: string;
}

/* ─── Constants ─── */
const TEMPLATES: SmsTemplate[] = [
  { id: '1', name: 'Welcome Message', category: 'TRANSACTIONAL', body: 'Welcome to ALO Education, {{name}}! Your journey to studying abroad starts here. Contact us at +880-xxx-xxxx.', variables: '["name"]', usageCount: 245 },
  { id: '2', name: 'Follow-Up Reminder', category: 'NOTIFICATION', body: 'Hi {{name}}, this is a reminder about your upcoming consultation on {{date}}. Reply YES to confirm or call us to reschedule.', variables: '["name","date"]', usageCount: 180 },
  { id: '3', name: 'Deadline Alert', category: 'ALERT', body: 'URGENT: {{name}}, the application deadline for {{university}} is {{deadline}}. Submit your documents ASAP to avoid missing out!', variables: '["name","university","deadline"]', usageCount: 312 },
  { id: '4', name: 'Appointment Confirmation', category: 'TRANSACTIONAL', body: 'Your appointment with ALO Education is confirmed for {{date}} at {{time}}. Location: {{location}}. See you there!', variables: '["date","time","location"]', usageCount: 156 },
  { id: '5', name: 'Document Request', category: 'NOTIFICATION', body: 'Hi {{name}}, we still need the following documents: {{documents}}. Please upload them at aloeducation.com/upload or visit our office.', variables: '["name","documents"]', usageCount: 98 },
  { id: '6', name: 'Visa Update', category: 'ALERT', body: 'Good news {{name}}! Your visa application status has been updated to: {{status}}. Check your portal for details.', variables: '["name","status"]', usageCount: 67 },
];

const MOCK_CAMPAIGNS: SmsCampaign[] = [
  { id: '1', name: 'UK Intake Sep 2025', templateName: 'Deadline Alert', recipientCount: 320, status: 'COMPLETED', sentCount: 320, deliveredCount: 298, failedCount: 22, createdAt: '2025-01-15' },
  { id: '2', name: 'Follow-Up Week 12', templateName: 'Follow-Up Reminder', recipientCount: 150, status: 'COMPLETED', sentCount: 150, deliveredCount: 142, failedCount: 8, createdAt: '2025-01-20' },
  { id: '3', name: 'New Lead Welcome', templateName: 'Welcome Message', recipientCount: 85, status: 'SENDING', sentCount: 62, deliveredCount: 55, failedCount: 3, createdAt: '2025-01-25' },
  { id: '4', name: 'Document Collection Drive', templateName: 'Document Request', recipientCount: 200, status: 'SCHEDULED', sentCount: 0, deliveredCount: 0, failedCount: 0, scheduledAt: '2025-02-01', createdAt: '2025-01-27' },
  { id: '5', name: 'Visa Status Updates', templateName: 'Visa Update', recipientCount: 45, status: 'DRAFT', sentCount: 0, deliveredCount: 0, failedCount: 0, createdAt: '2025-01-28' },
];

const MOCK_MESSAGES: SmsMessage[] = [
  { id: '1', to: '+880171234567', body: 'Welcome to ALO Education, Rahim! Your journey starts here.', status: 'DELIVERED', category: 'TRANSACTIONAL', createdAt: '2025-01-28T10:30:00Z', recipientName: 'Rahim Uddin' },
  { id: '2', to: '+880189876543', body: 'Hi Sara, reminder about consultation on Feb 5.', status: 'DELIVERED', category: 'NOTIFICATION', createdAt: '2025-01-28T10:31:00Z', recipientName: 'Sara Ahmed' },
  { id: '3', to: '+880151234567', body: 'URGENT: Application deadline for UCL is March 1.', status: 'SENT', category: 'ALERT', createdAt: '2025-01-28T10:32:00Z', recipientName: 'Karim Hossain' },
  { id: '4', to: '+880167890123', body: 'Welcome to ALO Education, Nusrat!', status: 'FAILED', category: 'TRANSACTIONAL', createdAt: '2025-01-28T10:33:00Z', recipientName: 'Nusrat Jahan' },
  { id: '5', to: '+880134567890', body: 'We need your passport copy and academic transcripts.', status: 'QUEUED', category: 'NOTIFICATION', createdAt: '2025-01-28T10:34:00Z', recipientName: 'Imran Khan' },
  { id: '6', to: '+880175678901', body: 'Your visa status: APPROVED. Check portal.', status: 'DELIVERED', category: 'ALERT', createdAt: '2025-01-28T10:35:00Z', recipientName: 'Fatima Begum' },
];

const MOCK_OPTOUTS: OptOutEntry[] = [
  { id: '1', phone: '+880169999001', reason: 'STOP', optedOutAt: '2025-01-20T14:00:00Z' },
  { id: '2', phone: '+880189999002', reason: 'Unsubscribe link', optedOutAt: '2025-01-22T09:15:00Z' },
  { id: '3', phone: '+880159999003', reason: 'STOP', optedOutAt: '2025-01-25T11:30:00Z' },
];

const DELIVERY_DATA = [
  { month: 'Sep', sent: 420, delivered: 398, failed: 22 },
  { month: 'Oct', sent: 580, delivered: 548, failed: 32 },
  { month: 'Nov', sent: 650, delivered: 618, failed: 32 },
  { month: 'Dec', sent: 720, delivered: 685, failed: 35 },
  { month: 'Jan', sent: 890, delivered: 845, failed: 45 },
  { month: 'Feb', sent: 520, delivered: 492, failed: 28 },
];

const CATEGORY_DATA = [
  { name: 'Transactional', value: 45, color: ALO_BLUE },
  { name: 'Notification', value: 30, color: '#10B981' },
  { name: 'Marketing', value: 15, color: ALO_ORANGE },
  { name: 'Alert', value: 10, color: '#EF4444' },
];

/* ─── Status Helpers ─── */
const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  QUEUED: { color: 'bg-slate-100 text-slate-700', icon: Clock, label: 'Queued' },
  SENT: { color: 'bg-blue-50 text-blue-700', icon: Send, label: 'Sent' },
  DELIVERED: { color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2, label: 'Delivered' },
  FAILED: { color: 'bg-red-50 text-red-600', icon: XCircle, label: 'Failed' },
  PENDING: { color: 'bg-amber-50 text-amber-700', icon: Clock, label: 'Pending' },
};

const CAMPAIGN_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'bg-slate-100 text-slate-700', label: 'Draft' },
  SCHEDULED: { color: 'bg-amber-50 text-amber-700', label: 'Scheduled' },
  SENDING: { color: 'bg-blue-50 text-blue-700', label: 'Sending' },
  SENT: { color: 'bg-indigo-50 text-indigo-700', label: 'Sent' },
  COMPLETED: { color: 'bg-emerald-50 text-emerald-700', label: 'Completed' },
  FAILED: { color: 'bg-red-50 text-red-600', label: 'Failed' },
};

/* ─── Component ─── */
export function SmsCampaignPage({ onBack }: SmsCampaignPageProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newMsgBody, setNewMsgBody] = useState('');
  const [newMsgRecipients, setNewMsgRecipients] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [messageFilter, setMessageFilter] = useState('ALL');
  const [isSending, setIsSending] = useState(false);

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const filteredMessages = MOCK_MESSAGES.filter(m => {
    const matchFilter = messageFilter === 'ALL' || m.status === messageFilter;
    const matchSearch = m.to.includes(searchTerm) || m.body.toLowerCase().includes(searchTerm.toLowerCase()) || (m.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchFilter && matchSearch;
  });

  const handleSendBulk = useCallback(() => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowSendDialog(false);
      setNewMsgBody('');
      setNewMsgRecipients('');
    }, 1500);
  }, []);

  const totalSent = DELIVERY_DATA.reduce((a, d) => a + d.sent, 0);
  const totalDelivered = DELIVERY_DATA.reduce((a, d) => a + d.delivered, 0);
  const totalFailed = DELIVERY_DATA.reduce((a, d) => a + d.failed, 0);
  const deliveryRate = ((totalDelivered / totalSent) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: ALO_BLUE }}>
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">SMS Campaign Center</h1>
              <p className="text-xs text-slate-500">Bulk messaging, templates & delivery tracking</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4" /> New Campaign
            </Button>
            <Button size="sm" className="gap-1.5 text-white" style={{ backgroundColor: ALO_ORANGE }} onClick={() => setShowSendDialog(true)}>
              <Send className="w-4 h-4" /> Send SMS
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Sent', value: totalSent.toLocaleString(), icon: Send, color: ALO_BLUE, sub: 'This period' },
            { label: 'Delivery Rate', value: `${deliveryRate}%`, icon: CheckCircle2, color: '#10B981', sub: `${totalDelivered.toLocaleString()} delivered` },
            { label: 'Failed', value: totalFailed.toLocaleString(), icon: XCircle, color: '#EF4444', sub: `${((totalFailed / totalSent) * 100).toFixed(1)}% failure rate` },
            { label: 'Opt-Outs', value: MOCK_OPTOUTS.length.toString(), icon: ToggleRight, color: '#F59E0B', sub: 'Active suppressions' },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-white shadow-sm border">
            <TabsTrigger value="templates" className="gap-1.5"><FileText className="w-4 h-4" /> Templates</TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5"><Zap className="w-4 h-4" /> Campaigns</TabsTrigger>
            <TabsTrigger value="tracking" className="gap-1.5"><Eye className="w-4 h-4" /> Delivery Tracking</TabsTrigger>
            <TabsTrigger value="optout" className="gap-1.5"><ToggleLeft className="w-4 h-4" /> Opt-In/Out</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-4 h-4" /> Analytics</TabsTrigger>
          </TabsList>

          {/* ── Templates Tab ── */}
          <TabsContent value="templates">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-white"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
                  <SelectItem value="NOTIFICATION">Notification</SelectItem>
                  <SelectItem value="ALERT">Alert</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((tpl, i) => (
                <motion.div key={tpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelectedTemplate(tpl)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">{tpl.name}</CardTitle>
                        <Badge variant="outline" className="text-[10px]">{tpl.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">{tpl.body}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Used {tpl.usageCount} times</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setShowSendDialog(true); setSelectedTemplate(tpl); }}>
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      {tpl.variables && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {JSON.parse(tpl.variables).map((v: string) => (
                            <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-mono">{`{{${v}}}`}</span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* ── Campaigns Tab ── */}
          <TabsContent value="campaigns">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_CAMPAIGNS.map(c => {
                      const sc = CAMPAIGN_STATUS_CONFIG[c.status] || CAMPAIGN_STATUS_CONFIG.DRAFT;
                      const delPct = c.recipientCount > 0 ? Math.round((c.deliveredCount / c.recipientCount) * 100) : 0;
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-sm text-slate-500">{c.templateName}</TableCell>
                          <TableCell>{c.recipientCount}</TableCell>
                          <TableCell><Badge className={sc.color}>{sc.label}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={delPct} className="w-16 h-2" />
                              <span className="text-xs text-slate-500">{delPct}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">{c.createdAt}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {c.status === 'DRAFT' && <Button variant="ghost" size="icon" className="h-7 w-7"><Edit3 className="w-3.5 h-3.5" /></Button>}
                              {c.status === 'DRAFT' && <Button variant="ghost" size="icon" className="h-7 w-7" style={{ color: ALO_ORANGE }}><Send className="w-3.5 h-3.5" /></Button>}
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Delivery Tracking Tab ── */}
          <TabsContent value="tracking">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search by phone or message..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
              </div>
              <Select value={messageFilter} onValueChange={setMessageFilter}>
                <SelectTrigger className="w-36 bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="QUEUED">Queued</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.map(msg => {
                      const sc = STATUS_CONFIG[msg.status] || STATUS_CONFIG.PENDING;
                      return (
                        <TableRow key={msg.id}>
                          <TableCell className="font-medium">{msg.recipientName || '—'}</TableCell>
                          <TableCell className="text-sm text-slate-500 font-mono">{msg.to}</TableCell>
                          <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">{msg.body}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{msg.category}</Badge></TableCell>
                          <TableCell>
                            <Badge className={sc.color}>
                              <sc.icon className="w-3 h-3 mr-1" />{sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Opt-In/Out Tab ── */}
          <TabsContent value="optout">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Opt-Out List</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Opted Out At</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {MOCK_OPTOUTS.map(opt => (
                          <TableRow key={opt.id}>
                            <TableCell className="font-mono text-sm">{opt.phone}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{opt.reason}</Badge></TableCell>
                            <TableCell className="text-sm text-slate-500">{new Date(opt.optedOutAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                <ToggleLeft className="w-3 h-3" /> Re-subscribe
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Opt-In Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Total Subscribers</span>
                        <span className="font-semibold">1,247</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Active Opt-In</span>
                        <span className="font-semibold text-emerald-600">1,244</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Opted Out</span>
                        <span className="font-semibold text-red-500">{MOCK_OPTOUTS.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Opt-Out Rate</span>
                        <span className="font-semibold">{((MOCK_OPTOUTS.length / 1247) * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-xs text-slate-500 mb-2">Compliance Status</p>
                      <Badge className="bg-emerald-50 text-emerald-700 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Compliant
                      </Badge>
                      <p className="text-[10px] text-slate-400 mt-2">All messages include opt-out keyword (STOP). Records maintained per GDPR/TCPA.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SMS Volume & Delivery</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={DELIVERY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="sent" fill={ALO_BLUE} name="Sent" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="delivered" fill="#10B981" name="Delivered" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="failed" fill="#EF4444" name="Failed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SMS by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <RPieChart>
                      <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {CATEGORY_DATA.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Avg Delivery Rate', value: `${deliveryRate}%`, trend: '+2.3%', up: true },
                      { label: 'Avg Response Rate', value: '18.4%', trend: '+5.1%', up: true },
                      { label: 'Peak Send Time', value: '10:00 AM', trend: '', up: true },
                      { label: 'Cost Per SMS', value: '৳0.45', trend: '-12%', up: true },
                    ].map((m, i) => (
                      <div key={i} className="text-center">
                        <p className="text-xs text-slate-500 uppercase">{m.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{m.value}</p>
                        {m.trend && (
                          <p className={`text-xs mt-1 flex items-center justify-center gap-1 ${m.up ? 'text-emerald-600' : 'text-red-500'}`}>
                            <TrendingUp className="w-3 h-3" />{m.trend}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Send SMS Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" style={{ color: ALO_ORANGE }} /> Send Bulk SMS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedTemplate && (
              <div className="p-3 rounded-lg bg-slate-50 border">
                <p className="text-xs font-medium text-slate-500 mb-1">Using Template: {selectedTemplate.name}</p>
                <p className="text-sm text-slate-700">{selectedTemplate.body}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Recipients</label>
              <Textarea
                placeholder="Enter phone numbers, one per line (e.g. +880171234567)"
                value={newMsgRecipients}
                onChange={e => setNewMsgRecipients(e.target.value)}
                rows={3}
              />
              <p className="text-[10px] text-slate-400 mt-1">Or select from leads/students list</p>
            </div>
            {!selectedTemplate && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Message</label>
                <Textarea
                  placeholder="Type your SMS message..."
                  value={newMsgBody}
                  onChange={e => setNewMsgBody(e.target.value)}
                  rows={3}
                  maxLength={160}
                />
                <p className="text-[10px] text-slate-400 mt-1">{newMsgBody.length}/160 characters</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button className="text-white gap-1.5" style={{ backgroundColor: ALO_ORANGE }} disabled={isSending} onClick={handleSendBulk}>
              {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSending ? 'Sending...' : 'Send Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" style={{ color: ALO_BLUE }} /> New SMS Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Campaign Name</label>
              <Input placeholder="e.g. UK Intake Follow-Up" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Template</label>
              <Select>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Schedule</label>
              <Input type="datetime-local" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button className="text-white" style={{ backgroundColor: ALO_BLUE }}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
