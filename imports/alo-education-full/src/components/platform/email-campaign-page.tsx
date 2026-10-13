'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Mail, Plus, Search, BarChart3, TrendingUp,
  Eye, Send, Users, Clock, CheckCircle2, XCircle,
  Edit3, Copy, Trash2, Sparkles, ToggleLeft, ToggleRight,
  RefreshCw, FileText, Zap, Target, ChevronDown,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell,
} from 'recharts';

/* ─── Brand Colors ─── */
const ALO_BLUE = '#0052B8';
const ALO_ORANGE = '#E8501A';

/* ─── Types ─── */
interface EmailCampaignPageProps {
  onBack: () => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  preview: string;
  usageCount: number;
  lastUsed: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateName: string;
  recipientCount: number;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'COMPLETED';
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubRate: number;
  sentAt?: string;
  createdAt: string;
}

interface Subscriber {
  id: string;
  email: string;
  name: string;
  status: 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED' | 'PENDING';
  list: string;
  subscribedAt: string;
}

/* ─── Mock Data ─── */
const EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: '1', name: 'Welcome Email', type: 'Onboarding', subject: 'Welcome to ALO Education!', preview: 'Start your study abroad journey with us...', usageCount: 520, lastUsed: '2025-01-28' },
  { id: '2', name: 'Monthly Newsletter', type: 'Newsletter', subject: 'ALO Monthly — Jan 2025', preview: 'University updates, scholarship alerts, and more...', usageCount: 12, lastUsed: '2025-01-01' },
  { id: '3', name: 'Application Follow-Up', type: 'Transactional', subject: 'Your Application Status Update', preview: 'We have an update on your application to...', usageCount: 380, lastUsed: '2025-01-27' },
  { id: '4', name: 'Scholarship Alert', type: 'Promotional', subject: '🎓 New Scholarship Opportunities!', preview: 'Exclusive scholarships matching your profile...', usageCount: 210, lastUsed: '2025-01-25' },
  { id: '5', name: 'Visa Guide', type: 'Educational', subject: 'Your Visa Application Guide', preview: 'Step-by-step guide for your visa process...', usageCount: 145, lastUsed: '2025-01-20' },
  { id: '6', name: 'Event Invitation', type: 'Promotional', subject: 'You\'re Invited: Education Fair 2025', preview: 'Join us at the biggest education fair...', usageCount: 89, lastUsed: '2025-01-15' },
];

const EMAIL_CAMPAIGNS: EmailCampaign[] = [
  { id: '1', name: 'Jan Newsletter', subject: 'ALO Monthly — Jan 2025', templateName: 'Monthly Newsletter', recipientCount: 1247, status: 'COMPLETED', openRate: 32.4, clickRate: 8.7, bounceRate: 1.2, unsubRate: 0.3, sentAt: '2025-01-01', createdAt: '2024-12-28' },
  { id: '2', name: 'Scholarship Blast Q1', subject: 'New Scholarship Opportunities!', templateName: 'Scholarship Alert', recipientCount: 890, status: 'COMPLETED', openRate: 41.2, clickRate: 12.3, bounceRate: 0.8, unsubRate: 0.5, sentAt: '2025-01-10', createdAt: '2025-01-08' },
  { id: '3', name: 'Welcome Series #1', subject: 'Welcome to ALO Education!', templateName: 'Welcome Email', recipientCount: 85, status: 'SENDING', openRate: 0, clickRate: 0, bounceRate: 0, unsubRate: 0, createdAt: '2025-01-27' },
  { id: '4', name: 'App Follow-Up Batch', subject: 'Your Application Status Update', templateName: 'Application Follow-Up', recipientCount: 320, status: 'SCHEDULED', openRate: 0, clickRate: 0, bounceRate: 0, unsubRate: 0, createdAt: '2025-01-28' },
  { id: '5', name: 'Education Fair Invite', subject: 'Education Fair 2025', templateName: 'Event Invitation', recipientCount: 2100, status: 'DRAFT', openRate: 0, clickRate: 0, bounceRate: 0, unsubRate: 0, createdAt: '2025-01-29' },
];

const SUBSCRIBERS: Subscriber[] = [
  { id: '1', email: 'rahim.uddin@gmail.com', name: 'Rahim Uddin', status: 'ACTIVE', list: 'All Contacts', subscribedAt: '2024-11-15' },
  { id: '2', email: 'sara.ahmed@hotmail.com', name: 'Sara Ahmed', status: 'ACTIVE', list: 'UK Applicants', subscribedAt: '2024-12-01' },
  { id: '3', email: 'karim.h@yahoo.com', name: 'Karim Hossain', status: 'ACTIVE', list: 'Scholarship Seekers', subscribedAt: '2024-12-10' },
  { id: '4', email: 'nusrat.j@outlook.com', name: 'Nusrat Jahan', status: 'UNSUBSCRIBED', list: 'Newsletter', subscribedAt: '2024-11-20' },
  { id: '5', email: 'imran.k@gmail.com', name: 'Imran Khan', status: 'BOUNCED', list: 'All Contacts', subscribedAt: '2024-10-05' },
  { id: '6', email: 'fatima.b@gmail.com', name: 'Fatima Begum', status: 'ACTIVE', list: 'Visa Applicants', subscribedAt: '2025-01-15' },
  { id: '7', email: 'amir.s@live.com', name: 'Amir Siddiqui', status: 'PENDING', list: 'New Leads', subscribedAt: '2025-01-28' },
];

const CAMPAIGN_PERF = [
  { month: 'Aug', sent: 5200, opened: 1620, clicked: 445 },
  { month: 'Sep', sent: 6100, opened: 2013, clicked: 580 },
  { month: 'Oct', sent: 7300, opened: 2482, clicked: 745 },
  { month: 'Nov', sent: 6800, opened: 2244, clicked: 653 },
  { month: 'Dec', sent: 5500, opened: 1760, clicked: 490 },
  { month: 'Jan', sent: 8200, opened: 2870, clicked: 861 },
];

const LIST_DISTRIBUTION = [
  { name: 'All Contacts', value: 1247, color: ALO_BLUE },
  { name: 'UK Applicants', value: 423, color: '#10B981' },
  { name: 'Scholarship Seekers', value: 312, color: ALO_ORANGE },
  { name: 'Visa Applicants', value: 189, color: '#8B5CF6' },
  { name: 'Newsletter', value: 567, color: '#EC4899' },
];

const CAMPAIGN_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'bg-slate-100 text-slate-700', label: 'Draft' },
  SCHEDULED: { color: 'bg-amber-50 text-amber-700', label: 'Scheduled' },
  SENDING: { color: 'bg-blue-50 text-blue-700', label: 'Sending' },
  SENT: { color: 'bg-indigo-50 text-indigo-700', label: 'Sent' },
  COMPLETED: { color: 'bg-emerald-50 text-emerald-700', label: 'Completed' },
};

const SUBSCRIBER_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: 'bg-emerald-50 text-emerald-700', label: 'Active' },
  UNSUBSCRIBED: { color: 'bg-amber-50 text-amber-700', label: 'Unsubscribed' },
  BOUNCED: { color: 'bg-red-50 text-red-600', label: 'Bounced' },
  PENDING: { color: 'bg-slate-100 text-slate-600', label: 'Pending' },
};

/* ─── Component ─── */
export function EmailCampaignPage({ onBack }: EmailCampaignPageProps) {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterList, setFilterList] = useState('ALL');
  const [isSending, setIsSending] = useState(false);

  const filteredCampaigns = EMAIL_CAMPAIGNS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredSubscribers = SUBSCRIBERS.filter(s => {
    const matchSearch = s.email.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchList = filterList === 'ALL' || s.list === filterList;
    return matchSearch && matchList;
  });

  const avgOpenRate = EMAIL_CAMPAIGNS.filter(c => c.status === 'COMPLETED').reduce((a, c) => a + c.openRate, 0) / EMAIL_CAMPAIGNS.filter(c => c.status === 'COMPLETED').length || 0;
  const avgClickRate = EMAIL_CAMPAIGNS.filter(c => c.status === 'COMPLETED').reduce((a, c) => a + c.clickRate, 0) / EMAIL_CAMPAIGNS.filter(c => c.status === 'COMPLETED').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: ALO_ORANGE }}>
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Email Campaign Center</h1>
              <p className="text-xs text-slate-500">Campaigns, templates & subscriber management</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowTemplateEditor(true)}>
              <Edit3 className="w-4 h-4" /> Template Editor
            </Button>
            <Button size="sm" className="gap-1.5 text-white" style={{ backgroundColor: ALO_ORANGE }} onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4" /> New Campaign
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Subscribers', value: '1,247', icon: Users, color: ALO_BLUE, sub: '+28 this week', up: true },
            { label: 'Avg Open Rate', value: `${avgOpenRate.toFixed(1)}%`, icon: Eye, color: '#10B981', sub: '+3.2% vs last month', up: true },
            { label: 'Avg Click Rate', value: `${avgClickRate.toFixed(1)}%`, icon: Target, color: ALO_ORANGE, sub: '+1.5% vs last month', up: true },
            { label: 'Bounce Rate', value: '1.2%', icon: XCircle, color: '#EF4444', sub: '-0.3% vs last month', up: false },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                      <p className={`text-xs mt-1 flex items-center gap-1 ${stat.up ? 'text-emerald-600' : 'text-red-500'}`}>
                        {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {stat.sub}
                      </p>
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
            <TabsTrigger value="campaigns" className="gap-1.5"><Zap className="w-4 h-4" /> Campaigns</TabsTrigger>
            <TabsTrigger value="templates" className="gap-1.5"><FileText className="w-4 h-4" /> Templates</TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-1.5"><Users className="w-4 h-4" /> Subscribers</TabsTrigger>
            <TabsTrigger value="ab-test" className="gap-1.5"><Sparkles className="w-4 h-4" /> A/B Testing</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="w-4 h-4" /> Analytics</TabsTrigger>
          </TabsList>

          {/* ── Campaigns Tab ── */}
          <TabsContent value="campaigns">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search campaigns..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="SENDING">Sending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead>Click Rate</TableHead>
                      <TableHead>Bounce</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map(c => {
                      const sc = CAMPAIGN_STATUS_CONFIG[c.status] || CAMPAIGN_STATUS_CONFIG.DRAFT;
                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.subject}</p>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">{c.templateName}</TableCell>
                          <TableCell>{c.recipientCount.toLocaleString()}</TableCell>
                          <TableCell><Badge className={sc.color}>{sc.label}</Badge></TableCell>
                          <TableCell>
                            {c.status === 'COMPLETED' ? (
                              <div className="flex items-center gap-2">
                                <Progress value={c.openRate} className="w-12 h-2" />
                                <span className="text-xs">{c.openRate}%</span>
                              </div>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {c.status === 'COMPLETED' ? <span className="text-xs">{c.clickRate}%</span> : '—'}
                          </TableCell>
                          <TableCell>
                            {c.status === 'COMPLETED' ? <span className="text-xs">{c.bounceRate}%</span> : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {c.status === 'DRAFT' && <Button variant="ghost" size="icon" className="h-7 w-7"><Edit3 className="w-3.5 h-3.5" /></Button>}
                              {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" style={{ color: ALO_ORANGE }}><Send className="w-3.5 h-3.5" /></Button>
                              )}
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

          {/* ── Templates Tab ── */}
          <TabsContent value="templates">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {EMAIL_TEMPLATES.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.subject.toLowerCase().includes(searchTerm.toLowerCase())).map((tpl, i) => (
                <motion.div key={tpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelectedTemplate(tpl)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">{tpl.name}</CardTitle>
                        <Badge variant="outline" className="text-[10px]">{tpl.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs font-medium text-slate-700 mb-1">{tpl.subject}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{tpl.preview}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Used {tpl.usageCount} times · Last {tpl.lastUsed}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Edit3 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* ── Subscribers Tab ── */}
          <TabsContent value="subscribers">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search subscribers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
              </div>
              <Select value={filterList} onValueChange={setFilterList}>
                <SelectTrigger className="w-40 bg-white"><SelectValue placeholder="List" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Lists</SelectItem>
                  <SelectItem value="All Contacts">All Contacts</SelectItem>
                  <SelectItem value="UK Applicants">UK Applicants</SelectItem>
                  <SelectItem value="Scholarship Seekers">Scholarship Seekers</SelectItem>
                  <SelectItem value="Visa Applicants">Visa Applicants</SelectItem>
                  <SelectItem value="Newsletter">Newsletter</SelectItem>
                  <SelectItem value="New Leads">New Leads</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Add Subscriber</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>List</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscribers.map(sub => {
                      const sc = SUBSCRIBER_STATUS_CONFIG[sub.status] || SUBSCRIBER_STATUS_CONFIG.PENDING;
                      return (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.name}</TableCell>
                          <TableCell className="text-sm text-slate-500">{sub.email}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{sub.list}</Badge></TableCell>
                          <TableCell><Badge className={sc.color}>{sc.label}</Badge></TableCell>
                          <TableCell className="text-sm text-slate-500">{sub.subscribedAt}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {sub.status === 'UNSUBSCRIBED' && (
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><ToggleRight className="w-3 h-3" /> Re-subscribe</Button>
                              )}
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

          {/* ── A/B Testing Tab ── */}
          <TabsContent value="ab-test">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5" style={{ color: ALO_ORANGE }} /> Active A/B Tests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">Welcome Email Subject Line Test</h4>
                      <Badge className="bg-blue-50 text-blue-700">Running</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-500">Variant A</p>
                        <p className="text-sm text-slate-700">&quot;Welcome to ALO Education!&quot;</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs"><span>Opens</span><span>42.1%</span></div>
                          <Progress value={42.1} className="h-2" />
                          <div className="flex justify-between text-xs"><span>Clicks</span><span>11.3%</span></div>
                          <Progress value={11.3} className="h-2" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-500">Variant B</p>
                        <p className="text-sm text-slate-700">&quot;Your Study Abroad Journey Starts Now!&quot;</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs"><span>Opens</span><span>48.7%</span></div>
                          <Progress value={48.7} className="h-2" style={{ color: ALO_ORANGE }} />
                          <div className="flex justify-between text-xs"><span>Clicks</span><span>14.2%</span></div>
                          <Progress value={14.2} className="h-2" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                      <p className="text-xs text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Variant B is winning with +6.6% higher open rate
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">CTA Button Color Test</h4>
                      <Badge variant="outline" className="text-[10px]">Completed</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Winner: Orange CTA (+3.1% click rate vs blue)</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Create New A/B Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Test Name</label>
                    <Input placeholder="e.g. Newsletter Subject Line Test" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Element to Test</label>
                    <Select>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select element" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subject">Subject Line</SelectItem>
                        <SelectItem value="cta">CTA Button</SelectItem>
                        <SelectItem value="body">Email Body</SelectItem>
                        <SelectItem value="sender">Sender Name</SelectItem>
                        <SelectItem value="time">Send Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Variant A</label>
                    <Input placeholder="Control variant" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Variant B</label>
                    <Input placeholder="Test variant" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Sample Size</label>
                    <Select>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select sample" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20% of list</SelectItem>
                        <SelectItem value="30">30% of list</SelectItem>
                        <SelectItem value="50">50% of list</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full text-white gap-1.5" style={{ backgroundColor: ALO_ORANGE }}>
                    <Sparkles className="w-4 h-4" /> Start A/B Test
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Performance Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={CAMPAIGN_PERF}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sent" stroke={ALO_BLUE} strokeWidth={2} name="Sent" dot={false} />
                      <Line type="monotone" dataKey="opened" stroke="#10B981" strokeWidth={2} name="Opened" dot={false} />
                      <Line type="monotone" dataKey="clicked" stroke={ALO_ORANGE} strokeWidth={2} name="Clicked" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subscriber List Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <RPieChart>
                      <Pie data={LIST_DISTRIBUTION} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {LIST_DISTRIBUTION.map((entry, idx) => (
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
                  <CardTitle className="text-base">Campaign Metrics Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    {[
                      { label: 'Avg Open Rate', value: `${avgOpenRate.toFixed(1)}%`, trend: '+3.2%', up: true },
                      { label: 'Avg Click Rate', value: `${avgClickRate.toFixed(1)}%`, trend: '+1.5%', up: true },
                      { label: 'Avg Bounce Rate', value: '1.0%', trend: '-0.3%', up: true },
                      { label: 'Unsub Rate', value: '0.4%', trend: '-0.1%', up: true },
                      { label: 'Deliverability', value: '98.8%', trend: '+0.2%', up: true },
                    ].map((m, i) => (
                      <div key={i} className="text-center">
                        <p className="text-xs text-slate-500 uppercase">{m.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{m.value}</p>
                        <p className={`text-xs mt-1 flex items-center justify-center gap-1 ${m.up ? 'text-emerald-600' : 'text-red-500'}`}>
                          <TrendingUp className="w-3 h-3" />{m.trend}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" style={{ color: ALO_ORANGE }} /> Create Email Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Campaign Name</label>
              <Input placeholder="e.g. Feb Newsletter" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Subject Line</label>
              <Input placeholder="e.g. ALO Monthly — Feb 2025" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Template</label>
              <Select>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Subscriber List</label>
              <Select>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Select list" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts (1,247)</SelectItem>
                  <SelectItem value="uk">UK Applicants (423)</SelectItem>
                  <SelectItem value="scholarship">Scholarship Seekers (312)</SelectItem>
                  <SelectItem value="visa">Visa Applicants (189)</SelectItem>
                  <SelectItem value="newsletter">Newsletter (567)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Schedule</label>
              <Input type="datetime-local" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="text-white" style={{ backgroundColor: ALO_ORANGE }}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" style={{ color: ALO_BLUE }} /> Email Template Editor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Template Name</label>
                <Input placeholder="Template name" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Type</label>
                <Select>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Subject Line</label>
              <Input placeholder="Email subject with {{variables}}" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Email Body (HTML)</label>
              <Textarea placeholder="Write your email content here... Use {{variable}} for personalization." rows={10} className="font-mono text-sm" />
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700 font-medium mb-1">Available Variables</p>
              <div className="flex flex-wrap gap-1.5">
                {['{{name}}', '{{email}}', '{{country}}', '{{university}}', '{{course}}', '{{date}}'].map(v => (
                  <code key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-white border text-blue-600">{v}</code>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="text-white" style={{ backgroundColor: ALO_BLUE }}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
