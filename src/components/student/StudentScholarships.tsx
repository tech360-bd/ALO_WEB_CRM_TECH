'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  GraduationCap,
  Award,
  Clock,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Filter,
  MapPin,
  Calendar,
  Star,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
} from 'lucide-react';

/* ================================================================== */
/*  TYPES                                                               */
/* ================================================================== */
type ScholarshipStatus = 'Not Applied' | 'Applied' | 'Shortlisted' | 'Won';
type MatchLevel = 'High' | 'Medium' | 'Low';
type FilterStatus = 'All' | 'Eligible' | 'Applied' | 'Won';

interface Scholarship {
  id: string;
  university: string;
  name: string;
  amount: string;
  amountValue: number;
  eligibility: string[];
  deadline: string;
  deadlineLabel: string;
  matchChance: number;
  matchLevel: MatchLevel;
  status: ScholarshipStatus;
  requirements: string[];
  country: string;
  level: string;
  featured?: boolean;
  saved?: boolean;
}

/* ================================================================== */
/*  MOCK DATA                                                          */
/* ================================================================== */
const MOCK_SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'sch-1',
    university: 'University of Glasgow',
    name: 'International Excellence Scholarship',
    amount: '£5,000 per year',
    amountValue: 5000,
    eligibility: ['International student', 'Undergraduate or Postgraduate', 'Academic merit'],
    deadline: '2025-08-30',
    deadlineLabel: 'Aug 30, 2025',
    matchChance: 85,
    matchLevel: 'High',
    status: 'Not Applied',
    requirements: ['IELTS 6.5+', 'GPA 3.5+', 'Personal statement'],
    country: 'UK',
    level: 'Postgraduate',
    featured: true,
    saved: true,
  },
  {
    id: 'sch-2',
    university: 'University of Leeds',
    name: 'Merit Scholarship',
    amount: '£3,000 per year',
    amountValue: 3000,
    eligibility: ['International undergraduate', 'Strong academic record'],
    deadline: '2025-09-15',
    deadlineLabel: 'Sep 15, 2025',
    matchChance: 78,
    matchLevel: 'High',
    status: 'Not Applied',
    requirements: ['IELTS 6.0+', 'GPA 3.2+'],
    country: 'UK',
    level: 'Undergraduate',
    featured: true,
    saved: false,
  },
  {
    id: 'sch-3',
    university: 'UK Government',
    name: 'Chevening Scholarship',
    amount: 'Full tuition + living',
    amountValue: 50000,
    eligibility: ['Citizen of Chevening-eligible country', '2 years work experience', 'Leadership potential'],
    deadline: '2025-11-05',
    deadlineLabel: 'Nov 5, 2025',
    matchChance: 45,
    matchLevel: 'Low',
    status: 'Not Applied',
    requirements: ['IELTS 7.0+', '2 years work experience', 'Four essays'],
    country: 'UK',
    level: 'Postgraduate',
    featured: true,
    saved: false,
  },
  {
    id: 'sch-4',
    university: 'Commonwealth',
    name: 'Commonwealth Scholarship',
    amount: 'Full tuition + living',
    amountValue: 55000,
    eligibility: ['Commonwealth citizen', 'Academic excellence', 'Development impact'],
    deadline: '2025-12-15',
    deadlineLabel: 'Dec 15, 2025',
    matchChance: 50,
    matchLevel: 'Medium',
    status: 'Not Applied',
    requirements: ['IELTS 6.5+', 'GPA 3.5+', 'Research proposal'],
    country: 'UK',
    level: 'Postgraduate',
    saved: false,
  },
  {
    id: 'sch-5',
    university: 'University of Aberdeen',
    name: 'Global Scholarship',
    amount: '£2,000 per year',
    amountValue: 2000,
    eligibility: ['International student', 'Self-funded'],
    deadline: '2026-06-01',
    deadlineLabel: 'Rolling admission',
    matchChance: 90,
    matchLevel: 'High',
    status: 'Not Applied',
    requirements: ['IELTS 6.5+', 'Conditional offer'],
    country: 'UK',
    level: 'Postgraduate',
    saved: true,
  },
  {
    id: 'sch-6',
    university: 'British Council',
    name: 'GREAT Scholarship',
    amount: '£10,000 one-time',
    amountValue: 10000,
    eligibility: ['Bangladesh / India / Pakistan citizen', 'Postgraduate offer'],
    deadline: '2026-05-01',
    deadlineLabel: 'May 2026',
    matchChance: 60,
    matchLevel: 'Medium',
    status: 'Not Applied',
    requirements: ['IELTS 6.5+', 'GPA 3.0+', 'Offer letter'],
    country: 'UK',
    level: 'Postgraduate',
    saved: false,
  },
  {
    id: 'sch-7',
    university: 'University of Birmingham',
    name: 'International Scholarship',
    amount: '£3,500 per year',
    amountValue: 3500,
    eligibility: ['International student', 'Strong academics'],
    deadline: '2026-06-01',
    deadlineLabel: 'Jun 2026',
    matchChance: 72,
    matchLevel: 'High',
    status: 'Not Applied',
    requirements: ['IELTS 6.5+', 'Academic transcript'],
    country: 'UK',
    level: 'Postgraduate',
    saved: false,
  },
  {
    id: 'sch-8',
    university: 'University of Sheffield',
    name: 'International Scholarship',
    amount: '£2,500 per year',
    amountValue: 2500,
    eligibility: ['International student', 'Any discipline'],
    deadline: '2026-07-01',
    deadlineLabel: 'Jul 2026',
    matchChance: 68,
    matchLevel: 'Medium',
    status: 'Not Applied',
    requirements: ['IELTS 6.0+', 'Conditional/unconditional offer'],
    country: 'UK',
    level: 'Postgraduate',
    saved: false,
  },
];

/* ================================================================== */
/*  HELPERS                                                            */
/* ================================================================== */
function getDaysUntil(dateStr: string): number | null {
  if (dateStr.includes('Rolling') || dateStr.includes('2026')) return null;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getMatchColor(level: MatchLevel) {
  switch (level) {
    case 'High': return 'bg-crm-success-bg text-crm-success-text border-crm-success/20';
    case 'Medium': return 'bg-crm-warning-bg text-crm-warning-text border-crm-warning/30';
    case 'Low': return 'bg-crm-danger-bg text-crm-danger-text border-crm-danger/20';
  }
}

function getStatusVariant(status: ScholarshipStatus) {
  switch (status) {
    case 'Won': return 'success' as const;
    case 'Shortlisted': return 'brand' as const;
    case 'Applied': return 'secondary' as const;
    default: return 'outline' as const;
  }
}

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
export default function StudentScholarships() {
  const { user, token } = usePortalStore();
  const [apiScholarships, setApiScholarships] = useState<Scholarship[] | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/student-portal/scholarships", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => { if (j.success && j.data && j.data.length > 0) setApiScholarships(j.data as Scholarship[]); })
      .catch(() => {});
  }, [token]);

  const scholarships = (apiScholarships && apiScholarships.length > 0) ? apiScholarships : MOCK_SCHOLARSHIPS;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [filterAmount, setFilterAmount] = useState('All');
  const [filterDeadline, setFilterDeadline] = useState('All');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');

  const [savedIds, setSavedIds] = useState<Set<string>>(
    new Set(MOCK_SCHOLARSHIPS.filter((s) => s.saved).map((s) => s.id))
  );
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [aiMatchExpanded, setAiMatchExpanded] = useState(true);

  /* ---------- Filtering ---------- */
  const filteredScholarships = useMemo(() => {
    return scholarships.filter((s) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.university.toLowerCase().includes(q) &&
          !s.amount.toLowerCase().includes(q)
        )
          return false;
      }
      if (filterCountry !== 'All' && s.country !== filterCountry) return false;
      if (filterLevel !== 'All' && s.level !== filterLevel) return false;
      if (filterAmount === 'Under £3k' && s.amountValue >= 3000) return false;
      if (filterAmount === '£3k–£10k' && (s.amountValue < 3000 || s.amountValue > 10000)) return false;
      if (filterAmount === 'Full Tuition' && s.amountValue < 40000) return false;
      if (filterDeadline === '30 days' && getDaysUntil(s.deadline) !== null && (getDaysUntil(s.deadline)! > 30 || getDaysUntil(s.deadline)! < 0)) return false;
      if (filterDeadline === '90 days' && getDaysUntil(s.deadline) !== null && (getDaysUntil(s.deadline)! > 90 || getDaysUntil(s.deadline)! < 0)) return false;
      if (filterDeadline === '6+ months' && getDaysUntil(s.deadline) !== null && getDaysUntil(s.deadline)! < 180) return false;
      if (filterStatus === 'Eligible' && s.matchChance < 60) return false;
      if (filterStatus === 'Applied' && !appliedIds.has(s.id)) return false;
      if (filterStatus === 'Won' && s.status !== 'Won') return false;
      return true;
    });
  }, [searchQuery, filterCountry, filterLevel, filterAmount, filterDeadline, filterStatus, appliedIds]);

  const featuredScholarships = filteredScholarships.filter((s) => s.featured);
  const gridScholarships = filteredScholarships.filter((s) => !s.featured);

  const aiMatched = scholarships
    .filter((s) => s.matchChance >= 50)
    .sort((a, b) => b.matchChance - a.matchChance)
    .slice(0, 5);

  /* ---------- Actions ---------- */
  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApply = (id: string) => {
    setAppliedIds((prev) => new Set(prev).add(id));
  };

  /* ---------- Count helpers ---------- */
  const totalScholarships = scholarships.length;
  const upcomingCount = scholarships.filter(
    (s) => getDaysUntil(s.deadline) !== null && getDaysUntil(s.deadline)! > 0
  ).length;

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/*  HEADER                                                       */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-crm-page text-2xl font-bold tracking-tight text-alo-text sm:text-3xl">
            Scholarships
          </h1>
          <p className="mt-1 text-sm text-alo-text-muted">
            {totalScholarships} scholarships available &middot; {upcomingCount} with upcoming deadlines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand" className="gap-1.5 px-3 py-1">
            <GraduationCap className="size-3.5" />
            {savedIds.size} Saved
          </Badge>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  FILTERS & SEARCH                                             */}
      {/* ============================================================ */}
      <Card className="border-alo-border/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="size-4 text-alo-text-muted" />
            <span className="text-sm font-medium text-alo-text">Filters</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-alo-text-muted" />
              <Input
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Country */}
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Countries</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
              </SelectContent>
            </Select>
            {/* Level */}
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Levels</SelectItem>
                <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                <SelectItem value="Postgraduate">Postgraduate</SelectItem>
              </SelectContent>
            </Select>
            {/* Amount */}
            <Select value={filterAmount} onValueChange={setFilterAmount}>
              <SelectTrigger>
                <SelectValue placeholder="Amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Any Amount</SelectItem>
                <SelectItem value="Under £3k">Under £3,000</SelectItem>
                <SelectItem value="£3k–£10k">£3,000 – £10,000</SelectItem>
                <SelectItem value="Full Tuition">Full Tuition</SelectItem>
              </SelectContent>
            </Select>
            {/* Status */}
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Eligible">Eligible (60%+)</SelectItem>
                <SelectItem value="Applied">Applied</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/*  FEATURED SCHOLARSHIPS                                         */}
      {/* ============================================================ */}
      {featuredScholarships.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Star className="size-5 text-alo-cta" />
            <h2 className="text-lg font-semibold text-alo-text">Featured Scholarships</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredScholarships.map((scholarship) => (
              <FeaturedScholarshipCard
                key={scholarship.id}
                scholarship={scholarship}
                isSaved={savedIds.has(scholarship.id)}
                isApplied={appliedIds.has(scholarship.id)}
                onToggleSave={() => toggleSave(scholarship.id)}
                onApply={() => handleApply(scholarship.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  SCHOLARSHIP GRID                                             */}
      {/* ============================================================ */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-alo-text">
            All Scholarships
            <span className="ml-2 text-sm font-normal text-alo-text-muted">
              ({filteredScholarships.length} results)
            </span>
          </h2>
        </div>
        {filteredScholarships.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="mb-3 size-10 text-alo-text-muted/40" />
              <p className="text-sm font-medium text-alo-text-muted">No scholarships match your filters</p>
              <p className="mt-1 text-xs text-alo-text-muted">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gridScholarships.map((scholarship) => (
              <ScholarshipCard
                key={scholarship.id}
                scholarship={scholarship}
                isSaved={savedIds.has(scholarship.id)}
                isApplied={appliedIds.has(scholarship.id)}
                onToggleSave={() => toggleSave(scholarship.id)}
                onApply={() => handleApply(scholarship.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/*  AI SCHOLARSHIP MATCH                                         */}
      {/* ============================================================ */}
      <section>
        <Card className="overflow-hidden border-alo-brand/20 bg-gradient-to-br from-alo-brand-light to-white">
          <CardContent className="p-0">
            {/* Header */}
            <button
              onClick={() => setAiMatchExpanded(!aiMatchExpanded)}
              className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-alo-brand/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-alo-brand/10">
                  <Sparkles className="size-5 text-alo-brand" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-alo-text">AI Scholarship Match</h2>
                  <p className="text-sm text-alo-text-muted">
                    Based on your profile, you may be eligible for <span className="font-semibold text-alo-brand">{aiMatched.length} scholarships</span>
                  </p>
                </div>
              </div>
              {aiMatchExpanded ? (
                <ChevronUp className="size-5 text-alo-text-muted" />
              ) : (
                <ChevronDown className="size-5 text-alo-text-muted" />
              )}
            </button>

            {/* Matched list */}
            {aiMatchExpanded && (
              <div className="border-t border-alo-brand/10 px-5 pb-5 pt-4">
                <div className="space-y-3">
                  {aiMatched.map((scholarship) => (
                    <div
                      key={scholarship.id}
                      className="flex items-center gap-4 rounded-lg border border-alo-border/50 bg-white p-3 transition-colors hover:border-alo-brand/30 hover:bg-alo-brand-light/50"
                    >
                      {/* Match percentage */}
                      <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-alo-brand/10">
                        <span className="text-sm font-bold text-alo-brand">{scholarship.matchChance}%</span>
                      </div>
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-alo-text">{scholarship.name}</p>
                        <p className="truncate text-xs text-alo-text-muted">
                          {scholarship.university} &middot; {scholarship.amount}
                        </p>
                      </div>
                      {/* Chance badge */}
                      <Badge className={cn('flex-shrink-0', getMatchColor(scholarship.matchLevel))}>
                        {scholarship.matchLevel} Match
                      </Badge>
                      {/* Action */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 text-alo-brand hover:bg-alo-brand/10"
                        onClick={() => handleApply(scholarship.id)}
                      >
                        {appliedIds.has(scholarship.id) ? 'Applied' : 'Apply'}
                        {appliedIds.has(scholarship.id) && <Award className="size-3.5" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/* ================================================================== */
/*  FEATURED SCHOLARSHIP CARD                                          */
/* ================================================================== */
function FeaturedScholarshipCard({
  scholarship,
  isSaved,
  isApplied,
  onToggleSave,
  onApply,
}: {
  scholarship: Scholarship;
  isSaved: boolean;
  isApplied: boolean;
  onToggleSave: () => void;
  onApply: () => void;
}) {
  const daysUntil = getDaysUntil(scholarship.deadline);

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-2 border-l-4',
        'border-l-alo-cta border-t-alo-border border-r-alo-border border-b-alo-border',
        'bg-gradient-to-br from-white via-white to-alo-brand-light/30',
        'transition-all hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      {/* University placeholder logo */}
      <div className="flex h-10 items-center gap-2 px-5 pt-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-alo-brand/10 text-xs font-bold text-alo-brand">
          {scholarship.university.charAt(0)}
        </div>
        <span className="text-xs font-medium text-alo-text-muted">{scholarship.university}</span>
        <div className="ml-auto">
          <Badge className={cn(getMatchColor(scholarship.matchLevel))}>
            {scholarship.matchChance}% Match
          </Badge>
        </div>
      </div>
      <CardContent className="space-y-3 px-5 pt-3 pb-5">
        <h3 className="text-base font-semibold leading-snug text-alo-text">{scholarship.name}</h3>
        <p className="text-xl font-bold text-crm-success">{scholarship.amount}</p>
        <ul className="space-y-1">
          {scholarship.eligibility.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-alo-text-secondary">
              <Target className="mt-0.5 size-3 flex-shrink-0 text-alo-brand" />
              {item}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 text-xs text-alo-text-muted">
          <Calendar className="size-3.5" />
          <span>Deadline: {scholarship.deadlineLabel}</span>
          {daysUntil !== null && (
            <Badge variant="muted" className="ml-1 text-[10px]">
              {daysUntil > 0 ? `${daysUntil}d left` : 'Passed'}
            </Badge>
          )}
        </div>
        <Separator />
        <div className="flex items-center gap-2">
          <Button
            variant="cta"
            size="sm"
            className="flex-1"
            disabled={isApplied}
            onClick={onApply}
          >
            {isApplied ? (
              <>
                <Award className="size-3.5" />
                Applied
              </>
            ) : (
              'Apply'
            )}
          </Button>
          <Button
            variant={isSaved ? 'default' : 'outline'}
            size="icon-sm"
            onClick={onToggleSave}
            className={cn(
              isSaved ? 'bg-alo-cta/10 text-alo-cta border-alo-cta/30 hover:bg-alo-cta/20' : ''
            )}
          >
            {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  SCHOLARSHIP CARD (Grid)                                            */
/* ================================================================== */
function ScholarshipCard({
  scholarship,
  isSaved,
  isApplied,
  onToggleSave,
  onApply,
}: {
  scholarship: Scholarship;
  isSaved: boolean;
  isApplied: boolean;
  onToggleSave: () => void;
  onApply: () => void;
}) {
  const daysUntil = getDaysUntil(scholarship.deadline);

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
      {/* Header with logo and badges */}
      <div className="flex items-start gap-3 px-5 pt-5">
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-alo-brand/10 text-sm font-bold text-alo-brand">
          {scholarship.university.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-alo-text">{scholarship.name}</h3>
          <p className="mt-0.5 text-xs text-alo-text-muted">{scholarship.university}</p>
        </div>
        <Badge className={cn('flex-shrink-0', getMatchColor(scholarship.matchLevel))}>
          {scholarship.matchLevel}
        </Badge>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 px-5 pt-3 pb-5">
        {/* Amount */}
        <p className="text-lg font-bold text-crm-success">{scholarship.amount}</p>

        {/* Eligibility */}
        <ul className="space-y-1">
          {scholarship.eligibility.slice(0, 3).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-alo-text-secondary">
              <Target className="mt-0.5 size-3 flex-shrink-0 text-alo-brand/60" />
              {item}
            </li>
          ))}
        </ul>

        {/* Requirements */}
        <div className="flex flex-wrap gap-1.5">
          {scholarship.requirements.map((req, i) => (
            <Badge key={i} variant="muted" className="text-[10px] font-medium">
              {req}
            </Badge>
          ))}
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-2 text-xs text-alo-text-muted">
          <Clock className="size-3.5" />
          <span>{scholarship.deadlineLabel}</span>
          {daysUntil !== null && (
            <Badge
              variant={daysUntil <= 30 ? 'warning' : 'muted'}
              className="text-[10px]"
            >
              {daysUntil > 0 ? `${daysUntil}d left` : 'Passed'}
            </Badge>
          )}
        </div>

        {/* Match chance bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-alo-text-muted">Scholarship Chance</span>
            <span className={cn(
              'font-semibold',
              scholarship.matchChance >= 70 ? 'text-crm-success-text' :
              scholarship.matchChance >= 50 ? 'text-crm-warning-text' :
              'text-crm-danger-text'
            )}>
              {scholarship.matchChance}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                scholarship.matchChance >= 70 ? 'bg-crm-success' :
                scholarship.matchChance >= 50 ? 'bg-crm-warning' :
                'bg-crm-danger'
              )}
              style={{ width: `${scholarship.matchChance}%` }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-alo-text-muted">Status:</span>
          {isApplied ? (
            <Badge variant="brand" className="text-[10px]">Applied</Badge>
          ) : (
            <Badge variant={getStatusVariant(scholarship.status)} className="text-[10px]">
              {scholarship.status}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="cta"
            size="sm"
            className="flex-1"
            disabled={isApplied}
            onClick={onApply}
          >
            {isApplied ? (
              <>
                <Award className="size-3.5" />
                Applied
              </>
            ) : (
              'Apply'
            )}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">Details</span>
          </Button>
          <Button
            variant={isSaved ? 'default' : 'outline'}
            size="icon-sm"
            onClick={onToggleSave}
            className={cn(
              isSaved ? 'bg-alo-cta/10 text-alo-cta border-alo-cta/30 hover:bg-alo-cta/20' : ''
            )}
          >
            {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}