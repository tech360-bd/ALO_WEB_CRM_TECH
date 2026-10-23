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
} from "@/components/alo/shared";
import { fmtDate } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type MockTest = {
  testId: string;
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
  guestName?: string | null;
  guestPhone?: string | null;
};

type Student = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
};

const TEST_TYPES = [
  "IELTS",
  "IELTS UKVI",
  "PTE",
  "TOEFL",
  "DET / Duolingo",
  "OIETC / ELLT",
  "GRE",
  "GMAT",
  "SAT",
  "ACT",
  "Placement Test",
];

const TEST_SECTIONS: Record<string, { name: string; icon: string }[]> = {
  IELTS: [
    { name: "Listening", icon: "Headphones" },
    { name: "Reading", icon: "BookOpen" },
    { name: "Writing", icon: "PenLine" },
    { name: "Speaking", icon: "Mic" },
  ],
  "IELTS UKVI": [
    { name: "Listening", icon: "Headphones" },
    { name: "Reading", icon: "BookOpen" },
    { name: "Writing", icon: "PenLine" },
    { name: "Speaking", icon: "Mic" },
  ],
  PTE: [
    { name: "Speaking & Writing", icon: "Mic" },
    { name: "Reading", icon: "BookOpen" },
    { name: "Listening", icon: "Headphones" },
  ],
  TOEFL: [
    { name: "Reading", icon: "BookOpen" },
    { name: "Listening", icon: "Headphones" },
    { name: "Speaking", icon: "Mic" },
    { name: "Writing", icon: "PenLine" },
  ],
  "DET / Duolingo": [
    { name: "Literacy", icon: "BookOpen" },
    { name: "Comprehension", icon: "Brain" },
    { name: "Conversation", icon: "MessageCircle" },
    { name: "Production", icon: "Sparkles" },
  ],
  "OIETC / ELLT": [
    { name: "Reading", icon: "BookOpen" },
    { name: "Listening", icon: "Headphones" },
    { name: "Writing", icon: "PenLine" },
    { name: "Speaking", icon: "Mic" },
  ],
  GRE: [
    { name: "Verbal Reasoning", icon: "BookOpen" },
    { name: "Quantitative", icon: "Calculator" },
    { name: "Analytical Writing", icon: "PenLine" },
  ],
  GMAT: [
    { name: "Quantitative", icon: "Calculator" },
    { name: "Verbal", icon: "BookOpen" },
    { name: "Integrated Reasoning", icon: "Network" },
    { name: "Analytical Writing", icon: "PenLine" },
  ],
  SAT: [
    { name: "Reading", icon: "BookOpen" },
    { name: "Writing & Language", icon: "PenLine" },
    { name: "Math", icon: "Calculator" },
  ],
  ACT: [
    { name: "English", icon: "BookOpen" },
    { name: "Math", icon: "Calculator" },
    { name: "Reading", icon: "BookOpen" },
    { name: "Science", icon: "FlaskConical" },
  ],
  "Placement Test": [
    { name: "Grammar", icon: "BookOpen" },
    { name: "Vocabulary", icon: "SpellCheck" },
    { name: "Speaking", icon: "Mic" },
    { name: "Writing", icon: "PenLine" },
  ],
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

function scoreColor(score?: number | null) {
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

function fmtTimer(secs: number) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(secs % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// ---------------------------------------------------------------------------
// Sample mock exam content
// ---------------------------------------------------------------------------

const SAMPLE_PASSAGE = `The migration of skilled workers from developing to developed nations, often referred to as "brain drain", has long been a concern for economists and policymakers. While host countries benefit from an inflow of qualified professionals without bearing the cost of their education, source countries lose both human capital and the public investment made in those individuals. Recent studies, however, suggest a more nuanced picture: remittances sent home by expatriates often exceed the value of the lost productivity, and many skilled migrants eventually return, bringing with them new expertise and international networks. The challenge for source countries is therefore not to prevent migration altogether, but to create conditions that encourage circulation rather than permanent departure.`;

const SAMPLE_QUESTIONS = [
  {
    q: "According to the passage, what is the traditional concern regarding the migration of skilled workers?",
    options: [
      "It increases unemployment in host countries.",
      "Source countries lose human capital and educational investment.",
      "Host countries must pay for the migrants' training.",
      "Remittances are decreasing over time.",
    ],
    correct: 1,
  },
  {
    q: "What does the passage suggest about remittances?",
    options: [
      "They are usually less valuable than lost productivity.",
      "They are difficult to measure accurately.",
      "They can exceed the value of lost productivity.",
      "They have no impact on the source country's economy.",
    ],
    correct: 2,
  },
  {
    q: "What is the recommended strategy for source countries?",
    options: [
      "Prevent skilled migration entirely.",
      "Encourage permanent return only.",
      "Create conditions for circulation rather than permanent departure.",
      "Reduce public investment in higher education.",
    ],
    correct: 2,
  },
];

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function EnglishTestView() {
  const { toast } = useToast();
  const [mockTests, setMockTests] = React.useState<MockTest[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("history");

  // Fetch mock tests
  const loadMockTests = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mock-tests");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMockTests(data.mockTests || []);
    } catch {
      toast({
        title: "Failed to load mock tests",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch students (for the Start New Test form)
  const loadStudents = React.useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      if (!res.ok) return;
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      // silent — students list is only used for new test creation
    }
  }, []);

  React.useEffect(() => {
    loadMockTests();
    loadStudents();
  }, [loadMockTests, loadStudents]);

  // Stats
  const completedTests = mockTests.filter((m) => m.status === "COMPLETED");
  const avgScore =
    completedTests.length > 0
      ? (
          completedTests.reduce((s, m) => s + (m.overallScore || 0), 0) /
          completedTests.length
        ).toFixed(1)
      : "—";
  const freeMocksUsed = mockTests.filter((m) => m.isFree).length;

  // Weak areas aggregation
  const weakAreasCount = React.useMemo(() => {
    const counts: Record<string, number> = {};
    mockTests.forEach((m) => {
      parseWeakAreas(m.weakAreas).forEach((a) => {
        counts[a] = (counts[a] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [mockTests]);
  const maxWeakCount = weakAreasCount[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="English Test & Mock Test System"
        icon="GraduationCap"
        subtitle="Real exam-like practice — IELTS, PTE, TOEFL, DET & more."
      />

      {/* Rules banner */}
      <Card className="rounded-2xl border-2 border-[var(--alo-cta)]/30 bg-[var(--alo-cta-soft)]/40">
        <CardContent className="flex items-start gap-3 pt-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--alo-cta)] text-white">
            <Icon name="Info" className="size-5" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-[var(--alo-cta)]">Free Mock Test Policy</p>
            <p className="mt-1 text-foreground/80">
              ALO registered students get <strong>3 free full mock tests</strong>. Guest
              students get <strong>1 free mock test</strong>. After the free limit, payment
              is required. Admins can add mock credits (audit-logged).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Mock Tests"
            value={mockTests.length}
            icon="ClipboardList"
            accent="blue"
            hint="All test records"
          />
          <StatCard
            label="Completed"
            value={completedTests.length}
            icon="CircleCheck"
            accent="emerald"
            hint="Marked as done"
          />
          <StatCard
            label="Avg Score"
            value={avgScore}
            icon="TrendingUp"
            accent="violet"
            hint="Across completed tests"
          />
          <StatCard
            label="Free Mocks Used"
            value={freeMocksUsed}
            icon="Gift"
            accent="orange"
            hint="Free-tier usage"
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="history" className="gap-1.5">
            <Icon name="History" className="size-4" />
            Results History
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-1.5">
            <Icon name="Plus" className="size-4" />
            Start New Test
          </TabsTrigger>
          <TabsTrigger value="weak" className="gap-1.5">
            <Icon name="Target" className="size-4" />
            Weak Areas
          </TabsTrigger>
        </TabsList>

        {/* ---- Tab 1: Results History ---- */}
        <TabsContent value="history" className="mt-4">
          <SectionCard
            title="Mock Test Results"
            description="All completed and pending mock tests"
            icon="ListChecks"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={loadMockTests}
                disabled={loading}
              >
                <Icon name="RefreshCw" className={cn("size-4", loading && "animate-spin")} />
                Refresh
              </Button>
            }
          >
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-muted/50"
                  />
                ))}
              </div>
            ) : mockTests.length === 0 ? (
              <EmptyState
                icon="Inbox"
                title="No mock tests yet"
                description="Start a new mock test from the “Start New Test” tab to see results here."
              />
            ) : (
              <ScrollArea className="max-h-[600px] rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student / Guest</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Overall</TableHead>
                      <TableHead>L / R / W / S</TableHead>
                      <TableHead>Weak Areas</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTests.map((m) => {
                      const weak = parseWeakAreas(m.weakAreas);
                      const takerName = m.student?.fullName || m.guestName || "—";
                      return (
                        <TableRow key={m.testId}>
                          <TableCell>
                            <div className="font-medium text-foreground">
                              {takerName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {m.student?.studentId || (m.guestPhone ? `Guest · ${m.guestPhone}` : "Guest")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-[var(--alo-brand)]/30 bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"
                            >
                              {m.testType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                m.isFree
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }
                            >
                              {m.isFree ? "Free" : "Paid"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "text-xl font-bold tabular-nums",
                                scoreColor(m.overallScore)
                              )}
                            >
                              {m.overallScore?.toFixed(1) ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 text-xs tabular-nums">
                              {[
                                { l: "L", v: m.listeningScore },
                                { l: "R", v: m.readingScore },
                                { l: "W", v: m.writingScore },
                                { l: "S", v: m.speakingScore },
                              ].map((s) => (
                                <span
                                  key={s.l}
                                  className={cn(
                                    "inline-flex flex-col items-center rounded-md border border-border bg-muted/40 px-1.5 py-0.5",
                                    scoreColor(s.v)
                                  )}
                                  title={s.l}
                                >
                                  <span className="text-[11px] uppercase text-muted-foreground">
                                    {s.l}
                                  </span>
                                  <span className="font-semibold">
                                    {s.v?.toFixed(1) ?? "—"}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {weak.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <div className="flex max-w-[200px] flex-wrap gap-1">
                                {weak.slice(0, 3).map((w, i) => (
                                  <span
                                    key={i}
                                    className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                                  >
                                    {w}
                                  </span>
                                ))}
                                {weak.length > 3 && (
                                  <span className="text-[11px] text-muted-foreground">
                                    +{weak.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              {m.completedAt ? fmtDate(m.completedAt) : fmtDate(m.createdAt)}
                            </div>
                            <StatusBadge
                              status={m.status}
                              colorMap={STATUS_COLORS}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </SectionCard>
        </TabsContent>

        {/* ---- Tab 2: Start New Test ---- */}
        <TabsContent value="new" className="mt-4">
          <StartNewTest students={students} />
        </TabsContent>

        {/* ---- Tab 3: Weak Areas ---- */}
        <TabsContent value="weak" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard
              title="Weak Areas Analysis"
              description="Aggregated from all completed mock tests"
              icon="Target"
              className="lg:col-span-2"
            >
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 animate-pulse rounded bg-muted/50"
                    />
                  ))}
                </div>
              ) : weakAreasCount.length === 0 ? (
                <EmptyState
                  icon="ChartBar"
                  title="No weak areas detected yet"
                  description="Once students complete mock tests with AI-scored weak areas, the frequency chart will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {weakAreasCount.map(([area, count]) => (
                    <div key={area} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{area}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {count} test{count > 1 ? "s" : ""}
                        </span>
                      </div>
                      <MiniBar
                        value={count}
                        max={maxWeakCount}
                        color="#E8501A"
                      />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="AI Recommendations"
              description="Auto-generated study plan"
              icon="Sparkles"
            >
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5 rounded-xl bg-[var(--alo-brand-light)] p-3">
                  <Icon name="Brain" className="mt-0.5 size-4 shrink-0 text-[var(--alo-brand)]" />
                  <p className="text-foreground/80">
                    <strong className="text-[var(--alo-brand)]">AI recommends:</strong> Focus on
                    Writing Task 2 structure and Speaking Part 3 fluency — these recur as
                    the top weak areas across recent mock tests.
                  </p>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    "Schedule two Writing Task 2 drills per week with timed 40-min sessions.",
                    "Run 15-min Speaking Part 3 mock interviews focusing on opinion + reasoning.",
                    "Review model answers and rewrite one essay per week using the ALO essay checker.",
                    "Track progress with a weekly mini-mock; aim for +0.5 band per fortnight.",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Icon
                        name="CircleCheck"
                        className="mt-0.5 size-4 shrink-0 text-emerald-500"
                      />
                      <span className="text-foreground/80">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Start New Test tab
// ---------------------------------------------------------------------------

function StartNewTest({ students }: { students: Student[] }) {
  const { toast } = useToast();
  const [testType, setTestType] = React.useState<string>("IELTS");
  const [taker, setTaker] = React.useState<"student" | "guest">("student");
  const [studentId, setStudentId] = React.useState<string>("");
  const [guestName, setGuestName] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [examOpen, setExamOpen] = React.useState(false);

  const sections = TEST_SECTIONS[testType] || TEST_SECTIONS["IELTS"];

  const canStart =
    testType &&
    (taker === "student" ? !!studentId : guestName.trim().length > 0);

  const handleStart = () => {
    if (!canStart) {
      toast({
        title: "Missing information",
        description:
          taker === "student"
            ? "Please select a student."
            : "Please enter the guest's name.",
        variant: "destructive",
      });
      return;
    }
    setExamOpen(true);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* Form */}
      <SectionCard
        title="Start a Mock Test"
        description="Select the test type and taker to begin"
        icon="Play"
        className="lg:col-span-3"
      >
        <div className="space-y-5">
          {/* Test type */}
          <div className="space-y-1.5">
            <Label>Test Type</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                {TEST_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Taker type */}
          <div className="space-y-1.5">
            <Label>Test Taker</Label>
            <RadioGroup
              value={taker}
              onValueChange={(v) => setTaker(v as "student" | "guest")}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="taker-student"
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors",
                  taker === "student"
                    ? "border-[var(--alo-brand)] bg-[var(--alo-brand-light)]"
                    : "border-border hover:border-[var(--alo-brand)]/40"
                )}
              >
                <RadioGroupItem id="taker-student" value="student" />
                <div>
                  <div className="text-sm font-semibold text-foreground">ALO Student</div>
                  <div className="text-xs text-muted-foreground">Registered in CRM</div>
                </div>
              </Label>
              <Label
                htmlFor="taker-guest"
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors",
                  taker === "guest"
                    ? "border-[var(--alo-brand)] bg-[var(--alo-brand-light)]"
                    : "border-border hover:border-[var(--alo-brand)]/40"
                )}
              >
                <RadioGroupItem id="taker-guest" value="guest" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Guest</div>
                  <div className="text-xs text-muted-foreground">Walk-in / external</div>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Conditional fields */}
          {taker === "student" ? (
            <div className="space-y-1.5">
              <Label>Select Student</Label>
              {students.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-border p-3 text-xs text-muted-foreground">
                  Loading students…
                </div>
              ) : (
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName} · {s.studentId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Guest Name</Label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+8801805020100"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleStart}
            className="h-12 w-full bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90"
          >
            <Icon name="Play" className="size-5" />
            Start Mock Test
          </Button>
        </div>
      </SectionCard>

      {/* Exam preview card */}
      <SectionCard
        title="Exam Preview"
        description={`What to expect in ${testType}`}
        icon="FileText"
        className="lg:col-span-2"
      >
        <div className="rounded-2xl border-2 border-[var(--alo-brand)]/20 bg-[var(--alo-page)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <Badge className="bg-[var(--alo-brand)] text-white">{testType}</Badge>
            <span className="text-xs text-muted-foreground">~3 hours</span>
          </div>
          <div className="space-y-2">
            {sections.map((s, i) => (
              <div
                key={s.name}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-2.5"
              >
                <div className="flex size-8 items-center justify-center rounded-md bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                  <Icon name={s.icon} className="size-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    Section {i + 1}: {s.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-[var(--alo-brand-light)] p-2.5 text-xs text-[var(--alo-brand)]">
            <Icon name="Info" className="mr-1 inline size-3.5" />
            Free-tier eligible for registered students (3 free mocks).
          </div>
        </div>
      </SectionCard>

      {/* Mock exam dialog */}
      <MockExamDialog
        open={examOpen}
        onOpenChange={setExamOpen}
        testType={testType}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock Exam Dialog (demo simulation)
// ---------------------------------------------------------------------------

function MockExamDialog({
  open,
  onOpenChange,
  testType,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  testType: string;
}) {
  const { toast } = useToast();
  const [secondsLeft, setSecondsLeft] = React.useState(300);
  const [answers, setAnswers] = React.useState<(number | null)[]>([
    null,
    null,
    null,
  ]);
  const [submitted, setSubmitted] = React.useState(false);
  const [wordCount, setWordCount] = React.useState(0);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setSecondsLeft(300);
      setAnswers([null, null, null]);
      setSubmitted(false);
      setWordCount(0);
    }
  }, [open]);

  // Timer
  React.useEffect(() => {
    if (!open || submitted) return;
    if (secondsLeft <= 0) {
      setSubmitted(true);
      toast({
        title: "Time's up",
        description: "The exam was auto-submitted.",
      });
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, secondsLeft, submitted, toast]);

  const correctCount = SAMPLE_QUESTIONS.reduce(
    (sum, q, i) => sum + (answers[i] === q.correct ? 1 : 0),
    0
  );
  const estimatedBand = Math.min(9, 4 + correctCount * 1.5).toFixed(1);

  const handleSubmit = () => {
    setSubmitted(true);
    toast({
      title: "Mock test submitted",
      description: `Estimated band: ${estimatedBand}. AI scoring complete.`,
    });
  };

  const handleWritingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setWordCount(v.trim() ? v.trim().split(/\s+/).length : 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--alo-brand)]">
            <Icon name="FileText" className="size-5" />
            {testType} — Reading Section (Demo)
          </DialogTitle>
          <DialogDescription>
            This is a simulated exam interface. Real tests include audio for Listening,
            a written editor for Writing, and a recorder for Speaking.
          </DialogDescription>
        </DialogHeader>

        {/* Exam toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[var(--alo-brand)]/20 bg-[var(--alo-page)] p-3">
          <div className="flex items-center gap-2 text-sm">
            <Icon
              name="Timer"
              className={cn(
                "size-4",
                secondsLeft < 60 ? "text-rose-500" : "text-[var(--alo-brand)]"
              )}
            />
            <span
              className={cn(
                "font-mono text-lg font-bold tabular-nums",
                secondsLeft < 60 ? "text-rose-500" : "text-foreground"
              )}
            >
              {fmtTimer(secondsLeft)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {SAMPLE_QUESTIONS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md border-2 text-xs font-semibold",
                  answers[i] !== null
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Icon name="CloudCheck" className="size-3.5" />
            Autosaved
          </div>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
              <Icon
                name="CircleCheck"
                className="mx-auto size-10 text-emerald-500"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Your estimated score
              </p>
              <p className="text-3xl font-bold text-emerald-600">
                Band {estimatedBand}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {correctCount} / {SAMPLE_QUESTIONS.length} correct · AI scoring note: real
                banding includes partial-credit and coherence analysis.
              </p>
            </div>
            <div className="space-y-2">
              {SAMPLE_QUESTIONS.map((q, i) => {
                const correct = answers[i] === q.correct;
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-lg border p-2.5 text-sm",
                      correct
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-rose-200 bg-rose-50"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Icon
                        name={correct ? "CircleCheck" : "CircleX"}
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          correct ? "text-emerald-500" : "text-rose-500"
                        )}
                      />
                      <div>
                        <p className="font-medium text-foreground">Q{i + 1}: {q.q}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Correct answer: {q.options[q.correct]}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-3">
            <div className="space-y-4">
              {/* Passage */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">
                  <Icon name="BookOpen" className="size-3.5" />
                  Reading Passage
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {SAMPLE_PASSAGE}
                </p>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {SAMPLE_QUESTIONS.map((q, i) => (
                  <div key={i} className="rounded-xl border-2 border-border p-3">
                    <p className="mb-2 text-sm font-medium text-foreground">
                      <span className="text-[var(--alo-brand)]">Q{i + 1}.</span> {q.q}
                    </p>
                    <RadioGroup
                      value={answers[i]?.toString() ?? ""}
                      onValueChange={(v) =>
                        setAnswers((prev) => {
                          const next = [...prev];
                          next[i] = parseInt(v, 10);
                          return next;
                        })
                      }
                      className="space-y-2"
                    >
                      {q.options.map((opt, j) => (
                        <Label
                          key={j}
                          htmlFor={`q-${i}-${j}`}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-transparent p-2 text-sm hover:border-[var(--alo-brand)]/30 hover:bg-[var(--alo-brand-light)]/50"
                        >
                          <RadioGroupItem id={`q-${i}-${j}`} value={j.toString()} />
                          <span className="text-foreground/80">{opt}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>

              {/* Writing editor placeholder */}
              <div className="rounded-xl border-2 border-dashed border-[var(--alo-brand)]/30 p-3">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">
                  <span className="flex items-center gap-2">
                    <Icon name="PenLine" className="size-3.5" />
                    Writing Task (placeholder)
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {wordCount} words
                  </span>
                </div>
                <textarea
                  onChange={handleWritingChange}
                  placeholder="Write your essay here… (auto-counted by word count, autosaved every 5s in real exam)"
                  className="h-20 w-full resize-none rounded-md border border-border bg-background p-2 text-sm outline-none focus:border-[var(--alo-brand)]"
                />
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          {submitted ? (
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
            >
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90"
              >
                <Icon name="Send" className="size-4" />
                Submit Test
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default EnglishTestView;
