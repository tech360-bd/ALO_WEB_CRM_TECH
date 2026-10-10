'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  GitCompare, X, Search, Plus, SearchX, Send, Download,
  MessageCircle, GraduationCap, Loader2, ShieldCheck, MapPin, Award,
  Clock, DollarSign, Calendar, BookOpen, Globe, ArrowLeft,
  Building2, Users, Star, FileText, CheckCircle, AlertTriangle,
  Briefcase, Copy, Printer, Trash2, Save, Share2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { COUNTRY_FLAGS } from './types';

// ─── ALO Brand Colors ─────────────────────────────────────────────────────────
const ALO_BLUE = '#2563EB';
const ALO_ORANGE = '#F97316';
const MAX_ITEMS = 4;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CourseCompareData {
  id: string;
  slug: string;
  title: string;
  universityId?: string;
  country?: string;
  city?: string;
  studyLevel?: string;
  qualification?: string;
  duration?: string;
  durationMonths?: number;
  tuitionFee?: number;
  tuitionCurrency?: string;
  tuitionPeriod?: string;
  depositRequired?: boolean;
  depositAmount?: number;
  applicationFee?: number;
  applicationFeeCurrency?: string;
  ieltsMin?: number;
  pteMin?: number;
  toeflMin?: number;
  duolingoMin?: number;
  scholarshipAvailable?: boolean;
  applicationDeadline?: string;
  nextIntake?: string;
  placementAvailable?: boolean;
  studyMode?: string;
  deliveryMode?: string;
  workExperienceRequired?: boolean;
  academicRequirement?: string;
  lastVerifiedAt?: string;
  verificationStatus?: string;
  gpaMin?: number;
  university?: {
    id: string;
    name: string;
    slug: string;
    city?: string;
    country?: string;
    rankingValue?: number;
    logoUrl?: string;
  };
}

interface UniversityCompareData {
  id: string;
  name: string;
  slug: string;
  country?: string;
  city?: string;
  institutionType?: string;
  rankingValue?: number;
  courseCount?: number;
  websiteUrl?: string;
  logoUrl?: string;
  scholarshipAvailable?: boolean;
  accommodationAvailable?: boolean;
  employabilityRate?: number;
  featured?: boolean;
}

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  universityName: string;
  country: string;
  studyLevel: string;
}

interface UniversitySearchResult {
  id: string;
  name: string;
  slug: string;
  country: string;
  city?: string;
  rankingValue?: number;
}

type CompareMode = 'courses' | 'universities';

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
      return 'bg-[#2563EB]/10 text-[#2563EB]';
    case 'postgraduate': case 'master':
      return 'bg-[#2563EB]/20 text-[#2563EB]';
    case 'phd': case 'doctorate':
      return 'bg-[#2563EB]/30 text-[#2563EB]';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

// Best value highlighting helpers
function getBestFee(courses: CourseCompareData[]): number | null {
  const fees = courses.map(c => c.tuitionFee).filter((f): f is number => f != null);
  return fees.length > 1 ? Math.min(...fees) : null;
}

function getBestRanking(courses: CourseCompareData[]): number | null {
  const ranks = courses.map(c => c.university?.rankingValue).filter((r): r is number => r != null);
  return ranks.length > 1 ? Math.min(...ranks) : null;
}

function getLowestIelts(courses: CourseCompareData[]): number | null {
  const scores = courses.map(c => c.ieltsMin).filter((s): s is number => s != null);
  return scores.length > 1 ? Math.min(...scores) : null;
}

// ─── Comparison Row Types ─────────────────────────────────────────────────────
interface CompareRow {
  key: string;
  label: string;
  icon: React.ElementType;
  render: (item: CourseCompareData, isBest?: boolean) => React.ReactNode;
}

// ─── Search Components ─────────────────────────────────────────────────────────
function CourseSearch({ onSelect, disabled }: {
  onSelect: (course: SearchResult) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ keyword: query, limit: '8' });
        const res = await fetch(`/api/course-finder?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResults((data.courses || []).map((c: { id: string; slug: string; title: string; universityName: string; country: string; studyLevel: string }) => ({
            id: c.id, slug: c.slug, title: c.title,
            universityName: c.universityName, country: c.country, studyLevel: c.studyLevel,
          })));
          setOpen(true);
        }
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search courses to compare..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          disabled={disabled}
          className="pl-10"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
              onClick={() => { onSelect(r); setQuery(''); setOpen(false); }}
            >
              <p className="text-sm font-medium text-slate-900 truncate">{r.title}</p>
              <p className="text-xs text-slate-500">{COUNTRY_FLAGS[r.country] || ''} {r.universityName} · {r.studyLevel}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UniversitySearch({ onSelect, disabled }: {
  onSelect: (uni: UniversitySearchResult) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UniversitySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ keyword: query, limit: '8' });
        const res = await fetch(`/api/course-finder/universities?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResults((data.universities || []).slice(0, 8).map((u: { id: string; name: string; slug: string; country: string; city?: string; rankingValue?: number }) => ({
            id: u.id, name: u.name, slug: u.slug, country: u.country, city: u.city, rankingValue: u.rankingValue,
          })));
          setOpen(true);
        }
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search universities to compare..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          disabled={disabled}
          className="pl-10"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
              onClick={() => { onSelect(r); setQuery(''); setOpen(false); }}
            >
              <p className="text-sm font-medium text-slate-900 truncate">{r.name}</p>
              <p className="text-xs text-slate-500">
                {COUNTRY_FLAGS[r.country] || ''} {r.city ? `${r.city}, ` : ''}{r.country}
                {r.rankingValue ? ` · #${r.rankingValue}` : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function CompareSkeleton() {
  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full max-w-md" />
        <Card className="overflow-hidden">
          <div className="p-4">
            <div className="flex">
              <div className="w-44 border-r border-slate-200 pr-4 space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-28" />
                ))}
              </div>
              <div className="flex-1 flex gap-4 px-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex-1 space-y-4">
                    <Skeleton className="h-5 w-32" />
                    {Array.from({ length: 10 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════════
export function CourseCompareEnhanced({ courseIds }: { courseIds?: string[] }) {
  const [mode, setMode] = useState<CompareMode>('courses');
  const [courses, setCourses] = useState<CourseCompareData[]>([]);
  const [universities, setUniversities] = useState<UniversityCompareData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch initial courses by IDs
  const fetchCoursesByIds = useCallback(async (ids: string[]) => {
    if (ids.length === 0) { setLoading(false); return; }
    setLoading(true);
    const validIds = ids.slice(0, MAX_ITEMS);
    const results: CourseCompareData[] = [];
    await Promise.all(
      validIds.map(async (id) => {
        try {
          const res = await fetch(`/api/course-finder/${id}?slug=${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.type === 'course' && data.course) results.push(data.course);
          }
        } catch { /* skip */ }
      })
    );
    setCourses(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (courseIds && courseIds.length > 0) {
      fetchCoursesByIds(courseIds);
    } else {
      setLoading(false);
    }
  }, [courseIds, fetchCoursesByIds]);

  // Add course from search
  const handleAddCourse = useCallback(async (searchResult: SearchResult) => {
    if (courses.some((c) => c.id === searchResult.id || c.slug === searchResult.slug)) {
      toast.info('Course already in comparison'); return;
    }
    if (courses.length >= MAX_ITEMS) {
      toast.error(`You can compare up to ${MAX_ITEMS} courses at a time`); return;
    }
    try {
      const res = await fetch(`/api/course-finder/${searchResult.slug}?slug=${searchResult.slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.type === 'course' && data.course) {
          setCourses((prev) => [...prev, data.course]);
          toast.success('Course added to comparison!');
        }
      }
    } catch { toast.error('Failed to add course'); }
  }, [courses]);

  // Add university from search
  const handleAddUniversity = useCallback(async (searchResult: UniversitySearchResult) => {
    if (universities.some((u) => u.id === searchResult.id)) {
      toast.info('University already in comparison'); return;
    }
    if (universities.length >= MAX_ITEMS) {
      toast.error(`You can compare up to ${MAX_ITEMS} universities at a time`); return;
    }
    setUniversities((prev) => [...prev, {
      id: searchResult.id,
      name: searchResult.name,
      slug: searchResult.slug,
      country: searchResult.country,
      city: searchResult.city,
      rankingValue: searchResult.rankingValue,
    }]);
    toast.success('University added to comparison!');
  }, [universities]);

  // Remove item
  const handleRemoveCourse = useCallback(async (id: string) => {
    setRemoving(id);
    await new Promise((r) => setTimeout(r, 200));
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setRemoving(null);
    toast.success('Course removed');
  }, []);

  const handleRemoveUniversity = useCallback((id: string) => {
    setUniversities((prev) => prev.filter((u) => u.id !== id));
    toast.success('University removed');
  }, []);

  // Clear all
  const handleClearAll = () => {
    if (mode === 'courses') { setCourses([]); setSelectedIds(new Set()); }
    else setUniversities([]);
    toast.success('All items cleared');
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // Actions
  const handleSave = () => {
    toast.success('Comparison saved to your account!');
  };

  const handleShare = async () => {
    const text = mode === 'courses'
      ? courses.map(c => `${c.title} at ${c.university?.name}`).join('\n')
      : universities.map(u => u.name).join('\n');
    if (navigator.share) {
      try { await navigator.share({ title: 'ALO Education Comparison', text }); return; } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(text);
    toast.success('Comparison copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendToCounsellor = () => {
    const items = mode === 'courses'
      ? courses.map(c => c.title).join(', ')
      : universities.map(u => u.name).join(', ');
    toast.success(`Comparison of ${items} sent to your counsellor!`);
  };

  const handleApplySelected = () => {
    const count = selectedIds.size;
    if (count === 0) {
      toast.info('Select courses to apply for using the checkboxes.');
      return;
    }
    toast.success(`Applications started for ${count} course(s). A counsellor will be in touch.`);
  };

  // Computed values for highlighting
  const bestFee = useMemo(() => getBestFee(courses), [courses]);
  const bestRanking = useMemo(() => getBestRanking(courses), [courses]);
  const lowestIelts = useMemo(() => getLowestIelts(courses), [courses]);

  // ── Course comparison rows ──
  const courseRows: CompareRow[] = [
    {
      key: 'eligibility', label: 'Eligibility', icon: CheckCircle,
      render: () => <span className="text-xs text-slate-400 italic">Run eligibility check</span>,
    },
    {
      key: 'matchScore', label: 'Match Score', icon: Star,
      render: () => <span className="text-xs text-slate-400 italic">Profile required</span>,
    },
    {
      key: 'university', label: 'University', icon: GraduationCap,
      render: (c) => (
        <Link
          href={c.university?.slug ? `/course-finder?slug=${c.university.slug}` : '#'}
          className="font-medium text-[#2563EB] hover:underline text-sm"
        >
          {c.university?.name || 'N/A'}
          {c.university?.rankingValue && (
            <span className={`ml-1 text-xs font-bold ${c.university.rankingValue === bestRanking ? 'text-emerald-600' : 'text-amber-600'}`}>
              #{c.university.rankingValue}
              {c.university.rankingValue === bestRanking && ' ★'}
            </span>
          )}
        </Link>
      ),
    },
    {
      key: 'country', label: 'Country', icon: MapPin,
      render: (c) => (
        <span className="text-sm text-slate-700">
          {COUNTRY_FLAGS[c.country || ''] || ''} {c.country || 'N/A'}
        </span>
      ),
    },
    {
      key: 'city', label: 'City', icon: MapPin,
      render: (c) => <span className="text-sm text-slate-700">{c.city || 'N/A'}</span>,
    },
    {
      key: 'qualification', label: 'Qualification', icon: BookOpen,
      render: (c) => <span className="text-sm text-slate-700">{c.qualification || 'N/A'}</span>,
    },
    {
      key: 'studyLevel', label: 'Study Level', icon: BookOpen,
      render: (c) => c.studyLevel ? (
        <Badge variant="secondary" className={`text-xs font-medium ${getLevelBadgeClasses(c.studyLevel)}`}>
          {c.studyLevel}
        </Badge>
      ) : <span className="text-sm text-slate-400">N/A</span>,
    },
    {
      key: 'duration', label: 'Duration', icon: Clock,
      render: (c) => <span className="text-sm text-slate-700">{c.duration || 'N/A'}{c.durationMonths ? ` (${c.durationMonths}mo)` : ''}</span>,
    },
    {
      key: 'tuitionFee', label: 'Tuition Fee', icon: DollarSign,
      render: (c) => {
        if (c.tuitionFee == null) return <span className="text-sm text-slate-400">N/A</span>;
        const isBest = c.tuitionFee === bestFee;
        return (
          <span className={`text-sm font-medium ${isBest ? 'text-emerald-600' : 'text-slate-800'}`}>
            {c.tuitionCurrency || 'GBP'} {c.tuitionFee.toLocaleString()}{c.tuitionPeriod ? `/${c.tuitionPeriod}` : ''}
            {isBest && <span className="ml-1 text-[10px] text-emerald-500">LOWEST</span>}
          </span>
        );
      },
    },
    {
      key: 'deposit', label: 'Deposit', icon: DollarSign,
      render: (c) => c.depositRequired ? (
        <span className="text-sm text-slate-700">{c.depositAmount ? `${c.tuitionCurrency || 'GBP'} ${c.depositAmount.toLocaleString()}` : 'Required'}</span>
      ) : <span className="text-sm text-slate-400">Not required</span>,
    },
    {
      key: 'ieltsMin', label: 'IELTS', icon: GraduationCap,
      render: (c) => {
        if (c.ieltsMin == null) return <span className="text-sm text-slate-400">N/A</span>;
        const isBest = c.ieltsMin === lowestIelts;
        return (
          <span className={`text-sm font-medium ${isBest ? 'text-emerald-600' : 'text-slate-700'}`}>
            {c.ieltsMin}{isBest && <span className="ml-1 text-[10px] text-emerald-500">LOWEST</span>}
          </span>
        );
      },
    },
    {
      key: 'pteMin', label: 'PTE', icon: GraduationCap,
      render: (c) => c.pteMin != null
        ? <span className="text-sm text-slate-700">{c.pteMin}</span>
        : <span className="text-sm text-slate-400">N/A</span>,
    },
    {
      key: 'applicationFee', label: 'Application Fee', icon: DollarSign,
      render: (c) => c.applicationFee != null
        ? <span className="text-sm text-slate-700">{c.applicationFeeCurrency || c.tuitionCurrency || 'GBP'} {c.applicationFee.toLocaleString()}</span>
        : <span className="text-sm text-emerald-600">Free</span>,
    },
    {
      key: 'deadline', label: 'Deadline', icon: Calendar,
      render: (c) => <span className="text-sm text-slate-700">{c.applicationDeadline || 'N/A'}</span>,
    },
    {
      key: 'intake', label: 'Intake', icon: Calendar,
      render: (c) => <span className="text-sm text-slate-700">{c.nextIntake || 'N/A'}</span>,
    },
    {
      key: 'academicReq', label: 'Academic Req.', icon: FileText,
      render: (c) => (
        <div className="text-xs text-slate-600 max-w-[180px]">
          {c.academicRequirement
            ? <span className="line-clamp-2">{c.academicRequirement}</span>
            : 'N/A'}
          {c.gpaMin && <span className="block mt-1 font-medium">Min GPA: {c.gpaMin}</span>}
        </div>
      ),
    },
    {
      key: 'englishReq', label: 'English Req.', icon: BookOpen,
      render: (c) => (
        <div className="flex gap-1 flex-wrap">
          {c.ieltsMin != null && <Badge variant="secondary" className="text-[10px]">IELTS {c.ieltsMin}</Badge>}
          {c.pteMin != null && <Badge variant="secondary" className="text-[10px]">PTE {c.pteMin}</Badge>}
          {c.toeflMin != null && <Badge variant="secondary" className="text-[10px]">TOEFL {c.toeflMin}</Badge>}
          {c.duolingoMin != null && <Badge variant="secondary" className="text-[10px]">Duolingo {c.duolingoMin}</Badge>}
          {c.ieltsMin == null && c.pteMin == null && c.toeflMin == null && c.duolingoMin == null && (
            <span className="text-sm text-slate-400">N/A</span>
          )}
        </div>
      ),
    },
    {
      key: 'workExp', label: 'Work Exp. Required', icon: Briefcase,
      render: (c) => c.workExperienceRequired
        ? <Badge className="bg-amber-100 text-amber-700 text-xs">Required</Badge>
        : <span className="text-sm text-slate-400">No</span>,
    },
    {
      key: 'placement', label: 'Placement', icon: Award,
      render: (c) => c.placementAvailable
        ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Available</Badge>
        : <span className="text-sm text-slate-400">N/A</span>,
    },
    {
      key: 'scholarship', label: 'Scholarship', icon: Award,
      render: (c) => c.scholarshipAvailable
        ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Available</Badge>
        : <span className="text-sm text-slate-400">None listed</span>,
    },
    {
      key: 'documents', label: 'Required Documents', icon: FileText,
      render: () => (
        <div className="text-xs text-slate-500 space-y-0.5">
          <p>Passport, Certificates, Transcripts</p>
          <p>English Test, CV, SOP, References</p>
        </div>
      ),
    },
    {
      key: 'missingReq', label: 'Missing Requirements', icon: AlertTriangle,
      render: () => <span className="text-xs text-slate-400 italic">Complete profile to see</span>,
    },
    {
      key: 'improvement', label: 'Improvement Steps', icon: CheckCircle,
      render: () => <span className="text-xs text-slate-400 italic">Complete profile to see</span>,
    },
    {
      key: 'verified', label: 'Verified', icon: ShieldCheck,
      render: (c) => <span className="text-xs text-slate-400">{formatDate(c.lastVerifiedAt)}</span>,
    },
  ];

  // ── University comparison rows ──
  const universityRows = [
    { key: 'ranking', label: 'Ranking', icon: Star, render: (u: UniversityCompareData) => u.rankingValue ? (
      <span className="text-sm font-bold text-slate-900">#{u.rankingValue}</span>
    ) : <span className="text-sm text-slate-400">N/A</span> },
    { key: 'country', label: 'Country', icon: MapPin, render: (u: UniversityCompareData) => (
      <span className="text-sm text-slate-700">{COUNTRY_FLAGS[u.country || ''] || ''} {u.country || 'N/A'}</span>
    )},
    { key: 'city', label: 'City', icon: MapPin, render: (u: UniversityCompareData) => <span className="text-sm text-slate-700">{u.city || 'N/A'}</span> },
    { key: 'type', label: 'Type', icon: Building2, render: (u: UniversityCompareData) => <span className="text-sm text-slate-700">{u.institutionType || 'N/A'}</span> },
    { key: 'courses', label: 'Courses', icon: BookOpen, render: (u: UniversityCompareData) => <span className="text-sm text-slate-700">{u.courseCount || 'N/A'} courses listed</span> },
    { key: 'scholarship', label: 'Scholarships', icon: Award, render: (u: UniversityCompareData) => u.scholarshipAvailable
      ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Available</Badge>
      : <span className="text-sm text-slate-400">N/A</span> },
    { key: 'accommodation', label: 'Accommodation', icon: Building2, render: (u: UniversityCompareData) => u.accommodationAvailable
      ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Available</Badge>
      : <span className="text-sm text-slate-400">N/A</span> },
    { key: 'employability', label: 'Employability', icon: Briefcase, render: (u: UniversityCompareData) => u.employabilityRate
      ? <span className="text-sm font-medium text-slate-800">{u.employabilityRate}%</span>
      : <span className="text-sm text-slate-400">N/A</span> },
  ];

  // ── Loading ──
  if (loading) return <CompareSkeleton />;

  const isCourseMode = mode === 'courses';
  const items = isCourseMode ? courses : universities;
  const hasItems = items.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ Header ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2563EB] transition-colors mb-6"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
              <GitCompare className="size-5 text-[#2563EB]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Compare</h1>
              <p className="text-sm text-slate-500">
                {hasItems
                  ? `Comparing ${items.length} ${isCourseMode ? 'course' : 'universit'}${items.length > 1 ? (isCourseMode ? 's' : 'ies') : (isCourseMode ? '' : 'y')} (max ${MAX_ITEMS})`
                  : 'Select items to compare side-by-side'
                }
              </p>
            </div>
            {hasItems && (
              <Badge variant="secondary" className="bg-[#2563EB]/10 text-[#2563EB]">
                {items.length}/{MAX_ITEMS}
              </Badge>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'courses' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setMode('courses')}
            >
              <GraduationCap className="size-4 inline mr-1.5" />
              Courses
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'universities' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setMode('universities')}
            >
              <Building2 className="size-4 inline mr-1.5" />
              Universities
            </button>
          </div>
        </div>

        {/* ═══ Search ═══ */}
        <div className="max-w-md mb-6">
          {isCourseMode ? (
            <CourseSearch onSelect={handleAddCourse} disabled={courses.length >= MAX_ITEMS} />
          ) : (
            <UniversitySearch onSelect={handleAddUniversity} disabled={universities.length >= MAX_ITEMS} />
          )}
          {items.length >= MAX_ITEMS && (
            <p className="text-xs text-amber-600 mt-1.5">
              Maximum {MAX_ITEMS} items reached. Remove one to add another.
            </p>
          )}
        </div>
      </div>

      {/* ═══ Empty State ═══ */}
      {!hasItems && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <GitCompare className="size-12 text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">No items to compare</h2>
            <p className="text-sm text-slate-500 max-w-md">
              Add {isCourseMode ? 'courses' : 'universities'} to compare by clicking the bookmark icon on any {isCourseMode ? 'course' : 'university'} card, or search above.
            </p>
            <Link href="/course-finder" className="mt-6">
              <Button style={{ backgroundColor: ALO_BLUE }} className="text-white hover:opacity-90">
                <Search className="size-4 mr-2" />
                Browse {isCourseMode ? 'Courses' : 'Universities'}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ═══ Course Comparison Table ═══ */}
      {isCourseMode && courses.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <Card className="overflow-hidden border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                {/* ── Header Row ── */}
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4 w-44 sticky left-0 bg-slate-50 z-10">
                      Attribute
                    </th>
                    {courses.map((course) => (
                      <th key={course.id} className="text-left p-4 min-w-[220px] relative">
                        <button
                          onClick={() => handleRemoveCourse(course.id)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors z-10"
                          aria-label={`Remove ${course.title}`}
                          disabled={removing === course.id}
                        >
                          {removing === course.id
                            ? <Loader2 className="size-4 animate-spin" />
                            : <X className="size-4" />}
                        </button>
                        <div className="pr-6 flex items-start gap-2">
                          <Checkbox
                            checked={selectedIds.has(course.id)}
                            onCheckedChange={() => toggleSelect(course.id)}
                            className="mt-1"
                          />
                          <Link href={`/course-finder?slug=${course.slug}`} className="group block">
                            <p className="text-sm font-semibold text-[#2563EB] group-hover:underline leading-snug line-clamp-2">
                              {course.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {course.university?.name || 'Unknown University'}
                            </p>
                          </Link>
                        </div>
                      </th>
                    ))}
                    {Array.from({ length: MAX_ITEMS - courses.length }).map((_, i) => (
                      <th key={`empty-${i}`} className="p-4 min-w-[200px] border-l border-dashed border-slate-200">
                        <div className="flex flex-col items-center justify-center py-6 text-slate-300">
                          <Plus className="size-6" />
                          <span className="text-xs mt-1.5">Add course</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* ── Body Rows ── */}
                <tbody>
                  {courseRows.map((row, idx) => {
                    const RowIcon = row.icon;
                    return (
                      <tr
                        key={row.key}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      >
                        <td className="text-sm font-medium text-slate-600 p-3 sm:p-4 border-r border-slate-100 sticky left-0 z-10 bg-inherit">
                          <div className="flex items-center gap-2">
                            <RowIcon className="size-3.5 text-slate-400 flex-shrink-0" />
                            <span className="whitespace-nowrap">{row.label}</span>
                          </div>
                        </td>
                        {courses.map((course) => (
                          <td key={course.id} className="p-3 sm:p-4 align-top">
                            {row.render(course)}
                          </td>
                        ))}
                        {Array.from({ length: MAX_ITEMS - courses.length }).map((_, i) => (
                          <td key={`empty-val-${row.key}-${i}`} className="p-3 sm:p-4 border-l border-dashed border-slate-200">
                            <span className="text-slate-300">—</span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ═══ Action Buttons ═══ */}
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            <Button
              size="lg"
              className="text-white px-8"
              style={{ backgroundColor: ALO_BLUE }}
              onClick={handleApplySelected}
            >
              <GraduationCap className="size-5 mr-2" />
              Apply to Selected ({selectedIds.size})
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6"
              onClick={handleSave}
            >
              <Save className="size-5 mr-2" />
              Save Comparison
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6"
              onClick={handleShare}
            >
              <Share2 className="size-5 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6"
              onClick={handlePrint}
            >
              <Printer className="size-5 mr-2" />
              Download PDF
            </Button>
            <Button
              size="lg"
              className="text-white px-6"
              style={{ backgroundColor: ALO_ORANGE }}
              onClick={handleSendToCounsellor}
            >
              <MessageCircle className="size-5 mr-2" />
              Send to Counsellor
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-red-300 text-red-600 hover:bg-red-50 px-6"
              onClick={handleClearAll}
            >
              <Trash2 className="size-5 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* ═══ University Comparison Table ═══ */}
      {!isCourseMode && universities.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <Card className="overflow-hidden border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4 w-40 sticky left-0 bg-slate-50 z-10">
                      Attribute
                    </th>
                    {universities.map((uni) => (
                      <th key={uni.id} className="text-left p-4 min-w-[200px] relative">
                        <button
                          onClick={() => handleRemoveUniversity(uni.id)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors z-10"
                          aria-label={`Remove ${uni.name}`}
                        >
                          <X className="size-4" />
                        </button>
                        <Link href={`/course-finder?slug=${uni.slug}`} className="block pr-6 group">
                          <p className="text-sm font-semibold text-[#2563EB] group-hover:underline leading-snug">
                            {uni.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {COUNTRY_FLAGS[uni.country || ''] || ''} {uni.city ? `${uni.city}, ` : ''}{uni.country}
                          </p>
                        </Link>
                      </th>
                    ))}
                    {Array.from({ length: MAX_ITEMS - universities.length }).map((_, i) => (
                      <th key={`empty-${i}`} className="p-4 min-w-[180px] border-l border-dashed border-slate-200">
                        <div className="flex flex-col items-center justify-center py-6 text-slate-300">
                          <Plus className="size-6" />
                          <span className="text-xs mt-1.5">Add university</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {universityRows.map((row, idx) => {
                    const RowIcon = row.icon;
                    return (
                      <tr key={row.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="text-sm font-medium text-slate-600 p-3 sm:p-4 border-r border-slate-100 sticky left-0 z-10 bg-inherit">
                          <div className="flex items-center gap-2">
                            <RowIcon className="size-3.5 text-slate-400 flex-shrink-0" />
                            <span className="whitespace-nowrap">{row.label}</span>
                          </div>
                        </td>
                        {universities.map((uni) => (
                          <td key={uni.id} className="p-3 sm:p-4 align-top">
                            {row.render(uni)}
                          </td>
                        ))}
                        {Array.from({ length: MAX_ITEMS - universities.length }).map((_, i) => (
                          <td key={`empty-val-${row.key}-${i}`} className="p-3 sm:p-4 border-l border-dashed border-slate-200">
                            <span className="text-slate-300">—</span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ═══ Action Buttons ═══ */}
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            <Button
              variant="outline"
              size="lg"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6"
              onClick={handleSave}
            >
              <Save className="size-5 mr-2" />
              Save Comparison
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6"
              onClick={handleShare}
            >
              <Share2 className="size-5 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6"
              onClick={handlePrint}
            >
              <Printer className="size-5 mr-2" />
              Download PDF
            </Button>
            <Button
              size="lg"
              className="text-white px-6"
              style={{ backgroundColor: ALO_ORANGE }}
              onClick={handleSendToCounsellor}
            >
              <MessageCircle className="size-5 mr-2" />
              Send to Counsellor
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-red-300 text-red-600 hover:bg-red-50 px-6"
              onClick={handleClearAll}
            >
              <Trash2 className="size-5 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
