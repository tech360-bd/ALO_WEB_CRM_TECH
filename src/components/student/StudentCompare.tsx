'use client';

import { useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookmarkX,
  Bookmark,
  GitCompareArrows,
  GraduationCap,
  Globe,
  Calendar,
  Clock,
  Languages,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trash2,
  Briefcase,
  Home,
  MapPin,
  Award,
  Banknote,
  ShieldCheck,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
interface ShortlistedCourse {
  id: string;
  name: string;
  university: string;
  country: string;
  city: string;
  flag: string;
  campus: string;
  intake: string;
  deadline: string;
  duration: string;
  tuition: string;
  scholarship: string | null;
  deposit: string;
  ranking: number;
  ieltsReq: string;
  academicReq: string;
  visaRisk: 'Low' | 'Medium' | 'High';
  workRights: string;
  postStudyWork: string;
  accommodationEst: string;
  level: string;
  subject: string;
  logoColor: string;
  matchScore: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────
const INITIAL_SHORTLIST: ShortlistedCourse[] = [
  {
    id: 'sl-1',
    name: 'MSc Data Science',
    university: 'University of Glasgow',
    country: 'UK',
    city: 'Glasgow',
    flag: '🇬🇧',
    campus: 'Gilmorehill Campus',
    intake: 'Sep 2026',
    deadline: '15 Jul 2026',
    duration: '1 year',
    tuition: '£24,000',
    scholarship: null,
    deposit: '£2,000',
    ranking: 76,
    ieltsReq: '6.5 (no sub < 6.0)',
    academicReq: '2:1 or GPA 3.2+',
    visaRisk: 'Low',
    workRights: '20 hrs/week term time',
    postStudyWork: '2 years (PSW)',
    accommodationEst: '£6,000 - £8,000/yr',
    level: 'Masters',
    subject: 'Computer Science',
    logoColor: 'bg-[#003F87]',
    matchScore: 92,
  },
  {
    id: 'sl-2',
    name: 'MSc Artificial Intelligence',
    university: 'University of Southampton',
    country: 'UK',
    city: 'Southampton',
    flag: '🇬🇧',
    campus: 'Highfield Campus',
    intake: 'Sep 2026',
    deadline: '31 Jul 2026',
    duration: '1 year',
    tuition: '£29,000',
    scholarship: null,
    deposit: '£2,500',
    ranking: 80,
    ieltsReq: '6.5 (no sub < 6.0)',
    academicReq: '2:1 or GPA 3.3+',
    visaRisk: 'Low',
    workRights: '20 hrs/week term time',
    postStudyWork: '2 years (PSW)',
    accommodationEst: '£7,000 - £9,000/yr',
    level: 'Masters',
    subject: 'Computer Science',
    logoColor: 'bg-[#6B2D5B]',
    matchScore: 90,
  },
  {
    id: 'sl-3',
    name: 'MBA',
    university: 'University of Aberdeen',
    country: 'UK',
    city: 'Aberdeen',
    flag: '🇬🇧',
    campus: 'King\'s College Campus',
    intake: 'Sep 2026',
    deadline: '31 Jul 2026',
    duration: '1 year',
    tuition: '£18,000',
    scholarship: '£3,000',
    deposit: '£1,000',
    ranking: 208,
    ieltsReq: '6.5 (writing 6.0+)',
    academicReq: '2:2 or GPA 3.0+',
    visaRisk: 'Low',
    workRights: '20 hrs/week term time',
    postStudyWork: '2 years (PSW)',
    accommodationEst: '£5,500 - £7,000/yr',
    level: 'Masters',
    subject: 'Business',
    logoColor: 'bg-[#8B0000]',
    matchScore: 82,
  },
];

// ─── Comparison Table Row Config ─────────────────────────────────────
interface CompareRow {
  label: string;
  icon: React.ElementType;
  key: keyof ShortlistedCourse;
  type: 'text' | 'currency' | 'ranking' | 'visa-risk';
  best?: 'lowest' | 'highest';
}

const COMPARE_ROWS: CompareRow[] = [
  { label: 'University', icon: GraduationCap, key: 'university', type: 'text' },
  { label: 'Course Name', icon: GraduationCap, key: 'name', type: 'text' },
  { label: 'Country', icon: Globe, key: 'country', type: 'text' },
  { label: 'Campus', icon: MapPin, key: 'campus', type: 'text' },
  { label: 'Tuition Fee', icon: Banknote, key: 'tuition', type: 'currency', best: 'lowest' },
  { label: 'Scholarship', icon: Award, key: 'scholarship', type: 'text' },
  { label: 'Deposit', icon: Banknote, key: 'deposit', type: 'currency', best: 'lowest' },
  { label: 'Duration', icon: Clock, key: 'duration', type: 'text' },
  { label: 'Ranking', icon: Award, key: 'ranking', type: 'ranking', best: 'highest' },
  { label: 'Location', icon: MapPin, key: 'city', type: 'text' },
  { label: 'Intake', icon: Calendar, key: 'intake', type: 'text' },
  { label: 'Deadline', icon: Calendar, key: 'deadline', type: 'text' },
  { label: 'IELTS Requirement', icon: Languages, key: 'ieltsReq', type: 'text' },
  { label: 'Academic Requirement', icon: GraduationCap, key: 'academicReq', type: 'text' },
  { label: 'Visa Risk', icon: ShieldCheck, key: 'visaRisk', type: 'visa-risk' },
  { label: 'Work Rights', icon: Briefcase, key: 'workRights', type: 'text' },
  { label: 'Post-study Work', icon: Briefcase, key: 'postStudyWork', type: 'text' },
  { label: 'Accommodation Est.', icon: Home, key: 'accommodationEst', type: 'text' },
];

// ─── Helpers ─────────────────────────────────────────────────────────
function parseCurrency(val: string): number {
  return parseInt(val.replace(/[^0-9]/g, '')) || 0;
}

function visaRiskBadge(level: string) {
  switch (level) {
    case 'Low': return <Badge variant="success" className="text-xs">Low</Badge>;
    case 'Medium': return <Badge variant="warning" className="text-xs">Medium</Badge>;
    case 'High': return <Badge variant="danger" className="text-xs">High</Badge>;
    default: return <span>{level}</span>;
  }
}

function getBestValue(key: keyof ShortlistedCourse, best: 'lowest' | 'highest', courses: ShortlistedCourse[]): unknown {
  const vals = courses.map((c) => {
    const v = c[key];
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseCurrency(v);
    return 0;
  });
  if (best === 'lowest') return Math.min(...vals);
  return Math.max(...vals);
}

function isCellBest(course: ShortlistedCourse, row: CompareRow, allCourses: ShortlistedCourse[]): boolean {
  if (!row.best) return false;
  const bestVal = getBestValue(row.key, row.best, allCourses);
  const cellVal = course[row.key];
  if (typeof cellVal === 'number') return cellVal === bestVal;
  if (typeof cellVal === 'string') return parseCurrency(cellVal) === bestVal;
  return false;
}

// ─── Shortlist Card (Compact) ───────────────────────────────────────
function ShortlistCard({ course, isSelected, onToggleSelect, onRemove }: {
  course: ShortlistedCourse;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div className={`group relative bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-200 flex flex-col gap-3 ${isSelected ? 'border-[#0057B8] ring-2 ring-[#0057B8]/20' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 size-10 rounded-lg ${course.logoColor} flex items-center justify-center text-white font-bold text-sm`}>
            {course.university.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{course.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{course.university}</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="data-[state=checked]:bg-[#0057B8] data-[state=checked]:border-[#0057B8]"
            />
          </label>
          <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-red-500 h-7 w-7" onClick={onRemove}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className="text-sm">{course.flag}</span>
        <span>{course.city}</span>
        <span className="text-slate-300">•</span>
        <span>{course.country}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-[11px] px-2 py-0 border-slate-200 text-slate-600">
          <Calendar className="size-3 mr-1" /> {course.intake}
        </Badge>
        <Badge variant="outline" className="text-[11px] px-2 py-0 border-slate-200 text-slate-600">
          <Clock className="size-3 mr-1" /> {course.duration}
        </Badge>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-slate-900">{course.tuition}</span>
        {course.scholarship && (
          <span className="text-xs font-semibold text-emerald-600">Scholarship {course.scholarship}</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Languages className="size-3" /> {course.ieltsReq.split(' ')[0]}</span>
        <span className="flex items-center gap-1"><GraduationCap className="size-3" /> {course.academicReq}</span>
      </div>

      <div className="flex items-center gap-2 pt-1 mt-auto">
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="cta" size="sm" className="flex-1 h-8 text-xs">
          Apply
        </Button>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="h-8 text-xs">
          <Bookmark className="size-3 fill-amber-500 text-amber-500 mr-1" />
          Saved
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function StudentCompare() {
  usePortalStore();

  const [shortlist, setShortlist] = useState<ShortlistedCourse[]>(INITIAL_SHORTLIST);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('shortlist');

  const selectedCourses = shortlist.filter((c) => selectedIds.has(c.id));

  const removeCourse = (id: string) => {
    setShortlist((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  const handleCompareSelected = () => {
    if (selectedCourses.length >= 2) {
      setActiveTab('compare');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-slate-900 to-[#0a1628] px-4 py-8 md:py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Shortlist & Compare
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl">
            Save your favorite courses and compare them side by side to make the best decision for your future.
          </p>
        </div>
      </section>

      {/* ─── Tabs ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <TabsList className="h-10">
                <TabsTrigger value="shortlist" className="gap-2 px-5">
                  <Bookmark className="size-4" />
                  My Shortlist
                  {shortlist.length > 0 && (
                    <span className="ml-1 size-5 rounded-full bg-[#0057B8] text-white text-[10px] flex items-center justify-center font-bold">
                      {shortlist.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="compare" className="gap-2 px-5">
                  <GitCompareArrows className="size-4" />
                  Compare
                  {selectedCourses.length > 0 && (
                    <span className="ml-1 size-5 rounded-full bg-[#C93D13] text-white text-[10px] flex items-center justify-center font-bold">
                      {selectedCourses.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {activeTab === 'shortlist' && selectedCourses.length >= 2 && (
                <Button variant="brand" onClick={handleCompareSelected} className="gap-2">
                  <GitCompareArrows className="size-4" />
                  Compare Selected ({selectedCourses.length})
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>

            {/* ─── Shortlist Tab ──────────────────────────────────── */}
            <TabsContent value="shortlist">
              {shortlist.length === 0 ? (
                <div className="text-center py-20">
                  <BookmarkX className="size-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No courses shortlisted yet</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                    Browse courses and click Shortlist to save them here. You can compare up to 5 courses side by side.
                  </p>
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="cta" className="gap-2">
                    Browse Courses
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mb-4">
                    Select courses to compare (2-5) by checking the boxes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {shortlist.map((course) => (
                      <ShortlistCard
                        key={course.id}
                        course={course}
                        isSelected={selectedIds.has(course.id)}
                        onToggleSelect={() => toggleSelect(course.id)}
                        onRemove={() => removeCourse(course.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* ─── Compare Tab ───────────────────────────────────── */}
            <TabsContent value="compare">
              {selectedCourses.length < 2 ? (
                <div className="text-center py-20">
                  <GitCompareArrows className="size-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {selectedCourses.length === 0
                      ? 'No courses selected for comparison'
                      : 'Select at least 2 courses'}
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                    Go to the Shortlist tab, select 2-5 courses using the checkboxes, and click &quot;Compare Selected&quot; to see them side by side.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('shortlist')} className="gap-2">
                    Go to Shortlist
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-500">
                      Comparing <span className="font-semibold text-slate-800">{selectedCourses.length}</span> courses
                    </p>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                      variant="cta"
                      size="lg"
                      className="gap-2"
                    >
                      Apply to Selected
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px] sticky left-0 bg-slate-50 z-10 min-w-[180px]">
                              Attribute
                            </TableHead>
                            {selectedCourses.map((course) => (
                              <TableHead key={course.id} className="min-w-[200px] text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <div className={`size-10 rounded-lg ${course.logoColor} flex items-center justify-center text-white font-bold text-sm`}>
                                    {course.university.charAt(0)}
                                  </div>
                                  <span className="font-semibold text-slate-800 text-xs leading-tight">
                                    {course.university}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 text-[11px] gap-1"
                                    onClick={() => removeCourse(course.id)}
                                  >
                                    <Trash2 className="size-3" />
                                    Remove
                                  </Button>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {COMPARE_ROWS.map((row, idx) => {
                            const Icon = row.icon;
                            return (
                              <TableRow key={row.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <TableCell className="sticky left-0 bg-inherit z-10 font-medium text-slate-700 text-xs">
                                  <span className="flex items-center gap-2">
                                    <Icon className="size-3.5 text-slate-400" />
                                    {row.label}
                                  </span>
                                </TableCell>
                                {selectedCourses.map((course) => {
                                  const value = course[row.key];
                                  const isBest = isCellBest(course, row, selectedCourses);
                                  return (
                                    <TableCell
                                      key={course.id}
                                      className={`text-center text-sm ${isBest ? 'bg-emerald-50 font-semibold text-emerald-800' : 'text-slate-600'}`}
                                    >
                                      {row.type === 'visa-risk' ? (
                                        visaRiskBadge(value as string)
                                      ) : row.type === 'ranking' ? (
                                        <div className="flex flex-col items-center">
                                          <span>{String(value)}</span>
                                          {isBest && (
                                            <span className="text-[10px] text-emerald-600 font-medium">Best Ranking</span>
                                          )}
                                        </div>
                                      ) : row.type === 'currency' && isBest ? (
                                        <div className="flex flex-col items-center">
                                          <span>{String(value)}</span>
                                          <span className="text-[10px] text-emerald-600 font-medium">Lowest</span>
                                        </div>
                                      ) : (
                                        <span>{value === null ? (
                                          <span className="text-slate-400 italic">None</span>
                                        ) : String(value)}</span>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}

                          {/* Match Score Row */}
                          <TableRow className="bg-slate-50/50">
                            <TableCell className="sticky left-0 bg-inherit z-10 font-medium text-slate-700 text-xs">
                              <span className="flex items-center gap-2">
                                <CheckCircle2 className="size-3.5 text-slate-400" />
                                Match Score
                              </span>
                            </TableCell>
                            {selectedCourses.map((course) => {
                              const maxScore = Math.max(...selectedCourses.map((c) => c.matchScore));
                              const isBest = course.matchScore === maxScore;
                              return (
                                <TableCell
                                  key={course.id}
                                  className={`text-center ${isBest ? 'bg-emerald-50' : ''}`}
                                >
                                  <div className={`inline-flex size-12 rounded-full items-center justify-center text-sm font-bold ${
                                    course.matchScore >= 90 ? 'bg-emerald-500 text-white' :
                                    course.matchScore >= 80 ? 'bg-[#0057B8] text-white' :
                                    'bg-amber-500 text-white'
                                  }`}>
                                    {course.matchScore}%
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="mt-6 flex items-center justify-between">
                    <Button variant="outline" onClick={() => setActiveTab('shortlist')} className="gap-2">
                      <ArrowRight className="size-4 rotate-180" />
                      Back to Shortlist
                    </Button>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="cta" size="lg" className="gap-2">
                      Apply to Selected ({selectedCourses.length})
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}