"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  SectionCard,
  EmptyState,
  LoadingGrid,
  PageHeader,
  Progress,
} from "@/components/alo/shared";
import { fmtDate, type ViewKey } from "@/lib/alo-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
// Types — matches /api/course-finder/* + /api/students + /api/courses
// ---------------------------------------------------------------------------

type Student = {
  id: string;
  studentId: string;
  fullName: string;
};

type EligibilityResult = {
  courseSlug: string;
  courseName: string;
  university?: string;
  eligibilityScore: number;
  status: "ELIGIBLE" | "LIKELY_ELIGIBLE" | "NEED_REVIEW" | "NOT_ELIGIBLE" | "MISSING_INFO";
  reasons: string[];
  missing: string[];
};

type EligibilitySummary = {
  total: number;
  eligible: number;
  likelyEligible: number;
  needReview: number;
  notEligible: number;
  missingInfo: number;
};

type Course = {
  slug: string;
  name: string;
  universitySlug: string;
  countrySlug: string;
  city: string;
  level: string;
  subject: string;
  duration: string;
  intake: string;
  tuition: string;
  scholarship: string | null;
  englishRequirement: string;
  academicRequirement: string;
  deadline: string | null;
  university: { name: string; slug: string; city?: string };
  country: { name: string; shortName: string; flag: string; slug: string } | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPARE_LIMIT = 3;

const STATUS_META: Record<
  EligibilityResult["status"],
  { label: string; icon: string; bg: string; text: string; border: string; dot: string }
> = {
  ELIGIBLE: {
    label: "Eligible",
    icon: "CheckCircle",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  LIKELY_ELIGIBLE: {
    label: "Likely Eligible",
    icon: "TrendingUp",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  NEED_REVIEW: {
    label: "Need Review",
    icon: "AlertCircle",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  NOT_ELIGIBLE: {
    label: "Not Eligible",
    icon: "XCircle",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  MISSING_INFO: {
    label: "Missing Info",
    icon: "Info",
    bg: "bg-[var(--alo-surface-muted)]",
    text: "text-[var(--alo-body)]",
    border: "border-[var(--alo-border)]",
    dot: "bg-slate-500",
  },
};

const SUMMARY_CARDS: {
  key: keyof EligibilitySummary;
  label: string;
  status: EligibilityResult["status"];
}[] = [
  { key: "eligible", label: "Eligible", status: "ELIGIBLE" },
  { key: "likelyEligible", label: "Likely Eligible", status: "LIKELY_ELIGIBLE" },
  { key: "needReview", label: "Need Review", status: "NEED_REVIEW" },
  { key: "notEligible", label: "Not Eligible", status: "NOT_ELIGIBLE" },
  { key: "missingInfo", label: "Missing Info", status: "MISSING_INFO" },
];

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "__all__", label: "All statuses" },
  { value: "ELIGIBLE", label: "Eligible" },
  { value: "LIKELY_ELIGIBLE", label: "Likely Eligible" },
  { value: "NEED_REVIEW", label: "Need Review" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tuitionAmount(t?: string): number {
  if (!t) return 0;
  const match = t.replace(/[, ]/g, "").match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

function scoreColor(score: number, status: EligibilityResult["status"]) {
  const meta = STATUS_META[status];
  return meta;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StudentCourseFinderProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

export function StudentCourseFinder({ onNavigate }: StudentCourseFinderProps) {
  const { toast } = useToast();

  const [students, setStudents] = React.useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = React.useState(true);
  const [studentId, setStudentId] = React.useState<string>("");

  const [results, setResults] = React.useState<EligibilityResult[]>([]);
  const [summary, setSummary] = React.useState<EligibilitySummary | null>(null);
  const [studentProfile, setStudentProfile] = React.useState<{ id: string; name: string; profileCompletion: number } | null>(null);
  const [eligibleLoading, setEligibleLoading] = React.useState(false);

  const [courseMap, setCourseMap] = React.useState<Record<string, Course>>({});

  const [shortlisted, setShortlisted] = React.useState<string[]>([]);
  const [compared, setCompared] = React.useState<string[]>([]);

  // Filters
  const [query, setQuery] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("__all__");
  const [shortlistOnly, setShortlistOnly] = React.useState(false);
  const [sort, setSort] = React.useState("score-desc");

  // Compare dialog
  const [compareOpen, setCompareOpen] = React.useState(false);

  // Load student list once
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStudentsLoading(true);
        const res = await fetch("/api/students", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const list: Student[] = (data.students || []).map((s: any) => ({
          id: s.id,
          studentId: s.studentId,
          fullName: s.fullName,
        }));
        setStudents(list);
        if (list.length > 0) setStudentId(list[0].id);
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Couldn't load students",
            description: e?.message || "Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Load all published courses once — used to attach tuition/duration/intake/country to the eligibility rows
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/courses", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const map: Record<string, Course> = {};
        for (const c of data.courses || []) map[c.slug] = c;
        setCourseMap(map);
      } catch {
        // Non-fatal — cards just fall back to the eligibility row data
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load eligibility results when student changes
  React.useEffect(() => {
    if (!studentId) {
      setResults([]);
      setSummary(null);
      setStudentProfile(null);
      setShortlisted([]);
      setCompared([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setEligibleLoading(true);
        const [eligRes, shortRes, cmpRes] = await Promise.all([
          fetch(`/api/course-finder/eligible?studentId=${encodeURIComponent(studentId)}`, { cache: "no-store" }),
          fetch(`/api/course-finder/shortlist?studentId=${encodeURIComponent(studentId)}`, { cache: "no-store" }),
          fetch(`/api/course-finder/compare?studentId=${encodeURIComponent(studentId)}`, { cache: "no-store" }),
        ]);
        if (!eligRes.ok) throw new Error(`HTTP ${eligRes.status}`);
        const eligData = await eligRes.json();
        if (cancelled) return;
        setResults(Array.isArray(eligData.results) ? eligData.results : []);
        setSummary(eligData.summary || null);
        setStudentProfile(eligData.student || null);
        if (shortRes.ok) {
          const sd = await shortRes.json();
          if (!cancelled) setShortlisted(Array.isArray(sd.shortlisted) ? sd.shortlisted : []);
        }
        if (cmpRes.ok) {
          const cd = await cmpRes.json();
          if (!cancelled) setCompared(Array.isArray(cd.compared) ? cd.compared : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Couldn't load eligibility",
            description: e?.message || "Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setEligibleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, toast]);

  // ---- Shortlist toggle ----
  const toggleShortlist = async (courseSlug: string, courseName: string) => {
    if (!studentId) return;
    const wasShortlisted = shortlisted.includes(courseSlug);
    // Optimistic update
    setShortlisted((prev) =>
      wasShortlisted ? prev.filter((s) => s !== courseSlug) : [...prev, courseSlug],
    );
    try {
      const res = await fetch("/api/course-finder/shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseSlug }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Reconcile
      if (data.saved) {
        setShortlisted((prev) => (prev.includes(courseSlug) ? prev : [...prev, courseSlug]));
        toast({
          title: "Saved to shortlist",
          description: courseName,
        });
      } else {
        setShortlisted((prev) => prev.filter((s) => s !== courseSlug));
        toast({
          title: "Removed from shortlist",
          description: courseName,
        });
      }
    } catch (e: any) {
      // Revert
      setShortlisted((prev) =>
        wasShortlisted ? [...prev, courseSlug] : prev.filter((s) => s !== courseSlug),
      );
      toast({
        title: "Couldn't update shortlist",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // ---- Compare toggle ----
  const toggleCompare = async (courseSlug: string, courseName: string) => {
    if (!studentId) return;
    const wasIn = compared.includes(courseSlug);
    if (!wasIn && compared.length >= COMPARE_LIMIT) {
      toast({
        title: "Compare limit reached",
        description: `You can compare up to ${COMPARE_LIMIT} courses at once. Remove one to add another.`,
        variant: "destructive",
      });
      return;
    }
    // Optimistic
    setCompared((prev) =>
      wasIn ? prev.filter((s) => s !== courseSlug) : [...prev, courseSlug],
    );
    try {
      const res = await fetch("/api/course-finder/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseSlug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.added) {
        setCompared((prev) => (prev.includes(courseSlug) ? prev : [...prev, courseSlug]));
        toast({
          title: "Added to compare",
          description: `${courseName} (${data.count}/${COMPARE_LIMIT})`,
        });
      } else {
        setCompared((prev) => prev.filter((s) => s !== courseSlug));
        toast({
          title: "Removed from compare",
          description: courseName,
        });
      }
    } catch (e: any) {
      // Revert
      setCompared((prev) =>
        wasIn ? [...prev, courseSlug] : prev.filter((s) => s !== courseSlug),
      );
      toast({
        title: "Couldn't update compare list",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeCompare = async (courseSlug: string) => {
    if (!studentId) return;
    setCompared((prev) => prev.filter((s) => s !== courseSlug));
    try {
      await fetch("/api/course-finder/compare", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, courseSlug }),
      });
    } catch {
      // Revert silently
      setCompared((prev) => (prev.includes(courseSlug) ? prev : [...prev, courseSlug]));
    }
  };

  // ---- Derived filter options ----
  const countryOptions = React.useMemo(() => {
    const seen = new Map<string, { slug: string; name: string; flag: string }>();
    for (const r of results) {
      const c = courseMap[r.courseSlug]?.country;
      if (c && !seen.has(c.slug)) seen.set(c.slug, { slug: c.slug, name: c.name, flag: c.flag });
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [results, courseMap]);

  const levelOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of results) {
      const lvl = courseMap[r.courseSlug]?.level;
      if (lvl) set.add(lvl);
    }
    return Array.from(set).sort();
  }, [results, courseMap]);

  const subjectOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of results) {
      const subj = courseMap[r.courseSlug]?.subject;
      if (subj) set.add(subj);
    }
    return Array.from(set).sort();
  }, [results, courseMap]);

  // ---- Filtered + sorted results ----
  const filtered = React.useMemo(() => {
    let arr = results.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((r) => {
        const c = courseMap[r.courseSlug];
        return (
          r.courseName.toLowerCase().includes(q) ||
          r.university?.toLowerCase().includes(q) ||
          c?.subject?.toLowerCase().includes(q)
        );
      });
    }
    if (country) {
      arr = arr.filter((r) => courseMap[r.courseSlug]?.countrySlug === country);
    }
    if (level) {
      arr = arr.filter((r) => courseMap[r.courseSlug]?.level === level);
    }
    if (subject) {
      arr = arr.filter((r) => courseMap[r.courseSlug]?.subject === subject);
    }
    if (statusFilter !== "__all__") {
      arr = arr.filter((r) => r.status === statusFilter);
    }
    if (shortlistOnly) {
      arr = arr.filter((r) => shortlisted.includes(r.courseSlug));
    }
    // Sort
    if (sort === "score-desc") arr.sort((a, b) => b.eligibilityScore - a.eligibilityScore);
    if (sort === "tuition-asc")
      arr.sort(
        (a, b) =>
          tuitionAmount(courseMap[a.courseSlug]?.tuition) -
          tuitionAmount(courseMap[b.courseSlug]?.tuition),
      );
    if (sort === "name-asc") arr.sort((a, b) => a.courseName.localeCompare(b.courseName));
    return arr;
  }, [results, courseMap, query, country, level, subject, statusFilter, shortlistOnly, shortlisted, sort]);

  const activeFilterCount =
    (query ? 1 : 0) +
    (country ? 1 : 0) +
    (level ? 1 : 0) +
    (subject ? 1 : 0) +
    (statusFilter !== "__all__" ? 1 : 0) +
    (shortlistOnly ? 1 : 0);

  const clearFilters = () => {
    setQuery("");
    setCountry("");
    setLevel("");
    setSubject("");
    setStatusFilter("__all__");
    setShortlistOnly(false);
  };

  const compareCourses: Course[] = compared
    .map((slug) => courseMap[slug])
    .filter(Boolean) as Course[];
  const compareResults: EligibilityResult[] = compared
    .map((slug) => results.find((r) => r.courseSlug === slug))
    .filter(Boolean) as EligibilityResult[];

  const profileCompletion = studentProfile?.profileCompletion ?? 0;

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 bg-[var(--alo-page)] pb-32">
      <PageHeader
        title="Smart Course Finder"
        subtitle="AI-powered course matching with eligibility scoring. Find your perfect fit."
        icon="Sparkles"
        action={
          studentProfile ? (
            <Badge
              className={cn(
                "h-9 px-3 text-xs font-semibold",
                profileCompletion >= 80
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                  : profileCompletion >= 50
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-50",
              )}
            >
              <Icon name="Gauge" className="mr-1.5 size-3.5" />
              Profile completion: {profileCompletion}%
            </Badge>
          ) : undefined
        }
      />

      {/* Student selector + profile completion hint */}
      <SectionCard
        title="Student"
        description="Pick a student to compute personalized eligibility scores against every published course."
        icon="UserRound"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label className="text-xs font-semibold text-muted-foreground">
              Select student
            </Label>
            <Select
              value={studentId || "__none__"}
              onValueChange={(v) => setStudentId(v === "__none__" ? "" : v)}
              disabled={studentsLoading}
            >
              <SelectTrigger className="mt-1 h-12">
                <SelectValue
                  placeholder={studentsLoading ? "Loading students..." : "Select a student"}
                />
              </SelectTrigger>
              <SelectContent>
                {students.length === 0 && !studentsLoading && (
                  <SelectItem value="__none__" disabled>
                    No students available
                  </SelectItem>
                )}
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-mono text-[11px] text-muted-foreground">{s.studentId}</span>
                    <span className="ml-2 font-medium">{s.fullName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {studentProfile && (
            <div className="sm:w-72">
              <div className="mb-1 flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Profile completion
                </Label>
                <span className="text-xs font-bold text-[var(--alo-brand)]">{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} className="h-2" />
              {profileCompletion < 80 && (
                <p className="mt-1.5 text-[11px] text-amber-600">
                  <Icon name="Info" className="mr-1 inline size-3" />
                  Higher completion improves eligibility accuracy. Update the profile to unlock stronger matches.
                </p>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* No student selected */}
      {!studentId && !studentsLoading ? (
        <EmptyState
          icon="UserRoundSearch"
          title="Select a student to see personalized eligibility scores"
          description="Choose any student above. We'll compute an AI eligibility score against every published course using academic background, English tests, country preference, study level and subject area."
        />
      ) : studentsLoading || eligibleLoading ? (
        <LoadingGrid count={6} />
      ) : (
        <>
          {/* Eligibility summary cards */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {SUMMARY_CARDS.map((card) => {
                const meta = STATUS_META[card.status];
                const value = summary[card.key] || 0;
                return (
                  <Card
                    key={card.status}
                    className={cn("rounded-2xl border-2", meta.border)}
                  >
                    <CardContent className="pt-4">
                      <div
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl",
                          meta.bg,
                          meta.text,
                        )}
                      >
                        <Icon name={meta.icon} className="size-4" />
                      </div>
                      <p className="mt-3 text-3xl font-black tabular-nums text-foreground">
                        {value}
                      </p>
                      <p className={cn("mt-0.5 text-xs font-semibold", meta.text)}>
                        {card.label}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Two-column layout: filters + results */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Filters panel */}
            <div className="lg:col-span-1">
              <SectionCard
                title="Filters"
                description="Refine your matches"
                icon="SlidersHorizontal"
                action={
                  activeFilterCount > 0 ? (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-medium text-[var(--alo-brand)] hover:underline"
                    >
                      Clear all ({activeFilterCount})
                    </button>
                  ) : undefined
                }
              >
                <div className="space-y-4">
                  <FilterInput
                    label="Search"
                    icon="Search"
                    placeholder="Course, university, subject"
                    value={query}
                    onChange={setQuery}
                  />
                  <FilterSelect
                    label="Country"
                    value={country}
                    onValueChange={setCountry}
                    placeholder="All countries"
                    options={countryOptions.map((c) => ({
                      value: c.slug,
                      label: `${c.flag} ${c.name}`.trim(),
                    }))}
                  />
                  <FilterSelect
                    label="Study level"
                    value={level}
                    onValueChange={setLevel}
                    placeholder="All levels"
                    options={levelOptions.map((l) => ({ value: l, label: l }))}
                  />
                  <FilterSelect
                    label="Subject"
                    value={subject}
                    onValueChange={setSubject}
                    placeholder="All subjects"
                    options={subjectOptions.map((s) => ({ value: s, label: s }))}
                  />
                  <FilterSelect
                    label="Status"
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    placeholder="All statuses"
                    options={STATUS_FILTERS.map((s) => ({ value: s.value, label: s.label }))}
                  />
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-colors",
                      shortlistOnly
                        ? "border-[var(--alo-cta)] bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]"
                        : "border-muted text-foreground hover:bg-muted/40",
                    )}
                  >
                    <Checkbox
                      checked={shortlistOnly}
                      onCheckedChange={(v) => setShortlistOnly(v === true)}
                      className="size-4 border-[var(--alo-cta)] data-[state=checked]:border-[var(--alo-cta)] data-[state=checked]:bg-[var(--alo-cta)]"
                    />
                    <Icon name="Heart" className="size-3.5" />
                    Show shortlisted only
                    {shortlisted.length > 0 && (
                      <Badge className="ml-auto bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]">
                        {shortlisted.length}
                      </Badge>
                    )}
                  </label>
                  <Button
 onClick={clearFilters}
 variant="outline"
 className=" w-full border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 >
                    <Icon name="RotateCcw" className="size-4" />
                    Reset filters
                  </Button>
                </div>
              </SectionCard>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              {/* Sort + count */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
                  <span className="font-semibold text-foreground">{results.length}</span> evaluated
                  courses
                </p>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Sort by:</Label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="h-9 w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score-desc">Eligibility Score (high to low)</SelectItem>
                      <SelectItem value="tuition-asc">Tuition (low to high)</SelectItem>
                      <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  icon="SearchX"
                  title="No courses match your filters"
                  description="Try removing a filter or widening your search to see more matches."
                  action={
                    <Button
                      onClick={clearFilters}
                      className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
                    >
                      <Icon name="RotateCcw" className="size-4" />
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filtered.map((r) => (
                    <EligibilityCourseCard
                      key={r.courseSlug}
                      result={r}
                      course={courseMap[r.courseSlug]}
                      isShortlisted={shortlisted.includes(r.courseSlug)}
                      isComparing={compared.includes(r.courseSlug)}
                      compareDisabled={
                        !compared.includes(r.courseSlug) && compared.length >= COMPARE_LIMIT
                      }
                      onNavigate={onNavigate}
                      onShortlist={() => toggleShortlist(r.courseSlug, r.courseName)}
                      onCompare={() => toggleCompare(r.courseSlug, r.courseName)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Floating compare bar */}
      {compared.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--alo-brand)]/15 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="mx-auto max-w-[1280px] px-4 py-3 lg:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                  <Icon name="Scale" className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--alo-brand)]">
                    Comparing {compared.length} of {COMPARE_LIMIT}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {compared.map((slug) => {
                      const c = courseMap[slug];
                      const name = c?.name || slug;
                      return (
                        <span
                          key={slug}
                          className="inline-flex items-center gap-1 rounded-full bg-[var(--alo-brand-light)] px-2 py-0.5 text-[11px] font-medium text-[var(--alo-brand)]"
                        >
                          <span className="max-w-[140px] truncate">{name}</span>
                          <button
                            onClick={() => removeCompare(slug)}
                            className="hover:text-[var(--alo-cta)]"
                            aria-label={`Remove ${name} from compare`}
                          >
                            <Icon name="X" className="size-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCompared([])}
                  variant="ghost"
                  className="h-10 text-muted-foreground hover:bg-[var(--alo-brand-light)] hover:text-[var(--alo-brand)]"
                >
                  Clear
                </Button>
                <Button
                  onClick={() => setCompareOpen(true)}
                  disabled={compared.length < 2}
                  className="h-10 bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
                >
                  <Icon name="Scale" className="size-4" />
                  Compare Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-5xl overflow-hidden p-0">
          <DialogHeader className="border-b border-[var(--alo-brand)]/10 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-[var(--alo-brand)]">
              <Icon name="Scale" className="size-5" />
              Course Comparison
            </DialogTitle>
            <DialogDescription className="text-xs">
              Side-by-side comparison of {compareCourses.length} courses, including your eligibility score for each.
            </DialogDescription>
          </DialogHeader>
          <CompareTable
            courses={compareCourses}
            results={compareResults}
            onNavigate={(slug) => {
              setCompareOpen(false);
              onNavigate("public-course", slug);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

function FilterInput({
  label,
  icon,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <div className="relative mt-1">
        <Icon
          name={icon}
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 pl-9"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <Icon name="X" className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <Select value={value || "__all__"} onValueChange={(v) => onValueChange(v === "__all__" ? "" : v)}>
        <SelectTrigger className="mt-1 h-10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{placeholder}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Course card with eligibility score
// ---------------------------------------------------------------------------

function EligibilityCourseCard({
  result,
  course,
  isShortlisted,
  isComparing,
  compareDisabled,
  onNavigate,
  onShortlist,
  onCompare,
}: {
  result: EligibilityResult;
  course?: Course;
  isShortlisted: boolean;
  isComparing: boolean;
  compareDisabled: boolean;
  onNavigate: (v: ViewKey, slug?: string) => void;
  onShortlist: () => void;
  onCompare: () => void;
}) {
  const meta = scoreColor(result.eligibilityScore, result.status);
  const intakeList = course?.intake
    ? course.intake.split(/[,/]/).map((s) => s.trim()).filter(Boolean)
    : [];
  const reasons = result.reasons.slice(0, 3);
  const missing = result.missing.slice(0, 3);

  return (
    <Card
      className={cn(
        "flex flex-col rounded-2xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg",
        isComparing
          ? "border-[var(--alo-brand)] bg-[var(--alo-brand-light)]/40"
          : "border-[var(--alo-brand)]/15 hover:border-[var(--alo-brand)]/40",
      )}
    >
      <CardContent className="flex flex-1 flex-col p-5">
        {/* Top: badges + score */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {course?.level && (
              <Badge className="bg-[var(--alo-brand-light)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">
                {course.level}
              </Badge>
            )}
            {course?.subject && (
              <Badge variant="outline" className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)]">
                {course.subject}
              </Badge>
            )}
          </div>
          {/* Big score badge */}
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 px-3 py-1.5",
              meta.bg,
              meta.border,
            )}
            title={`${meta.label} — ${result.eligibilityScore}% match`}
          >
            <span className={cn("text-2xl font-black leading-none tabular-nums", meta.text)}>
              {result.eligibilityScore}%
            </span>
            <span className={cn("mt-0.5 text-[11px] font-semibold uppercase tracking-wide", meta.text)}>
              {meta.label}
            </span>
          </div>
        </div>

        {/* Name */}
        <button
          onClick={() => onNavigate("public-course", result.courseSlug)}
          className="mt-3 text-left"
        >
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-[var(--alo-brand)] hover:underline">
            {result.courseName}
          </h3>
        </button>

        {/* University + city + country */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="Building2" className="size-3.5 shrink-0" />
          <span className="truncate">{course?.university?.name || result.university || "—"}</span>
          {course?.city && (
            <>
              <span>·</span>
              <span className="truncate">{course.city}</span>
            </>
          )}
        </div>
        {course?.country && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{course.country.flag}</span>
            <span>{course.country.name}</span>
          </div>
        )}

        {/* Tuition + duration */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[var(--alo-brand-light)]/60 p-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Tuition
            </p>
            <p className="mt-0.5 text-base font-black text-[var(--alo-brand)]">
              {course?.tuition || "—"}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--alo-page)] p-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Duration
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {course?.duration || "—"}
            </p>
          </div>
        </div>

        {/* Intake */}
        {intakeList.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            {intakeList.slice(0, 3).map((i) => (
              <span
                key={i}
                className="rounded-full bg-[var(--alo-brand-light)]/80 px-2 py-0.5 font-medium text-[var(--alo-brand)]"
              >
                {i}
              </span>
            ))}
            {intakeList.length > 3 && (
              <span className="text-muted-foreground">+{intakeList.length - 3} more</span>
            )}
          </div>
        )}

        {/* Eligibility reasons */}
        {reasons.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon name="Sparkles" className="size-3 text-[var(--alo-brand)]" />
              Why this match
            </p>
            <ul className="space-y-1">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                  <Icon name="Check" className={cn("mt-0.5 size-3.5 shrink-0", meta.text)} />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing requirements */}
        {missing.length > 0 && (
          <div className="mt-3 rounded-lg bg-amber-50 p-2.5">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              <Icon name="AlertTriangle" className="size-3" />
              Missing info ({result.missing.length})
            </p>
            <ul className="space-y-1">
              {missing.map((m, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700/90">
                  <Icon name="Dot" className="size-3 shrink-0" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button
            onClick={() => onNavigate("public-course", result.courseSlug)}
            variant="outline"
            className="h-10 flex-1 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
            size="sm"
          >
            <Icon name="Eye" className="size-4" />
            View Details
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
 onClick={onShortlist}
 variant={isShortlisted ? "default" : "outline"}
 className={cn(
 "",
 isShortlisted
 ? "bg-rose-500 text-white hover:bg-rose-600"
 : "border-rose-200 text-rose-600 hover:bg-rose-50",
 )}
 size="sm"
 >
              <Icon name={isShortlisted ? "Heart" : "Heart"} className="size-4" />
              {isShortlisted ? "Saved" : "Save"}
            </Button>
            <Button
 onClick={onCompare}
 variant={isComparing ? "default" : "outline"}
 disabled={compareDisabled && !isComparing}
 className={cn(
 "",
 isComparing
 ? "bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
 : "border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]",
 compareDisabled && !isComparing && "opacity-50",
 )}
 size="sm"
 >
              <Icon name="GitCompare" className="size-4" />
              {isComparing ? "Comparing" : "Compare"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Compare table (side-by-side, includes eligibility score)
// ---------------------------------------------------------------------------

function CompareTable({
  courses,
  results,
  onNavigate,
}: {
  courses: Course[];
  results: EligibilityResult[];
  onNavigate: (slug: string) => void;
}) {
  if (courses.length < 2) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Select at least 2 courses to compare.
      </div>
    );
  }

  const resultBySlug = new Map(results.map((r) => [r.courseSlug, r]));

  const rows: { label: string; icon: string; render: (c: Course, r?: EligibilityResult) => React.ReactNode }[] = [
    {
      label: "Eligibility",
      icon: "Sparkles",
      render: (_c, r) => {
        if (!r) return "—";
        const meta = STATUS_META[r.status];
        return (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", meta.bg, meta.text)}>
            {r.eligibilityScore}% · {meta.label}
          </span>
        );
      },
    },
    { label: "University", icon: "Building2", render: (c) => c.university?.name || "—" },
    { label: "Country", icon: "Globe", render: (c) => (c.country ? `${c.country.flag} ${c.country.name}` : "—") },
    { label: "City", icon: "MapPin", render: (c) => c.city || "—" },
    { label: "Level", icon: "GraduationCap", render: (c) => c.level },
    { label: "Duration", icon: "Clock", render: (c) => c.duration || "—" },
    { label: "Intake", icon: "Calendar", render: (c) => c.intake || "—" },
    { label: "Tuition", icon: "CreditCard", render: (c) => <span className="font-bold text-[var(--alo-brand)]">{c.tuition}</span> },
    { label: "Scholarship", icon: "Award", render: (c) => c.scholarship || "—" },
    { label: "English req.", icon: "Languages", render: (c) => c.englishRequirement || "—" },
    { label: "Academic req.", icon: "ClipboardCheck", render: (c) => c.academicRequirement || "—" },
    { label: "Deadline", icon: "CalendarClock", render: (c) => (c.deadline ? fmtDate(c.deadline) : "—") },
  ];

  return (
    <ScrollArea className="max-h-[70vh]">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-white">
          <TableRow className="border-b border-[var(--alo-brand)]/15">
            <TableHead className="sticky left-0 z-20 w-32 bg-white text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Attribute
            </TableHead>
            {courses.map((c) => (
              <TableHead key={c.slug} className="min-w-[180px] align-top">
                <button
                  onClick={() => onNavigate(c.slug)}
                  className="text-left text-sm font-bold text-[var(--alo-brand)] hover:underline"
                >
                  {c.name}
                </button>
                <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
                  {c.university?.name}
                </p>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label} className="border-b border-[var(--alo-brand)]/8">
              <TableCell className="sticky left-0 z-10 bg-[var(--alo-page)] align-top text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Icon name={row.icon} className="size-3.5 text-[var(--alo-brand)]" />
                  {row.label}
                </span>
              </TableCell>
              {courses.map((c) => (
                <TableCell key={c.slug} className="align-top text-xs text-foreground/80">
                  {row.render(c, resultBySlug.get(c.slug))}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
export default StudentCourseFinder;
