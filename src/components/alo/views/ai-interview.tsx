"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatusBadge,
  SectionCard,
  EmptyState,
  PageHeader,
} from "@/components/alo/shared";
import { INTERVIEW_TYPES } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Student = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
};

type Application = {
  id: string;
  university: string;
  course: string;
  country: string;
};

type StudentWithApps = Student & { applications?: Application[] };

type QA = { q: string; a: string };

type InterviewReport = {
  scores?: Record<string, number>;
  overallReadiness?: number;
  visaRisk?: string;
  readiness?: string;
  feedback?: string;
  improvementPlan?: string[];
  weakAreas?: string[];
};

type Phase = "setup" | "interview" | "report";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTERVIEW_TYPE_ICONS: Record<string, string> = {
  UNIVERSITY_CREDIBILITY: "University",
  VISA_INTERVIEW: "Landmark",
  PRE_CAS: "ShieldCheck",
  SCHOLARSHIP: "Award",
  GENERAL_ENGLISH: "MessageCircle",
};

const INTERVIEW_TYPE_DESCRIPTIONS: Record<string, string> = {
  UNIVERSITY_CREDIBILITY:
    "Mock university admissions interview to assess your academic fit and clarity of purpose.",
  VISA_INTERVIEW:
    "Realistic visa officer interview — why this country, course, and how you'll fund your studies.",
  PRE_CAS:
    "Pre-CAS confirmation interview used by UK universities before issuing your CAS letter.",
  SCHOLARSHIP:
    "Scholarship panel interview — merit, motivation, and how you'll contribute to the cohort.",
  GENERAL_ENGLISH:
    "Casual spoken-English conversation to build fluency, confidence, and natural flow.",
};

const SCORING_DIMENSIONS = [
  { key: "communication", label: "Communication clarity" },
  { key: "confidence", label: "Confidence" },
  { key: "courseKnowledge", label: "Course knowledge" },
  { key: "universityKnowledge", label: "University knowledge" },
  { key: "financialExplanation", label: "Financial explanation" },
  { key: "sponsorExplanation", label: "Sponsor explanation" },
  { key: "studyGapExplanation", label: "Study gap explanation" },
  { key: "futurePlanClarity", label: "Future plan clarity" },
  { key: "visaRisk", label: "Visa risk" },
];

const READINESS_COLORS: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-700",
  needs_practice: "bg-amber-100 text-amber-700",
  high_risk: "bg-rose-100 text-rose-700",
  human_review_required: "bg-orange-100 text-orange-700",
};

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-rose-100 text-rose-700",
};

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function AiInterviewView() {
  const { toast } = useToast();
  const [phase, setPhase] = React.useState<Phase>("setup");

  // Setup state
  const [students, setStudents] = React.useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = React.useState(true);
  const [selectedType, setSelectedType] = React.useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>("");
  const [studentName, setStudentName] = React.useState("");
  const [university, setUniversity] = React.useState("");
  const [course, setCourse] = React.useState("");
  const [country, setCountry] = React.useState("");

  // Interview state
  const [transcript, setTranscript] = React.useState<QA[]>([]);
  const [currentQuestion, setCurrentQuestion] = React.useState<string>("");
  const [answer, setAnswer] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Report state
  const [report, setReport] = React.useState<InterviewReport | null>(null);

  // Fetch students list once
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/students");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setStudents(data.students || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When a student is selected, fetch their applications and auto-fill context
  const handleSelectStudent = async (id: string) => {
    setSelectedStudentId(id);
    const s = students.find((x) => x.id === id);
    if (s) setStudentName(s.fullName);
    try {
      const res = await fetch(`/api/students?id=${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = await res.json();
      const student: StudentWithApps = data.student;
      const firstApp = student.applications?.[0];
      if (firstApp) {
        setUniversity(firstApp.university);
        setCourse(firstApp.course);
        setCountry(firstApp.country);
        toast({
          title: "Auto-filled from application",
          description: `${firstApp.university} · ${firstApp.course} · ${firstApp.country}`,
        });
      }
    } catch {
      // ignore — user can still fill manually
    }
  };

  const canStart =
    selectedType && studentName.trim() && university.trim() && course.trim() && country.trim();

  // --- Interview start: fetch opening question ---
  const startInterview = async () => {
    if (!canStart) {
      toast({
        title: "Missing details",
        description: "Please pick an interview type and fill the student context.",
        variant: "destructive",
      });
      return;
    }
    setPhase("interview");
    setTranscript([]);
    setCurrentQuestion("");
    setError(null);
    await fetchNextQuestion([]);
  };

  const fetchNextQuestion = async (currentTranscript: QA[]) => {
    setThinking(true);
    setError(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "next_question",
          type: selectedType,
          transcript: currentTranscript,
          studentName,
          university,
          course,
          country,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      if (!data.question) throw new Error("No question returned");
      setCurrentQuestion(data.question);
    } catch {
      setError("The AI interviewer couldn't respond. Please try again.");
      toast({
        title: "AI request failed",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setThinking(false);
    }
  };

  const handleSendAnswer = async () => {
    const trimmed = answer.trim();
    if (!trimmed) {
      toast({
        title: "Empty answer",
        description: "Please type your answer before sending.",
        variant: "destructive",
      });
      return;
    }
    if (thinking) return;
    const newTranscript = [...transcript, { q: currentQuestion, a: trimmed }];
    setTranscript(newTranscript);
    setAnswer("");
    await fetchNextQuestion(newTranscript);
  };

  const handleEndInterview = async () => {
    if (transcript.length < 3) {
      toast({
        title: "Not enough Q&A yet",
        description: "Complete at least 3 exchanges before generating the report.",
        variant: "destructive",
      });
      return;
    }
    setThinking(true);
    setError(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          type: selectedType,
          transcript,
          studentName,
          university,
          course,
          country,
          studentId: selectedStudentId || undefined,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      const r: InterviewReport = data.report || {};
      setReport(r);
      setPhase("report");
      toast({
        title: "Interview report ready",
        description: `Overall readiness: ${r.overallReadiness ?? "—"}%`,
      });
    } catch {
      setError("Failed to generate the report. Please try again.");
      toast({
        title: "Report generation failed",
        description: "Please retry the end-interview action.",
        variant: "destructive",
      });
    } finally {
      setThinking(false);
    }
  };

  const handleReset = () => {
    setPhase("setup");
    setTranscript([]);
    setCurrentQuestion("");
    setAnswer("");
    setReport(null);
    setError(null);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Interview Practice"
        icon="Mic"
        subtitle="Human-like interview practice for university credibility, visa, and pre-CAS interviews."
      />

      {phase === "setup" && (
        <SetupPhase
          students={students}
          studentsLoading={studentsLoading}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedStudentId={selectedStudentId}
          onSelectStudent={handleSelectStudent}
          studentName={studentName}
          onStudentNameChange={setStudentName}
          university={university}
          onUniversityChange={setUniversity}
          course={course}
          onCourseChange={setCourse}
          country={country}
          onCountryChange={setCountry}
          canStart={!!canStart}
          onStart={startInterview}
        />
      )}

      {phase === "interview" && (
        <InterviewPhase
          type={selectedType}
          transcript={transcript}
          currentQuestion={currentQuestion}
          answer={answer}
          onAnswerChange={setAnswer}
          onSend={handleSendAnswer}
          onEnd={handleEndInterview}
          thinking={thinking}
          error={error}
          onRetry={() => fetchNextQuestion(transcript)}
          studentName={studentName}
        />
      )}

      {phase === "report" && report && (
        <ReportPhase report={report} onReset={handleReset} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setup Phase
// ---------------------------------------------------------------------------

function SetupPhase({
  students,
  studentsLoading,
  selectedType,
  onSelectType,
  selectedStudentId,
  onSelectStudent,
  studentName,
  onStudentNameChange,
  university,
  onUniversityChange,
  course,
  onCourseChange,
  country,
  onCountryChange,
  canStart,
  onStart,
}: {
  students: Student[];
  studentsLoading: boolean;
  selectedType: string;
  onSelectType: (v: string) => void;
  selectedStudentId: string;
  onSelectStudent: (v: string) => void;
  studentName: string;
  onStudentNameChange: (v: string) => void;
  university: string;
  onUniversityChange: (v: string) => void;
  course: string;
  onCourseChange: (v: string) => void;
  country: string;
  onCountryChange: (v: string) => void;
  canStart: boolean;
  onStart: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Interview type selector */}
      <SectionCard
        title="Choose Interview Type"
        description="Pick the scenario you want to practice"
        icon="MessagesSquare"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INTERVIEW_TYPES.map((t) => {
            const selected = selectedType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onSelectType(t.value)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all",
                  selected
                    ? "border-[var(--alo-brand)] bg-[var(--alo-brand-light)] shadow-sm"
                    : "border-border bg-background hover:border-[var(--alo-brand)]/40 hover:bg-[var(--alo-brand-light)]/30"
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    selected
                      ? "bg-[var(--alo-brand)] text-white"
                      : "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]"
                  )}
                >
                  <Icon
                    name={INTERVIEW_TYPE_ICONS[t.value] || "Mic"}
                    className="size-5"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {INTERVIEW_TYPE_DESCRIPTIONS[t.value] || ""}
                  </p>
                </div>
                {selected && (
                  <Badge className="bg-[var(--alo-brand)] text-white">
                    <Icon name="CircleCheck" className="mr-1 size-3" />
                    Selected
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Student context form */}
        <SectionCard
          title="Student Context"
          description="Tell the AI who you are"
          icon="UserRound"
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>ALO Student (optional, but recommended)</Label>
              {studentsLoading ? (
                <div className="h-9 animate-pulse rounded-md bg-muted/50" />
              ) : (
                <Select
                  value={selectedStudentId}
                  onValueChange={onSelectStudent}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a registered student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.length === 0 ? (
                      <SelectItem value="_none" disabled>
                        No students found
                      </SelectItem>
                    ) : (
                      students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.fullName} · {s.studentId}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Selecting a student auto-fills University, Course, and Country from their first application.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Student Name</Label>
                <Input
                  value={studentName}
                  onChange={(e) => onStudentNameChange(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input
                  value={country}
                  onChange={(e) => onCountryChange(e.target.value)}
                  placeholder="e.g. UK, USA, Canada"
                />
              </div>
              <div className="space-y-1.5">
                <Label>University</Label>
                <Input
                  value={university}
                  onChange={(e) => onUniversityChange(e.target.value)}
                  placeholder="e.g. University of Bristol"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Course</Label>
                <Input
                  value={course}
                  onChange={(e) => onCourseChange(e.target.value)}
                  placeholder="e.g. MSc Data Science"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* How it works + scoring preview */}
        <SectionCard
          title="How It Works"
          description="One question at a time, then a full report"
          icon="Lightbulb"
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-[var(--alo-brand-light)] p-3 text-sm text-foreground/80">
              The AI interviewer will ask <strong>one question at a time</strong>,
              listen to your answer, ask follow-ups, and at the end give you a score
              across 9 dimensions + a readiness report saved to your CRM timeline.
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                9 Scoring Dimensions
              </p>
              <ul className="space-y-1.5">
                {SCORING_DIMENSIONS.map((d) => (
                  <li
                    key={d.key}
                    className="flex items-center gap-2 text-xs text-foreground/80"
                  >
                    <Icon
                      name="CircleCheck"
                      className="size-3.5 shrink-0 text-[var(--alo-brand)]"
                    />
                    {d.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Start button */}
      <div className="flex justify-end">
        <Button
          onClick={onStart}
          disabled={!canStart}
          className="h-12 bg-[var(--alo-cta)] px-8 text-black hover:bg-[var(--alo-cta)]/90 disabled:opacity-50"
        >
          <Icon name="Mic" className="size-5" />
          Start Interview
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interview Phase
// ---------------------------------------------------------------------------

function InterviewPhase({
  type,
  transcript,
  currentQuestion,
  answer,
  onAnswerChange,
  onSend,
  onEnd,
  thinking,
  error,
  onRetry,
  studentName,
}: {
  type: string;
  transcript: QA[];
  currentQuestion: string;
  answer: string;
  onAnswerChange: (v: string) => void;
  onSend: () => void;
  onEnd: () => void;
  thinking: boolean;
  error: string | null;
  onRetry: () => void;
  studentName: string;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const questionCount = transcript.length + (currentQuestion ? 1 : 0);
  const canEnd = transcript.length >= 3;
  const initial = studentName.charAt(0).toUpperCase() || "U";

  // Auto-scroll to latest message
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, currentQuestion, thinking]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSend();
    }
  };

  const typeLabel =
    INTERVIEW_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/20">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-alo-gradient text-white">
              <Icon name="Bot" className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{typeLabel}</p>
              <p className="text-xs text-muted-foreground">
                AI Interviewer · Live session
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
              Question {questionCount}
            </Badge>
            <Button
              onClick={onEnd}
              disabled={!canEnd || thinking}
              variant="outline"
              className="border-[var(--alo-cta)] text-[var(--alo-cta)] hover:bg-[var(--alo-cta)]/10"
            >
              <Icon name="Flag" className="size-4" />
              End & Get Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="rounded-2xl border-2">
        <CardContent className="p-0">
          <div
            ref={scrollRef}
            className="max-h-[460px] min-h-[320px] space-y-4 overflow-y-auto p-4"
          >
            {transcript.length === 0 && !currentQuestion && !thinking && (
              <EmptyState
                icon="Mic"
                title="Starting interview…"
                description="The AI interviewer is preparing your opening question."
              />
            )}

            {/* Past Q&A (chronological) */}
            {transcript.map((qa, i) => (
              <div key={i} className="space-y-3">
                <ChatBubble role="ai" text={qa.q} past />
                {qa.a && <ChatBubble role="user" text={qa.a} initial={initial} past />}
              </div>
            ))}

            {/* AI question (current — unanswered) */}
            {currentQuestion && (
              <ChatBubble role="ai" text={currentQuestion} />
            )}

            {/* Thinking indicator */}
            {thinking && (
              <div className="flex items-start gap-2.5">
                <Avatar role="ai" />
                <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-4 py-2.5">
                  <span className="flex gap-1">
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-3">
                <div className="flex items-start gap-2">
                  <Icon
                    name="TriangleAlert"
                    className="mt-0.5 size-4 shrink-0 text-rose-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-rose-700">{error}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onRetry}
                      className="mt-2 border-rose-300 text-rose-700 hover:bg-rose-100"
                    >
                      <Icon name="RotateCcw" className="size-3.5" />
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-muted/20 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Textarea
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer… (⌘/Ctrl + Enter to send)"
                className="min-h-[60px] flex-1 resize-none border-2 focus-visible:border-[var(--alo-brand)]"
                disabled={thinking}
              />
              <Button
                onClick={onSend}
                disabled={thinking || !answer.trim()}
                className="h-12 bg-[var(--alo-cta)] px-6 text-black hover:bg-[var(--alo-cta)]/90 sm:w-auto"
              >
                <Icon name="Send" className="size-4" />
                Send Answer
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {canEnd
                ? "You can end the interview and get your report now."
                : `Answer ${3 - transcript.length} more question${
                    3 - transcript.length === 1 ? "" : "s"
                  } to unlock the report.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Avatar({ role, initial }: { role: "ai" | "user"; initial?: string }) {
  if (role === "ai") {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-alo-gradient text-white">
        <Icon name="Bot" className="size-5" />
      </div>
    );
  }
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--alo-cta)] text-base font-bold text-white">
      {initial || "U"}
    </div>
  );
}

function ChatBubble({
  role,
  text,
  past,
  initial,
}: {
  role: "ai" | "user";
  text: string;
  past?: boolean;
  initial?: string;
}) {
  const isAI = role === "ai";
  return (
    <div
      className={cn(
        "flex items-start gap-2.5",
        !isAI && "flex-row-reverse"
      )}
    >
      <Avatar role={role} initial={initial} />
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isAI
            ? "rounded-tl-sm border border-[var(--alo-brand)]/20 bg-[var(--alo-brand-light)] text-foreground"
            : "rounded-tr-sm bg-[var(--alo-cta)] text-white",
          past && "opacity-90"
        )}
      >
        {text}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Report Phase
// ---------------------------------------------------------------------------

function ReportPhase({
  report,
  onReset,
}: {
  report: InterviewReport;
  onReset: () => void;
}) {
  const readinessPct = Math.round(report.overallReadiness ?? 0);
  const scores = report.scores || {};

  const scoreColor = (val?: number) => {
    if (val == null) return "#94a3b8";
    if (val >= 8) return "#10b981";
    if (val >= 6) return "#0057B8";
    if (val >= 4) return "#E8501A";
    return "#f43f5e";
  };

  const readinessColor =
    readinessPct >= 75 ? "#10b981" : readinessPct >= 50 ? "#E8501A" : "#f43f5e";

  return (
    <div className="space-y-4">
      {/* Top hero */}
      <Card className="overflow-hidden rounded-2xl border-2 border-[var(--alo-brand)]/20">
        <CardContent className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-3">
          {/* Readiness */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--alo-brand-light)] p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--alo-brand)]">
              Overall Readiness
            </p>
            <div className="relative my-3">
              <svg width="120" height="120" className="-rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-[var(--alo-brand)]/15"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={readinessColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - readinessPct / 100)}
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-foreground">
                {readinessPct}%
              </span>
            </div>
            <StatusBadge
              status={report.readiness || "needs_practice"}
              colorMap={READINESS_COLORS}
            />
          </div>

          {/* Risk + summary */}
          <div className="md:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Visa Risk
                </p>
                <div className="mt-1.5">
                  <StatusBadge
                    status={report.visaRisk || "MEDIUM"}
                    colorMap={RISK_COLORS}
                  />
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <Icon name="CircleCheck" className="size-4" />
                Saved to CRM timeline
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI Feedback
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                {report.feedback ||
                  "No feedback was returned by the AI evaluator. Try practicing again."}
              </p>
            </div>

            {report.weakAreas && report.weakAreas.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Weak Areas
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {report.weakAreas.map((w, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 9 dimension scores */}
      <SectionCard
        title="Dimension Scores"
        description="9 critical areas scored from 1–10"
        icon="Gauge"
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {SCORING_DIMENSIONS.map((d) => {
            // visaRisk dimension is reverse-coded: high risk = low score
            const raw = scores[d.key];
            const val =
              d.key === "visaRisk"
                ? raw == null
                  ? undefined
                  : 10 - raw // invert: low risk = high bar
                : raw;
            const pct =
              val == null ? 0 : Math.max(0, Math.min(100, (val / 10) * 100));
            return (
              <div key={d.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{d.label}</span>
                  <span
                    className="font-mono text-sm font-bold tabular-nums"
                    style={{ color: scoreColor(val) }}
                  >
                    {raw == null
                      ? "—"
                      : d.key === "visaRisk"
                      ? `${raw}/10 risk`
                      : `${val}/10`}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: scoreColor(val),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Improvement plan */}
      <SectionCard
        title="Improvement Plan"
        description="Actionable checklist for your next practice"
        icon="ListTodo"
      >
        {report.improvementPlan && report.improvementPlan.length > 0 ? (
          <ul className="space-y-2">
            {report.improvementPlan.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/20 p-3 text-sm"
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--alo-brand)] text-[11px] font-bold text-white">
                  {i + 1}
                </div>
                <span className="text-foreground/80">{tip}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="ListTodo"
            title="No improvement plan generated"
            description="Try the interview again for a more detailed plan."
          />
        )}
      </SectionCard>

      {/* Actions */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[var(--alo-brand)]/30 bg-[var(--alo-page)] p-5 sm:flex-row">
        <div className="text-sm text-muted-foreground">
          <Icon name="BookmarkCheck" className="mr-1 inline size-4 text-[var(--alo-brand)]" />
          This report has been saved to the student&apos;s CRM timeline. Counselors can review it anytime.
        </div>
        <Button
          onClick={onReset}
          className="h-12 bg-[var(--alo-cta)] px-6 text-black hover:bg-[var(--alo-cta)]/90"
        >
          <Icon name="RotateCcw" className="size-4" />
          Practice Again
        </Button>
      </div>
    </div>
  );
}
export default AiInterviewView;
