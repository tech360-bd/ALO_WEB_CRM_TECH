'use client';
import SeoEvidencePanel from './SeoEvidencePanel';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  Upload,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
  Sparkles,
  MoreHorizontal,
  TriangleAlert,
  AlertCircle,
  Merge,
  ArrowUpRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Intent = 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
type Destination = 'UK' | 'USA' | 'Canada' | 'Australia' | 'Ireland' | 'New Zealand' | 'Dubai';
type FunnelStage = 'Awareness' | 'Consideration' | 'Decision';
type Priority = 'P0' | 'P1' | 'P2' | 'P3';
type ActionStatus = 'CREATE' | 'UPDATE' | 'MERGE' | 'WAIT';

interface Keyword {
  id: string;
  keyword: string;
  intent: Intent;
  destination: Destination;
  funnelStage: FunnelStage;
  priority: Priority;
  position: number;
  change: number;
  volume: number;
  cpc: number;
  opportunityScore: number;
  crmLeads: number;
  conversionRate: number;
  actionStatus: ActionStatus;
}

interface SeedGroup {
  name: string;
  keywords: string[];
}

interface CannibalizationAlert {
  keywords: string[];
  conflictingUrls: string[];
  severity: 'High' | 'Medium' | 'Low';
}

// ─── Constants & Data ───────────────────────────────────────────────────────

const DESTINATION_FLAGS: Record<Destination, string> = {
  UK: '\u{1F1EC}\u{1F1E7}',
  USA: '\u{1F1FA}\u{1F1F8}',
  Canada: '\u{1F1E8}\u{1F1E6}',
  Australia: '\u{1F1E6}\u{1F1FA}',
  Ireland: '\u{1F1EE}\u{1F1EA}',
  'New Zealand': '\u{1F1F3}\u{1F1FF}',
  Dubai: '\u{1F1E6}\u{1F1EA}',
};

const INTENT_COLORS: Record<Intent, string> = {
  Informational: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  Commercial: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  Transactional: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Navigational: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const ACTION_STATUS_VARIANTS: Record<ActionStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  MERGE: 'outline',
  WAIT: 'destructive',
};

const KEYWORDS: Keyword[] = [
  { id: '1', keyword: 'study in uk from bangladesh', intent: 'Commercial', destination: 'UK', funnelStage: 'Consideration', priority: 'P0', position: 3, change: 2, volume: 3200, cpc: 2.40, opportunityScore: 92, crmLeads: 47, conversionRate: 6.2, actionStatus: 'CREATE' },
  { id: '2', keyword: 'uk student visa from bangladesh 2025', intent: 'Transactional', destination: 'UK', funnelStage: 'Decision', priority: 'P0', position: 7, change: -1, volume: 4800, cpc: 3.10, opportunityScore: 88, crmLeads: 62, conversionRate: 5.8, actionStatus: 'UPDATE' },
  { id: '3', keyword: 'cheapest universities in uk for bangladeshi students', intent: 'Informational', destination: 'UK', funnelStage: 'Awareness', priority: 'P1', position: 5, change: 3, volume: 2100, cpc: 1.80, opportunityScore: 85, crmLeads: 31, conversionRate: 4.9, actionStatus: 'CREATE' },
  { id: '4', keyword: 'ms in computer science uk from bangladesh', intent: 'Commercial', destination: 'UK', funnelStage: 'Consideration', priority: 'P1', position: 2, change: 1, volume: 1800, cpc: 2.90, opportunityScore: 91, crmLeads: 28, conversionRate: 7.1, actionStatus: 'UPDATE' },
  { id: '5', keyword: 'study in usa from bangladesh', intent: 'Commercial', destination: 'USA', funnelStage: 'Awareness', priority: 'P0', position: 9, change: -3, volume: 5600, cpc: 4.20, opportunityScore: 86, crmLeads: 54, conversionRate: 5.1, actionStatus: 'MERGE' },
  { id: '6', keyword: 'us student visa requirements bangladesh', intent: 'Informational', destination: 'USA', funnelStage: 'Consideration', priority: 'P1', position: 4, change: 2, volume: 3900, cpc: 3.50, opportunityScore: 83, crmLeads: 41, conversionRate: 5.5, actionStatus: 'CREATE' },
  { id: '7', keyword: 'scholarships for bangladeshi students in usa', intent: 'Informational', destination: 'USA', funnelStage: 'Awareness', priority: 'P1', position: 12, change: 5, volume: 4200, cpc: 2.10, opportunityScore: 78, crmLeads: 38, conversionRate: 4.3, actionStatus: 'CREATE' },
  { id: '8', keyword: 'study in canada from bangladesh cost', intent: 'Commercial', destination: 'Canada', funnelStage: 'Consideration', priority: 'P0', position: 1, change: 0, volume: 2900, cpc: 2.80, opportunityScore: 94, crmLeads: 56, conversionRate: 8.2, actionStatus: 'UPDATE' },
  { id: '9', keyword: 'canada student visa from bangladesh processing time', intent: 'Transactional', destination: 'Canada', funnelStage: 'Decision', priority: 'P0', position: 6, change: -2, volume: 3400, cpc: 3.20, opportunityScore: 89, crmLeads: 49, conversionRate: 6.7, actionStatus: 'WAIT' },
  { id: '10', keyword: 'mba in canada for bangladeshi students', intent: 'Commercial', destination: 'Canada', funnelStage: 'Consideration', priority: 'P2', position: 15, change: 4, volume: 1600, cpc: 3.80, opportunityScore: 72, crmLeads: 22, conversionRate: 4.5, actionStatus: 'CREATE' },
  { id: '11', keyword: 'study in australia from bangladesh without ielts', intent: 'Informational', destination: 'Australia', funnelStage: 'Awareness', priority: 'P1', position: 8, change: 1, volume: 2400, cpc: 2.60, opportunityScore: 81, crmLeads: 33, conversionRate: 5.3, actionStatus: 'UPDATE' },
  { id: '12', keyword: 'australia student visa from bangladesh 2025', intent: 'Transactional', destination: 'Australia', funnelStage: 'Decision', priority: 'P1', position: 11, change: -4, volume: 2800, cpc: 3.40, opportunityScore: 76, crmLeads: 29, conversionRate: 4.7, actionStatus: 'MERGE' },
  { id: '13', keyword: 'best consultancy for study abroad in bangladesh', intent: 'Navigational', destination: 'UK', funnelStage: 'Decision', priority: 'P2', position: 18, change: 6, volume: 5200, cpc: 5.10, opportunityScore: 68, crmLeads: 71, conversionRate: 3.8, actionStatus: 'CREATE' },
  { id: '14', keyword: 'study in ireland from bangladesh fees', intent: 'Informational', destination: 'Ireland', funnelStage: 'Awareness', priority: 'P2', position: 14, change: 3, volume: 890, cpc: 2.30, opportunityScore: 74, crmLeads: 15, conversionRate: 5.0, actionStatus: 'WAIT' },
  { id: '15', keyword: 'ielts requirement for uk student visa bangladesh', intent: 'Informational', destination: 'UK', funnelStage: 'Consideration', priority: 'P1', position: 10, change: -1, volume: 1900, cpc: 1.60, opportunityScore: 80, crmLeads: 26, conversionRate: 5.9, actionStatus: 'UPDATE' },
];

const SEED_GROUPS: SeedGroup[] = [
  {
    name: 'High-conversion seeds',
    keywords: [
      'study in uk from bangladesh',
      'uk student visa application',
      'study in canada from bangladesh cost',
      'cheapest universities in uk for international students',
      'mba in uk for bangladeshi students',
      'best consultancies in dhaka for uk study',
      'study abroad scholarships bangladesh',
      'canada pr after study from bangladesh',
    ],
  },
  {
    name: 'UK seeds',
    keywords: [
      'uk student visa from bangladesh 2025',
      'tier 4 student visa bangladesh',
      'uk universities accepting bangladeshi students',
      'ucas application from bangladesh',
      'uk masters for bangladeshi students',
      'study in london from bangladesh',
      'uk post study work visa bangladesh',
      'ielts score for uk universities bangladesh',
      'uk nursing courses for bangladeshi students',
      'best universities in uk for bangladeshis',
    ],
  },
  {
    name: 'USA seeds',
    keywords: [
      'study in usa from bangladesh',
      'us student visa f1 bangladesh',
      'us universities for bangladeshi students',
      'sat score requirements bangladesh students',
      'fulbright scholarship bangladesh',
      'study in usa cost from bangladesh',
      'gre preparation bangladesh',
      'opt after study usa bangladesh',
      'community colleges usa bangladesh',
      'us embassy student visa dhaka',
    ],
  },
  {
    name: 'Canada seeds',
    keywords: [
      'canada student visa from bangladesh',
      'study in canada from bangladesh cost',
      'spp colleges bangladesh',
      'canada pr for bangladeshi students',
      'study in toronto from bangladesh',
      'canadian universities without ielts',
      'gic for canada student visa',
      'work and study in canada bangladesh',
    ],
  },
  {
    name: 'Australia seeds',
    keywords: [
      'study in australia from bangladesh',
      'australia student visa subclass 500',
      'australian universities for bangladeshi students',
      'study in melbourne from bangladesh',
      ' australia post study work visa',
      'study in australia without ielts',
    ],
  },
];

const CANNIBALIZATION_ALERTS: CannibalizationAlert[] = [
  {
    keywords: ['study in uk from bangladesh', 'uk study from bangladesh consultancy'],
    conflictingUrls: ['/blog/uk-study-guide', '/services/uk-admissions'],
    severity: 'High',
  },
  {
    keywords: ['canada student visa requirements', 'canada visa from bangladesh documents'],
    conflictingUrls: ['/visa/canada-requirements', '/blog/canada-visa-documents-2025'],
    severity: 'High',
  },
  {
    keywords: ['ielts requirement for uk student visa', 'ielts score for uk universities'],
    conflictingUrls: ['/resources/ielts-uk', '/blog/ielts-requirements-2025'],
    severity: 'Medium',
  },
  {
    keywords: ['study in usa from bangladesh', 'how to apply us universities from bangladesh'],
    conflictingUrls: ['/services/usa-admissions', '/blog/usa-application-guide'],
    severity: 'Medium',
  },
  {
    keywords: ['scholarships for bangladeshi students in usa', 'usa scholarships for bangladeshi students'],
    conflictingUrls: ['/scholarships/usa', '/blog/usa-funding-guide'],
    severity: 'Low',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPositionColor(position: number): string {
  if (position <= 3) return 'text-emerald-600 font-bold';
  if (position <= 10) return 'text-amber-600 font-semibold';
  if (position <= 20) return 'text-orange-500 font-medium';
  return 'text-red-500 font-medium';
}

function getPositionBg(position: number): string {
  if (position <= 3) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (position <= 10) return 'bg-amber-100 dark:bg-amber-900/30';
  if (position <= 20) return 'bg-orange-100 dark:bg-orange-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) return <span className="flex items-center gap-0.5 text-emerald-600 font-medium"><TrendingUp className="size-3.5" />+{change}</span>;
  if (change < 0) return <span className="flex items-center gap-0.5 text-red-500 font-medium"><TrendingDown className="size-3.5" />{change}</span>;
  return <span className="flex items-center gap-0.5 text-muted-foreground"><Minus className="size-3.5" />0</span>;
}

function OpportunityBar({ score }: { score: number }) {
  const barColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-7">{score}</span>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: 'High' | 'Medium' | 'Low' }) {
  const variants: Record<string, string> = {
    High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Low: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  };
  return <Badge variant="outline" className={variants[severity]}>{severity}</Badge>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CrmSeoKeywordTracker() { return <SeoEvidencePanel mode="keywords"/>; }

/** Historical design fixture, deliberately not rendered as operational evidence. */
function LegacyUnverifiedCrmSeoKeywordTracker() {
  const [search, setSearch] = useState('');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [destFilter, setDestFilter] = useState<string>('all');
  const [funnelFilter, setFunnelFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredKeywords = KEYWORDS.filter((kw) => {
    if (search && !kw.keyword.toLowerCase().includes(search.toLowerCase())) return false;
    if (intentFilter !== 'all' && kw.intent !== intentFilter) return false;
    if (destFilter !== 'all' && kw.destination !== destFilter) return false;
    if (funnelFilter !== 'all' && kw.funnelStage !== funnelFilter) return false;
    if (priorityFilter !== 'all' && kw.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="size-7 text-primary" />
            SEO Keyword Research &amp; Tracking
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor keyword rankings, identify opportunities, and manage content actions for ALO Education.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="gap-1.5">
            <Upload className="size-4" /> Import Keywords
          </Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="gap-1.5">
            <Plus className="size-4" /> Add Keyword
          </Button>
        </div>
      </div>

      <Separator />

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={intentFilter} onValueChange={setIntentFilter}>
                <SelectTrigger size="sm" className="w-[140px]">
                  <SelectValue placeholder="Intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Intents</SelectItem>
                  <SelectItem value="Informational">Informational</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Transactional">Transactional</SelectItem>
                  <SelectItem value="Navigational">Navigational</SelectItem>
                </SelectContent>
              </Select>
              <Select value={destFilter} onValueChange={setDestFilter}>
                <SelectTrigger size="sm" className="w-[150px]">
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Destinations</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="USA">USA</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Ireland">Ireland</SelectItem>
                  <SelectItem value="New Zealand">New Zealand</SelectItem>
                  <SelectItem value="Dubai">Dubai</SelectItem>
                </SelectContent>
              </Select>
              <Select value={funnelFilter} onValueChange={setFunnelFilter}>
                <SelectTrigger size="sm" className="w-[155px]">
                  <SelectValue placeholder="Funnel Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="Awareness">Awareness</SelectItem>
                  <SelectItem value="Consideration">Consideration</SelectItem>
                  <SelectItem value="Decision">Decision</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger size="sm" className="w-[110px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="P0">P0</SelectItem>
                  <SelectItem value="P1">P1</SelectItem>
                  <SelectItem value="P2">P2</SelectItem>
                  <SelectItem value="P3">P3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Target className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">247</p>
              <p className="text-sm text-muted-foreground">Total Keywords Tracked</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="size-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">34</p>
              <p className="text-sm text-muted-foreground">Keywords in Top 10</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Sparkles className="size-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">89</p>
              <p className="text-sm text-muted-foreground">Opportunity Score &gt; 70</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="keywords" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keywords" className="gap-1.5">
            <BarChart3 className="size-4" /> Keyword Universe
          </TabsTrigger>
          <TabsTrigger value="seed-groups" className="gap-1.5">
            <Target className="size-4" /> Seed Keyword Groups
          </TabsTrigger>
          <TabsTrigger value="cannibalization" className="gap-1.5">
            <AlertCircle className="size-4" /> Cannibalization Alerts
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Keyword Universe ────────────────────────────── */}
        <TabsContent value="keywords" className="space-y-6">
          {/* Keyword Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Keyword Universe</CardTitle>
              <CardDescription>Showing {filteredKeywords.length} of {KEYWORDS.length} tracked keywords</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead>Dest.</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead className="text-right">Est. Volume</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead>Opportunity</TableHead>
                    <TableHead className="text-right">CRM Leads</TableHead>
                    <TableHead className="text-right">Conv. Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeywords.map((kw) => (
                    <TableRow key={kw.id}>
                      <TableCell className="font-medium max-w-[220px] truncate">{kw.keyword}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={INTENT_COLORS[kw.intent]}>{kw.intent}</Badge>
                      </TableCell>
                      <TableCell className="text-lg">{DESTINATION_FLAGS[kw.destination]} {kw.destination}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center justify-center size-8 rounded-md text-sm ${getPositionBg(kw.position)} ${getPositionColor(kw.position)}`}>
                          {kw.position}
                        </span>
                      </TableCell>
                      <TableCell><ChangeIndicator change={kw.change} /></TableCell>
                      <TableCell className="text-right font-medium">{kw.volume.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${kw.cpc.toFixed(2)}</TableCell>
                      <TableCell><OpportunityBar score={kw.opportunityScore} /></TableCell>
                      <TableCell className="text-right font-medium">{kw.crmLeads}</TableCell>
                      <TableCell className="text-right">{kw.conversionRate}%</TableCell>
                      <TableCell>
                        <Badge variant={ACTION_STATUS_VARIANTS[kw.actionStatus]}>{kw.actionStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Priority Scoring Model */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="size-5 text-amber-500" />
                Priority Scoring Model
              </CardTitle>
              <CardDescription>How the Opportunity Score (0-100) is calculated for each keyword</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Search Console Opportunity', weight: 25, color: 'bg-primary', desc: 'Gap between current rank and impression potential' },
                  { label: 'Verified Demand', weight: 20, color: 'bg-emerald-500', desc: 'Search volume + trend consistency + seasonal spikes' },
                  { label: 'CRM Conversion Quality', weight: 20, color: 'bg-violet-500', desc: 'Lead-to-enrollment ratio from this keyword cohort' },
                  { label: 'Business Value', weight: 15, color: 'bg-amber-500', desc: 'Average revenue per conversion for this destination' },
                  { label: 'SERP Feasibility', weight: 10, color: 'bg-sky-500', desc: 'Competition analysis: DA gap, content gaps in top 10' },
                  { label: 'Content Freshness Urgency', weight: 10, color: 'bg-rose-500', desc: 'Time since last content update vs SERP freshness signals' },
                ].map((factor) => (
                  <div key={factor.label} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md ${factor.color} text-white text-xs font-bold`}>
                      {factor.weight}%
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{factor.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{factor.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Seed Keyword Groups ──────────────────────────── */}
        <TabsContent value="seed-groups" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SEED_GROUPS.map((group) => (
              <Card key={group.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <Badge variant="muted">{group.keywords.length} keywords</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {group.keywords.map((kw, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowUpRight className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{kw}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Tab: Cannibalization Alerts ───────────────────────── */}
        <TabsContent value="cannibalization" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TriangleAlert className="size-5 text-amber-500" />
                Keyword Cannibalization Alerts
              </CardTitle>
              <CardDescription>
                {CANNIBALIZATION_ALERTS.length} conflicts detected where multiple pages compete for similar keywords.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keywords in Conflict</TableHead>
                    <TableHead>Conflicting URLs</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CANNIBALIZATION_ALERTS.map((alert, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="space-y-1">
                          {alert.keywords.map((kw, ki) => (
                            <Badge key={ki} variant="outline" className="mr-1 mb-1">{kw}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {alert.conflictingUrls.map((url, ui) => (
                            <p key={ui} className="text-xs font-mono text-muted-foreground">{url}</p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                      <TableCell>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="size-8">
                          <Merge className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
