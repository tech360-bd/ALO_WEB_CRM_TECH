'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Workflow,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Plus,
  Copy,
  ExternalLink,
  Eye,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Zap,
  Webhook,
  CalendarDays,
  Mail,
  MessageSquare,
  Phone,
  BarChart3,
  Bell,
  RefreshCw,
  Send,
  Globe,
  Users,
  Activity,
  AlertCircle,
  Timer,
  ArrowRight,
  FileText,
  Settings,
  Link2,
  History,
  PauseCircle,
  PlayCircle,
  Bug,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WorkflowStatus = 'active' | 'paused' | 'error';
type TriggerType = 'webhook' | 'cron' | 'event' | 'manual';

interface ExecutionRecord {
  id: string;
  status: 'success' | 'failed' | 'running';
  startedAt: string;
  duration: string;
  triggeredBy: string;
  nodesExecuted: number;
  errorMessage?: string;
}

interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  category: string;
  lastRun: string;
  nextRun: string;
  totalExecutions: number;
  successRate: number;
  webhookUrl?: string;
  executions: ExecutionRecord[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'All',
  'Lead Sync',
  'Follow-up',
  'WhatsApp Sequence',
  'Email Sequence',
  'SMS Sequence',
  'Campaign Reporting',
  'Counselor Notification',
  'Data Sync',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Lead Sync': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Follow-up': 'bg-amber-100 text-amber-700 border-amber-200',
  'WhatsApp Sequence': 'bg-green-100 text-green-700 border-green-200',
  'Email Sequence': 'bg-blue-100 text-blue-700 border-blue-200',
  'SMS Sequence': 'bg-orange-100 text-orange-700 border-orange-200',
  'Campaign Reporting': 'bg-violet-100 text-violet-700 border-violet-200',
  'Counselor Notification': 'bg-teal-100 text-teal-700 border-teal-200',
  'Data Sync': 'bg-sky-100 text-sky-700 border-sky-200',
};

const TRIGGER_ICONS: Record<TriggerType, { icon: typeof Webhook; className: string }> = {
  webhook: { icon: Webhook, className: 'text-violet-600' },
  cron: { icon: Clock, className: 'text-amber-600' },
  event: { icon: Zap, className: 'text-emerald-600' },
  manual: { icon: Play, className: 'text-sky-600' },
};

// ---------------------------------------------------------------------------
// Mock Data — 8 Workflows
// ---------------------------------------------------------------------------

const MOCK_WORKFLOWS: N8nWorkflow[] = [
  {
    id: 'WF-001',
    name: 'Lead Sync — Website to CRM',
    description: 'Syncs new leads from website forms to the CRM database in real-time via webhook.',
    status: 'active',
    triggerType: 'webhook',
    category: 'Lead Sync',
    lastRun: '2025-01-15 14:32',
    nextRun: 'On-demand',
    totalExecutions: 1247,
    successRate: 98.4,
    webhookUrl: 'https://n8n.alo.edu/webhook/lead-sync-website',
    executions: [
      { id: 'EX-1001', status: 'success', startedAt: '2025-01-15 14:32', duration: '1.2s', triggeredBy: 'Webhook (Website Form)', nodesExecuted: 5 },
      { id: 'EX-1000', status: 'success', startedAt: '2025-01-15 14:28', duration: '0.9s', triggeredBy: 'Webhook (Website Form)', nodesExecuted: 5 },
      { id: 'EX-999', status: 'failed', startedAt: '2025-01-15 14:15', duration: '3.1s', triggeredBy: 'Webhook (Website Form)', nodesExecuted: 3, errorMessage: 'CRM API timeout after 3000ms' },
      { id: 'EX-998', status: 'success', startedAt: '2025-01-15 13:55', duration: '1.1s', triggeredBy: 'Webhook (Website Form)', nodesExecuted: 5 },
    ],
    createdAt: '2024-11-01',
    updatedAt: '2025-01-10',
    version: 3,
  },
  {
    id: 'WF-002',
    name: 'Auto Follow-up — 24h Reminder',
    description: 'Sends automated WhatsApp + email follow-up to leads contacted 24 hours ago without response.',
    status: 'active',
    triggerType: 'cron',
    category: 'Follow-up',
    lastRun: '2025-01-15 09:00',
    nextRun: '2025-01-16 09:00',
    totalExecutions: 892,
    successRate: 95.2,
    executions: [
      { id: 'EX-892', status: 'success', startedAt: '2025-01-15 09:00', duration: '45.3s', triggeredBy: 'Cron Schedule', nodesExecuted: 8 },
      { id: 'EX-891', status: 'success', startedAt: '2025-01-14 09:00', duration: '38.7s', triggeredBy: 'Cron Schedule', nodesExecuted: 6 },
      { id: 'EX-890', status: 'success', startedAt: '2025-01-13 09:00', duration: '42.1s', triggeredBy: 'Cron Schedule', nodesExecuted: 7 },
    ],
    createdAt: '2024-11-15',
    updatedAt: '2025-01-05',
    version: 5,
  },
  {
    id: 'WF-003',
    name: 'WhatsApp Nurture Sequence',
    description: '5-step WhatsApp drip campaign for new leads: Welcome → Program Info → Testimonial → Offer → CTA.',
    status: 'active',
    triggerType: 'event',
    category: 'WhatsApp Sequence',
    lastRun: '2025-01-15 10:15',
    nextRun: 'On-demand',
    totalExecutions: 2156,
    successRate: 99.1,
    webhookUrl: 'https://n8n.alo.edu/webhook/wa-nurture-trigger',
    executions: [
      { id: 'EX-2156', status: 'success', startedAt: '2025-01-15 10:15', duration: '2.4s', triggeredBy: 'Event (New Lead Created)', nodesExecuted: 12 },
      { id: 'EX-2155', status: 'success', startedAt: '2025-01-15 09:30', duration: '1.8s', triggeredBy: 'Event (New Lead Created)', nodesExecuted: 12 },
      { id: 'EX-2154', status: 'success', startedAt: '2025-01-14 16:45', duration: '2.1s', triggeredBy: 'Event (New Lead Created)', nodesExecuted: 12 },
      { id: 'EX-2153', status: 'failed', startedAt: '2025-01-14 14:20', duration: '5.0s', triggeredBy: 'Event (New Lead Created)', nodesExecuted: 4, errorMessage: 'WhatsApp Business API rate limit exceeded' },
    ],
    createdAt: '2024-10-20',
    updatedAt: '2025-01-12',
    version: 8,
  },
  {
    id: 'WF-004',
    name: 'Email Welcome Sequence',
    description: 'Automated 4-email onboarding series: Welcome → Programs → Campus Life → Application CTA.',
    status: 'paused',
    triggerType: 'event',
    category: 'Email Sequence',
    lastRun: '2025-01-12 16:00',
    nextRun: 'Paused',
    totalExecutions: 1563,
    successRate: 97.8,
    webhookUrl: 'https://n8n.alo.edu/webhook/email-welcome-trigger',
    executions: [
      { id: 'EX-1563', status: 'success', startedAt: '2025-01-12 16:00', duration: '3.2s', triggeredBy: 'Manual Trigger', nodesExecuted: 9 },
      { id: 'EX-1562', status: 'success', startedAt: '2025-01-11 14:30', duration: '2.9s', triggeredBy: 'Event (New Lead)', nodesExecuted: 9 },
    ],
    createdAt: '2024-09-15',
    updatedAt: '2025-01-12',
    version: 4,
  },
  {
    id: 'WF-005',
    name: 'SMS Event Reminder',
    description: 'Sends SMS reminders 24h and 1h before scheduled campus tours, webinars, and open days.',
    status: 'active',
    triggerType: 'cron',
    category: 'SMS Sequence',
    lastRun: '2025-01-15 08:00',
    nextRun: '2025-01-15 20:00',
    totalExecutions: 3401,
    successRate: 99.6,
    executions: [
      { id: 'EX-3401', status: 'success', startedAt: '2025-01-15 08:00', duration: '12.5s', triggeredBy: 'Cron (Every 12h)', nodesExecuted: 6 },
      { id: 'EX-3400', status: 'success', startedAt: '2025-01-14 20:00', duration: '15.3s', triggeredBy: 'Cron (Every 12h)', nodesExecuted: 8 },
      { id: 'EX-3399', status: 'success', startedAt: '2025-01-14 08:00', duration: '11.8s', triggeredBy: 'Cron (Every 12h)', nodesExecuted: 4 },
    ],
    createdAt: '2024-10-01',
    updatedAt: '2025-01-08',
    version: 6,
  },
  {
    id: 'WF-006',
    name: 'Campaign Performance Reporter',
    description: 'Daily digest of campaign metrics — spend, leads, CPL, conversions — sent to marketing team.',
    status: 'error',
    triggerType: 'cron',
    category: 'Campaign Reporting',
    lastRun: '2025-01-15 07:00',
    nextRun: '2025-01-16 07:00',
    totalExecutions: 456,
    successRate: 88.4,
    executions: [
      { id: 'EX-456', status: 'failed', startedAt: '2025-01-15 07:00', duration: '8.2s', triggeredBy: 'Cron (Daily 07:00)', nodesExecuted: 2, errorMessage: 'Facebook Marketing API returned 500 error' },
      { id: 'EX-455', status: 'success', startedAt: '2025-01-14 07:00', duration: '15.6s', triggeredBy: 'Cron (Daily 07:00)', nodesExecuted: 10 },
      { id: 'EX-454', status: 'failed', startedAt: '2025-01-13 07:00', duration: '6.1s', triggeredBy: 'Cron (Daily 07:00)', nodesExecuted: 3, errorMessage: 'Google Ads API authentication failed' },
      { id: 'EX-453', status: 'success', startedAt: '2025-01-12 07:00', duration: '14.2s', triggeredBy: 'Cron (Daily 07:00)', nodesExecuted: 10 },
      { id: 'EX-452', status: 'success', startedAt: '2025-01-11 07:00', duration: '13.8s', triggeredBy: 'Cron (Daily 07:00)', nodesExecuted: 10 },
    ],
    createdAt: '2024-12-01',
    updatedAt: '2025-01-14',
    version: 2,
  },
  {
    id: 'WF-007',
    name: 'Counselor Lead Assignment Notifier',
    description: 'Notifies assigned counselor via WhatsApp and email when a new lead is assigned to them.',
    status: 'active',
    triggerType: 'event',
    category: 'Counselor Notification',
    lastRun: '2025-01-15 13:20',
    nextRun: 'On-demand',
    totalExecutions: 987,
    successRate: 96.9,
    webhookUrl: 'https://n8n.alo.edu/webhook/counselor-notify',
    executions: [
      { id: 'EX-987', status: 'success', startedAt: '2025-01-15 13:20', duration: '1.5s', triggeredBy: 'Event (Lead Assigned)', nodesExecuted: 7 },
      { id: 'EX-986', status: 'success', startedAt: '2025-01-15 11:45', duration: '1.3s', triggeredBy: 'Event (Lead Assigned)', nodesExecuted: 7 },
      { id: 'EX-985', status: 'failed', startedAt: '2025-01-15 10:00', duration: '4.2s', triggeredBy: 'Event (Lead Assigned)', nodesExecuted: 3, errorMessage: 'Counselor email address not found' },
    ],
    createdAt: '2024-11-10',
    updatedAt: '2025-01-09',
    version: 4,
  },
  {
    id: 'WF-008',
    name: 'CRM ↔ Finance Data Sync',
    description: 'Bi-directional sync between CRM student records and Finance payment data every 6 hours.',
    status: 'active',
    triggerType: 'cron',
    category: 'Data Sync',
    lastRun: '2025-01-15 12:00',
    nextRun: '2025-01-15 18:00',
    totalExecutions: 728,
    successRate: 94.3,
    executions: [
      { id: 'EX-728', status: 'success', startedAt: '2025-01-15 12:00', duration: '22.4s', triggeredBy: 'Cron (Every 6h)', nodesExecuted: 15 },
      { id: 'EX-727', status: 'success', startedAt: '2025-01-15 06:00', duration: '19.8s', triggeredBy: 'Cron (Every 6h)', nodesExecuted: 15 },
      { id: 'EX-726', status: 'success', startedAt: '2025-01-15 00:00', duration: '21.3s', triggeredBy: 'Cron (Every 6h)', nodesExecuted: 15 },
      { id: 'EX-725', status: 'failed', startedAt: '2025-01-14 18:00', duration: '8.5s', triggeredBy: 'Cron (Every 6h)', nodesExecuted: 4, errorMessage: 'Finance DB connection refused' },
    ],
    createdAt: '2024-10-15',
    updatedAt: '2025-01-11',
    version: 7,
  },
];

// ---------------------------------------------------------------------------
// Status Config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  WorkflowStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'; dotClass: string }
> = {
  active: { label: 'Active', variant: 'success', dotClass: 'bg-emerald-500' },
  paused: { label: 'Paused', variant: 'warning', dotClass: 'bg-amber-500' },
  error: { label: 'Error', variant: 'destructive', dotClass: 'bg-rose-500' },
};

const EXEC_STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  success: { icon: CheckCircle2, className: 'text-emerald-500', label: 'Success' },
  failed: { icon: XCircle, className: 'text-rose-500', label: 'Failed' },
  running: { icon: RefreshCw, className: 'text-sky-500 animate-spin', label: 'Running' },
};

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function WebhookDisplay({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <code className="text-xs flex-1 truncate font-mono">{url}</code>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={handleCopy}
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {copied ? 'Copied!' : 'Copy URL'}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Open in browser</TooltipContent>
      </Tooltip>
    </div>
  );
}

function WorkflowExecutionHistory({
  workflow,
  onRetry,
}: {
  workflow: N8nWorkflow;
  onRetry: (workflowId: string, executionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const successCount = workflow.executions.filter((e) => e.status === 'success').length;
  const failedCount = workflow.executions.filter((e) => e.status === 'failed').length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Execution History</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {successCount}
            </span>
            {failedCount > 0 && (
              <span className="flex items-center gap-0.5">
                <XCircle className="h-3 w-3 text-rose-500" />
                {failedCount}
              </span>
            )}
          </div>
        </div>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-6 w-6 p-0">
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>
      {expanded && (
        <div className="max-h-64 overflow-y-auto">
          {workflow.executions.map((exec) => {
            const execCfg = EXEC_STATUS_CONFIG[exec.status];
            const ExecIcon = execCfg.icon;
            return (
              <div
                key={exec.id}
                className={cn(
                  'flex items-center justify-between p-3 border-t text-sm',
                  exec.status === 'failed' && 'bg-rose-50/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <ExecIcon className={cn('h-4 w-4 shrink-0', execCfg.className)} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{exec.id}</span>
                      <Badge
                        variant={exec.status === 'success' ? 'success' : exec.status === 'failed' ? 'destructive' : 'warning'}
                        className="text-[10px] px-1.5"
                      >
                        {execCfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{exec.startedAt}</span>
                      <span>Duration: {exec.duration}</span>
                      <span>{exec.nodesExecuted} nodes</span>
                    </div>
                    {exec.errorMessage && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <Bug className="h-3 w-3" />
                        {exec.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {exec.status === 'failed' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          onClick={() => onRetry(workflow.id, exec.id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-0.5" />
                          Retry
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Retry this execution</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View execution details</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddWorkflowDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('webhook');
  const [category, setCategory] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Workflow
          </DialogTitle>
          <DialogDescription>
            Create a new n8n automation workflow for ALO Education
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Workflow Name</label>
            <Input
              placeholder="e.g., WhatsApp Re-engagement Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <Input
              placeholder="Brief description of what this workflow does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Trigger Type</label>
              <Select value={triggerType} onValueChange={(v) => setTriggerType(v as TriggerType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="cron">Cron Schedule</SelectItem>
                  <SelectItem value="event">Event Trigger</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {triggerType === 'webhook' && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground mb-1">
                A webhook URL will be generated automatically after creation.
              </p>
              <code className="text-xs font-mono text-muted-foreground">
                https://n8n.alo.edu/webhook/[auto-generated]
              </code>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={!name || !category}
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function N8nWorkflowsView() {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>(MOCK_WORKFLOWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filtering
  const filteredWorkflows = useMemo(() => {
    let result = [...workflows];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.id.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((w) => w.status === statusFilter);
    }
    if (categoryFilter !== 'All') {
      result = result.filter((w) => w.category === categoryFilter);
    }
    return result;
  }, [workflows, searchQuery, statusFilter, categoryFilter]);

  // Stats
  const activeCount = workflows.filter((w) => w.status === 'active').length;
  const pausedCount = workflows.filter((w) => w.status === 'paused').length;
  const errorCount = workflows.filter((w) => w.status === 'error').length;
  const totalExecutions = workflows.reduce((sum, w) => sum + w.totalExecutions, 0);
  const avgSuccessRate = Math.round(
    workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length
  );

  // Actions
  const handleToggleWorkflow = (workflowId: string) => {
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id === workflowId) {
          const newStatus = w.status === 'active' ? 'paused' : 'active';
          return { ...w, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] };
        }
        return w;
      })
    );
    setSelectedWorkflow((prev) => {
      if (prev?.id === workflowId) {
        const newStatus = prev.status === 'active' ? 'paused' : 'active';
        return { ...prev, status: newStatus };
      }
      return prev;
    });
  };

  const handleRetry = (_workflowId: string, _executionId: string) => {
    // Would trigger retry via n8n API in production
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">n8n Workflow Manager</h2>
          <p className="text-sm text-muted-foreground">
            Manage automation workflows for ALO Education marketing operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-1" />
            Open n8n Editor
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Workflow
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="py-0 gap-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Workflow className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Workflows</span>
            </div>
            <p className="text-xl font-bold">{workflows.length}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <PlayCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <PauseCircle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Paused</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{pausedCount}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <span className="text-xs text-muted-foreground">Errors</span>
            </div>
            <p className="text-xl font-bold text-rose-600">{errorCount}</p>
          </CardContent>
        </Card>
        <Card className="py-0 gap-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Executions</span>
            </div>
            <p className="text-xl font-bold">{totalExecutions.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows by name, ID, or description..."
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
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              className="h-9 px-3 rounded-none"
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="h-9 px-3 rounded-none"
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
          </div>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredWorkflows.map((wf) => {
            const statusCfg = STATUS_CONFIG[wf.status];
            const triggerCfg = TRIGGER_ICONS[wf.triggerType];
            const TriggerIcon = triggerCfg.icon;
            const recentExecs = wf.executions.slice(0, 3);
            const hasRecentError = recentExecs.some((e) => e.status === 'failed');

            return (
              <Card
                key={wf.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  wf.status === 'error' && 'border-rose-200',
                  selectedWorkflow?.id === wf.id && 'ring-2 ring-primary'
                )}
                onClick={() => setSelectedWorkflow(wf)}
              >
                <CardHeader className="pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          wf.status === 'active' ? 'bg-emerald-100' : wf.status === 'paused' ? 'bg-amber-100' : 'bg-rose-100'
                        )}
                      >
                        <Workflow className={cn('h-4 w-4', statusCfg.dotClass.replace('bg-', 'text-'))} />
                      </div>
                      <div>
                        <CardTitle className="text-sm leading-tight">{wf.name}</CardTitle>
                        <CardDescription className="text-[11px]">{wf.id}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('h-2 w-2 rounded-full', statusCfg.dotClass)} />
                        <Badge variant={statusCfg.variant} className="text-[10px]">
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <Switch
                        checked={wf.status === 'active'}
                        onCheckedChange={() => handleToggleWorkflow(wf.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {wf.description}
                  </p>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px]', CATEGORY_COLORS[wf.category])}
                    >
                      {wf.category}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                      <TriggerIcon className={cn('h-3 w-3', triggerCfg.className)} />
                      {wf.triggerType}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Last Run</span>
                      <p className="font-medium">{wf.lastRun.split(' ')[1]}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next Run</span>
                      <p className="font-medium">{wf.nextRun.split(' ')[0] !== 'Paused' ? wf.nextRun.split(' ')[1] || wf.nextRun : 'Paused'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Executions</span>
                      <p className="font-medium">{wf.totalExecutions.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success Rate</span>
                      <p className={cn('font-medium', wf.successRate >= 95 ? 'text-emerald-600' : wf.successRate >= 90 ? 'text-amber-600' : 'text-rose-600')}>
                        {wf.successRate}%
                      </p>
                    </div>
                  </div>

                  {/* Mini success rate bar */}
                  <div className="mb-3">
                    <Progress value={wf.successRate} className="h-1.5" />
                  </div>

                  {/* Recent executions */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Recent:</span>
                    {recentExecs.map((exec, i) => {
                      const eCfg = EXEC_STATUS_CONFIG[exec.status];
                      const EIcon = eCfg.icon;
                      return (
                        <Tooltip key={`${wf.id}-${i}`}>
                          <TooltipTrigger asChild>
                            <div className={cn('h-4 w-4 rounded-full flex items-center justify-center', exec.status === 'success' ? 'bg-emerald-100' : 'bg-rose-100')}>
                              <EIcon className={cn('h-2.5 w-2.5', eCfg.className)} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="text-[10px]">
                            {eCfg.label} — {exec.startedAt}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>

                  {wf.webhookUrl && (
                    <div className="mt-3 pt-2 border-t">
                      <p className="text-[10px] text-muted-foreground mb-1">Webhook URL</p>
                      <code className="text-[10px] font-mono text-muted-foreground truncate block">
                        {wf.webhookUrl}
                      </code>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Executions</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead className="text-center">Toggle</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkflows.map((wf) => {
                const statusCfg = STATUS_CONFIG[wf.status];
                const triggerCfg = TRIGGER_ICONS[wf.triggerType];
                const TriggerIcon = triggerCfg.icon;

                return (
                  <TableRow
                    key={wf.id}
                    className={cn(
                      'cursor-pointer',
                      wf.status === 'error' && 'bg-rose-50/30',
                      selectedWorkflow?.id === wf.id && 'bg-primary/5'
                    )}
                    onClick={() => setSelectedWorkflow(wf)}
                  >
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{wf.name}</p>
                        <p className="text-xs text-muted-foreground">{wf.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={cn('h-2 w-2 rounded-full', statusCfg.dotClass)} />
                        <Badge variant={statusCfg.variant} className="text-[10px]">
                          {statusCfg.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <TriggerIcon className={cn('h-3.5 w-3.5', triggerCfg.className)} />
                        <span className="text-xs capitalize">{wf.triggerType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', CATEGORY_COLORS[wf.category])}>
                        {wf.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{wf.lastRun}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-xs', wf.nextRun === 'Paused' ? 'text-amber-600' : 'text-muted-foreground')}>
                        {wf.nextRun}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{wf.totalExecutions.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={wf.successRate}
                          className="w-12 h-1.5"
                        />
                        <span className={cn('text-xs font-medium', wf.successRate >= 95 ? 'text-emerald-600' : wf.successRate >= 90 ? 'text-amber-600' : 'text-rose-600')}>
                          {wf.successRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={wf.status === 'active'}
                        onCheckedChange={() => handleToggleWorkflow(wf.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Open in n8n</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Selected Workflow Detail Panel */}
      {selectedWorkflow && (
        <div className="space-y-3">
          <Separator />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              {selectedWorkflow.name}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedWorkflow(null)}>
              Close
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Info Panel */}
            <Card className="lg:col-span-1 py-0 gap-0">
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Description</label>
                  <p className="text-sm">{selectedWorkflow.description}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Created</span>
                    <p className="font-medium">{selectedWorkflow.createdAt}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated</span>
                    <p className="font-medium">{selectedWorkflow.updatedAt}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version</span>
                    <p className="font-medium">v{selectedWorkflow.version}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category</span>
                    <p className="font-medium">{selectedWorkflow.category}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="text-xs text-muted-foreground">Success Rate</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={selectedWorkflow.successRate} className="flex-1 h-2" />
                    <span className={cn('text-sm font-bold', selectedWorkflow.successRate >= 95 ? 'text-emerald-600' : selectedWorkflow.successRate >= 90 ? 'text-amber-600' : 'text-rose-600')}>
                      {selectedWorkflow.successRate}%
                    </span>
                  </div>
                </div>
                {selectedWorkflow.webhookUrl && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Webhook URL</label>
                      <WebhookDisplay url={selectedWorkflow.webhookUrl} />
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex gap-2">
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="flex-1">
                    <Settings className="h-3.5 w-3.5 mr-1" />
                    Configure
                  </Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="flex-1">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Open in n8n
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Execution History */}
            <div className="lg:col-span-2">
              <WorkflowExecutionHistory
                workflow={selectedWorkflow}
                onRetry={handleRetry}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Workflow Dialog */}
      <AddWorkflowDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}
