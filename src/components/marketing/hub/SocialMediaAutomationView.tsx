'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Share2, Facebook, Instagram, Linkedin, MessageCircle, Send, Clock, Users, Zap, Bot,
  Target, TrendingUp, Heart, Eye, Calendar, Search, MoreVertical, Plus, Edit, Trash2,
  Copy, ThumbsUp, Filter, ArrowRight, CheckCircle, XCircle, AlertTriangle, Sparkles,
  Twitter, Youtube, MessageSquare, Globe, Mail, Smartphone, Hash,
} from 'lucide-react';

// ============================================================
// Platform Config
// ============================================================

type Platform = 'facebook' | 'instagram' | 'messenger' | 'linkedin' | 'tiktok' | 'youtube' | 'whatsapp_status' | 'website';

const platformConfig: Record<Platform, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  facebook: { label: 'Facebook', color: 'text-blue-600', bg: 'bg-blue-600', icon: Facebook },
  instagram: { label: 'Instagram', color: 'text-pink-500', bg: 'bg-gradient-to-r from-purple-600 to-pink-500', icon: Instagram },
  messenger: { label: 'Messenger', color: 'text-purple-600', bg: 'bg-purple-600', icon: MessageSquare },
  linkedin: { label: 'LinkedIn', color: 'text-blue-700', bg: 'bg-blue-700', icon: Linkedin },
  tiktok: { label: 'TikTok', color: 'text-gray-700', bg: 'bg-gray-900', icon: Youtube },
  youtube: { label: 'YouTube', color: 'text-red-600', bg: 'bg-red-600', icon: Youtube },
  whatsapp_status: { label: 'WhatsApp Status', color: 'text-green-600', bg: 'bg-green-600', icon: MessageCircle },
  website: { label: 'Website Blog', color: 'text-teal-600', bg: 'bg-teal-600', icon: Globe },
};

// ============================================================
// Mock Data
// ============================================================

interface InboxMessage {
  id: string;
  platform: Platform;
  senderName: string;
  senderAvatar: string;
  message: string;
  time: string;
  isRead: boolean;
  isAiSuggested: boolean;
  suggestedReply?: string;
}

const inboxMessages: InboxMessage[] = [
  { id: 'SM-001', platform: 'facebook', senderName: 'Rafi Ahmed', senderAvatar: 'RA', message: 'I want to study in UK. Can you help me with application process?', time: '2 min ago', isRead: false, isAiSuggested: true, suggestedReply: 'Hello Rafi! ALO Education can help you with UK applications. Please share your academic background and IELTS score.' },
  { id: 'SM-002', platform: 'instagram', senderName: 'Nusrat Jahan', senderAvatar: 'NJ', message: 'Do you have any scholarship for Australia nursing courses?', time: '15 min ago', isRead: false, isAiSuggested: true, suggestedReply: 'Yes Nusrat! Several Australian universities offer nursing scholarships. DM us your email for details.' },
  { id: 'SM-003', platform: 'messenger', senderName: 'Tanvir Hossain', senderAvatar: 'TH', message: 'When is the next education fair in Dhaka?', time: '32 min ago', isRead: true, isAiSuggested: false },
  { id: 'SM-004', platform: 'facebook', senderName: 'Fatima Begum', senderAvatar: 'FB', message: 'My IELTS score is 6.5. Can I apply for masters in Canada?', time: '1 hr ago', isRead: true, isAiSuggested: true, suggestedReply: 'With IELTS 6.5 you can apply to many Canadian universities. Some may require 7.0 for specific programs.' },
  { id: 'SM-005', platform: 'instagram', senderName: 'Arif Rahman', senderAvatar: 'AR', message: 'What are the visa requirements for UK student visa 2025?', time: '2 hr ago', isRead: true, isAiSuggested: true, suggestedReply: 'UK student visa requires: valid passport, CAS letter, financial proof, TB test certificate, and biometrics.' },
  { id: 'SM-006', platform: 'linkedin', senderName: 'Sakib Khan', senderAvatar: 'SK', message: 'We are a school in Chittagong. Can we partner with ALO Education?', time: '3 hr ago', isRead: true, isAiSuggested: false },
  { id: 'SM-007', platform: 'messenger', senderName: 'Imran Ali', senderAvatar: 'IA', message: 'I already have an offer from University of Manchester. Need help with visa.', time: '5 hr ago', isRead: true, isAiSuggested: false },
  { id: 'SM-008', platform: 'facebook', senderName: 'Mitu Akter', senderAvatar: 'MA', message: 'How much does it cost to study in Germany? Is it free?', time: '6 hr ago', isRead: true, isAiSuggested: true, suggestedReply: 'Public universities in Germany offer tuition-free education. You need living costs around EUR 10,236/year.' },
];

interface Comment {
  id: string;
  platform: Platform;
  postTitle: string;
  commenter: string;
  commentText: string;
  commentTime: string;
  autoReplyStatus: 'sent' | 'pending' | 'disabled';
  convertedToLead: boolean;
  leadId?: string;
}

const comments: Comment[] = [
  { id: 'CMT-001', platform: 'facebook', postTitle: 'UK January 2026 Intake Open', commenter: 'Rafi Ahmed', commentText: 'Study Abroad - I want to apply for UK January intake', commentTime: '5 min ago', autoReplyStatus: 'sent', convertedToLead: true, leadId: 'LD-2025-0891' },
  { id: 'CMT-002', platform: 'instagram', postTitle: 'IELTS 7+ Tips Reel', commenter: 'Nusrat Jahan', commentText: 'IELTS - I need preparation help', commentTime: '20 min ago', autoReplyStatus: 'sent', convertedToLead: true, leadId: 'LD-2025-0892' },
  { id: 'CMT-003', platform: 'facebook', postTitle: 'Australia Scholarship Alert', commenter: 'Tanvir Hossain', commentText: 'Scholarship - How to apply?', commentTime: '45 min ago', autoReplyStatus: 'sent', convertedToLead: false },
  { id: 'CMT-004', platform: 'instagram', postTitle: 'UK Campus Tour - Edinburgh', commenter: 'Arif Rahman', commentText: 'Visa - What is the process?', commentTime: '1 hr ago', autoReplyStatus: 'pending', convertedToLead: false },
  { id: 'CMT-005', platform: 'facebook', postTitle: 'Canada Winter 2026', commenter: 'Fatima Begum', commentText: 'Canada - I have IELTS 6.5', commentTime: '2 hr ago', autoReplyStatus: 'sent', convertedToLead: true, leadId: 'LD-2025-0893' },
  { id: 'CMT-006', platform: 'instagram', postTitle: 'Free Scholarship Webinar', commenter: 'Mitu Akter', commentText: 'Apply - How can I register?', commentTime: '3 hr ago', autoReplyStatus: 'sent', convertedToLead: false },
  { id: 'CMT-007', platform: 'facebook', postTitle: 'Germany Free Tuition Guide', commenter: 'Sakib Khan', commentText: 'UK - Compare with Germany please', commentTime: '4 hr ago', autoReplyStatus: 'pending', convertedToLead: false },
  { id: 'CMT-008', platform: 'instagram', postTitle: 'Student Success - Imperial College', commenter: 'Imran Ali', commentText: 'Scholarship - Got full scholarship!', commentTime: '5 hr ago', autoReplyStatus: 'disabled', convertedToLead: false },
];

interface Keyword {
  id: string;
  keyword: string;
  platforms: Platform[];
  triggerAction: 'auto_reply' | 'send_dm' | 'create_lead' | 'tag_for_followup';
  replyTemplate: string;
  isActive: boolean;
  leadsGenerated: number;
}

const keywords: Keyword[] = [
  { id: 'KW-001', keyword: 'Study Abroad', platforms: ['facebook', 'instagram', 'messenger'], triggerAction: 'auto_reply', replyTemplate: 'Thank you for your interest! ALO Education helps students study in UK, Canada, Australia, and more. Please share your email or WhatsApp number.', isActive: true, leadsGenerated: 234 },
  { id: 'KW-002', keyword: 'IELTS', platforms: ['facebook', 'instagram'], triggerAction: 'send_dm', replyTemplate: 'We offer expert IELTS preparation! Our students achieve band 7+ consistently. DM us your current score.', isActive: true, leadsGenerated: 189 },
  { id: 'KW-003', keyword: 'Visa', platforms: ['facebook', 'instagram', 'messenger'], triggerAction: 'auto_reply', replyTemplate: 'Visa processing is our specialty! We have a 95% visa success rate. Share your target country.', isActive: true, leadsGenerated: 156 },
  { id: 'KW-004', keyword: 'UK', platforms: ['facebook', 'instagram', 'linkedin'], triggerAction: 'create_lead', replyTemplate: 'UK is our most popular destination! We work with 160+ UK universities. What course are you interested in?', isActive: true, leadsGenerated: 312 },
  { id: 'KW-005', keyword: 'Canada', platforms: ['facebook', 'instagram'], triggerAction: 'auto_reply', replyTemplate: 'Great choice! Canada offers excellent post-study work options. Share your academic background.', isActive: true, leadsGenerated: 198 },
  { id: 'KW-006', keyword: 'Australia', platforms: ['facebook', 'instagram'], triggerAction: 'send_dm', replyTemplate: 'Australia has world-class universities! Nursing, IT, and Engineering are top choices. What is your field?', isActive: true, leadsGenerated: 145 },
  { id: 'KW-007', keyword: 'Scholarship', platforms: ['facebook', 'instagram', 'messenger'], triggerAction: 'create_lead', replyTemplate: 'Scholarships available! We help match you with the best options. Share your GPA and target country.', isActive: true, leadsGenerated: 267 },
  { id: 'KW-008', keyword: 'Apply', platforms: ['facebook', 'instagram'], triggerAction: 'auto_reply', replyTemplate: 'Application process starts here! Visit aloeducation.com or our Dhaka office. Our counselor will guide you.', isActive: false, leadsGenerated: 89 },
];

interface DmSequence {
  id: string;
  name: string;
  triggerCondition: string;
  steps: { type: 'dm' | 'email' | 'whatsapp'; content: string; delay: string }[];
  status: 'active' | 'paused' | 'draft';
  totalSent: number;
  responseRate: number;
}

const dmSequences: DmSequence[] = [
  { id: 'DM-001', name: 'New Comment Welcome', triggerCondition: 'First comment on any post', steps: [{ type: 'dm', content: 'Thank you for engaging! How can ALO Education help you?', delay: 'Instant' }, { type: 'dm', content: 'Would you like to know about our free consultation?', delay: '24 hours' }, { type: 'whatsapp', content: 'Follow-up on social media inquiry', delay: '48 hours' }], status: 'active', totalSent: 456, responseRate: 32 },
  { id: 'DM-002', name: 'Scholarship Interest Follow-up', triggerCondition: 'Commented "Scholarship"', steps: [{ type: 'dm', content: 'Here are current scholarship opportunities!', delay: 'Instant' }, { type: 'dm', content: 'Deadline reminder for scholarship application', delay: '3 days' }], status: 'active', totalSent: 189, responseRate: 45 },
  { id: 'DM-003', name: 'IELTS Inquiry Sequence', triggerCondition: 'Commented "IELTS"', steps: [{ type: 'dm', content: 'Free IELTS assessment available!', delay: 'Instant' }, { type: 'email', content: 'IELTS preparation guide PDF', delay: '1 hour' }, { type: 'whatsapp', content: 'Book free IELTS consultation', delay: '24 hours' }], status: 'active', totalSent: 234, responseRate: 38 },
  { id: 'DM-004', name: 'Re-engagement Campaign', triggerCondition: 'No interaction in 30 days', steps: [{ type: 'dm', content: 'We miss you! New courses available.', delay: 'Instant' }], status: 'paused', totalSent: 78, responseRate: 12 },
];

// ============================================================
// Component
// ============================================================

export default function SocialMediaAutomationView() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentAutoReply, setCommentAutoReply] = useState<Record<string, boolean>>({
    facebook: true, instagram: true, messenger: true, linkedin: false, tiktok: false,
  });
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordPlatform, setNewKeywordPlatform] = useState<Platform>('facebook');

  const filteredMessages = useMemo(() => {
    return inboxMessages.filter(m => {
      if (platformFilter !== 'all' && m.platform !== platformFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return m.senderName.toLowerCase().includes(q) || m.message.toLowerCase().includes(q);
      }
      return true;
    });
  }, [platformFilter, searchQuery]);

  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return c.commenter.toLowerCase().includes(q) || c.commentText.toLowerCase().includes(q);
      }
      return true;
    });
  }, [platformFilter, searchQuery]);

  const connectedAccounts = [
    { platform: 'facebook' as Platform, account: 'ALO Education', status: 'connected', followers: 24850 },
    { platform: 'instagram' as Platform, account: '@aloeducation', status: 'connected', followers: 18920 },
    { platform: 'messenger' as Platform, account: 'ALO Education Page', status: 'connected', followers: 15600 },
    { platform: 'linkedin' as Platform, account: 'ALO Education Ltd', status: 'connected', followers: 12340 },
    { platform: 'tiktok' as Platform, account: '@aloeducation', status: 'not_connected', followers: 0 },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Social Media Automation</h1>
          <p className="text-sm text-gray-500">Comment-to-Lead, Keyword Triggers & Auto DM</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-[11px] bg-orange-50 text-orange-600 border-orange-200">
            <Share2 className="w-3 h-3 mr-1" />Marketing Manager
          </Badge>
        </div>
      </div>

      {/* Connected Accounts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {connectedAccounts.map(acc => {
          const config = platformConfig[acc.platform];
          const Icon = config.icon;
          return (
            <Card key={acc.platform} className="bg-white border border-gray-100">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{config.label}</p>
                    <p className="text-[10px] text-gray-500 truncate">{acc.account}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${acc.status === 'connected' ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                {acc.followers > 0 && (
                  <p className="text-[10px] text-gray-400">{acc.followers.toLocaleString()} followers</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-100">
          <TabsTrigger value="inbox"><MessageCircle className="w-4 h-4 mr-1" />Social Inbox</TabsTrigger>
          <TabsTrigger value="comments"><Zap className="w-4 h-4 mr-1" />Comment Automation</TabsTrigger>
          <TabsTrigger value="keywords"><Hash className="w-4 h-4 mr-1" />Keyword Triggers</TabsTrigger>
          <TabsTrigger value="dm"><Send className="w-4 h-4 mr-1" />Auto DM Manager</TabsTrigger>
        </TabsList>

        {/* Social Inbox */}
        <TabsContent value="inbox">
          <div className="flex flex-col lg:flex-row gap-4 mt-4">
            {/* Messages List */}
            <Card className="bg-white border border-gray-100 flex-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900">Messages</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">{filteredMessages.length} messages</Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search messages..." className="pl-9 h-8 text-xs" />
                  </div>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {Object.entries(platformConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {filteredMessages.map(msg => {
                    const config = platformConfig[msg.platform];
                    const Icon = config.icon;
                    return (
                      <div key={msg.id} className={`p-3 rounded-lg border-l-4 ${config.bg} bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer`}>
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
                            {msg.senderAvatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-900">{msg.senderName}</span>
                                {!msg.isRead && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                              </div>
                              <div className="flex items-center gap-1">
                                <Icon className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] text-gray-400">{msg.time}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{msg.message}</p>
                            {msg.isAiSuggested && msg.suggestedReply && (
                              <div className="mt-2 p-2 rounded bg-purple-50 border border-purple-100">
                                <div className="flex items-center gap-1 mb-1">
                                  <Sparkles className="w-3 h-3 text-purple-500" />
                                  <span className="text-[10px] font-medium text-purple-600">AI Suggested Reply</span>
                                </div>
                                <p className="text-[11px] text-purple-700">{msg.suggestedReply}</p>
                                <div className="flex gap-1.5 mt-1.5">
                                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-6 text-[10px] bg-purple-500 hover:bg-purple-600 px-2">Send</Button>
                                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="h-6 text-[10px] px-2">Edit</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comment Automation */}
        <TabsContent value="comments">
          <div className="mt-4 space-y-4">
            {/* Auto Reply Toggles */}
            <Card className="bg-white border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" /> Comment Auto-Reply Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(commentAutoReply).map(([platform, enabled]) => {
                    const config = platformConfig[platform as Platform];
                    const Icon = config.icon;
                    return (
                      <div key={platform} className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-xs font-medium text-gray-700 flex-1">{config.label}</span>
                        <Switch checked={enabled} onCheckedChange={(v) => setCommentAutoReply(prev => ({ ...prev, [platform]: v }))} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 mt-3 p-2 bg-orange-50 rounded-lg">
                  <Switch checked={true} />
                  <span className="text-xs text-orange-700">Comment-to-DM automation enabled (sends DM after auto-reply where Meta rules allow)</span>
                </div>
              </CardContent>
            </Card>

            {/* Comments Table */}
            <Card className="bg-white border border-gray-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900">Recent Comments</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="muted" className="text-[10px]">{filteredComments.length} comments</Badge>
                    <Badge variant="success" className="text-[10px]">{comments.filter(c => c.convertedToLead).length} leads</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Platform</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Post</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Commenter</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Comment</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Auto-Reply</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Lead</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComments.map(c => {
                        const config = platformConfig[c.platform];
                        const Icon = config.icon;
                        return (
                          <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2.5">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-5 h-5 rounded ${config.bg} flex items-center justify-center`}>
                                  <Icon className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-[11px] text-gray-500">{config.label}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-xs text-gray-700 max-w-[120px] truncate">{c.postTitle}</td>
                            <td className="py-2.5 text-xs font-medium text-gray-900">{c.commenter}</td>
                            <td className="py-2.5 text-xs text-gray-600 max-w-[150px] truncate">{c.commentText}</td>
                            <td className="py-2.5">
                              {c.autoReplyStatus === 'sent' ? (
                                <Badge className="text-[9px] bg-green-100 text-green-700"><CheckCircle className="w-2.5 h-2.5 mr-0.5" />Sent</Badge>
                              ) : c.autoReplyStatus === 'pending' ? (
                                <Badge className="text-[9px] bg-yellow-100 text-yellow-700"><Clock className="w-2.5 h-2.5 mr-0.5" />Pending</Badge>
                              ) : (
                                <Badge variant="muted" className="text-[9px]"><XCircle className="w-2.5 h-2.5 mr-0.5" />Off</Badge>
                              )}
                            </td>
                            <td className="py-2.5">
                              {c.convertedToLead ? (
                                <Badge className="text-[9px] bg-blue-100 text-blue-700"><Target className="w-2.5 h-2.5 mr-0.5" />{c.leadId}</Badge>
                              ) : (
                                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => { /* convert to lead */ }}>
                                  <Target className="w-3 h-3 mr-0.5" />Convert
                                </Button>
                              )}
                            </td>
                            <td className="py-2.5 text-right">
                              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="h-7 w-7 p-0"><Eye className="w-3.5 h-3.5" /></Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Keyword Triggers */}
        <TabsContent value="keywords">
          <div className="mt-4 space-y-4">
            <Card className="bg-white border border-gray-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-orange-500" /> Keyword Triggers
                  </CardTitle>
                  <Button size="sm" className="h-7 text-xs bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddKeyword(!showAddKeyword)}>
                    <Plus className="w-3.5 h-3.5 mr-1" />Add Keyword
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddKeyword && (
                  <div className="p-3 mb-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder="Enter keyword..." className="h-8 text-xs" />
                      <Select value={newKeywordPlatform} onValueChange={v => setNewKeywordPlatform(v as Platform)}>
                        <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(platformConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-8 text-xs bg-orange-500">Add</Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowAddKeyword(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Keyword</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Platforms</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Action</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500">Reply Template</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500 text-center">Leads</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500 text-center">Status</th>
                        <th className="pb-2 text-[11px] font-medium text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywords.map(kw => (
                        <tr key={kw.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5">
                            <span className="text-xs font-bold text-orange-600">{kw.keyword}</span>
                          </td>
                          <td className="py-2.5">
                            <div className="flex gap-1">
                              {kw.platforms.map(p => {
                                const config = platformConfig[p];
                                const Icon = config.icon;
                                return (
                                  <div key={p} className={`w-5 h-5 rounded ${config.bg} flex items-center justify-center`} title={config.label}>
                                    <Icon className="w-3 h-3 text-white" />
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-2.5">
                            <Badge variant="outline" className="text-[9px]">{kw.triggerAction.replace('_', ' ')}</Badge>
                          </td>
                          <td className="py-2.5 text-[11px] text-gray-600 max-w-[200px] truncate">{kw.replyTemplate}</td>
                          <td className="py-2.5 text-center">
                            <span className="text-xs font-semibold text-gray-900">{kw.leadsGenerated}</span>
                          </td>
                          <td className="py-2.5 text-center">
                            <Switch checked={kw.isActive} />
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex justify-end gap-1">
                              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="h-7 w-7 p-0"><Edit className="w-3 h-3" /></Button>
                              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="h-7 w-7 p-0"><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Auto DM Manager */}
        <TabsContent value="dm">
          <div className="mt-4 space-y-4">
            <Card className="bg-white border border-gray-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-orange-500" /> Auto DM Sequences
                  </CardTitle>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-7 text-xs bg-orange-500"><Plus className="w-3.5 h-3.5 mr-1" />New Sequence</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dmSequences.map(seq => (
                    <div key={seq.id} className="p-3 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{seq.name}</span>
                          <Badge className={`text-[9px] ${seq.status === 'active' ? 'bg-green-100 text-green-700' : seq.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {seq.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">{seq.totalSent} sent</span>
                          <span className="text-[10px] text-green-600 font-medium">{seq.responseRate}% response</span>
                          <Switch checked={seq.status === 'active'} />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-2">Trigger: {seq.triggerCondition}</p>
                      <div className="flex items-center gap-2">
                        {seq.steps.map((step, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="px-2 py-1 rounded bg-gray-50 border border-gray-100">
                              <p className="text-[10px] font-medium text-gray-600">
                                {step.type === 'dm' ? 'DM' : step.type === 'email' ? 'Email' : 'WhatsApp'}
                              </p>
                              <p className="text-[9px] text-gray-400">{step.delay}</p>
                            </div>
                            {i < seq.steps.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opt-out Management */}
            <Card className="bg-white border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Opt-out & Block Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Auto opt-out detection</p>
                    <p className="text-[10px] text-gray-500">Users who reply STOP, UNSUBSCRIBE, or BLOCK are automatically removed</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="px-3 py-2 rounded bg-red-50 border border-red-100">
                    <p className="text-xs font-bold text-red-600">23</p>
                    <p className="text-[10px] text-red-500">Blocked Users</p>
                  </div>
                  <div className="px-3 py-2 rounded bg-yellow-50 border border-yellow-100">
                    <p className="text-xs font-bold text-yellow-600">12</p>
                    <p className="text-[10px] text-yellow-500">Unsubscribed</p>
                  </div>
                  <div className="px-3 py-2 rounded bg-green-50 border border-green-100">
                    <p className="text-xs font-bold text-green-600">8,456</p>
                    <p className="text-[10px] text-green-500">Active DM Contacts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
