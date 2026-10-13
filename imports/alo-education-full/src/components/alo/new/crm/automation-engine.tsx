'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Zap, Mail, MessageCircle, UserPlus, ArrowRight, Calendar, Tag,
  Plus, Trash2, Play, FileText, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type TriggerEvent =
  | 'LEAD_CREATED' | 'STAGE_CHANGED' | 'SCORE_CHANGED'
  | 'FOLLOWUP_OVERDUE' | 'DOCUMENT_UPLOADED';

type ConditionOp = 'GT' | 'EQ' | 'LT' | 'CONTAINS';

type ActionType =
  | 'SEND_EMAIL' | 'SEND_WHATSAPP' | 'ASSIGN_COUNSELOR'
  | 'CHANGE_STAGE' | 'SCHEDULE_FOLLOWUP' | 'ADD_TAG';

interface Condition {
  id: string;
  field: string;
  op: ConditionOp;
  value: string;
}

interface Action {
  id: string;
  type: ActionType;
  config: Record<string, string>;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: TriggerEvent;
  conditions: Condition[];
  actions: Action[];
  enabled: boolean;
  lastExecuted?: string;
  executionCount: number;
}

interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: string;
  success: boolean;
  details: string;
  leadName: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const TRIGGER_LABELS: Record<TriggerEvent, string> = {
  LEAD_CREATED: 'Lead Created',
  STAGE_CHANGED: 'Stage Changed',
  SCORE_CHANGED: 'Score Changed',
  FOLLOWUP_OVERDUE: 'Follow-up Overdue',
  DOCUMENT_UPLOADED: 'Document Uploaded',
};

const TRIGGER_ICONS: Record<TriggerEvent, React.ReactNode> = {
  LEAD_CREATED: <Plus className="h-3.5 w-3.5" />,
  STAGE_CHANGED: <ArrowRight className="h-3.5 w-3.5" />,
  SCORE_CHANGED: <Zap className="h-3.5 w-3.5" />,
  FOLLOWUP_OVERDUE: <Clock className="h-3.5 w-3.5" />,
  DOCUMENT_UPLOADED: <FileText className="h-3.5 w-3.5" />,
};

const ACTION_LABELS: Record<ActionType, string> = {
  SEND_EMAIL: 'Send Email',
  SEND_WHATSAPP: 'Send WhatsApp',
  ASSIGN_COUNSELOR: 'Assign Counselor',
  CHANGE_STAGE: 'Change Stage',
  SCHEDULE_FOLLOWUP: 'Schedule Follow-up',
  ADD_TAG: 'Add Tag',
};

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  SEND_EMAIL: <Mail className="h-3.5 w-3.5" />,
  SEND_WHATSAPP: <MessageCircle className="h-3.5 w-3.5" />,
  ASSIGN_COUNSELOR: <UserPlus className="h-3.5 w-3.5" />,
  CHANGE_STAGE: <ArrowRight className="h-3.5 w-3.5" />,
  SCHEDULE_FOLLOWUP: <Calendar className="h-3.5 w-3.5" />,
  ADD_TAG: <Tag className="h-3.5 w-3.5" />,
};

const CONDITION_FIELDS = ['Score', 'Country', 'Days in Stage', 'Counselor', 'University', 'Course'];
const CONDITION_OPS: Record<ConditionOp, string> = { GT: '>', EQ: '=', LT: '<', CONTAINS: 'contains' };

// ── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_RULES: AutomationRule[] = [
  {
    id: 'R001',
    name: 'Auto-assign hot leads',
    trigger: 'LEAD_CREATED',
    conditions: [{ id: 'C1', field: 'Score', op: 'EQ', value: 'HOT' }],
    actions: [{ id: 'A1', type: 'ASSIGN_COUNSELOR', config: { counselor: 'Auto (round-robin)' } }],
    enabled: true,
    lastExecuted: '2025-03-12 14:32',
    executionCount: 47,
  },
  {
    id: 'R002',
    name: 'Follow-up overdue alert',
    trigger: 'FOLLOWUP_OVERDUE',
    conditions: [{ id: 'C2', field: 'Days in Stage', op: 'GT', value: '3' }],
    actions: [
      { id: 'A2', type: 'SEND_EMAIL', config: { template: 'Follow-up Reminder' } },
      { id: 'A3', type: 'SEND_WHATSAPP', config: { template: 'Quick Check-in' } },
    ],
    enabled: true,
    lastExecuted: '2025-03-11 09:00',
    executionCount: 123,
  },
  {
    id: 'R003',
    name: 'Qualified → Application flow',
    trigger: 'STAGE_CHANGED',
    conditions: [{ id: 'C4', field: 'Country', op: 'EQ', value: 'UK' }],
    actions: [
      { id: 'A4', type: 'CHANGE_STAGE', config: { stage: 'APPLICATION' } },
      { id: 'A5', type: 'SEND_EMAIL', config: { template: 'Application Guide' } },
    ],
    enabled: false,
    lastExecuted: '2025-03-08 16:45',
    executionCount: 31,
  },
  {
    id: 'R004',
    name: 'Tag scholarship-eligible',
    trigger: 'SCORE_CHANGED',
    conditions: [
      { id: 'C5', field: 'Score', op: 'GT', value: 'WARM' },
      { id: 'C6', field: 'Country', op: 'EQ', value: 'UK' },
    ],
    actions: [{ id: 'A6', type: 'ADD_TAG', config: { tag: 'scholarship-eligible' } }],
    enabled: true,
    lastExecuted: '2025-03-10 11:20',
    executionCount: 89,
  },
];

const MOCK_LOGS: ExecutionLog[] = [
  { id: 'E001', ruleId: 'R001', ruleName: 'Auto-assign hot leads', timestamp: '2025-03-12 14:32', success: true, details: 'Assigned to Sarah K.', leadName: 'Ahmed Al-Rashid' },
  { id: 'E002', ruleId: 'R002', ruleName: 'Follow-up overdue alert', timestamp: '2025-03-11 09:00', success: true, details: 'Email + WhatsApp sent', leadName: 'Carlos Mendoza' },
  { id: 'E003', ruleId: 'R004', ruleName: 'Tag scholarship-eligible', timestamp: '2025-03-10 11:20', success: true, details: 'Added tag: scholarship-eligible', leadName: 'Priya Sharma' },
  { id: 'E004', ruleId: 'R001', ruleName: 'Auto-assign hot leads', timestamp: '2025-03-09 16:45', success: false, details: 'No available counselor', leadName: 'Wei Zhang' },
  { id: 'E005', ruleId: 'R002', ruleName: 'Follow-up overdue alert', timestamp: '2025-03-09 09:00', success: true, details: 'Email sent', leadName: 'Sofia Garcia' },
  { id: 'E006', ruleId: 'R003', ruleName: 'Qualified → Application flow', timestamp: '2025-03-08 16:45', success: true, details: 'Stage changed + email sent', leadName: 'Olga Petrova' },
];

// ── Visual Rule Block ──────────────────────────────────────────────────────
function RuleBlock({ rule, onToggle }: { rule: AutomationRule; onToggle: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-white border border-[#e5e7eb]" style={{ borderRadius: '8px' }}>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Switch
              checked={rule.enabled}
              onCheckedChange={() => onToggle(rule.id)}
              className="data-[state=checked]:bg-[#bf4520]"
            />
            <CardTitle className="text-sm font-semibold text-[#2d3142] truncate">
              {rule.name}
            </CardTitle>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[#9ca3af] hover:text-[#2d3142] transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {/* Flow visualization: Trigger → Conditions → Actions */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Trigger */}
          <div className="flex items-center gap-1 bg-[#f0fdf4] text-[#166534] px-2 py-1 rounded-[4px] font-medium">
            {TRIGGER_ICONS[rule.trigger]}
            {TRIGGER_LABELS[rule.trigger]}
          </div>

          {rule.conditions.length > 0 && (
            <>
              <ArrowRight className="h-3 w-3 text-[#9ca3af]" />
              {/* Conditions */}
              <div className="flex items-center gap-1 flex-wrap">
                {rule.conditions.map((cond, i) => (
                  <React.Fragment key={cond.id}>
                    {i > 0 && <span className="text-[#9ca3af]">+</span>}
                    <div className="bg-[#fffbeb] text-[#92400e] px-2 py-1 rounded-[4px] font-medium">
                      {cond.field} {CONDITION_OPS[cond.op]} {cond.value}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </>
          )}

          <ArrowRight className="h-3 w-3 text-[#9ca3af]" />

          {/* Actions */}
          <div className="flex items-center gap-1 flex-wrap">
            {rule.actions.map((action, i) => (
              <React.Fragment key={action.id}>
                {i > 0 && <span className="text-[#9ca3af]">+</span>}
                <div className="bg-[#eff6ff] text-[#1e40af] px-2 py-1 rounded-[4px] font-medium flex items-center gap-1">
                  {ACTION_ICONS[action.type]}
                  {ACTION_LABELS[action.type]}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-[#e5e7eb] space-y-2 text-xs text-[#6b7280]">
            <div className="flex items-center justify-between">
              <span>Executions: <strong className="text-[#2d3142]">{rule.executionCount}</strong></span>
              {rule.lastExecuted && (
                <span>Last: <strong className="text-[#2d3142]">{rule.lastExecuted}</strong></span>
              )}
            </div>
            <div className="space-y-1">
              <div className="font-medium text-[#2d3142]">Conditions:</div>
              {rule.conditions.map(c => (
                <div key={c.id} className="pl-3 flex items-center gap-1">
                  <span className="text-[#9ca3af]">•</span> {c.field} {CONDITION_OPS[c.op]} {c.value}
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="font-medium text-[#2d3142]">Actions:</div>
              {rule.actions.map(a => (
                <div key={a.id} className="pl-3 flex items-center gap-1">
                  {ACTION_ICONS[a.type]}
                  <span>{ACTION_LABELS[a.type]}</span>
                  {Object.entries(a.config).map(([k, v]) => (
                    <span key={k} className="text-[#9ca3af]">({k}: {v})</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Rule Builder ───────────────────────────────────────────────────────────
function RuleBuilder({ onSave }: { onSave: (rule: AutomationRule) => void }) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<TriggerEvent>('LEAD_CREATED');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [actions, setActions] = useState<Action[]>([]);

  const addCondition = () => {
    setConditions(prev => [...prev, {
      id: `C${Date.now()}`,
      field: 'Score',
      op: 'EQ',
      value: '',
    }]);
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    setConditions(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCondition = (id: string) => {
    setConditions(prev => prev.filter(c => c.id !== id));
  };

  const addAction = () => {
    setActions(prev => [...prev, {
      id: `A${Date.now()}`,
      type: 'SEND_EMAIL',
      config: {},
    }]);
  };

  const updateAction = (id: string, updates: Partial<Action>) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeAction = (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const rule: AutomationRule = {
      id: `R${Date.now()}`,
      name,
      trigger,
      conditions,
      actions,
      enabled: true,
      executionCount: 0,
    };
    onSave(rule);
    setName('');
    setConditions([]);
    setActions([]);
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rule name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="bg-white border-[#e5e7eb]"
        style={{ borderRadius: '6px' }}
      />

      {/* Trigger Selection */}
      <div>
        <label className="text-xs font-medium text-[#2d3142] mb-1 block">When this happens:</label>
        <Select value={trigger} onValueChange={v => setTrigger(v as TriggerEvent)}>
          <SelectTrigger className="bg-white border-[#e5e7eb]" style={{ borderRadius: '6px' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-[#2d3142]">If these conditions are met:</label>
          <Button variant="ghost" size="sm" onClick={addCondition} className="h-6 text-[10px] text-[#bf4520] hover:text-[#a33a1a]">
            <Plus className="h-3 w-3 mr-0.5" /> Condition
          </Button>
        </div>
        <div className="space-y-2">
          {conditions.map(c => (
            <div key={c.id} className="flex items-center gap-1">
              <Select value={c.field} onValueChange={v => updateCondition(c.id, { field: v })}>
                <SelectTrigger className="h-7 text-xs flex-1 bg-white border-[#e5e7eb]" style={{ borderRadius: '4px' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={c.op} onValueChange={v => updateCondition(c.id, { op: v as ConditionOp })}>
                <SelectTrigger className="h-7 text-xs w-16 bg-white border-[#e5e7eb]" style={{ borderRadius: '4px' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDITION_OPS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                value={c.value}
                onChange={e => updateCondition(c.id, { value: e.target.value })}
                className="h-7 text-xs flex-1 bg-white border-[#e5e7eb]"
                style={{ borderRadius: '4px' }}
                placeholder="Value"
              />
              <button onClick={() => removeCondition(c.id)} className="text-[#9ca3af] hover:text-[#ef4444]">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {conditions.length === 0 && (
            <div className="text-[11px] text-[#9ca3af] italic">No conditions (runs on every trigger)</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-[#2d3142]">Do these actions:</label>
          <Button variant="ghost" size="sm" onClick={addAction} className="h-6 text-[10px] text-[#bf4520] hover:text-[#a33a1a]">
            <Plus className="h-3 w-3 mr-0.5" /> Action
          </Button>
        </div>
        <div className="space-y-2">
          {actions.map(a => (
            <div key={a.id} className="flex items-center gap-1">
              <Select value={a.type} onValueChange={v => updateAction(a.id, { type: v as ActionType })}>
                <SelectTrigger className="h-7 text-xs flex-1 bg-white border-[#e5e7eb]" style={{ borderRadius: '4px' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <button onClick={() => removeAction(a.id)} className="text-[#9ca3af] hover:text-[#ef4444]">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {actions.length === 0 && (
            <div className="text-[11px] text-[#9ca3af] italic">Add at least one action</div>
          )}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={!name.trim() || actions.length === 0}
        className="w-full bg-[#bf4520] hover:bg-[#a33a1a] text-white"
        style={{ borderRadius: '6px' }}
      >
        <Zap className="h-3.5 w-3.5 mr-1" /> Save Rule
      </Button>
    </div>
  );
}

// ── Main Automation Engine Component ───────────────────────────────────────
export function AutomationEngine() {
  const [rules, setRules] = useState<AutomationRule[]>(MOCK_RULES);
  const [logs] = useState<ExecutionLog[]>(MOCK_LOGS);
  const [showBuilder, setShowBuilder] = useState(false);
  const [tab, setTab] = useState<'rules' | 'builder' | 'logs'>('rules');

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, []);

  const addRule = useCallback((rule: AutomationRule) => {
    setRules(prev => [...prev, rule]);
    setTab('rules');
  }, []);

  const activeCount = rules.filter(r => r.enabled).length;

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#2d3142]">Automation Engine</h2>
            <Badge variant="secondary" className="text-xs bg-[#f0fdf4] text-[#166534]" style={{ borderRadius: '6px' }}>
              {activeCount} active / {rules.length} total
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {(['rules', 'builder', 'logs'] as const).map(t => {
              const labels = { rules: 'Rules', builder: 'Create', logs: 'Logs' };
              const isActive = tab === t;
              return (
                <Button
                  key={t}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTab(t)}
                  className={`h-7 text-xs ${isActive ? 'bg-[#2d3142] text-white' : 'text-[#6b7280]'}`}
                  style={{ borderRadius: '6px' }}
                >
                  {labels[t]}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {/* Rules Tab */}
        {tab === 'rules' && (
          <div className="space-y-3 max-w-3xl">
            {rules.map(rule => (
              <RuleBlock key={rule.id} rule={rule} onToggle={toggleRule} />
            ))}
          </div>
        )}

        {/* Builder Tab */}
        {tab === 'builder' && (
          <div className="max-w-xl mx-auto">
            <Card className="bg-white border border-[#e5e7eb]" style={{ borderRadius: '8px' }}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-[#2d3142] flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#bf4520]" />
                  Create Automation Rule
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <RuleBuilder onSave={addRule} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Logs Tab */}
        {tab === 'logs' && (
          <div className="max-w-3xl">
            <div className="space-y-2">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="bg-white border border-[#e5e7eb] rounded-[6px] p-3 flex items-center gap-3"
                >
                  {log.success ? (
                    <CheckCircle className="h-4 w-4 text-[#22c55e] shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#ef4444] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-[#2d3142]">{log.ruleName}</span>
                      <span className="text-[#9ca3af]">→</span>
                      <span className="text-[#6b7280]">{log.leadName}</span>
                    </div>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">{log.details}</div>
                  </div>
                  <span className="text-[10px] text-[#9ca3af] shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
