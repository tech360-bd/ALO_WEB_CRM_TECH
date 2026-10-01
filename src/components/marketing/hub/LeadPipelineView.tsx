'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  UserPlus,
  Phone,
  Mail,
  Globe,
  Star,
  ArrowRight,
  Search,
  Filter,
  UserCheck,
  UserX,
  ClipboardList,
  Send,
  Link2,
  FileText,
  MessageSquare,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Users,
  RefreshCw,
  Merge,
  Trash2,
  Eye,
  GraduationCap,
  CalendarDays,
  Instagram,
  Facebook,
  Twitter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PipelineStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'assigned'
  | 'converted'
  | 'lost';

interface ConversationEntry {
  id: string;
  date: string;
  channel: 'whatsapp' | 'email' | 'phone' | 'chat';
  direction: 'inbound' | 'outbound';
  message: string;
  counselor?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

interface Lead {
  id: string;
  name: string;
  source: string;
  phone: string;
  email: string;
  score: number;
  counselor: string;
  stage: PipelineStage;
  createdAt: string;
  lastActivity: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  programInterest: string;
  conversations: ConversationEntry[];
  documents: Document[];
  applicationStatus?: 'none' | 'started' | 'submitted' | 'review';
  notes: string;
  studentId?: string;
}

// ---------------------------------------------------------------------------
// Mock Data — 12 Leads
// ---------------------------------------------------------------------------

const MOCK_LEADS: Lead[] = [
  {
    id: 'L-001',
    name: 'Sarah Al-Rashid',
    source: 'Website Form',
    phone: '+971 50 123 4567',
    email: 'sarah.ar@email.com',
    score: 92,
    counselor: 'Fatima K.',
    stage: 'new',
    createdAt: '2025-01-15',
    lastActivity: '2025-01-15 10:30',
    whatsapp: '+971 50 123 4567',
    instagram: '@sarah.ar',
    facebook: 'sarah.alrashid',
    programInterest: 'BSc Computer Science',
    conversations: [],
    documents: [],
    applicationStatus: 'none',
    notes: 'Very interested in CS program, attended open day.',
  },
  {
    id: 'L-002',
    name: 'Mohammed Hassan',
    source: 'WhatsApp Campaign',
    phone: '+971 55 234 5678',
    email: 'moh.hassan@email.com',
    score: 85,
    counselor: 'Ahmed S.',
    stage: 'new',
    createdAt: '2025-01-14',
    lastActivity: '2025-01-14 14:20',
    whatsapp: '+971 55 234 5678',
    instagram: '@moh.h',
    programInterest: 'MBA International Business',
    conversations: [],
    documents: [],
    applicationStatus: 'none',
    notes: 'Referred by friend. Working professional at Emirates.',
  },
  {
    id: 'L-003',
    name: 'Aisha Bin Zayed',
    source: 'Instagram Ad',
    phone: '+971 52 345 6789',
    email: 'aisha.bz@email.com',
    score: 78,
    counselor: '',
    stage: 'new',
    createdAt: '2025-01-14',
    lastActivity: '2025-01-14 09:15',
    whatsapp: '+971 52 345 6789',
    instagram: '@aisha.bz',
    facebook: 'aisha.binzayed',
    programInterest: 'MSc Data Science',
    conversations: [],
    documents: [],
    applicationStatus: 'none',
    notes: '',
  },
  {
    id: 'L-004',
    name: 'Omar Khalifa',
    source: 'Google Ads',
    phone: '+971 54 456 7890',
    email: 'omar.k@email.com',
    score: 71,
    counselor: 'Fatima K.',
    stage: 'contacted',
    createdAt: '2025-01-12',
    lastActivity: '2025-01-14 11:45',
    whatsapp: '+971 54 456 7890',
    programInterest: 'BBA Marketing',
    conversations: [
      {
        id: 'c1',
        date: '2025-01-13 09:00',
        channel: 'phone',
        direction: 'outbound',
        message: 'Called lead, discussed BBA program overview.',
        counselor: 'Fatima K.',
      },
      {
        id: 'c2',
        date: '2025-01-14 11:45',
        channel: 'whatsapp',
        direction: 'inbound',
        message: 'Lead asked for scholarship information.',
      },
    ],
    documents: [
      {
        id: 'd1',
        name: 'high_school_transcript.pdf',
        type: 'PDF',
        size: '1.2 MB',
        uploadedAt: '2025-01-13',
      },
    ],
    applicationStatus: 'started',
    notes: 'Needs scholarship guidance. Follow up on Jan 18.',
  },
  {
    id: 'L-005',
    name: 'Layla Mansour',
    source: 'Referral',
    phone: '+971 56 567 8901',
    email: 'layla.m@email.com',
    score: 88,
    counselor: 'Ahmed S.',
    stage: 'contacted',
    createdAt: '2025-01-11',
    lastActivity: '2025-01-15 08:30',
    whatsapp: '+971 56 567 8901',
    instagram: '@layla.m',
    twitter: '@laylam',
    programInterest: 'MSc Artificial Intelligence',
    conversations: [
      {
        id: 'c3',
        date: '2025-01-12 10:00',
        channel: 'whatsapp',
        direction: 'outbound',
        message: 'Sent program brochure and fee structure.',
        counselor: 'Ahmed S.',
      },
      {
        id: 'c4',
        date: '2025-01-15 08:30',
        channel: 'email',
        direction: 'inbound',
        message: 'Replied with questions about part-time options.',
      },
    ],
    documents: [
      {
        id: 'd2',
        name: 'cv_layla_mansour.pdf',
        type: 'PDF',
        size: '850 KB',
        uploadedAt: '2025-01-12',
      },
    ],
    applicationStatus: 'started',
    notes: 'Interested in part-time. Strong academic background.',
  },
  {
    id: 'L-006',
    name: 'Khalid Al Maktoum',
    source: 'LinkedIn',
    phone: '+971 50 678 9012',
    email: 'khalid.am@email.com',
    score: 65,
    counselor: '',
    stage: 'contacted',
    createdAt: '2025-01-10',
    lastActivity: '2025-01-13 16:00',
    whatsapp: '+971 50 678 9012',
    programInterest: 'Executive MBA',
    conversations: [
      {
        id: 'c5',
        date: '2025-01-11 14:00',
        channel: 'email',
        direction: 'outbound',
        message: 'Initial introduction email sent.',
      },
    ],
    documents: [],
    applicationStatus: 'none',
    notes: 'Senior manager at ADNOC. Busy schedule.',
  },
  {
    id: 'L-007',
    name: 'Noora Al Suwaidi',
    source: 'Facebook Ad',
    phone: '+971 55 789 0123',
    email: 'noora.as@email.com',
    score: 95,
    counselor: 'Fatima K.',
    stage: 'qualified',
    createdAt: '2025-01-08',
    lastActivity: '2025-01-15 13:00',
    whatsapp: '+971 55 789 0123',
    instagram: '@noora.as',
    facebook: 'noora.alsuwaidi',
    programInterest: 'BSc Psychology',
    conversations: [
      {
        id: 'c6',
        date: '2025-01-09 10:00',
        channel: 'whatsapp',
        direction: 'outbound',
        message: 'Welcome message with program details.',
        counselor: 'Fatima K.',
      },
      {
        id: 'c7',
        date: '2025-01-11 11:00',
        channel: 'phone',
        direction: 'inbound',
        message: 'Lead called to ask about campus tour.',
      },
      {
        id: 'c8',
        date: '2025-01-12 14:00',
        channel: 'whatsapp',
        direction: 'outbound',
        message: 'Scheduled campus tour for Jan 14.',
        counselor: 'Fatima K.',
      },
      {
        id: 'c9',
        date: '2025-01-15 13:00',
        channel: 'chat',
        direction: 'inbound',
        message: 'Attended campus tour, very impressed. Ready to apply.',
      },
    ],
    documents: [
      {
        id: 'd3',
        name: 'passport_copy.pdf',
        type: 'PDF',
        size: '500 KB',
        uploadedAt: '2025-01-14',
      },
      {
        id: 'd4',
        name: 'high_school_marksheet.pdf',
        type: 'PDF',
        size: '1.1 MB',
        uploadedAt: '2025-01-14',
      },
      {
        id: 'd5',
        name: 'personal_statement.docx',
        type: 'DOCX',
        size: '320 KB',
        uploadedAt: '2025-01-15',
      },
    ],
    applicationStatus: 'submitted',
    notes: 'Hot lead. Attended campus tour and loved it. High intent.',
  },
  {
    id: 'L-008',
    name: 'Youssef El-Masri',
    source: 'Website Chat',
    phone: '+971 52 890 1234',
    email: 'youssef.em@email.com',
    score: 82,
    counselor: 'Ahmed S.',
    stage: 'qualified',
    createdAt: '2025-01-09',
    lastActivity: '2025-01-15 09:00',
    whatsapp: '+971 52 890 1234',
    programInterest: 'BSc Cyber Security',
    conversations: [
      {
        id: 'c10',
        date: '2025-01-10 08:00',
        channel: 'chat',
        direction: 'inbound',
        message: 'Asked about cybersecurity program duration.',
      },
      {
        id: 'c11',
        date: '2025-01-12 15:00',
        channel: 'whatsapp',
        direction: 'outbound',
        message: 'Sent detailed curriculum and career outcomes.',
        counselor: 'Ahmed S.',
      },
    ],
    documents: [],
    applicationStatus: 'started',
    notes: 'Currently working in IT. Wants career change.',
  },
  {
    id: 'L-009',
    name: 'Fatima Al Zaabi',
    source: 'Event - Gulf Education Fair',
    phone: '+971 54 901 2345',
    email: 'fatima.az@email.com',
    score: 90,
    counselor: 'Fatima K.',
    stage: 'assigned',
    createdAt: '2025-01-05',
    lastActivity: '2025-01-15 15:00',
    whatsapp: '+971 54 901 2345',
    instagram: '@fatima.az',
    programInterest: 'MSc Finance',
    conversations: [
      {
        id: 'c12',
        date: '2025-01-06 10:00',
        channel: 'phone',
        direction: 'outbound',
        message: 'Post-event follow up call. Very interested.',
        counselor: 'Fatima K.',
      },
      {
        id: 'c13',
        date: '2025-01-10 11:00',
        channel: 'email',
        direction: 'outbound',
        message: 'Sent application packet and financial aid info.',
        counselor: 'Fatima K.',
      },
      {
        id: 'c14',
        date: '2025-01-15 15:00',
        channel: 'whatsapp',
        direction: 'inbound',
        message: 'Submitted complete application.',
      },
    ],
    documents: [
      {
        id: 'd6',
        name: 'bachelor_transcript.pdf',
        type: 'PDF',
        size: '2.1 MB',
        uploadedAt: '2025-01-12',
      },
      {
        id: 'd7',
        name: 'ielts_score.pdf',
        type: 'PDF',
        size: '400 KB',
        uploadedAt: '2025-01-12',
      },
      {
        id: 'd8',
        name: 'recommendation_letter.pdf',
        type: 'PDF',
        size: '600 KB',
        uploadedAt: '2025-01-14',
      },
    ],
    applicationStatus: 'submitted',
    notes: 'Excellent candidate. Strong finance background. Scholarship eligible.',
  },
  {
    id: 'L-010',
    name: 'Hassan Al Neyadi',
    source: 'WhatsApp Campaign',
    phone: '+971 56 012 3456',
    email: 'hassan.an@email.com',
    score: 45,
    counselor: '',
    stage: 'lost',
    createdAt: '2025-01-03',
    lastActivity: '2025-01-10 12:00',
    whatsapp: '+971 56 012 3456',
    programInterest: 'BSc Engineering',
    conversations: [
      {
        id: 'c15',
        date: '2025-01-04 09:00',
        channel: 'whatsapp',
        direction: 'outbound',
        message: 'Initial outreach message.',
      },
      {
        id: 'c16',
        date: '2025-01-07 10:00',
        channel: 'whatsapp',
        direction: 'inbound',
        message: 'Lead said they enrolled elsewhere.',
      },
    ],
    documents: [],
    applicationStatus: 'none',
    notes: 'Chose competitor institution.',
  },
  {
    id: 'L-011',
    name: 'Mira Al Qasimi',
    source: 'Google Ads',
    phone: '+971 50 123 7890',
    email: 'mira.aq@email.com',
    score: 87,
    counselor: 'Ahmed S.',
    stage: 'converted',
    createdAt: '2024-12-20',
    lastActivity: '2025-01-14 16:30',
    whatsapp: '+971 50 123 7890',
    instagram: '@mira.aq',
    facebook: 'mira.alqasimi',
    twitter: '@miraaq',
    programInterest: 'BSc Digital Media',
    conversations: [
      {
        id: 'c17',
        date: '2024-12-21 10:00',
        channel: 'phone',
        direction: 'outbound',
        message: 'First contact. Discussed program overview.',
        counselor: 'Ahmed S.',
      },
      {
        id: 'c18',
        date: '2024-12-28 14:00',
        channel: 'whatsapp',
        direction: 'outbound',
        message: 'Application assistance and document checklist.',
        counselor: 'Ahmed S.',
      },
      {
        id: 'c19',
        date: '2025-01-05 09:00',
        channel: 'email',
        direction: 'inbound',
        message: 'Application approved. Asked about enrollment steps.',
      },
    ],
    documents: [
      {
        id: 'd9',
        name: 'offer_letter.pdf',
        type: 'PDF',
        size: '750 KB',
        uploadedAt: '2025-01-08',
      },
    ],
    applicationStatus: 'review',
    studentId: 'AE-2025000001',
    notes: 'Successfully converted! Full-time enrollment for Spring 2025.',
  },
  {
    id: 'L-012',
    name: 'Tariq Nasser',
    source: 'Instagram Ad',
    phone: '+971 52 345 0987',
    email: 'tariq.n@email.com',
    score: 35,
    counselor: '',
    stage: 'lost',
    createdAt: '2024-12-28',
    lastActivity: '2025-01-05 11:00',
    whatsapp: '+971 52 345 0987',
    instagram: '@tariq.n',
    programInterest: 'BSc Architecture',
    conversations: [
      {
        id: 'c20',
        date: '2024-12-29 10:00',
        channel: 'whatsapp',
        direction: 'outbound',
        message: 'Welcome message sent with program info.',
      },
      {
        id: 'c21',
        date: '2025-01-05 11:00',
        channel: 'whatsapp',
        direction: 'inbound',
        message: 'No longer interested in studying. Budget constraints.',
      },
    ],
    documents: [],
    applicationStatus: 'none',
    notes: 'Not reachable. Budget was the main barrier.',
  },
];

const STAGES: { key: PipelineStage; label: string; color: string; bg: string }[] = [
  { key: 'new', label: 'New', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
  { key: 'contacted', label: 'Contacted', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { key: 'qualified', label: 'Qualified', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
  { key: 'assigned', label: 'Assigned', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
  { key: 'converted', label: 'Converted', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { key: 'lost', label: 'Lost', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
];

const COUNSELORS = ['Fatima K.', 'Ahmed S.', 'Sara M.', 'Omar B.'];

const SCORE_COLORS = (score: number) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-rose-600';
};

const SCORE_BAR_COLOR = (score: number) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-rose-500';
};

const CHANNEL_ICON = (ch: string) => {
  switch (ch) {
    case 'whatsapp': return 'text-green-600';
    case 'email': return 'text-blue-600';
    case 'phone': return 'text-purple-600';
    default: return 'text-gray-600';
  }
};

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function LeadCard({
  lead,
  onSelect,
}: {
  lead: Lead;
  onSelect: (lead: Lead) => void;
}) {
  const stageInfo = STAGES.find((s) => s.key === lead.stage);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow py-0 gap-0"
      onClick={() => onSelect(lead)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
              {lead.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{lead.name}</p>
              <p className="text-xs text-muted-foreground">{lead.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Zap className={cn('h-3 w-3', SCORE_COLORS(lead.score))} />
            <span className={cn('text-xs font-bold', SCORE_COLORS(lead.score))}>
              {lead.score}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {lead.source}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {lead.programInterest}
          </Badge>
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span className="truncate">{lead.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.email}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {lead.counselor || (
              <span className="text-rose-500 font-medium">Unassigned</span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">{lead.createdAt}</span>
        </div>

        {lead.conversations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {lead.conversations.length} conversation{lead.conversations.length > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeadDetailDialog({
  lead,
  open,
  onOpenChange,
  onMoveStage,
  onAssign,
  onConvert,
  onSendPortal,
}: {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveStage: (leadId: string, stage: PipelineStage) => void;
  onAssign: (leadId: string, counselor: string) => void;
  onConvert: (leadId: string) => void;
  onSendPortal: (leadId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [assignCounselor, setAssignCounselor] = useState('');
  const [expandedConvo, setExpandedConvo] = useState(false);

  const currentStageIdx = STAGES.findIndex((s) => s.key === lead.stage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-bold">
              {lead.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div>{lead.name}</div>
              <div className="text-sm font-normal text-muted-foreground">
                {lead.id} &middot; {lead.programInterest}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Lead detail, history, and quick actions
          </DialogDescription>
        </DialogHeader>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap gap-2 border-y py-3">
          <Select
            value={assignCounselor}
            onValueChange={(val) => {
              setAssignCounselor(val);
              onAssign(lead.id, val);
            }}
          >
            <SelectTrigger className="w-auto h-8 text-xs">
              <SelectValue placeholder="Assign Counselor" />
            </SelectTrigger>
            <SelectContent>
              {COUNSELORS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onSendPortal(lead.id)}
          >
            <Link2 className="h-3 w-3 mr-1" />
            Send Portal Link
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onMoveStage(lead.id, STAGES[Math.max(0, currentStageIdx - 1)]?.key as PipelineStage)}
            disabled={currentStageIdx === 0}
          >
            <ArrowRight className="h-3 w-3 mr-1 rotate-180" />
            Move Back
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onMoveStage(lead.id, STAGES[Math.min(STAGES.length - 1, currentStageIdx + 1)]?.key as PipelineStage)}
            disabled={currentStageIdx === STAGES.length - 1}
          >
            Move Forward
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          <Button
            size="sm"
            variant="default"
            className="h-8 text-xs"
            onClick={() => onConvert(lead.id)}
          >
            <GraduationCap className="h-3 w-3 mr-1" />
            Convert to Student
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="social">Social & IDs</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {lead.phone}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {lead.email}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Source</label>
                  <p className="text-sm font-medium">{lead.source}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Assigned Counselor</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {lead.counselor || (
                      <span className="text-rose-500">Unassigned</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Lead Score</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1">
                      <Progress
                        value={lead.score}
                        className={cn('h-2', SCORE_BAR_COLOR(lead.score))}
                      />
                    </div>
                    <span className={cn('text-sm font-bold', SCORE_COLORS(lead.score))}>
                      {lead.score}/100
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Current Stage</label>
                  <Badge variant="outline" className="mt-1">
                    {STAGES.find((s) => s.key === lead.stage)?.label}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Created</label>
                  <p className="text-sm font-medium">{lead.createdAt}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Last Activity</label>
                  <p className="text-sm font-medium">{lead.lastActivity}</p>
                </div>
                {lead.studentId && (
                  <div>
                    <label className="text-xs text-muted-foreground">Student ID</label>
                    <p className="text-sm font-bold text-emerald-600">{lead.studentId}</p>
                  </div>
                )}
              </div>
            </div>
            {lead.notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <label className="text-xs text-muted-foreground">Notes</label>
                <p className="text-sm mt-1">{lead.notes}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="social" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lead.whatsapp && (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50/50">
                  <Phone className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <p className="text-sm font-medium">{lead.whatsapp}</p>
                  </div>
                </div>
              )}
              {lead.instagram && (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-pink-50/50">
                  <Instagram className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Instagram</p>
                    <p className="text-sm font-medium">{lead.instagram}</p>
                  </div>
                </div>
              )}
              {lead.facebook && (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50/50">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Facebook</p>
                    <p className="text-sm font-medium">{lead.facebook}</p>
                  </div>
                </div>
              )}
              {lead.twitter && (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-sky-50/50">
                  <Twitter className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Twitter / X</p>
                    <p className="text-sm font-medium">{lead.twitter}</p>
                  </div>
                </div>
              )}
              {!lead.whatsapp && !lead.instagram && !lead.facebook && !lead.twitter && (
                <p className="text-sm text-muted-foreground col-span-2">
                  No social profiles linked to this lead.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="conversations" className="mt-4">
            {lead.conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lead.conversations.slice(0, expandedConvo ? undefined : 3).map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      'flex gap-3 p-3 rounded-lg border text-sm',
                      c.direction === 'inbound'
                        ? 'bg-sky-50/30 border-sky-100'
                        : 'bg-violet-50/30 border-violet-100'
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full',
                          c.direction === 'inbound' ? 'bg-sky-100' : 'bg-violet-100'
                        )}
                      >
                        {c.direction === 'inbound' ? (
                          <ArrowRight className="h-3 w-3 rotate-180 text-sky-600" />
                        ) : (
                          <ArrowRight className="h-3 w-3 text-violet-600" />
                        )}
                      </div>
                      <Badge variant="outline" className={cn('text-[9px] px-1', CHANNEL_ICON(c.channel))}>
                        {c.channel}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">
                          {c.direction === 'inbound' ? lead.name : c.counselor || 'System'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{c.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.message}</p>
                    </div>
                  </div>
                ))}
                {lead.conversations.length > 3 && !expandedConvo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setExpandedConvo(true)}
                  >
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {lead.conversations.length - 3} more
                  </Button>
                )}
                {expandedConvo && lead.conversations.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setExpandedConvo(false)}
                  >
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            {lead.documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No documents uploaded.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lead.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.type} &middot; {doc.size} &middot; {doc.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="application" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Application Status</p>
                  <p className="text-xs text-muted-foreground">
                    Track application progress for this lead
                  </p>
                </div>
                <Badge
                  variant={
                    lead.applicationStatus === 'submitted'
                      ? 'success'
                      : lead.applicationStatus === 'review'
                      ? 'default'
                      : lead.applicationStatus === 'started'
                      ? 'warning'
                      : 'muted'
                  }
                >
                  {lead.applicationStatus === 'none'
                    ? 'Not Started'
                    : lead.applicationStatus === 'started'
                    ? 'In Progress'
                    : lead.applicationStatus === 'submitted'
                    ? 'Submitted'
                    : 'Under Review'}
                </Badge>
              </div>
              {lead.studentId && (
                <div className="p-4 rounded-lg bg-emerald-50 border-emerald-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-700">Converted to Student</p>
                  </div>
                  <p className="text-xs text-emerald-600">
                    Student ID: <span className="font-bold">{lead.studentId}</span>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2 text-center">
                {['Profile', 'Documents', 'Statement', 'Payment'].map((step, i) => {
                  const done =
                    lead.applicationStatus === 'submitted' ||
                    lead.applicationStatus === 'review'
                      ? true
                      : lead.applicationStatus === 'started'
                      ? i < 2
                      : false;
                  return (
                    <div
                      key={step}
                      className={cn(
                        'p-2 rounded-lg border text-xs',
                        done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-muted border-border text-muted-foreground'
                      )}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4 mx-auto mb-1" /> : <div className="h-4 w-4 mx-auto mb-1 rounded-full border" />}
                      {step}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simple download icon fallback (not all lucide exports available)
function Download({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dedup Panel
// ---------------------------------------------------------------------------

function DedupPanel({ leads, onClose }: { leads: Lead[]; onClose: () => void }) {
  const potentialDupes = useMemo(() => {
    const dupes: { primary: Lead; duplicates: Lead[]; reason: string }[] = [];
    const emailMap = new Map<string, Lead[]>();
    const phoneMap = new Map<string, Lead[]>();

    leads.forEach((l) => {
      const el = emailMap.get(l.email) || [];
      el.push(l);
      emailMap.set(l.email, el);
      const pl = phoneMap.get(l.phone) || [];
      pl.push(l);
      phoneMap.set(l.phone, pl);
    });

    emailMap.forEach((group) => {
      if (group.length > 1) {
        dupes.push({ primary: group[0], duplicates: group.slice(1), reason: 'Same email address' });
      }
    });
    phoneMap.forEach((group) => {
      if (group.length > 1) {
        dupes.push({ primary: group[0], duplicates: group.slice(1), reason: 'Same phone number' });
      }
    });

    return dupes;
  }, [leads]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Lead Deduplication
          </DialogTitle>
          <DialogDescription>
            Review and merge potential duplicate leads
          </DialogDescription>
        </DialogHeader>
        {potentialDupes.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              No potential duplicates found among current leads.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {potentialDupes.map((group, i) => (
              <div key={i} className="p-3 rounded-lg border bg-amber-50/50">
                <p className="text-xs font-medium text-amber-700 mb-2">
                  Potential duplicate: {group.reason}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2 rounded border bg-emerald-50/50">
                    <Badge variant="success" className="text-[10px] mb-1">Primary</Badge>
                    <p className="text-sm font-medium">{group.primary.name}</p>
                    <p className="text-xs text-muted-foreground">{group.primary.email}</p>
                  </div>
                  {group.duplicates.map((dup) => (
                    <div key={dup.id} className="p-2 rounded border bg-rose-50/50">
                      <Badge variant="danger" className="text-[10px] mb-1">Duplicate</Badge>
                      <p className="text-sm font-medium">{dup.name}</p>
                      <p className="text-xs text-muted-foreground">{dup.email}</p>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="mt-1 h-6 text-[10px]">
                        <Merge className="h-3 w-3 mr-1" />
                        Merge into Primary
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function LeadPipelineView() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDedup, setShowDedup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');

  const sources = useMemo(
    () => ['all', ...new Set(leads.map((l) => l.source))],
    [leads]
  );

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.id.toLowerCase().includes(q)
      );
    }
    if (filterSource !== 'all') {
      result = result.filter((l) => l.source === filterSource);
    }
    return result;
  }, [leads, searchQuery, filterSource]);

  const stageLeads = useMemo(() => {
    const map: Record<PipelineStage, Lead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      assigned: [],
      converted: [],
      lost: [],
    };
    filteredLeads.forEach((l) => map[l.stage].push(l));
    return map;
  }, [filteredLeads]);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetail(true);
  };

  const handleMoveStage = (leadId: string, stage: PipelineStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage } : l))
    );
    setSelectedLead((prev) => (prev?.id === leadId ? { ...prev, stage } : prev));
  };

  const handleAssign = (leadId: string, counselor: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, counselor } : l))
    );
    setSelectedLead((prev) =>
      prev?.id === leadId ? { ...prev, counselor } : prev
    );
  };

  const handleConvert = (leadId: string) => {
    const studentNum = String(leads.filter((l) => l.studentId).length + 1).padStart(6, '0');
    const studentId = `AE-2025${studentNum}`;
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, stage: 'converted' as PipelineStage, studentId }
          : l
      )
    );
    setSelectedLead((prev) =>
      prev?.id === leadId
        ? { ...prev, stage: 'converted' as PipelineStage, studentId }
        : prev
    );
  };

  const handleSendPortal = (_leadId: string) => {
    // Would trigger portal link email in production
  };

  // Stats
  const totalLeads = leads.length;
  const unassigned = leads.filter((l) => !l.counselor).length;
  const avgScore = Math.round(
    leads.reduce((sum, l) => sum + l.score, 0) / leads.length
  );
  const converted = leads.filter((l) => l.stage === 'converted').length;

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Lead Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Manage leads through the enrollment funnel
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDedup(true)}>
            <Merge className="h-4 w-4 mr-1" />
            Dedup Check
          </Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm">
            <ClipboardList className="h-4 w-4 mr-1" />
            Follow-up Tasks
          </Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm">
            <UserPlus className="h-4 w-4 mr-1" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-2xl font-bold">{totalLeads}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserX className="h-4 w-4 text-rose-500" />
              <span className="text-xs text-muted-foreground">Unassigned</span>
            </div>
            <p className="text-2xl font-bold text-rose-600">{unassigned}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Avg Score</span>
            </div>
            <p className="text-2xl font-bold">{avgScore}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Converted</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{converted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-auto">
            <SelectValue placeholder="Filter by Source" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All Sources' : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="shrink-0">
          <Filter className="h-4 w-4 mr-1" />
          More Filters
        </Button>
      </div>

      {/* Pipeline Stages Flow */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1 overflow-x-auto pb-1">
        {STAGES.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-1 shrink-0">
            <div className={cn('flex items-center gap-1 px-2 py-1 rounded-md border', stage.bg)}>
              <span className={cn('font-semibold', stage.color)}>{stage.label}</span>
              <span className={cn('font-bold', stage.color)}>
                {stageLeads[stage.key].length}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
            )}
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => (
          <div key={stage.key} className="flex flex-col">
            <div
              className={cn(
                'flex items-center justify-between p-2 rounded-t-lg border-b-0',
                stage.bg
              )}
            >
              <span className={cn('text-xs font-bold uppercase tracking-wide', stage.color)}>
                {stage.label}
              </span>
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                  stage.color,
                  stage.bg.replace('50', '100')
                )}
              >
                {stageLeads[stage.key].length}
              </span>
            </div>
            <div className="flex-1 space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto p-1 rounded-b-lg border bg-muted/20 custom-scrollbar">
              {stageLeads[stage.key].length === 0 && (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/60">
                  No leads
                </div>
              )}
              {stageLeads[stage.key].map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onSelect={handleSelectLead}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lead Detail Dialog */}
      {selectedLead && (
        <LeadDetailDialog
          lead={selectedLead}
          open={showDetail}
          onOpenChange={setShowDetail}
          onMoveStage={handleMoveStage}
          onAssign={handleAssign}
          onConvert={handleConvert}
          onSendPortal={handleSendPortal}
        />
      )}

      {/* Dedup Panel */}
      {showDedup && (
        <DedupPanel leads={leads} onClose={() => setShowDedup(false)} />
      )}
    </div>
  );
}
