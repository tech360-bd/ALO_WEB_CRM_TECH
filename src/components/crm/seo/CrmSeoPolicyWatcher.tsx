'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Shield, ExternalLink, Globe, Brain, FileCheck, Search, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

// --- Mock Data ---

const policyAlerts = [
  { severity: 'critical' as const, message: 'UK Graduate Visa rules change effective Jan 1, 2027 — content update required' },
  { severity: 'warning' as const, message: 'Canada SDS status uncertain — verify before publishing' },
  { severity: 'info' as const, message: 'Australia Genuine Student requirement stable' },
];

const monitoredPolicies = [
  { name: 'UK Student Visa', jurisdiction: '🇬🇧 United Kingdom', lastChecked: 'Jul 20, 2026', nextReview: 'Aug 20, 2026', status: 'Stable' as const, source: 'GOV.UK', confidence: 96, contentAffected: 12 },
  { name: 'UK Graduate Visa', jurisdiction: '🇬🇧 United Kingdom', lastChecked: 'Jul 20, 2026', nextReview: 'Aug 3, 2026', status: 'Changing' as const, source: 'GOV.UK', confidence: 72, contentAffected: 8 },
  { name: 'Canada Study Permit', jurisdiction: '🇨🇦 Canada', lastChecked: 'Jul 18, 2026', nextReview: 'Aug 17, 2026', status: 'Monitor' as const, source: 'Canada.ca / IRCC', confidence: 81, contentAffected: 15 },
  { name: 'Canada PGWP', jurisdiction: '🇨🇦 Canada', lastChecked: 'Jul 18, 2026', nextReview: 'Aug 17, 2026', status: 'Stable' as const, source: 'Canada.ca / IRCC', confidence: 94, contentAffected: 6 },
  { name: 'Australia Subclass 500', jurisdiction: '🇦🇺 Australia', lastChecked: 'Jul 15, 2026', nextReview: 'Aug 14, 2026', status: 'Stable' as const, source: 'Dept. Home Affairs', confidence: 97, contentAffected: 10 },
  { name: 'Australia Genuine Student', jurisdiction: '🇦🇺 Australia', lastChecked: 'Jul 15, 2026', nextReview: 'Aug 14, 2026', status: 'Stable' as const, source: 'Dept. Home Affairs', confidence: 98, contentAffected: 4 },
  { name: 'US F1 Visa', jurisdiction: '🇺🇸 United States', lastChecked: 'Jul 12, 2026', nextReview: 'Aug 11, 2026', status: 'Stable' as const, source: 'U.S. Dept. of State', confidence: 93, contentAffected: 9 },
  { name: 'US OPT/CPT', jurisdiction: '🇺🇸 United States', lastChecked: 'Jul 12, 2026', nextReview: 'Aug 11, 2026', status: 'Stable' as const, source: 'USCIS', confidence: 91, contentAffected: 5 },
];

const sources = [
  { name: 'GOV.UK', url: 'gov.uk/student-visa', type: 'Tier A' as const, lastAccessed: 'Jul 20, 2026', reliability: 'Operational' as const },
  { name: 'Canada.ca', url: 'canada.ca/en/immigration', type: 'Tier A' as const, lastAccessed: 'Jul 18, 2026', reliability: 'Operational' as const },
  { name: 'Department of Home Affairs (AU)', url: 'immi.homeaffairs.gov.au', type: 'Tier A' as const, lastAccessed: 'Jul 15, 2026', reliability: 'Operational' as const },
  { name: 'U.S. Department of State', url: 'travel.state.gov', type: 'Tier A' as const, lastAccessed: 'Jul 12, 2026', reliability: 'Operational' as const },
  { name: 'USCIS', url: 'uscis.gov', type: 'Tier A' as const, lastAccessed: 'Jul 12, 2026', reliability: 'Operational' as const },
  { name: 'Irish Immigration Service', url: 'irishimmigration.ie', type: 'Tier B' as const, lastAccessed: 'Jul 10, 2026', reliability: 'Operational' as const },
  { name: 'Immigration New Zealand', url: 'immigration.govt.nz', type: 'Tier B' as const, lastAccessed: 'Jul 8, 2026', reliability: 'Degraded' as const },
];

const contentImpact = [
  { page: 'UK Graduate Visa Guide', url: '/uk/graduate-visa', section: 'Eligibility criteria, work rights', status: 'Outdated' as const, priority: 'Critical' as const, reviewer: 'Sarah M.' },
  { page: 'Post-Study Work Options UK', url: '/uk/post-study-work', section: 'Visa duration, dependant rules', status: 'Outdated' as const, priority: 'Critical' as const, reviewer: 'Sarah M.' },
  { page: 'Canada Study Permit Checklist', url: '/canada/study-permit', section: 'SDS programme requirements', status: 'Needs Review' as const, priority: 'High' as const, reviewer: 'Unassigned' },
  { page: 'Canada PGWP Eligibility', url: '/canada/pgwp', section: 'Field of study requirements', status: 'Up to date' as const, priority: 'Low' as const, reviewer: 'James T.' },
  { page: 'Australia Student Visa FAQ', url: '/australia/student-visa-faq', section: 'Genuine Student test', status: 'Up to date' as const, priority: 'Low' as const, reviewer: 'Mei L.' },
];

const riskChecklist = [
  { id: 1, description: 'UK Student Visa maintenance fund requirement still £1,023/month (inner London)', jurisdiction: 'UK', status: 'Verified' as const, lastCheck: 'Jul 20, 2026', assignedTo: 'Sarah M.' },
  { id: 2, description: 'UK Graduate Visa 2-year post-study duration unchanged', jurisdiction: 'UK', status: 'Action Required' as const, lastCheck: 'Jul 20, 2026', assignedTo: 'Sarah M.' },
  { id: 3, description: 'Canada Study Permit processing times current', jurisdiction: 'Canada', status: 'Verified' as const, lastCheck: 'Jul 18, 2026', assignedTo: 'James T.' },
  { id: 4, description: 'Canada SDS programme still accepting applications', jurisdiction: 'Canada', status: 'Unverified' as const, lastCheck: 'Jul 10, 2026', assignedTo: 'James T.' },
  { id: 5, description: 'Australia Subclass 500 GTE → GS requirement updated correctly on site', jurisdiction: 'Australia', status: 'Verified' as const, lastCheck: 'Jul 15, 2026', assignedTo: 'Mei L.' },
  { id: 6, description: 'Australia student visa fees reflect current charge (AUD 715)', jurisdiction: 'Australia', status: 'Verified' as const, lastCheck: 'Jul 15, 2026', assignedTo: 'Mei L.' },
  { id: 7, description: 'US F1 visa interview waiver eligibility criteria unchanged', jurisdiction: 'US', status: 'Verified' as const, lastCheck: 'Jul 12, 2026', assignedTo: 'David R.' },
  { id: 8, description: 'US OPT STEM extension 24-month rule current', jurisdiction: 'US', status: 'Verified' as const, lastCheck: 'Jul 12, 2026', assignedTo: 'David R.' },
  { id: 9, description: 'UK ATAS certificate requirement for sensitive programmes accurate', jurisdiction: 'UK', status: 'Verified' as const, lastCheck: 'Jul 20, 2026', assignedTo: 'Sarah M.' },
  { id: 10, description: 'Canada biometrics requirement wording matches IRCC guidance', jurisdiction: 'Canada', status: 'Verified' as const, lastCheck: 'Jul 18, 2026', assignedTo: 'James T.' },
  { id: 11, description: 'Australia English language requirements (IELTS 6.0) still accurate', jurisdiction: 'Australia', status: 'Verified' as const, lastCheck: 'Jul 15, 2026', assignedTo: 'Mei L.' },
  { id: 12, description: 'UK dependant visa restrictions for Jan 2024 intake reflected correctly', jurisdiction: 'UK', status: 'Action Required' as const, lastCheck: 'Jul 5, 2026', assignedTo: 'Sarah M.' },
  { id: 13, description: 'Canada provincial nominee programme links are valid', jurisdiction: 'Canada', status: 'Verified' as const, lastCheck: 'Jul 18, 2026', assignedTo: 'James T.' },
  { id: 14, description: 'US SEVIS fee amount ($350) displayed correctly', jurisdiction: 'US', status: 'Verified' as const, lastCheck: 'Jul 12, 2026', assignedTo: 'David R.' },
  { id: 15, description: 'All government source URLs return HTTP 200', jurisdiction: 'All', status: 'Unverified' as const, lastCheck: 'Jul 1, 2026', assignedTo: 'Auto-scan' },
];

const factCheckQueue = [
  { title: 'UK Graduate Visa Changes 2027', sections: 'Eligibility, Duration, Dependents', risk: 'High' as const, reviewer: 'Sarah M.', due: 'Jul 25, 2026', status: 'In Review' as const },
  { title: 'Canada SDS Programme Update', sections: 'Document list, GIC amount, Processing', risk: 'High' as const, reviewer: 'James T.', due: 'Jul 28, 2026', status: 'Pending' as const },
  { title: 'Tuition Fees Comparison 2026/27', sections: 'UK, Canada, Australia averages', risk: 'Medium' as const, reviewer: 'Mei L.', due: 'Aug 1, 2026', status: 'Pending' as const },
  { title: 'Visa Processing Times Overview', sections: 'All jurisdictions processing charts', risk: 'Medium' as const, reviewer: 'David R.', due: 'Aug 5, 2026', status: 'Pending' as const },
  { title: 'Student Life in Dublin Guide', sections: 'Cost of living, Culture, Transport', risk: 'Low' as const, reviewer: 'Mei L.', due: 'Aug 10, 2026', status: 'Approved' as const },
];

const aiGeneratedContent = [
  { title: 'UK Visa FAQ Auto-Generated', pages: 14, humanReviewed: 11, lastGenerated: 'Jul 19, 2026' },
  { title: 'Scholarship Comparison Tables', pages: 8, humanReviewed: 8, lastGenerated: 'Jul 16, 2026' },
  { title: 'Programme Description Summaries', pages: 42, humanReviewed: 28, lastGenerated: 'Jul 20, 2026' },
];

// --- Helpers ---

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'secondary' | 'default' | 'muted'; label: string }> = {
    Stable: { variant: 'success', label: 'Stable' },
    Changing: { variant: 'danger', label: 'Changing' },
    Monitor: { variant: 'warning', label: 'Monitor' },
    Critical: { variant: 'danger', label: 'Critical' },
    Verified: { variant: 'success', label: 'Verified' },
    'Action Required': { variant: 'danger', label: 'Action Required' },
    Unverified: { variant: 'warning', label: 'Unverified' },
    Operational: { variant: 'success', label: 'Operational' },
    Degraded: { variant: 'warning', label: 'Degraded' },
    Outdated: { variant: 'danger', label: 'Outdated' },
    'Needs Review': { variant: 'warning', label: 'Needs Review' },
    'Up to date': { variant: 'success', label: 'Up to date' },
    'In Review': { variant: 'warning', label: 'In Review' },
    Pending: { variant: 'secondary', label: 'Pending' },
    Approved: { variant: 'success', label: 'Approved' },
  };
  const v = map[status] ?? { variant: 'secondary' as const, label: status };
  return <Badge variant={v.variant}>{v.label}</Badge>;
};

const priorityBadge = (p: string) => {
  const v: Record<string, 'danger' | 'warning' | 'muted'> = { Critical: 'danger', High: 'warning', Low: 'muted' };
  return <Badge variant={v[p] ?? 'muted'}>{p}</Badge>;
};

const riskBadge = (r: string) => {
  const v: Record<string, 'danger' | 'warning' | 'secondary'> = { High: 'danger', Medium: 'warning', Low: 'secondary' };
  return <Badge variant={v[r] ?? 'secondary'}>{r}</Badge>;
};

// --- Component ---

export default function CrmSeoPolicyWatcher() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Immigration Policy Watcher</h1>
          <p className="text-muted-foreground text-sm">Content compliance &amp; policy change monitoring for ALO Education</p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Select defaultValue="all">
            <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jurisdictions</SelectItem>
              <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
              <SelectItem value="ca">🇨🇦 Canada</SelectItem>
              <SelectItem value="au">🇦🇺 Australia</SelectItem>
              <SelectItem value="us">🇺🇸 United States</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Search policies..." className="w-52" />
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Search className="size-4" />Check Now</Button>
        </div>
      </div>

      {/* 1. Policy Alert Banner */}
      <div className="space-y-3">
        {policyAlerts.map((a) => (
          <Alert
            key={a.message}
            className={
              a.severity === 'critical'
                ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200'
                : a.severity === 'warning'
                ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                : 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
            }
          >
            {a.severity === 'critical' && <AlertCircle className="size-4" />}
            {a.severity === 'warning' && <AlertTriangle className="size-4" />}
            {a.severity === 'info' && <CheckCircle2 className="size-4" />}
            <AlertTitle className="font-semibold">
              {a.severity === 'critical' ? 'Critical Policy Change' : a.severity === 'warning' ? 'Advisory' : 'Status Confirmed'}
            </AlertTitle>
            <AlertDescription>{a.message}</AlertDescription>
          </Alert>
        ))}
      </div>

      <Separator />

      {/* 2. Monitored Policies Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Monitored Policies</h2>
          <Badge variant="outline" className="gap-1.5"><Shield className="size-3.5" />{monitoredPolicies.length} policies tracked</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {monitoredPolicies.map((p) => (
            <Card key={p.name} className="py-4 gap-3">
              <CardHeader className="pb-0 pt-0 px-4 gap-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-tight">{p.name}</CardTitle>
                  {statusBadge(p.status)}
                </div>
                <CardDescription className="text-xs">{p.jurisdiction}</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-0 pt-0 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Clock className="size-3" />Last verified</span>
                  <span className="font-medium text-foreground">{p.lastChecked}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Next review</span>
                  <span className="font-medium text-foreground">{p.nextReview}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Source</span>
                  <span className="font-medium text-foreground">{p.source}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Confidence</span>
                  <span className={`font-semibold ${p.confidence >= 90 ? 'text-emerald-600' : p.confidence >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{p.confidence}%</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-foreground">
                  <span>Content affected</span>
                  <Badge variant={p.contentAffected > 10 ? 'warning' : 'secondary'}>{p.contentAffected} pages</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* 3-7. Tabbed Sections */}
      <Tabs defaultValue="impact" className="w-full">
        <TabsList>
          <TabsTrigger value="impact">Content Impact</TabsTrigger>
          <TabsTrigger value="sources">Source Verification</TabsTrigger>
          <TabsTrigger value="checklist">Risk Checklist</TabsTrigger>
          <TabsTrigger value="factcheck">Fact-Check Queue</TabsTrigger>
          <TabsTrigger value="ai-safety">AI Safety</TabsTrigger>
        </TabsList>

        {/* Content Impact Tracker */}
        <TabsContent value="impact">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Impact Tracker</CardTitle>
              <CardDescription>Published pages that need updating due to policy changes</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="hidden md:table-cell">Affected Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="hidden sm:table-cell">Reviewer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentImpact.map((c) => (
                    <TableRow key={c.url}>
                      <TableCell className="font-medium">{c.page}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{c.url}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate" title={c.section}>{c.section}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell>{priorityBadge(c.priority)}</TableCell>
                      <TableCell className="hidden sm:table-cell"><span className="flex items-center gap-1 text-xs"><User className="size-3" />{c.reviewer}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Source Verification Library */}
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Globe className="size-4" />Source Verification Library</CardTitle>
              <CardDescription>Authoritative government sources used for policy verification</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Accessed</TableHead>
                    <TableHead>Reliability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><a href={`https://${s.url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">{s.url}<ExternalLink className="size-3" /></a></TableCell>
                      <TableCell><Badge variant={s.type === 'Tier A' ? 'default' : 'secondary'}>{s.type}</Badge></TableCell>
                      <TableCell>{s.lastAccessed}</TableCell>
                      <TableCell>{statusBadge(s.reliability)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Checklist */}
        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><FileCheck className="size-4" />Mandatory Risk Checklist</CardTitle>
                  <CardDescription>15-item current-risk checklist for immigration content compliance</CardDescription>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-600 font-semibold">{riskChecklist.filter(r => r.status === 'Verified').length} Verified</span>
                  <span className="text-amber-600 font-semibold">{riskChecklist.filter(r => r.status === 'Unverified').length} Unverified</span>
                  <span className="text-red-600 font-semibold">{riskChecklist.filter(r => r.status === 'Action Required').length} Action</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Risk Description</TableHead>
                    <TableHead className="hidden sm:table-cell">Jurisdiction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Check</TableHead>
                    <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskChecklist.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground font-mono text-xs">{r.id}</TableCell>
                      <TableCell className="font-medium max-w-[320px]">{r.description}</TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge variant="outline">{r.jurisdiction}</Badge></TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{r.lastCheck}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{r.assignedTo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fact-Check Queue */}
        <TabsContent value="factcheck">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Search className="size-4" />Fact-Check Queue</CardTitle>
              <CardDescription>Content awaiting immigration fact-checking before publishing</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content Title</TableHead>
                    <TableHead className="hidden md:table-cell">Sections to Verify</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="hidden sm:table-cell">Reviewer</TableHead>
                    <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factCheckQueue.map((f) => (
                    <TableRow key={f.title}>
                      <TableCell className="font-medium">{f.title}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">{f.sections}</TableCell>
                      <TableCell>{riskBadge(f.risk)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs"><span className="flex items-center gap-1"><User className="size-3" />{f.reviewer}</span></TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{f.due}</TableCell>
                      <TableCell>{statusBadge(f.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Content Safety Panel */}
        <TabsContent value="ai-safety">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Brain className="size-4" />AI Hallucination Prevention</CardTitle>
                <CardDescription>Rules enforced on all AI-generated immigration content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Never fabricate visa requirements, fees, or processing times',
                  'All immigration statistics must reference a verified source',
                  'AI-generated visa eligibility criteria must be human-reviewed',
                  'No speculative policy predictions without explicit disclaimer',
                  'Government URLs must be validated before inclusion',
                  'Financial figures (fees, living costs) must match latest official data',
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="size-4 mt-0.5 text-emerald-500 shrink-0" />
                    <span>{rule}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Compliance Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-emerald-600">94</span>
                    <span className="text-muted-foreground text-sm pb-1">/ 100</span>
                  </div>
                  <div className="mt-3 w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[94%] bg-emerald-500 rounded-full" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">2 items need immediate attention · 1 source degraded</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI-Generated Content Pending Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiGeneratedContent.map((c) => (
                    <div key={c.title}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{c.title}</span>
                        <span className="text-xs text-muted-foreground">{c.lastGenerated}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{c.pages} pages generated</span>
                        <span>·</span>
                        <span className={c.humanReviewed === c.pages ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>{c.humanReviewed}/{c.pages} reviewed</span>
                        {c.humanReviewed < c.pages && (
                          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="h-6 px-2 text-xs">Review {c.pages - c.humanReviewed} left</Button>
                        )}
                      </div>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
