'use client';

import { useState, useCallback } from 'react';
import {
  Plug, Webhook, Key, RefreshCw, ArrowLeftRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, Plus,
  Search, Copy, Eye, EyeOff, Trash2, ExternalLink,
  Zap, MessageSquare, FileText, BarChart3, SpellCheck2,
  Monitor, Blocks, Globe2, ChevronRight, Shield,
  Activity, Database, GitBranch, Settings2, Globe,
  Layers, Radio, Lock, Unlock, MoreHorizontal, ArrowRight,
  TrendingUp, Calendar, RefreshCcw, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  StatCard, SectionCard, PageHeader, StatusBadge, Icon, InfoRow, MiniBar,
} from '@/components/alo/shared';

// ─── Types ───────────────────────────────────────────────────────────

interface IntegrationsPageProps {
  onBack?: () => void;
  onNavigate?: (view: string, slug?: string) => void;
}

// ─── Connected Service Data (inspired by Twenty/Chatwoot/Ghost/Umami patterns) ──

interface ConnectedService {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  connected: boolean;
  syncStatus: 'synced' | 'syncing' | 'error' | 'idle';
  lastSync?: string;
  syncInterval?: string;
  recordsSynced?: number;
  version?: string;
  features: string[];
  color: string;
}

const SERVICES: ConnectedService[] = [
  {
    id: 'twenty-crm',
    name: 'Twenty CRM',
    description: 'Modern CRM with contact/company/deal views and automation workflows',
    icon: 'Layers',
    category: 'CRM',
    connected: true,
    syncStatus: 'synced',
    lastSync: '2 min ago',
    syncInterval: '5 min',
    recordsSynced: 1247,
    version: '0.27.0',
    features: ['Contact sync', 'Deal pipeline', 'Lead scoring', 'Automation workflows'],
    color: '#7C3AED',
  },
  {
    id: 'chatwoot',
    name: 'Chatwoot',
    description: 'Omnichannel inbox — WhatsApp, FB, Instagram, email in one view',
    icon: 'MessageSquare',
    category: 'Messaging',
    connected: true,
    syncStatus: 'syncing',
    lastSync: '1 min ago',
    syncInterval: 'Real-time',
    recordsSynced: 3892,
    version: '3.13.0',
    features: ['Omnichannel inbox', 'Chat widget', 'Auto-assign', 'Canned responses'],
    color: '#1FB6FF',
  },
  {
    id: 'ghost-cms',
    name: 'Ghost CMS',
    description: 'Editorial CMS for blog posts, newsletters & membership content',
    icon: 'FileText',
    category: 'Content',
    connected: true,
    syncStatus: 'synced',
    lastSync: '15 min ago',
    syncInterval: '15 min',
    recordsSynced: 186,
    version: '5.87.0',
    features: ['Blog sync', 'Newsletter send', 'Member import', 'SEO metadata'],
    color: '#15171A',
  },
  {
    id: 'umami',
    name: 'Umami Analytics',
    description: 'Privacy-friendly analytics — no cookies, anonymized IPs',
    icon: 'BarChart3',
    category: 'Analytics',
    connected: true,
    syncStatus: 'synced',
    lastSync: '5 min ago',
    syncInterval: '5 min',
    recordsSynced: 45230,
    version: '2.15.0',
    features: ['Real-time stats', 'Event tracking', 'UTM campaigns', 'Privacy-first'],
    color: '#0066CC',
  },
  {
    id: 'languagetool',
    name: 'LanguageTool',
    description: 'Open-source grammar & spell checker supporting 30+ languages',
    icon: 'SpellCheck2',
    category: 'Writing',
    connected: false,
    syncStatus: 'idle',
    features: ['Grammar check', 'Style suggestions', 'Multilingual', 'API integration'],
    color: '#E8501A',
  },
  {
    id: 'cap',
    name: 'Cap Screen Recording',
    description: 'Open-source Loom alternative for training videos & screen recordings',
    icon: 'Monitor',
    category: 'Video',
    connected: false,
    syncStatus: 'idle',
    features: ['Screen recording', 'Auto-transcript', 'Share links', 'Comments'],
    color: '#FF6B6B',
  },
  {
    id: 'tooljet',
    name: 'ToolJet',
    description: 'Low-code app builder with drag-drop, data connections & workflows',
    icon: 'Blocks',
    category: 'Low-Code',
    connected: false,
    syncStatus: 'idle',
    features: ['Drag-drop builder', 'Data connectors', 'Workflow automation', 'Custom apps'],
    color: '#2563EB',
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    description: 'Self-hosted file sync, sharing & collaboration platform',
    icon: 'Globe2',
    category: 'Storage',
    connected: false,
    syncStatus: 'idle',
    features: ['File sync', 'Document editing', 'Calendar', 'Contact sharing'],
    color: '#0082C9',
  },
];

// ─── Webhook Data ────────────────────────────────────────────────────

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'paused' | 'failed';
  lastTriggered?: string;
  successRate: number;
  deliveries: number;
  createdAt: string;
}

const WEBHOOKS: Webhook[] = [
  { id: 'wh-1', name: 'Lead Created → Slack', url: 'https://hooks.slack.com/...', events: ['lead.created', 'lead.updated'], status: 'active', lastTriggered: '3 min ago', successRate: 99.2, deliveries: 1847, createdAt: '2024-01-15' },
  { id: 'wh-2', name: 'Student Enrolled → Ghost', url: 'https://alo.edu/api/webhooks/ghost', events: ['student.enrolled'], status: 'active', lastTriggered: '1 hr ago', successRate: 98.7, deliveries: 432, createdAt: '2024-02-20' },
  { id: 'wh-3', name: 'Payment Received → Twenty', url: 'https://crm.alo.edu/api/webhooks', events: ['payment.completed'], status: 'active', lastTriggered: '25 min ago', successRate: 100, deliveries: 289, createdAt: '2024-03-01' },
  { id: 'wh-4', name: 'Doc Uploaded → Nextcloud', url: 'https://cloud.alo.edu/api/webhooks', events: ['document.uploaded'], status: 'paused', lastTriggered: '2 days ago', successRate: 95.4, deliveries: 156, createdAt: '2024-03-10' },
  { id: 'wh-5', name: 'Application Status → WhatsApp', url: 'https://api.chatwoot.com/...', events: ['application.status_changed'], status: 'failed', lastTriggered: '5 hr ago', successRate: 87.3, deliveries: 921, createdAt: '2024-01-28' },
  { id: 'wh-6', name: 'Blog Published → Umami', url: 'https://analytics.alo.edu/api/send', events: ['blog.published'], status: 'active', lastTriggered: '2 days ago', successRate: 100, deliveries: 67, createdAt: '2024-04-05' },
];

// ─── API Key Data ────────────────────────────────────────────────────

interface ApiKeyEntry {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  lastUsed?: string;
  requestCount: number;
  rateLimit: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt?: string;
}

const API_KEYS: ApiKeyEntry[] = [
  { id: 'ak-1', name: 'Public Website', prefix: 'alo_pk_live_', permissions: ['read:countries', 'read:universities', 'read:courses', 'read:blog'], lastUsed: '2 min ago', requestCount: 45230, rateLimit: '1000/min', status: 'active', createdAt: '2024-01-01', expiresAt: '2025-12-31' },
  { id: 'ak-2', name: 'Twenty CRM Sync', prefix: 'alo_sk_sync_', permissions: ['read:leads', 'write:leads', 'read:students', 'write:students'], lastUsed: '5 min ago', requestCount: 12470, rateLimit: '500/min', status: 'active', createdAt: '2024-01-15', expiresAt: '2025-06-30' },
  { id: 'ak-3', name: 'Chatwoot Integration', prefix: 'alo_sk_chat_', permissions: ['read:conversations', 'write:messages', 'read:contacts'], lastUsed: '1 min ago', requestCount: 38920, rateLimit: '500/min', status: 'active', createdAt: '2024-02-01' },
  { id: 'ak-4', name: 'Ghost CMS Content', prefix: 'alo_sk_cms_', permissions: ['read:blog', 'write:blog', 'read:pages'], lastUsed: '15 min ago', requestCount: 1860, rateLimit: '200/min', status: 'active', createdAt: '2024-02-20' },
  { id: 'ak-5', name: 'Mobile App', prefix: 'alo_pk_mob_', permissions: ['read:profile', 'read:applications', 'write:documents'], lastUsed: '1 hr ago', requestCount: 8920, rateLimit: '500/min', status: 'active', createdAt: '2024-03-01', expiresAt: '2025-12-31' },
  { id: 'ak-6', name: 'Legacy Partner API', prefix: 'alo_sk_old_', permissions: ['read:leads'], lastUsed: '30 days ago', requestCount: 120, rateLimit: '100/min', status: 'expired', createdAt: '2023-06-01', expiresAt: '2024-06-01' },
];

// ─── Sync History Data ──────────────────────────────────────────────

interface SyncRecord {
  id: string;
  service: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  conflicts: number;
  status: 'completed' | 'completed_with_errors' | 'failed' | 'in_progress';
  startedAt: string;
  duration: string;
  trigger: 'scheduled' | 'manual' | 'webhook';
}

const SYNC_HISTORY: SyncRecord[] = [
  { id: 's-1', service: 'Twenty CRM', direction: 'bidirectional', recordsProcessed: 245, recordsCreated: 12, recordsUpdated: 189, recordsFailed: 3, conflicts: 2, status: 'completed_with_errors', startedAt: '2 min ago', duration: '4.2s', trigger: 'scheduled' },
  { id: 's-2', service: 'Chatwoot', direction: 'inbound', recordsProcessed: 89, recordsCreated: 5, recordsUpdated: 72, recordsFailed: 0, conflicts: 0, status: 'completed', startedAt: '5 min ago', duration: '1.8s', trigger: 'webhook' },
  { id: 's-3', service: 'Ghost CMS', direction: 'outbound', recordsProcessed: 14, recordsCreated: 2, recordsUpdated: 10, recordsFailed: 0, conflicts: 0, status: 'completed', startedAt: '15 min ago', duration: '2.1s', trigger: 'manual' },
  { id: 's-4', service: 'Umami', direction: 'inbound', recordsProcessed: 1250, recordsCreated: 0, recordsUpdated: 1250, recordsFailed: 0, conflicts: 0, status: 'completed', startedAt: '5 min ago', duration: '0.8s', trigger: 'scheduled' },
  { id: 's-5', service: 'Twenty CRM', direction: 'outbound', recordsProcessed: 56, recordsCreated: 0, recordsUpdated: 48, recordsFailed: 8, conflicts: 5, status: 'failed', startedAt: '30 min ago', duration: '6.1s', trigger: 'manual' },
  { id: 's-6', service: 'Chatwoot', direction: 'bidirectional', recordsProcessed: 312, recordsCreated: 23, recordsUpdated: 270, recordsFailed: 2, conflicts: 1, status: 'completed_with_errors', startedAt: '1 hr ago', duration: '5.4s', trigger: 'scheduled' },
  { id: 's-7', service: 'Ghost CMS', direction: 'outbound', recordsProcessed: 8, recordsCreated: 1, recordsUpdated: 6, recordsFailed: 0, conflicts: 0, status: 'completed', startedAt: '2 hr ago', duration: '1.2s', trigger: 'webhook' },
  { id: 's-8', service: 'Twenty CRM', direction: 'inbound', recordsProcessed: 180, recordsCreated: 8, recordsUpdated: 165, recordsFailed: 1, conflicts: 0, status: 'completed', startedAt: '3 hr ago', duration: '3.7s', trigger: 'scheduled' },
];

// ─── Component ──────────────────────────────────────────────────────

export function IntegrationsPage({ onBack, onNavigate }: IntegrationsPageProps) {
  const [activeTab, setActiveTab] = useState('connected');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [services, setServices] = useState(SERVICES);

  const handleConnect = useCallback((id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setServices(prev => prev.map(s => s.id === id ? { ...s, connected: true, syncStatus: 'syncing' as const, lastSync: 'Just now' } : s));
      setConnectingId(null);
      setTimeout(() => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, syncStatus: 'synced' as const, recordsSynced: Math.floor(Math.random() * 500) + 50 } : s));
      }, 2000);
    }, 1500);
  }, []);

  const handleDisconnect = useCallback((id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, connected: false, syncStatus: 'idle' as const, lastSync: undefined, recordsSynced: undefined } : s));
  }, []);

  const toggleKeyVisibility = useCallback((id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const filteredServices = services.filter(s =>
    !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedCount = services.filter(s => s.connected).length;
  const totalWebhooks = WEBHOOKS.length;
  const activeWebhooks = WEBHOOKS.filter(w => w.status === 'active').length;
  const totalApiKeys = API_KEYS.filter(k => k.status === 'active').length;
  const recentSyncs = SYNC_HISTORY.filter(s => s.status !== 'in_progress').length;

  // ─── Render: Connected Services Tab ──────────────────────────────────
  const renderConnectedServices = () => (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Connected" value={connectedCount} icon="Plug" accent="blue" hint={`of ${services.length} available`} />
        <StatCard label="Active Webhooks" value={activeWebhooks} icon="Webhook" accent="emerald" hint={`of ${totalWebhooks} total`} />
        <StatCard label="API Keys" value={totalApiKeys} icon="Key" accent="orange" hint="active keys" />
        <StatCard label="Recent Syncs" value={recentSyncs} icon="RefreshCw" accent="violet" hint="last 24 hours" />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 border-[#E2E8F0]"
        />
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredServices.map(service => (
          <Card key={service.id} className={cn(
            'rounded-2xl border bg-white transition-all hover:shadow-md',
            service.connected ? 'border-[#E2E8F0]' : 'border-dashed border-[#CBD5E1]'
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${service.color}15`, color: service.color }}>
                    <Icon name={service.icon} className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#0F172A]">{service.name}</h3>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{service.category}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-[#64748B]">{service.description}</p>
                  </div>
                </div>
                {service.connected ? (
                  <StatusBadge
                    status={service.syncStatus}
                    colorMap={{
                      synced: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                      syncing: 'bg-amber-50 text-amber-700 border border-amber-200',
                      error: 'bg-red-50 text-red-700 border border-red-200',
                      idle: 'bg-slate-50 text-slate-700 border border-slate-200',
                    }}
                    labels={{ synced: 'Synced', syncing: 'Syncing', error: 'Error', idle: 'Idle' }}
                  />
                ) : (
                  <Badge variant="outline" className="text-[#64748B]">Not Connected</Badge>
                )}
              </div>

              {/* Features */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {service.features.map(f => (
                  <span key={f} className="inline-flex items-center rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569]">
                    {f}
                  </span>
                ))}
              </div>

              {/* Sync info (connected only) */}
              {service.connected && (
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#E2E8F0] pt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">Last Sync</p>
                    <p className="mt-0.5 text-sm font-medium text-[#0F172A]">{service.lastSync}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">Interval</p>
                    <p className="mt-0.5 text-sm font-medium text-[#0F172A]">{service.syncInterval}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">Records</p>
                    <p className="mt-0.5 text-sm font-medium text-[#0F172A]">{service.recordsSynced?.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Version info */}
              {service.version && service.connected && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                  <Layers className="size-3" />
                  v{service.version}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2">
                {service.connected ? (
                  <>
                    <Button variant="outline" size="sm" className="gap-1.5 text-[#64748B]">
                      <Settings2 className="size-3.5" /> Configure
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-[#64748B]">
                      <RefreshCcw className="size-3.5" /> Sync Now
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDisconnect(service.id)}>
                      <XCircle className="size-3.5" /> Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-[#0052B8] hover:bg-[#0042A0] text-white"
                    disabled={connectingId === service.id}
                    onClick={() => handleConnect(service.id)}
                  >
                    {connectingId === service.id ? (
                      <><Loader2 className="size-3.5 animate-spin" /> Connecting...</>
                    ) : (
                      <><Zap className="size-3.5" /> Connect</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // ─── Render: Webhooks Tab ───────────────────────────────────────────
  const renderWebhooks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#0F172A]">Webhook Endpoints</h3>
          <p className="text-sm text-[#64748B]">Receive real-time notifications when events occur</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-[#0052B8] hover:bg-[#0042A0] text-white">
          <Plus className="size-3.5" /> Add Webhook
        </Button>
      </div>

      <div className="space-y-3">
        {WEBHOOKS.map(wh => (
          <Card key={wh.id} className="rounded-xl border border-[#E2E8F0] bg-white hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn(
                    'flex size-9 items-center justify-center rounded-lg shrink-0',
                    wh.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                    wh.status === 'paused' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  )}>
                    <Webhook className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[#0F172A] truncate">{wh.name}</h4>
                      <StatusBadge
                        status={wh.status}
                        colorMap={{
                          active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                          paused: 'bg-amber-50 text-amber-700 border border-amber-200',
                          failed: 'bg-red-50 text-red-700 border border-red-200',
                        }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-[#94A3B8] font-mono truncate">{wh.url}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {wh.events.map(ev => (
                        <span key={ev} className="inline-flex items-center rounded-md bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-mono text-[#475569]">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-[#0F172A]">{wh.deliveries.toLocaleString()}</p>
                  <p className="text-[10px] text-[#94A3B8]">deliveries</p>
                  <div className="mt-1 flex items-center gap-1">
                    <MiniBar value={wh.successRate} max={100} color={wh.successRate >= 99 ? '#15803D' : wh.successRate >= 95 ? '#C2410C' : '#DC2626'} />
                    <span className="text-[10px] font-medium text-[#475569]">{wh.successRate}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2">
                <div className="flex items-center gap-4 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1"><Clock className="size-3" /> Last: {wh.lastTriggered}</span>
                  <span className="flex items-center gap-1"><Calendar className="size-3" /> Created: {wh.createdAt}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Copy className="size-3.5 text-[#64748B]" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="size-3.5 text-[#64748B]" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // ─── Render: API Keys Tab ──────────────────────────────────────────
  const renderApiKeys = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#0F172A]">API Keys</h3>
          <p className="text-sm text-[#64748B]">Manage access keys for external integrations and clients</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-[#0052B8] hover:bg-[#0042A0] text-white">
          <Plus className="size-3.5" /> Generate Key
        </Button>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Keys" value={API_KEYS.filter(k => k.status === 'active').length} icon="Key" accent="blue" />
        <StatCard label="Total Requests" value="102K" icon="Activity" accent="emerald" hint="last 30 days" />
        <StatCard label="Avg Latency" value="124ms" icon="Zap" accent="orange" />
      </div>

      <div className="space-y-3">
        {API_KEYS.map(key => (
          <Card key={key.id} className={cn(
            'rounded-xl border bg-white hover:shadow-sm transition-shadow',
            key.status === 'active' ? 'border-[#E2E8F0]' : 'border-dashed border-[#CBD5E1] opacity-70'
          )}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn(
                    'flex size-9 items-center justify-center rounded-lg shrink-0',
                    key.status === 'active' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-slate-100 text-slate-400'
                  )}>
                    <Key className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[#0F172A]">{key.name}</h4>
                      <StatusBadge
                        status={key.status}
                        colorMap={{
                          active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                          revoked: 'bg-red-50 text-red-700 border border-red-200',
                          expired: 'bg-slate-50 text-slate-700 border border-slate-200',
                        }}
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="text-xs font-mono text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded">
                        {visibleKeys.has(key.id) ? `${key.prefix}sk_...${btoa(key.id).slice(0, 8)}` : `${key.prefix}••••••••`}
                      </code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleKeyVisibility(key.id)}>
                        {visibleKeys.has(key.id) ? <EyeOff className="size-3 text-[#64748B]" /> : <Eye className="size-3 text-[#64748B]" />}
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {key.permissions.map(p => (
                        <span key={p} className="inline-flex items-center rounded-md bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-mono text-[#475569]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-sm font-medium text-[#0F172A]">{(key.requestCount / 1000).toFixed(1)}K</p>
                  <p className="text-[10px] text-[#94A3B8]">requests</p>
                  <p className="text-[10px] text-[#94A3B8]">{key.rateLimit}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2">
                <div className="flex items-center gap-4 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1"><Clock className="size-3" /> Last used: {key.lastUsed}</span>
                  <span className="flex items-center gap-1"><Calendar className="size-3" /> Created: {key.createdAt}</span>
                  {key.expiresAt && <span className="flex items-center gap-1"><AlertTriangle className="size-3" /> Expires: {key.expiresAt}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[#64748B]"><Copy className="size-3.5" /> Copy</Button>
                  {key.status === 'active' && (
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-red-600 hover:bg-red-50"><Trash2 className="size-3.5" /> Revoke</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // ─── Render: Data Sync Tab ─────────────────────────────────────────
  const renderDataSync = () => {
    const totalConflicts = SYNC_HISTORY.reduce((acc, s) => acc + s.conflicts, 0);
    const totalFailed = SYNC_HISTORY.reduce((acc, s) => acc + s.recordsFailed, 0);

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Syncs" value={SYNC_HISTORY.length} icon="RefreshCw" accent="blue" />
          <StatCard label="Records Processed" value={SYNC_HISTORY.reduce((a, s) => a + s.recordsProcessed, 0).toLocaleString()} icon="Database" accent="emerald" />
          <StatCard label="Conflicts" value={totalConflicts} icon="AlertTriangle" accent={totalConflicts > 0 ? 'orange' : 'emerald'} />
          <StatCard label="Failed Records" value={totalFailed} icon="XCircle" accent={totalFailed > 0 ? 'rose' : 'emerald'} />
        </div>

        {/* Active Syncs */}
        {SYNC_HISTORY.filter(s => s.status === 'in_progress').length > 0 && (
          <SectionCard title="Active Syncs" icon="Loader2">
            <div className="space-y-3">
              {SYNC_HISTORY.filter(s => s.status === 'in_progress').map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#F1F5F9]">
                  <Loader2 className="size-4 animate-spin text-[#2563EB]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0F172A]">{s.service} — {s.direction}</p>
                    <Progress value={65} className="mt-1.5 h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Conflict Resolution */}
        {totalConflicts > 0 && (
          <SectionCard title="Conflicts Requiring Resolution" icon="AlertTriangle" description={`${totalConflicts} conflicts need attention`}>
            <div className="space-y-3">
              {SYNC_HISTORY.filter(s => s.conflicts > 0).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">{s.service}: {s.conflicts} conflict{s.conflicts > 1 ? 's' : ''}</p>
                      <p className="text-xs text-amber-700">Started {s.startedAt} • {s.duration}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100">
                    <ArrowLeftRight className="size-3.5" /> Resolve
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Sync History Table */}
        <SectionCard title="Sync History" icon="Clock" action={
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCcw className="size-3.5" /> Refresh
          </Button>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="pb-2 text-left font-medium text-[#64748B]">Service</th>
                  <th className="pb-2 text-left font-medium text-[#64748B]">Direction</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">Processed</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">Created</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">Updated</th>
                  <th className="pb-2 text-right font-medium text-[#64748B]">Failed</th>
                  <th className="pb-2 text-center font-medium text-[#64748B]">Status</th>
                  <th className="pb-2 text-left font-medium text-[#64748B]">Time</th>
                  <th className="pb-2 text-center font-medium text-[#64748B]">Trigger</th>
                </tr>
              </thead>
              <tbody>
                {SYNC_HISTORY.map(s => (
                  <tr key={s.id} className="border-b border-[#F1F5F9] last:border-0">
                    <td className="py-2.5 font-medium text-[#0F172A]">{s.service}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1 text-[#475569]">
                        {s.direction === 'inbound' ? <ArrowRight className="size-3" /> :
                         s.direction === 'outbound' ? <ArrowRight className="size-3 rotate-180" /> :
                         <ArrowLeftRight className="size-3" />}
                        {s.direction}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[#0F172A]">{s.recordsProcessed}</td>
                    <td className="py-2.5 text-right tabular-nums text-emerald-600">+{s.recordsCreated}</td>
                    <td className="py-2.5 text-right tabular-nums text-[#475569]">{s.recordsUpdated}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      <span className={s.recordsFailed > 0 ? 'text-red-600 font-medium' : 'text-[#94A3B8]'}>{s.recordsFailed}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <StatusBadge
                        status={s.status}
                        colorMap={{
                          completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                          completed_with_errors: 'bg-amber-50 text-amber-700 border border-amber-200',
                          failed: 'bg-red-50 text-red-700 border border-red-200',
                          in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
                        }}
                        labels={{ completed: 'OK', completed_with_errors: 'Errors', failed: 'Failed', in_progress: 'Running' }}
                      />
                    </td>
                    <td className="py-2.5 text-[#64748B]">{s.startedAt}</td>
                    <td className="py-2.5 text-center">
                      <Badge variant="outline" className="text-[10px]">{s.trigger}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <PageHeader
            title="Platform Integrations"
            subtitle="Connect external services, manage webhooks & API access"
            icon="Plug"
            action={
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={onBack}>
                  <ArrowLeftRight className="size-3.5" /> Back
                </Button>
                <Button size="sm" className="gap-1.5 bg-[#0052B8] hover:bg-[#0042A0] text-white">
                  <Plus className="size-3.5" /> Add Integration
                </Button>
              </div>
            }
          />
        </div>

        {/* Privacy notice */}
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-2.5 text-sm text-[#1E40AF]">
          <Shield className="size-4 shrink-0" />
          <span>All integrations use encrypted connections (TLS 1.3). API keys are stored with AES-256 encryption. No credentials are exposed to the client.</span>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-[#E2E8F0] rounded-xl p-1 h-auto">
            <TabsTrigger value="connected" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-lg px-4">
              <Plug className="size-3.5" /> Connected Services
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-lg px-4">
              <Webhook className="size-3.5" /> Webhooks
              <Badge variant="secondary" className="ml-1 text-[10px]">{activeWebhooks}</Badge>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-lg px-4">
              <Key className="size-3.5" /> API Keys
              <Badge variant="secondary" className="ml-1 text-[10px]">{totalApiKeys}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white rounded-lg px-4">
              <RefreshCw className="size-3.5" /> Data Sync
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="connected">{renderConnectedServices()}</TabsContent>
            <TabsContent value="webhooks">{renderWebhooks()}</TabsContent>
            <TabsContent value="api-keys">{renderApiKeys()}</TabsContent>
            <TabsContent value="sync">{renderDataSync()}</TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
