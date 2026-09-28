'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText, Search, PenLine, CheckCircle2, Globe,
  Clock, User, ShieldCheck, AlertTriangle, ArrowRight,
  ChevronDown, ExternalLink, Eye, MoreHorizontal,
  ClipboardCheck, Gavel, BarChart3, RefreshCw, XCircle,
  ThumbsUp, Edit3, Send,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type Priority = 'P0' | 'P1' | 'P2';
type ContentType = 'Money Page' | 'Support' | 'Trust' | 'Cluster';
type KanbanStatus = 'TO DO' | 'DRAFT' | 'IN REVIEW' | 'PUBLISHED';
type ReviewRisk = 'High' | 'Medium' | 'Low';
type ReviewType = 'Immigration Fact-check' | 'SEO Review' | 'Compliance';

interface ContentCard {
  id: string;
  title: string;
  url: string;
  destination: string;
  wordCount: number;
  writer: string;
  reviewer: string;
  priority: Priority;
  contentType: ContentType;
  dueDate: string;
  approvalStatus: 'Pending' | 'Approved' | 'Changes Requested' | 'Rejected';
  status: KanbanStatus;
  targetKeyword: string;
  intent: string;
  lastUpdated: string;
}

interface ReviewItem {
  id: string;
  title: string;
  riskLevel: ReviewRisk;
  reviewer: string;
  reviewType: ReviewType;
  daysInReview: number;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const pipelineCards = [
  { label: 'Research', count: 12, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Search },
  { label: 'Draft', count: 8, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: PenLine },
  { label: 'In Review', count: 5, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: ClipboardCheck },
  { label: 'Approved', count: 3, color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
  { label: 'Published', count: 24, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Globe },
];

const contentItems: ContentCard[] = [
  { id: 'c1', title: 'Study in UK 2026: Admissions, Visas & Top Universities', url: '/study-in-uk', destination: 'UK', wordCount: 4200, writer: 'Priya Sharma', reviewer: 'Dr. Anil Mehta', priority: 'P0', contentType: 'Money Page', dueDate: '2026-01-15', approvalStatus: 'Pending', status: 'IN REVIEW', targetKeyword: 'study in uk 2026', intent: 'Informational', lastUpdated: '2025-12-28' },
  { id: 'c2', title: 'Study in USA 2026: F1 Visa & University Admissions', url: '/study-in-usa', destination: 'USA', wordCount: 3800, writer: 'Ravi Kumar', reviewer: 'Sarah Chen', priority: 'P0', contentType: 'Money Page', dueDate: '2026-01-18', approvalStatus: 'Pending', status: 'DRAFT', targetKeyword: 'study in usa 2026', intent: 'Informational', lastUpdated: '2025-12-27' },
  { id: 'c3', title: 'UK Student Visa Process & Requirements', url: '/uk/student-visa', destination: 'UK', wordCount: 5100, writer: 'Priya Sharma', reviewer: 'Dr. Anil Mehta', priority: 'P0', contentType: 'Money Page', dueDate: '2026-01-10', approvalStatus: 'Approved', status: 'PUBLISHED', targetKeyword: 'uk student visa requirements', intent: 'Transactional', lastUpdated: '2025-12-20' },
  { id: 'c4', title: 'Scholarships in USA for International Students', url: '/usa/scholarships', destination: 'USA', wordCount: 4600, writer: 'Amit Patel', reviewer: 'Sarah Chen', priority: 'P1', contentType: 'Support', dueDate: '2026-01-22', approvalStatus: 'Pending', status: 'DRAFT', targetKeyword: 'scholarships in usa international students', intent: 'Informational', lastUpdated: '2025-12-26' },
  { id: 'c5', title: 'Affordable Universities in the UK', url: '/uk/affordable-universities', destination: 'UK', wordCount: 3200, writer: 'Neha Gupta', reviewer: 'Dr. Anil Mehta', priority: 'P1', contentType: 'Cluster', dueDate: '2026-01-25', approvalStatus: 'Changes Requested', status: 'IN REVIEW', targetKeyword: 'affordable universities in uk', intent: 'Commercial', lastUpdated: '2025-12-25' },
  { id: 'c6', title: 'Canada Study Permit Requirements 2026', url: '/canada/study-permit', destination: 'Canada', wordCount: 4800, writer: 'Ravi Kumar', reviewer: 'Emily Zhang', priority: 'P0', contentType: 'Money Page', dueDate: '2026-01-12', approvalStatus: 'Pending', status: 'IN REVIEW', targetKeyword: 'canada study permit requirements', intent: 'Informational', lastUpdated: '2025-12-29' },
  { id: 'c7', title: 'Australia Student Visa Guide 2026', url: '/australia/student-visa', destination: 'Australia', wordCount: 0, writer: 'Amit Patel', reviewer: 'Emily Zhang', priority: 'P1', contentType: 'Money Page', dueDate: '2026-02-01', approvalStatus: 'Pending', status: 'TO DO', targetKeyword: 'australia student visa guide', intent: 'Informational', lastUpdated: '2025-12-15' },
  { id: 'c8', title: 'IELTS Requirements for UK Universities', url: '/uk/ielts-requirements', destination: 'UK', wordCount: 2800, writer: 'Neha Gupta', reviewer: 'Dr. Anil Mehta', priority: 'P2', contentType: 'Support', dueDate: '2026-01-30', approvalStatus: 'Pending', status: 'DRAFT', targetKeyword: 'ielts requirements uk universities', intent: 'Informational', lastUpdated: '2025-12-24' },
  { id: 'c9', title: 'Top MBA Programs in Canada 2026', url: '/canada/mba-programs', destination: 'Canada', wordCount: 3900, writer: 'Priya Sharma', reviewer: 'Emily Zhang', priority: 'P1', contentType: 'Cluster', dueDate: '2026-01-28', approvalStatus: 'Approved', status: 'PUBLISHED', targetKeyword: 'top mba programs canada', intent: 'Commercial', lastUpdated: '2025-12-18' },
  { id: 'c10', title: 'US Student Visa Interview Tips', url: '/usa/visa-interview-tips', destination: 'USA', wordCount: 0, writer: 'Ravi Kumar', reviewer: 'Sarah Chen', priority: 'P2', contentType: 'Support', dueDate: '2026-02-05', approvalStatus: 'Pending', status: 'TO DO', targetKeyword: 'us student visa interview tips', intent: 'Informational', lastUpdated: '2025-12-22' },
  { id: 'c11', title: 'Germany Tuition-Free Universities Guide', url: '/germany/tuition-free-universities', destination: 'Germany', wordCount: 3600, writer: 'Amit Patel', reviewer: 'Dr. Anil Mehta', priority: 'P1', contentType: 'Money Page', dueDate: '2026-02-03', approvalStatus: 'Pending', status: 'DRAFT', targetKeyword: 'tuition free universities germany', intent: 'Informational', lastUpdated: '2025-12-23' },
  { id: 'c12', title: 'UK Post-Study Work Visa (Graduate Route)', url: '/uk/post-study-work-visa', destination: 'UK', wordCount: 4100, writer: 'Neha Gupta', reviewer: 'Dr. Anil Mehta', priority: 'P0', contentType: 'Money Page', dueDate: '2026-01-20', approvalStatus: 'Approved', status: 'PUBLISHED', targetKeyword: 'uk post study work visa', intent: 'Informational', lastUpdated: '2025-12-16' },
  { id: 'c13', title: 'Cost of Studying in Australia 2026', url: '/australia/cost-of-studying', destination: 'Australia', wordCount: 0, writer: 'Priya Sharma', reviewer: 'Emily Zhang', priority: 'P1', contentType: 'Support', dueDate: '2026-02-08', approvalStatus: 'Pending', status: 'TO DO', targetKeyword: 'cost of studying in australia', intent: 'Informational', lastUpdated: '2025-12-21' },
  { id: 'c14', title: 'Canada Express Entry for International Students', url: '/canada/express-entry', destination: 'Canada', wordCount: 4500, writer: 'Ravi Kumar', reviewer: 'Emily Zhang', priority: 'P0', contentType: 'Money Page', dueDate: '2026-01-16', approvalStatus: 'Changes Requested', status: 'IN REVIEW', targetKeyword: 'canada express entry students', intent: 'Informational', lastUpdated: '2025-12-30' },
  { id: 'c15', title: 'UCAS Application Guide 2026', url: '/uk/ucas-application', destination: 'UK', wordCount: 3300, writer: 'Amit Patel', reviewer: 'Dr. Anil Mehta', priority: 'P1', contentType: 'Trust', dueDate: '2026-01-27', approvalStatus: 'Pending', status: 'DRAFT', targetKeyword: 'ucas application guide', intent: 'Informational', lastUpdated: '2025-12-26' },
  { id: 'c16', title: 'Student Accommodation in London: Complete Guide', url: '/uk/london-accommodation', destination: 'UK', wordCount: 0, writer: 'Neha Gupta', reviewer: 'Dr. Anil Mehta', priority: 'P2', contentType: 'Support', dueDate: '2026-02-10', approvalStatus: 'Pending', status: 'TO DO', targetKeyword: 'student accommodation london', intent: 'Commercial', lastUpdated: '2025-12-20' },
];

const reviewQueue: ReviewItem[] = [
  { id: 'r1', title: 'UK Student Visa Process & Requirements', riskLevel: 'High', reviewer: 'Dr. Anil Mehta', reviewType: 'Immigration Fact-check', daysInReview: 3 },
  { id: 'r2', title: 'Canada Study Permit Requirements 2026', riskLevel: 'High', reviewer: 'Emily Zhang', reviewType: 'Immigration Fact-check', daysInReview: 2 },
  { id: 'r3', title: 'Canada Express Entry for International Students', riskLevel: 'High', reviewer: 'Emily Zhang', reviewType: 'Compliance', daysInReview: 5 },
  { id: 'r4', title: 'Affordable Universities in the UK', riskLevel: 'Medium', reviewer: 'Dr. Anil Mehta', reviewType: 'SEO Review', daysInReview: 1 },
  { id: 'r5', title: 'Study in UK 2026: Admissions, Visas & Top Universities', riskLevel: 'High', reviewer: 'Dr. Anil Mehta', reviewType: 'Immigration Fact-check', daysInReview: 4 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const priorityColor: Record<Priority, string> = { P0: 'bg-red-500/10 text-red-600 border-red-500/20', P1: 'bg-amber-500/10 text-amber-600 border-amber-500/20', P2: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20' };
const contentTypeColor: Record<ContentType, string> = { 'Money Page': 'bg-violet-500/10 text-violet-600 border-violet-500/20', 'Support': 'bg-sky-500/10 text-sky-600 border-sky-500/20', 'Trust': 'bg-teal-500/10 text-teal-600 border-teal-500/20', 'Cluster': 'bg-pink-500/10 text-pink-600 border-pink-500/20' };
const riskColor: Record<ReviewRisk, string> = { High: 'bg-red-500/10 text-red-600 border-red-500/20', Medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20', Low: 'bg-green-500/10 text-green-600 border-green-500/20' };
const reviewTypeIcon: Record<ReviewType, React.ElementType> = { 'Immigration Fact-check': ShieldCheck, 'SEO Review': BarChart3, 'Compliance': Gavel };
const approvalColor: Record<string, string> = { Pending: 'bg-yellow-500/10 text-yellow-600', Approved: 'bg-green-500/10 text-green-600', 'Changes Requested': 'bg-orange-500/10 text-orange-600', Rejected: 'bg-red-500/10 text-red-600' };

const kanbanColumns: KanbanStatus[] = ['TO DO', 'DRAFT', 'IN REVIEW', 'PUBLISHED'];

const destinationColor = (d: string) => {
  const map: Record<string, string> = { UK: 'bg-blue-100 text-blue-700', USA: 'bg-red-100 text-red-700', Canada: 'bg-red-100 text-red-800', Australia: 'bg-amber-100 text-amber-700', Germany: 'bg-yellow-100 text-yellow-700' };
  return map[d] || 'bg-zinc-100 text-zinc-700';
};

// ── Sub-components ───────────────────────────────────────────────────────────

function PipelineOverview() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {pipelineCards.map((p) => (
        <Card key={p.label} className={`${p.color} border`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-white/60 dark:bg-black/20 p-2">
              <p.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{p.count}</p>
              <p className="text-xs mt-1 opacity-80">{p.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ContentKanbanCard({ item }: { item: ContentCard }) {
  return (
    <Card className="p-3 space-y-2 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug line-clamp-2">{item.title}</p>
        <button className="shrink-0 text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <ExternalLink className="h-3 w-3" />
        <span className="truncate">{item.url}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${destinationColor(item.destination)}`}>{item.destination}</Badge>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColor[item.priority]}`}>{item.priority}</Badge>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${contentTypeColor[item.contentType]}`}>{item.contentType}</Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{item.wordCount > 0 ? `${item.wordCount.toLocaleString()} words` : 'Not started'}</span>
        <span className={`text-[10px] px-1.5 py-0 rounded ${approvalColor[item.approvalStatus]}`}>{item.approvalStatus}</span>
      </div>
      <Separator className="my-1" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><User className="h-3 w-3" />{item.writer.split(' ')[0]}</span>
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.reviewer.split(' ')[0]}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.dueDate.slice(5)}</span>
      </div>
    </Card>
  );
}

function KanbanBoard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {kanbanColumns.map((col) => {
        const items = contentItems.filter((c) => c.status === col);
        return (
          <div key={col} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col === 'TO DO' ? 'bg-zinc-400' : col === 'DRAFT' ? 'bg-yellow-500' : col === 'IN REVIEW' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                <h3 className="text-sm font-semibold">{col}</h3>
              </div>
              <Badge variant="secondary" className="text-xs h-5 min-w-[24px] flex items-center justify-center">{items.length}</Badge>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {items.map((item) => (
                <ContentKanbanCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContentBacklog() {
  const [search, setSearch] = useState('');
  const filtered = contentItems.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.url.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search content by title or URL..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select defaultValue="all-status">
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {['All Status', 'Research', 'Draft', 'In Review', 'Approved', 'Published'].map((s) => (
              <SelectItem key={s} value={s.toLowerCase().replace(' ', '-')}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                {['Title', 'URL', 'Target Keyword', 'Intent', 'Priority', 'Status', 'Type', 'Words', 'Writer', 'Reviewer', 'Updated', 'Action'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-medium text-xs text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 max-w-[200px]"><span className="font-medium line-clamp-1 block">{c.title}</span></td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono whitespace-nowrap">{c.url}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[140px] truncate">{c.targetKeyword}</td>
                  <td className="px-3 py-2.5"><Badge variant="outline" className="text-[10px] px-1.5 py-0">{c.intent}</Badge></td>
                  <td className="px-3 py-2.5"><Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColor[c.priority]}`}>{c.priority}</Badge></td>
                  <td className="px-3 py-2.5"><Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${approvalColor[c.approvalStatus]}`}>{c.approvalStatus}</Badge></td>
                  <td className="px-3 py-2.5"><Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${contentTypeColor[c.contentType]}`}>{c.contentType}</Badge></td>
                  <td className="px-3 py-2.5 text-xs tabular-nums">{c.wordCount > 0 ? c.wordCount.toLocaleString() : '—'}</td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">{c.writer.split(' ')[0]}</td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">{c.reviewer.split(' ')[0]}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{c.lastUpdated}</td>
                  <td className="px-3 py-2.5">
                    <Button variant="ghost" size="sm" className="h-7 text-xs"><Eye className="h-3 w-3 mr-1" />View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReviewQueuePanel() {
  return (
    <div className="space-y-3">
      {reviewQueue.map((r) => {
        const Icon = reviewTypeIcon[r.reviewType];
        return (
          <Card key={r.id} className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${riskColor[r.riskLevel]}`}>{r.riskLevel} Risk</Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted"><Icon className="h-3 w-3 mr-1 inline" />{r.reviewType}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{r.reviewer}</span>
                  <span className={`flex items-center gap-1 ${r.daysInReview > 3 ? 'text-red-500' : ''}`}><Clock className="h-3 w-3" />{r.daysInReview} day{r.daysInReview > 1 ? 's' : ''} in review</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700"><ThumbsUp className="h-3 w-3 mr-1" />Approve</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs"><Edit3 className="h-3 w-3 mr-1" />Changes</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"><XCircle className="h-3 w-3 mr-1" />Reject</Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function SourceVerificationPanel() {
  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-600" />
        <h3 className="text-sm font-semibold">Source Verification Panel</h3>
      </div>
      <Separator />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Last Fact-Checked</p>
          <p className="text-sm font-medium">December 28, 2025</p>
          <p className="text-[11px] text-muted-foreground">by Dr. Anil Mehta · Immigration Expert</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Confidence Level</p>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10">High</Badge>
            <span className="text-xs text-muted-foreground">92% accuracy score</span>
          </div>
        </div>
      </div>
      <Separator />
      <div className="space-y-2.5">
        <p className="text-xs text-muted-foreground font-medium">Sources Used</p>
        <div className="flex flex-wrap gap-2">
          {['GOV.UK', 'Canada.ca', 'USCIS.gov', 'UCAS.com', 'IRCC Official', 'DFAT Australia'].map((s) => (
            <Badge key={s} variant="outline" className="text-xs px-2.5 py-1 gap-1.5 bg-emerald-500/5 text-emerald-700 border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />{s}
            </Badge>
          ))}
        </div>
      </div>
      <Separator />\n      <div className="space-y-2.5">
        <p className="text-xs text-muted-foreground font-medium">Reviewer Requirement</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { role: 'Immigration Expert', icon: ShieldCheck, desc: 'Required for visa & permit content', needed: true },
            { role: 'SEO Specialist', icon: BarChart3, desc: 'Required for Money Pages', needed: true },
            { role: 'Legal Review', icon: Gavel, desc: 'Required for compliance content', needed: false },
          ].map((r) => (
            <div key={r.role} className={`rounded-lg border p-3 ${r.needed ? 'border-amber-500/30 bg-amber-500/5' : 'border-muted'}`}>
              <div className="flex items-center gap-2 mb-1">
                <r.icon className={`h-4 w-4 ${r.needed ? 'text-amber-600' : 'text-muted-foreground'}`} />
                <p className="text-xs font-semibold">{r.role}</p>
                {r.needed && <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto text-amber-600 border-amber-500/30">Required</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <Separator />
      <div className="flex items-center gap-3">
        <Button size="sm" className="text-xs"><RefreshCw className="h-3 w-3 mr-1" />Re-verify Sources</Button>
        <Button size="sm" variant="outline" className="text-xs"><Send className="h-3 w-3 mr-1" />Request Expert Review</Button>
      </div>
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CrmSeoContentWorkflow() {
  const [activeTab, setActiveTab] = useState('kanban');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">SEO Content Production & Workflow</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage content pipeline, reviews, and publishing for ALO Education's SEO program.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search content..." className="w-[200px] h-9 text-sm" />
          <Button size="sm"><FileText className="h-4 w-4 mr-1.5" />New Content</Button>
        </div>
      </div>

      {/* Pipeline Overview */}
      <section aria-label="Content Pipeline Overview">
        <PipelineOverview />
      </section>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="kanban" className="text-xs sm:text-sm"><FileText className="h-4 w-4 mr-1.5 hidden sm:inline" />Kanban Board</TabsTrigger>
          <TabsTrigger value="backlog" className="text-xs sm:text-sm"><Search className="h-4 w-4 mr-1.5 hidden sm:inline" />Content Backlog</TabsTrigger>
          <TabsTrigger value="review" className="text-xs sm:text-sm"><ClipboardCheck className="h-4 w-4 mr-1.5 hidden sm:inline" />Review Queue</TabsTrigger>
          <TabsTrigger value="sources" className="text-xs sm:text-sm"><ShieldCheck className="h-4 w-4 mr-1.5 hidden sm:inline" />Source Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Content Kanban Board</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>16 items</span>
              <Separator orientation="vertical" className="h-4" />
              <Select defaultValue="all-types">
                <SelectTrigger className="w-[140px] h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-types">All Types</SelectItem>
                  <SelectItem value="money-page">Money Page</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="trust">Trust</SelectItem>
                  <SelectItem value="cluster">Cluster</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <KanbanBoard />
        </TabsContent>

        <TabsContent value="backlog" className="mt-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-1">Content Backlog — 30 Money Pages</h2>
            <p className="text-xs text-muted-foreground">Showing {contentItems.length} of 30 seed content items in the production pipeline.</p>
          </div>
          <ContentBacklog />
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-1">Review Queue</h2>
            <p className="text-xs text-muted-foreground">Content items awaiting expert review. Immigration content requires fact-check by a certified immigration expert.</p>
          </div>
          <ReviewQueuePanel />
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <SourceVerificationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
