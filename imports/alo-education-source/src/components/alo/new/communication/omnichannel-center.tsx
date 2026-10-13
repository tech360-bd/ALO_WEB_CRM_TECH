'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft, MessageSquare, Mail, Phone, Send, Paperclip,
  Search, ChevronRight, Clock, CheckCircle2, CheckCheck,
  Users, Radio, UserPlus, FileText, Reply, Sparkles,
  Hash, Video, Bell, BellOff, Settings, MoreHorizontal,
  MessageCircle, Bot, Globe, Calendar, X
} from 'lucide-react';

// Types
type Channel = 'all' | 'whatsapp' | 'email' | 'sms' | 'telegram';

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  channel: Channel;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  isOnline: boolean;
  isTyping: boolean;
  studentId?: string;
}

interface Message {
  id: string;
  conversationId: string;
  text: string;
  sender: 'agent' | 'contact';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  attachments?: string[];
}

interface TemplateMessage {
  id: string;
  name: string;
  channel: Channel[];
  content: string;
  category: string;
}

interface WhatsAppConfig {
  businessName: string;
  phoneNumber: string;
  autoReplyEnabled: boolean;
  awayMessageEnabled: boolean;
  awayMessage: string;
  greetingMessage: string;
  businessHours: string;
}

// Channel icons
const CHANNEL_ICONS: Record<Channel, React.ElementType> = {
  all: MessageSquare,
  whatsapp: MessageCircle,
  email: Mail,
  sms: Phone,
  telegram: Send,
};

const CHANNEL_COLORS: Record<Channel, string> = {
  all: '#6b7280',
  whatsapp: '#25D366',
  email: '#bf4520',
  sms: '#3B82F6',
  telegram: '#0088cc',
};

// Mock Data
const CONVERSATIONS: Conversation[] = [
  { id: 'c1', name: 'Rahul Sharma', avatar: 'RS', channel: 'whatsapp', lastMessage: 'Thank you for the UK university list!', lastMessageTime: '2 min ago', unread: 2, isOnline: true, isTyping: false, studentId: 'STU001' },
  { id: 'c2', name: 'Priya Patel', avatar: 'PP', channel: 'email', lastMessage: 'I\'ve attached my SOP draft for review', lastMessageTime: '15 min ago', unread: 1, isOnline: false, isTyping: false, studentId: 'STU002' },
  { id: 'c3', name: 'Amit Kumar', avatar: 'AK', channel: 'whatsapp', lastMessage: 'When is the next IELTS batch starting?', lastMessageTime: '1 hr ago', unread: 0, isOnline: true, isTyping: false, studentId: 'STU003' },
  { id: 'c4', name: 'Sneha Reddy', avatar: 'SR', channel: 'sms', lastMessage: 'Confirmed: Visa appointment on March 15', lastMessageTime: '2 hrs ago', unread: 0, isOnline: false, isTyping: false, studentId: 'STU004' },
  { id: 'c5', name: 'Vikram Singh', avatar: 'VS', channel: 'telegram', lastMessage: 'Can you send me the scholarship form?', lastMessageTime: '3 hrs ago', unread: 3, isOnline: true, isTyping: true, studentId: 'STU005' },
  { id: 'c6', name: 'Ananya Gupta', avatar: 'AG', channel: 'whatsapp', lastMessage: 'My IELTS score is 7.5! 🎉', lastMessageTime: '4 hrs ago', unread: 0, isOnline: true, isTyping: false, studentId: 'STU006' },
  { id: 'c7', name: 'Karan Mehta', avatar: 'KM', channel: 'email', lastMessage: 'Please find my application documents attached', lastMessageTime: '5 hrs ago', unread: 1, isOnline: false, isTyping: false, studentId: 'STU007' },
  { id: 'c8', name: 'Deepa Nair', avatar: 'DN', channel: 'whatsapp', lastMessage: 'Is the Canada intake still open?', lastMessageTime: '1 day ago', unread: 0, isOnline: false, isTyping: false, studentId: 'STU008' },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  c1: [
    { id: 'm1', conversationId: 'c1', text: 'Hi, I\'m interested in studying in the UK', sender: 'contact', timestamp: '10:00 AM', status: 'read' },
    { id: 'm2', conversationId: 'c1', text: 'Hello Rahul! Great to hear from you. The UK has some fantastic universities. Let me share our curated list of top UK institutions for Indian students.', sender: 'agent', timestamp: '10:01 AM', status: 'read' },
    { id: 'm3', conversationId: 'c1', text: 'Here are our top picks:\n1. University of Oxford\n2. Imperial College London\n3. UCL\n4. University of Manchester\n5. University of Edinburgh\n\nWould you like more details on any of these?', sender: 'agent', timestamp: '10:02 AM', status: 'delivered' },
    { id: 'm4', conversationId: 'c1', text: 'Thank you for the UK university list!', sender: 'contact', timestamp: '10:05 AM', status: 'read' },
  ],
  c5: [
    { id: 'm5', conversationId: 'c5', text: 'Hi, I\'m looking for scholarships for MS in Computer Science', sender: 'contact', timestamp: '2:00 PM', status: 'read' },
    { id: 'm6', conversationId: 'c5', text: 'Can you send me the scholarship form?', sender: 'contact', timestamp: '2:01 PM', status: 'read' },
  ],
};

const TEMPLATE_MESSAGES: TemplateMessage[] = [
  { id: 't1', name: 'Welcome Message', channel: ['whatsapp', 'telegram'], content: 'Welcome to ALO Education! 🎓 We\'re here to help you achieve your study abroad dreams. How can we assist you today?', category: 'Greeting' },
  { id: 't2', name: 'Document Request', channel: ['whatsapp', 'email', 'sms'], content: 'To proceed with your application, we\'ll need the following documents:\n• Academic transcripts\n• Passport copy\n• English test scores\n• Statement of Purpose\n\nPlease share at your earliest convenience.', category: 'Application' },
  { id: 't3', name: 'Application Update', channel: ['whatsapp', 'email'], content: 'Great news! Your application to {university} has been {status}. Our team will reach out shortly with next steps.', category: 'Application' },
  { id: 't4', name: 'Appointment Reminder', channel: ['whatsapp', 'sms'], content: 'Reminder: You have a counseling session scheduled for {date} at {time}. Please join 5 minutes early. Meeting link: {link}', category: 'Scheduling' },
  { id: 't5', name: 'Visa Appointment', channel: ['whatsapp', 'email', 'sms'], content: 'Your visa appointment is confirmed for {date} at {location}. Please bring:\n• Passport\n• Offer letter\n• Financial documents\n• Biometrics receipt', category: 'Visa' },
  { id: 't6', name: 'IELTS Score Congrats', channel: ['whatsapp'], content: 'Congratulations on your IELTS score! 🎉 That\'s a great achievement. Ready to start shortlisting universities? Book a free consultation: aloeducation.com/consult', category: 'Celebration' },
];

const WHATSAPP_CONFIG: WhatsAppConfig = {
  businessName: 'ALO Education',
  phoneNumber: '+91 98765 43210',
  autoReplyEnabled: true,
  awayMessageEnabled: false,
  awayMessage: 'Thank you for reaching out to ALO Education. Our team is currently away. We\'ll respond within 24 hours during business hours (Mon-Sat, 9 AM - 7 PM IST).',
  greetingMessage: 'Welcome to ALO Education! 🎓 We help students achieve their dream of studying abroad. Type your query or select an option:\n1. Course Inquiry\n2. Application Status\n3. Visa Help\n4. Talk to Counselor',
  businessHours: 'Mon-Sat, 9:00 AM - 7:00 PM IST',
};

const BROADCAST_SEGMENTS = [
  { id: 'all', name: 'All Students', count: 1240 },
  { id: 'uk-bound', name: 'UK Bound Students', count: 320 },
  { id: 'australia-bound', name: 'Australia Bound', count: 280 },
  { id: 'canada-bound', name: 'Canada Bound', count: 195 },
  { id: 'ielts-prep', name: 'IELTS Preparation', count: 450 },
  { id: 'app-pending', name: 'Application Pending', count: 88 },
  { id: 'visa-stage', name: 'Visa Stage', count: 62 },
];

interface OmnichannelCenterProps {
  onBack?: () => void;
  onNavigate?: (page: string, slug?: string) => void;
}

export function OmnichannelCenter({ onBack, onNavigate }: OmnichannelCenterProps) {
  const [activeChannel, setActiveChannel] = useState<Channel>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainTab, setActiveMainTab] = useState('inbox');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastSegment, setBroadcastSegment] = useState('all');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [waConfig, setWaConfig] = useState(WHATSAPP_CONFIG);

  const filteredConversations = CONVERSATIONS.filter(c => {
    if (activeChannel !== 'all' && c.channel !== activeChannel) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const messages = selectedConversation ? (MOCK_MESSAGES[selectedConversation.id] || []) : [];

  const sendMessage = useCallback(() => {
    if (!messageDraft.trim() || !selectedConversation) return;
    // In production, this would POST to /api/communications/channels
    setMessageDraft('');
  }, [messageDraft, selectedConversation]);

  const totalUnread = CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

  const ChannelIcon = ({ channel, className }: { channel: Channel; className?: string }) => {
    const Icon = CHANNEL_ICONS[channel];
    return <Icon className={className} style={{ color: CHANNEL_COLORS[channel] }} />;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <header className="bg-[#2d3142] text-white px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1 text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold">Omnichannel Communications</h1>
              <p className="text-xs text-white/50">WhatsApp, Email, SMS & Telegram in one place</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <Badge className="text-xs bg-[#bf4520] text-white" style={{ borderRadius: '4px' }}>
                {totalUnread} Unread
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs bg-white/10 text-white/70" style={{ borderRadius: '4px' }}>
              frappe CRM
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Tabs */}
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1 flex flex-col">
        <div className="bg-white border-b border-[#e5e7eb] px-4">
          <div className="max-w-[1400px] mx-auto overflow-x-auto">
            <TabsList className="bg-transparent h-10 gap-0.5 p-0">
              {[
                { value: 'inbox', icon: MessageSquare, label: 'Inbox' },
                { value: 'templates', icon: FileText, label: 'Templates' },
                { value: 'broadcast', icon: Radio, label: 'Broadcast' },
                { value: 'whatsapp-config', icon: MessageCircle, label: 'WhatsApp Config' },
                { value: 'timeline', icon: Calendar, label: 'Timeline' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#bf4520] data-[state=active]:text-[#2d3142] data-[state=active]:font-semibold text-[#6b7280] h-10 rounded-none px-3 text-xs whitespace-nowrap"
                >
                  <tab.icon className="h-3.5 w-3.5 mr-1.5" />
                  {tab.label}
                  {tab.value === 'inbox' && totalUnread > 0 && (
                    <span className="ml-1 bg-[#bf4520] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* INBOX */}
        <TabsContent value="inbox" className="flex-1 m-0 overflow-hidden">
          <div className="h-full flex" style={{ minHeight: 'calc(100vh - 120px)' }}>
            {/* Left: Conversation List */}
            <div className="w-full lg:w-80 xl:w-96 border-r border-[#e5e7eb] bg-white flex flex-col">
              {/* Channel Tabs */}
              <div className="border-b border-[#e5e7eb] p-2">
                <div className="flex gap-1">
                  {(['all', 'whatsapp', 'email', 'sms', 'telegram'] as Channel[]).map(ch => (
                    <button
                      key={ch}
                      onClick={() => setActiveChannel(ch)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                        activeChannel === ch
                          ? 'bg-[#bf4520]/10 text-[#bf4520]'
                          : 'text-[#6b7280] hover:bg-[#f5f5f5]'
                      }`}
                      style={{ borderRadius: '4px' }}
                    >
                      <ChannelIcon channel={ch} className="h-3 w-3" />
                      <span className="hidden sm:inline capitalize">{ch}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="pl-8 bg-[#f5f5f5] border-[#e5e7eb] text-sm h-8"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-3 border-b border-[#f5f5f5] hover:bg-[#f5f5f5] transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-[#bf4520]/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative shrink-0">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-[#2d3142] text-white text-xs">{conv.avatar}</AvatarFallback>
                        </Avatar>
                        {conv.isOnline && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#2d3142] truncate">{conv.name}</span>
                          <span className="text-[10px] text-[#9ca3af] shrink-0 ml-2">{conv.lastMessageTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ChannelIcon channel={conv.channel} className="h-3 w-3 shrink-0" />
                          <p className="text-xs text-[#6b7280] truncate">{conv.lastMessage}</p>
                        </div>
                        {conv.isTyping && (
                          <p className="text-[10px] text-[#bf4520] mt-0.5">typing...</p>
                        )}
                      </div>
                      {conv.unread > 0 && (
                        <span className="bg-[#bf4520] text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Chat View */}
            <div className="hidden lg:flex flex-1 flex-col bg-[#f5f5f5]">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-[#e5e7eb] px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#2d3142] text-white text-xs">{selectedConversation.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-semibold text-[#2d3142]">{selectedConversation.name}</h3>
                        <div className="flex items-center gap-1.5">
                          <ChannelIcon channel={selectedConversation.channel} className="h-3 w-3" />
                          <span className="text-[10px] text-[#6b7280]">
                            {selectedConversation.isOnline ? 'Online' : 'Offline'} · {selectedConversation.channel}
                          </span>
                          {selectedConversation.studentId && (
                            <>
                              <span className="text-[10px] text-[#9ca3af]">·</span>
                              <span className="text-[10px] text-[#bf4520]">{selectedConversation.studentId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Send via WhatsApp">
                        <MessageCircle className="h-4 w-4 text-[#25D366]" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Send via Email">
                        <Mail className="h-4 w-4 text-[#bf4520]" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="More options">
                        <MoreHorizontal className="h-4 w-4 text-[#6b7280]" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-12 text-[#9ca3af]">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    )}
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-3 py-2 rounded-lg ${
                          msg.sender === 'agent'
                            ? 'bg-[#bf4520] text-white'
                            : 'bg-white text-[#2d3142] border border-[#e5e7eb]'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            msg.sender === 'agent' ? 'text-white/60' : 'text-[#9ca3af]'
                          }`}>
                            <span className="text-[10px]">{msg.timestamp}</span>
                            {msg.sender === 'agent' && (
                              msg.status === 'read' ? <CheckCheck className="h-3 w-3" /> :
                              msg.status === 'delivered' ? <CheckCheck className="h-3 w-3" /> :
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedConversation.isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-[#e5e7eb] px-3 py-2 rounded-lg">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-[#9ca3af] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Replies */}
                  <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
                    {TEMPLATE_MESSAGES.filter(t => t.channel.includes(selectedConversation.channel)).slice(0, 3).map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => setMessageDraft(tpl.content)}
                        className="shrink-0 text-[10px] px-2.5 py-1 bg-white border border-[#e5e7eb] rounded-full text-[#2d3142] hover:border-[#bf4520]/30 transition-colors"
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="bg-white border-t border-[#e5e7eb] p-3">
                    <div className="flex items-end gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0">
                        <Paperclip className="h-4 w-4 text-[#6b7280]" />
                      </Button>
                      <Textarea
                        value={messageDraft}
                        onChange={e => setMessageDraft(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#f5f5f5] border-[#e5e7eb] text-sm min-h-[36px] max-h-[120px] resize-none"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!messageDraft.trim()}
                        size="sm"
                        className="bg-[#bf4520] hover:bg-[#a33a1a] text-white h-8 w-8 p-0 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#9ca3af]">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Select a conversation</p>
                    <p className="text-xs mt-1">Choose from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="flex-1 m-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#2d3142] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#bf4520]" />
              Message Templates
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEMPLATE_MESSAGES.map(tpl => (
                <Card key={tpl.id} className="bg-white" style={{ borderRadius: '8px' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-[#2d3142]">{tpl.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="text-[10px]" style={{ borderRadius: '4px' }}>
                            {tpl.category}
                          </Badge>
                          {tpl.channel.map(ch => (
                            <span key={ch} className="text-[10px] capitalize text-[#9ca3af]">
                              {ch}{tpl.channel.indexOf(ch) < tpl.channel.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#6b7280] whitespace-pre-wrap bg-[#f5f5f5] p-2 rounded mt-2" style={{ borderRadius: '4px' }}>
                      {tpl.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* BROADCAST */}
        <TabsContent value="broadcast" className="flex-1 m-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#2d3142] flex items-center gap-2">
              <Radio className="h-5 w-5 text-[#bf4520]" />
              Broadcast Message
            </h2>

            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#2d3142] mb-1.5 block">Audience Segment</label>
                  <Select value={broadcastSegment} onValueChange={setBroadcastSegment}>
                    <SelectTrigger className="bg-[#f5f5f5] border-[#e5e7eb]">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {BROADCAST_SEGMENTS.map(seg => (
                        <SelectItem key={seg.id} value={seg.id}>
                          {seg.name} ({seg.count} students)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2d3142] mb-1.5 block">Channel</label>
                  <div className="flex gap-2">
                    {(['whatsapp', 'email', 'sms'] as Channel[]).map(ch => (
                      <button
                        key={ch}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] rounded text-xs text-[#2d3142] hover:bg-[#e8e8e8] transition-colors"
                        style={{ borderRadius: '6px' }}
                      >
                        <ChannelIcon channel={ch} className="h-3.5 w-3.5" />
                        <span className="capitalize">{ch}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2d3142] mb-1.5 block">Message</label>
                  <Textarea
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    placeholder="Type your broadcast message..."
                    className="bg-[#f5f5f5] border-[#e5e7eb] min-h-[120px]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#6b7280]">
                    Will be sent to {BROADCAST_SEGMENTS.find(s => s.id === broadcastSegment)?.count.toLocaleString()} students
                  </p>
                  <Button
                    className="bg-[#bf4520] hover:bg-[#a33a1a] text-white"
                    disabled={!broadcastMessage.trim()}
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    Send Broadcast
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* WHATSAPP CONFIG */}
        <TabsContent value="whatsapp-config" className="flex-1 m-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#2d3142] flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
              WhatsApp Business Configuration
            </h2>

            {/* Business Profile */}
            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardHeader>
                <CardTitle className="text-sm text-[#2d3142]">Business Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded" style={{ borderRadius: '4px' }}>
                  <div>
                    <p className="text-sm font-medium text-[#2d3142]">{waConfig.businessName}</p>
                    <p className="text-xs text-[#6b7280]">{waConfig.phoneNumber}</p>
                  </div>
                  <Badge className="text-xs bg-emerald-50 text-emerald-700" style={{ borderRadius: '4px' }}>Connected</Badge>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Business Hours</label>
                  <p className="text-sm text-[#2d3142]">{waConfig.businessHours}</p>
                </div>
              </CardContent>
            </Card>

            {/* Auto Replies */}
            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardHeader>
                <CardTitle className="text-sm text-[#2d3142]">Auto Reply Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#2d3142]">Auto-Reply (Greeting)</p>
                    <p className="text-xs text-[#6b7280]">Send greeting when customer first messages</p>
                  </div>
                  <Switch
                    checked={waConfig.autoReplyEnabled}
                    onCheckedChange={checked => setWaConfig(prev => ({ ...prev, autoReplyEnabled: checked }))}
                  />
                </div>
                {waConfig.autoReplyEnabled && (
                  <div className="bg-[#f5f5f5] p-3 rounded text-xs text-[#2d3142] whitespace-pre-wrap" style={{ borderRadius: '4px' }}>
                    {waConfig.greetingMessage}
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#2d3142]">Away Message</p>
                    <p className="text-xs text-[#6b7280]">Auto-reply outside business hours</p>
                  </div>
                  <Switch
                    checked={waConfig.awayMessageEnabled}
                    onCheckedChange={checked => setWaConfig(prev => ({ ...prev, awayMessageEnabled: checked }))}
                  />
                </div>
                {waConfig.awayMessageEnabled && (
                  <Textarea
                    value={waConfig.awayMessage}
                    onChange={e => setWaConfig(prev => ({ ...prev, awayMessage: e.target.value }))}
                    className="bg-[#f5f5f5] border-[#e5e7eb] text-sm min-h-[80px]"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TIMELINE */}
        <TabsContent value="timeline" className="flex-1 m-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#2d3142] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#bf4520]" />
              Student Communication Timeline
            </h2>

            <Card className="bg-white" style={{ borderRadius: '8px' }}>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {[
                    { time: 'Today, 10:05 AM', event: 'WhatsApp message from Rahul Sharma', detail: '"Thank you for the UK university list!"', channel: 'whatsapp' },
                    { time: 'Today, 9:45 AM', event: 'Email received from Priya Patel', detail: 'SOP draft for review', channel: 'email' },
                    { time: 'Yesterday, 4:30 PM', event: 'SMS sent to Sneha Reddy', detail: 'Visa appointment confirmation', channel: 'sms' },
                    { time: 'Yesterday, 2:00 PM', event: 'WhatsApp: Ananya Gupta shared IELTS score', detail: 'Score: 7.5 Overall', channel: 'whatsapp' },
                    { time: 'Mar 3, 11:00 AM', event: 'Broadcast sent to UK Bound Students', detail: '320 recipients via WhatsApp', channel: 'whatsapp' },
                    { time: 'Mar 2, 3:15 PM', event: 'Telegram message from Vikram Singh', detail: 'Scholarship form request', channel: 'telegram' },
                    { time: 'Mar 1, 10:00 AM', event: 'Auto-reply sent via WhatsApp', detail: 'Greeting message to new contact', channel: 'whatsapp' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="h-8 w-8 bg-[#f5f5f5] rounded-full flex items-center justify-center" style={{ borderRadius: '50%' }}>
                          <ChannelIcon channel={item.channel as Channel} className="h-4 w-4" />
                        </div>
                        {i < 6 && <div className="w-px h-full bg-[#e5e7eb] mt-1" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="text-sm font-medium text-[#2d3142]">{item.event}</p>
                        <p className="text-xs text-[#6b7280] mt-0.5">{item.detail}</p>
                        <p className="text-[10px] text-[#9ca3af] mt-1">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
