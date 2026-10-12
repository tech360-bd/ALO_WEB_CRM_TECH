'use client';

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
import {
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Search,
  FileText,
  Globe,
  TrendingUp,
  Link2,
} from 'lucide-react';

const matrixData = [
  { name: 'ALO', indexed: 342, traffic: '12.4K', destPages: 18, uniPages: 45, courseTools: true, scholarshipTools: true, aiTools: true, leadForms: true, gbpStrength: 78, reviews: 342, blogFreq: 'Weekly', lastUpdated: '2025-01-15' },
  { name: 'IDP Bangladesh', indexed: 1200, traffic: '45.2K', destPages: 32, uniPages: 120, courseTools: true, scholarshipTools: false, aiTools: false, leadForms: true, gbpStrength: 92, reviews: 1200, blogFreq: 'Daily', lastUpdated: '2025-01-18' },
  { name: 'Shabuj Global', indexed: 280, traffic: '8.1K', destPages: 14, uniPages: 32, courseTools: false, scholarshipTools: true, aiTools: false, leadForms: true, gbpStrength: 65, reviews: 210, blogFreq: 'Bi-weekly', lastUpdated: '2025-01-10' },
  { name: 'MACES', indexed: 190, traffic: '5.6K', destPages: 10, uniPages: 28, courseTools: false, scholarshipTools: false, aiTools: false, leadForms: true, gbpStrength: 58, reviews: 145, blogFreq: 'Monthly', lastUpdated: '2024-12-20' },
  { name: "Mentors'", indexed: 410, traffic: '15.8K', destPages: 22, uniPages: 55, courseTools: true, scholarshipTools: true, aiTools: false, leadForms: true, gbpStrength: 82, reviews: 480, blogFreq: 'Weekly', lastUpdated: '2025-01-14' },
  { name: 'TCL Global', indexed: 320, traffic: '10.2K', destPages: 16, uniPages: 40, courseTools: false, scholarshipTools: false, aiTools: false, leadForms: true, gbpStrength: 71, reviews: 290, blogFreq: 'Weekly', lastUpdated: '2025-01-12' },
  { name: 'GoStudy', indexed: 150, traffic: '3.4K', destPages: 8, uniPages: 20, courseTools: false, scholarshipTools: false, aiTools: false, leadForms: false, gbpStrength: 42, reviews: 85, blogFreq: 'Monthly', lastUpdated: '2024-11-30' },
  { name: 'GSC Global Solutions', indexed: 220, traffic: '6.8K', destPages: 12, uniPages: 35, courseTools: false, scholarshipTools: true, aiTools: false, leadForms: true, gbpStrength: 55, reviews: 170, blogFreq: 'Bi-weekly', lastUpdated: '2025-01-08' },
  { name: 'Eduvisors', indexed: 260, traffic: '7.5K', destPages: 15, uniPages: 38, courseTools: true, scholarshipTools: false, aiTools: false, leadForms: true, gbpStrength: 62, reviews: 200, blogFreq: 'Weekly', lastUpdated: '2025-01-11' },
];

const keywordOverlap = [
  { competitor: 'IDP Bangladesh', aloOnly: 87, shared: 234, compOnly: 520 },
  { competitor: "Mentors'", aloOnly: 120, shared: 186, compOnly: 210 },
  { competitor: 'Shabuj Global', aloOnly: 145, shared: 98, compOnly: 62 },
  { competitor: 'TCL Global', aloOnly: 168, shared: 112, compOnly: 85 },
  { competitor: 'GSC Global Solutions', aloOnly: 155, shared: 88, compOnly: 72 },
  { competitor: 'Eduvisors', aloOnly: 170, shared: 95, compOnly: 90 },
  { competitor: 'MACES', aloOnly: 195, shared: 65, compOnly: 48 },
  { competitor: 'GoStudy', aloOnly: 210, shared: 42, compOnly: 30 },
];

const pageGapData = [
  { type: 'Destination Page (UK)', idp: true, shabuj: true, maces: false, mentors: true, tcl: true, gostudy: false, gsc: true, eduvisors: true, aloStatus: 'Have' as const, priority: 'Low' as const },
  { type: 'Destination Page (Canada)', idp: true, shabuj: true, maces: true, mentors: true, tcl: true, gostudy: false, gsc: true, eduvisors: true, aloStatus: 'Have' as const, priority: 'Low' as const },
  { type: 'Destination Page (Germany)', idp: true, shabuj: false, maces: false, mentors: true, tcl: false, gostudy: false, gsc: false, eduvisors: false, aloStatus: 'Missing' as const, priority: 'High' as const },
  { type: 'Destination Page (Japan)', idp: true, shabuj: false, maces: false, mentors: false, tcl: false, gostudy: false, gsc: false, eduvisors: false, aloStatus: 'In Progress' as const, priority: 'High' as const },
  { type: 'Visa Guide (UK)', idp: true, shabuj: true, maces: true, mentors: true, tcl: true, gostudy: false, gsc: true, eduvisors: true, aloStatus: 'Have' as const, priority: 'Low' as const },
  { type: 'Visa Guide (Australia)', idp: true, shabuj: false, maces: false, mentors: true, tcl: false, gostudy: false, gsc: false, eduvisors: true, aloStatus: 'Missing' as const, priority: 'Medium' as const },
  { type: 'Scholarship Search Tool', idp: false, shabuj: true, maces: false, mentors: true, tcl: false, gostudy: false, gsc: true, eduvisors: false, aloStatus: 'Have' as const, priority: 'Low' as const },
  { type: 'Course Matcher / Finder', idp: true, shabuj: false, maces: false, mentors: true, tcl: false, gostudy: false, gsc: false, eduvisors: true, aloStatus: 'Have' as const, priority: 'Low' as const },
  { type: 'University Comparison Tool', idp: true, shabuj: false, maces: false, mentors: false, tcl: false, gostudy: false, gsc: false, eduvisors: false, aloStatus: 'Missing' as const, priority: 'High' as const },
  { type: 'Cost of Living Calculator', idp: true, shabuj: true, maces: false, mentors: true, tcl: false, gostudy: false, gsc: false, eduvisors: false, aloStatus: 'In Progress' as const, priority: 'Medium' as const },
  { type: 'IELTS Prep Hub', idp: true, shabuj: false, maces: false, mentors: false, tcl: false, gostudy: false, gsc: false, eduvisors: false, aloStatus: 'Missing' as const, priority: 'Medium' as const },
  { type: 'Student Visa Checklist', idp: true, shabuj: true, maces: true, mentors: true, tcl: true, gostudy: true, gsc: true, eduvisors: true, aloStatus: 'Have' as const, priority: 'Low' as const },
];

const opportunities = [
  { keyword: 'study in Germany from Bangladesh', monthlyVol: '2,400', diff: 38, currentTop: 'IDP, Shabuj', aloRank: 15, potential: 'Top 5' },
  { keyword: 'cheapest universities in UK for Bangladeshi students', monthlyVol: '1,800', diff: 32, currentTop: 'IDP', aloRank: 22, potential: 'Top 3' },
  { keyword: 'Canada student visa requirements Bangladesh 2025', monthlyVol: '3,100', diff: 42, currentTop: 'IDP, Mentors', aloRank: 18, potential: 'Top 5' },
  { keyword: 'scholarship for Bangladeshi students in Australia', monthlyVol: '1,500', diff: 35, currentTop: 'Shabuj', aloRank: 12, potential: 'Top 3' },
  { keyword: 'IELTS requirement for UK universities', monthlyVol: '4,200', diff: 55, currentTop: 'IDP, GoStudy', aloRank: 28, potential: 'Top 10' },
  { keyword: 'study in Japan from Bangladesh', monthlyVol: '1,200', diff: 25, currentTop: 'IDP', aloRank: 8, potential: 'Top 3' },
  { keyword: 'MSc in Data Science UK for international students', monthlyVol: '2,800', diff: 48, currentTop: 'IDP, Eduvisors', aloRank: 20, potential: 'Top 5' },
  { keyword: 'Bangladeshi student life in Melbourne', monthlyVol: '880', diff: 22, currentTop: 'None', aloRank: '-', potential: 'Top 1' },
  { keyword: 'how to apply for Germany student visa from Bangladesh', monthlyVol: '1,900', diff: 30, currentTop: 'IDP', aloRank: 14, potential: 'Top 3' },
  { keyword: 'part time jobs for international students in UK', monthlyVol: '5,600', diff: 60, currentTop: 'IDP, Mentors', aloRank: 35, potential: 'Top 15' },
];

const backlinkData = [
  { name: 'ALO', total: 2840, referring: 320, edu: 45, gov: 2, DR: 38 },
  { name: 'IDP Bangladesh', total: 18500, referring: 2400, edu: 280, gov: 15, DR: 62 },
  { name: 'Shabuj Global', total: 1200, referring: 180, edu: 12, gov: 0, DR: 30 },
  { name: 'MACES', total: 680, referring: 95, edu: 8, gov: 1, DR: 25 },
  { name: "Mentors'", total: 4500, referring: 520, edu: 65, gov: 3, DR: 45 },
  { name: 'TCL Global', total: 2100, referring: 280, edu: 30, gov: 1, DR: 35 },
  { name: 'GoStudy', total: 420, referring: 60, edu: 4, gov: 0, DR: 20 },
  { name: 'GSC Global Solutions', total: 980, referring: 130, edu: 15, gov: 0, DR: 28 },
  { name: 'Eduvisors', total: 1800, referring: 210, edu: 22, gov: 1, DR: 33 },
];

const statusColor = (s: string) => {
  if (s === 'Have') return 'bg-emerald-100 text-emerald-800';
  if (s === 'Missing') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
};

const priorityColor = (p: string) => {
  if (p === 'High') return 'bg-red-100 text-red-800';
  if (p === 'Medium') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
};

function CheckIcon({ val }: { val: boolean }) {
  return val ? (
    <span className="text-emerald-600 font-semibold text-sm">&#10003;</span>
  ) : (
    <span className="text-slate-300 text-sm">&#8212;</span>
  );
}

export default function CrmSeoCompetitorAnalysis() {
 return <section className="space-y-4 rounded-xl border bg-white p-6"><h1 className="text-2xl font-bold">SEO Competitor Analysis</h1><p role="status">No authenticated competitor or backlink data source is connected here. Historical mock competitor rankings are not displayed as facts.</p><a href="/crm/seo-manager" className="text-blue-700 underline">Open existing SEO draft and approval workbench</a><p className="text-sm">Live provider and production workflows remain unverified.</p></section>;
}
/** Historical design fixture; not an operational dashboard. */
function LegacyUnverifiedCrmSeoCompetitorAnalysis() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SEO Competitor Analysis</h1>
        <p className="text-muted-foreground mt-1">Compare ALO against 8 key competitors across SEO dimensions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">#3</p><p className="text-xs text-muted-foreground">ALO Traffic Rank</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">3 / 8</p><p className="text-xs text-muted-foreground">Unique AI Tools Lead</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">4</p><p className="text-xs text-muted-foreground">Missing Content Types</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">10</p><p className="text-xs text-muted-foreground">Quick-Win Keywords</p></CardContent></Card>
      </div>

      <Tabs defaultValue="matrix" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="matrix">Competitor Matrix</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Overlap</TabsTrigger>
          <TabsTrigger value="pagegap">Page Gap</TabsTrigger>
          <TabsTrigger value="opportunities">Win Opportunities</TabsTrigger>
          <TabsTrigger value="backlinks">Backlink Gap</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader><CardTitle>Competitor Feature Matrix</CardTitle><CardDescription>Side-by-side SEO and content feature comparison.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[140px]">Competitor</TableHead>
                    <TableHead className="text-right">Indexed</TableHead>
                    <TableHead className="text-right">Est. Traffic</TableHead>
                    <TableHead className="text-right">Dest. Pages</TableHead>
                    <TableHead className="text-right">Uni. Pages</TableHead>
                    <TableHead className="text-center">Course</TableHead>
                    <TableHead className="text-center">Scholarship</TableHead>
                    <TableHead className="text-center">AI Tools</TableHead>
                    <TableHead className="text-center">Lead Forms</TableHead>
                    <TableHead className="text-right">GBP Str.</TableHead>
                    <TableHead className="text-right">Reviews</TableHead>
                    <TableHead className="text-right">Blog Freq.</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {matrixData.map((row) => (
                      <TableRow key={row.name} className={row.name === 'ALO' ? 'bg-emerald-50 font-semibold' : ''}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">{row.indexed}</TableCell>
                        <TableCell className="text-right">{row.traffic}</TableCell>
                        <TableCell className="text-right">{row.destPages}</TableCell>
                        <TableCell className="text-right">{row.uniPages}</TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.courseTools} /></TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.scholarshipTools} /></TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.aiTools} /></TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.leadForms} /></TableCell>
                        <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Progress value={row.gbpStrength} className="w-16 h-2" />{row.gbpStrength}</div></TableCell>
                        <TableCell className="text-right">{row.reviews}</TableCell>
                        <TableCell className="text-right text-xs">{row.blogFreq}</TableCell>
                        <TableCell className="text-right text-xs">{row.lastUpdated}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords">
          <Card>
            <CardHeader><CardTitle>Keyword Overlap Analysis</CardTitle><CardDescription>Venn-style keyword sharing between ALO and each competitor.</CardDescription></CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {keywordOverlap.map((row) => {
                const total = row.aloOnly + row.shared + row.compOnly;
                const aloPct = Math.round((row.aloOnly / total) * 100);
                const sharedPct = Math.round((row.shared / total) * 100);
                const compPct = Math.round((row.compOnly / total) * 100);
                return (
                  <div key={row.competitor} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between font-medium">
                      <span className="flex items-center gap-2"><Target className="h-4 w-4" />{row.competitor}</span>
                      <span className="text-sm text-muted-foreground">{total} total keywords</span>
                    </div>
                    <div className="flex h-7 w-full rounded-full overflow-hidden bg-muted text-xs">
                      <div className="bg-emerald-500 flex items-center justify-center text-white font-medium" style={{ width: `${aloPct}%` }}>{row.aloOnly}</div>
                      <div className="bg-amber-500 flex items-center justify-center text-white font-medium" style={{ width: `${sharedPct}%` }}>{row.shared}</div>
                      <div className="bg-rose-400 flex items-center justify-center text-white font-medium" style={{ width: `${compPct}%` }}>{row.compOnly}</div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />ALO Only ({row.aloOnly})</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500" />Shared ({row.shared})</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-400" />{row.competitor} Only ({row.compOnly})</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <div className="mt-4 rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center justify-between font-medium text-sm">
                <span>Summary: ALO has the most unique keyword coverage vs smaller competitors, but significant overlap opportunity with IDP & Mentors.</span>
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800">+145 avg unique keywords</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pagegap">
          <Card>
            <CardHeader><CardTitle>Page Gap Analysis</CardTitle><CardDescription>Content types competitors have vs ALO status.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="min-w-[200px]">Content Type</TableHead>
                    <TableHead className="text-center">IDP</TableHead>
                    <TableHead className="text-center">Shabuj</TableHead>
                    <TableHead className="text-center">MACES</TableHead>
                    <TableHead className="text-center">Mentors</TableHead>
                    <TableHead className="text-center">TCL</TableHead>
                    <TableHead className="text-center">GoStudy</TableHead>
                    <TableHead className="text-center">GSC</TableHead>
                    <TableHead className="text-center">Eduvisors</TableHead>
                    <TableHead className="text-center">ALO Status</TableHead>
                    <TableHead className="text-center">Priority</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {pageGapData.map((row) => (
                      <TableRow key={row.type}>
                        <TableCell className="font-medium">{row.type}</TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.idp} /></TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.shabuj} /></TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.maces} /></TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.mentors} /></TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.tcl} /></TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.gostudy} /></TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.gsc} /></TableCell>
                        <TableCell className="text-center"><CheckIcon val={row.eduvisors} /></TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className={statusColor(row.aloStatus)}>{row.aloStatus}</Badge></TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className={priorityColor(row.priority)}>{row.priority}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between font-medium text-sm">
                  <span>ALO is missing 4 high-priority content types. Creating Germany & Japan destination pages and a University Comparison Tool would close the biggest gaps.</span>
                  <Badge variant="outline" className="bg-red-100 text-red-800">4 Missing (High)</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-600" />ALO Can Win Here</CardTitle><CardDescription>Realistic keyword opportunities where ALO can gain top positions.</CardDescription></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
                {opportunities.map((opp, i) => (
                  <div key={i} className="rounded-xl border p-4 space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm leading-tight">{opp.keyword}</h4>
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 shrink-0">{opp.potential}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Search className="h-3 w-3" />{opp.monthlyVol}/mo</div>
                      <div className="flex items-center gap-1"><Target className="h-3 w-3" />KD {opp.diff}</div>
                      <div className="flex items-center gap-1"><Globe className="h-3 w-3" />Current: {opp.currentTop}</div>
                      <div className="flex items-center gap-1"><FileText className="h-3 w-3" />ALO #{opp.aloRank}</div>
                    </div>
                    <Progress value={100 - opp.diff} className="h-2" />
                    <p className="text-xs text-muted-foreground">Est. effort: {opp.diff < 30 ? '2-3 weeks' : opp.diff < 50 ? '4-6 weeks' : '8-12 weeks'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backlinks">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Backlink Gap Analysis</CardTitle><CardDescription>Estimated backlink profiles comparison.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="min-w-[160px]">Domain</TableHead>
                    <TableHead className="text-right">Total Links</TableHead>
                    <TableHead className="text-right">Referring Domains</TableHead>
                    <TableHead className="text-right">.edu Links</TableHead>
                    <TableHead className="text-right">.gov Links</TableHead>
                    <TableHead className="text-right">Domain Rating</TableHead>
                    <TableHead className="text-right">vs ALO</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {backlinkData.map((row) => {
                      const diff = row.name === 'ALO' ? 0 : row.total - 2840;
                      return (
                        <TableRow key={row.name} className={row.name === 'ALO' ? 'bg-emerald-50 font-semibold' : ''}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-right">{row.total.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{row.referring.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{row.edu}</TableCell>
                          <TableCell className="text-right">{row.gov}</TableCell>
                          <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Progress value={row.DR} className="w-16 h-2" />{row.DR}</div></TableCell>
                          <TableCell className="text-right">
                            {row.name === 'ALO' ? (
                              <span className="text-muted-foreground">&#8212;</span>
                            ) : diff > 0 ? (
                              <span className="flex items-center justify-end gap-1 text-rose-600"><ArrowUpRight className="h-3.5 w-3.5" />+{diff.toLocaleString()}</span>
                            ) : (
                              <span className="flex items-center justify-end gap-1 text-emerald-600"><ArrowDownRight className="h-3.5 w-3.5" />{diff.toLocaleString()}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <div className="mt-4 rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center justify-between font-medium text-sm">
                <span>ALO needs ~5,400 more referring domains to match Mentors, and ~15,600 to match IDP. Focus on .edu and local BD directories for quick wins.</span>
                <Badge variant="outline" className="bg-amber-100 text-amber-800">Gap: -2,080 domains</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
