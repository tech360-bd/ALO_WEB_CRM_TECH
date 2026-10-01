'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Hash, Plus, Edit, Trash2, Search, Zap, Target, Send, MessageCircle,
  Facebook, Instagram, Linkedin, ArrowRight, CheckCircle, XCircle,
  Filter, TrendingUp, Users, Eye, Bot,
} from 'lucide-react';

type Platform = 'facebook' | 'instagram' | 'messenger' | 'linkedin' | 'tiktok' | 'whatsapp' | 'website';
type TriggerAction = 'auto_reply' | 'send_dm' | 'create_lead' | 'tag_counselor' | 'send_whatsapp' | 'email_sequence';

interface KeywordRule {
  id: string;
  keyword: string;
  platforms: Platform[];
  action: TriggerAction;
  replyTemplate: string;
  isActive: boolean;
  leadsGenerated: number;
  repliesSent: number;
  conversionRate: number;
  lastTriggered: string;
}

const defaultKeywords: KeywordRule[] = [
  { id: 'KW-001', keyword: 'Study Abroad', platforms: ['facebook', 'instagram', 'messenger'], action: 'auto_reply', replyTemplate: 'Thank you for your interest in studying abroad! ALO Education has helped 5000+ students. Please share your email or WhatsApp number so our counselor can contact you.', isActive: true, leadsGenerated: 234, repliesSent: 567, conversionRate: 41.3, lastTriggered: '2 min ago' },
  { id: 'KW-002', keyword: 'IELTS', platforms: ['facebook', 'instagram', 'messenger'], action: 'send_dm', replyTemplate: 'Great choice preparing for IELTS! ALO Education offers expert IELTS coaching. Our students achieve Band 7+ consistently. Reply with your current score.', isActive: true, leadsGenerated: 189, repliesSent: 423, conversionRate: 44.7, lastTriggered: '15 min ago' },
  { id: 'KW-003', keyword: 'Visa', platforms: ['facebook', 'instagram', 'messenger'], action: 'create_lead', replyTemplate: 'Visa processing is our specialty! ALO Education has 95% visa success rate. Which country are you targeting? We will connect you with our visa expert.', isActive: true, leadsGenerated: 156, repliesSent: 312, conversionRate: 50.0, lastTriggered: '32 min ago' },
  { id: 'KW-004', keyword: 'UK', platforms: ['facebook', 'instagram', 'linkedin'], action: 'create_lead', replyTemplate: 'UK is our top destination! ALO Education works with 160+ UK universities. Which course interests you? Bachelors, Masters, or PhD?', isActive: true, leadsGenerated: 312, repliesSent: 678, conversionRate: 46.0, lastTriggered: '1 hr ago' },
  { id: 'KW-005', keyword: 'Canada', platforms: ['facebook', 'instagram'], action: 'auto_reply', replyTemplate: 'Canada offers excellent post-study work permits! ALO Education partners with top Canadian universities. Share your academic background.', isActive: true, leadsGenerated: 198, repliesSent: 445, conversionRate: 44.5, lastTriggered: '2 hr ago' },
  { id: 'KW-006', keyword: 'Australia', platforms: ['facebook', 'instagram'], action: 'send_dm', replyTemplate: 'Australia has world-class education! Nursing, IT, Engineering are top choices for Bangladeshi students. What field are you interested in?', isActive: true, leadsGenerated: 145, repliesSent: 298, conversionRate: 48.7, lastTriggered: '3 hr ago' },
  { id: 'KW-007', keyword: 'Scholarship', platforms: ['facebook', 'instagram', 'messenger'], action: 'create_lead', replyTemplate: 'Scholarships available for deserving students! ALO Education helps you find and apply. Share your GPA and target country for personalized matching.', isActive: true, leadsGenerated: 267, repliesSent: 512, conversionRate: 52.1, lastTriggered: '45 min ago' },
  { id: 'KW-008', keyword: 'Apply', platforms: ['facebook', 'instagram'], action: 'tag_counselor', replyTemplate: 'Ready to apply? Start your journey with ALO Education! Visit aloeducation.com or call 01805020101. Our Dhaka office is open Sat-Thu, 10AM-6PM.', isActive: false, leadsGenerated: 89, repliesSent: 234, conversionRate: 38.0, lastTriggered: '1 day ago' },
  { id: 'KW-009', keyword: 'PTE', platforms: ['facebook', 'instagram'], action: 'auto_reply', replyTemplate: 'PTE is accepted by many universities! ALO Education provides PTE preparation support. What is your target PTE score?', isActive: true, leadsGenerated: 67, repliesSent: 156, conversionRate: 42.9, lastTriggered: '4 hr ago' },
  { id: 'KW-010', keyword: 'Germany', platforms: ['facebook', 'linkedin'], action: 'send_whatsapp', replyTemplate: 'Germany offers tuition-free education at public universities! Living costs around EUR 10,236/year. Share your WhatsApp for detailed guidance.', isActive: true, leadsGenerated: 112, repliesSent: 267, conversionRate: 41.9, lastTriggered: '5 hr ago' },
];

const platformIcons: Record<Platform, { icon: React.ElementType; bg: string }> = {
  facebook: { icon: Facebook, bg: 'bg-blue-600' },
  instagram: { icon: Instagram, bg: 'bg-gradient-to-r from-purple-600 to-pink-500' },
  messenger: { icon: MessageCircle, bg: 'bg-purple-600' },
  linkedin: { icon: Linkedin, bg: 'bg-blue-700' },
  tiktok: { icon: Hash, bg: 'bg-gray-900' },
  whatsapp: { icon: MessageCircle, bg: 'bg-green-600' },
  website: { icon: Hash, bg: 'bg-teal-600' },
};

const actionLabels: Record<TriggerAction, string> = {
  auto_reply: 'Auto Reply',
  send_dm: 'Send DM',
  create_lead: 'Create Lead',
  tag_counselor: 'Tag Counselor',
  send_whatsapp: 'WhatsApp Message',
  email_sequence: 'Email Sequence',
};

export default function KeywordTriggersView() {
  const [keywords, setKeywords] = useState<KeywordRule[]>(defaultKeywords);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newPlatform, setNewPlatform] = useState<Platform>('facebook');
  const [newAction, setNewAction] = useState<TriggerAction>('auto_reply');
  const [newTemplate, setNewTemplate] = useState('');

  const filtered = keywords.filter(kw => {
    const matchSearch = !search || kw.keyword.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platformFilter === 'all' || kw.platforms.includes(platformFilter as Platform);
    return matchSearch && matchPlatform;
  });

  const totalLeads = keywords.reduce((sum, kw) => sum + kw.leadsGenerated, 0);
  const totalReplies = keywords.reduce((sum, kw) => sum + kw.repliesSent, 0);
  const avgConversion = keywords.length > 0 ? (keywords.reduce((sum, kw) => sum + kw.conversionRate, 0) / keywords.length) : 0;
  const activeCount = keywords.filter(kw => kw.isActive).length;

  const handleToggle = (id: string) => {
    setKeywords(prev => prev.map(kw => kw.id === id ? { ...kw, isActive: !kw.isActive } : kw));
  };

  const handleDelete = (id: string) => {
    setKeywords(prev => prev.filter(kw => kw.id !== id));
  };

  const handleAdd = () => {
    if (!newKeyword.trim()) return;
    const newRule: KeywordRule = {
      id: `KW-${String(Date.now()).slice(-6)}`,
      keyword: newKeyword,
      platforms: [newPlatform],
      action: newAction,
      replyTemplate: newTemplate || `Auto reply for "${newKeyword}" - ALO Education will contact you shortly.`,
      isActive: true,
      leadsGenerated: 0,
      repliesSent: 0,
      conversionRate: 0,
      lastTriggered: 'Never',
    };
    setKeywords(prev => [newRule, ...prev]);
    setNewKeyword('');
    setNewTemplate('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Keyword Triggers</h1>
          <p className="text-sm text-gray-500">Auto-reply to social media comments containing specific keywords</p>
        </div>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-1" />Add Keyword
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-100 rounded-lg"><Hash className="w-4 h-4 text-orange-600" /></div>
              <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{activeCount}<span className="text-sm text-gray-400 font-normal">/{keywords.length}</span></p>
            <p className="text-xs text-gray-500">Active Keywords</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg"><Send className="w-4 h-4 text-blue-600" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{totalReplies.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Replies Sent</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg"><Target className="w-4 h-4 text-green-600" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{totalLeads.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Leads Generated</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="w-4 h-4 text-purple-600" /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{avgConversion.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Avg Conversion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Keyword Form */}
      {showAddForm && (
        <Card className="bg-orange-50 border border-orange-200">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Add New Keyword Trigger</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder="Keyword (e.g. Study Abroad)" className="h-9 text-sm" />
              <Select value={newPlatform} onValueChange={v => setNewPlatform(v as Platform)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(platformIcons).map(([k, v]) => <SelectItem key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={newAction} onValueChange={v => setNewAction(v as TriggerAction)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Action" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(actionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-9 bg-orange-500 hover:bg-orange-600" onClick={handleAdd}>Add</Button>
                <Button size="sm" variant="ghost" className="h-9" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </div>
            <Textarea value={newTemplate} onChange={e => setNewTemplate(e.target.value)} placeholder="Reply template (optional)" rows={2} className="text-sm" />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search keywords..." className="pl-9 h-9 text-sm" />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="All Platforms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {Object.entries(platformIcons).map(([k, v]) => <SelectItem key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Keywords Table */}
      <Card className="bg-white border border-gray-100">
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 text-[11px] font-semibold text-gray-500 w-[10%]">Keyword</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-500 w-[12%]">Platforms</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-500 w-[10%]">Action</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-500">Reply Template</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-500 text-center w-[8%]">Replies</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-500 text-center w-[8%]">Leads</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-500 text-center w-[8%]">Conv. %</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-500 text-center w-[8%]">Last</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-500 text-center w-[6%]">On/Off</th>
                  <th className="pb-3 text-[11px] font-semibold text-gray-500 text-right w-[8%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(kw => (
                  <tr key={kw.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <span className="text-sm font-bold text-orange-600">{kw.keyword}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {kw.platforms.map(p => {
                          const config = platformIcons[p];
                          const Icon = config.icon;
                          return (
                            <div key={p} className={`w-5 h-5 rounded ${config.bg} flex items-center justify-center`} title={p}>
                              <Icon className="w-3 h-3 text-white" />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-[10px]">{actionLabels[kw.action]}</Badge>
                    </td>
                    <td className="py-3">
                      <p className="text-xs text-gray-600 line-clamp-2 max-w-[250px]">{kw.replyTemplate}</p>
                    </td>
                    <td className="py-3 text-center text-xs font-medium text-gray-700">{kw.repliesSent}</td>
                    <td className="py-3 text-center text-xs font-bold text-green-600">{kw.leadsGenerated}</td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-semibold ${kw.conversionRate >= 45 ? 'text-green-600' : kw.conversionRate >= 35 ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {kw.conversionRate}%
                      </span>
                    </td>
                    <td className="py-3 text-center text-[10px] text-gray-400">{kw.lastTriggered}</td>
                    <td className="py-3 text-center">
                      <Switch checked={kw.isActive} onCheckedChange={() => handleToggle(kw.id)} />
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="w-3 h-3" /></Button>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No keywords found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
