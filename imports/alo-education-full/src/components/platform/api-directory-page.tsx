'use client';

import { useState, useMemo } from 'react';
import {
  Globe, Search, Star, Heart, ExternalLink, Shield, Zap, Clock,
  ChevronRight, Filter, BookOpen, Code2, Key, BarChart3, Activity,
  CheckCircle2, AlertTriangle, XCircle, Plus, Settings, RefreshCw,
  ArrowRight, Database, Mail, MapPin, GraduationCap, CreditCard,
  MessageSquare, Music, Image, FileText, Cloud, Server, Webhook,
  Lock, Unlock, Users, TrendingUp, Eye, Copy, CheckCheck, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  StatCard, SectionCard, PageHeader, StatusBadge,
} from '@/components/alo/shared';

// ─── Types ───────────────────────────────────────────────────────────

interface ApiDirectoryPageProps {
  onBack?: () => void;
  onNavigate?: (view: string, slug?: string) => void;
}

type AuthType = 'none' | 'api_key' | 'oauth2' | 'bearer' | 'basic';
type ApiCategory = 'AI/ML' | 'Education' | 'Communication' | 'Finance' | 'Maps' | 'Social' | 'Data' | 'Media';
type HealthStatus = 'healthy' | 'degraded' | 'down';

interface ApiEntry {
  id: string;
  name: string;
  description: string;
  category: ApiCategory;
  authType: AuthType;
  rateLimit: string;
  docUrl: string;
  isFree: boolean;
  isFavorite?: boolean;
  usageCount?: number;
  healthStatus?: HealthStatus;
  latencyMs?: number;
  uptime?: number;
  lastUsed?: string;
  tags: string[];
}

// ─── Data ────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<ApiCategory, string> = {
  'AI/ML': 'Brain',
  'Education': 'GraduationCap',
  'Communication': 'MessageSquare',
  'Finance': 'CreditCard',
  'Maps': 'MapPin',
  'Social': 'Users',
  'Data': 'Database',
  'Media': 'Image',
};

const CATEGORY_COLORS: Record<ApiCategory, string> = {
  'AI/ML': 'bg-violet-50 text-violet-700 border-violet-200',
  'Education': 'bg-blue-50 text-blue-700 border-blue-200',
  'Communication': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Finance': 'bg-amber-50 text-amber-700 border-amber-200',
  'Maps': 'bg-rose-50 text-rose-700 border-rose-200',
  'Social': 'bg-pink-50 text-pink-700 border-pink-200',
  'Data': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Media': 'bg-orange-50 text-orange-700 border-orange-200',
};

const AUTH_LABELS: Record<AuthType, string> = {
  none: 'No Auth',
  api_key: 'API Key',
  oauth2: 'OAuth 2.0',
  bearer: 'Bearer Token',
  basic: 'Basic Auth',
};

const AUTH_ICONS: Record<AuthType, React.ReactNode> = {
  none: <Unlock className="size-3.5" />,
  api_key: <Key className="size-3.5" />,
  oauth2: <Shield className="size-3.5" />,
  bearer: <Lock className="size-3.5" />,
  basic: <Key className="size-3.5" />,
};

const APIS: ApiEntry[] = [
  { id: '1', name: 'OpenAI GPT-4', description: 'Advanced language model for text generation, summarization, and analysis', category: 'AI/ML', authType: 'bearer', rateLimit: '60 RPM', docUrl: '#', isFree: false, tags: ['LLM', 'text-generation', 'chat'], usageCount: 2847, healthStatus: 'healthy', latencyMs: 420, uptime: 99.9 },
  { id: '2', name: 'Anthropic Claude', description: 'Constitutional AI assistant for safe and helpful text generation', category: 'AI/ML', authType: 'bearer', rateLimit: '50 RPM', docUrl: '#', isFree: false, tags: ['LLM', 'safety', 'analysis'], usageCount: 1923, healthStatus: 'healthy', latencyMs: 380, uptime: 99.8 },
  { id: '3', name: 'Hugging Face Inference', description: 'Run ML model inference for NLP, vision, and audio tasks', category: 'AI/ML', authType: 'bearer', rateLimit: '1000/day', docUrl: '#', isFree: true, tags: ['ML', 'inference', 'open-source'], usageCount: 1205, healthStatus: 'healthy', latencyMs: 650, uptime: 99.5 },
  { id: '4', name: 'Google Gemini', description: 'Multimodal AI model for text, image, and code understanding', category: 'AI/ML', authType: 'api_key', rateLimit: '60 RPM', docUrl: '#', isFree: false, tags: ['multimodal', 'vision', 'code'], usageCount: 890, healthStatus: 'healthy', latencyMs: 350, uptime: 99.9 },
  { id: '5', name: 'OpenRouter', description: 'Unified API gateway for 100+ AI models with smart routing', category: 'AI/ML', authType: 'bearer', rateLimit: '100 RPM', docUrl: '#', isFree: false, tags: ['routing', 'multi-model', 'gateway'], usageCount: 567, healthStatus: 'healthy', latencyMs: 280, uptime: 99.7 },
  { id: '6', name: 'University Search API', description: 'Search and compare universities worldwide with detailed profiles', category: 'Education', authType: 'api_key', rateLimit: '1000/day', docUrl: '#', isFree: true, tags: ['universities', 'search', 'compare'], usageCount: 3456, healthStatus: 'healthy', latencyMs: 120, uptime: 99.9 },
  { id: '7', name: 'Course Catalog API', description: 'Access course databases with eligibility, fees, and rankings', category: 'Education', authType: 'api_key', rateLimit: '500/day', docUrl: '#', isFree: true, tags: ['courses', 'eligibility', 'rankings'], usageCount: 2789, healthStatus: 'healthy', latencyMs: 95, uptime: 99.8 },
  { id: '8', name: 'Scholarship Database', description: 'Search scholarships by country, field, and eligibility criteria', category: 'Education', authType: 'api_key', rateLimit: '300/day', docUrl: '#', isFree: true, tags: ['scholarships', 'funding', 'search'], usageCount: 1567, healthStatus: 'healthy', latencyMs: 140, uptime: 99.7 },
  { id: '9', name: 'IELTS/PTE Scoring', description: 'Calculate English proficiency test scores and equivalence', category: 'Education', authType: 'api_key', rateLimit: '100/day', docUrl: '#', isFree: false, tags: ['IELTS', 'PTE', 'scoring'], usageCount: 890, healthStatus: 'degraded', latencyMs: 450, uptime: 98.5 },
  { id: '10', name: 'SendGrid', description: 'Email delivery service with templates and analytics', category: 'Communication', authType: 'bearer', rateLimit: '100/s', docUrl: '#', isFree: false, tags: ['email', 'templates', 'analytics'], usageCount: 4523, healthStatus: 'healthy', latencyMs: 85, uptime: 99.99 },
  { id: '11', name: 'Twilio', description: 'SMS, voice, and WhatsApp communication platform', category: 'Communication', authType: 'basic', rateLimit: '100/s', docUrl: '#', isFree: false, tags: ['SMS', 'voice', 'WhatsApp'], usageCount: 3210, healthStatus: 'healthy', latencyMs: 120, uptime: 99.95 },
  { id: '12', name: 'WhatsApp Business API', description: 'Business messaging through WhatsApp for student communication', category: 'Communication', authType: 'bearer', rateLimit: '20/min', docUrl: '#', isFree: false, tags: ['WhatsApp', 'business', 'messaging'], usageCount: 2345, healthStatus: 'healthy', latencyMs: 200, uptime: 99.8 },
  { id: '13', name: 'Stripe', description: 'Payment processing for tuition fees and service charges', category: 'Finance', authType: 'bearer', rateLimit: '100/s', docUrl: '#', isFree: false, tags: ['payments', 'invoices', 'billing'], usageCount: 1876, healthStatus: 'healthy', latencyMs: 90, uptime: 99.99 },
  { id: '14', name: 'Currency Exchange API', description: 'Real-time and historical currency exchange rates', category: 'Finance', authType: 'api_key', rateLimit: '1500/month', docUrl: '#', isFree: true, tags: ['currency', 'exchange', 'rates'], usageCount: 987, healthStatus: 'healthy', latencyMs: 65, uptime: 99.9 },
  { id: '15', name: 'Google Maps', description: 'Maps, geocoding, and directions for campus locations', category: 'Maps', authType: 'api_key', rateLimit: '25000/day', docUrl: '#', isFree: true, tags: ['maps', 'geocoding', 'directions'], usageCount: 1543, healthStatus: 'healthy', latencyMs: 75, uptime: 99.99 },
  { id: '16', name: 'Mapbox', description: 'Custom maps and location data for education centers', category: 'Maps', authType: 'api_key', rateLimit: '100000/month', docUrl: '#', isFree: true, tags: ['maps', 'custom', 'geospatial'], usageCount: 456, healthStatus: 'healthy', latencyMs: 110, uptime: 99.9 },
  { id: '17', name: 'LinkedIn API', description: 'Professional profile data and alumni network integration', category: 'Social', authType: 'oauth2', rateLimit: '500/day', docUrl: '#', isFree: true, tags: ['professional', 'alumni', 'networking'], usageCount: 678, healthStatus: 'healthy', latencyMs: 180, uptime: 99.5 },
  { id: '18', name: 'Instagram Graph API', description: 'Social media content and insights for marketing campaigns', category: 'Social', authType: 'oauth2', rateLimit: '200/hour', docUrl: '#', isFree: true, tags: ['social', 'marketing', 'insights'], usageCount: 345, healthStatus: 'degraded', latencyMs: 350, uptime: 98.0 },
  { id: '19', name: 'World Bank Data API', description: 'Global development data including education statistics by country', category: 'Data', authType: 'none', rateLimit: 'Unlimited', docUrl: '#', isFree: true, tags: ['statistics', 'development', 'global'], usageCount: 234, healthStatus: 'healthy', latencyMs: 200, uptime: 99.7 },
  { id: '20', name: 'IPEDS Data Center', description: 'US higher education institutional data and comparisons', category: 'Data', authType: 'none', rateLimit: 'Unlimited', docUrl: '#', isFree: true, tags: ['US', 'institutions', 'statistics'], usageCount: 123, healthStatus: 'healthy', latencyMs: 250, uptime: 99.5 },
  { id: '21', name: 'Cloudinary', description: 'Image and video management with AI-powered transformations', category: 'Media', authType: 'bearer', rateLimit: '500/month', docUrl: '#', isFree: true, tags: ['images', 'video', 'CDN'], usageCount: 567, healthStatus: 'healthy', latencyMs: 60, uptime: 99.99 },
  { id: '22', name: 'YouTube Data API', description: 'Access video content, channels, and playlists for education', category: 'Media', authType: 'oauth2', rateLimit: '10000/day', docUrl: '#', isFree: true, tags: ['video', 'education', 'content'], usageCount: 890, healthStatus: 'healthy', latencyMs: 130, uptime: 99.9 },
];

// ─── Component ───────────────────────────────────────────────────────

export function ApiDirectoryPage({ onBack, onNavigate }: ApiDirectoryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ApiCategory | 'all'>('all');
  const [selectedAuth, setSelectedAuth] = useState<AuthType | 'all'>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['1', '6', '7', '10', '13']));
  const [activeTab, setActiveTab] = useState('categories');

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredApis = useMemo(() => {
    return APIS.filter(api => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!api.name.toLowerCase().includes(q) && !api.description.toLowerCase().includes(q) && !api.tags.some(t => t.toLowerCase().includes(q))) return false;
      }
      if (selectedCategory !== 'all' && api.category !== selectedCategory) return false;
      if (selectedAuth !== 'all' && api.authType !== selectedAuth) return false;
      return true;
    });
  }, [searchQuery, selectedCategory, selectedAuth]);

  const favoriteApis = useMemo(() => APIS.filter(api => favorites.has(api.id)), [favorites]);

  const categoryGroups = useMemo(() => {
    const groups: Record<ApiCategory, ApiEntry[]> = {} as any;
    for (const cat of Object.keys(CATEGORY_ICONS) as ApiCategory[]) {
      groups[cat] = APIS.filter(api => api.category === cat);
    }
    return groups;
  }, []);

  const healthyCount = APIS.filter(a => a.healthStatus === 'healthy').length;
  const degradedCount = APIS.filter(a => a.healthStatus === 'degraded').length;

  // ─── Health Status Badge ──────────────────────────────────────────

  const HealthBadge = ({ status }: { status: HealthStatus }) => {
    const config = {
      healthy: { icon: <CheckCircle2 className="size-3" />, cls: 'text-emerald-600 bg-emerald-50', label: 'Healthy' },
      degraded: { icon: <AlertTriangle className="size-3" />, cls: 'text-amber-600 bg-amber-50', label: 'Degraded' },
      down: { icon: <XCircle className="size-3" />, cls: 'text-red-600 bg-red-50', label: 'Down' },
    };
    const c = config[status];
    return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', c.cls)}>{c.icon}{c.label}</span>;
  };

  // ─── Auth Type Badge ─────────────────────────────────────────────

  const AuthBadge = ({ type }: { type: AuthType }) => (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">
      {AUTH_ICONS[type]}{AUTH_LABELS[type]}
    </span>
  );

  // ─── API Card ────────────────────────────────────────────────────

  const ApiCard = ({ api, showUsage = false }: { api: ApiEntry; showUsage?: boolean }) => (
    <Card className="group rounded-xl border border-slate-200 bg-white transition-all hover:shadow-md hover:border-slate-300">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{api.name}</h3>
              {api.isFree && <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">Free</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{api.description}</p>
          </div>
          <button
            onClick={() => toggleFavorite(api.id)}
            className="shrink-0 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <Heart className={cn('size-4', favorites.has(api.id) ? 'fill-red-500 text-red-500' : 'text-slate-300')} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border', CATEGORY_COLORS[api.category])}>
            {api.category}
          </span>
          <AuthBadge type={api.authType} />
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">
            <Zap className="size-3" />{api.rateLimit}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {api.tags.slice(0, 3).map(tag => (
            <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{tag}</span>
          ))}
        </div>

        {showUsage && api.usageCount !== undefined && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1"><Activity className="size-3" />{api.usageCount.toLocaleString()} calls/month</span>
            {api.latencyMs && <span className="flex items-center gap-1"><Clock className="size-3" />{api.latencyMs}ms avg</span>}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          {api.healthStatus && <HealthBadge status={api.healthStatus} />}
          <div className="flex items-center gap-1.5 ml-auto">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-[#0052B8]">
              <BookOpen className="size-3" />Docs
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-[#0052B8]">
              <Code2 className="size-3" />Try
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <PageHeader
          title="API Directory"
          subtitle="Discover, manage, and integrate APIs for your education platform"
          icon="Globe"
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="size-3.5" />Refresh Status
              </Button>
              <Button size="sm" className="gap-1.5 bg-[#0052B8] hover:bg-[#0042A0]">
                <Plus className="size-3.5" />Add Integration
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total APIs" value={APIS.length} icon="Database" accent="blue" />
          <StatCard label="Healthy" value={healthyCount} icon="CheckCircle2" accent="emerald" />
          <StatCard label="Favorites" value={favorites.size} icon="Heart" accent="rose" />
          <StatCard label="Free APIs" value={APIS.filter(a => a.isFree).length} icon="Gift" accent="amber" />
        </div>

        {/* Main Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg">
              <TabsTrigger value="categories" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <Layers className="size-3.5" />Categories
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <Search className="size-3.5" />Search
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <Heart className="size-3.5" />My APIs
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-1.5 data-[state=active]:bg-[#0052B8] data-[state=active]:text-white">
                <Webhook className="size-3.5" />Integrations
              </TabsTrigger>
            </TabsList>

            {/* Categories Tab */}
            <TabsContent value="categories" className="mt-4">
              <div className="space-y-6">
                {(Object.entries(categoryGroups) as [ApiCategory, ApiEntry[]][]).map(([category, apis]) => (
                  <SectionCard
                    key={category}
                    title={category}
                    description={`${apis.length} API${apis.length > 1 ? 's' : ''} available`}
                    icon={CATEGORY_ICONS[category]}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {apis.map(api => <ApiCard key={api.id} api={api} />)}
                    </div>
                  </SectionCard>
                ))}
              </div>
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="mt-4">
              <Card className="rounded-xl border border-slate-200">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        placeholder="Search APIs by name, description, or tag..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={v => setSelectedCategory(v as ApiCategory | 'all')}>
                      <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {(Object.keys(CATEGORY_ICONS) as ApiCategory[]).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedAuth} onValueChange={v => setSelectedAuth(v as AuthType | 'all')}>
                      <SelectTrigger className="w-full sm:w-36">
                        <SelectValue placeholder="Auth Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Auth</SelectItem>
                        {(Object.keys(AUTH_LABELS) as AuthType[]).map(auth => (
                          <SelectItem key={auth} value={auth}>{AUTH_LABELS[auth]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-500">{filteredApis.length} API{filteredApis.length !== 1 ? 's' : ''} found</p>
                  {(searchQuery || selectedCategory !== 'all' || selectedAuth !== 'all') && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedAuth('all'); }}>
                      Clear filters
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredApis.map(api => <ApiCard key={api.id} api={api} showUsage />)}
                </div>
                {filteredApis.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="size-10 text-slate-300" />
                    <p className="mt-3 font-medium text-slate-700">No APIs found</p>
                    <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* My APIs Tab */}
            <TabsContent value="favorites" className="mt-4">
              <SectionCard
                title="Saved APIs"
                description={`${favoriteApis.length} API${favoriteApis.length !== 1 ? 's' : ''} in your collection`}
                icon="Heart"
              >
                {favoriteApis.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {favoriteApis.map(api => <ApiCard key={api.id} api={api} showUsage />)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Heart className="size-10 text-slate-300" />
                    <p className="mt-3 font-medium text-slate-700">No favorite APIs yet</p>
                    <p className="text-sm text-slate-500">Click the heart icon on any API to save it here</p>
                  </div>
                )}
              </SectionCard>

              {/* Usage Stats Summary */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Calls" value="31.4K" icon="Activity" accent="blue" hint="This month" />
                <StatCard label="Avg Latency" value="187ms" icon="Clock" accent="emerald" />
                <StatCard label="Error Rate" value="0.3%" icon="AlertTriangle" accent="amber" />
                <StatCard label="Active Keys" value="8" icon="Key" accent="violet" />
              </div>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="mt-4">
              <SectionCard
                title="Active Integrations"
                description="API integrations currently connected to your platform"
                icon="Webhook"
                action={
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="size-3.5" />New Integration
                  </Button>
                }
              >
                <div className="space-y-3">
                  {APIS.filter(api => api.usageCount && api.usageCount > 500).map(api => (
                    <div key={api.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex size-10 items-center justify-center rounded-lg', CATEGORY_COLORS[api.category].split(' ').slice(0, 2).join(' '))}>
                          <Globe className="size-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{api.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {api.healthStatus && <HealthBadge status={api.healthStatus} />}
                            <span className="text-xs text-slate-500">{api.latencyMs}ms avg</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{api.usageCount?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">calls/mo</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{api.uptime}%</p>
                          <p className="text-xs text-slate-500">uptime</p>
                        </div>
                        <div className="w-24">
                          <Progress value={api.uptime} className="h-1.5" />
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                          <Settings className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Integration Health Overview */}
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SectionCard title="Health Overview" icon="Activity">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Healthy</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32"><Progress value={(healthyCount / APIS.length) * 100} className="h-2" /></div>
                        <span className="text-sm font-medium text-emerald-600">{healthyCount}/{APIS.length}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Degraded</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32"><Progress value={(degradedCount / APIS.length) * 100} className="h-2" /></div>
                        <span className="text-sm font-medium text-amber-600">{degradedCount}/{APIS.length}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Down</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32"><Progress value={0} className="h-2" /></div>
                        <span className="text-sm font-medium text-red-600">0/{APIS.length}</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Top Used APIs" icon="BarChart3">
                  <div className="space-y-2.5">
                    {APIS.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, 5).map((api, i) => (
                      <div key={api.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400 w-4">{i + 1}</span>
                          <span className="text-sm text-slate-700">{api.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{api.usageCount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
