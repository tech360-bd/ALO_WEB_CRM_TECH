"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Icon,
  SectionCard,
  EmptyState,
  Progress,
} from "@/components/alo/shared";
import { timeAgo, type ViewKey } from "@/lib/alo-types";

// ---------- Types ----------
interface Student {
  id: string;
  studentId: string;
  fullName: string;
  email?: string;
  mobile?: string;
  studyDestination?: string | null;
  programTitle?: string | null;
  applications?: Array<{
    id: string;
    university?: string | null;
    course?: string | null;
  }>;
}

interface SopDraftResponse {
  content: string;
  wordCount: number;
  draft: {
    id: string;
    version: number;
    status: string;
    originalityScore: number;
    reviewChecklist: string;
    aiGenerated: boolean;
    createdAt: string;
    university?: string | null;
    course?: string | null;
    type?: string;
  } | null;
  originalityNote: string;
}

interface CvDraftResponse {
  content: string;
  draft: { id: string; version: number; status: string; createdAt: string } | null;
}

// ---------- Document type options ----------
const DOC_TYPES = [
  { value: "SOP", label: "SOP — Statement of Purpose" },
  { value: "PERSONAL_STATEMENT", label: "Personal Statement" },
  { value: "GTE", label: "GTE Statement (Australia)" },
  { value: "GS", label: "GS Statement (Australia)" },
  { value: "COVER_LETTER", label: "Cover Letter" },
  { value: "STUDY_GAP", label: "Study Gap Explanation" },
  { value: "SPONSOR", label: "Sponsor Explanation" },
  { value: "REFUSAL_EXPLANATION", label: "Refusal Explanation" },
  { value: "INTERVIEW_ANSWER", label: "Interview Answer Guide" },
];

const DOC_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  DOC_TYPES.map((d) => [d.value, d.label.split(" — ")[0].replace(/^[A-Z]+ — /, "")])
);

const CV_TEMPLATES = [
  { value: "STANDARD", label: "Standard" },
  { value: "ACADEMIC", label: "Academic" },
  { value: "PROFESSIONAL", label: "Professional" },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  STUDENT_REVIEW: "Student Review",
  COUNSELOR_REVIEW: "Counselor Review",
  APPROVED: "Approved",
  SENT: "Sent",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  STUDENT_REVIEW: "bg-amber-100 text-amber-700",
  COUNSELOR_REVIEW: "bg-[#e8f0fb] text-[#0B5ED7]",
  APPROVED: "bg-emerald-100 text-emerald-700",
  SENT: "bg-violet-100 text-violet-700",
};

// ---------- Helpers ----------
function safeParseArr<T = any>(val: any): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as T[];
  if (typeof val !== "string") return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Split content into segments, highlighting [verify: ...] markers
function renderContentWithVerify(content: string) {
  const parts = content.split(/(\[verify:[^\]]*\])/g);
  return parts.map((p, i) => {
    if (/^\[verify:/.test(p)) {
      return (
        <mark
          key={i}
          className="rounded bg-amber-200/70 px-1 py-0.5 text-amber-900 underline decoration-amber-500 decoration-dotted underline-offset-2"
          title="Counselor/student must verify this"
        >
          {p}
        </mark>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function SopStudio({ onNavigate = () => {} }: { onNavigate?: (v: ViewKey, slug?: string) => void }) {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<"sop" | "cv">("sop");

  // ----- SOP form state -----
  const [docType, setDocType] = React.useState<string>("SOP");
  const [students, setStudents] = React.useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = React.useState(true);
  const [studentId, setStudentId] = React.useState<string>("");
  const [university, setUniversity] = React.useState("");
  const [course, setCourse] = React.useState("");
  const [personalBg, setPersonalBg] = React.useState("");
  const [academicBg, setAcademicBg] = React.useState("");
  const [workExp, setWorkExp] = React.useState("");
  const [englishScore, setEnglishScore] = React.useState("");
  const [futureGoals, setFutureGoals] = React.useState("");
  const [whyCourse, setWhyCourse] = React.useState("");
  const [whyUni, setWhyUni] = React.useState("");
  const [whyCountry, setWhyCountry] = React.useState("");
  const [studyGap, setStudyGap] = React.useState("");

  const [generating, setGenerating] = React.useState(false);
  const [sopResult, setSopResult] = React.useState<SopDraftResponse | null>(null);
  const [sopStatus, setSopStatus] = React.useState<string>("DRAFT");
  const [checklistDone, setChecklistDone] = React.useState<Record<number, boolean>>({});

  // ----- CV form state -----
  const [cvTemplate, setCvTemplate] = React.useState<string>("STANDARD");
  const [cvPersonal, setCvPersonal] = React.useState("");
  const [cvEducation, setCvEducation] = React.useState("");
  const [cvWork, setCvWork] = React.useState("");
  const [cvSkills, setCvSkills] = React.useState("");
  const [cvAchievements, setCvAchievements] = React.useState("");
  const [cvGenerating, setCvGenerating] = React.useState(false);
  const [cvResult, setCvResult] = React.useState<CvDraftResponse | null>(null);

  // Fetch students
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/counselor/students", { cache: "no-store" });
        const data = await res.json();
        setStudents(data.students || []);
      } catch (e) {
        toast({ title: "Failed to load students", variant: "destructive" });
      } finally {
        setStudentsLoading(false);
      }
    })();
  }, [toast]);

  function onStudentSelect(sid: string) {
    setStudentId(sid);
    const s = students.find((x) => x.id === sid);
    if (!s) return;
    // Auto-fill from most recent application if present
    const app = s.applications?.[0];
    if (app) {
      if (app.university) setUniversity(app.university);
      if (app.course) setCourse(app.course);
    } else {
      if (s.studyDestination) setUniversity((prev) => prev || "");
      if (s.programTitle) setCourse(s.programTitle);
    }
    // Pre-fill personal info hint
    setPersonalBg((prev) =>
      prev ||
      `Name: ${s.fullName}. Contact: ${s.email || ""} / ${s.mobile || ""}.`
    );
    toast({ title: "Student selected", description: `${s.fullName} — auto-filled available fields.` });
  }

  async function handleGenerate() {
    if (!studentId) {
      toast({ title: "Select a student first", description: "We need a student profile to personalize the draft.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setSopResult(null);
    try {
      const res = await fetch("/api/sop/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          counselorId: null,
          type: docType,
          university,
          course,
          personalBackground: personalBg,
          academicBackground: academicBg,
          workExperience: workExp,
          englishScore,
          futureGoals,
          whyThisCourse: whyCourse,
          whyThisUniversity: whyUni,
          whyThisCountry: whyCountry,
          studyGap,
        }),
      });
      const data: SopDraftResponse = await res.json();
      setSopResult(data);
      setSopStatus(data.draft?.status || "DRAFT");
      setChecklistDone({});
      toast({
        title: "Draft generated",
        description: `${data.wordCount} words · originality ${data.draft?.originalityScore ?? 0}%. Send for student review next.`,
      });
    } catch (e) {
      toast({ title: "Generation failed", description: "Please retry in a moment.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateCv() {
    if (!studentId) {
      toast({ title: "Select a student first", description: "We need a student profile to build the CV.", variant: "destructive" });
      return;
    }
    setCvGenerating(true);
    setCvResult(null);
    try {
      const res = await fetch("/api/cv/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          counselorId: null,
          template: cvTemplate,
          personalInfo: cvPersonal,
          education: cvEducation,
          workExperience: cvWork,
          skills: cvSkills,
          achievements: cvAchievements,
        }),
      });
      const data: CvDraftResponse = await res.json();
      setCvResult(data);
      toast({ title: "CV draft generated", description: "Review and send to student." });
    } catch (e) {
      toast({ title: "CV generation failed", variant: "destructive" });
    } finally {
      setCvGenerating(false);
    }
  }

  const checklist = sopResult?.draft?.reviewChecklist
    ? safeParseArr<string>(sopResult.draft.reviewChecklist)
    : [
        "Personal motivation is clear and specific",
        "Academic background connected to course",
        "University choice explained with specifics",
        "Career goals stated realistically",
        "No copied or template content",
        "Honest — no invented achievements",
        "Student has reviewed and personalized",
      ];

  const checkedCount = Object.values(checklistDone).filter(Boolean).length;
  const checklistPct = checklist.length ? Math.round((checkedCount / checklist.length) * 100) : 0;
  const originalityScore = sopResult?.draft?.originalityScore ?? 0;

  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-alo-gradient text-white alo-shadow">
            <Icon name="FileText" className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B5ED7] sm:text-2xl">SOP / CV Studio</h1>
            <p className="text-sm text-muted-foreground">Generate original, personalized documents with AI. Originality-first, review-required.</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="h-10 border-[#0B5ED7]/20 text-[#0B5ED7]"
          onClick={() => onNavigate("counselor-student-360")}
        >
          <Icon name="Orbit" className="size-4" />
          Open Student 360
        </Button>
      </div>

      {/* Originality & compliance banner */}
      <Card className="rounded-2xl border-2 border-[#F97316]/30 bg-[#fdece4]/70">
        <CardContent className="grid gap-4 pt-5 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <Icon name="Ban" className="size-4" />
              </div>
              <p className="text-sm font-bold text-rose-700">AI MUST NOT</p>
            </div>
            <ul className="space-y-1 text-sm text-foreground/80">
              {[
                "Copy sample SOPs or templates from the internet",
                "Invent student achievements or fake experiences",
                "Forge documents or signatures",
                "Bypass plagiarism or AI-detection tools",
                "Guarantee admission or visa approval",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Icon name="X" className="mt-0.5 size-3.5 shrink-0 text-rose-600" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Icon name="Check" className="size-4" />
              </div>
              <p className="text-sm font-bold text-emerald-700">AI MUST</p>
            </div>
            <ul className="space-y-1 text-sm text-foreground/80">
              {[
                "Use the student's real profile data only",
                "Mark missing evidence with [verify: ...]",
                "Require student + counselor review",
                "Keep version history on the timeline",
                "Include originality guidance with every draft",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Icon name="Check" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <div className="border-t border-[#F97316]/20 bg-white/60 px-5 py-2.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-[#F97316]">
            <Icon name="ShieldCheck" className="size-4" />
            Every draft requires student review and counselor sign-off before sending.
          </p>
        </div>
      </Card>

      {/* Tabs: SOP | CV */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "sop" | "cv")}>
        <TabsList className="h-10 bg-[#e8f0fb]">
          <TabsTrigger value="sop" className="data-[state=active]:bg-white data-[state=active]:text-[#0B5ED7]">
            <Icon name="FileText" className="size-4" />
            SOP / Statement
          </TabsTrigger>
          <TabsTrigger value="cv" className="data-[state=active]:bg-white data-[state=active]:text-[#0B5ED7]">
            <Icon name="Briefcase" className="size-4" />
            CV Builder
          </TabsTrigger>
        </TabsList>

        {/* ---------------- SOP TAB ---------------- */}
        <TabsContent value="sop" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* LEFT: Form */}
            <div className="lg:col-span-1">
              <SectionCard title="Generation form" icon="Wand2" description="AI writes the draft from the student's real profile.">
                <div className="space-y-3.5">
                  {/* Document type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B5ED7]">Document type</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger className="h-10 border-[#0B5ED7]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOC_TYPES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Student */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B5ED7]">Student</Label>
                    <Select value={studentId} onValueChange={onStudentSelect}>
                      <SelectTrigger className="h-10 border-[#0B5ED7]/20">
                        <SelectValue placeholder={studentsLoading ? "Loading students..." : "Select student"} />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.fullName} · {s.studentId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {studentId && (
                      <p className="text-[11px] text-muted-foreground">
                        University & course auto-filled from latest application — edit if needed.
                      </p>
                    )}
                  </div>

                  {/* University / Course */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#0B5ED7]">University</Label>
                      <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. University of Manchester" className="h-10 border-[#0B5ED7]/20" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#0B5ED7]">Course</Label>
                      <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. MSc Computer Science" className="h-10 border-[#0B5ED7]/20" />
                    </div>
                  </div>

                  <FieldTextarea label="Personal background" value={personalBg} onChange={setPersonalBg} placeholder="Family, location, key life influences..." />
                  <FieldTextarea label="Academic background" value={academicBg} onChange={setAcademicBg} placeholder="Degrees, institutions, results, relevant projects..." />
                  <FieldTextarea label="Work experience" value={workExp} onChange={setWorkExp} placeholder="Roles, companies, durations, achievements..." />

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B5ED7]">English score</Label>
                    <Input value={englishScore} onChange={(e) => setEnglishScore(e.target.value)} placeholder="e.g. IELTS 6.5 overall (L:7 R:6 W:6 S:6)" className="h-10 border-[#0B5ED7]/20" />
                  </div>

                  <FieldTextarea label="Future goals" value={futureGoals} onChange={setFutureGoals} placeholder="Short-term and long-term career plans..." />
                  <FieldTextarea label="Why this course?" value={whyCourse} onChange={setWhyCourse} placeholder="What draws you to this specific course?" />
                  <FieldTextarea label="Why this university?" value={whyUni} onChange={setWhyUni} placeholder="Specific facilities, faculty, modules..." />
                  <FieldTextarea label="Why this country?" value={whyCountry} onChange={setWhyCountry} placeholder="Education system, post-study work rights, culture..." />
                  <FieldTextarea label="Study gap explanation (optional)" value={studyGap} onChange={setStudyGap} placeholder="If there's a gap, explain credibly..." />

                  <Button
                    className="h-12 w-full bg-[#F97316] text-white hover:bg-[#F97316]/90"
                    onClick={handleGenerate}
                    disabled={generating || !studentId}
                  >
                    {generating ? (
                      <>
                        <Icon name="Loader2" className="size-4 animate-spin" />
                        AI is writing your draft...
                      </>
                    ) : (
                      <>
                        <Icon name="Sparkles" className="size-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Draft saved to student timeline · Version 1
                  </p>
                </div>
              </SectionCard>
            </div>

            {/* RIGHT: Generated document + review */}
            <div className="lg:col-span-2">
              {!sopResult ? (
                <Card className="rounded-2xl border-2 border-[#0B5ED7]/15">
                  <CardContent className="pt-6">
                    {generating ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="relative flex size-20 items-center justify-center">
                          <div className="absolute inset-0 animate-ping rounded-2xl bg-[#F97316]/20" />
                          <div className="relative flex size-20 items-center justify-center rounded-2xl bg-[#F97316] text-white">
                            <Icon name="Sparkles" className="size-9 animate-pulse" />
                          </div>
                        </div>
                        <p className="mt-5 text-base font-semibold text-[#0B5ED7]">AI is writing your draft...</p>
                        <p className="mt-1 text-sm text-muted-foreground">Structuring the narrative · Connecting academic background to course · Reviewing originality</p>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                          {["Opening", "Academic", "Experience", "Why course", "Goals", "Conclusion"].map((s, i) => (
                            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fb] px-2.5 py-1 text-[10px] font-medium text-[#0B5ED7]" style={{ animationDelay: `${i * 200}ms` }}>
                              <Icon name="Loader2" className="size-3 animate-spin" />
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        icon="FileText"
                        title="Generate a document to see it here"
                        description="Pick a document type, select a student, fill in the form on the left, and click Generate with AI. The draft will appear here with a review checklist and approval workflow."
                      />
                    )}
                  </CardContent>
                </Card>
              ) : (
                <SopResultView
                  result={sopResult}
                  status={sopStatus}
                  setStatus={setSopStatus}
                  docType={docType}
                  university={university}
                  course={course}
                  checklist={checklist}
                  checklistDone={checklistDone}
                  setChecklistDone={setChecklistDone}
                  checklistPct={checklistPct}
                  originalityScore={originalityScore}
                  onRegenerate={handleGenerate}
                  onNavigate={onNavigate}
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* ---------------- CV TAB ---------------- */}
        <TabsContent value="cv" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <SectionCard title="CV builder" icon="Briefcase" description="Auto-fills from student profile. Honest, structured, one page.">
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B5ED7]">Template</Label>
                    <Select value={cvTemplate} onValueChange={setCvTemplate}>
                      <SelectTrigger className="h-10 border-[#0B5ED7]/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CV_TEMPLATES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B5ED7]">Student</Label>
                    <Select value={studentId} onValueChange={onStudentSelect}>
                      <SelectTrigger className="h-10 border-[#0B5ED7]/20">
                        <SelectValue placeholder={studentsLoading ? "Loading students..." : "Select student"} />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.fullName} · {s.studentId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FieldTextarea label="Personal info" value={cvPersonal} onChange={setCvPersonal} placeholder="Name, email, phone, location, LinkedIn..." />
                  <FieldTextarea label="Education" value={cvEducation} onChange={setCvEducation} placeholder="Degrees, institutions, years, results..." />
                  <FieldTextarea label="Work experience" value={cvWork} onChange={setCvWork} placeholder="Roles, companies, durations, responsibilities..." />
                  <FieldTextarea label="Skills" value={cvSkills} onChange={setCvSkills} placeholder="Technical, soft, language skills..." />
                  <FieldTextarea label="Achievements" value={cvAchievements} onChange={setCvAchievements} placeholder="Awards, certifications, projects..." />

                  <Button
                    className="h-12 w-full bg-[#F97316] text-white hover:bg-[#F97316]/90"
                    onClick={handleGenerateCv}
                    disabled={cvGenerating || !studentId}
                  >
                    {cvGenerating ? (
                      <>
                        <Icon name="Loader2" className="size-4 animate-spin" />
                        Building CV...
                      </>
                    ) : (
                      <>
                        <Icon name="Sparkles" className="size-4" />
                        Generate CV
                      </>
                    )}
                  </Button>
                </div>
              </SectionCard>
            </div>

            <div className="lg:col-span-2">
              {!cvResult ? (
                <Card className="rounded-2xl border-2 border-[#0B5ED7]/15">
                  <CardContent className="pt-6">
                    {cvGenerating ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#F97316] text-white">
                          <Icon name="Loader2" className="size-8 animate-spin" />
                        </div>
                        <p className="mt-4 text-base font-semibold text-[#0B5ED7]">Building your CV...</p>
                        <p className="mt-1 text-sm text-muted-foreground">Formatting sections · Polishing bullets · Ensuring one-page fit</p>
                      </div>
                    ) : (
                      <EmptyState
                        icon="Briefcase"
                        title="Generate a CV to see it here"
                        description="Pick a template, select a student, fill in the form, and click Generate CV."
                      />
                    )}
                  </CardContent>
                </Card>
              ) : (
                <CvResultView result={cvResult} studentId={studentId} />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================
function FieldTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-[#0B5ED7]">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="resize-none border-[#0B5ED7]/20 text-sm"
      />
    </div>
  );
}

function SopResultView({
  result,
  status,
  setStatus,
  docType,
  university,
  course,
  checklist,
  checklistDone,
  setChecklistDone,
  checklistPct,
  originalityScore,
  onRegenerate,
  onNavigate,
}: {
  result: SopDraftResponse;
  status: string;
  setStatus: (s: string) => void;
  docType: string;
  university: string;
  course: string;
  checklist: string[];
  checklistDone: Record<number, boolean>;
  setChecklistDone: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  checklistPct: number;
  originalityScore: number;
  onRegenerate: () => void;
  onNavigate: (v: ViewKey, slug?: string) => void;
}) {
  const { toast } = useToast();
  const checkedCount = Object.values(checklistDone).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Document header */}
      <Card className="rounded-2xl border-2 border-[#0B5ED7]/20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-[#0B5ED7]">
                  {DOC_TYPE_LABEL[docType] || docType}
                </h3>
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[status] || "bg-slate-100 text-slate-700")}>
                  {STATUS_LABELS[status] || status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon name="Building2" className="size-3.5" />
                  {university || "University not set"}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="BookOpen" className="size-3.5" />
                  {course || "Course not set"}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Type" className="size-3.5" />
                  {result.wordCount} words
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="History" className="size-3.5" />
                  Version {result.draft?.version ?? 1} · {result.draft?.createdAt ? timeAgo(result.draft.createdAt) : "just now"}
                </span>
              </div>
            </div>
            <div className="w-full max-w-[220px] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#0B5ED7]">Originality score</span>
                <span className="font-bold text-foreground">{originalityScore}%</span>
              </div>
              <Progress value={originalityScore} className="h-2" />
              <p className="text-[10px] text-muted-foreground">Indicative only · Student must personalize</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document content */}
      <Card className="rounded-2xl border-2 border-[#0B5ED7]/15">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
            <p className="text-xs font-semibold text-[#0B5ED7]">Document preview</p>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
              <Icon name="Lightbulb" className="size-3" />
              [verify: ...] markers need student input
            </Badge>
          </div>
          <div className="max-h-[32rem] overflow-y-auto alo-scroll whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-foreground">
            {renderContentWithVerify(result.content)}
          </div>
        </CardContent>
      </Card>

      {/* Review checklist */}
      <SectionCard
        title="Review checklist"
        icon="ListChecks"
        description={`${checkedCount}/${checklist.length} items reviewed · ${checklistPct}%`}
        action={
          <div className="w-32">
            <Progress value={checklistPct} className="h-2" />
          </div>
        }
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {checklist.map((item, i) => (
            <label
              key={i}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-xl border-2 p-3 transition-colors",
                checklistDone[i] ? "border-emerald-300 bg-emerald-50" : "border-border/60 hover:border-[#0B5ED7]/30"
              )}
            >
              <Checkbox
                checked={!!checklistDone[i]}
                onCheckedChange={(v) => setChecklistDone((prev) => ({ ...prev, [i]: !!v }))}
                className="mt-0.5 data-[state=checked]:bg-[#0B5ED7] data-[state=checked]:border-[#0B5ED7]"
              />
              <span className={cn("text-sm", checklistDone[i] ? "text-emerald-800 line-through" : "text-foreground")}>
                {item}
              </span>
            </label>
          ))}
        </div>
      </SectionCard>

      {/* Action buttons */}
      <Card className="rounded-2xl border-2 border-[#0B5ED7]/15">
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-12 bg-[#F97316] text-white hover:bg-[#F97316]/90"
              onClick={() => {
                setStatus("STUDENT_REVIEW");
                toast({ title: "Sent to student portal", description: "Student has been notified to review and personalize the draft." });
              }}
              disabled={status !== "DRAFT" && status !== "STUDENT_REVIEW"}
            >
              <Icon name="Send" className="size-4" />
              Send to Student Portal
            </Button>
            <Button
              variant="outline"
              className="h-12 border-[#0B5ED7] text-[#0B5ED7] hover:bg-[#0B5ED7]/5"
              onClick={() => {
                setStatus("COUNSELOR_REVIEW");
                toast({ title: "Marked as counselor reviewed", description: "Your sign-off is recorded on the timeline." });
              }}
              disabled={status === "APPROVED"}
            >
              <Icon name="Eye" className="size-4" />
              Mark as Counselor Reviewed
            </Button>
            <Button
              variant="outline"
              className="h-12 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                setStatus("APPROVED");
                toast({ title: "Document approved", description: "Ready to send with the application." });
              }}
              disabled={status === "APPROVED"}
            >
              <Icon name="CheckCircle2" className="size-4" />
              Approve & Finalize
            </Button>
            <Button
              variant="outline"
              className="h-12"
              onClick={() => toast({ title: "PDF export started", description: "Your download will be ready in a few seconds." })}
            >
              <Icon name="Download" className="size-4" />
              Export PDF
            </Button>
            <Button
              variant="ghost"
              className="h-12 text-muted-foreground"
              onClick={onRegenerate}
            >
              <Icon name="RefreshCw" className="size-4" />
              Regenerate
            </Button>
          </div>

          <Separator />

          {/* Version + originality notes */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2 rounded-xl bg-[#e8f0fb] p-3">
              <Icon name="History" className="mt-0.5 size-4 shrink-0 text-[#0B5ED7]" />
              <div>
                <p className="text-xs font-semibold text-[#0B5ED7]">Version history</p>
                <p className="text-xs text-foreground/80">
                  Version {result.draft?.version ?? 1} · Created {result.draft?.createdAt ? timeAgo(result.draft.createdAt) : "just now"} · AI-generated · All versions saved to timeline.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-[#fdece4] p-3">
              <Icon name="ShieldAlert" className="mt-0.5 size-4 shrink-0 text-[#F97316]" />
              <div>
                <p className="text-xs font-semibold text-[#F97316]">Originality note</p>
                <p className="text-xs text-foreground/80">{result.originalityNote}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button
              variant="link"
              className="h-8 p-0 text-xs text-[#0B5ED7]"
              onClick={() => onNavigate("counselor-student-360")}
            >
              Open Student 360 to view all drafts →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CvResultView({ result, studentId }: { result: CvDraftResponse; studentId: string }) {
  const { toast } = useToast();
  const [status, setStatus] = React.useState<string>(result.draft?.status || "DRAFT");

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-2 border-[#0B5ED7]/20">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0B5ED7]">CV Draft</h3>
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[status] || "bg-slate-100 text-slate-700")}>
                {STATUS_LABELS[status] || status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Version {result.draft?.version ?? 1} · Created {result.draft?.createdAt ? timeAgo(result.draft.createdAt) : "just now"} · AI-generated
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-9 bg-[#F97316] text-white hover:bg-[#F97316]/90"
              onClick={() => {
                setStatus("STUDENT_REVIEW");
                toast({ title: "Sent to student portal for review" });
              }}
            >
              <Icon name="Send" className="size-4" />
              Send to Student
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              onClick={() => {
                setStatus("APPROVED");
                toast({ title: "CV approved", description: "Ready to attach to applications." });
              }}
            >
              <Icon name="CheckCircle2" className="size-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => toast({ title: "PDF export started" })}
            >
              <Icon name="Download" className="size-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-2 border-[#0B5ED7]/15">
        <CardContent className="p-0">
          <div className="border-b border-border/60 px-4 py-2.5">
            <p className="text-xs font-semibold text-[#0B5ED7]">CV preview</p>
          </div>
          <div className="max-h-[28rem] overflow-y-auto alo-scroll whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-foreground">
            {renderContentWithVerify(result.content)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default SopStudio;
