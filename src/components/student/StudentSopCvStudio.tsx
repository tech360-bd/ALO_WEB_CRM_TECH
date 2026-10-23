'use client';

import React, { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FileText,
  Plus,
  Sparkles,
  Download,
  Clock,
  Send,
  ChevronDown,
  ChevronRight,
  History,
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  Globe,
  Trophy,
  Users,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  PenLine,
  Eye,
  LayoutTemplate,
  X,
} from 'lucide-react';

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

type SopStatus = 'Draft' | 'Needs Review' | 'Approved' | 'Submitted';
type CvSection = 'personal' | 'education' | 'experience' | 'skills' | 'languages' | 'achievements' | 'references';

interface SopDraft {
  id: string;
  title: string;
  university: string;
  course: string;
  status: SopStatus;
  lastModified: string;
  version: number;
  content: string;
  wordCount: number;
}

interface CvDraft {
  id: string;
  title: string;
  lastModified: string;
  sections: Record<CvSection, { expanded: boolean; content: string }>;
}

/* ================================================================== */
/*  MOCK DATA                                                          */
/* ================================================================== */

const MOCK_SOP_DRAFTS: SopDraft[] = [
  {
    id: 'sop-1',
    title: 'SOP - Aberdeen MSc IB',
    university: 'University of Aberdeen',
    course: 'MSc International Business',
    status: 'Needs Review',
    lastModified: 'Jul 12, 2025 at 3:45 PM',
    version: 3,
    content: `Growing up in a family deeply rooted in international trade, I developed an early fascination with how businesses operate across borders. My father's import-export business in Karachi exposed me to the complexities of supply chains, currency fluctuations, and cultural nuances in global commerce. This upbringing planted the seed for my ambition to pursue a career in international business.

During my undergraduate studies in Business Administration at the Institute of Business Administration (IBA), Karachi, I consistently ranked among the top 10% of my cohort. My coursework in International Marketing, Strategic Management, and Cross-Cultural Communication provided me with a strong theoretical foundation. However, I recognised that to truly excel in the global business arena, I needed a more advanced understanding of international trade policies, global supply chain management, and cross-border investment strategies.

My internship at Unilever Pakistan's Supply Chain department was a transformative experience. Working on a project to optimise distribution networks for rural markets, I gained firsthand insight into the challenges of operating in diverse market environments. This experience solidified my desire to specialise in international business at a postgraduate level.

The MSc International Business programme at the University of Aberdeen stands out to me for several reasons. The curriculum's emphasis on emerging markets aligns perfectly with my career aspiration to work in South Asian trade development. Additionally, the opportunity to engage with the Centre for Global Finance at Aberdeen Business School would provide invaluable exposure to cutting-edge research in international finance.

Upon completing this programme, I intend to return to Pakistan and work with a multinational corporation or trade development agency, leveraging my expertise to facilitate stronger trade relationships between South Asia and Europe. In the long term, I aspire to establish a consultancy that helps SMEs navigate international expansion.`,
    wordCount: 278,
  },
  {
    id: 'sop-2',
    title: 'SOP - Manchester MSc Marketing',
    university: 'University of Manchester',
    course: 'MSc Marketing',
    status: 'Draft',
    lastModified: 'Jul 10, 2025 at 11:20 AM',
    version: 1,
    content: `My interest in marketing was sparked during my final year project at IBA, where I conducted a comprehensive analysis of digital marketing strategies employed by e-commerce startups in Pakistan. This research revealed significant gaps in how local businesses approach customer acquisition and brand building in the digital age.

I believe the MSc Marketing programme at the University of Manchester's Alliance Manchester Business School will equip me with the advanced analytical tools and strategic frameworks needed to drive marketing innovation in emerging markets. The programme's focus on data-driven marketing and consumer behaviour is particularly appealing...`,
    wordCount: 89,
  },
];

const MOCK_CV_DRAFTS: CvDraft[] = [
  {
    id: 'cv-1',
    title: 'My CV - Ahmed Hassan',
    lastModified: 'Jul 11, 2025 at 5:30 PM',
    sections: {
      personal: {
        expanded: true,
        content: `Ahmed Hassan\nKarachi, Pakistan\n+92 300 1234567\nahmed.hassan@email.com\nLinkedIn: linkedin.com/in/ahmedhassan`,
      },
      education: {
        expanded: true,
        content: `BBA (Hons) - Institute of Business Administration (IBA), Karachi\nGraduated: June 2025 | CGPA: 3.7/4.0\nRelevant Coursework: International Marketing, Strategic Management, Financial Accounting, Business Statistics`,
      },
      experience: {
        expanded: true,
        content: `Supply Chain Intern - Unilever Pakistan (Jan 2025 - May 2025)
• Optimised distribution network for rural Sindh markets
• Reduced logistics costs by 12% through route analysis
• Collaborated with cross-functional teams across 3 departments

Marketing Intern - Foodpanda Pakistan (Jun 2024 - Aug 2024)
• Assisted in launching 5 restaurant partnership campaigns
• Conducted competitor analysis for market entry strategies`,
      },
      skills: {
        expanded: false,
        content: `Data Analysis, Strategic Planning, Digital Marketing, Supply Chain Management, Cross-Cultural Communication, Financial Modeling, Microsoft Excel, Tableau, SPSS, Python (Basic)`,
      },
      languages: {
        expanded: false,
        content: `English (IELTS 7.0 - Fluent)\nUrdu (Native)\nArabic (Basic)`,
      },
      achievements: {
        expanded: false,
        content: `Dean's List - All semesters (2021-2025)\n1st Place - IBA Business Plan Competition 2024\nMember - IBA Entrepreneurship Society\nVolunteer - Teach for Pakistan (2023)`,
      },
      references: {
        expanded: false,
        content: `Available upon request`,
      },
    },
  },
];

const CV_TEMPLATES = [
  { id: 'classic', name: 'Classic', color: 'bg-[var(--alo-brand)]', preview: 'Traditional professional layout' },
  { id: 'modern', name: 'Modern', color: 'bg-slate-900', preview: 'Clean minimalist design' },
  { id: 'creative', name: 'Creative', color: 'bg-[var(--alo-cta-hover)]', preview: 'Bold with accent colors' },
];

const CV_SECTION_CONFIG: { key: CvSection; label: string; icon: React.ElementType }[] = [
  { key: 'personal', label: 'Personal Information', icon: User },
  { key: 'education', label: 'Education History', icon: GraduationCap },
  { key: 'experience', label: 'Work Experience', icon: Briefcase },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'languages', label: 'Languages', icon: Globe },
  { key: 'achievements', label: 'Achievements', icon: Trophy },
  { key: 'references', label: 'References', icon: Users },
];

/* ================================================================== */
/*  STATUS BADGE                                                       */
/* ================================================================== */

function StatusBadge({ status }: { status: SopStatus }) {
  const config: Record<SopStatus, { className: string }> = {
    Draft: { className: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]' },
    'Needs Review': { className: 'bg-amber-100 text-amber-700' },
    Approved: { className: 'bg-emerald-100 text-emerald-700' },
    Submitted: { className: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]' },
  };
  return (
    <Badge variant="secondary" className={cn('text-[11px] px-2 py-0.5', config[status].className)}>
      {status}
    </Badge>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                      */
/* ================================================================== */

export default function StudentSopCvStudio() {
  const { setView, token } = usePortalStore();
  const [activeTab, setActiveTab] = useState<'sop' | 'cv'>('sop');
  const [activeSopId, setActiveSopId] = useState('sop-1');
  const [activeCvId, setActiveCvId] = useState('cv-1');
  const [sopEditorContent, setSopEditorContent] = useState(
    MOCK_SOP_DRAFTS.find((s) => s.id === 'sop-1')?.content || ''
  );
  const [sopTitle, setSopTitle] = useState(
    MOCK_SOP_DRAFTS.find((s) => s.id === 'sop-1')?.title || ''
  );
  const [apiSop, setApiSop] = useState<SopDraft[] | null>(null)
  const [apiCv, setApiCv] = useState<CvDraft[] | null>(null)
  useEffect(() => { if (!token) return; fetch('/api/student-portal/sop', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(j => { if (j.success && j.data && j.data.length > 0) setApiSop(j.data); }).catch(() => {}); fetch('/api/student-portal/cv', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(j => { if (j.success && j.data && j.data.length > 0) setApiCv(j.data); }).catch(() => {}); }, [token]);
  const sopDrafts = (apiSop && apiSop.length > 0) ? apiSop : MOCK_SOP_DRAFTS;
  const cvDrafts = (apiCv && apiCv.length > 0) ? apiCv : MOCK_CV_DRAFTS;

  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [cvSections, setCvSections] = useState(
    MOCK_CV_DRAFTS[0].sections
  );

  const activeSop = sopDrafts.find((s: any) => s.id === activeSopId);
  const wordCount = sopEditorContent.trim().split(/\s+/).filter(Boolean).length;

  const toggleCvSection = (key: CvSection) => {
    setCvSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], expanded: !prev[key].expanded },
    }));
  };

  const updateCvSection = (key: CvSection, content: string) => {
    setCvSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], content },
    }));
  };

  const handleAiGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setSopEditorContent(MOCK_SOP_DRAFTS.find((s) => s.id === 'sop-1')?.content || '');
      setIsGenerating(false);
      setShowAiPanel(false);
    }, 2500);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Page header */}
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-bold text-[var(--alo-text)]">SOP & CV Studio</h1>
        <p className="text-sm text-[var(--alo-text-muted)] mt-1">
          Write, refine, and manage your Statements of Purpose and CVs
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sop' | 'cv')} className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 bg-[var(--alo-surface-muted)] h-10 p-0.5">
          <TabsTrigger
            value="sop"
            className="h-9 rounded-md data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm text-sm font-medium gap-2"
          >
            <FileText className="w-4 h-4" />
            SOP Writer
          </TabsTrigger>
          <TabsTrigger
            value="cv"
            className="h-9 rounded-md data-[state=active]:bg-white data-[state=active]:text-[var(--alo-brand)] data-[state=active]:shadow-sm text-sm font-medium gap-2"
          >
            <LayoutTemplate className="w-4 h-4" />
            CV Builder
          </TabsTrigger>
        </TabsList>

        {/* ============ SOP WRITER TAB ============ */}
        <TabsContent value="sop" className="flex-1 mt-4 min-h-0">
          <div className="flex gap-4 h-[calc(100vh-16rem)]">
            {/* Left panel: SOP list */}
            <div className="w-1/3 min-w-[260px] max-w-[340px] shrink-0 flex flex-col">
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="mb-3 bg-[var(--alo-cta-hover)] hover:bg-orange-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New SOP
              </Button>

              <ScrollArea className="flex-1 -mx-1">
                <div className="space-y-2 px-1">
                  {sopDrafts.map((sop: any) => (
                    <button
                      key={sop.id}
                      onClick={() => {
                        setActiveSopId(sop.id);
                        setSopEditorContent(sop.content);
                        setSopTitle(sop.title);
                      }}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-all',
                        activeSopId === sop.id
                          ? 'border-[var(--alo-border)] bg-[var(--alo-brand-pale)] shadow-sm'
                          : 'border-[var(--alo-border)] bg-white hover:border-[var(--alo-border-strong)] hover:shadow-sm'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm font-medium truncate',
                              activeSopId === sop.id ? 'text-[var(--alo-brand-deep)]' : 'text-[var(--alo-text)]'
                            )}
                          >
                            {sop.title}
                          </p>
                          <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">{sop.university}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <StatusBadge status={sop.status} />
                            <span className="text-[11px] text-[var(--alo-text-muted)]">v{sop.version}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--alo-text-muted)]">
                        <Clock className="w-3 h-3" />
                        {sop.lastModified}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right panel: Editor */}
            <div className="flex-1 flex flex-col min-w-0">
              {activeSop ? (
                <>
                  {/* Document meta */}
                  <div className="shrink-0 mb-3 space-y-3">
                    <Input
                      value={sopTitle}
                      onChange={(e) => setSopTitle(e.target.value)}
                      className="text-lg font-semibold text-[var(--alo-text)] border-0 border-b border-[var(--alo-border)] rounded-none px-0 focus-visible:ring-0 h-auto pb-2"
                      placeholder="Document title"
                    />
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-[var(--alo-text-muted)]">
                        <GraduationCap className="w-4 h-4" />
                        <span className="font-medium text-[var(--alo-body)]">{activeSop.university}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--alo-text-muted)]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{activeSop.course}</span>
                      </div>
                      <StatusBadge status={activeSop.status} />
                    </div>
                  </div>

                  {/* Editor area */}
                  <div className="flex-1 min-h-0 relative">
                    <Textarea
                      value={sopEditorContent}
                      onChange={(e) => setSopEditorContent(e.target.value)}
                      className="w-full h-full text-sm leading-relaxed resize-none border-[var(--alo-border)] rounded-lg bg-white p-4 custom-scrollbar"
                      placeholder="Start writing your Statement of Purpose..."
                    />

                    {/* Word count bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-[var(--alo-border)] px-4 py-2 flex items-center justify-between rounded-b-lg">
                      <div className="flex items-center gap-4 text-xs text-[var(--alo-text-muted)]">
                        <span>
                          {wordCount} word{wordCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[var(--alo-placeholder)]">|</span>
                        <span>
                          {sopEditorContent.length} character{sopEditorContent.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[var(--alo-placeholder)]">|</span>
                        <span className={cn(wordCount < 200 ? 'text-amber-600' : 'text-[var(--alo-text-muted)]')}>
                          Target: 500–1000 words
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--alo-text-muted)]">Auto-saved</span>
                    </div>
                  </div>

                  {/* Right sidebar: Actions */}
                  <div className="shrink-0 mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => setShowAiPanel(!showAiPanel)}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      AI Suggestions
                    </Button>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                      variant="outline"
                      size="sm"
                      className="border-[var(--alo-border)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Request Review
                    </Button>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                      variant="outline"
                      size="sm"
                      className="border-[var(--alo-border)] text-[var(--alo-body)] hover:bg-[var(--alo-page)]"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--alo-text-muted)]"
                      onClick={() => setShowVersionHistory(!showVersionHistory)}
                    >
                      <History className="w-3.5 h-3.5 mr-1.5" />
                      History
                    </Button>
                  </div>

                  {/* AI Panel */}
                  {showAiPanel && (
                    <Card className="mt-3 border-purple-200 bg-purple-50/30">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-semibold text-[var(--alo-text)]">AI SOP Assistant</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-[var(--alo-text-muted)]"
                            onClick={() => setShowAiPanel(false)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <p className="text-xs text-[var(--alo-body)] leading-relaxed">
                          AI will use your verified profile data, education history, and course requirements to create a personalized draft.
                        </p>

                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5">
                          <p className="text-[11px] text-amber-800 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            Review and personalize before submission. AI-generated content must be edited by you.
                          </p>
                        </div>

                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={handleAiGenerate}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating Draft...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate SOP Draft
                            </>
                          )}
                        </Button>

                        <p className="text-[11px] text-[var(--alo-text-muted)] text-center">
                          ✨ This draft is based on your authentic profile data.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Version History */}
                  {showVersionHistory && (
                    <Card className="mt-3 border-[var(--alo-border)]">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-semibold text-[var(--alo-text)] flex items-center gap-2">
                          <History className="w-4 h-4 text-[var(--alo-brand)]" />
                          Version History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--alo-brand-pale)] border border-[var(--alo-border)]">
                            <span className="text-xs font-bold text-[var(--alo-brand)] bg-[var(--alo-brand-pale)] px-1.5 py-0.5 rounded">v3</span>
                            <div className="flex-1">
                              <p className="text-xs text-[var(--alo-body)]">Current version</p>
                              <p className="text-[11px] text-[var(--alo-text-muted)]">Jul 12, 2025 at 3:45 PM — by Ahmed Hassan</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--alo-page)]">
                            <span className="text-xs font-medium text-[var(--alo-text-muted)] bg-[var(--alo-surface-muted)] px-1.5 py-0.5 rounded">v2</span>
                            <div className="flex-1">
                              <p className="text-xs text-[var(--alo-body)]">Added internship experience section</p>
                              <p className="text-[11px] text-[var(--alo-text-muted)]">Jul 10, 2025 at 2:30 PM — by Ahmed Hassan</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--alo-page)]">
                            <span className="text-xs font-medium text-[var(--alo-text-muted)] bg-[var(--alo-surface-muted)] px-1.5 py-0.5 rounded">v1</span>
                            <div className="flex-1">
                              <p className="text-xs text-[var(--alo-body)]">Initial draft created</p>
                              <p className="text-[11px] text-[var(--alo-text-muted)]">Jul 8, 2025 at 11:00 AM — AI Generated</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-[var(--alo-placeholder)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--alo-text-muted)]">Select or create an SOP to start writing</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============ CV BUILDER TAB ============ */}
        <TabsContent value="cv" className="flex-1 mt-4 min-h-0">
          <div className="flex gap-4 h-[calc(100vh-16rem)]">
            {/* Left panel: CV list + Templates */}
            <div className="w-1/3 min-w-[260px] max-w-[340px] shrink-0 flex flex-col">
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="mb-3 bg-[var(--alo-cta-hover)] hover:bg-orange-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New CV
              </Button>

              {/* CV list */}
              <ScrollArea className="flex-1 -mx-1">
                <div className="space-y-2 px-1">
                  {cvDrafts.map((cv: any) => (
                    <button
                      key={cv.id}
                      onClick={() => setActiveCvId(cv.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-all',
                        activeCvId === cv.id
                          ? 'border-[var(--alo-border)] bg-[var(--alo-brand-pale)] shadow-sm'
                          : 'border-[var(--alo-border)] bg-white hover:border-[var(--alo-border-strong)] hover:shadow-sm'
                      )}
                    >
                      <p
                        className={cn(
                          'text-sm font-medium',
                          activeCvId === cv.id ? 'text-[var(--alo-brand-deep)]' : 'text-[var(--alo-text)]'
                        )}
                      >
                        {cv.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--alo-text-muted)]">
                        <Clock className="w-3 h-3" />
                        {cv.lastModified}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* Template selection */}
              <Separator className="my-3" />
              <div>
                <p className="text-xs font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider mb-2 px-1">
                  Templates
                </p>
                <div className="flex gap-2 px-1">
                  {CV_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={cn(
                        'flex-1 p-2 rounded-lg border text-center transition-all',
                        selectedTemplate === t.id
                          ? 'border-blue-300 bg-[var(--alo-brand-pale)] shadow-sm'
                          : 'border-[var(--alo-border)] bg-white hover:border-[var(--alo-border-strong)]'
                      )}
                    >
                      <div
                        className={cn(
                          'w-full h-10 rounded-md mb-1.5 flex items-center justify-center',
                          t.color
                        )}
                      >
                        <FileText className="w-4 h-4 text-white/80" />
                      </div>
                      <p className="text-[11px] font-medium text-[var(--alo-body)]">{t.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right panel: CV Editor */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* CV Title + Actions */}
              <div className="shrink-0 mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--alo-text)]">{cvDrafts[0].title}</h2>
                  <p className="text-xs text-[var(--alo-text-muted)]">Last modified: {cvDrafts[0].lastModified}</p>
                </div>
                <div className="flex gap-2">
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                    variant="outline"
                    size="sm"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    AI Improve CV
                  </Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                    variant="outline"
                    size="sm"
                    className="border-[var(--alo-border)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Preview
                  </Button>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                    size="sm"
                    className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download PDF
                  </Button>
                </div>
              </div>

              {/* CV Sections */}
              <ScrollArea className="flex-1 -mx-1">
                <div className="space-y-3 px-1">
                  {CV_SECTION_CONFIG.map(({ key, label, icon: Icon }) => {
                    const section = cvSections[key];
                    return (
                      <Collapsible
                        key={key}
                        open={section.expanded}
                        onOpenChange={() => toggleCvSection(key)}
                      >
                        <Card className={cn('border-[var(--alo-border)]', section.expanded && 'shadow-sm')}>
                          <CollapsibleTrigger className="w-full">
                            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-[var(--alo-page)] transition-colors rounded-t-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-[var(--alo-brand)]" />
                                  <CardTitle className="text-sm font-semibold text-[var(--alo-text)]">
                                    {label}
                                  </CardTitle>
                                  {key === 'personal' && (
                                    <Badge variant="secondary" className="text-[11px] bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] px-1.5">
                                      Pre-filled
                                    </Badge>
                                  )}
                                  {(key === 'education' || key === 'experience') && (
                                    <Badge variant="secondary" className="text-[11px] bg-emerald-50 text-emerald-600 px-1.5">
                                      From profile
                                    </Badge>
                                  )}
                                </div>
                                <ChevronDown
                                  className={cn(
                                    'w-4 h-4 text-[var(--alo-text-muted)] transition-transform',
                                    !section.expanded && '-rotate-90'
                                  )}
                                />
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="px-4 pb-4 pt-0">
                              {key === 'skills' ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={section.content}
                                    onChange={(e) => updateCvSection(key, e.target.value)}
                                    className="min-h-[80px] text-sm resize-none border-[var(--alo-border)]"
                                    rows={3}
                                  />
                                  <div className="flex flex-wrap gap-1.5">
                                    {section.content.split(',').map((skill, idx) => {
                                      const trimmed = skill.trim();
                                      if (!trimmed) return null;
                                      return (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 text-xs bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border border-[var(--alo-border)] rounded-full px-2.5 py-1"
                                        >
                                          {trimmed}
                                          <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="text-blue-400 hover:text-[var(--alo-brand)]">
                                            <X className="w-3 h-3" />
                                          </button>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <Textarea
                                  value={section.content}
                                  onChange={(e) => updateCvSection(key, e.target.value)}
                                  className="min-h-[100px] text-sm resize-none border-[var(--alo-border)]"
                                  rows={
                                    key === 'personal' ? 3
                                      : key === 'education' ? 3
                                        : key === 'experience' ? 6
                                          : key === 'achievements' ? 4
                                            : 2
                                  }
                                />
                              )}
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}