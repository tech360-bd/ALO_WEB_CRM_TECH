'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Search,
  Filter,
  UserPlus,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Zap,
  Play,
  Pause,
  Ban,
  Volume2,
  MessageCircle,
  Send,
  Users,
  CalendarDays,
  Timer,
  AlertCircle,
  Eye,
  Paperclip,
  History,
  UserMinus,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConversationStatus =
  | 'active'
  | 'waiting'
  | 'resolved'
  | 'overdue'
  | 'escalated';

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

interface Conversation {
  id: string;
  channel: 'whatsapp' | 'email' | 'phone' | 'live_chat' | 'instagram' | 'sms';
  contactName: string;
  contactPhone: string;
  assignedTo: string;
  status: ConversationStatus;
  lastActivity: string;
  slaMinutesLeft: number;
  slaTotal: number;
  messagePreview: string;
  tags: string[];
  leadId?: string;
}

interface FollowUpTask {
  id: string;
  task: string;
  assignedTo: string;
  dueDate: string;
  dueTime: string;
  status: TaskStatus;
  linkedConversationId?: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

interface AutoAssignRule {
  id: string;
  name: string;
  condition: string;
  assignTo: string;
  enabled: boolean;
  priority: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const COUNSELORS = ['Fatima K.', 'Ahmed S.', 'Sara M.', 'Omar B.', 'Unassigned'];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'CONV-001',
    channel: 'whatsapp',
    contactName: 'Sarah Al-Rashid',
    contactPhone: '+971 50 123 4567',
    assignedTo: '',
    status: 'active',
    lastActivity: '2025-01-15 10:30',
    slaMinutesLeft: 12,
    slaTotal: 30,
    messagePreview: 'Hi, I am interested in the BSc Computer Science program...',
    tags: ['hot-lead', 'new-inquiry'],
    leadId: 'L-001',
  },
  {
    id: 'CONV-002',
    channel: 'email',
    contactName: 'Mohammed Hassan',
    contactPhone: '+971 55 234 5678',
    assignedTo: 'Ahmed S.',
    status: 'active',
    lastActivity: '2025-01-15 09:45',
    slaMinutesLeft: 48,
    slaTotal: 60,
    messagePreview: 'Could you send me the MBA fee structure for 2025?',
    tags: ['fee-inquiry', 'mba'],
    leadId: 'L-002',
  },
  {
    id: 'CONV-003',
    channel: 'live_chat',
    contactName: 'Aisha Bin Zayed',
    contactPhone: '+971 52 345 6789',
    assignedTo: '',
    status: 'overdue',
    lastActivity: '2025-01-15 08:00',
    slaMinutesLeft: -15,
    slaTotal: 15,
    messagePreview: 'Hello? Is anyone there? I asked about MSc Data Science 2 hours ago.',
    tags: ['overdue', 'escalation-risk'],
    leadId: 'L-003',
  },
  {
    id: 'CONV-004',
    channel: 'whatsapp',
    contactName: 'Omar Khalifa',
    contactPhone: '+971 54 456 7890',
    assignedTo: 'Fatima K.',
    status: 'waiting',
    lastActivity: '2025-01-15 11:30',
    slaMinutesLeft: 180,
    slaTotal: 240,
    messagePreview: 'Thanks for the scholarship info! Let me discuss with my parents.',
    tags: ['follow-up', 'scholarship'],
    leadId: 'L-004',
  },
  {
    id: 'CONV-005',
    channel: 'phone',
    contactName: 'Layla Mansour',
    contactPhone: '+971 56 567 8901',
    assignedTo: 'Ahmed S.',
    status: 'active',
    lastActivity: '2025-01-15 14:20',
    slaMinutesLeft: 90,
    slaTotal: 120,
    messagePreview: 'Called to ask about part-time MSc AI schedule.',
    tags: ['schedule-inquiry'],
    leadId: 'L-005',
  },
  {
    id: 'CONV-006',
    channel: 'instagram',
    contactName: 'Khalid Al Maktoum',
    contactPhone: '+971 50 678 9012',
    assignedTo: '',
    status: 'overdue',
    lastActivity: '2025-01-15 07:30',
    slaMinutesLeft: -45,
    slaTotal: 30,
    messagePreview: 'DM about Executive MBA for senior professionals.',
    tags: ['overdue', 'executive'],
    leadId: 'L-006',
  },
  {
    id: 'CONV-007',
    channel: 'sms',
    contactName: 'Noora Al Suwaidi',
    contactPhone: '+971 55 789 0123',
    assignedTo: 'Fatima K.',
    status: 'resolved',
    lastActivity: '2025-01-14 16:00',
    slaMinutesLeft: 999,
    slaTotal: 60,
    messagePreview: 'SMS confirmation sent for campus tour. Tour completed.',
    tags: ['resolved', 'tour'],
    leadId: 'L-007',
  },
  {
    id: 'CONV-008',
    channel: 'email',
    contactName: 'Youssef El-Masri',
    contactPhone: '+971 52 890 1234',
    assignedTo: 'Ahmed S.',
    status: 'active',
    lastActivity: '2025-01-15 13:10',
    slaMinutesLeft: 20,
    slaTotal: 120,
    messagePreview: 'Reply to curriculum questions about BSc Cyber Security.',
    tags: ['curriculum'],
    leadId: 'L-008',
  },
  {
    id: 'CONV-009',
    channel: 'whatsapp',
    contactName: 'Reem Al Shamsi',
    contactPhone: '+971 54 111 2233',
    assignedTo: '',
    status: 'active',
    lastActivity: '2025-01-15 15:00',
    slaMinutesLeft: 28,
    slaTotal: 30,
    messagePreview: 'New lead from website chat. Wants info on BSc Nursing.',
    tags: ['new-lead', 'nursing'],
  },
  {
    id: 'CONV-010',
    channel: 'phone',
    contactName: 'Saeed Al Falasi',
    contactPhone: '+971 50 999 8877',
    assignedTo: 'Sara M.',
    status: 'escalated',
    lastActivity: '2025-01-15 12:00',
    slaMinutesLeft: -30,
    slaTotal: 60,
    messagePreview: 'Escalated: Complaint about delayed response to application.',
    tags: ['escalated', 'complaint'],
  },
  {
    id: 'CONV-011',
    channel: 'live_chat',
    contactName: 'Amira Al Qahtani',
    contactPhone: '+971 55 444 5566',
    assignedTo: 'Sara M.',
    status: 'waiting',
    lastActivity: '2025-01-15 14:45',
    slaMinutesLeft: 150,
    slaTotal: 240,
    messagePreview: 'Asked about English language requirements for international students.',
    tags: ['language-req'],
  },
  {
    id: 'CONV-012',
    channel: 'whatsapp',
    contactName: 'Zayed Al Ketbi',
    contactPhone: '+971 52 777 8899',
    assignedTo: 'Omar B.',
    status: 'resolved',
    lastActivity: '2025-01-14 10:00',
    slaMinutesLeft: 999,
    slaTotal: 60,
    messagePreview: 'Admission query resolved. Student enrolled.',
    tags: ['resolved', 'enrolled'],
  },
];

const MOCK_TASKS: FollowUpTask[] = [
  {
    id: 'TASK-001',
    task: 'Follow up on MBA fee structure request',
    assignedTo: 'Ahmed S.',
    dueDate: '2025-01-15',
    dueTime: '17:00',
    status: 'overdue',
    linkedConversationId: 'CONV-002',
    priority: 'high',
    notes: 'Send fee breakdown PDF.',
  },
  {
    id: 'TASK-002',
    task: 'Respond to Aisha Bin Zayed overdue chat',
    assignedTo: '',
    dueDate: '2025-01-15',
    dueTime: '08:15',
    status: 'overdue',
    linkedConversationId: 'CONV-003',
    priority: 'high',
    notes: 'SLA breached. Respond immediately.',
  },
  {
    id: 'TASK-003',
    task: 'Call Khalid Al Maktoum regarding Executive MBA',
    assignedTo: '',
    dueDate: '2025-01-15',
    dueTime: '16:00',
    status: 'overdue',
    linkedConversationId: 'CONV-006',
    priority: 'high',
  },
  {
    id: 'TASK-004',
    task: 'Schedule campus tour for Omar Khalifa',
    assignedTo: 'Fatima K.',
    dueDate: '2025-01-18',
    dueTime: '10:00',
    status: 'pending',
    linkedConversationId: 'CONV-004',
    priority: 'medium',
  },
  {
    id: 'TASK-005',
    task: 'Send part-time AI curriculum to Layla Mansour',
    assignedTo: 'Ahmed S.',
    dueDate: '2025-01-16',
    dueTime: '12:00',
    status: 'in_progress',
    linkedConversationId: 'CONV-005',
    priority: 'medium',
  },
  {
    id: 'TASK-006',
    task: 'Prepare scholarship application guide',
    assignedTo: 'Sara M.',
    dueDate: '2025-01-20',
    dueTime: '09:00',
    status: 'pending',
    priority: 'low',
    notes: 'Annual update needed for 2025 scholarships.',
  },
  {
    id: 'TASK-007',
    task: 'Handle escalated complaint from Saeed Al Falasi',
    assignedTo: 'Sara M.',
    dueDate: '2025-01-15',
    dueTime: '14:00',
    status: 'overdue',
    linkedConversationId: 'CONV-010',
    priority: 'high',
    notes: 'Requires manager-level response.',
  },
  {
    id: 'TASK-008',
    task: 'Follow up with Noora about submitted application',
    assignedTo: 'Fatima K.',
    dueDate: '2025-01-17',
    dueTime: '11:00',
    status: 'pending',
    linkedConversationId: 'CONV-007',
    priority: 'medium',
  },
];

const MOCK_RULES: AutoAssignRule[] = [
  {
    id: 'RULE-001',
    name: 'WhatsApp → Round Robin',
    condition: 'Channel is WhatsApp AND Unassigned',
    assignTo: 'Round Robin (All Counselors)',
    enabled: true,
    priority: 1,
  },
  {
    id: 'RULE-002',
    name: 'Instagram → Sara M.',
    condition: 'Channel is Instagram AND Unassigned',
    assignTo: 'Sara M.',
    enabled: true,
    priority: 2,
  },
  {
    id: 'RULE-003',
    name: 'Email MBA → Ahmed S.',
    condition: 'Channel is Email AND Tag contains "mba"',
    assignTo: 'Ahmed S.',
    enabled: true,
    priority: 3,
  },
  {
    id: 'RULE-004',
    name: 'Overdue → Auto-Escalate',
    condition: 'SLA breached by > 30 min',
    assignTo: 'Sara M. (Escalation)',
    enabled: false,
    priority: 1,
  },
  {
    id: 'RULE-005',
    name: 'Hot Lead → Fatima K.',
    condition: 'Tag contains "hot-lead" AND Unassigned',
    assignTo: 'Fatima K.',
    enabled: true,
    priority: 1,
  },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

const CHANNEL_ICON = (ch: string) => {
  switch (ch) {
    case 'whatsapp': return { icon: MessageCircle, className: 'text-green-600', bg: 'bg-green-100' };
    case 'email': return { icon: Mail, className: 'text-blue-600', bg: 'bg-blue-100' };
    case 'phone': return { icon: Phone, className: 'text-purple-600', bg: 'bg-purple-100' };
    case 'live_chat': return { icon: Globe, className: 'text-teal-600', bg: 'bg-teal-100' };
    case 'instagram': return { icon: MessageSquare, className: 'text-pink-600', bg: 'bg-pink-100' };
    case 'sms': return { icon: Volume2, className: 'text-orange-600', bg: 'bg-orange-100' };
    default: return { icon: MessageSquare, className: 'text-gray-600', bg: 'bg-gray-100' };
  }
};

const STATUS_CONFIG: Record<
  ConversationStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' | 'muted'; dotClass: string }
> = {
  active: { label: 'Active', variant: 'success', dotClass: 'bg-emerald-500' },
  waiting: { label: 'Waiting', variant: 'warning', dotClass: 'bg-amber-500' },
  resolved: { label: 'Resolved', variant: 'muted', dotClass: 'bg-gray-400' },
  overdue: { label: 'Overdue', variant: 'destructive', dotClass: 'bg-rose-500' },
  escalated: { label: 'Escalated', variant: 'destructive', dotClass: 'bg-red-600' },
};

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'destructive' },
};

function SLACountdown({ minutesLeft, total }: { minutesLeft: number; total: number }) {
  const isOverdue = minutesLeft < 0;
  const isUrgent = !isOverdue && minutesLeft < total * 0.25;

  let display: string;
  if (isOverdue) {
    display = `${Math.abs(minutesLeft)}m overdue`;
  } else if (minutesLeft >= 60) {
    display = `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`;
  } else {
    display = `${minutesLeft}m`;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isOverdue ? 'bg-rose-500' : isUrgent ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{
              width: isOverdue ? '100%' : `${Math.min(100, ((total - minutesLeft) / total) * 100)}%`,
            }}
          />
        </div>
      </div>
      <span
        className={cn(
          'text-xs font-medium whitespace-nowrap',
          isOverdue ? 'text-rose-600 font-bold' : isUrgent ? 'text-amber-600' : 'text-muted-foreground'
        )}
      >
        {isOverdue && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
        {display}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auto-Assign Rules Panel
// ---------------------------------------------------------------------------

function AutoAssignPanel({
  rules,
  onToggle,
}: {
  rules: AutoAssignRule[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={cn(
            'flex items-center justify-between p-3 rounded-lg border transition-colors',
            rule.enabled ? 'bg-card' : 'bg-muted/40 opacity-60'
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{rule.name}</span>
              <Badge variant="outline" className="text-[10px]">
                Priority {rule.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{rule.condition}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              → Assign to: <span className="font-medium text-foreground">{rule.assignTo}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className={cn('text-xs', rule.enabled ? 'text-emerald-600' : 'text-muted-foreground')}>
              {rule.enabled ? 'ON' : 'OFF'}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-12 p-0"
              onClick={() => onToggle(rule.id)}
            >
              {rule.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual Assign Dialog
// ---------------------------------------------------------------------------

function AssignDialog({
  open,
  onOpenChange,
  conversations,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  onAssign: (convIds: string[], counselor: string) => void;
}) {
  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    conversations.map((c) => c.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign Conversations
          </DialogTitle>
          <DialogDescription>
            {conversations.length === 1
              ? `Assign ${conversations[0].contactName}'s conversation`
              : `Bulk assign ${conversations.length} conversations`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {conversations.length > 1 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {conversations.map((conv) => (
                <label
                  key={conv.id}
                  className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/30 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedIds.includes(conv.id)}
                    onCheckedChange={(checked) => {
                      setSelectedIds((prev) =>
                        checked
                          ? [...prev, conv.id]
                          : prev.filter((id) => id !== conv.id)
                      );
                    }}
                  />
                  <span className="text-sm">{conv.contactName}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {conv.channel}
                  </Badge>
                </label>
              ))}
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Assign to Counselor</label>
            <Select value={selectedCounselor} onValueChange={setSelectedCounselor}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select counselor..." />
              </SelectTrigger>
              <SelectContent>
                {COUNSELORS.filter((c) => c !== 'Unassigned').map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedCounselor && selectedIds.length > 0) {
                onAssign(selectedIds, selectedCounselor);
                onOpenChange(false);
              }
            }}
            disabled={!selectedCounselor || selectedIds.length === 0}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Assign {selectedIds.length > 1 ? `${selectedIds.length} conversations` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ConversationAssignmentView() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [tasks, setTasks] = useState<FollowUpTask[]>(MOCK_TASKS);
  const [rules, setRules] = useState<AutoAssignRule[]>(MOCK_RULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [assignFilter, setAssignFilter] = useState<string>('all');
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations');
  const [sortField, setSortField] = useState<string>('slaMinutesLeft');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Filtering
  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.contactName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.messagePreview.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (channelFilter !== 'all') {
      result = result.filter((c) => c.channel === channelFilter);
    }

    if (assignFilter === 'unassigned') {
      result = result.filter((c) => !c.assignedTo);
    } else if (assignFilter !== 'all') {
      result = result.filter((c) => c.assignedTo === assignFilter);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField as keyof Conversation];
      const bVal = b[sortField as keyof Conversation];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [conversations, searchQuery, statusFilter, channelFilter, assignFilter, sortField, sortDir]);

  const filteredTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const statusOrder: Record<TaskStatus, number> = {
        overdue: 0,
        in_progress: 1,
        pending: 2,
        completed: 3,
      };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [tasks]);

  // Actions
  const handleToggleSelection = (id: string) => {
    setSelectedConversations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedConversations.length === filteredConversations.length) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(filteredConversations.map((c) => c.id));
    }
  };

  const handleAssign = (convIds: string[], counselor: string) => {
    setConversations((prev) =>
      prev.map((c) => (convIds.includes(c.id) ? { ...c, assignedTo: counselor } : c))
    );
    setSelectedConversations([]);
  };

  const handleQuickAssign = (convId: string, counselor: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, assignedTo: counselor } : c))
    );
  };

  const handleReassign = (convId: string) => {
    setShowAssignDialog(true);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleToggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Stats
  const totalConvs = conversations.length;
  const unassignedCount = conversations.filter((c) => !c.assignedTo).length;
  const overdueCount = conversations.filter((c) => c.status === 'overdue').length;
  const escalatedCount = conversations.filter((c) => c.status === 'escalated').length;
  const overdueTasks = tasks.filter((t) => t.status === 'overdue').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Conversation Assignment</h2>
          <p className="text-sm text-muted-foreground">
            Monitor, assign, and track all conversations across channels
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm">
            <History className="h-4 w-4 mr-1" />
            Activity Log
          </Button>
          <Button
            size="sm"
            disabled={selectedConversations.length === 0}
            onClick={() => setShowAssignDialog(true)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Bulk Assign ({selectedConversations.length})
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="py-0 gap-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold">{totalConvs}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <UserMinus className="h-4 w-4 text-rose-500" />
              <span className="text-xs text-muted-foreground">Unassigned</span>
            </div>
            <p className="text-xl font-bold text-rose-600">{unassignedCount}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span className="text-xs text-muted-foreground">Escalated</span>
            </div>
            <p className="text-xl font-bold text-rose-600">{escalatedCount}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-rose-500" />
              <span className="text-xs text-muted-foreground">Overdue Tasks</span>
            </div>
            <p className="text-xl font-bold text-rose-600">{overdueTasks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="conversations">Active Conversations</TabsTrigger>
          <TabsTrigger value="tasks">
            Follow-up Tasks
            {overdueTasks > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5">
                {overdueTasks}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Auto-Assign Rules</TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="mt-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by contact name, ID, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="live_chat">Live Chat</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignFilter} onValueChange={setAssignFilter}>
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="Assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {COUNSELORS.filter((c) => c !== 'Unassigned').map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        selectedConversations.length ===
                          filteredConversations.length &&
                        filteredConversations.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1"
                      onClick={() => handleToggleSort('id')}
                    >
                      ID <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.map((conv) => {
                  const statusCfg = STATUS_CONFIG[conv.status];
                  const channelCfg = CHANNEL_ICON(conv.channel);
                  const ChannelIcon = channelCfg.icon;
                  const isUnassigned = !conv.assignedTo;

                  return (
                    <TableRow
                      key={conv.id}
                      className={cn(
                        isUnassigned && conv.status !== 'resolved' && 'bg-rose-50/50',
                        selectedConversations.includes(conv.id) && 'bg-primary/5'
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedConversations.includes(conv.id)}
                          onCheckedChange={() => handleToggleSelection(conv.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{conv.id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-md',
                              channelCfg.bg
                            )}
                          >
                            <ChannelIcon className={cn('h-3 w-3', channelCfg.className)} />
                          </div>
                          <span className="text-xs capitalize">{conv.channel.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{conv.contactName}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {conv.messagePreview}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isUnassigned ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <UserMinus className="h-3 w-3 mr-0.5" />
                            Unassigned
                          </Badge>
                        ) : (
                          <span className="text-sm">{conv.assignedTo}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full',
                              statusCfg.dotClass
                            )}
                          />
                          <Badge variant={statusCfg.variant} className="text-[10px]">
                            {statusCfg.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {conv.lastActivity.split(' ')[1] || conv.lastActivity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <SLACountdown
                          minutesLeft={conv.slaMinutesLeft}
                          total={conv.slaTotal}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isUnassigned && (
                            <Select
                              onValueChange={(val) => handleQuickAssign(conv.id, val)}
                            >
                              <SelectTrigger className="w-auto h-7 text-[10px] px-1.5">
                                <UserPlus className="h-3 w-3 mr-0.5" />
                                Assign
                              </SelectTrigger>
                              <SelectContent>
                                {COUNSELORS.filter((c) => c !== 'Unassigned').map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {!isUnassigned && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleReassign(conv.id)}
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reassign</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Conversation</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Quick Reply</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Selected Actions Bar */}
          {selectedConversations.length > 0 && (
            <div className="flex items-center justify-between p-3 mt-2 rounded-lg bg-muted/50 border">
              <span className="text-sm">
                {selectedConversations.length} conversation{selectedConversations.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAssignDialog(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Bulk Assign
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="text-rose-600">
                  <XCircle className="h-4 w-4 mr-1" />
                  Mark Resolved
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedConversations([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Follow-up Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const taskCfg = TASK_STATUS_CONFIG[task.status];
              const isOverdue = task.status === 'overdue';

              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-colors',
                    isOverdue && 'bg-rose-50/50 border-rose-200'
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                        isOverdue
                          ? 'bg-rose-100 border-rose-300'
                          : task.status === 'completed'
                          ? 'bg-emerald-100 border-emerald-300'
                          : task.status === 'in_progress'
                          ? 'bg-amber-100 border-amber-300'
                          : 'bg-muted'
                      )}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : isOverdue ? (
                        <AlertTriangle className="h-3 w-3 text-rose-600" />
                      ) : (
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium truncate">{task.task}</p>
                        {task.priority === 'high' && (
                          <Badge variant="destructive" className="text-[10px] px-1.5">
                            High
                          </Badge>
                        )}
                        {task.priority === 'medium' && (
                          <Badge variant="warning" className="text-[10px] px-1.5">
                            Medium
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {task.assignedTo || 'Unassigned'}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {task.dueDate} {task.dueTime}
                        </span>
                        {task.linkedConversationId && (
                          <span className="flex items-center gap-1 text-primary">
                            <ChevronRight className="h-3 w-3" />
                            {task.linkedConversationId}
                          </span>
                        )}
                      </div>
                      {task.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge variant={taskCfg.variant} className="text-[10px]">
                      {taskCfg.label}
                    </Badge>
                    <Select
                      onValueChange={(val) => {
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === task.id
                              ? { ...t, assignedTo: val, status: val !== t.assignedTo && t.assignedTo === '' ? 'in_progress' : t.status }
                              : t
                          )
                        );
                      }}
                    >
                      <SelectTrigger className="w-auto h-7 text-[10px] px-1.5">
                        {task.assignedTo ? 'Reassign' : 'Assign'}
                      </SelectTrigger>
                      <SelectContent>
                        {COUNSELORS.filter((c) => c !== 'Unassigned').map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Auto-Assign Rules Tab */}
        <TabsContent value="rules" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Configure automatic conversation routing rules. Rules are evaluated in priority order.
            </p>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm">
              <Zap className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>
          <AutoAssignPanel rules={rules} onToggle={handleToggleRule} />
        </TabsContent>
      </Tabs>

      {/* Assign Dialog */}
      <AssignDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        conversations={filteredConversations.filter((c) =>
          selectedConversations.includes(c.id)
        )}
        onAssign={handleAssign}
      />
    </div>
  );
}
