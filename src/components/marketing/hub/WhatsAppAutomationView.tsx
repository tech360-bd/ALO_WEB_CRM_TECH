'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  MessageCircle,
  Search,
  Send,
  Phone,
  Bot,
  UserCheck,
  Clock,
  AlertTriangle,
  Shield,
  FileUp,
  Upload,
  Zap,
  Globe,
  Lock,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  AlertCircle,
  ArrowRight,
  Timer,
  ShieldCheck,
  Crown,
  Building2,
  Mic,
  Paperclip,
  MoreVertical,
  Star,
  Volume2,
  Download,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type ConvStatus = 'active' | 'waiting' | 'overdue' | 'resolved';
type Assignee = 'unassigned' | 'Rahima Akter' | 'Tanvir Hossain' | 'Nusrat Jahan';

interface Message {
  id: string;
  text: string;
  sender: 'student' | 'agent' | 'ai';
  timestamp: string;
  isAutoReply?: boolean;
}

interface Conversation {
  id: string;
  studentName: string;
  phone: string;
  studentId: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  status: ConvStatus;
  assignee: Assignee;
  appStatus: string;
  counselor: string;
  lastActivity: string;
  aiEnabled: boolean;
  messages: Message[];
  tags: string[];
}

interface DocumentRow {
  id: string;
  sender: string;
  phone: string;
  docType: string;
  matchedStudentId: string | null;
  status: 'verified' | 'pending' | 'rejected' | 'orphan';
  timestamp: string;
}

interface SLAEvent {
  id: string;
  conversationId: string;
  studentName: string;
  type: string;
  triggeredAt: string;
  deadline: string;
  escalatedTo: string;
  status: 'active' | 'overdue' | 'resolved' | 'escalated';
  remainingMinutes: number;
}

// ============================================================
// Mock Data – 6 Bangladesh Student Conversations
// ============================================================

const conversations: Conversation[] = [
  {
    id: 'conv-001',
    studentName: 'Rakibul Hasan',
    phone: '+880 1712-345678',
    studentId: 'ALO-BD-2024-0342',
    avatar: 'RH',
    lastMessage: 'Apni ki amake bolar ki sob details pathaben? Visa processing er jonno ki lagbe?',
    lastMessageTime: '2 min ago',
    unread: 3,
    status: 'active',
    assignee: 'Rahima Akter',
    appStatus: 'CAS Issued – Awaiting Visa',
    counselor: 'Rahima Akter',
    lastActivity: '2 min ago',
    aiEnabled: true,
    tags: ['UK', 'Visa', 'Urgent'],
    messages: [
      { id: 'm1', text: 'Salam! ALO Education kibhabe help korte paren?', sender: 'student', timestamp: '10:02 AM' },
      { id: 'm2', text: 'Walaikum Assalam! Welcome to ALO Education. I\'m your AI assistant. How can I help you today? 😊', sender: 'ai', timestamp: '10:02 AM', isAutoReply: true },
      { id: 'm3', text: 'Ami UK e MSc Data Science porar kotha bhabchi. Queen Mary University e apply korchi.', sender: 'student', timestamp: '10:05 AM' },
      { id: 'm4', text: 'Great choice! Queen Mary is a fantastic university. Let me connect you with our UK specialist counselor Rahima Apu. She will guide you through the visa process.', sender: 'ai', timestamp: '10:05 AM', isAutoReply: true },
      { id: 'm5', text: 'Apni ki amake bolar ki sob details pathaben? Visa processing er jonno ki lagbe?', sender: 'student', timestamp: '10:08 AM' },
    ],
  },
  {
    id: 'conv-002',
    studentName: 'Fatima Begum',
    phone: '+880 1898-765432',
    studentId: 'ALO-BD-2024-0218',
    avatar: 'FB',
    lastMessage: 'My IELTS score is 6.5 overall. Can I still apply for MSc Computing in Australia?',
    lastMessageTime: '15 min ago',
    unread: 1,
    status: 'active',
    assignee: 'unassigned',
    appStatus: 'Offer Received – Decision Pending',
    counselor: 'Tanvir Hossain',
    lastActivity: '15 min ago',
    aiEnabled: true,
    tags: ['Australia', 'IELTS', 'Offer'],
    messages: [
      { id: 'm6', text: 'Hi, I want to study in Australia. I have completed BSc in CSE from BUET.', sender: 'student', timestamp: '9:45 AM' },
      { id: 'm7', text: 'Hello! Welcome to ALO Education. 🎓 BUET is an excellent institution. What program are you interested in and when do you plan to start?', sender: 'ai', timestamp: '9:45 AM', isAutoReply: true },
      { id: 'm8', text: 'My IELTS score is 6.5 overall. Can I still apply for MSc Computing in Australia?', sender: 'student', timestamp: '9:50 AM' },
    ],
  },
  {
    id: 'conv-003',
    studentName: 'Md. Arifuzzaman',
    phone: '+880 1534-987654',
    studentId: 'ALO-BD-2024-0195',
    avatar: 'MA',
    lastMessage: 'Ami payment korechi 2 din hoise kintu receipt payi nai! Ki hochhe?',
    lastMessageTime: '1 hr ago',
    unread: 5,
    status: 'overdue',
    assignee: 'Nusrat Jahan',
    appStatus: 'Deposit Paid – Processing',
    counselor: 'Nusrat Jahan',
    lastActivity: '1 hr ago',
    aiEnabled: false,
    tags: ['Payment', 'Complaint', 'Escalated'],
    messages: [
      { id: 'm9', text: 'Assalamualaikum. Ami yesterday payment korci Deakin University er jonno.', sender: 'student', timestamp: '8:30 AM' },
      { id: 'm10', text: 'Walaikum Assalam! Let me check your payment status. One moment please.', sender: 'agent', timestamp: '8:32 AM' },
      { id: 'm11', text: 'Ami payment korechi 2 din hoise kintu receipt payi nai! Ki hochhe?', sender: 'student', timestamp: '9:00 AM' },
      { id: 'm12', text: 'Ami kisu korte parchi na, ekhon kothay jabo? Amader paribar rajeeci koreche! ETA dien!', sender: 'student', timestamp: '9:15 AM' },
      { id: 'm13', text: 'Ami higher authority e complain korbo!', sender: 'student', timestamp: '9:20 AM' },
      { id: 'm14', text: 'I am very frustrated. This is unacceptable service.', sender: 'student', timestamp: '9:22 AM' },
      { id: 'm15', text: 'Ami payment korechi 2 din hoise kintu receipt payi nai! Ki hochhe?', sender: 'student', timestamp: '9:30 AM' },
    ],
  },
  {
    id: 'conv-004',
    studentName: 'Tasnim Akter',
    phone: '+880 1645-234567',
    studentId: 'ALO-BD-2024-0410',
    avatar: 'TA',
    lastMessage: 'Salam! Ami Canada e nursing e jete chai. Help korun please.',
    lastMessageTime: '3 hr ago',
    unread: 0,
    status: 'waiting',
    assignee: 'Rahima Akter',
    appStatus: 'Initial Inquiry',
    counselor: 'Unassigned',
    lastActivity: '3 hr ago',
    aiEnabled: true,
    tags: ['Canada', 'Nursing', 'New Lead'],
    messages: [
      { id: 'm16', text: 'Salam! Ami Canada e nursing e jete chai. Help korun please.', sender: 'student', timestamp: '7:15 AM' },
      { id: 'm17', text: 'Walaikum Assalam! 🍁 Canada is a great destination for nursing studies. To help you better, could you share:\n\n1. Your current qualification?\n2. IELTS score (if any)?\n3. Preferred intake (Jan/May/Sep)?\n\nThis will help me find the best options for you!', sender: 'ai', timestamp: '7:15 AM', isAutoReply: true },
    ],
  },
  {
    id: 'conv-005',
    studentName: 'Shahriar Kabir',
    phone: '+880 1376-890123',
    studentId: 'ALO-BD-2024-0156',
    avatar: 'SK',
    lastMessage: 'Bro, my UK visa got refused. What can I do now? I am very worried.',
    lastMessageTime: '30 min ago',
    unread: 2,
    status: 'active',
    assignee: 'unassigned',
    appStatus: 'Visa Refused – Appeal Pending',
    counselor: 'Tanvir Hossain',
    lastActivity: '30 min ago',
    aiEnabled: true,
    tags: ['UK', 'Visa Refusal', 'Appeal', 'Urgent'],
    messages: [
      { id: 'm18', text: 'Bro, my UK visa got refused. What can I do now? I am very worried.', sender: 'student', timestamp: '9:40 AM' },
      { id: 'm19', text: 'I\'m sorry to hear that. 😔 Visa refusals can be stressful. Let me help you understand your options:\n\n1. **Review the refusal letter** – The exact reason matters a lot\n2. **Reapply with corrections** – Most common path\n3. **Administrative Review / Appeal** – If there are grounds\n\nCould you share your refusal letter or the refusal reason mentioned?', sender: 'ai', timestamp: '9:40 AM', isAutoReply: true },
      { id: 'm20', text: 'They said insufficient funds. But my sponsor has enough money! What documents do I need?', sender: 'student', timestamp: '9:55 AM' },
    ],
  },
  {
    id: 'conv-006',
    studentName: 'Nusrat Tabassum',
    phone: '+880 1821-567890',
    studentId: 'ALO-BD-2024-0523',
    avatar: 'NT',
    lastMessage: 'Dhonnobad! Ami amar documents upload korbo ekhon. Passport and transcript.',
    lastMessageTime: '5 hr ago',
    unread: 0,
    status: 'resolved',
    assignee: 'Rahima Akter',
    appStatus: 'Documents Verified – Submitted',
    counselor: 'Rahima Akter',
    lastActivity: '5 hr ago',
    aiEnabled: true,
    tags: ['Germany', 'Documents', 'Complete'],
    messages: [
      { id: 'm21', text: 'Hello! I am interested in studying in Germany. Free tuition!', sender: 'student', timestamp: '5:30 AM' },
      { id: 'm22', text: 'Hello! 🇩🇪 Yes, Germany offers tuition-free education at public universities! Here\'s what you need:\n\n• Academic transcripts (attested)\n• IELTS 6.5+ or TestDaF\n• Motivation letter (SOP)\n• Passport scan\n\nShall I connect you with our Germany counselor?', sender: 'ai', timestamp: '5:30 AM', isAutoReply: true },
      { id: 'm23', text: 'Dhonnobad! Ami amar documents upload korbo ekhon. Passport and transcript.', sender: 'student', timestamp: '5:35 AM' },
      { id: 'm24', text: 'Excellent! You can upload your documents directly here. I\'ll verify them once uploaded. ✅', sender: 'ai', timestamp: '5:36 AM', isAutoReply: true },
      { id: 'm25', text: 'Documents received and verified! Our counselor Rahima will contact you within 24 hours with university options.', sender: 'ai', timestamp: '5:40 AM', isAutoReply: true },
    ],
  },
];

// ============================================================
// Document Upload Mock Data
// ============================================================

const documentUploads: DocumentRow[] = [
  { id: 'doc-001', sender: 'Rakibul Hasan', phone: '+880 1712-345678', docType: 'Passport', matchedStudentId: 'ALO-BD-2024-0342', status: 'verified', timestamp: 'Today, 10:02 AM' },
  { id: 'doc-002', sender: 'Fatima Begum', phone: '+880 1898-765432', docType: 'English Test (IELTS)', matchedStudentId: 'ALO-BD-2024-0218', status: 'verified', timestamp: 'Today, 9:45 AM' },
  { id: 'doc-003', sender: 'Md. Arifuzzaman', phone: '+880 1534-987654', docType: 'Payment Receipt', matchedStudentId: 'ALO-BD-2024-0195', status: 'pending', timestamp: 'Today, 8:30 AM' },
  { id: 'doc-004', sender: 'Tasnim Akter', phone: '+880 1645-234567', docType: 'Certificate', matchedStudentId: 'ALO-BD-2024-0410', status: 'pending', timestamp: 'Today, 7:15 AM' },
  { id: 'doc-005', sender: 'Shahriar Kabir', phone: '+880 1376-890123', docType: 'Bank Statement', matchedStudentId: 'ALO-BD-2024-0156', status: 'rejected', timestamp: 'Today, 9:40 AM' },
  { id: 'doc-006', sender: 'Nusrat Tabassum', phone: '+880 1821-567890', docType: 'Transcript', matchedStudentId: 'ALO-BD-2024-0523', status: 'verified', timestamp: 'Today, 5:35 AM' },
  { id: 'doc-007', sender: 'Unknown', phone: '+880 1999-111222', docType: 'Offer Letter', matchedStudentId: null, status: 'orphan', timestamp: 'Yesterday, 11:30 PM' },
  { id: 'doc-008', sender: 'Rakibul Hasan', phone: '+880 1712-345678', docType: 'CAS', matchedStudentId: 'ALO-BD-2024-0342', status: 'verified', timestamp: 'Yesterday, 4:15 PM' },
  { id: 'doc-009', sender: 'Unknown', phone: '+880 1666-333444', docType: 'Invoice', matchedStudentId: null, status: 'orphan', timestamp: 'Yesterday, 2:00 PM' },
  { id: 'doc-010', sender: 'Fatima Begum', phone: '+880 1898-765432', docType: 'Visa File', matchedStudentId: 'ALO-BD-2024-0218', status: 'pending', timestamp: 'Yesterday, 10:45 AM' },
];

// ============================================================
// SLA Event Mock Data
// ============================================================

const slaEvents: SLAEvent[] = [
  { id: 'sla-001', conversationId: 'conv-003', studentName: 'Md. Arifuzzaman', type: 'Payment Complaint', triggeredAt: '9:20 AM', deadline: '10:00 AM', escalatedTo: 'Employee', status: 'overdue', remainingMinutes: -15 },
  { id: 'sla-002', conversationId: 'conv-005', studentName: 'Shahriar Kabir', type: 'Visa Refusal – Human Transfer', triggeredAt: '9:40 AM', deadline: '10:20 AM', escalatedTo: 'Employee', status: 'active', remainingMinutes: 8 },
  { id: 'sla-003', conversationId: 'conv-001', studentName: 'Rakibul Hasan', type: 'Visa Inquiry – First Response', triggeredAt: '10:08 AM', deadline: '10:48 AM', escalatedTo: 'Employee', status: 'active', remainingMinutes: 36 },
  { id: 'sla-004', conversationId: 'conv-002', studentName: 'Fatima Begum', type: 'Application Question', triggeredAt: '9:50 AM', deadline: '10:30 AM', escalatedTo: 'Employee', status: 'active', remainingMinutes: 18 },
  { id: 'sla-005', conversationId: 'conv-004', studentName: 'Tasnim Akter', type: 'New Lead Response', triggeredAt: '7:15 AM', deadline: '7:55 AM', escalatedTo: 'Manager', status: 'overdue', remainingMinutes: -155 },
];

// ============================================================
// Constants
// ============================================================

const quickReplies = [
  'Walaikum Assalam! Welcome to ALO Education. How can we assist you today? 😊',
  'Please share your academic transcripts and IELTS score for evaluation.',
  'Our office hours are Saturday to Thursday, 10:00 AM – 6:00 PM.',
  'You can upload your documents directly in this chat. Send as image or PDF.',
  'For payment queries, please share your transaction ID.',
  'Amader kache uporer information lagbe apnar application process aganoar jonno.',
];

const docTypes = [
  'Passport', 'Certificate', 'Transcript', 'Bank Statement',
  'English Test', 'Visa File', 'Offer Letter', 'CAS', 'COE',
  'I-20', 'Payment Receipt', 'Partner Agreement', 'Invoice',
];

const SLA_COMPLIANCE_RATE = 87.3;

// ============================================================
// Helper Components (outside main component to avoid lint errors)
// ============================================================

function StatusBadge({ status }: { status: ConvStatus }) {
  const config: Record<ConvStatus, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
    waiting: { label: 'Waiting', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700 border-red-200' },
    resolved: { label: 'Resolved', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  };
  const c = config[status];
  return <Badge variant="outline" className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
}

function DocStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    verified: { label: 'Verified', className: 'bg-green-100 text-green-700 border-green-200' },
    pending: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
    orphan: { label: 'Orphan', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  };
  const c = config[status] || config.pending;
  return <Badge variant="outline" className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
}

function SLAStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
    overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700 border-red-200' },
    resolved: { label: 'Resolved', className: 'bg-gray-100 text-gray-500 border-gray-200' },
    escalated: { label: 'Escalated', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  };
  const c = config[status] || config.active;
  return <Badge variant="outline" className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
}

// ============================================================
// Inbox Tab
// ============================================================

interface InboxTabProps {
  selectedConv: Conversation;
  setSelectedConv: (c: Conversation) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterType: string;
  setFilterType: (f: string) => void;
  chatInput: string;
  setChatInput: (v: string) => void;
  aiToggles: Record<string, boolean>;
  setAiToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  filteredConversations: Conversation[];
  unreadTotal: number;
}

function InboxTab({
  selectedConv,
  setSelectedConv,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  chatInput,
  setChatInput,
  aiToggles,
  setAiToggles,
  filteredConversations,
}: InboxTabProps) {
  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] rounded-xl border border-alo-border overflow-hidden bg-white">
      {/* ---- Left Panel: Conversation List ---- */}
      <div className="w-80 shrink-0 flex flex-col border-r border-alo-border bg-white">
        <div className="p-3 border-b border-alo-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-alo-text">WhatsApp Inbox</h3>
            <Badge className="bg-green-600 text-white text-[10px]">{filteredConversations.reduce((s, c) => s + c.unread, 0)} new</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-alo-text-muted" />
            <Input
              placeholder="Search name, phone, ID..."
              className="pl-8 h-8 text-xs bg-gray-50 border-alo-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-1 mt-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'unassigned', label: 'Unassigned' },
              { value: 'my-chats', label: 'My Chats' },
              { value: 'overdue', label: 'Overdue' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors cursor-pointer ${
                  filterType === f.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-gray-50">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full text-left px-3 py-3 transition-colors cursor-pointer ${
                  selectedConv?.id === conv.id
                    ? 'bg-green-50 border-l-[3px] border-l-green-600'
                    : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback className="bg-green-600 text-white text-xs font-semibold">
                      {conv.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-alo-text truncate">{conv.studentName}</span>
                      <span className="text-[10px] text-alo-text-muted shrink-0 ml-2">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-[11px] text-alo-text-secondary truncate mt-0.5">{conv.lastMessage}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <StatusBadge status={conv.status} />
                      {conv.unread > 0 && (
                        <span className="w-4 h-4 rounded-full bg-green-600 text-white text-[9px] font-bold flex items-center justify-center">
                          {conv.unread}
                        </span>
                      )}
                      {conv.aiEnabled && <Bot className="w-3 h-3 text-alo-text-muted" />}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ---- Center Panel: Chat View ---- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f0f2f5]">
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-alo-border shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-green-600 text-white text-xs font-semibold">
                {selectedConv.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-alo-text">{selectedConv.studentName}</p>
              <p className="text-[10px] text-alo-text-muted">{selectedConv.phone} · {selectedConv.studentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-7 w-7 text-alo-text-muted hover:text-green-600">
              <Phone className="w-3.5 h-3.5" />
            </Button>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-7 w-7 text-alo-text-muted hover:text-green-600">
              <Search className="w-3.5 h-3.5" />
            </Button>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-7 w-7 text-alo-text-muted hover:text-green-600">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-2 max-w-2xl mx-auto">
            {selectedConv.messages.map((msg) => {
              const isStudent = msg.sender === 'student';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isStudent ? 'justify-start' : 'justify-end'}`}
                >
                  <div className="max-w-[75%]">
                    <div
                      className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        isStudent
                          ? 'bg-white text-alo-text rounded-tl-none shadow-sm'
                          : 'bg-green-600 text-white rounded-tr-none'
                      }`}
                    >
                      {msg.text.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < msg.text.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 ${isStudent ? '' : 'justify-end'}`}>
                      <span className="text-[9px] text-alo-text-muted">{msg.timestamp}</span>
                      {msg.isAutoReply && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 bg-green-50 text-green-600 border-green-200">
                          <Bot className="w-2.5 h-2.5 mr-0.5" /> AI Reply
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Quick Replies */}
        <div className="px-4 pb-1.5">
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 max-w-2xl mx-auto">
            {quickReplies.slice(0, 4).map((qr, i) => (
              <button
                key={i}
                onClick={() => setChatInput(qr)}
                className="shrink-0 px-2.5 py-1 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100 transition-colors cursor-pointer"
              >
                {qr.length > 40 ? qr.slice(0, 40) + '...' : qr}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-2.5 bg-white border-t border-alo-border shrink-0">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-8 w-8 text-alo-text-muted shrink-0">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              className="flex-1 h-8 text-xs"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-8 w-8 text-alo-text-muted shrink-0">
              <Mic className="w-4 h-4" />
            </Button>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white shrink-0">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ---- Right Panel: Student Profile ---- */}
      <div className="w-72 shrink-0 flex flex-col border-l border-alo-border bg-white hidden xl:flex">
        <div className="p-4 border-b border-alo-border">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-14 h-14 mb-2">
              <AvatarFallback className="bg-green-600 text-white text-lg font-bold">
                {selectedConv.avatar}
              </AvatarFallback>
            </Avatar>
            <h4 className="text-sm font-bold text-alo-text">{selectedConv.studentName}</h4>
            <p className="text-[10px] text-alo-text-muted mt-0.5">{selectedConv.studentId}</p>
            <div className="flex gap-1 mt-2 flex-wrap justify-center">
              {selectedConv.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[9px] bg-gray-50 border-alo-border">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Contact Info */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-alo-text-muted mb-2">Contact Info</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-alo-text-muted" />
                  <span className="text-xs text-alo-text">{selectedConv.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-alo-text-muted" />
                  <span className="text-xs text-alo-text">WhatsApp Active</span>
                </div>
              </div>
            </div>
            <Separator />
            {/* Application Status */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-alo-text-muted mb-2">Application Status</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                <p className="text-xs font-medium text-green-800">{selectedConv.appStatus}</p>
              </div>
            </div>
            <Separator />
            {/* Counselor */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-alo-text-muted mb-2">Assigned Counselor</p>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-[9px] font-bold">
                    {selectedConv.counselor === 'Unassigned' ? '?' : selectedConv.counselor.split(' ').map(w => w[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium text-alo-text">{selectedConv.counselor}</p>
                  <p className="text-[10px] text-alo-text-muted">{selectedConv.assignee === 'unassigned' ? 'Needs Assignment' : 'Active'}</p>
                </div>
              </div>
            </div>
            <Separator />
            {/* Last Activity */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-alo-text-muted mb-2">Last Activity</p>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-alo-text-muted" />
                <span className="text-xs text-alo-text">{selectedConv.lastActivity}</span>
              </div>
            </div>
            <Separator />
            {/* AI Status */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-alo-text-muted mb-2">AI Agent</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-alo-text">Auto-reply enabled</span>
                <Switch
                  checked={aiToggles[selectedConv.id]}
                  onCheckedChange={(checked) =>
                    setAiToggles((prev: Record<string, boolean>) => ({ ...prev, [selectedConv.id]: checked }))
                  }
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </div>
            <Separator />
            {/* Quick Actions */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-alo-text-muted mb-2">Quick Actions</p>
              <div className="space-y-1.5">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="w-full justify-start h-7 text-[11px] border-alo-border">
                  <Eye className="w-3 h-3 mr-1.5" /> View Full Profile
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="w-full justify-start h-7 text-[11px] border-alo-border">
                  <UserCheck className="w-3 h-3 mr-1.5" /> Assign to Me
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="w-full justify-start h-7 text-[11px] border-alo-border">
                  <Upload className="w-3 h-3 mr-1.5" /> Request Documents
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="w-full justify-start h-7 text-[11px] border-red-200 text-red-600 hover:bg-red-50">
                  <AlertTriangle className="w-3 h-3 mr-1.5" /> Escalate Issue
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ============================================================
// AI Agent Config Tab
// ============================================================

interface AIConfigTabProps {
  aiToggles: Record<string, boolean>;
  setAiToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  afterHoursEnabled: boolean;
  setAfterHoursEnabled: (v: boolean) => void;
  otpRequired: boolean;
  setOtpRequired: (v: boolean) => void;
  ruleBasedReplies: boolean;
  setRuleBasedReplies: (v: boolean) => void;
}

function AIConfigTab({
  aiToggles,
  setAiToggles,
  afterHoursEnabled,
  setAfterHoursEnabled,
  otpRequired,
  setOtpRequired,
  ruleBasedReplies,
  setRuleBasedReplies,
}: AIConfigTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Per-Conversation AI Toggle */}
      <Card className="border-alo-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-alo-text flex items-center gap-2">
            <Bot className="w-4 h-4 text-green-600" /> Per-Conversation AI Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg border border-alo-border bg-gray-50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarFallback className="bg-green-600 text-white text-[10px] font-bold">
                      {conv.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-alo-text truncate">{conv.studentName}</p>
                    <p className="text-[10px] text-alo-text-muted">{conv.studentId}</p>
                  </div>
                </div>
                <Switch
                  checked={aiToggles[conv.id]}
                  onCheckedChange={(checked) =>
                    setAiToggles((prev: Record<string, boolean>) => ({ ...prev, [conv.id]: checked }))
                  }
                  className="data-[state=checked]:bg-green-600 shrink-0"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Office Hours & After Hours */}
      <Card className="border-alo-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-alo-text flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" /> Office Hours &amp; Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-semibold text-green-800">Active Hours</span>
            </div>
            <p className="text-xs text-green-700">Saturday – Thursday: 10:00 AM – 6:00 PM (BST)</p>
            <p className="text-[10px] text-green-600 mt-1">Friday: Closed (Weekly Holiday)</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-alo-text">After-Hours Auto-Reply</p>
              <p className="text-[10px] text-alo-text-muted">AI responds outside office hours with availability notice</p>
            </div>
            <Switch checked={afterHoursEnabled} onCheckedChange={setAfterHoursEnabled} className="data-[state=checked]:bg-green-600" />
          </div>
          {afterHoursEnabled && (
            <div className="bg-gray-50 border border-alo-border rounded-lg p-3">
              <p className="text-[10px] font-semibold text-alo-text-muted mb-1">After-Hours Reply Template</p>
              <p className="text-xs text-alo-text leading-relaxed">
                &quot;ভালো থাকুন! এখন আমাদের অফিসের বাইরে সময়। আমরা শনিবার-বৃহস্পতিবার সকাল ১০টা-সন্ধ্যা ৬টা পর্যন্ত পাওয়া যাব। আপনার বার্তাটি সংরক্ষিত রয়েছে, আমরা শীঘ্রই ফিরে আসব। Thank you for your patience!&quot;
              </p>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-alo-text">Supported Languages</p>
              <p className="text-[10px] text-alo-text-muted">AI auto-detects and responds in both</p>
            </div>
            <div className="flex gap-1.5">
              <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">বাংলা</Badge>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">English</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & OTP */}
      <Card className="border-alo-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-alo-text flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" /> Security &amp; Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-alo-text-muted" />
              <div>
                <p className="text-xs font-medium text-alo-text">OTP Verification Required</p>
                <p className="text-[10px] text-alo-text-muted">OTP via SMS before sharing private student data</p>
              </div>
            </div>
            <Switch checked={otpRequired} onCheckedChange={setOtpRequired} className="data-[state=checked]:bg-green-600" />
          </div>
          <Separator />
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-xs font-semibold text-orange-800">Protected Data Points</span>
            </div>
            <ul className="text-[11px] text-orange-700 space-y-1 list-disc list-inside">
              <li>Passport number &amp; expiry</li>
              <li>Bank account / financial details</li>
              <li>Academic transcripts with grades</li>
              <li>Visa application reference</li>
              <li>Home address &amp; family info</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Human Transfer Triggers */}
      <Card className="border-alo-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-alo-text flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-orange-500" /> Human Transfer Triggers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[10px] text-alo-text-muted mb-1">AI automatically escalates to human agent when it detects:</p>
          {[
            { trigger: 'Complex Query', desc: 'Multi-step process, country-specific regulations', icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
            { trigger: 'Angry / Frustrated', desc: 'Negative sentiment, repeated complaints', icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200' },
            { trigger: 'Payment Issue', desc: 'Transaction failures, refund requests', icon: Star, color: 'text-orange-600 bg-orange-50 border-orange-200' },
            { trigger: 'Visa Refusal', desc: 'Student reports visa rejection, needs expert guidance', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
            { trigger: 'Complaint / Escalation', desc: 'Student mentions "complaint" or "manager"', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
            { trigger: 'Emergency', desc: 'Keywords: urgent, emergency, asap, help!', icon: AlertCircle, color: 'text-red-700 bg-red-100 border-red-300' },
          ].map((item) => (
            <div key={item.trigger} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${item.color}`}>
              <item.icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">{item.trigger}</p>
                <p className="text-[10px] opacity-80 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Auto Document Detection & Rule-Based Replies */}
      <Card className="border-alo-border lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-alo-text flex items-center gap-2">
            <FileUp className="w-4 h-4 text-green-600" /> Auto Document Detection &amp; Rule-Based Replies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auto Document Detection */}
            <div className="bg-gray-50 border border-alo-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-xs font-bold text-alo-text">Auto Document Detection</span>
                <Badge className="bg-green-100 text-green-700 text-[9px]">Active</Badge>
              </div>
              <p className="text-[11px] text-alo-text-secondary leading-relaxed">
                When a student sends an image or PDF via WhatsApp, the AI automatically:
              </p>
              <ul className="text-[11px] text-alo-text-secondary space-y-1.5 mt-2">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                  <span>Classifies document type (passport, transcript, etc.)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                  <span>Extracts text using OCR and validates data</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                  <span>Matches to student profile by phone/name/ID</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                  <span>Flags orphan documents for manual review</span>
                </li>
              </ul>
            </div>

            {/* Rule-Based Replies */}
            <div className="bg-gray-50 border border-alo-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-alo-text">Rule-Based Greetings</span>
                </div>
                <Switch
                  checked={ruleBasedReplies}
                  onCheckedChange={setRuleBasedReplies}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              <p className="text-[11px] text-alo-text-secondary leading-relaxed mb-3">
                Zero-cost instant replies for common greetings (no AI API call):
              </p>
              <div className="space-y-2">
                {[
                  { pattern: 'Hi / Hello / Hey', reply: 'Hello! Welcome to ALO Education. How can we assist you today? 😊', color: 'bg-blue-50 border-blue-200' },
                  { pattern: 'Salam / Assalamu / সালাম', reply: 'ওয়ালাইকুম আসসালাম! ALO Education-এ স্বাগতম। আজ কীভাবে সাহায্য করতে পারি?', color: 'bg-green-50 border-green-200' },
                  { pattern: 'Thank you / ধন্যবাদ', reply: 'You\'re welcome! আপনাকে ধন্যবাদ! Feel free to reach out anytime. 🙏', color: 'bg-orange-50 border-orange-200' },
                  { pattern: 'Price / Cost / Fee / খরচ', reply: 'Let me connect you with our counselor for detailed fee information. One moment please!', color: 'bg-yellow-50 border-yellow-200' },
                ].map((rule) => (
                  <div key={rule.pattern} className={`border rounded-md p-2 ${rule.color}`}>
                    <p className="text-[10px] font-semibold text-alo-text">{rule.pattern}</p>
                    <p className="text-[10px] text-alo-text-secondary mt-0.5 italic">{rule.reply}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Document Uploads Tab
// ============================================================

function DocumentUploadsTab() {
  const orphanDocs = documentUploads.filter((d) => d.status === 'orphan').length;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-alo-border">
          <CardContent className="p-4 text-center">
            <Upload className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-alo-text">{documentUploads.length}</p>
            <p className="text-[10px] text-alo-text-muted">Total Uploads</p>
          </CardContent>
        </Card>
        <Card className="border-alo-border">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-alo-text">{documentUploads.filter(d => d.status === 'verified').length}</p>
            <p className="text-[10px] text-alo-text-muted">Verified</p>
          </CardContent>
        </Card>
        <Card className="border-alo-border">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-alo-text">{documentUploads.filter(d => d.status === 'pending').length}</p>
            <p className="text-[10px] text-alo-text-muted">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-orange-700">{orphanDocs}</p>
            <p className="text-[10px] text-orange-600">Orphan Documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Orphan Documents Alert */}
      {orphanDocs > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">
              {orphanDocs} Orphan Document{orphanDocs > 1 ? 's' : ''} Detected
            </p>
            <p className="text-xs text-orange-700 mt-1">
              These documents could not be matched to any student record. A sender phone number may not be registered in the system.
              Please review and manually assign to the correct student or create a new lead.
            </p>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="mt-2 h-7 text-[11px] border-orange-300 text-orange-700 hover:bg-orange-100">
              <ArrowUpRight className="w-3 h-3 mr-1" /> Review Orphan Documents
            </Button>
          </div>
        </div>
      )}

      {/* Document Table */}
      <Card className="border-alo-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-alo-text flex items-center gap-2">
              <FileUp className="w-4 h-4 text-green-600" /> Recent Document Uploads
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select>
                <SelectTrigger className="h-7 w-[160px] text-[11px]">
                  <SelectValue placeholder="All Document Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Document Types</SelectItem>
                  {docTypes.map((dt) => (
                    <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="h-7 text-[11px] border-alo-border">
                <Download className="w-3 h-3 mr-1" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-alo-border">
                  <TableHead className="text-[10px] font-semibold text-alo-text-muted">Sender</TableHead>
                  <TableHead className="text-[10px] font-semibold text-alo-text-muted">Phone</TableHead>
                  <TableHead className="text-[10px] font-semibold text-alo-text-muted">Doc Type</TableHead>
                  <TableHead className="text-[10px] font-semibold text-alo-text-muted">Student ID</TableHead>
                  <TableHead className="text-[10px] font-semibold text-alo-text-muted">Status</TableHead>
                  <TableHead className="text-[10px] font-semibold text-alo-text-muted">Timestamp</TableHead>
                  <TableHead className="text-[10px] font-semibold text-alo-text-muted w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentUploads.map((doc) => (
                  <TableRow key={doc.id} className="border-alo-border hover:bg-gray-50">
                    <TableCell className="text-xs text-alo-text font-medium py-2.5">
                      {doc.sender}
                      {doc.status === 'orphan' && (
                        <AlertCircle className="w-3 h-3 text-orange-500 inline ml-1" />
                      )}
                    </TableCell>
                    <TableCell className="text-[11px] text-alo-text-secondary py-2.5">{doc.phone}</TableCell>
                    <TableCell className="text-[11px] py-2.5">
                      <Badge variant="outline" className="text-[10px] bg-gray-50 border-alo-border">
                        {doc.docType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] py-2.5">
                      {doc.matchedStudentId ? (
                        <span className="text-green-600 font-medium">{doc.matchedStudentId}</span>
                      ) : (
                        <span className="text-orange-600 font-medium">Unmatched</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <DocStatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell className="text-[10px] text-alo-text-muted py-2.5">{doc.timestamp}</TableCell>
                    <TableCell className="py-2.5">
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-6 w-6 text-alo-text-muted">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// SLA Monitor Tab
// ============================================================

function SLAMonitorTab() {
  return (
    <div className="space-y-5">
      {/* SLA Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-alo-border">
          <CardContent className="p-4 text-center">
            <Timer className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-alo-text">{slaEvents.filter(s => s.status === 'active').length}</p>
            <p className="text-[10px] text-alo-text-muted">Active SLAs</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-700">{slaEvents.filter(s => s.status === 'overdue').length}</p>
            <p className="text-[10px] text-red-600">Overdue</p>
          </CardContent>
        </Card>
        <Card className="border-alo-border">
          <CardContent className="p-4 text-center">
            <ShieldCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-alo-text">{SLA_COMPLIANCE_RATE}%</p>
            <p className="text-[10px] text-alo-text-muted">Compliance Rate</p>
          </CardContent>
        </Card>
        <Card className="border-alo-border">
          <CardContent className="p-4 text-center">
            <Star className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-alo-text">92.1%</p>
            <p className="text-[10px] text-alo-text-muted">Avg Resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Escalation Chain */}
      <Card className="border-alo-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-alo-text flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-orange-500" /> SLA Escalation Chain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { level: 'Employee', time: '40 min', icon: User, color: 'bg-green-50 border-green-300 text-green-800' },
              { level: 'Manager', time: '20 min', icon: Building2, color: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
              { level: 'CEO', time: '10 min', icon: Crown, color: 'bg-red-50 border-red-300 text-red-800' },
            ].map((step, i, arr) => (
              <div key={step.level} className="flex items-center gap-3">
                <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 ${step.color}`}>
                  <step.icon className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold">{step.level}</p>
                    <p className="text-[10px] opacity-75">{step.time} response window</p>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-alo-text-muted shrink-0" />
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-alo-text-muted text-center mt-3">
            If an SLA is not met within the response window, it automatically escalates to the next level.
          </p>
        </CardContent>
      </Card>

      {/* Compliance Progress */}
      <Card className="border-alo-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-alo-text">Weekly SLA Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-alo-text">First Response (&lt;5 min)</span>
                <span className="text-[11px] font-semibold text-green-600">94.2%</span>
              </div>
              <Progress value={94.2} className="h-2 bg-gray-100 [&>div]:bg-green-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-alo-text">Resolution (&lt;40 min)</span>
                <span className="text-[11px] font-semibold text-green-600">{SLA_COMPLIANCE_RATE}%</span>
              </div>
              <Progress value={SLA_COMPLIANCE_RATE} className="h-2 bg-gray-100 [&>div]:bg-green-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-alo-text">Escalation Rate</span>
                <span className="text-[11px] font-semibold text-orange-500">6.8%</span>
              </div>
              <Progress value={6.8} className="h-2 bg-gray-100 [&>div]:bg-orange-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-alo-text">Customer Satisfaction</span>
                <span className="text-[11px] font-semibold text-green-600">4.6 / 5.0</span>
              </div>
              <Progress value={92} className="h-2 bg-gray-100 [&>div]:bg-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active SLA Events */}
      <Card className="border-alo-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-alo-text flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" /> Active SLA Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {slaEvents.map((event) => (
              <div
                key={event.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  event.status === 'overdue'
                    ? 'bg-red-50 border-red-200'
                    : event.status === 'active'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-alo-border'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className={`text-[10px] font-bold ${
                      event.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {event.studentName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-alo-text truncate">{event.studentName}</p>
                    <p className="text-[10px] text-alo-text-muted">{event.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <SLAStatusBadge status={event.status} />
                  <div className="text-right">
                    {event.status === 'active' ? (
                      <div className="flex items-center gap-1">
                        <Timer className={`w-3.5 h-3.5 ${event.remainingMinutes <= 10 ? 'text-orange-500' : 'text-green-600'}`} />
                        <span className={`text-xs font-bold ${event.remainingMinutes <= 10 ? 'text-orange-600' : 'text-green-700'}`}>
                          {event.remainingMinutes}m left
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs font-bold text-red-600">
                          {Math.abs(event.remainingMinutes)}m overdue
                        </span>
                      </div>
                    )}
                    <p className="text-[9px] text-alo-text-muted">Escalated: {event.escalatedTo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function WhatsAppAutomationView() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedConv, setSelectedConv] = useState<Conversation>(conversations[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [chatInput, setChatInput] = useState('');
  const [aiToggles, setAiToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(conversations.map((c) => [c.id, c.aiEnabled]))
  );
  const [afterHoursEnabled, setAfterHoursEnabled] = useState(true);
  const [otpRequired, setOtpRequired] = useState(true);
  const [ruleBasedReplies, setRuleBasedReplies] = useState(true);

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    if (filterType === 'unassigned') return c.assignee === 'unassigned';
    if (filterType === 'my-chats') return c.assignee === 'Rahima Akter';
    if (filterType === 'overdue') return c.status === 'overdue';
    return true;
  });

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread, 0);
  const overdueCount = conversations.filter((c) => c.status === 'overdue').length;
  const orphanDocs = documentUploads.filter((d) => d.status === 'orphan').length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-alo-text">
            WhatsApp Business Automation
          </h1>
          <p className="text-sm text-alo-text-muted mt-0.5">
            Manage conversations, AI agent, document uploads, and SLA monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-600 text-white text-[11px]">
            <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp Connected
          </Badge>
          <Badge variant="outline" className="text-[11px] bg-green-50 text-green-600 border-green-200">
            <Bot className="w-3 h-3 mr-1" /> AI Agent Active
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
          <MessageCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-lg font-bold text-green-800">{conversations.length}</p>
            <p className="text-[10px] text-green-600">Active Conversations</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-alo-border">
          <Bot className="w-5 h-5 text-alo-text-muted shrink-0" />
          <div>
            <p className="text-lg font-bold text-alo-text">
              {conversations.filter(c => c.aiEnabled).length}
            </p>
            <p className="text-[10px] text-alo-text-muted">AI-Enabled Chats</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-lg font-bold text-red-700">{overdueCount}</p>
            <p className="text-[10px] text-red-600">Overdue SLAs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
          <Upload className="w-5 h-5 text-orange-600 shrink-0" />
          <div>
            <p className="text-lg font-bold text-orange-700">{documentUploads.length}</p>
            <p className="text-[10px] text-orange-600">Documents Today</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100 p-0.5 h-auto">
          {[
            { value: 'inbox', label: 'WhatsApp Inbox', icon: MessageCircle, badge: String(unreadTotal), badgeColor: 'bg-green-600' },
            { value: 'ai-config', label: 'AI Agent Config', icon: Bot, badge: null },
            { value: 'documents', label: 'Document Uploads', icon: FileUp, badge: String(orphanDocs), badgeColor: 'bg-orange-500' },
            { value: 'sla', label: 'SLA Monitor', icon: Timer, badge: String(slaEvents.filter(s => s.status === 'overdue').length), badgeColor: 'bg-red-500' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className={`w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          <InboxTab
            selectedConv={selectedConv}
            setSelectedConv={setSelectedConv}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
            chatInput={chatInput}
            setChatInput={setChatInput}
            aiToggles={aiToggles}
            setAiToggles={setAiToggles}
            filteredConversations={filteredConversations}
            unreadTotal={unreadTotal}
          />
        </TabsContent>

        <TabsContent value="ai-config" className="mt-4">
          <AIConfigTab
            aiToggles={aiToggles}
            setAiToggles={setAiToggles}
            afterHoursEnabled={afterHoursEnabled}
            setAfterHoursEnabled={setAfterHoursEnabled}
            otpRequired={otpRequired}
            setOtpRequired={setOtpRequired}
            ruleBasedReplies={ruleBasedReplies}
            setRuleBasedReplies={setRuleBasedReplies}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentUploadsTab />
        </TabsContent>

        <TabsContent value="sla" className="mt-4">
          <SLAMonitorTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
