"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icon, StatCard, SectionCard, EmptyState, LoadingGrid, PageHeader } from "@/components/alo/shared";
import { Breadcrumb } from "@/components/alo/public-shared";
import { PublicLeadForm } from "@/components/alo/public-lead-form";
import { fmtDate, type ViewKey } from "@/lib/alo-types";

interface PublicUniversitiesProps {
  onNavigate: (v: ViewKey, slug?: string) => void;
}

interface UniCountry {
  name: string;
  shortName: string;
  flag: string;
}

interface UniversityListItem {
  slug: string;
  name: string;
  countrySlug: string;
  city: string;
  overview: string;
  strengths: string;
  quickFacts: string;
  tuition: string;
  sourceUrl?: string | null;
  lastVerifiedAt?: string | null;
  verificationStatus?: string;
  country: UniCountry;
}

function safeParse<T>(value: unknown, fallback: T): T {
  try {
    if (typeof value !== "string") return fallback;
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

const heroStyles = ["Strong research output", "Career-focused curriculum", "Top-ranked teaching", "Modern facilities"];

export function PublicUniversities({ onNavigate }: PublicUniversitiesProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [universities, setUniversities] = React.useState<UniversityListItem[]>([]);
  const [countryFilter, setCountryFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [courseCount, setCourseCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [uniRes, courseRes] = await Promise.all([
          fetch("/api/universities", { cache: "no-store" }),
          fetch("/api/courses", { cache: "no-store" }),
        ]);
        const uniData = await uniRes.json();
        const courseData = await courseRes.json();
        if (!cancelled && Array.isArray(uniData.universities)) {
          setUniversities(uniData.universities);
        }
        if (!cancelled && Array.isArray(courseData.courses)) {
          setCourseCount(courseData.courses.length);
        }
      } catch {
        if (!cancelled) {
          toast({ title: "Failed to load universities", description: "Please retry in a moment.", variant: "destructive" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  // Derive unique countries (slug + label) from the fetched data
  const countries = React.useMemo(() => {
    const map = new Map<string, UniCountry>();
    universities.forEach((u) => {
      if (!map.has(u.countrySlug)) map.set(u.countrySlug, { ...u.country, name: u.country.name, shortName: u.country.shortName, flag: u.country.flag });
    });
    return Array.from(map.entries()).map(([slug, c]) => ({ slug, ...c }));
  }, [universities]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return universities.filter((u) => {
      if (countryFilter !== "all" && u.countrySlug !== countryFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.country.name.toLowerCase().includes(q) ||
        u.overview.toLowerCase().includes(q)
      );
    });
  }, [universities, countryFilter, search]);

  const countryCount = countries.length;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-6 lg:py-8">
      <Breadcrumb
        items={[
          { label: "Home", onClick: () => onNavigate("public-home") },
          { label: "Universities" },
        ]}
      />

      <div className="mt-4">
        <PageHeader
          icon="Building2"
          title="Universities"
          subtitle="Explore partner universities across 13 countries with verified courses, tuition, and entry requirements."
        />
      </div>

      {/* Stats strip */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Universities" value={loading ? "—" : universities.length} icon="Building2" accent="blue" hint="ALO partner network" />
        <StatCard label="Countries" value={loading ? "—" : countryCount} icon="Globe" accent="orange" hint="Across 4 continents" />
        <StatCard label="Courses listed" value={loading ? "—" : courseCount} icon="BookOpen" accent="emerald" hint="Verified by counselors" />
        <StatCard label="Avg. scholarship" value="£2,000–5,000" icon="Award" accent="violet" hint="Merit awards available" />
      </div>

      {/* Filters */}
      <Card className="mt-6 rounded-2xl border-2 border-[#0B5ED7]/15">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Country</label>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="mt-1 h-10 w-full">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-[2]">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search by name, city, or keyword</label>
            <div className="relative mt-1">
              <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. Manchester, Greenwich, TU Munich..."
                className="h-10 pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Clear search"
                >
                  <Icon name="X" className="size-4" />
                </button>
              )}
            </div>
          </div>
          {(countryFilter !== "all" || search) && (
            <Button
              variant="outline"
              className="h-10 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb]"
              onClick={() => { setCountryFilter("all"); setSearch(""); }}
            >
              <Icon name="RotateCcw" className="size-4" /> Reset
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {universities.length} universities
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mt-4"><LoadingGrid count={6} /></div>
      ) : filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon="Building2"
            title="No universities match your filters"
            description="Try a different country or search term — or browse all courses instead."
            action={
              <div className="flex gap-2">
                <Button
                  className="bg-[#F97316] text-white hover:bg-[#F97316]/90 h-10"
                  onClick={() => { setCountryFilter("all"); setSearch(""); }}
                >
                  <Icon name="RotateCcw" className="size-4" /> Reset filters
                </Button>
                <Button
                  variant="outline"
                  className="border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb] h-10"
                  onClick={() => onNavigate("public-courses")}
                >
                  <Icon name="BookOpen" className="size-4" /> Browse courses
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => {
            const strengths = safeParse<string[]>(u.strengths, []);
            const quickFacts = safeParse<{ intakes?: string[]; tuitionRange?: string; englishTests?: string[]; scholarship?: string; applicationStatus?: string }>(u.quickFacts, {});
            const tuition = safeParse<{ ug?: string; pg?: string; mba?: string; deposit?: string; scholarship?: string; paymentPlan?: string }>(u.tuition, {});
            const hasScholarship = Boolean(quickFacts.scholarship || tuition.scholarship);

            return (
              <Card key={u.slug} className="flex flex-col rounded-2xl border-2 border-[#0B5ED7]/15 transition-all hover:border-[#0B5ED7]/40 hover:shadow-md">
                <CardContent className="flex flex-1 flex-col pt-5">
                  {/* Header: name + flag */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-base font-bold text-[#0B5ED7]">{u.name}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="text-base leading-none">{u.country.flag}</span>
                        <span className="font-medium text-foreground">{u.country.name}</span>
                        <span aria-hidden>·</span>
                        <span>{u.city}</span>
                      </p>
                    </div>
                    {hasScholarship && (
                      <Badge className="shrink-0 bg-[#fdece4] text-[#F97316] hover:bg-[#fdece4]">
                        <Icon name="Award" className="mr-1 size-3" /> Scholarship
                      </Badge>
                    )}
                  </div>

                  {/* Overview */}
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{u.overview}</p>

                  {/* Strengths chips */}
                  {strengths.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {strengths.slice(0, 3).map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fb] px-2 py-0.5 text-[11px] font-medium text-[#0B5ED7]">
                          <Icon name="Check" className="size-3" />
                          <span className="line-clamp-1 max-w-[180px]">{s}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick facts */}
                  <div className="mt-4 space-y-2 rounded-xl bg-[#f7f9fc] p-3 text-xs">
                    <div className="flex items-start gap-2">
                      <Icon name="Wallet" className="mt-0.5 size-3.5 shrink-0 text-[#0B5ED7]" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-muted-foreground">Tuition range</p>
                        <p className="font-medium text-foreground">{quickFacts.tuitionRange || tuition.ug || "Confirm with counselor"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Icon name="Calendar" className="mt-0.5 size-3.5 shrink-0 text-[#0B5ED7]" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-muted-foreground">Intakes</p>
                        <p className="font-medium text-foreground">
                          {quickFacts.intakes && quickFacts.intakes.length > 0 ? quickFacts.intakes.join(", ") : "September (primary)"}
                        </p>
                      </div>
                    </div>
                    {quickFacts.englishTests && quickFacts.englishTests.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Icon name="Languages" className="mt-0.5 size-3.5 shrink-0 text-[#0B5ED7]" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-muted-foreground">English tests</p>
                          <p className="font-medium text-foreground">{quickFacts.englishTests.join(", ")}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer: verified date + buttons */}
                  <div className="mt-auto flex flex-col gap-3 pt-4">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Icon name="ShieldCheck" className="size-3 text-emerald-600" />
                      <span>Verified {u.lastVerifiedAt ? fmtDate(u.lastVerifiedAt) : "recently"}</span>
                      {quickFacts.applicationStatus && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500" /> {quickFacts.applicationStatus}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="flex-1 bg-[#F97316] text-white hover:bg-[#F97316]/90 h-10"
                        onClick={() => onNavigate("public-university", u.slug)}
                      >
                        <Icon name="ArrowRight" className="size-4" /> View University
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-[#0B5ED7]/30 text-[#0B5ED7] hover:bg-[#e8f0fb] h-10"
                        onClick={() => onNavigate("public-courses")}
                      >
                        <Icon name="BookOpen" className="size-4" /> View Courses
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <section id="apply" className="mt-12 scroll-mt-20">
        <SectionCard
          icon="Sparkles"
          title="Not sure which university fits you?"
          description="Tell us your goals, academic background, and budget — an ALO counselor will shortlist 3 universities in 24 hours."
          className="border-2 border-[#0B5ED7]/15 bg-gradient-to-br from-[#e8f0fb]/60 to-white"
        >
          <PublicLeadForm
            sourceTag="Universities listing page"
            title="Get a personalised university shortlist"
            subtitle="Submit once — your counselor handles the rest."
          />
        </SectionCard>
      </section>

      {/* Helpful links strip */}
      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-[#0B5ED7]/15 px-4 py-3 text-xs text-muted-foreground">
        <Icon name="Lightbulb" className="size-4 text-[#F97316]" />
        <span>Looking for something specific?</span>
        <button onClick={() => onNavigate("public-course-finder")} className="font-medium text-[#0B5ED7] hover:underline">
          Try the AI Course Finder →
        </button>
        <span className="hidden sm:inline" aria-hidden>·</span>
        <button onClick={() => onNavigate("public-destinations")} className="font-medium text-[#0B5ED7] hover:underline">
          Browse by destination →
        </button>
        <span className="hidden sm:inline" aria-hidden>·</span>
        <button onClick={() => onNavigate("public-exams")} className="font-medium text-[#0B5ED7] hover:underline">
          Free English mock tests →
        </button>
      </div>
    </div>
  );
}
export default PublicUniversities;
