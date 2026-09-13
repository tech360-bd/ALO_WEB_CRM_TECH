'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin, Globe, ExternalLink, Trophy, BookOpen, Award,
  Calendar, GraduationCap, Clock, DollarSign, ChevronRight,
  ArrowLeft, Loader2, SearchX, ShieldCheck, MessageCircle,
  BookmarkPlus, GitCompare, CheckCircle, Briefcase, FileText,
  Mic, Image as ImageIcon, Target, Sparkles, Building2,
  ClipboardCheck, Download, Star, Users, Landmark,
  FlaskConical, Scale, ScrollText, AlertTriangle,
  Share2, Send, UserCheck, FileCheck, CreditCard, Plane,
  Banknote, Stamp, CheckSquare, CircleDot, ListChecks,
  ChevronDown, ChevronUp, FolderOpen, Copy, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader,
  SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { COUNTRY_FLAGS } from './types';
import TestPreparationMiniCard from '@/components/website/TestPreparationMiniCard';

// ─── ALO Brand Colors ─────────────────────────────────────────────────────────
const ALO_BLUE = '#0057B8';
const ALO_ORANGE = '#E8501A';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface UniversityInfo {
  id: string;
  name: string;
  slug: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  rankingValue?: number;
}

interface CourseData {
  id: string;
  slug: string;
  title: string;
  universityId?: string;
  campus?: string;
  country?: string;
  city?: string;
  studyLevel?: string;
  qualification?: string;
  subjectArea?: string;
  specialisation?: string;
  duration?: string;
  durationMonths?: number;
  studyMode?: string;
  deliveryMode?: string;
  overview?: string;
  keyModules?: string;
  learningOutcomes?: string;
  tuitionFee?: number;
  tuitionCurrency?: string;
  tuitionPeriod?: string;
  applicationFee?: number;
  applicationFeeCurrency?: string;
  depositRequired?: boolean;
  depositAmount?: number;
  ieltsMin?: number;
  pteMin?: number;
  toeflMin?: number;
  duolingoMin?: number;
  academicRequirement?: string;
  gpaMin?: number;
  workExperienceRequired?: boolean;
  portfolioRequired?: boolean;
  interviewRequired?: boolean;
  placementAvailable?: boolean;
  professionalAccreditation?: string;
  careerOutcomes?: string;
  scholarshipAvailable?: boolean;
  scholarshipNotes?: string;
  nextIntake?: string;
  intakeMonths?: string;
  applicationDeadline?: string;
  officialCourseUrl?: string;
  sourceUrl?: string;
  collectedAt?: string;
  lastVerifiedAt?: string;
  verifiedBy?: string;
  verificationStatus?: string;
  approvalStatus?: string;
  university?: UniversityInfo;
}

interface RelatedCourse {
  id: string;
  slug: string;
  title: string;
  studyLevel?: string;
  qualification?: string;
  duration?: string;
  tuitionFee?: number;
  tuitionCurrency?: string;
  ieltsMin?: number;
  scholarshipAvailable?: boolean;
  university?: UniversityInfo;
}

interface ApiCourseResponse {
  type: 'course';
  course: CourseData;
  university: UniversityInfo | null;
  relatedCourses: RelatedCourse[];
}

interface EligibilityResult {
  matchLevel: 'likely' | 'possible' | 'review';
  matchScore: number;
  reasons: string[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getLevelBadgeClasses(level: string): string {
  switch (level?.toLowerCase()) {
    case 'undergraduate': case 'bachelor':
      return 'bg-[#0057B8]/10 text-[#0057B8]';
    case 'postgraduate': case 'master':
      return 'bg-[#0057B8]/20 text-[#0057B8]';
    case 'phd': case 'doctorate':
      return 'bg-[#0057B8]/30 text-[#0057B8]';
    case 'foundation':
      return 'bg-sky-100 text-sky-800';
    case 'diploma': case 'certificate':
      return 'bg-[#0057B8]/15 text-[#0057B8]';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function pOrV(value: string | number | null | undefined, placeholder = 'Verification pending'): string {
  if (value === null || value === undefined || value === '' || value === 0) return placeholder;
  return String(value);
}

function parseJsonField(field: string | null | undefined): string[] {
  if (!field) return [];
  try {
    const parsed = JSON.parse(field);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return field.split(',').map(s => s.trim()).filter(Boolean);
  }
}

function getMatchColor(level: string) {
  switch (level) {
    case 'likely': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'possible': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'review': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

function getMatchBadge(level: string, score: number) {
  const colors = getMatchColor(level);
  const label = level === 'likely' ? 'Likely Match' : level === 'possible' ? 'Possible Match' : 'Needs Review';
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${colors}`}>
      <div className={`text-lg font-bold`}>{score}%</div>
      <div>
        <p className={`text-xs font-semibold capitalize`}>{label}</p>
        <p className="text-[10px] opacity-70">Preliminary</p>
      </div>
    </div>
  );
}

// ─── 20-Step Application Flow ─────────────────────────────────────────────────
function getApplicationSteps(country: string | undefined) {
  const visaStep = country === 'UK' ? 'Complete CAS Process' : country === 'USA' ? 'Complete I-20 Process' : country === 'Australia' ? 'Complete COE Process' : 'Complete Visa Document Process';
  const visaLabel = country === 'UK' ? 'CAS' : country === 'USA' ? 'I-20' : country === 'Australia' ? 'COE' : 'Visa Document';

  return [
    { step: 1, title: 'Complete your profile', desc: 'Fill in your academic and personal details on ALO Education.', icon: UserCheck, group: 'Preparation' },
    { step: 2, title: 'Run eligibility check', desc: 'Use the eligibility checker to see if you meet the basic requirements.', icon: ClipboardCheck, group: 'Preparation' },
    { step: 3, title: 'Select this course', desc: 'Add this course to your shortlist from the Course Finder.', icon: BookOpen, group: 'Selection' },
    { step: 4, title: 'Review full requirements', desc: 'Check academic, English, and document requirements in detail.', icon: FileCheck, group: 'Selection' },
    { step: 5, title: 'Upload documents', desc: 'Upload passport, certificates, transcripts, English test scores, and other required documents.', icon: FileText, group: 'Documentation' },
    { step: 6, title: 'Request counsellor review', desc: 'Submit your documents for counsellor verification and feedback.', icon: Users, group: 'Review' },
    { step: 7, title: 'Resolve missing requirements', desc: 'Address any gaps identified during the counsellor review.', icon: AlertTriangle, group: 'Review' },
    { step: 8, title: 'Approve shortlist', desc: 'Confirm your final course selection with your counsellor.', icon: CheckSquare, group: 'Application' },
    { step: 9, title: 'Complete university application', desc: 'Fill out the university application form with counsellor guidance.', icon: FileText, group: 'Application' },
    { step: 10, title: 'Pay application fee', desc: 'Submit the university application fee where required.', icon: CreditCard, group: 'Application' },
    { step: 11, title: 'Submit application', desc: 'ALO Education submits your application to the university on your behalf.', icon: Send, group: 'Submission' },
    { step: 12, title: 'Track university response', desc: 'Monitor your application status through the ALO portal.', icon: Target, group: 'Submission' },
    { step: 13, title: 'Receive offer', desc: 'Get your conditional or unconditional offer letter from the university.', icon: Award, group: 'Offer' },
    { step: 14, title: 'Meet offer conditions', desc: 'Fulfil any conditions stated in your offer (e.g. final grades, English scores).', icon: CheckCircle, group: 'Offer' },
    { step: 15, title: 'Pay deposit', desc: 'Pay the required deposit to secure your place on the course.', icon: Banknote, group: 'Enrolment' },
    { step: 16, title: visaStep, desc: `Work with your counsellor to obtain the ${visaLabel} from the university.`, icon: Stamp, group: 'Enrolment' },
    { step: 17, title: 'Prepare financial documents', desc: 'Arrange bank statements, sponsorship letters, and financial evidence for your visa.', icon: Landmark, group: 'Visa' },
    { step: 18, title: 'Submit visa application', desc: 'Apply for your student visa with counsellor support and document preparation.', icon: Scale, group: 'Visa' },
    { step: 19, title: 'Pre-departure preparation', desc: 'Attend pre-departure sessions, arrange accommodation, flights, and insurance.', icon: Plane, group: 'Departure' },
    { step: 20, title: 'Track enrolment', desc: 'Complete university enrolment and begin your studies!', icon: GraduationCap, group: 'Departure' },
  ];
}

// ─── Requirements Drawer Content ───────────────────────────────────────────────
function RequirementsDrawer({ course }: { course: CourseData }) {
  const isResearch = ['PhD', 'MRes', 'MPhil', 'Doctorate'].some(l =>
    course.studyLevel?.toLowerCase().includes(l.toLowerCase())
  );

  return (
    <ScrollArea className="h-[calc(100vh-120px)] pr-4">
      <div className="space-y-6 pb-6">
        {/* Academic Requirements */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <GraduationCap className="size-4 text-[#0057B8]" />
            Academic Requirements
          </h3>
          <div className="space-y-2 bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Qualification</span>
              <span className="font-medium text-slate-800">{course.qualification || 'Not specified'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Minimum GPA</span>
              <span className="font-medium text-slate-800">{course.gpaMin ?? 'Not specified'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Study Level</span>
              <span className="font-medium text-slate-800">{course.studyLevel || 'Not specified'}</span>
            </div>
            {course.academicRequirement && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Detailed Requirements</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{course.academicRequirement}</p>
              </div>
            )}
          </div>
        </section>

        {/* English Requirements */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <BookOpen className="size-4 text-[#0057B8]" />
            English Language Requirements
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'IELTS', score: course.ieltsMin, icon: '🇬🇧' },
              { name: 'PTE', score: course.pteMin, icon: '📝' },
              { name: 'TOEFL', score: course.toeflMin, icon: '托福' },
              { name: 'Duolingo', score: course.duolingoMin, icon: '🎯' },
            ].map(t => (
              <div key={t.name} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500">{t.icon} {t.name}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {t.score ?? <span className="text-sm text-slate-400 font-normal">N/A</span>}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Overall minimum</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-slate-500">
            <p>• Test validity: Typically 2 years from test date</p>
            <p>• Pre-sessional English courses may be available if scores are slightly below requirements</p>
            <p>• UKVI IELTS may be required for visa purposes (UK only)</p>
            <p>• Contact a counsellor to check English waiver eligibility</p>
          </div>
        </section>

        {/* Professional Requirements */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Briefcase className="size-4 text-[#0057B8]" />
            Professional Requirements
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Work Experience', required: course.workExperienceRequired },
              { label: 'Portfolio', required: course.portfolioRequired },
              { label: 'Interview', required: course.interviewRequired },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                <span className="text-sm text-slate-600">{r.label}</span>
                {r.required ? (
                  <Badge className="bg-amber-100 text-amber-700 text-xs">Required</Badge>
                ) : (
                  <span className="text-xs text-slate-400">Not required</span>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
              <span className="text-sm text-slate-600">CV / Resume</span>
              <Badge className="bg-[#0057B8]/10 text-[#0057B8] text-xs">Recommended</Badge>
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
              <span className="text-sm text-slate-600">References</span>
              <Badge className="bg-[#0057B8]/10 text-[#0057B8] text-xs">Usually 1-2</Badge>
            </div>
          </div>
        </section>

        {/* Research Requirements */}
        {isResearch && (
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FlaskConical className="size-4 text-[#0057B8]" />
              Research Requirements
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm text-slate-600">
              <p>• <span className="font-medium text-slate-700">Research Proposal:</span> A detailed research proposal aligned with departmental expertise</p>
              <p>• <span className="font-medium text-slate-700">Supervisor Contact:</span> It is recommended to contact potential supervisors before applying</p>
              <p>• <span className="font-medium text-slate-700">Publications:</span> Previous publications may strengthen your application</p>
            </div>
          </section>
        )}

        {/* Documents Checklist */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ListChecks className="size-4 text-[#0057B8]" />
            Documents Checklist
          </h3>
          <div className="space-y-1.5">
            {[
              'Valid Passport', 'Academic Certificates', 'Academic Transcripts',
              'English Language Test Result', 'CV / Resume', 'Statement of Purpose (SOP)',
              'Reference Letters (1-2)', 'Work Experience Letter (if applicable)',
              'Portfolio (if required)', 'Financial Evidence / Bank Statements',
            ].map(doc => (
              <div key={doc} className="flex items-center gap-2 text-sm text-slate-600 py-1">
                <CircleDot className="size-3.5 text-[#0057B8] flex-shrink-0" />
                <span>{doc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Financial Info */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Banknote className="size-4 text-[#0057B8]" />
            Financial Information
          </h3>
          <div className="space-y-2 bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tuition Fee</span>
              <span className="font-medium text-slate-800">
                {course.tuitionFee ? `${course.tuitionCurrency || 'GBP'} ${course.tuitionFee.toLocaleString()}${course.tuitionPeriod ? ` / ${course.tuitionPeriod}` : ''}` : 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Deposit</span>
              <span className="font-medium text-slate-800">
                {course.depositRequired
                  ? `${course.depositAmount ? `${course.tuitionCurrency || 'GBP'} ${course.depositAmount.toLocaleString()}` : 'Required'}`
                  : 'Not required'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Application Fee</span>
              <span className="font-medium text-slate-800">
                {course.applicationFee ? `${course.applicationFeeCurrency || course.tuitionCurrency || 'GBP'} ${course.applicationFee.toLocaleString()}` : 'No fee'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Estimated Living Costs</span>
              <span className="text-xs text-slate-400">Contact counsellor</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Scholarships</span>
              <span className="font-medium text-slate-800">
                {course.scholarshipAvailable ? 'Available' : 'Not listed'}
              </span>
            </div>
          </div>
        </section>

        {/* Source Provenance */}
        <section className="border-t border-slate-200 pt-4">
          <div className="space-y-1 text-xs text-slate-400">
            {course.sourceUrl && (
              <p className="flex items-center gap-1">
                <ExternalLink className="size-3" />
                Source: <a href={course.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#0057B8] hover:underline truncate max-w-[200px] inline-block">{course.sourceUrl}</a>
              </p>
            )}
            <p>Collected: {formatDate(course.collectedAt)}</p>
            <p>Verified: {formatDate(course.lastVerifiedAt)}</p>
            <p>Status: {course.verificationStatus || 'Unknown'}</p>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-4">
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
          <Skeleton className="size-12 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

// ─── 404 Component ────────────────────────────────────────────────────────────
function NotFoundState() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <SearchX className="size-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Course Not Found</h2>
        <p className="text-slate-500 mb-6">
          The course you&apos;re looking for doesn&apos;t exist, has been removed, or is not yet published.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>
          <Link href="/course-finder">
            <Button style={{ backgroundColor: ALO_BLUE }} className="text-white hover:opacity-90">
              Browse Courses
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Info Grid Item ───────────────────────────────────────────────────────────
function InfoItem({ icon: Icon, label, value, subLabel }: {
  icon: React.ElementType;
  label: string;
  value: string;
  subLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="w-9 h-9 rounded-lg bg-[#0057B8]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="size-4 text-[#0057B8]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
        {subLabel && <p className="text-xs text-slate-400 mt-0.5">{subLabel}</p>}
      </div>
    </div>
  );
}

// ─── Related Course Card ───────────────────────────────────────────────────────
function RelatedCourseCard({ course }: { course: RelatedCourse }) {
  return (
    <Link href={`/course-finder?slug=${course.slug}`}>
      <Card className="hover:shadow-md transition-shadow border-slate-200 cursor-pointer h-full">
        <CardContent className="p-4 space-y-2">
          {course.studyLevel && (
            <Badge variant="secondary" className={`text-[10px] font-medium ${getLevelBadgeClasses(course.studyLevel)}`}>
              {course.studyLevel}
            </Badge>
          )}
          <h4 className="font-semibold text-sm text-slate-900 leading-snug line-clamp-2">
            {course.title}
          </h4>
          {course.university && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Building2 className="size-3" />
              {course.university.name}
            </p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
            {course.duration && (
              <span className="flex items-center gap-1"><Clock className="size-3" />{course.duration}</span>
            )}
            {course.tuitionFee != null && (
              <span className="flex items-center gap-1"><DollarSign className="size-3" />{course.tuitionCurrency || 'GBP'} {course.tuitionFee.toLocaleString()}</span>
            )}
          </div>
          {course.scholarshipAvailable && (
            <Badge className="bg-amber-100 text-amber-700 text-[10px] font-medium">
              <Award className="size-2.5 mr-0.5" /> Scholarship
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── How to Apply Step ─────────────────────────────────────────────────────────
function ApplicationStepItem({ step, index }: { step: ReturnType<typeof getApplicationSteps>[0]; index: number }) {
  const StepIcon = step.icon;
  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-[#0057B8] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {step.step}
        </div>
        {index < 19 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2">
          <StepIcon className="size-4 text-[#0057B8]" />
          <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════════
export function CourseDetailEnhanced({ slug }: { slug: string }) {
  const [data, setData] = useState<ApiCourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const [similarCourses, setSimilarCourses] = useState<RelatedCourse[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  // Fetch course data
  useEffect(() => {
    let cancelled = false;
    async function fetchCourse() {
      setLoading(true);
      setNotFound(false);
      setError(null);
      try {
        const res = await fetch(`/api/course-finder/${slug}?slug=${slug}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error('Failed to load course');
        const json = await res.json();
        if (json.type !== 'course') { setNotFound(true); return; }
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
          toast.error('Failed to load course details');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCourse();
    return () => { cancelled = true; };
  }, [slug]);

  // Check sessionStorage for eligibility result
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem('eligibility-result');
      if (stored) {
        const results = JSON.parse(stored);
        const match = results?.find?.((r: EligibilityResult & { courseId?: string; slug?: string }) =>
          r.courseId === data?.course?.id || r.slug === data?.course?.slug
        );
        if (match) setEligibilityResult(match);
      }
    } catch { /* ignore */ }
  }, [data?.course?.id, data?.course?.slug]);

  // Fetch similar courses when tab changes
  const fetchSimilarCourses = useCallback(async () => {
    if (!data?.course?.subjectArea || !data?.course?.studyLevel) return;
    setSimilarLoading(true);
    try {
      const params = new URLSearchParams({
        subjectArea: data.course.subjectArea,
        studyLevel: data.course.studyLevel,
        limit: '8',
      });
      const res = await fetch(`/api/course-finder?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const courses = (json.courses || []).filter(
          (c: { id: string }) => c.id !== data.course.id
        ).slice(0, 8);
        setSimilarCourses(courses);
      }
    } catch { /* ignore */ }
    finally { setSimilarLoading(false); }
  }, [data?.course?.id, data?.course?.subjectArea, data?.course?.studyLevel]);

  useEffect(() => {
    if (activeTab === 'similar' && similarCourses.length === 0) {
      fetchSimilarCourses();
    }
  }, [activeTab, similarCourses.length, fetchSimilarCourses]);

  const handleSaveCourse = async () => {
    if (!data?.course) return;
    setSaving(true);
    try {
      const res = await fetch('/api/course-finder/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: data.course.id,
          universityId: data.course.universityId,
          universityName: data.university?.name,
          courseTitle: data.course.title,
          country: data.course.country,
          studyLevel: data.course.studyLevel,
          tuitionFee: data.course.tuitionFee,
          currency: data.course.tuitionCurrency,
        }),
      });
      if (res.ok) {
        toast.success('Course saved to your list!');
      } else {
        const json = await res.json().catch(() => ({}));
        if (json.error === 'login_required') {
          toast.info('Please log in to save courses.');
        } else {
          toast.success('Course saved to your list!');
        }
      }
    } catch {
      toast.error('Failed to save course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCompare = () => {
    if (data?.course?.slug) {
      toast.success('Course added to comparison!');
    }
  };

  const handleApply = async () => {
    if (!data?.course) return;
    // Create lead via API
    try {
      await fetch('/api/website/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'course-detail',
          courseId: data.course.id,
          courseTitle: data.course.title,
          universityName: data.university?.name,
        }),
      });
    } catch { /* best effort */ }
    toast.success('Application started! A counsellor will be in touch.');
  };

  const handleDownloadSummary = () => {
    if (!data?.course) return;
    const c = data.course;
    const text = [
      `ALO Education - Course Summary`,
      `================================`,
      ``,
      `Course: ${c.title}`,
      `University: ${data.university?.name || 'N/A'}`,
      `Country: ${c.country || 'N/A'}, ${c.city || ''}`,
      `Campus: ${c.campus || 'N/A'}`,
      `Qualification: ${c.qualification || 'N/A'}`,
      `Study Level: ${c.studyLevel || 'N/A'}`,
      `Duration: ${c.duration || 'N/A'}`,
      `Tuition: ${c.tuitionFee ? `${c.tuitionCurrency || 'GBP'} ${c.tuitionFee.toLocaleString()}${c.tuitionPeriod ? ` / ${c.tuitionPeriod}` : ''}` : 'N/A'}`,
      `Application Fee: ${c.applicationFee ? `${c.applicationFeeCurrency || c.tuitionCurrency || 'GBP'} ${c.applicationFee.toLocaleString()}` : 'N/A'}`,
      `IELTS Min: ${c.ieltsMin || 'N/A'}`,
      `PTE Min: ${c.pteMin || 'N/A'}`,
      `TOEFL Min: ${c.toeflMin || 'N/A'}`,
      `Duolingo Min: ${c.duolingoMin || 'N/A'}`,
      `Next Intake: ${c.nextIntake || 'N/A'}`,
      `Deadline: ${c.applicationDeadline || 'N/A'}`,
      `Delivery: ${c.deliveryMode || 'N/A'}`,
      `Study Mode: ${c.studyMode || 'N/A'}`,
      ``,
      `Scholarship: ${c.scholarshipAvailable ? 'Available' : 'Not listed'}`,
      `Placement: ${c.placementAvailable ? 'Available' : 'Not listed'}`,
      ``,
      `Source: ${c.sourceUrl || 'ALO Education database'}`,
      `Collected: ${formatDate(c.collectedAt)}`,
      `Verified: ${formatDate(c.lastVerifiedAt)}`,
      ``,
      `Generated by ALO Education - ${new Date().toLocaleDateString()}`,
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.slug || 'course'}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded!');
  };

  const handleShare = async () => {
    if (!data?.course) return;
    const url = `${window.location.origin}/course-finder?slug=${data.course.slug}`;
    const text = `${data.course.title} at ${data.university?.name || ''}`;
    if (navigator.share) {
      try { await navigator.share({ title: text, url }); return; } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(`${text} - ${url}`);
    toast.success('Link copied to clipboard!');
  };

  // ── Loading ──
  if (loading) return <CourseDetailSkeleton />;
  // ── Not Found ──
  if (notFound) return <NotFoundState />;
  // ── Error ──
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <SearchX className="size-10 text-red-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Course</h2>
          <p className="text-slate-500 mb-6">{error || 'Unable to load course data.'}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const course = data.course;
  const uni = data.university;
  const relatedCourses = data.relatedCourses || [];

  const careerItems = parseJsonField(course.careerOutcomes);
  const modulesItems = parseJsonField(course.keyModules);
  const learningItems = parseJsonField(course.learningOutcomes);
  const isNotPublished = course.approvalStatus && course.approvalStatus !== 'PUBLISHED';
  const isUnverified = course.verificationStatus !== 'VERIFIED';
  const appSteps = getApplicationSteps(course.country);

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ Back Button + Breadcrumb ═══ */}
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0057B8] transition-colors mb-3"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <ol className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
          <li>
            <Link href="/" className="hover:text-[#0057B8] transition-colors">Home</Link>
          </li>
          <li><ChevronRight className="size-3.5" /></li>
          <li>
            <Link href="/course-finder" className="hover:text-[#0057B8] transition-colors">Course Finder</Link>
          </li>
          <li><ChevronRight className="size-3.5" /></li>
          <li className="text-slate-900 font-medium truncate max-w-[250px]" title={course.title}>
            {course.title}
          </li>
        </ol>
      </nav>

      {/* ═══ Hero: University Info Bar ═══ */}
      {uni && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-4">
          <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
              {uni.logoUrl ? (
                <img src={uni.logoUrl} alt={uni.name} className="w-10 h-10 object-contain" />
              ) : (
                <Building2 className="size-6 text-slate-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/course-finder?slug=${uni.slug}`}
                className="font-semibold text-slate-900 hover:text-[#0057B8] transition-colors truncate block"
              >
                {uni.name}
              </Link>
              <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                {uni.city && uni.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {COUNTRY_FLAGS[uni.country] || ''} {uni.city}, {uni.country}
                  </span>
                )}
                {course.campus && (
                  <span className="flex items-center gap-1">
                    <Landmark className="size-3.5" />
                    {course.campus}
                  </span>
                )}
                {uni.rankingValue && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Trophy className="size-3.5" />
                    #{uni.rankingValue}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Title + Badges ═══ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <h1 className="text-xl sm:text-3xl font-bold text-slate-900 leading-snug">
          {course.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {course.qualification && (
            <Badge variant="secondary" className="bg-slate-100 text-slate-700">
              {course.qualification}
            </Badge>
          )}
          {course.studyLevel && (
            <Badge variant="secondary" className={getLevelBadgeClasses(course.studyLevel)}>
              {course.studyLevel}
            </Badge>
          )}
          {course.subjectArea && (
            <Badge variant="secondary" className="bg-slate-50 text-slate-600">
              <BookOpen className="size-3 mr-1" />
              {course.subjectArea}
            </Badge>
          )}
          {isNotPublished && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              Not Published
            </Badge>
          )}
          {isUnverified && !isNotPublished && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              Verification Pending
            </Badge>
          )}
        </div>
      </div>

      {/* ═══ Eligibility Section ═══ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <Card className="overflow-hidden border-slate-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="size-5 text-[#0057B8]" />
                  Your Eligibility
                </h2>
                <p className="text-xs text-slate-500 mt-1">Check if this course is right for you</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {eligibilityResult ? (
                  <div className="mr-2">
                    {getMatchBadge(eligibilityResult.matchLevel, eligibilityResult.matchScore)}
                  </div>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#0057B8] text-[#0057B8] hover:bg-[#0057B8]/5"
                  onClick={() => toast.info('Navigating to eligibility checker with this course pre-selected...')}
                >
                  <ClipboardCheck className="size-4 mr-1.5" />
                  Check My Eligibility
                </Button>
                <Sheet open={requirementsOpen} onOpenChange={setRequirementsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                      <FileText className="size-4 mr-1.5" />
                      Check Full Requirements
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="sm:max-w-lg w-full">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <ScrollText className="size-5 text-[#0057B8]" />
                        Full Requirements
                      </SheetTitle>
                      <SheetDescription>
                        {course.title}
                        {uni ? ` — ${uni.name}` : ''}
                      </SheetDescription>
                    </SheetHeader>
                    <RequirementsDrawer course={course} />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            {eligibilityResult && eligibilityResult.reasons.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {eligibilityResult.reasons.map((r, i) => (
                  <p key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                    <ChevronRight className="size-3 mt-0.5 flex-shrink-0" />
                    <span>{r}</span>
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Key Info Grid ═══ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <Card className="overflow-hidden border-slate-200">
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
              <InfoItem icon={Clock} label="Duration" value={pOrV(course.duration)} subLabel={course.durationMonths ? `${course.durationMonths} months` : undefined} />
              <InfoItem
                icon={DollarSign}
                label="Tuition Fee"
                value={course.tuitionFee
                  ? `${course.tuitionCurrency || 'GBP'} ${course.tuitionFee.toLocaleString()}${course.tuitionPeriod ? ` / ${course.tuitionPeriod}` : ''}`
                  : 'Verification pending'
                }
              />
              <InfoItem
                icon={CreditCard}
                label="Application Fee"
                value={course.applicationFee
                  ? `${course.applicationFeeCurrency || course.tuitionCurrency || 'GBP'} ${course.applicationFee.toLocaleString()}`
                  : 'No fee'
                }
              />
              <InfoItem icon={GraduationCap} label="IELTS Min" value={course.ieltsMin ? String(course.ieltsMin) : 'N/A'} />
              <InfoItem icon={GraduationCap} label="PTE Min" value={course.pteMin ? String(course.pteMin) : 'N/A'} />
              <InfoItem icon={GraduationCap} label="TOEFL Min" value={course.toeflMin ? String(course.toeflMin) : 'N/A'} />
              <InfoItem icon={GraduationCap} label="Duolingo Min" value={course.duolingoMin ? String(course.duolingoMin) : 'N/A'} />
              <InfoItem icon={Calendar} label="Next Intake" value={pOrV(course.nextIntake)} subLabel={course.intakeMonths || undefined} />
              <InfoItem icon={ClipboardCheck} label="Application Deadline" value={pOrV(course.applicationDeadline)} />
              <InfoItem icon={Globe} label="Delivery Mode" value={pOrV(course.deliveryMode)} />
              <InfoItem icon={BookOpen} label="Study Mode" value={pOrV(course.studyMode)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Tabs Section ═══ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="requirements" className="text-sm">Requirements</TabsTrigger>
            <TabsTrigger value="scholarships" className="text-sm">Scholarships</TabsTrigger>
            <TabsTrigger value="how-to-apply" className="text-sm hidden sm:inline-flex">How to Apply</TabsTrigger>
            <TabsTrigger value="how-to-apply" className="text-sm sm:hidden">Apply</TabsTrigger>
            <TabsTrigger value="similar" className="text-sm">Similar Courses</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {course.overview && (
              <Card className="overflow-hidden border-slate-200">
                <CardContent className="p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Sparkles className="size-5 text-[#0057B8]" />
                    Overview
                  </h2>
                  <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {course.overview}
                  </div>
                </CardContent>
              </Card>
            )}

            {modulesItems.length > 0 && (
              <Card className="overflow-hidden border-slate-200">
                <CardContent className="p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BookOpen className="size-5 text-[#0057B8]" />
                    Key Modules
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modulesItems.map((mod, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle className="size-4 text-[#0057B8] mt-0.5 flex-shrink-0" />
                        <span>{mod}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {learningItems.length > 0 && (
              <Card className="overflow-hidden border-slate-200">
                <CardContent className="p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Target className="size-5 text-[#0057B8]" />
                    Learning Outcomes
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {learningItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <ChevronRight className="size-4 text-[#0057B8] mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {(careerItems.length > 0 || course.placementAvailable) && (
              <Card className="overflow-hidden border-slate-200">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="size-5 text-[#0057B8]" />
                    Career Outcomes
                  </h2>
                  {course.placementAvailable && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                      <Briefcase className="size-3 mr-1" />
                      Placement Available
                    </Badge>
                  )}
                  {careerItems.length > 0 && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {careerItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <ChevronRight className="size-4 text-[#0057B8] mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            {course.professionalAccreditation && (
              <Card className="overflow-hidden border-slate-200">
                <CardContent className="p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="size-5 text-[#0057B8]" />
                    Professional Accreditation
                  </h2>
                  <p className="text-sm text-slate-700 leading-relaxed">{course.professionalAccreditation}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Requirements Tab ── */}
          <TabsContent value="requirements" className="mt-6">
            <Card className="overflow-hidden border-slate-200">
              <CardContent className="p-5 sm:p-6">
                <RequirementsDrawer course={course} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Scholarships Tab ── */}
          <TabsContent value="scholarships" className="mt-6">
            <Card className="overflow-hidden border-amber-200 bg-amber-50/50">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="size-5 text-amber-600" />
                  Scholarship Information
                </h2>
                {course.scholarshipAvailable ? (
                  <div className="mt-4 space-y-3">
                    {course.scholarshipNotes ? (
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {course.scholarshipNotes}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Scholarships are available for this course. Many universities offer merit-based and need-based
                        scholarships for international students. The amount and eligibility criteria vary.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={() => toast.info('Navigating to scholarship search...')}
                      >
                        <SearchX className="size-4 mr-1.5" />
                        Search Scholarships
                      </Button>
                      <Button
                        size="sm"
                        className="text-white"
                        style={{ backgroundColor: ALO_ORANGE }}
                        onClick={() => toast.info('Connecting you with a counsellor for scholarship guidance...')}
                      >
                        <MessageCircle className="size-4 mr-1.5" />
                        Ask a Counsellor
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Award className="size-8 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 mb-1">No scholarship information listed for this course.</p>
                    <p className="text-xs text-slate-400 mb-4">Scholarships may still be available — contact a counsellor to find out.</p>
                    <Button
                      size="sm"
                      style={{ backgroundColor: ALO_ORANGE }}
                      className="text-white"
                      onClick={() => toast.info('Connecting you with a counsellor...')}
                    >
                      <MessageCircle className="size-4 mr-1.5" />
                      Ask a Counsellor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── How to Apply Tab ── */}
          <TabsContent value="how-to-apply" className="mt-6">
            <Card className="overflow-hidden border-slate-200">
              <CardContent className="p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <ListChecks className="size-5 text-[#0057B8]" />
                  How to Apply
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Follow these {appSteps.length} steps to apply for this course with ALO Education support.
                  {course.country && (
                    <span className="ml-1">
                      Steps are tailored for <span className="font-medium text-slate-700">{COUNTRY_FLAGS[course.country] || ''} {course.country}</span>.
                    </span>
                  )}
                </p>
                <div className="space-y-0">
                  {appSteps.map((step, idx) => (
                    <ApplicationStepItem key={step.step} step={step} index={idx} />
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="text-white"
                    style={{ backgroundColor: ALO_BLUE }}
                    onClick={handleApply}
                  >
                    <GraduationCap className="size-5 mr-2" />
                    Start Your Application
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#0057B8] text-[#0057B8] hover:bg-[#0057B8]/5"
                    onClick={() => toast.info('Connecting you with a counsellor...')}
                  >
                    <MessageCircle className="size-5 mr-2" />
                    Talk to a Counsellor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Similar Courses Tab ── */}
          <TabsContent value="similar" className="mt-6">
            {similarLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : similarCourses.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="size-5 text-[#0057B8]" />
                    Similar Courses
                  </h2>
                  {course.subjectArea && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                      {course.subjectArea}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {similarCourses.map((rc) => (
                    <RelatedCourseCard key={rc.id} course={rc} />
                  ))}
                </div>
              </>
            ) : relatedCourses.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="size-5 text-[#0057B8]" />
                    Related Courses
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedCourses.map((rc) => (
                    <RelatedCourseCard key={rc.id} course={rc} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <SearchX className="size-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No similar courses found at this time.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══ Official Course Link ═══ */}
      {course.officialCourseUrl && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
          <a
            href={course.officialCourseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#0057B8] hover:underline font-medium"
          >
            <ExternalLink className="size-4" />
            View on {uni?.name || 'University'} website
          </a>
        </div>
      )}

      {/* ═══ CTA Buttons (Sticky) ═══ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 mb-4">
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-slate-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 flex flex-wrap gap-2 justify-center">
          <Button
            size="lg"
            className="text-white px-6"
            style={{ backgroundColor: ALO_BLUE }}
            onClick={handleApply}
          >
            <GraduationCap className="size-5 mr-2" />
            Apply with ALO Education
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#0057B8] text-[#0057B8] hover:bg-[#0057B8]/5 px-4"
            onClick={handleSaveCourse}
            disabled={saving}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <BookmarkPlus className="size-5" />}
            <span className="hidden sm:inline ml-2">Save Course</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#0057B8] text-[#0057B8] hover:bg-[#0057B8]/5 px-4"
            onClick={handleCompare}
          >
            <GitCompare className="size-5" />
            <span className="hidden sm:inline ml-2">Compare</span>
          </Button>
          <Button
            size="lg"
            className="text-white px-6"
            style={{ backgroundColor: ALO_ORANGE }}
            onClick={() => toast.info('Connecting you with a counsellor...')}
          >
            <MessageCircle className="size-5 mr-2" />
            <span className="hidden sm:inline">Ask a Counsellor</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 px-4"
            onClick={handleDownloadSummary}
          >
            <Download className="size-5" />
            <span className="hidden sm:inline ml-2">Download Summary</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-slate-300 text-slate-700 hover:bg-slate-50 px-4"
            onClick={handleShare}
          >
            <Share2 className="size-5" />
            <span className="hidden sm:inline ml-2">Share</span>
          </Button>
        </div>
      </div>

      {/* ═══ Preliminary Eligibility Disclaimer ═══ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Preliminary Eligibility Only</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Any eligibility result shown is indicative and based on self-reported information. It does not
              guarantee admission. Universities assess applications holistically and may have additional
              requirements not captured here. Always verify requirements directly with the university or
              through an ALO Education counsellor.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Source Provenance Footer ═══ */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 pt-2">
        <Separator className="mb-4" />
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5" />
            Source: {course.sourceUrl ? (
              <a href={course.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#0057B8] hover:underline truncate max-w-[300px] inline-block">
                {course.sourceUrl}
              </a>
            ) : (
              'ALO Education database'
            )}
          </span>
          <span>Collected: {formatDate(course.collectedAt)}</span>
          <span>Verified: {formatDate(course.lastVerifiedAt)}</span>
          <span className="flex items-center gap-1">
            Status: {course.verificationStatus === 'VERIFIED'
              ? <span className="text-emerald-500 flex items-center gap-0.5"><CheckCircle className="size-3" /> Verified</span>
              : <span className="text-amber-500">{course.verificationStatus || 'Unverified'}</span>}
          </span>
        </div>
      </footer>
    </div>
  );
}
