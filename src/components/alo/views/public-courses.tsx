"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icon, StatCard, SectionCard, EmptyState, LoadingGrid, PageHeader } from "@/components/alo/shared";
import { Breadcrumb, Disclaimer } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

interface PublicCoursesProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface CourseCountry {
  name: string;
  shortName: string;
  flag: string;
  slug?: string;
}

interface CourseUniversity {
  name: string;
  city: string;
  slug?: string;
}

interface CourseListItem {
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
  scholarship?: string | null;
  englishRequirement: string;
  academicRequirement: string;
  deadline?: string | null;
  lastVerifiedAt?: string | null;
  verificationStatus?: string;
  university: CourseUniversity;
  country: CourseCountry;
}

const LEVEL_OPTIONS = ["Foundation", "Bachelor", "Top-up", "Pre-Masters", "Masters", "MBA", "PhD", "Postgraduate Diploma"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function deadlineTone(deadline?: string | null): "open" | "near" | "neutral" {
  if (!deadline) return "neutral";
  const d = deadline.toLowerCase();
  if (d.includes("rolling")) return "open";
  if (d.includes("varies")) return "neutral";
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  for (let i = 0; i < MONTHS.length; i++) {
    if (deadline.includes(MONTHS[i])) {
      const diff = (i - currentMonth + 12) % 12;
      if (diff <= 2) return "near";
    }
  }
  return "neutral";
}

export function PublicCourses({ onNavigate }: PublicCoursesProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [courses, setCourses] = React.useState<CourseListItem[]>([]);

  const [countryFilter, setCountryFilter] = React.useState("all");
  const [uniFilter, setUniFilter] = React.useState("all");
  const [levelFilter, setLevelFilter] = React.useState("all");
  const [subjectFilter, setSubjectFilter] = React.useState("all");
  const [intakeFilter, setIntakeFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/courses", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && Array.isArray(data.courses)) {
          setCourses(data.courses);
        }
      } catch {
        if (!cancelled) {
          toast({ title: "Failed to load courses", description: "Please retry in a moment.", variant: "destructive" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  // Derive filter facets from data
  const countries = React.useMemo(() => {
    const map = new Map<string, CourseCountry>();
    courses.forEach((c) => {
      if (!map.has(c.countrySlug)) map.set(c.countrySlug, { ...c.country });
    });
    return Array.from(map.entries()).map(([slug, c]) => ({ slug, ...c }));
  }, [courses]);

  const universities = React.useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((c) => {
      if (!map.has(c.universitySlug)) map.set(c.universitySlug, c.university.name);
    });
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [courses]);

  const subjects = React.useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => set.add(c.subject));
    return Array.from(set).sort();
  }, [courses]);

  const intakes = React.useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      c.intake.split(/[,\s]+/).forEach((i) => {
        const trimmed = i.trim();
        if (trimmed && MONTHS.includes(trimmed)) set.add(trimmed);
      });
    });
    return Array.from(set);
  }, [courses]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (countryFilter !== "all" && c.countrySlug !== countryFilter) return false;
      if (uniFilter !== "all" && c.universitySlug !== uniFilter) return false;
      if (levelFilter !== "all" && c.level !== levelFilter) return false;
      if (subjectFilter !== "all" && c.subject !== subjectFilter) return false;
      if (intakeFilter !== "all" && !c.intake.toLowerCase().includes(intakeFilter.toLowerCase())) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.university.name.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }, [courses, countryFilter, uniFilter, levelFilter, subjectFilter, intakeFilter, search]);

  const hasActiveFilters = countryFilter !== "all" || uniFilter !== "all" || levelFilter !== "all" || subjectFilter !== "all" || intakeFilter !== "all" || search;

  const resetFilters = () => {
    setCountryFilter("all"); setUniFilter("all"); setLevelFilter("all"); setSubjectFilter("all"); setIntakeFilter("all"); setSearch("");
  };

  const levelCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    courses.forEach((c) => map.set(c.level, (map.get(c.level) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [courses]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-6 lg:py-8">
      <Breadcrumb
        items={[
          { label: "Home", onClick: () => onNavigate("public-home") },
          { label: "Courses" },
        ]}
      />

      <div className="mt-4">
        <PageHeader
          icon="BookOpen"
          title="Courses"
          subtitle="Browse verified courses across universities and countries. Compare tuition, requirements, intakes, and scholarships."
        />
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Courses listed" value={loading ? "—" : courses.length} icon="BookOpen" accent="blue" hint="All PUBLISHED & verified" />
        <StatCard label="Universities" value={loading ? "—" : universities.length} icon="Building2" accent="orange" hint="Across partner network" />
        <StatCard label="Study levels" value={loading ? "—" : levelCounts.length} icon="Layers" accent="emerald" hint={levelCounts.map(([l]) => l).slice(0, 3).join(", ")} />
        <StatCard label="Subjects" value={loading ? "—" : subjects.length} icon="FolderTree" accent="violet" hint="CS, Business, Data Science..." />
      </div>

      {/* Filters bar */}
      <Card className="mt-6 rounded-2xl border-2 border-[var(--alo-brand)]/15">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Country</label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="mt-1 h-10 w-full"><SelectValue placeholder="All countries" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>{c.flag} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">University</label>
              <Select value={uniFilter} onValueChange={setUniFilter}>
                <SelectTrigger className="mt-1 h-10 w-full"><SelectValue placeholder="All universities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All universities</SelectItem>
                  {universities.map((u) => (
                    <SelectItem key={u.slug} value={u.slug}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="mt-1 h-10 w-full"><SelectValue placeholder="All levels" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {LEVEL_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="mt-1 h-10 w-full"><SelectValue placeholder="All subjects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Intake</label>
              <Select value={intakeFilter} onValueChange={setIntakeFilter}>
                <SelectTrigger className="mt-1 h-10 w-full"><SelectValue placeholder="Any intake" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any intake</SelectItem>
                  {intakes.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search</label>
              <div className="relative mt-1">
                <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Course, university, or city..."
                  className="h-10 pl-9"
                />
              </div>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> of {courses.length} courses match
              </p>
              <Button
 variant="outline"
 size="sm"
 className=" border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]"
 onClick={resetFilters}
 >
                <Icon name="RotateCcw" className="size-3.5" /> Reset all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="mt-4"><LoadingGrid count={6} /></div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon="BookOpen"
            title="No courses match your filters"
            description="Try removing one or more filters — or use the AI Course Finder to get personalised recommendations."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90 " onClick={resetFilters}>
                  <Icon name="RotateCcw" className="size-4" /> Reset filters
                </Button>
                <Button
 variant="outline"
 className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] "
 onClick={() => onNavigate("public-course-finder")}
                >
                  <Icon name="Sparkles" className="size-4" /> Try AI Course Finder
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <>
          {!hasActiveFilters && (
            <p className="mt-5 text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> courses. Use the filters above to narrow down.
            </p>
          )}
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const tone = deadlineTone(c.deadline);
              return (
                <Card key={c.slug} className="flex flex-col rounded-2xl border-2 border-[var(--alo-brand)]/15 transition-all hover:border-[var(--alo-brand)]/40 hover:shadow-md">
                  <CardContent className="flex flex-1 flex-col pt-5">
                    {/* Top badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className="bg-[var(--alo-brand-light)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)]">{c.level}</Badge>
                      <Badge variant="outline" className="border-[var(--alo-brand)]/30 text-[var(--alo-brand)]">{c.subject}</Badge>
                      {c.scholarship && (
                        <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] hover:bg-[var(--alo-cta-soft)]">
                          <Icon name="Award" className="mr-1 size-3" /> Scholarship
                        </Badge>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="mt-3 line-clamp-2 text-base font-bold text-[var(--alo-brand)]">{c.name}</h3>

                    {/* University + location */}
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon name="Building2" className="size-3.5 text-[var(--alo-brand)]" />
                      <span className="font-medium text-foreground">{c.university.name}</span>
                      <span aria-hidden>·</span>
                      <span>{c.city}</span>
                      <span aria-hidden>·</span>
                      <span className="text-base leading-none">{c.country.flag}</span>
                    </p>

                    {/* Quick facts grid */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-[var(--alo-page)] p-2">
                        <p className="font-semibold text-muted-foreground">Duration</p>
                        <p className="font-medium text-foreground">{c.duration}</p>
                      </div>
                      <div className="rounded-lg bg-[var(--alo-page)] p-2">
                        <p className="font-semibold text-muted-foreground">Intake</p>
                        <p className="font-medium text-foreground">{c.intake}</p>
                      </div>
                      <div className="col-span-2 rounded-lg bg-[var(--alo-brand-light)]/60 p-2">
                        <p className="font-semibold text-[var(--alo-brand)]">Tuition</p>
                        <p className="text-sm font-bold text-[var(--alo-brand)]">{c.tuition}</p>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="mt-3 space-y-1.5 text-xs">
                      <p className="flex items-start gap-1.5">
                        <Icon name="GraduationCap" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-brand)]" />
                        <span className="text-muted-foreground">Academic: <span className="font-medium text-foreground line-clamp-1">{c.academicRequirement}</span></span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <Icon name="Languages" className="mt-0.5 size-3.5 shrink-0 text-[var(--alo-brand)]" />
                        <span className="text-muted-foreground">English: <span className="font-medium text-foreground line-clamp-1">{c.englishRequirement}</span></span>
                      </p>
                    </div>

                    {/* Deadline */}
                    {c.deadline && (
                      <div className="mt-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            tone === "near" && "bg-crm-warning-bg text-crm-warning-text",
                            tone === "open" && "bg-crm-success-bg text-crm-success-text",
                            tone === "neutral" && "bg-[var(--alo-page)] text-[var(--alo-body)]"
                          )}
                        >
                          <Icon
                            name={tone === "near" ? "AlarmClock" : tone === "open" ? "CheckCircle2" : "CalendarClock"}
                            className="size-3"
                          />
                          Deadline: {c.deadline}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto flex flex-col gap-2 pt-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Icon name="ShieldCheck" className="size-3 text-crm-success-text" />
                        <span>Verified {c.lastVerifiedAt ? fmtDate(c.lastVerifiedAt) : "recently"}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
 variant="outline"
 className="flex-1 border-[var(--alo-brand)]/30 text-[var(--alo-brand)] hover:bg-[var(--alo-brand-light)] "
 onClick={() => onNavigate("public-course", c.slug)}
                        >
                          <Icon name="FileText" className="size-4" /> View Details
                        </Button>
                        <Button
 className="flex-1 bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta)]/90 "
 onClick={() => {
                            toast({
                              title: "Application started",
                              description: `We'll route your application for ${c.name} to an ALO counselor.`,
                            });
                            const el = document.getElementById("apply");
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                        >
                          <Icon name="Send" className="size-4" /> Apply Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Bottom CTA */}
      <section id="apply" className="mt-12 scroll-mt-20">
        <SectionCard
          icon="Sparkles"
          title="Found a course you like? Apply in 60 seconds."
          description="Submit your details once — your ALO counselor will handle university selection, documents, application, and visa."
          className="border-2 border-[var(--alo-brand)]/15 bg-gradient-to-br from-[var(--alo-brand-light)]/60 to-white"
        >
          <div className="space-y-4">
            <Disclaimer text="Tuition, scholarships, deadlines, and entry requirements shown on this page are indicative. Always confirm with your ALO counselor before applying." />
            <PublicLeadForm
              sourceTag="Courses listing page"
              title="Apply for your chosen course"
              subtitle="One form — counselor assigned within 24 hours."
            />
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
export default PublicCourses;
