'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  Send,
  Search,
  X,
  Clock,
  FileText,
  UserPlus,
  CalendarClock,
  Sparkles,
  Image as ImageIcon,
  Paperclip,
  Smile,
  MoreVertical,
  ChevronRight,
  Radio,
  CheckCheck,
  Check,
  ArrowLeft,
  Users,
  Zap,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Target,
  Inbox,
  Megaphone,
  MailOpen,
  MousePointerClick,
  Ban,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  StatCard,
  SectionCard,
  PageHeader,
  EmptyState,
  LoadingGrid,
  MetricRow,
  TabCounter,
  StatusBadge,
  MiniBar,
  QuickAction,
} from '@/components/alo/shared';
import { timeAgo, STAGE_LABELS } from '@/lib/alo-types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CommunicationCenterProps {
  onNavigate?: (view: string, slug?: string) => void;
}

type ChannelType = 'FACEBOOK' | 'WHATSAPP' | 'ALO_CHAT' | 'SMS' | 'EMAIL';

type MobileView = 'list' | 'thread' | 'sms' | 'email';

interface InboxMessage {
  id: string;
  channel: string;
  direction: string;
  fromName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  body: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
  aiAssisted?: boolean | null;
  read?: boolean | null;
  receivedAt?: string;
  sentAt?: string | null;
  deliveryStatus?: string | null;
  studentId?: string | null;
}

interface Conversation {
  key: string;
  channel: ChannelType;
  studentId?: string | null;
  studentName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  messages: InboxMessage[];
  unread: number;
  lastMessageAt: string;
}

interface ContactContext {
  id: string;
  leadId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  studyDestination?: string;
  programTitle?: string;
  applicationStage?: string;
  profileCompletion?: number;
  documents?: Array<{ name: string; status: string }>;
  lastActivity?: string;
}

interface SmsStats {
  total: number;
  delivered: number;
  sent: number;
  failed: number;
  queued: number;
  undelivered: number;
  deliveryRate: number;
  failureRate: number;
  byCategory: Array<{ category: string | null; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

interface SmsMessageItem {
  id: string;
  to: string;
  from?: string | null;
  body: string;
  status: string;
  direction: string;
  category?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  student?: { id: string; fullName: string; mobile: string } | null;
  template?: { id: string; name: string } | null;
}

interface SmsTemplateItem {
  id: string;
  name: string;
  category: string;
  body: string;
  variables?: string | null;
  status: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  createdAt: string;
}

// ─── Channel Metadata ────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<ChannelType, {
  label: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
  text: string;
}> = {
  FACEBOOK: {
    label: 'Facebook',
    icon: <MessageCircle className="size-4" />,
    accent: 'bg-sky-100 text-sky-700 border-sky-200',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
  },
  WHATSAPP: {
    label: 'WhatsApp',
    icon: <MessageCircle className="size-4" />,
    accent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  ALO_CHAT: {
    label: 'ALO Chat',
    icon: <Zap className="size-4" />,
    accent: 'bg-alo-blue-light text-alo-blue border-alo-blue/20',
    bg: 'bg-alo-blue-light',
    text: 'text-alo-blue',
  },
  SMS: {
    label: 'SMS',
    icon: <Phone className="size-4" />,
    accent: 'bg-violet-100 text-violet-700 border-violet-200',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
  },
  EMAIL: {
    label: 'Email',
    icon: <Mail className="size-4" />,
    accent: 'bg-amber-100 text-amber-700 border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
};

// ─── DEMO_ Fallback Data ─────────────────────────────────────────────────────

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    key: 'fb_1', channel: 'FACEBOOK', studentId: 'stu_001', studentName: 'Fatima Al-Rashid',
    messages: [
      { id: 'm1', channel: 'FACEBOOK', direction: 'INBOUND', fromName: 'Fatima Al-Rashid', body: 'Hi, I want to apply for MSc Computer Science in the UK. Can you help me?', receivedAt: '2025-06-10T09:30:00Z' },
      { id: 'm2', channel: 'FACEBOOK', direction: 'OUTBOUND', body: 'Hello Fatima! Welcome to ALO Education. We\'d love to help you with your MSc Computer Science application. Could you share your academic background and IELTS score?', sentAt: '2025-06-10T09:35:00Z', read: true, deliveryStatus: 'DELIVERED' },
      { id: 'm3', channel: 'FACEBOOK', direction: 'INBOUND', fromName: 'Fatima Al-Rashid', body: 'I have a BSc in Software Engineering with 3.7 GPA and IELTS 7.0. Looking at UK September 2025 intake.', receivedAt: '2025-06-10T09:40:00Z' },
      { id: 'm4', channel: 'FACEBOOK', direction: 'OUTBOUND', body: 'Excellent profile! With a 3.7 GPA and IELTS 7.0, you\'re competitive for top UK universities. Let me suggest a few options and book a consultation for you.', sentAt: '2025-06-10T09:45:00Z', read: false, deliveryStatus: 'DELIVERED' },
      { id: 'm5', channel: 'FACEBOOK', direction: 'INBOUND', fromName: 'Fatima Al-Rashid', body: 'That would be great, thank you! I\'m also interested in scholarship options.', receivedAt: '2025-06-10T10:00:00Z' },
    ],
    unread: 2, lastMessageAt: '2025-06-10T10:00:00Z',
  },
  {
    key: 'wa_1', channel: 'WHATSAPP', studentId: 'stu_002', studentName: 'Ahmed Hassan',
    messages: [
      { id: 'm6', channel: 'WHATSAPP', direction: 'INBOUND', fromName: 'Ahmed Hassan', body: 'Salam, I need help with my visa application. My CAS has been issued.', receivedAt: '2025-06-10T08:00:00Z' },
      { id: 'm7', channel: 'WHATSAPP', direction: 'OUTBOUND', body: 'Wa Alaikum Assalam Ahmed! Congratulations on your CAS. Our visa team will guide you through the process. Please have your documents ready.', sentAt: '2025-06-10T08:10:00Z', read: true, deliveryStatus: 'READ' },
      { id: 'm8', channel: 'WHATSAPP', direction: 'INBOUND', fromName: 'Ahmed Hassan', body: 'JazakAllah! Which documents do I need?', receivedAt: '2025-06-10T08:15:00Z' },
      { id: 'm9', channel: 'WHATSAPP', direction: 'OUTBOUND', body: 'You\'ll need: passport, CAS letter, financial documents (bank statements), TB test certificate, and academic transcripts. Our visa officer will send you a detailed checklist.', sentAt: '2025-06-10T08:20:00Z', read: true, deliveryStatus: 'READ' },
    ],
    unread: 0, lastMessageAt: '2025-06-10T08:20:00Z',
  },
  {
    key: 'wa_2', channel: 'WHATSAPP', studentId: 'stu_003', studentName: 'Noor Khan',
    messages: [
      { id: 'm10', channel: 'WHATSAPP', direction: 'INBOUND', fromName: 'Noor Khan', body: 'Hi, when will my offer letter be ready? I applied 3 weeks ago.', receivedAt: '2025-06-10T11:00:00Z' },
    ],
    unread: 1, lastMessageAt: '2025-06-10T11:00:00Z',
  },
  {
    key: 'alo_1', channel: 'ALO_CHAT', studentId: 'stu_004', studentName: 'Mohammed Ali',
    messages: [
      { id: 'm11', channel: 'ALO_CHAT', direction: 'INBOUND', fromName: 'Mohammed Ali', body: 'I want to know about the English test preparation courses you offer.', receivedAt: '2025-06-10T07:00:00Z' },
      { id: 'm12', channel: 'ALO_CHAT', direction: 'OUTBOUND', body: 'Hi Mohammed! We offer comprehensive IELTS and PTE preparation. Our courses include mock tests, speaking practice, and writing workshops. Would you like to book a free assessment?', sentAt: '2025-06-10T07:05:00Z', read: true, deliveryStatus: 'READ' },
      { id: 'm13', channel: 'ALO_CHAT', direction: 'INBOUND', fromName: 'Mohammed Ali', body: 'Yes please! I need to improve my IELTS score from 6.0 to 7.0 for my application.', receivedAt: '2025-06-10T07:10:00Z' },
      { id: 'm14', channel: 'ALO_CHAT', direction: 'INBOUND', fromName: 'Mohammed Ali', body: 'Also do you have weekend classes? I work during the week.', receivedAt: '2025-06-10T07:12:00Z' },
    ],
    unread: 2, lastMessageAt: '2025-06-10T07:12:00Z',
  },
  {
    key: 'fb_2', channel: 'FACEBOOK', studentName: 'Sarah Johnson',
    messages: [
      { id: 'm15', channel: 'FACEBOOK', direction: 'INBOUND', fromName: 'Sarah Johnson', body: 'Hi, I\'m from Nigeria. Can international students from Africa apply through ALO?', receivedAt: '2025-06-09T15:00:00Z' },
      { id: 'm16', channel: 'FACEBOOK', direction: 'OUTBOUND', body: 'Hi Sarah! Absolutely! We help students from all over the world including Nigeria. Let me connect you with our Africa regional team.', sentAt: '2025-06-09T15:10:00Z', read: true, deliveryStatus: 'DELIVERED' },
    ],
    unread: 0, lastMessageAt: '2025-06-09T15:10:00Z',
  },
  {
    key: 'alo_2', channel: 'ALO_CHAT', studentId: 'stu_005', studentName: 'Yuki Tanaka',
    messages: [
      { id: 'm17', channel: 'ALO_CHAT', direction: 'INBOUND', fromName: 'Yuki Tanaka', body: 'I received an unconditional offer from University of Manchester! What are the next steps?', receivedAt: '2025-06-10T10:30:00Z' },
      { id: 'm18', channel: 'ALO_CHAT', direction: 'OUTBOUND', body: 'Congratulations Yuki! 🎉 The next steps are: 1) Accept the offer, 2) Pay deposit, 3) Apply for CAS, 4) Begin visa prep. I\'ll schedule a meeting with your counselor.', sentAt: '2025-06-10T10:35:00Z', read: false, deliveryStatus: 'DELIVERED' },
    ],
    unread: 1, lastMessageAt: '2025-06-10T10:35:00Z',
  },
];

const DEMO_CONTACTS: Record<string, ContactContext> = {
  stu_001: {
    id: 'stu_001', leadId: 'LD-2025-0891', fullName: 'Fatima Al-Rashid',
    email: 'fatima.rashid@email.com', phone: '+971 50 123 4567', source: 'FACEBOOK',
    status: 'LEAD', studyDestination: 'United Kingdom', programTitle: 'MSc Computer Science',
    applicationStage: 'COUNSELING', profileCompletion: 45,
    documents: [
      { name: 'Passport', status: 'PENDING' },
      { name: 'Transcripts', status: 'PENDING' },
      { name: 'IELTS Certificate', status: 'APPROVED' },
    ],
    lastActivity: '2025-06-10T10:00:00Z',
  },
  stu_002: {
    id: 'stu_002', leadId: 'LD-2025-0745', fullName: 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com', phone: '+966 55 987 6543', source: 'WHATSAPP',
    status: 'STUDENT', studyDestination: 'United Kingdom', programTitle: 'MSc Data Science',
    applicationStage: 'CAS_ISSUED', profileCompletion: 88,
    documents: [
      { name: 'Passport', status: 'APPROVED' },
      { name: 'Transcripts', status: 'APPROVED' },
      { name: 'CAS Letter', status: 'APPROVED' },
      { name: 'Financial Docs', status: 'UNDER_REVIEW' },
    ],
    lastActivity: '2025-06-10T08:20:00Z',
  },
  stu_003: {
    id: 'stu_003', leadId: 'LD-2025-0812', fullName: 'Noor Khan',
    email: 'noor.khan@email.com', phone: '+92 300 456 7890', source: 'WHATSAPP',
    status: 'STUDENT', studyDestination: 'Australia', programTitle: 'Bachelor of Nursing',
    applicationStage: 'APPLICATION_SUBMITTED', profileCompletion: 72,
    documents: [
      { name: 'Passport', status: 'APPROVED' },
      { name: 'Transcripts', status: 'APPROVED' },
      { name: 'SOP', status: 'PENDING' },
    ],
    lastActivity: '2025-06-10T11:00:00Z',
  },
  stu_004: {
    id: 'stu_004', leadId: 'LD-2025-0903', fullName: 'Mohammed Ali',
    email: 'mohammed.ali@email.com', phone: '+20 10 111 2222', source: 'WEBSITE',
    status: 'LEAD', studyDestination: 'United Kingdom', programTitle: 'IELTS Preparation',
    applicationStage: 'COUNSELING', profileCompletion: 30,
    documents: [],
    lastActivity: '2025-06-10T07:12:00Z',
  },
  stu_005: {
    id: 'stu_005', leadId: 'LD-2025-0654', fullName: 'Yuki Tanaka',
    email: 'yuki.tanaka@email.com', phone: '+81 90 3333 4444', source: 'PARTNER_REFERRAL',
    status: 'STUDENT', studyDestination: 'United Kingdom', programTitle: 'MSc International Business',
    applicationStage: 'UNCONDITIONAL_OFFER', profileCompletion: 95,
    documents: [
      { name: 'Passport', status: 'APPROVED' },
      { name: 'Transcripts', status: 'APPROVED' },
      { name: 'Offer Letter', status: 'APPROVED' },
      { name: 'Deposit Receipt', status: 'PENDING' },
    ],
    lastActivity: '2025-06-10T10:35:00Z',
  },
};

// SMS data now comes from API — no more DEMO_SMS_CAMPAIGNS

const DEMO_EMAIL_CAMPAIGNS: EmailCampaign[] = [
  { id: 'ec1', name: 'Scholarship Alert — Sep 2025', sent: 3420, opened: 1890, clicked: 456, bounced: 120, createdAt: '2025-06-09T08:00:00Z' },
  { id: 'ec2', name: 'Application Progress Update', sent: 2100, opened: 1680, clicked: 520, bounced: 85, createdAt: '2025-06-08T12:00:00Z' },
  { id: 'ec3', name: 'Pre-departure Guide', sent: 890, opened: 750, clicked: 310, bounced: 18, createdAt: '2025-06-07T16:00:00Z' },
];

// SMS log now comes from API


const DEMO_EMAIL_LOG = [
  { id: 'el1', to: 'fatima.rashid@email.com', subject: 'Application Update — Documents Required', status: 'OPENED', sentAt: '2025-06-10T10:00:00Z' },
  { id: 'el2', to: 'ahmed.hassan@email.com', subject: 'CAS Issued — Visa Preparation Guide', status: 'CLICKED', sentAt: '2025-06-10T08:00:00Z' },
  { id: 'el3', to: 'noor.khan@email.com', subject: 'University Application Status Update', status: 'DELIVERED', sentAt: '2025-06-09T14:00:00Z' },
  { id: 'el4', to: 'mohammed.ali@email.com', subject: 'IELTS Course Enrollment Confirmation', status: 'BOUNCED', sentAt: '2025-06-09T11:00:00Z' },
  { id: 'el5', to: 'yuki.tanaka@email.com', subject: 'Offer Accepted — Next Steps', status: 'OPENED', sentAt: '2025-06-08T09:00:00Z' },
];

const QUICK_REPLY_TEMPLATES = [
  { id: 'qr1', label: 'Thank you — will reply shortly', body: 'Thank you for your message. I\'ll get back to you shortly with more details.' },
  { id: 'qr2', label: 'Book a consultation', body: 'Would you like to book a free consultation? Visit aloeducation.com/book to choose a convenient time.' },
  { id: 'qr3', label: 'Documents under review', body: 'Your documents are currently under review. Our team will update you within 24 hours via the student portal.' },
  { id: 'qr4', label: 'Request Student ID', body: 'Could you please share your Student ID so I can look up your profile and assist you better?' },
  { id: 'qr5', label: 'Send timeline update', body: 'Here\'s your application timeline: documents received, university shortlisted, application being prepared. Next: submission.' },
];


const EMAIL_TEMPLATES = [
  { id: 'et1', name: 'Scholarship Alert', subject: 'New Scholarship Opportunity — {{country}}', body: 'Dear {{name}}, a new scholarship matching your profile is available...', category: 'Marketing' },
  { id: 'et2', name: 'Application Update', subject: 'Application Update — {{university}}', body: 'Dear {{name}}, your application status has been updated to {{status}}...', category: 'Transactional' },
  { id: 'et3', name: 'Pre-departure Guide', subject: 'Pre-departure Guide — {{country}}', body: 'Dear {{name}}, congratulations on your visa approval! Here\'s your pre-departure checklist...', category: 'Guide' },
  { id: 'et4', name: 'Welcome Email', subject: 'Welcome to ALO Education!', body: 'Dear {{name}}, welcome to ALO Education! Your journey to studying abroad starts here...', category: 'Onboarding' },
];

const DOC_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-sky-100 text-sky-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

const SMS_STATUS_COLORS: Record<string, string> = {
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-rose-100 text-rose-700',
  QUEUED: 'bg-amber-100 text-amber-700',
  SENT: 'bg-sky-100 text-sky-700',
  UNDELIVERED: 'bg-slate-100 text-slate-600',
};

const EMAIL_STATUS_COLORS: Record<string, string> = {
  OPENED: 'bg-emerald-100 text-emerald-700',
  CLICKED: 'bg-alo-blue-light text-alo-blue',
  DELIVERED: 'bg-sky-100 text-sky-700',
  BOUNCED: 'bg-rose-100 text-rose-700',
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

function formatMessageTime(dateStr: string): string {
  if (isToday(dateStr)) return formatTime(dateStr);
  if (isYesterday(dateStr)) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function CommunicationCenter({ onNavigate }: CommunicationCenterProps) {
  // State
  const [activeChannel, setActiveChannel] = useState<ChannelType>('FACEBOOK');
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Data state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Record<string, ContactContext>>({});
  const [emailCampaigns] = useState<EmailCampaign[]>(DEMO_EMAIL_CAMPAIGNS);
  const [emailLog] = useState(DEMO_EMAIL_LOG);

  // Real SMS data states
  const [smsStats, setSmsStats] = useState<SmsStats | null>(null);
  const [smsMessages, setSmsMessages] = useState<SmsMessageItem[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplateItem[]>([]);
  const [smsLoading, setSmsLoading] = useState(true);
  const [sendSmsOpen, setSendSmsOpen] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsForm, setSmsForm] = useState({ to: '', body: '', category: 'NOTIFICATION', templateId: '' });

  // ─── SMS Data Fetching ─────────────────────────────────────────────

  const fetchSmsData = useCallback(async () => {
    setSmsLoading(true);
    const [statsRes, msgsRes, tplRes] = await Promise.allSettled([
      fetch('/api/sms/stats').then((r) => r.json()),
      fetch('/api/sms?pageSize=50').then((r) => r.json()),
      fetch('/api/sms/templates').then((r) => r.json()),
    ]);

    if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
      setSmsStats(statsRes.value.stats);
    }
    if (msgsRes.status === 'fulfilled' && msgsRes.value?.success) {
      setSmsMessages(msgsRes.value.messages || []);
    }
    if (tplRes.status === 'fulfilled' && tplRes.value?.success) {
      setSmsTemplates(tplRes.value.templates || []);
    }
    setSmsLoading(false);
  }, []);

  // ─── Data Fetching ─────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      try {
        const [msgsRes, notifRes, leadsRes] = await Promise.allSettled([
          fetch('/api/messages').then((r) => r.json()),
          fetch('/api/notifications').then((r) => r.json()),
          fetch('/api/leads').then((r) => r.json()),
        ]);

        // Use real data if available, otherwise fallback to DEMO_
        let convs = DEMO_CONVERSATIONS;
        if (msgsRes.status === 'fulfilled' && msgsRes.value?.conversations?.length > 0) {
          convs = msgsRes.value.conversations;
        }
        setConversations(convs);

        let ctcts = DEMO_CONTACTS;
        if (leadsRes.status === 'fulfilled' && Array.isArray(leadsRes.value)) {
          const mapped: Record<string, ContactContext> = {};
          leadsRes.value.slice(0, 10).forEach((l: any) => {
            mapped[l.id] = {
              id: l.id,
              leadId: l.leadId,
              fullName: l.fullName,
              email: l.email,
              phone: l.phone,
              source: l.source,
              status: l.status,
              studyDestination: l.preferredCountry,
              applicationStage: l.applicationStage,
              profileCompletion: l.profileCompletion,
            };
          });
          if (Object.keys(mapped).length > 0) ctcts = mapped;
        }
        setContacts(ctcts);

        // Auto-select first conversation
        if (convs.length > 0) {
          setActiveConversation(convs[0].key);
        }
      } catch {
        // Fall through to DEMO_ data already set
        setConversations(DEMO_CONVERSATIONS);
        setContacts(DEMO_CONTACTS);
        if (DEMO_CONVERSATIONS.length > 0) {
          setActiveConversation(DEMO_CONVERSATIONS[0].key);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    fetchSmsData();
  }, [fetchSmsData]);

  // ─── SMS Handlers ──────────────────────────────────────────────────────

  const handleSendSms = useCallback(async () => {
    if (!smsForm.to.trim() || !smsForm.body.trim()) {
      toast.error('Please fill in recipient and message body.');
      return;
    }
    setSendingSms(true);
    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: smsForm.to.trim(),
          body: smsForm.body.trim(),
          category: smsForm.category,
          templateId: smsForm.templateId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('SMS queued for delivery');
        setSmsForm({ to: '', body: '', category: 'NOTIFICATION', templateId: '' });
        setSendSmsOpen(false);
        fetchSmsData();
      } else {
        toast.error(data.error || 'Failed to send SMS');
      }
    } catch {
      toast.error('Network error — please try again.');
    } finally {
      setSendingSms(false);
    }
  }, [smsForm, fetchSmsData]);

  const handleSelectTemplate = useCallback((templateId: string) => {
    if (!templateId) {
      setSmsForm((f) => ({ ...f, templateId: '', body: '' }));
      return;
    }
    const tpl = smsTemplates.find((t) => t.id === templateId);
    if (tpl) {
      setSmsForm((f) => ({ ...f, templateId, body: tpl.body }));
    }
  }, [smsTemplates]);

  // ─── Computed Values ───────────────────────────────────────────────────

  const channelConversations = useMemo(() => {
    return conversations.filter((c) => c.channel === activeChannel);
  }, [conversations, activeChannel]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return channelConversations;
    const q = searchQuery.toLowerCase();
    return channelConversations.filter(
      (c) =>
        (c.studentName?.toLowerCase().includes(q)) ||
        (c.fromPhone?.includes(q)) ||
        (c.fromEmail?.toLowerCase().includes(q)) ||
        c.messages.some((m) => m.body.toLowerCase().includes(q))
    );
  }, [channelConversations, searchQuery]);

  const activeConv = useMemo(() => {
    return conversations.find((c) => c.key === activeConversation) || null;
  }, [conversations, activeConversation]);

  const activeContact = useMemo(() => {
    if (!activeConv?.studentId) return null;
    return contacts[activeConv.studentId] || null;
  }, [activeConv, contacts]);

  const channelUnreadCounts = useMemo(() => {
    const counts: Record<ChannelType, number> = {
      FACEBOOK: 0, WHATSAPP: 0, ALO_CHAT: 0, SMS: 0, EMAIL: 0,
    };
    conversations.forEach((c) => {
      const ch = c.channel as ChannelType;
      if (counts[ch] !== undefined) counts[ch] += c.unread;
    });
    return counts;
  }, [conversations]);

  const totalUnread = useMemo(() => {
    return Object.values(channelUnreadCounts).reduce((a, b) => a + b, 0);
  }, [channelUnreadCounts]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleSelectConversation = useCallback((key: string) => {
    setActiveConversation(key);
    setMobileView('thread');
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim()) return;
    setMessageInput('');
  }, [messageInput]);

  const handleQuickReply = useCallback((body: string) => {
    setMessageInput(body);
  }, []);

  const handleBackToList = useCallback(() => {
    setMobileView('list');
  }, []);

  const handleChannelChange = useCallback((channel: string) => {
    setActiveChannel(channel as ChannelType);
    setActiveConversation(null);
    setMobileView('list');
  }, []);

  // ─── Render: Loading / Error ──────────────────────────────────────────

  if (loading) return <LoadingGrid count={8} />;

  if (error) {
    return (
      <EmptyState
        icon="AlertCircle"
        title="Failed to load communication center"
        description="Please try refreshing the page."
      />
    );
  }

  // ─── Render: Message Bubble ────────────────────────────────────────────

  const renderMessageBubble = (msg: InboxMessage, idx: number) => {
    const isSent = msg.direction === 'OUTBOUND';
    const showAvatar = !isSent && (idx === 0 || activeConv!.messages[idx - 1].direction === 'OUTBOUND');

    return (
      <div
        key={msg.id}
        className={cn('flex gap-2', isSent ? 'justify-end' : 'justify-start')}
      >
        {!isSent && (
          <div className={cn('w-8 shrink-0', showAvatar ? 'block' : 'invisible')}>
            <Avatar className="size-8 border border-border">
              <AvatarFallback className="bg-alo-gray-light text-xs font-semibold text-alo-gray">
                {activeConv?.studentName ? getInitials(activeConv.studentName) : '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className={cn('flex max-w-[80%] flex-col gap-1', isSent ? 'items-end' : 'items-start')}>
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              isSent
                ? 'rounded-br-md bg-alo-blue text-white'
                : 'rounded-bl-md bg-alo-gray-light text-alo-black'
            )}
          >
            {msg.body}
            {msg.mediaType && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-white/30 p-3 text-xs opacity-80">
                <Paperclip className="size-3.5" />
                <span>{msg.mediaType === 'IMAGE' ? 'Image attachment' : `${msg.mediaType} file`}</span>
              </div>
            )}
          </div>
          <div className={cn('flex items-center gap-1.5 text-[10px] text-alo-gray', isSent && 'flex-row-reverse')}>
            <span>{formatMessageTime(msg.receivedAt || msg.sentAt || '')}</span>
            {isSent && (
              <>
                {msg.read ? (
                  <CheckCheck className="size-3.5 text-alo-blue" />
                ) : msg.deliveryStatus === 'DELIVERED' ? (
                  <CheckCheck className="size-3.5 text-alo-gray" />
                ) : (
                  <Check className="size-3.5 text-alo-gray" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render: Conversation List Item ────────────────────────────────────

  const renderConversationItem = (conv: Conversation) => {
    const isActive = conv.key === activeConversation;
    const lastMsg = conv.messages[conv.messages.length - 1];
    const name = conv.studentName || conv.fromPhone || conv.fromEmail || 'Unknown';
    const config = CHANNEL_CONFIG[conv.channel];

    return (
      <button
        key={conv.key}
        onClick={() => handleSelectConversation(conv.key)}
        className={cn(
          'w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 border-b border-border/50',
          isActive
            ? 'bg-alo-blue-light/60'
            : 'hover:bg-alo-gray-light/50'
        )}
      >
        <div className="relative shrink-0">
          <Avatar className={cn('size-11 border', isActive ? 'border-alo-blue/30' : 'border-border')}>
            <AvatarFallback className={cn('text-xs font-semibold',
              isActive ? 'bg-alo-blue text-white' : 'bg-alo-gray-light text-alo-gray'
            )}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          {conv.unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-alo-orange text-[10px] font-bold text-white">
              {conv.unread > 9 ? '9+' : conv.unread}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('truncate text-sm font-semibold',
              conv.unread > 0 ? 'text-alo-black' : 'text-alo-gray'
            )}>
              {name}
            </span>
            <span className="shrink-0 text-[11px] text-alo-gray">
              {timeAgo(conv.lastMessageAt)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="flex-1 truncate text-xs text-alo-gray">
              {lastMsg?.direction === 'OUTBOUND' ? 'You: ' : ''}{lastMsg?.body || ''}
            </p>
            <Badge variant="outline" className={cn('shrink-0 text-[9px] px-1.5 py-0 font-medium', config.accent)}>
              {config.label}
            </Badge>
          </div>
        </div>
      </button>
    );
  };

  // ─── Render: Contact Context Sheet ─────────────────────────────────────

  const renderContactSheet = () => {
    if (!activeContact) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-alo-gray-light text-alo-gray">
            <Users className="size-7" />
          </div>
          <p className="mt-3 text-sm font-medium text-alo-gray">No contact linked</p>
          <p className="mt-1 text-xs text-alo-gray">Select a conversation with a linked student</p>
          <Button
            size="sm"
            className="mt-4 bg-alo-orange text-white hover:bg-alo-orange-dark"
            onClick={() => onNavigate?.('crm')}
          >
            <UserPlus className="mr-1.5 size-3.5" />
            Create Lead
          </Button>
        </div>
      );
    }

    const c = activeContact;
    return (
      <div className="space-y-5">
        {/* Contact Header */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="size-16 border-2 border-alo-blue/20">
            <AvatarFallback className="bg-alo-blue text-lg font-bold text-white">
              {getInitials(c.fullName)}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-3 text-base font-bold text-alo-black">{c.fullName}</h3>
          {c.leadId && (
            <Badge variant="outline" className="mt-1 text-[10px] font-mono text-alo-blue border-alo-blue/20">
              <Hash className="mr-1 size-2.5" />
              {c.leadId}
            </Badge>
          )}
          {c.status && (
            <Badge className={cn('mt-1.5',
              c.status === 'STUDENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-alo-orange-light text-alo-orange-dark'
            )}>
              {c.status}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="space-y-0">
          {c.email && <MetricRow label="Email" value={c.email} />}
          {c.phone && <MetricRow label="Phone" value={c.phone} />}
          {c.source && <MetricRow label="Source" value={c.source} />}
          {c.studyDestination && <MetricRow label="Destination" value={c.studyDestination} />}
          {c.programTitle && <MetricRow label="Program" value={c.programTitle} />}
          {c.lastActivity && <MetricRow label="Last Active" value={timeAgo(c.lastActivity)} />}
        </div>

        <Separator />

        {/* Application Progress */}
        {c.applicationStage && (
          <div>
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-alo-gray">
              Application Stage
            </h4>
            <Badge className={cn('text-xs',
              c.applicationStage === 'ENROLLED' || c.applicationStage === 'VISA_APPROVED'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-alo-blue-light text-alo-blue'
            )}>
              {STAGE_LABELS[c.applicationStage] || c.applicationStage}
            </Badge>
            {c.profileCompletion !== undefined && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-alo-gray">Profile Completion</span>
                  <span className="font-semibold text-alo-black">{c.profileCompletion}%</span>
                </div>
                <MiniBar value={c.profileCompletion} max={100} />
              </div>
            )}
          </div>
        )}

        {/* Document Status */}
        {c.documents && c.documents.length > 0 && (
          <div>
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-alo-gray">
              Documents
            </h4>
            <div className="space-y-2">
              {c.documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                  <span className="text-xs font-medium text-alo-black">{doc.name}</span>
                  <Badge className={cn('text-[9px]', DOC_STATUS_COLORS[doc.status] || 'bg-slate-100 text-slate-600')}>
                    {doc.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Quick Actions */}
        <div>
          <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-alo-gray">
            Quick Actions
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs border-border hover:bg-alo-blue-light hover:text-alo-blue hover:border-alo-blue/30"
              onClick={() => onNavigate?.('crm')}
            >
              <UserPlus className="mr-1.5 size-3" />
              Create Lead
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs border-border hover:bg-alo-orange-light hover:text-alo-orange hover:border-alo-orange/30"
              onClick={() => onNavigate?.('student-360')}
            >
              <CalendarClock className="mr-1.5 size-3" />
              Schedule Appt
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs border-border hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
            >
              <Send className="mr-1.5 size-3" />
              Send Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs border-border hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
              onClick={() => onNavigate?.('student-360')}
            >
              <Target className="mr-1.5 size-3" />
              Student 360
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render: Message Thread ────────────────────────────────────────────

  const renderMessageThread = () => {
    if (!activeConv) {
      return (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-alo-blue-light text-alo-blue">
            <Inbox className="size-8" />
          </div>
          <p className="mt-4 text-base font-semibold text-alo-black">Select a conversation</p>
          <p className="mt-1 text-sm text-alo-gray">Choose from the list to start messaging</p>
        </div>
      );
    }

    const config = CHANNEL_CONFIG[activeConv.channel];
    const name = activeConv.studentName || activeConv.fromPhone || activeConv.fromEmail || 'Unknown';

    return (
      <div className="flex h-full flex-col">
        {/* Thread Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Mobile back button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden size-8"
              onClick={handleBackToList}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Avatar className="size-9 border border-border">
              <AvatarFallback className="bg-alo-blue text-xs font-semibold text-white">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-alo-black">{name}</h3>
                <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', config.accent)}>
                  {config.label}
                </Badge>
              </div>
              {activeConv.studentId && contacts[activeConv.studentId]?.leadId && (
                <p className="text-[11px] font-mono text-alo-gray">
                  {contacts[activeConv.studentId].leadId}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-alo-gray hover:text-alo-blue"
                    onClick={() => setContactSheetOpen(true)}
                  >
                    <Users className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Contact Details</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 text-alo-gray hover:text-alo-blue">
                    <MoreVertical className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>More Options</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="mx-auto max-w-2xl space-y-3">
            {activeConv.messages.map((msg, idx) => renderMessageBubble(msg, idx))}
          </div>
        </ScrollArea>

        {/* Quick Reply Templates Bar */}
        <div className="border-t border-border">
          <ScrollArea className="w-full">
            <div className="flex gap-2 px-4 py-2">
              {QUICK_REPLY_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleQuickReply(tpl.body)}
                  className="shrink-0 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-medium text-alo-gray transition-all hover:border-alo-blue/40 hover:bg-alo-blue-light hover:text-alo-blue"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Message Input */}
        <div className="border-t border-border bg-white p-3">
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 size-9 text-alo-gray hover:text-alo-blue">
              <Paperclip className="size-4" />
            </Button>
            <div className="relative flex-1">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="h-10 rounded-xl border-border bg-alo-gray-light/50 pr-10 text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-alo-gray hover:text-alo-orange"
              >
                <Smile className="size-4" />
              </Button>
            </div>
            <Button
              size="icon"
              className="shrink-0 size-10 rounded-xl bg-alo-blue text-white hover:bg-alo-blue-dark"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render: SMS Section ───────────────────────────────────────────────

  const renderSmsSection = () => {
    const totalSent = smsStats?.total ?? 0;
    const totalDelivered = smsStats?.delivered ?? 0;
    const totalFailed = smsStats?.failed ?? 0;
    const deliveryRate = smsStats?.deliveryRate ?? 0;
    const failureRate = smsStats?.failureRate ?? 0;

    if (smsLoading) return <LoadingGrid count={4} />;

    return (
      <div className="space-y-6">
        {/* Send SMS Button */}
        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-alo-blue text-white hover:bg-alo-blue-dark"
            onClick={() => setSendSmsOpen(!sendSmsOpen)}
          >
            <Send className="mr-1.5 size-3.5" />
            {sendSmsOpen ? 'Cancel' : 'Send SMS'}
          </Button>
        </div>

        {/* Send SMS Form */}
        {sendSmsOpen && (
          <SectionCard title="Compose SMS" icon="Send">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-alo-gray">Recipient Phone</Label>
                  <Input
                    placeholder="+880 1XXX-XXXXXX"
                    value={smsForm.to}
                    onChange={(e) => setSmsForm((f) => ({ ...f, to: e.target.value }))}
                    className="h-9 text-sm border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-alo-gray">Category</Label>
                  <Select value={smsForm.category} onValueChange={(v) => setSmsForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger className="h-9 text-sm border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOTIFICATION">Notification</SelectItem>
                      <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
                      <SelectItem value="ALERT">Alert</SelectItem>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="OTP">OTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-alo-gray">Template (optional - auto-fills body)</Label>
                <Select value={smsForm.templateId} onValueChange={handleSelectTemplate}>
                  <SelectTrigger className="h-9 text-sm border-border">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {smsTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name} ({t.category})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-alo-gray">Message Body</Label>
                  <span className="text-[10px] text-alo-gray">{smsForm.body.length}/160 chars</span>
                </div>
                <Textarea
                  placeholder="Type your SMS message..."
                  value={smsForm.body}
                  onChange={(e) => setSmsForm((f) => ({ ...f, body: e.target.value }))}
                  className="min-h-[80px] text-sm border-border resize-none"
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="bg-alo-blue text-white hover:bg-alo-blue-dark"
                  onClick={handleSendSms}
                  disabled={sendingSms || !smsForm.to.trim() || !smsForm.body.trim()}
                >
                  {sendingSms ? (
                    <><Clock className="mr-1.5 size-3.5 animate-spin" />Sending...</>
                  ) : (
                    <><Send className="mr-1.5 size-3.5" />Send SMS</>
                  )}
                </Button>
              </div>
            </div>
          </SectionCard>
        )}

        {/* SMS Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Sent" value={totalSent.toLocaleString()} icon="Send" accent="blue" hint="All messages" />
          <StatCard label="Delivered" value={totalDelivered.toLocaleString()} icon="CheckCheck" accent="emerald" hint={`${deliveryRate}% delivery rate`} />
          <StatCard label="Failed" value={totalFailed.toLocaleString()} icon="AlertCircle" accent="rose" hint={`${failureRate}% failure rate`} />
        </div>

        {/* By Category Breakdown */}
        {smsStats && smsStats.byCategory.length > 0 && (
          <SectionCard title="By Category" icon="BarChart3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {smsStats.byCategory.map((c) => (
                <div key={c.category} className="rounded-xl border border-border/50 p-3 text-center">
                  <p className="text-lg font-bold text-alo-black">{c.count}</p>
                  <p className="text-[10px] font-medium text-alo-gray mt-0.5">{c.category || 'Uncategorized'}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* SMS Templates */}
        <SectionCard title="SMS Templates" icon="FileText">
          <div className="space-y-3 max-h-72 overflow-y-auto alo-scroll">
            {smsTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-alo-gray-light text-alo-gray">
                  <FileText className="size-5" />
                </div>
                <p className="mt-2 text-xs text-alo-gray">No SMS templates yet</p>
              </div>
            ) : (
              smsTemplates.map((tpl) => (
                <div key={tpl.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/50 p-3 transition-all hover:border-alo-blue/30 hover:bg-alo-blue-light/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-alo-black">{tpl.name}</span>
                      <Badge variant="outline" className="text-[9px] text-alo-gray border-border">{tpl.category}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-alo-gray line-clamp-2">{tpl.body}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 size-7 text-alo-gray hover:text-alo-blue"
                    onClick={() => {
                      setSmsForm({ to: '', body: tpl.body, category: tpl.category, templateId: tpl.id });
                      setSendSmsOpen(true);
                    }}
                  >
                    <Send className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Recent SMS Log */}
        <SectionCard title="Recent SMS" icon="Clock">
          <div className="space-y-2 max-h-64 overflow-y-auto alo-scroll">
            {smsMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-alo-gray-light text-alo-gray">
                  <Inbox className="size-5" />
                </div>
                <p className="mt-2 text-xs text-alo-gray">No SMS messages sent yet</p>
              </div>
            ) : (
              smsMessages.map((sms) => (
                <div key={sms.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/50 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-alo-gray">{sms.to}</span>
                      <Badge className={cn('text-[9px]', SMS_STATUS_COLORS[sms.status] || 'bg-slate-100 text-slate-600')}>
                        {sms.status}
                      </Badge>
                      {sms.category && (
                        <Badge variant="outline" className="text-[9px] text-alo-gray border-border">{sms.category}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-alo-black line-clamp-1">{sms.body}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-alo-gray whitespace-nowrap">{timeAgo(sms.sentAt || sms.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    );
  };


  const renderEmailSection = () => {
    const totalSent = emailCampaigns.reduce((a, c) => a + c.sent, 0);
    const totalOpened = emailCampaigns.reduce((a, c) => a + c.opened, 0);
    const totalClicked = emailCampaigns.reduce((a, c) => a + c.clicked, 0);
    const totalBounced = emailCampaigns.reduce((a, c) => a + c.bounced, 0);

    return (
      <div className="space-y-6">
        {/* Email Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Sent" value={totalSent.toLocaleString()} icon="Send" accent="blue" />
          <StatCard label="Opened" value={totalOpened.toLocaleString()} icon="MailOpen" accent="emerald" hint={`${totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0}% open rate`} />
          <StatCard label="Clicked" value={totalClicked.toLocaleString()} icon="MousePointerClick" accent="violet" hint={`${totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0}% CTR`} />
          <StatCard label="Bounced" value={totalBounced.toLocaleString()} icon="Ban" accent="rose" hint={`${totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : 0}% bounce rate`} />
        </div>

        {/* Campaigns Table */}
        <SectionCard title="Email Campaigns" icon="Megaphone">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-alo-gray">Campaign</TableHead>
                  <TableHead className="text-xs font-semibold text-alo-gray text-right">Sent</TableHead>
                  <TableHead className="text-xs font-semibold text-alo-gray text-right">Opened</TableHead>
                  <TableHead className="text-xs font-semibold text-alo-gray text-right">Clicked</TableHead>
                  <TableHead className="text-xs font-semibold text-alo-gray text-right">Bounced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailCampaigns.map((camp) => (
                  <TableRow key={camp.id} className="border-border/50">
                    <TableCell className="text-sm font-medium text-alo-black">{camp.name}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-alo-gray">{camp.sent.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-emerald-600">{camp.opened.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-alo-blue">{camp.clicked.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-rose-600">{camp.bounced.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        {/* Email Templates */}
        <SectionCard title="Email Templates" icon="FileText" action={
          <Button size="sm" variant="outline" className="h-8 text-xs border-border hover:border-alo-blue/40 hover:text-alo-blue">
            <FileText className="mr-1.5 size-3" />
            New Template
          </Button>
        }>
          <div className="space-y-3 max-h-72 overflow-y-auto alo-scroll">
            {EMAIL_TEMPLATES.map((tpl) => (
              <div key={tpl.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/50 p-3 transition-all hover:border-alo-blue/30 hover:bg-alo-blue-light/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-alo-black">{tpl.name}</span>
                    <Badge variant="outline" className="text-[9px] text-alo-gray border-border">{tpl.category}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-alo-blue">{tpl.subject}</p>
                  <p className="mt-1 text-xs text-alo-gray line-clamp-1">{tpl.body}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 size-7 text-alo-gray hover:text-alo-blue">
                  <Send className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Recent Email Log */}
        <SectionCard title="Recent Emails" icon="Clock">
          <div className="space-y-2 max-h-64 overflow-y-auto alo-scroll">
            {emailLog.map((email) => (
              <div key={email.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/50 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-alo-gray truncate">{email.to}</span>
                    <Badge className={cn('text-[9px]', EMAIL_STATUS_COLORS[email.status] || 'bg-slate-100 text-slate-600')}>
                      {email.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs font-medium text-alo-black truncate">{email.subject}</p>
                </div>
                <span className="shrink-0 text-[10px] text-alo-gray whitespace-nowrap">{timeAgo(email.sentAt)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    );
  };

  // ─── Render: Conversation List Panel ───────────────────────────────────

  const renderConversationList = () => {
    return (
      <div className="flex h-full flex-col border-r border-border bg-white">
        {/* Search Bar */}
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-alo-gray" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-xl border-border bg-alo-gray-light/50 pl-9 pr-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-alo-gray hover:text-alo-black"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-alo-gray-light text-alo-gray">
                <Inbox className="size-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-alo-gray">No conversations found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-1 text-xs text-alo-blue hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y-0">
              {filteredConversations.map(renderConversationItem)}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
          <PageHeader
            title="Communication Center"
            subtitle={`${totalUnread > 0 ? `${totalUnread} unread across all channels` : 'All channels — zero unread'}`}
            icon="Radio"
          />
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <Badge className="bg-alo-orange text-white hover:bg-alo-orange-dark text-xs font-bold px-3 py-1">
                <Inbox className="mr-1.5 size-3.5" />
                {totalUnread} Unread
              </Badge>
            )}
          </div>
        </div>

        {/* Channel Tabs */}
        <div className="border-b border-border bg-white px-4 lg:px-6">
          <Tabs value={activeChannel} onValueChange={handleChannelChange} className="w-full">
            <TabsList className="h-11 w-full justify-start rounded-none border-0 bg-transparent p-0 gap-0">
              {(Object.keys(CHANNEL_CONFIG) as ChannelType[]).map((ch) => {
                const config = CHANNEL_CONFIG[ch];
                const isActive = activeChannel === ch;
                const unread = channelUnreadCounts[ch];

                if (ch === 'SMS') {
                  // SMS and Email are dashboard tabs, not conversation tabs
                  return (
                    <TabsTrigger
                      key={ch}
                      value={ch}
                      className={cn(
                        'relative flex items-center gap-2 rounded-none border-b-2 px-4 py-3 text-sm font-medium transition-all data-[state=active]:shadow-none',
                        isActive
                          ? 'border-alo-blue text-alo-blue bg-transparent'
                          : 'border-transparent text-alo-gray hover:text-alo-black hover:bg-transparent'
                      )}
                      onClick={() => setMobileView('sms')}
                    >
                      {config.icon}
                      <span className="hidden sm:inline">{config.label}</span>
                      <span className="sm:hidden">SMS</span>
                      {unread > 0 && <TabCounter count={unread} />}
                    </TabsTrigger>
                  );
                }

                if (ch === 'EMAIL') {
                  return (
                    <TabsTrigger
                      key={ch}
                      value={ch}
                      className={cn(
                        'relative flex items-center gap-2 rounded-none border-b-2 px-4 py-3 text-sm font-medium transition-all data-[state=active]:shadow-none',
                        isActive
                          ? 'border-alo-blue text-alo-blue bg-transparent'
                          : 'border-transparent text-alo-gray hover:text-alo-black hover:bg-transparent'
                      )}
                      onClick={() => setMobileView('email')}
                    >
                      {config.icon}
                      <span className="hidden sm:inline">{config.label}</span>
                      <span className="sm:hidden">Email</span>
                      {unread > 0 && <TabCounter count={unread} />}
                    </TabsTrigger>
                  );
                }

                return (
                  <TabsTrigger
                    key={ch}
                    value={ch}
                    className={cn(
                      'relative flex items-center gap-2 rounded-none border-b-2 px-4 py-3 text-sm font-medium transition-all data-[state=active]:shadow-none',
                      isActive
                        ? 'border-alo-blue text-alo-blue bg-transparent'
                        : 'border-transparent text-alo-gray hover:text-alo-black hover:bg-transparent'
                    )}
                  >
                    {config.icon}
                    <span className="hidden sm:inline">{config.label}</span>
                    <span className="sm:hidden">{config.label.slice(0, 5)}</span>
                    {unread > 0 && <TabCounter count={unread} />}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="relative flex-1 overflow-hidden">
          {/* ── Desktop Layout: 3-column ── */}
          <div className="hidden lg:flex h-full">
            {/* Left: Conversation List (visible for chat channels) */}
            {activeChannel !== 'SMS' && activeChannel !== 'EMAIL' && (
              <div className="w-80 shrink-0 overflow-hidden">
                {renderConversationList()}
              </div>
            )}

            {/* Center: Main Content */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {activeChannel === 'SMS' ? (
                <ScrollArea className="h-full">
                  <div className="mx-auto max-w-4xl p-6">
                    {renderSmsSection()}
                  </div>
                </ScrollArea>
              ) : activeChannel === 'EMAIL' ? (
                <ScrollArea className="h-full">
                  <div className="mx-auto max-w-4xl p-6">
                    {renderEmailSection()}
                  </div>
                </ScrollArea>
              ) : (
                renderMessageThread()
              )}
            </div>

            {/* Right: Contact Context Sidebar (desktop inline) */}
            {activeChannel !== 'SMS' && activeChannel !== 'EMAIL' && (
              <div className="w-72 shrink-0 border-l border-border bg-white overflow-y-auto alo-scroll">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-alo-blue-light text-alo-blue">
                      <Users className="size-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-alo-black">Contact Context</h3>
                  </div>
                  {renderContactSheet()}
                </div>
              </div>
            )}
          </div>

          {/* ── Mobile Layout: Tab-based ── */}
          <div className="flex h-full flex-col lg:hidden">
            {mobileView === 'list' && (
              <>
                {activeChannel === 'SMS' ? (
                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      {renderSmsSection()}
                    </div>
                  </ScrollArea>
                ) : activeChannel === 'EMAIL' ? (
                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      {renderEmailSection()}
                    </div>
                  </ScrollArea>
                ) : (
                  renderConversationList()
                )}
              </>
            )}
            {mobileView === 'thread' && renderMessageThread()}
            {mobileView === 'sms' && (
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {renderSmsSection()}
                </div>
              </ScrollArea>
            )}
            {mobileView === 'email' && (
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {renderEmailSection()}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Contact Context Sheet */}
      <Sheet open={contactSheetOpen} onOpenChange={setContactSheetOpen}>
        <SheetContent side="right" className="w-80 overflow-y-auto alo-scroll p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="text-base font-semibold text-alo-black">Contact Details</SheetTitle>
            <SheetDescription className="text-xs text-alo-gray">Student profile and quick actions</SheetDescription>
          </SheetHeader>
          <div className="p-4">
            {renderContactSheet()}
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
