"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Icon,
  EmptyState,
  LoadingGrid,
} from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  sourceUrl?: string | null;
  lastVerifiedAt?: string | null;
  university: { name: string; slug: string; city: string };
  country: { name: string; shortName: string; flag: string; slug: string };
};

type Facets = {
  levels: string[];
  subjects: string[];
  countries: { slug: string; name: string; flag: string }[];
};

const INTAKE_OPTIONS = [
  "January",
  "February",
  "April",
  "May",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const COMPARE_LIMIT = 3;
const LEVEL_COLORS: Record<string, string> = {
  Foundation: "bg-sky-100 text-sky-700",
  Bachelor: "bg-emerald-100 text-emerald-700",
  Masters: "bg-violet-100 text-violet-700",
  MBA: "bg-orange-100 text-orange-700",
  PhD: "bg-rose-100 text-rose-700",
  "Postgraduate Diploma": "bg-amber-100 text-amber-700",
  "Pre-Masters": "bg-teal-100 text-teal-700",
  "Top-up": "bg-[var(--alo-surface-muted)] text-[var(--alo-body)]",
};

function levelColor(level: string) {
  return LEVEL_COLORS[level] || "bg-[var(--alo-brand-light)] text-[var(--alo-brand)]";
}

// Extract leading numeric value from tuition strings for sorting
function tuitionAmount(t: string): number {
  if (!t) return 0;
  // strip currency codes & symbols, take first number found
  const match = t.replace(/[, ]/g, "").match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

function deadlineWarning(deadline: string | null): {
  days?: number;
  near: boolean;
  overdue: boolean;
} {
  if (!deadline) return { near: false, overdue: false };
  // Try to detect a month name + year (e.g. "June (September intake)")
  const m = deadline.match(/(\d{4})/);
  const monthMatch = deadline.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)/i
  );
  if (!m || !monthMatch) return { near: false, overdue: false };
  const year = parseInt(m[1], 10);
  const monthIdx = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ].indexOf(monthMatch[1].toLowerCase());
  if (monthIdx < 0) return { near: false, overdue: false };
  const target = new Date(year, monthIdx, 15);
  const diff = (target.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return { days: Math.round(diff), near: true, overdue: true };
  if (diff <= 45) return { days: Math.round(diff), near: true, overdue: false };
  return { days: Math.round(diff), near: false, overdue: false };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PublicCourseFinderProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

export function PublicCourseFinder({ onNavigate }: PublicCourseFinderProps) {
  const { toast } = useToast();

  const [facets, setFacets] = React.useState<Facets>({ levels: [], subjects: [], countries: [] });
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingFacets, setLoadingFacets] = React.useState(true);

  // Filters
  const [query, setQuery] = React.useState("");
  const [country, setCountry] = React.useState<string>("");
  const [level, setLevel] = React.useState<string>("");
  const [subject, setSubject] = React.useState<string>("");
  const [intake, setIntake] = React.useState<string>("");
  const [sort, setSort] = React.useState<string>("name-asc");

  // Compare + apply state
  const [compareSlugs, setCompareSlugs] = React.useState<string[]>([]);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [applyCourse, setApplyCourse] = React.useState<Course | null>(null);

  // Build query string
  const buildUrl = React.useCallback((overrides?: Partial<{ q: string; country: string; level: string; subject: string; intake: string }>) => {
    const q = (overrides?.q ?? query).trim();
    const c = overrides?.country ?? country;
    const l = overrides?.level ?? level;
    const s = overrides?.subject ?? subject;
    const i = overrides?.intake ?? intake;
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (c) sp.set("country", c);
    if (l) sp.set("level", l);
    if (s) sp.set("subject", s);
    if (i) sp.set("intake", i);
    return `/api/course-finder?${sp.toString()}`;
  }, [query, country, level, subject, intake]);

  // Initial load — fetch facets by hitting endpoint with no filters
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingFacets(true);
        const res = await fetch(`/api/course-finder`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.facets) setFacets(data.facets);
      } catch {
        // Non-fatal — facets will be empty
      } finally {
        if (!cancelled) setLoadingFacets(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced fetch of results on filter change
  React.useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(buildUrl(), { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setCourses(Array.isArray(data.courses) ? data.courses : []);
        if (data?.facets && !facets.levels.length) setFacets(data.facets);
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Couldn’t load courses",
            description: e?.message || "Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, country, level, subject, intake, buildUrl, facets.levels.length, toast]);

  // Apply sort client-side
  const sortedCourses = React.useMemo(() => {
    const arr = [...courses];
    if (sort === "name-asc") arr.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "name-desc") arr.sort((a, b) => b.name.localeCompare(a.name));
    if (sort === "tuition-asc") arr.sort((a, b) => tuitionAmount(a.tuition) - tuitionAmount(b.tuition));
    if (sort === "tuition-desc") arr.sort((a, b) => tuitionAmount(b.tuition) - tuitionAmount(a.tuition));
    return arr;
  }, [courses, sort]);

  const activeFilterCount = [country, level, subject, intake].filter(Boolean).length + (query ? 1 : 0);

  const clearFilters = () => {
    setQuery("");
    setCountry("");
    setLevel("");
    setSubject("");
    setIntake("");
  };

  const toggleCompare = (slug: string) => {
    setCompareSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= COMPARE_LIMIT) {
        toast({
          title: `Compare limit reached`,
          description: `You can compare up to ${COMPARE_LIMIT} courses at a time. Remove one to add another.`,
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, slug];
    });
  };

  const compareCourses = sortedCourses.filter((c) => compareSlugs.includes(c.slug));

  return (
    <div className="bg-white pb-32">
      {/* HERO + Breadcrumb */}
      <div className="border-b border-[var(--alo-brand)]/10 bg-gradient-to-b from-[var(--alo-brand-light)]/60 to-white">
        <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6 lg:py-10">
          <Breadcrumb
            items={[
              { label: "Home", onClick: () => onNavigate("public-home") },
              { label: "Course Finder" },
            ]}
          />
          <div className="mt-5">
            <h1 className="text-3xl font-black tracking-tight text-[var(--alo-brand)] sm:text-4xl">
              Course Finder
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Search and compare courses across 13 countries and 12+ universities.
              Find the right fit for your background and budget.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-6 lg:py-10">
        {/* Search & filter panel */}
        <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/15 bg-white alo-shadow">
          <CardContent className="p-5 lg:p-6">
            <div className="flex flex-col gap-4">
              {/* Search input row */}
              <div className="relative">
                <Icon
                  name="Search"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by course name or subject — e.g. Computer Science, MBA, Data Science..."
                  className="h-12 pl-9 text-base"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <Icon name="X" className="size-4" />
                  </button>
                )}
              </div>

              {/* Filter grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FilterSelect
                  label="Country"
                  value={country}
                  onValueChange={setCountry}
                  placeholder="All countries"
                  options={facets.countries.map((c) => ({
                    value: c.slug,
                    label: `${c.flag || ""} ${c.name}`.trim(),
                  }))}
                  loading={loadingFacets}
                />
                <FilterSelect
                  label="Level"
                  value={level}
                  onValueChange={setLevel}
                  placeholder="All levels"
                  options={facets.levels.map((l) => ({ value: l, label: l }))}
                  loading={loadingFacets}
                />
                <FilterSelect
                  label="Subject"
                  value={subject}
                  onValueChange={setSubject}
                  placeholder="All subjects"
                  options={facets.subjects.map((s) => ({ value: s, label: s }))}
                  loading={loadingFacets}
                />
                <FilterSelect
                  label="Intake"
                  value={intake}
                  onValueChange={setIntake}
                  placeholder="All intakes"
                  options={INTAKE_OPTIONS.map((i) => ({ value: i, label: i }))}
                />
              </div>

              {/* Action row */}
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {activeFilterCount > 0 ? (
                    <>
                      <Badge className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]">
                        {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
                      </Badge>
                      <button
                        onClick={clearFilters}
                        className="font-medium text-[var(--alo-brand)] hover:underline"
                      >
                        Clear all
                      </button>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Icon name="Info" className="size-3.5" />
                      No filters applied — showing all courses
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <Button
                    onClick={() => setQuery((q) => q)}
                    className="h-11 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90"
                  >
                    <Icon name="Search" className="size-4" />
                    Search
                  </Button>
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    className="h-11 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                  >
                    <Icon name="RotateCcw" className="size-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results summary + sort */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Icon name="Loader2" className="size-4 animate-spin" />
                Searching courses...
              </span>
            ) : (
              <>
                Showing <span className="font-semibold text-foreground">{sortedCourses.length}</span>{" "}
                course{sortedCourses.length !== 1 ? "s" : ""}
                {activeFilterCount > 0 && " matching your filters"}
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Sort by:</Label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z–A)</SelectItem>
                <SelectItem value="tuition-asc">Tuition (low to high)</SelectItem>
                <SelectItem value="tuition-desc">Tuition (high to low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results grid */}
        <div className="mt-5">
          {loading ? (
            <LoadingGrid count={6} />
          ) : sortedCourses.length === 0 ? (
            <EmptyState
              icon="SearchX"
              title="No courses match your filters"
              description="Try clearing some filters, or browse all available universities to discover your options."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    onClick={clearFilters}
                    className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand)]/90"
                  >
                    <Icon name="RotateCcw" className="size-4" />
                    Clear filters
                  </Button>
                  <Button
                    onClick={() => onNavigate("public-universities")}
                    variant="outline"
                    className="border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
                  >
                    <Icon name="Building2" className="size-4" />
                    Browse all universities
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedCourses.map((course) => (
                <CourseCard
                  key={course.slug}
                  course={course}
                  onNavigate={onNavigate}
                  onApply={() => setApplyCourse(course)}
                  onCompare={() => toggleCompare(course.slug)}
                  isComparing={compareSlugs.includes(course.slug)}
                  compareDisabled={
                    !compareSlugs.includes(course.slug) && compareSlugs.length >= COMPARE_LIMIT
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compare bar (floating) */}
      {compareSlugs.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--alo-brand)]/15 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="mx-auto max-w-[1280px] px-4 py-3 lg:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--alo-brand-light)] text-[var(--alo-brand)]">
                  <Icon name="Scale" className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--alo-brand)]">
                    Comparing {compareSlugs.length} of {COMPARE_LIMIT}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {compareCourses.map((c) => (
                      <span
                        key={c.slug}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--alo-brand-light)] px-2 py-0.5 text-[11px] font-medium text-[var(--alo-brand)]"
                      >
                        {c.name}
                        <button
                          onClick={() => toggleCompare(c.slug)}
                          className="hover:text-[var(--alo-cta)]"
                          aria-label={`Remove ${c.name} from compare`}
                        >
                          <Icon name="X" className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCompareSlugs([])}
                  variant="ghost"
                  className="h-10 text-muted-foreground hover:bg-[var(--alo-brand-light)] hover:text-[var(--alo-brand)]"
                >
                  Clear
                </Button>
                <Button
                  onClick={() => setCompareOpen(true)}
                  disabled={compareSlugs.length < 2}
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
              Side-by-side comparison of {compareCourses.length} courses.
            </DialogDescription>
          </DialogHeader>
          <CompareTable courses={compareCourses} onNavigate={(s) => { setCompareOpen(false); onNavigate("public-course", s); }} />
        </DialogContent>
      </Dialog>

      {/* Apply Now dialog */}
      <Dialog open={!!applyCourse} onOpenChange={(o) => !o && setApplyCourse(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--alo-brand)]">
              <Icon name="Send" className="size-5" />
              Apply for {applyCourse?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {applyCourse?.university.name} · {applyCourse?.city}, {applyCourse?.country.name}
            </DialogDescription>
          </DialogHeader>
          {applyCourse && (
            <PublicLeadForm
              sourceTag={`Course Finder - ${applyCourse.name}`}
              preferredCountry={applyCourse.country.name}
              preferredCourse={applyCourse.name}
              title="Start your application"
              subtitle="Submit your details — an ALO counselor will reach out within 24 hours to start your application for this course."
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter select
// ---------------------------------------------------------------------------

function FilterSelect({
  label,
  value,
  onValueChange,
  placeholder,
  options,
  loading,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  loading?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <Select value={value || "__all__"} onValueChange={(v) => onValueChange(v === "__all__" ? "" : v)}>
        <SelectTrigger className="mt-1 h-10">
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
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
// Course card
// ---------------------------------------------------------------------------

function CourseCard({
  course,
  onNavigate,
  onApply,
  onCompare,
  isComparing,
  compareDisabled,
}: {
  course: Course;
  onNavigate: (v: ViewKey, slug?: string) => void;
  onApply: () => void;
  onCompare: () => void;
  isComparing: boolean;
  compareDisabled: boolean;
}) {
  const dw = deadlineWarning(course.deadline);
  const intakeList = course.intake.split(/[,/]/).map((s) => s.trim()).filter(Boolean);

  return (
    <Card
      className={cn(
        "flex flex-col rounded-2xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg",
        isComparing
          ? "border-[var(--alo-brand)] bg-[var(--alo-brand-light)]/40"
          : "border-[var(--alo-brand)]/15 hover:border-[var(--alo-brand)]/40"
      )}
    >
      <CardContent className="flex flex-1 flex-col p-5">
        {/* Top: badges + compare checkbox */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={cn("hover:opacity-90", levelColor(course.level))}>
              {course.level}
            </Badge>
            <Badge variant="outline" className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)]">
              {course.subject}
            </Badge>
          </div>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
              isComparing
                ? "border-[var(--alo-brand)] bg-[var(--alo-brand)] text-white"
                : compareDisabled
                ? "cursor-not-allowed border-muted text-muted-foreground/60"
                : "border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
            )}
          >
            <Checkbox
              checked={isComparing}
              disabled={compareDisabled}
              onCheckedChange={() => onCompare()}
              className="size-3.5 border-[var(--alo-brand)]/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-[var(--alo-brand)]"
            />
            Compare
          </label>
        </div>

        {/* Name */}
        <button
          onClick={() => onNavigate("public-course", course.slug)}
          className="mt-3 text-left"
        >
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-[var(--alo-brand)] hover:underline">
            {course.name}
          </h3>
        </button>

        {/* University + city + country */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="Building2" className="size-3.5 shrink-0" />
          <span className="truncate">{course.university.name}</span>
          <span>·</span>
          <span className="truncate">{course.city}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{course.country.flag}</span>
          <span>{course.country.name}</span>
        </div>

        {/* Tuition + duration + intake */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[var(--alo-brand-light)]/60 p-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Tuition
            </p>
            <p className="mt-0.5 text-base font-black text-[var(--alo-brand)]">{course.tuition}</p>
          </div>
          <div className="rounded-lg bg-[var(--alo-page)] p-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Duration
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{course.duration}</p>
          </div>
        </div>

        {/* Scholarship badge */}
        {course.scholarship && (
          <div className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
            <Icon name="Award" className="size-3" />
            {course.scholarship}
          </div>
        )}

        {/* Requirements */}
        <div className="mt-3 space-y-1.5 text-xs">
          <div className="flex items-start gap-1.5">
            <Icon name="Languages" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-brand)]" />
            <span className="text-foreground/80">
              <span className="font-semibold text-foreground">English:</span>{" "}
              {course.englishRequirement}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <Icon name="GraduationCap" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-brand)]" />
            <span className="line-clamp-2 text-foreground/80">
              <span className="font-semibold text-foreground">Academic:</span>{" "}
              {course.academicRequirement}
            </span>
          </div>
        </div>

        {/* Intake + deadline */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
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
        {course.deadline && (
          <div
            className={cn(
              "mt-2 flex items-center gap-1.5 text-[11px] font-medium",
              dw.overdue
                ? "text-rose-600"
                : dw.near
                ? "text-amber-600"
                : "text-muted-foreground"
            )}
          >
            <Icon
              name={dw.overdue ? "AlertTriangle" : dw.near ? "Clock" : "CalendarClock"}
              className="size-3.5"
            />
            Deadline: {course.deadline}
            {dw.days !== undefined && (
              <span className="ml-1">
                ({dw.overdue ? "passed" : `${dw.days}d left`})
              </span>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
          <Button
            onClick={() => onNavigate("public-course", course.slug)}
            variant="outline"
            className="h-10 flex-1 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
            size="sm"
          >
            <Icon name="Eye" className="size-4" />
            View Details
          </Button>
          <Button
            onClick={onApply}
            className="h-10 flex-1 bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta)]/90"
            size="sm"
          >
            <Icon name="Send" className="size-4" />
            Apply Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Compare table
// ---------------------------------------------------------------------------

function CompareTable({
  courses,
  onNavigate,
}: {
  courses: Course[];
  onNavigate: (slug: string) => void;
}) {
  if (courses.length < 2) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Select at least 2 courses to compare.
      </div>
    );
  }

  const rows: { label: string; key: (c: Course) => React.ReactNode; icon: string }[] = [
    { label: "University", icon: "Building2", key: (c) => c.university.name },
    { label: "Country", icon: "Globe", key: (c) => `${c.country.flag} ${c.country.name}` },
    { label: "City", icon: "MapPin", key: (c) => c.city },
    { label: "Level", icon: "GraduationCap", key: (c) => c.level },
    { label: "Duration", icon: "Clock", key: (c) => c.duration },
    { label: "Intake", icon: "Calendar", key: (c) => c.intake },
    { label: "Tuition", icon: "CreditCard", key: (c) => <span className="font-bold text-[var(--alo-brand)]">{c.tuition}</span> },
    { label: "Scholarship", icon: "Award", key: (c) => c.scholarship || "—" },
    { label: "English req.", icon: "Languages", key: (c) => c.englishRequirement },
    { label: "Academic req.", icon: "ClipboardCheck", key: (c) => c.academicRequirement },
    { label: "Deadline", icon: "CalendarClock", key: (c) => c.deadline || "—" },
  ];

  return (
    <div className="max-h-[70vh] overflow-auto alo-scroll">
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
                  {c.university.name}
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
                  {row.key(c)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
export default PublicCourseFinder;
