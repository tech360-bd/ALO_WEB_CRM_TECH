'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Zap, Mail, MessageCircle, Users, ArrowRight, Calendar,
  Plus, Trash2, Play, Pause, Clock, CheckCircle2, XCircle, ChevronDown,
  GitBranch, Webhook, Database, Send, Bot, FileText, Globe, Phone,
  BarChart3, AlertTriangle, Settings, Sparkles, Eye, Filter, RefreshCw,
  Workflow, Cable, CircleDot, Square, MousePointerClick, Split
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────────────────
const N8N_ORANGE = '#FF6D5A';
const N8N_DARK = '#1a1a2e';
const CORAL = '#bf4520';

// ── Workflow Node Types ────────────────────────────────────────────────────
type NodeType = 'trigger' | 'ai_agent' | 'condition' | 'action' | 'webhook' | 'database' | 'email' | 'whatsapp' | 'delay';

interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  config: Record<string, string>;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  from: string;
  to: string;
  label?: string;
}

interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft' | 'error';
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
  category: string;
}

interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  timestamp: string;
  status: 'success' | 'error' | 'running';
  duration: string;
  triggerData: string;
}

// ── Pre-built Workflow Templates ───────────────────────────────────────────
const WORKFLOW_TEMPLATES: N8nWorkflow[] = [
  {
    id: 'wf-1',
    name: 'Lead Intake & AI Scoring',
    description: 'New lead → AI classifies urgency & intent → Score → Route to counselor → Welcome email/WhatsApp',
    status: 'active',
    nodes: [
      { id: 'n1', type: 'webhook', label: 'Lead Webhook', config: { path: '/leads/new' }, position: { x: 0, y: 0 } },
      { id: 'n2', type: 'ai_agent', label: 'AI Classifier', config: { model: 'gpt-4', prompt: 'Classify lead urgency and service type' }, position: { x: 200, y: 0 } },
      { id: 'n3', type: 'database', label: 'Update CRM', config: { table: 'leads', action: 'upsert' }, position: { x: 400, y: -50 } },
      { id: 'n4', type: 'condition', label: 'Score Check', config: { field: 'score', op: '>', value: '70' }, position: { x: 400, y: 50 } },
      { id: 'n5', type: 'email', label: 'Welcome Email', config: { template: 'lead-welcome' }, position: { x: 600, y: -50 } },
      { id: 'n6', type: 'whatsapp', label: 'WhatsApp Notify', config: { template: 'new-lead-alert' }, position: { x: 600, y: 50 } },
    ],
    connections: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n2', to: 'n4' },
      { from: 'n3', to: 'n5' },
      { from: 'n4', to: 'n6', label: 'hot lead' },
    ],
    lastExecuted: '2 minutes ago',
    executionCount: 1247,
    successRate: 98.2,
    category: 'Lead Management',
  },
  {
    id: 'wf-2',
    name: 'UKVI Visa Status Tracker',
    description: 'Daily UKVI check → Compare status changes → Alert student & counselor → Update case record',
    status: 'active',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Daily Schedule', config: { cron: '0 9 * * *' }, position: { x: 0, y: 0 } },
      { id: 'n2', type: 'database', label: 'Get Active Visas', config: { table: 'visa_cases', filter: 'status=pending' }, position: { x: 200, y: 0 } },
      { id: 'n3', type: 'webhook', label: 'UKVI API', config: { url: 'ukvi-api/check-status' }, position: { x: 400, y: 0 } },
      { id: 'n4', type: 'condition', label: 'Status Changed?', config: { field: 'status', op: '!=', value: 'previous' }, position: { x: 600, y: 0 } },
      { id: 'n5', type: 'email', label: 'Notify Student', config: { template: 'visa-update' }, position: { x: 800, y: -50 } },
      { id: 'n6', type: 'whatsapp', label: 'Alert Counselor', config: { template: 'visa-alert' }, position: { x: 800, y: 50 } },
    ],
    connections: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5', label: 'changed' },
      { from: 'n4', to: 'n6', label: 'changed' },
    ],
    lastExecuted: '1 hour ago',
    executionCount: 856,
    successRate: 99.1,
    category: 'Visa & Compliance',
  },
  {
    id: 'wf-3',
    name: 'Drip Campaign Engine',
    description: 'Lead stage trigger → Wait → Send email → Check engagement → Advance stage or re-engage',
    status: 'active',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Stage Change', config: { event: 'lead.stage_changed' }, position: { x: 0, y: 0 } },
      { id: 'n2', type: 'delay', label: 'Wait 24h', config: { duration: '24h' }, position: { x: 200, y: 0 } },
      { id: 'n3', type: 'email', label: 'Drip Email', config: { template: 'drip-{{stage}}' }, position: { x: 400, y: 0 } },
      { id: 'n4', type: 'delay', label: 'Wait 48h', config: { duration: '48h' }, position: { x: 600, y: 0 } },
      { id: 'n5', type: 'condition', label: 'Opened Email?', config: { field: 'email_opened', op: '==', value: 'true' }, position: { x: 800, y: 0 } },
      { id: 'n6', type: 'action', label: 'Advance Stage', config: { action: 'stage_advance' }, position: { x: 1000, y: -50 } },
      { id: 'n7', type: 'whatsapp', label: 'Re-engage', config: { template: 'follow-up' }, position: { x: 1000, y: 50 } },
    ],
    connections: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5' },
      { from: 'n5', to: 'n6', label: 'yes' },
      { from: 'n5', to: 'n7', label: 'no' },
    ],
    lastExecuted: '30 minutes ago',
    executionCount: 3456,
    successRate: 94.7,
    category: 'Marketing Automation',
  },
  {
    id: 'wf-4',
    name: 'Document Collection Reminders',
    description: 'Missing docs check → Generate reminder → Send via email/WhatsApp → Track submission → Escalate if overdue',
    status: 'active',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Weekly Check', config: { cron: '0 10 * * 1' }, position: { x: 0, y: 0 } },
      { id: 'n2', type: 'database', label: 'Find Missing Docs', config: { table: 'applications', filter: 'docs_missing>0' }, position: { x: 200, y: 0 } },
      { id: 'n3', type: 'ai_agent', label: 'Personalize Msg', config: { model: 'gpt-4', prompt: 'Generate friendly reminder for missing docs' }, position: { x: 400, y: 0 } },
      { id: 'n4', type: 'email', label: 'Email Reminder', config: { template: 'doc-reminder' }, position: { x: 600, y: -50 } },
      { id: 'n5', type: 'whatsapp', label: 'WhatsApp Reminder', config: { template: 'doc-reminder-wa' }, position: { x: 600, y: 50 } },
    ],
    connections: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n3', to: 'n5' },
    ],
    lastExecuted: '1 day ago',
    executionCount: 523,
    successRate: 97.8,
    category: 'Application Management',
  },
  {
    id: 'wf-5',
    name: 'Social Media Lead Sync',
    description: 'Facebook/Instagram lead ads → Extract data → Deduplicate → Score → Add to CRM → Auto-respond',
    status: 'draft',
    nodes: [
      { id: 'n1', type: 'webhook', label: 'FB Lead Ad', config: { source: 'facebook' }, position: { x: 0, y: 0 } },
      { id: 'n2', type: 'database', label: 'Dedup Check', config: { table: 'leads', action: 'find-duplicate' }, position: { x: 200, y: 0 } },
      { id: 'n3', type: 'ai_agent', label: 'Score Lead', config: { model: 'gpt-4', prompt: 'Score based on source and profile' }, position: { x: 400, y: 0 } },
      { id: 'n4', type: 'database', label: 'Add to CRM', config: { table: 'leads', action: 'create' }, position: { x: 600, y: 0 } },
    ],
    connections: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3', label: 'unique' },
      { from: 'n3', to: 'n4' },
    ],
    executionCount: 0,
    successRate: 0,
    category: 'Lead Management',
  },
];

const EXECUTION_LOGS: ExecutionLog[] = [
  { id: 'ex1', workflowId: 'wf-1', workflowName: 'Lead Intake & AI Scoring', timestamp: '2 min ago', status: 'success', duration: '1.2s', triggerData: 'New lead: Rahim Ahmed' },
  { id: 'ex2', workflowId: 'wf-3', workflowName: 'Drip Campaign Engine', timestamp: '30 min ago', status: 'success', duration: '0.8s', triggerData: 'Stage: CONTACTED → QUALIFIED' },
  { id: 'ex3', workflowId: 'wf-2', workflowName: 'UKVI Visa Status Tracker', timestamp: '1 hr ago', status: 'success', duration: '3.5s', triggerData: '42 visa cases checked' },
  { id: 'ex4', workflowId: 'wf-1', workflowName: 'Lead Intake & AI Scoring', timestamp: '2 hr ago', status: 'error', duration: '0.3s', triggerData: 'Webhook timeout' },
  { id: 'ex5', workflowId: 'wf-4', workflowName: 'Document Collection Reminders', timestamp: '1 day ago', status: 'success', duration: '12.1s', triggerData: '18 reminders sent' },
];

// ── Node Icon Mapping ──────────────────────────────────────────────────────
const NODE_ICONS: Record<NodeType, React.ReactNode> = {
  trigger: <Clock className="h-4 w-4" />,
  ai_agent: <Sparkles className="h-4 w-4" />,
  condition: <Split className="h-4 w-4" />,
  action: <Zap className="h-4 w-4" />,
  webhook: <Webhook className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  delay: <Clock className="h-4 w-4" />,
};

const NODE_COLORS: Record<NodeType, string> = {
  trigger: '#f59e0b',
  ai_agent: '#8b5cf6',
  condition: '#0066CC',
  action: '#22c55e',
  webhook: '#FF6D5A',
  database: '#14b8a6',
  email: '#0066CC',
  whatsapp: '#22c55e',
  delay: '#6b7280',
};

interface N8nWorkflowPageProps {
  onBack?: () => void;
}

export function N8nWorkflowPage({ onBack }: N8nWorkflowPageProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const categories = ['all', ...new Set(WORKFLOW_TEMPLATES.map(w => w.category))];
  const filteredWorkflows = activeFilter === 'all'
    ? WORKFLOW_TEMPLATES
    : WORKFLOW_TEMPLATES.filter(w => w.category === activeFilter);

  const selected = WORKFLOW_TEMPLATES.find(w => w.id === selectedWorkflow);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <header className="bg-[#1a1a2e] text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1 text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Workflow className="h-5 w-5" style={{ color: N8N_ORANGE }} />
                n8n Workflow Automation
              </h1>
              <p className="text-xs text-white/50">AI-powered marketing & operations workflows</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs" style={{ backgroundColor: N8N_ORANGE, color: 'white', borderRadius: '4px' }}>
              {WORKFLOW_TEMPLATES.filter(w => w.status === 'active').length} Active
            </Badge>
            <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border-0 text-xs" style={{ borderRadius: '6px' }}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Workflow
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="workflows" className="flex-1 flex flex-col">
        <div className="bg-white border-b border-[#e5e7eb] px-4">
          <div className="max-w-6xl mx-auto overflow-x-auto">
            <TabsList className="bg-transparent h-10 gap-0.5 p-0">
              {[
                { value: 'workflows', label: 'Workflows' },
                { value: 'executions', label: 'Executions' },
                { value: 'builder', label: 'Visual Builder' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#FF6D5A] data-[state=active]:text-[#1a1a2e] data-[state=active]:font-semibold text-[#6b7280] h-10 rounded-none px-4 text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="m-0 p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Category filters */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={activeFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter(cat)}
                  className={activeFilter === cat ? 'bg-[#FF6D5A] hover:bg-[#e55a49] text-white text-xs' : 'text-xs'}
                  style={{ borderRadius: '6px' }}
                >
                  {cat === 'all' ? 'All' : cat}
                </Button>
              ))}
            </div>

            {/* Workflow cards */}
            <div className="space-y-4">
              {filteredWorkflows.map(wf => (
                <Card
                  key={wf.id}
                  className={`border cursor-pointer hover:shadow-md transition-all ${selectedWorkflow === wf.id ? 'border-[#FF6D5A] ring-1 ring-[#FF6D5A]/30' : 'border-[#e5e7eb]'}`}
                  onClick={() => setSelectedWorkflow(selectedWorkflow === wf.id ? null : wf.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#1a1a2e]">{wf.name}</h3>
                          <Badge
                            className="text-xs border-0"
                            style={{
                              backgroundColor: wf.status === 'active' ? '#f0fdf4' : wf.status === 'draft' ? '#f3f4f6' : '#fef2f2',
                              color: wf.status === 'active' ? '#22c55e' : wf.status === 'draft' ? '#6b7280' : '#dc2626',
                              borderRadius: '4px',
                            }}
                          >
                            {wf.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs" style={{ borderRadius: '4px' }}>{wf.category}</Badge>
                        </div>
                        <p className="text-sm text-[#6b7280] mb-3">{wf.description}</p>

                        {/* Node preview */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {wf.nodes.map((node, i) => (
                            <React.Fragment key={node.id}>
                              <div
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                                style={{ backgroundColor: `${NODE_COLORS[node.type]}15`, color: NODE_COLORS[node.type] }}
                              >
                                {NODE_ICONS[node.type]}
                                <span className="hidden sm:inline">{node.label}</span>
                              </div>
                              {i < wf.nodes.length - 1 && <ArrowRight className="h-3 w-3 text-[#9ca3af] shrink-0" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div className="text-sm font-bold text-[#1a1a2e]">{wf.executionCount.toLocaleString()}</div>
                        <div className="text-xs text-[#6b7280]">executions</div>
                        <div className="text-sm font-bold" style={{ color: wf.successRate >= 95 ? '#22c55e' : wf.successRate >= 90 ? '#f59e0b' : '#dc2626' }}>
                          {wf.successRate}%
                        </div>
                        <div className="text-xs text-[#6b7280]">success</div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {selectedWorkflow === wf.id && (
                      <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="bg-[#f9fafb] rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-[#1a1a2e]">{wf.nodes.length}</div>
                            <div className="text-xs text-[#6b7280]">Nodes</div>
                          </div>
                          <div className="bg-[#f9fafb] rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-[#1a1a2e]">{wf.connections.length}</div>
                            <div className="text-xs text-[#6b7280]">Connections</div>
                          </div>
                          <div className="bg-[#f9fafb] rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-[#1a1a2e]">{wf.executionCount.toLocaleString()}</div>
                            <div className="text-xs text-[#6b7280]">Executions</div>
                          </div>
                          <div className="bg-[#f9fafb] rounded-lg p-3 text-center">
                            <div className="text-lg font-bold" style={{ color: wf.successRate >= 95 ? '#22c55e' : '#f59e0b' }}>
                              {wf.successRate}%
                            </div>
                            <div className="text-xs text-[#6b7280]">Success Rate</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {wf.status === 'active' ? (
                            <Button size="sm" variant="outline" className="text-xs" style={{ borderRadius: '6px' }}>
                              <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                            </Button>
                          ) : (
                            <Button size="sm" className="bg-[#FF6D5A] hover:bg-[#e55a49] text-white text-xs" style={{ borderRadius: '6px' }}>
                              <Play className="h-3.5 w-3.5 mr-1" /> Activate
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-xs" style={{ borderRadius: '6px' }}>
                            <Settings className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs" style={{ borderRadius: '6px' }}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> View Executions
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="m-0 p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1a1a2e]">Recent Executions</h2>
              <Button size="sm" variant="outline" className="text-xs" style={{ borderRadius: '6px' }}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
            </div>
            <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[#f9fafb] text-xs font-semibold text-[#6b7280] border-b border-[#e5e7eb]">
                <div className="col-span-1">Status</div>
                <div className="col-span-3">Workflow</div>
                <div className="col-span-3">Trigger Data</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-1">Actions</div>
              </div>
              {EXECUTION_LOGS.map(log => (
                <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm border-b border-[#f3f4f6] last:border-0 hover:bg-[#f9fafb]">
                  <div className="col-span-1">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                    ) : log.status === 'error' ? (
                      <XCircle className="h-4 w-4 text-[#dc2626]" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-[#0066CC] border-t-transparent animate-spin" />
                    )}
                  </div>
                  <div className="col-span-3 font-medium text-[#1a1a2e] truncate">{log.workflowName}</div>
                  <div className="col-span-3 text-[#6b7280] truncate">{log.triggerData}</div>
                  <div className="col-span-2 text-[#6b7280] text-xs">{log.timestamp}</div>
                  <div className="col-span-2 text-[#1a1a2e] font-mono text-xs">{log.duration}</div>
                  <div className="col-span-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Visual Builder Tab */}
        <TabsContent value="builder" className="m-0 p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Card className="border border-[#e5e7eb]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitBranch className="h-5 w-5" style={{ color: N8N_ORANGE }} />
                  Workflow Visual Builder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-[#f9fafb] rounded-xl p-8 border-2 border-dashed border-[#e5e7eb] text-center min-h-[400px] flex flex-col items-center justify-center">
                  <Workflow className="h-12 w-12 text-[#9ca3af] mb-4" />
                  <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">Drag & Drop Workflow Builder</h3>
                  <p className="text-sm text-[#6b7280] mb-6 max-w-md">
                    Create automated workflows by connecting trigger, AI agent, condition, and action nodes.
                    Inspired by n8n&apos;s visual workflow editor.
                  </p>

                  {/* Available node types */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                    {(Object.entries(NODE_ICONS) as [NodeType, React.ReactNode][]).map(([type, icon]) => (
                      <div
                        key={type}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-[#e5e7eb] hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${NODE_COLORS[type]}15`, color: NODE_COLORS[type] }}>
                          {icon}
                        </div>
                        <span className="text-xs font-medium text-[#1a1a2e] capitalize">{type.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="text-white font-semibold px-6" style={{ backgroundColor: N8N_ORANGE, borderRadius: '8px' }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
