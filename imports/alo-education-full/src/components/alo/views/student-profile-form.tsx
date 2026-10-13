"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Icon,
  SectionCard,
  EmptyState,
  LoadingGrid,
  Progress,
  PageHeader,
} from "@/components/alo/shared";
import { useToast } from "@/hooks/use-toast";
import {
  COUNTRIES,
  ENGLISH_TESTS,
  LEAD_SOURCES,
} from "@/lib/alo-types";

// =================================================================
// Types
// =================================================================

interface EduEntry {
  id: string;
  level: string;
  institute: string;
  group: string;
  country: string;
  city: string;
  board: string;
  resultType: string;
  grade: string;
  startYear: string;
  endYear: string;
  studyGap: string;
}

interface EnglishTestEntry {
  id: string;
  testName: string;
  testDate: string;
  plannedDate: string;
  expirationDate: string;
  certificateNo: string;
  overallScore: string;
  listening: string;
  speaking: string;
  writing: string;
  reading: string;
}

interface WorkEntry {
  id: string;
  company: string;
  designation: string;
  department: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  jobRole: string;
  officeAddress: string;
  salaryMode: string;
  sourceOfFund: string;
}

interface RefEntry {
  id: string;
  name: string;
  designation: string;
  organization: string;
  email: string;
  mobile: string;
  country: string;
  relation: string;
}

interface VisaEntry {
  id: string;
  visaType: string;
  country: string;
  refusalDate: string;
  refusalReason: string;
}

interface FormState {
  // A
  leadSource: string;
  counselor: string;
  leadReference: string;
  preferredCountry: string;
  notes: string;
  welcomeEmail: boolean;
  // B
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  cityOfBirth: string;
  countryOfBirth: string;
  presentAddress: string;
  permanentAddress: string;
  // C
  email: string;
  altEmail: string;
  mobile: string;
  altMobile: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  // D
  education: EduEntry[];
  // E
  hasPassport: boolean;
  passportNumber: string;
  passportIssuePlace: string;
  passportIssueCountry: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  // F
  englishTestStatus: string; // RECEIVED, YET_TO_RECEIVE, PLANNING
  englishPlannedDate: string;
  englishTests: EnglishTestEntry[];
  // G
  hasWorkExperience: boolean;
  workExperience: WorkEntry[];
  // H
  recommendations: RefEntry[];
  // I
  hasPreviousVisa: boolean;
  visaHistory: VisaEntry[];
  previousRefusal: boolean;
  refusalDate: string;
  refusalReason: string;
  previousImmigrationApp: string;
  dependentStatus: string;
  dependentsCount: string;
  medicalCondition: string;
  criminalOffense: string;
  riskNote: string;
  // J
  fundingStatus: string;
  sponsorRelation: string;
  sourceOfFund: string;
  bankStatementStatus: string;
  sponsorDocStatus: string;
  // K
  studyDestination: string;
  programTitle: string;
  studyLevel: string;
  studyArea: string;
  intake: string;
  universityPreference: string;
  coursePreference: string;
}

interface StudentLite {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  altEmail?: string | null;
  mobile: string;
  altMobile?: string | null;
  nationality: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  cityOfBirth?: string | null;
  countryOfBirth?: string;
  presentAddress?: string | null;
  permanentAddress?: string | null;
  emergencyName?: string | null;
  emergencyRelation?: string | null;
  emergencyPhone?: string | null;
  educationHistory?: string;
  englishTests?: string;
  englishTestStatus?: string;
  workExperience?: string;
  recommendations?: string;
  visaHistory?: string;
  hasPreviousVisa?: boolean;
  previousRefusal?: boolean;
  refusalDetail?: string | null;
  hasPassport?: boolean;
  passportNumber?: string | null;
  passportIssuePlace?: string | null;
  passportIssueCountry?: string | null;
  passportIssueDate?: string | null;
  passportExpiryDate?: string | null;
  fundingStatus?: string;
  sponsorRelation?: string;
  sourceOfFund?: string | null;
  bankStatementStatus?: string;
  sponsorDocStatus?: string;
  studyDestination?: string | null;
  programTitle?: string | null;
  studyLevel?: string | null;
  studyArea?: string | null;
  intake?: string | null;
  universityPreference?: string | null;
  profileCompletion?: number;
  counselor?: { name: string; email: string } | null;
}

// =================================================================
// Constants & helpers
// =================================================================

const ACADEMIC_LEVELS = ["SSC", "HSC", "Bachelor 3yr", "Bachelor 4yr", "Masters", "PGD", "PhD"];
const RESULT_TYPES = ["GPA", "CGPA", "Percentage"];
const GENDERS = ["Male", "Female", "Other"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed"];
const RELATIONS = ["Father", "Mother", "Brother", "Sister", "Spouse", "Guardian"];
const SALARY_MODES = ["Cash", "Cheque", "Bank transfer"];
const FUNDING_STATUSES = [
  { value: "SELF_FUNDED", label: "Self-funded" },
  { value: "LOAN_SUPPORT", label: "Loan support" },
  { value: "SCHOLARSHIP", label: "Scholarship" },
  { value: "SPONSOR", label: "Sponsor" },
  { value: "OTHER", label: "Other" },
];
const SPONSOR_RELATIONS = ["Applicant", "Parents", "Sibling", "Dependent", "Others"];
const DOC_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "READY"];
const STUDY_LEVELS = ["Foundation", "Bachelor", "Masters", "PhD", "PG Diploma"];
const DEPENDENT_STATUSES = ["None", "Spouse only", "Spouse & children", "Children only"];
const CRIMINAL_OPTIONS = ["No", "Yes — declared", "Prefer not to say"];
const MEDICAL_OPTIONS = ["None", "Minor condition", "Ongoing treatment", "Prefer not to say"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const emptyEdu = (): EduEntry => ({ id: uid(), level: "", institute: "", group: "", country: "", city: "", board: "", resultType: "GPA", grade: "", startYear: "", endYear: "", studyGap: "" });
const emptyEnglish = (): EnglishTestEntry => ({ id: uid(), testName: "IELTS", testDate: "", plannedDate: "", expirationDate: "", certificateNo: "", overallScore: "", listening: "", speaking: "", writing: "", reading: "" });
const emptyWork = (): WorkEntry => ({ id: uid(), company: "", designation: "", department: "", startDate: "", endDate: "", currentlyWorking: false, jobRole: "", officeAddress: "", salaryMode: "Bank transfer", sourceOfFund: "" });
const emptyRef = (): RefEntry => ({ id: uid(), name: "", designation: "", organization: "", email: "", mobile: "", country: "", relation: "" });
const emptyVisa = (): VisaEntry => ({ id: uid(), visaType: "", country: "", refusalDate: "", refusalReason: "" });

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) || typeof v === "object" ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

const STEPS = [
  { id: 1, title: "Basic & Contact", sections: ["A", "B", "C"], icon: "User" },
  { id: 2, title: "Education & English", sections: ["D", "F"], icon: "GraduationCap" },
  { id: 3, title: "Passport, Work & Sponsor", sections: ["E", "G", "J"], icon: "Briefcase" },
  { id: 4, title: "Visa History & Admission", sections: ["H", "I", "K"], icon: "Plane" },
] as const;

// =================================================================
// Small reusable bits
// =================================================================

function Required() {
  return <span className="text-[#E8501A]" aria-hidden>*</span>;
}

function AIHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-[#e8f0fb] text-[#0057B8] align-middle hover:bg-[#0057B8] hover:text-white">
          <Icon name="Sparkles" className="size-2.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <Label className="mb-1.5 text-xs font-semibold text-foreground">
      {children}
      {required && <Required />}
      {hint && <AIHint text={hint} />}
    </Label>
  );
}

function Field({
  label,
  required,
  hint,
  helper,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  helper?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <FieldLabel required={required} hint={hint}>
        {label}
      </FieldLabel>
      {children}
      {helper && <p className="text-[11px] text-muted-foreground">{helper}</p>}
    </div>
  );
}

function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 | 4 }) {
  const cls = cols === 1 ? "grid-cols-1" : cols === 3 ? "grid-cols-1 md:grid-cols-3" : cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2";
  return <div className={cn("gap-4", cls)}>{children}</div>;
}

function MiniHeader({ code, title, desc }: { code: string; title: string; desc?: string }) {
  return (
    <div className="mb-3 flex items-start gap-2.5 rounded-lg bg-[#e8f0fb]/60 p-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#0057B8] text-xs font-black text-white">
        {code}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#0057B8]">Section {code} — {title}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </div>
  );
}

function RepeatableCard({
  index,
  onRemove,
  canRemove,
  children,
  title,
}: {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-[#0057B8]/15 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-[#E8501A]/10 text-[10px] font-bold text-[#E8501A]">
            {index + 1}
          </span>
          <p className="text-xs font-bold text-foreground">{title}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Icon name="Trash2" className="size-3.5" />
          Remove
        </Button>
      </div>
      {children}
    </div>
  );
}

// =================================================================
// Step completion calculation
// =================================================================

function stepCompletion(form: FormState, step: number): number {
  const filled = (vals: (string | undefined)[]) => vals.filter((v) => v && String(v).trim() !== "").length;
  let total = 0, done = 0;

  if (step === 1) {
    const a = [form.leadSource, form.preferredCountry, form.counselor];
    const b = [form.firstName, form.lastName, form.nationality, form.dateOfBirth, form.gender, form.maritalStatus, form.cityOfBirth, form.countryOfBirth, form.presentAddress, form.permanentAddress];
    const c = [form.email, form.mobile, form.emergencyName, form.emergencyRelation, form.emergencyPhone];
    total = a.length + b.length + c.length;
    done = filled([...a, ...b, ...c]);
  } else if (step === 2) {
    total = 4;
    done = form.education.length > 0 ? 2 : 0;
    if (form.englishTestStatus === "RECEIVED") done += 2;
    else if (form.englishTestStatus === "PLANNING") done += 1;
    if (form.englishTests.length > 0 && form.englishTests[0].overallScore) done = Math.min(done + 1, 4);
  } else if (step === 3) {
    if (form.hasPassport) {
      const pe = [form.passportNumber, form.passportIssuePlace, form.passportIssueCountry, form.passportIssueDate, form.passportExpiryDate];
      total += pe.length;
      done += filled(pe);
    } else {
      total += 1;
      done += 1;
    }
    if (form.hasWorkExperience) {
      total += 2;
      done += form.workExperience.length > 0 ? 2 : 0;
    } else {
      total += 1;
      done += 1;
    }
    const j = [form.fundingStatus, form.sponsorRelation, form.bankStatementStatus, form.sponsorDocStatus];
    total += j.length;
    done += filled(j);
  } else if (step === 4) {
    total += form.recommendations.length > 0 ? 1 : 0;
    done += form.recommendations.length > 0 ? 1 : 0;
    if (form.hasPreviousVisa) {
      total += 1;
      done += form.visaHistory.length > 0 ? 1 : 0;
    } else {
      total += 1;
      done += 1;
    }
    if (form.previousRefusal) {
      const rf = [form.refusalDate, form.refusalReason];
      total += rf.length;
      done += filled(rf);
    } else {
      total += 1;
      done += 1;
    }
    const k = [form.studyDestination, form.programTitle, form.studyLevel, form.studyArea, form.intake, form.universityPreference];
    total += k.length;
    done += filled(k);
  }

  if (total === 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

// =================================================================
// Main component
// =================================================================

export function StudentProfileForm() {
  const { toast } = useToast();
  const [student, setStudent] = React.useState<StudentLite | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState<FormState>(() => ({
    leadSource: "WEBSITE",
    counselor: "",
    leadReference: "",
    preferredCountry: "",
    notes: "",
    welcomeEmail: true,
    firstName: "",
    lastName: "",
    nationality: "Bangladeshi",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "Single",
    cityOfBirth: "",
    countryOfBirth: "Bangladesh",
    presentAddress: "",
    permanentAddress: "",
    email: "",
    altEmail: "",
    mobile: "+880",
    altMobile: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
    education: [emptyEdu()],
    hasPassport: false,
    passportNumber: "",
    passportIssuePlace: "",
    passportIssueCountry: "Bangladesh",
    passportIssueDate: "",
    passportExpiryDate: "",
    englishTestStatus: "YET_TO_RECEIVE",
    englishPlannedDate: "",
    englishTests: [emptyEnglish()],
    hasWorkExperience: false,
    workExperience: [emptyWork()],
    recommendations: [emptyRef()],
    hasPreviousVisa: false,
    visaHistory: [],
    previousRefusal: false,
    refusalDate: "",
    refusalReason: "",
    previousImmigrationApp: "",
    dependentStatus: "None",
    dependentsCount: "0",
    medicalCondition: "None",
    criminalOffense: "No",
    riskNote: "",
    fundingStatus: "SELF_FUNDED",
    sponsorRelation: "Applicant",
    sourceOfFund: "",
    bankStatementStatus: "NOT_STARTED",
    sponsorDocStatus: "NOT_STARTED",
    studyDestination: "",
    programTitle: "",
    studyLevel: "",
    studyArea: "",
    intake: "",
    universityPreference: "",
    coursePreference: "",
  }));

  // Fetch student & prefill
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/students", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load students");
        const data = await res.json();
        if (!alive) return;
        const first = (data.students?.[0] as StudentLite) || null;
        if (!first) {
          setLoading(false);
          return;
        }
        // Fetch full detail to get JSON fields
        const fullRes = await fetch(`/api/students?id=${encodeURIComponent(first.id)}`, { cache: "no-store" });
        const fullData = fullRes.ok ? await fullRes.json() : null;
        const s = (fullData?.student as StudentLite) || first;
        setStudent(s);
        setForm((prev) => prefill(prev, s));
      } catch (e) {
        // ignore — keep empty form
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function prefill(prev: FormState, s: StudentLite): FormState {
    const edu = safeParse<any[]>(s.educationHistory, []);
    const eng = safeParse<any[]>(s.englishTests, []);
    const work = safeParse<any[]>(s.workExperience, []);
    const refs = safeParse<any[]>(s.recommendations, []);
    const visas = safeParse<any[]>(s.visaHistory, []);

    return {
      ...prev,
      leadSource: "WEBSITE",
      counselor: s.counselor?.name || "",
      leadReference: s.studentId || "",
      preferredCountry: s.studyDestination || "",
      notes: "",
      welcomeEmail: true,
      firstName: s.firstName || "",
      lastName: s.lastName || "",
      nationality: s.nationality || "Bangladeshi",
      dateOfBirth: s.dateOfBirth || "",
      gender: s.gender || "",
      maritalStatus: s.maritalStatus || "Single",
      cityOfBirth: s.cityOfBirth || "",
      countryOfBirth: s.countryOfBirth || "Bangladesh",
      presentAddress: s.presentAddress || "",
      permanentAddress: s.permanentAddress || "",
      email: s.email || "",
      altEmail: s.altEmail || "",
      mobile: s.mobile || "+880",
      altMobile: s.altMobile || "",
      emergencyName: s.emergencyName || "",
      emergencyRelation: s.emergencyRelation || "",
      emergencyPhone: s.emergencyPhone || "",
      education: edu.length > 0
        ? edu.map((e) => ({
            id: uid(),
            level: e.level || e.academicLevel || "",
            institute: e.institute || e.instituteName || "",
            group: e.group || e.department || "",
            country: e.country || "",
            city: e.city || "",
            board: e.board || "",
            resultType: e.resultType || "GPA",
            grade: e.grade || e.result || "",
            startYear: e.startYear || e.startDate || "",
            endYear: e.endYear || e.endDate || "",
            studyGap: e.studyGap || "",
          }))
        : [emptyEdu()],
      hasPassport: !!s.hasPassport,
      passportNumber: s.passportNumber || "",
      passportIssuePlace: s.passportIssuePlace || "",
      passportIssueCountry: s.passportIssueCountry || "Bangladesh",
      passportIssueDate: s.passportIssueDate || "",
      passportExpiryDate: s.passportExpiryDate || "",
      englishTestStatus: s.englishTestStatus || (eng.length > 0 ? "RECEIVED" : "YET_TO_RECEIVE"),
      englishPlannedDate: "",
      englishTests: eng.length > 0
        ? eng.map((t) => ({
            id: uid(),
            testName: t.testName || "IELTS",
            testDate: t.testDate || "",
            plannedDate: "",
            expirationDate: t.expirationDate || "",
            certificateNo: t.certificateNo || t.certificateNumber || "",
            overallScore: String(t.overallScore ?? ""),
            listening: String(t.listening ?? ""),
            speaking: String(t.speaking ?? ""),
            writing: String(t.writing ?? ""),
            reading: String(t.reading ?? ""),
          }))
        : [emptyEnglish()],
      hasWorkExperience: work.length > 0,
      workExperience: work.length > 0
        ? work.map((w) => ({
            id: uid(),
            company: w.company || w.companyName || "",
            designation: w.designation || "",
            department: w.department || "",
            startDate: w.startDate || "",
            endDate: w.endDate || "",
            currentlyWorking: !!w.currentlyWorking,
            jobRole: w.jobRole || "",
            officeAddress: w.officeAddress || "",
            salaryMode: w.salaryMode || "Bank transfer",
            sourceOfFund: w.sourceOfFund || "",
          }))
        : [emptyWork()],
      recommendations: refs.length > 0
        ? refs.map((r) => ({
            id: uid(),
            name: r.name || r.referenceName || "",
            designation: r.designation || "",
            organization: r.organization || "",
            email: r.email || "",
            mobile: r.mobile || "",
            country: r.country || "",
            relation: r.relation || r.relationWithStudent || "",
          }))
        : [emptyRef()],
      hasPreviousVisa: !!s.hasPreviousVisa,
      visaHistory: visas.length > 0
        ? visas.map((v) => ({
            id: uid(),
            visaType: v.visaType || "",
            country: v.country || "",
            refusalDate: v.refusalDate || "",
            refusalReason: v.refusalReason || "",
          }))
        : [],
      previousRefusal: !!s.previousRefusal,
      refusalDate: "",
      refusalReason: s.refusalDetail || "",
      previousImmigrationApp: "",
      dependentStatus: "None",
      dependentsCount: "0",
      medicalCondition: "None",
      criminalOffense: "No",
      riskNote: "",
      fundingStatus: s.fundingStatus || "SELF_FUNDED",
      sponsorRelation: s.sponsorRelation === "PARENTS" ? "Parents" : s.sponsorRelation === "SIBLING" ? "Sibling" : s.sponsorRelation === "APPLICANT" ? "Applicant" : s.sponsorRelation || "Applicant",
      sourceOfFund: s.sourceOfFund || "",
      bankStatementStatus: s.bankStatementStatus || "NOT_STARTED",
      sponsorDocStatus: s.sponsorDocStatus || "NOT_STARTED",
      studyDestination: s.studyDestination || "",
      programTitle: s.programTitle || "",
      studyLevel: s.studyLevel || "",
      studyArea: s.studyArea || "",
      intake: s.intake || "",
      universityPreference: s.universityPreference || "",
      coursePreference: "",
    };
  }

  // Generic field setter
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  // List helpers
  function updateList<K extends "education" | "englishTests" | "workExperience" | "recommendations" | "visaHistory">(
    key: K,
    id: string,
    patch: Partial<FormState[K][number]>
  ) {
    setForm((p) => ({
      ...p,
      [key]: (p[key] as any[]).map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }
  function addList<K extends "education" | "englishTests" | "workExperience" | "recommendations" | "visaHistory">(
    key: K,
    factory: () => FormState[K][number]
  ) {
    setForm((p) => ({ ...p, [key]: [...(p[key] as any[]), factory()] }));
  }
  function removeList<K extends "education" | "englishTests" | "workExperience" | "recommendations" | "visaHistory">(
    key: K,
    id: string
  ) {
    setForm((p) => {
      const arr = (p[key] as any[]).filter((it) => it.id !== id);
      return { ...p, [key]: arr.length === 0 ? [factory(key)] : arr };
    });
  }
  function factory(key: "education" | "englishTests" | "workExperience" | "recommendations" | "visaHistory") {
    if (key === "education") return emptyEdu() as any;
    if (key === "englishTests") return emptyEnglish() as any;
    if (key === "workExperience") return emptyWork() as any;
    if (key === "recommendations") return emptyRef() as any;
    return emptyVisa() as any;
  }

  function handleSaveDraft() {
    toast({
      title: "Draft saved",
      description: `Step ${step} progress saved locally. You can resume any time.`,
    });
  }
  function handleNext() {
    if (step < 4) {
      toast({
        title: `Step ${step} saved`,
        description: "Moving to the next step.",
      });
      setStep((s) => s + 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast({
        title: "Profile completed!",
        description: `All 11 sections saved. Your profile is now ${overallPct}% complete.`,
      });
    }
  }
  function handleBack() {
    if (step > 1) {
      setStep((s) => s - 1);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const stepPct = (n: number) => stepCompletion(form, n);
  const overallPct = Math.round(STEPS.reduce((acc, s) => acc + stepPct(s.id), 0) / STEPS.length);
  const currentStepPct = stepPct(step);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingGrid count={2} />
        <LoadingGrid count={4} />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title="Student Profile"
          subtitle="Complete your profile across 11 sections — 4 steps."
          icon="UserSquare"
          action={
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-[#0057B8]/15 bg-white px-3 py-1.5 sm:flex">
                <Icon name="Gauge" className="size-4 text-[#0057B8]" />
                <span className="text-xs font-semibold text-muted-foreground">Overall</span>
                <span className="text-sm font-bold text-[#0057B8] tabular-nums">{overallPct}%</span>
              </div>
              {student && (
                <Badge variant="outline" className="border-[#0057B8]/30 bg-[#e8f0fb] font-mono text-xs text-[#0057B8]">
                  <Icon name="Hash" className="size-3" />
                  {student.studentId}
                </Badge>
              )}
            </div>
          }
        />

        {/* Step indicator */}
        <div className="rounded-2xl border-2 border-[#0057B8]/15 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Stepper */}
            <div className="flex items-stretch gap-1 overflow-x-auto alo-scroll sm:gap-2">
              {STEPS.map((s, idx) => {
                const pct = stepPct(s.id);
                const isCurrent = step === s.id;
                const isComplete = pct === 100;
                const isPast = step > s.id;
                const clickable = isPast || isCurrent;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && setStep(s.id)}
                    className={cn(
                      "group flex min-w-[8.5rem] flex-1 items-center gap-3 rounded-xl border-2 p-3 text-left transition-all lg:min-w-[12rem]",
                      isCurrent
                        ? "border-[#0057B8] bg-gradient-to-br from-[#0057B8] to-[#0077E0] text-white shadow-md"
                        : isPast
                        ? "border-[#0057B8]/30 bg-[#e8f0fb]/60 hover:border-[#0057B8]/60"
                        : "border-muted bg-muted/30 opacity-70"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg font-bold",
                        isCurrent ? "bg-white/20 text-white" : isComplete ? "bg-emerald-500 text-white" : isPast ? "bg-[#0057B8] text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isComplete ? <Icon name="Check" className="size-4" /> : <Icon name={s.icon as any} className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", isCurrent ? "text-white/80" : "text-muted-foreground")}>
                          Step {s.id}
                        </p>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums", isCurrent ? "bg-white/20 text-white" : "bg-[#0057B8]/10 text-[#0057B8]")}>
                          {pct}%
                        </span>
                      </div>
                      <p className={cn("truncate text-xs font-semibold", isCurrent ? "text-white" : "text-foreground")}>
                        {s.title}
                      </p>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <Icon name="ChevronRight" className={cn("hidden size-4 shrink-0 lg:block", isCurrent ? "text-white/60" : "text-muted-foreground")} />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Current step progress */}
            <div className="flex shrink-0 items-center gap-3 rounded-xl bg-[#e8f0fb]/70 p-3 lg:min-w-[260px]">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0057B8]">Current Step Progress</p>
                <p className="text-xs font-semibold text-foreground">Step {step} · {STEPS[step - 1].title}</p>
                <Progress value={currentStepPct} className="mt-2 h-2 bg-white" />
              </div>
              <span className="text-2xl font-bold tabular-nums text-[#0057B8]">{currentStepPct}%</span>
            </div>
          </div>
        </div>

        {/* AI help banner */}
        <div className="flex flex-col items-start gap-3 rounded-xl border border-[#E8501A]/20 bg-[#fef5f0] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E8501A] text-white">
              <Icon name="Sparkles" className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Assistant is helping you fill this form</p>
              <p className="text-xs text-muted-foreground">
                Look for the <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-[#0057B8] text-white align-middle"><Icon name="Sparkles" className="size-2" /></span> icon next to fields for smart suggestions.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-[#E8501A]/40 text-[#E8501A] hover:bg-[#E8501A]/10 h-9"
            onClick={() => toast({ title: "AI autofill started", description: "Suggesting values based on your profile history." })}
          >
            <Icon name="Wand2" className="size-4" />
            Auto-fill with AI
          </Button>
        </div>

        {/* ============================================= */}
        {/* STEP 1: Basic & Contact (A, B, C)             */}
        {/* ============================================= */}
        {step === 1 && (
          <div className="space-y-6">
            {/* A. Lead Information */}
            <SectionCard title="Lead Information" icon="UserPlus" description="How this student joined ALO Education">
              <MiniHeader code="A" title="New Lead Information" desc="Where this student record originated" />
              <FormGrid>
                <Field label="Lead Source" required hint="AI suggests the source based on UTM parameters and contact history.">
                  <Select value={form.leadSource} onValueChange={(v) => set("leadSource", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Counselor" required helper="The counselor assigned to manage this student.">
                  <Input className="h-10 border-[#0057B8]/20" value={form.counselor} onChange={(e) => set("counselor", e.target.value)} placeholder="e.g. Farhana Yesmin" />
                </Field>
                <Field label="Lead Reference" helper="Auto-generated lead ID linked to this student.">
                  <Input className="h-10 border-[#0057B8]/20 font-mono text-xs" value={form.leadReference} onChange={(e) => set("leadReference", e.target.value)} placeholder="ALO-L-XXXXX" />
                </Field>
                <Field label="Preferred Destination Country" required>
                  <Select value={form.preferredCountry} onValueChange={(v) => set("preferredCountry", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FormGrid>
              <div className="mt-4">
                <Field label="Notes" helper="Internal counselor notes about the lead (not shown to student).">
                  <Textarea
                    className="border-[#0057B8]/20"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="e.g. Student is interested in September intake, prefers UK universities with scholarship options."
                  />
                </Field>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-[#e8f0fb]/60 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Send welcome email</p>
                  <p className="text-xs text-muted-foreground">Sends a branded welcome email to {form.email || "the student"}.</p>
                </div>
                <Switch checked={form.welcomeEmail} onCheckedChange={(v) => set("welcomeEmail", v)} />
              </div>
            </SectionCard>

            {/* B. Personal Information */}
            <SectionCard title="Personal Information" icon="User" description="Student's identity and personal details">
              <MiniHeader code="B" title="Personal Information" desc="Used for passport, visa & university applications" />
              <FormGrid>
                <Field label="First Name" required>
                  <Input className="h-10 border-[#0057B8]/20" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="e.g. Md. Rahim" />
                </Field>
                <Field label="Last Name" required>
                  <Input className="h-10 border-[#0057B8]/20" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="e.g. Hossain" />
                </Field>
                <Field label="Full Name" helper="Auto-computed from first & last name">
                  <Input className="h-10 border-[#0057B8]/20 bg-muted/30 font-medium" value={`${form.firstName} ${form.lastName}`.trim()} readOnly placeholder="—" />
                </Field>
                <Field label="Nationality" required>
                  <Input className="h-10 border-[#0057B8]/20" value={form.nationality} onChange={(e) => set("nationality", e.target.value)} placeholder="e.g. Bangladeshi" />
                </Field>
                <Field label="Date of Birth" required hint="Must match passport exactly.">
                  <Input type="date" className="h-10 border-[#0057B8]/20" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
                </Field>
                <Field label="Gender" required>
                  <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Marital Status">
                  <Select value={form.maritalStatus} onValueChange={(v) => set("maritalStatus", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="City of Birth" hint="Required for some visa applications.">
                  <Input className="h-10 border-[#0057B8]/20" value={form.cityOfBirth} onChange={(e) => set("cityOfBirth", e.target.value)} placeholder="e.g. Dhaka" />
                </Field>
                <Field label="Country of Birth">
                  <Input className="h-10 border-[#0057B8]/20" value={form.countryOfBirth} onChange={(e) => set("countryOfBirth", e.target.value)} placeholder="e.g. Bangladesh" />
                </Field>
              </FormGrid>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Present Address" required>
                  <Textarea className="border-[#0057B8]/20" rows={2} value={form.presentAddress} onChange={(e) => set("presentAddress", e.target.value)} placeholder="House, road, area, city, country" />
                </Field>
                <Field label="Permanent Address" helper="Required if different from present address.">
                  <Textarea className="border-[#0057B8]/20" rows={2} value={form.permanentAddress} onChange={(e) => set("permanentAddress", e.target.value)} placeholder="Village, post office, district, country" />
                </Field>
              </div>
            </SectionCard>

            {/* C. Contact Information */}
            <SectionCard title="Contact Information" icon="Phone" description="How to reach the student">
              <MiniHeader code="C" title="Contact Information" desc="At least one verified phone & email required" />
              <FormGrid>
                <Field label="Primary Email" required hint="Used for login & all official communication.">
                  <Input type="email" className="h-10 border-[#0057B8]/20" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="student@example.com" />
                </Field>
                <Field label="Alternative Email">
                  <Input type="email" className="h-10 border-[#0057B8]/20" value={form.altEmail} onChange={(e) => set("altEmail", e.target.value)} placeholder="backup@example.com" />
                </Field>
                <Field label="Mobile Number" required helper="Format: +8801XXXXXXXXX">
                  <Input className="h-10 border-[#0057B8]/20" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="+8801XXXXXXXXX" />
                </Field>
                <Field label="Alternative Mobile">
                  <Input className="h-10 border-[#0057B8]/20" value={form.altMobile} onChange={(e) => set("altMobile", e.target.value)} placeholder="+8801XXXXXXXXX" />
                </Field>
                <Field label="Emergency Contact Name" required>
                  <Input className="h-10 border-[#0057B8]/20" value={form.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} placeholder="e.g. Mohammed Father" />
                </Field>
                <Field label="Relation" required>
                  <Select value={form.emergencyRelation} onValueChange={(v) => set("emergencyRelation", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20">
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FormGrid>
              <div className="mt-4">
                <Field label="Emergency Contact Number" required className="max-w-md">
                  <Input className="h-10 border-[#0057B8]/20" value={form.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} placeholder="+8801XXXXXXXXX" />
                </Field>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ============================================= */}
        {/* STEP 2: Education & English (D, F)            */}
        {/* ============================================= */}
        {step === 2 && (
          <div className="space-y-6">
            {/* D. Education History */}
            <SectionCard
              title="Education History"
              icon="GraduationCap"
              description="All academic qualifications from SSC to highest degree"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb] h-9"
                  onClick={() => addList("education", emptyEdu)}
                >
                  <Icon name="Plus" className="size-4" />
                  Add Education
                </Button>
              }
            >
              <MiniHeader code="D" title="Education History" desc="Add each academic level separately — most recent first" />
              <div className="space-y-3">
                {form.education.map((e, idx) => (
                  <RepeatableCard
                    key={e.id}
                    index={idx}
                    title={`Education Entry #${idx + 1}`}
                    canRemove={form.education.length > 1}
                    onRemove={() => removeList("education", e.id)}
                  >
                    <FormGrid cols={3}>
                      <Field label="Academic Level" required>
                        <Select value={e.level} onValueChange={(v) => updateList("education", e.id, { level: v })}>
                          <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue placeholder="Select level" /></SelectTrigger>
                          <SelectContent>
                            {ACADEMIC_LEVELS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Institute Name" required className="md:col-span-2">
                        <Input className="h-10 border-[#0057B8]/20" value={e.institute} onChange={(ev) => updateList("education", e.id, { institute: ev.target.value })} placeholder="e.g. Dhaka College" />
                      </Field>
                      <Field label="Group / Department">
                        <Input className="h-10 border-[#0057B8]/20" value={e.group} onChange={(ev) => updateList("education", e.id, { group: ev.target.value })} placeholder="e.g. Science / CSE" />
                      </Field>
                      <Field label="Country of Study">
                        <Input className="h-10 border-[#0057B8]/20" value={e.country} onChange={(ev) => updateList("education", e.id, { country: ev.target.value })} placeholder="e.g. Bangladesh" />
                      </Field>
                      <Field label="City">
                        <Input className="h-10 border-[#0057B8]/20" value={e.city} onChange={(ev) => updateList("education", e.id, { city: ev.target.value })} placeholder="e.g. Dhaka" />
                      </Field>
                      <Field label="Board / University">
                        <Input className="h-10 border-[#0057B8]/20" value={e.board} onChange={(ev) => updateList("education", e.id, { board: ev.target.value })} placeholder="e.g. Dhaka Education Board" />
                      </Field>
                      <Field label="Result Type" required>
                        <Select value={e.resultType} onValueChange={(v) => updateList("education", e.id, { resultType: v })}>
                          <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {RESULT_TYPES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Grade / Result" required hint="Out of 5 for GPA, 4 for CGPA, 100 for percentage.">
                        <Input className="h-10 border-[#0057B8]/20" value={e.grade} onChange={(ev) => updateList("education", e.id, { grade: ev.target.value })} placeholder="e.g. 4.85 / 3.72 / 87%" />
                      </Field>
                      <Field label="Start Year/Month">
                        <Input className="h-10 border-[#0057B8]/20" value={e.startYear} onChange={(ev) => updateList("education", e.id, { startYear: ev.target.value })} placeholder="e.g. 2018-01" />
                      </Field>
                      <Field label="End Year/Month">
                        <Input className="h-10 border-[#0057B8]/20" value={e.endYear} onChange={(ev) => updateList("education", e.id, { endYear: ev.target.value })} placeholder="e.g. 2022-06" />
                      </Field>
                      <Field label="Study Gap Info" className="md:col-span-3" hint="If there's a gap > 6 months between academic levels, explain. Visa officers check this.">
                        <Input className="h-10 border-[#0057B8]/20" value={e.studyGap} onChange={(ev) => updateList("education", e.id, { studyGap: ev.target.value })} placeholder="e.g. 1 year gap — prepared for IELTS" />
                      </Field>
                    </FormGrid>
                  </RepeatableCard>
                ))}
              </div>
            </SectionCard>

            {/* F. English Test Score */}
            <SectionCard
              title="English Test Score"
              icon="Languages"
              description="IELTS, PTE, TOEFL, DET and other English proficiency tests"
            >
              <MiniHeader code="F" title="English Test Score" desc="Used to determine university & visa eligibility" />
              {/* Status radio */}
              <FieldLabel required>Have you taken any English test yet?</FieldLabel>
              <RadioGroup
                value={form.englishTestStatus}
                onValueChange={(v) => set("englishTestStatus", v)}
                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
              >
                {[
                  { value: "RECEIVED", label: "Yes, I have a score", icon: "CheckCircle2" },
                  { value: "YET_TO_RECEIVE", label: "Yet to receive result", icon: "Clock" },
                  { value: "PLANNING", label: "Planning to take a test", icon: "CalendarPlus" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-3 transition-all",
                      form.englishTestStatus === opt.value ? "border-[#0057B8] bg-[#e8f0fb]/60" : "border-[#0057B8]/15 hover:border-[#0057B8]/40"
                    )}
                  >
                    <RadioGroupItem value={opt.value} id={`eng-${opt.value}`} />
                    <Icon name={opt.icon as any} className="size-4 text-[#0057B8]" />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>

              {/* Free mock eligibility banner */}
              <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-[#E8501A]/20 bg-[#fef5f0] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#E8501A] text-white">
                    <Icon name="Gift" className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">ALO students get 3 free mock tests</p>
                    <p className="text-xs text-muted-foreground">Practice IELTS, PTE, or DET in real-exam conditions.</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#E8501A]/40 text-[#E8501A] hover:bg-[#E8501A]/10 h-9"
                  onClick={() => toast({ title: "Mock test reserved", description: "Your free slot is reserved — check the English Test page." })}
                >
                  <Icon name="Sparkles" className="size-4" />
                  Claim Free Mock
                </Button>
              </div>

              {/* If PLANNING */}
              {form.englishTestStatus === "PLANNING" && (
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Planned Test Date" required>
                    <Input type="date" className="h-10 border-[#0057B8]/20" value={form.englishPlannedDate} onChange={(e) => set("englishPlannedDate", e.target.value)} />
                  </Field>
                  <Field label="AI Mock Test Recommendation" hint="AI suggests the best test type based on your destination & program.">
                    <Select defaultValue="IELTS">
                      <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ENGLISH_TESTS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}

              {/* If RECEIVED — show entry cards */}
              {form.englishTestStatus === "RECEIVED" && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Test Scores</p>
                    <Button type="button" variant="outline" size="sm" className="border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb] h-9" onClick={() => addList("englishTests", emptyEnglish)}>
                      <Icon name="Plus" className="size-4" />
                      Add Test Score
                    </Button>
                  </div>
                  {form.englishTests.map((t, idx) => (
                    <RepeatableCard
                      key={t.id}
                      index={idx}
                      title={`English Test #${idx + 1}`}
                      canRemove={form.englishTests.length > 1}
                      onRemove={() => removeList("englishTests", t.id)}
                    >
                      <FormGrid cols={3}>
                        <Field label="Test Name" required>
                          <Select value={t.testName} onValueChange={(v) => updateList("englishTests", t.id, { testName: v })}>
                            <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue placeholder="Select test" /></SelectTrigger>
                            <SelectContent>
                              {ENGLISH_TESTS.map((tt) => (<SelectItem key={tt} value={tt}>{tt}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Test Date" required>
                          <Input type="date" className="h-10 border-[#0057B8]/20" value={t.testDate} onChange={(ev) => updateList("englishTests", t.id, { testDate: ev.target.value })} />
                        </Field>
                        <Field label="Expiration Date" helper="Most tests are valid for 2 years.">
                          <Input type="date" className="h-10 border-[#0057B8]/20" value={t.expirationDate} onChange={(ev) => updateList("englishTests", t.id, { expirationDate: ev.target.value })} />
                        </Field>
                        <Field label="Certificate / TRT Number" required>
                          <Input className="h-10 border-[#0057B8]/20" value={t.certificateNo} onChange={(ev) => updateList("englishTests", t.id, { certificateNo: ev.target.value })} placeholder="e.g. IELTS-XXXXXXXX" />
                        </Field>
                        <Field label="Overall Score" required hint="Enter band/score as shown on certificate.">
                          <Input className="h-10 border-[#0057B8]/20" value={t.overallScore} onChange={(ev) => updateList("englishTests", t.id, { overallScore: ev.target.value })} placeholder="e.g. 6.5" />
                        </Field>
                      </FormGrid>
                      <div className="mt-3 rounded-lg bg-[#e8f0fb]/50 p-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#0057B8]">Sectional Scores</p>
                        <FormGrid cols={4}>
                          <Field label="Listening">
                            <Input className="h-10 border-[#0057B8]/20" value={t.listening} onChange={(ev) => updateList("englishTests", t.id, { listening: ev.target.value })} placeholder="6.5" />
                          </Field>
                          <Field label="Reading">
                            <Input className="h-10 border-[#0057B8]/20" value={t.reading} onChange={(ev) => updateList("englishTests", t.id, { reading: ev.target.value })} placeholder="7.0" />
                          </Field>
                          <Field label="Writing">
                            <Input className="h-10 border-[#0057B8]/20" value={t.writing} onChange={(ev) => updateList("englishTests", t.id, { writing: ev.target.value })} placeholder="6.0" />
                          </Field>
                          <Field label="Speaking">
                            <Input className="h-10 border-[#0057B8]/20" value={t.speaking} onChange={(ev) => updateList("englishTests", t.id, { speaking: ev.target.value })} placeholder="6.5" />
                          </Field>
                        </FormGrid>
                      </div>
                    </RepeatableCard>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ============================================= */}
        {/* STEP 3: Passport, Work & Sponsor (E, G, J)    */}
        {/* ============================================= */}
        {step === 3 && (
          <div className="space-y-6">
            {/* E. Passport Details */}
            <SectionCard title="Passport Details" icon="BookUser" description="A valid passport is required for university & visa applications">
              <MiniHeader code="E" title="Passport Details" desc="Must be valid for at least 6 months beyond intake date" />
              <FieldLabel required>Do you have a passport?</FieldLabel>
              <RadioGroup value={form.hasPassport ? "yes" : "no"} onValueChange={(v) => set("hasPassport", v === "yes")} className="grid grid-cols-2 gap-2 sm:max-w-md">
                {[
                  { value: "yes", label: "Yes, I have one", icon: "CheckCircle2" },
                  { value: "no", label: "No, not yet", icon: "XCircle" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-3 transition-all",
                      (form.hasPassport ? "yes" : "no") === opt.value ? "border-[#0057B8] bg-[#e8f0fb]/60" : "border-[#0057B8]/15 hover:border-[#0057B8]/40"
                    )}
                  >
                    <RadioGroupItem value={opt.value} id={`pass-${opt.value}`} />
                    <Icon name={opt.icon as any} className="size-4 text-[#0057B8]" />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>

              {form.hasPassport ? (
                <div className="mt-4">
                  <FormGrid>
                    <Field label="Passport Number" required hint="Enter exactly as printed — no spaces.">
                      <Input className="h-10 border-[#0057B8]/20 font-mono uppercase" value={form.passportNumber} onChange={(e) => set("passportNumber", e.target.value)} placeholder="e.g. BR0123456" />
                    </Field>
                    <Field label="Place of Issue" required>
                      <Input className="h-10 border-[#0057B8]/20" value={form.passportIssuePlace} onChange={(e) => set("passportIssuePlace", e.target.value)} placeholder="e.g. Dhaka" />
                    </Field>
                    <Field label="Issue Country" required>
                      <Input className="h-10 border-[#0057B8]/20" value={form.passportIssueCountry} onChange={(e) => set("passportIssueCountry", e.target.value)} placeholder="e.g. Bangladesh" />
                    </Field>
                    <Field label="Issue Date" required>
                      <Input type="date" className="h-10 border-[#0057B8]/20" value={form.passportIssueDate} onChange={(e) => set("passportIssueDate", e.target.value)} />
                    </Field>
                    <Field label="Expiry Date" required hint="AI warns you if expiry is too close to your travel date.">
                      <Input type="date" className="h-10 border-[#0057B8]/20" value={form.passportExpiryDate} onChange={(e) => set("passportExpiryDate", e.target.value)} />
                    </Field>
                  </FormGrid>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-amber-50 p-3 text-amber-800">
                  <Icon name="TriangleAlert" className="size-5 shrink-0" />
                  <p className="text-xs">Apply for a passport as soon as possible — most universities require a copy during application.</p>
                </div>
              )}
            </SectionCard>

            {/* G. Work Experience */}
            <SectionCard
              title="Work Experience"
              icon="Briefcase"
              description="Relevant work experience strengthens your application"
              action={
                form.hasWorkExperience ? (
                  <Button type="button" variant="outline" size="sm" className="border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb] h-9" onClick={() => addList("workExperience", emptyWork)}>
                    <Icon name="Plus" className="size-4" />
                    Add Experience
                  </Button>
                ) : undefined
              }
            >
              <MiniHeader code="G" title="Work Experience" desc="Especially important for MBA, Masters & visa applications" />
              <FieldLabel required>Do you have any work experience?</FieldLabel>
              <RadioGroup value={form.hasWorkExperience ? "yes" : "no"} onValueChange={(v) => set("hasWorkExperience", v === "yes")} className="grid grid-cols-2 gap-2 sm:max-w-md">
                {[
                  { value: "yes", label: "Yes, I've worked", icon: "Briefcase" },
                  { value: "no", label: "No work experience", icon: "School" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-3 transition-all",
                      (form.hasWorkExperience ? "yes" : "no") === opt.value ? "border-[#0057B8] bg-[#e8f0fb]/60" : "border-[#0057B8]/15 hover:border-[#0057B8]/40"
                    )}
                  >
                    <RadioGroupItem value={opt.value} id={`work-${opt.value}`} />
                    <Icon name={opt.icon as any} className="size-4 text-[#0057B8]" />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>

              {form.hasWorkExperience && (
                <div className="mt-4 space-y-3">
                  {form.workExperience.map((w, idx) => (
                    <RepeatableCard
                      key={w.id}
                      index={idx}
                      title={`Work Experience #${idx + 1}`}
                      canRemove={form.workExperience.length > 1}
                      onRemove={() => removeList("workExperience", w.id)}
                    >
                      <FormGrid cols={3}>
                        <Field label="Company Name" required>
                          <Input className="h-10 border-[#0057B8]/20" value={w.company} onChange={(ev) => updateList("workExperience", w.id, { company: ev.target.value })} placeholder="e.g. Brain Station 23" />
                        </Field>
                        <Field label="Designation" required>
                          <Input className="h-10 border-[#0057B8]/20" value={w.designation} onChange={(ev) => updateList("workExperience", w.id, { designation: ev.target.value })} placeholder="e.g. Software Engineer" />
                        </Field>
                        <Field label="Department">
                          <Input className="h-10 border-[#0057B8]/20" value={w.department} onChange={(ev) => updateList("workExperience", w.id, { department: ev.target.value })} placeholder="e.g. Engineering" />
                        </Field>
                        <Field label="Start Date" required>
                          <Input type="month" className="h-10 border-[#0057B8]/20" value={w.startDate} onChange={(ev) => updateList("workExperience", w.id, { startDate: ev.target.value })} />
                        </Field>
                        <Field label="End Date" helper="Leave empty if currently working here.">
                          <Input type="month" className="h-10 border-[#0057B8]/20" value={w.endDate} onChange={(ev) => updateList("workExperience", w.id, { endDate: ev.target.value })} disabled={w.currentlyWorking} />
                        </Field>
                        <Field label="Job Role">
                          <Input className="h-10 border-[#0057B8]/20" value={w.jobRole} onChange={(ev) => updateList("workExperience", w.id, { jobRole: ev.target.value })} placeholder="e.g. Backend development" />
                        </Field>
                      </FormGrid>
                      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Office Address">
                          <Textarea className="border-[#0057B8]/20" rows={2} value={w.officeAddress} onChange={(ev) => updateList("workExperience", w.id, { officeAddress: ev.target.value })} placeholder="Full office address" />
                        </Field>
                        <div className="grid grid-cols-1 gap-3">
                          <Field label="Mode of Salary" hint="Bank transfer strengthens financial credibility for visa.">
                            <Select value={w.salaryMode} onValueChange={(v) => updateList("workExperience", w.id, { salaryMode: v })}>
                              <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {SALARY_MODES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label="Source of Fund" helper="If salary is the primary funding source for studies.">
                            <Input className="h-10 border-[#0057B8]/20" value={w.sourceOfFund} onChange={(ev) => updateList("workExperience", w.id, { sourceOfFund: ev.target.value })} placeholder="e.g. Monthly salary" />
                          </Field>
                        </div>
                      </div>
                      <label className="mt-3 flex items-center gap-2.5 rounded-lg bg-[#e8f0fb]/60 p-3">
                        <Checkbox checked={w.currentlyWorking} onCheckedChange={(v) => updateList("workExperience", w.id, { currentlyWorking: !!v, endDate: v ? "" : w.endDate })} />
                        <span className="text-xs font-semibold text-foreground">I currently work here</span>
                      </label>
                    </RepeatableCard>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* J. Funding & Sponsor */}
            <SectionCard title="Funding & Sponsor" icon="Wallet" description="How the student will finance their studies abroad">
              <MiniHeader code="J" title="Funding & Sponsor" desc="Visa officers verify this carefully" />
              <FormGrid>
                <Field label="Funding Status" required hint="AI suggests based on bank statement & sponsor documents.">
                  <Select value={form.fundingStatus} onValueChange={(v) => set("fundingStatus", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FUNDING_STATUSES.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Sponsor Relation" required>
                  <Select value={form.sponsorRelation} onValueChange={(v) => set("sponsorRelation", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPONSOR_RELATIONS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Source of Fund" className="md:col-span-2" hint="e.g. Father's business, fixed deposit, education loan.">
                  <Input className="h-10 border-[#0057B8]/20" value={form.sourceOfFund} onChange={(e) => set("sourceOfFund", e.target.value)} placeholder="e.g. Father's business income" />
                </Field>
                <Field label="Bank Statement Status" required>
                  <Select value={form.bankStatementStatus} onValueChange={(v) => set("bankStatementStatus", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_STATUSES.map((d) => (<SelectItem key={d} value={d}>{d.replace(/_/g, " ")}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Sponsor Document Status" required>
                  <Select value={form.sponsorDocStatus} onValueChange={(v) => set("sponsorDocStatus", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_STATUSES.map((d) => (<SelectItem key={d} value={d}>{d.replace(/_/g, " ")}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </Field>
              </FormGrid>
            </SectionCard>
          </div>
        )}

        {/* ============================================= */}
        {/* STEP 4: Visa & Admission (H, I, K)            */}
        {/* ============================================= */}
        {step === 4 && (
          <div className="space-y-6">
            {/* H. Recommendations / Reference */}
            <SectionCard
              title="Recommendations / References"
              icon="Users"
              description="Academic or professional referees for your application"
              action={
                <Button type="button" variant="outline" size="sm" className="border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb] h-9" onClick={() => addList("recommendations", emptyRef)}>
                  <Icon name="Plus" className="size-4" />
                  Add Referee
                </Button>
              }
            >
              <MiniHeader code="H" title="Recommendations / Reference" desc="Usually 2 academic referees are required" />
              <div className="space-y-3">
                {form.recommendations.map((r, idx) => (
                  <RepeatableCard
                    key={r.id}
                    index={idx}
                    title={`Referee #${idx + 1}`}
                    canRemove={form.recommendations.length > 1}
                    onRemove={() => removeList("recommendations", r.id)}
                  >
                    <FormGrid cols={3}>
                      <Field label="Reference Name" required>
                        <Input className="h-10 border-[#0057B8]/20" value={r.name} onChange={(ev) => updateList("recommendations", r.id, { name: ev.target.value })} placeholder="e.g. Prof. Dr. Karim" />
                      </Field>
                      <Field label="Designation" required>
                        <Input className="h-10 border-[#0057B8]/20" value={r.designation} onChange={(ev) => updateList("recommendations", r.id, { designation: ev.target.value })} placeholder="e.g. Professor & Head" />
                      </Field>
                      <Field label="Organization" required>
                        <Input className="h-10 border-[#0057B8]/20" value={r.organization} onChange={(ev) => updateList("recommendations", r.id, { organization: ev.target.value })} placeholder="e.g. BUET" />
                      </Field>
                      <Field label="Email" required>
                        <Input type="email" className="h-10 border-[#0057B8]/20" value={r.email} onChange={(ev) => updateList("recommendations", r.id, { email: ev.target.value })} placeholder="referee@example.edu" />
                      </Field>
                      <Field label="Mobile">
                        <Input className="h-10 border-[#0057B8]/20" value={r.mobile} onChange={(ev) => updateList("recommendations", r.id, { mobile: ev.target.value })} placeholder="+8801XXXXXXXXX" />
                      </Field>
                      <Field label="Country">
                        <Input className="h-10 border-[#0057B8]/20" value={r.country} onChange={(ev) => updateList("recommendations", r.id, { country: ev.target.value })} placeholder="Bangladesh" />
                      </Field>
                      <Field label="Relation with Student" className="md:col-span-3" hint="Academic, professional, or personal.">
                        <Input className="h-10 border-[#0057B8]/20" value={r.relation} onChange={(ev) => updateList("recommendations", r.id, { relation: ev.target.value })} placeholder="e.g. Thesis supervisor" />
                      </Field>
                    </FormGrid>
                  </RepeatableCard>
                ))}
              </div>
            </SectionCard>

            {/* I. Background & Visa History */}
            <SectionCard
              title="Background & Visa History"
              icon="ShieldAlert"
              description="Previous visa applications, refusals, and background checks"
              action={
                form.hasPreviousVisa ? (
                  <Button type="button" variant="outline" size="sm" className="border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb] h-9" onClick={() => addList("visaHistory", emptyVisa)}>
                    <Icon name="Plus" className="size-4" />
                    Add Visa Record
                  </Button>
                ) : undefined
              }
            >
              <MiniHeader code="I" title="Background & Visa History" desc="Honest disclosure is critical — withholding can lead to permanent bans" />

              <FieldLabel required>Have you ever applied for any visa before?</FieldLabel>
              <RadioGroup value={form.hasPreviousVisa ? "yes" : "no"} onValueChange={(v) => set("hasPreviousVisa", v === "yes")} className="grid grid-cols-2 gap-2 sm:max-w-md">
                {[
                  { value: "yes", label: "Yes, applied before", icon: "Plane" },
                  { value: "no", label: "No, first time", icon: "PlaneTakeoff" },
                ].map((opt) => (
                  <label key={opt.value} className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-3 transition-all", (form.hasPreviousVisa ? "yes" : "no") === opt.value ? "border-[#0057B8] bg-[#e8f0fb]/60" : "border-[#0057B8]/15 hover:border-[#0057B8]/40")}>
                    <RadioGroupItem value={opt.value} id={`vis-${opt.value}`} />
                    <Icon name={opt.icon as any} className="size-4 text-[#0057B8]" />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>

              {form.hasPreviousVisa && (
                <div className="mt-4 space-y-3">
                  {form.visaHistory.length === 0 ? (
                    <EmptyState icon="Plane" title="No visa records added" description="Add each previous visa application, including refusals." action={<Button type="button" size="sm" className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-9" onClick={() => addList("visaHistory", emptyVisa)}><Icon name="Plus" className="size-4" />Add Visa Record</Button>} />
                  ) : (
                    form.visaHistory.map((v, idx) => (
                      <RepeatableCard key={v.id} index={idx} title={`Visa Record #${idx + 1}`} canRemove={form.visaHistory.length > 0} onRemove={() => removeList("visaHistory", v.id)}>
                        <FormGrid>
                          <Field label="Visa Type">
                            <Input className="h-10 border-[#0057B8]/20" value={v.visaType} onChange={(ev) => updateList("visaHistory", v.id, { visaType: ev.target.value })} placeholder="e.g. Student Visa, Tourist" />
                          </Field>
                          <Field label="Applied Country">
                            <Input className="h-10 border-[#0057B8]/20" value={v.country} onChange={(ev) => updateList("visaHistory", v.id, { country: ev.target.value })} placeholder="e.g. UK" />
                          </Field>
                          <Field label="Refusal Date" helper="Leave empty if approved.">
                            <Input type="date" className="h-10 border-[#0057B8]/20" value={v.refusalDate} onChange={(ev) => updateList("visaHistory", v.id, { refusalDate: ev.target.value })} />
                          </Field>
                          <Field label="Refusal Reason" className="md:col-span-2">
                            <Textarea className="border-[#0057B8]/20" rows={2} value={v.refusalReason} onChange={(ev) => updateList("visaHistory", v.id, { refusalReason: ev.target.value })} placeholder="e.g. Insufficient funds evidence" />
                          </Field>
                        </FormGrid>
                      </RepeatableCard>
                    ))
                  )}
                </div>
              )}

              <div className="mt-4">
                <FieldLabel required>Any previous visa refusal?</FieldLabel>
                <RadioGroup value={form.previousRefusal ? "yes" : "no"} onValueChange={(v) => set("previousRefusal", v === "yes")} className="grid grid-cols-2 gap-2 sm:max-w-md">
                  {[
                    { value: "yes", label: "Yes, refused before", icon: "XCircle" },
                    { value: "no", label: "No refusals", icon: "CheckCircle2" },
                  ].map((opt) => (
                    <label key={opt.value} className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-3 transition-all", (form.previousRefusal ? "yes" : "no") === opt.value ? (opt.value === "yes" ? "border-red-400 bg-red-50" : "border-emerald-400 bg-emerald-50") : "border-[#0057B8]/15 hover:border-[#0057B8]/40")}>
                      <RadioGroupItem value={opt.value} id={`ref-${opt.value}`} />
                      <Icon name={opt.icon as any} className={cn("size-4", opt.value === "yes" ? "text-red-500" : "text-emerald-500")} />
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>

                {form.previousRefusal && (
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field label="Refusal Date" required>
                      <Input type="date" className="h-10 border-[#0057B8]/20" value={form.refusalDate} onChange={(e) => set("refusalDate", e.target.value)} />
                    </Field>
                    <Field label="Refusal Reason" required className="md:col-span-2">
                      <Textarea className="border-[#0057B8]/20" rows={2} value={form.refusalReason} onChange={(e) => set("refusalReason", e.target.value)} placeholder="Explain in detail — visa officer will review." />
                    </Field>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <FormGrid cols={3}>
                  <Field label="Previous Immigration Application" hint="Any prior application to immigration, even if withdrawn.">
                    <Input className="h-10 border-[#0057B8]/20" value={form.previousImmigrationApp} onChange={(e) => set("previousImmigrationApp", e.target.value)} placeholder="e.g. None / Express Entry 2022" />
                  </Field>
                  <Field label="Dependent Status">
                    <Select value={form.dependentStatus} onValueChange={(v) => set("dependentStatus", v)}>
                      <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEPENDENT_STATUSES.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Number of Dependents">
                    <Input type="number" min={0} className="h-10 border-[#0057B8]/20" value={form.dependentsCount} onChange={(e) => set("dependentsCount", e.target.value)} placeholder="0" />
                  </Field>
                </FormGrid>
              </div>

              <div className="mt-4">
                <FormGrid cols={3}>
                  <Field label="Medical Condition" hint="Any condition requiring ongoing treatment abroad.">
                    <Select value={form.medicalCondition} onValueChange={(v) => set("medicalCondition", v)}>
                      <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MEDICAL_OPTIONS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Criminal Offense" hint="Honest disclosure is mandatory.">
                    <Select value={form.criminalOffense} onValueChange={(v) => set("criminalOffense", v)}>
                      <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CRIMINAL_OPTIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Any Risk Note" hint="Internal note for visa officer review.">
                    <Input className="h-10 border-[#0057B8]/20" value={form.riskNote} onChange={(e) => set("riskNote", e.target.value)} placeholder="e.g. None" />
                  </Field>
                </FormGrid>
              </div>
            </SectionCard>

            {/* K. Admission Preference */}
            <SectionCard title="Admission Preference" icon="Compass" description="What and where the student wants to study">
              <MiniHeader code="K" title="Admission Preference" desc="Used by AI to match universities & courses" />
              <FormGrid cols={3}>
                <Field label="Study Destination" required hint="AI suggests best-fit countries based on your profile & budget.">
                  <Select value={form.studyDestination} onValueChange={(v) => set("studyDestination", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue placeholder="Select destination" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Program / Course Title" required className="md:col-span-2">
                  <Input className="h-10 border-[#0057B8]/20" value={form.programTitle} onChange={(e) => set("programTitle", e.target.value)} placeholder="e.g. MSc Computer Science" />
                </Field>
                <Field label="Study Level" required>
                  <Select value={form.studyLevel} onValueChange={(v) => set("studyLevel", v)}>
                    <SelectTrigger className="h-10 w-full border-[#0057B8]/20"><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      {STUDY_LEVELS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Study Area" required>
                  <Input className="h-10 border-[#0057B8]/20" value={form.studyArea} onChange={(e) => set("studyArea", e.target.value)} placeholder="e.g. Computer Science" />
                </Field>
                <Field label="Intake" required hint="Sep / Jan / May — main intakes for most destinations.">
                  <Input className="h-10 border-[#0057B8]/20" value={form.intake} onChange={(e) => set("intake", e.target.value)} placeholder="e.g. September 2025" />
                </Field>
                <Field label="University Preference" className="md:col-span-2" hint="List preferred universities separated by commas.">
                  <Input className="h-10 border-[#0057B8]/20" value={form.universityPreference} onChange={(e) => set("universityPreference", e.target.value)} placeholder="e.g. University of Manchester, University of Edinburgh" />
                </Field>
                <Field label="Course Preference" className="md:col-span-3">
                  <Textarea className="border-[#0057B8]/20" rows={2} value={form.coursePreference} onChange={(e) => set("coursePreference", e.target.value)} placeholder="Specific course modules, specializations, or career outcomes you're targeting." />
                </Field>
              </FormGrid>
            </SectionCard>
          </div>
        )}

        {/* Navigation */}
        <div className="sticky bottom-4 z-20">
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#0057B8]/15 bg-white/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-[#0057B8]/30 text-[#0057B8] hover:bg-[#e8f0fb] h-11"
                onClick={handleSaveDraft}
              >
                <Icon name="Save" className="size-4" />
                Save Draft
              </Button>
              <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <Icon name="Info" className="size-3.5" />
                Step {step} of {STEPS.length} · {currentStepPct}% complete
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-11 text-muted-foreground hover:bg-muted"
                onClick={handleBack}
                disabled={step === 1}
              >
                <Icon name="ArrowLeft" className="size-4" />
                Back
              </Button>
              <Button
                className="bg-[#E8501A] hover:bg-[#E8501A]/90 text-white h-11 px-6"
                onClick={handleNext}
              >
                {step === 4 ? (
                  <>
                    <Icon name="CheckCircle2" className="size-4" />
                    Complete Profile
                  </>
                ) : (
                  <>
                    Save &amp; Continue
                    <Icon name="ArrowRight" className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Completion summary footer */}
        <div className="rounded-2xl border border-[#0057B8]/15 bg-[#e8f0fb]/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#0057B8] text-white">
                <Icon name="Gauge" className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0057B8]">Profile Completion: {overallPct}%</p>
                <p className="text-xs text-muted-foreground">
                  {overallPct === 100
                    ? "All sections complete — your profile is ready for submission."
                    : `${STEPS.filter((s) => stepPct(s.id) === 100).length} of ${STEPS.length} steps complete. Keep going!`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STEPS.map((s) => (
                <span
                  key={s.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
                    stepPct(s.id) === 100 ? "bg-emerald-100 text-emerald-700" : stepPct(s.id) > 0 ? "bg-[#0057B8]/10 text-[#0057B8]" : "bg-muted text-muted-foreground"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  Step {s.id}: {stepPct(s.id)}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
