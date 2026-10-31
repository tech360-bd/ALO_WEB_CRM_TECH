'use client';
import SeoEvidencePanel from './SeoEvidencePanel';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  FileCode,
  Shield,
  Zap,
  Smartphone,
  Database,
  Link2,
  ChevronDown,
  ChevronRight,
  Globe,
} from 'lucide-react';

const healthBreakdown = [
  { label: 'Indexation', score: 85, icon: Database, color: 'text-crm-success-text' },
  { label: 'Crawlability', score: 90, icon: Globe, color: 'text-crm-success-text' },
  { label: 'Performance', score: 68, icon: Zap, color: 'text-crm-warning-text' },
  { label: 'Mobile', score: 82, icon: Smartphone, color: 'text-crm-success-text' },
  { label: 'Structured Data', score: 55, icon: FileCode, color: 'text-crm-warning-text' },
  { label: 'Canonicalization', score: 78, icon: Link2, color: 'text-crm-warning-text' },
];

const severitySummary = [
  { level: 'Critical (P0)', count: 4, icon: AlertCircle, color: 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border', accent: 'bg-[var(--alo-error)]' },
  { level: 'Warning (P1)', count: 12, icon: AlertTriangle, color: 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border', accent: 'bg-[var(--alo-warning)]' },
  { level: 'Info (P2)', count: 8, icon: Info, color: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)] border-[var(--alo-border)]', accent: 'bg-[var(--alo-brand)]' },
];

const issues = [
  { id: 1, desc: 'Missing canonical tag on /study-in-uk and 5 other destination pages', category: 'Canonical', severity: 'P0', urls: 6, status: 'Open' as const, owner: 'Dev Team', suggestion: 'Add self-referencing canonical tags to all destination pages' },
  { id: 2, desc: 'Duplicate H1 tags on 18 university profile pages', category: 'Crawlability', severity: 'P0', urls: 18, status: 'Open' as const, owner: 'Content', suggestion: 'Ensure each university page has a unique H1 containing the university name' },
  { id: 3, desc: 'No structured data (JSON-LD) on any course listing pages', category: 'Schema', severity: 'P0', urls: 45, status: 'In Progress' as const, owner: 'Dev Team', suggestion: 'Implement Course and ListItem schema on all course pages' },
  { id: 4, desc: 'Slow LCP on homepage \u2014 4.2s (target < 2.5s)', category: 'Performance', severity: 'P0', urls: 1, status: 'Open' as const, owner: 'Dev Team', suggestion: 'Optimize hero image (WebP, lazy load), defer non-critical CSS, preload hero font' },
  { id: 5, desc: 'Orphan pages detected \u2014 23 pages with no internal links', category: 'Crawlability', severity: 'P1', urls: 23, status: 'Open' as const, owner: 'SEO', suggestion: 'Add internal links from relevant blog posts and hub pages to orphan URLs' },
  { id: 6, desc: 'Missing alt text on 67 images across scholarship pages', category: 'Mobile', severity: 'P1', urls: 67, status: 'Open' as const, owner: 'Content', suggestion: 'Add descriptive alt text to all images for accessibility and image search' },
  { id: 7, desc: 'Render-blocking JavaScript delaying FID by 800ms', category: 'Performance', severity: 'P1', urls: 12, status: 'In Progress' as const, owner: 'Dev Team', suggestion: 'Defer non-essential JS, use dynamic imports for below-fold components' },
  { id: 8, desc: 'Mobile viewport not configured on 4 legacy landing pages', category: 'Mobile', severity: 'P1', urls: 4, status: 'Fixed' as const, owner: 'Dev Team', suggestion: 'Add viewport meta tag with width=device-width, initial-scale=1' },
  { id: 9, desc: 'HTTP pages still accessible \u2014 8 pages not redirected to HTTPS', category: 'Crawlability', severity: 'P1', urls: 8, status: 'Open' as const, owner: 'DevOps', suggestion: 'Enforce HTTPS redirect at server level for all pages' },
  { id: 10, desc: 'Missing Open Graph tags on blog posts', category: 'Schema', severity: 'P1', urls: 34, status: 'Open' as const, owner: 'Dev Team', suggestion: 'Add OG title, description, image, and type to all blog post templates' },
  { id: 11, desc: 'Large CLS on destination pages \u2014 shift of 0.35 (target < 0.1)', category: 'Performance', severity: 'P1', urls: 18, status: 'Open' as const, owner: 'Dev Team', suggestion: 'Set explicit width/height on images and ad slots, use font-display:swap' },
  { id: 12, desc: 'Non-descriptive meta descriptions on 22 pages (< 50 chars or missing)', category: 'Crawlability', severity: 'P1', urls: 22, status: 'Open' as const, owner: 'Content', suggestion: 'Write unique 150-160 char meta descriptions for each page' },
  { id: 13, desc: 'Pagination rel=next/prev missing on course listing pages', category: 'Canonical', severity: 'P1', urls: 8, status: 'Ignoring' as const, owner: 'SEO', suggestion: 'Add rel=next and rel=prev to paginated course listings' },
  { id: 14, desc: 'Self-referencing canonical missing on 30 blog posts', category: 'Canonical', severity: 'P1', urls: 30, status: 'Open' as const, owner: 'Dev Team', suggestion: 'Add canonical URL meta tag pointing to the page itself' },
  { id: 15, desc: 'Breadcrumb structured data missing on university pages', category: 'Schema', severity: 'P1', urls: 45, status: 'Open' as const, owner: 'Dev Team', suggestion: 'Implement BreadcrumbList JSON-LD schema on all university pages' },
  { id: 16, desc: '4xx errors \u2014 31 broken links found internally', category: 'Crawlability', severity: 'P1', urls: 31, status: 'In Progress' as const, owner: 'SEO', suggestion: 'Audit internal links, fix or 301 redirect broken URLs' },
  { id: 17, desc: 'Images over 500KB not optimized \u2014 42 images', category: 'Performance', severity: 'P2', urls: 42, status: 'Open' as const, owner: 'Content', suggestion: 'Compress and convert to WebP format, implement responsive images with srcset' },
  { id: 18, desc: 'Missing hreflang tags for /study-in-uk/bengali variant', category: 'Crawlability', severity: 'P2', urls: 5, status: 'Open' as const, owner: 'Dev Team', suggestion: 'Add hreflang tags linking English and Bengali versions' },
  { id: 19, desc: 'FAQ schema not implemented on visa guide pages', category: 'Schema', severity: 'P2', urls: 12, status: 'Open' as const, owner: 'Dev Team', suggestion: 'Add FAQPage structured data to visa guide pages to gain rich snippets' },
  { id: 20, desc: 'Unused CSS \u2014 45KB of unminified styles loaded globally', category: 'Performance', severity: 'P2', urls: 1, status: 'Ignoring' as const, owner: 'Dev Team', suggestion: 'Tree-shake unused CSS, enable CSS minification in build pipeline' },
];

type CoreVitalStatus = 'good' | 'poor' | 'needs-improvement';

const coreWebVitals: Array<{ name: string; label: string; current: string; target: string; status: CoreVitalStatus; icon: React.ElementType; pct: number }> = [
  { name: 'LCP', label: 'Largest Contentful Paint', current: '4.2s', target: '< 2.5s', status: 'poor', icon: Zap, pct: 38 },
  { name: 'INP', label: 'Interaction to Next Paint', current: '180ms', target: '< 200ms', status: 'needs-improvement', icon: Shield, pct: 62 },
  { name: 'CLS', label: 'Cumulative Layout Shift', current: '0.18', target: '< 0.1', status: 'poor', icon: Smartphone, pct: 28 },
];

const sitemapData = {
  url: 'https://alo.com.bd/sitemap.xml',
  lastUpdated: '2025-01-15 09:30 AM',
  totalUrls: 342,
  status: 'Healthy',
  indexed: 298,
  notIndexed: 44,
  errors: ['3 URLs returning 404 in sitemap', '1 URL with incorrect lastmod date'],
};

const robotsData = {
  url: 'https://alo.com.bd/robots.txt',
  lastUpdated: '2024-12-01',
  rules: [
    { userAgent: '*', allow: ['/'], disallow: ['/api/', '/admin/', '/account/'] },
    { userAgent: 'Googlebot', allow: ['/'], disallow: ['/api/'] },
  ],
  sitemaps: ['https://alo.com.bd/sitemap.xml'],
  issues: ['Crawl-delay directive not supported by Google \u2014 consider removing', 'No reference to image sitemap'],
};

const sevBadge = (s: string) => {
  if (s === 'P0') return 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border';
  if (s === 'P1') return 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border';
  return 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)] border-[var(--alo-border)]';
};

const statusBadge = (s: string) => {
  if (s === 'Open') return 'bg-crm-danger-bg text-crm-danger-text';
  if (s === 'Fixed') return 'bg-crm-success-bg text-crm-success-text';
  if (s === 'In Progress') return 'bg-crm-warning-bg text-crm-warning-text';
  return 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]';
};

const vitalColor = (s: string) => {
  if (s === 'good') return 'bg-[var(--alo-success)]';
  if (s === 'needs-improvement') return 'bg-[var(--alo-warning)]';
  return 'bg-[var(--alo-error)]';
};

export default function CrmSeoTechnicalAudit() { return <SeoEvidencePanel mode="technical"/>; }

/** Historical design fixture, deliberately not rendered as operational evidence. */
function LegacyUnverifiedCrmSeoTechnicalAudit() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const overallScore = 72;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SEO Technical Audit</h1>
        <p className="text-muted-foreground mt-1">Technical health assessment for alo.com.bd</p>
      </div>

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="health">Health Score</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
          <TabsTrigger value="robots">Robots.txt</TabsTrigger>
          <TabsTrigger value="list">Issue List</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Overall Health Score</CardTitle><CardDescription>Composite score across 6 technical SEO dimensions.</CardDescription></CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <div className="relative">
                  <svg width="140" height="140" className="-rotate-90">
                    <circle cx="70" cy="70" r="54" stroke="currentColor" strokeWidth="10" fill="none" className="text-muted/30" />
                    <circle cx="70" cy="70" r="54" stroke="currentColor" strokeWidth="10" fill="none" className="text-crm-success-text" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{overallScore}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Needs improvement \u2014 focus on Performance &amp; Structured Data</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Score Breakdown</CardTitle><CardDescription>Individual category scores.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {healthBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                    <span className="w-32 text-sm font-medium truncate">{item.label}</span>
                    <Progress value={item.score} className="flex-1 h-2.5" />
                    <span className="text-sm font-semibold w-10 text-right">{item.score}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Issues by Severity</CardTitle><CardDescription>Distribution of technical issues across priority levels.</CardDescription></CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  {severitySummary.map((item) => (
                    <Card key={item.level} className={`${item.color} border`}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className={`rounded-full p-3 ${item.accent} text-white`}><item.icon className="h-6 w-6" /></div>
                        <div>
                          <p className="text-2xl font-bold">{item.count}</p>
                          <p className="text-sm font-medium">{item.level}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader><CardTitle>Technical SEO Issues</CardTitle><CardDescription>20 issues identified across 6 categories.</CardDescription></CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === issue.id ? null : issue.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedId === issue.id ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <Badge variant="outline" className={sevBadge(issue.severity)}>{issue.severity}</Badge>
                    <Badge variant="outline" className={statusBadge(issue.status)}>{issue.status}</Badge>
                    <span className="text-sm font-medium flex-1 truncate">{issue.desc}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{issue.urls} URL{issue.urls > 1 ? 's' : ''}</span>
                  </div>
                  {expandedId === issue.id && (
                    <div className="mt-3 ml-7 space-y-2 text-sm">
                      <div className="flex gap-6 text-muted-foreground">
                        <span>Category: <strong className="text-foreground">{issue.category}</strong></span>
                        <span>Owner: <strong className="text-foreground">{issue.owner}</strong></span>
                      </div>
                      <Separator />
                      <p className="text-muted-foreground"><span className="font-medium text-foreground">Fix Suggestion:</span> {issue.suggestion}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals">
          <Card>
            <CardHeader><CardTitle>Core Web Vitals Monitor</CardTitle><CardDescription>Real field data from Chrome UX Report (last 28 days).</CardDescription></CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-3">
                {coreWebVitals.map((v) => (
                  <Card key={v.name}>
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                      <div className={`rounded-full p-4 text-white ${vitalColor(v.status)}`}><v.icon className="h-8 w-8" /></div>
                      <div>
                        <h3 className="text-3xl font-bold">{v.current}</h3>
                        <p className="text-sm text-muted-foreground">{v.label}</p>
                      </div>
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground"><span>Score</span><span>{v.pct}%</span></div>
                        <Progress value={v.pct} className={`h-2.5 ${v.status === 'good' ? '[&>div]:bg-[var(--alo-success)]' : v.status === 'needs-improvement' ? '[&>div]:bg-[var(--alo-warning)]' : '[&>div]:bg-[var(--alo-error)]'}`} />
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">Target: <span className="font-semibold text-foreground">{v.target}</span></p>
                        <Badge variant="outline" className={v.status === 'good' ? 'bg-crm-success-bg text-crm-success-text' : v.status === 'needs-improvement' ? 'bg-crm-warning-bg text-crm-warning-text' : 'bg-crm-danger-bg text-crm-danger-text'}>{v.status.replace('-', ' ')}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap">
          <Card>
            <CardHeader><CardTitle>Sitemap Status</CardTitle><CardDescription>XML sitemap health and indexing status.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border p-4 text-center"><p className="text-2xl font-bold">{sitemapData.totalUrls}</p><p className="text-xs text-muted-foreground">Total URLs</p></div>
                <div className="rounded-lg border p-4 text-center"><p className="text-2xl font-bold text-crm-success-text">{sitemapData.indexed}</p><p className="text-xs text-muted-foreground">Indexed</p></div>
                <div className="rounded-lg border p-4 text-center"><p className="text-2xl font-bold text-crm-warning-text">{sitemapData.notIndexed}</p><p className="text-xs text-muted-foreground">Not Indexed</p></div>
                <div className="rounded-lg border p-4 text-center"><p className="text-sm font-bold text-crm-success-text flex items-center justify-center gap-1"><CheckCircle2 className="h-4 w-4" />{sitemapData.status}</p><p className="text-xs text-muted-foreground">Status</p></div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Sitemap URL</h4>
                <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">{sitemapData.url}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Last Updated</h4>
                <p className="text-sm text-muted-foreground">{sitemapData.lastUpdated}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Issues Found</h4>
                <ul className="space-y-1">
                  {sitemapData.errors.map((e, i) => (
                    <li key={i} className="text-sm text-crm-warning-text flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />{e}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="robots">
          <Card>
            <CardHeader><CardTitle>Robots.txt Status</CardTitle><CardDescription>Current robots.txt rules and issues.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">URL</h4>
                <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">{robotsData.url}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Last Updated</h4>
                <p className="text-sm text-muted-foreground">{robotsData.lastUpdated}</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Rules</h4>
                {robotsData.rules.map((rule, i) => (
                  <div key={i} className="rounded-lg border p-3 font-mono text-xs space-y-1">
                    <p><span className="text-crm-success-text font-semibold">User-agent:</span> {rule.userAgent}</p>
                    {rule.allow.map((a, j) => <p key={j}><span className="text-crm-success-text font-semibold">Allow:</span> {a}</p>)}
                    {rule.disallow.map((d, j) => <p key={j}><span className="text-crm-danger-text font-semibold">Disallow:</span> {d}</p>)}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Sitemaps Referenced</h4>
                {robotsData.sitemaps.map((s, i) => (
                  <p key={i} className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">{s}</p>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Issues</h4>
                <ul className="space-y-1">
                  {robotsData.issues.map((e, i) => (
                    <li key={i} className="text-sm text-crm-warning-text flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />{e}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader><CardTitle>Full Issue List</CardTitle><CardDescription>All 20 technical SEO issues with details.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="min-w-[300px]">Issue</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right">URLs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {issues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="text-sm">{issue.desc}</TableCell>
                        <TableCell><Badge variant="outline">{issue.category}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className={sevBadge(issue.severity)}>{issue.severity}</Badge></TableCell>
                        <TableCell className="text-right font-medium">{issue.urls}</TableCell>
                        <TableCell><Badge variant="outline" className={statusBadge(issue.status)}>{issue.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{issue.owner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
