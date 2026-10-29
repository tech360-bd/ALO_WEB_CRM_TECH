"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatCard,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  MiniBar,
  PageHeader,
  Progress,
} from "@/components/alo/shared";
import { fmtDate, timeAgo, type ViewKey } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

// ---------------------------------------------------------------------------
// Design reference — English Test Dashboard Card System
// Background: WHITE | Border: ALO BLUE | Title: ALO ORANGE | Button: ALO ORANGE
// Every section uses clear image/video quality as specified in content guidelines.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MockTest = {
  testId: string;
  studentId?: string | null;
  testType: string;
  isFree: boolean;
  status: string;
  overallScore: number | null;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  weakAreas: string | null;
  completedAt: string | null;
  createdAt: string;
  student?: { studentId: string; fullName: string } | null;
};

type ApiResponse = { mockTests: MockTest[] };

const FREE_QUOTA_STUDENT = 3;

const TEST_TYPES: {
  slug: string;
  name: string;
  modules: string;
  freeInfo: string;
  icon: string;
  accent: string;
}[] = [
  { slug: "ielts", name: "IELTS", modules: "Listening · Reading · Writing · Speaking", freeInfo: "3 free for ALO students, 1 for guests", icon: "BookOpen", accent: "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]" },
  { slug: "pte", name: "PTE Academic", modules: "Speaking & Writing · Reading · Listening", freeInfo: "3 free for ALO students, 1 for guests", icon: "Mic", accent: "bg-violet-50 text-violet-600" },
  { slug: "toefl", name: "TOEFL", modules: "Reading · Listening · Speaking · Writing", freeInfo: "3 free for ALO students, 1 for guests", icon: "Headphones", accent: "bg-emerald-50 text-emerald-600" },
  { slug: "duolingo", name: "Duolingo (DET)", modules: "Literacy · Comprehension · Conversation · Production", freeInfo: "3 free for ALO students, 1 for guests", icon: "Sparkles", accent: "bg-amber-50 text-amber-600" },
  { slug: "ellt", name: "ELLT / OIETC", modules: "Reading · Listening · Writing · Speaking", freeInfo: "3 free for ALO students, 1 for guests", icon: "Languages", accent: "bg-rose-50 text-rose-600" },
  { slug: "gre", name: "GRE", modules: "Verbal · Quantitative · Analytical Writing", freeInfo: "3 free for ALO students, 1 for guests", icon: "Calculator", accent: "bg-sky-50 text-sky-600" },
  { slug: "gmat", name: "GMAT", modules: "Quantitative · Verbal · Integrated Reasoning · Writing", freeInfo: "3 free for ALO students, 1 for guests", icon: "Network", accent: "bg-teal-50 text-teal-600" },
  { slug: "sat", name: "SAT", modules: "Reading & Writing · Math (digital, adaptive)", freeInfo: "3 free for ALO students, 1 for guests", icon: "PenLine", accent: "bg-indigo-50 text-indigo-600" },
  { slug: "act", name: "ACT", modules: "English · Math · Reading · Science · Writing (optional)", freeInfo: "3 free for ALO students, 1 for guests", icon: "FlaskConical", accent: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]" },
  { slug: "placement-test", name: "Placement Test", modules: "Reading · Listening · Writing · Speaking (diagnostic)", freeInfo: "1 free for all students", icon: "Compass", accent: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]" },
];

const TEST_TYPE_INFO: Record<string, { countries: string; requirement: string; description: string }> = {
  IELTS: {
    countries: "UK, Australia, Canada, New Zealand, USA, Ireland",
    requirement: "6.0–7.5 depending on course (UKVI variant for UK visas)",
    description: "The world’s most popular English proficiency test. Accepted by 11,000+ institutions across 140+ countries.",
  },
  PTE: {
    countries: "Australia, New Zealand, UK, Canada, USA",
    requirement: "50–79 depending on course",
    description: "Computer-based test with results in 24–48 hours. Fully automated scoring, no examiner bias.",
  },
  TOEFL: {
    countries: "USA, Canada, UK, Australia",
    requirement: "79–100+ depending on course",
    description: "Preferred by US universities. Measures academic English in reading, listening, speaking, and writing.",
  },
  "DET / Duolingo": {
    countries: "USA, UK, Canada, Australia (increasingly accepted)",
    requirement: "100–130 depending on course",
    description: "Affordable, online, on-demand test accepted by 5,000+ institutions globally.",
  },
  "OIETC / ELLT": {
    countries: "UK (many universities), Ireland",
    requirement: "B2 level equivalent (IELTS 6.0–6.5)",
    description: "Online English test accepted by a growing number of UK universities as an IELTS alternative.",
  },
  GRE: {
    countries: "USA, Canada, UK (postgraduate)",
    requirement: "Verbal 155+, Quant 165+ for top programmes",
    description: "Required for many US Masters and PhD programmes. Tests verbal reasoning, quantitative reasoning, and analytical writing.",
  },
  GMAT: {
    countries: "USA, UK, Europe, Asia (MBA programmes)",
    requirement: "650+ for top business schools",
    description: "Required for many global MBA programmes. Tests quantitative, verbal, integrated reasoning, and analytical writing.",
  },
  SAT: {
    countries: "USA (undergraduate), some Asia/Europe",
    requirement: "1200+ for competitive US universities",
    description: "Standardised test for US undergraduate admissions. Now fully digital and adaptive.",
  },
  ACT: {
    countries: "USA (undergraduate)",
    requirement: "27+ for competitive US universities",
    description: "Alternative to SAT for US undergraduate admissions, with a science reasoning section.",
  },
  "Placement Test": {
    countries: "Diagnostic — recommends the right test for you",
    requirement: "No prior requirement",
    description: "ALO’s free diagnostic test that maps your CEFR level to IELTS, PTE, TOEFL, and Duolingo equivalents and recommends the best test for your goal.",
  },
};

const TEST_BADGE_COLORS: Record<string, string> = {
  IELTS: "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]",
  "IELTS UKVI": "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]",
  PTE: "bg-violet-100 text-violet-700",
  TOEFL: "bg-emerald-100 text-emerald-700",
  "DET / Duolingo": "bg-amber-100 text-amber-700",
  "OIETC / ELLT": "bg-rose-100 text-rose-700",
  GRE: "bg-sky-100 text-sky-700",
  GMAT: "bg-teal-100 text-teal-700",
  SAT: "bg-indigo-100 text-indigo-700",
  ACT: "bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]",
  "Placement Test": "bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score?: number | null): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 7) return "text-emerald-600";
  if (score >= 6) return "text-amber-600";
  return "text-rose-600";
}

function parseWeakAreas(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === "string" && x.length > 0);
    }
  } catch {
    // ignore
  }
  return [];
}

function navigateToExam(slug: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("alo-navigate", { detail: { view: "public-exam" as ViewKey, slug } }));
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EnglishTestDashboard() {
  const { toast } = useToast();
  const [mockTests, setMockTests] = React.useState<MockTest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("results");

  // Improvement plan checklist state
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mock-tests", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ApiResponse;
      setMockTests(Array.isArray(data.mockTests) ? data.mockTests : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again later.";
      toast({
        title: "Couldn’t load mock tests",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Stats
  const completedTests = mockTests.filter((m) => m.status === "COMPLETED" && m.overallScore != null);
  const avgScore =
    completedTests.length > 0
      ? (completedTests.reduce((s, m) => s + (m.overallScore || 0), 0) / completedTests.length).toFixed(1)
      : "—";
  const freeMocksUsed = mockTests.filter((m) => m.isFree).length;
  const freeMocksRemaining = Math.max(0, FREE_QUOTA_STUDENT - freeMocksUsed);
  const bestScore =
    completedTests.length > 0
      ? Math.max(...completedTests.map((m) => m.overallScore || 0)).toFixed(1)
      : "—";

  // Weak areas aggregation
  const weakAreaCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    mockTests.forEach((m) => {
      parseWeakAreas(m.weakAreas).forEach((a) => {
        counts[a] = (counts[a] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [mockTests]);
  const maxWeakCount = weakAreaCounts[0]?.[1] || 1;
  const uniqueWeakAreas = weakAreaCounts.length;

  // Study plan checklist (built from top weak areas)
  const studyPlan = React.useMemo(() => {
    return weakAreaCounts.slice(0, 5).map(([area, count]) => ({
      id: area.toLowerCase().replace(/\s+/g, "-"),
      area,
      count,
      task: studyTaskFor(area),
    }));
  }, [weakAreaCounts]);

  function studyTaskFor(area: string): string {
    const a = area.toLowerCase();
    if (a.includes("writing")) return "Complete 2 Writing Task 2 essays this week and submit for AI review";
    if (a.includes("speaking")) return "Practice 3 Speaking Part 2 cue cards with AI feedback";
    if (a.includes("listening")) return "Do 4 listening section practices (focus on maps & multiple choice)";
    if (a.includes("reading")) return "Practice true/false/not-given and matching headings daily";
    if (a.includes("grammar")) return "Complete 1 grammar workbook chapter + 50 mixed exercises";
    if (a.includes("vocab")) return "Learn 30 academic words daily, review with flashcards";
    if (a.includes("pronunciation")) return "Record 5 short speech samples and compare with model audio";
    if (a.includes("fluency")) return "Practice 10-minute impromptu speaking on random topics";
    return `Schedule 2 focused practice sessions on ${area} this week`;
  }

  const toggleChecklist = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Handlers
  const handleStartMock = (testName: string, freeRemaining: number) => {
    if (freeRemaining <= 0) {
      toast({
        title: "Free quota reached",
        description: `You’ve used all ${FREE_QUOTA_STUDENT} free mocks. Additional mocks cost BDT 600 each. Visit finance to add credit.`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Mock test starting...",
      description: `${testName} mock exam UI opens next — timer, audio player, question navigator, writing editor, microphone recording, autosave, and AI scoring all active.`,
    });
  };

  const handleViewDetail = (m: MockTest) => {
    toast({
      title: "Opening detailed report",
      description: `Full report for ${m.testType} mock (${m.testId}) — section scores, weak-area analysis, audio playback, and PDF download will open in a new panel.`,
    });
  };

  const handleSpeakingPractice = () => {
    toast({
      title: "AI Speaking Practice starting",
      description: "Cue card prompts will appear next. Record your response — AI evaluates fluency, pronunciation, lexical resource, and coherence in real time.",
    });
  };

  const handleWritingReview = () => {
    toast({
      title: "AI Writing Review",
      description: "Writing editor opens next. Submit Task 1 / Task 2 — AI returns scores on task response, coherence, lexical resource, and grammar with line-by-line feedback.",
    });
  };

  const handleLearnMore = (slug: string, name: string) => {
    navigateToExam(slug);
    toast({
      title: `Opening ${name} guide`,
      description: "Loading the public exam guide with modules, free quota, exam experience, AI scoring, and FAQs.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="English Test Portal"
        icon="Languages"
        subtitle="Your English test practice hub — mock tests, scores, and improvement plans."
      />

      {/* Free mock policy banner */}
      <Card className="rounded-2xl border-2 border-[var(--alo-cta)]/30 bg-[var(--alo-cta-soft)]/40">
        <CardContent className="flex items-start gap-3 pt-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-cta)] text-white">
            <Icon name="Gift" className="size-5" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-[var(--alo-cta)]">Free Mock Test Policy</p>
            <p className="mt-1 text-foreground/80">
              ALO registered students get <strong>3 free full mock tests</strong>. Guests get <strong>1 free mock</strong>.
              After the free limit, payment is required. Admins can add mock credits (audit-logged).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      {loading ? (
        <LoadingGrid count={5} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            label="Mock Tests Taken"
            value={mockTests.length}
            icon="ClipboardList"
            accent="blue"
            hint="All test records"
          />
          <StatCard
            label="Average Score"
            value={avgScore}
            icon="TrendingUp"
            accent="violet"
            hint="Across completed tests"
          />
          <StatCard
            label="Free Mocks Left"
            value={freeMocksRemaining}
            icon="Gift"
            accent="orange"
            hint={`of ${FREE_QUOTA_STUDENT} free quota`}
          />
          <StatCard
            label="Best Score"
            value={bestScore}
            icon="Trophy"
            accent="emerald"
            hint="Your highest overall"
          />
          <StatCard
            label="Weak Areas"
            value={uniqueWeakAreas}
            icon="Target"
            accent="rose"
            hint="Distinct weaknesses flagged"
          />
        </div>
      )}

      {/* AI practice cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-gradient-to-br from-[var(--alo-brand-light)]/60 to-white">
          <CardContent className="flex items-start gap-4 pt-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-alo-gradient text-white alo-shadow">
              <Icon name="Mic" className="size-6" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-[var(--alo-brand)]">AI Speaking Practice</p>
              <p className="mt-1 text-sm text-foreground/80">
                Practice speaking with AI — get instant feedback on fluency, pronunciation, and coherence. Cue cards,
                Part 1/2/3 prompts, and recorded playback.
              </p>
              <Button
 className="mt-3 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
 onClick={handleSpeakingPractice}
 >
                <Icon name="Mic" className="size-4" />
                Start Speaking Practice
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-2 border-[var(--alo-cta)]/25 bg-gradient-to-br from-[var(--alo-cta-soft)]/50 to-white">
          <CardContent className="flex items-start gap-4 pt-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--alo-cta)] text-white">
              <Icon name="PenLine" className="size-6" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-[var(--alo-cta)]">AI Writing Review</p>
              <p className="mt-1 text-sm text-foreground/80">
                Submit your writing task for AI feedback on structure, grammar, and vocabulary. Task 1 / Task 2 with
                band-score estimate and line-by-line comments.
              </p>
              <Button
 className="mt-3 bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90"
 onClick={handleWritingReview}
 >
                <Icon name="Send" className="size-4" />
                Submit Writing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="results" className="gap-1.5">
            <Icon name="History" className="size-4" />
            My Results
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-1.5">
            <Icon name="Plus" className="size-4" />
            Take New Test
          </TabsTrigger>
          <TabsTrigger value="improve" className="gap-1.5">
            <Icon name="Target" className="size-4" />
            Improvement Plan
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-1.5">
            <Icon name="Library" className="size-4" />
            Test Types
          </TabsTrigger>
        </TabsList>

        {/* My Results */}
        <TabsContent value="results" className="mt-4">
          {loading ? (
            <LoadingGrid count={4} />
          ) : mockTests.length === 0 ? (
            <EmptyState
              icon="History"
              title="No mock tests yet"
              description="Take your first mock test from the “Take New Test” tab. ALO students get 3 free mocks to start."
              action={
                <Button className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta)]/90 text-black h-12" onClick={() => setTab("new")}>
                  <Icon name="Plus" className="size-4" />
                  Take New Test
                </Button>
              }
            />
          ) : (
            <SectionCard
              title="Mock Test Results"
              description="All your completed and pending mock tests"
              icon="ListChecks"
              action={
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                  <Icon name="RefreshCw" className={cn("size-4", loading && "animate-spin")} />
                  Refresh
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Type</TableHead>
                      <TableHead className="text-center">Overall</TableHead>
                      <TableHead className="hidden text-center md:table-cell">L</TableHead>
                      <TableHead className="hidden text-center md:table-cell">R</TableHead>
                      <TableHead className="hidden text-center md:table-cell">W</TableHead>
                      <TableHead className="hidden text-center md:table-cell">S</TableHead>
                      <TableHead className="hidden lg:table-cell">Weak Areas</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTests.map((m) => {
                      const areas = parseWeakAreas(m.weakAreas);
                      return (
                        <TableRow key={m.testId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={cn("hover:opacity-90", TEST_BADGE_COLORS[m.testType] || "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]")}>
                                {m.testType}
                              </Badge>
                              {m.isFree && (
                                <Badge variant="outline" className="border-[var(--alo-cta)]/30 text-[var(--alo-cta)]">
                                  <Icon name="Gift" className="mr-1 size-2.5" />
                                  Free
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn("text-lg font-bold tabular-nums", scoreColor(m.overallScore))}>
                              {m.overallScore != null ? m.overallScore.toFixed(1) : "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden text-center tabular-nums md:table-cell">
                            <span className={cn("font-semibold", scoreColor(m.listeningScore))}>
                              {m.listeningScore?.toFixed(1) ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden text-center tabular-nums md:table-cell">
                            <span className={cn("font-semibold", scoreColor(m.readingScore))}>
                              {m.readingScore?.toFixed(1) ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden text-center tabular-nums md:table-cell">
                            <span className={cn("font-semibold", scoreColor(m.writingScore))}>
                              {m.writingScore?.toFixed(1) ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden text-center tabular-nums md:table-cell">
                            <span className={cn("font-semibold", scoreColor(m.speakingScore))}>
                              {m.speakingScore?.toFixed(1) ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex max-w-[260px] flex-wrap gap-1">
                              {areas.length === 0 ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : (
                                areas.slice(0, 3).map((a) => (
                                  <Badge key={a} variant="outline" className="border-rose-200 text-rose-700 text-[11px]">
                                    {a}
                                  </Badge>
                                ))
                              )}
                              {areas.length > 3 && (
                                <span className="text-[11px] text-muted-foreground">+{areas.length - 3}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                            <span title={fmtDate(m.completedAt || m.createdAt)}>
                              {timeAgo(m.completedAt || m.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={m.status} colorMap={STATUS_COLORS} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetail(m)}>
                              <Icon name="Eye" className="size-3.5" />
                              <span className="hidden sm:inline">View Detail</span>
                              <span className="sm:hidden">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          )}
        </TabsContent>

        {/* Take New Test */}
        <TabsContent value="new" className="mt-4">
          <SectionCard
            title="Choose Your Mock Test"
            description="Pick a test type below to launch the exam UI"
            icon="PlayCircle"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEST_TYPES.map((t) => (
                <Card key={t.slug} className="flex flex-col rounded-2xl border-2 border-[var(--alo-brand)]/15 transition-all hover:border-[var(--alo-brand)]/40 hover:shadow-lg">
                  <CardContent className="flex flex-1 flex-col pt-5">
                    <div className="flex items-start gap-3">
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", t.accent)}>
                        <Icon name={t.icon} className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[var(--alo-brand)]">{t.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{t.freeInfo}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                      Modules: <span className="font-medium text-foreground">{t.modules}</span>
                    </p>
                    <div className="mt-auto pt-4">
                      <Button
 className=" w-full bg-[var(--alo-cta)] hover:bg-[var(--alo-cta)]/90 text-black"
 onClick={() => handleStartMock(t.name, freeMocksRemaining)}
                      >
                        <Icon name="Play" className="size-4" />
                        Start Mock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-[var(--alo-brand)]/15 bg-[var(--alo-brand-light)]/40 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--alo-brand)]">
                <Icon name="Info" className="size-4" />
                What to expect in the exam UI
              </p>
              <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-xs text-foreground/80 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: "Timer", label: "Section timer with auto-submit" },
                  { icon: "Headphones", label: "Audio player for listening" },
                  { icon: "Map", label: "Question navigator grid" },
                  { icon: "PenLine", label: "Writing editor with word count" },
                  { icon: "Mic", label: "Microphone recording for speaking" },
                  { icon: "Save", label: "Autosave every 10 seconds" },
                  { icon: "Sparkles", label: "AI scoring on completion" },
                  { icon: "FileText", label: "PDF report with weak areas" },
                  { icon: "ShieldCheck", label: "Audit-logged attempts" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2">
                    <Icon name={f.icon} className="size-3.5 text-[var(--alo-brand)]" />
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Improvement Plan */}
        <TabsContent value="improve" className="mt-4">
          {loading ? (
            <LoadingGrid count={4} />
          ) : mockTests.length === 0 || weakAreaCounts.length === 0 ? (
            <EmptyState
              icon="Target"
              title="No improvement data yet"
              description="Take a few mock tests first — your weak areas will be aggregated here with AI recommendations and a personalised study plan."
              action={
                <Button className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta)]/90 text-black h-12" onClick={() => setTab("new")}>
                  <Icon name="Plus" className="size-4" />
                  Take a Mock Test
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {/* Weak area frequency chart */}
              <SectionCard
                title="Weak Area Frequency"
                description="Aggregated across all your mock tests — focus on the tallest bars first"
                icon="BarChart3"
              >
                <div className="space-y-3">
                  {weakAreaCounts.map(([area, count]) => (
                    <div key={area} className="grid grid-cols-1 gap-2 sm:grid-cols-[180px_1fr_40px] sm:items-center">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Icon name="AlertTriangle" className="size-3.5 text-rose-500" />
                        <span className="truncate">{area}</span>
                      </div>
                      <MiniBar value={count} max={maxWeakCount} color="#E8501A" />
                      <div className="text-right text-xs font-semibold tabular-nums text-muted-foreground">
                        {count}× {count === 1 ? "test" : "tests"}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* AI recommendations */}
              <Card className="overflow-hidden rounded-2xl border-2 border-[var(--alo-brand)]/25 bg-gradient-to-br from-[var(--alo-brand-light)]/60 to-white">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-alo-gradient text-white alo-shadow">
                      <Icon name="Sparkles" className="size-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-[var(--alo-brand)]">AI Recommendation</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                        Based on your last {mockTests.length} mock{mockTests.length > 1 ? "s" : ""}, your biggest gaps
                        are <strong>{weakAreaCounts.slice(0, 3).map(([a]) => a).join(", ")}</strong>. Focus on{" "}
                        <strong>Writing Task 2 structure</strong> and <strong>Speaking Part 3 fluency</strong>. Schedule{" "}
                        <strong>2 practice sessions this week</strong> — one focused writing sprint and one timed
                        speaking drill with AI feedback. Targeted practice on these areas typically lifts overall band
                        by 0.5 within 3 weeks.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
 size="sm"
 className=" bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
 onClick={handleSpeakingPractice}
 >
                          <Icon name="Mic" className="size-3.5" />
                          Start Speaking Practice
                        </Button>
                        <Button
 size="sm"
 className=" bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90"
 onClick={handleWritingReview}
 >
                          <Icon name="PenLine" className="size-3.5" />
                          Submit Writing
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Study plan checklist */}
              <SectionCard
                title="Your Study Plan This Week"
                description="Generated from your top weak areas — check off as you complete"
                icon="ListTodo"
              >
                {studyPlan.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No active tasks — take more mocks to refine your plan.</p>
                ) : (
                  <div className="space-y-2">
                    {studyPlan.map((item) => {
                      const done = !!checklist[item.id];
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                            done ? "border-emerald-200 bg-emerald-50/50" : "border-border/80 bg-card",
                          )}
                        >
                          <Checkbox
                            id={item.id}
                            checked={done}
                            onCheckedChange={() => toggleChecklist(item.id)}
                            className="mt-0.5"
                          />
                          <label htmlFor={item.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-sm font-semibold", done ? "text-muted-foreground line-through" : "text-foreground")}>
                                {item.area}
                              </span>
                              <Badge variant="outline" className="border-rose-200 text-rose-700 text-[11px]">
                                {item.count}× flagged
                              </Badge>
                            </div>
                            <p className={cn("mt-0.5 text-xs", done ? "text-muted-foreground line-through" : "text-foreground/80")}>
                              {item.task}
                            </p>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
                {studyPlan.length > 0 && (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">Weekly progress</span>
                      <span className="font-semibold tabular-nums text-[var(--alo-brand)]">
                        {studyPlan.filter((i) => checklist[i.id]).length} / {studyPlan.length} done
                      </span>
                    </div>
                    <Progress
                      value={(studyPlan.filter((i) => checklist[i.id]).length / studyPlan.length) * 100}
                      className="h-2"
                    />
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </TabsContent>

        {/* Test Types */}
        <TabsContent value="types" className="mt-4">
          <SectionCard
            title="All Test Types"
            description="10 mock test types available — click Learn More for the full guide"
            icon="Library"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {TEST_TYPES.map((t) => {
                const info = TEST_TYPE_INFO[t.name];
                return (
                  <Card key={t.slug} className="flex flex-col rounded-2xl border-2 border-[var(--alo-brand)]/15 transition-all hover:border-[var(--alo-brand)]/40 hover:shadow-lg">
                    <CardContent className="flex flex-1 flex-col pt-5">
                      <div className="flex items-start gap-3">
                        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", t.accent)}>
                          <Icon name={t.icon} className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[var(--alo-brand)]">{t.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{t.freeInfo}</p>
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/80">
                        {info?.description || t.modules}
                      </p>
                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-start gap-1.5">
                          <Icon name="Globe" className="mt-0.5 size-3 shrink-0 text-[var(--alo-brand)]" />
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-foreground">Accepted:</span> {info?.countries || "—"}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Icon name="ClipboardCheck" className="mt-0.5 size-3 shrink-0 text-[var(--alo-brand)]" />
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-foreground">Typical:</span> {info?.requirement || "—"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-auto flex gap-2 pt-4">
                        <Button
 variant="outline"
 className="flex-1 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 onClick={() => handleLearnMore(t.slug, t.name)}
                        >
                          <Icon name="BookOpen" className="size-3.5" />
                          Learn More
                        </Button>
                        <Button
 className="flex-1 bg-[var(--alo-cta)] hover:bg-[var(--alo-cta)]/90 text-black"
 onClick={() => handleStartMock(t.name, freeMocksRemaining)}
                        >
                          <Icon name="Play" className="size-3.5" />
                          Start Mock
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Note */}
      <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-[var(--alo-brand-light)]/30">
        <CardContent className="flex items-start gap-3 pt-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-brand)] text-white">
            <Icon name="Info" className="size-5" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-[var(--alo-brand)]">English Test-only student</p>
            <p className="mt-1 text-foreground/80">
              This portal is for students taking English tests only (no full admission counseling). Need help choosing a
              test, preparing for university applications, or booking the official exam? Contact your ALO counselor or
              visit any ALO branch for a consultation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default EnglishTestDashboard;
