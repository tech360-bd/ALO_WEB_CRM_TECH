'use client';

import { useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  Search,
  Bookmark,
  GraduationCap,
  Globe,
  Calendar,
  Clock,
  Languages,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ShieldCheck,
  Wallet,
  BookOpen,
  ArrowUpRight,
  Info,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface AiMatchCourse {
  id: string;
  name: string;
  university: string;
  country: string;
  city: string;
  flag: string;
  intake: string;
  duration: string;
  tuition: string;
  scholarship: string | null;
  matchScore: number;
  ielts: string;
  gpa: string;
  level: string;
  subject: string;
  ranking: number;
  logoColor: string;
  // AI Fit Analysis
  admissionChance: { level: 'High' | 'Medium' | 'Low'; explanation: string; percentage: number };
  scholarshipChance: { percentage: number; explanation: string };
  visaChance: { percentage: number; explanation: string };
  budgetFit: { fits: boolean; explanation: string };
  academicFit: { score: number; explanation: string };
  englishFit: { score: number; explanation: string };
  whyThisCourse: string[];
  improveTips: string[];
  riskWarning: string | null;
}

// ─── Mock Data ───────────────────────────────────────────────────────
const MOCK_AI_COURSES: AiMatchCourse[] = [
  {
    id: 'ai-1',
    name: 'MSc Data Science',
    university: 'University of Glasgow',
    country: 'UK',
    city: 'Glasgow',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£24,000',
    scholarship: null,
    matchScore: 92,
    ielts: '6.5',
    gpa: '3.2+',
    level: 'Masters',
    subject: 'Computer Science',
    ranking: 76,
    logoColor: 'bg-[#003865]',
    admissionChance: {
      level: 'High',
      percentage: 94,
      explanation: 'Your academic profile exceeds the minimum requirement. Strong SOP and relevant work experience further strengthen your application.',
    },
    scholarshipChance: {
      percentage: 45,
      explanation: 'Partial scholarships available. Apply early to International Excellence Scholarship.',
    },
    visaChance: {
      percentage: 96,
      explanation: 'Glasgow is a low-risk visa destination. University is highly trusted by UKVI.',
    },
    budgetFit: {
      fits: true,
      explanation: 'Within your stated budget of £30,000 for tuition.',
    },
    academicFit: {
      score: 95,
      explanation: 'Your GPA of 3.5 exceeds the minimum 3.2 requirement. Strong quantitative background is a plus.',
    },
    englishFit: {
      score: 90,
      explanation: 'Your IELTS 6.5 meets the exact requirement. All sub-scores above 6.0.',
    },
    whyThisCourse: [
      'Ranked #76 globally with strong research output in Data Science',
      'Curriculum covers machine learning, big data, and AI — aligned with your career goals',
      'Glasgow has a growing tech hub with excellent post-study work opportunities',
      'Includes a summer project with industry partners for practical experience',
    ],
    improveTips: [
      'Consider taking an online data science certification to strengthen your profile',
      'Prepare a research-focused SOP highlighting your analytics projects',
      'Apply before the early bird deadline for better scholarship consideration',
    ],
    riskWarning: null,
  },
  {
    id: 'ai-2',
    name: 'MSc Artificial Intelligence',
    university: 'University of Southampton',
    country: 'UK',
    city: 'Southampton',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£29,000',
    scholarship: null,
    matchScore: 90,
    ielts: '6.5',
    gpa: '3.3+',
    level: 'Masters',
    subject: 'Computer Science',
    ranking: 80,
    logoColor: 'bg-[#6B2D5B]',
    admissionChance: {
      level: 'High',
      percentage: 89,
      explanation: 'Strong academic match. Southampton ECS is highly regarded for AI research.',
    },
    scholarshipChance: {
      percentage: 35,
      explanation: 'Competitive scholarships. Apply with strong research proposal.',
    },
    visaChance: {
      percentage: 95,
      explanation: 'High visa success rate for Southampton students.',
    },
    budgetFit: {
      fits: true,
      explanation: 'Within your budget, though on the higher end. Consider living costs in Southampton.',
    },
    academicFit: {
      score: 92,
      explanation: 'Your GPA meets the requirement comfortably. AI-related coursework strengthens your application.',
    },
    englishFit: {
      score: 88,
      explanation: 'IELTS 6.5 meets the requirement. Consider improving to 7.0 for competitive edge.',
    },
    whyThisCourse: [
      'Southampton is a founding member of the Alan Turing Institute — UK\'s national AI institute',
      'Specialised modules in computer vision, NLP, and robotics',
      'Strong industry links with IBM, Microsoft, and defence sector',
      'Research-led teaching by world-renowned AI professors',
    ],
    improveTips: [
      'Highlight any AI/ML projects in your portfolio during application',
      'Prepare a statement of research interest for potential supervisors',
      'Consider reaching out to potential supervisors before applying',
    ],
    riskWarning: null,
  },
  {
    id: 'ai-3',
    name: 'MSc International Business',
    university: 'University of Leeds',
    country: 'UK',
    city: 'Leeds',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£21,000',
    scholarship: null,
    matchScore: 88,
    ielts: '6.0',
    gpa: '3.0+',
    level: 'Masters',
    subject: 'Business',
    ranking: 86,
    logoColor: 'bg-[#9B1B30]',
    admissionChance: {
      level: 'High',
      percentage: 91,
      explanation: 'Your profile is well above the minimum requirement for this program.',
    },
    scholarshipChance: {
      percentage: 55,
      explanation: 'Good scholarship opportunities for international students. Leeds Business School offers merit-based awards.',
    },
    visaChance: {
      percentage: 94,
      explanation: 'Leeds is a popular student city with high visa approval rates.',
    },
    budgetFit: {
      fits: true,
      explanation: 'Well within your budget. Leeds has lower living costs than London.',
    },
    academicFit: {
      score: 88,
      explanation: 'Your GPA of 3.5 comfortably exceeds the 3.0 minimum. Business background is a strong fit.',
    },
    englishFit: {
      score: 95,
      explanation: 'Your IELTS 6.5 exceeds the 6.0 requirement by a comfortable margin.',
    },
    whyThisCourse: [
      'Triple-accredited business school (AMBA, EQUIS, AACSB)',
      'Optional 12-month work placement for practical experience',
      'Diverse international cohort from 100+ countries',
      'Leeds is a major financial and business hub in the UK',
    ],
    improveTips: [
      'Get a professional reference letter from a business-related employer',
      'Highlight leadership experience in extracurricular activities',
    ],
    riskWarning: null,
  },
  {
    id: 'ai-4',
    name: 'MSc Computer Science',
    university: 'University of Birmingham',
    country: 'UK',
    city: 'Birmingham',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£28,000',
    scholarship: null,
    matchScore: 85,
    ielts: '6.5',
    gpa: '3.3+',
    level: 'Masters',
    subject: 'Computer Science',
    ranking: 84,
    logoColor: 'bg-[#2563EB]',
    admissionChance: {
      level: 'High',
      percentage: 85,
      explanation: 'Strong fit. Birmingham CS is highly ranked with competitive admissions.',
    },
    scholarshipChance: {
      percentage: 30,
      explanation: 'Limited scholarships available. Apply to Global Masters Scholarship.',
    },
    visaChance: {
      percentage: 93,
      explanation: 'Birmingham is a Russell Group university with strong visa track record.',
    },
    budgetFit: {
      fits: true,
      explanation: 'Within budget. Birmingham living costs are moderate.',
    },
    academicFit: {
      score: 90,
      explanation: 'Your GPA meets the 3.3 requirement. CS background is ideal.',
    },
    englishFit: {
      score: 88,
      explanation: 'IELTS 6.5 meets the requirement exactly. Writing sub-score is important.',
    },
    whyThisCourse: [
      'Russell Group university with excellent research facilities',
      'Modules include AI, cybersecurity, and software engineering',
      'Birmingham has a thriving tech startup ecosystem',
      'Strong alumni network in top tech companies globally',
    ],
    improveTips: [
      'Prepare coding portfolio or GitHub to demonstrate technical skills',
      'Consider taking a GRE subject test in Computer Science',
    ],
    riskWarning: null,
  },
  {
    id: 'ai-5',
    name: 'MBA',
    university: 'University of Aberdeen',
    country: 'UK',
    city: 'Aberdeen',
    flag: '🇬🇧',
    intake: 'Sep 2026',
    duration: '1 year',
    tuition: '£18,000',
    scholarship: '£3,000',
    matchScore: 82,
    ielts: '6.5',
    gpa: '3.0+',
    level: 'Masters',
    subject: 'Business',
    ranking: 208,
    logoColor: 'bg-[#8B0000]',
    admissionChance: {
      level: 'High',
      percentage: 87,
      explanation: 'Your academic profile is competitive. Work experience will strengthen application further.',
    },
    scholarshipChance: {
      percentage: 65,
      explanation: 'Good chance for the £3,000 international scholarship. Early application recommended.',
    },
    visaChance: {
      percentage: 92,
      explanation: 'Aberdeen has a strong visa track record, especially for postgraduate students.',
    },
    budgetFit: {
      fits: true,
      explanation: 'Most affordable option with scholarship potential. Lowest tuition in your matches.',
    },
    academicFit: {
      score: 85,
      explanation: 'Your GPA exceeds the 3.0 minimum. Business-related work experience is beneficial.',
    },
    englishFit: {
      score: 88,
      explanation: 'IELTS 6.5 meets the requirement. Strong writing score recommended for MBA.',
    },
    whyThisCourse: [
      'Most affordable MBA among UK Russell Group universities',
      '£3,000 scholarship available for international students',
      'Aberdeen is the energy capital of Europe — great for networking',
      'Small class sizes ensure personalized attention and mentorship',
    ],
    improveTips: [
      'Gain 2-3 years of work experience before applying for maximum impact',
      'Prepare for a possible interview with the admissions committee',
    ],
    riskWarning: null,
  },
  {
    id: 'ai-6',
    name: 'Foundation in Business',
    university: 'INTO London',
    country: 'UK',
    city: 'London',
    flag: '🇬🇧',
    intake: 'Jan 2026',
    duration: '9 months',
    tuition: '£15,000',
    scholarship: null,
    matchScore: 65,
    ielts: '5.5',
    gpa: '2.5+',
    level: 'Foundation',
    subject: 'Business',
    ranking: 0,
    logoColor: 'bg-[#2563EB]',
    admissionChance: {
      level: 'High',
      percentage: 98,
      explanation: 'Foundation programs have very high acceptance rates. Your profile is well above minimum.',
    },
    scholarshipChance: {
      percentage: 20,
      explanation: 'Limited scholarships for foundation programs. Focus on progression scholarship.',
    },
    visaChance: {
      percentage: 88,
      explanation: 'Visa success is good but London has higher scrutiny. Ensure all documents are accurate.',
    },
    budgetFit: {
      fits: true,
      explanation: 'Lowest tuition cost. However, London living costs are significantly higher.',
    },
    academicFit: {
      score: 99,
      explanation: 'Your GPA of 3.5 far exceeds the 2.5 minimum for foundation entry.',
    },
    englishFit: {
      score: 99,
      explanation: 'Your IELTS 6.5 is well above the 5.5 minimum requirement.',
    },
    whyThisCourse: [
      'Guaranteed progression to a partner university upon successful completion',
      'Location in London provides access to major business districts',
      'Intensive English support alongside academic modules',
      'Fast-track pathway to top UK business schools',
    ],
    improveTips: [
      'Consider applying directly to a Masters program given your strong academic profile',
      'If choosing foundation, negotiate progression guarantee with specific university',
    ],
    riskWarning: 'Your academic profile significantly exceeds the typical requirement for a Foundation program. You may be overqualified. Consider applying directly to a Masters program instead for better value and career outcomes.',
  },
];

// ─── Helper Functions ────────────────────────────────────────────────
function matchScoreColor(score: number): { bg: string; ring: string; text: string; label: string } {
  if (score >= 90) return { bg: 'bg-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-700', label: 'Excellent Match' };
  if (score >= 70) return { bg: 'bg-[#2563EB]', ring: 'ring-blue-200', text: 'text-[#2563EB]', label: 'Good Match' };
  return { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-700', label: 'Fair Match' };
}

function admissionBadge(level: string) {
  switch (level) {
    case 'High': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Low': return 'bg-red-50 text-red-700 border-red-200';
    default: return '';
  }
}

function FitBar({ label, value, maxVal, icon: Icon, description }: {
  label: string;
  value: number;
  maxVal?: number;
  icon: React.ElementType;
  description?: string;
}) {
  const max = maxVal || 100;
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= 90 ? 'bg-emerald-500' : value >= 70 ? 'bg-[#2563EB]' : 'bg-amber-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Icon className="size-4 text-slate-400" />
          {label}
        </span>
        <span className={`text-sm font-bold ${value >= 90 ? 'text-emerald-600' : value >= 70 ? 'text-[#2563EB]' : 'text-amber-600'}`}>
          {value}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {description && (
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

// ─── AI Match Card ───────────────────────────────────────────────────
function AiMatchCard({ course }: { course: AiMatchCourse }) {
  const [shortlisted, setShortlisted] = useState(false);
  const [compared, setCompared] = useState(false);
  const colors = matchScoreColor(course.matchScore);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Risk Warning Banner */}
      {course.riskWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-0.5">Important Note</p>
            <p className="text-xs text-amber-700 leading-relaxed">{course.riskWarning}</p>
          </div>
        </div>
      )}

      <div className="p-5 md:p-6">
        {/* Top Row: University + Match Score */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`shrink-0 size-12 rounded-xl ${course.logoColor} flex items-center justify-center text-white font-bold text-lg`}>
              {course.university.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 text-base md:text-lg leading-tight line-clamp-1">
                {course.name}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">{course.university}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <span className="text-sm">{course.flag}</span> {course.city}, {course.country}
                </span>
                <span className="text-slate-300">•</span>
                <Badge variant="outline" className="text-[11px] px-2 py-0 border-slate-200 text-slate-600">
                  <Calendar className="size-3 mr-1" /> {course.intake}
                </Badge>
                <Badge variant="outline" className="text-[11px] px-2 py-0 border-slate-200 text-slate-600">
                  <Clock className="size-3 mr-1" /> {course.duration}
                </Badge>
              </div>
            </div>
          </div>

          {/* Match Score Circle */}
          <div className="shrink-0 flex flex-col items-center">
            <div className={`size-16 md:size-20 rounded-full ${colors.bg} ring-4 ${colors.ring} flex flex-col items-center justify-center`}>
              <span className="text-xl md:text-2xl font-bold text-white">{course.matchScore}%</span>
              <span className="text-[9px] md:text-[10px] font-medium text-white/80">Match</span>
            </div>
            <span className={`text-[10px] font-medium mt-1.5 ${colors.text}`}>{colors.label}</span>
          </div>
        </div>

        {/* Tuition + Scholarship */}
        <div className="flex items-baseline gap-3 mb-5">
          <span className="text-xl font-bold text-slate-900">{course.tuition}</span>
          {course.scholarship && (
            <Badge variant="success" className="text-xs font-semibold">
              Scholarship {course.scholarship}
            </Badge>
          )}
        </div>

        <Separator className="mb-5" />

        {/* Fit Analysis Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-5">
          <FitBar
            label="Admission Chance"
            value={course.admissionChance.percentage}
            icon={TrendingUp}
            description={course.admissionChance.explanation}
          />
          <FitBar
            label="Scholarship Chance"
            value={course.scholarshipChance.percentage}
            icon={Wallet}
            description={course.scholarshipChance.explanation}
          />
          <FitBar
            label="Visa Chance"
            value={course.visaChance.percentage}
            icon={ShieldCheck}
            description={course.visaChance.explanation}
          />
          <FitBar
            label="Academic Fit"
            value={course.academicFit.score}
            icon={BookOpen}
            description={course.academicFit.explanation}
          />
          <FitBar
            label="English Fit"
            value={course.englishFit.score}
            icon={Languages}
            description={course.englishFit.explanation}
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Wallet className="size-4 text-slate-400" />
                Budget Fit
              </span>
              {course.budgetFit.fits ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 className="size-4" /> Yes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                  <XCircle className="size-4" /> No
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{course.budgetFit.explanation}</p>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Expandable Sections */}
        <Accordion type="multiple" className="w-full mb-5">
          <AccordionItem value="why" className="border-b-0">
            <AccordionTrigger className="py-3 text-sm font-semibold text-slate-800 hover:no-underline">
              <span className="flex items-center gap-2">
                <Info className="size-4 text-[#2563EB]" />
                Why This Course?
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 pl-6">
                {course.whyThisCourse.map((point, i) => (
                  <li key={i} className="text-sm text-slate-600 leading-relaxed list-disc marker:text-[#2563EB]">
                    {point}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="improve" className="border-b-0">
            <AccordionTrigger className="py-3 text-sm font-semibold text-slate-800 hover:no-underline">
              <span className="flex items-center gap-2">
                <ArrowUpRight className="size-4 text-emerald-600" />
                How To Improve Eligibility
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 pl-6">
                {course.improveTips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-600 leading-relaxed list-disc marker:text-emerald-500">
                    {tip}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="cta" className="flex-1 min-w-[120px]">
            Apply Now
          </Button>
          <Button
            variant="outline"
            className={shortlisted ? 'border-amber-400 bg-amber-50 text-amber-700' : ''}
            onClick={() => setShortlisted(!shortlisted)}
          >
            <Bookmark className={`size-4 ${shortlisted ? 'fill-amber-500 text-amber-500' : ''}`} />
            {shortlisted ? 'Saved' : 'Shortlist'}
          </Button>
          <Button
            variant={compared ? 'brand' : 'outline'}
            size="icon"
            onClick={() => setCompared(!compared)}
          >
            <Globe className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function StudentAiMatch() {
  usePortalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const filtered = MOCK_AI_COURSES.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.university.toLowerCase().includes(q)) return false;
    }
    if (levelFilter !== 'all' && c.level !== levelFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Explanation Card ─────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#2563EB] to-[#003d8f] px-4 py-8 md:py-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="shrink-0 size-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
                  AI Course Matching
                </h1>
                <p className="text-white/80 text-sm md:text-base leading-relaxed">
                  AI analyzes your profile, education, English score, budget, and preferences to find your best-fit courses.
                  Each recommendation includes detailed eligibility analysis and actionable insights.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search matched courses..."
                  className="h-10 pl-10 pr-4 text-sm rounded-lg bg-white border-0"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 text-sm rounded-lg">
                  <SelectValue placeholder="Program Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Foundation">Foundation</SelectItem>
                  <SelectItem value="Masters">Masters</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                  <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Results ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filtered.length}</span> AI-matched courses
          </p>
          <Badge variant="brand" className="text-xs">
            <Sparkles className="size-3 mr-1" /> Powered by AI
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((course) => (
            <AiMatchCard key={course.id} course={course} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Sparkles className="size-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No matches found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </section>
    </div>
  );
}