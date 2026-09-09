'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle, Search, Send, Phone, Video, MoreVertical,
  Smile, Paperclip, Mic, Check, CheckCheck, Clock, Users,
  Zap, TrendingUp, BarChart3, ArrowRight, ChevronLeft,
  Reply, Image, MapPin, FileText, X,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  contactName: string;
  phone: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  messages: ChatMessage[];
  tags: string[];
}

interface QuickReply {
  id: string;
  title: string;
  message: string;
  category: string;
}

const defaultConversations: Conversation[] = [
  {
    id: 'CONV-001', contactName: 'Arif Rahman', phone: '+880 1712-345678', avatar: 'AR',
    lastMessage: 'Thank you for the visa guidance!', lastMessageTime: '10:45 AM',
    unreadCount: 2, isOnline: true, tags: ['UK', 'Visa'],
    messages: [
      { id: 'M1', text: 'Hi, I need help with my UK student visa application.', sender: 'them', timestamp: '10:30 AM', status: 'read' },
      { id: 'M2', text: 'Hello Arif! Of course, I would be happy to help. Could you share your CAS number and current application status?', sender: 'me', timestamp: '10:32 AM', status: 'read' },
      { id: 'M3', text: 'My CAS has been issued. CAS number is UKGla-2025-08923. I have filled the online application but not yet booked biometrics.', sender: 'them', timestamp: '10:35 AM', status: 'read' },
      { id: 'M4', text: 'Great! You need to book your biometric appointment at the nearest VAC. Please carry your passport, CAS letter, and financial documents. The processing time is usually 3-6 weeks.', sender: 'me', timestamp: '10:38 AM', status: 'delivered' },
      { id: 'M5', text: 'What financial documents do I need exactly?', sender: 'them', timestamp: '10:40 AM', status: 'read' },
      { id: 'M6', text: 'You need: Bank statements (28 days minimum), sponsor letter if applicable, and proof of tuition fee payment. The maintenance requirement is £1,334/month for London or £1,023/month outside London.', sender: 'me', timestamp: '10:42 AM', status: 'read' },
      { id: 'M7', text: 'Thank you for the visa guidance!', sender: 'them', timestamp: '10:45 AM', status: 'read' },
    ],
  },
  {
    id: 'CONV-002', contactName: 'Fatima Begum', phone: '+880 1812-987654', avatar: 'FB',
    lastMessage: 'When is my next counselling session?', lastMessageTime: '10:20 AM',
    unreadCount: 0, isOnline: false, tags: ['Counselling', 'Follow-up'],
    messages: [
      { id: 'M1', text: 'Assalamualaikum! I wanted to ask about my application progress.', sender: 'them', timestamp: '9:50 AM', status: 'read' },
      { id: 'M2', text: 'Wa Alaikum Salam Fatima! Your application to University of Leeds has been submitted. We are waiting for the admission decision. Usually takes 2-4 weeks.', sender: 'me', timestamp: '9:55 AM', status: 'read' },
      { id: 'M3', text: 'When is my next counselling session?', sender: 'them', timestamp: '10:20 AM', status: 'read' },
    ],
  },
  {
    id: 'CONV-003', contactName: 'Sakib Hossain', phone: '+880 1612-567890', avatar: 'SH',
    lastMessage: 'Documents uploaded successfully', lastMessageTime: 'Yesterday',
    unreadCount: 1, isOnline: true, tags: ['Documents', 'Upload'],
    messages: [
      { id: 'M1', text: 'I have uploaded my transcripts. Can you verify?', sender: 'them', timestamp: 'Yesterday 4:30 PM', status: 'read' },
      { id: 'M2', text: 'Yes, we received your documents. The transcript verification team will review them by tomorrow.', sender: 'me', timestamp: 'Yesterday 4:35 PM', status: 'read' },
      { id: 'M3', text: 'Documents uploaded successfully', sender: 'them', timestamp: 'Yesterday 5:00 PM', status: 'read' },
    ],
  },
  {
    id: 'CONV-004', contactName: 'Nusrat Jahan', phone: '+880 1512-345670', avatar: 'NJ',
    lastMessage: 'Scholarship application submitted!', lastMessageTime: 'Yesterday',
    unreadCount: 3, isOnline: false, tags: ['Scholarship', 'Urgent'],
    messages: [
      { id: 'M1', text: 'Is there a deadline for the International Excellence Scholarship?', sender: 'them', timestamp: 'Yesterday 2:00 PM', status: 'read' },
      { id: 'M2', text: 'Yes, the deadline is June 30, 2025. You need to submit a 500-word personal statement along with your application.', sender: 'me', timestamp: 'Yesterday 2:10 PM', status: 'delivered' },
      { id: 'M3', text: 'Scholarship application submitted!', sender: 'them', timestamp: 'Yesterday 3:00 PM', status: 'read' },
    ],
  },
  {
    id: 'CONV-005', contactName: 'Tanvir Ahmed', phone: '+880 1912-234567', avatar: 'TA',
    lastMessage: 'Can I schedule a university visit?', lastMessageTime: 'Monday',
    unreadCount: 0, isOnline: false, tags: ['Event', 'University Tour'],
    messages: [
      { id: 'M1', text: 'Hello! I heard there is a university fair next month. Can I register?', sender: 'them', timestamp: 'Monday 11:00 AM', status: 'read' },
      { id: 'M2', text: 'Yes! The UK University Fair is on July 15 at the Pan Pacific Sonargaon. Registration is open. I will send you the link.', sender: 'me', timestamp: 'Monday 11:15 AM', status: 'read' },
      { id: 'M3', text: 'Can I schedule a university visit?', sender: 'them', timestamp: 'Monday 11:30 AM', status: 'read' },
    ],
  },
  {
    id: 'CONV-006', contactName: 'Imran Khan', phone: '+880 1712-876543', avatar: 'IK',
    lastMessage: 'Payment confirmed, thank you!', lastMessageTime: 'Monday',
    unreadCount: 0, isOnline: true, tags: ['Finance', 'Payment'],
    messages: [
      { id: 'M1', text: 'I made the tuition deposit payment of £2,000. Transaction ID: TXN-20250624-001', sender: 'them', timestamp: 'Monday 10:00 AM', status: 'read' },
      { id: 'M2', text: 'Payment confirmed, thank you!', sender: 'me', timestamp: 'Monday 10:30 AM', status: 'read' },
      { id: 'M3', text: 'Payment confirmed, thank you!', sender: 'them', timestamp: 'Monday 10:35 AM', status: 'read' },
    ],
  },
];

const quickReplies: QuickReply[] = [
  { id: 'QR1', title: 'Application Processing', message: 'Your application is being processed. We will notify you once we receive an update from the university. Expected response time: 2-4 weeks.', category: 'Application' },
  { id: 'QR2', title: 'Document Request', message: 'Please bring the following documents to our office: 1) Original passport, 2) Academic transcripts, 3) IELTS certificate, 4) Financial documents.', category: 'Documents' },
  { id: 'QR3', title: 'Interview Scheduled', message: 'Your interview has been scheduled. Please come to the ALO Education Dhaka office on [Date] at [Time]. Bring all original documents.', category: 'Interview' },
  { id: 'QR4', title: 'Visa Guidance', message: 'For your visa application, please ensure you have: valid passport, CAS letter, financial proof, tuberculosis test certificate, and biometric appointment confirmation.', category: 'Visa' },
  { id: 'QR5', title: 'Welcome Message', message: 'Welcome to ALO Education! We are delighted to help you with your study abroad journey. How can we assist you today?', category: 'General' },
  { id: 'QR6', title: 'Follow-up Reminder', message: 'This is a friendly reminder to complete your outstanding documents. Please submit them at your earliest convenience to avoid processing delays.', category: 'Follow-up' },
  { id: 'QR7', title: 'Offer Received', message: 'Congratulations! You have received an offer from the university. Please review the offer conditions and let us know if you would like to accept.', category: 'Application' },
  { id: 'QR8', title: 'Office Hours', message: 'Our office hours are Saturday to Thursday, 10:00 AM to 6:00 PM. You can also reach us at +880 2-88888 during office hours.', category: 'General' },
];

const statsData = [
  { label: 'Active Conversations', value: '24', change: '+3', icon: MessageCircle, color: 'text-green-600 bg-green-100' },
  { label: "Today's Messages", value: '67', change: '+12', icon: Send, color: 'text-blue-600 bg-blue-100' },
  { label: 'Response Rate', value: '94%', change: '+2%', icon: TrendingUp, color: 'text-orange-600 bg-orange-100' },
  { label: 'Avg Response Time', value: '4 min', change: '-1 min', icon: Clock, color: 'text-purple-600 bg-purple-100' },
];

export default function CrmWhatsAppPage() {
  const [conversations, setConversations] = useState<Conversation[]>(defaultConversations);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedConv) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConv?.messages.length]);

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.contactName.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q));
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConv) return;
    const newMessage: ChatMessage = {
      id: `M-${Date.now()}`,
      text: messageInput,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'sent',
    };
    const updatedConvs = conversations.map(c => {
      if (c.id === selectedConv.id) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessage: messageInput,
          lastMessageTime: newMessage.timestamp,
        };
      }
      return c;
    });
    setConversations(updatedConvs);
    setSelectedConv(prev => prev ? { ...prev, messages: [...prev.messages, newMessage], lastMessage: messageInput, lastMessageTime: newMessage.timestamp } : null);
    setMessageInput('');
  };

  const handleSendTemplate = (template: QuickReply) => {
    if (!selectedConv) return;
    const newMessage: ChatMessage = {
      id: `M-${Date.now()}`,
      text: template.message,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'sent',
    };
    const updatedConvs = conversations.map(c => {
      if (c.id === selectedConv.id) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessage: template.message.slice(0, 60),
          lastMessageTime: newMessage.timestamp,
        };
      }
      return c;
    });
    setConversations(updatedConvs);
    setSelectedConv(prev => prev ? { ...prev, messages: [...prev.messages, newMessage], lastMessage: template.message.slice(0, 60), lastMessageTime: newMessage.timestamp } : null);
    setShowTemplates(false);
  };

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    const updated = conversations.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c);
    setConversations(updated);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">WhatsApp</h1>
            <p className="text-sm text-gray-500">Student Communication Hub</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsData.map(stat => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">{stat.change}</span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Chat Layout */}
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-0 flex-1 min-h-0 bg-white rounded-lg border shadow-sm overflow-hidden">
        {/* Left Panel - Conversation List */}
        <div className={`w-full lg:w-80 border-r flex flex-col ${selectedConv ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 h-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelectConv(conv)}
                className={`w-full text-left px-3 py-3 border-b transition-colors hover:bg-gray-50 ${selectedConv?.id === conv.id ? 'bg-green-50 border-l-3 border-l-green-600' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ${conv.isOnline ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {conv.avatar}
                    </div>
                    {conv.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 truncate">{conv.contactName}</span>
                      <span className="text-xs text-gray-400 shrink-0">{conv.lastMessageTime}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-gray-500 truncate flex-1 mr-2">{conv.lastMessage}</span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-green-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {conv.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center Panel - Chat View */}
        <div className={`flex-1 flex flex-col ${!selectedConv ? 'hidden lg:flex' : 'flex'}`}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedConv(null)}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold">
                      {selectedConv.avatar}
                    </div>
                    {selectedConv.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedConv.contactName}</p>
                    <p className="text-xs text-gray-500">{selectedConv.isOnline ? 'Online' : selectedConv.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowTemplates(!showTemplates)}>
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="max-w-2xl mx-auto space-y-3">
                  {selectedConv.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ${msg.sender === 'me' ? 'bg-green-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === 'me' ? 'text-green-200' : 'text-gray-400'}`}>
                          <span className="text-[10px]">{msg.timestamp}</span>
                          {msg.sender === 'me' && (
                            msg.status === 'read' ? <CheckCheck className="h-3 w-3" /> :
                            msg.status === 'delivered' ? <CheckCheck className="h-3 w-3" /> :
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t bg-white">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400">
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder="Type a message..."
                      className="pr-10"
                    />
                  </div>
                  {messageInput.trim() ? (
                    <Button onClick={handleSendMessage} size="icon" className="h-9 w-9 bg-green-600 hover:bg-green-700 shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 shrink-0">
                      <Mic className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <MessageCircle className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-600">WhatsApp Messaging</p>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>

        {/* Right Panel - Quick Replies */}
        <div className={`w-72 border-l bg-white flex flex-col ${showTemplates ? 'flex' : 'hidden lg:flex'}`}>
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-900">Quick Replies</h3>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden h-7 w-7" onClick={() => setShowTemplates(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {quickReplies.map(reply => (
              <button
                key={reply.id}
                onClick={() => handleSendTemplate(reply)}
                className="w-full text-left p-3 rounded-lg border hover:bg-green-50 hover:border-green-200 transition-colors"
                disabled={!selectedConv}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{reply.title}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{reply.category}</Badge>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{reply.message}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
