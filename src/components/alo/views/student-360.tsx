"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  StatusBadge,
  SectionCard,
  EmptyState,
  LoadingGrid,
  InfoRow,
  MiniBar,
  PageHeader,
} from "@/components/alo/shared";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  DOC_STATUS_COLORS,
  fmtDate,
  timeAgo,
} from "@/lib/alo-types";

// ---------- Types ----------
interface Counselor {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface StudentListItem {
  id: string;
  studentId: string;
  fullName: string;
}

interface EducationItem {
  degree?: string;
  institution?: string;
  board?: string;
  passingYear?: string;
  result?: string;
  resultType?: string;
}

interface EnglishTestItem {
  testType?: string;
  overall?: number | string;
  listening?: number | string;
  reading?: number | string;
  writing?: number | string;
  speaking?: number | string;
  testDate?: string;
}

interface Application {
  id: string;
  applicationId: string;
  university: string;
  course: string;
  country: string;
  intake?: string;
  studyLevel?: string;
  deadline?: string;
  stage: string;
  priority: string;
  notes?: string;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  category: string;
  required: boolean;
  status: string;
  rejectionReason?: string;
  reviewer?: { name: string } | null;
  reviewedAt?: string | null;
  uploadedAt?: string | null;
}

interface InterviewSession {
  id: string;
  sessionId: string;
  type: string;
  status: string;
  scores?: string | null;
  readiness?: string | null;
  riskLevel?: string | null;
  feedback?: string | null;
  startedAt: string;
  completedAt?: string | null;
}

interface Payment {
  id: string;
  paymentId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  method?: string | null;
  commissionAmount?: number | null;
  commissionStatus?: string | null;
  createdAt: string;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  user?: { name: string } | null;
}

interface StudentDetail {
  id: string;
  studentId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  altEmail?: string;
  mobile: string;
  altMobile?: string;
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  cityOfBirth?: string;
  countryOfBirth?: string;
  educationHistory: string;
  hasPassport: boolean;
  passportNumber?: string;
  passportIssuePlace?: string;
  passportIssueCountry?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  englishTests: string;
  englishTestStatus?: string;
  fundingStatus?: string;
  sponsorRelation?: string;
  sourceOfFund?: string;
  bankStatementStatus?: string;
  sponsorDocStatus?: string;
  studyDestination?: string;
  programTitle?: string;
  studyLevel?: string;
  studyArea?: string;
  intake?: string;
  universityPreference?: string;
  profileCompletion: number;
  counselorId?: string;
  counselor?: Counselor | null;
  partnerId?: string;
  status: string;
  createdAt: string;
  documents?: Document[];
  applications?: Application[];
  interviews?: InterviewSession[];
  payments?: Payment[];
  timelineEvents?: TimelineEvent[];
}

// ---------- Color maps ----------
const STUDENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-700",
  GRADUATED: "bg-blue-100 text-blue-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  NORMAL: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-rose-100 text-rose-700",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  REFUNDED: "bg-rose-100 text-rose-700",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

const COMMISSION_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

const READINESS_COLORS: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-700",
  needs_practice: "bg-amber-100 text-amber-700",
  high_risk: "bg-rose-100 text-rose-700",
  human_review_required: "bg-violet-100 text-violet-700",
};

const READINESS_LABELS: Record<string, string> = {
  ready: "Ready",
  needs_practice: "Needs Practice",
  high_risk: "High Risk",
  human_review_required: "Human Review",
};

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-rose-100 text-rose-700",
};

const INTERVIEW_STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  UNIVERSITY_CREDIBILITY: "University Credibility",
  VISA_INTERVIEW: "Visa Interview",
  PRE_CAS: "Pre-CAS",
  SCHOLARSHIP: "Scholarship",
  GENERAL_ENGLISH: "General English",
};

const TIMELINE_META: Record<string, { icon: string; color: string }> = {
  LEAD_CREATED: { icon: "UserPlus", color: "bg-blue-100 text-blue-700" },
  PROFILE_UPDATED: { icon: "UserCog", color: "bg-blue-100 text-blue-700" },
  DOC_UPLOADED: { icon: "FileUp", color: "bg-amber-100 text-amber-700" },
  DOC_APPROVED: { icon: "FileCheck2", color: "bg-emerald-100 text-emerald-700" },
  DOC_REJECTED: { icon: "FileX2", color: "bg-rose-100 text-rose-700" },
  APP_STATUS_CHANGED: { icon: "ClipboardList", color: "bg-orange-100 text-orange-700" },
  VISA_STATUS_CHANGED: { icon: "Plane", color: "bg-orange-100 text-orange-700" },
  INTERVIEW_COMPLETED: { icon: "Mic", color: "bg-violet-100 text-violet-700" },
  MOCK_TEST_DONE: { icon: "GraduationCap", color: "bg-violet-100 text-violet-700" },
  AI_ACTION: { icon: "Bot", color: "bg-violet-100 text-violet-700" },
  MESSAGE_SENT: { icon: "MessageSquare", color: "bg-blue-100 text-blue-700" },
  PAYMENT: { icon: "CreditCard", color: "bg-emerald-100 text-emerald-700" },
  NOTE: { icon: "StickyNote", color: "bg-amber-100 text-amber-700" },
};

const DOC_CATEGORY_LABELS: Record<string, string> = {
  PASSPORT: "Passport",
  NID: "National ID",
  ACADEMIC_CERT: "Academic Certificate",
  TRANSCRIPT: "Transcript",
  CV: "CV / Resume",
  SOP: "Statement of Purpose",
  BANK_STATEMENT: "Bank Statement",
  SPONSOR_DOC: "Sponsor Document",
  VISA_DOC: "Visa Document",
  REFUSAL_LETTER: "Refusal Letter",
  MEDICAL: "Medical",
  IELTS_CERT: "English Test Certificate",
  OTHER: "Other",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  APPLICATION_FEE: "Application Fee",
  DEPOSIT: "Deposit",
  TUITION: "Tuition",
  SERVICE_CHARGE: "Service Charge",
  MOCK_TEST: "Mock Test Fee",
  COMMISSION: "Commission",
};

const FUNDING_LABELS: Record<string, string> = {
  SELF_FUNDED: "Self Funded",
  SPONSORED: "Sponsored",
  LOAN: "Education Loan",
  SCHOLARSHIP: "Scholarship",
  FAMILY: "Family Funded",
};

const DOC_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  UPLOADED: "Uploaded",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// ---------- Helpers ----------
function safeParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val !== "string") return val as T;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function Student360() {
  const { toast } = useToast();
  const [students, setStudents] = React.useState<StudentListItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [student, setStudent] = React.useState<StudentDetail | null>(null);
  const [loadingList, setLoadingList] = React.useState(true);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  // Fetch student list
  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingList(true);
      try {
        const res = await fetch("/api/students");
        const data = await res.json();
        if (!alive) return;
        const list: StudentListItem[] = data.students ?? [];
        setStudents(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch {
        toast({
          title: "Failed to load student list",
          description: "Could not fetch the student list.",
          variant: "destructive",
        });
      } finally {
        if (alive) setLoadingList(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [toast]);

  // Fetch student detail on selection
  React.useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    setLoadingDetail(true);
    setStudent(null);
    fetch(`/api/students?id=${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.student) {
          setStudent(data.student);
        } else {
          toast({
            title: "Could not load student",
            description: data.error ?? "Please try again.",
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        if (alive) {
          toast({
            title: "Network error",
            description: "Failed to fetch student detail.",
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (alive) setLoadingDetail(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedId, toast]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student 360"
        subtitle="A single student's complete journey — profile, timeline, applications, documents, interviews, and payments."
        icon="Orbit"
      />

      {/* Student selector */}
      <Card className="rounded-2xl border-2 border-[#0B5ED7]/15">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Icon name="Search" className="size-4" />
            Select student:
          </div>
          {loadingList ? (
            <div className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students available.</p>
          ) : (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="h-10 flex-1 rounded-xl border-[#0B5ED7]/15">
                <SelectValue placeholder="Pick a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-mono text-xs text-muted-foreground">{s.studentId}</span>
                    {" — "}
                    <span className="font-medium">{s.fullName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {student && (
            <Badge variant="outline" className="h-10 border-[#0B5ED7]/20 px-3 text-xs">
              {students.findIndex((s) => s.id === selectedId) + 1} of {students.length}
            </Badge>
          )}
        </CardContent>
      </Card>

      {loadingDetail || !student ? (
        <LoadingGrid count={4} />
      ) : (
        <>
          {/* Header card */}
          <Card className="rounded-2xl border-2 border-[#0B5ED7]/20">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-[#0B5ED7]">{student.fullName}</h2>
                    <Badge
                      variant="outline"
                      className="border-[#0B5ED7]/20 bg-[#e8f0fb]/60 font-mono text-[#0B5ED7]"
                    >
                      {student.studentId}
                    </Badge>
                    <StatusBadge status={student.status} colorMap={STUDENT_STATUS_COLORS} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Icon name="User" className="size-3.5" />
                      Counselor:{" "}
                      <span className="font-medium text-foreground">
                        {student.counselor?.name ?? "Unassigned"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="Mail" className="size-3.5" />
                      {student.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="Phone" className="size-3.5" />
                      <span className="font-mono">{student.mobile}</span>
                    </span>
                    {student.partnerId && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="Handshake" className="size-3.5" />
                        Partner: <span className="font-mono">{student.partnerId.slice(-6)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]/60"
                    onClick={() =>
                      toast({
                        title: "Edit profile",
                        description: `Opening edit form for ${student.fullName}.`,
                      })
                    }
                  >
                    <Icon name="Pencil" className="mr-2 size-4" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]/60"
                    onClick={() =>
                      toast({
                        title: "Message sent",
                        description: `A WhatsApp/SMS template was prepared for ${student.fullName}.`,
                      })
                    }
                  >
                    <Icon name="MessageSquare" className="mr-2 size-4" />
                    Send Message
                  </Button>
                </div>
              </div>

              {/* Profile completion */}
              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium uppercase tracking-wide text-muted-foreground">
                    Profile Completion
                  </span>
                  <span className="font-bold text-[#0B5ED7]">{student.profileCompletion}%</span>
                </div>
                <Progress value={student.profileCompletion} className="h-2.5" />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border-2 border-[#0B5ED7]/15 bg-white p-1.5">
              {[
                { v: "overview", l: "Overview", i: "LayoutDashboard" },
                { v: "timeline", l: "Timeline", i: "Activity" },
                { v: "applications", l: "Applications", i: "ClipboardList" },
                { v: "documents", l: "Documents", i: "FileText" },
                { v: "interviews", l: "Interviews", i: "Mic" },
                { v: "payments", l: "Payments", i: "CreditCard" },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="rounded-xl data-[state=active]:bg-[#0B5ED7] data-[state=active]:text-white"
                >
                  <Icon name={t.i} className="mr-1.5 size-4" />
                  {t.l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab student={student} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-4">
              <TimelineTab events={student.timelineEvents ?? []} />
            </TabsContent>
            <TabsContent value="applications" className="mt-4">
              <ApplicationsTab applications={student.applications ?? []} />
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <DocumentsTab documents={student.documents ?? []} />
            </TabsContent>
            <TabsContent value="interviews" className="mt-4">
              <InterviewsTab interviews={student.interviews ?? []} />
            </TabsContent>
            <TabsContent value="payments" className="mt-4">
              <PaymentsTab payments={student.payments ?? []} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// ============================================================
// OVERVIEW TAB
// ============================================================
function OverviewTab({ student }: { student: StudentDetail }) {
  const education = safeParse<EducationItem[]>(student.educationHistory, []);
  const latestEdu = education.length > 0 ? education[education.length - 1] : null;
  const englishTests = safeParse<EnglishTestItem[]>(student.englishTests, []);
  const latestTest = englishTests.length > 0 ? englishTests[englishTests.length - 1] : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {/* Personal */}
      <SectionCard title="Personal Information" icon="User">
        <InfoRow label="Full Name" value={student.fullName} />
        <InfoRow label="Date of Birth" value={fmtDate(student.dateOfBirth)} />
        <InfoRow label="Gender" value={student.gender} />
        <InfoRow label="Nationality" value={student.nationality} />
        <InfoRow label="Marital Status" value={student.maritalStatus} />
        <InfoRow label="City of Birth" value={student.cityOfBirth} />
      </SectionCard>

      {/* Contact */}
      <SectionCard title="Contact" icon="Phone">
        <InfoRow label="Email" value={student.email} mono />
        <InfoRow label="Alt Email" value={student.altEmail} mono />
        <InfoRow label="Mobile" value={student.mobile} mono />
        <InfoRow label="Alt Mobile" value={student.altMobile} mono />
        <InfoRow label="Emergency Contact" value={student.emergencyName} />
        <InfoRow label="Relationship" value={student.emergencyRelation} />
        <InfoRow label="Emergency Phone" value={student.emergencyPhone} mono />
      </SectionCard>

      {/* Education */}
      <SectionCard title="Education" icon="GraduationCap">
        {latestEdu ? (
          <>
            <InfoRow label="Latest Degree" value={latestEdu.degree} />
            <InfoRow label="Institution" value={latestEdu.institution} />
            <InfoRow label="Board" value={latestEdu.board} />
            <InfoRow label="Passing Year" value={latestEdu.passingYear} />
            <InfoRow
              label="Result"
              value={
                latestEdu.result
                  ? `${latestEdu.result}${latestEdu.resultType ? ` (${latestEdu.resultType})` : ""}`
                  : "—"
              }
            />
            <p className="pt-2 text-xs text-muted-foreground">
              {education.length} education record{education.length !== 1 ? "s" : ""} on file.
            </p>
          </>
        ) : (
          <p className="py-3 text-sm text-muted-foreground">No education history recorded yet.</p>
        )}
      </SectionCard>

      {/* Passport */}
      <SectionCard title="Passport" icon="BookUser">
        <InfoRow
          label="Has Passport"
          value={
            student.hasPassport ? (
              <span className="text-emerald-600">Yes</span>
            ) : (
              <span className="text-rose-600">No</span>
            )
          }
        />
        <InfoRow label="Passport Number" value={student.passportNumber} mono />
        <InfoRow label="Issue Place" value={student.passportIssuePlace} />
        <InfoRow label="Issue Country" value={student.passportIssueCountry} />
        <InfoRow label="Issue Date" value={fmtDate(student.passportIssueDate)} />
        <InfoRow label="Expiry Date" value={fmtDate(student.passportExpiryDate)} />
      </SectionCard>

      {/* English Test */}
      <SectionCard title="English Test" icon="Languages">
        {latestTest ? (
          <>
            <InfoRow label="Test Type" value={latestTest.testType} />
            <InfoRow label="Overall" value={latestTest.overall} />
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
              <InfoRow label="Listening" value={latestTest.listening} />
              <InfoRow label="Reading" value={latestTest.reading} />
              <InfoRow label="Writing" value={latestTest.writing} />
              <InfoRow label="Speaking" value={latestTest.speaking} />
            </div>
            <InfoRow label="Test Date" value={fmtDate(latestTest.testDate)} />
            <p className="pt-2 text-xs text-muted-foreground">
              {englishTests.length} test{englishTests.length !== 1 ? "s" : ""} recorded.
            </p>
          </>
        ) : (
          <>
            <InfoRow label="Test Status" value={student.englishTestStatus} />
            <p className="py-3 text-sm text-muted-foreground">
              No English test scores recorded yet.
            </p>
          </>
        )}
      </SectionCard>

      {/* Funding */}
      <SectionCard title="Funding & Sponsor" icon="Wallet">
        <InfoRow
          label="Funding Status"
          value={FUNDING_LABELS[student.fundingStatus ?? ""] ?? student.fundingStatus}
        />
        <InfoRow label="Sponsor Relation" value={student.sponsorRelation} />
        <InfoRow label="Source of Fund" value={student.sourceOfFund} />
        <InfoRow label="Bank Statement" value={student.bankStatementStatus} />
        <InfoRow label="Sponsor Document" value={student.sponsorDocStatus} />
      </SectionCard>

      {/* Admission Preference */}
      <SectionCard title="Admission Preference" icon="Compass" className="lg:col-span-2 xl:col-span-1">
        <InfoRow label="Study Destination" value={student.studyDestination} />
        <InfoRow label="Program Title" value={student.programTitle} />
        <InfoRow label="Study Level" value={student.studyLevel} />
        <InfoRow label="Study Area" value={student.studyArea} />
        <InfoRow label="Intake" value={student.intake} />
        <InfoRow label="University Preference" value={student.universityPreference} />
      </SectionCard>
    </div>
  );
}

// ============================================================
// TIMELINE TAB
// ============================================================
function TimelineTab({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon="Activity"
        title="No timeline events"
        description="Once actions are recorded against this student, their journey will appear here."
      />
    );
  }
  return (
    <SectionCard title="Student Journey" icon="Activity" description={`${events.length} events recorded`}>
      <div className="max-h-[32rem] overflow-y-auto alo-scroll pr-2">
        <div className="relative space-y-4 pt-2">
          {events.map((ev, idx) => {
            const meta = TIMELINE_META[ev.type] ?? { icon: "Circle", color: "bg-slate-100 text-slate-700" };
            const isLast = idx === events.length - 1;
            return (
              <div key={ev.id} className="relative flex gap-3">
                {/* Vertical line */}
                {!isLast && (
                  <div className="absolute left-[15px] top-8 h-full w-px bg-[#0B5ED7]/15" />
                )}
                {/* Icon */}
                <div
                  className={
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white " +
                    meta.color
                  }
                >
                  <Icon name={meta.icon} className="size-4" />
                </div>
                {/* Body */}
                <div className="flex-1 pb-2">
                  <div className="rounded-xl border border-[#0B5ED7]/10 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{ev.title}</p>
                      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {timeAgo(ev.createdAt)}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{ev.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="border-[#0B5ED7]/15 bg-[#e8f0fb]/40 font-normal text-[#0B5ED7]"
                      >
                        {ev.type.replace(/_/g, " ")}
                      </Badge>
                      {ev.user?.name && (
                        <span className="flex items-center gap-1">
                          <Icon name="User" className="size-3" />
                          {ev.user.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" className="size-3" />
                        {fmtDate(ev.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

// ============================================================
// APPLICATIONS TAB
// ============================================================
function ApplicationsTab({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <EmptyState
        icon="ClipboardList"
        title="No applications yet"
        description="When this student applies to universities, applications will appear here."
      />
    );
  }
  return (
    <SectionCard title="Applications" icon="ClipboardList" description={`${applications.length} total`}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application ID</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id} className="hover:bg-[#e8f0fb]/30">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {app.applicationId}
                </TableCell>
                <TableCell className="font-semibold text-foreground">{app.university}</TableCell>
                <TableCell className="text-sm">{app.course}</TableCell>
                <TableCell className="text-sm">{app.country}</TableCell>
                <TableCell>
                  <StatusBadge
                    status={app.stage}
                    colorMap={STAGE_COLORS}
                    labels={STAGE_LABELS}
                  />
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={app.priority}
                    colorMap={PRIORITY_COLORS}
                    labels={{ LOW: "Low", NORMAL: "Normal", HIGH: "High", URGENT: "Urgent" }}
                  />
                </TableCell>
                <TableCell className="text-sm">
                  {app.deadline ? fmtDate(app.deadline) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}

// ============================================================
// DOCUMENTS TAB
// ============================================================
function DocumentsTab({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon="FileText"
        title="No documents on file"
        description="Uploaded documents and their review status will appear here."
      />
    );
  }
  return (
    <SectionCard title="Documents" icon="FileText" description={`${documents.length} total`}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Rejection Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-[#e8f0fb]/30">
                <TableCell className="font-medium text-foreground">{doc.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    {DOC_CATEGORY_LABELS[doc.category] ?? doc.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  {doc.required ? (
                    <span className="text-xs font-semibold text-[#F97316]">Required</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Optional</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={doc.status}
                    colorMap={DOC_STATUS_COLORS}
                    labels={DOC_STATUS_LABELS}
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {doc.uploadedAt ? fmtDate(doc.uploadedAt) : "—"}
                </TableCell>
                <TableCell className="text-sm">{doc.reviewer?.name ?? "—"}</TableCell>
                <TableCell className="max-w-[220px] text-xs text-rose-600">
                  {doc.status === "REJECTED" && doc.rejectionReason
                    ? doc.rejectionReason
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}

// ============================================================
// INTERVIEWS TAB
// ============================================================
function InterviewsTab({ interviews }: { interviews: InterviewSession[] }) {
  if (interviews.length === 0) {
    return (
      <EmptyState
        icon="Mic"
        title="No interview sessions"
        description="AI-powered interview practice sessions will appear here once started."
      />
    );
  }
  return (
    <SectionCard title="Interview Sessions" icon="Mic" description={`${interviews.length} total`}>
      <div className="space-y-3">
        {interviews.map((iv) => {
          const scores = safeParse<Record<string, number>>(iv.scores, {});
          const scoreEntries = Object.entries(scores);
          const maxScore = Math.max(10, ...scoreEntries.map(([, v]) => v));
          return (
            <div
              key={iv.id}
              className="rounded-2xl border-2 border-[#0B5ED7]/10 bg-white p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {INTERVIEW_TYPE_LABELS[iv.type] ?? iv.type}
                    </p>
                    <StatusBadge
                      status={iv.status}
                      colorMap={INTERVIEW_STATUS_COLORS}
                      labels={{ IN_PROGRESS: "In Progress", COMPLETED: "Completed" }}
                    />
                    {iv.readiness && (
                      <StatusBadge
                        status={iv.readiness}
                        colorMap={READINESS_COLORS}
                        labels={READINESS_LABELS}
                      />
                    )}
                    {iv.riskLevel && (
                      <StatusBadge
                        status={iv.riskLevel}
                        colorMap={RISK_COLORS}
                        labels={{ LOW: "Low Risk", MEDIUM: "Medium Risk", HIGH: "High Risk" }}
                      />
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{iv.sessionId}</p>
                  <p className="text-xs text-muted-foreground">
                    Started: {fmtDate(iv.startedAt)}
                    {iv.completedAt ? ` · Completed: ${fmtDate(iv.completedAt)}` : ""}
                  </p>
                </div>
              </div>

              {iv.feedback && (
                <Accordion type="single" collapsible className="mt-3">
                  <AccordionItem value="feedback" className="border-0">
                    <AccordionTrigger className="rounded-lg bg-[#e8f0fb]/40 px-3 py-2 text-xs font-semibold text-[#0B5ED7] hover:no-underline">
                      View feedback & scores
                    </AccordionTrigger>
                    <AccordionContent className="px-1 pt-3">
                      <p className="rounded-lg border border-[#0B5ED7]/10 bg-muted/30 p-3 text-xs text-foreground">
                        {iv.feedback}
                      </p>
                      {scoreEntries.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {scoreEntries.map(([k, v]) => (
                            <div key={k} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium capitalize text-muted-foreground">
                                  {k.replace(/_/g, " ")}
                                </span>
                                <span className="font-bold tabular-nums text-[#0B5ED7]">
                                  {v}
                                  <span className="text-[10px] text-muted-foreground">/10</span>
                                </span>
                              </div>
                              <MiniBar value={v} max={maxScore} color="#0B5ED7" />
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ============================================================
// PAYMENTS TAB
// ============================================================
function PaymentsTab({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <EmptyState
        icon="CreditCard"
        title="No payments recorded"
        description="Application fees, deposits, tuition, and commission payments will appear here."
      />
    );
  }
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <SectionCard title="Payments" icon="CreditCard" description={`${payments.length} total`}>
      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Total Paid</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">
            ৳{totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Pending</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-amber-700">
            ৳{totalPending.toLocaleString()}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border-2 border-[#0B5ED7]/15 bg-[#e8f0fb]/40 p-3 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[#0B5ED7]">
            Total Transactions
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-[#0B5ED7]">{payments.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id} className="hover:bg-[#e8f0fb]/30">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.paymentId}
                </TableCell>
                <TableCell className="text-sm">
                  {PAYMENT_TYPE_LABELS[p.type] ?? p.type}
                </TableCell>
                <TableCell className="font-semibold tabular-nums">
                  {p.currency === "BDT" ? "৳" : p.currency + " "}
                  {p.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={p.status}
                    colorMap={PAYMENT_STATUS_COLORS}
                    labels={PAYMENT_STATUS_LABELS}
                  />
                </TableCell>
                <TableCell className="text-sm">
                  {p.method ? (
                    p.method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {p.commissionAmount ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium tabular-nums">
                        ৳{p.commissionAmount.toLocaleString()}
                      </span>
                      {p.commissionStatus && (
                        <StatusBadge
                          status={p.commissionStatus}
                          colorMap={COMMISSION_COLORS}
                          labels={{
                            PENDING: "Pending",
                            APPROVED: "Approved",
                            PAID: "Paid",
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {fmtDate(p.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
export default Student360;
